package com.iffalcon.remote

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

class TvKeepAliveService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    try {
      startAsForeground()
    } catch (_: Exception) {
    }
    TvRuntime.get()?.let { controller ->
      if (intent == null || intent.getBooleanExtra(EXTRA_RESUME, true)) {
        controller.resumeWantedSession()
      }
    }
    return START_STICKY
  }

  private fun startAsForeground() {
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) {
      val channel =
        NotificationChannel(CHANNEL_ID, getString(R.string.tv_keepalive_channel), NotificationManager.IMPORTANCE_LOW)
      channel.setShowBadge(false)
      manager.createNotificationChannel(channel)
    }
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(): Notification {
    val launch =
      packageManager.getLaunchIntentForPackage(packageName)?.apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
      }
    val pending =
      PendingIntent.getActivity(
        this,
        0,
        launch,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    val builder =
      if (Build.VERSION.SDK_INT >= 26) {
        Notification.Builder(this, CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(this)
      }
    return builder
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentTitle(getString(R.string.tv_keepalive_title))
      .setContentText(getString(R.string.tv_keepalive_text))
      .setContentIntent(pending)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .build()
  }

  companion object {
    private const val CHANNEL_ID = "tv_keepalive"
    private const val NOTIFICATION_ID = 26
    private const val EXTRA_RESUME = "resume"

    fun start(context: Context) {
      val app = context.applicationContext
      val intent = Intent(app, TvKeepAliveService::class.java).putExtra(EXTRA_RESUME, false)
      try {
        if (Build.VERSION.SDK_INT >= 26) {
          app.startForegroundService(intent)
        } else {
          app.startService(intent)
        }
      } catch (_: Exception) {
        // Notification permission or OEM limits must not crash the UI.
      }
    }

    fun stop(context: Context) {
      context.applicationContext.stopService(Intent(context.applicationContext, TvKeepAliveService::class.java))
    }
  }
}
