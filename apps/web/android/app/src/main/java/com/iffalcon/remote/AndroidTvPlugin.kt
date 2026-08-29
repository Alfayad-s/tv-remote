package com.iffalcon.remote

import android.Manifest
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
  name = "AndroidTv",
  permissions =
    [
      Permission(alias = "nearbyWifi", strings = [Manifest.permission.NEARBY_WIFI_DEVICES]),
      Permission(
        alias = "location",
        strings =
          [
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
          ],
      ),
    ],
)
class AndroidTvPlugin : Plugin() {
  private lateinit var controller: TvController

  override fun load() {
    controller =
      TvRuntime.attach(context) { json ->
        val data = JSObject()
        data.put("json", json)
        notifyListeners("message", data)
      }
  }

  @PluginMethod
  fun ready(call: PluginCall) {
    controller.resumeWantedSession()
    call.resolve()
  }

  @PluginMethod
  fun requestLocalNetwork(call: PluginCall) {
    if (Build.VERSION.SDK_INT < 23) {
      call.resolve(granted(true))
      return
    }
    val alias = localNetworkAlias()
    if (getPermissionState(alias) == PermissionState.GRANTED) {
      call.resolve(granted(true))
      return
    }
    requestPermissionForAlias(alias, call, "onLocalNetworkPermission")
  }

  @PermissionCallback
  fun onLocalNetworkPermission(call: PluginCall) {
    val grantedNow = getPermissionState(localNetworkAlias()) == PermissionState.GRANTED
    call.resolve(granted(grantedNow))
  }

  @PluginMethod
  fun getState(call: PluginCall) {
    controller.snapshot { json ->
      val data = JSObject()
      data.put("json", json)
      call.resolve(data)
    }
  }

  @PluginMethod
  fun discover(call: PluginCall) {
    controller.discover()
    call.resolve()
  }

  @PluginMethod
  fun connect(call: PluginCall) {
    val host = call.getString("host")
    if (host.isNullOrBlank()) {
      call.reject("Enter the TV IP address.")
      return
    }
    controller.connect(host, call.getString("id"), call.getInt("port"))
    call.resolve()
  }

  @PluginMethod
  fun disconnect(call: PluginCall) {
    controller.disconnect()
    call.resolve()
  }

  @PluginMethod
  fun reset(call: PluginCall) {
    controller.reset()
    call.resolve()
  }

  @PluginMethod
  fun submitPin(call: PluginCall) {
    val pin = call.getString("pin")
    if (pin.isNullOrBlank()) {
      call.reject("Enter the code shown on the TV.")
      return
    }
    controller.submitPin(pin)
    call.resolve()
  }

  @PluginMethod
  fun sendKey(call: PluginCall) {
    val command = call.getString("command")
    if (command.isNullOrBlank()) {
      call.reject("Missing command.")
      return
    }
    controller.sendKey(command)
    call.resolve()
  }

  @PluginMethod
  fun sendText(call: PluginCall) {
    val text = call.getString("text") ?: ""
    controller.sendText(text)
    call.resolve()
  }

  @PluginMethod
  fun launchApp(call: PluginCall) {
    val appLink = call.getString("appLink")
    if (appLink.isNullOrBlank()) {
      call.reject("Missing app.")
      return
    }
    controller.launchApp(appLink)
    call.resolve()
  }

  private fun localNetworkAlias(): String =
    if (Build.VERSION.SDK_INT >= 33) "nearbyWifi" else "location"

  private fun granted(value: Boolean): JSObject {
    val data = JSObject()
    data.put("granted", value)
    return data
  }
}
