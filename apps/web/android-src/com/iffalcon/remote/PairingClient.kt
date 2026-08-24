package com.iffalcon.remote

import java.security.MessageDigest
import java.security.cert.X509Certificate
import java.security.interfaces.RSAPublicKey
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import javax.net.ssl.SSLSocket

internal class PairingClient(
  private val context: android.content.Context,
  private val host: String,
  private val port: Int,
  private val cert: ClientCert,
) {
  private val pinLatch = CountDownLatch(1)
  @Volatile private var pin: String? = null
  @Volatile private var socket: SSLSocket? = null

  fun submitPin(code: String) {
    pin = code.trim().uppercase().replace("0X", "")
    pinLatch.countDown()
  }

  fun run(onSecret: () -> Unit) {
    val sock = TlsSockets.open(context, host, port, cert, readTimeoutMs = 60_000)
    socket = sock
    sock.soTimeout = 60_000
    val output = sock.outputStream
    val input = sock.inputStream
    output.write(PairingMessages.request("iFFALCON Remote", "iFFALCON Remote"))
    output.flush()

    while (true) {
      val payload = readDelimited(input)
      when (PairingMessages.kind(payload)) {
        PairingMessages.Kind.REQUEST_ACK -> {
          output.write(PairingMessages.option())
          output.flush()
        }
        PairingMessages.Kind.OPTION -> {
          output.write(PairingMessages.configuration())
          output.flush()
        }
        PairingMessages.Kind.CONFIG_ACK -> {
          onSecret()
          sock.soTimeout = 0
          if (!pinLatch.await(5, TimeUnit.MINUTES)) {
            throw IllegalStateException("Timed out waiting for the TV PIN.")
          }
          sock.soTimeout = 60_000
          val code = pin ?: throw IllegalStateException("Missing PIN.")
          val digest = pairingDigest(sock, cert.certificate, code)
          output.write(PairingMessages.secret(digest))
          output.flush()
        }
        PairingMessages.Kind.SECRET_ACK -> {
          sock.close()
          return
        }
        PairingMessages.Kind.UNKNOWN -> Unit
      }
    }
  }

  fun close() {
    pinLatch.countDown()
    socket?.close()
  }
}

internal fun pairingDigest(socket: SSLSocket, clientCert: X509Certificate, pin: String): ByteArray {
  val pinBytes = hexToBytes(pin)
  if (pinBytes.isEmpty()) {
    throw IllegalArgumentException("PIN must be hexadecimal.")
  }
  val session = socket.session
  val serverCert = session.peerCertificates[0] as X509Certificate
  val sha = MessageDigest.getInstance("SHA-256")
  sha.update(rsaModulus(clientCert))
  sha.update(rsaExponent(clientCert))
  sha.update(rsaModulus(serverCert))
  sha.update(rsaExponent(serverCert))
  if (pinBytes.size > 1) {
    sha.update(pinBytes, 1, pinBytes.size - 1)
  }
  val digest = sha.digest()
  if (digest[0] != pinBytes[0]) {
    throw IllegalArgumentException("That code does not match the TV.")
  }
  return digest
}

private fun rsaModulus(cert: X509Certificate): ByteArray {
  val key = cert.publicKey as RSAPublicKey
  return unsigned(key.modulus.toByteArray())
}

private fun rsaExponent(cert: X509Certificate): ByteArray {
  val key = cert.publicKey as RSAPublicKey
  return unsigned(key.publicExponent.toByteArray())
}

private fun unsigned(bytes: ByteArray): ByteArray {
  if (bytes.size > 1 && bytes[0] == 0.toByte()) {
    return bytes.copyOfRange(1, bytes.size)
  }
  return bytes
}

private fun hexToBytes(value: String): ByteArray {
  val hex = if (value.length % 2 == 0) value else "0$value"
  return ByteArray(hex.length / 2) { index ->
    hex.substring(index * 2, index * 2 + 2).toInt(16).toByte()
  }
}
