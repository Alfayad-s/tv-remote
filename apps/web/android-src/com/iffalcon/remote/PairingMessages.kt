package com.iffalcon.remote

internal object PairingMessages {
  fun request(serviceName: String, clientName: String): ByteArray {
    val inner =
      ProtoWriter()
        .string(1, serviceName)
        .string(2, clientName)
        .toByteArray()
    return envelope { it.embedded(10, inner) }
  }

  fun option(): ByteArray {
    val encoding = ProtoWriter().int32(1, 3).int32(2, 6).toByteArray()
    val inner = ProtoWriter().embedded(1, encoding).int32(3, 1).toByteArray()
    return envelope { it.embedded(20, inner) }
  }

  fun configuration(): ByteArray {
    val encoding = ProtoWriter().int32(1, 3).int32(2, 6).toByteArray()
    val inner = ProtoWriter().embedded(1, encoding).int32(2, 1).toByteArray()
    return envelope { it.embedded(30, inner) }
  }

  fun secret(digest: ByteArray): ByteArray {
    val inner = ProtoWriter().bytes(1, digest).toByteArray()
    return envelope { it.embedded(40, inner) }
  }

  fun kind(payload: ByteArray): Kind {
    val reader = ProtoReader(payload)
    var status = 0
    var kind = Kind.UNKNOWN
    while (reader.remaining()) {
      when (val field = reader.next()) {
        is Field.Varint -> if (field.number == 2) status = field.value.toInt()
        is Field.Bytes ->
          kind =
            when (field.number) {
              11 -> Kind.REQUEST_ACK
              20 -> Kind.OPTION
              31 -> Kind.CONFIG_ACK
              41 -> Kind.SECRET_ACK
              else -> kind
            }
      }
    }
    if (status != 0 && status != 200) {
      throw IllegalStateException("Pairing status $status")
    }
    return kind
  }

  private fun envelope(write: (ProtoWriter) -> Unit): ByteArray {
    val writer = ProtoWriter().int32(1, 2).int32(2, 200)
    write(writer)
    return writer.delimited()
  }

  enum class Kind {
    UNKNOWN,
    REQUEST_ACK,
    OPTION,
    CONFIG_ACK,
    SECRET_ACK,
  }
}
