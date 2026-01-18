# Nexus Platform
## Complete platform guide for the Hoolsy ecosystem

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

Nexus is Hoolsy's internal oversight, monitoring, and administration platform. It serves as the "control room" where Hoolsy's internal teams monitor platform health, track user behavior, oversee vendor activity, analyze business metrics, and manage cross-platform administration.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [System Architecture](#system-architecture)
3. [Platform Monitoring & Health](#platform-monitoring--health)
4. [User Behavior Analytics](#user-behavior-analytics)
5. [Vendor Performance Tracking](#vendor-performance-tracking)
6. [Content Performance Analytics](#content-performance-analytics)
7. [Financial Reporting & Revenue Streams](#financial-reporting--revenue-streams)
8. [Security & Compliance Monitoring](#security--compliance-monitoring)
9. [Cross-Platform Administration](#cross-platform-administration)
10. [Alerting & Incident Management](#alerting--incident-management)
11. [Reporting & Dashboards](#reporting--dashboards)
12. [API Surface](#api-surface)
13. [Nexus in the Hoolsy Ecosystem](#nexus-in-the-hoolsy-ecosystem)

---

## Platform Overview

### What Hoolsy is building
Hoolsy is building an ecosystem that connects media content with commerce. As the platform scales, it becomes critical to have visibility into system health, user behavior, vendor performance, and business metrics. Nexus provides this visibility.

### What Nexus is
Nexus is the **internal oversight and administration platform** used exclusively by Hoolsy's internal teams to monitor, analyze, and manage the entire ecosystem.

**Core capabilities:**
- **Platform monitoring**: Track uptime, API health, database performance, sync performance (Consumer App ultrasound synchronization)
- **User analytics**: Understand user behavior, engagement, retention, churn
- **Vendor analytics**: Monitor vendor activity, product performance, sales metrics
- **Content analytics**: Track content popularity, sync sessions, subject discovery rates
- **Financial reporting**: Revenue streams, commissions, payouts, transaction volume
- **Security monitoring**: Detect anomalies, suspicious activity, compliance violations
- **Cross-platform admin**: Manage users, vendors, content, and products across all platforms
- **Alerting**: Real-time notifications for critical issues (downtime, errors, security threats)

### What Nexus is NOT
- **Not a consumer-facing app** (Consumer App is the public interface)
- **Not a vendor tool** (Marketplace is for vendors)
- **Not a content production tool** (Workstation is for content teams)

Nexus is strictly an **internal operations and oversight platform** for Hoolsy employees.

### Who uses Nexus
- **System administrators**: Monitor platform health, manage infrastructure
- **Data analysts**: Analyze user behavior, content performance, business metrics
- **Finance teams**: Track revenue, commissions, payouts, financial reporting
- **Security teams**: Monitor for threats, investigate incidents, ensure compliance
- **Executive stakeholders**: View high-level KPIs, business performance, strategic metrics
- **Customer support**: Investigate user issues, manage support tickets
- **Operations managers**: Oversee vendor activity, approve listings, manage policies

---

## System Architecture

### Data Aggregation Architecture
Nexus is a **data aggregation and analytics platform** that pulls data from all other platforms:

**1. Users Database** (read-only)
- User registrations, logins, demographics
- User activity (sync history from Consumer App, search queries, cart activity)

**2. Workstation Database** (read-only)
- Content metadata, subject metadata
- Content upload activity, subject verification activity
- Task completion metrics, team productivity

**3. Marketplace Database** (read-only)
- Vendor accounts, product listings
- Orders, transactions, refunds
- Vendor performance metrics

**4. Logs & Telemetry** (streamed in real-time)
- Application logs (errors, warnings, info)
- API request logs (latency, status codes, endpoints)
- System metrics (CPU, memory, disk usage)
- Sync quality metrics (ultrasound detection rate, timestamp accuracy, latency)

**5. External Services** (API integrations)
- Payment gateways (Stripe, PayPal) for transaction data
- Email services (SendGrid, Mailgun) for email delivery stats
- CDN providers (Cloudflare, Fastly) for edge performance
- Third-party analytics (Google Analytics, Mixpanel) for web/app metrics

### Data Pipeline
Nexus uses a **data pipeline architecture** to ingest, process, and store metrics:

**Ingestion:**
- Real-time event streaming (Kafka, RabbitMQ, AWS Kinesis)
- Periodic batch imports (nightly sync of database metrics)
- API polling (external services)

**Processing:**
- Stream processing (aggregate metrics, detect anomalies)
- ETL (Extract, Transform, Load) for batch data
- Data cleaning and normalization

**Storage:**
- **Time-series database** (InfluxDB, TimescaleDB): System metrics, API latency, sync quality
- **Data warehouse** (Snowflake, BigQuery, Redshift): Historical data, long-term analytics
- **Relational database** (PostgreSQL): Nexus-specific data (alerts, reports, admin actions)
- **Search index** (Elasticsearch): Log search, full-text queries

**Visualization:**
- Dashboards (Grafana, custom React dashboards)
- Reporting tools (Metabase, Looker, custom reports)
- Alerting (PagerDuty, Slack integrations)

### Connection Model
Nexus uses **read-only connections** to platform databases:

- **USERS_DB_URL** (read-only): Query user data
- **WORKSTATION_DB_URL** (read-only): Query content and subject data
- **MARKETPLACE_DB_URL** (read-only): Query vendor and product data
- **NEXUS_DB_URL** (read/write): Store Nexus-specific data (alerts, reports, admin logs)

Nexus does NOT write to Users, Workstation, or Marketplace databases (except via admin actions, which use dedicated write-enabled service accounts with strict auditing).

---

## Platform Monitoring & Health

### System Health Monitoring
Nexus monitors the technical health of all platforms:

**API Health:**
- Uptime percentage (99.9% SLA target)
- Request rate (requests per second)
- Latency (p50, p95, p99 response times)
- Error rate (4xx, 5xx responses)
- Endpoint-specific metrics (slowest endpoints, most error-prone endpoints)

**Database Health:**
- Query latency (slow query detection)
- Connection pool usage
- Replication lag (for read replicas)
- Disk usage, table sizes
- Index performance

**Sync Quality (Consumer App):**
- Ultrasound detection rate (percentage of successful detections)
- Sync latency (time from ultrasound broadcast to app sync)
- Sync accuracy (correct content and timestamp identification rate)
- Error rate (failed detections, incorrect sync, API errors)

**Infrastructure Metrics:**
- Server CPU, memory, disk usage
- Network bandwidth, throughput
- Container/pod health (if using Kubernetes)
- Auto-scaling events

### Uptime & Availability
Nexus tracks platform uptime:

**Uptime dashboard:**
- Current status (operational, degraded, down)
- Historical uptime (daily, weekly, monthly)
- Incident history (past outages, duration, impact)

**Service status page:**
- Public status page (optional, e.g., status.hoolsy.com)
- Shows Consumer App, Webshop, API status
- Incident updates posted here

### Performance Benchmarks
Nexus establishes and monitors performance benchmarks:

**Target SLAs:**
- API response time: p95 < 200ms, p99 < 500ms
- Sync latency: < 2 seconds (ultrasound detection to UI update)
- Page load time: < 2 seconds (Consumer App homepage)

**Alerting on degradation:**
- If p95 latency > 500ms for 5 minutes → Alert
- If error rate > 5% for 2 minutes → Alert

---

## User Behavior Analytics

### User Metrics
Nexus tracks key user behavior metrics:

**Registration & Onboarding:**
- New user registrations (daily, weekly, monthly)
- Registration funnel (started registration → email verified → profile completed)
- Onboarding completion rate (set preferences, added payment method, etc.)

**Engagement:**
- Daily Active Users (DAU), Weekly Active Users (WAU), Monthly Active Users (MAU)
- Session duration (average time spent per session)
- Session frequency (sessions per user per week)
- Feature usage (content synced with, subjects clicked, products viewed)

**Content Synchronization (Consumer App):**
- Total sync time (hours synced per day/week/month)
- Content completion rate (percentage of content synced to end)
- Top content by sync sessions, sync time, completion rate
- Genre preferences (which genres are most synced)

**Subject Discovery:**
- Subject clicks (how many subjects clicked per session)
- Subject detail views (how many users open subject panels)
- Top subjects by clicks (most popular people, products, locations)
- Subject-to-product conversion rate (clicked subject → viewed product → purchased)

**Shopping Behavior:**
- Product views, product clicks
- Add-to-cart rate (product views → adds to cart)
- Cart abandonment rate (added to cart but didn't checkout)
- Checkout completion rate (started checkout → completed purchase)
- Average order value (AOV)

**Retention:**
- Day 1, Day 7, Day 30 retention rates
- Churn rate (users who stopped using app)
- Cohort analysis (retention by signup date)

### Funnel Analysis
Nexus visualizes key conversion funnels:

**Registration funnel:**
1. Visited homepage
2. Clicked "Sign Up"
3. Entered email/password
4. Verified email
5. Completed profile
6. First session

**Subject-to-purchase funnel:**
1. Watched content
2. Clicked on subject
3. Viewed product in subject panel
4. Added product to cart
5. Proceeded to checkout
6. Completed purchase

**Content discovery funnel:**
1. Homepage visit
2. Browsed content catalog
3. Clicked on content
4. Started watching
5. Watched > 50% of content
6. Added similar content to watchlist

### Segmentation
Nexus segments users for deeper analysis:

**By demographics:**
- Age, gender, location

**By behavior:**
- Heavy users (high sync time, frequent purchases)
- Browsers (high product views, low purchases)
- One-time purchasers vs. repeat buyers

**By acquisition source:**
- Organic search, paid ads, social media, referral

---

## Vendor Performance Tracking

### Vendor Metrics
Nexus monitors vendor activity and performance:

**Vendor Growth:**
- New vendor registrations (daily, weekly, monthly)
- Active vendors (vendors with at least one active product)
- Inactive vendors (no activity in 30 days)

**Product Listings:**
- Total products listed
- New products added per vendor
- Product approval rate (if approval workflow exists)
- Product rejection reasons (quality, policy violations)

**Sales Performance:**
- Total sales volume (units sold, revenue) per vendor
- Top vendors by revenue, units sold
- Average product price per vendor
- Conversion rate (product views → purchases) per vendor

**Subject Linking:**
- Product-subject links created per vendor
- Link approval rate (if approval workflow exists)
- Link quality score (based on user engagement, conversions)

**Customer Satisfaction:**
- Average product rating per vendor
- Return/refund rate per vendor
- Customer complaints per vendor

### Vendor Leaderboards
Nexus displays vendor leaderboards:

**Top vendors by revenue:**
- Rank vendors by total revenue (last 30 days, last quarter, all-time)

**Top vendors by units sold:**
- Rank vendors by total units sold

**Top vendors by link quality:**
- Rank vendors by subject link engagement (clicks, conversions)

**Rising stars:**
- New vendors with rapid growth

### Vendor Compliance
Nexus monitors vendor compliance with platform policies:

**Policy violations:**
- Unapproved product listings
- Misleading product descriptions
- Counterfeit or prohibited items
- Late shipments, unfulfilled orders

**Compliance actions:**
- Warnings issued
- Products removed
- Vendor accounts suspended/banned

---

## Content Performance Analytics

### Content Metrics
Nexus tracks content performance:

**Content Popularity:**
- Top content by sync sessions, sync time, completion rate
- Trending content (rapid growth in sync sessions)
- Genre popularity (which genres are most synced)

**Subject Engagement:**
- Top subjects by clicks (most clicked people, products, locations)
- Subject click-through rate (subjects clicked / total sync time)
- Subject-to-product conversion rate (subject clicks → product purchases)

**Content Lifecycle:**
- New content added (daily, weekly, monthly)
- Content aging (views by content age)
- Catalog health (percentage of content with zero views in last 30 days)

### Content Recommendations
Nexus analyzes recommendation performance:

**Recommendation effectiveness:**
- Click-through rate on recommended content
- Sync time from recommendations vs. search vs. browse

**A/B testing:**
- Test different recommendation algorithms
- Track engagement, retention by recommendation variant

---

## Financial Reporting & Revenue Streams

### Revenue Tracking
Nexus tracks all revenue streams:

**Product Sales:**
- Total revenue from product sales (daily, weekly, monthly)
- Revenue by vendor, product, category
- Revenue by channel (webshop vs. Consumer App)

**Commission Revenue:**
- Hoolsy's commission earnings (percentage of vendor sales)
- Commission by vendor, product

**Subscription Revenue (future):**
- If Hoolsy adds subscription tiers (premium content, ad-free, etc.)
- Subscription signups, renewals, churn

**Advertising Revenue (future):**
- If Hoolsy adds advertising (sponsored products, video ads)
- Ad impressions, clicks, revenue

### Transaction Volume
Nexus monitors transaction metrics:

**Order Volume:**
- Total orders (daily, weekly, monthly)
- Orders by vendor, product, category
- Average order value (AOV)

**Payment Processing:**
- Payment success rate (successful transactions / attempted transactions)
- Payment method distribution (credit card, PayPal, Apple Pay, etc.)
- Payment gateway fees

**Refunds & Returns:**
- Refund rate (refunds / total orders)
- Refund reasons (product defect, wrong item, changed mind, etc.)

### Vendor Payouts
Nexus tracks vendor payout schedule:

**Payout Pending:**
- Revenue earned by vendors but not yet paid out
- Payout cycle (weekly, bi-weekly, monthly)

**Payout History:**
- Historical payouts to vendors
- Payout method (bank transfer, PayPal, etc.)

---

## Security & Compliance Monitoring

### Security Monitoring
Nexus detects security threats and anomalies:

**Threat Detection:**
- Failed login attempts (brute force attacks)
- Unusual API request patterns (possible bot activity)
- Suspicious user behavior (account takeover, fraud)
- SQL injection, XSS attempts (blocked by WAF, logged for analysis)

**Access Monitoring:**
- Admin actions (user/vendor account changes, content removals)
- Privileged access logs (database admin logins, SSH access)

**Data Breaches:**
- Monitor for leaked credentials (check against breach databases)
- Alert on unusual data access patterns

### Compliance Monitoring
Nexus ensures regulatory compliance:

**GDPR (General Data Protection Regulation):**
- Track user consent (data processing, marketing emails)
- Monitor data access requests (user requests to view/delete their data)
- Audit data retention policies (delete old data as required)

**PCI-DSS (Payment Card Industry Data Security Standard):**
- Ensure no credit card data stored in Hoolsy databases (tokenized via Stripe)
- Audit payment processing logs

**COPPA (Children's Online Privacy Protection Act):**
- If Hoolsy allows users under 13, ensure parental consent

**Content Moderation:**
- Monitor user-generated content (reviews, comments) for policy violations
- Flag inappropriate content for review

### Incident Response
Nexus provides tools for incident management:

**Incident Timeline:**
- Log all events during an incident (alerts, actions taken, resolution)
- Post-incident analysis (root cause, prevention measures)

**Incident Communication:**
- Notify affected users (email, status page updates)
- Internal communication (Slack, incident management tools)

---

## Cross-Platform Administration

### User Management
Nexus provides admin tools for managing users across all platforms:

**User Lookup:**
- Search users by email, name, user ID
- View user profile, activity, orders

**User Actions:**
- Reset password, verify email
- Suspend/ban user account (for policy violations)
- Merge duplicate accounts

**Platform Access Management:**
- Grant/revoke user access to Workstation, Marketplace, Nexus
- Manage roles and permissions across platforms

### Vendor Management
Nexus provides admin tools for managing vendors:

**Vendor Approval:**
- Review pending vendor registrations
- Approve or reject with feedback

**Vendor Actions:**
- Suspend vendor account (for policy violations, unpaid fees)
- Ban vendor (permanent removal)
- Adjust vendor commission rates (custom agreements)

**Product Moderation:**
- Review flagged products (policy violations, user reports)
- Approve/reject product listings
- Remove products

### Content Management
Nexus provides admin tools for managing content:

**Content Upload:**
- Hoolsy admins can upload content directly (bypassing Workstation, for internal use)

**Content Moderation:**
- Review flagged content (copyright issues, inappropriate content)
- Remove or hide content

**Subject Moderation:**
- Review product-subject links (approve/reject)
- Remove inaccurate or low-quality subject tags

---

## Alerting & Incident Management

### Alerting System
Nexus sends real-time alerts for critical issues:

**Alert Types:**
- **Critical**: Platform down, payment processing failure, security breach
- **High**: High error rate, database performance degradation, sync quality issues
- **Medium**: Elevated traffic, low inventory, vendor compliance issues
- **Low**: Informational alerts (scheduled maintenance, new vendor registrations)

**Alert Channels:**
- **Slack**: Real-time notifications to #alerts channel
- **PagerDuty**: On-call engineer notifications (for critical alerts)
- **Email**: Email to ops team
- **SMS**: Critical alerts only

### Alert Configuration
Nexus allows configuring alert rules:

**Threshold-based alerts:**
- API error rate > 5% for 5 minutes → Alert
- Database CPU > 90% for 10 minutes → Alert
- Sync detection failure rate > 15% → Alert

**Anomaly detection:**
- Unusual spike in traffic (possible DDoS attack)
- Sudden drop in conversions (possible bug)

**Event-based alerts:**
- Payment gateway down
- CDN failure
- Database replication lag > 10 seconds

### Incident Management
Nexus provides tools for managing incidents:

**Incident Dashboard:**
- Active incidents, status, assigned responder
- Incident timeline (alerts triggered, actions taken)

**Runbooks:**
- Pre-defined response procedures for common incidents
- Link to relevant documentation, escalation paths

**Post-Mortems:**
- Document incident root cause, timeline, resolution
- Track action items to prevent recurrence

---

## Reporting & Dashboards

### Executive Dashboards
Nexus provides high-level KPIs for executive stakeholders:

**Business Metrics:**
- Total revenue, revenue growth (MoM, YoY)
- Total users, user growth (MoM, YoY)
- Total vendors, active vendors
- Total products, active products
- Total orders, AOV

**Platform Health:**
- Uptime percentage (last 30 days)
- API latency (p95)
- Incident count (last 30 days)

**User Engagement:**
- DAU, MAU
- Total sync time (Consumer App)
- Subject clicks, product views

### Operational Dashboards
Nexus provides detailed operational dashboards for teams:

**Engineering Dashboard:**
- API performance (latency, error rate, request volume)
- Database health (query performance, replication lag)
- Infrastructure metrics (CPU, memory, disk usage)

**Product Dashboard:**
- User engagement (DAU, session duration, feature usage)
- Conversion funnels (registration, subject discovery, checkout)
- A/B test results

**Finance Dashboard:**
- Revenue by channel, vendor, product
- Commission earnings
- Payout schedule, pending payouts

**Support Dashboard:**
- Support ticket volume, resolution time
- Common issues, user complaints
- Vendor compliance issues

### Custom Reports
Nexus allows generating custom reports:

**Report Builder:**
- Select metrics, dimensions, date ranges
- Visualize as table, chart, or export to CSV/Excel

**Scheduled Reports:**
- Automatically generate and email reports (daily, weekly, monthly)
- Example: "Weekly Vendor Performance Report"

---

## API Surface

Nexus exposes an **internal API** for admin operations and data access.

### API Architecture Principles
- **Internal-only**: Not exposed to public internet
- **Strict authentication**: Only Hoolsy employees with admin privileges
- **Audit logging**: All admin actions logged for compliance

### Authentication Endpoints

**POST /auth/login**
- Authenticate Nexus admin user
- **Auth required**: No (login endpoint)

**GET /auth/me**
- Fetch current admin user profile, roles, permissions
- **Auth required**: Yes

### Monitoring Endpoints

**GET /monitoring/api/health**
- Fetch API health metrics (latency, error rate, request volume)
- **Auth required**: Yes

**GET /monitoring/database/health**
- Fetch database health metrics
- **Auth required**: Yes

**GET /monitoring/sync/quality**
- Fetch Consumer App sync quality metrics (ultrasound detection, sync latency, accuracy)
- **Auth required**: Yes

### Analytics Endpoints

**GET /analytics/users**
- User behavior analytics (DAU, MAU, engagement)
- **Auth required**: Yes

**GET /analytics/vendors**
- Vendor performance metrics
- **Auth required**: Yes

**GET /analytics/content**
- Content performance metrics
- **Auth required**: Yes

**GET /analytics/revenue**
- Financial reporting (revenue, commissions, payouts)
- **Auth required**: Yes (finance role only)

### Admin Action Endpoints

**GET /admin/users**
- List users (filterable, searchable)
- **Auth required**: Yes (admin role)

**PATCH /admin/users/:id**
- Update user (suspend, ban, reset password)
- **Auth required**: Yes (admin role)

**GET /admin/vendors**
- List vendors
- **Auth required**: Yes (admin role)

**PATCH /admin/vendors/:id**
- Update vendor (approve, suspend, adjust commission)
- **Auth required**: Yes (admin role)

**GET /admin/products**
- List products (flagged, pending approval)
- **Auth required**: Yes (moderator role)

**PATCH /admin/products/:id**
- Update product (approve, reject, remove)
- **Auth required**: Yes (moderator role)

### Alerting Endpoints

**GET /alerts**
- List active alerts
- **Auth required**: Yes

**POST /alerts/:id/acknowledge**
- Acknowledge alert (mark as seen)
- **Auth required**: Yes

**POST /alerts/:id/resolve**
- Resolve alert (mark as fixed)
- **Auth required**: Yes

---

## Nexus in the Hoolsy Ecosystem

### The Five Platforms

**1. Workstation**
- Internal platform for content preparation and subject verification
- **Relationship to Nexus**: Nexus monitors Workstation activity (content uploads, task completion, user productivity)

**2. Marketplace**
- Commerce platform for vendors and consumers (Marketplace for Vendors + Marketplace Storefront)
- **Relationship to Nexus**: Nexus monitors vendor activity, sales performance, compliance, storefront usage

**3. Consumer App**
- Public-facing mobile companion app for ultrasound-synced shopping
- **Relationship to Nexus**: Nexus monitors user behavior, sync quality, conversion funnels

**4. Syncstation**
- On-set companion app for production crews
- **Relationship to Nexus**: Nexus monitors on-set logging activity, sync status, field usage patterns

**5. Nexus** (this document)
- Internal oversight and administration
- **Relationship to all platforms**: Nexus monitors, analyzes, and administers all platforms

### Data Flow

**All platforms → Nexus:**
- Logs (application logs, error logs)
- Metrics (API latency, database performance)
- Events (user actions, orders, content uploads)

**Nexus → All platforms (admin actions):**
- User/vendor account changes (suspend, ban, approve)
- Content moderation (remove, hide)
- Configuration changes (feature flags, settings)

### Why Nexus is Critical
As Hoolsy scales, Nexus provides:

**Visibility:**
- Understand what's happening across all platforms in real-time

**Proactive Monitoring:**
- Detect issues before they impact users (performance degradation, security threats)

**Data-Driven Decisions:**
- Analyze user behavior, content performance, vendor activity to inform product strategy

**Operational Efficiency:**
- Centralized admin tools reduce time spent managing users, vendors, content

**Compliance:**
- Ensure regulatory compliance (GDPR, PCI-DSS, etc.)

### Nexus's Role in the Workflow
Nexus operates continuously in the background:

1. **Data Ingestion**: Logs and metrics streamed from all platforms
2. **Processing**: Aggregate metrics, detect anomalies, trigger alerts
3. **Visualization**: Display dashboards, reports for Hoolsy teams
4. **Alerting**: Notify on-call engineers, ops teams of critical issues
5. **Admin Actions**: Hoolsy admins use Nexus to manage users, vendors, content
6. **Analysis**: Data analysts use Nexus to understand trends, optimize platform
7. **Reporting**: Generate reports for executive stakeholders, finance teams

Nexus is the **central nervous system** that keeps the entire Hoolsy ecosystem healthy, secure, and efficient.
