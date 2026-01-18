# Forskjeller og likheter mellom de 4 student-teamene

Dette dokumentet forklarer hva som skal være likt og ulikt for de 4 forskjellige student-teamene når det gjelder database-arkitektur og frontend-teknologi.

---

## Oversikt

| Team | Frontend | USER DB | Workstation DB | App-spesifikk DB | Users_public DB |
|------|----------|---------|----------------|------------------|-----------------|
| **Syncstation** | React Native + Expo | ✅ (fra Hoolsy-platforms) | ✅ (fra Hoolsy-platforms) | ✅ (egen DB) | ❌ |
| **Marketplace Vendor Onboarding** | React + Vite | ✅ (fra Hoolsy-platforms) | ✅ (fra Hoolsy-platforms) | ✅ (egen DB) | ❌ |
| **Marketplace Storefront** | React + Vite | ❌ | ❌ | ❌ | ✅ |
| **Consumer App** | React Native + Expo | ❌ | ❌ | ❌ | ✅ |

---

## Gruppe 1: Syncstation

### Frontend
- **React Native + Expo Go**
- Offline-first design (logging skal fungere uten nettverkstilgang)
- On-set companion app for logging

### Databaser

#### 1. USER DB (fra Hoolsy-platforms)
- **Formål:** Multi-tenant autentisering, brukere, roller
- **Kilde:** Kopieres fra `hoolsy-platforms` repo
- **Schema:** Ferdig definert, **skal IKKE endres**
- **Tilgang:** Read-only for appen
- **Innhold:**
  - Users (med tenant_id)
  - Tenants (multi-tenant struktur)
  - Roles (admin, editor, viewer)

#### 2. Workstation DB (fra Hoolsy-platforms)
- **Formål:** Content nodes, prosjekt-hierarki
- **Kilde:** Kopieres fra `hoolsy-platforms` repo
- **Schema:** Ferdig definert, **skal IKKE endres**
- **Tilgang:** Read-only for appen
- **Innhold:**
  - Content nodes (root, group, episode, scene)
  - Node metadata
  - Hierarkisk struktur

#### 3. Syncstation DB (egen database)
- **Formål:** App-spesifikk data for Syncstation
- **Kilde:** Opprettes av teamet
- **Schema:** Kan tilpasses fritt av teamet
- **Tilgang:** Full tilgang
- **Innhold (eksempler):**
  - Log entries (bruker-logg fra settet)
  - Media URLs (bilder/videoer tatt på settet)
  - File URLs (dokumenter)
  - Sync status (local, pending, synced, failed)
  - Offline queue

### Zod Schemas
Teamet **må** bruke delte schemas fra `@hk26/schema` for:
- Auth (login, register)
- Users og tenants
- Content nodes (referanser til Workstation DB)
- Syncstation-spesifikke schemas (log entries, sync status)

---

## Gruppe 2: Marketplace Vendor Onboarding

### Frontend
- **React + Vite**
- Desktop-fokusert onboarding flow
- Vendor registrering og produkt-opplasting

### Databaser

#### 1. USER DB (fra Hoolsy-platforms)
- **Formål:** Multi-tenant autentisering, brukere, roller
- **Kilde:** Kopieres fra `hoolsy-platforms` repo
- **Schema:** Ferdig definert, **skal IKKE endres**
- **Tilgang:** Read-only for appen
- **Innhold:**
  - Users (med tenant_id)
  - Tenants (vendors i dette tilfellet)
  - Roles

#### 2. Workstation DB (fra Hoolsy-platforms)
- **Formål:** Content nodes, prosjekt-hierarki
- **Kilde:** Kopieres fra `hoolsy-platforms` repo
- **Schema:** Ferdig definert, **skal IKKE endres**
- **Tilgang:** Read-only for appen
- **Innhold:**
  - Content nodes
  - Node metadata
  - Hierarkisk struktur

#### 3. Vendor Onboarding DB (egen database)
- **Formål:** App-spesifikk data for vendor onboarding
- **Kilde:** Opprettes av teamet
- **Schema:** Kan tilpasses fritt av teamet
- **Tilgang:** Full tilgang
- **Innhold (eksempler):**
  - Vendor onboarding status
  - Onboarding workflow state
  - Temporary product drafts (før publisering)
  - Vendor verification data
  - Upload progress

### Zod Schemas
Teamet **må** bruke delte schemas fra `@hk26/schema` for:
- Auth
- Users og tenants
- **Products** (KRITISK: må matche Marketplace core eksakt!)
- **Vendors** (KRITISK: må matche Marketplace core eksakt!)
- Categories

**VIKTIG:** Produkter og vendors må bruke nøyaktig de samme feltnavnene som Marketplace core. Eksempel: bruk `title`, **IKKE** `productName`.

---

## Gruppe 3: Marketplace Storefront

### Frontend
- **React + Vite**
- Desktop-fokusert storefront for produktvisning
- TailwindCSS for styling

### Databaser

#### 1. users_public DB (forenklet bruker-database)
- **Formål:** Enklere bruker-autentisering, offentlig tilgjengelig data
- **Kilde:** Opprettes av teamet sammen med Consumer App team
- **Schema:** Forenklet sammenlignet med USER DB (se detaljert schema under)
- **Tilgang:** Full tilgang
- **Delt med:** Consumer App (samme database!)

**Innhold (forenklet for MVP):**
- ⭐ Users (uten multi-tenancy)
- ⭐ Cart & cart items
- ⭐ Orders & order items
- User activity log (fase 2+)

**Se "users_public Database Schema (Detaljert)" under for full oversikt.**

**Viktig for Marketplace Storefront studenter:**
- Start med **bare** `users`, `user_cart`, `user_cart_items`, `user_orders`, `user_order_items`
- Dere trenger **IKKE** `user_subject_favorites` eller `user_subject_history` (det er Consumer App-spesifikke tabeller)
- Handlekurven er **delt** med Consumer App, så brukere kan legge til produkter i appen og fullføre kjøpet på desktop

### Forskjell fra Syncstation/Vendor Onboarding
- **INGEN** USER DB (multi-tenant)
- **INGEN** Workstation DB
- Kun én database: `users_public`
- Enklere autentisering (ikke multi-tenant)
- Fokus på offentlig tilgjengelig produktdata

### Zod Schemas
Teamet **må** bruke delte schemas fra `@hk26/schema` for:
- **Products** (KRITISK: må matche Marketplace core eksakt!)
- **Vendors** (KRITISK: må matche Marketplace core eksakt!)
- Categories
- Auth (forenklet login)
- User preferences
- Cart & orders

---

## Gruppe 4: Consumer App

### Frontend
- **React Native + Expo Go**
- Mobil app for Hoolsy content consumption
- Subject-basert navigering
- Ultrasound-sync med TV-innhold (avansert - valgfritt for MVP)

### Databaser

#### 1. users_public DB (forenklet bruker-database)
- **Formål:** Enklere bruker-autentisering, offentlig tilgjengelig data
- **Kilde:** Opprettes av teamet sammen med Marketplace Storefront team
- **Schema:** Forenklet sammenlignet med USER DB (se detaljert schema under)
- **Tilgang:** Full tilgang
- **Delt med:** Marketplace Storefront (samme database!)

**Innhold (forenklet for MVP):**
- ⭐ Users (uten multi-tenancy)
- ⭐ Cart & cart items (delt med Marketplace Storefront!)
- ⭐ Orders & order items (delt med Marketplace Storefront!)
- Subject history (fase 2+ - for watch history)
- Subject favorites (fase 2+ - for "follow" funksjonalitet)
- User devices (fase 2+ - for push notifications)

**Se "users_public Database Schema (Detaljert)" under for full oversikt.**

**Viktig for Consumer App studenter:**
- Start med **bare** `users`, `user_cart`, `user_cart_items`, `user_orders`, `user_order_items`
- Legg til `user_subject_history` i fase 2 hvis dere implementerer watch history eller ultrasound-sync
- Legg til `user_devices` i fase 2 hvis dere implementerer push notifications
- Handlekurven er **delt** med Marketplace Storefront, så brukere kan legge til produkter på mobil og fullføre kjøpet på desktop

### Forskjell fra Syncstation
- **INGEN** USER DB (multi-tenant)
- **INGEN** Workstation DB
- Kun én database: `users_public`
- Enklere autentisering (ikke multi-tenant)
- Fokus på content consumption, ikke production

### Zod Schemas
Teamet **må** bruke delte schemas fra `@hk26/schema` for:
- **Subjects** (personer, steder, ting)
- **Products** (hvis shopping-funksjonalitet implementeres)
- Auth (forenklet login)
- User preferences
- Content metadata
- Cart & orders

---

## Viktige forskjeller oppsummert

### Multi-tenant vs. Public-facing

#### Multi-tenant teams (Syncstation + Vendor Onboarding):
- **Bruker:** USER DB med `tenant_id` på alle tabeller
- **Isolasjon:** Data er isolert per tenant (produksjonsselskap, vendor)
- **Roller:** RBAC (Role-Based Access Control)
- **Content:** Workstation DB for content hierarchy
- **Kompleksitet:** Høyere (produksjonsnær arkitektur)

#### Public-facing teams (Storefront + Consumer):
- **Bruker:** `users_public` DB uten multi-tenancy
- **Isolasjon:** Data er offentlig tilgjengelig (produkter, content)
- **Roller:** Enklere (innlogget vs. ikke innlogget)
- **Content:** Ingen Workstation DB
- **Kompleksitet:** Lavere (enklere brukerflyt)

---

## Database Arkitektur for Consumer App og Marketplace Storefront

**To databaser:**
1. **`users_public`** - Alt som er "min bruker, mine valg, mine kjøp"
2. **`catalog_demo`** - Demo-data med subjects, produkter, og koblingen mellom dem

---

## Database 1: users_public (Consumer-facing)

Denne databasen eier alt som er bruker-spesifikt: registrering, favoritter, handlekurv, ordre.

**MVP-filosofi:** Kun det som absolutt må til for:
- ✅ Registrering og innlogging
- ✅ Favoritter (hjerte på subject, som Instagram save)
- ✅ Handlekurv og checkout
- ✅ Leveringsinfo (adresse)
- ✅ Ordre-historikk

### 1) users ⭐ (KRITISK)

**Formål:** Registrering og innlogging.

**Minimum-felter:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  birthdate DATE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Hva den gir deg:**
- ✅ Registrering med email/passord
- ✅ Navn og fødselsdato (bedre enn "age" som endrer seg)
- ✅ Email-verifisering (kan være false i MVP)

**Brukes av:**
- ✅ **Consumer App**: Login, profile
- ✅ **Marketplace Storefront**: Login, profile

**Hvorfor birthdate i stedet for age?**
Alder endrer seg over tid, fødselsdato gjør ikke det. Du kan enkelt beregne alder når du trenger det.

### 2) user_favorites ⭐ (KRITISK)

**Formål:** Hjerte på subject (som Instagram "lagret").

**Minimum-felter:**
```sql
CREATE TABLE user_favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, subject_id)
);

CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_subject ON user_favorites(subject_id);
```

**Hva den gir deg:**
- ✅ Ett hjerte per subject per bruker
- ✅ Enkel "favoritt-liste"
- ✅ Lett å vise "mine favoritter" i UI

**Brukes av:**
- ✅ **Consumer App**: Hjerte på subjects (personer, steder, props)
- ⚠️ **Marketplace Storefront**: Kan brukes for product wishlist (men subject_id kan da være product_id)

**Hvorfor ikke JSONB array?**
Separate rader gjør det enklere å:
- Telle antall favoritter per subject
- Sjekke om bruker har favorisert
- Paginere favoritt-lister

### 3) user_addresses ⭐ (KRITISK for checkout)

**Formål:** Hvor kjøpet skal sendes.

**Minimum-felter:**
```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100),
  full_name VARCHAR(255) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  phone VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON user_addresses(user_id);
```

**Hva den gir deg:**
- ✅ Lagrede leveringsadresser
- ✅ Default-adresse for raskere checkout
- ✅ Flere adresser (hjem, jobb, etc.)

**Brukes av:**
- ✅ **Consumer App**: Shipping address for mobile checkout
- ✅ **Marketplace Storefront**: Shipping address for desktop checkout

**Hvorfor separate adresser?**
- Brukere kan ha flere (hjem, jobb)
- Kan velge hvilken som er default
- Ikke alle trenger å fylle ut adresse ved hver checkout

---

### 4) carts ⭐ (KRITISK)

**Formål:** Handlekurven min nå.

**Minimum-felter:**
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_status CHECK (status IN ('active', 'checked_out', 'abandoned'))
);

CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_status ON carts(status, user_id);
```

**Hva den gir deg:**
- ✅ Persistent cart across sessions
- ✅ Delt handlekurv mellom Consumer App og Marketplace Storefront
- ✅ Cart history (abandoned, checked_out)

**Brukes av:**
- ✅ **Consumer App**: Cart mens user syncer med TV
- ✅ **Marketplace Storefront**: Cart for desktop browsing

**Viktig:** Brukere kan legge til produkter på mobil og fullføre kjøp på desktop (eller omvendt)!

**I MVP:**
Én aktiv cart per bruker. Dere kan også implementere "flere carts per bruker" senere.

### 5) cart_items ⭐ (KRITISK)

**Formål:** Linjene i handlekurven.

**Minimum-felter:**
```sql
CREATE TABLE cart_items (
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NOK',
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
```

**Hva den gir deg:**
- ✅ Produkter i handlekurv
- ✅ Pris-snapshot (unit_price) når lagt i kurv
- ✅ Quantity management

**Brukes av:**
- ✅ **Consumer App**: Cart contents
- ✅ **Marketplace Storefront**: Cart contents

**Hvorfor unit_price?**
Lagrer prisen *når produktet ble lagt i kurv*. Hvis prisen endrer seg senere, påvirker det ikke handlekurven.

**MVP-tips:**
Hvis dere bare støtter NOK, kan dere droppe `currency` og bare hardkode "NOK" i API-en.

### 6) orders ⭐ (KRITISK)

**Formål:** Ordrehode når checkout skjer.

**Minimum-felter:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  total_amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NOK',
  shipping_address_snapshot JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMP,
  CONSTRAINT check_status CHECK (status IN ('created', 'paid', 'cancelled', 'refunded'))
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Hva den gir deg:**
- ✅ Order history
- ✅ Payment tracking
- ✅ Address snapshot (endringer i brukerens adresse påvirker ikke gammel ordre)

**Brukes av:**
- ✅ **Consumer App**: Order history
- ✅ **Marketplace Storefront**: Order history

**Hvorfor shipping_address_snapshot (JSONB)?**
Tar snapshot av adressen *ved kjøp*. Hvis brukeren flytter og endrer adresse, skal ikke gamle ordre oppdateres.

**Eksempel JSONB:**
```json
{
  "full_name": "Ola Nordmann",
  "address_line1": "Eksempelgate 1",
  "postal_code": "0150",
  "city": "Oslo",
  "country_code": "NO",
  "phone": "+47 123 45 678"
}
```

### 7) order_items ⭐ (KRITISK)

**Formål:** Ordrelinjene.

**Minimum-felter:**
```sql
CREATE TABLE order_items (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  subject_id UUID,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NOK',
  PRIMARY KEY (order_id, product_id)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

**Hva den gir deg:**
- ✅ Hvilke produkter ble kjøpt
- ✅ Pris-snapshot (unit_price ved kjøp)
- ✅ Kobling til subject (praktisk for å vise "du kjøpte dette fra subject X")

**Brukes av:**
- ✅ **Consumer App**: Order details
- ✅ **Marketplace Storefront**: Order details

**Hvorfor subject_id?**
Nyttig for å vise: "Du kjøpte Walter White's Hat fra Breaking Bad" uten å måtte rekonstruere koblingen senere.

**MVP-tips:**
Start med `order_id`, `product_id`, `quantity`, `unit_price`. Legg til `subject_id` hvis dere vil vise subject-kontekst i ordre-historikk.

---

### 8) payments (VALGFRI i MVP)

**Formål:** Payment tracking (Stripe, Vipps, etc.)

**Minimum-felter:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_provider CHECK (provider IN ('stripe', 'vipps', 'paypal')),
  CONSTRAINT check_status CHECK (status IN ('initiated', 'succeeded', 'failed'))
);

CREATE INDEX idx_payments_order ON payments(order_id);
```

**Hva den gir deg:**
- ✅ Payment provider tracking
- ✅ Payment status
- ✅ External payment ID for reconciliation

**MVP-alternativ:**
Hvis dere ikke trenger denne tabellen, legg disse feltene rett i `orders`:
- `payment_provider`
- `payment_reference`
- `payment_status`

**Brukes av:**
- ✅ **Consumer App**: Payment integration
- ✅ **Marketplace Storefront**: Payment integration

**Når trenger dere dette?**
Kun hvis dere integrerer med payment providers (Stripe, Vipps). For MVP kan dere late som om payment alltid lykkes og hoppe over denne tabellen.

---

### users_public Relasjonsoversikt

```
users (registrering, innlogging)
 ├─→ user_favorites (hjerte på subject)
 ├─→ user_addresses (leveringsadresser)
 ├─→ carts (handlekurver)
 │    └─→ cart_items (produkter i kurv)
 └─→ orders (ordre)
      ├─→ order_items (produkter i ordre)
      └─→ payments (valgfri)
```

**Dette er alt dere trenger for MVP!**
- 7 tabeller (8 hvis payments)
- Enkel struktur
- Fokusert på brukeropplevelsen

---

## Database 2: catalog_demo (Demo-data)

Denne databasen inneholder subjects, produkter, og koblingen mellom dem. Dette er "katalogen" som brukes til å drive appen med demo-data.

**Formål:**
- ✅ Demo subjects som brukere kan hjerte
- ✅ Demo produkter som kan kjøpes
- ✅ Kobling: hvilket produkt hører til hvilket subject
- ✅ Ikke blandet med user-data

### A) subjects

**Formål:** Det brukeren ser i appen (og kan hjerte).

**Minimum-felter:**
```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_sellable BOOLEAN DEFAULT false,
  hero_image_url TEXT,
  external_url TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_type CHECK (type IN ('person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other'))
);

CREATE INDEX idx_subjects_type ON subjects(type);
CREATE INDEX idx_subjects_sellable ON subjects(is_sellable);
```

**Hva den gir deg:**
- ✅ Subject catalog (personer, karakterer, props, apparel, locations)
- ✅ Markering av hvilke subjects som er sellable
- ✅ Grunndata for favoritter og shopping
- ✅ **external_url** for å linke til Wikipedia, IMDB, etc
- ✅ **metadata** for fleksible attributter (brand, color, material)

**Eksempel subjects:**
```sql
-- Product prop
INSERT INTO subjects (label, type, is_sellable, hero_image_url, external_url, metadata)
VALUES (
  'Walter White''s Pork Pie Hat',
  'product_prop',
  true,
  'https://via.placeholder.com/300',
  'https://breakingbad.fandom.com/wiki/Pork_Pie_Hat',
  '{"color": "tan", "material": "wool felt", "brand": "Stetson"}'
);

-- Character
INSERT INTO subjects (label, type, is_sellable, hero_image_url, external_url)
VALUES (
  'Walter White',
  'character',
  false,
  'https://via.placeholder.com/300',
  'https://breakingbad.fandom.com/wiki/Walter_White'
);

-- Actor
INSERT INTO subjects (label, type, is_sellable, hero_image_url, external_url)
VALUES (
  'Bryan Cranston',
  'person',
  false,
  'https://via.placeholder.com/300',
  'https://www.imdb.com/name/nm0186505/'
);

-- Location
INSERT INTO subjects (label, type, is_sellable, hero_image_url, external_url, metadata)
VALUES (
  'White Residence',
  'location',
  false,
  'https://via.placeholder.com/300',
  'https://breakingbad.fandom.com/wiki/White_Residence',
  '{"address": "308 Negra Arroyo Lane", "city": "Albuquerque"}'
);
```

**Viktig om person vs character:**
- `type: 'person'` = Actor/skuespiller (Bryan Cranston)
- `type: 'character'` = Karakter (Walter White)
- I MVP dukker begge opp separat i timeline (ikke merget i UI)

### B) products

**Formål:** Konkrete varer som kan kjøpes.

**Minimum-felter:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  image_url TEXT,
  base_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NOK',
  product_url TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_price ON products(base_price);
CREATE INDEX idx_products_brand ON products(brand);
```

**Hva den gir deg:**
- ✅ Product catalog
- ✅ Priser og bilder
- ✅ Brand info
- ✅ **product_url** for å linke til butikk (Amazon, etc)
- ✅ **metadata** for SKU, GTIN, varianter, etc

**Eksempel produkter:**
```sql
INSERT INTO products (title, brand, base_price, currency, product_url, image_url, metadata, description)
VALUES (
  'Pork Pie Hat - Wool Felt',
  'Stetson',
  299.00,
  'NOK',
  'https://www.amazon.com/Stetson-Pork-Pie-Hat/dp/B001234567',
  'https://via.placeholder.com/300',
  '{"sku": "STN-PPH-001", "material": "100% wool felt", "sizes": ["S", "M", "L"]}',
  'Classic pork pie hat in wool felt, as seen in Breaking Bad'
);

INSERT INTO products (title, brand, base_price, currency, product_url, image_url, description)
VALUES (
  'Yellow Hazmat Suit',
  'WorkSafe',
  149.00,
  'NOK',
  'https://www.amazon.com/Hazmat-Suit-Yellow/dp/B007654321',
  'https://via.placeholder.com/300',
  'Professional hazmat suit, chemical resistant'
);
```

### C) subject_products (Kobling)

**Formål:** Et subject kan ha flere produkter, et produkt kan dukke opp i flere subjects.

**Minimum-felter:**
```sql
CREATE TABLE subject_products (
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (subject_id, product_id)
);

CREATE INDEX idx_subject_products_subject ON subject_products(subject_id);
CREATE INDEX idx_subject_products_product ON subject_products(product_id);
```

**Hva den gir deg:**
- ✅ Mange-til-mange kobling
- ✅ Sortering av produkter per subject
- ✅ Lett å vise "alle produkter fra dette subjectet"

**Eksempel kobling:**
- Subject: "Walter White's Pork Pie Hat" → Product: "Pork Pie Hat - Wool Felt"
- Subject: "Walter White's Pork Pie Hat" → Product: "Pork Pie Hat - Budget Edition"

### D) content ⭐ (KRITISK for Consumer App)

**Formål:** Episodes/filmer som brukere "ser på" i appen.

**Minimum-felter:**
```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_title VARCHAR(255) NOT NULL,
  episode_title VARCHAR(255),
  season INTEGER,
  episode INTEGER,
  duration_seconds INTEGER NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_media_title ON content(media_title);
CREATE INDEX idx_content_season_episode ON content(season, episode);
```

**Hva den gir deg:**
- ✅ Episode catalog ("Breaking Bad S01E01 - Pilot")
- ✅ Skille mellom serie-navn (media_title) og episode-navn (episode_title)
- ✅ Duration for å beregne progress
- ✅ Metadata for å vise i UI

**Eksempel content:**
```sql
INSERT INTO content (media_title, episode_title, season, episode, duration_seconds, thumbnail_url, description)
VALUES (
  'Breaking Bad',
  'Pilot',
  1,
  1,
  2700, -- 45 minutter
  'https://via.placeholder.com/300x450',
  'High school chemistry teacher Walter White is diagnosed with cancer and turns to cooking meth.'
);

INSERT INTO content (media_title, episode_title, season, episode, duration_seconds, thumbnail_url, description)
VALUES (
  'Mad Men',
  'Smoke Gets in Your Eyes',
  1,
  1,
  2820, -- 47 minutter
  'https://via.placeholder.com/300x450',
  'Don Draper pitches an advertising campaign amid pressure from his firm.'
);
```

**Brukes av:**
- ✅ **Consumer App**: "Play" episode, se timeline, sync med TV

### E) content_subjects ⭐ (KRITISK for Consumer App)

**Formål:** Når dukker subjects opp i content (timeline).

**Minimum-felter:**
```sql
CREATE TABLE content_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_times CHECK (start_time < end_time)
);

CREATE INDEX idx_content_subjects_content ON content_subjects(content_id);
CREATE INDEX idx_content_subjects_timeline ON content_subjects(content_id, start_time, end_time);
CREATE INDEX idx_content_subjects_subject ON content_subjects(subject_id);
```

**Hva den gir deg:**
- ✅ Timeline: hvilke subjects dukker opp når
- ✅ Range queries: "hva vises mellom 5:30 og 6:00?"
- ✅ Grunnlag for "ultrasound-sync" simulering
- ✅ **metadata** for confidence, bounding box, visibility level, etc

**Eksempel data:**
```sql
-- Breaking Bad S01E01
-- Walter White's Hat vises fra 05:30 til 07:45
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time)
VALUES (
  'breaking-bad-s01e01-uuid',
  'walter-white-hat-uuid',
  330,  -- 05:30 (5 * 60 + 30)
  465   -- 07:45 (7 * 60 + 45)
);

-- Jesse Pinkman dukker opp fra 12:00 til 15:30
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time)
VALUES (
  'breaking-bad-s01e01-uuid',
  'jesse-pinkman-uuid',
  720,  -- 12:00
  930   -- 15:30
);
```

**Hvorfor start_time og end_time?**
- Subjects er synlige i en *periode*, ikke bare ett øyeblikk
- Consumer App kan vise "currently on screen" basert på timestamp
- Enkel range query: `WHERE start_time <= current_time AND end_time >= current_time`

**Brukes av:**
- ✅ **Consumer App**: Timeline, "what's on screen now", sync-simulering

### F) product_offers (VALGFRI i MVP)

**Formål:** Flere butikker som selger samme produkt.

**Minimum-felter:**
```sql
CREATE TABLE product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  seller_name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NOK',
  product_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_offers_product ON product_offers(product_id);
```

**Hva den gir deg:**
- ✅ Multi-vendor support
- ✅ Prissammenligning
- ✅ Lenke til ekstern butikk

**MVP-alternativ:**
Hvis dere ikke trenger multi-vendor, dropp denne tabellen og bruk `products.base_price` som den eneste prisen.

---

### catalog_demo Relasjonsoversikt

```
content (episodes, filmer)
 └─→ content_subjects (timeline: når dukker subjects opp)
      └─→ subjects (personer, props, locations)
           └─→ subject_products (kobling)
                └─→ products (konkrete varer)
                     └─→ product_offers (valgfri: flere butikker)
```

**Dataflyt:**
1. Content (Breaking Bad S01E01)
2. → Timeline (Walter White's Hat vises 05:30-07:45)
3. → Subject (Walter White's Pork Pie Hat)
4. → Produkter (Pork Pie Hat - Wool Felt, 299 NOK)

**Hvorfor separate database?**
- ✅ user_data (users_public) er separert fra catalog-data
- ✅ Enklere å laste inn demo-data uten å påvirke brukere
- ✅ Kan bygge kjøpsflyt uten å låse seg til endelig arkitektur
- ✅ Lettere å teste og resette demo-data

---

### Hvordan subjects og produkter fungerer sammen

**Konsept: "Sellable subject"**

I MVP betyr "sellable subject" ganske enkelt: *Et subject som har minst ett produkt knyttet til seg.*

**Eksempel:**
1. Subject: "Walter White's Pork Pie Hat" (`is_sellable: true`)
2. Kobling i `subject_products`: subject_id → product_id
3. Product: "Pork Pie Hat - Wool Felt" (299 NOK)

**Når bruker:**
1. Ser subject i appen (Consumer App)
2. Trykker hjerte → lagres i `user_favorites` (users_public database)
3. Ser "Kjøp nå" knapp → henter produkter fra `subject_products` join `products` (catalog_demo database)
4. Legger i handlekurv → lagres i `carts` og `cart_items` (users_public database)
5. Checkout → ordre opprettes i `orders` og `order_items` (users_public database)

**Cross-database referanser:**
- `user_favorites.subject_id` refererer til `catalog_demo.subjects.id`
- `cart_items.product_id` refererer til `catalog_demo.products.id`
- `order_items.product_id` refererer til `catalog_demo.products.id`
- `order_items.subject_id` (valgfri) refererer til `catalog_demo.subjects.id`

Dette gir dere en klar separasjon mellom "hva jeg gjør" (users_public) og "hva som finnes" (catalog_demo).

---

### Nye felt i "MVP Plus" (vs opprinnelig plan)

**Forbedringer som gjør demo mer realistisk:**

1. **subjects.label** (var: `title`)
   - Mer semantisk korrekt for entiteter som "Walter White" eller "Pork Pie Hat"

2. **subjects.metadata** (JSONB)
   - Fleksible attributter: `{ "color": "tan", "material": "wool felt", "brand": "Stetson" }`
   - Studentene kan eksperimentere uten schema-endringer

3. **subjects.external_url**
   - Link til Wikipedia, IMDB, Fandom
   - Gir mer "ekte" feel til demo

4. **subjects.type** nye verdier:
   - `character` - Karakter (Walter White)
   - `person` - Skuespiller (Bryan Cranston)
   - `apparel` - Klær (Hazmat Suit)

5. **content.media_title** og **content.episode_title** (var: `title`)
   - Skille mellom "Breaking Bad" (media_title) og "Pilot" (episode_title)
   - Bedre UI: "Breaking Bad S01E01 - Pilot"

6. **products.product_url**
   - Link til Amazon, butikk, etc
   - Gir realistisk shopping-opplevelse

7. **products.metadata** (JSONB)
   - SKU, GTIN, sizes, variants: `{ "sku": "STN-PPH-001", "sizes": ["S", "M", "L"] }`

8. **content_subjects.metadata** (JSONB)
   - Confidence, bounding box, prominence: `{ "prominence": "main", "visibility": "prominent" }`

**Hva vi IKKE la til (overkill for MVP):**
- ❌ subject_relationships (semantic graph med 30+ relationship types)
- ❌ subject_images (multiple images per subject)
- ❌ Millisekunder (sekunder er helt fint for demo)

---

## API for Consumer App: "Watching" en episode

**Scenario:** Consumer App skal simulere at brukeren ser på en episode og få subjects som dukker opp i sanntid.

### API Endpoints

#### 1) GET /api/content

**Formål:** Hent alle tilgjengelige episodes/filmer.

**Response:**
```json
{
  "content": [
    {
      "id": "uuid-breaking-bad-s01e01",
      "media_title": "Breaking Bad",
      "episode_title": "Pilot",
      "season": 1,
      "episode": 1,
      "duration_seconds": 2700,
      "thumbnail_url": "https://...",
      "description": "High school chemistry teacher Walter White is diagnosed with cancer..."
    },
    {
      "id": "uuid-mad-men-s01e01",
      "media_title": "Mad Men",
      "episode_title": "Smoke Gets in Your Eyes",
      "season": 1,
      "episode": 1,
      "duration_seconds": 2820,
      "thumbnail_url": "https://...",
      "description": "Don Draper pitches an advertising campaign amid pressure from his firm..."
    }
  ]
}
```

**Brukes til:** Liste over episodes brukeren kan "se på".

---

#### 2) GET /api/content/:content_id/timeline

**Formål:** Hent full timeline for en episode (alle subjects som dukker opp).

**Response:**
```json
{
  "content_id": "uuid-breaking-bad-s01e01",
  "media_title": "Breaking Bad",
  "episode_title": "Pilot",
  "season": 1,
  "episode": 1,
  "duration_seconds": 2700,
  "timeline": [
    {
      "subject_id": "uuid-walter-white",
      "label": "Walter White",
      "type": "character",
      "is_sellable": false,
      "hero_image_url": "https://...",
      "start_time": 30,
      "end_time": 600,
      "products": []
    },
    {
      "subject_id": "uuid-bryan-cranston",
      "label": "Bryan Cranston",
      "type": "person",
      "is_sellable": false,
      "hero_image_url": "https://...",
      "start_time": 30,
      "end_time": 600,
      "products": []
    },
    {
      "subject_id": "uuid-walter-white-hat",
      "label": "Walter White's Pork Pie Hat",
      "type": "product_prop",
      "is_sellable": true,
      "hero_image_url": "https://...",
      "metadata": {
        "color": "tan",
        "material": "wool felt"
      },
      "start_time": 330,
      "end_time": 465,
      "products": [
        {
          "product_id": "uuid-product-1",
          "title": "Pork Pie Hat - Wool Felt",
          "base_price": 299.00,
          "currency": "NOK",
          "image_url": "https://...",
          "brand": "Stetson"
        }
      ]
    },
    {
      "subject_id": "uuid-jesse-pinkman",
      "label": "Jesse Pinkman",
      "type": "character",
      "is_sellable": false,
      "hero_image_url": "https://...",
      "start_time": 720,
      "end_time": 930,
      "products": []
    },
    {
      "subject_id": "uuid-aaron-paul",
      "label": "Aaron Paul",
      "type": "person",
      "is_sellable": false,
      "hero_image_url": "https://...",
      "start_time": 720,
      "end_time": 930,
      "products": []
    }
  ]
}
```

**Brukes til:**
- Vise timeline-bar i appen (markører for når subjects dukker opp)
- Preload subject-data for smooth playback

---

#### 3) GET /api/content/:content_id/at/:timestamp

**Formål:** Hent subjects som er synlige på skjermen *nå* (ved gitt timestamp).

**Eksempel:** `GET /api/content/uuid-breaking-bad-s01e01/at/360`

**Query:** Hvilke subjects er synlige ved 6:00 (360 sekunder)?

**SQL query (bak kulissene):**
```sql
SELECT cs.*, s.*, sp.product_id, p.*
FROM content_subjects cs
JOIN subjects s ON cs.subject_id = s.id
LEFT JOIN subject_products sp ON s.id = sp.subject_id
LEFT JOIN products p ON sp.product_id = p.id
WHERE cs.content_id = $1
  AND cs.start_time <= $2
  AND cs.end_time >= $2
ORDER BY sp.sort_order;
```

**Response:**
```json
{
  "content_id": "uuid-breaking-bad-s01e01",
  "timestamp": 360,
  "subjects_on_screen": [
    {
      "subject_id": "uuid-walter-white",
      "label": "Walter White",
      "type": "character",
      "is_sellable": false,
      "hero_image_url": "https://...",
      "external_url": "https://breakingbad.fandom.com/wiki/Walter_White",
      "start_time": 30,
      "end_time": 600,
      "products": []
    },
    {
      "subject_id": "uuid-bryan-cranston",
      "label": "Bryan Cranston",
      "type": "person",
      "is_sellable": false,
      "hero_image_url": "https://...",
      "external_url": "https://www.imdb.com/name/nm0186505/",
      "start_time": 30,
      "end_time": 600,
      "products": []
    },
    {
      "subject_id": "uuid-walter-white-hat",
      "label": "Walter White's Pork Pie Hat",
      "type": "product_prop",
      "is_sellable": true,
      "hero_image_url": "https://...",
      "external_url": "https://breakingbad.fandom.com/wiki/Pork_Pie_Hat",
      "metadata": {
        "color": "tan",
        "material": "wool felt",
        "brand": "Stetson"
      },
      "start_time": 330,
      "end_time": 465,
      "products": [
        {
          "product_id": "uuid-product-1",
          "title": "Pork Pie Hat - Wool Felt",
          "base_price": 299.00,
          "currency": "NOK",
          "image_url": "https://...",
          "product_url": "https://www.amazon.com/...",
          "brand": "Stetson",
          "metadata": {
            "sku": "STN-PPH-001",
            "sizes": ["S", "M", "L", "XL"]
          }
        }
      ]
    }
  ]
}
```

**Viktig:** Ved timestamp 360 (6:00) vil både Walter White (character), Bryan Cranston (actor) OG Walter White's Hat (product_prop) være synlige. UI kan velge å gruppere character + actor, eller vise dem separat.

**Brukes til:**
- Real-time updates når bruker "ser" på episode
- Vise "currently on screen" subjects
- Shopping: "Buy now" knapper for produkter

---

### Consumer App: Simulert "Playback" Flow

**Hvordan Consumer App bruker API-et:**

**Steg 1 - Velg episode:**
```typescript
// Hent tilgjengelige episodes
const response = await fetch('/api/content');
const { content } = await response.json();

// Bruker velger "Breaking Bad S01E01"
const selectedContent = content[0];
```

**Steg 2 - Last inn timeline:**
```typescript
// Hent full timeline for episode
const timelineResponse = await fetch(`/api/content/${selectedContent.id}/timeline`);
const { timeline } = await timelineResponse.json();

// Vis timeline-bar i UI med markører
renderTimeline(timeline);
```

**Steg 3 - Start "playback" (simulert):**
```typescript
let currentTime = 0; // sekunder
const duration = selectedContent.duration_seconds;

// Simuler playback med interval
const playbackInterval = setInterval(async () => {
  currentTime += 1; // øk med 1 sekund

  // Oppdater progress bar
  updateProgressBar(currentTime, duration);

  // Hver 5. sekund: sjekk hva som er på skjermen
  if (currentTime % 5 === 0) {
    const subjectsResponse = await fetch(`/api/content/${selectedContent.id}/at/${currentTime}`);
    const { subjects_on_screen } = await subjectsResponse.json();

    // Oppdater UI med subjects
    renderSubjects(subjects_on_screen);
  }

  // Stopp når episode er ferdig
  if (currentTime >= duration) {
    clearInterval(playbackInterval);
    showEpisodeEnd();
  }
}, 1000); // 1 sekund intervaller
```

**Steg 4 - Bruker interaksjon:**
```typescript
// Bruker trykker hjerte på subject
const favoriteSubject = async (subjectId) => {
  await fetch('/api/me/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ subject_id: subjectId })
  });
  showToast('Added to favorites!');
};

// Bruker trykker "Buy now" på produkt
const addToCart = async (productId) => {
  await fetch('/api/me/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      product_id: productId,
      quantity: 1,
      // ⭐ IKKE send unit_price - backend henter den fra catalog
    })
  });
  showToast('Added to cart!');
};
```

---

### Enkel dummy-data for studenter

**Eksempel: Legge til Breaking Bad S01E01**

**1) Legg til content:**
```sql
INSERT INTO content (id, media_title, episode_title, season, episode, duration_seconds, thumbnail_url, description)
VALUES (
  'breaking-bad-s01e01',
  'Breaking Bad',
  'Pilot',
  1,
  1,
  2700, -- 45 minutter
  'https://via.placeholder.com/300x450',
  'High school chemistry teacher Walter White is diagnosed with cancer and turns to cooking meth.'
);
```

**2) Legg til subjects (hvis ikke allerede finnes):**
```sql
-- Product prop (sellable)
INSERT INTO subjects (id, label, type, is_sellable, hero_image_url, external_url, metadata, description)
VALUES (
  'walter-white-hat',
  'Walter White''s Pork Pie Hat',
  'product_prop',
  true,
  'https://via.placeholder.com/300',
  'https://breakingbad.fandom.com/wiki/Pork_Pie_Hat',
  '{"color": "tan", "material": "wool felt", "brand": "Stetson"}',
  'Iconic pork pie hat worn by Walter White'
);

-- Character (Walter White)
INSERT INTO subjects (id, label, type, is_sellable, hero_image_url, external_url, description)
VALUES (
  'walter-white',
  'Walter White',
  'character',
  false,
  'https://via.placeholder.com/300',
  'https://breakingbad.fandom.com/wiki/Walter_White',
  'High school chemistry teacher turned methamphetamine manufacturer'
);

-- Actor (Bryan Cranston)
INSERT INTO subjects (id, label, type, is_sellable, hero_image_url, external_url, description)
VALUES (
  'bryan-cranston',
  'Bryan Cranston',
  'person',
  false,
  'https://via.placeholder.com/300',
  'https://www.imdb.com/name/nm0186505/',
  'American actor and director, best known for Breaking Bad'
);

-- Character (Jesse Pinkman)
INSERT INTO subjects (id, label, type, is_sellable, hero_image_url, external_url, description)
VALUES (
  'jesse-pinkman',
  'Jesse Pinkman',
  'character',
  false,
  'https://via.placeholder.com/300',
  'https://breakingbad.fandom.com/wiki/Jesse_Pinkman',
  'Walter White''s former student and partner in the meth business'
);

-- Actor (Aaron Paul)
INSERT INTO subjects (id, label, type, is_sellable, hero_image_url, external_url, description)
VALUES (
  'aaron-paul',
  'Aaron Paul',
  'person',
  false,
  'https://via.placeholder.com/300',
  'https://www.imdb.com/name/nm0666739/',
  'American actor, best known for Breaking Bad'
);
```

**3) Legg til timeline (når dukker subjects opp):**
```sql
-- Walter White (character) vises fra 00:30 til 10:00
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time, metadata)
VALUES ('breaking-bad-s01e01', 'walter-white', 30, 600, '{"prominence": "main"}');

-- Bryan Cranston (actor) - samme timeline som karakteren
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time, metadata)
VALUES ('breaking-bad-s01e01', 'bryan-cranston', 30, 600, '{"role": "portrays"}');

-- Walter White's Hat (product prop) vises fra 05:30 til 07:45
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time, metadata)
VALUES ('breaking-bad-s01e01', 'walter-white-hat', 330, 465, '{"visibility": "prominent"}');

-- Jesse Pinkman (character) dukker opp fra 12:00 til 15:30
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time, metadata)
VALUES ('breaking-bad-s01e01', 'jesse-pinkman', 720, 930, '{"prominence": "supporting"}');

-- Aaron Paul (actor) - samme timeline som karakteren
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time, metadata)
VALUES ('breaking-bad-s01e01', 'aaron-paul', 720, 930, '{"role": "portrays"}');

-- Walter White's Hat vises igjen fra 20:00 til 22:30
INSERT INTO content_subjects (content_id, subject_id, start_time, end_time)
VALUES ('breaking-bad-s01e01', 'walter-white-hat', 1200, 1350);
```

**Viktig:** I MVP vises både karakter og skuespiller separat. UI kan velge å gruppere dem, men i databasen er de separate subjects.

**4) Legg til produkter (hvis ikke allerede finnes):**
```sql
INSERT INTO products (id, title, brand, base_price, currency, product_url, image_url, metadata, description)
VALUES (
  'product-pork-pie-hat',
  'Pork Pie Hat - Wool Felt',
  'Stetson',
  299.00,
  'NOK',
  'https://www.amazon.com/Stetson-Pork-Pie-Hat/dp/B001234567',
  'https://via.placeholder.com/300',
  '{"sku": "STN-PPH-001", "material": "100% wool felt", "sizes": ["S", "M", "L", "XL"], "color": "tan"}',
  'Classic pork pie hat in wool felt, as seen in Breaking Bad'
);

-- Koble produkt til subject
INSERT INTO subject_products (subject_id, product_id, sort_order)
VALUES ('walter-white-hat', 'product-pork-pie-hat', 1);
```

**Ferdig!** Nå kan Consumer App:
- Liste "Breaking Bad S01E01" i content-listen
- Vise timeline med markører for Walter White's Hat og Jesse Pinkman
- Simulere playback og vise subjects når de dukker opp
- Kjøpe Pork Pie Hat når Walter White's Hat er på skjermen

---

### Template: Seed Script for studenter

**`packages/databases/postgres/src/scripts/seed-catalog-demo.ts`:**

```typescript
import { db } from '../clients/catalog-demo-db';
import { content, subjects, products, contentSubjects, subjectProducts } from '../schema/catalog';

async function seedCatalogDemo() {
  console.log('Seeding catalog_demo database...');

  // 1) Seed content (episodes)
  const breakingBadS01E01 = await db.insert(content).values({
    id: 'breaking-bad-s01e01',
    media_title: 'Breaking Bad',
    episode_title: 'Pilot',
    season: 1,
    episode: 1,
    duration_seconds: 2700,
    thumbnail_url: 'https://via.placeholder.com/300x450',
    description: 'High school chemistry teacher Walter White is diagnosed with cancer...',
  }).returning();

  // 2) Seed subjects (characters, actors, props)
  const walterWhite = await db.insert(subjects).values({
    id: 'walter-white',
    label: 'Walter White',
    type: 'character',
    is_sellable: false,
    hero_image_url: 'https://via.placeholder.com/300',
    external_url: 'https://breakingbad.fandom.com/wiki/Walter_White',
    description: 'High school chemistry teacher turned methamphetamine manufacturer',
  }).returning();

  const bryanCranston = await db.insert(subjects).values({
    id: 'bryan-cranston',
    label: 'Bryan Cranston',
    type: 'person',
    is_sellable: false,
    hero_image_url: 'https://via.placeholder.com/300',
    external_url: 'https://www.imdb.com/name/nm0186505/',
    description: 'American actor and director, best known for Breaking Bad',
  }).returning();

  const walterWhiteHat = await db.insert(subjects).values({
    id: 'walter-white-hat',
    label: 'Walter White\'s Pork Pie Hat',
    type: 'product_prop',
    is_sellable: true,
    hero_image_url: 'https://via.placeholder.com/300',
    external_url: 'https://breakingbad.fandom.com/wiki/Pork_Pie_Hat',
    metadata: { color: 'tan', material: 'wool felt', brand: 'Stetson' },
    description: 'Iconic pork pie hat worn by Walter White',
  }).returning();

  const jessePinkman = await db.insert(subjects).values({
    id: 'jesse-pinkman',
    label: 'Jesse Pinkman',
    type: 'character',
    is_sellable: false,
    hero_image_url: 'https://via.placeholder.com/300',
    external_url: 'https://breakingbad.fandom.com/wiki/Jesse_Pinkman',
    description: 'Walter White\'s former student and partner',
  }).returning();

  const aaronPaul = await db.insert(subjects).values({
    id: 'aaron-paul',
    label: 'Aaron Paul',
    type: 'person',
    is_sellable: false,
    hero_image_url: 'https://via.placeholder.com/300',
    external_url: 'https://www.imdb.com/name/nm0666739/',
    description: 'American actor, best known for Breaking Bad',
  }).returning();

  // 3) Seed timeline (når dukker subjects opp)
  await db.insert(contentSubjects).values([
    // Walter White (character) og Bryan Cranston (actor)
    {
      content_id: 'breaking-bad-s01e01',
      subject_id: 'walter-white',
      start_time: 30,
      end_time: 600,
      metadata: { prominence: 'main' },
    },
    {
      content_id: 'breaking-bad-s01e01',
      subject_id: 'bryan-cranston',
      start_time: 30,
      end_time: 600,
      metadata: { role: 'portrays' },
    },
    // Walter White's Hat (product prop)
    {
      content_id: 'breaking-bad-s01e01',
      subject_id: 'walter-white-hat',
      start_time: 330,  // 05:30
      end_time: 465,    // 07:45
      metadata: { visibility: 'prominent' },
    },
    // Jesse Pinkman (character) og Aaron Paul (actor)
    {
      content_id: 'breaking-bad-s01e01',
      subject_id: 'jesse-pinkman',
      start_time: 720,  // 12:00
      end_time: 930,    // 15:30
      metadata: { prominence: 'supporting' },
    },
    {
      content_id: 'breaking-bad-s01e01',
      subject_id: 'aaron-paul',
      start_time: 720,
      end_time: 930,
      metadata: { role: 'portrays' },
    },
    // Walter White's Hat appears again
    {
      content_id: 'breaking-bad-s01e01',
      subject_id: 'walter-white-hat',
      start_time: 1200, // 20:00
      end_time: 1350,   // 22:30
    },
  ]);

  // 4) Seed products
  const porkPieHat = await db.insert(products).values({
    id: 'product-pork-pie-hat',
    title: 'Pork Pie Hat - Wool Felt',
    brand: 'Stetson',
    base_price: 299.00,
    currency: 'NOK',
    product_url: 'https://www.amazon.com/Stetson-Pork-Pie-Hat/dp/B001234567',
    image_url: 'https://via.placeholder.com/300',
    metadata: { sku: 'STN-PPH-001', material: '100% wool felt', sizes: ['S', 'M', 'L', 'XL'] },
    description: 'Classic pork pie hat in wool felt, as seen in Breaking Bad',
  }).returning();

  // 5) Koble produkter til subjects
  await db.insert(subjectProducts).values({
    subject_id: 'walter-white-hat',
    product_id: 'product-pork-pie-hat',
    sort_order: 1,
  });

  console.log('✅ Catalog demo data seeded!');
}

seedCatalogDemo().catch(console.error);
```

**Studenter kan kopiere dette mønsteret for å legge til:**
- Egne serier/filmer
- Egne subjects (karakterer, props, locations)
- Egne produkter
- Timeline for når ting dukker opp

**Kjør seeding:**
```bash
pnpm db:seed-catalog
```

---

## 🚀 Seeding Strategi for catalog_demo (IMPLEMENTER I HVERT REPO)

**Mål:** Gjøre det enkelt for studenter å legge til demo-data uten å skrive kompleks TypeScript.

**Plassering:** `packages/databases/postgres/src/seed-data/`

### Hvorfor denne strategien?

**Problem med TypeScript seed scripts:**
- ❌ Krever mye boilerplate-kode
- ❌ Vanskelig å legge til ny data uten programmeringskunnskap
- ❌ Må håndtere UUIDs og foreign keys manuelt
- ❌ Tidkrevende å oppdatere og vedlikeholde
- ❌ Ikke lett for team-medlemmer å bidra med demo-data

**Løsning: JSON-basert seeding:**
- ✅ Enkel mappestruktur per serie/film
- ✅ JSON-filer som er lett å lese og redigere
- ✅ Seed-script genererer UUIDs automatisk
- ✅ Automatisk kobling mellom subjects og products
- ✅ Timestamp-parsing (mm:ss → sekunder)
- ✅ Validering med Zod schemas

### Mappestruktur (implementer dette)

```
packages/databases/postgres/src/seed-data/
├── stranger-things/
│   ├── content.json          # Episode metadata
│   ├── subjects.json         # Characters, actors, props, apparel, locations
│   ├── products.json         # Purchasable products (linked via subject_label)
│   └── timeline.json         # When subjects appear (timestamps)
├── breaking-bad/
│   ├── content.json
│   ├── subjects.json
│   ├── products.json
│   └── timeline.json
├── mad-men/
│   └── ... (samme struktur)
└── README.md                 # Quick guide for students
```

**Hvordan studenter legger til ny serie:**
1. Lag en ny mappe: `mkdir seed-data/[serie-navn]/`
2. Lag 4 JSON-filer (se format under)
3. Kjør `pnpm db:seed` (seed-scriptet oppdager automatisk nye mapper)

### Seed-script funksjonalitet (implementer dette)

**Hva seed-scriptet må gjøre:**

1. **Les alle mapper** i `seed-data/`
2. **For hver mappe:**
   - Les `content.json` → generer UUID → insert til `content` tabell
   - Les `subjects.json` → generer UUIDs → insert til `subjects` tabell
   - Les `products.json` → generer UUIDs → insert til `products` OG `subject_products` tabell
   - Les `timeline.json` → konverter timestamps → insert til `content_subjects` tabell
3. **Auto-linking:**
   - Koble `products.json` til `subjects.json` via `subject_label` (må matche `subjects[].label`)
   - Koble `timeline.json` til `subjects.json` via `subject_label`
   - Koble `timeline.json` til `content.json` automatisk (én content per mappe)
4. **Validering:**
   - Bruk Zod schemas for å validere JSON før import
   - Gi tydelige feilmeldinger hvis format er feil

**Script kommandoer (implementer):**
```bash
# Seed alt
pnpm db:seed

# Seed kun én serie
pnpm db:seed stranger-things

# Re-seed (slett og importer på nytt)
pnpm db:seed --reset

# Valider JSON uten å importere
pnpm db:seed --validate
```

### JSON Format spesifikasjon

#### 1. content.json (én episode/film per mappe)

**Formål:** Episode/film metadata som skal vises i Consumer App.

**Required fields:**
```json
{
  "media_title": "Stranger Things",          // Serie-/filmnavn
  "season": 1,                                // Season number (null for filmer)
  "episode": 2,                               // Episode number (null for filmer)
  "episode_title": "The Weirdo on...",       // Episode-tittel
  "duration_seconds": 2040,                   // Total lengde i sekunder
  "thumbnail_url": "https://...",             // Cover image
  "description": "Episode synopsis..."        // Beskrivelse
}
```

**Seed-script mapping:**
```typescript
content.json → INSERT INTO content (
  media_title,      // fra JSON
  episode_title,    // fra JSON
  season,           // fra JSON
  episode,          // fra JSON
  duration_seconds, // fra JSON
  thumbnail_url,    // fra JSON
  description       // fra JSON
)
```

---

#### 2. subjects.json (array av subjects)

**Formål:** Characters, actors, props, apparel, locations som dukker opp i content.

**Required fields:**
```json
[
  {
    "label": "Eleven",                                    // Display name (UNIQUE per mappe!)
    "type": "character",                                  // Type (se tillatte typer under)
    "is_sellable": false,                                 // true hvis det finnes produkter
    "hero_image_url": "https://...",                      // Main image
    "external_url": "https://...",                        // Wikipedia/IMDB/Fandom (optional)
    "description": "Young girl with powers...",           // Beskrivelse
    "metadata": {                                         // Fleksibel JSONB (optional)
      "gender": "Female",
      "hair_style": "Buzz cut"
      // ... add whatever you want!
    }
  },
  {
    "label": "Millie Bobby Brown",
    "type": "person",
    "is_sellable": false,
    "hero_image_url": "https://...",
    "external_url": "https://..."
  },
  {
    "label": "Eggo Waffles (prop)",
    "type": "product_prop",
    "is_sellable": true,                                  // ⭐ true → må ha products i products.json
    "hero_image_url": "https://...",
    "metadata": {
      "brand": "Eggo",
      "packaging_color": "Yellow"
    }
  }
]
```

**Tillatte type-verdier (valideres av Zod):**
- `person` - Skuespiller/actor (Bryan Cranston, Millie Bobby Brown)
- `character` - Karakter (Walter White, Eleven)
- `product_prop` - Prop som kan kjøpes (Eggo Waffles, Pork Pie Hat)
- `apparel` - Klær (Blue Bomber Jacket, Pink Dress)
- `location` - Sted (Bradley's Big Buy, White Residence)
- `vehicle` - Kjøretøy (Walt's RV, Aztek)
- `other` - Annet (Refrigerated Display Case, Sliding Doors)

**VIKTIG:**
- `label` må være unique innenfor samme mappe (brukes for linking)
- Hvis `is_sellable: true`, MÅ det finnes minst ett produkt i `products.json`

**Seed-script mapping:**
```typescript
subjects.json → INSERT INTO subjects (
  label,            // fra JSON
  type,             // fra JSON (validate enum)
  is_sellable,      // fra JSON
  hero_image_url,   // fra JSON
  external_url,     // fra JSON (optional)
  description,      // fra JSON
  metadata          // fra JSON (JSONB)
)
```

---

#### 3. products.json (array av subject → products mappings)

**Formål:** Kjøpbare produkter knyttet til subjects. Ett subject kan ha flere produkter.

**Required fields:**
```json
[
  {
    "subject_label": "Eggo Waffles (prop)",          // ⭐ MÅ matche subjects.json label!
    "products": [
      {
        "title": "Eggo Homestyle Waffles - 8 count",
        "brand": "Eggo",                              // optional
        "base_price": 49.99,                          // Pris i NOK/EUR/USD
        "currency": "NOK",                            // Default: NOK
        "product_url": "https://...",                 // Link til butikk (optional)
        "image_url": "https://...",                   // Product image
        "description": "Classic waffles...",          // Beskrivelse
        "metadata": {                                 // Fleksibel JSONB (optional)
          "sku": "EGGO-HS-8CT",
          "weight": "280g",
          "gtin": "0038000402401"
        }
      }
    ]
  },
  {
    "subject_label": "Blue Bomber Jacket",           // ⭐ MÅ matche subjects.json!
    "products": [
      {
        "title": "Stranger Things Eleven Blue Jacket",
        "brand": "Famous Jackets",
        "base_price": 899.00,
        "currency": "NOK",
        "product_url": "https://...",
        "image_url": "https://...",
        "metadata": {
          "sizes": ["XS", "S", "M", "L", "XL"],
          "material": "Polyester"
        }
      },
      {
        "title": "Blue Windbreaker - Budget Alternative",  // ⭐ Samme subject, flere produkter!
        "brand": "Generic",
        "base_price": 299.00,
        "currency": "NOK",
        "product_url": "https://...",
        "image_url": "https://..."
      }
    ]
  }
]
```

**VIKTIG regler:**
- `subject_label` MÅ matche `label` fra `subjects.json` (ellers feil)
- Ett subject kan ha FLERE produkter (array)
- Hvis `subjects.json` har `is_sellable: true`, MÅ det finnes i `products.json`

**Seed-script mapping:**
```typescript
// For hvert element i products.json:
1. Finn subject med matching label fra subjects.json
2. INSERT INTO products (title, brand, base_price, ...) for hvert produkt
3. INSERT INTO subject_products (subject_id, product_id, sort_order)
   // sort_order = index i products array (0, 1, 2...)
```

---

#### 4. timeline.json (array av subject → temporal segments mappings)

**Formål:** Når dukker subjects opp i content (timestamp ranges).

**Required fields:**
```json
[
  {
    "subject_label": "Eleven",                   // ⭐ MÅ matche subjects.json label!
    "segments": [
      {
        "start": "00:00",                         // Timestamp format (se under)
        "end": "00:02"
      },
      {
        "start": "00:04",
        "end": "00:09"
      },
      {
        "start": "00:12",
        "end": "00:14"
      }
    ],
    "metadata": {                                 // Fleksibel JSONB (optional)
      "prominence": "main",
      "character_arc": "Protagonist"
    }
  },
  {
    "subject_label": "Eggo Waffles (prop)",
    "segments": [
      {
        "start": "00:06",
        "end": "00:09"
      },
      {
        "start": "00:13",
        "end": "00:14"
      }
    ],
    "metadata": {
      "visibility": "prominent",
      "importance": "key_prop"
    }
  }
]
```

**Timestamp format (automatisk parsing):**

Seed-scriptet MÅ støtte alle disse formatene og konvertere til sekunder:

| Format | Eksempel | Sekunder | Beskrivelse |
|--------|----------|----------|-------------|
| `ss` | `"05"` | 5 | 5 sekunder |
| `mm:ss` | `"01:30"` | 90 | 1 minutt 30 sekunder |
| `mm:ss` | `"12:30"` | 750 | 12 minutter 30 sekunder |
| `hh:mm:ss` | `"1:05:30"` | 3930 | 1 time 5 min 30 sek |

**Parsing-logikk:**
```typescript
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);

  if (parts.length === 1) return parts[0];                    // ss
  if (parts.length === 2) return parts[0] * 60 + parts[1];   // mm:ss
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss

  throw new Error(`Invalid timestamp format: ${timestamp}`);
}
```

**VIKTIG regler:**
- `subject_label` MÅ matche `label` fra `subjects.json`
- `start` må være mindre enn `end` (valideres)
- Ett subject kan ha FLERE segments (array)
- Segments kan overlappe (f.eks. både Eleven og Millie Bobby Brown synlige samtidig)

**Seed-script mapping:**
```typescript
// For hvert element i timeline.json:
1. Finn subject med matching label fra subjects.json
2. Finn content fra content.json (én per mappe)
3. For hvert segment:
   INSERT INTO content_subjects (
     content_id,      // fra content.json
     subject_id,      // fra subjects.json (via label match)
     start_time,      // parseTimestamp(segment.start)
     end_time,        // parseTimestamp(segment.end)
     metadata         // fra JSON (JSONB)
   )
```

---

### ⭐ VIKTIG: Ingen IDs i JSON-filene!

**JSON-filene inneholder IKKE:**
- ❌ subject_id
- ❌ product_id
- ❌ content_id
- ❌ Andre UUIDs eller database IDs

**JSON-filene bruker labels for linking:**
- ✅ `subjects[].label` - Unik identifikator per subject
- ✅ `products[].subject_label` - Refererer til `subjects[].label`
- ✅ `timeline[].subject_label` - Refererer til `subjects[].label`

**Seed-scriptet genererer automatisk:**
1. UUIDs for alle entiteter (content, subjects, products)
2. Foreign keys (subject_id, product_id, content_id)
3. Kobler via labels (subject_label → slå opp i map → få UUID)

**Eksempel på linking:**
```typescript
// Steg 1: Seed subjects og bygg map
const subjectMap = new Map<string, string>();
for (const subject of subjects.json) {
  const uuid = crypto.randomUUID();
  subjectMap.set(subject.label, uuid);  // "Eggo Waffles (prop)" → "uuid-abc123"
  await db.insert(subjects).values({ id: uuid, ...subject });
}

// Steg 2: Seed products med lookup
for (const productGroup of products.json) {
  const subjectId = subjectMap.get(productGroup.subject_label);  // "Eggo Waffles (prop)" → "uuid-abc123"
  if (!subjectId) throw new Error(`Subject not found: ${productGroup.subject_label}`);

  for (const product of productGroup.products) {
    const productId = crypto.randomUUID();
    await db.insert(products).values({ id: productId, ...product });
    await db.insert(subjectProducts).values({ subject_id: subjectId, product_id: productId });
  }
}
```

**Derfor er labels KRITISKE:**
- Labels må være nøyaktige (case-sensitive!)
- Labels må være unique innenfor samme mappe
- Hvis `subject_label` ikke matcher → error!

---

### Implementasjonsguide for seed-script

**Plassering:** `packages/databases/postgres/src/scripts/seed-catalog-demo.ts`

**High-level algoritme:**

```typescript
async function seedCatalogDemo(showName?: string) {
  const seedDataDir = path.join(__dirname, '../seed-data');

  // 1. Finn mapper å seede
  const folders = showName
    ? [showName]
    : fs.readdirSync(seedDataDir).filter(f => fs.statSync(path.join(seedDataDir, f)).isDirectory());

  // 2. For hver mappe
  for (const folder of folders) {
    const showDir = path.join(seedDataDir, folder);

    // Les JSON-filer
    const contentData = JSON.parse(fs.readFileSync(path.join(showDir, 'content.json'), 'utf-8'));
    const subjectsData = JSON.parse(fs.readFileSync(path.join(showDir, 'subjects.json'), 'utf-8'));
    const productsData = JSON.parse(fs.readFileSync(path.join(showDir, 'products.json'), 'utf-8'));
    const timelineData = JSON.parse(fs.readFileSync(path.join(showDir, 'timeline.json'), 'utf-8'));

    // 3. Valider med Zod
    const validatedContent = contentSchema.parse(contentData);
    const validatedSubjects = subjectsSchema.parse(subjectsData);
    const validatedProducts = productsSchema.parse(productsData);
    const validatedTimeline = timelineSchema.parse(timelineData);

    // 4. Seed content
    const contentId = crypto.randomUUID();
    await db.insert(content).values({
      id: contentId,
      ...validatedContent
    });

    // 5. Seed subjects (lagre label → UUID mapping)
    const subjectMap = new Map<string, string>();
    for (const subject of validatedSubjects) {
      const subjectId = crypto.randomUUID();
      subjectMap.set(subject.label, subjectId);

      await db.insert(subjects).values({
        id: subjectId,
        ...subject
      });
    }

    // 6. Seed products + subject_products
    for (const productGroup of validatedProducts) {
      const subjectId = subjectMap.get(productGroup.subject_label);
      if (!subjectId) throw new Error(`Subject not found: ${productGroup.subject_label}`);

      for (let i = 0; i < productGroup.products.length; i++) {
        const product = productGroup.products[i];
        const productId = crypto.randomUUID();

        await db.insert(products).values({
          id: productId,
          ...product
        });

        await db.insert(subjectProducts).values({
          subject_id: subjectId,
          product_id: productId,
          sort_order: i
        });
      }
    }

    // 7. Seed content_subjects (timeline)
    for (const entry of validatedTimeline) {
      const subjectId = subjectMap.get(entry.subject_label);
      if (!subjectId) throw new Error(`Subject not found: ${entry.subject_label}`);

      for (const segment of entry.segments) {
        await db.insert(contentSubjects).values({
          id: crypto.randomUUID(),
          content_id: contentId,
          subject_id: subjectId,
          start_time: parseTimestamp(segment.start),  // ⭐ Parser!
          end_time: parseTimestamp(segment.end),      // ⭐ Parser!
          metadata: entry.metadata || {}
        });
      }
    }

    console.log(`✅ Seeded ${folder}`);
  }
}

// Timestamp parser (KRITISK!)
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  throw new Error(`Invalid timestamp: ${timestamp}`);
}
```

**Zod schemas (lag disse):**
```typescript
const contentSchema = z.object({
  media_title: z.string(),
  season: z.number().nullable(),
  episode: z.number().nullable(),
  episode_title: z.string().nullable(),
  duration_seconds: z.number(),
  thumbnail_url: z.string().url().nullable(),
  description: z.string().nullable()
});

const subjectSchema = z.object({
  label: z.string(),
  type: z.enum(['person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other']),
  is_sellable: z.boolean(),
  hero_image_url: z.string().url().nullable(),
  external_url: z.string().url().nullable().optional(),
  description: z.string().nullable(),
  metadata: z.record(z.any()).optional()
});

// ... etc for products and timeline
```

**CLI kommandoer (legg til i package.json):**
```json
{
  "scripts": {
    "db:seed": "tsx src/scripts/seed-catalog-demo.ts",
    "db:seed:reset": "tsx src/scripts/seed-catalog-demo.ts --reset"
  }
}
```

---

### Fordeler med denne strategien

✅ **Enkel å legge til ny data** - lag bare en ny mappe, ingen kode
✅ **Ingen ID-håndtering** - seed-scriptet genererer UUIDs automatisk
✅ **Automatisk kobling** - subjects ↔ products via labels
✅ **Fleksibel metadata** - JSONB tar alt studenter vil legge til
✅ **Lesbar JSON** - timestamps i `mm:ss`, ikke sekunder
✅ **Isolerte serier** - hver mappe er uavhengig
✅ **Type-safe** - Zod validering fanger feil tidlig
✅ **Team-friendly** - ikke-programmerere kan bidra med demo-data

---

### Eksempel: Stranger Things demo-data

**Ferdig implementert i:** `packages/databases/postgres/src/seed-data/stranger-things/`

Inneholder:
- ✅ `content.json` - Stranger Things S01E02 metadata
- ✅ `subjects.json` - 13 subjects (Eleven, Millie Bobby Brown, Eggo Waffles, Blue Jacket, osv)
- ✅ `products.json` - 6 kjøpbare produkter knyttet til subjects
- ✅ `timeline.json` - Temporal segments for alle subjects

**Bruk dette som template** når du setter opp repo'ene!

---

### Bonus: Konvertering fra Google AI Studio

Hvis du har output fra Google AI Studio (temporal analyse av video), lag et converter-script:

**Plassering:** `packages/databases/postgres/src/scripts/convert-ai-studio.ts`

```bash
pnpm convert-ai-studio \
  eggos_scene.json \      # Google AI Studio temporal output
  eggos_subjects.json \   # Manual subject enrichment
  stranger-things         # Output folder
```

**Hva converter gjør:**
1. Leser `eggos_scene.json` (findings array med temporal_segments)
2. Leser `eggos_subjects.json` (subject metadata og product URLs)
3. Genererer de 4 JSON-filene i `seed-data/stranger-things/`
4. Konverterer timestamps fra `00:00:000` → `00:00` format
5. Mapper types (`Character` → `character`, `Actor` → `person`)

---

### Implementer dette i hvert repo (Consumer App & Marketplace Storefront)

**Steg 1:** Kopier `seed-data/` mappen til `packages/databases/postgres/src/`
```bash
cp -r seed-data packages/databases/postgres/src/
```

**Steg 2:** Implementer `seed-catalog-demo.ts` script
- Plassering: `packages/databases/postgres/src/scripts/seed-catalog-demo.ts`
- Se algoritme over for implementering
- Husk timestamp-parser funksjonen!

**Steg 3:** Lag Zod schemas for validering
- `contentSchema`
- `subjectSchema`
- `productSchema`
- `timelineSchema`

**Steg 4:** Legg til npm scripts i `package.json`
```json
{
  "db:seed": "tsx src/scripts/seed-catalog-demo.ts",
  "db:seed:reset": "tsx src/scripts/seed-catalog-demo.ts --reset"
}
```

**Steg 5:** Test seeding
```bash
pnpm db:seed stranger-things
```

**Steg 6:** Studentene kan nå legge til egne serier!
```bash
mkdir seed-data/breaking-bad
# Lag 4 JSON-filer
pnpm db:seed
```

---

## MVP API-regler (KRITISK - IKKE BRYT DISSE!)

**Disse reglene er absolutt kritiske for at Consumer App og Marketplace Storefront skal fungere sammen.**

### 1. Én aktiv cart per user ⭐

- `GET /api/me/cart` returnerer **alltid** brukerens aktive cart
- Hvis cart ikke finnes, **opprett den automatisk** på server-side
- Studentene skal **aldri** måtte sjekke "finnes cart?" i frontend

**Hvorfor:**
- Fjerner masse boilerplate-kode i begge apper
- Garanterer at begge apper ser samme cart
- Forenkler cross-device shopping

**Backend implementering:**
```typescript
async function getOrCreateActiveCart(userId: string) {
  let cart = await db.select().from(carts)
    .where(eq(carts.user_id, userId))
    .where(eq(carts.status, 'active'))
    .limit(1);

  if (!cart.length) {
    cart = await db.insert(carts).values({
      user_id: userId,
      status: 'active',
    }).returning();
  }

  return cart[0];
}
```

### 2. Favoritter er kun subjects (ikke produkter) ⭐

- `user_favorites` tabellen inneholder **kun** `subject_id`
- Hvis Marketplace Storefront vil ha "product wishlist", lag en **egen** tabell senere
- Ikke bland semantikk i MVP

**Hvorfor:**
- Subject er kjernen i Hoolsy-konseptet
- Produkter kommer og går, subjects er stabile
- Enklere å vise "favoritter" konsistent

### 3. Pris snapshot alltid ⭐

- `cart_items.unit_price` settes når produktet legges i kurv
- `order_items.unit_price` kopieres fra `cart_items.unit_price` ved checkout
- **Aldri** hent pris fra `products.base_price` etter at varen er i kurv

**Hvorfor:**
- Hvis dere endrer pris i katalogen, skal ikke handlekurv endre seg
- Ordre skal alltid vise prisen brukeren faktisk betalte
- Unngår forvirring og bugs

**Backend implementering:**
```typescript
// Når bruker legger i kurv
const product = await db.select().from(products).where(eq(products.id, productId));

await db.insert(cart_items).values({
  cart_id: cartId,
  product_id: productId,
  quantity: 1,
  unit_price: product.base_price, // ⭐ snapshot her
  currency: product.currency,
});
```

### 4. Identiske Zod schemas ⭐

- **Importer** fra `@hk26/schema`, **aldri** lag egne varianter
- Samme feltnavn, samme typer, samme enums
- Hvis ett team trenger nytt felt, **diskuter med andre team først**

**Hvorfor:**
- Hvis Consumer App bruker `full_name` og Storefront bruker `fullName`, blir det kaos
- Type safety på tvers av apper
- Mindre debugging

**Eksempel:**
```typescript
// ✅ RIKTIG - begge apper
import { userSchema, cartItemSchema } from '@hk26/schema';

// ❌ FEIL - ikke gjør dette
const myUserSchema = z.object({ fullName: z.string() });
```

### 5. Samme auth tokens ⭐

- Begge apper må bruke **identisk JWT-struktur**
- Samme secret key (i development)
- Samme payload format: `{ userId, email, iat, exp }`

**Hvorfor:**
- Brukere kan logge inn i én app og være innlogget i begge
- Delt session state
- Enklere testing

### 6. API-organisering: `/catalog` vs `/me` ⭐

For å gjøre det krystallklart hva som er "offentlig katalog" og "min brukerdata":

**Offentlig katalog (ingen auth):**
- `GET /api/catalog/subjects`
- `GET /api/catalog/products`
- `GET /api/catalog/search`

**Brukerdata (krever auth):**
- `GET /api/me/cart`
- `GET /api/me/favorites`
- `GET /api/me/orders`

**Consumer App spesifikt (ingen auth for å browse, auth for user actions):**
- `GET /api/content` - liste episodes (ingen auth)
- `GET /api/content/:id/timeline` - timeline (ingen auth)
- `GET /api/content/:id/at/:timestamp` - hva er på skjermen (ingen auth)

**Autentisering (public endpoints):**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Fordeler med denne strukturen:**
- Selvforklarende URLs
- Enklere å sette opp middleware for auth
- Tydeligere for studentene hva som krever innlogging

---

## Konsekvens hvis MVP-reglene brytes

Hvis teamene ikke følger disse reglene:

❌ "Legg i kurv på mobil, kjøp på desktop" vil **ikke fungere**
❌ Favoritter vil ikke synce mellom apper
❌ Ordre kan vise feil priser
❌ Debugging vil ta **dager** i stedet for timer
❌ Dere mister hele "cross-platform shopping" demoen

**Derfor: følg reglene slavisk i MVP. Eksperimenter senere.**

---

## API for Marketplace Storefront: Browse & Shop

**Scenario:** Marketplace Storefront skal la brukere browse produkter basert på collections, subjects, categories, og søk.

### API Endpoints for Storefront

#### 1) GET /api/catalog/products

**Formål:** Hent alle produkter (med paginering og filtrering).

**Query params:**
- `page` - Side-nummer (default: 1)
- `limit` - Produkter per side (default: 20)
- `category` - Filtrer på kategori (valgfri)
- `min_price` - Minimum pris (valgfri)
- `max_price` - Maximum pris (valgfri)
- `brand` - Filtrer på brand (valgfri)
- `sort` - Sortering: `price_asc`, `price_desc`, `newest` (default: `newest`)

**Eksempel:** `GET /api/catalog/products?page=1&limit=20&sort=price_asc`

**Response:**
```json
{
  "products": [
    {
      "id": "uuid-product-1",
      "title": "Pork Pie Hat - Wool Felt",
      "image_url": "https://...",
      "base_price": 299.00,
      "currency": "NOK",
      "brand": "Stetson",
      "description": "Classic pork pie hat...",
      "subjects": [
        {
          "subject_id": "uuid-walter-white-hat",
          "subject_title": "Walter White's Pork Pie Hat"
        }
      ]
    },
    {
      "id": "uuid-product-2",
      "title": "Yellow Hazmat Suit",
      "image_url": "https://...",
      "base_price": 149.00,
      "currency": "NOK",
      "brand": "WorkSafe",
      "description": "Professional hazmat suit...",
      "subjects": [
        {
          "subject_id": "uuid-hazmat-suit",
          "subject_title": "Walter White's Hazmat Suit"
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_products": 87,
    "per_page": 20
  }
}
```

**Brukes til:**
- Product grid/collections
- Browse all products
- Search results

---

#### 2) GET /api/catalog/subjects

**Formål:** Hent alle subjects (med filtrering).

**Query params:**
- `type` - Filtrer på type: `person`, `product_prop`, `location` (valgfri)
- `is_sellable` - Kun sellable subjects (default: `true`)
- `page` - Side-nummer (default: 1)
- `limit` - Subjects per side (default: 20)

**Eksempel:** `GET /api/catalog/subjects?is_sellable=true&type=product_prop`

**Response:**
```json
{
  "subjects": [
    {
      "id": "uuid-walter-white-hat",
      "label": "Walter White's Pork Pie Hat",
      "type": "product_prop",
      "is_sellable": true,
      "hero_image_url": "https://...",
      "external_url": "https://breakingbad.fandom.com/wiki/Pork_Pie_Hat",
      "metadata": {
        "color": "tan",
        "material": "wool felt"
      },
      "description": "Iconic pork pie hat...",
      "product_count": 3
    },
    {
      "id": "uuid-hazmat-suit",
      "label": "Walter White's Hazmat Suit",
      "type": "apparel",
      "is_sellable": true,
      "hero_image_url": "https://...",
      "external_url": "https://breakingbad.fandom.com/wiki/Hazmat_Suit",
      "metadata": {
        "color": "yellow",
        "type": "protective_gear"
      },
      "description": "Yellow hazmat suit...",
      "product_count": 2
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_subjects": 42,
    "per_page": 20
  }
}
```

**Brukes til:**
- Browse subjects
- Filter by type (props, people, locations)
- Subject collections page

---

#### 3) GET /api/catalog/subjects/:subject_id/products

**Formål:** Hent alle produkter relatert til et subject.

**Eksempel:** `GET /api/catalog/subjects/uuid-walter-white-hat/products`

**Response:**
```json
{
  "subject": {
    "id": "uuid-walter-white-hat",
    "label": "Walter White's Pork Pie Hat",
    "type": "product_prop",
    "is_sellable": true,
    "hero_image_url": "https://...",
    "external_url": "https://breakingbad.fandom.com/wiki/Pork_Pie_Hat",
    "metadata": {
      "color": "tan",
      "material": "wool felt"
    },
    "description": "Iconic pork pie hat..."
  },
  "products": [
    {
      "id": "uuid-product-1",
      "title": "Pork Pie Hat - Wool Felt",
      "brand": "Stetson",
      "image_url": "https://...",
      "base_price": 299.00,
      "currency": "NOK",
      "product_url": "https://www.amazon.com/Stetson-Pork-Pie-Hat/dp/B001234567",
      "metadata": {
        "sku": "STN-PPH-001",
        "sizes": ["S", "M", "L", "XL"]
      },
      "description": "Classic pork pie hat..."
    },
    {
      "id": "uuid-product-3",
      "title": "Pork Pie Hat - Budget Edition",
      "brand": "Generic",
      "image_url": "https://...",
      "base_price": 149.00,
      "currency": "NOK",
      "product_url": "https://www.amazon.com/Budget-Pork-Pie-Hat/dp/B007654321",
      "metadata": {
        "sku": "GEN-PPH-001",
        "sizes": ["M", "L"]
      },
      "description": "Affordable pork pie hat..."
    }
  ]
}
```

**Brukes til:**
- Subject detail page
- "Shop this look" collections
- Product discovery via subjects

---

#### 4) GET /api/catalog/products/:product_id

**Formål:** Hent detaljer for ett produkt.

**Eksempel:** `GET /api/catalog/products/uuid-product-1`

**Response:**
```json
{
  "id": "uuid-product-1",
  "title": "Pork Pie Hat - Wool Felt",
  "image_url": "https://...",
  "base_price": 299.00,
  "currency": "NOK",
  "brand": "Stetson",
  "description": "Classic pork pie hat in wool felt, as seen in Breaking Bad",
  "subjects": [
    {
      "subject_id": "uuid-walter-white-hat",
      "subject_title": "Walter White's Pork Pie Hat",
      "subject_type": "product_prop"
    }
  ],
  "related_products": [
    {
      "id": "uuid-product-3",
      "title": "Pork Pie Hat - Budget Edition",
      "image_url": "https://...",
      "base_price": 149.00
    }
  ]
}
```

**Brukes til:**
- Product detail page
- Related products section

---

#### 5) GET /api/catalog/search

**Formål:** Søk i produkter og subjects.

**Query params:**
- `q` - Search query (required)
- `type` - Søk i: `products`, `subjects`, `all` (default: `all`)
- `page` - Side-nummer (default: 1)
- `limit` - Resultater per side (default: 20)

**Eksempel:** `GET /api/catalog/search?q=hat&type=all`

**Response:**
```json
{
  "query": "hat",
  "results": {
    "products": [
      {
        "id": "uuid-product-1",
        "title": "Pork Pie Hat - Wool Felt",
        "image_url": "https://...",
        "base_price": 299.00,
        "currency": "NOK",
        "brand": "Stetson"
      }
    ],
    "subjects": [
      {
        "id": "uuid-walter-white-hat",
        "title": "Walter White's Pork Pie Hat",
        "type": "product_prop",
        "is_sellable": true,
        "hero_image_url": "https://..."
      }
    ]
  },
  "total_results": 5
}
```

**Brukes til:**
- Search bar
- Product & subject discovery
- Autocomplete suggestions

---

### Marketplace Storefront: Browse Flow

**Hvordan Marketplace Storefront bruker API-et:**

**Flow 1 - Browse all products:**
```typescript
// Hent alle produkter (første side)
const response = await fetch('/api/catalog/products?page=1&limit=20&sort=newest');
const { products, pagination } = await response.json();

// Vis produkter i grid
renderProductGrid(products);

// Paginering
renderPagination(pagination);
```

**Flow 2 - Browse subjects og produkter:**
```typescript
// Hent sellable subjects
const subjectsResponse = await fetch('/api/catalog/subjects?is_sellable=true');
const { subjects } = await subjectsResponse.json();

// Bruker klikker på "Walter White's Hat"
const selectedSubject = subjects[0];

// Hent produkter for dette subjectet
const productsResponse = await fetch(`/api/catalog/subjects/${selectedSubject.id}/products`);
const { subject, products } = await productsResponse.json();

// Vis subject detail page med produkter
renderSubjectDetailPage(subject, products);
```

**Flow 3 - Search:**
```typescript
// Bruker søker etter "hat"
const searchQuery = "hat";
const searchResponse = await fetch(`/api/catalog/search?q=${searchQuery}`);
const { results } = await searchResponse.json();

// Vis søkeresultater (både produkter og subjects)
renderSearchResults(results);
```

**Flow 4 - Product detail:**
```typescript
// Bruker klikker på produkt
const productId = "uuid-product-1";
const productResponse = await fetch(`/api/catalog/products/${productId}`);
const product = await productResponse.json();

// Vis product detail page
renderProductDetailPage(product);

// Vis related subjects
renderRelatedSubjects(product.subjects);

// Vis related products
renderRelatedProducts(product.related_products);
```

---

### API Strategi: To forskjellige tilnærminger

**Consumer App (Timeline-basert):**
- Entry point: `content` (episodes/filmer)
- Navigation: Timestamp → subjects → products
- Bruker: "Hva er på skjermen NÅ?" → kjøp produkter
- API fokus: `/api/content/:id/at/:timestamp`

**Marketplace Storefront (Browse-basert):**
- Entry point: `products` eller `subjects`
- Navigation: Categories → subjects → products
- Bruker: "Jeg vil kjøpe en hatt" → søk/browse → kjøp
- API fokus: `/api/catalog/products`, `/api/catalog/subjects`, `/api/catalog/search`

**Samme data, forskjellig tilgang:**
Begge teams bruker samme `subjects` og `products` tabeller, men de tilnærmer seg dataen på forskjellige måter:

```
Consumer App:
content → content_subjects (timeline) → subjects → products
(Tidslinje-drevet shopping)

Marketplace Storefront:
subjects → products (browse)
products (direkte browse)
search → products/subjects
(Tradisjonell e-commerce)
```

---

### Felles API Endpoints (begge teams)

Disse endpoints brukes av **både** Consumer App og Marketplace Storefront:

#### Cart API (brukerdata - krever auth)
- `GET /api/me/cart` - Hent handlekurv (oppretter automatisk hvis ikke finnes ⭐)
- `POST /api/me/cart/items` - Legg til i handlekurv
- `PATCH /api/me/cart/items/:product_id` - Oppdater quantity
- `DELETE /api/me/cart/items/:product_id` - Fjern fra handlekurv

#### Favorites API (brukerdata - krever auth)
- `GET /api/me/favorites` - Hent favoritter
- `POST /api/me/favorites` - Legg til favoritt (body: `{ subject_id }`)
- `DELETE /api/me/favorites/:subject_id` - Fjern favoritt

#### Addresses API (brukerdata - krever auth)
- `GET /api/me/addresses` - Hent alle adresser
- `POST /api/me/addresses` - Legg til ny adresse
- `PATCH /api/me/addresses/:address_id` - Oppdater adresse
- `DELETE /api/me/addresses/:address_id` - Slett adresse
- `POST /api/me/addresses/:address_id/set-default` - Sett som default

#### Orders API (brukerdata - krever auth)
- `GET /api/me/orders` - Hent ordre-historikk
- `GET /api/me/orders/:order_id` - Hent ordre-detaljer
- `POST /api/me/checkout` - Fullfør checkout (body: `{ address_id }`)

#### Auth API (offentlig - ingen auth)
- `POST /api/auth/register` - Registrer bruker
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Hent innlogget bruker (krever auth)

---

### Backend implementering: Enkel struktur

**`apps/api/src/routes/catalog.ts`:**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { db } from '@hk26/postgres';
import { products, subjects, subjectProducts } from '@hk26/postgres/schema';
import { eq } from 'drizzle-orm';

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/catalog/products
  fastify.get('/catalog/products', async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any;

    const allProducts = await db
      .select()
      .from(products)
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      products: allProducts,
      pagination: {
        current_page: page,
        per_page: limit,
      },
    };
  });

  // GET /api/catalog/products/:id
  fastify.get('/catalog/products/:id', async (request, reply) => {
    const { id } = request.params as any;

    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product.length) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    // Hent subjects relatert til dette produktet
    const relatedSubjects = await db
      .select()
      .from(subjectProducts)
      .innerJoin(subjects, eq(subjectProducts.subject_id, subjects.id))
      .where(eq(subjectProducts.product_id, id));

    return {
      ...product[0],
      subjects: relatedSubjects.map(r => r.subjects),
    };
  });

  // GET /api/catalog/subjects
  fastify.get('/catalog/subjects', async (request, reply) => {
    const { is_sellable = true, type } = request.query as any;

    let query = db.select().from(subjects);

    if (is_sellable) {
      query = query.where(eq(subjects.is_sellable, true));
    }

    if (type) {
      query = query.where(eq(subjects.type, type));
    }

    const allSubjects = await query;
    return { subjects: allSubjects };
  });

  // GET /api/catalog/subjects/:id/products
  fastify.get('/catalog/subjects/:id/products', async (request, reply) => {
    const { id } = request.params as any;

    // Hent subject
    const subject = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    if (!subject.length) {
      return reply.status(404).send({ error: 'Subject not found' });
    }

    // Hent produkter for dette subjectet
    const relatedProducts = await db
      .select()
      .from(subjectProducts)
      .innerJoin(products, eq(subjectProducts.product_id, products.id))
      .where(eq(subjectProducts.subject_id, id))
      .orderBy(subjectProducts.sort_order);

    return {
      subject: subject[0],
      products: relatedProducts.map(r => r.products),
    };
  });
};
```

**`apps/api/src/routes/me.ts`:**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { db } from '@hk26/postgres';
import { carts, cartItems, products } from '@hk26/postgres/schema';
import { eq } from 'drizzle-orm';

export const meRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware: alle /me routes krever auth
  fastify.addHook('onRequest', async (request, reply) => {
    // Sjekk JWT token og sett request.user
    // Implementer auth-logikk her
  });

  // GET /api/me/cart ⭐ Auto-create!
  fastify.get('/me/cart', async (request, reply) => {
    const userId = request.user.id;

    // Finn eller opprett aktiv cart
    let cart = await db
      .select()
      .from(carts)
      .where(eq(carts.user_id, userId))
      .where(eq(carts.status, 'active'))
      .limit(1);

    if (!cart.length) {
      // ⭐ Auto-create cart
      cart = await db.insert(carts).values({
        user_id: userId,
        status: 'active',
      }).returning();
    }

    // Hent items i kurven
    const items = await db
      .select()
      .from(cartItems)
      .innerJoin(products, eq(cartItems.product_id, products.id))
      .where(eq(cartItems.cart_id, cart[0].id));

    return {
      cart: cart[0],
      items: items.map(i => ({
        ...i.cart_items,
        product: i.products,
      })),
    };
  });

  // POST /api/me/cart/items
  fastify.post('/me/cart/items', async (request, reply) => {
    const userId = request.user.id;
    const { product_id, quantity = 1 } = request.body as any;

    // Finn eller opprett aktiv cart
    let cart = await getOrCreateActiveCart(userId);

    // Hent product for å få unit_price ⭐
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, product_id))
      .limit(1);

    if (!product.length) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    // Legg til i cart med pris snapshot
    await db.insert(cartItems).values({
      cart_id: cart.id,
      product_id: product_id,
      quantity: quantity,
      unit_price: product[0].base_price, // ⭐ Snapshot!
      currency: product[0].currency,
    });

    return { success: true };
  });
};

// Helper function
async function getOrCreateActiveCart(userId: string) {
  let cart = await db
    .select()
    .from(carts)
    .where(eq(carts.user_id, userId))
    .where(eq(carts.status, 'active'))
    .limit(1);

  if (!cart.length) {
    cart = await db.insert(carts).values({
      user_id: userId,
      status: 'active',
    }).returning();
  }

  return cart[0];
}
```

**Dette gir begge teams et enkelt, konsistent API med tydelig separasjon mellom katalog og brukerdata!**

---

## Student Prioriteringsveiledning

### MVP (Minimum Viable Product) - Start her! 🚀

**users_public database (7 tabeller):**
1. ⭐ `users` - Registrering, innlogging, fødselsdato
2. ⭐ `user_favorites` - Hjerte på subjects
3. ⭐ `user_addresses` - Leveringsadresser
4. ⭐ `carts` - Handlekurv
5. ⭐ `cart_items` - Produkter i kurv
6. ⭐ `orders` - Ordre-hode
7. ⭐ `order_items` - Produkter i ordre
8. (Valgfri) `payments` - Payment tracking

**catalog_demo database (5 tabeller):**
1. ⭐ `content` - Episodes/filmer som kan "sees på" (Consumer App)
2. ⭐ `content_subjects` - Timeline: når dukker subjects opp (Consumer App)
3. ⭐ `subjects` - Det brukeren ser og hjerter
4. ⭐ `products` - Produkter som kan kjøpes
5. ⭐ `subject_products` - Kobling mellom subjects og produkter
6. (Valgfri) `product_offers` - Multi-vendor support

**Dette er alt dere trenger for full funksjonalitet!**

**Viktig:**
- **Marketplace Storefront:** Trenger IKKE `content` og `content_subjects` (kun Consumer App)
- **Consumer App:** Trenger ALLE tabellene

### Hva MVP gir deg

**users_public:**
- ✅ Registrering med email, passord, navn, fødselsdato
- ✅ Innlogging
- ✅ Hjerte på subjects (favoritter)
- ✅ Lagrede leveringsadresser
- ✅ Handlekurv som synces mellom Consumer App og Marketplace Storefront
- ✅ Checkout og ordre-historikk

**catalog_demo:**
- ✅ Content catalog (episodes/filmer som kan "sees på") - **Consumer App**
- ✅ Timeline: når dukker subjects opp i content - **Consumer App**
- ✅ Subject catalog (personer, props, locations)
- ✅ Product catalog med priser og bilder
- ✅ Kobling: hvilke produkter hører til hvilket subject
- ✅ Sellable subjects (subjects med minst ett produkt)

### Implementeringsrekkefølge

**Steg 1 - Basis (uke 1-2):**
1. Opprett begge databaser
2. Implementer `users` tabell og auth (registrering + login)
3. **Consumer App:** Seed `content`, `content_subjects` med demo-data (Breaking Bad S01E01)
4. **Begge teams:** Seed `subjects` og `products` med demo-data
5. Test innlogging og se subjects i appen

**Steg 2 - Consumer App: "Watching" episode (uke 2):**
1. **Consumer App:** Implementer content liste og "play" episode
2. **Consumer App:** Implementer simulert playback (progress bar)
3. **Consumer App:** Implementer timeline med markører
4. **Consumer App:** Implementer "currently on screen" subjects (polling API hver 5. sekund)
5. **Marketplace Storefront:** Implementer product grid/collections

**Steg 3 - Favoritter (uke 2-3):**
1. Implementer `user_favorites`
2. Hjerte-knapp i UI
3. "Mine favoritter" side

**Steg 4 - Shopping (uke 3-4):**
1. Implementer `carts` og `cart_items`
2. "Legg i handlekurv" knapp
3. Handlekurv-side
4. Implementer `user_addresses`
5. Implementer `orders` og `order_items`
6. Checkout-flyt
7. Ordre-historikk

**Steg 5 - Polish (uke 5+):**
1. Forbedre UI/UX
2. Legge til payments (valgfri)
3. Testing og bugfixing
4. **Consumer App:** Forbedre timeline (scrubbing, zoom)
5. **Marketplace Storefront:** Søk og filtrering

### Team-spesifikk veiledning

#### Marketplace Storefront:
**Start med:**
- `users`, `user_favorites`, `user_addresses`, `carts`, `cart_items`, `orders`, `order_items`
- `subjects`, `products`, `subject_products`

**Fokus:**
- Desktop-optimalisert UI
- Produktvisning i collections/grids
- Søk og filtrering
- Checkout-flyt

#### Consumer App:
**Start med (users_public):**
- `users`, `user_favorites`, `user_addresses`, `carts`, `cart_items`, `orders`, `order_items`

**Start med (catalog_demo):**
- `content`, `content_subjects` ⭐ (KRITISK for Consumer App!)
- `subjects`, `products`, `subject_products`

**Fokus:**
- Mobil-optimalisert UI
- **"Watching" episode simulering** (progress bar, timeline)
- **Real-time subject display** ("currently on screen")
- Hjerte-funksjonalitet (favoritter)
- Subject discovery og shopping
- Enkel checkout på mobil

**Unike Consumer App features:**
- Content playlist ("Breaking Bad", "Mad Men", etc.)
- Simulert playback med progress bar
- Timeline med markører (når dukker subjects opp)
- "Currently on screen" subjects (oppdateres hver 5. sekund)
- Favoritt-liste (hjertede subjects)

---

## Felles for alle teams

### 1. API (Node.js + Fastify)
- Alle teams har samme API-struktur i `apps/api/`
- Fastify server med TypeScript
- Zod validering
- JWT autentisering

### 2. Shared Packages
- `@hk26/schema` - Zod schemas (KRITISK at alle bruker samme!)
- `@hk26/eslint-config` - Linting regler
- `@hk26/tsconfig` - TypeScript konfigurasjon

### 3. Docker Setup
- PostgreSQL i Docker
- Alle teams bruker samme `docker-compose.yml` (tilpasset antall databaser)

### 4. pnpm Monorepo
- Workspace struktur
- Shared dependencies
- Type safety på tvers av packages

---

## Data Contract Enforcement (KRITISK!)

### Hvorfor dette er viktig
Alle teams som jobber med relaterte systemer (Marketplace, Syncstation, Consumer App) **må** bruke identiske Zod schemas for delte entiteter.

### Eksempel: Product Schema

**✅ RIKTIG - Import shared schema:**
```typescript
import { productSchema, type Product } from '@hk26/schema';

const product: Product = {
  id: '...',
  title: 'Product Name',        // ✅ Bruker "title"
  tenantId: '...',                // ✅ Bruker "tenantId"
  // ... andre felt som matcher shared schema
};
```

**❌ FEIL - Egendefinert schema:**
```typescript
// IKKE gjør dette!
const myProductSchema = z.object({
  productId: z.string(),        // ❌ Skal være "id"
  productName: z.string(),      // ❌ Skal være "title"
  companyId: z.string(),        // ❌ Skal være "tenantId"
});
```

### Regler for Data Contracts
1. **Importer** schemas fra `@hk26/schema` - aldri lag duplikater
2. **Bruk eksakte** feltnavn som definert i shared schemas
3. **Ikke legg til** custom felt som avviker fra shared contract
4. **Diskuter** med andre teams hvis nye felt trengs
5. **Valider** på både client og server side

---

## Zod Schema Sentralisering: Setup Guide 📦

### Oversikt
Alle fire team-repoer **må** bruke identiske Zod schemas fra en felles `@hk26/schema` pakke for å sikre type-safety og data-konsistens på tvers av appene.

### Strukturen i `@hk26/schema` pakken

**Mappe-struktur:**
```
packages/schema/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Main export
│   ├── auth.ts               # Autentisering schemas
│   ├── user.ts               # User-relaterte schemas
│   ├── catalog.ts            # Catalog schemas (subjects, products)
│   ├── content.ts            # Content schemas (episodes, timeline)
│   ├── cart.ts               # Cart og cart items
│   ├── order.ts              # Orders og order items
│   ├── favorite.ts           # User favorites
│   └── address.ts            # User addresses
```

### 1. Auth Schemas (`packages/schema/src/auth.ts`)

**Disse brukes av ALLE teams:**

```typescript
import { z } from 'zod';

// POST /api/auth/register
export const registerSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(8, 'Passord må være minst 8 tegn'),
  full_name: z.string().min(2, 'Fullt navn må være minst 2 tegn'),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Må være YYYY-MM-DD'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// POST /api/auth/login
export const loginSchema = z.object({
  email: z.string().email('Ugyldig e-postadresse'),
  password: z.string().min(1, 'Passord er påkrevd'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Response fra login/register
export const authResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    full_name: z.string(),
    created_at: z.string().datetime(),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
```

### 2. User Schemas (`packages/schema/src/user.ts`)

**Brukes av:**
- ✅ Marketplace Storefront (users_public)
- ✅ Consumer App (users_public)
- ✅ Syncstation (USER DB - read-only)
- ✅ Vendor Onboarding (USER DB - read-only)

```typescript
import { z } from 'zod';

// Database user record
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_verified: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

// Public user (uten password_hash)
export const publicUserSchema = userSchema.omit({ password_hash: true });

export type PublicUser = z.infer<typeof publicUserSchema>;

// Update user profile
export const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

### 3. Catalog Schemas (`packages/schema/src/catalog.ts`)

**Brukes av:**
- ✅ Marketplace Storefront (catalog_demo)
- ✅ Consumer App (catalog_demo)

```typescript
import { z } from 'zod';

// Subject
export const subjectSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  type: z.enum(['person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other']),
  is_sellable: z.boolean().default(false),
  hero_image_url: z.string().url().nullable(),
  external_url: z.string().url().nullable(),
  description: z.string().nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Subject = z.infer<typeof subjectSchema>;

// Product
export const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  brand: z.string().nullable(),
  base_price: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
  image_url: z.string().url().nullable(),
  product_url: z.string().url().nullable(),
  description: z.string().nullable(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
});

export type Product = z.infer<typeof productSchema>;

// Subject-Product linking
export const subjectProductSchema = z.object({
  subject_id: z.string().uuid(),
  product_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type SubjectProduct = z.infer<typeof subjectProductSchema>;

// GET /api/catalog/subjects response
export const subjectsResponseSchema = z.object({
  subjects: z.array(subjectSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export type SubjectsResponse = z.infer<typeof subjectsResponseSchema>;

// GET /api/catalog/products response
export const productsResponseSchema = z.object({
  products: z.array(productSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export type ProductsResponse = z.infer<typeof productsResponseSchema>;
```

### 4. Content Schemas (`packages/schema/src/content.ts`)

**Brukes av:**
- ✅ Consumer App (catalog_demo)

```typescript
import { z } from 'zod';

// Content (episode)
export const contentSchema = z.object({
  id: z.string().uuid(),
  media_title: z.string().min(1),        // "Stranger Things"
  episode_title: z.string().nullable(),   // "The Vanishing of Will Byers"
  season: z.number().int().positive().nullable(),
  episode: z.number().int().positive().nullable(),
  duration_seconds: z.number().int().positive(),
  thumbnail_url: z.string().url().nullable(),
  description: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type Content = z.infer<typeof contentSchema>;

// Timeline segment
export const timelineSegmentSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  start_time: z.number().int().nonnegative(),
  end_time: z.number().int().positive(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string().datetime(),
});

export type TimelineSegment = z.infer<typeof timelineSegmentSchema>;

// GET /api/content/:id/timeline response
export const timelineResponseSchema = z.object({
  content_id: z.string().uuid(),
  segments: z.array(z.object({
    subject_id: z.string().uuid(),
    subject_label: z.string(),
    subject_type: z.string(),
    start_time: z.number().int().nonnegative(),
    end_time: z.number().int().positive(),
    hero_image_url: z.string().url().nullable(),
  })),
});

export type TimelineResponse = z.infer<typeof timelineResponseSchema>;

// GET /api/content/:id/at/:timestamp response
export const subjectsAtTimestampSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  subjects: z.array(z.object({
    id: z.string().uuid(),
    label: z.string(),
    type: z.string(),
    hero_image_url: z.string().url().nullable(),
    is_sellable: z.boolean(),
  })),
});

export type SubjectsAtTimestamp = z.infer<typeof subjectsAtTimestampSchema>;
```

### 5. Cart Schemas (`packages/schema/src/cart.ts`)

**Brukes av:**
- ✅ Marketplace Storefront (users_public)
- ✅ Consumer App (users_public)

```typescript
import { z } from 'zod';

// Cart
export const cartSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['active', 'checked_out', 'abandoned']).default('active'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Cart = z.infer<typeof cartSchema>;

// Cart item
export const cartItemSchema = z.object({
  cart_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),        // ⭐ Price snapshot
  currency: z.string().length(3).default('NOK'),
  added_at: z.string().datetime(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// POST /api/me/cart/items - Add item to cart
export const addCartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

// PATCH /api/me/cart/items/:productId - Update quantity
export const updateCartItemSchema = z.object({
  quantity: z.number().int().nonnegative(), // 0 = remove
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

// GET /api/me/cart response
export const cartResponseSchema = z.object({
  cart: cartSchema,
  items: z.array(cartItemSchema.extend({
    product_title: z.string(),
    product_image_url: z.string().url().nullable(),
    product_brand: z.string().nullable(),
  })),
  total: z.number().nonnegative(),
});

export type CartResponse = z.infer<typeof cartResponseSchema>;
```

### 6. Order Schemas (`packages/schema/src/order.ts`)

**Brukes av:**
- ✅ Marketplace Storefront (users_public)
- ✅ Consumer App (users_public)

```typescript
import { z } from 'zod';

// Order
export const orderSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  cart_id: z.string().uuid(),
  status: z.enum(['created', 'paid', 'cancelled', 'refunded']).default('created'),
  total: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
  shipping_address_id: z.string().uuid().nullable(),
  payment_method: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Order = z.infer<typeof orderSchema>;

// Order item
export const orderItemSchema = z.object({
  order_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
  created_at: z.string().datetime(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// POST /api/me/orders - Create order from cart
export const createOrderSchema = z.object({
  shipping_address_id: z.string().uuid(),
  payment_method: z.string().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// GET /api/me/orders response
export const ordersResponseSchema = z.object({
  orders: z.array(orderSchema.extend({
    items: z.array(orderItemSchema.extend({
      product_title: z.string(),
      product_image_url: z.string().url().nullable(),
    })),
  })),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().nonnegative(),
  }),
});

export type OrdersResponse = z.infer<typeof ordersResponseSchema>;
```

### 7. Favorite Schemas (`packages/schema/src/favorite.ts`)

**Brukes av:**
- ✅ Marketplace Storefront (users_public)
- ✅ Consumer App (users_public)

```typescript
import { z } from 'zod';

// User favorite
export const favoriteSchema = z.object({
  user_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type Favorite = z.infer<typeof favoriteSchema>;

// POST /api/me/favorites
export const addFavoriteSchema = z.object({
  subject_id: z.string().uuid(),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;

// GET /api/me/favorites response
export const favoritesResponseSchema = z.object({
  favorites: z.array(favoriteSchema.extend({
    subject_label: z.string(),
    subject_type: z.string(),
    hero_image_url: z.string().url().nullable(),
    is_sellable: z.boolean(),
  })),
});

export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;
```

### 8. Address Schemas (`packages/schema/src/address.ts`)

**Brukes av:**
- ✅ Marketplace Storefront (users_public)
- ✅ Consumer App (users_public)

```typescript
import { z } from 'zod';

// User address
export const addressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  street_address: z.string().min(1),
  postal_code: z.string().regex(/^\d{4}$/, 'Må være 4 siffer'),
  city: z.string().min(1),
  country: z.string().length(2).default('NO'), // ISO 3166-1 alpha-2
  is_default: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Address = z.infer<typeof addressSchema>;

// POST /api/me/addresses
export const createAddressSchema = addressSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;

// GET /api/me/addresses response
export const addressesResponseSchema = z.object({
  addresses: z.array(addressSchema),
});

export type AddressesResponse = z.infer<typeof addressesResponseSchema>;
```

### 9. Main Export (`packages/schema/src/index.ts`)

```typescript
// Auth
export * from './auth';

// User
export * from './user';

// Catalog
export * from './catalog';

// Content
export * from './content';

// Cart
export * from './cart';

// Order
export * from './order';

// Favorite
export * from './favorite';

// Address
export * from './address';
```

### Hvordan bruke schemas i API-endepunkter

**Eksempel: POST /api/auth/register**

```typescript
import { registerSchema, type RegisterInput, type AuthResponse } from '@hk26/schema';
import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@hk26/postgres';
import { users } from '@hk26/postgres/schema';

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  // 1. Valider input med Zod
  const validationResult = registerSchema.safeParse(request.body);

  if (!validationResult.success) {
    return reply.status(400).send({
      error: 'Validation failed',
      details: validationResult.error.issues,
    });
  }

  const { email, password, full_name, birthdate } = validationResult.data;

  // 2. Hash passord
  const password_hash = await bcrypt.hash(password, 10);

  // 3. Opprett user
  const [newUser] = await db.insert(users).values({
    email,
    password_hash,
    full_name,
    birthdate,
  }).returning();

  // 4. Generer JWT
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // 5. Return AuthResponse (matching schema)
  const response: AuthResponse = {
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      created_at: newUser.created_at.toISOString(),
    },
  };

  return reply.status(201).send(response);
}
```

**Eksempel: GET /api/me/cart**

```typescript
import { cartResponseSchema, type CartResponse } from '@hk26/schema';
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@hk26/postgres';
import { carts, cartItems, products } from '@hk26/postgres/schema';
import { eq, and } from 'drizzle-orm';

export async function getCartHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.userId; // Fra auth middleware

  // 1. Get or create active cart
  let cart = await db.select().from(carts)
    .where(and(
      eq(carts.user_id, userId),
      eq(carts.status, 'active')
    ))
    .limit(1);

  if (!cart.length) {
    cart = await db.insert(carts).values({
      user_id: userId,
      status: 'active',
    }).returning();
  }

  // 2. Get cart items with product details
  const items = await db.select({
    cart_id: cartItems.cart_id,
    product_id: cartItems.product_id,
    quantity: cartItems.quantity,
    unit_price: cartItems.unit_price,
    currency: cartItems.currency,
    added_at: cartItems.added_at,
    product_title: products.title,
    product_image_url: products.image_url,
    product_brand: products.brand,
  })
  .from(cartItems)
  .innerJoin(products, eq(cartItems.product_id, products.id))
  .where(eq(cartItems.cart_id, cart[0].id));

  // 3. Calculate total
  const total = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  // 4. Build response matching CartResponse schema
  const response: CartResponse = {
    cart: {
      id: cart[0].id,
      user_id: cart[0].user_id,
      status: cart[0].status,
      created_at: cart[0].created_at.toISOString(),
      updated_at: cart[0].updated_at.toISOString(),
    },
    items: items.map(item => ({
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency: item.currency,
      added_at: item.added_at.toISOString(),
      product_title: item.product_title,
      product_image_url: item.product_image_url,
      product_brand: item.product_brand,
    })),
    total,
  };

  // 5. Optionally validate response (good for development)
  const validationResult = cartResponseSchema.safeParse(response);
  if (!validationResult.success) {
    console.error('Response validation failed:', validationResult.error);
    return reply.status(500).send({ error: 'Internal server error' });
  }

  return reply.send(response);
}
```

### Setup-instruksjoner for hvert team-repo

**Steg 1: Installer `@hk26/schema` som dependency**

I hvert team-repo (consumer-app, marketplace-storefront, syncstation, vendor-onboarding):

```json
// packages/api/package.json
{
  "name": "@hk26/api",
  "dependencies": {
    "@hk26/schema": "workspace:*",  // ⭐ Viktig!
    "fastify": "^5.2.0",
    "zod": "^3.24.1"
  }
}
```

**Steg 2: Bruk schemas i API handlers**

```typescript
// apps/api/src/routes/catalog.ts
import { productsResponseSchema, type ProductsResponse } from '@hk26/schema';
import { FastifyInstance } from 'fastify';
import { db } from '@hk26/postgres';
import { products } from '@hk26/postgres/schema';

export async function catalogRoutes(fastify: FastifyInstance) {
  fastify.get('/api/catalog/products', async (request, reply) => {
    const allProducts = await db.select().from(products);

    const response: ProductsResponse = {
      products: allProducts.map(p => ({
        ...p,
        created_at: p.created_at.toISOString(),
      })),
      pagination: {
        page: 1,
        limit: 20,
        total: allProducts.length,
        total_pages: Math.ceil(allProducts.length / 20),
      },
    };

    return reply.send(response);
  });
}
```

**Steg 3: Bruk schemas i frontend (React/React Native)**

```typescript
// apps/web/src/hooks/useCart.ts (Marketplace Storefront)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartResponseSchema, type CartResponse, type AddCartItemInput } from '@hk26/schema';

export function useCart() {
  const queryClient = useQueryClient();

  // GET /api/me/cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async (): Promise<CartResponse> => {
      const response = await fetch('/api/me/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      // Valider response
      return cartResponseSchema.parse(data);
    },
  });

  // POST /api/me/cart/items
  const addItem = useMutation({
    mutationFn: async (input: AddCartItemInput) => {
      const response = await fetch('/api/me/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return { cart, isLoading, addItem };
}
```

### Vedlikehold og synkronisering

**KRITISK: Når skal schemas oppdateres?**

1. **Nye felt til database** → Oppdater schema i `@hk26/schema` FØRST, deretter oppdater database migrations
2. **Nye API-endepunkter** → Lag schemas i `@hk26/schema` FØRST, deretter implementer endepunkt
3. **Endringer i eksisterende felt** → Diskuter med ALLE teams før endring

**Workflow for schema-endringer:**

```bash
# 1. Gjør endring i @hk26/schema
cd packages/schema
# edit src/product.ts

# 2. Rebuild schema package
pnpm build

# 3. Test i alle team-repos
cd ../../consumer-app
pnpm typecheck

cd ../marketplace-storefront
pnpm typecheck

# 4. Commit til git når alt validerer
git add packages/schema
git commit -m "schema: add external_url to Product"
```

**Sjekkliste for Mathias når du setter opp nytt team-repo:**

- [ ] Kopier `packages/schema/` fra base template
- [ ] Verifiser at `package.json` i `apps/api` har `"@hk26/schema": "workspace:*"`
- [ ] Kjør `pnpm install` for å linke workspace packages
- [ ] Test at imports fungerer: `import { userSchema } from '@hk26/schema';`
- [ ] Kjør `pnpm typecheck` for å verifisere type-safety
- [ ] Legg til `.env` variabler (DATABASE_URL, JWT_SECRET)
- [ ] Kjør migrations og seed-script
- [ ] Test at API-endepunkter returnerer riktig schema-format

---

## Setup-forskjeller

### Syncstation & Vendor Onboarding
```bash
# Tre databaser i .env
USER_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/user_db
WORKSTATION_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/workstation_db
APP_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db

# Admin URLs for migrations
USER_DATABASE_URL_ADMIN=postgresql://user_service:user_password@localhost:5432/user_db
WORKSTATION_DATABASE_URL_ADMIN=postgresql://workstation_service:workstation_password@localhost:5432/workstation_db
```

### Storefront & Consumer App
```bash
# Én database i .env
APP_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/users_public_db
```

---

## Neste steg for hvert team

### Syncstation
1. Kopier base repo
2. Fjern `apps/web/` (bruk kun mobile)
3. Behold alle tre databaser (USER, Workstation, Syncstation)
4. Implementer offline-first syncing
5. Fokuser på on-set logging funksjoner

### Marketplace Vendor Onboarding
1. Kopier base repo
2. Fjern `apps/mobile/` (bruk kun web)
3. Behold alle tre databaser (USER, Workstation, Vendor Onboarding)
4. Implementer vendor onboarding flow
5. **KRITISK:** Bruk eksakte product/vendor schemas

### Marketplace Storefront
1. Kopier base repo
2. Fjern `apps/mobile/` (bruk kun web)
3. Erstatt USER/Workstation med `users_public`
4. Implementer produktvisning og søk
5. **KRITISK:** Bruk eksakte product/vendor schemas

### Consumer App
1. Kopier base repo
2. Fjern `apps/web/` (bruk kun mobile)
3. Erstatt USER/Workstation med `users_public`
4. Implementer subject-basert navigering
5. Fokuser på content consumption

---

---

## Samarbeid mellom Consumer App og Marketplace Storefront 🤝

**Viktig å vite:**

Consumer App og Marketplace Storefront **deler** begge databasene (`users_public` OG `catalog_demo`). Dette betyr:

### Delte databaser og tabeller

**users_public (begge teams):**
1. ✅ `users` - Samme brukere, samme innlogging
2. ✅ `user_favorites` - Samme favoritter (hjertede subjects)
3. ✅ `user_addresses` - Samme leveringsadresser
4. ✅ `carts` & `cart_items` - Samme handlekurv (synces på tvers av plattformer!)
5. ✅ `orders` & `order_items` - Samme ordre-historikk

**catalog_demo:**
1. ✅ `content` - Samme episode catalog (**KUN Consumer App bruker**)
2. ✅ `content_subjects` - Samme timeline (**KUN Consumer App bruker**)
3. ✅ `subjects` - Samme subject catalog (begge teams)
4. ✅ `products` - Samme product catalog (begge teams)
5. ✅ `subject_products` - Samme kobling (begge teams)

**Hva betyr dette?**
- Brukere kan hjerte et subject i Consumer App → vises i favoritter på Marketplace Storefront
- Brukere kan legge produkt i kurv på mobil → fullføre kjøp på desktop
- Ordre plassert i Consumer App → vises i ordre-historikk i Marketplace Storefront

**Viktig forskjell:**
- **Consumer App:** Bruker `content` og `content_subjects` for å simulere "watching" episodes
- **Marketplace Storefront:** Bruker IKKE `content` eller `content_subjects` (desktop shopping, ingen "watching" funksjonalitet)

### Samarbeidsplan

**Fase 1 - Uavhengig utvikling (uke 1-3):**
- Begge teams starter med **samme MVP-tabeller**
- Hver team jobber i sitt eget repo med egne databaser
- Dere trenger **IKKE** koordinere kode i begynnelsen
- Fokuser på å få grunnfunksjonalitet til å virke

**Fase 2 - Schema-koordinering (uke 3-4):**
- Når begge teams har grunnleggende funksjonalitet, synkroniser databaseschemaer
- Sørg for at feltnavnene er **eksakt identiske** (kritisk!)
- Sørg for at enum values er **eksakt like** (`status` values, etc.)
- Test at data ser riktig ut i begge apper

**Fase 3 - Integrering (uke 4-5, valgfritt):**
- Hvis tid og interesse, koble sammen appene mot **samme databaser**
- Demonstrer cross-platform funksjonalitet:
  - Hjerte på mobil → vises på desktop
  - Legg i kurv på mobil → checkout på desktop
  - Ordre på desktop → vises i ordre-historikk på mobil
- Dette er **ikke påkrevd** for kurset, men veldig imponerende å vise frem!

### Kommunikasjon mellom teams

**KRITISK å koordinere:**

**1. Feltnavn i tabeller** - Må være eksakt like!
```sql
-- Begge teams MÅ bruke samme feltnavn
users.full_name (IKKE users.name eller users.fullName)
users.birthdate (IKKE users.age eller users.birth_date)
orders.status (IKKE orders.order_status)
```

**2. Enum values** - Må være eksakt like!
```sql
-- cart status
'active', 'checked_out', 'abandoned' (IKKE 'pending' eller 'completed')

-- order status
'created', 'paid', 'cancelled', 'refunded' (IKKE 'pending' eller 'completed')
```

**3. Datatyper** - Må være like!
```sql
-- Priser
NUMERIC(10,2) (IKKE DECIMAL eller FLOAT)

-- UUIDs
UUID (IKKE VARCHAR(36))

-- Currency
VARCHAR(3) DEFAULT 'NOK' (IKKE VARCHAR(10))
```

**Tips for å unngå avvik:**
1. **Opprett felles `@hk26/schema` pakke** med Zod schemas for delte entiteter
2. **Bruk identiske schema-definisjoner** i begge repos
3. **Test mot hverandres databaser** tidlig (uke 3) for å oppdage avvik
4. **Del SQL migration scripts** slik at begge teams bruker samme CREATE TABLE statements
5. **Møt hver 2. uke** for å synkronisere schema-endringer

### Eksempel: Felles Zod Schema

**I `packages/schema/src/user.ts`:**
```typescript
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  birthdate: z.string().date(), // YYYY-MM-DD
  is_verified: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
```

**I `packages/schema/src/cart.ts`:**
```typescript
export const cartItemSchema = z.object({
  cart_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  currency: z.string().length(3),
  added_at: z.string().datetime(),
});

export type CartItem = z.infer<typeof cartItemSchema>;
```

Begge teams **må** importere og bruke disse schemas!

### Demo: Cross-Platform Shopping Flow

**Scenario:**
1. Bruker (Ola) registrerer seg i Consumer App (mobil)
2. Ola ser "Walter White's Hat" i appen
3. Ola trykker hjerte → lagres i `user_favorites`
4. Ola ser produkter relatert til hatten
5. Ola legger "Pork Pie Hat" i handlekurv → lagres i `carts` og `cart_items`
6. Ola går hjem og åpner Marketplace Storefront (desktop)
7. Ola logger inn med samme bruker
8. Ola ser:
   - ✅ "Walter White's Hat" i favoritter
   - ✅ "Pork Pie Hat" i handlekurv
9. Ola fullfører checkout på desktop → ordre lagres i `orders` og `order_items`
10. Ola åpner Consumer App igjen
11. Ola ser ordre i ordre-historikk

**Dette er målet for fase 3 integrering!**

---

---

## Oppsummering: Hvordan MVP-reglene og API-strukturen fungerer sammen

### API-organisering

**Tre klare kategorier:**

1. **`/api/catalog/*`** - Offentlig katalog (ingen auth)
   - Produkter, subjects, søk
   - Begge teams leser herfra
   - Data fra `catalog_demo` database

2. **`/api/me/*`** - Brukerdata (krever auth)
   - Cart, favoritter, ordre, adresser
   - Begge teams skriver hit
   - Data fra `users_public` database

3. **`/api/content/*`** - Consumer App spesifikt (ingen auth for browse)
   - Episodes, timeline, "hva er på skjermen"
   - Kun Consumer App bruker
   - Data fra `catalog_demo.content` og `catalog_demo.content_subjects`

### Kritiske MVP-regler igjen

1. ⭐ **Auto-create cart**: `GET /api/me/cart` oppretter alltid hvis ikke finnes
2. ⭐ **Pris snapshot**: Backend setter `unit_price` fra `products.base_price` ved add to cart
3. ⭐ **Favoritter er subjects**: Ikke bland product og subject favorites
4. ⭐ **Identiske Zod schemas**: Bruk `@hk26/schema`, aldri lag egne varianter
5. ⭐ **Samme JWT**: Begge apper må bruke identisk token-struktur
6. ⭐ **Én aktiv cart**: Brukere har én aktiv cart som synces mellom apper

### Cross-platform demo-flow

**Denne flyten demonstrerer at reglene fungerer:**

1. **Consumer App (mobil):**
   - Bruker registrerer seg via `POST /api/auth/register`
   - Logger inn via `POST /api/auth/login` → får JWT token
   - Starter "watching" episode via `GET /api/content/breaking-bad-s01e01/at/360`
   - Ser "Walter White's Hat" på skjermen
   - Trykker hjerte → `POST /api/me/favorites` (body: `{ subject_id }`)
   - Trykker "Buy now" → `POST /api/me/cart/items` (body: `{ product_id, quantity: 1 }`)
   - Backend henter `unit_price` fra `catalog_demo.products.base_price` og lagrer snapshot

2. **Marketplace Storefront (desktop):**
   - Bruker logger inn med samme credentials → får JWT token
   - Henter handlekurv via `GET /api/me/cart` → ser "Pork Pie Hat" fra mobil! ⭐
   - Henter favoritter via `GET /api/me/favorites` → ser "Walter White's Hat" ⭐
   - Browser produkter via `GET /api/catalog/products`
   - Fullfører checkout via `POST /api/me/checkout` (body: `{ address_id }`)

3. **Tilbake til Consumer App (mobil):**
   - Henter ordre-historikk via `GET /api/me/orders`
   - Ser ordren fra desktop checkout! ⭐

**Dette er mulig fordi:**
- Samme databaser (`users_public` og `catalog_demo`)
- Samme JWT tokens
- Identiske API-kontrakter
- Auto-create cart (ingen "cart not found" errors)
- Pris snapshot (prisen endret seg ikke mellom mobil og desktop)

### Studentenes ansvar

**Consumer App team:**
- Implementer `GET /api/content/*` endpoints (timeline-basert shopping)
- Bruk `GET /api/catalog/*` for å hente subjects og produkter
- Bruk `POST /api/me/favorites` og `POST /api/me/cart/items`
- Test at JWT tokens fungerer
- Seed `content` og `content_subjects` med demo-data

**Marketplace Storefront team:**
- Implementer `GET /api/catalog/*` endpoints (browse-basert shopping)
- Bruk `GET /api/me/cart`, `GET /api/me/favorites`, `GET /api/me/orders`
- Test at JWT tokens fungerer
- Seed `subjects` og `products` med demo-data

**Begge teams MÅ:**
- Bruke **nøyaktig** samme Zod schemas fra `@hk26/schema`
- Bruke **nøyaktig** samme feltnavn i requests/responses
- Bruke **nøyaktig** samme JWT-struktur
- Implementere **auto-create cart** på backend
- Implementere **pris snapshot** på backend
- Teste mot hverandres databaser i uke 3-4

**Hvis reglene følges:**
✅ Cross-platform shopping vil fungere perfekt
✅ Minimal debugging
✅ Imponerende demo
✅ Lærer dere real-world API-design

**Hvis reglene brytes:**
❌ "Cart not found" errors
❌ Favoritter vises ikke
❌ Priser endrer seg uventet
❌ Ordre vises ikke i andre app
❌ Dager med debugging

---

## Spørsmål?

Kontakt Mathias Haslien ([mathias@hoolsy.com](mailto:mathias@hoolsy.com)) hvis noe er uklart.

**Sist oppdatert:** 2026-01-17
