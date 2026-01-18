# Hoolsy Consumer App

React Native + Expo Go mobile application for browsing and purchasing products from TV shows.

## Features

- Browse subjects (characters, props, locations) from Breaking Bad, Mad Men, and more
- View timeline of when subjects appear in episodes
- Favorite subjects to save them for later
- Shop products linked to subjects (Walter White's hat, etc.)
- Manage shopping cart and orders
- User authentication and profile management

## Getting Started

Make sure you've completed the setup from the root README first.

### Running the App

```bash
# From the root directory
pnpm dev:app

# Or from this directory
pnpm start
```

Then open Expo Go on your phone and scan the QR code.

## Project Structure

```
src/
├── screens/         # Screen components (Home, Explore, Profile)
├── components/      # Reusable UI components
├── navigation/      # React Navigation setup
├── api/            # API client and hooks
├── hooks/          # Custom React hooks
└── context/        # React Context providers
```

## API Connection

The app connects to the API server at the address specified in `app.json` under `extra.apiUrl`.

**For development:**
- Replace `localhost` with your local IP address
- Example: `"apiUrl": "http://192.168.1.100:3333"`
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## Development Tips

### Hot Reload
Shake your device or press `r` in the terminal to reload the app.

### Debug Menu
- iOS: Shake device or press `Cmd+D` in simulator
- Android: Shake device or press `Cmd+M` in simulator

### Using TanStack Query
All API calls should use TanStack Query for caching and state management:

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/subjects');
      return data;
    },
  });
}
```

### Type Safety
All API requests and responses should be validated with Zod schemas from `@hk26/schema`:

```tsx
import { subjectSchema } from '@hk26/schema';

const subject = subjectSchema.parse(responseData);
```

## Building for Production

```bash
# Build for iOS
pnpm build:ios

# Build for Android
pnpm build:android
```

For more details, see [Expo documentation](https://docs.expo.dev/build/introduction/).
