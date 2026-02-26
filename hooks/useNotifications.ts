import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIF_KEY = '@murmur_notification';

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  hour: 21,   // 9 PM default
  minute: 0,
};

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<string>('undetermined');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [stored, { status }] = await Promise.all([
        AsyncStorage.getItem(NOTIF_KEY),
        Notifications.getPermissionsAsync(),
      ]);
      setPermissionStatus(status);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error('useNotifications load error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }

  async function scheduleNotification(hour: number, minute: number) {
    // Cancel any existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('murmur-reminders', {
        name: 'Daily Reminder',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#5E7A8A',
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'murmur.',
        body: 'take a moment to reflect.',
        sound: false,
        ...(Platform.OS === 'android' && { channelId: 'murmur-reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      },
    });
  }

  async function enableNotifications(hour: number, minute: number) {
    const granted = await requestPermission();
    if (!granted) return false;

    await scheduleNotification(hour, minute);
    const newSettings: NotificationSettings = { enabled: true, hour, minute };
    setSettings(newSettings);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(newSettings));
    return true;
  }

  async function disableNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const newSettings: NotificationSettings = { ...settings, enabled: false };
    setSettings(newSettings);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(newSettings));
  }

  async function updateTime(hour: number, minute: number) {
    if (settings.enabled) {
      await scheduleNotification(hour, minute);
    }
    const newSettings: NotificationSettings = { ...settings, hour, minute };
    setSettings(newSettings);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(newSettings));
  }

  return {
    settings,
    permissionStatus,
    loading,
    enableNotifications,
    disableNotifications,
    updateTime,
  };
}