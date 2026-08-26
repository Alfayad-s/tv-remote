package com.iffalcon.remote

import android.content.Context

internal object SessionPrefs {
  private const val FILE = "tv_session"
  private const val WANTED = "wanted"
  private const val HOST = "host"
  private const val PORT = "port"
  private const val ID = "id"

  fun save(context: Context, host: String, port: Int, id: String) {
    context.applicationContext
      .getSharedPreferences(FILE, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(WANTED, true)
      .putString(HOST, host)
      .putInt(PORT, port)
      .putString(ID, id)
      .apply()
  }

  fun clear(context: Context) {
    context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().clear().apply()
  }

  fun wanted(context: Context): Boolean {
    return context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE).getBoolean(WANTED, false)
  }

  fun host(context: Context): String? {
    return context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE).getString(HOST, null)
  }

  fun port(context: Context): Int {
    return context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE).getInt(PORT, 6466)
  }

  fun id(context: Context): String? {
    return context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE).getString(ID, null)
  }
}
