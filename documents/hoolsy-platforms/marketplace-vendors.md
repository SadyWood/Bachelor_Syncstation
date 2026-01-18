# Marketplace for Vendors
## Vendor operations platform in the Hoolsy ecosystem

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

Marketplace for Vendors is Hoolsy's commerce operations platform where vendors, brand partners, and merchants manage their product catalogs, pricing, inventory, and campaigns. It serves as the "seller control panel" that enables vendors to connect their businesses to Hoolsy's content-to-commerce ecosystem.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [System Architecture](#system-architecture)
3. [Vendor Onboarding](#vendor-onboarding)
4. [Vendor Management](#vendor-management)
5. [Product Catalog Management](#product-catalog-management)
6. [Product Import System](#product-import-system)
7. [Subject-Product Linking](#subject-product-linking)
8. [Pricing & Inventory Management](#pricing--inventory-management)
9. [Campaign Management](#campaign-management)
10. [Vendor Analytics](#vendor-analytics)
11. [API for Product Consumption](#api-for-product-consumption)
12. [Marketplace for Vendors in the Hoolsy Ecosystem](#marketplace-for-vendors-in-the-hoolsy-ecosystem)

---

## Platform Overview

### What Marketplace for Vendors is
Marketplace for Vendors is the **vendor-facing operations platform** where merchants manage their presence in Hoolsy's content-to-commerce ecosystem. It enables vendors to upload products, connect them to subjects (people, products, locations) from media content, and make their products discoverable in the [Marketplace Storefront](marketplace-storefront.md) and [Consumer App](consumer-app.md).

**Core capabilities:**
- **Vendor onboarding**: Guided registration process with company verification and approval workflow
- **Product catalog management**: Upload, edit, and organize products with full metadata
- **Multi-source import**: Ingest products from CSV, Shopify, REST APIs, and other data sources
- **Subject linking**: Connect products to verified subjects from Workstation (characters, scenes, universes)
- **Pricing & inventory**: Manage prices, stock levels, discounts, and availability
- **Campaign management**: Create time-bound promotions, featured collections, and priority rankings
- **Vendor analytics**: Track product views, clicks, conversions, and sales performance
- **API access**: Stable, read-only API for product consumption by other platforms

### What Marketplace for Vendors is NOT
- **Not a consumer shopping interface** (that's [Marketplace Storefront](marketplace-storefront.md))
- **Not a content management platform** (that's [Workstation](workstation.md))
- **Not a monitoring tool** (that's [Nexus](nexus.md))

Marketplace for Vendors is strictly a **vendor-facing operations platform** for managing commerce.

### Who uses Marketplace for Vendors
- **Vendors and merchants**: Upload and manage product catalogs
- **Brand partners**: Connect branded products to media appearances
- **Campaign managers**: Create promotional campaigns and featured collections
- **Vendor operations teams**: Monitor catalog health, import status, product performance
- **Commerce administrators** (Hoolsy internal): Approve vendors, moderate product listings, manage platform policies

---

## System Architecture

### Shared Authentication Layer
Marketplace for Vendors uses the **same Users Database** as Workstation and Nexus:

**Users Database** (shared across all Hoolsy platforms):
- Vendor users authenticate through the shared authentication system
- Platform access controlled via `user_access_to_platform` grants
- Each vendor user has a `vendor_id` association linking them to their vendor account
- Supports multi-vendor access (one user can represent multiple vendor accounts)

**Marketplace Database** (vendor and product data):
- Core operational database for all commerce-specific data
- Manages vendors, products, campaigns, pricing, inventory, and import jobs
- All vendor operations and product catalog data lives here

**Key functional areas:**
- **Vendor management**: `vendors`, `vendor_users`, `vendor_settings`, `vendor_approvals`
- **Product catalog**: `products`, `product_images`, `product_variants`, `product_categories`
- **Subject linking**: `product_subject_links` (connects to Subject Registry in Workstation)
- **Pricing & inventory**: `product_pricing`, `inventory`, `discounts`
- **Campaigns**: `campaigns`, `campaign_products`, `featured_collections`
- **Import system**: `import_jobs`, `import_logs`, `import_errors`

### Vendor Data Isolation
**Critical security principle**: Marketplace for Vendors enforces **vendor-level data isolation** to ensure vendors can only access their own data.

**Implementation:**
- Every product, campaign, import job, and analytics record has a `vendor_id` foreign key
- All queries are scoped by `vendor_id` derived from the authenticated user's vendor association
- API routes enforce vendor context via middleware (similar to tenant scoping in Workstation)

**Example:**
```
Vendor A can only see:
- Their own products and campaigns
- Orders for their products
- Their own import jobs and analytics

Vendor A CANNOT see:
- Vendor B's products, campaigns, or analytics
- Platform-wide aggregated metrics (only Hoolsy via Nexus)
```

---

## Vendor Onboarding

### Onboarding as the Gateway
Before a vendor can use the platform, they must complete a **guided onboarding process** that feels professional, secure, and straightforward. This is the first impression of Hoolsy's Marketplace, and it sets expectations for the entire vendor experience.

### Onboarding Flow

**1. Initial Registration**
- Vendor visits onboarding landing page
- Enters basic company information (company name, contact email, industry)
- Creates user account (email, password)

**2. Company Details**
- Company registration information (org number, legal entity name)
- Primary contact person and role
- Business address and tax information
- Company website and description

**3. Documentation Upload**
- Business registration documents (if required)
- Tax certificates or VAT registration
- Brand authorization (if representing specific brands)

**4. Storefront Configuration**
- Company logo, banner images
- Brand colors and storefront preferences
- Product categories and target audience
- Estimated catalog size

**5. Review & Approval**
- Submission of onboarding application
- Hoolsy admin reviews vendor information (via Nexus)
- Approval or rejection with feedback
- Vendor notified of approval status

**6. Platform Access**
- Upon approval, vendor gains access to Marketplace for Vendors
- Platform access grant applied via `user_access_to_platform`
- Vendor can begin importing products and managing catalog

### Approval Workflow
Marketplace includes an **admin approval workflow** to ensure vendor quality:

**Pending approval:**
- Vendor account created but marked `status: pending`
- Vendor can view platform but cannot publish products
- Admin reviews company information, documentation, brand authorization

**Approved:**
- Vendor status → `active`
- Full access to product import, catalog management, campaigns
- Products can be published to Storefront

**Rejected:**
- Vendor status → `rejected`
- Feedback provided explaining rejection reason
- Vendor can resubmit with corrections if eligible

### Onboarding Design Principles
The onboarding experience is designed to be:
- **Step-by-step**: Clear progression through registration stages
- **Professional**: Feels trustworthy and enterprise-ready (like Shopify, Google Merchant Center)
- **Visual**: Modern UI with progress indicators, validation feedback, and clear next steps
- **Informative**: Explains what happens at each stage and what is required

---

## Vendor Management

### Vendor Account Structure
Each vendor has an account with:

**Company profile:**
- Company name, logo, description
- Organization number, legal entity information
- Contact details (email, phone, address)

**Vendor settings:**
- Payout configuration (bank account, payment processor integration)
- Tax settings (VAT/sales tax rates, nexus regions)
- Shipping policies (fulfillment options, shipping zones, rates)
- Return policies (return window, refund conditions)

**Storefront branding:**
- Custom logo and banner images
- Brand colors and fonts (within platform design constraints)
- About section and company story
- Social media links

### Vendor Roles & Permissions
Within a vendor organization, multiple users can have different access levels:

**Vendor Admin:**
- Full control over vendor account settings
- Manage other vendor users (invite, remove, assign roles)
- Configure payout and tax settings
- View all analytics and financial reports

**Catalog Manager:**
- Upload and edit products
- Manage pricing and inventory
- Create campaigns and promotions
- Cannot modify vendor settings or financial data

**Operations Manager:**
- View and manage import jobs
- Monitor catalog health and product status
- View analytics (product performance)
- Cannot edit products or campaigns

**Read-Only Analyst:**
- View products, import status, and analytics
- Cannot make any changes
- Useful for external partners or auditors

---

## Product Catalog Management

### Product Model
Each product in Marketplace for Vendors stores:

**Core metadata:**
- **Identity**: UUID, vendor ownership, SKU (vendor-defined stock-keeping unit)
- **Descriptive**: Title, description (short and long), brand name
- **Classification**: Category, tags, attributes (size, color, material, etc.)
- **Media**: Product images (primary + gallery), optional video links
- **SEO**: URL slug, meta description, keywords

**Product variants:**
- Products can have multiple variants (e.g., T-shirt in Small/Medium/Large, or Red/Blue/Green)
- Each variant has its own SKU, price, and inventory count
- Variants share core metadata but differ in specific attributes

**Product status:**
- **Draft**: Product created but not yet published
- **Active**: Published and visible in Storefront
- **Inactive**: Temporarily hidden (out of stock, seasonal, etc.)
- **Archived**: No longer sold, kept for historical records

### Product Categories & Taxonomy
Marketplace for Vendors uses a **hierarchical category system** to organize products:

**Example taxonomy:**
```
Fashion
  └─ Clothing
      ├─ Tops
      │   ├─ T-Shirts
      │   ├─ Sweaters
      │   └─ Jackets
      ├─ Bottoms
      │   ├─ Jeans
      │   ├─ Trousers
      │   └─ Shorts
      └─ Accessories
          ├─ Hats
          ├─ Belts
          └─ Bags

Electronics
  └─ Computers
      ├─ Laptops
      ├─ Desktops
      └─ Accessories
```

Categories enable:
- Faceted search and filtering in Storefront
- Navigation breadcrumbs (Home > Fashion > Clothing > T-Shirts)
- Category-specific attributes (e.g., "screen size" for laptops, "fabric type" for clothing)

### Product Images & Media
Each product can have:
- **Primary image**: Hero shot, shown in search results and listings
- **Gallery images**: Additional angles, details, lifestyle shots
- **Video links**: Optional promotional or demo videos

Images are uploaded to cloud storage and referenced via URLs in the database.

### Product Attributes
Products can have arbitrary key-value attributes to support rich product details:

**Examples:**
- **Clothing**: Size, Color, Material, Care Instructions, Country of Origin
- **Electronics**: Screen Size, RAM, Storage, Battery Life, Warranty
- **Home Goods**: Dimensions, Weight, Material, Care Instructions

Attributes are stored as flexible JSON fields to avoid schema bloat.

---

## Product Import System

### Multi-Source Import
The **import system** is the primary way vendors populate their product catalogs. It supports multiple data sources:

**Supported import sources:**
- **CSV upload**: Manual file upload with standardized CSV format
- **Shopify integration**: Direct API connection to Shopify store
- **WooCommerce integration**: API connection to WooCommerce catalog
- **REST API feed**: Generic REST endpoint providing product JSON
- **Custom integrations**: Vendor-specific data sources (requires Hoolsy approval)

### Import Workflow

**1. Select data source**
- Vendor chooses import method (CSV, Shopify, API, etc.)
- Provides connection credentials or uploads file

**2. Data validation**
- Import system validates data against **Zod schema**
- Checks required fields (title, SKU, price, category)
- Validates data types, formats, constraints
- Reports validation errors with clear feedback

**3. Preview & review**
- Vendor sees preview of products to be imported
- Can review validation errors and warnings
- Option to fix errors and re-upload

**4. Import execution**
- Import job created with status `pending`
- Background job processes products (creates/updates records)
- Import status updates in real-time (`processing`, `completed`, `failed`)

**5. Import results**
- Import summary: X products created, Y updated, Z failed
- Detailed error log for failed products
- Vendor can download error report and retry

### Import Status & Monitoring
Vendors can track import jobs in the **Import Dashboard**:

**Import history:**
- List of all import jobs (date, source, status, product count)
- Filter by status (completed, failed, in progress)

**Import details:**
- View detailed log for each import job
- See which products succeeded, which failed, and why
- Download error report (CSV with error details per product)

**Re-run imports:**
- Option to re-run failed import after fixing issues
- Incremental imports (only import new/changed products)

### Data Validation with Zod
All product data must conform to a **shared Zod schema** before being published:

**Validation rules:**
- Required fields: `title`, `sku`, `price`, `category`
- Field types: `price` must be numeric, `images` must be valid URLs
- Format constraints: `slug` must be lowercase alphanumeric + hyphens
- Business rules: `stock_quantity` must be non-negative

This ensures data quality and consistency across all vendors.

---

## Subject-Product Linking

### What is Subject-Product Linking?
The **core value proposition** of Hoolsy's ecosystem is connecting products to subjects (people, objects, locations) that appear in media content. Marketplace for Vendors is where vendors create these connections.

**Example:**
- In Breaking Bad, Walter White wears a specific hat
- Workstation verifies the AI-detected subject: "Walter White's Hat" (subject_id: abc-123)
- A vendor in Marketplace sells a similar hat (product_id: xyz-789)
- Vendor links product xyz-789 to subject abc-123
- Now, when a user in the Consumer App or Storefront clicks on Walter White's hat in a scene, they see product xyz-789 as a shoppable option

### Linking Workflow

**1. Search Subject Registry**
- Marketplace provides a search interface to query verified subjects from Workstation
- Vendor searches by subject name, media title, or subject_id
- Results show subject metadata (name, media appearances, thumbnail)

**2. Select subject**
- Vendor selects the relevant subject (person, product, location)
- Subject detail panel shows where the subject appears (episodes, scenes, timestamps)

**3. Create link**
- Vendor links their product to the selected subject
- Optional metadata: Link quality ("Exact match", "Similar style", "Inspired by")
- Optional notes for internal tracking

**4. Link status**
- Links can have status: `pending`, `active`, `rejected`
- Hoolsy admin reviews links for quality (via Nexus)
- Approved links become visible in Consumer App and Storefront

### Link Approval Workflow (Quality Control)
To prevent low-quality or misleading product associations, Hoolsy may require **link approval**:

**Pending approval:**
- Vendor submits product-subject link (status: `pending`)
- Link not yet visible in consumer-facing platforms

**Admin review:**
- Hoolsy moderator reviews link (via Nexus or Marketplace admin panel)
- Checks if product genuinely relates to subject
- Checks link quality metadata

**Approval/rejection:**
- **Approved**: Link status → `active`, visible in Storefront and Consumer App
- **Rejected**: Link remains hidden, vendor receives feedback with rejection reason
- Vendor can resubmit with corrections

### Multi-Product Links
A single subject can be linked to **multiple products** from different vendors:

**Example:**
- Subject: "Walter White's Hat"
- Linked products:
  - Vendor A: Official replica, $49.99
  - Vendor B: Budget alternative, $19.99
  - Vendor C: Premium handmade version, $89.99

The Storefront and Consumer App can show all three options, allowing users to choose based on price, rating, or preference.

---

## Pricing & Inventory Management

### Pricing Model
Each product (or variant) has configurable pricing:

**Base price:**
- Vendor-defined list price (e.g., $49.99)
- Multi-currency support (USD, EUR, GBP, NOK, etc.)

**Sale price:**
- Optional discounted price (e.g., $39.99 during a campaign)
- Start and end dates for time-bound sales

**Dynamic pricing:**
- Vendors can adjust prices over time (price history is logged)
- Can be integrated with external pricing tools

**Commission structure:**
- Hoolsy takes a percentage commission on each sale (configurable per vendor or globally)
- Displayed to vendor during pricing setup (e.g., "You will receive 85% of sale price")

### Inventory Management
Marketplace tracks inventory levels to prevent overselling:

**Stock levels:**
- Each product variant has a `quantity_in_stock` field
- Decremented when orders are placed
- Incremented when restocked

**Low stock alerts:**
- Vendors can configure threshold (e.g., "Alert me when stock < 10")
- Notifications sent via email or in-platform alerts

**Out of stock handling:**
- Products can be marked "out of stock" (status: `inactive`)
- Optional "notify me when back in stock" feature for consumers

**Inventory sync:**
- Can integrate with external inventory systems (Shopify, WooCommerce, custom APIs)
- Periodic sync to keep Marketplace inventory up-to-date

### Discounts & Promotions
Vendors can create discount rules:

**Discount types:**
- **Percentage off**: 20% off entire catalog
- **Fixed amount**: $10 off per item
- **Buy X Get Y**: Buy 2, get 1 free
- **Free shipping**: Remove shipping cost for orders over $50

**Discount scoping:**
- Apply to specific products, categories, or entire vendor catalog
- Can be restricted to specific customer segments (e.g., first-time buyers)

**Promo codes:**
- Vendors generate unique codes (e.g., "SUMMER20")
- Codes shared via marketing campaigns, influencers, etc.
- Tracked for attribution and reporting

---

## Campaign Management

### What are Campaigns?
Campaigns are **time-bound promotional events** that feature selected products with special visibility or pricing.

**Campaign types:**
- **Seasonal sales**: Summer Sale, Black Friday, Holiday Deals
- **Product launches**: New collection releases, exclusive drops
- **Media tie-ins**: Campaign tied to a TV series premiere or movie release
- **Featured collections**: Curated sets of products (e.g., "Products from Breaking Bad", "Best Tech Gadgets")

### Campaign Workflow

**1. Create campaign**
- Vendor defines campaign name, description, start/end dates
- Uploads banner images and promotional copy

**2. Select products**
- Vendor adds products to campaign
- Can apply campaign-specific pricing (discounts)
- Set priority ranking (which products to feature first)

**3. Publish campaign**
- Campaign goes live (if within date range)
- Featured in Storefront homepage, product carousels, promotional banners

**4. Track performance**
- View campaign-specific analytics (views, clicks, conversions)
- Compare campaign performance to baseline

### Priority & Ranking
Campaigns allow vendors to **prioritize products** for visibility:

**Priority levels:**
- **High**: Featured prominently in Storefront (hero banners, top carousels)
- **Medium**: Standard placement in campaign collections
- **Low**: Included in campaign but not prioritized

This gives vendors control over which products to emphasize during promotions.

---

## Vendor Analytics

### Analytics Dashboard
Marketplace for Vendors provides vendors with performance metrics:

**Product performance:**
- Total views, clicks, conversions per product
- Best-selling products by revenue, units sold
- Average order value for products
- Cart abandonment rate

**Campaign performance:**
- Campaign views, click-through rate
- Conversions attributed to campaign
- Revenue generated during campaign period

**Channel breakdown:**
- Sales from Storefront vs. Consumer App
- Sales from organic search vs. subject linking vs. campaigns

**Subject linking performance:**
- Which subject links drive the most traffic
- Conversion rate per subject link (link quality indicator)

### Financial Reporting
Vendors can view:
- Total revenue, net revenue after commission
- Transaction history, payout schedule
- Tax reporting (total sales per region for VAT/sales tax)

### Catalog Health
Vendors can monitor catalog quality:
- Products missing images or descriptions
- Products out of stock for extended periods
- Products with zero views in last 30 days (needs optimization)

---

## API for Product Consumption

### Read-Only Product API
Marketplace for Vendors exposes a **stable, read-only API** for consuming product data. This API is used by:
- [Marketplace Storefront](marketplace-storefront.md) (desktop webshop)
- [Consumer App](consumer-app.md) (mobile app, subject discovery)
- [Nexus](nexus.md) (platform analytics)

### API Principles
- **Read-only**: API does not allow creating/updating products (vendors use Marketplace for Vendors UI)
- **Stable**: API contracts versioned, changes communicated in advance
- **Documented**: Full API documentation with examples
- **Filterable**: Support filtering by category, brand, price, availability, subject_id

### Key API Endpoints

**GET /api/products**
- List all active products
- Supports filtering, sorting, pagination
- Returns product summaries (id, title, price, images, brand)

**GET /api/products/:id**
- Fetch full product details
- Returns all metadata, variants, images, subject links

**GET /api/products/by-subject/:subject_id**
- List all products linked to a specific subject
- Used for "shoppable scenes" in Consumer App

**GET /api/products/search?q=<query>**
- Full-text search across product titles, descriptions, brands
- Returns ranked results

**GET /api/campaigns**
- List active campaigns
- Returns campaign metadata, featured products

### API Documentation
Marketplace for Vendors includes a **developer interface** where:
- API contracts are displayed (Zod schemas)
- Example API requests can be tested (Postman, cURL)
- API changelog and versioning information is maintained

---

## Marketplace for Vendors in the Hoolsy Ecosystem

### The Five Platforms

**1. Workstation**
- Internal platform for content preparation and subject verification
- **Relationship to Marketplace for Vendors**: Workstation verifies subjects that vendors link to products

**2. Marketplace for Vendors** (this document)
- Vendor-facing platform for product catalog management
- **Relationship to other platforms**:
  - Queries Workstation's Subject Registry for linkable subjects
  - Provides product data to Storefront and Consumer App
  - Sends vendor activity data to Nexus

**3. Marketplace Storefront**
- Consumer-facing desktop webshop for browsing and purchasing products
- **Relationship to Marketplace for Vendors**: Consumes product data via read-only API

**4. Consumer App**
- Mobile companion app for ultrasound-synced shoppable scenes
- **Relationship to Marketplace for Vendors**: Consumes product data, displays products linked to subjects

**5. Syncstation**
- On-set companion app for production crews
- **Relationship to Marketplace for Vendors**: No direct relationship; both consume Workstation content metadata

**6. Nexus**
- Internal oversight and administration
- **Relationship to Marketplace for Vendors**: Monitors vendor activity, approves vendors, reviews product-subject links

### Data Flow

**Workstation → Marketplace for Vendors:**
- Verified subject metadata (for linking to products)
- Subject identities from Subject Registry

**Marketplace for Vendors → Storefront:**
- Product catalog (titles, images, prices, inventory)
- Product-subject links (enables context-based discovery)

**Marketplace for Vendors → Consumer App:**
- Product catalog for shoppable scenes
- Product-subject links for in-content discovery

**Marketplace for Vendors → Nexus:**
- Vendor activity logs (new vendors, product uploads, link submissions)
- Sales metrics (revenue, order volume, conversion rates)

**Consumer App/Storefront → Marketplace for Vendors:**
- Order requests (checkout, payment)
- Product view/click events (analytics)

### Shared Infrastructure

**Users Database:**
- Vendor users authenticate through shared Users database
- Platform access grants determine which vendors can access Marketplace for Vendors

**Subject Registry:**
- Global identity layer for subjects (people, products, locations)
- Marketplace for Vendors queries Subject Registry to enable product-subject linking
- Ensures "this subject in Workstation IS the same as this product in Marketplace"

### Why Marketplace for Vendors Exists
Marketplace for Vendors solves a critical business problem: enabling vendors to participate in Hoolsy's content-to-commerce ecosystem without requiring manual data entry or complex integrations.

**Key benefits:**
- **Self-service**: Vendors can onboard, import products, and manage catalogs without Hoolsy involvement
- **Data quality**: Validation, approval workflows, and structured schemas ensure high-quality product data
- **Subject linking**: Vendors connect products to media content, enabling discovery beyond traditional search
- **Scalability**: Import system handles catalogs of any size (hundreds to millions of products)

### Marketplace for Vendors' Role in the Workflow
In the end-to-end content-to-commerce flow:

1. **Content ingestion** (Workstation): Media uploaded, subjects detected
2. **Human verification** (Workstation): Subjects verified, linked to Subject Registry
3. **Vendor onboarding** (Marketplace for Vendors): Vendors register, get approved
4. **Product upload** (Marketplace for Vendors): Vendors import product catalogs
5. **Subject linking** (Marketplace for Vendors): Vendors link products to verified subjects
6. **Link approval** (Nexus/Marketplace for Vendors): Hoolsy approves product-subject links for quality
7. **Publishing** (Marketplace for Vendors → Storefront/Consumer App): Products become shoppable
8. **Discovery** (Consumer App/Storefront): Users find products via subjects or browsing
9. **Purchase** (Consumer App/Storefront → Marketplace for Vendors): Orders created, payments processed
10. **Fulfillment** (Marketplace for Vendors): Vendors ship orders, update tracking

Marketplace for Vendors is the **vendor gateway** that enables commerce within Hoolsy's content-driven ecosystem.
