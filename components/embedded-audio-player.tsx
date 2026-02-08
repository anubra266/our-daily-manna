import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { useAccentColor } from '@/contexts/accent-color';
import { formatTime, useAudio } from '@/contexts/audio-context';
import { ThemedText } from '@/components/themed-text';

export function EmbeddedAudioPlayer({ uri }: { uri: string }) {
  const accent = useAccentColor().accent;
  const {
    currentUri,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    toggle,
    seekTo,
    seekBack,
    seekForward,
    setTrackAndPlay,
  } = useAudio();
  const [trackWidth, setTrackWidth] = useState(0);

  const isActiveTrack = currentUri === uri;

  const handleSeek = useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      if (!trackWidth || duration <= 0) return;
      const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidth));
      seekTo(ratio * duration);
    },
    [duration, seekTo, trackWidth]
  );

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  if (!uri) return null;

  // This devotional is not the current track: show a single "Play" button that starts it in the bottom accessory
  if (!isActiveTrack) {
    return (
      <View style={[styles.wrapper, { borderColor: accent }]}>
        <Pressable
          style={({ pressed }) => [styles.playOnlyButton, pressed && styles.buttonPressed]}
          onPress={() => setTrackAndPlay(uri)}
        >
          <Ionicons name="play" size={24} color={accent} />
          <ThemedText type="defaultSemiBold" style={[styles.buttonLabel, { color: accent }]}>
            Play audio
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  // This devotional is the current track: show full mini player controls (same state as bottom accessory)
  return (
    <View style={[styles.wrapper, { borderColor: accent }]}>
      <View style={styles.controlsRow}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          onPress={seekBack}
          disabled={isLoading || duration <= 0}
        >
          <Ionicons name="play-back" size={22} color={accent} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.playPauseButton, { borderColor: accent }, pressed && styles.buttonPressed]}
          onPress={toggle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={accent} />
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          onPress={seekForward}
          disabled={isLoading || duration <= 0}
        >
          <Ionicons name="play-forward" size={22} color={accent} />
        </Pressable>
      </View>

      <View style={styles.progressSection}>
        <ThemedText style={[styles.timeText, { color: accent }]} numberOfLines={1}>
          {formatTime(currentTime)}
        </ThemedText>
        <Pressable
          style={styles.trackWrap}
          onLayout={onTrackLayout}
          onPress={handleSeek}
          disabled={isLoading || duration <= 0}
        >
          <View style={[styles.track, { backgroundColor: `${accent}20` }]}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
          </View>
        </Pressable>
        <ThemedText style={[styles.timeText, { color: accent }]} numberOfLines={1}>
          {formatTime(duration)}
        </ThemedText>
      </View>

      <ThemedText type="defaultSemiBold" style={[styles.label, { color: accent }]}>
        {isLoading ? 'Loading…' : isPlaying ? 'Pause' : 'Play audio'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  playOnlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: { fontSize: 16 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  iconButton: { padding: 8 },
  playPauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    minWidth: 32,
    textAlign: 'center',
  },
  trackWrap: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
