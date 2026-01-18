# Consumer App Platform
## Complete platform guide for the Hoolsy ecosystem

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

The Consumer App is Hoolsy's mobile companion application that enables real-time interaction with media content users are watching on external platforms (Netflix, HBO, etc.). Using ultrasound audio watermarking technology, the app synchronizes with content playing on TV or computer screens, providing shoppable experiences, subject discovery, and interactive features—all without streaming video itself.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Ultrasound Synchronization Technology](#ultrasound-synchronization-technology)
3. [System Architecture](#system-architecture)
4. [User Authentication & Profiles](#user-authentication--profiles)
5. [Content Synchronization & Detection](#content-synchronization--detection)
6. [Subject Discovery System](#subject-discovery-system)
7. [Shoppable Scenes](#shoppable-scenes)
8. [Shopping Experience](#shopping-experience)
9. [Timeline & Exploration](#timeline--exploration)
10. [User Preferences & Personalization](#user-preferences--personalization)
11. [Order Management & History](#order-management--history)
12. [Notifications & Engagement](#notifications--engagement)
13. [API Surface](#api-surface)
14. [Consumer App in the Hoolsy Ecosystem](#consumer-app-in-the-hoolsy-ecosystem)

---

## Platform Overview

### What Hoolsy is building
Hoolsy is building an ecosystem that connects media content with commerce, enabling audiences to discover and purchase products they see in films, series, and other media. The Consumer App is the mobile companion that brings this vision to life through ultrasound-based synchronization technology.

### What Consumer App is
Consumer App is a **mobile companion application** that runs on a user's smartphone while they watch content on a separate device (TV, computer, tablet via Netflix, HBO, Disney+, etc.). The app uses **ultrasound audio watermarking** to detect what the user is watching and synchronize an interactive experience on their phone.

**Core capabilities:**
- **Ultrasound detection**: Listens to high-frequency audio codes embedded in media content
- **Real-time synchronization**: Identifies exact content and timestamp user is watching
- **Subject discovery**: Shows people, products, and locations visible on screen at current moment
- **Shoppable scenes**: Purchase products directly from what user sees on TV
- **Timeline exploration**: Visual timeline showing subjects throughout the content
- **Interactive metadata**: Actor info, product details, location information
- **Shopping cart & checkout**: Multi-vendor shopping with integrated payment processing
- **Order tracking**: View order status, track shipments, manage returns
- **User profiles**: Save preferences, view watch history, manage orders

### What Consumer App is NOT
- **Not a streaming app**: Does not play video or audio content itself
- **Not a content production tool**: Does not create or edit media (that's Workstation)
- **Not a vendor management platform**: Does not manage product catalogs (that's Marketplace)
- **Not an admin dashboard**: Does not monitor systems (that's Nexus)

Consumer App is strictly a **mobile companion application** that enhances external content consumption with interactive shopping and discovery features.

### Who uses Consumer App
- **General consumers**: Anyone watching content on streaming platforms who wants interactive features
- **Media fans**: Audiences who want to explore content deeply, identify subjects, learn more about scenes
- **Shoppers**: Users looking for products featured in their favorite media
- **First-time users**: Limited guest mode without account (can browse but not purchase)
- **Registered users**: Full access to synchronization, shopping cart, orders, watch history

### Key Differentiator: Companion App Model
**Critical distinction**: Consumer App is NOT a replacement for Netflix, HBO, or other streaming services. It is a **companion experience** that runs alongside these services:

1. User opens Netflix on their TV
2. User starts playing Breaking Bad
3. User opens Hoolsy Consumer App on their phone
4. App grants microphone permission
5. App listens to ultrasound codes from TV speakers
6. App synchronizes with Breaking Bad episode and timestamp
7. App displays interactive content on phone (products, subjects, timeline)
8. User continues watching on TV while interacting with phone app

---

## Ultrasound Synchronization Technology

### How Ultrasound Audio Watermarking Works

Hoolsy uses **ultrasound audio watermarking** to synchronize the Consumer App with content playing on external devices. This technology embeds inaudible high-frequency codes into the audio track of media content.

### The Four Pieces of Information in Ultrasound Codes

Each ultrasound code broadcast contains four critical pieces of information:

**1. Which Content**
- Identifies the specific media being played
- Examples: "Breaking Bad, Season 1, Episode 1", "The Crown, Season 3, Episode 5", "Avatar (2009 Film)"
- Enables app to query correct content metadata

**2. Which Platform (Streaming Service)**
- Identifies where user is watching the content
- Examples: Netflix, HBO Max, Disney+, Amazon Prime, Hulu
- Enables Hoolsy to reward the streaming service for the interaction
- Tracks which platforms drive the most engagement

**3. Timestamp (Playback Position)**
- Exact position in the content down to the second
- Example: "50 minutes and 20 seconds into the episode"
- Enables app to show subjects visible at that exact moment
- Synchronizes timeline, product placements, and metadata

**4. [Fourth Piece - To Be Specified]**
- [User couldn't remember the fourth piece of information]
- Likely: Session ID, quality indicator, or region code

### Content Encoding Process: Hoolsy United SDK

Before content can be synchronized with the Consumer App, it must be **encoded with ultrasound watermarks**. This is handled by the **Hoolsy United SDK**.

**Integration into streaming platforms:**
1. **SDK Integration**: Hoolsy United SDK is integrated into the streaming platform (Netflix, HBO, etc.)
2. **Tag Reading**: SDK reads "tags" (markers) embedded in the media file that indicate when subjects (people, products, locations) appear on screen
3. **Real-Time Generation**: During playback, SDK generates ultrasound codes in real-time based on current timestamp
4. **Audio Mixing**: Ultrasound codes are mixed into the audio output alongside normal sound
5. **Broadcast**: Combined audio (normal sound + ultrasound) is played through device speakers

**Who encodes content:**
- **Content producers**: Must embed ultrasound codes into audio track before distribution
- **Streaming platforms**: May encode on-the-fly using Hoolsy United SDK during playback
- **Hoolsy partners**: Content partners who integrate Hoolsy technology into their workflows

**Ultrasound characteristics:**
- **Frequency range**: High-frequency tones above human hearing (typically 18-22 kHz)
- **Inaudible**: Users cannot hear the codes (above ~20 kHz threshold for most humans)
- **Robust**: Works across speaker types (TV speakers, soundbars, computer speakers)
- **Real-time**: Codes generated and broadcast continuously during playback

### Consumer App Listening & Detection

**How the app detects and decodes ultrasound:**

**1. Microphone Access**
- User opens Consumer App
- App requests microphone permission
- User grants permission (required for synchronization)
- App begins continuous listening in background

**2. Signal Capture**
- App captures audio input from device microphone
- Filters for high-frequency range (18-22 kHz)
- Ignores normal audio frequencies (human speech, music)

**3. Code Detection**
- App identifies ultrasound patterns matching Hoolsy's encoding scheme
- Validates signal integrity (checks for noise, interference)
- Extracts encoded data (content ID, platform, timestamp)

**4. Synchronization**
- App decodes ultrasound data to identify:
  - **Content**: Breaking Bad, Season 1, Episode 1
  - **Platform**: Netflix
  - **Timestamp**: 50:20 (50 minutes, 20 seconds)
- App makes API call to Hoolsy backend with this information

**5. Metadata Retrieval**
- Hoolsy API receives content ID and timestamp
- Queries databases for subjects visible at that timestamp
- Returns:
  - List of subjects (people, products, locations) visible on screen
  - Product links for shoppable items
  - Subject metadata (names, descriptions, images)
  - Timeline data (subjects throughout the episode)

**6. UI Update**
- App displays synchronized content on phone:
  - Current subjects visible on TV screen
  - Shoppable products with "Buy Now" buttons
  - Timeline showing when subjects appear
  - Actor/character information
  - Location details

### Synchronization Flow (Step-by-Step)

**Complete user experience from start to finish:**

1. **User starts watching content on TV**
   - Opens Netflix, HBO, etc. on TV or computer
   - Selects Breaking Bad, Season 1, Episode 1
   - Presses play

2. **Streaming platform plays content with ultrasound**
   - Hoolsy United SDK integrated into Netflix generates ultrasound codes
   - TV speakers output normal audio + inaudible ultrasound
   - Codes broadcast continuously during playback

3. **User opens Hoolsy Consumer App on phone**
   - App prompts for microphone permission (if first time)
   - User grants permission
   - App begins listening for ultrasound codes

4. **App detects and decodes ultrasound**
   - Microphone captures high-frequency audio
   - App identifies Hoolsy ultrasound pattern
   - Decodes: "Breaking Bad S01E01, Netflix, 00:05:30"

5. **App queries Hoolsy API**
   - API call: `GET /sync?content=breaking-bad-s01e01&timestamp=330&platform=netflix`
   - Backend queries databases for subjects visible at 5:30 timestamp

6. **API returns synchronized data**
   ```json
   {
     "content": {
       "title": "Breaking Bad",
       "season": 1,
       "episode": 1,
       "timestamp": 330
     },
     "subjects": [
       {
         "type": "person",
         "name": "Walter White",
         "character": true,
         "products_linked": ["pork-pie-hat-abc123"]
       },
       {
         "type": "product",
         "name": "Pork Pie Hat",
         "vendor": "Hat Co.",
         "price": "$29.99",
         "shoppable": true
       },
       {
         "type": "location",
         "name": "White Residence - Albuquerque",
         "details": "Walter White's home in the series"
       }
     ],
     "timeline": [...] // Full timeline data for episode
   }
   ```

7. **App displays synchronized content**
   - Phone screen updates with:
     - "Currently on screen: Walter White"
     - Shoppable product: "Pork Pie Hat - $29.99 - Buy Now"
     - Timeline bar showing when subjects appear throughout episode
     - "Add to Cart" buttons for products

8. **User interacts while watching**
   - Clicks "Buy Now" on Pork Pie Hat
   - Added to shopping cart
   - Continues watching TV while browsing products on phone
   - Timeline updates in real-time as episode plays

9. **Continuous synchronization**
   - App continues listening to ultrasound
   - Updates display every few seconds as timestamp changes
   - New subjects appear when scene changes
   - Timeline progress bar moves in sync with TV playback

### Technical Advantages of Ultrasound

**Why ultrasound over other sync methods:**

**vs. Manual input (user types episode name)**
- ✅ Automatic, no user effort required
- ✅ Accurate timestamp synchronization
- ✅ Real-time updates as content plays

**vs. QR codes / Screen capture**
- ✅ No visual interruption of content
- ✅ Works with any screen type (TV, projector, computer)
- ✅ No camera permission required
- ✅ User can place phone anywhere (doesn't need to point at screen)

**vs. Internet metadata (detecting what's playing via account)**
- ✅ Works across all platforms (Netflix, HBO, pirated content, cable TV)
- ✅ Precise timestamp synchronization (not just "user is watching Breaking Bad")
- ✅ No need for platform API integrations
- ✅ Privacy-friendly (doesn't require linking to user's Netflix account)

**vs. Bluetooth / Wi-Fi beacons**
- ✅ Works in any environment (no beacon hardware required)
- ✅ Works with any TV or device
- ✅ Simple audio-based approach

---

## System Architecture

### Multi-Database Consumer Architecture
The Consumer App is a **read-heavy, mobile application** that queries data from multiple sources based on ultrasound-detected content.

**1. Users Database** (shared, read/write)
- Authenticates consumer users
- Stores user profiles, preferences, watch history
- Manages shopping cart, order history

**2. Workstation Database** (read-only from Consumer App's perspective)
- Content metadata (titles, synopses, release dates)
- Subject metadata (verified subjects from Subject Registry)
- Subject-media associations (which subjects appear in which media, at what timestamps)
- **Critical for sync**: Timestamp-based subject queries

**3. Marketplace Database** (read-only for browsing, read/write for orders)
- Product catalog (titles, prices, images, inventory)
- Product-subject links (which products are linked to which subjects)
- Orders and transactions (created when users purchase)

**4. Subject Databases** (polyglot persistence, read-only from Consumer App)
- **Document store**: Flexible subject metadata (names, descriptions, attributes)
- **Graph database**: Relationship mapping (person appeared in episode, product used by character)
- **Time-series store**: Temporal data (subject appeared at timestamp X for Y seconds)

### Connection Model
Consumer App uses **service-level connections** with read-optimized queries:

- **USERS_DB_URL**: Read/write for user profiles, preferences, cart, orders
- **WORKSTATION_DB_URL**: Read-only for content and subject metadata
- **MARKETPLACE_DB_URL**: Read for products, read/write for orders
- **SUBJECT_GRAPH_URL**: Read-only for relationship queries (graph database)
- **SUBJECT_DOCUMENT_URL**: Read-only for subject details (document store)
- **SUBJECT_TIMESERIES_URL**: Read-only for temporal subject data (critical for timestamp queries)

### Synchronization API Architecture

**Key API endpoint for ultrasound sync:**
```
POST /api/sync
Body:
{
  "content_id": "breaking-bad-s01e01",
  "platform": "netflix",
  "timestamp": 330 // seconds
}

Response:
{
  "subjects_at_timestamp": [...],
  "products_at_timestamp": [...],
  "timeline": [...]
}
```

**Query optimization for real-time sync:**
- **Time-series database**: Indexed by content_id + timestamp for sub-100ms queries
- **Precomputed timelines**: Timeline data precomputed per content piece, cached
- **Redis caching**: Frequently synced content cached in Redis (popular episodes)
- **CDN caching**: Product images, subject photos served via CDN

### Caching Strategy
To handle high traffic and improve synchronization performance:

**Redis caching:**
- Frequently accessed content timelines (e.g., trending episodes)
- Subject metadata (actors, products, locations)
- Product listings for popular items
- TTL: 5-15 minutes to balance freshness and performance

**CDN caching:**
- Static assets (product images, subject photos, app assets)
- Cached at edge locations globally for low latency

**Client-side caching:**
- User preferences, watch history, cart state cached in app storage
- Timeline data cached per content piece once fetched
- Synced with server periodically

**Time-series optimization:**
- Subject timestamps indexed for fast range queries
- Pre-aggregated data for common queries (e.g., "subjects in minutes 5-10")

---

## User Authentication & Profiles

### Registration & Login

**Registration flow:**
1. User downloads Consumer App from App Store / Google Play
2. Opens app, clicks "Sign Up"
3. Enters email, password, optional profile info (name, preferences)
4. Receives email verification link
5. Clicks link to verify account
6. Gains full access to Consumer App features

**Login flow:**
1. User enters email and password
2. API validates credentials against Users database
3. Returns JWT access token + httpOnly refresh cookie
4. User gains access to personalized features, shopping, sync

**Guest mode:**
- Users can explore app interface without account
- Cannot synchronize with content (microphone access requires account for privacy)
- Cannot save preferences or complete checkout
- Prompted to register when attempting to sync or add to cart

### User Profiles
Registered users have profiles with:

**Basic info:**
- Name, email, profile picture
- Bio, interests (optional)

**Preferences:**
- Preferred content genres (action, comedy, drama, etc.)
- Preferred product categories (fashion, tech, home, etc.)
- Notification settings (email, push)
- Language and region settings
- Microphone permission status

**Watch history:**
- List of content synchronized with (episodes, films watched)
- Last synchronized timestamp per content
- Favorite content (bookmarked for quick access)

**Shopping data:**
- Saved items (wishlist)
- Shopping cart (persisted across sessions)
- Order history
- Saved payment methods (tokenized via Stripe/PayPal)
- Saved shipping addresses

**Sync history:**
- Recently synchronized content
- Platforms used (Netflix, HBO, etc.)
- Total sync time (analytics)

---

## Content Synchronization & Detection

### Sync Lifecycle

The Consumer App's primary function is **detecting and synchronizing** with content playing on external devices.

**Sync states:**

**1. Listening (Idle)**
- App open, microphone active
- No ultrasound detected
- UI prompts: "Play content on your TV to start syncing"

**2. Detecting**
- Ultrasound pattern detected
- Decoding in progress
- UI shows: "Syncing with content..."

**3. Synchronized**
- Content identified successfully
- Timestamp locked
- UI displays: "Synced with Breaking Bad S01E01"
- Subjects and products displayed

**4. Lost Sync**
- Ultrasound signal lost (user muted TV, paused content, moved away)
- UI shows: "Sync lost - Resume playback to reconnect"
- Last known state preserved

**5. Sync Ended**
- User stops content or leaves room
- App retains last synced timestamp for "Continue Exploring" mode

### Content Detection UI

**Listening state:**
- Animated microphone icon
- "Listening for content..."
- "Make sure your TV is playing Hoolsy-enabled content"

**Synced state:**
- Content title and episode displayed at top
- Progress bar showing timestamp in episode
- Timestamp counter (e.g., "5:30 / 45:00")
- Platform badge (Netflix logo, HBO logo, etc.)

**Sync controls:**
- "Pause Sync" button (stops listening temporarily)
- "End Sync" button (stops sync, switches to explore mode)
- Settings icon (microphone sensitivity, platform preferences)

### Supported Platforms

Consumer App can sync with content on any platform that has **Hoolsy United SDK** integrated or content encoded with ultrasound:

**Streaming services:**
- Netflix
- HBO Max
- Disney+
- Amazon Prime Video
- Hulu
- Apple TV+
- Paramount+
- Peacock

**Cable/Broadcast TV:**
- Any channel broadcasting Hoolsy-encoded content
- Works with cable boxes, satellite TV

**Physical media:**
- Blu-ray discs with ultrasound encoding
- DVDs with ultrasound encoding

**Limitations:**
- Platform must have Hoolsy SDK integrated OR content must have ultrasound pre-encoded
- Ultrasound must be audible to phone microphone (speakers must be on, volume sufficient)

---

## Subject Discovery System

### What is Subject Discovery?
The **core innovation** of Hoolsy's Consumer App is the ability to identify and explore subjects within media content in real-time. Subjects are people, products, or locations that have been detected by AI, verified by Workstation, and synchronized with specific timestamps.

**Example:**
- User watches Breaking Bad on Netflix
- At 5:30, Walter White appears wearing a pork pie hat
- Hoolsy app (listening via microphone) detects timestamp 5:30
- App queries: "What subjects are visible at Breaking Bad S01E01 timestamp 5:30?"
- API returns: "Walter White (character), Pork Pie Hat (product), White Residence (location)"
- App displays these subjects on phone screen
- User clicks "Pork Pie Hat" → Product detail page opens
- User clicks "Buy Now" → Added to cart

### Subject Types

Subjects are categorized by type:

**People:**
- Actors, characters, celebrities
- Subject metadata: Name, bio, filmography, social links
- Related content: Other movies/series they appear in
- Products associated: Clothing, accessories worn by character

**Products:**
- Physical items visible on screen (clothing, electronics, furniture, food)
- Subject metadata: Brand, model, description, price
- Shoppable: Direct links to purchase
- Multiple vendors: Different vendors may offer same product

**Locations:**
- Physical places visible on screen (cities, buildings, landmarks)
- Subject metadata: Name, address, description, photos
- Related content: Other media filmed at this location
- Travel info: Links to tourism sites, booking platforms (future)

### Real-Time Subject Display

**Synchronized subject view:**
- App displays list of subjects visible at current timestamp
- Updates automatically as timestamp changes (every 2-5 seconds based on ultrasound codes)
- Priority order: Products (shoppable) → People → Locations

**Subject cards:**
Each subject displayed as a card with:
- Subject image/thumbnail
- Subject name
- Subject type badge (person, product, location)
- Timestamp range (e.g., "Visible 5:20 - 6:45")
- Action button:
  - Products: "Buy Now" or "Add to Cart"
  - People: "View Profile"
  - Locations: "Learn More"

**Example synchronized display at 5:30 in Breaking Bad S01E01:**
```
Currently On Screen:

[Product Card]
🛒 Pork Pie Hat
  By Hat Co. - $29.99
  [Buy Now]

[Person Card]
👤 Walter White (Character)
  Played by Bryan Cranston
  [View Profile]

[Location Card]
📍 White Residence
  Albuquerque, NM
  [Learn More]
```

### Subject Detail Pages

Clicking a subject opens a detailed view:

**Product subject:**
- Full product info (name, brand, description, price, vendor)
- High-resolution images (multiple angles)
- Size/color options (if applicable)
- Vendor information
- Add to cart / Buy now buttons
- Related products (other items from same scene or character)
- "Seen in" section: List of scenes/episodes where this product appears

**Person subject:**
- Full bio
- Filmography (list of content they appear in)
- Related subjects (products worn by character, locations visited)
- Social media links (if available)
- "Shop their style" section: All products associated with this character

**Location subject:**
- Full description and history
- Photos and videos of location
- Map view (Google Maps integration)
- Related content: Other media filmed here
- Travel information: How to visit, nearby attractions (future)

---

## Shoppable Scenes

### What Makes Scenes Shoppable?

**Definition**: A shoppable scene is any moment in media content where products are visible and linked in the Hoolsy database.

**Requirements for shoppability:**
1. **Subject detection**: AI detected product in Workstation
2. **Vendor linkage**: Vendor linked their product to the detected subject in Marketplace
3. **Approval**: Product-subject link approved by Hoolsy admin (quality control)
4. **Inventory**: Product in stock with active vendor
5. **Sync**: Content encoded with ultrasound for timestamp synchronization

### Real-Time Shoppable Experience

**User flow:**
1. User watches content on TV (e.g., Breaking Bad)
2. Hoolsy app synced on phone via ultrasound
3. Scene shows Walter White wearing iconic pork pie hat
4. App detects timestamp, displays: "Pork Pie Hat - $29.99 - Buy Now"
5. User clicks "Buy Now" → Product added to cart
6. User continues watching, app continues syncing
7. Scene changes to Jesse Pinkman wearing a hoodie
8. App updates: "Vintage Hoodie - $49.99 - Buy Now"
9. User clicks "Buy Now" → Added to cart
10. When episode ends, user opens cart and completes checkout

**Key advantage**: User can shop without interrupting content. TV continues playing, phone handles shopping.

### Product Discovery While Watching

**Automatic product highlighting:**
- App automatically displays products visible at current timestamp
- No need to search or browse catalogs
- Products appear exactly when visible on screen

**Multi-vendor display:**
- If multiple vendors sell same product, app shows all options
- User can compare prices, ratings, shipping times
- Example: Three vendors offer "Walter White's Pork Pie Hat" at $29.99, $34.99, $39.99

**Product notifications (optional):**
- User can enable notifications for specific product types
- Example: "Notify me when fashion items appear"
- App sends push notification when product type detected

### Shopping Cart During Sync

**Cart persistence:**
- Products added to cart while syncing remain in cart
- Cart synced across devices (user can complete checkout on desktop later)
- Cart retained between sync sessions

**Cart UI during sync:**
- Mini cart badge shows item count
- Quick view: Tap cart icon to see added items
- "View Cart" button opens full cart page
- Checkout button available from cart

---

## Shopping Experience

### Shopping Cart

**Cart contents:**
- List of products from multiple vendors
- Product image, name, price, quantity
- Vendor name per product
- Total price (including estimated shipping)
- "Remove" button per item
- "Update quantity" controls

**Multi-vendor awareness:**
- Cart grouped by vendor
- Shipping calculated per vendor
- User sees: "2 items from Hat Co., 1 item from Fashion Brand"

### Checkout Process

**Checkout flow:**
1. User clicks "Proceed to Checkout" from cart
2. Review items (quantities, vendors)
3. Enter/select shipping address
4. Select shipping method per vendor (standard, express)
5. Enter/select payment method (credit card, PayPal, etc.)
6. Review order summary
7. Place order

**Payment processing:**
- Integrated with Stripe / PayPal
- Supports credit/debit cards, digital wallets
- Secure tokenization (no card details stored)

**Order confirmation:**
- Order ID generated
- Confirmation email sent
- Order appears in "Order History"

### Order Splitting by Vendor

Because Marketplace is **multi-vendor**, a single checkout may create multiple orders:

**Example:**
- User buys:
  - Pork Pie Hat from Hat Co.
  - Hoodie from Fashion Brand
  - Sunglasses from Eyewear Inc.
- System creates 3 separate orders:
  - Order #1: Hat Co. (Pork Pie Hat)
  - Order #2: Fashion Brand (Hoodie)
  - Order #3: Eyewear Inc. (Sunglasses)
- Each vendor fulfills their own order independently

**User experience:**
- User sees 3 orders in "Order History"
- Each order tracked separately
- Each vendor ships separately

---

## Timeline & Exploration

### Visual Timeline

Consumer App provides a **visual timeline** showing when subjects appear throughout content.

**Timeline UI:**
- Horizontal progress bar representing full content duration
- Markers indicating when subjects appear
- Color-coded by subject type:
  - Products: Orange markers
  - People: Blue markers
  - Locations: Green markers
- Current timestamp indicator (moves in real-time during sync)

**Example timeline for Breaking Bad S01E01 (45 minutes):**
```
[Timeline Bar: 0:00 ================================= 45:00]
         🟦     🟧   🟦🟧🟢       🟧    🟦🟢
         3:20   5:30 12:40      25:10  38:50
```

**Timeline interactions:**
- Tap marker to see subjects at that timestamp
- Scrub timeline to explore different moments (only works when synced)
- Zoom timeline for detailed view

### Explore Mode (Post-Viewing)

**After user finishes watching** (or manually ends sync), app enters **Explore Mode**:

**Explore Mode features:**
- Full timeline access (scrub to any timestamp, even if TV is off)
- Browse all subjects from the episode/film
- Shop products discovered during viewing
- Revisit favorite moments

**Explore Mode UI:**
- Timeline remains interactive
- "Subjects" tab: List of all subjects in content
- "Products" tab: All shoppable items
- "People" tab: All characters/actors
- "Locations" tab: All locations
- Search: Find specific subjects

**Use case:**
- User watched Breaking Bad last night
- Forgot to buy the hat
- Opens app next day
- Goes to "Recently Watched" → Breaking Bad S01E01
- Enters Explore Mode
- Finds "Pork Pie Hat"
- Buys it

---

## User Preferences & Personalization

### Preference Settings

**Content preferences:**
- Favorite genres (action, drama, comedy, etc.)
- Favorite streaming platforms (Netflix, HBO, etc.)
- Preferred language for metadata

**Shopping preferences:**
- Preferred product categories (fashion, tech, home decor)
- Price range filters
- Preferred vendors (favorite brands)

**Sync preferences:**
- Microphone sensitivity (low, medium, high)
- Auto-sync (automatically start syncing when ultrasound detected)
- Sync notifications (alert when sync starts/stops)

**Notification preferences:**
- Product notifications (when favorite product types appear)
- Order updates (shipping, delivery)
- Platform-specific notifications (e.g., only notify for Netflix content)

### Personalized Recommendations

Consumer App uses watch history and shopping behavior to personalize experience:

**Content recommendations:**
- "Because you watched Breaking Bad, you might like Better Call Saul"
- Based on sync history, not user's Netflix account

**Product recommendations:**
- "You bought fashion items from Breaking Bad—check out these products from Mad Men"
- Based on past purchases and browsing

**Subject recommendations:**
- "You explored Walter White—you might also like Jesse Pinkman"
- Based on subject interaction patterns

---

## Order Management & History

### Order Tracking

**Order statuses:**
- **Pending**: Order placed, awaiting vendor confirmation
- **Confirmed**: Vendor confirmed, preparing shipment
- **Shipped**: Order shipped, tracking number available
- **Delivered**: Order delivered successfully
- **Cancelled**: Order cancelled by user or vendor
- **Returned**: Order returned by user

**Order detail page:**
- Order ID, date placed
- Products ordered (with images)
- Vendor information
- Shipping address
- Tracking number (if shipped)
- Status timeline (placed → confirmed → shipped → delivered)

**Tracking integration:**
- Links to carrier tracking pages (UPS, FedEx, USPS)
- In-app tracking status updates

### Order History

**Order history page:**
- List of all past orders
- Sortable by date, vendor, status
- Filterable by status (delivered, pending, cancelled)
- Search orders by product name or order ID

**Reorder functionality:**
- "Buy Again" button on past orders
- Adds same products to cart with one click

### Returns & Refunds

**Return process:**
1. User opens order detail page
2. Clicks "Request Return"
3. Selects reason (wrong size, defective, changed mind)
4. Submits return request
5. Vendor approves/rejects return
6. If approved, user receives return shipping label
7. User ships product back
8. Vendor processes refund

**Refund tracking:**
- Refund status visible in order detail
- Refund processed to original payment method
- Refund typically takes 5-10 business days

---

## Notifications & Engagement

### Push Notifications

Consumer App sends push notifications for:

**Order updates:**
- Order confirmed
- Order shipped (with tracking link)
- Order delivered
- Return approved/rejected

**Sync notifications:**
- "Sync started with Breaking Bad S01E01"
- "Sync ended - 15 new products discovered"

**Product notifications:**
- "Your favorite product type is on screen now!"
- "Price drop on Pork Pie Hat (now $24.99)"

**Content notifications:**
- "New shoppable content available: Stranger Things Season 5"
- "Your favorite show just added new episodes"

### In-App Engagement

**Badges and achievements (future):**
- "Shopaholic": Purchased 10 products
- "Explorer": Synced with 50 episodes
- "Early Adopter": First 1000 users

**Social sharing (future):**
- Share discoveries on social media
- "I just bought Walter White's hat from Breaking Bad!"

---

## API Surface

### Public REST API

Consumer App provides a mobile-optimized API:

**Authentication endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

**Synchronization endpoints:**
- `POST /api/sync` - Sync with content (decode ultrasound, return subjects at timestamp)
- `GET /api/sync/status` - Check current sync status
- `POST /api/sync/end` - End sync session

**Content endpoints:**
- `GET /api/content/:id` - Get content metadata
- `GET /api/content/:id/timeline` - Get full timeline for content
- `GET /api/content/:id/subjects` - Get all subjects in content

**Subject endpoints:**
- `GET /api/subjects/:id` - Get subject details
- `GET /api/subjects/:id/products` - Get products linked to subject
- `GET /api/subjects/:id/appearances` - Get content where subject appears

**Product endpoints:**
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/vendors` - Get vendors selling product
- `POST /api/products/:id/cart` - Add product to cart

**Shopping endpoints:**
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart/:item_id` - Remove item from cart
- `POST /api/checkout` - Process checkout

**Order endpoints:**
- `GET /api/orders` - Get user's order history
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/return` - Request return

**User endpoints:**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update preferences
- `GET /api/user/history` - Get watch/sync history

---

## Consumer App in the Hoolsy Ecosystem

### The Five Platforms

**1. Workstation**
- Internal platform for content preparation and subject verification
- **Relationship to Consumer App**: Workstation verifies subjects that Consumer App displays to users

**2. Marketplace**
- Vendor operations platform and consumer webshop
- **Relationship to Consumer App**: Consumer App queries Marketplace for products, creates orders in Marketplace system

**3. Consumer App** (this document)
- Mobile companion app for interactive content experiences
- **Relationship to other platforms**: Bridges ultrasound-synced content with commerce

**4. Syncstation**
- On-set companion app for production crews
- **Relationship to Consumer App**: No direct relationship; both consume Workstation content metadata

**5. Nexus**
- Internal oversight and administration
- **Relationship to Consumer App**: Monitors app performance, user analytics, sync metrics

### Data Flow: Ultrasound to Purchase

**End-to-end flow:**

1. **Content Production (External + Workstation)**
   - Content producer creates Breaking Bad episode
   - Workstation: AI detects subjects (Walter White, Pork Pie Hat)
   - Workstation: Human verifies subjects and timestamps
   - Subjects stored in Subject Registry with timestamp data

2. **Content Encoding (Hoolsy United SDK)**
   - Streaming platform (Netflix) integrates Hoolsy United SDK
   - SDK reads subject tags and timestamps
   - SDK generates ultrasound codes during playback
   - Ultrasound broadcast through TV speakers

3. **Product Linking (Marketplace)**
   - Vendor uploads "Pork Pie Hat" product to Marketplace
   - Vendor links product to "Walter White's Hat" subject
   - Hoolsy admin approves link
   - Product becomes shoppable

4. **User Watches (External Platform)**
   - User opens Netflix on TV
   - Plays Breaking Bad S01E01
   - TV broadcasts ultrasound codes

5. **Sync (Consumer App)**
   - User opens Hoolsy app on phone
   - App listens via microphone
   - Detects ultrasound: "Breaking Bad S01E01, Netflix, 5:30"
   - API call: `POST /api/sync` with decoded data

6. **Subject Display (Consumer App)**
   - API queries Subject Registry for timestamp 5:30
   - Returns: "Walter White (person), Pork Pie Hat (product)"
   - App displays subjects on phone

7. **Purchase (Consumer App + Marketplace)**
   - User clicks "Buy Now" on Pork Pie Hat
   - App calls `POST /api/cart` to add product
   - User completes checkout
   - Order created in Marketplace database
   - Vendor receives order, fulfills, ships

8. **Analytics (Nexus)**
   - Nexus tracks: Sync event, product view, purchase
   - Metrics: Which content drives most sales, which products popular
   - Streaming platform (Netflix) rewarded for engagement

### Shared Infrastructure

**Users Database:**
- Shared authentication across Workstation, Marketplace, Consumer App, Nexus
- Consumer users have accounts in same database as Workstation editors

**Subject Registry:**
- Single source of truth for subjects across all platforms
- Consumer App reads subject data verified in Workstation
- Marketplace links products to subjects in registry

**Product Catalog:**
- Marketplace manages catalog
- Consumer App queries catalog for shoppable products

**Order System:**
- Orders created in Consumer App
- Stored in Marketplace database
- Vendors manage fulfillment via Marketplace platform

---

## Consumer App's Role in Content-to-Commerce

Consumer App is the **consumer-facing touchpoint** that completes Hoolsy's content-to-commerce vision:

1. **Content ingestion** (Workstation): Media uploaded, subjects detected and verified with timestamps
2. **Content encoding** (Hoolsy United SDK): Ultrasound watermarks embedded in audio track
3. **Product upload** (Marketplace for Vendors): Vendors add products to catalog
4. **Subject linking** (Marketplace for Vendors): Vendors connect products to subjects
5. **Link approval** (Nexus/Marketplace): Hoolsy ensures quality
6. **Publishing** (Streaming Platforms): Content distributed to Netflix, HBO, etc. with ultrasound
7. **User watches** (External Platforms): User plays content on TV
8. **Sync** (Consumer App): App detects ultrasound, identifies content and timestamp
9. **Subject display** (Consumer App): App shows subjects visible at current moment
10. **Discovery** (Consumer App): User explores subjects, views products
11. **Purchase** (Consumer App): User buys products
12. **Fulfillment** (Marketplace for Vendors): Vendors ship orders
13. **Analytics** (Nexus): Track performance, optimize content-to-commerce loop

Without Consumer App, Hoolsy's ultrasound technology and subject detection would have no consumer touchpoint. Consumer App transforms verified subjects and ultrasound codes into interactive, shoppable experiences, completing the content-to-commerce loop.

---

## Future Enhancements

**Planned features:**
- **Voice commands**: "Hey Hoolsy, add this hat to my cart"
- **AR try-on**: Use phone camera to virtually try on clothing products
- **Social features**: Share discoveries, follow friends, see what others are watching
- **Group sync**: Multiple users sync to same content, share cart
- **Offline mode**: Cache timeline data for offline exploration
- **Smart TV app**: Native app for TVs (eliminates need for phone companion)
- **Location-based sync**: Auto-detect which room/TV is playing content
- **Multi-language sync**: Support for non-English content and ultrasound codes
