import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = Colors[isDark ? 'dark' : 'light'].background;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Today' }} />
      <Stack.Screen name="devotional/[id]" options={{ title: 'Devotional' }} />
    </Stack>
  );
}
