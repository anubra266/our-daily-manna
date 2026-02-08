import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { REMINDER_TIME_KEY } from '@/lib/constants/storage-keys';
import { cancelDailyReminder, scheduleDailyReminder } from '@/lib/notifications/schedule';

export interface ReminderTime {
  hour: number;
  minute: number;
}

const DEFAULT_REMINDER: ReminderTime = { hour: 7, minute: 0 };

export function useReminderTime() {
  const [reminderTime, setReminderTimeState] = useState<ReminderTime | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_TIME_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as ReminderTime;
          if (typeof parsed?.hour === 'number' && typeof parsed?.minute === 'number') {
            setReminderTimeState({ hour: parsed.hour, minute: parsed.minute });
          } else {
            setReminderTimeState(DEFAULT_REMINDER);
          }
        } else {
          setReminderTimeState(null);
        }
      } catch {
        if (!cancelled) setReminderTimeState(null);
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setReminderTime = useCallback(async (time: ReminderTime | null) => {
    if (time === null) {
      await AsyncStorage.removeItem(REMINDER_TIME_KEY);
      setReminderTimeState(null);
      await cancelDailyReminder();
      return;
    }
    await AsyncStorage.setItem(REMINDER_TIME_KEY, JSON.stringify(time));
    setReminderTimeState(time);
    await scheduleDailyReminder(time.hour, time.minute);
  }, []);

  return { reminderTime, setReminderTime, isLoaded };
}

export function formatReminderTime(t: ReminderTime): string {
  const h = t.hour % 12 || 12;
  const ampm = t.hour < 12 ? 'AM' : 'PM';
  const m = t.minute.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export const PRESET_TIMES: ReminderTime[] = [
  { hour: 6, minute: 0 },
  { hour: 6, minute: 30 },
  { hour: 7, minute: 0 },
  { hour: 7, minute: 30 },
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 },
];
