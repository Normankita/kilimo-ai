# Kilimo AI — Technical Documentation

> **Version:** 1.0  
> **Date:** May 2026  
> **Project:** Kilimo AI — Smart Agriculture Platform  
> **Classification:** Final Year University Project — Technical Reference  
> **Document Type:** Software Architecture & API Reference

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Schema](#4-database-schema)
5. [API Integrations](#5-api-integrations)
6. [Authentication & Security](#6-authentication--security)
7. [PWA Implementation](#7-pwa-implementation)
8. [Deployment](#8-deployment)
9. [Known Limitations](#9-known-limitations)
10. [Future Improvements](#10-future-improvements)

---

## 1. System Overview

### Purpose and Scope

Kilimo AI is a full-stack Progressive Web Application (PWA) designed to deliver agricultural intelligence to Tanzanian smallholder farmers. The system addresses a critical gap in the agricultural sector: the lack of accessible, timely, and locally-contextualised farming guidance in the Kiswahili language.

The platform integrates three data streams — AI-driven conversational assistance, real-time meteorological data, and administratively-managed market price data — into a unified, mobile-first interface that can be installed on any smartphone without an App Store.

### Target Users

| User Role | Description |
|-----------|-------------|
| **Farmer (default)** | Smallholder farmers accessing crop info, market prices, AI assistance, and educational content |
| **Admin** | Authorised personnel who manage market prices and educational content via the admin panel |
| **Super Admin** | System-level administrators with full access including user role management |

### Key Features

- **AI Agricultural Assistant** — Conversational AI powered by Groq/Llama 3.1, restricted to farming topics, responds primarily in Kiswahili.
- **Real-time Weather Widget** — Fetches live meteorological data from OpenWeatherMap, localised to the user's region.
- **Market Price Dashboard** — Displays crop prices across four major Tanzanian markets (Dar es Salaam, Dodoma, Arusha, Mbeya) with visual comparison bars.
- **Crop Information Library** — Structured agronomic data for five core crops grown in Tanzania.
- **Educational Video Library** — Categorised YouTube-embedded training videos filterable by category (planting, irrigation, diseases).
- **User Profile Management** — Full CRUD for user profile, avatar upload to Supabase Storage, password change, Google account linking, and account deletion.
- **PWA Install** — Installable on Android (Chrome) and iOS (Safari) as a native-like application.
- **Role-Based Access Control (RBAC)** — Row Level Security (RLS) policies enforce data access at the database layer.
- **Bilingual UI** — Full Kiswahili and English interface with persistent language preference per user.
- **Interactive Onboarding Tour** — driver.js-powered step-by-step tutorial on first login.
- **Dark/Light Theme** — System-aware theme switching via next-themes.

---

## 2. Architecture

### System Architecture Description

Kilimo AI is built on a **client-server model** using the Next.js App Router paradigm with a clear separation between the frontend (React components), backend logic (Next.js API routes and Server Components), and external data services.

The architecture follows a **three-tier design**:

1. **Presentation Tier** — React components and pages rendered client-side and server-side via Next.js.
2. **Application Tier** — Next.js API routes (`/api/chat`, `/api/weather`, `/api/delete-account`) acting as a secure proxy between the client and third-party APIs.
3. **Data Tier** — Supabase (PostgreSQL) for persistent storage, Supabase Auth for identity management, and Supabase Storage for binary assets.

### Client-Server Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  React Components │ Framer Motion │ Radix UI │ Tailwind CSS v4  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS (Next.js Server)
┌────────────────────────────▼────────────────────────────────────┐
│                     APPLICATION TIER                             │
│              Next.js 16 App Router (Vercel Edge)                 │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ /api/chat  │  │  /api/weather   │  │ /api/delete-account  │  │
│  │ (AI proxy) │  │ (weather proxy) │  │  (account deletion)  │  │
│  └─────┬──────┘  └────────┬────────┘  └──────────┬───────────┘  │
└────────│─────────────────│────────────────────────│─────────────┘
         │                 │                        │
┌────────▼──────┐  ┌───────▼───────┐  ┌────────────▼─────────────┐
│  Groq API     │  │OpenWeatherMap │  │     Supabase (BaaS)       │
│  Llama 3.1    │  │   API v2.5    │  │  PostgreSQL + Auth +      │
│  Inference    │  │  Current Wx   │  │  Storage + RLS Policies   │
└───────────────┘  └───────────────┘  └──────────────────────────┘
```

### Component Diagram Description

**Frontend Layer** (`/app`, `/components`):
- **Landing Page** (`/app/page.tsx`) — Public marketing page with animated hero, feature highlights, and QR code entry.
- **Auth Pages** (`/app/auth`, `/app/login`, `/app/register`, `/app/forgot-password`, `/app/reset-password`) — Supabase Auth UI flows for email/password and Google OAuth.
- **Protected Layout** (`/app/(protected)/layout.tsx`) — Route group enforcing authentication middleware; wraps Dashboard, Assistant, Crops, Market, and Learn pages.
- **Admin Panel** (`/app/admin`) — Role-gated admin interface for managing market prices and educational content.
- **Profile Page** (`/app/profile`) — User profile CRUD, avatar upload, password change, Google link, account deletion.
- **API Routes** (`/app/api`) — Server-side proxies shielding API keys from the client.

**Component Library** (`/components`):
- `ui/` — Low-level primitives (Button, Card, Input, Label, Badge, Modal, Select, Tabs, Toast) built on Radix UI.
- `layout/` — Navigation shell (sidebar, mobile bottom nav, header).
- `weather-widget.tsx` — Self-contained weather card consuming `/api/weather`.
- `motion/` — Reusable Framer Motion animation wrappers.
- `tutorial/` — driver.js tour configurations for Dashboard and Assistant pages.
- `admin/` — Admin-only content management components.

**Library Layer** (`/lib`):
- `supabase/client.ts` — Client-side Supabase client factory (browser cookies).
- `supabase/server.ts` — Server-side Supabase client (secure cookies, used in middleware and Server Components).
- `language-context.tsx` — React context providing `t` (translation object) and `lang` state to the entire app.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.6 | Full-stack React framework with App Router, Server Components, and API Routes |
| **Runtime** | React | 19.2.4 | UI component library and state management |
| **Language** | TypeScript | 5.x | Static typing across the entire codebase |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **CSS Processing** | PostCSS | – | Processes Tailwind directives |
| **Component Primitives** | Radix UI | Various | Accessible, headless UI primitives (Dialog, Select, Tabs, Toast, Dropdown, Avatar) |
| **Animation** | Framer Motion | 12.39.0 | Declarative animation library for entrance effects, layout transitions, and micro-interactions |
| **Icons** | Lucide React | 1.16.0 | SVG icon library |
| **Backend-as-a-Service** | Supabase | 2.106.1 | PostgreSQL database, Auth, Storage, and auto-generated REST API |
| **Auth Client** | @supabase/ssr | 0.10.3 | Server-Side Rendering compatible Supabase auth helpers |
| **AI Inference** | Groq API | – | Fast LLM inference endpoint using Llama 3.1 8B Instant |
| **AI SDK (unused)** | @google/generative-ai | 0.24.1 | Installed but not active in production routes |
| **Weather** | OpenWeatherMap API | v2.5 | Real-time weather data (temperature, humidity, wind, description) |
| **Notifications** | Sonner | 2.0.7 | Toast notification library |
| **Theme Switching** | next-themes | 0.4.6 | System-aware light/dark theme persistence |
| **Class Utilities** | clsx + tailwind-merge | – | Conditional and safe Tailwind class merging |
| **CVA** | class-variance-authority | 0.7.1 | Type-safe component variant definitions |
| **PWA** | next-pwa | 5.6.0 | Service Worker generation, manifest injection, offline caching |
| **QR Code** | qrcode.react | 4.2.0 | In-app QR code generation for shareable app link |
| **Onboarding Tour** | driver.js | 1.4.0 | Step-by-step interactive UI walkthrough |
| **Image Optimisation** | sharp | 0.34.5 | Next.js image processing for optimised delivery |
| **Bundler** | Turbopack | (Next.js 16 default) | Rust-based bundler replacing Webpack in development |
| **Hosting** | Vercel | – | Zero-config Next.js deployment with Edge Network |

---

## 4. Database Schema

All tables reside in the `public` schema of the Supabase-hosted PostgreSQL instance. Row Level Security (RLS) is enabled on every table.

---

### 4.1 `profiles`

Extends `auth.users`. Created automatically via a database trigger on user registration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PRIMARY KEY, FK → `auth.users(id)` ON DELETE CASCADE | Maps 1:1 to the authenticated user |
| `role` | `text` | NOT NULL, DEFAULT `'farmer'`, CHECK IN (`'farmer'`, `'admin'`, `'super_admin'`) | Access control role |
| `full_name` | `text` | NULLABLE | User's display name |
| `location` | `text` | NULLABLE | Tanzanian region (e.g. "Dodoma") used for weather lookups |
| `email` | `text` | NULLABLE | Mirrored from auth for convenience |
| `phone_number` | `text` | NULLABLE | Optional contact number |
| `farm_location` | `text` | NULLABLE | Specific farm location description |
| `bio` | `text` | NULLABLE, max 200 chars enforced client-side | Short user bio |
| `preferred_language` | `text` | NULLABLE, DEFAULT `'sw'` | Language preference (`'sw'` or `'en'`) |
| `avatar_url` | `text` | NULLABLE | Public URL to uploaded avatar in Supabase Storage |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Record creation timestamp |

**RLS Policies:**

| Policy Name | Operation | Condition |
|-------------|-----------|-----------|
| `profiles_select_own` | SELECT | `auth.uid() = id` |
| `profiles_update_own` | UPDATE | `auth.uid() = id` |
| `profiles_select_admin` | SELECT | Requesting user has role `admin` or `super_admin` |
| `profiles_update_super_admin` | UPDATE | Requesting user has role `super_admin` |

---

### 4.2 `market_prices`

Stores wholesale crop price records by market location and date.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing record ID |
| `crop_name` | `text` | NOT NULL | Crop name in Kiswahili (e.g. "Mahindi") |
| `price_per_kg` | `numeric(10,2)` | NOT NULL | Price per kilogram in Tanzanian Shillings (TZS) |
| `market_location` | `text` | NOT NULL | Market name (e.g. "Dar es Salaam") |
| `recorded_date` | `date` | NOT NULL, DEFAULT `CURRENT_DATE` | Date the price was recorded |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Record insertion timestamp |

**RLS Policies:**

| Policy Name | Operation | Condition |
|-------------|-----------|-----------|
| `market_prices_select` | SELECT | `auth.role() = 'authenticated'` (any logged-in user) |
| `market_prices_write` | ALL (INSERT, UPDATE, DELETE) | Requesting user has role `admin` or `super_admin` |

---

### 4.3 `educational_content`

Stores YouTube-linked training video metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing record ID |
| `title` | `text` | NOT NULL | Video title (Kiswahili or English) |
| `description` | `text` | NOT NULL, DEFAULT `''` | Short description of video content |
| `video_url` | `text` | NOT NULL | Full YouTube video URL |
| `category` | `text` | NOT NULL, DEFAULT `'kupanda'` | Category tag: `kupanda`, `umwagiliaji`, `magonjwa`, or `mboji` |
| `crop_name` | `text` | NOT NULL, DEFAULT `''` | Associated crop (empty for general content) |
| `language` | `text` | NOT NULL, DEFAULT `'Kiswahili'` | Video language (`'Kiswahili'` or `'English'`) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Record insertion timestamp |

**RLS Policies:**

| Policy Name | Operation | Condition |
|-------------|-----------|-----------|
| `content_select` | SELECT | `auth.role() = 'authenticated'` |
| `content_write` | ALL | Requesting user has role `admin` or `super_admin` |

---

### 4.4 `crop_info`

Stores structured agronomic data for each supported crop, with bilingual fields.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing record ID |
| `name` | `text` | NOT NULL | Crop name in Kiswahili |
| `name_en` | `text` | NULLABLE | Crop name in English |
| `emoji` | `text` | DEFAULT `'🌿'` | Display emoji for the crop |
| `season_sw` | `text` | NULLABLE | Growing season description (Kiswahili) |
| `season_en` | `text` | NULLABLE | Growing season description (English) |
| `water_sw` | `text` | NULLABLE | Water requirements (Kiswahili) |
| `water_en` | `text` | NULLABLE | Water requirements (English) |
| `temperature` | `text` | NULLABLE | Optimal temperature range (e.g. "18–30°C") |
| `yield_sw` | `text` | NULLABLE | Expected yield per acre (Kiswahili) |
| `yield_en` | `text` | NULLABLE | Expected yield per acre (English) |
| `diseases` | `jsonb` | NOT NULL, DEFAULT `'[]'` | JSON array of known disease/pest names |
| `tips_sw` | `text` | NULLABLE | Key farming tips (Kiswahili) |
| `tips_en` | `text` | NULLABLE | Key farming tips (English) |
| `accent_color` | `text` | DEFAULT `'#2a5c3f'` | HEX colour used for crop card theming |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Record insertion timestamp |

**RLS Policies:**

| Policy Name | Operation | Condition |
|-------------|-----------|-----------|
| `crop_info_select` | SELECT | `auth.role() = 'authenticated'` |
| `crop_info_write` | ALL | Requesting user has role `admin` or `super_admin` |

---

### 4.5 `ai_conversations`

Persists individual chat messages for conversation history per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigserial` | PRIMARY KEY | Auto-incrementing record ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Owning user |
| `role` | `text` | NOT NULL, CHECK IN (`'user'`, `'assistant'`) | Message sender role |
| `content` | `text` | NOT NULL | Message content body |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Message timestamp |

**RLS Policies:**

| Policy Name | Operation | Condition |
|-------------|-----------|-----------|
| `conversations_own` | ALL | `auth.uid() = user_id` (users can only access their own messages) |

---

## 5. API Integrations

### 5.1 Groq API (AI Assistant)

**Endpoint:** `https://api.groq.com/openai/v1/chat/completions`  
**Authentication:** Bearer token (`GROQ_API_KEY` environment variable)  
**Route:** `POST /api/chat` (internal Next.js proxy)

#### Model

```
llama-3.1-8b-instant
```

This model is Groq's fastest inference option, optimised for low-latency conversational responses — critical for mobile users on slower connections.

#### System Prompt Structure

The AI's behaviour is constrained by a static system prompt injected at the beginning of every request:

```
You are Kilimo AI, an agricultural assistant for Tanzanian smallholder farmers.
Always respond in Kiswahili unless the user writes in English.
Focus only on farming topics: crops, weather, diseases, irrigation, pest control, soil health, and market advice.
Be simple, friendly, and practical. Avoid technical jargon.
If asked about something unrelated to farming, politely redirect to farming topics in Kiswahili.
Keep responses concise and actionable.
```

This prompt ensures the model:
1. Responds in Kiswahili by default (matching the primary user base).
2. Stays within agricultural subject matter.
3. Uses accessible, jargon-free language appropriate for smallholder farmers.

#### Request Format

```json
POST https://api.groq.com/openai/v1/chat/completions

{
  "model": "llama-3.1-8b-instant",
  "messages": [
    { "role": "system", "content": "<SYSTEM_PROMPT>" },
    { "role": "user", "content": "Mahindi yangu yana magonjwa gani?" },
    { "role": "assistant", "content": "Mahindi yanaweza kushambuliwa na..." },
    { "role": "user", "content": "Dawa gani nitumie?" }
  ],
  "max_tokens": 1024,
  "temperature": 0.7
}
```

The full conversation history (all previous user and assistant messages) is sent with each request to maintain context across the conversation session.

#### Response Format

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Unaweza kutumia dawa ya..."
      }
    }
  ]
}
```

The extracted `content` string is returned to the client as `{ "content": "..." }`.

#### Error Handling

- If `GROQ_API_KEY` is not set or matches the placeholder string, the route returns HTTP 503 with a Kiswahili error message.
- If the Groq API returns a non-2xx response, the error message from the API body is forwarded to the client.
- Network errors are caught and returned as HTTP 500.

---

### 5.2 OpenWeatherMap API

**Endpoint:** `https://api.openweathermap.org/data/2.5/weather`  
**Authentication:** `appid` query parameter (`OPENWEATHERMAP_API_KEY` environment variable)  
**Route:** `GET /api/weather?location=<city>,TZ` (internal Next.js proxy)

#### Request Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `q` | `{location},{country}` e.g. `Dodoma,TZ` | City name and ISO 3166-1 country code |
| `appid` | `{OPENWEATHERMAP_API_KEY}` | API authentication key |
| `units` | `metric` | Returns temperature in Celsius |
| `lang` | `sw` | Returns weather descriptions in Kiswahili |

#### Next.js Caching

```typescript
fetch(url, { next: { revalidate: 1800 } })
```

Weather data is cached by Next.js for 30 minutes (1,800 seconds) to reduce API calls and respect the free-tier rate limits.

#### Response Transformation

The raw OpenWeatherMap response is transformed and a lean payload is returned to the client:

```json
{
  "temp": 28.4,
  "feels_like": 31.2,
  "humidity": 65,
  "wind_speed": 3.5,
  "description": "mawingu machache",
  "city": "Dodoma",
  "icon": "02d"
}
```

The `icon` field is an OpenWeatherMap icon code used to render the `https://openweathermap.org/img/wn/{icon}@2x.png` weather icon image.

#### How Data is Displayed

The `WeatherWidget` component (`/components/weather-widget.tsx`) consumes this endpoint. It:
1. Reads the user's region from their Supabase profile (`location` field).
2. Appends `,TZ` to form the location query string.
3. Fetches data from `/api/weather?location={region},TZ`.
4. Renders temperature, feels-like, humidity, wind speed, and a description with the appropriate weather icon.

---

### 5.3 Supabase

Supabase is the core Backend-as-a-Service powering authentication, the database, and file storage.

#### Auth Flow

Kilimo AI uses the `@supabase/ssr` package which handles session persistence via HTTP-only cookies — ensuring tokens are never accessible to JavaScript (protection against XSS attacks).

**Client initialisation (browser):**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

**Server initialisation (API routes / Server Components):**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
// Uses Next.js cookies() API for SSR-safe cookie handling
```

#### Database Query Pattern

All database interactions use the Supabase JS client with the builder pattern:

```typescript
// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

// Update profile
await supabase
  .from('profiles')
  .update({ full_name: '...', location: '...' })
  .eq('id', uid)

// Fetch market prices ordered by date
const { data } = await supabase
  .from('market_prices')
  .select('crop_name, price_per_kg, market_location')
  .order('recorded_date', { ascending: false })
  .limit(5)
```

#### Storage Usage

Supabase Storage is used for user avatar images:

- **Bucket:** `avatars` (public read, authenticated write)
- **Path pattern:** `{user_id}/avatar.jpg`
- **Upload:** `supabase.storage.from('avatars').upload(path, file, { upsert: true })`
- **Public URL:** Retrieved via `supabase.storage.from('avatars').getPublicUrl(path)`
- **Cache busting:** A timestamp query parameter (`?v={Date.now()}`) is appended to the URL after upload to force browser cache refresh.

#### RLS Policy Explanation

Row Level Security (RLS) is a PostgreSQL feature that allows per-row access control at the database engine level. This means that even if someone obtains the Supabase anon key, they cannot access data they are not authorised to read.

Every table has RLS enabled. The policies use `auth.uid()` (the current authenticated user's UUID) and `auth.role()` (the Supabase role: `'authenticated'` or `'anon'`) to gate access:

```sql
-- Example: Users can only select their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Example: Only admins can write market prices
CREATE POLICY "market_prices_write" ON public.market_prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

---

## 6. Authentication & Security

### Registration Flow

```
User fills form → Client calls supabase.auth.signUp()
       ↓
Supabase creates auth.users entry
       ↓
Database trigger creates profiles row (id, email, role='farmer')
       ↓
Supabase sends confirmation email
       ↓
User clicks confirmation link → Session cookie set → Redirect to /dashboard
```

### Login Flow (Email/Password)

```
User submits email + password
       ↓
Client calls supabase.auth.signInWithPassword()
       ↓
Supabase validates credentials
       ↓
JWT access token + refresh token stored in HTTP-only cookies
       ↓
Next.js middleware verifies session on each protected route
       ↓
User sees /dashboard
```

### Google OAuth Flow

```
User clicks "Continue with Google"
       ↓
Client calls supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
       ↓
Browser redirected to Google OAuth consent screen
       ↓
Google returns auth code to /auth/callback
       ↓
Supabase exchanges code for tokens and sets session cookies
       ↓
Next.js callback handler redirects to /dashboard
```

### Role-Based Access Control

| Role | Dashboard | AI Assistant | Crops | Market | Learn | Profile | Admin Panel |
|------|:---------:|:------------:|:-----:|:------:|:-----:|:-------:|:-----------:|
| `farmer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ✅ (content mgmt) |
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (all) | ✅ (full access) |

Role enforcement happens at two levels:
1. **Client-side:** UI elements are conditionally rendered based on the `role` field from the `profiles` table.
2. **Database-level:** RLS policies prevent unauthorised data access even if client-side checks are bypassed.

### Security Measures

| Measure | Implementation |
|---------|---------------|
| **HTTPS Enforcement** | All traffic over TLS via Vercel |
| **HTTP-only Cookies** | Auth tokens stored in `HttpOnly` cookies — inaccessible to JavaScript |
| **API Key Shielding** | All third-party API keys (Groq, OpenWeatherMap) are server-side environment variables, never exposed to the browser |
| **RLS** | Per-row access control at the PostgreSQL engine level |
| **Input Validation** | Password strength checked client-side; file type and size validated before avatar upload |
| **Account Deletion Confirmation** | Users must type "FUTA" to confirm irreversible account deletion |
| **Password Re-verification** | Password changes require re-authentication with the current password |
| **Middleware Route Protection** | Next.js middleware (`middleware.ts`) intercepts all requests to `/(protected)` routes and redirects unauthenticated users to `/login` |

---

## 7. PWA Implementation

### Manifest Configuration

The Web App Manifest is located at `/public/manifest.json`:

```json
{
  "name": "Kilimo AI - Msaada wa Kilimo",
  "short_name": "Kilimo AI",
  "description": "Mfumo wa akili ya bandia kwa wakulima wa Tanzania",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a2e1a",
  "theme_color": "#2d5a27",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-72x72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96x96.png",   "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Key manifest properties:
- **`display: "standalone"`** — App runs without browser UI chrome, appearing as a native app.
- **`theme_color: "#2d5a27"`** — Matches the brand's primary dark green, used for Android status bar colouring.
- **`orientation: "portrait"`** — Locks orientation to portrait mode for mobile-first experience.
- **Maskable icon** — The 192×192 icon includes `"purpose": "any maskable"` for adaptive icon support on Android.

### Service Worker Behaviour

The service worker is generated by `next-pwa` (based on Workbox) and configured in `next.config.ts`:

```typescript
const withPWA = require('next-pwa')({
  dest: 'public',        // Output directory for SW files
  register: true,        // Auto-register SW on page load
  skipWaiting: true,     // Activate new SW immediately (no waiting)
  disable: process.env.NODE_ENV === 'development', // Disable in dev (avoids HMR conflicts)
})
```

The generated service worker (`/public/sw.js`) applies Workbox caching strategies:
- **Static assets** (JS, CSS, fonts, images) — `CacheFirst` strategy for instant loading.
- **API routes** (`/api/*`) — `NetworkFirst` strategy, falling back to cache if offline.
- **Pages** — `StaleWhileRevalidate` for fast perceived load with background updates.

> **Note:** As of Next.js 16 with Turbopack, `next-pwa` injects a webpack configuration. The `turbopack: {}` property has been added to `next.config.ts` to explicitly acknowledge Turbopack usage and suppress the compatibility warning.

### Install Flow

```
User visits site → Browser detects manifest + SW registration
       ↓
Browser shows "Add to Home Screen" prompt (Chrome Android)
  OR
User taps Share → "Add to Home Screen" (Safari iOS)
       ↓
App icon created on home screen
       ↓
App launches in standalone mode (no browser UI)
       ↓
Service Worker serves cached assets for fast startup
```

---

## 8. Deployment

### Environment Variables

The following environment variables must be configured in the deployment environment (Vercel project settings or `.env.local` for local development):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL (e.g. `https://xxxx.supabase.co`). Exposed to browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key for client-side auth and data operations. Exposed to browser. RLS policies protect data. |
| `GROQ_API_KEY` | ✅ Yes | Secret API key for Groq inference. **Server-side only** — never exposed to browser. |
| `OPENWEATHERMAP_API_KEY` | ✅ Yes | Secret API key for OpenWeatherMap. **Server-side only** — never exposed to browser. |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | The deployed application URL (e.g. `https://kilimo-ai.vercel.app`). Used for OAuth redirect URIs and QR code generation. |

### Vercel Deployment Steps

1. **Push to GitHub**  
   Ensure all source files are committed and pushed to a GitHub repository.

2. **Import to Vercel**  
   - Log in to [vercel.com](https://vercel.com).
   - Click "Add New Project" → Import from GitHub.
   - Select the `kilimo-app` repository.

3. **Configure Environment Variables**  
   In the Vercel project settings under "Environment Variables", add all five variables listed above.

4. **Deploy**  
   Vercel automatically detects Next.js and runs `next build`. The first deploy takes 2–4 minutes.

5. **Update `NEXT_PUBLIC_APP_URL`**  
   After the first deployment, copy the assigned Vercel URL (e.g. `kilimo-ai.vercel.app`) and update the `NEXT_PUBLIC_APP_URL` environment variable, then redeploy.

6. **Configure Supabase OAuth Redirect**  
   In the Supabase dashboard → Authentication → URL Configuration:
   - **Site URL:** `https://kilimo-ai.vercel.app`
   - **Redirect URLs:** Add `https://kilimo-ai.vercel.app/auth/callback`

### Supabase Production Checklist

Before going live, verify the following in the Supabase dashboard:

| Item | Action |
|------|--------|
| ✅ Database schema deployed | Run `/supabase/schema.sql` in the SQL Editor |
| ✅ Seed data loaded | Run `/supabase/seed.sql` for initial crop, market, and content data |
| ✅ RLS enabled | Verify all tables have RLS enabled under Table Editor |
| ✅ Google OAuth configured | Enable Google provider in Authentication → Providers, add Google Client ID and Secret |
| ✅ Storage bucket created | Create an `avatars` bucket with public read access |
| ✅ Email templates customised | Update confirmation and password reset emails with Kilimo AI branding |
| ✅ Site URL set | Match to deployed Vercel URL |
| ✅ Redirect URL whitelisted | Add `/auth/callback` to allowed redirect URLs |
| ✅ Rate limiting reviewed | Default Supabase rate limits are sufficient for initial deployment |

---

## 9. Known Limitations

### Groq API — Free Tier Constraints

| Constraint | Details |
|------------|---------|
| **Requests per minute** | 30 RPM on free tier (shared across all users) |
| **Tokens per minute** | 14,400 TPM on free tier |
| **Context window** | 131,072 tokens for Llama 3.1 8B |
| **Impact** | Heavy concurrent usage can trigger rate-limit errors. Users may see "Groq API ilikataa ombi" during peak periods. |

**Mitigation:** Upgrade to Groq paid tier as user base grows. Implement client-side queuing and exponential retry with user-visible feedback.

### Supabase — Free Tier Constraints

| Constraint | Details |
|------------|---------|
| **Database size** | 500 MB storage limit |
| **Bandwidth** | 5 GB egress per month |
| **Storage** | 1 GB file storage (avatars bucket) |
| **Auth users** | Unlimited on free tier |
| **Project pause** | Free projects pause after 1 week of inactivity |
| **Impact** | A paused project causes a cold-start delay of ~30 seconds on first request after inactivity. |

**Mitigation:** Upgrade to Supabase Pro ($25/month) before public launch. Set up a keep-alive CRON to ping the project and prevent pause.

### No Offline AI Support

The AI assistant requires an active internet connection. When offline:
- Previously loaded pages (Dashboard, Crops, Market) may display cached data via the service worker.
- The AI assistant chat input is disabled and returns an error if the network request fails.
- There is no local AI inference capability — this would require shipping a model to the device.

### Market Prices — Manual Update Dependency

Current market prices are entered manually by administrators through the admin panel. This creates:
- **Data freshness risk** — Prices may lag actual market conditions by days.
- **Admin bottleneck** — Requires a dedicated person to collect and input price data regularly.
- **Geographic limitation** — Only four markets are currently tracked.

### Limited Crop Coverage

Only five crops are in the database (Mahindi, Nyanya, Maharage, Mchele, Vitunguu). Tanzania supports over 20 commercially important crops. Expanding the crop library requires admin data entry.

### No Push Notifications

The PWA manifest and service worker do not currently implement the Web Push API. Users are not notified of market price changes, severe weather alerts, or AI response completions if the app is in the background.

---

## 10. Future Improvements

### 10.1 SMS Notifications

Integrate with a Tanzanian SMS gateway (e.g. **Africa's Talking**, **Beem Africa**) to deliver:
- Daily market price summaries to farmers without smartphones.
- Weather alerts (heavy rain, drought warnings).
- AI responses via SMS for areas with no data but with 2G voice/SMS coverage.

**Implementation approach:** Add a serverless CRON function (Vercel CRON or Supabase Edge Functions) that queries the database nightly and triggers SMS via the gateway API.

### 10.2 IoT Sensor Integration

Integrate low-cost soil and weather sensors (e.g. **ESP32 with DHT22** for temperature/humidity, **capacitive soil moisture sensors**) to provide:
- Real-time soil moisture alerts to trigger irrigation.
- Hyperlocal temperature and humidity data more accurate than city-level weather APIs.
- Historical sensor data visualised as trend charts in the dashboard.

**Implementation approach:** Sensors publish MQTT messages to an MQTT broker (e.g. HiveMQ). A server-side listener writes readings to a new `sensor_readings` Supabase table. Dashboard components query and chart the data.

### 10.3 Offline Mode

Extend the service worker to cache AI responses and allow offline browsing of:
- Previously viewed crop information cards.
- Cached market prices from the last network session.
- Downloaded educational content metadata (with embedded YouTube thumbnails).

**Implementation approach:** Implement a Workbox `BackgroundSync` strategy for the AI chat — queuing user messages offline and delivering them when connectivity is restored.

### 10.4 Native Mobile App

Migrate the PWA to a **React Native** (Expo) or **Flutter** application to gain:
- Access to native device APIs (camera, GPS, offline storage, push notifications).
- Play Store and App Store distribution for broader reach.
- Background location for automated weather lookup without manual region setting.

### 10.5 Disease Detection via Camera

Add computer vision capabilities using a mobile-optimised model (e.g. **TensorFlow Lite**, **Google ML Kit**) deployed on-device or via a cloud Vision API:
- Farmer photographs a diseased leaf or crop.
- Model identifies the disease with confidence score.
- Linked to the AI assistant which provides treatment advice based on the diagnosis.

**Implementation approach:** Fine-tune a MobileNetV3 or EfficientNet-Lite model on a dataset of Tanzanian crop diseases. Deploy via TensorFlow.js in the browser or TF Lite in a native app.

### 10.6 Automated Market Price Scraping

Replace manual admin data entry with automated price collection:
- Scrape price data from the **Tanzania Mercantile Exchange (TMX)**, **EAGC's RATIN**, and the **National Bureau of Statistics** market portals.
- Use a scheduled Vercel CRON function (daily or weekly) to fetch and normalise price data.
- Expand coverage to all 26 Tanzanian regions and additional crops.

**Implementation approach:** Python-based scraper deployed as a Vercel serverless function or GitHub Actions workflow, writing results to the `market_prices` table via the Supabase service role key.

### 10.7 Multilingual Expansion

Extend the bilingual (Kiswahili/English) system to support:
- **Regional dialects** — Sukuma, Chagga, Hehe for highland farming communities.
- **Voice input/output** — Text-to-speech for farmers with limited literacy.

### 10.8 Farmer Network / Community Feature

Add a community Q&A board where:
- Farmers post questions visible to all.
- Experienced farmers or extension officers can answer.
- AI provides automatic initial responses which experts can verify or correct.

---

*Technical Documentation prepared May 2026 for Kilimo AI v1.0*  
*Stack: Next.js 16 · React 19 · TypeScript 5 · Supabase · Groq API · OpenWeatherMap · Tailwind CSS v4 · Framer Motion*

*© 2026 Kilimo AI — University Final Year Project*
