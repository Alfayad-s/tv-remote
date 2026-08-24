package com.iffalcon.remote

import android.content.Context
import java.io.ByteArrayInputStream
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import javax.net.ssl.KeyManagerFactory
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLSocket
import javax.net.ssl.X509TrustManager

internal object TlsSockets {
  private const val CONNECT_TIMEOUT_MS = 8_000
  private const val HANDSHAKE_TIMEOUT_MS = 15_000

  fun open(
    context: Context,
    host: String,
    port: Int,
    cert: ClientCert,
    readTimeoutMs: Int = 0,
  ): SSLSocket {
    val keyStore = KeyStore.getInstance("PKCS12").apply { load(null) }
    keyStore.setKeyEntry("client", cert.privateKey, charArrayOf(), arrayOf(platformCert(cert.certificate)))
    val keys = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
    keys.init(keyStore, charArrayOf())
    val sslContext = SSLContext.getInstance("TLS")
    sslContext.init(keys.keyManagers, arrayOf(TrustAll), SecureRandom())

    val tcp = WifiBinder.connectTcp(context, host, port, CONNECT_TIMEOUT_MS)
    tcp.soTimeout = HANDSHAKE_TIMEOUT_MS
    val socket =
      try {
        sslContext.socketFactory.createSocket(tcp, host, port, true) as SSLSocket
      } catch (error: Exception) {
        tcp.close()
        throw error
      }
    socket.useClientMode = true
    socket.tcpNoDelay = true
    socket.keepAlive = true
    val tls12 = socket.supportedProtocols.filter { it == "TLSv1.2" || it == "TLSv1.3" }
    if (tls12.isNotEmpty()) {
      socket.enabledProtocols = tls12.toTypedArray()
    }
    try {
      val params = socket.sslParameters
      params.endpointIdentificationAlgorithm = null
      socket.sslParameters = params
    } catch (_: Exception) {
    }
    socket.soTimeout = HANDSHAKE_TIMEOUT_MS
    socket.startHandshake()
    socket.soTimeout = readTimeoutMs
    return socket
  }

  private fun platformCert(certificate: X509Certificate): X509Certificate {
    return CertificateFactory.getInstance("X.509")
      .generateCertificate(ByteArrayInputStream(certificate.encoded)) as X509Certificate
  }
}

private object TrustAll : X509TrustManager {
  override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}

  override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}

  override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
}
