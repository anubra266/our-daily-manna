# Our Daily Manna

A cross-platform devotional app built with Expo. Read daily devotionals, browse by category, save favorites, and listen to audio—with a daily reminder to keep you consistent.

## Features

- **Today’s devotional** — Focused home view with the current day’s reading
- **Discover** — Browse devotionals by category with search and filter pills
- **Library** — Save devotionals for later and access them quickly
- **Reader** — Clean reading experience with key verse, message, and thought for the day; previous/next navigation within the same category
- **Audio** — Play devotional audio when available, with a persistent mini player
- **Daily reminder** — Optional push notification at your chosen time (category-aware)
- **Streaks** — Track reading consistency
- **Theming** — Light/dark mode and accent color

## Tech stack

- [Expo](https://expo.dev) (SDK 55) with [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- React 19, React Native
- [TanStack Query](https://tanstack.com/query/latest) for data fetching and cache
- SQLite (expo-sqlite) for offline caching
- expo-notifications for daily reminders
- expo-audio for devotional playback
- EAS Build & Submit for iOS and Android

## Getting started

### Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- [Expo Go](https://expo.dev/go) (optional, for quick testing) or a [development build](https://docs.expo.dev/develop/development-builds/introduction/)

### Install and run

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start
```

Then:

- Press **i** for iOS simulator or **a** for Android emulator  
- Or scan the QR code with Expo Go (with limitations; some features need a dev build)

For a full development build (notifications, audio, etc.):

```bash
npx expo run:ios
# or
npx expo run:android
```

### Scripts

| Command | Description |
|--------|-------------|
| `npm start` | Start Expo dev server |
| `npm run start:dev` | Start with dev client |
| `npm run android` | Start and open on Android |
| `npm run ios` | Start and open on iOS |
| `npm run web` | Start for web |
| `npm run generate-assets` | Regenerate app icon, splash, favicon from `assets/images/logo.svg` |
| `npm run build` | Run EAS workflow for production builds |
| `npm run lint` | Run ESLint |

## Project structure

```
app/
  (tabs)/
    (home)/          # Today's devotional & reader
    (library)/       # Saved devotionals
    (search)/        # Discover by category & reader
    (settings)/      # Reminder, accent, about
  modal.tsx          # Shared modals (e.g. reminder time)
components/          # UI components (audio player, glass pills, etc.)
contexts/            # Accent color, audio, preferred category
lib/
  api/               # Devotionals API & WordPress
  db/                # SQLite cache (devotionals, adjacent IDs)
  notifications/     # Daily reminder scheduling
  types/             # Devotional types
```

## Building for production

The app is set up for [EAS Build](https://docs.expo.dev/build/introduction/). Use the configured workflow or run builds manually:

```bash
# Install EAS CLI if needed
npm i -g eas-cli

# Log in and build
eas build --platform all --profile production
```

Submit to stores with `eas submit` (see [EAS Submit](https://docs.expo.dev/submit/introduction/)).

## License

Private project.
