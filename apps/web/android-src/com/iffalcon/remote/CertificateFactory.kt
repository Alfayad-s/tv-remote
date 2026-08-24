package com.iffalcon.remote

import org.bouncycastle.asn1.x500.X500Name
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder
import org.bouncycastle.jce.provider.BouncyCastleProvider
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder
import java.io.ByteArrayInputStream
import java.math.BigInteger
import java.security.KeyPairGenerator
import java.security.SecureRandom
import java.security.cert.CertificateFactory
import java.security.cert.X509Certificate
import java.util.Calendar
import java.util.Date

internal data class ClientCert(val certificate: X509Certificate, val privateKey: java.security.PrivateKey)

internal object ClientCertificates {
  private val bc = BouncyCastleProvider()

  fun generate(): ClientCert {
    val keys = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.generateKeyPair()
    val now = Date()
    val notAfter = Calendar.getInstance().apply { add(Calendar.YEAR, 80) }.time
    val name = X500Name("CN=iFFALCON Remote")
    val builder =
      JcaX509v3CertificateBuilder(
        name,
        BigInteger(160, SecureRandom()),
        now,
        notAfter,
        name,
        keys.public,
      )
    val signer = JcaContentSignerBuilder("SHA256WithRSA").setProvider(bc).build(keys.private)
    val generated =
      JcaX509CertificateConverter().setProvider(bc).getCertificate(builder.build(signer))
    val certificate =
      CertificateFactory.getInstance("X.509")
        .generateCertificate(ByteArrayInputStream(generated.encoded)) as X509Certificate
    return ClientCert(certificate, keys.private)
  }
}
