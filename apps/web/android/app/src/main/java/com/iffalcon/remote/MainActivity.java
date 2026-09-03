package com.iffalcon.remote;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(AndroidTvPlugin.class);
    registerPlugin(BtAudioPlugin.class);
    super.onCreate(savedInstanceState);
    getOnBackPressedDispatcher()
        .addCallback(
            this,
            new OnBackPressedCallback(true) {
              @Override
              public void handleOnBackPressed() {
                if (getBridge() != null
                    && getBridge().getWebView() != null
                    && getBridge().getWebView().canGoBack()) {
                  getBridge().getWebView().goBack();
                  return;
                }
                moveTaskToBack(true);
              }
            });
  }
}
