import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'Today' }} />
      <Stack.Screen name="devotional/[id]" options={{ title: 'Devotional' }} />
    </Stack>
  );
}
