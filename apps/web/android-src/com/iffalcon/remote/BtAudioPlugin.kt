package com.iffalcon.remote

import android.Manifest
import android.content.Intent
import android.database.ContentObserver
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
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
 */
@CapacitorPlugin(
  name = "BtAudio",
  permissions =
    [Permission(alias = "bluetooth", strings = [Manifest.permission.BLUETOOTH_CONNECT])],
)
class BtAudioPlugin : Plugin() {
  private lateinit var audio: AudioManager
  private val handler = Handler(Looper.getMainLooper())

  private var equalizer: Equalizer? = null
  private var bassBoost: BassBoost? = null
  private var bassBands: List<Short> = emptyList()
  private var trebleBands: List<Short> = emptyList()
  private var minBandLevel: Short = 0
  private var maxBandLevel: Short = 0
  private var bass = FLAT
  private var treble = FLAT

  private var deviceCallback: AudioDeviceCallback? = null
  private var volumeObserver: ContentObserver? = null

  override fun load() {
    audio = context.getSystemService(AudioManager::class.java)
    createEffects()
    watchForChanges()
  }

  override fun handleOnDestroy() {
    deviceCallback?.let { audio.unregisterAudioDeviceCallback(it) }
    volumeObserver?.let { context.contentResolver.unregisterContentObserver(it) }
    deviceCallback = null
    volumeObserver = null
    equalizer?.release()
    bassBoost?.release()
    equalizer = null
    bassBoost = null
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

  @PluginMethod
  fun setMuted(call: PluginCall) {
    val muted = call.getBoolean("muted") ?: false
    val direction = if (muted) AudioManager.ADJUST_MUTE else AudioManager.ADJUST_UNMUTE
    audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, 0)
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

  @PluginMethod
  fun setBass(call: PluginCall) {
    val level = call.getInt("level")
    if (level == null) {
      call.reject("Missing bass level.")
      return
    }
    bass = level.coerceIn(0, 100)
    val strength = if (bass <= FLAT) 0 else (bass - FLAT) * 20
    bassBoost?.let { effect -> runCatching { effect.setStrength(strength.toShort()) } }
    applyBands(bassBands, bass)
    call.resolve(state())
  }

  @PluginMethod
  fun setTreble(call: PluginCall) {
    val level = call.getInt("level")
    if (level == null) {
      call.reject("Missing treble level.")
      return
    }
    treble = level.coerceIn(0, 100)
    applyBands(trebleBands, treble)
    call.resolve(state())
  }

  @PluginMethod
  fun openSystemEqualizer(call: PluginCall) {
    val intent =
      Intent(AudioEffect.ACTION_DISPLAY_AUDIO_EFFECT_CONTROL_PANEL)
        .putExtra(AudioEffect.EXTRA_PACKAGE_NAME, context.packageName)
        .putExtra(AudioEffect.EXTRA_CONTENT_TYPE, AudioEffect.CONTENT_TYPE_MUSIC)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    if (intent.resolveActivity(context.packageManager) == null) {
      call.reject("This phone has no equalizer app.")
      return
    }
    context.startActivity(intent)
    call.resolve()
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
    val data = JSObject()
    data.put("connected", speaker != null)
    data.put("deviceName", speakerName(speaker))
    data.put("volume", audio.getStreamVolume(AudioManager.STREAM_MUSIC))
    data.put("maxVolume", audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC))
    data.put("muted", audio.isStreamMute(AudioManager.STREAM_MUSIC))
    data.put("bass", bass)
    data.put("treble", treble)
    data.put("bassSupported", bassBoost != null || bassBands.isNotEmpty())
    data.put("trebleSupported", trebleBands.isNotEmpty())
    return data
  }

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

  private fun createEffects() {
    equalizer = runCatching { Equalizer(0, 0).apply { enabled = true } }.getOrNull()
    equalizer?.let { effect ->
      runCatching {
        val range = effect.bandLevelRange
        minBandLevel = range[0]
        maxBandLevel = range[1]
        val count = effect.numberOfBands.toInt()
        val span = maxOf(1, count / 3)
        bassBands = (0 until span).map { it.toShort() }
        trebleBands = ((count - span) until count).map { it.toShort() }
      }
    }
    bassBoost = runCatching { BassBoost(0, 0).apply { enabled = true } }.getOrNull()
  }

  private fun applyBands(bands: List<Short>, level: Int) {
    val effect = equalizer ?: return
    val offset =
      if (level >= FLAT) {
        (level - FLAT) / FLAT.toFloat() * maxBandLevel
      } else {
        (FLAT - level) / FLAT.toFloat() * minBandLevel
      }
    for (band in bands) {
      runCatching { effect.setBandLevel(band, offset.toInt().toShort()) }
    }
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

  private companion object {
    /** Midpoint of the 0-100 bass and treble sliders, where no gain is applied. */
    const val FLAT = 50
  }
}
