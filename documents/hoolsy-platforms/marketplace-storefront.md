# Marketplace Storefront
## Consumer shopping experience in the Hoolsy ecosystem

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

Marketplace Storefront is Hoolsy's desktop webshop where consumers discover and purchase products inspired by films, series, characters, and media universes. It transforms traditional e-commerce into a narrative-driven, visually rich shopping experience where products are presented in the context of the content they appear in.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [Design Philosophy](#design-philosophy)
3. [Content-Driven Discovery](#content-driven-discovery)
4. [Visual & Navigation Structure](#visual--navigation-structure)
5. [Product Browsing Experience](#product-browsing-experience)
6. [Product Detail Pages](#product-detail-pages)
7. [Collections & Themes](#collections--themes)
8. [Shopping Experience](#shopping-experience)
9. [Personalization & Recommendations](#personalization--recommendations)
10. [Integration with Consumer App](#integration-with-consumer-app)
11. [Marketplace Storefront in the Hoolsy Ecosystem](#marketplace-storefront-in-the-hoolsy-ecosystem)

---

## Platform Overview

### What Marketplace Storefront is
Marketplace Storefront is the **consumer-facing desktop webshop** where users explore products through the lens of media content. Unlike traditional e-commerce platforms that focus solely on product listings, Marketplace Storefront presents products as part of narratives, aesthetics, and universes from films and series.

**Core capabilities:**
- **Content-driven discovery**: Browse products by TV series, movies, characters, scenes, or themes
- **Visual storytelling**: Products presented with rich imagery, context, and narrative connections
- **Collections & boards**: Curated product sets organized by theme, aesthetic, or media universe
- **Product context**: Every product shown with its media origin (which series, which character, which scene)
- **Multi-vendor marketplace**: Products from multiple vendors displayed in unified, cohesive experience
- **Shopping functionality**: Add to cart, checkout, order tracking (powered by [Marketplace for Vendors](marketplace-vendors.md))

### What Marketplace Storefront is NOT
- **Not a vendor management tool** (that's [Marketplace for Vendors](marketplace-vendors.md))
- **Not a mobile app** (that's [Consumer App](consumer-app.md), which provides companion shopping on mobile)
- **Not a content streaming platform** (Hoolsy does not stream content; [Consumer App](consumer-app.md) syncs with external streaming platforms via ultrasound)

Marketplace Storefront is strictly a **desktop shopping experience** designed for exploration, discovery, and purchasing.

### Who uses Marketplace Storefront
- **General consumers**: Anyone who wants to discover and purchase products featured in media
- **Fans of specific series/movies**: Users who want to own products from their favorite content
- **Style enthusiasts**: Users seeking products with specific aesthetics or themes
- **Gift shoppers**: Users looking for unique gifts inspired by popular media

---

## Design Philosophy

### Visual-First Experience
Marketplace Storefront prioritizes **visual storytelling** over traditional product grids. The experience is designed to feel more like:
- **Pinterest**: Visual boards, collections, and inspiration
- **HBO Max or Netflix**: Rich imagery, hero banners, thematic navigation
- **Lookbooks**: Editorial-style product presentations with lifestyle imagery

**Design principles:**
- **Large visual surfaces**: Hero banners, full-width images, prominent product photography
- **Narrative context**: Products always shown with their story (which series, which character, which scene)
- **Curated collections**: Products grouped by theme, aesthetic, or narrative rather than just category
- **Emotional connection**: Users discover products through content they love, not generic browsing

### Desktop-First Design
Marketplace Storefront is optimized for **desktop viewing**:
- **Large screens**: Leverage wide viewports for immersive visuals, side-by-side layouts, detailed product galleries
- **Hover interactions**: Rich hover effects, tooltips, quick-view overlays
- **Multi-panel layouts**: Browse collections while viewing product details without losing context
- **Keyboard navigation**: Support for arrow keys, tab navigation, shortcuts

### Inspiration Over Transaction
The goal is to inspire users before they purchase:
- Users explore content universes and discover products they didn't know they wanted
- Products are presented as part of a larger story, not isolated items
- The experience prioritizes discovery and inspiration over quick checkout

---

## Content-Driven Discovery

### Entry Points
Users can discover products through multiple content-driven entry points:

**1. Homepage**
- Hero section featuring current campaigns, trending collections, or new releases
- Thematic rows: "Products from Stranger Things", "Mid-Century Modern Aesthetic", "Tech from James Bond"
- Curated boards highlighting specific narratives or aesthetics

**2. Browse by Series/Movie**
- Directory of TV series, movies, and media franchises
- Click on a title to see all products featured or inspired by that content
- Shows product context (which character, which season, which scene)

**3. Browse by Character**
- Directory of characters from popular media
- Click on a character to see their wardrobe, accessories, signature items
- Example: "Walter White's Wardrobe", "James Bond's Gadgets"

**4. Browse by Scene/Moment**
- Iconic scenes from films and series
- Click on a scene to see products visible in that moment
- Example: "Breaking Bad - Pilot Opening Scene", "Mad Men - Don Draper's Office"

**5. Browse by Theme/Aesthetic**
- Curated collections based on visual style or mood
- Example: "Mid-Century Modern", "Nordic Minimalism", "Cyberpunk Tech"

**6. Browse by Universe**
- Products grouped by fictional universe or franchise
- Example: "Products from the James Bond Universe", "Star Wars Collectibles"

### Subject-Driven Navigation
All content-driven discovery is powered by **Subject Registry** from Workstation:
- Every product is linked to one or more subjects (people, objects, locations)
- Subjects provide context: "This jacket appeared in Breaking Bad Season 3, Episode 5, worn by Walter White"
- Users navigate through subjects to discover products organically

---

## Visual & Navigation Structure

### Homepage Layout

**Hero Section:**
- Full-width banner featuring current campaign or trending collection
- Large imagery, compelling headline, call-to-action button
- Auto-rotating carousel or static hero depending on priority

**Content Rows:**
- Horizontal scrolling rows of products or collections
- Each row has a theme: "Products from Breaking Bad", "Trending This Week", "New Arrivals"
- Click a row to expand into full collection view

**Featured Boards:**
- Large visual tiles linking to curated collections
- Example tiles: "Mad Men Aesthetic", "Stranger Things Nostalgia", "James Bond Tech"

**Category Navigation:**
- Secondary navigation for traditional category browsing (Fashion, Electronics, Home, etc.)
- For users who prefer category-based shopping over content-driven discovery

### Collection Pages
When a user clicks on a series, character, or theme:

**Collection header:**
- Large banner image representing the collection (e.g., still from Breaking Bad)
- Collection title and description ("Products from Breaking Bad")
- Context metadata (number of products, vendor count, related themes)

**Product grid:**
- Grid layout of products within the collection
- Each product tile shows image, title, price, vendor
- Hover effect reveals quick info (rating, subject link, "Quick View" button)

**Filtering & sorting:**
- Filter by product category, price range, vendor, rating
- Sort by popularity, price (low-high, high-low), newest, best-rated

**Side panel (optional):**
- Contextual info about the collection (series synopsis, character bio)
- Related collections or themes

### Product Grid vs. Board View
Users can toggle between viewing modes:

**Grid View:**
- Traditional grid of product tiles
- Efficient for browsing large catalogs
- Shows key info at a glance (image, title, price)

**Board View:**
- Pinterest-style masonry layout
- More visual, less structured
- Emphasizes imagery and aesthetic over uniformity

---

## Product Browsing Experience

### Product Tiles
Each product in a grid or collection is represented by a tile:

**Visible by default:**
- Product image (primary)
- Product title
- Price (including sale price if applicable)
- Vendor name/logo

**On hover:**
- Secondary image (if available) or zoom effect
- Quick-view button ("Quick View")
- Rating and review count
- Subject link indicator (e.g., "From Breaking Bad S03E05")

**Interactions:**
- Click tile → navigate to product detail page
- Click "Quick View" → open overlay with product details without leaving collection
- Click subject link → navigate to subject detail (e.g., scene or character page)

### Filtering & Sorting

**Filters:**
- **Category**: Clothing, Electronics, Home, Accessories, etc.
- **Price range**: Slider or predefined ranges (Under $50, $50-$100, etc.)
- **Vendor**: Filter by specific vendors
- **Availability**: In stock, out of stock, pre-order
- **Rating**: Minimum star rating (4+ stars, 5 stars)
- **Subject**: Filter by specific character, scene, or theme

**Sorting:**
- **Popularity**: Most viewed or most purchased
- **Price**: Low to high, high to low
- **Newest**: Recently added products
- **Best rated**: Highest average rating
- **Relevance**: Based on search query or recommendation algorithm

### Search
Full-text search across products:
- Search by product name, brand, category, or subject (e.g., "Walter White hat")
- Autocomplete suggestions as user types
- Search results displayed as filterable product grid

---

## Product Detail Pages

### Product Detail Layout
When a user clicks on a product, they see a dedicated product detail page:

**Left side: Product imagery**
- Large primary image
- Image gallery (thumbnails below or side-by-side)
- Click image to zoom or open lightbox
- Optional product video (autoplay or click-to-play)

**Right side: Product information**
- Product title
- Brand name
- Price (with sale price if applicable)
- Rating and review count (link to reviews section below)
- Brief description
- Variant selector (size, color, etc.)
- Quantity selector
- "Add to Cart" button
- "Add to Wishlist" button (save for later)
- Availability status (in stock, low stock, out of stock)

**Below the fold:**
- **Full description**: Detailed product description
- **Specifications**: Technical details, materials, dimensions, etc.
- **Subject context**: Where this product appears (series, episode, character, scene)
- **Related subjects**: Other subjects associated with this product
- **Vendor info**: Vendor name, logo, storefront link, policies
- **Reviews & ratings**: User reviews, photos, ratings
- **Related products**: Similar items or products from the same collection

### Subject Context Section
The **subject context section** is critical for Hoolsy's value proposition:

**Displayed information:**
- Subject name (e.g., "Walter White's Hat")
- Media appearance (e.g., "Breaking Bad, Season 1, Episode 1")
- Scene thumbnail or timestamp
- Link to scene or character page

**Example:**
```
This product appears in:
- Breaking Bad, Season 1, Episode 1 ("Pilot")
  Worn by Walter White in the desert scene (03:45 - 05:12)
  [View scene]

Related subjects:
- Walter White (Character)
- Heisenberg Hat (Iconic Item)
```

Users can click on subject links to explore more products from that character, scene, or universe.

### Related Products
At the bottom of the product detail page:
- **Similar products**: Other products in the same category or with similar attributes
- **From the same vendor**: Other products from this vendor
- **From the same collection**: Other products from the same series or theme
- **Frequently bought together**: Products often purchased with this item

---

## Collections & Themes

### What are Collections?
Collections are **curated sets of products** grouped by a unifying concept, narrative, or aesthetic. They are the primary way users discover products in Marketplace Storefront.

**Collection types:**

**1. Content-based collections**
- Products from a specific TV series, movie, or franchise
- Example: "Products from Breaking Bad", "James Bond Gadgets"

**2. Character-based collections**
- Products associated with a specific character
- Example: "Walter White's Wardrobe", "Carrie Bradshaw's Style"

**3. Aesthetic-based collections**
- Products grouped by visual style or design movement
- Example: "Mid-Century Modern", "Nordic Minimalism", "Retro Tech"

**4. Seasonal collections**
- Products curated for specific seasons or events
- Example: "Holiday Gift Guide", "Summer Essentials"

**5. Vendor collections**
- Featured products from a specific vendor
- Example: "Nike x Breaking Bad", "IKEA Mid-Century Collection"

### Collection Curation
Collections can be:
- **Automatically generated**: Based on product-subject links (e.g., all products linked to "Breaking Bad")
- **Manually curated**: Hoolsy editors or vendors select products for specific narratives or aesthetics
- **Hybrid**: Auto-generated base with manual refinement

### Featured Collections
Homepage and collection pages can feature **priority collections**:
- Seasonal or campaign-driven collections (e.g., "Black Friday Deals")
- New releases or trending collections
- Editorial picks or staff favorites

---

## Shopping Experience

### Add to Cart
Users can add products to their cart from:
- Product detail page
- Quick-view overlay (from product tile hover)
- Collection pages (if "Quick Add" enabled)

**Cart functionality:**
- Multi-vendor support (cart can contain products from multiple vendors)
- Persistent cart (saved to user account, syncs across devices)
- Guest cart (saved to browser storage for non-logged-in users)

### Shopping Cart
Users can view and manage their cart:

**Cart page displays:**
- List of products with images, titles, prices, quantities
- Adjust quantity or remove items
- Subtotal per vendor (if multi-vendor)
- Apply promo codes
- Estimated shipping and tax (calculated at checkout)
- "Proceed to Checkout" button

**Cart validation:**
- Check product availability and stock levels
- Notify user if product is out of stock or price changed
- Update totals dynamically

### Checkout Flow
Streamlined checkout process:

1. **Shipping info**: Enter or select shipping address
2. **Shipping method**: Choose shipping speed (standard, express, etc.) per vendor
3. **Payment**: Enter or select payment method (credit card, PayPal, Apple Pay, etc.)
4. **Order review**: Confirm order details, totals
5. **Submit order**: Payment processed, order confirmed
6. **Confirmation page**: Order number, estimated delivery, tracking link

**Guest checkout:**
- Users can checkout without creating account
- Email required for order confirmation and tracking

### Order Confirmation & Tracking
After purchase:
- Order confirmation email with order number, items, total, estimated delivery
- Order status page (view order status, tracking number, expected delivery date)
- Tracking link to carrier (once shipped)

---

## Personalization & Recommendations

### Personalized Homepage
Registered users see a **personalized homepage** based on:
- Watch history (from Consumer App, if integrated)
- Browsing history (collections viewed, products clicked)
- Purchase history
- Saved items (wishlist)
- Stated preferences (favorite genres, styles)

**Personalized rows:**
- "Recommended for You"
- "Products from Your Watched Shows"
- "Similar to Products You've Viewed"
- "Trending Among Users Like You"

### Recommendation Engine
Marketplace Storefront uses recommendations to surface relevant products:

**Content-based recommendations:**
- "Because you watched Breaking Bad..." → Products from Breaking Bad
- "Products from [favorite genre]" → Products from series in that genre

**Product-based recommendations:**
- "Similar products" → Products with similar attributes
- "Frequently bought together" → Co-purchased products
- "Customers also viewed" → Products viewed by users who viewed this product

**Aesthetic-based recommendations:**
- If user frequently views Mid-Century Modern products → Recommend similar aesthetics

### Wishlist & Saved Items
Users can save products for later:
- "Add to Wishlist" button on product detail page or tiles
- Wishlist page displays all saved products
- Notifications when wishlisted products go on sale or back in stock

---

## Integration with Consumer App

### Unified Product Catalog
Marketplace Storefront and [Consumer App](consumer-app.md) share the same product catalog from [Marketplace for Vendors](marketplace-vendors.md):
- Products, pricing, inventory sync in real-time
- Subject-product links consistent across both platforms

### Cross-Platform Features

**Shared cart:**
- Users can add products to cart in Consumer App (via shoppable scenes) and continue shopping in Storefront
- Cart syncs across devices and platforms

**Shared wishlist:**
- Products saved in Consumer App appear in Storefront wishlist and vice versa

**Shared order history:**
- Orders placed in either platform visible in unified order history

### Platform-Specific Strengths

**Marketplace Storefront (desktop) excels at:**
- Browsing large catalogs with detailed filters and sorting
- Viewing product galleries and specifications on large screens
- Exploring collections and themes in immersive layouts

**Consumer App (mobile) excels at:**
- Shoppable scenes (syncs with content on TV via ultrasound, displays products on phone in real-time)
- On-the-go shopping with quick checkout (saved payment methods)
- Push notifications for deals, back-in-stock alerts

Users move fluidly between platforms based on context (watching content on TV with phone companion → shopping on desktop, or vice versa).

---

## Marketplace Storefront in the Hoolsy Ecosystem

### The Five Platforms

**1. Workstation**
- Internal platform for content preparation and subject verification
- **Relationship to Storefront**: Workstation verifies subjects that products are linked to

**2. Marketplace for Vendors**
- Vendor-facing platform for product catalog management
- **Relationship to Storefront**: Storefront consumes product data via read-only API

**3. Marketplace Storefront** (this document)
- Consumer-facing desktop webshop for browsing and purchasing products
- **Relationship to other platforms**:
  - Consumes product data from Marketplace for Vendors
  - Consumes subject metadata from Workstation (via Subject Registry)
  - Sends user behavior and sales data to Nexus

**4. Consumer App**
- Mobile companion app for ultrasound-synced shoppable scenes
- **Relationship to Storefront**: Shares product catalog, cart, wishlist; complementary discovery methods

**5. Syncstation**
- On-set companion app for production crews
- **Relationship to Storefront**: No direct relationship; both consume Workstation content metadata

**6. Nexus**
- Internal oversight and administration
- **Relationship to Storefront**: Monitors Storefront performance, user behavior, conversion funnels

### Data Flow

**Marketplace for Vendors → Storefront:**
- Product catalog (titles, images, prices, inventory)
- Product-subject links (enables content-driven discovery)
- Campaigns and featured collections

**Workstation → Storefront:**
- Subject metadata (names, media appearances, thumbnails)
- Subject Registry (ensures consistent subject identities)

**Storefront → Marketplace for Vendors:**
- Order requests (checkout, payment)
- Product view/click events (analytics)

**Storefront → Nexus:**
- User behavior logs (page views, product views, searches)
- Conversion funnel data (cart adds, checkouts, purchases)
- Performance metrics (page load times, error rates)

**Storefront ↔ Consumer App:**
- Shared cart, wishlist, order history
- Cross-platform product discovery (content-driven in app, browse-driven in Storefront)

### Why Marketplace Storefront Exists
Marketplace Storefront addresses a specific use case: **desktop-first, exploratory shopping** where users want to browse large catalogs, compare products, and discover items in rich, immersive layouts.

**Key benefits:**
- **Visual discovery**: Large screens enable rich imagery, collections, and narrative-driven browsing
- **Deep exploration**: Users can spend time exploring themes, aesthetics, and universes without the constraints of mobile UX
- **Desktop checkout**: Easier to enter shipping/payment info, review order details on larger screens
- **Complementary to mobile**: Users discover products on mobile (via Consumer App's ultrasound-synced shoppable scenes while watching TV) and continue shopping on desktop (via Storefront), or vice versa

### Marketplace Storefront's Role in the Workflow
In the end-to-end content-to-commerce flow:

1. **Content ingestion** (Workstation): Media uploaded, subjects detected
2. **Human verification** (Workstation): Subjects verified, linked to Subject Registry
3. **Product upload** (Marketplace for Vendors): Vendors import product catalogs
4. **Subject linking** (Marketplace for Vendors): Vendors link products to verified subjects
5. **Publishing** (Marketplace for Vendors → Storefront): Products become visible in Storefront
6. **Discovery** (Storefront): Users browse collections, themes, and content-driven entry points
7. **Shopping** (Storefront): Users add products to cart, checkout
8. **Purchase** (Storefront → Marketplace for Vendors): Orders created, payments processed
9. **Fulfillment** (Marketplace for Vendors): Vendors ship orders
10. **Analytics** (Storefront → Nexus): Performance data aggregated for reporting

Marketplace Storefront is the **desktop shopping experience** that transforms content discovery into commerce.
