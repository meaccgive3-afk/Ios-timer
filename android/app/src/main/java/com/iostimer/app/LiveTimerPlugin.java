package com.iostimer.app;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * الجسر بين طبقة الويب والخدمة الأمامية.
 * JS ينادي: LiveTimer.start / pause / resume / stop
 * والخدمة تبثّ التغييرات فيستمع لها JS عبر الحدث "timerState".
 */
@CapacitorPlugin(
        name = "LiveTimer",
        permissions = {
                @Permission(alias = "notifications", strings = {Manifest.permission.POST_NOTIFICATIONS})
        }
)
public class LiveTimerPlugin extends Plugin {

    private BroadcastReceiver stateReceiver;

    @Override
    public void load() {
        super.load();
        stateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject payload = new JSObject();
                payload.put("state", intent.getStringExtra(TimerService.EXTRA_STATE));
                payload.put("remainingMs", intent.getLongExtra(TimerService.EXTRA_REMAINING, 0L));
                notifyListeners("timerState", payload);
            }
        };
        IntentFilter filter = new IntentFilter(TimerService.BROADCAST_STATE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(stateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(stateReceiver, filter);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (stateReceiver != null) {
            try {
                getContext().unregisterReceiver(stateReceiver);
            } catch (IllegalArgumentException ignored) {
            }
            stateReceiver = null;
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void start(PluginCall call) {
        long endAt = call.getLong("endAt", System.currentTimeMillis());
        long totalMs = call.getLong("totalMs", 0L);
        String label = call.getString("label", "المؤقت");

        Bundle extras = new Bundle();
        extras.putLong(TimerService.EXTRA_END_AT, endAt);
        extras.putLong(TimerService.EXTRA_TOTAL, totalMs);
        extras.putString(TimerService.EXTRA_LABEL, label);
        TimerService.send(getContext(), TimerService.ACTION_START, extras);
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        TimerService.send(getContext(), TimerService.ACTION_PAUSE, null);
        call.resolve();
    }

    @PluginMethod
    public void resume(PluginCall call) {
        TimerService.send(getContext(), TimerService.ACTION_RESUME, null);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        TimerService.send(getContext(), TimerService.ACTION_STOP, null);
        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        call.resolve(result);
    }
}
