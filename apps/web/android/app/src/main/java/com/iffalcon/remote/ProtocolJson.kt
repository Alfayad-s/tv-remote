package com.iffalcon.remote

import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal object ProtocolJson {
  fun connectionState(state: String, tv: JSONObject?): String =
    envelope(
      "CONNECTION_STATE",
      JSONObject().put("state", state).put("tv", tv ?: JSONObject.NULL),
    )

  fun tvList(devices: List<JSONObject>): String {
    val array = JSONArray()
    devices.forEach { array.put(it) }
    return envelope("TV_LIST", JSONObject().put("devices", array))
  }

  fun tvEvent(event: String, tv: JSONObject?, command: String? = null): String {
    val payload = JSONObject().put("event", event).put("tv", tv ?: JSONObject.NULL)
    if (command != null) {
      payload.put("command", command)
    }
    return envelope("TV_EVENT", payload)
  }

  fun commandAck(command: String): String =
    envelope("COMMAND_ACK", JSONObject().put("command", command).put("success", true))

  fun ime(active: Boolean): String = envelope("IME_STATE", JSONObject().put("active", active))

  fun error(code: String, message: String): String =
    envelope("ERROR", JSONObject().put("code", code).put("message", message))

  fun device(id: String, name: String, host: String, port: Int, source: String, connected: Boolean): JSONObject =
    JSONObject()
      .put("id", id)
      .put("name", name)
      .put("host", host)
      .put("port", port)
      .put("brand", "iFFALCON")
      .put("connected", connected)
      .put("source", source)

  private fun envelope(type: String, payload: JSONObject): String =
    JSONObject()
      .put("id", UUID.randomUUID().toString())
      .put("type", type)
      .put("payload", payload)
      .toString()
}
