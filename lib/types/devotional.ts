export type DevotionalCategory = 'sincere-milk' | 'higher-everyday' | 'daily-manna';

export interface Devotional {
  id: number;
  category: DevotionalCategory;
  title: string;
  date: string;
  link: string;
  slug: string;
  thumbnailUrl?: string;
  audioUrl?: string;
  keyVerseText: string;
  keyVerseRef: string;
  message: string;
  thoughtForDay: string;
}

export const DEVOTIONAL_CATEGORY_LABELS: Record<DevotionalCategory, string> = {
  'sincere-milk': 'Sincere Milk',
  'higher-everyday': 'Higher Everyday',
  'daily-manna': 'Daily Manna',
};

/** Audience / age group for each category (children, youths, adults). */
export const DEVOTIONAL_CATEGORY_AUDIENCE: Record<DevotionalCategory, string> = {
  'sincere-milk': 'For children',
  'higher-everyday': 'For youths',
  'daily-manna': 'For adults',
};

/** Short description for Discover category cards. */
export const DEVOTIONAL_CATEGORY_DESCRIPTION: Record<DevotionalCategory, string> = {
  'sincere-milk':
    'Fun, engaging devotionals for young hearts. Simple Bible stories, prayers, and life lessons to help children grow in faith.',
  'higher-everyday':
    'Bold, relevant devotionals for teens and young adults. Navigate life\'s challenges with Scripture-grounded wisdom.',
  'daily-manna':
    'Deep, reflective devotionals for mature believers. Rich insights, prayer guides, and spiritual discipline for daily walk.',
};
