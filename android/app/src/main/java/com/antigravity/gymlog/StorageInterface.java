package com.antigravity.gymlog;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public class StorageInterface {
    private Context context;
    private SharedPreferences prefs;

    public StorageInterface(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences("GymLogPrefs", Context.MODE_PRIVATE);
    }

    @JavascriptInterface
    public String getItem(String key) {
        return prefs.getString(key, null);
    }

    @JavascriptInterface
    public void setItem(String key, String value) {
        prefs.edit().putString(key, value).apply();
        // Only send SYNC_STATE for the main data key to prevent sync loops
        boolean sendSync = "gymlog_state_v1".equals(key);
        triggerWidgetUpdate(sendSync);
    }

    @JavascriptInterface
    public void setWidgetState(String value) {
        try {
            SharedPreferences capacitorPrefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            capacitorPrefs.edit().putString("widget_state", value).apply();
            triggerWidgetUpdate(false);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @JavascriptInterface
    public void removeItem(String key) {
        prefs.edit().remove(key).apply();
        triggerWidgetUpdate(!"gymlog_active_session".equals(key));
    }

    private void triggerWidgetUpdate(boolean sendSync) {
        try {
            android.appwidget.AppWidgetManager appWidgetManager = android.appwidget.AppWidgetManager.getInstance(context);
            int[] ids = appWidgetManager.getAppWidgetIds(new android.content.ComponentName(context, GymWidgetProvider.class));

            // Call onUpdate directly to ensure instant updates (bypassing OS delay/throttling)
            GymWidgetProvider provider = new GymWidgetProvider();
            provider.onUpdate(context, appWidgetManager, ids);

            android.content.Intent intent = new android.content.Intent(context, GymWidgetProvider.class);
            intent.setAction(android.appwidget.AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(android.appwidget.AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(intent);

            if (sendSync) {
                android.content.Intent syncIntent = new android.content.Intent("com.antigravity.gymlog.SYNC_STATE");
                context.sendBroadcast(syncIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
