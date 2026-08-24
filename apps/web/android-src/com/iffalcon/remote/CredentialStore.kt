package com.iffalcon.remote

import android.content.Context
import android.util.Base64
import org.json.JSONObject
import java.io.File
import java.security.KeyFactory
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.security.spec.PKCS8EncodedKeySpec

internal class CredentialStore(context: Context) {
  private val dir = File(context.filesDir, "tv-credentials").apply { mkdirs() }

  fun load(host: String): ClientCert? {
    val file = fileFor(host)
    if (!file.exists()) {
      return null
    }
    return try {
      val json = JSONObject(file.readText())
      val certPem = json.getString("certPem")
      val keyPem = json.getString("keyPem")
      val certificate =
        x509Factory().generateCertificate(certPem.byteInputStream()) as X509Certificate
      val keyBytes = decodePem(keyPem, "PRIVATE KEY")
      val privateKey = KeyFactory.getInstance("RSA").generatePrivate(PKCS8EncodedKeySpec(keyBytes))
      ClientCert(certificate, privateKey)
    } catch (_: Exception) {
      null
    }
  }

  fun save(host: String, cert: ClientCert) {
    val json =
      JSONObject()
        .put("host", host)
        .put("certPem", pem("CERTIFICATE", cert.certificate.encoded))
        .put("keyPem", pem("PRIVATE KEY", cert.privateKey.encoded))
    fileFor(host).writeText(json.toString())
  }

  fun clear(host: String) {
    fileFor(host).delete()
  }

  private fun fileFor(host: String): File {
    val safe = host.replace(Regex("[^A-Za-z0-9._-]"), "_")
    return File(dir, "$safe.json")
  }

  private fun pem(type: String, der: ByteArray): String {
    val body = Base64.encodeToString(der, Base64.DEFAULT).trim()
    return "-----BEGIN $type-----\n$body\n-----END $type-----\n"
  }

  private fun decodePem(pem: String, type: String): ByteArray {
    val body =
      pem
        .replace("-----BEGIN $type-----", "")
        .replace("-----END $type-----", "")
        .replace("\\s".toRegex(), "")
    return Base64.decode(body, Base64.DEFAULT)
  }
}

private fun x509Factory(): CertificateFactory {
  return try {
    CertificateFactory.getInstance("X.509", "AndroidOpenSSL")
  } catch (_: Exception) {
    CertificateFactory.getInstance("X.509")
  }
}
