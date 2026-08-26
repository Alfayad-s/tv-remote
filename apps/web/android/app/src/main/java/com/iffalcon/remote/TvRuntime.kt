package com.iffalcon.remote

import android.content.Context

internal object TvRuntime {
  @Volatile private var controller: TvController? = null

  @Synchronized
  fun attach(context: Context, emit: (String) -> Unit): TvController {
    val existing = controller
    if (existing != null) {
      existing.setEmit(emit)
      return existing
    }
    val created = TvController(context.applicationContext, emit)
    controller = created
    return created
  }

  fun get(): TvController? = controller
}
