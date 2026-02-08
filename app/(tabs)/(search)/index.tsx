import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Link, Stack, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useAccentColor } from "@/contexts/accent-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { searchCached } from "@/lib/api/devotionals";
import type { DevotionalCategory } from "@/lib/types/devotional";
import {
  DEVOTIONAL_CATEGORY_DESCRIPTION,
  DEVOTIONAL_CATEGORY_LABELS,
} from "@/lib/types/devotional";
import { formatListDate } from "@/lib/utils/format-date";
import { GlassContainerRow, GlassPill } from "@/components/glass-pill";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const CATEGORIES: DevotionalCategory[] = [
  "sincere-milk",
  "higher-everyday",
  "daily-manna",
];

const SEARCH_FILTER_OPTIONS: {
  value: DevotionalCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All" },
  ...CATEGORIES.map((slug) => ({
    value: slug,
    label: DEVOTIONAL_CATEGORY_LABELS[slug],
  })),
];

const CATEGORY_ICONS: Record<
  DevotionalCategory,
  "heart" | "flame" | "book-outline"
> = {
  "sincere-milk": "heart",
  "higher-everyday": "flame",
  "daily-manna": "book-outline",
};

const AUDIENCE_PILL: Record<DevotionalCategory, string> = {
  "sincere-milk": "CHILDREN",
  "higher-everyday": "YOUTHS",
  "daily-manna": "ADULTS",
};

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = Colors[isDark ? "dark" : "light"];
  const { accent } = useAccentColor();
  const [query, setQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<
    DevotionalCategory | "all"
  >("all");
  const mutedColor = theme.muted ?? theme.icon;
  const cardBg = theme.card ?? (isDark ? "#0D0D0D" : "#F2F2F7");

  const {
    data: items = [],
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["search", query, searchCategory],
    queryFn: () =>
      searchCached(
        query,
        40,
        searchCategory === "all" ? undefined : searchCategory
      ),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60,
  });

  const placeholderIconColor = isDark
    ? "rgba(255,255,255,0.2)"
    : "rgba(0,0,0,0.12)";
  const placeholderBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: {
        id: number;
        title: string;
        date: string;
        category: DevotionalCategory;
        thumbnailUrl?: string;
      };
    }) => (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push(`/(tabs)/(search)/devotional/${item.id}`)}
      >
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbPlaceholder,
              { backgroundColor: placeholderBg },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={24}
              color={placeholderIconColor}
            />
          </View>
        )}
        <View style={styles.rowText}>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={2}
            style={styles.rowTitle}
          >
            {item.title}
          </ThemedText>
          <View style={styles.rowMeta}>
            <ThemedText style={styles.date}>
              {formatListDate(item.date)}
            </ThemedText>
            <ThemedText style={styles.cat}>
              {DEVOTIONAL_CATEGORY_LABELS[item.category]}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    ),
    [router, placeholderIconColor, placeholderBg]
  );

  const showDiscovery = query.trim().length < 2;

  return (
    <>
      <Stack.SearchBar
        placement="automatic"
        placeholder="Search devotionals…"
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
      />
      <ThemedView style={styles.container}>
        {showDiscovery ? (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText
              style={[styles.discoverySubtext, { color: mutedColor }]}
            >
              Browse by category
            </ThemedText>
            <View style={styles.categoryCards}>
              {CATEGORIES.map((slug) => (
                <Link
                  key={slug}
                  href={`/(tabs)/(search)/category/${slug}`}
                  asChild
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.categoryCard,
                      { backgroundColor: cardBg },
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryCardIconWrap,
                        {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : `${accent}18`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[slug]}
                        size={28}
                        color={accent}
                      />
                    </View>
                    <View style={styles.categoryCardBody}>
                      <View style={styles.categoryCardTopRow}>
                        <View style={styles.categoryCardTitleBlock}>
                          <ThemedText
                            type="defaultSemiBold"
                            style={[
                              styles.categoryCardTitle,
                              { color: theme.text },
                            ]}
                            numberOfLines={1}
                          >
                            {DEVOTIONAL_CATEGORY_LABELS[slug]}
                          </ThemedText>
                          <View
                            style={[
                              styles.categoryPill,
                              {
                                backgroundColor: isDark
                                  ? "rgba(255,255,255,0.12)"
                                  : "rgba(0,0,0,0.08)",
                              },
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.categoryPillText,
                                { color: mutedColor },
                              ]}
                              numberOfLines={1}
                            >
                              {AUDIENCE_PILL[slug]}
                            </ThemedText>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={mutedColor}
                        />
                      </View>
                      <ThemedText
                        style={[
                          styles.categoryCardDescription,
                          { color: mutedColor },
                        ]}
                        numberOfLines={2}
                      >
                        {DEVOTIONAL_CATEGORY_DESCRIPTION[slug]}
                      </ThemedText>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </View>
          </ScrollView>
        ) : query.trim().length > 0 && query.trim().length < 2 ? (
          <View style={styles.centered}>
            <ThemedText style={styles.hint}>
              Type at least 2 characters
            </ThemedText>
          </View>
        ) : isLoading || isFetching ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <ThemedText style={styles.hint}>
              No results. Read more to build your cache.
            </ThemedText>
          </View>
        ) : (
          <SectionList
            sections={[{ data: items, key: "results" }]}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            stickySectionHeadersEnabled
            contentContainerStyle={styles.list}
            contentInsetAdjustmentBehavior="automatic"
            renderSectionHeader={() => (
              <View
                style={[
                  styles.searchFilterSectionHeader,
                  {
                    backgroundColor:
                      theme.background ?? (isDark ? "#000000" : "#FFFFFF"),
                    paddingTop: insets.top + 8,
                  },
                ]}
              >
                <View style={styles.searchFilterRow}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.searchFilterScroll}
                  >
                    <GlassContainerRow spacing={10}>
                      {SEARCH_FILTER_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => setSearchCategory(opt.value)}
                        >
                          <GlassPill
                            isInteractive
                            fallbackBackgroundColor={
                              searchCategory === opt.value
                                ? accent
                                : isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.06)"
                            }
                            tintColor={
                              searchCategory === opt.value ? accent : undefined
                            }
                          >
                            <ThemedText
                              type="defaultSemiBold"
                              style={
                                searchCategory === opt.value
                                  ? styles.searchFilterChipTextActive
                                  : styles.searchFilterChipText
                              }
                            >
                              {opt.label}
                            </ThemedText>
                          </GlassPill>
                        </Pressable>
                      ))}
                    </GlassContainerRow>
                  </ScrollView>
                </View>
                <ThemedText style={styles.resultCount}>
                  {items.length} result{items.length !== 1 ? "s" : ""}
                </ThemedText>
              </View>
            )}
          />
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  discoverySubtext: { fontSize: 15, marginBottom: 16 },
  categoryCards: { gap: 24 },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderCurve: "continuous",
    gap: 14,
  },
  categoryCardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardBody: { flex: 1, minWidth: 0 },
  categoryCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  categoryCardTitleBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  categoryCardTitle: { fontSize: 17 },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryPillText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  categoryCardDescription: { fontSize: 13, lineHeight: 18 },
  list: { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
    gap: 12,
  },
  rowPressed: { opacity: 0.7 },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 15 },
  rowMeta: { flexDirection: "row", gap: 10, alignItems: "center" },
  date: { fontSize: 12, opacity: 0.65 },
  cat: { fontSize: 11, opacity: 0.55 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hint: { opacity: 0.7, textAlign: "center" },
  resultCount: { marginBottom: 12, fontSize: 14, opacity: 0.7 },
  searchFilterSectionHeader: { paddingTop: 8 },
  searchFilterRow: { paddingBottom: 12 },
  searchFilterScroll: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  searchFilterChipText: { fontSize: 14 },
  searchFilterChipTextActive: { fontSize: 14, color: "#fff" },
});
