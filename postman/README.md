# Consumer App - Postman Collection

This folder contains Postman collections and environments for testing the Consumer App API.

## Files

- `Consumer-App-API.postman_collection.json` - Complete API collection with all endpoints
- `Consumer-App-Local.postman_environment.json` - Local environment configuration

## Quick Start

> **New to Postman?** See [SETUP.md - Prerequisites: Postman](../SETUP.md#4-postman) for download instructions and [SETUP.md - Testing with Postman](../SETUP.md#testing-with-postman) for a guided import walkthrough.

### 1. Import into Postman

1. Open Postman
2. Click **Import** button (top left)
3. Select both JSON files from this folder
4. Click **Import**

### 2. Select Environment

1. In Postman, click the environment dropdown (top right)
2. Select **Consumer App - Local**

### 3. Start the API Server

```bash
# Make sure Docker is running with the database
cd docker
docker-compose up -d

# Start the API server
pnpm --filter @hk26/api dev
```

The API will be available at `http://localhost:3333`

### 4. Login with Demo User

1. Open the collection: **Consumer App API** → **Auth** → **Login**
2. Click **Send**

**Demo Credentials:**
- Email: `demo@consumer-app.com`
- Password: `Demo1234!`

The collection is configured to automatically save the `accessToken` and `refreshToken` after login!

### 5. Test Authenticated Endpoints

All requests under **Favorites**, **Cart**, **Orders**, and **Addresses** will automatically use the saved access token.

## Available Demo Users

After running `pnpm db:seed`, you'll have these demo users (all with password `Demo1234!`):

- `demo@consumer-app.com` - Demo User
- `walter@example.com` - Walter White
- `jesse@example.com` - Jesse Pinkman
- `don@example.com` - Don Draper

## Collection Structure

### Public Endpoints (No Auth Required)

- **Health** - Server health check
- **Subjects** - Browse subjects (characters, props, apparel, etc.)
- **Content** - Browse episodes and timeline data
- **Products** - Browse purchasable products

### Auth Endpoints

- **Register** - Create new user account
- **Login** - Login and get access token
- **Refresh Token** - Refresh expired access token
- **Logout** - Logout (client-side)

### Protected Endpoints (Auth Required)

- **Favorites** - Manage user's favorite subjects
- **Cart** - Shopping cart operations
- **Orders** - Order history and creation
- **Addresses** - Delivery address management

## Variables

The collection uses these variables:

- `baseUrl` - API base URL (default: `http://localhost:3333`)
- `accessToken` - JWT access token (auto-populated after login)
- `refreshToken` - JWT refresh token (auto-populated after login)
- `userId` - Current user ID (auto-populated after login)

## Testing Workflow

### 1. Authentication Flow

```
Register → Login → Use Protected Endpoints → Refresh Token (when needed) → Logout
```

### 2. Shopping Flow

```
1. Browse Subjects (GET /api/subjects)
2. View Subject Products (GET /api/subjects/:id/products)
3. Add to Cart (POST /api/cart/items)
4. View Cart (GET /api/cart)
5. Create Address (POST /api/addresses)
6. Create Order (POST /api/orders)
7. View Order History (GET /api/orders)
```

### 3. Favorites Flow

```
1. Browse Subjects (GET /api/subjects)
2. Add Favorite (POST /api/favorites)
3. View Favorites (GET /api/favorites)
4. Remove Favorite (DELETE /api/favorites/:subjectId)
```

### 4. Video Watching Flow (Content-to-Commerce)

This is the core feature of the Consumer App - syncing video playback with shoppable content.

**How it works:**
1. User watches video content (e.g., Stranger Things episode)
2. App syncs playback position with the timeline API
3. App displays subjects visible on screen at that moment
4. User can tap a subject to see and purchase related products

**API Flow:**

```
1. Get Available Content
   GET /api/content
   → Returns list of episodes with metadata

2. Sync Timeline (Every few seconds during playback)
   GET /api/content/:contentId/timeline?currentTime=120&lookahead=30&includeActive=true
   → Returns subjects visible at current timestamp (e.g., 2:00 in the video)
   → Returns subjects appearing in the next 30 seconds (for pre-loading)

   Response includes:
   - subjectId, label, type (character/product/apparel/location)
   - isSellable (true if subject has linked products)
   - startTime, endTime (when subject appears/disappears)
   - heroImageUrl, description

3. User Taps on Sellable Subject
   GET /api/subjects/:subjectId/products
   → Returns all products linked to that subject
   → Shows product details, prices, images, purchase links

4. Optional: Add to Cart (if user wants to buy)
   POST /api/cart/items
   → Add product to cart for later checkout
```

**Example Timeline Query:**

```
GET /api/content/{contentId}/timeline?currentTime=120&lookahead=30&includeActive=true

Query params:
- currentTime=120     → Current playback position (2 minutes)
- lookahead=30        → Fetch subjects appearing in next 30 seconds
- includeActive=true  → Include subjects currently visible on screen

Response:
{
  "ok": true,
  "timeline": [
    {
      "subjectId": "019bd11b-...",
      "label": "Black Digital Watch",
      "type": "apparel",
      "isSellable": true,
      "startTime": 115,
      "endTime": 145,
      "heroImageUrl": "https://...",
      "description": "Black digital wristwatch..."
    },
    {
      "subjectId": "019bd11b-...",
      "label": "Eleven",
      "type": "character",
      "isSellable": false,
      "startTime": 100,
      "endTime": 200
    }
  ]
}
```

**UI Implementation Tips:**
- Show `isSellable: true` subjects with a shopping cart icon
- Poll timeline API every 3-5 seconds during playback
- Pre-load product data for upcoming subjects (use `lookahead` param)
- Cache timeline data to reduce API calls
- Only fetch products when user taps on a subject

## Tips

### Auto-save Tokens

The **Login** request has a test script that automatically saves tokens to collection variables:

```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.collectionVariables.set('accessToken', jsonData.accessToken);
    pm.collectionVariables.set('refreshToken', jsonData.refreshToken);
    pm.collectionVariables.set('userId', jsonData.user.id);
}
```

### Manual Token Update

If you need to manually update the access token:

1. Click **Consumer App API** (collection name)
2. Go to **Variables** tab
3. Update `accessToken` value
4. Click **Save**

### Testing Different Users

To test with different users:

1. Logout current user (or just remove tokens)
2. Change email/password in **Login** request
3. Send **Login** request
4. Tokens will be automatically updated

## Troubleshooting

### "Unauthorized" errors

- Check that you're logged in (run **Login** request)
- Check that `accessToken` variable is set
- Try refreshing token (**Refresh Token** request)

### "Connection refused" errors

- Make sure API server is running: `pnpm --filter @hk26/api dev`
- Verify server is running on port 3333
- Check Docker database is running: `docker ps`

### "Not found" errors

- Make sure database is seeded: `pnpm db:seed`
- Check that you're using valid IDs from the seeded data
- Run **Get All Subjects** to see available subject IDs

## Database Setup

If you haven't set up the database yet:

```bash
# Start Docker containers
cd docker
docker-compose up -d

# Run migrations
pnpm db:migrate

# Seed database with demo data
pnpm db:seed
```

## Additional Resources

- [API Documentation](../apps/api/README.md)
- [Database Schema](../packages/databases/postgres/src/schema)

### Extending the API or Database

If you want to add new tables, endpoints, or features, read the [Type Safety Guide](../documents/guides/type-safety-from-database-to-frontend.md). It explains:
- How to add new database tables and schemas
- How to create new API endpoints with type-safe validation
- How to maintain type safety from database to frontend
- How to avoid common pitfalls with schema centralization
