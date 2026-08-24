package com.iffalcon.remote

import java.io.ByteArrayOutputStream
import java.io.EOFException
import java.io.InputStream

internal class ProtoWriter {
  private val out = ByteArrayOutputStream()

  fun int32(field: Int, value: Int): ProtoWriter {
    tag(field, 0)
    varint(value.toLong() and 0xffffffffL)
    return this
  }

  fun bytes(field: Int, value: ByteArray): ProtoWriter {
    tag(field, 2)
    varint(value.size.toLong())
    out.write(value)
    return this
  }

  fun string(field: Int, value: String): ProtoWriter = bytes(field, value.toByteArray(Charsets.UTF_8))

  fun embedded(field: Int, value: ByteArray): ProtoWriter = bytes(field, value)

  fun toByteArray(): ByteArray = out.toByteArray()

  fun delimited(): ByteArray {
    val payload = toByteArray()
    val prefix = ByteArrayOutputStream()
    writeVarint(prefix, payload.size.toLong())
    prefix.write(payload)
    return prefix.toByteArray()
  }

  private fun tag(field: Int, wire: Int) {
    varint((field shl 3 or wire).toLong())
  }

  private fun varint(value: Long) {
    writeVarint(out, value)
  }
}

internal class ProtoReader(private val data: ByteArray) {
  private var pos = 0

  fun remaining(): Boolean = pos < data.size

  fun next(): Field {
    val tag = varint().toInt()
    val field = tag ushr 3
    val wire = tag and 7
    return when (wire) {
      0 -> Field.Varint(field, varint())
      2 -> {
        val length = varint().toInt()
        val start = pos
        pos += length
        if (pos > data.size) {
          throw EOFException("Truncated protobuf field")
        }
        Field.Bytes(field, data.copyOfRange(start, pos))
      }
      else -> throw IllegalStateException("Unsupported protobuf wire type $wire")
    }
  }

  private fun varint(): Long {
    var result = 0L
    var shift = 0
    while (true) {
      if (pos >= data.size) {
        throw EOFException("Truncated varint")
      }
      val byte = data[pos].toInt() and 0xff
      pos += 1
      result = result or ((byte and 0x7f).toLong() shl shift)
      if (byte and 0x80 == 0) {
        return result
      }
      shift += 7
    }
  }
}

internal sealed class Field(val number: Int) {
  class Varint(number: Int, val value: Long) : Field(number)

  class Bytes(number: Int, val value: ByteArray) : Field(number)
}

internal fun writeVarint(out: ByteArrayOutputStream, raw: Long) {
  var value = raw
  while (value and 0x7fL.inv() != 0L) {
    out.write(((value and 0x7fL) or 0x80L).toInt())
    value = value ushr 7
  }
  out.write((value and 0x7fL).toInt())
}

internal fun readDelimited(input: InputStream): ByteArray {
  val length = readVarint(input)
  val payload = ByteArray(length)
  var read = 0
  while (read < length) {
    val n = input.read(payload, read, length - read)
    if (n < 0) {
      throw EOFException("Truncated protobuf message")
    }
    read += n
  }
  return payload
}

private fun readVarint(input: InputStream): Int {
  var result = 0
  var shift = 0
  while (true) {
    val byte = input.read()
    if (byte < 0) {
      throw EOFException("Closed while reading length")
    }
    result = result or ((byte and 0x7f) shl shift)
    if (byte and 0x80 == 0) {
      return result
    }
    shift += 7
  }
}
