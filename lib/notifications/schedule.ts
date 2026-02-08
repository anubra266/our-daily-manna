import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { PREFERRED_CATEGORY_KEY } from '@/lib/constants/storage-keys';
import type { DevotionalCategory } from '@/lib/types/devotional';
import { DEVOTIONAL_CATEGORY_LABELS } from '@/lib/types/devotional';

const DAILY_REMINDER_ID = 'dailymanna-daily-reminder';
const VALID_CATEGORIES: DevotionalCategory[] = ['sincere-milk', 'higher-everyday', 'daily-manna'];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function getNotificationBody(categoryLabel: string): string {
  return `Your ${categoryLabel} reading is ready. Open the app to read.`;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  let body = "Your daily reading is ready. Open the app to read.";
  try {
    const slug = await AsyncStorage.getItem(PREFERRED_CATEGORY_KEY);
    if (slug && VALID_CATEGORIES.includes(slug as DevotionalCategory)) {
      const label = DEVOTIONAL_CATEGORY_LABELS[slug as DevotionalCategory];
      body = getNotificationBody(label);
    }
  } catch {
    // keep default body
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Our Daily Manna',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Our Daily Manna',
      body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
}
