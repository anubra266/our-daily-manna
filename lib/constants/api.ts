import type { DevotionalCategory } from '@/lib/types/devotional';

export const WP_API_BASE = 'https://dailymanna.app/wp-json/wp/v2';

/** Class names in post.class_list that map to our category slugs */
export const CATEGORY_CLASS_TO_SLUG: Record<string, DevotionalCategory> = {
  'category-sincere-milk': 'sincere-milk',
  'category-daily-manna': 'daily-manna',
  'category-higher-everyday': 'higher-everyday',
} as const;

/** WP category ID to our slug (optional; we prefer class_list) */
export const WP_CATEGORY_IDS: Record<number, DevotionalCategory> = {
  7: 'daily-manna',
  8: 'sincere-milk',
  9: 'higher-everyday',
};
