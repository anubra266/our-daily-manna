import { Stack } from 'expo-router';

export default function SearchStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Discover', headerLargeTitle: true }} />
      <Stack.Screen name="category/[category]" options={{ title: '' }} />
      <Stack.Screen name="devotional/[id]" options={{ title: 'Devotional' }} />
    </Stack>
  );
}
