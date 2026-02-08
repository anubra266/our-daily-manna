import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { getPosts } from '@/lib/api/devotionals';
import { formatListDate } from '@/lib/utils/format-date';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DevotionalCategory } from '@/lib/types/devotional';
import { DEVOTIONAL_CATEGORY_LABELS } from '@/lib/types/devotional';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const CATEGORY_IDS: Record<DevotionalCategory, number> = {
  'daily-manna': 7,
  'sincere-milk': 8,
  'higher-everyday': 9,
};

export default function CategoryFeedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { category } = useLocalSearchParams<{ category: string }>();
  const slug = (category ?? 'daily-manna') as DevotionalCategory;
  const categoryId = CATEGORY_IDS[slug] ?? 7;

  const placeholderIconColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';
  const placeholderBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (slug && DEVOTIONAL_CATEGORY_LABELS[slug]) {
      navigation.setOptions({ title: DEVOTIONAL_CATEGORY_LABELS[slug] });
    }
  }, [slug, navigation]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: ['posts', categoryId],
    queryFn: ({ pageParam = 1 }) => getPosts({ categoryId, perPage: 20, page: pageParam }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 20 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  });

  const items = data?.pages.flat() ?? [];

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load devotionals.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.list}
      onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={isFetchingNextPage ? <ThemedText style={styles.footer}>Loading more…</ThemedText> : null}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => router.push(`/(tabs)/(search)/devotional/${item.id}`)}
        >
          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: placeholderBg }]}>
              <Ionicons name="book-outline" size={24} color={placeholderIconColor} />
            </View>
          )}
          <View style={styles.rowText}>
            <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.rowTitle}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.date}>
              {formatListDate(item.date)}
            </ThemedText>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    gap: 12,
  },
  rowPressed: { opacity: 0.7 },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 15 },
  date: { fontSize: 12, opacity: 0.65 },
  footer: { padding: 16, textAlign: 'center', opacity: 0.7 },
});
