import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SearchStackLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = Colors[isDark ? 'dark' : 'light'].background;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Discover', headerLargeTitle: true }} />
      <Stack.Screen name="category/[category]" options={{ title: '' }} />
      <Stack.Screen name="devotional/[id]" options={{ title: 'Devotional' }} />
    </Stack>
  );
}
