import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
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
  const router = useRouter();
  const {
    currentUri,
    currentTrackTitle,
    currentPostId,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    progress,
    toggle,
  } = useAudio();
  const openDevotional = useCallback(() => {
    if (currentPostId != null) {
      router.push(`/(tabs)/(home)/devotional/${currentPostId}`);
    }
  }, [currentPostId, router]);

  if (!currentUri) return null;

  const showSeekBar = placement !== "inline";

  const canOpenDevotional = currentPostId != null;

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.mainTapArea}
        onPress={openDevotional}
        disabled={!canOpenDevotional}
      >
        {showSeekBar && (
          <View style={styles.seekBarWrap}>
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
          </View>
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
        </View>
      </Pressable>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    flex: 1,
    borderRadius: 40,
  },
  mainTapArea: {
    flex: 1,
    minWidth: 0,
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
