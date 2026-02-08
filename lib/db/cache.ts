import { openDatabaseAsync } from 'expo-sqlite';
import type { Devotional, DevotionalCategory } from '@/lib/types/devotional';

const DB_NAME = 'dailymanna.db';

let dbPromise: Promise<Awaited<ReturnType<typeof openDatabaseAsync>> | null> | null = null;
let dbFailed = false;

async function getDb() {
  if (dbFailed) return null;
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DB_NAME).catch(() => {
      dbFailed = true;
      return null;
    });
  }
  const db = await dbPromise;
  if (!db) return null;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS devotionals (
      id INTEGER PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      link TEXT NOT NULL,
      slug TEXT NOT NULL,
      thumbnail_url TEXT,
      audio_url TEXT,
      key_verse_text TEXT NOT NULL,
      key_verse_ref TEXT NOT NULL,
      message TEXT NOT NULL,
      thought_for_day TEXT NOT NULL,
      read_at INTEGER,
      saved_at INTEGER,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_devotionals_category_date ON devotionals(category, date);
    CREATE INDEX IF NOT EXISTS idx_devotionals_saved ON devotionals(saved_at) WHERE saved_at IS NOT NULL;
  `);
  try {
    await db.execAsync('ALTER TABLE devotionals ADD COLUMN thumbnail_url TEXT');
  } catch {
    /* column may already exist */
  }
  return db;
}

function rowToDevotional(row: Record<string, unknown>): Devotional {
  return {
    id: Number(row.id),
    category: row.category as DevotionalCategory,
    title: String(row.title),
    date: String(row.date),
    link: String(row.link),
    slug: String(row.slug),
    thumbnailUrl: row.thumbnail_url != null ? String(row.thumbnail_url) : undefined,
    audioUrl: row.audio_url != null ? String(row.audio_url) : undefined,
    keyVerseText: String(row.key_verse_text),
    keyVerseRef: String(row.key_verse_ref),
    message: String(row.message),
    thoughtForDay: String(row.thought_for_day),
  };
}

export async function upsertDevotional(d: Devotional): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO devotionals (id, category, title, date, link, slug, thumbnail_url, audio_url, key_verse_text, key_verse_ref, message, thought_for_day, read_at, saved_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
     ON CONFLICT(id) DO UPDATE SET
       category=excluded.category, title=excluded.title, date=excluded.date, link=excluded.link,
       slug=excluded.slug, thumbnail_url=excluded.thumbnail_url, audio_url=excluded.audio_url,
       key_verse_text=excluded.key_verse_text, key_verse_ref=excluded.key_verse_ref,
       message=excluded.message, thought_for_day=excluded.thought_for_day, updated_at=excluded.updated_at`,
    d.id,
    d.category,
    d.title,
    d.date,
    d.link,
    d.slug,
    d.thumbnailUrl ?? null,
    d.audioUrl ?? null,
    d.keyVerseText,
    d.keyVerseRef,
    d.message,
    d.thoughtForDay,
    now
  );
}

export async function upsertDevotionals(list: Devotional[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const d of list) {
      await db.runAsync(
        `INSERT INTO devotionals (id, category, title, date, link, slug, thumbnail_url, audio_url, key_verse_text, key_verse_ref, message, thought_for_day, read_at, saved_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
         ON CONFLICT(id) DO UPDATE SET
           category=excluded.category, title=excluded.title, date=excluded.date, link=excluded.link,
           slug=excluded.slug, thumbnail_url=excluded.thumbnail_url, audio_url=excluded.audio_url,
           key_verse_text=excluded.key_verse_text, key_verse_ref=excluded.key_verse_ref,
           message=excluded.message, thought_for_day=excluded.thought_for_day, updated_at=excluded.updated_at`,
        d.id,
        d.category,
        d.title,
        d.date,
        d.link,
        d.slug,
        d.thumbnailUrl ?? null,
        d.audioUrl ?? null,
        d.keyVerseText,
        d.keyVerseRef,
        d.message,
        d.thoughtForDay,
        now
      );
    }
  });
}

export async function getDevotionalById(id: number): Promise<Devotional | null> {
  const db = await getDb();
  if (!db) return null;
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM devotionals WHERE id = ?',
    id
  );
  return row ? rowToDevotional(row) : null;
}

const TODAY_START = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
const TODAY_END = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

export async function getTodaysFromCache(category: DevotionalCategory): Promise<Devotional | null> {
  const db = await getDb();
  if (!db) return null;
  const start = TODAY_START();
  const end = TODAY_END();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM devotionals WHERE category = ? AND date >= ? AND date <= ? ORDER BY date DESC LIMIT 1',
    category,
    start,
    end
  );
  return row ? rowToDevotional(row) : null;
}

export interface GetAllCachedOptions {
  category?: DevotionalCategory;
  limit?: number;
  offset?: number;
  savedOnly?: boolean;
}

/** Previous = older (date < current). Next = newer (date > current). Same category. */
export async function getAdjacentIds(
  category: DevotionalCategory,
  date: string
): Promise<{ prevId: number | null; nextId: number | null }> {
  const db = await getDb();
  if (!db) return { prevId: null, nextId: null };
  const prevRow = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM devotionals WHERE category = ? AND date < ? ORDER BY date DESC LIMIT 1',
    category,
    date
  );
  const nextRow = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM devotionals WHERE category = ? AND date > ? ORDER BY date ASC LIMIT 1',
    category,
    date
  );
  return {
    prevId: prevRow?.id ?? null,
    nextId: nextRow?.id ?? null,
  };
}

export async function getAllCached(opts: GetAllCachedOptions = {}): Promise<Devotional[]> {
  const db = await getDb();
  if (!db) return [];
  const { category, limit = 50, offset = 0, savedOnly = false } = opts;
  let sql = 'SELECT * FROM devotionals WHERE 1=1';
  const params: (string | number)[] = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (savedOnly) {
    sql += ' AND saved_at IS NOT NULL';
  }
  sql += ' ORDER BY date DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map(rowToDevotional);
}

export async function searchCached(
  query: string,
  limit = 30,
  category?: DevotionalCategory
): Promise<Devotional[]> {
  if (!query.trim()) return [];
  const db = await getDb();
  if (!db) return [];
  const pattern = `%${query.trim()}%`;
  let sql =
    'SELECT * FROM devotionals WHERE (title LIKE ? OR message LIKE ? OR thought_for_day LIKE ? OR key_verse_text LIKE ?)';
  const params: (string | number)[] = [pattern, pattern, pattern, pattern];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY date DESC LIMIT ?';
  params.push(limit);
  const rows = await db.getAllAsync<Record<string, unknown>>(sql, params);
  return rows.map(rowToDevotional);
}

export async function markAsRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.runAsync('UPDATE devotionals SET read_at = ? WHERE id = ?', Date.now(), id);
}

export async function setSaved(id: number, saved: boolean, devotional?: Devotional): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (saved && devotional) {
    await upsertDevotional(devotional);
  }
  await db.runAsync(
    'UPDATE devotionals SET saved_at = ? WHERE id = ?',
    saved ? Date.now() : null,
    id
  );
}

export async function isSaved(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const row = await db.getFirstAsync<{ saved_at: number | null }>(
    'SELECT saved_at FROM devotionals WHERE id = ?',
    id
  );
  return row != null && row.saved_at != null;
}

/** Local YYYY-MM-DD for a timestamp (device timezone). */
function toLocalDateString(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns distinct dates (YYYY-MM-DD local) when user read at least one devotional, newest first. */
export async function getReadDates(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.getAllAsync<{ read_at: number }>(
    'SELECT read_at FROM devotionals WHERE read_at IS NOT NULL'
  );
  const set = new Set<string>();
  for (const r of rows) {
    set.add(toLocalDateString(r.read_at));
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export interface StreakResult {
  streak: number;
  todayRead: boolean;
  yesterdayRead: boolean;
}

/** Current read streak: consecutive days (including today or yesterday) with at least one read. */
export async function getStreak(): Promise<StreakResult> {
  const dates = await getReadDates();
  if (dates.length === 0) return { streak: 0, todayRead: false, yesterdayRead: false };

  const today = toLocalDateString(Date.now());
  const yesterday = toLocalDateString(Date.now() - 86400000);
  const set = new Set(dates);

  let start: string;
  if (set.has(today)) {
    start = today;
  } else if (set.has(yesterday)) {
    start = yesterday;
  } else {
    return { streak: 0, todayRead: false, yesterdayRead: false };
  }

  let count = 0;
  let current = start;
  while (set.has(current)) {
    count++;
    const [y, m, d] = current.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    current = toLocalDateString(prev.getTime());
  }

  return {
    streak: count,
    todayRead: set.has(today),
    yesterdayRead: set.has(yesterday),
  };
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

/** Current week (Mon–Sun) with read status and streak. */
export async function getWeekStatus(): Promise<WeekStatusResult> {
  const [dates, streakResult] = await Promise.all([getReadDates(), getStreak()]);
  const readSet = new Set(dates);

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 Sun .. 6 Sat
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  const days: WeekDayStatus[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toLocalDateString(d.getTime());
    days.push({
      date: dateStr,
      label: DAY_LABELS[i],
      read: readSet.has(dateStr),
    });
  }

  return { streak: streakResult.streak, days };
}
