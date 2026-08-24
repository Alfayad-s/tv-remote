package com.iffalcon.remote

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import java.net.InetSocketAddress
import java.net.Socket

internal object WifiBinder {
  fun network(context: Context): Network? {
    val cm =
      context.applicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val wifi =
      cm.allNetworks.firstOrNull { candidate ->
        val caps = cm.getNetworkCapabilities(candidate) ?: return@firstOrNull false
        caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
      }
    if (wifi != null) {
      return wifi
    }
    val active = cm.activeNetwork ?: return null
    val caps = cm.getNetworkCapabilities(active) ?: return null
    return if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) active else null
  }

  fun connectTcp(context: Context, host: String, port: Int, timeoutMs: Int): Socket {
    val address = InetSocketAddress(host, port)
    val wifi = network(context)
    if (wifi != null) {
      try {
        val socket = wifi.socketFactory.createSocket()
        socket.tcpNoDelay = true
        socket.connect(address, timeoutMs)
        return socket
      } catch (_: Exception) {
      }
    }
    val socket = Socket()
    socket.tcpNoDelay = true
    socket.connect(address, timeoutMs)
    return socket
  }
}
