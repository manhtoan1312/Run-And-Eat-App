/**
 * Notification Helper (Safe Fallback for Expo Go SDK 53+)
 * ======================================================
 * 
 * IMPORTANT: As of Expo SDK 53, Android Push notifications are removed from Expo Go.
 * To use local/remote notifications on Android, you must use a "Development Build".
 * 
 * This helper provides a safe fallback that uses standard Alert.alert when in 
 * Expo Go to prevent the app from crashing due to missing native modules.
 */

import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// We attempt a lazy import to avoid bundling errors if the module is missing in Expo Go
let Notifications: any = null;
try {
  // In development, sometimes the bundler still tries to resolve this.
  // If this line causes a crash, we may need to use a completely mock-only file.
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not available in this environment');
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo || !Notifications) return true; // Pretend it's fine in Expo Go
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    return false;
  }
}

export async function setupRunNotificationChannel() {
  if (isExpoGo || !Notifications || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('run-tracking', {
      name: 'Chạy bộ',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6F61',
    });
  } catch (e) {}
}

export async function notifyWeakGps() {
  if (isExpoGo || !Notifications) {
    // Show a simple alert in foreground for Expo Go users
    Alert.alert('📡 Tín hiệu GPS yếu', 'Hãy di chuyển ra nơi thoáng để cải thiện tín hiệu.');
    return;
  }
  
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📡 Tín hiệu GPS yếu',
        body: 'Dữ liệu quãng đường có thể không chính xác.',
      },
      trigger: null,
    });
  } catch (e) {}
}

let lastGpsNotifyTime = 0;
export async function notifyWeakGpsDebounced(cooldownMs = 60_000) {
  const now = Date.now();
  if (now - lastGpsNotifyTime < cooldownMs) return;
  lastGpsNotifyTime = now;
  await notifyWeakGps();
}

export async function schedulePauseReminder(delayMinutes = 5): Promise<string> {
  if (isExpoGo || !Notifications) return 'mock-id';
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏸️ Bạn vẫn đang tạm dừng',
        body: `Buổi chạy của bạn vẫn chưa kết thúc. Tiếp tục nào! 💪`,
      },
      trigger: {
        seconds: delayMinutes * 60,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  } catch (e) {
    return 'error-id';
  }
}

export async function cancelPauseReminder(notificationId: string) {
  if (isExpoGo || !Notifications || notificationId === 'mock-id') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {}
}

export async function notifyRunSummary(params: {
  durationSeconds: number;
  distanceMeters: number;
  caloriesBurned: number;
}) {
  const { durationSeconds, distanceMeters, caloriesBurned } = params;
  const km = (distanceMeters / 1000).toFixed(2);
  const kcal = Math.round(caloriesBurned);
  const mm = Math.floor(durationSeconds / 60);
  const ss = durationSeconds % 60;
  const time = `${mm}:${ss < 10 ? '0' : ''}${ss}`;

  const message = `${km} km · ${time} · ${kcal} kcal — Tuyệt vời! 🎉`;

  if (isExpoGo || !Notifications) {
    Alert.alert('🏁 Hoàn thành!', message);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏁 Hoàn thành buổi chạy!',
        body: message,
      },
      trigger: null,
    });
  } catch (e) {
    Alert.alert('🏁 Hoàn thành!', message);
  }
}
