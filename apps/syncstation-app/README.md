# Syncstation App

React Native + Expo Go mobile application for on-set logging and data capture during video production.

## Features

- **Multi-tenant authentication** - Secure login with tenant isolation
- **Project selection** - Browse and select content nodes (projects, groups, episodes, scenes)
- **On-set logging** - Create log entries with notes and metadata
- **Media capture** - Attach photos, videos, and audio to log entries
- **File attachments** - Upload PDFs, DOCXs, Excel files
- **Offline-first** - Works without internet, syncs when connection is available
- **Sync queue** - Track sync status (local, pending, synced, failed)

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
├── screens/         # Screen components (Projects, LogEntry, Settings)
├── components/      # Reusable UI components
├── navigation/      # React Navigation setup
├── api/            # API client and hooks
├── hooks/          # Custom React hooks
├── context/        # React Context providers (Auth, Sync)
└── storage/        # Local storage for offline data
```

## API Connection

The app connects to the API server at the address specified in `app.json` under `extra.apiUrl`.

**For development:**
- Replace `localhost` with your local IP address
- Example: `"apiUrl": "http://192.168.1.100:3001"`
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

function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/projects');
      return data;
    },
  });
}
```

### Offline-First Architecture
Log entries are stored locally first and synced to the server when connectivity is available:

```tsx
import { useMutation } from '@tanstack/react-query';
import { saveLogEntryLocally, queueForSync } from '../storage';

function useCreateLogEntry() {
  return useMutation({
    mutationFn: async (logEntry) => {
      // Save locally first
      await saveLogEntryLocally(logEntry);
      // Queue for sync
      await queueForSync(logEntry);
    },
  });
}
```

### Type Safety
All API requests and responses should be validated with Zod schemas from `@hk26/schema`:

```tsx
import { ContentNodeSchema } from '@hk26/schema';

const contentNode = ContentNodeSchema.parse(responseData);
```

## Building for Production

```bash
# Build for iOS
pnpm build:ios

# Build for Android
pnpm build:android
```

For more details, see [Expo documentation](https://docs.expo.dev/build/introduction/).
