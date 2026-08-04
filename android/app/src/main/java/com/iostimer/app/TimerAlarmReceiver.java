package com.iostimer.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * يتلقّى المنبّه الدقيق عند انتهاء المؤقت ويُظهر تنبيهاً عالي الأهمية
 * بصوت واهتزاز — يعمل حتى لو أُغلق التطبيق تماماً.
 */
public class TimerAlarmReceiver extends BroadcastReceiver {

    static final String ACTION_FIRE = "com.iostimer.app.action.ALARM_FIRE";
    private static final int DONE_ID = 4712;

    static PendingIntent pendingIntent(Context context, String label) {
        Intent intent = new Intent(context, TimerAlarmReceiver.class)
                .setAction(ACTION_FIRE)
                .putExtra(TimerService.EXTRA_LABEL, label);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, 9001, intent, flags);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String label = intent.getStringExtra(TimerService.EXTRA_LABEL);
        notifyDone(context, label != null ? label : "المؤقت");
        context.startService(new Intent(context, TimerService.class).setAction(TimerService.ACTION_STOP));
    }

    static void notifyDone(Context context, String label) {
        TimerService.ensureChannels(context);

        Intent open = new Intent(context, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent tap = PendingIntent.getActivity(context, 4, open, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "timer_done")
                .setSmallIcon(R.drawable.ic_stat_timer)
                .setContentTitle("انتهى الوقت")
                .setContentText(label)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                        AudioAttributes.USAGE_ALARM)
                .setVibrate(new long[]{0, 500, 250, 500, 250, 700})
                .setAutoCancel(true)
                .setFullScreenIntent(tap, true)
                .setContentIntent(tap);

        try {
            NotificationManagerCompat.from(context).notify(DONE_ID, builder.build());
        } catch (SecurityException ignored) {
            // المستخدم لم يمنح صلاحية الإشعارات
        }
    }
}
