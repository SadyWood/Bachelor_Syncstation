# marketplace-web

**Status:** Scaffolded (Not Yet Implemented)

Future frontend application for Hoolsy Marketplace - a platform for discovering, purchasing, and managing educational content.

## Planned Features

The Marketplace application will provide:

- **Content Discovery** - Browse and search educational content (courses, lessons, media)
- **Content Purchasing** - Buy and license content for use in Workstation
- **Creator Tools** - Tools for content creators to publish and monetize
- **Reviews & Ratings** - Community feedback and quality signals
- **Content Library** - Manage purchased content and licenses

## Tech Stack (Planned)

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing

## Getting Started

This application is not yet implemented. The directory contains only scaffolding for future development.

### Development

```bash
# Start dev server (empty app)
pnpm --filter marketplace-web dev

# Or from this directory
cd apps/marketplace-web
pnpm dev
```

## Database

The marketplace will use the `marketplace` PostgreSQL database (see [packages/databases/postgres/](../../packages/databases/postgres/)).

## Related Documentation

- [Workstation Web](../workstation-web/README.md)
- [API Backend](../api/README.md)
- [Database Schema](../../packages/databases/postgres/README.md)
