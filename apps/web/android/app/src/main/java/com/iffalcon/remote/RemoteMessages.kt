package com.iffalcon.remote

internal object RemoteMessages {
  fun configure(): ByteArray {
    val info =
      ProtoWriter()
        .string(1, "iFFALCON Remote")
        .string(2, "iFFALCON")
        .int32(3, 1)
        .string(4, "1")
        .string(5, "com.iffalcon.remote")
        .string(6, "1.0.0")
        .toByteArray()
    val inner = ProtoWriter().int32(1, 622).embedded(2, info).toByteArray()
    return ProtoWriter().embedded(1, inner).delimited()
  }

  fun setActive(active: Int): ByteArray {
    val inner = ProtoWriter().int32(1, active).toByteArray()
    return ProtoWriter().embedded(2, inner).delimited()
  }

  fun pingResponse(value: Int): ByteArray {
    val inner = ProtoWriter().int32(1, value).toByteArray()
    return ProtoWriter().embedded(9, inner).delimited()
  }

  fun keyInject(keyCode: Int, direction: Int = 3): ByteArray {
    val inner = ProtoWriter().int32(1, keyCode).int32(2, direction).toByteArray()
    return ProtoWriter().embedded(10, inner).delimited()
  }

  fun appLinkLaunch(appLink: String): ByteArray {
    val inner = ProtoWriter().string(1, appLink).toByteArray()
    return ProtoWriter().embedded(90, inner).delimited()
  }

  fun imeBatchEdit(imeCounter: Int, fieldCounter: Int, text: String, cursor: Int): ByteArray {
    val status =
      ProtoWriter()
        .int32(1, cursor)
        .int32(2, cursor)
        .string(3, text)
        .toByteArray()
    val edit = ProtoWriter().int32(1, 1).embedded(2, status).toByteArray()
    val inner =
      ProtoWriter()
        .int32(1, imeCounter)
        .int32(2, fieldCounter)
        .embedded(3, edit)
        .toByteArray()
    return ProtoWriter().embedded(21, inner).delimited()
  }

  fun parse(payload: ByteArray): Parsed {
    val reader = ProtoReader(payload)
    var kind = Kind.OTHER
    var ping = 0
    var appPackage: String? = null
    var imeCounter = 0
    var fieldCounter = 0
    while (reader.remaining()) {
      when (val field = reader.next()) {
        is Field.Bytes ->
          when (field.number) {
            1 -> kind = Kind.CONFIGURE
            2 -> kind = Kind.SET_ACTIVE
            8 -> {
              kind = Kind.PING
              ping = firstVarint(field.value, 1)
            }
            20 -> {
              kind = Kind.IME_INJECT
              appPackage = appPackageOf(field.value)
            }
            21 -> {
              kind = Kind.IME_BATCH
              val inner = ProtoReader(field.value)
              while (inner.remaining()) {
                when (val nested = inner.next()) {
                  is Field.Varint ->
                    when (nested.number) {
                      1 -> imeCounter = nested.value.toInt()
                      2 -> fieldCounter = nested.value.toInt()
                    }
                  else -> Unit
                }
              }
            }
            22 -> {
              kind = Kind.IME_SHOW
              appPackage = "ime"
            }
            3 -> kind = Kind.ERROR
            else -> Unit
          }
        else -> Unit
      }
    }
    return Parsed(kind, ping, appPackage, imeCounter, fieldCounter)
  }

  private fun firstVarint(payload: ByteArray, field: Int): Int {
    val reader = ProtoReader(payload)
    while (reader.remaining()) {
      val next = reader.next()
      if (next is Field.Varint && next.number == field) {
        return next.value.toInt()
      }
    }
    return 0
  }

  private fun appPackageOf(payload: ByteArray): String? {
    val reader = ProtoReader(payload)
    while (reader.remaining()) {
      val next = reader.next()
      if (next is Field.Bytes && next.number == 1) {
        val info = ProtoReader(next.value)
        while (info.remaining()) {
          val field = info.next()
          if (field is Field.Bytes && field.number == 12) {
            return String(field.value, Charsets.UTF_8)
          }
        }
      }
    }
    return null
  }

  data class Parsed(
    val kind: Kind,
    val ping: Int,
    val appPackage: String?,
    val imeCounter: Int,
    val fieldCounter: Int,
  )

  enum class Kind {
    CONFIGURE,
    SET_ACTIVE,
    PING,
    IME_INJECT,
    IME_SHOW,
    IME_BATCH,
    ERROR,
    OTHER,
  }
}
