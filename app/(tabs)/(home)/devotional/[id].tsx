import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAccentColor } from '@/contexts/accent-color';
import { useAudio } from '@/contexts/audio-context';
import { STREAK_QUERY_KEY, WEEK_STATUS_QUERY_KEY } from '@/hooks/use-streak';
import { getAdjacentIds, getPostById, isSaved, markAsRead, setSaved } from '@/lib/api/devotionals';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const DEVOTIONAL_PATH = '/(tabs)/(home)/devotional';

export default function DevotionalReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const idNum = id ? parseInt(id, 10) : 0;

  const { data: devotional, isLoading, isError } = useQuery({
    queryKey: ['devotional', idNum],
    queryFn: () => getPostById(idNum),
    enabled: idNum > 0,
  });

  const { data: saved = false } = useQuery({
    queryKey: ['saved', idNum],
    queryFn: () => isSaved(idNum),
    enabled: idNum > 0,
  });

  const { data: adjacent } = useQuery({
    queryKey: ['adjacent', devotional?.category, devotional?.date],
    queryFn: () => getAdjacentIds(devotional!.category, devotional!.date),
    enabled: !!devotional?.category && !!devotional?.date,
  });

  const { accent } = useAccentColor();
  const { setTrackAndPlay } = useAudio();

  useEffect(() => {
    if (devotional?.id) {
      markAsRead(devotional.id).then(() => {
        queryClient.invalidateQueries({ queryKey: STREAK_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: WEEK_STATUS_QUERY_KEY });
      });
    }
  }, [devotional?.id, queryClient]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          {devotional?.audioUrl ? (
            <Pressable
              hitSlop={12}
              onPress={() => setTrackAndPlay(devotional.audioUrl!, { title: devotional.title, postId: devotional.id })}
              style={styles.headerIconButton}
            >
              <Ionicons name="volume-high-outline" size={22} color={accent} />
            </Pressable>
          ) : null}
          <Pressable
            hitSlop={12}
            onPress={async () => {
              await setSaved(idNum, !saved, devotional ?? undefined);
              queryClient.invalidateQueries({ queryKey: ['saved', idNum] });
              queryClient.invalidateQueries({ queryKey: ['library'] });
            }}
            style={styles.headerIconButton}
          >
            <ThemedText style={styles.bookmarkIcon}>{saved ? '★' : '☆'}</ThemedText>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, idNum, saved, devotional?.audioUrl, queryClient, setTrackAndPlay, accent]);

  if (isLoading || !devotional) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Could not load this devotional.</ThemedText>
      </ThemedView>
    );
  }

  const dateFormatted = new Date(devotional.date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
     
      {devotional.thumbnailUrl ? (
        <Image source={{ uri: devotional.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
      ) : null}
      <ThemedText type="title" style={styles.title}>
        {devotional.title}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.date}>
        {dateFormatted}
      </ThemedText>

      {(devotional.keyVerseText || devotional.keyVerseRef) && (
        <View style={styles.keyVerse}>
          <ThemedText type="defaultSemiBold" style={styles.keyVerseLabel}>
            Key Verse
          </ThemedText>
          {devotional.keyVerseText ? (
            <ThemedText style={styles.keyVerseText}>"{devotional.keyVerseText}"</ThemedText>
          ) : null}
          {devotional.keyVerseRef ? (
            <ThemedText style={styles.keyVerseRef}>{devotional.keyVerseRef}</ThemedText>
          ) : null}
        </View>
      )}

      {devotional.message ? (
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>
            Message
          </ThemedText>
          <ThemedText style={styles.message}>{devotional.message}</ThemedText>
        </View>
      ) : null}

      {devotional.thoughtForDay ? (
        <View style={styles.thought}>
          <ThemedText type="defaultSemiBold" style={styles.thoughtLabel}>
            Thought for the day
          </ThemedText>
          <ThemedText style={styles.thoughtText}>{devotional.thoughtForDay}</ThemedText>
        </View>
      ) : null}

      {(adjacent?.prevId != null || adjacent?.nextId != null) && (
        <View style={styles.prevNextRow}>
          {adjacent?.prevId != null ? (
            <Pressable
              style={({ pressed }) => [styles.prevNextButton, pressed && styles.prevNextPressed]}
              onPress={() => router.push(`${DEVOTIONAL_PATH}/${adjacent.prevId}`)}
            >
              <Ionicons name="chevron-back" size={20} color={accent} />
              <ThemedText style={[styles.prevNextLabel, { color: accent }]}>Previous</ThemedText>
            </Pressable>
          ) : (
            <View style={styles.prevNextPlaceholder} />
          )}
          {adjacent?.nextId != null ? (
            <Pressable
              style={({ pressed }) => [styles.prevNextButton, pressed && styles.prevNextPressed]}
              onPress={() => router.push(`${DEVOTIONAL_PATH}/${adjacent.nextId}`)}
            >
              <ThemedText style={[styles.prevNextLabel, { color: accent }]}>Next</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={accent} />
            </Pressable>
          ) : (
            <View style={styles.prevNextPlaceholder} />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconButton: { padding: 8 },
  bookmarkIcon: { fontSize: 22 },
  thumbnail: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  title: { marginBottom: 4 },
  date: { opacity: 0.8, marginBottom: 8 },
  keyVerse: {
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#0a7ea4',
  },
  keyVerseLabel: { opacity: 0.9 },
  keyVerseText: { fontStyle: 'italic' },
  keyVerseRef: { opacity: 0.8 },
  section: { gap: 8 },
  sectionLabel: { opacity: 0.9 },
  message: { lineHeight: 24 },
  thought: {
    padding: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(10, 126, 164, 0.12)',
    gap: 6,
  },
  thoughtLabel: { opacity: 0.9 },
  thoughtText: { fontStyle: 'italic', lineHeight: 22 },
  prevNextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  prevNextButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prevNextPressed: { opacity: 0.7 },
  prevNextLabel: { fontSize: 15 },
  prevNextPlaceholder: { width: 80 },
});
