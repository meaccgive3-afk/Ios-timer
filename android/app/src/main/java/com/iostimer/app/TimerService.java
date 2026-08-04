package com.iostimer.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * خدمة أمامية (Foreground Service) تُبقي المؤقت يعمل بعد خروج المستخدم من التطبيق.
 *
 * الإشعار يستخدم عدّاد النظام (Chronometer) بوضع العدّ التنازلي، وهذا ما يجعل
 * الوقت المتبقي يتحدّث كل ثانية دون أي كود جافاسكربت — ويظهر تلقائياً في:
 *  - شريط الحالة وقائمة الإشعارات (كل أنظمة أندرويد)
 *  - كبسولة/شريط النشاط الحيّ في HyperOS (شاومي/ريدمي)، Realme UI، MagicOS (هونر)
 *  - شاشة القفل والشاشة الدائمة (AOD)
 *  - الشريط الحيّ في أندرويد 16 عبر ترقية الإشعار (Promoted Ongoing)
 */
public class TimerService extends Service {

    public static final String ACTION_START = "com.iostimer.app.action.START";
    public static final String ACTION_PAUSE = "com.iostimer.app.action.PAUSE";
    public static final String ACTION_RESUME = "com.iostimer.app.action.RESUME";
    public static final String ACTION_STOP = "com.iostimer.app.action.STOP";

    /** بثّ داخلي نُبلّغ به طبقة الويب أن المستخدم ضغط زراً في الإشعار. */
    public static final String BROADCAST_STATE = "com.iostimer.app.broadcast.STATE";
    public static final String EXTRA_STATE = "state";

    public static final String EXTRA_END_AT = "endAt";
    public static final String EXTRA_REMAINING = "remainingMs";
    public static final String EXTRA_TOTAL = "totalMs";
    public static final String EXTRA_LABEL = "label";

    private static final String CHANNEL_RUNNING = "timer_running";
    private static final String CHANNEL_DONE = "timer_done";
    private static final int NOTIFICATION_ID = 4711;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable finishTask;

    private long endAt = 0L;
    private long remainingMs = 0L;
    private long totalMs = 0L;
    private String label = "المؤقت";
    private boolean paused = false;

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannels(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (action == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        switch (action) {
            case ACTION_START:
                endAt = intent.getLongExtra(EXTRA_END_AT, System.currentTimeMillis());
                totalMs = intent.getLongExtra(EXTRA_TOTAL, 0L);
                label = intent.getStringExtra(EXTRA_LABEL) != null ? intent.getStringExtra(EXTRA_LABEL) : "المؤقت";
                paused = false;
                remainingMs = Math.max(0L, endAt - System.currentTimeMillis());
                pushRunningNotification();
                scheduleFinish();
                break;

            case ACTION_PAUSE:
                remainingMs = Math.max(0L, endAt - System.currentTimeMillis());
                paused = true;
                cancelFinish();
                pushRunningNotification();
                broadcastState("paused");
                break;

            case ACTION_RESUME:
                paused = false;
                endAt = System.currentTimeMillis() + remainingMs;
                pushRunningNotification();
                scheduleFinish();
                broadcastState("running");
                break;

            case ACTION_STOP:
                cancelFinish();
                broadcastState("idle");
                stopEverything();
                return START_NOT_STICKY;
        }

        return START_STICKY;
    }

    // ---------------------------------------------------------------- إشعارات

    static void ensureChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel running = new NotificationChannel(
                CHANNEL_RUNNING, "المؤقت الجاري", NotificationManager.IMPORTANCE_LOW);
        running.setDescription("عدّاد حيّ يظهر أثناء عمل المؤقت");
        running.setShowBadge(false);
        running.setSound(null, null);
        running.enableVibration(false);
        manager.createNotificationChannel(running);

        NotificationChannel done = new NotificationChannel(
                CHANNEL_DONE, "انتهاء المؤقت", NotificationManager.IMPORTANCE_HIGH);
        done.setDescription("تنبيه بصوت واهتزاز عند انتهاء المؤقت");
        done.enableVibration(true);
        done.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 700});
        manager.createNotificationChannel(done);
    }

    private PendingIntent contentIntent() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(this, 0, open, pendingFlags());
    }

    private PendingIntent servicePendingIntent(String action, int requestCode) {
        Intent intent = new Intent(this, TimerService.class).setAction(action);
        return PendingIntent.getService(this, requestCode, intent, pendingFlags());
    }

    private int pendingFlags() {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return flags;
    }

    private void pushRunningNotification() {
        long left = paused ? remainingMs : Math.max(0L, endAt - System.currentTimeMillis());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_RUNNING)
                .setSmallIcon(R.drawable.ic_stat_timer)
                .setContentTitle(label)
                .setContentIntent(contentIntent())
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setOngoing(true)
                .setColorized(true)
                .setColor(0xFFFF9F0A);

        if (paused) {
            builder.setUsesChronometer(false)
                    .setShowWhen(false)
                    .setContentText("متوقف مؤقتاً — " + formatDuration(left))
                    .addAction(R.drawable.ic_stat_timer, "متابعة",
                            servicePendingIntent(ACTION_RESUME, 2));
        } else {
            // عدّاد النظام: يتحدّث كل ثانية بنفسه ويعرض الوقت المتبقي تنازلياً
            builder.setUsesChronometer(true)
                    .setShowWhen(true)
                    .setWhen(System.currentTimeMillis() + left)
                    .setContentText("ينتهي عند " + formatClock(System.currentTimeMillis() + left))
                    .addAction(R.drawable.ic_stat_timer, "إيقاف",
                            servicePendingIntent(ACTION_PAUSE, 1));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder.setChronometerCountDown(true);
            }
        }

        builder.addAction(R.drawable.ic_stat_timer, "إلغاء", servicePendingIntent(ACTION_STOP, 3));

        if (totalMs > 0) {
            int progress = (int) Math.min(1000, Math.max(0, ((totalMs - left) * 1000) / totalMs));
            builder.setProgress(1000, progress, false);
        }

        applyLiveUpdateHints(builder, left);

        Notification notification = builder.build();
        startInForeground(notification);
    }

    /**
     * محاولة ترقية الإشعار إلى "تحديث حيّ" في أندرويد 16 فيظهر كشريط مصغّر في
     * شريط الحالة. تُتجاهل بهدوء على الإصدارات الأقدم.
     */
    private void applyLiveUpdateHints(NotificationCompat.Builder builder, long left) {
        try {
            Bundle extras = new Bundle();
            extras.putBoolean("android.requestPromotedOngoing", true);
            extras.putCharSequence("android.shortCriticalText", formatDuration(left));
            builder.addExtras(extras);
        } catch (Throwable ignored) {
            // لا شيء — مجرد تحسين اختياري
        }
    }

    private void startInForeground(Notification notification) {
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION_ID, notification,
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    // ------------------------------------------------------------- الانتهاء

    /**
     * جدولة التنبيه بطريقتين حتى يعمل ولو قُتل التطبيق:
     * Handler داخل الخدمة + AlarmManager دقيق يتجاوز وضع الخمول.
     */
    private void scheduleFinish() {
        cancelFinish();
        long delay = Math.max(0L, endAt - System.currentTimeMillis());

        finishTask = this::onFinished;
        handler.postDelayed(finishTask, delay);

        AlarmManager alarmManager = getSystemService(AlarmManager.class);
        if (alarmManager == null) return;
        PendingIntent alarm = TimerAlarmReceiver.pendingIntent(this, label);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + delay, alarm);
            } else {
                alarmManager.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + delay, alarm);
            }
        } catch (SecurityException ignored) {
            // بدون صلاحية المنبّه الدقيق نعتمد على الـ Handler
        }
    }

    private void cancelFinish() {
        if (finishTask != null) {
            handler.removeCallbacks(finishTask);
            finishTask = null;
        }
        AlarmManager alarmManager = getSystemService(AlarmManager.class);
        if (alarmManager != null) {
            alarmManager.cancel(TimerAlarmReceiver.pendingIntent(this, label));
        }
    }

    private void onFinished() {
        NotificationManagerCompat.from(this).cancel(NOTIFICATION_ID);
        TimerAlarmReceiver.notifyDone(this, label);
        broadcastState("done");
        stopEverything();
    }

    private void stopEverything() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    private void broadcastState(String state) {
        Intent intent = new Intent(BROADCAST_STATE)
                .setPackage(getPackageName())
                .putExtra(EXTRA_STATE, state)
                .putExtra(EXTRA_REMAINING, paused ? remainingMs : Math.max(0L, endAt - System.currentTimeMillis()));
        sendBroadcast(intent);
    }

    // -------------------------------------------------------------- مساعدات

    private static String formatDuration(long ms) {
        long total = Math.max(0L, ms) / 1000L;
        long h = total / 3600L;
        long m = (total % 3600L) / 60L;
        long s = total % 60L;
        if (h > 0) return String.format("%d:%02d:%02d", h, m, s);
        return String.format("%d:%02d", m, s);
    }

    private static String formatClock(long epochMs) {
        java.util.Calendar c = java.util.Calendar.getInstance();
        c.setTimeInMillis(epochMs);
        return String.format("%02d:%02d", c.get(java.util.Calendar.HOUR_OF_DAY), c.get(java.util.Calendar.MINUTE));
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        cancelFinish();
        super.onDestroy();
    }

    // ------------------------------------------------------- واجهة للاستدعاء

    static void send(Context context, String action, Bundle extras) {
        Intent intent = new Intent(context, TimerService.class).setAction(action);
        if (extras != null) intent.putExtras(extras);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }
}
