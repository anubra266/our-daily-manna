import { Stack } from 'expo-router';

export default function LibraryStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Library', headerLargeTitle: true }} />
    </Stack>
  );
}
