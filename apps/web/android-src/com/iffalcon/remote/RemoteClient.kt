package com.iffalcon.remote

import java.io.InputStream
import java.net.SocketTimeoutException
import java.util.concurrent.atomic.AtomicBoolean
import javax.net.ssl.SSLSocket
import kotlin.concurrent.thread

internal class RemoteClient(
  private val context: android.content.Context,
  private val host: String,
  private val port: Int,
  private val cert: ClientCert,
  private val onReady: () -> Unit,
  private val onIme: (String?) -> Unit,
  private val onDropped: () -> Unit,
) {
  @Volatile private var socket: SSLSocket? = null
  @Volatile private var imeCounter = 0
  @Volatile private var fieldCounter = 0
  @Volatile private var typed = ""
  private val stopped = AtomicBoolean(false)

  fun start() {
    thread(name = "iffalcon-remote", isDaemon = false) { reconnectLoop() }
  }

  @Synchronized
  fun sendKey(command: String) {
    write(RemoteMessages.keyInject(KeyCodes.of(command)))
    if (command == "BACKSPACE") {
      typed = dropLastCodePoint(typed)
    } else if (command == "HOME" || command == "BACK") {
      typed = ""
    }
  }

  @Synchronized
  fun sendText(text: String) {
    if (text.isEmpty()) {
      return
    }
    val cursor = typed.codePointCount(0, typed.length)
    write(RemoteMessages.imeBatchEdit(imeCounter, fieldCounter, text, cursor))
    typed += text
  }

  @Synchronized
  fun launchApp(appLink: String) {
    write(RemoteMessages.appLinkLaunch(appLink))
  }

  fun stop() {
    stopped.set(true)
    resetTyped()
    socket?.close()
  }

  fun isRunning(): Boolean = !stopped.get()

  @Synchronized
  private fun resetTyped() {
    typed = ""
  }

  private fun write(bytes: ByteArray) {
    val sock = waitForSocket() ?: throw IllegalStateException("Not connected to the TV.")
    synchronized(sock) {
      sock.outputStream.write(bytes)
      sock.outputStream.flush()
    }
  }

  private fun waitForSocket(): SSLSocket? {
    repeat(20) {
      if (stopped.get()) {
        return null
      }
      val sock = socket
      if (sock != null && sock.isConnected && !sock.isClosed) {
        return sock
      }
      try {
        Thread.sleep(250)
      } catch (_: InterruptedException) {
        return null
      }
    }
    return socket
  }

  private fun reconnectLoop() {
    var delayMs = 0L
    var dropped = false
    while (!stopped.get()) {
      if (dropped) {
        onDropped()
        resetTyped()
      }
      if (delayMs > 0L) {
        try {
          Thread.sleep(delayMs)
        } catch (_: InterruptedException) {
          return
        }
      }
      if (stopped.get()) {
        return
      }
      try {
        val sock = TlsSockets.open(context, host, port, cert, readTimeoutMs = 0)
        socket = sock
        delayMs = 1_000L
        dropped = true
        readLoop(sock)
      } catch (_: Exception) {
        dropped = true
        delayMs = (delayMs.coerceAtLeast(1_000L) * 2).coerceAtMost(15_000L)
      }
    }
  }

  private fun readLoop(sock: SSLSocket) {
    try {
      val input: InputStream = sock.inputStream
      while (!stopped.get()) {
        val payload =
          try {
            readDelimited(input)
          } catch (_: SocketTimeoutException) {
            continue
          }
        val parsed = RemoteMessages.parse(payload)
        when (parsed.kind) {
          RemoteMessages.Kind.CONFIGURE -> {
            write(RemoteMessages.configure())
            onReady()
          }
          RemoteMessages.Kind.SET_ACTIVE -> write(RemoteMessages.setActive(622))
          RemoteMessages.Kind.PING -> write(RemoteMessages.pingResponse(parsed.ping))
          RemoteMessages.Kind.IME_INJECT -> onIme(parsed.appPackage)
          RemoteMessages.Kind.IME_SHOW -> {
            resetTyped()
            onIme(parsed.appPackage)
          }
          RemoteMessages.Kind.IME_BATCH -> {
            imeCounter = parsed.imeCounter
            fieldCounter = parsed.fieldCounter
          }
          RemoteMessages.Kind.ERROR -> Unit
          RemoteMessages.Kind.OTHER -> Unit
        }
      }
    } finally {
      sock.close()
      if (socket === sock) {
        socket = null
      }
    }
  }

  private fun dropLastCodePoint(value: String): String {
    if (value.isEmpty()) {
      return value
    }
    return value.substring(0, value.offsetByCodePoints(value.length, -1))
  }
}
