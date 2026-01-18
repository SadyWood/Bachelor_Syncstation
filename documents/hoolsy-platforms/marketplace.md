# Marketplace Platform
## Commerce ecosystem overview

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

Marketplace is Hoolsy's commerce platform ecosystem consisting of two distinct but interconnected platforms: one for vendors to manage their business operations, and one for consumers to discover and purchase products through content-driven experiences.

---

## Two Platforms, One Ecosystem

Marketplace consists of two separate platforms serving different users and purposes:

### [Marketplace for Vendors](marketplace-vendors.md)
The **vendor-facing operations platform** where merchants manage their business.

**Purpose**: Enable vendors to upload products, connect them to media subjects, manage pricing and inventory, and track performance.

**Who uses it**:
- Vendors and merchants
- Brand partners
- Campaign managers
- Commerce administrators

**Key capabilities**:
- Vendor onboarding and approval
- Product catalog management
- Multi-source import (CSV, Shopify, REST APIs)
- Subject-product linking
- Pricing, inventory, and campaign management
- Vendor analytics dashboard
- Read-only API for product consumption

[Read full documentation →](marketplace-vendors.md)

---

### [Marketplace Storefront](marketplace-storefront.md)
The **consumer-facing desktop webshop** where users discover and purchase products through content-driven experiences.

**Purpose**: Provide a visual, narrative-driven shopping experience where products are discovered through the context of films, series, characters, and themes.

**Who uses it**:
- General consumers
- Fans of specific series/movies
- Style enthusiasts
- Gift shoppers

**Key capabilities**:
- Content-driven discovery (browse by series, character, scene, theme)
- Visual storytelling and rich imagery
- Curated collections and boards
- Product detail pages with subject context
- Shopping cart and checkout
- Personalization and recommendations

[Read full documentation →](marketplace-storefront.md)

---

## How They Work Together

**Data flow:**
1. Vendors upload products via [Marketplace for Vendors](marketplace-vendors.md)
2. Vendors link products to subjects (characters, scenes, universes) from Workstation
3. Hoolsy admins approve product-subject links for quality
4. Products become visible in [Marketplace Storefront](marketplace-storefront.md)
5. Consumers discover products through content-driven navigation
6. Consumers purchase products via Storefront
7. Orders flow back to vendors in Marketplace for Vendors
8. Vendors fulfill orders and track performance

**Shared infrastructure:**
- **Product catalog**: Single source of truth for all products, pricing, inventory
- **Subject-product links**: Enable content-driven discovery in Storefront
- **Users database**: Shared authentication for vendor users (same as Workstation)
- **Order system**: Orders created in Storefront, managed by vendors in Marketplace for Vendors

---

## Marketplace in the Hoolsy Ecosystem

### The Five Platforms

**1. Workstation**
- Internal platform for content preparation and subject verification
- **Relationship to Marketplace**: Workstation verifies subjects that vendors link to products

**2. Marketplace** (this overview)
- **Marketplace for Vendors**: Vendor operations platform
- **Marketplace Storefront**: Consumer shopping platform
- **Relationship to other platforms**: Bridges content and commerce

**3. Consumer App**
- Mobile companion app for ultrasound-synced shoppable scenes
- **Relationship to Marketplace**: Shares product catalog and order system with Storefront

**4. Syncstation**
- On-set companion app for production crews
- **Relationship to Marketplace**: No direct relationship; both consume Workstation content metadata

**5. Nexus**
- Internal oversight and administration
- **Relationship to Marketplace**: Monitors vendor activity, Storefront performance, approves vendors and product-subject links

---

## Quick Navigation

### For Vendors
Looking to sell products through Hoolsy? Start here:
- [Marketplace for Vendors Documentation](marketplace-vendors.md)

### For Understanding Consumer Experience
Want to understand the shopping experience? Start here:
- [Marketplace Storefront Documentation](marketplace-storefront.md)

### For Platform Integration
Building against Marketplace APIs? See:
- [Marketplace for Vendors - API Section](marketplace-vendors.md#api-for-product-consumption)

---

## Core Concepts Across Marketplace

### Subject-Product Linking
The **defining feature** of Hoolsy's Marketplace is the ability to link products to subjects from media content:

**Example:**
- In Breaking Bad, Walter White wears a specific hat
- Workstation verifies the AI-detected subject: "Walter White's Hat" (subject_id: abc-123)
- A vendor sells a similar hat (product_id: xyz-789)
- Vendor links product xyz-789 to subject abc-123 via Marketplace for Vendors
- Consumers discover the hat in Marketplace Storefront by browsing "Products from Breaking Bad" or "Walter White's Wardrobe"

This transforms traditional product search into **content-driven discovery**.

### Multi-Vendor Marketplace
Marketplace supports multiple vendors competing on the same platform:
- Multiple vendors can link products to the same subject
- Consumers see all options and choose based on price, rating, preference
- Each vendor manages their own catalog, pricing, and fulfillment independently

### Data Quality & Approval
To maintain quality, Marketplace includes approval workflows:
- **Vendor approval**: New vendors reviewed and approved before publishing products
- **Product-subject link approval**: Links reviewed to prevent misleading associations
- **Product moderation**: Flagged products reviewed for policy compliance

---

## Marketplace's Role in Content-to-Commerce

Marketplace is the **commerce engine** that monetizes Hoolsy's content-to-commerce vision:

1. **Content ingestion** (Workstation): Media uploaded, subjects detected and verified
2. **Product upload** (Marketplace for Vendors): Vendors add products to catalog
3. **Subject linking** (Marketplace for Vendors): Vendors connect products to subjects
4. **Link approval** (Nexus/Marketplace for Vendors): Hoolsy ensures quality
5. **Publishing** (Marketplace for Vendors → Storefront): Products go live
6. **Discovery** (Marketplace Storefront): Consumers find products through content context
7. **Purchase** (Marketplace Storefront): Consumers buy products
8. **Fulfillment** (Marketplace for Vendors): Vendors ship orders
9. **Analytics** (Marketplace for Vendors + Nexus): Track performance and optimize

Without Marketplace, Hoolsy's subject detection and content metadata would have no commercial outcome. Marketplace transforms verified subjects into shoppable products, completing the content-to-commerce loop.
