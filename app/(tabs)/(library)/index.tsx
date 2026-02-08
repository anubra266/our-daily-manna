import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Fragment, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { getAllCached } from "@/lib/api/devotionals";
import { formatListDate } from "@/lib/utils/format-date";
import { useAccentColor } from "@/contexts/accent-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { DevotionalCategory } from "@/lib/types/devotional";
import { DEVOTIONAL_CATEGORY_LABELS } from "@/lib/types/devotional";
import { GlassContainerRow, GlassPill } from "@/components/glass-pill";
import { ThemedText } from "@/components/themed-text";

const CATEGORIES: { value: DevotionalCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sincere-milk", label: DEVOTIONAL_CATEGORY_LABELS["sincere-milk"] },
  {
    value: "higher-everyday",
    label: DEVOTIONAL_CATEGORY_LABELS["higher-everyday"],
  },
  { value: "daily-manna", label: DEVOTIONAL_CATEGORY_LABELS["daily-manna"] },
];

export default function LibraryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { accent } = useAccentColor();
  const [category, setCategory] = useState<DevotionalCategory | "all">("all");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["library", category],
    queryFn: () =>
      getAllCached({
        savedOnly: true,
        category: category === "all" ? undefined : category,
        limit: 100,
      }),
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
        onPress={() => router.push(`/(tabs)/(home)/devotional/${item.id}`)}
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

  const filterRow = (
    <View
      style={[
        styles.filterRow,
        { backgroundColor: Colors[isDark ? "dark" : "light"].background },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <GlassContainerRow spacing={10}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.value} onPress={() => setCategory(c.value)}>
              <GlassPill
                isInteractive
                fallbackBackgroundColor={
                  category === c.value
                    ? accent
                    : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)"
                }
                tintColor={category === c.value ? accent : undefined}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={
                    category === c.value
                      ? styles.filterChipTextActive
                      : styles.filterChipText
                  }
                >
                  {c.label}
                </ThemedText>
              </GlassPill>
            </Pressable>
          ))}
        </GlassContainerRow>
      </ScrollView>
    </View>
  );

  const listContent = isLoading ? (
    <View style={styles.centered}>
      <ActivityIndicator size="small" />
    </View>
  ) : items.length === 0 ? (
    <View style={styles.emptyWrap}>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        No saved devotionals
      </ThemedText>
      <ThemedText style={styles.emptyHint}>
        Tap the bookmark in a devotional to save it here.
      </ThemedText>
    </View>
  ) : (
    <View style={styles.list}>
      {items.map((item) => (
        <Fragment key={item.id}>{renderItem({ item })}</Fragment>
      ))}
    </View>
  );

  const screenBg = Colors[isDark ? "dark" : "light"].background;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: screenBg }]}
      contentContainerStyle={[
        styles.scrollContent,
        // items.length === 0 && styles.scrollContentEmpty,
      ]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={true}
      stickyHeaderIndices={[0]}
    >
      {filterRow}
      {listContent}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  // scrollContentEmpty: { flexGrow: 1 },
  filterRow: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  filterChipText: { fontSize: 14 },
  filterChipTextActive: { fontSize: 14, color: "#fff" },
  list: { paddingHorizontal: 16 },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
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
    gap: 8,
  },
  emptyTitle: { textAlign: "center" },
  emptyHint: { textAlign: "center", opacity: 0.7, fontSize: 14 },
});
