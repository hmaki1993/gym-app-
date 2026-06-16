package com.antigravity.gymlog;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import android.view.animation.AnticipateInterpolator;
import android.view.animation.AccelerateInterpolator;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingWidgetPlugin.class);
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        
        // Inject shared storage interface immediately after Capacitor initializes WebView
        getBridge().getWebView().addJavascriptInterface(new StorageInterface(this), "AndroidStorage");

        // Remove exit animation to show app instantly (Rocket Launch Speed)
        splashScreen.setOnExitAnimationListener(splashScreenViewProvider -> {
            splashScreenViewProvider.remove();
        });

        android.content.IntentFilter filter = new android.content.IntentFilter("com.antigravity.gymlog.SYNC_STATE");
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(syncReceiver, filter, android.content.Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(syncReceiver, filter);
        }
    }

    private android.content.BroadcastReceiver syncReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(android.content.Context context, android.content.Intent intent) {
            if ("com.antigravity.gymlog.SYNC_STATE".equals(intent.getAction())) {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new Event('gymlog_sync'));", null);
                }
            }
        }
    };

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(syncReceiver);
        } catch (Exception e) {}
    }
}
