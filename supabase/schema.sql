-- ============================================================
-- Kilimo App — Database Schema
-- Run in Supabase SQL Editor (Settings > SQL Editor)
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'farmer'
                CHECK (role IN ('farmer', 'admin', 'super_admin')),
  full_name   text,
  location    text,
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Farmers can read/update their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can update any profile (role changes)
CREATE POLICY "profiles_update_super_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================
-- Market Prices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.market_prices (
  id               bigserial PRIMARY KEY,
  crop_name        text NOT NULL,
  price_per_kg     numeric(10,2) NOT NULL,
  market_location  text NOT NULL,
  recorded_date    date NOT NULL DEFAULT CURRENT_DATE,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "market_prices_select" ON public.market_prices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can insert/update/delete
CREATE POLICY "market_prices_write" ON public.market_prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- Educational Content
-- ============================================================
CREATE TABLE IF NOT EXISTS public.educational_content (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url   text NOT NULL,
  category    text NOT NULL DEFAULT 'kupanda',
  crop_name   text NOT NULL DEFAULT '',
  language    text NOT NULL DEFAULT 'Kiswahili',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_select" ON public.educational_content
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "content_write" ON public.educational_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- Crop Info
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crop_info (
  id           bigserial PRIMARY KEY,
  name         text NOT NULL,
  name_en      text,
  emoji        text DEFAULT '🌿',
  season_sw    text,
  season_en    text,
  water_sw     text,
  water_en     text,
  temperature  text,
  yield_sw     text,
  yield_en     text,
  diseases     jsonb NOT NULL DEFAULT '[]',
  tips_sw      text,
  tips_en      text,
  accent_color text DEFAULT '#2a5c3f',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crop_info_select" ON public.crop_info
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "crop_info_write" ON public.crop_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- AI Conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_own" ON public.ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Seed: Market Prices
-- ============================================================
INSERT INTO public.market_prices (crop_name, price_per_kg, market_location, recorded_date) VALUES
  ('Mahindi',   650,  'Dar es Salaam', CURRENT_DATE),
  ('Mahindi',   580,  'Dodoma',        CURRENT_DATE),
  ('Mchele',   1800, 'Dar es Salaam', CURRENT_DATE),
  ('Mchele',   1650, 'Arusha',        CURRENT_DATE),
  ('Nyanya',    900,  'Dar es Salaam', CURRENT_DATE),
  ('Nyanya',    750,  'Mbeya',         CURRENT_DATE),
  ('Maharage', 2200, 'Dar es Salaam', CURRENT_DATE),
  ('Maharage', 1950, 'Mwanza',        CURRENT_DATE),
  ('Vitunguu',  800,  'Morogoro',      CURRENT_DATE),
  ('Karoti',    600,  'Arusha',        CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Educational Content
-- ============================================================
INSERT INTO public.educational_content (title, description, video_url, category, crop_name, language) VALUES
  ('Jinsi ya Kupanda Mahindi', 'Mwongozo wa kupanda mahindi kwa msimu wa mvua', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'kupanda', 'Mahindi', 'Kiswahili'),
  ('Umwagiliaji wa Nyanya', 'Njia bora za kumwagilia nyanya', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'umwagiliaji', 'Nyanya', 'Kiswahili'),
  ('Magonjwa ya Mahindi', 'Jinsi ya kuzuia na kutibu magonjwa ya mahindi', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'magonjwa', 'Mahindi', 'Kiswahili'),
  ('Maize Planting Guide', 'Complete guide for planting maize in Tanzania', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'kupanda', 'Mahindi', 'English'),
  ('Making Organic Compost', 'How to make compost from farm waste', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'mboji', '', 'English')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Crop Info
-- ============================================================
INSERT INTO public.crop_info (name, name_en, emoji, season_sw, season_en, water_sw, water_en, temperature, yield_sw, yield_en, diseases, tips_sw, tips_en, accent_color) VALUES
  (
    'Mahindi', 'Maize', '🌽',
    'Msimu wa mvua (Machi–Mei, Oktoba–Desemba)',
    'Rainy season (March–May, October–December)',
    'Wastani — lita 500–800 kwa msimu',
    'Moderate — 500–800 L per season',
    '18–30°C',
    'Tani 2–5 kwa ekari',
    '2–5 tons per acre',
    '["Maize streak virus", "Gray leaf spot", "Armyworm", "Rust"]',
    'Panda mbegu zilizothibitishwa. Tumia mbolea ya DAP wakati wa kupanda.',
    'Use certified seeds. Apply DAP fertilizer at planting.',
    '#c8860a'
  ),
  (
    'Nyanya', 'Tomatoes', '🍅',
    'Mwaka mzima (umwagiliaji unahitajika)',
    'Year-round (irrigation needed)',
    'Mara kwa mara — usimame maji',
    'Frequent — avoid waterlogging',
    '20–27°C',
    'Tani 15–30 kwa ekari',
    '15–30 tons per acre',
    '["Late blight", "Bacterial wilt", "Whitefly", "Fusarium"]',
    'Kagua magonjwa mara kwa mara. Tumia dawa za asili kwanza.',
    'Monitor for disease regularly. Try organic pesticides first.',
    '#c0392b'
  ),
  (
    'Maharage', 'Beans', '🫘',
    'Msimu wa mvua wa pili (Oktoba–Januari)',
    'Short rains (October–January)',
    'Chini hadi wastani — lita 300–500',
    'Low to moderate — 300–500 L',
    '15–25°C',
    'Tani 0.8–1.5 kwa ekari',
    '0.8–1.5 tons per acre',
    '["Bean rust", "Angular leaf spot", "Bean fly", "Root rot"]',
    'Zuia upotevu wa ardhi kwa kutumia mzunguko wa mazao.',
    'Prevent soil depletion through crop rotation.',
    '#8B4513'
  ),
  (
    'Mchele', 'Rice', '🌾',
    'Msimu wa mvua (Desemba–Aprili)',
    'Long rains (December–April)',
    'Juu sana — mashamba yaliyozingatia maji',
    'Very high — flooded paddy fields',
    '20–35°C',
    'Tani 3–6 kwa ekari',
    '3–6 tons per acre',
    '["Rice blast", "Bacterial leaf blight", "Brown planthopper"]',
    'Tumia mbegu za ubora wa juu. Weka maji ya kutosha shambani.',
    'Use high-quality seeds. Maintain adequate standing water.',
    '#DAA520'
  ),
  (
    'Vitunguu', 'Onions', '🧅',
    'Msimu wa kiangazi (Juni–Septemba)',
    'Dry season (June–September)',
    'Wastani — umwagiliaji wa mara kwa mara',
    'Moderate — regular irrigation',
    '13–24°C',
    'Tani 8–20 kwa ekari',
    '8–20 tons per acre',
    '["Downy mildew", "Onion thrips", "Purple blotch", "Neck rot"]',
    'Vuna vitunguu vinapokauka majani. Kausha vizuri kabla ya kuhifadhi.',
    'Harvest when tops dry and fall. Cure well before storage.',
    '#9B59B6'
  )
ON CONFLICT DO NOTHING;
