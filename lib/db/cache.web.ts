/**
 * Web-only cache implementation. Uses no native SQLite so the web bundle
 * does not pull in expo-sqlite (and its WASM worker), allowing EAS Update
 * export to succeed. All persistence is no-op; data is not stored on web.
 */
import type { Devotional, DevotionalCategory } from '@/lib/types/devotional';

export async function upsertDevotional(_d: Devotional): Promise<void> {}

export async function upsertDevotionals(_list: Devotional[]): Promise<void> {}

export async function getDevotionalById(_id: number): Promise<Devotional | null> {
  return null;
}

export async function getTodaysFromCache(_category: DevotionalCategory): Promise<Devotional | null> {
  return null;
}

export interface GetAllCachedOptions {
  category?: DevotionalCategory;
  limit?: number;
  offset?: number;
  savedOnly?: boolean;
}

export async function getAdjacentIds(
  _category: DevotionalCategory,
  _date: string
): Promise<{ prevId: number | null; nextId: number | null }> {
  return { prevId: null, nextId: null };
}

export async function getAllCached(_opts: GetAllCachedOptions = {}): Promise<Devotional[]> {
  return [];
}

export async function searchCached(
  _query: string,
  _limit = 30,
  _category?: DevotionalCategory
): Promise<Devotional[]> {
  return [];
}

export async function markAsRead(_id: number): Promise<void> {}

export async function setSaved(
  _id: number,
  _saved: boolean,
  _devotional?: Devotional
): Promise<void> {}

export async function isSaved(_id: number): Promise<boolean> {
  return false;
}

export async function getReadDates(): Promise<string[]> {
  return [];
}

export interface StreakResult {
  streak: number;
  todayRead: boolean;
  yesterdayRead: boolean;
}

export async function getStreak(): Promise<StreakResult> {
  return { streak: 0, todayRead: false, yesterdayRead: false };
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export interface WeekDayStatus {
  date: string;
  label: string;
  read: boolean;
}

export interface WeekStatusResult {
  streak: number;
  days: WeekDayStatus[];
}

function toLocalDateString(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getWeekStatus(): Promise<WeekStatusResult> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const days: WeekDayStatus[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      date: toLocalDateString(d.getTime()),
      label: DAY_LABELS[i],
      read: false,
    });
  }
  return { streak: 0, days };
}
