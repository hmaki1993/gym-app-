package com.antigravity.gymlog;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import android.provider.Settings;
import android.os.Build;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Color;
import android.graphics.RectF;
import java.util.Calendar;
import java.util.Set;
import java.util.HashSet;
import java.text.SimpleDateFormat;
import java.util.Locale;

public class GymWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WIDGET_CLICK = "com.antigravity.gymlog.WIDGET_CLICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Read data from Capacitor Preferences
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String widgetStateJson = prefs.getString("widget_state", "{}");

        String title = "GymLog";
        String subtitle = "No active workout";
        String actionText = "Tap to open";

        Bitmap heatmapBitmap = null;
        boolean hasActiveSession = false;

        try {
            JSONObject state = new JSONObject(widgetStateJson);
            if (state.has("isActive") && state.getBoolean("isActive")) {
                hasActiveSession = true;
                title = state.optString("activeExercise", "Workout Active");
                int sets = state.optInt("completedSets", 0);
                subtitle = "Completed Sets: " + sets;
                actionText = "Tap to open overlay";
            } else {
                if (state.has("isFinished") && state.getBoolean("isFinished")) {
                    title = "Workout Finished";
                    subtitle = "Check your history";
                } else {
                    title = "GymLog";
                    subtitle = "Ready to train?";
                }
                actionText = "Tap to open history";
                
                JSONArray datesArray = state.optJSONArray("historyDates");
                if (datesArray == null) datesArray = new JSONArray();
                heatmapBitmap = createHeatmapBitmap(context, datesArray, state.optString("accentColor", "#00E676"));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_gym);
            views.setTextViewText(R.id.widget_title, title);
            views.setTextViewText(R.id.widget_subtitle, subtitle);
            views.setTextViewText(R.id.widget_action, actionText);

            if (heatmapBitmap != null) {
                views.setImageViewBitmap(R.id.widget_heatmap, heatmapBitmap);
                views.setViewVisibility(R.id.widget_heatmap, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_title, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_subtitle, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_action, android.view.View.GONE);
                views.setViewVisibility(R.id.btn_open_app, android.view.View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_heatmap, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_title, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_subtitle, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_action, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.btn_open_app, android.view.View.VISIBLE);
            }

            PendingIntent pendingIntent;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
                Intent mainIntent = new Intent(context, MainActivity.class);
                mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                pendingIntent = PendingIntent.getActivity(
                        context, 0, mainIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
            } else {
                Intent launcherIntent = new Intent(context, TransparentLauncherActivity.class);
                launcherIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                launcherIntent.putExtra("mode", hasActiveSession ? "workout" : "history");
                pendingIntent = PendingIntent.getActivity(
                        context, 0, launcherIntent, 
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
            }
            
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

            // Set up Open App icon button
            Intent openAppIntent = new Intent(context, MainActivity.class);
            openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            PendingIntent openAppPendingIntent = PendingIntent.getActivity(
                    context, 1, openAppIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.btn_open_app, openAppPendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }

    private Bitmap createHeatmapBitmap(Context context, JSONArray datesArray, String accentColorHex) {
        int width = 800;
        int height = 880;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        SharedPreferences prefs = context.getSharedPreferences("GymLogPrefs", Context.MODE_PRIVATE);
        
        Set<String> activeDates = new HashSet<>();
        JSONObject activeMusclesObj = new JSONObject();
        String accentColor = accentColorHex;

        String stateJsonStr = prefs.getString("gymlog_state_v1", null);
        if (stateJsonStr != null) {
            try {
                JSONObject gymState = new JSONObject(stateJsonStr);
                
                // Extract accent color from settings
                JSONObject settings = gymState.optJSONObject("settings");
                if (settings != null) {
                    accentColor = settings.optString("accentColor", accentColor);
                }

                // Extract dates and muscles directly from logs
                JSONArray logs = gymState.optJSONArray("logs");
                if (logs != null) {
                    for (int i = 0; i < logs.length(); i++) {
                        JSONObject log = logs.getJSONObject(i);
                        String logDateRaw = log.optString("date", "");
                        if (!logDateRaw.isEmpty()) {
                            String logDate = logDateRaw.split("T")[0];
                            activeDates.add(logDate);
                            
                            JSONArray musclesArray = activeMusclesObj.optJSONArray(logDate);
                            if (musclesArray == null) {
                                musclesArray = new JSONArray();
                                activeMusclesObj.put(logDate, musclesArray);
                            }
                            
                            String logMuscleGroup = log.optString("muscleGroup", "");
                            if (!logMuscleGroup.isEmpty()) {
                                addUniqueString(musclesArray, logMuscleGroup);
                            }
                            
                            JSONArray exercises = log.optJSONArray("exercises");
                            if (exercises != null) {
                                for (int j = 0; j < exercises.length(); j++) {
                                    JSONObject ex = exercises.getJSONObject(j);
                                    String exMuscleGroup = ex.optString("muscleGroup", "");
                                    if (!exMuscleGroup.isEmpty()) {
                                        addUniqueString(musclesArray, exMuscleGroup);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Fallback to passed params if state JSON was not found or empty
        if (activeDates.isEmpty() && datesArray != null) {
            for (int i = 0; i < datesArray.length(); i++) {
                activeDates.add(datesArray.optString(i));
            }
        }
        if (activeMusclesObj.length() == 0) {
            String musclesJson = prefs.getString("gymlog_active_muscles", "{}");
            try {
                activeMusclesObj = new org.json.JSONObject(musclesJson);
            } catch (Exception e) {}
        }

        Paint textPaint = new Paint();
        textPaint.setAntiAlias(true);
        textPaint.setTextAlign(Paint.Align.CENTER);
        
        Paint accentPaint = new Paint();
        accentPaint.setAntiAlias(true);
        try {
            accentPaint.setColor(Color.parseColor(accentColor));
        } catch (Exception e) {
            accentPaint.setColor(Color.parseColor("#00E676"));
        }
        
        // Background container like HistoryPage (#f8f9fa)
        Paint containerPaint = new Paint();
        containerPaint.setAntiAlias(true);
        containerPaint.setColor(Color.parseColor("#f8f9fa")); 
        
        Calendar cal = Calendar.getInstance();
        int currentMonth = cal.get(Calendar.MONTH);
        int currentYear = cal.get(Calendar.YEAR);
        
        SimpleDateFormat monthSdf = new SimpleDateFormat("MMMM yyyy", Locale.US);
        String monthName = monthSdf.format(cal.getTime()).toUpperCase();
        
        // Draw Main Container
        float padding = 0f;
        float innerPadding = 20f;
        RectF containerRect = new RectF(padding, padding, width - padding, height - padding);
        canvas.drawRoundRect(containerRect, 60f, 60f, containerPaint);

        // Draw Month Title
        textPaint.setColor(Color.parseColor("#333333"));
        textPaint.setTextSize(48f);
        textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        textPaint.setLetterSpacing(0.1f);
        canvas.drawText(monthName, width / 2f, 80f, textPaint);

        // Draw Weekday Headers
        String[] weekdays = {"SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"};
        textPaint.setTextSize(26f);
        textPaint.setColor(Color.parseColor("#888888"));
        textPaint.setLetterSpacing(0f);
        
        float startY = 160f;
        float cols = 7f;
        float availableWidth = width - (innerPadding * 2);
        float cellWidth = availableWidth / cols;
        float cellHeight = cellWidth;
        
        for (int i = 0; i < 7; i++) {
            float x = innerPadding + (i * cellWidth) + (cellWidth / 2f);
            canvas.drawText(weekdays[i], x, startY, textPaint);
        }

        // Draw Calendar Grid
        cal.set(Calendar.DAY_OF_MONTH, 1);
        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        int startOffset = (firstDayOfWeek == Calendar.SATURDAY) ? 0 : firstDayOfWeek;
        int daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
        
        float gridStartY = startY + 40f;
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        String todayStr = sdf.format(new java.util.Date());
        
        Paint dayBgPaint = new Paint();
        dayBgPaint.setAntiAlias(true);
        Paint dayBorderPaint = new Paint();
        dayBorderPaint.setAntiAlias(true);
        dayBorderPaint.setStyle(Paint.Style.STROKE);
        
        for (int day = 1; day <= daysInMonth; day++) {
            cal.set(Calendar.DAY_OF_MONTH, day);
            String dateStr = sdf.format(cal.getTime());
            boolean worked = activeDates.contains(dateStr);
            boolean isToday = dateStr.equals(todayStr);
            
            JSONArray musclesArray = activeMusclesObj.optJSONArray(dateStr);
            int musclesCount = (musclesArray != null) ? musclesArray.length() : 0;
            
            int position = startOffset + day - 1;
            int col = position % 7;
            int row = position / 7;
            
            float x = innerPadding + (col * cellWidth);
            float y = gridStartY + (row * cellHeight);
            
            RectF rect = new RectF(x + 6, y + 6, x + cellWidth - 6, y + cellHeight - 6);
            
            // Draw box
            if (worked) {
                dayBgPaint.setColor(Color.parseColor("#e9ecef"));
                dayBorderPaint.setColor(Color.parseColor("#d0d0d0"));
                dayBorderPaint.setStrokeWidth(2f);
            } else {
                dayBgPaint.setColor(Color.parseColor("#ffffff"));
                dayBorderPaint.setColor(Color.parseColor("#f0f0f0"));
                dayBorderPaint.setStrokeWidth(2f);
            }
            
            canvas.drawRoundRect(rect, 30f, 30f, dayBgPaint);
            if (isToday) {
                dayBorderPaint.setColor(Color.parseColor("#FF9800")); // orange for today
                dayBorderPaint.setStrokeWidth(4f);
            }
            canvas.drawRoundRect(rect, 30f, 30f, dayBorderPaint);
            
            // Draw Day Number
            if (worked) {
                textPaint.setColor(Color.parseColor("#555555"));
                textPaint.setTextSize(26f);
                canvas.drawText(String.valueOf(day), x + 24f, y + 36f, textPaint);
            } else {
                textPaint.setColor(Color.parseColor("#aaaaaa"));
                textPaint.setTextSize(36f);
                canvas.drawText(String.valueOf(day), x + (cellWidth / 2f), y + (cellHeight / 2f) + 12f, textPaint);
            }
            
            // Draw Muscle Dots if worked (exactly like HistoryPage)
            if (worked && musclesCount > 0) {
                float dotRadius = 5f;
                float dotPadding = 4f;
                int dotMaxCols = 3;
                
                int dotCols = Math.min(musclesCount, dotMaxCols);
                float dotsTotalWidth = dotCols * (dotRadius * 2 + dotPadding) - dotPadding;
                float dotStartX = x + (cellWidth / 2f) - (dotsTotalWidth / 2f) + dotRadius;
                float dotStartY = y + (cellHeight / 2f) + 16f;
                
                for (int m = 0; m < musclesCount; m++) {
                    int dotRow = m / dotMaxCols;
                    int dotCol = m % dotMaxCols;
                    
                    float dotX = dotStartX + (dotCol * (dotRadius * 2 + dotPadding));
                    float dotY = dotStartY + (dotRow * (dotRadius * 2 + dotPadding));
                    
                    canvas.drawCircle(dotX, dotY, dotRadius, accentPaint);
                }
            }
        }

        return bitmap;
    }

    private void addUniqueString(JSONArray array, String value) {
        for (int i = 0; i < array.length(); i++) {
            if (value.equals(array.optString(i))) {
                return;
            }
        }
        array.put(value);
    }
}
