package com.iffalcon.remote

internal object KeyCodes {
  fun of(command: String): Int =
    when (command) {
      "POWER" -> 26
      "HOME" -> 3
      "BACK" -> 4
      "UP" -> 19
      "DOWN" -> 20
      "LEFT" -> 21
      "RIGHT" -> 22
      "OK" -> 23
      "VOLUME_UP" -> 24
      "VOLUME_DOWN" -> 25
      "MUTE" -> 164
      "PLAY_PAUSE" -> 85
      "PREVIOUS" -> 88
      "NEXT" -> 87
      "REWIND" -> 89
      "FAST_FORWARD" -> 90
      "CHANNEL_UP" -> 166
      "CHANNEL_DOWN" -> 167
      "BACKSPACE" -> 67
      "ENTER" -> 66
      else -> throw IllegalArgumentException("Unknown command $command")
    }
}
