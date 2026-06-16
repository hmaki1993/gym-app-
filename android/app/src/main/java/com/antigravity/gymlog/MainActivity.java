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

        // Customize splash screen exit animation (Rocket Launch Effect)
        splashScreen.setOnExitAnimationListener(splashScreenViewProvider -> {
            final android.view.View splashScreenView = splashScreenViewProvider.getView();
            final android.view.View iconView = splashScreenViewProvider.getIconView();

            // Background slide up & fade out (Instant Majestic Rocket Launch)
            splashScreenView.animate()
                .alpha(0f)
                .translationY(-splashScreenView.getHeight() * 0.25f)
                .setDuration(400)
                .setInterpolator(new AnticipateInterpolator(1.2f))
                .withEndAction(splashScreenViewProvider::remove)
                .start();

            // Icon shoots up like a rocket, scales up, and fades out
            if (iconView != null) {
                iconView.animate()
                    .scaleX(2.2f)
                    .scaleY(2.2f)
                    .alpha(0f)
                    .translationY(-splashScreenView.getHeight() * 0.7f)
                    .setDuration(400)
                    .setInterpolator(new AccelerateInterpolator())
                    .start();
            }
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
