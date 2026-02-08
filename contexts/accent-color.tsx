import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ACCENT_COLOR_KEY } from '@/lib/constants/storage-keys';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const ACCENT_PRESETS = [
  { id: 'teal', name: 'Teal', light: '#0a7ea4', dark: '#5ac8fa' },
  { id: 'blue', name: 'Blue', light: '#007AFF', dark: '#0a84ff' },
  { id: 'indigo', name: 'Indigo', light: '#5856D6', dark: '#7d7aff' },
  { id: 'green', name: 'Green', light: '#34C759', dark: '#30d158' },
  { id: 'orange', name: 'Orange', light: '#FF9500', dark: '#ff9f0a' },
  { id: 'red', name: 'Red', light: '#FF3B30', dark: '#ff453a' },
] as const;

const DEFAULT_PRESET_ID = ACCENT_PRESETS[0].id;

export function getAccentForPreset(presetId: string, isDark: boolean): string {
  const preset = ACCENT_PRESETS.find((p) => p.id === presetId);
  if (!preset) return ACCENT_PRESETS[0][isDark ? 'dark' : 'light'];
  return isDark ? preset.dark : preset.light;
}

type AccentContextValue = {
  accent: string;
  selectedPresetId: string | null;
  setAccent: (presetId: string) => Promise<void>;
  isLoaded: boolean;
};

const AccentColorContext = React.createContext<AccentContextValue | null>(null);

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [presetId, setPresetId] = useState<string | null>(DEFAULT_PRESET_ID);
  const [legacyHex, setLegacyHex] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ACCENT_COLOR_KEY).then((value) => {
      if (value == null || value === '') {
        setPresetId(DEFAULT_PRESET_ID);
        setLegacyHex(null);
        setIsLoaded(true);
        return;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        const matched = ACCENT_PRESETS.find((p) => p.light === value || p.dark === value);
        if (matched) {
          setPresetId(matched.id);
          setLegacyHex(null);
          AsyncStorage.setItem(ACCENT_COLOR_KEY, matched.id);
        } else {
          setPresetId(null);
          setLegacyHex(value);
        }
      } else {
        const exists = ACCENT_PRESETS.some((p) => p.id === value);
        setPresetId(exists ? value : DEFAULT_PRESET_ID);
        setLegacyHex(null);
        if (!exists) AsyncStorage.setItem(ACCENT_COLOR_KEY, DEFAULT_PRESET_ID);
      }
      setIsLoaded(true);
    });
  }, []);

  const accent = useMemo(() => {
    if (presetId) return getAccentForPreset(presetId, isDark);
    if (legacyHex) return legacyHex;
    return getAccentForPreset(DEFAULT_PRESET_ID, isDark);
  }, [presetId, legacyHex, isDark]);

  const setAccent = useCallback(async (nextPresetId: string) => {
    if (!ACCENT_PRESETS.some((p) => p.id === nextPresetId)) return;
    await AsyncStorage.setItem(ACCENT_COLOR_KEY, nextPresetId);
    setPresetId(nextPresetId);
    setLegacyHex(null);
  }, []);

  const selectedPresetId = presetId ?? (legacyHex ? null : DEFAULT_PRESET_ID);

  return (
    <AccentColorContext.Provider value={{ accent, selectedPresetId, setAccent, isLoaded }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor(): AccentContextValue {
  const ctx = useContext(AccentColorContext);
  const isDark = useColorScheme() === 'dark';
  const fallbackAccent = getAccentForPreset(DEFAULT_PRESET_ID, isDark);
  if (!ctx) {
    return {
      accent: fallbackAccent,
      selectedPresetId: DEFAULT_PRESET_ID,
      setAccent: async () => {},
      isLoaded: true,
    };
  }
  return ctx;
}
