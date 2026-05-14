package com.antigravity.gymlog;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebStorage;
import android.webkit.WebView;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Force clear WebView cache and storage for assets
        // Note: This does NOT delete localStorage where your workouts are kept
        WebView webView = new WebView(this);
        webView.clearCache(true);
    }
}
