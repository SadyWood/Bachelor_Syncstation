# Seed Data for Consumer App

This folder contains demo data that is automatically imported into the `catalog_demo` database when you run the seed script.

## Quick Start

```bash
# 1. Reset and re-seed the database (recommended for clean state)
pnpm db:reset
pnpm db:migrate
pnpm db:seed

# Or just re-seed (without reset - may cause duplicate key errors)
pnpm db:seed
```

---

## How to Add a New Show/Movie

The seed script automatically discovers all folders in this directory and imports their data. To add new demo data:

### Step 1: Create a New Folder

Create a folder with your show/movie name (lowercase, use hyphens):

```bash
mkdir packages/databases/postgres/src/seed-data/your-show-name
```

### Step 2: Create the Required JSON Files

Each folder needs **4 JSON files**:

| File | Purpose | Required |
|------|---------|----------|
| `content.json` | Episode/movie metadata | Yes |
| `subjects.json` | Characters, actors, props, apparel, locations | Yes |
| `products.json` | Shoppable products linked to subjects | Optional |
| `timeline.json` | When subjects appear on screen (timestamps) | Optional |

### Step 3: Run the Seed Script

```bash
pnpm db:seed
```

The script will automatically discover your new folder and import the data.

---

## JSON File Formats

### content.json

Contains metadata for a single episode or movie clip.

```json
{
  "media_title": "Stranger Things",
  "season": 1,
  "episode": 2,
  "episode_title": "The Weirdo on Maple Street",
  "duration_seconds": 2040,
  "thumbnail_url": "https://static.wikia.nocookie.net/strangerthings8338/images/8/8f/ST1_Ep2_Poster.jpg",
  "description": "Eleven escapes the lab and sneaks into a grocery store. She uses her powers to shatter the doors when confronted by the store manager."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `media_title` | string | Yes | Show or movie name |
| `season` | number | Yes | Season number (use 1 for movies) |
| `episode` | number | Yes | Episode number (use 1 for movies) |
| `episode_title` | string | Yes | Episode or movie title |
| `duration_seconds` | number | Yes | Total duration in seconds |
| `thumbnail_url` | string | No | URL to thumbnail image |
| `description` | string | No | Brief description of the content |

### subjects.json

An array of all identifiable subjects in the scene (characters, actors, props, clothing, locations, etc).

```json
[
  {
    "label": "Eleven",
    "type": "character",
    "is_sellable": false,
    "hero_image_url": "https://static.wikia.nocookie.net/strangerthings8338/images/e/e2/Eleven_-_Sorcerer.png",
    "external_url": "https://strangerthings.fandom.com/wiki/Eleven",
    "description": "Young girl with a buzz cut hairstyle and telekinetic powers. She has dirt smudges on her face and legs and displays a determined, silent demeanor.",
    "metadata": {
      "gender": "Female",
      "hair_style": "Buzz cut",
      "hair_color": "Brown",
      "demeanor": "Determined, Silent"
    }
  },
  {
    "label": "Blue Bomber Jacket",
    "type": "apparel",
    "is_sellable": true,
    "hero_image_url": "https://www.famousjackets.com/stranger-things-eleven-blue-jacket/",
    "description": "Blue zip-up jacket worn by Eleven. Slightly oversized bomber/windbreaker style.",
    "metadata": {
      "color": "Blue",
      "style": "Bomber/Windbreaker",
      "material": "Synthetic"
    }
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | Yes | Unique identifier for this subject |
| `type` | string | Yes | One of: `person`, `character`, `product_prop`, `apparel`, `location`, `vehicle`, `other` |
| `is_sellable` | boolean | Yes | Whether products can be linked to this subject |
| `hero_image_url` | string | No | Primary image URL |
| `external_url` | string | No | Link to wiki or external resource |
| `description` | string | No | Description of the subject |
| `metadata` | object | No | Additional key-value pairs |

**Subject Types Explained:**

| Type | Description | Typically Sellable? |
|------|-------------|---------------------|
| `person` | Real person (actor, celebrity) | No |
| `character` | Fictional character | No |
| `product_prop` | Product used as a prop (food, gadgets) | Yes |
| `apparel` | Clothing and accessories | Yes |
| `location` | Place or setting | No |
| `vehicle` | Cars, bikes, etc. | Sometimes |
| `other` | Anything else | No |

### products.json

Links shoppable products to subjects. One subject can have multiple products (different vendors/variants).

```json
[
  {
    "subject_label": "Blue Bomber Jacket",
    "products": [
      {
        "title": "Stranger Things Eleven Blue Jacket - Official Replica",
        "brand": "Famous Jackets",
        "base_price": 899.00,
        "currency": "NOK",
        "product_url": "https://www.famousjackets.com/stranger-things-eleven-blue-jacket/",
        "image_url": "https://www.famousjackets.com/stranger-things-eleven-blue-jacket/",
        "description": "Official replica of Eleven's iconic blue bomber jacket from Stranger Things Season 1",
        "metadata": {
          "sizes": ["XS", "S", "M", "L", "XL"],
          "material": "Polyester",
          "color": "Blue",
          "style": "Bomber"
        }
      }
    ]
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject_label` | string | Yes | Must match a `label` in subjects.json |
| `products` | array | Yes | Array of product objects |
| `products[].title` | string | Yes | Product name |
| `products[].brand` | string | No | Brand name |
| `products[].base_price` | number | Yes | Price (numeric) |
| `products[].currency` | string | Yes | Currency code (NOK, USD, EUR, etc.) |
| `products[].product_url` | string | No | Link to buy the product |
| `products[].image_url` | string | No | Product image URL |
| `products[].description` | string | No | Product description |
| `products[].metadata` | object | No | Additional product data (SKU, sizes, etc.) |

### timeline.json

Defines when each subject is visible on screen. Uses `MM:SS` or `MM:SS.ms` timestamp format.

```json
[
  {
    "subject_label": "Eleven",
    "segments": [
      { "start": "00:00", "end": "00:02" },
      { "start": "00:04", "end": "00:09" },
      { "start": "00:12", "end": "00:14" },
      { "start": "00:16", "end": "00:18" },
      { "start": "00:19", "end": "00:24" },
      { "start": "00:27", "end": "00:34" }
    ],
    "metadata": {
      "prominence": "main",
      "character_arc": "Protagonist throughout entire scene"
    }
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject_label` | string | Yes | Must match a `label` in subjects.json |
| `segments` | array | Yes | Array of time segments |
| `segments[].start` | string | Yes | Start time in `MM:SS` or `MM:SS.ms` format |
| `segments[].end` | string | Yes | End time in `MM:SS` or `MM:SS.ms` format |
| `metadata` | object | No | Additional data (prominence, visibility, etc.) |

**Timestamp Examples:**
- `"00:05"` = 5 seconds
- `"01:30"` = 90 seconds (1 min 30 sec)
- `"00:19.5"` = 19.5 seconds (rounds to 20)
- `"12:45"` = 765 seconds (12 min 45 sec)

---

## Current Demo Data Inventory

### Stranger Things - Season 1, Episode 2

**Content:** "The Weirdo on Maple Street" (34 seconds, Eggo grocery store scene)

**Source Video:** https://www.youtube.com/watch?v=p0jDRJ6-xuE

**13 Subjects:**

| Label | Type | Sellable | Description |
|-------|------|----------|-------------|
| Eleven | character | No | Young girl with telekinetic powers, buzz cut |
| Millie Bobby Brown | person | No | British actress playing Eleven |
| Robert (Store Manager) | character | No | Store manager who confronts Eleven |
| Store Employee | character | No | Female employee in the scene |
| Eggo Waffles (prop) | product_prop | Yes | Eleven's iconic frozen waffles |
| Blue Bomber Jacket | apparel | Yes | Blue zip-up jacket worn by Eleven |
| Pink Smocked Dress | apparel | Yes | Pink dress worn under the jacket |
| Striped Tube Socks | apparel | Yes | White socks with green/yellow stripes |
| Black Digital Watch | apparel | Yes | Casio CA-53W-1 calculator watch |
| Bradley's Big Buy Supermarket | location | No | 1980s grocery store setting |
| Refrigerated Display Case | other | No | Glass-door freezers containing Eggos |
| Mini Christmas Tree | product_prop | Yes | Small decorative tree in background |
| Automatic Sliding Doors | other | No | Doors shattered by Eleven's powers |

**6 Products:**

| Product | Brand | Price | Linked To |
|---------|-------|-------|-----------|
| Eggo Homestyle Waffles - 8 count | Eggo | 49.99 NOK | Eggo Waffles (prop) |
| Stranger Things Eleven Blue Jacket | Famous Jackets | 899.00 NOK | Blue Bomber Jacket |
| Stranger Things: Classic Eleven Costume | Disguise | 449.00 NOK | Pink Smocked Dress |
| Eleven Themed Striped Tube Socks | Generic | 79.00 NOK | Striped Tube Socks |
| Casio CA-53W-1 Calculator Watch | Casio | 299.00 NOK | Black Digital Watch |
| Mini Christmas Tree in Hessian Bag | Xmas Direct | 199.00 NOK | Mini Christmas Tree |

**Timeline:** 53 total timeline entries across 13 subjects (see `stranger-things/timeline.json` for exact timestamps)

---

## Creating Data from Video Using AI

### Step 1: Analyze Video with AI

**Highly Recommended:** Use [Google AI Studio](https://aistudio.google.com/) with **Gemini 3 Pro** for best results. Gemini 3 Pro excels at detailed video analysis and temporal tracking of objects.

You can either:
- **Upload a video clip** directly to Google AI Studio (MP4, MOV, etc.)
- **Paste a YouTube video link** - Gemini can analyze YouTube videos directly

Then use this comprehensive prompt:

<details>
<summary>Click to expand full prompt (recommended)</summary>

```
Role: You are an advanced Media Analysis & Data Extraction Agent. Your goal is to identify every tangible entity in the provided media and structure the data for a Polyglot Database System.

Objective:
Analyze the video/image frame-by-frame. Identify as many Tangible Subjects as possible, down to the smallest background detail.

Granularity Requirement: Do not focus only on the main actors. You must scan the background, corners, and out-of-focus areas. If a physical object is visible (e.g., a small potted plant on a shelf, a mirror on the wall, a book, a lamp), it MUST be logged as a subject.

High Priority: Products, Background Decor, Small Props, People, Specific Places, Animals.
Low Priority: Plot summaries or abstract emotions.

Data Structure (The "Three-Pillar" Logic)
You must organize every finding so it fits into three distinct data paradigms:

1. Semantic Graph (Relationships)
Core Task: Connect subjects together using specific, directional verbs. Nothing exists in isolation. You must STRICTLY use the following relationship types:

PEOPLE & CHARACTERS
PORTRAYS (Actor → Character)
VOICED_BY (Character → Actor - Original voice)
DUBBED_BY (Character → Actor - Localized voice)
MO_CAPPED_BY (Character → Actor - Motion Capture)
PARTNER_OF (Character → Character)

CREATION & ACTIVITY
PREPARES (Character → Food/Drink - Cooking, mixing)
CONSTRUCTS (Character → Object - Building, making)

APPAREL & BEAUTY
WORE (Character → Apparel)
WEARS_MAKEUP (Character → CosmeticProduct)
STYLED_WITH (Character → HairProduct)
APPLIES (Character → Product - Action of applying)

OBJECTS & TECH
HOLDS (Character → Object - Passive holding)
USES (Character → Electronics/Tool - Active use)
PLAYS (Character → Instrument/Game)
GIFTED_TO (Object → Character)

FURNITURE & VEHICLES
SITS_ON (Character → Furniture)
DRIVES (Character → Vehicle - Driver)
RIDES (Character → Vehicle - Passenger/Bike/Horse)

CONSUMABLES
CONSUMES (Character → Food/Drink)

LOCATION & GEOGRAPHY
LOCATED_AT (Subject → Place - Physical presence)
PART_OF_CITY (Place → City)
PART_OF_COUNTRY (City → Country)
FILMED_AT (Scene → Location - Real world location)
DEPICTS_LOCATION (Scene → Location - Fictional location)

SCENE & AUDIO
APPEARS_IN (Subject → Scene)
FEATURES_SONG (Scene → Song)
PERFORMED_BY (Song → Artist)

2. Temporal Index (EXTREME PRECISION REQUIRED)
Core Task: Log exact timestamps for every single visual appearance.

CRITICAL RULE: Do NOT merge time segments. If a subject leaves the frame (even for 1 second, or due to a camera angle change), you must END the current segment. When the subject returns, create a NEW segment.

Example: If a character is visible 00:10-00:20, leaves the frame, and returns 00:25-00:30, this MUST be recorded as two separate entries. Do NOT record it as 00:10-00:30.

Format: MM:SS:mmm (Start) to MM:SS:mmm (End).

3. Rich Metadata (Details)
Core Task: Detailed attributes and encyclopedic info.

Example: If you see a dog, don't just say "Dog". Describe the breed (e.g., "Border Collie"), color, and if it's a specific famous animal, name it.
Example: If you see a Chair, describe the material (Wood), style (Victorian), and condition.

Analysis Scope - "Look for Everything"
People: Who is the actor? Who is the character?
Apparel: Hats, glasses, jackets, shoes, watches, jewelry.
Background & Decor: Mirrors, potted plants, paintings, rugs, lamps, kitchenware, books, electronic devices in background.
Props/Objects: Weapons, phones, cups, furniture, vehicles, tools.
Environment: Trees, specific flowers, architectural styles, street signs, landmarks.
Animals: Species, breeds.

Output Format
Return valid JSON only. Use the following schema:

{
  "job_info": {
    "media_title": "[Insert Title]",
    "analysis_type": "Deep Entity Extraction"
  },
  "findings": [
    {
      "label": "Name of Subject (e.g. Daniel Craig, Omega Watch, Potted Fern, or Wall Mirror)",
      "type": "[Actor | Character | Object | Place | Location | Animal | Plant]",
      "confidence": 0.0-1.0,
      "rich_details_metadata": {
        "description": "Comprehensive visual description.",
        "attributes": {
            "brand": "Brand name if visible",
            "material": "e.g. Leather, Metal, Ceramic",
            "color": "e.g. Black, Silver, Green",
            "condition": "e.g. New, Damaged, Dusty"
        },
        "taxonomic_category": "e.g. Home & Garden > Decor > Mirrors"
      },
      "relationships_graph": [
        {
          "relationship": "[Select specific type from Semantic Graph list, e.g. WORE, USES, PREPARES, LOCATED_AT]",
          "target_label": "Name of the related subject"
        }
      ],
      "temporal_segments": [
        {
          "start": "MM:SS:mmm",
          "end": "MM:SS:mmm"
        }
      ]
    }
  ]
}

Task:
Analyze the content now. Be exhaustive. Extract as many objects and people as possible, down to the smallest background detail, and define their relationships strictly according to the provided list. Pay extreme attention to the temporal entry/exit of subjects.
```

</details>

**Alternative (Simpler Prompt):**

If the detailed prompt is too complex, use this simpler version:

```
Analyze this video clip and provide:
1. All visible people/characters
2. All identifiable products and props
3. Clothing and accessories worn by characters
4. Locations and settings
5. For each element: exact visibility timestamps (start/end)

Format as JSON with fields: label, type, description, timestamps
```

### Step 2: Convert AI Output to Seed Format

Take the AI response and organize it into the 4 JSON files (`content.json`, `subjects.json`, `products.json`, `timeline.json`).

See the [`stranger-things/`](stranger-things/) folder for a complete working example of how to structure your seed data.

### Step 3: Find Product Links

For subjects marked `is_sellable: true`, find actual products to link:
- Amazon, eBay, Etsy for replicas and fan merchandise
- Official merchandise stores
- Google Shopping for generic products
- Use real prices and currencies

### Step 4: Verify and Test

```bash
# Reset to avoid duplicate key errors
pnpm db:reset
pnpm db:migrate
pnpm db:seed

# Check the API
curl http://localhost:3333/api/content
```

---

## Folder Structure

```
seed-data/
├── README.md                    # This file
├── _raw-ai-output/              # Raw AI analysis outputs (for reference)
│   ├── eggos_scene.json
│   └── eggos_subjects.json
├── stranger-things/             # Stranger Things S01E02 demo data
│   ├── content.json             # Episode metadata
│   ├── subjects.json            # 13 subjects
│   ├── products.json            # 6 shoppable products
│   └── timeline.json            # 53 timeline entries
└── [your-show]/                 # Add more shows here!
    ├── content.json
    ├── subjects.json
    ├── products.json
    └── timeline.json
```

---

## Troubleshooting

### "duplicate key value violates unique constraint"

The database already contains data. Run a full reset:

```bash
pnpm db:reset
pnpm db:migrate
pnpm db:seed
```

### "Subject X not found for products" or "Subject X not found for timeline"

The `subject_label` in products.json or timeline.json doesn't match any `label` in subjects.json. Check for:
- Exact spelling (case-sensitive)
- Missing spaces or typos
- Extra characters

### No data appears in the API

1. Check that `pnpm db:seed` completed without errors
2. Verify you have at least one folder with valid `content.json` and `subjects.json`
3. Check the database connection string in `.env`

### Timestamps causing errors

The database stores times as integers (seconds). If you get errors about invalid integers:
- Don't use timestamps longer than `MM:SS.ms` format
- Decimal values are rounded to the nearest integer
- Start time must be less than end time

---

## Tips for Good Demo Data

1. **Start small** - Create a short 30-60 second clip with 5-10 subjects
2. **Focus on sellable items** - Include at least 3-4 subjects with `is_sellable: true`
3. **Add real products** - Link to actual purchasable items when possible
4. **Be precise with timestamps** - Timeline accuracy improves the demo experience
5. **Use descriptive labels** - Clear labels help match subjects across files
6. **Include variety** - Mix characters, props, apparel, and locations
