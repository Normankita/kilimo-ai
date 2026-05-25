# Kilimo AI

A smart agriculture assistant built for Tanzanian smallholder farmers. Get AI-powered farming advice, live market prices, weather forecasts, and educational content — all in Swahili and English, completely free.

## Features

- **AI Assistant** — Ask farming questions and get instant advice powered by Google Gemini AI
- **Live Weather** — Real-time weather forecasts tailored to your farm location
- **Market Prices** — Up-to-date crop prices from major Tanzanian markets
- **Crop Management** — Track and manage your crops in one place
- **Education** — Farming guides and video content in Swahili
- **PWA Support** — Installable on Android and iPhone, works offline
- **Bilingual** — Full Swahili and English support

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI + shadcn/ui |
| Auth & Database | Supabase |
| AI | Google Gemini AI |
| Animations | Framer Motion |
| PWA | next-pwa |
| Icons | Lucide React |
| Theming | next-themes |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- An [OpenWeather](https://openweathermap.org/api) API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Dev-Norman/kilimo-app.git
cd kilimo-app
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment variables file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_WEATHER_API_KEY=your_openweather_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
kilimo-app/
├── app/
│   ├── (protected)/          # Authenticated routes
│   │   ├── assistant/        # AI chat assistant
│   │   ├── crops/            # Crop management
│   │   ├── dashboard/        # Main dashboard
│   │   ├── learn/            # Education content
│   │   └── market/           # Market prices
│   ├── admin/                # Admin panel
│   ├── api/                  # API routes (chat, weather, etc.)
│   ├── login/
│   ├── register/
│   └── profile/
├── components/               # Shared UI components
├── lib/                      # Utilities, contexts, Supabase client
└── public/                   # Static assets
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Creator

**Norman Kita**
- Email: [kitanorman1@gmail.com](mailto:kitanorman1@gmail.com)
- Portfolio: [norman-kita.vercel.app](https://norman-kita.vercel.app)

## License

© 2026 Kilimo AI. All rights reserved.
