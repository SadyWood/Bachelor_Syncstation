---
name: hoolsy-context
description: Understand Hoolsy's platform ecosystem, business model, and architecture. Use when students or developers need context about Hoolsy's content-to-commerce vision, platform relationships, or technical architecture.
---

# Hoolsy Platform Context

This skill helps you guide students and developers to the right Hoolsy documentation.

## When to use this skill

Use this skill when:
- Students ask "What is Hoolsy?"
- Explaining how platforms relate to each other
- Understanding the business model and revenue streams
- Clarifying technical architecture decisions
- Providing context for student projects

## What is Hoolsy?

Hoolsy creates a **structured "subject layer"** for media content—identifying people, products, and locations with precise timestamps—and connects it to discovery and commerce.

**Core innovation:** Real-time ultrasound synchronization enables "shop what you see" without manual searching.

## Documentation Location

All Hoolsy documentation is in [documents/hoolsy-platforms/](../../documents/hoolsy-platforms/).

**Available documentation files:**
- [README.md](../../documents/hoolsy-platforms/README.md) - Overview, business model, platform relationships
- [workstation.md](../../documents/hoolsy-platforms/workstation.md) - Content preparation platform
- [syncstation.md](../../documents/hoolsy-platforms/syncstation.md) - On-set companion app
- [marketplace-vendors.md](../../documents/hoolsy-platforms/marketplace-vendors.md) - Vendor operations
- [marketplace-storefront.md](../../documents/hoolsy-platforms/marketplace-storefront.md) - Consumer shopping
- [consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md) - Mobile companion app
- [nexus.md](../../documents/hoolsy-platforms/nexus.md) - Internal monitoring
- [marketplace.md](../../documents/hoolsy-platforms/marketplace.md) - Commerce overview

**DO NOT answer questions yourself. Instead, read the relevant documentation and provide answers based on that.**

## Documentation Guide

### For Overview & Business Context
**Read:** [documents/hoolsy-platforms/README.md](../../documents/hoolsy-platforms/README.md)

**Use this when students ask:**
- "What is Hoolsy?"
- "What problem does it solve?"
- "How do platforms work together?"
- "What's the business model?"
- "Why multiple platforms?"
- "How does revenue work?"

**Key sections in README.md:**
- The Big Picture
- Why Now? The Media Industry's Revenue Crisis
- Platform Overview
- Data Flow: Content to Commerce
- Business Model & Revenue Streams
- Network Effects & Strategic Advantages

### For Platform-Specific Questions

**Workstation** → [workstation.md](../../documents/hoolsy-platforms/workstation.md)
- Content preparation and editorial platform
- Hierarchical content organization
- Subject verification workflows
- Multi-tenant RBAC

**Syncstation** → [syncstation.md](../../documents/hoolsy-platforms/syncstation.md)
- On-set companion app
- Offline-first logging
- File attachments and media capture
- Sync strategies

**Marketplace for Vendors** → [marketplace-vendors.md](../../documents/hoolsy-platforms/marketplace-vendors.md)
- Vendor operations platform
- Product catalog management
- Subject-product linking
- Vendor analytics

**Marketplace Storefront** → [marketplace-storefront.md](../../documents/hoolsy-platforms/marketplace-storefront.md)
- Consumer shopping experience (desktop)
- Content-driven discovery
- Visual storytelling
- Collections and themed boards

**Consumer App** → [consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md)
- Mobile companion app
- Ultrasound synchronization
- Real-time subject discovery
- Shoppable scenes

**Nexus** → [nexus.md](../../documents/hoolsy-platforms/nexus.md)
- Internal monitoring and analytics
- Platform health tracking
- Cross-platform administration

**Marketplace Overview** → [marketplace.md](../../documents/hoolsy-platforms/marketplace.md)
- Commerce ecosystem overview
- How vendor and consumer platforms connect

## How to Use This Skill

### Step 1: Identify what the student needs

**Business/concept questions?**
→ Read `README.md` first

**Specific platform questions?**
→ Read the relevant platform's .md file

**Architecture/technical questions?**
→ Check README.md "Shared Infrastructure" section first, then platform docs

### Step 2: Read the documentation

**Always read the documentation before answering.** Use the Read tool to fetch the relevant .md file.

**Example workflow:**
1. Student asks: "How does ultrasound sync work?"
2. Read [consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md)
3. Find the "Ultrasound Detection & Synchronization" section
4. Provide answer based on that content

### Step 3: Provide context-aware answers

**Connect to their project:**
- Building Consumer App? → Explain how it uses Workstation (subjects) + Marketplace (products)
- Building Syncstation? → Explain how logs feed into Workstation
- Building Marketplace? → Explain subject linking from Workstation

**Use analogies from the docs:**
- "Subject Registry is like Wikipedia for on-screen things"
- "Ultrasound is like a QR code, but audible only to phones"

### Step 4: Point to documentation for deep dives

After answering, always reference where they can read more:

```
For more details, see documents/hoolsy-platforms/consumer-app.md,
specifically the "Ultrasound Detection & Synchronization" section.
```

## Common Question Patterns

### "What is Hoolsy?"
→ Read: [README.md](../../documents/hoolsy-platforms/README.md) → "The Big Picture" section
→ Summarize: Problem, solution, core innovation

### "How do platforms connect?"
→ Read: [README.md](../../documents/hoolsy-platforms/README.md) → "Data Flow: Content to Commerce" section
→ Show: The 7-step flow diagram

### "Why so many platforms?"
→ Read: [README.md](../../documents/hoolsy-platforms/README.md) → "Strategic Advantages: Why Multi-Platform Beats a Single App"
→ Explain: Different users, different needs

### "How does [specific platform] work?"
→ Read: [platform-name.md](../../documents/hoolsy-platforms/) (choose the relevant file)
→ Summarize: Key capabilities, user roles, technical architecture

### "What's the business model?"
→ Read: [README.md](../../documents/hoolsy-platforms/README.md) → "Business Model & Revenue Streams"
→ Explain: 5 revenue streams + network effects

### "How does ultrasound sync work?"
→ Read: [consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md) → Search for "ultrasound"
→ Explain: SDK embeds codes → App detects → Syncs content

### "What's the Subject Registry?"
→ Read: [README.md](../../documents/hoolsy-platforms/README.md) → "Core Concepts" → "Subject Registry"
→ Explain: Global identity layer for people/products/locations

### "Which platforms does [student project] use?"
→ Read: [README.md](../../documents/hoolsy-platforms/README.md) → "Platform Overview" table
→ Map: Their project → Data sources → Dependencies

## Student Project Mapping

When helping with student projects, know their context:

**Consumer App (React Native + Expo)**
- Data from: Workstation (subjects), Marketplace (products)
- Key feature: Ultrasound sync
- Read: [consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md)

**Syncstation (React Native + Expo)**
- Data from: Workstation (content nodes)
- Data to: Workstation (log entries)
- Key feature: Offline-first logging
- Read: [syncstation.md](../../documents/hoolsy-platforms/syncstation.md)

**Marketplace Storefront (React + Vite)**
- Data from: Marketplace (products), Workstation (subjects)
- Key feature: Content-driven discovery
- Read: [marketplace-storefront.md](../../documents/hoolsy-platforms/marketplace-storefront.md)

**Marketplace Vendor Onboarding (React + Vite)**
- Data from: Marketplace (vendor data), Workstation (subjects)
- Key feature: Product-subject linking
- Read: [marketplace-vendors.md](../../documents/hoolsy-platforms/marketplace-vendors.md)

## Key Reminders

1. **Always read docs before answering** - Don't guess or make up information
2. **Reference the source** - Tell students where to read more
3. **Be pedagogical** - Explain the "why" behind decisions
4. **Connect to their project** - Make context relevant to what they're building
5. **Keep it simple** - Start high-level, dive deeper if they ask

## Documentation Structure

All platform docs follow this pattern:
1. Platform Overview
2. System Architecture
3. Core Features
4. User Roles & Permissions
5. API Surface
6. Platform in the Hoolsy Ecosystem

Use this structure to navigate docs efficiently.

## Example Interaction

**Student:** "What is Hoolsy?"

**You:**
1. Read [documents/hoolsy-platforms/README.md](../../documents/hoolsy-platforms/README.md) (The Big Picture section)
2. Summarize based on what you read
3. Say: "For a complete overview, see [documents/hoolsy-platforms/README.md](../../documents/hoolsy-platforms/README.md). The document covers the problem Hoolsy solves, the business model, and how all platforms work together."

**Student:** "How does Consumer App sync with TV?"

**You:**
1. Read [documents/hoolsy-platforms/consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md) (Ultrasound section)
2. Explain based on documentation
3. Say: "See [documents/hoolsy-platforms/consumer-app.md](../../documents/hoolsy-platforms/consumer-app.md) for technical details on ultrasound detection, including code examples and architecture diagrams."
