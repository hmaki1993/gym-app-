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
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

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
    }
}
