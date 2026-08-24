package com.iffalcon.remote

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import java.net.Inet4Address
import java.net.InetAddress
import java.util.ArrayDeque
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

internal data class DiscoveredTv(val name: String, val host: String, val port: Int, val type: String)

internal class TvDiscovery(private val context: Context) {
  private val nsd = context.getSystemService(Context.NSD_SERVICE) as NsdManager
  private val main = Handler(Looper.getMainLooper())

  fun scan(timeoutMs: Long = 4_000): List<DiscoveredTv> {
    val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    val multicast =
      wifi.createMulticastLock("iffalcon-mdns").apply {
        setReferenceCounted(false)
        acquire()
      }
    val found = LinkedHashMap<String, DiscoveredTv>()
    val lock = Any()
    val pending = ArrayDeque<NsdServiceInfo>()
    var resolving = false
    val types = listOf("_androidtvremote2._tcp.", "_androidtvremote._tcp.")
    val listeners = mutableListOf<NsdManager.DiscoveryListener>()

    fun record(resolved: NsdServiceInfo) {
      val host = preferredHost(resolved) ?: return
      synchronized(lock) {
        found[host] =
          DiscoveredTv(
            name = resolved.serviceName.ifBlank { "iFFALCON TV" },
            host = host,
            port = if (resolved.port > 0) resolved.port else 6466,
            type = resolved.serviceType?.trimEnd('.') ?: "_androidtvremote2._tcp",
          )
      }
    }

    fun resolveNext() {
      val next: NsdServiceInfo?
      synchronized(lock) {
        next = pending.pollFirst()
        if (next == null) {
          resolving = false
          return
        }
      }
      try {
        nsd.resolveService(
          next,
          object : NsdManager.ResolveListener {
            override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
              main.post { resolveNext() }
            }

            override fun onServiceResolved(resolved: NsdServiceInfo) {
              record(resolved)
              main.post { resolveNext() }
            }
          },
        )
      } catch (_: Exception) {
        main.post { resolveNext() }
      }
    }

    fun enqueue(info: NsdServiceInfo) {
      val start: Boolean
      synchronized(lock) {
        pending.add(info)
        start = !resolving
        resolving = true
      }
      if (start) {
        main.post { resolveNext() }
      }
    }

    val started = CountDownLatch(1)
    main.post {
      types.forEach { type ->
        val listener =
          object : NsdManager.DiscoveryListener {
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {}

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}

            override fun onDiscoveryStarted(serviceType: String) {}

            override fun onDiscoveryStopped(serviceType: String) {}

            override fun onServiceLost(serviceInfo: NsdServiceInfo) {}

            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
              enqueue(serviceInfo)
            }
          }
        listeners.add(listener)
        try {
          nsd.discoverServices(type, NsdManager.PROTOCOL_DNS_SD, listener)
        } catch (_: Exception) {
        }
      }
      started.countDown()
    }
    started.await(2, TimeUnit.SECONDS)
    try {
      CountDownLatch(1).await(timeoutMs, TimeUnit.MILLISECONDS)
    } finally {
      val stopped = CountDownLatch(1)
      main.post {
        listeners.forEach { listener ->
          try {
            nsd.stopServiceDiscovery(listener)
          } catch (_: Exception) {
          }
        }
        stopped.countDown()
      }
      stopped.await(2, TimeUnit.SECONDS)
      try {
        if (multicast.isHeld) {
          multicast.release()
        }
      } catch (_: Exception) {
      }
    }
    synchronized(lock) {
      return found.values.toList()
    }
  }
}

internal fun preferredHost(resolved: NsdServiceInfo): String? {
  val addresses = mutableListOf<InetAddress>()
  if (Build.VERSION.SDK_INT >= 34) {
    addresses += resolved.hostAddresses
  } else {
    @Suppress("DEPRECATION")
    resolved.host?.let { addresses += it }
  }
  addresses.filterIsInstance<Inet4Address>().firstOrNull()?.hostAddress?.let {
    return it
  }
  return addresses.firstOrNull()?.hostAddress?.substringBefore('%')
}
