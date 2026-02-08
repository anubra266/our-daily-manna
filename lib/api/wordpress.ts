import type { Devotional, DevotionalCategory } from '@/lib/types/devotional';
import { CATEGORY_CLASS_TO_SLUG, WP_API_BASE, WP_CATEGORY_IDS } from '@/lib/constants/api';
import { parseDevotionalContent } from '@/lib/utils/parse-devotional-content';

export interface WPPost {
  id: number;
  date: string;
  link: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  categories?: number[];
  class_list?: string[];
  _links?: {
    'wp:featuredmedia'?: Array<{ href: string }>;
    'wp:attachment'?: Array<{ href: string }>;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:attachment'?: Array<{ guid: { rendered: string } }>;
  };
}

function getCategoryFromClassList(classList: string[] = []): DevotionalCategory | null {
  for (const cls of classList) {
    const slug = CATEGORY_CLASS_TO_SLUG[cls];
    if (slug) return slug;
  }
  return null;
}

function getThumbnailUrl(post: WPPost): string | undefined {
  const embedded = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  if (embedded) return embedded;
  return undefined;
}

function getAudioUrl(post: WPPost, fallbackFromContent?: string): string | undefined {
  const fromAttachment = post._embedded?.['wp:attachment']?.[0]?.guid?.rendered;
  if (fromAttachment) return fromAttachment;
  return fallbackFromContent;
}

function wpPostToDevotional(post: WPPost): Devotional | null {
  const category = getCategoryFromClassList(post.class_list) ?? (post.categories?.[0] ? WP_CATEGORY_IDS[post.categories[0]] : null);
  if (!category) return null;

  const parsed = parseDevotionalContent(post.content.rendered);
  return {
    id: post.id,
    category,
    title: post.title.rendered.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))),
    date: post.date,
    link: post.link,
    slug: post.slug,
    thumbnailUrl: getThumbnailUrl(post),
    audioUrl: getAudioUrl(post, parsed.audioUrl),
    keyVerseText: parsed.keyVerseText,
    keyVerseRef: parsed.keyVerseRef,
    message: parsed.message,
    thoughtForDay: parsed.thoughtForDay,
  };
}

export interface GetPostsParams {
  categoryId?: number;
  perPage?: number;
  page?: number;
  after?: string;
  before?: string;
  order?: 'asc' | 'desc';
}

export async function getPosts(params: GetPostsParams = {}): Promise<Devotional[]> {
  const { categoryId, perPage = 20, page = 1, after, before, order = 'desc' } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('per_page', String(perPage));
  searchParams.set('page', String(page));
  searchParams.set('order', order);
  searchParams.set('orderby', 'date');
  searchParams.set('_embed', '1');
  if (categoryId) searchParams.set('categories', String(categoryId));
  if (after) searchParams.set('after', after);
  if (before) searchParams.set('before', before);

  const res = await fetch(`${WP_API_BASE}/posts?${searchParams.toString()}`);
  if (!res.ok) throw new Error(`WP API error: ${res.status}`);
  const json: WPPost[] = await res.json();
  const devotionals: Devotional[] = [];
  for (const post of json) {
    const d = wpPostToDevotional(post);
    if (d) devotionals.push(d);
  }
  return devotionals;
}

/** Fetch thumbnail and audio from _links when _embed didn't provide them */
async function resolveMediaFromLinks(post: WPPost): Promise<{ thumbnailUrl?: string; audioUrl?: string }> {
  const out: { thumbnailUrl?: string; audioUrl?: string } = {};
  const featuredHref = post._links?.['wp:featuredmedia']?.[0]?.href;
  if (featuredHref) {
    try {
      const r = await fetch(featuredHref);
      if (r.ok) {
        const j = (await r.json()) as { source_url?: string };
        if (j.source_url) out.thumbnailUrl = j.source_url;
      }
    } catch {
      /* ignore */
    }
  }
  const attachmentHref = post._links?.['wp:attachment']?.[0]?.href;
  if (attachmentHref) {
    try {
      const r = await fetch(attachmentHref);
      if (r.ok) {
        const j = await r.json();
        // wp:attachment href returns an array of media (e.g. media?parent=123)
        const items = Array.isArray(j) ? j : [j];
        const audioItem = items.find(
          (item: { mime_type?: string; source_url?: string; guid?: { rendered?: string } }) =>
            (item.mime_type?.startsWith('audio/') ?? false) ||
            /\.(mp3|m4a|aac|ogg|wav)(\?|$)/i.test(item.source_url ?? item.guid?.rendered ?? '')
        );
        if (audioItem) {
          out.audioUrl = (audioItem as { source_url?: string; guid?: { rendered?: string } }).source_url ?? (audioItem as { guid?: { rendered?: string } }).guid?.rendered;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

export async function getPostById(id: number): Promise<Devotional | null> {
  const res = await fetch(`${WP_API_BASE}/posts/${id}?_embed=1`);
  if (!res.ok) return null;
  const post: WPPost = await res.json();
  const d = wpPostToDevotional(post);
  if (!d) return null;
  if (!d.thumbnailUrl || !d.audioUrl) {
    const media = await resolveMediaFromLinks(post);
    if (media.thumbnailUrl) d.thumbnailUrl = media.thumbnailUrl;
    if (media.audioUrl) d.audioUrl = media.audioUrl;
  }
  return d;
}

const CATEGORY_IDS: Record<DevotionalCategory, number> = {
  'daily-manna': 7,
  'sincere-milk': 8,
  'higher-everyday': 9,
};

/** Today's date as YYYY-MM-DD in local time (for matching post.date from API) */
function getTodayLocalDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Fetch recent posts for the category, then return the one matching today's date (user local). If none match (e.g. timezone or not yet published), use the most recent post so "Today" still shows something. */
export async function getTodaysDevotional(category: DevotionalCategory): Promise<Devotional | null> {
  const categoryId = CATEGORY_IDS[category];
  const list = await getPosts({
    categoryId,
    perPage: 14,
    page: 1,
    order: 'desc',
  });
  if (list.length === 0) return null;
  const today = getTodayLocalDateString();
  const found = list.find((d) => d.date.startsWith(today)) ?? list[0];
  // Fetch full post so we get thumbnail/audio from resolveMediaFromLinks when _embed didn't include them
  return getPostById(found.id);
}

/** Fetch recent posts (e.g. per_page=10) and return those that are from today, grouped by category */
export async function getTodaysPosts(): Promise<Record<DevotionalCategory, Devotional | null>> {
  const list = await getPosts({ perPage: 10, page: 1, order: 'desc' });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const result: Record<DevotionalCategory, Devotional | null> = {
    'daily-manna': null,
    'sincere-milk': null,
    'higher-everyday': null,
  };
  for (const d of list) {
    if (d.date.startsWith(today) && !result[d.category]) result[d.category] = d;
  }
  return result;
}
