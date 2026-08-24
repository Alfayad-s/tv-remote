package com.iffalcon.remote;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(AndroidTvPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
