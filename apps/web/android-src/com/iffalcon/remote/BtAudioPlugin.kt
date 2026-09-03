package com.iffalcon.remote

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Intent
import android.database.ContentObserver
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.audiofx.AudioEffect
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.KeyEvent
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

/**
 * Remote for the Bluetooth speaker the phone is already playing to. Android gives apps no way to
 * open an A2DP connection, so this only ever attaches to the current output route and hands the
 * user off to system settings when nothing is connected.
 *
 * Tone control is deliberately absent. Equalizer and BassBoost attach to the phone's primary output
 * mix, which is bypassed when audio leaves over A2DP, so the effects construct fine and then do
 * nothing. The phone's own equalizer sits deeper in the pipeline and does survive the hop, so
 * [openSystemEqualizer] hands the user there instead.
 */
@CapacitorPlugin(
  name = "BtAudio",
  permissions =
    [Permission(alias = "bluetooth", strings = [Manifest.permission.BLUETOOTH_CONNECT])],
)
class BtAudioPlugin : Plugin() {
  private lateinit var audio: AudioManager
  private val handler = Handler(Looper.getMainLooper())

  private var volumeBeforeMute: Int? = null
  private var deviceCallback: AudioDeviceCallback? = null
  private var volumeObserver: ContentObserver? = null

  override fun load() {
    audio = context.getSystemService(AudioManager::class.java)
    watchForChanges()
  }

  override fun handleOnDestroy() {
    deviceCallback?.let { audio.unregisterAudioDeviceCallback(it) }
    volumeObserver?.let { context.contentResolver.unregisterContentObserver(it) }
    deviceCallback = null
    volumeObserver = null
  }

  @PluginMethod
  fun getState(call: PluginCall) {
    call.resolve(state())
  }

  @PluginMethod
  fun requestBluetoothName(call: PluginCall) {
    if (Build.VERSION.SDK_INT < 31 || getPermissionState("bluetooth") == PermissionState.GRANTED) {
      call.resolve(state())
      return
    }
    requestPermissionForAlias("bluetooth", call, "onBluetoothPermission")
  }

  @PermissionCallback
  fun onBluetoothPermission(call: PluginCall) {
    call.resolve(state())
  }

  @PluginMethod
  fun setVolume(call: PluginCall) {
    val level = call.getInt("level")
    if (level == null) {
      call.reject("Missing volume level.")
      return
    }
    val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    audio.setStreamVolume(AudioManager.STREAM_MUSIC, level.coerceIn(0, max), 0)
    call.resolve(state())
  }

  @PluginMethod
  fun adjustVolume(call: PluginCall) {
    val direction =
      when (call.getString("direction")) {
        "up" -> AudioManager.ADJUST_RAISE
        "down" -> AudioManager.ADJUST_LOWER
        else -> null
      }
    if (direction == null) {
      call.reject("Direction must be up or down.")
      return
    }
    audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, 0)
    call.resolve(state())
  }

  /**
   * Drops the stream to zero instead of using ADJUST_MUTE. Absolute volume forwards a level of 0
   * to the speaker over AVRCP, while a stream mute flag often never leaves the phone.
   */
  @PluginMethod
  fun setMuted(call: PluginCall) {
    if (call.getBoolean("muted") == true) {
      val current = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
      if (current > 0) {
        volumeBeforeMute = current
      }
      audio.setStreamVolume(AudioManager.STREAM_MUSIC, 0, 0)
    } else {
      val restore =
        volumeBeforeMute
          ?: (audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC) / 4).coerceAtLeast(1)
      volumeBeforeMute = null
      audio.setStreamVolume(AudioManager.STREAM_MUSIC, restore, 0)
    }
    call.resolve(state())
  }

  @PluginMethod
  fun mediaKey(call: PluginCall) {
    val code =
      when (call.getString("key")) {
        "next" -> KeyEvent.KEYCODE_MEDIA_NEXT
        "previous" -> KeyEvent.KEYCODE_MEDIA_PREVIOUS
        else -> null
      }
    if (code == null) {
      call.reject("Key must be next or previous.")
      return
    }
    audio.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, code))
    audio.dispatchMediaKeyEvent(KeyEvent(KeyEvent.ACTION_UP, code))
    call.resolve()
  }

  /**
   * Tries the real effect panel first and the sound settings screen second. Launching is attempted
   * rather than pre-checked, because package visibility can hide a target that still starts fine.
   */
  @PluginMethod
  fun openSystemEqualizer(call: PluginCall) {
    for (intent in listOf(effectPanelIntent(), soundSettingsIntent())) {
      try {
        context.startActivity(intent)
        call.resolve()
        return
      } catch (error: ActivityNotFoundException) {
        continue
      }
    }
    call.reject("No equalizer on this phone. Use the one inside your music app.")
  }

  @PluginMethod
  fun openBluetoothSettings(call: PluginCall) {
    context.startActivity(
      Intent(Settings.ACTION_BLUETOOTH_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
    )
    call.resolve()
  }

  private fun state(): JSObject {
    val speaker = connectedSpeaker()
    val volume = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
    if (volume > 0) {
      // The hardware keys or another app turned it back up, so the mute is over.
      volumeBeforeMute = null
    }
    val data = JSObject()
    data.put("connected", speaker != null)
    data.put("deviceName", speakerName(speaker))
    data.put("volume", volume)
    data.put("maxVolume", audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC))
    data.put("muted", volumeBeforeMute != null || audio.isStreamMute(AudioManager.STREAM_MUSIC))
    data.put("toneTarget", toneTarget())
    return data
  }

  private fun effectPanelIntent(): Intent =
    Intent(AudioEffect.ACTION_DISPLAY_AUDIO_EFFECT_CONTROL_PANEL)
      .putExtra(AudioEffect.EXTRA_PACKAGE_NAME, context.packageName)
      .putExtra(AudioEffect.EXTRA_CONTENT_TYPE, AudioEffect.CONTENT_TYPE_MUSIC)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  private fun soundSettingsIntent(): Intent =
    Intent(Settings.ACTION_SOUND_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  /** "effects" when a real equalizer answers, "sound" for the settings fallback, null for neither. */
  private fun toneTarget(): String? =
    when {
      canResolve(effectPanelIntent()) -> "effects"
      canResolve(soundSettingsIntent()) -> "sound"
      else -> null
    }

  private fun canResolve(intent: Intent): Boolean =
    intent.resolveActivity(context.packageManager) != null

  private fun connectedSpeaker(): AudioDeviceInfo? =
    audio.getDevices(AudioManager.GET_DEVICES_OUTPUTS).firstOrNull { device ->
      device.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ||
        (Build.VERSION.SDK_INT >= 31 &&
          (device.type == AudioDeviceInfo.TYPE_BLE_SPEAKER ||
            device.type == AudioDeviceInfo.TYPE_BLE_HEADSET))
    }

  /** Android 12 redacts the product name until the user grants BLUETOOTH_CONNECT. */
  private fun speakerName(device: AudioDeviceInfo?): String? {
    if (device == null) return null
    if (Build.VERSION.SDK_INT >= 31 && getPermissionState("bluetooth") != PermissionState.GRANTED) {
      return null
    }
    return device.productName?.toString()?.takeIf { it.isNotBlank() }
  }

  private fun watchForChanges() {
    val devices =
      object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) = emitState()

        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) = emitState()
      }
    audio.registerAudioDeviceCallback(devices, handler)
    deviceCallback = devices

    val volume =
      object : ContentObserver(handler) {
        override fun onChange(selfChange: Boolean) = emitState()
      }
    context.contentResolver.registerContentObserver(Settings.System.CONTENT_URI, true, volume)
    volumeObserver = volume
  }

  private fun emitState() {
    notifyListeners("state", state())
  }
}
