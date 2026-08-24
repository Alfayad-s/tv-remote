package com.iffalcon.remote

import android.content.Context
import android.os.Handler
import android.os.Looper
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

internal class TvController(private val context: Context, private val emit: (String) -> Unit) {
  private val store = CredentialStore(context)
  private val discovery = TvDiscovery(context)
  private val executor = Executors.newSingleThreadExecutor()
  private val main = Handler(Looper.getMainLooper())
  @Volatile private var pairing: PairingClient? = null
  @Volatile private var remote: RemoteClient? = null
  @Volatile private var device: org.json.JSONObject? = null
  @Volatile private var state: String = "DISCONNECTED"

  fun discover() {
    executor.execute {
      val tvs =
        discovery.scan().map { tv ->
          ProtocolJson.device(
            id = "androidtv:${tv.host}",
            name = tv.name,
            host = tv.host,
            port = tv.port,
            source = "mdns",
            connected = false,
          )
        }
      emitOnMain(ProtocolJson.tvList(tvs))
    }
  }

  fun connect(host: String, id: String?, port: Int?) {
    executor.execute {
      try {
        disconnectLocked(emitDisconnected = false)
        val tvId = id ?: "androidtv:$host"
        val remotePort = if (port == null || port == 0 || port == 6467) 6466 else port
        device =
          ProtocolJson.device(tvId, "iFFALCON TV", host, remotePort, "manual", false)
        pushState("CONNECTING", device)
        val existing = store.load(host)
        if (existing != null) {
          if (startRemote(host, remotePort, existing)) {
            return@execute
          }
          store.clear(host)
        }
        pairThenConnect(host, remotePort)
      } catch (error: Exception) {
        val pinMismatch = error.message?.contains("code", ignoreCase = true) == true
        val code = if (pinMismatch) "INVALID_PIN" else "CONNECTION_FAILED"
        val message =
          if (pinMismatch) {
            error.message ?: "That code does not match the TV."
          } else {
            "Could not reach the TV. Join the same Wi‑Fi as the TV (not guest or VPN), turn off mobile data if needed, then try again. Type the TV IP if it is missing from the list."
          }
        emitOnMain(ProtocolJson.error(code, message))
        pushState("ERROR", device)
      }
    }
  }

  fun submitPin(pin: String) {
    pairing?.submitPin(pin)
      ?: emitOnMain(ProtocolJson.error("INVALID_MESSAGE", "The TV is not waiting for a PIN."))
  }

  fun sendKey(command: String) {
    executor.execute {
      try {
        remote?.sendKey(command) ?: throw IllegalStateException("Connect the TV first.")
        emitOnMain(ProtocolJson.commandAck(command))
        emitOnMain(ProtocolJson.tvEvent("COMMAND_SENT", device, command))
        if (command == "HOME") {
          emitOnMain(ProtocolJson.ime(false))
        }
      } catch (error: Exception) {
        emitOnMain(ProtocolJson.error("INTERNAL_ERROR", error.message ?: "Command failed."))
      }
    }
  }

  fun sendText(text: String) {
    if (text.isEmpty()) {
      return
    }
    executor.execute {
      try {
        remote?.sendText(text) ?: throw IllegalStateException("Connect the TV first.")
      } catch (error: Exception) {
        emitOnMain(ProtocolJson.error("INTERNAL_ERROR", error.message ?: "Could not send text."))
      }
    }
  }

  fun launchApp(appLink: String) {
    if (appLink.isBlank()) {
      return
    }
    executor.execute {
      try {
        val client = remote ?: throw IllegalStateException("Connect the TV first.")
        client.launchApp(appLink)
      } catch (error: Exception) {
        emitOnMain(ProtocolJson.error("INTERNAL_ERROR", error.message ?: "Could not open the app."))
      }
    }
  }

  fun disconnect() {
    executor.execute { disconnectLocked() }
  }

  fun snapshot(done: (String) -> Unit) {
    executor.execute { done(ProtocolJson.connectionState(state, device)) }
  }

  private fun pushState(next: String, tv: org.json.JSONObject? = device) {
    state = next
    if (tv != null) {
      device = tv
    }
    emitOnMain(ProtocolJson.connectionState(next, device))
  }

  private fun emitOnMain(json: String) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      emit(json)
      return
    }
    main.post { emit(json) }
  }

  private fun pairThenConnect(host: String, remotePort: Int) {
    val cert = store.load(host) ?: ClientCertificates.generate()
    val client = PairingClient(context, host, 6467, cert)
    pairing = client
    pushState("PAIRING", device)
    client.run { pushState("PAIRING", device) }
    store.save(host, cert)
    pairing = null
    if (!startRemote(host, remotePort, cert)) {
      throw IllegalStateException("Paired, but the TV remote session did not start.")
    }
  }

  private fun startRemote(host: String, port: Int, cert: ClientCert): Boolean {
    val ready = CountDownLatch(1)
    val client =
      RemoteClient(
        context = context,
        host = host,
        port = port,
        cert = cert,
        onReady = {
          device = device?.put("connected", true)
          pushState("CONNECTED", device)
          emitOnMain(ProtocolJson.tvEvent("CONNECTED", device))
          ready.countDown()
        },
        onIme = { pkg -> emitOnMain(ProtocolJson.ime(pkg != null)) },
        onDropped = {
          pushState("RECONNECTING", device?.put("connected", false))
        },
      )
    remote = client
    client.start()
    val ok = ready.await(20, TimeUnit.SECONDS)
    if (!ok) {
      client.stop()
      remote = null
    }
    return ok
  }

  private fun disconnectLocked(emitDisconnected: Boolean = true) {
    pairing?.close()
    pairing = null
    remote?.stop()
    remote = null
    device = device?.put("connected", false)
    if (emitDisconnected) {
      pushState("DISCONNECTED", device)
    }
  }
}
