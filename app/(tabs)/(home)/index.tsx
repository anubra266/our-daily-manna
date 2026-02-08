import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { getTodaysDevotional } from '@/lib/api/devotionals';
import { useAccentColor } from '@/contexts/accent-color';
import { usePreferredCategory } from '@/hooks/use-preferred-category';
import { useWeekStatus } from '@/hooks/use-streak';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { DevotionalCategory } from '@/lib/types/devotional';
import { DEVOTIONAL_CATEGORY_LABELS, DEVOTIONAL_CATEGORY_AUDIENCE } from '@/lib/types/devotional';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const CATEGORIES: DevotionalCategory[] = ['sincere-milk', 'higher-everyday', 'daily-manna'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  const { accent } = useAccentColor();
  const { preferredCategory, setPreferredCategory, isLoaded, hasChosenCategory } = usePreferredCategory();
  const { data: devotional, isLoading, isError, error } = useQuery({
    queryKey: ['todays', preferredCategory],
    queryFn: () => getTodaysDevotional(preferredCategory),
    enabled: isLoaded,
  });
  const { data: weekStatus } = useWeekStatus();

  const greeting = useMemo(() => getGreeting(), []);
  const streak = weekStatus?.streak ?? 0;
  const weekDays = weekStatus?.days ?? [];

  if (!isLoaded) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!hasChosenCategory) {
    const cardBg = theme.card ?? (isDark ? '#0D0D0D' : '#F2F2F7');
    const mutedColor = theme.muted ?? theme.icon;
    return (
      <ThemedView style={styles.onboarding}>
        <ThemedText type="title" style={[styles.onboardingTitle, { color: theme.text }]}>
          Choose Your Devotional
        </ThemedText>
        <ThemedText style={[styles.onboardingHint, { color: mutedColor }]}>
          Select the plan that fits your spiritual journey. You can change this anytime.
        </ThemedText>
        <View style={styles.onboardingCards}>
          {CATEGORIES.map((slug) => (
            <Pressable
              key={slug}
              style={({ pressed }) => [
                styles.onboardingCard,
                { backgroundColor: cardBg },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setPreferredCategory(slug)}
            >
              <ThemedText type="defaultSemiBold" style={[styles.onboardingCardTitle, { color: theme.text }]}>
                {DEVOTIONAL_CATEGORY_LABELS[slug]}
              </ThemedText>
              <ThemedText style={[styles.onboardingCardAudience, { color: mutedColor }]}>
                {DEVOTIONAL_CATEGORY_AUDIENCE[slug]}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading today's devotional…</ThemedText>
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="defaultSemiBold">Could not load devotional</ThemedText>
        <ThemedText style={styles.errorText}>{error?.message ?? 'Unknown error'}</ThemedText>
      </ThemedView>
    );
  }

  if (!devotional) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No devotional for today yet. Check back later.</ThemedText>
      </ThemedView>
    );
  }

  const dateFormatted = new Date(devotional.date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const cardBg = theme.card ?? (isDark ? '#0D0D0D' : '#F2F2F7');
  const cardBgAlt = theme.cardAlt ?? (isDark ? '#141414' : '#E5E5EA');
  const mutedColor = theme.muted ?? theme.icon;

  const readMinutes = useMemo(
    () =>
      estimateReadMinutes(
        [devotional.message, devotional.thoughtForDay, devotional.keyVerseText].filter(Boolean).join(' ')
      ),
    [devotional.message, devotional.thoughtForDay, devotional.keyVerseText]
  );
  const previewText = useMemo(() => {
    const msg = devotional.message?.trim() ?? '';
    const first = msg.split(/\n\n/)[0] ?? msg;
    return first.length > 180 ? first.slice(0, 177) + '…' : first || devotional.keyVerseText?.slice(0, 120) + '…' || '—';
  }, [devotional.message, devotional.keyVerseText]);

  const topPad = insets.top + 8;
  const sectionMargin = 20;
  const horizontalMargin = 20;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Header: date + greeting only */}
      <View style={[styles.header, { paddingTop: topPad, paddingHorizontal: horizontalMargin }]}>
        <ThemedText style={[styles.headerDate, { color: mutedColor }]}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </ThemedText>
        <ThemedText type="title" style={[styles.headerGreeting, { color: theme.text }]}>
          {greeting}
        </ThemedText>
      </View>

      {/* Your Week — compact, same margin */}
      {weekDays.length > 0 && (
        <View style={[styles.weekCard, { marginHorizontal: horizontalMargin, marginTop: sectionMargin, backgroundColor: cardBg }]}>
          <View style={styles.weekHeader}>
            <ThemedText type="defaultSemiBold" style={[styles.weekTitle, { color: theme.text }]}>
              Your Week
            </ThemedText>
            {streak > 0 && (
              <View style={styles.weekStreakRow}>
                <Ionicons name="flame" size={16} color={accent} />
                <ThemedText type="defaultSemiBold" style={[styles.weekStreak, { color: accent }]}>
                  {streak} day{streak !== 1 ? 's' : ''} streak
                </ThemedText>
              </View>
            )}
          </View>
          <View style={styles.weekDays}>
            {weekDays.map((day) => (
              <View key={day.date} style={styles.weekDay}>
                <ThemedText style={[styles.weekDayLabel, { color: mutedColor }]}>{day.label}</ThemedText>
                <View
                  style={[
                    styles.weekDayCircle,
                    { backgroundColor: day.read ? accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') },
                  ]}
                >
                  {day.read ? <ThemedText style={styles.weekDayCheck}>✓</ThemedText> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Today's Reading — single hero card */}
      <View style={[styles.section, { marginHorizontal: horizontalMargin, marginTop: sectionMargin }]}>
        <View style={styles.sectionTitleRow}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: theme.text }]}>
            Today's Reading
          </ThemedText>
          <View style={styles.readTimeRow}>
            <Ionicons name="time-outline" size={14} color={mutedColor} />
            <ThemedText style={[styles.readTimeText, { color: mutedColor }]}>{readMinutes} min read</ThemedText>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.readingCard, { backgroundColor: cardBg }, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/(tabs)/(home)/devotional/${devotional.id}`)}
        >
          <View style={styles.readingCardInner}>
            <View style={styles.readingCardThumbWrap}>
              {devotional.thumbnailUrl ? (
                <Image source={{ uri: devotional.thumbnailUrl }} style={styles.readingCardThumb} contentFit="cover" />
              ) : (
                <View style={[styles.readingCardThumb, styles.readingCardThumbPlaceholder, { backgroundColor: cardBgAlt }]}>
                  <Ionicons name="book-outline" size={28} color={mutedColor} />
                </View>
              )}
            </View>
            <View style={styles.readingCardBody}>
              <ThemedText style={[styles.readingCardMeta, { color: mutedColor }]}>
                {DEVOTIONAL_CATEGORY_LABELS[devotional.category]} · {dateFormatted}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.readingCardTitle, { color: theme.text }]} numberOfLines={2}>
                {devotional.title}
              </ThemedText>
              {devotional.keyVerseRef ? (
                <ThemedText style={[styles.readingCardRef, { color: mutedColor }]} numberOfLines={1}>
                  {devotional.keyVerseRef}
                </ThemedText>
              ) : null}
            </View>
          </View>
          <ThemedText style={[styles.readingCardPreview, { color: theme.text }]} numberOfLines={3}>
            {previewText}
          </ThemedText>
          <View style={styles.continueRow}>
            <Ionicons name="book-outline" size={18} color={accent} />
            <ThemedText type="defaultSemiBold" style={[styles.continueText, { color: accent }]}>
              Continue Reading
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={accent} />
          </View>
        </Pressable>
      </View>

      {/* Verse of the day */}
      <View style={[styles.verseCard, { marginHorizontal: horizontalMargin, marginTop: sectionMargin, backgroundColor: cardBgAlt }]}>
        <ThemedText type="defaultSemiBold" style={[styles.verseCardHeader, { color: mutedColor }]}>
          Verse of the day
        </ThemedText>
        <ThemedText style={[styles.verseText, { color: theme.text }]}>
          {devotional.keyVerseText || '—'}
        </ThemedText>
        {devotional.keyVerseRef ? (
          <ThemedText style={[styles.verseRef, { color: mutedColor }]}>{devotional.keyVerseRef}</ThemedText>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: { marginTop: 8 },
  errorText: { marginTop: 4, opacity: 0.8 },
  onboarding: { flex: 1, padding: 24, justifyContent: 'center', paddingVertical: 32 },
  onboardingTitle: { textAlign: 'center', marginBottom: 8 },
  onboardingHint: { textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  onboardingCards: { gap: 12 },
  onboardingCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  onboardingCardTitle: { fontSize: 18 },
  onboardingCardAudience: { fontSize: 14, marginTop: 4, opacity: 0.9 },
  buttonPressed: { opacity: 0.85 },

  header: {
    paddingBottom: 4,
  },
  headerDate: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerGreeting: { fontSize: 26, marginTop: 2 },

  section: {},
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18 },

  weekCard: {
    padding: 18,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekTitle: { fontSize: 17 },
  weekStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekStreak: { fontSize: 14 },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  weekDay: {
    alignItems: 'center',
    flex: 1,
  },
  weekDayLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  weekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayCheck: { color: '#fff', fontSize: 16, fontWeight: '700' },

  readTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTimeText: { fontSize: 13 },
  readingCard: {
    padding: 16,
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  readingCardInner: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  readingCardThumbWrap: { flexShrink: 0 },
  readingCardThumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
  },
  readingCardThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  readingCardBody: { flex: 1, justifyContent: 'center', minWidth: 0 },
  readingCardMeta: { fontSize: 12, marginBottom: 4 },
  readingCardTitle: { fontSize: 18, lineHeight: 24 },
  readingCardRef: { fontSize: 13, marginTop: 4 },
  readingCardPreview: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
    marginBottom: 14,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  continueText: { fontSize: 15 },
  buttonText: { color: '#fff' },

  verseCard: {
    padding: 18,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  verseCardHeader: { fontSize: 13, marginBottom: 10 },
  verseText: { fontSize: 16, lineHeight: 24, fontStyle: 'italic' },
  verseRef: { fontSize: 13, marginTop: 8 },
});
