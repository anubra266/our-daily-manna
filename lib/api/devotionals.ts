import type { Devotional, DevotionalCategory } from '@/lib/types/devotional';
import * as wp from '@/lib/api/wordpress';
import * as cache from '@/lib/db/cache';

/** Try network; on success cache and return. On failure, return from cache if available. */
export async function getTodaysDevotional(category: DevotionalCategory): Promise<Devotional | null> {
  try {
    const d = await wp.getTodaysDevotional(category);
    if (d) {
      await cache.upsertDevotional(d);
      return d;
    }
  } catch {
    // Network failed; try cache
  }
  return cache.getTodaysFromCache(category);
}

/** Try network; on success cache and return. On failure, return from cache if available. */
export async function getPostById(id: number): Promise<Devotional | null> {
  try {
    const d = await wp.getPostById(id);
    if (d) {
      await cache.upsertDevotional(d);
      return d;
    }
  } catch {
    // Network failed; try cache
  }
  return cache.getDevotionalById(id);
}

/** Fetch from network; on success cache all and return. On failure return from cache (recent list). */
export async function getPosts(params: wp.GetPostsParams): Promise<Devotional[]> {
  try {
    const list = await wp.getPosts(params);
    if (list.length > 0) {
      await cache.upsertDevotionals(list);
    }
    return list;
  } catch {
    // Return cached devotionals for the category if any
    const categoryId = params.categoryId;
    const slug = categoryId === 7 ? 'daily-manna' : categoryId === 8 ? 'sincere-milk' : categoryId === 9 ? 'higher-everyday' : undefined;
    if (slug) {
      return cache.getAllCached({ category: slug, limit: params.perPage ?? 20, offset: ((params.page ?? 1) - 1) * (params.perPage ?? 20) });
    }
    return cache.getAllCached({ limit: params.perPage ?? 20, offset: ((params.page ?? 1) - 1) * (params.perPage ?? 20) });
  }
}

export { getTodaysPosts } from '@/lib/api/wordpress';

// Re-export cache helpers for Library and Search
export {
  getAllCached,
  getAdjacentIds,
  searchCached,
  markAsRead,
  setSaved,
  isSaved,
} from '@/lib/db/cache';
export type { GetAllCachedOptions } from '@/lib/db/cache';
