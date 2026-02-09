import { Ionicons } from "@expo/vector-icons";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

import { MiniAudioPlayer } from "@/components/mini-audio-player";
import { useAccentColor } from "@/contexts/accent-color";
import { useAudio } from "@/contexts/audio-context";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function TabLayout() {
  const { accent } = useAccentColor();
  const { currentUri } = useAudio();
  const tabsColor = useThemeColor({}, "tabsColor");

  return (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      iconColor={{
        default: tabsColor,
        selected: accent,
      }}
    >
      {currentUri ? (
        <NativeTabs.BottomAccessory>
          <MiniAudioPlayer />
        </NativeTabs.BottomAccessory>
      ) : null}
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name={"home-outline"}
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon family={Ionicons} name={"home"} />
            ),
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(library)">
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name={"book-outline"}
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon family={Ionicons} name={"book"} />
            ),
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name="search-outline"
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon family={Ionicons} name="search" />
            ),
          }}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={{
            default: (
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name={"settings-outline"}
              />
            ),
            selected: (
              <NativeTabs.Trigger.VectorIcon
                family={Ionicons}
                name={"settings"}
              />
            ),
          }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
