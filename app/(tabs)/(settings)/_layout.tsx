import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = Colors[isDark ? 'dark' : 'light'].background;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings', headerLargeTitle: true }} />
    </Stack>
  );
}
