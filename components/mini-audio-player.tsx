import { Ionicons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useAccentColor } from "@/contexts/accent-color";
import { formatTime, useAudio } from "@/contexts/audio-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";

export function MiniAudioPlayer() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = Colors[isDark ? "dark" : "light"];
  const accent = useAccentColor().accent;
  const {
    currentUri,
    currentTrackTitle,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    seekTo,
    toggle,
  } = useAudio();
  const [trackWidth, setTrackWidth] = useState(0);

  const onSeekBarLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const handleSeek = useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      if (!trackWidth || duration <= 0) return;
      const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidth));
      seekTo(ratio * duration);
    },
    [duration, seekTo, trackWidth]
  );

  if (!currentUri) return null;

  const showSeekBar = placement !== "inline";

  return (
    <View style={styles.container}>
      {showSeekBar && (
        <Pressable
          style={styles.seekBarWrap}
          onLayout={onSeekBarLayout}
          onPress={handleSeek}
          disabled={isLoading || duration <= 0}
        >
          <View
            style={[
              styles.seekBarTrack,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <View
              style={[
                styles.seekBarFill,
                { width: `${progress * 100}%`, backgroundColor: accent },
              ]}
            />
          </View>
        </Pressable>
      )}
      <View style={styles.row}>
      <View
        style={[
          styles.art,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <Ionicons name="musical-notes" size={18} color={theme.text} />
      </View>
      <View style={styles.textWrap}>
        <ThemedText
          type="defaultSemiBold"
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
        >
          {currentTrackTitle || "Now playing"}
        </ThemedText>
        <ThemedText
          style={[styles.time, { color: theme.muted ?? theme.icon }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </ThemedText>
      </View>
      <Pressable
        hitSlop={10}
        style={({ pressed }) => [
          styles.playBtn,
          pressed && styles.pressed,
        ]}
        onPress={toggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.text} />
        ) : (
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color={theme.text}
          />
        )}
      </Pressable>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flex: 1,
    borderRadius: 40,
  },
  seekBarWrap: {
    height: 4,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  seekBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  seekBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    paddingHorizontal: 15,
    paddingVertical: 5,
    gap: 10,
    flex: 1,
  },
  art: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 0,
  },
  title: { fontSize: 12, lineHeight: 16 },
  time: { fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8 },
});
