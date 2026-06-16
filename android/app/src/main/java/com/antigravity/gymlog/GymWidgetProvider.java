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
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Color;
import android.graphics.RectF;
import android.graphics.DashPathEffect;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import java.io.InputStream;
import java.util.Calendar;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Iterator;
import java.text.SimpleDateFormat;
import java.util.Locale;

public class GymWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_WIDGET_CLICK = "com.antigravity.gymlog.WIDGET_CLICK";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // Read data from Capacitor Preferences
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String widgetStateJson = prefs.getString("widget_state", "{}");

        // Read language from main settings
        String lang = "en";
        SharedPreferences appPrefs = context.getSharedPreferences("GymLogPrefs", Context.MODE_PRIVATE);
        String stateJsonStr = appPrefs.getString("gymlog_state_v1", null);
        if (stateJsonStr != null) {
            try {
                JSONObject gymState = new JSONObject(stateJsonStr);
                JSONObject settings = gymState.optJSONObject("settings");
                if (settings != null) {
                    lang = settings.optString("language", "en");
                }
            } catch (Exception e) {}
        }
        boolean isAr = "ar".equals(lang);

        String title = "GymLog";
        String subtitle = isAr ? "لا توجد تمرينة نشطة" : "No active workout";
        String actionText = isAr ? "اضغط للفتح" : "Tap to open";
        String setsText = "";
        boolean isActive = false;
        String accentColor = "#E67E22"; // default orange
        Bitmap muscleIconBitmap = null;
        Bitmap dumbbellBmp = loadAssetBitmap(context, "assets/dumbbell-custom.png");

        Bitmap heatmapBitmap = null;
        boolean hasActiveSession = false;

        try {
            JSONObject state = new JSONObject(widgetStateJson);
            accentColor = state.optString("accentColor", "#E67E22");
            
            if (state.has("isActive") && state.getBoolean("isActive")) {
                hasActiveSession = true;
                isActive = true;
                
                String muscleKey = state.optString("muscleGroup", "");
                title = translateMuscle(muscleKey, lang);
                if (!isAr) {
                    title = title.toUpperCase();
                }
                
                // Load muscle icon bitmap
                String muscleIconName = muscleKey.toLowerCase(Locale.US);
                if ("arms".equals(muscleIconName)) {
                    muscleIconName = "biceps";
                }
                String assetPath = "assets/muscles/" + muscleIconName + ".png";
                muscleIconBitmap = loadAssetBitmap(context, assetPath);
                
                String activeExercise = state.optString("activeExercise", "");
                JSONObject loggedData = state.optJSONObject("loggedData");
                JSONArray activeExercises = state.optJSONArray("activeExercises");
                
                List<String> exerciseList = new ArrayList<>();
                if (activeExercises != null) {
                    for (int i = 0; i < activeExercises.length(); i++) {
                        String ex = activeExercises.optString(i, "");
                        if (!ex.isEmpty() && !exerciseList.contains(ex)) {
                            exerciseList.add(ex);
                        }
                    }
                }
                
                if (!activeExercise.isEmpty() && !exerciseList.contains(activeExercise)) {
                    exerciseList.add(activeExercise);
                }
                
                if (exerciseList.isEmpty() && loggedData != null) {
                    Iterator<String> keys = loggedData.keys();
                    while (keys.hasNext()) {
                        String key = keys.next();
                        if (!exerciseList.contains(key)) {
                            exerciseList.add(key);
                        }
                    }
                }
                
                StringBuilder htmlBuilder = new StringBuilder();
                String currentSuffix = isAr ? " (نشط)" : " (Current)";
                for (int i = 0; i < exerciseList.size(); i++) {
                    String exName = exerciseList.get(i);
                    boolean isCurrent = exName.equals(activeExercise);
                    int num = i + 1;
                    
                    if (isCurrent) {
                        htmlBuilder.append("<font color='").append(accentColor).append("'><b>").append(num).append(".</b></font> <b><font color='#FFFFFF'>").append(exName).append("</font></b> <font color='").append(accentColor).append("'><i>").append(currentSuffix).append("</i></font><br/>");
                    } else {
                        htmlBuilder.append("<font color='#888888'><b>").append(num).append(".</b></font> <b><font color='#AAAAAA'>").append(exName).append("</font></b><br/>");
                    }
                    
                    JSONArray setsArray = null;
                    if (loggedData != null) {
                        setsArray = loggedData.optJSONArray(exName);
                    }
                    
                    if (setsArray != null && setsArray.length() > 0) {
                        StringBuilder setsBuilder = new StringBuilder();
                        for (int j = 0; j < setsArray.length(); j++) {
                            JSONObject setObj = setsArray.optJSONObject(j);
                            if (setObj != null) {
                                double weight = setObj.optDouble("weight", 0);
                                int reps = setObj.optInt("reps", 0);
                                String unit = setObj.optString("unit", "kg");
                                
                                String weightStr;
                                if (weight == (long) weight) {
                                    weightStr = String.format(Locale.US, "%d", (long) weight);
                                } else {
                                    weightStr = String.format(Locale.US, "%.1f", weight);
                                }
                                
                                String displayUnit = unit;
                                if (isAr) {
                                    if ("kg".equalsIgnoreCase(unit)) displayUnit = "كجم";
                                    else if ("lbs".equalsIgnoreCase(unit)) displayUnit = "رطل";
                                }
                                
                                if (setsBuilder.length() > 0) {
                                    setsBuilder.append(" &nbsp; &nbsp; ");
                                }
                                
                                String badgeColor;
                                String weightColor;
                                String unitColor;
                                String xColor;
                                String repsColor;
                                
                                if (isCurrent) {
                                    badgeColor = accentColor;
                                    weightColor = "#FFFFFF";
                                    unitColor = "#B0B0B0";
                                    xColor = accentColor;
                                    repsColor = "#FFFFFF";
                                } else {
                                    badgeColor = "#666666";
                                    weightColor = "#AAAAAA";
                                    unitColor = "#777777";
                                    xColor = "#555555";
                                    repsColor = "#AAAAAA";
                                }
                                
                                String setNumPrefix = getCircledNumber(j + 1);
                                setsBuilder.append("<font color='").append(badgeColor).append("'>").append(setNumPrefix).append("</font>&nbsp;")
                                    .append("<font color='").append(weightColor).append("'><b>").append(weightStr).append("</b></font>")
                                    .append(" ")
                                    .append("<font color='").append(unitColor).append("'>").append(displayUnit).append("</font>")
                                    .append(" ")
                                    .append("<font color='").append(xColor).append("'>×</font>")
                                    .append(" ")
                                    .append("<font color='").append(repsColor).append("'><b>").append(reps).append("</b></font>");
                            }
                        }
                        htmlBuilder.append("&nbsp;&nbsp;").append(setsBuilder.toString());
                    } else {
                        String waitingText = isAr ? "في انتظار أول مجموعة..." : "Waiting for first set...";
                        htmlBuilder.append("&nbsp;&nbsp;<font color='#666666'><i>").append(waitingText).append("</i></font>");
                    }
                    
                    if (i < exerciseList.size() - 1) {
                        htmlBuilder.append("<br/>");
                    }
                }
                setsText = htmlBuilder.toString();
                actionText = isAr ? "اضغط لفتح الأوفرلاي" : "Tap to open overlay";
            } else {
                if (state.has("isFinished") && state.getBoolean("isFinished")) {
                    title = isAr ? "انتهى التمرين" : "Workout Finished";
                    subtitle = isAr ? "تفقد السجل الخاص بك" : "Check your history";
                } else {
                    title = "GymLog";
                    subtitle = isAr ? "جاهز للتمرين؟" : "Ready to train?";
                }
                actionText = isAr ? "اضغط لفتح السجل" : "Tap to open history";
                
                JSONArray datesArray = state.optJSONArray("historyDates");
                if (datesArray == null) datesArray = new JSONArray();
                heatmapBitmap = createHeatmapBitmap(context, datesArray, accentColor);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        int accentColorVal = 0xFFE67E22;
        try {
            accentColorVal = Color.parseColor(accentColor);
        } catch (Exception e) {
            // fallback
        }

        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_gym);
            
            if (dumbbellBmp != null) {
                views.setImageViewBitmap(R.id.btn_open_app, dumbbellBmp);
            }
            
            if (isActive) {
                // Active layout updates
                views.setViewVisibility(R.id.widget_active_layout, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_inactive_layout, android.view.View.GONE);
                
                views.setTextViewText(R.id.widget_active_title, title);
                views.setTextColor(R.id.widget_active_title, accentColorVal);
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    views.setTextViewText(R.id.widget_sets, android.text.Html.fromHtml(setsText, android.text.Html.FROM_HTML_MODE_LEGACY));
                } else {
                    views.setTextViewText(R.id.widget_sets, android.text.Html.fromHtml(setsText));
                }
                
                if (muscleIconBitmap != null) {
                    views.setImageViewBitmap(R.id.widget_muscle_icon, muscleIconBitmap);
                    views.setViewVisibility(R.id.widget_muscle_icon, android.view.View.VISIBLE);
                } else {
                    views.setViewVisibility(R.id.widget_muscle_icon, android.view.View.GONE);
                }
                
                views.setTextViewText(R.id.widget_active_action, actionText);
            } else {
                // Inactive layout updates
                views.setViewVisibility(R.id.widget_active_layout, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_inactive_layout, android.view.View.VISIBLE);
                
                views.setTextViewText(R.id.widget_title, title);
                views.setTextColor(R.id.widget_title, accentColorVal);
                views.setTextViewText(R.id.widget_subtitle, subtitle);
                views.setTextViewText(R.id.widget_action, actionText);
            }

            if (heatmapBitmap != null) {
                views.setImageViewBitmap(R.id.widget_heatmap, heatmapBitmap);
                views.setViewVisibility(R.id.widget_heatmap, android.view.View.VISIBLE);
                views.setViewVisibility(R.id.widget_active_layout, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_inactive_layout, android.view.View.GONE);
                views.setViewVisibility(R.id.btn_open_app, android.view.View.VISIBLE);
                views.setViewPadding(R.id.widget_inner_container, 0, 0, 0, 0);
                views.setInt(R.id.widget_inner_container, "setBackgroundResource", 0);
            } else {
                views.setViewVisibility(R.id.widget_heatmap, android.view.View.GONE);
                views.setViewVisibility(R.id.btn_open_app, android.view.View.VISIBLE);
                int paddingPx = (int) (12 * context.getResources().getDisplayMetrics().density);
                views.setViewPadding(R.id.widget_inner_container, paddingPx, paddingPx, paddingPx, paddingPx);
                views.setInt(R.id.widget_inner_container, "setBackgroundResource", R.drawable.widget_background);
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
                Intent serviceIntent = new Intent(context, GymFloatingService.class);
                serviceIntent.putExtra("mode", hasActiveSession ? "workout" : "history");
                serviceIntent.setAction(ACTION_WIDGET_CLICK);
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    pendingIntent = PendingIntent.getForegroundService(
                            context, 0, serviceIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                } else {
                    pendingIntent = PendingIntent.getService(
                            context, 0, serviceIntent,
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                }
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
        Calendar heightCal = Calendar.getInstance();
        heightCal.set(Calendar.DAY_OF_MONTH, 1);
        int heightFirstDayOfWeek = heightCal.get(Calendar.DAY_OF_WEEK);
        int heightStartOffset = getDayOffset(heightFirstDayOfWeek);
        int heightDaysInMonth = heightCal.getActualMaximum(Calendar.DAY_OF_MONTH);
        int heightTotalCells = heightStartOffset + heightDaysInMonth;
        int heightNumRows = (int) Math.ceil(heightTotalCells / 7.0);
        
        float heightCellWidth = (800f - 40f) / 7f; // innerPadding = 20f, width = 800
        float heightGridHeight = heightNumRows * heightCellWidth + 10f;
        float heightGridStartY = 280f; // startY (250f) + 30f
        int height = (int) (heightGridStartY + heightGridHeight + 40f); // 40f padding at bottom

        int width = 800;
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        SharedPreferences prefs = context.getSharedPreferences("GymLogPrefs", Context.MODE_PRIVATE);
        
        Set<String> activeDates = new HashSet<>();
        JSONObject activeMusclesObj = new JSONObject();
        String accentColor = accentColorHex;
        String themeMode = "system";

        String stateJsonStr = prefs.getString("gymlog_state_v1", null);
        if (stateJsonStr != null) {
            try {
                JSONObject gymState = new JSONObject(stateJsonStr);
                
                // Extract settings
                JSONObject settings = gymState.optJSONObject("settings");
                if (settings != null) {
                    accentColor = settings.optString("accentColor", accentColor);
                    themeMode = settings.optString("themeMode", "system");
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

        // Determine Theme Mode (Dark/Light)
        boolean isDarkMode = false;
        if ("dark".equals(themeMode)) {
            isDarkMode = true;
        } else if ("light".equals(themeMode)) {
            isDarkMode = false;
        } else {
            int currentNightMode = context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK;
            isDarkMode = (currentNightMode == android.content.res.Configuration.UI_MODE_NIGHT_YES);
        }

        // Color Palette definitions
        int bgColor = isDarkMode ? 0xFF111114 : 0xFFFFFFFF;
        int textPrimaryColor = isDarkMode ? 0xFFFFFFFF : 0xFF121212;
        int textSecondaryColor = isDarkMode ? 0xB3FFFFFF : 0xBF121212; // ~70% vs ~75% opacity
        int borderColor = isDarkMode ? 0x26FFFFFF : 0x1A000000;       // 15% white vs 10% black
        int gridBgColor = isDarkMode ? 0x0DFFFFFF : 0x0F000000;       // 5% white vs 6% black
        int cellBgColor = isDarkMode ? 0x14FFFFFF : 0x0A000000;       // 8% white vs 4% black
        int cellBorderColor = isDarkMode ? 0x26FFFFFF : 0x14000000;   // 15% white vs 8% black
        int todayBorderColor = 0xFFE67E22;                            // Orange

        // Paint definitions
        Paint bgPaint = new Paint();
        bgPaint.setAntiAlias(true);
        bgPaint.setColor(bgColor);

        Paint textPaint = new Paint();
        textPaint.setAntiAlias(true);
        
        Paint accentPaint = new Paint();
        accentPaint.setAntiAlias(true);
        try {
            accentPaint.setColor(Color.parseColor(accentColor));
        } catch (Exception e) {
            accentPaint.setColor(Color.parseColor("#00E676"));
        }

        Paint normalPaint = new Paint();
        normalPaint.setAntiAlias(true);
        normalPaint.setFilterBitmap(true);

        Paint tintPaint = new Paint();
        tintPaint.setAntiAlias(true);
        tintPaint.setFilterBitmap(true);
        tintPaint.setColorFilter(new PorterDuffColorFilter(textSecondaryColor, PorterDuff.Mode.SRC_IN));

        // Load general assets
        Bitmap calendarBmp = loadAssetBitmap(context, "assets/calendar-custom-v3.png");
        Bitmap dumbbellBmp = loadAssetBitmap(context, "assets/dumbbell-custom.png");
        Bitmap sofaBmp = loadAssetBitmap(context, "assets/sofa-custom.png");
        Bitmap arrowBmp = loadAssetBitmap(context, "assets/arrow-custom.png");

        // 1. Draw overall widget background card
        canvas.drawRoundRect(new RectF(0, 0, width, height), 48f, 48f, bgPaint);

        // Get Month Details
        Calendar cal = Calendar.getInstance();
        int currentMonth = cal.get(Calendar.MONTH);
        int currentYear = cal.get(Calendar.YEAR);
        int todayDay = cal.get(Calendar.DAY_OF_MONTH);
        
        SimpleDateFormat monthSdf = new SimpleDateFormat("MMMM yyyy", Locale.US);
        String monthName = monthSdf.format(cal.getTime()).toUpperCase();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        String todayStr = sdf.format(new java.util.Date());

        // 2. Draw Month Title row (Month Name + Calendar Icon + Hand-drawn arrows)
        textPaint.setTextSize(36f);
        textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        textPaint.setLetterSpacing(0.08f);
        float textWidth = textPaint.measureText(monthName);
        float calendarSize = 36f;
        float gap = 12f;
        float totalHeaderWidth = calendarSize + gap + textWidth;
        float headerStartX = (width - totalHeaderWidth) / 2f;

        // Draw Calendar Icon
        if (calendarBmp != null) {
            RectF dest = new RectF(headerStartX, 90f - calendarSize / 2f, headerStartX + calendarSize, 90f + calendarSize / 2f);
            canvas.drawBitmap(calendarBmp, null, dest, normalPaint);
        }
        // Draw Month Title
        textPaint.setColor(textPrimaryColor);
        textPaint.setTextAlign(Paint.Align.LEFT);
        canvas.drawText(monthName, headerStartX + calendarSize + gap, 90f + 13f, textPaint);

        // Draw Left Hand-drawn Arrow (rotated 180)
        if (arrowBmp != null) {
            canvas.save();
            canvas.rotate(180, 60f, 90f);
            RectF leftDest = new RectF(60f - 16f, 90f - 16f, 60f + 16f, 90f + 16f);
            canvas.drawBitmap(arrowBmp, null, leftDest, normalPaint);
            canvas.restore();
            
            // Draw Right Hand-drawn Arrow
            RectF rightDest = new RectF(width - 60f - 16f, 90f - 16f, width - 60f + 16f, 90f + 16f);
            canvas.drawBitmap(arrowBmp, null, rightDest, normalPaint);
        }

        // Compute Workout and Rest Counts
        int monthWorkouts = 0;
        int monthRest = 0;
        int daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
        for (int day = 1; day <= daysInMonth; day++) {
            cal.set(Calendar.DAY_OF_MONTH, day);
            String dateStr = sdf.format(cal.getTime());
            if (activeDates.contains(dateStr)) {
                monthWorkouts++;
            } else {
                if (day < todayDay) {
                    monthRest++;
                }
            }
        }

        // 3. Draw Monthly Summary Pill (Dashed border box)
        float boxWidth = 320f;
        float boxHeight = 64f;
        float boxStartX = (width - boxWidth) / 2f;
        RectF dashedRect = new RectF(boxStartX, 180f - boxHeight / 2f, boxStartX + boxWidth, 180f + boxHeight / 2f);
        
        Paint dashedPaint = new Paint();
        dashedPaint.setAntiAlias(true);
        dashedPaint.setStyle(Paint.Style.STROKE);
        dashedPaint.setStrokeWidth(2f);
        dashedPaint.setColor(isDarkMode ? Color.argb(60, 255, 255, 255) : Color.argb(40, 0, 0, 0));
        dashedPaint.setPathEffect(new DashPathEffect(new float[]{10f, 10f}, 0));
        canvas.drawRoundRect(dashedRect, 16f, 16f, dashedPaint);

        // Draw Dumbbell Count (left side of pill)
        float leftIconStartX = width / 2f - 110f;
        if (dumbbellBmp != null) {
            RectF dest = new RectF(leftIconStartX, 180f - 16f, leftIconStartX + 32f, 180f + 16f);
            canvas.drawBitmap(dumbbellBmp, null, dest, tintPaint);
        }
        textPaint.setTextSize(26f);
        textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        textPaint.setColor(textPrimaryColor);
        textPaint.setTextAlign(Paint.Align.LEFT);
        canvas.drawText(String.valueOf(monthWorkouts), width / 2f - 68f, 180f + 9f, textPaint);

        // Draw Vertical Divider Line
        Paint linePaint = new Paint();
        linePaint.setAntiAlias(true);
        linePaint.setColor(borderColor);
        linePaint.setStrokeWidth(2f);
        canvas.drawLine(width / 2f, 180f - 16f, width / 2f, 180f + 16f, linePaint);

        // Draw Sofa Count (right side of pill)
        float rightIconStartX = width / 2f + 30f;
        if (sofaBmp != null) {
            RectF dest = new RectF(rightIconStartX, 180f - 16f, rightIconStartX + 32f, 180f + 16f);
            canvas.drawBitmap(sofaBmp, null, dest, tintPaint);
        }
        canvas.drawText(String.valueOf(monthRest), width / 2f + 78f, 180f + 9f, textPaint);

        // 4. Draw Weekday Headers
        String[] weekdays = {"SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"};
        float innerPadding = 20f;
        float availableWidth = width - (innerPadding * 2);
        float cellWidth = availableWidth / 7f;
        float cellHeight = cellWidth;
        float startY = 250f;

        textPaint.setTextSize(18f);
        textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
        textPaint.setColor(textSecondaryColor);
        textPaint.setTextAlign(Paint.Align.CENTER);
        textPaint.setLetterSpacing(0f);

        Paint headerBgPaint = new Paint();
        headerBgPaint.setAntiAlias(true);
        headerBgPaint.setColor(gridBgColor);

        for (int i = 0; i < 7; i++) {
            float x = innerPadding + (i * cellWidth);
            RectF headerRect = new RectF(x + 4, startY - 20f, x + cellWidth - 4, startY + 20f);
            canvas.drawRoundRect(headerRect, 8f, 8f, headerBgPaint);
            canvas.drawText(weekdays[i], x + cellWidth / 2f, startY + 7f, textPaint);
        }

        // Calendar calculations for start offset and grid height
        cal.set(Calendar.DAY_OF_MONTH, 1);
        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        int startOffset = getDayOffset(firstDayOfWeek);
        int totalCells = startOffset + daysInMonth;
        int numRows = (int) Math.ceil(totalCells / 7.0);
        float gridStartY = startY + 30f;
        float gridHeight = numRows * cellHeight + 10f;

        // 5. Draw the Calendar Grid Card background and border
        Paint gridPaint = new Paint();
        gridPaint.setAntiAlias(true);
        gridPaint.setColor(gridBgColor);

        Paint gridBorderPaint = new Paint();
        gridBorderPaint.setAntiAlias(true);
        gridBorderPaint.setStyle(Paint.Style.STROKE);
        gridBorderPaint.setColor(borderColor);
        gridBorderPaint.setStrokeWidth(2f);

        RectF gridRect = new RectF(innerPadding - 4, gridStartY, width - innerPadding + 4, gridStartY + gridHeight);
        canvas.drawRoundRect(gridRect, 24f, 24f, gridPaint);
        canvas.drawRoundRect(gridRect, 24f, 24f, gridBorderPaint);

        // Day Draw paints
        Paint dayBgPaint = new Paint();
        dayBgPaint.setAntiAlias(true);

        Paint dayBorderPaint = new Paint();
        dayBorderPaint.setAntiAlias(true);
        dayBorderPaint.setStyle(Paint.Style.STROKE);

        java.util.Map<String, Bitmap> muscleCache = new java.util.HashMap<>();

        // Trailing previous month padding cells
        cal.add(Calendar.MONTH, -1);
        int prevMonthTotalDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH);
        cal.add(Calendar.MONTH, 1); // restore current month

        for (int i = 0; i < startOffset; i++) {
            int prevDay = prevMonthTotalDays - startOffset + 1 + i;
            float x = innerPadding + (i * cellWidth);
            float y = gridStartY + 5f; // first row

            RectF rect = new RectF(x + 4, y + 4, x + cellWidth - 4, y + cellHeight - 4);
            dayBgPaint.setColor(isDarkMode ? 0x0AFFFFFF : 0x05000000);
            canvas.drawRoundRect(rect, 12f, 12f, dayBgPaint);

            textPaint.setColor(isDarkMode ? 0x26FFFFFF : 0x26000000); // 15% opacity
            textPaint.setTextSize(18f);
            textPaint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText(String.valueOf(prevDay), x + 16f, y + 30f, textPaint);
        }

        // Draw active month days
        for (int day = 1; day <= daysInMonth; day++) {
            cal.set(Calendar.DAY_OF_MONTH, day);
            String dateStr = sdf.format(cal.getTime());
            boolean worked = activeDates.contains(dateStr);
            boolean isToday = dateStr.equals(todayStr);
            boolean isPast = cal.getTime().before(new java.util.Date()) && !isToday;

            int position = startOffset + day - 1;
            int col = position % 7;
            int row = position / 7;

            float x = innerPadding + (col * cellWidth);
            float y = gridStartY + 5f + (row * cellHeight);

            RectF rect = new RectF(x + 4, y + 4, x + cellWidth - 4, y + cellHeight - 4);

            // Draw Day Background and Border
            if (worked) {
                dayBgPaint.setColor(cellBgColor);
                dayBorderPaint.setColor(cellBorderColor);
                dayBorderPaint.setStrokeWidth(2f);
            } else {
                dayBgPaint.setColor(bgColor);
                dayBorderPaint.setColor(Color.TRANSPARENT);
            }

            canvas.drawRoundRect(rect, 12f, 12f, dayBgPaint);
            
            if (isToday) {
                dayBorderPaint.setColor(todayBorderColor);
                dayBorderPaint.setStrokeWidth(3.5f);
            }
            if (worked || isToday) {
                canvas.drawRoundRect(rect, 12f, 12f, dayBorderPaint);
            }

            // Draw Day Number
            textPaint.setTextSize(18f);
            textPaint.setTextAlign(Paint.Align.LEFT);
            if (isToday) {
                textPaint.setColor(todayBorderColor);
                textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
            } else if (worked) {
                textPaint.setColor(textPrimaryColor);
                textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
            } else {
                textPaint.setColor(isPast ? textSecondaryColor : textPrimaryColor);
                textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.NORMAL));
            }
            canvas.drawText(String.valueOf(day), x + 16f, y + 30f, textPaint);

            // Draw Inside Cell (Icons)
            float centerX = x + cellWidth / 2f;
            float centerY = y + cellHeight / 2f + 10f;
            float iconSize = 44f;

            if (worked) {
                JSONArray muscles = activeMusclesObj.optJSONArray(dateStr);
                int musclesCount = (muscles != null) ? muscles.length() : 0;
                if (musclesCount > 0) {
                    String firstMuscle = muscles.optString(0);
                    String assetPath = "assets/muscles/" + ("arms".equals(firstMuscle) ? "biceps" : firstMuscle) + ".png";
                    
                    Bitmap muscleBmp = muscleCache.get(assetPath);
                    if (muscleBmp == null) {
                        muscleBmp = loadAssetBitmap(context, assetPath);
                        if (muscleBmp != null) {
                            muscleCache.put(assetPath, muscleBmp);
                        }
                    }
                    
                    if (muscleBmp != null) {
                        RectF dest = new RectF(centerX - iconSize / 2f, centerY - iconSize / 2f, centerX + iconSize / 2f, centerY + iconSize / 2f);
                        canvas.drawBitmap(muscleBmp, null, dest, normalPaint);
                    }

                    // Multiplier text if more than 1 muscle
                    if (musclesCount > 1) {
                        textPaint.setTextSize(16f);
                        textPaint.setTypeface(android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD));
                        textPaint.setColor(accentPaint.getColor());
                        textPaint.setTextAlign(Paint.Align.LEFT);
                        canvas.drawText("x" + musclesCount, centerX + iconSize / 2f + 2f, centerY + 6f, textPaint);
                    }
                }
            } else if (isPast) {
                // Sofa icon for rest days
                if (sofaBmp != null) {
                    RectF dest = new RectF(centerX - iconSize / 2f, centerY - iconSize / 2f, centerX + iconSize / 2f, centerY + iconSize / 2f);
                    canvas.drawBitmap(sofaBmp, null, dest, tintPaint);
                }
            }
        }

        // Draw next month leading cells
        int remainingCells = (7 - (totalCells % 7)) % 7;
        for (int i = 1; i <= remainingCells; i++) {
            int col = (startOffset + daysInMonth + i - 1) % 7;
            int row = (startOffset + daysInMonth + i - 1) / 7;

            float x = innerPadding + (col * cellWidth);
            float y = gridStartY + 5f + (row * cellHeight);

            RectF rect = new RectF(x + 4, y + 4, x + cellWidth - 4, y + cellHeight - 4);
            dayBgPaint.setColor(isDarkMode ? 0x0AFFFFFF : 0x05000000);
            canvas.drawRoundRect(rect, 12f, 12f, dayBgPaint);

            textPaint.setColor(isDarkMode ? 0x26FFFFFF : 0x26000000);
            textPaint.setTextSize(18f);
            textPaint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText(String.valueOf(i), x + 16f, y + 30f, textPaint);
        }
        // Scale down the bitmap to fit within the 1MB IPC limit for RemoteViews
        // A factor of 2 reduction reduces size by 4x.
        Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmap, width / 2, height / 2, true);
        return scaledBitmap;
    }

    private Bitmap loadAssetBitmap(Context context, String path) {
        try {
            InputStream is = context.getAssets().open("public/" + path);
            Bitmap bitmap = BitmapFactory.decodeStream(is);
            is.close();
            return bitmap;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private int getDayOffset(int dayOfWeek) {
        switch (dayOfWeek) {
            case Calendar.SATURDAY: return 0;
            case Calendar.SUNDAY: return 1;
            case Calendar.MONDAY: return 2;
            case Calendar.TUESDAY: return 3;
            case Calendar.WEDNESDAY: return 4;
            case Calendar.THURSDAY: return 5;
            case Calendar.FRIDAY: return 6;
            default: return 0;
        }
    }

    private void addUniqueString(JSONArray array, String value) {
        for (int i = 0; i < array.length(); i++) {
            if (value.equals(array.optString(i))) {
                return;
            }
        }
        array.put(value);
    }

    private String translateMuscle(String key, String lang) {
        boolean isAr = "ar".equals(lang);
        if ("chest".equals(key)) return isAr ? "صدر" : "Chest";
        if ("back".equals(key)) return isAr ? "ظهر" : "Back";
        if ("legs".equals(key)) return isAr ? "رجلين" : "Legs";
        if ("shoulders".equals(key)) return isAr ? "أكتاف" : "Shoulders";
        if ("arms".equals(key)) return isAr ? "دراعات" : "Arms";
        if ("abs".equals(key)) return isAr ? "بطن" : "Abs";
        if ("cardio".equals(key)) return isAr ? "كارديو" : "Cardio";
        return key;
    }

    private String getCircledNumber(int num) {
        switch (num) {
            case 1: return "①";
            case 2: return "②";
            case 3: return "③";
            case 4: return "④";
            case 5: return "⑤";
            case 6: return "⑥";
            case 7: return "⑦";
            case 8: return "⑧";
            case 9: return "⑨";
            case 10: return "⑩";
            default: return "[" + num + "]";
        }
    }
}
