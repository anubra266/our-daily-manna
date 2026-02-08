import { useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AccentColorProvider } from '@/contexts/accent-color';
import { AudioProvider } from '@/contexts/audio-context';
import { PreferredCategoryProvider } from '@/contexts/preferred-category';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getTodaysDevotional } from '@/lib/api/devotionals';
import type { DevotionalCategory } from '@/lib/types/devotional';

const TODAY_CATEGORIES: DevotionalCategory[] = ['sincere-milk', 'higher-everyday', 'daily-manna'];

function PrefetchTodays() {
  const queryClient = useQueryClient();
  useEffect(() => {
    TODAY_CATEGORIES.forEach((category) => {
      queryClient.prefetchQuery({
        queryKey: ['todays', category],
        queryFn: () => getTodaysDevotional(category),
      });
    });
  }, [queryClient]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AccentColorProvider>
        <AudioProvider>
          <PreferredCategoryProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <PrefetchTodays />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </PreferredCategoryProvider>
        </AudioProvider>
      </AccentColorProvider>
    </QueryClientProvider>
  );
}
