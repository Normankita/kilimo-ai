-- ============================================================
-- KILIMO APP — COMPLETE DATABASE SETUP
-- Run once in Supabase SQL Editor (Settings → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS / ADD COLUMN IF NOT EXISTS
-- ============================================================


-- ── 1. PROFILES ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'farmer'
                        CHECK (role IN ('farmer', 'admin', 'super_admin')),
  full_name           text,
  email               text,
  location            text,
  phone_number        text,
  farm_location       text,
  bio                 text,
  preferred_language  text DEFAULT 'sw',
  avatar_url          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Add columns that may be missing if the table was created manually / partially
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email              text,
  ADD COLUMN IF NOT EXISTS location           text,
  ADD COLUMN IF NOT EXISTS phone_number       text,
  ADD COLUMN IF NOT EXISTS farm_location      text,
  ADD COLUMN IF NOT EXISTS bio                text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'sw',
  ADD COLUMN IF NOT EXISTS avatar_url         text;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop every policy that may exist (old recursive ones included)
DROP POLICY IF EXISTS "profiles_select_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_super_admin" ON public.profiles;

-- Helper function: reads role without touching RLS (SECURITY DEFINER bypasses it)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Fresh, recursion-free policies
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (get_my_role() IN ('admin', 'super_admin'));

CREATE POLICY "profiles_update_super_admin"
  ON public.profiles FOR UPDATE
  USING (get_my_role() = 'super_admin');


-- ── 2. MARKET PRICES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.market_prices (
  id               bigserial PRIMARY KEY,
  crop_name        text NOT NULL,
  price_per_kg     numeric(10,2) NOT NULL,
  market_location  text NOT NULL,
  recorded_date    date NOT NULL DEFAULT CURRENT_DATE,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_prices_select" ON public.market_prices;
DROP POLICY IF EXISTS "market_prices_write"  ON public.market_prices;

CREATE POLICY "market_prices_select"
  ON public.market_prices FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "market_prices_write"
  ON public.market_prices FOR ALL
  USING     (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));


-- ── 3. EDUCATIONAL CONTENT ──────────────────────────────────────────────────

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

DROP POLICY IF EXISTS "content_select" ON public.educational_content;
DROP POLICY IF EXISTS "content_write"  ON public.educational_content;

CREATE POLICY "content_select"
  ON public.educational_content FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "content_write"
  ON public.educational_content FOR ALL
  USING     (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));


-- ── 4. CROP INFO ────────────────────────────────────────────────────────────

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

DROP POLICY IF EXISTS "crop_info_select" ON public.crop_info;
DROP POLICY IF EXISTS "crop_info_write"  ON public.crop_info;

CREATE POLICY "crop_info_select"
  ON public.crop_info FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "crop_info_write"
  ON public.crop_info FOR ALL
  USING     (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));


-- ── 5. AI CONVERSATIONS ─────────────────────────────────────────────────────
-- One row per user; the full message array is stored as JSONB.
-- Drop and recreate because the old schema had a different shape (per-message rows).

DROP TABLE IF EXISTS public.ai_conversations;

CREATE TABLE public.ai_conversations (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  messages   jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_own"
  ON public.ai_conversations FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 6. STORAGE — AVATARS BUCKET ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_upload_own"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own"  ON storage.objects;

-- Anyone can view avatars (they're public)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Each user can only upload into their own folder  /{user_id}/avatar.jpg
CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ── 7. SEED DATA (skipped if tables already have rows) ──────────────────────

INSERT INTO public.market_prices (crop_name, price_per_kg, market_location, recorded_date)
SELECT * FROM (VALUES
  ('Mahindi',   650,  'Dar es Salaam', CURRENT_DATE),
  ('Mahindi',   600,  'Dodoma',        CURRENT_DATE),
  ('Mahindi',   580,  'Mbeya',         CURRENT_DATE),
  ('Mahindi',   620,  'Arusha',        CURRENT_DATE),
  ('Mchele',   1800,  'Dar es Salaam', CURRENT_DATE),
  ('Mchele',   1650,  'Dodoma',        CURRENT_DATE),
  ('Mchele',   1700,  'Arusha',        CURRENT_DATE),
  ('Mchele',   1600,  'Mbeya',         CURRENT_DATE),
  ('Nyanya',    800,  'Dar es Salaam', CURRENT_DATE),
  ('Nyanya',    650,  'Dodoma',        CURRENT_DATE),
  ('Nyanya',    750,  'Arusha',        CURRENT_DATE),
  ('Nyanya',    600,  'Mbeya',         CURRENT_DATE),
  ('Maharage', 1400,  'Dar es Salaam', CURRENT_DATE),
  ('Maharage', 1300,  'Dodoma',        CURRENT_DATE),
  ('Maharage', 1350,  'Arusha',        CURRENT_DATE),
  ('Maharage', 1250,  'Mbeya',         CURRENT_DATE),
  ('Vitunguu',  500,  'Dar es Salaam', CURRENT_DATE),
  ('Vitunguu',  450,  'Dodoma',        CURRENT_DATE),
  ('Vitunguu',  480,  'Arusha',        CURRENT_DATE),
  ('Vitunguu',  420,  'Mbeya',         CURRENT_DATE)
) AS v(crop_name, price_per_kg, market_location, recorded_date)
WHERE NOT EXISTS (SELECT 1 FROM public.market_prices LIMIT 1);

INSERT INTO public.educational_content (title, description, video_url, category, crop_name, language)
SELECT * FROM (VALUES
  ('Jinsi ya Kupanda Mahindi Tanzania',
   'Mwongozo kamili wa kupanda mahindi kwa wakulima wadogo — kuandaa shamba, kupanda, na kutunza.',
   'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'kupanda', 'Mahindi', 'Kiswahili'),
  ('Umwagiliaji Bora kwa Mboga',
   'Njia rahisi za kumwagilia mboga kwa matumizi ya maji kidogo lakini mavuno makubwa.',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'umwagiliaji', 'Mboga', 'Kiswahili'),
  ('Magonjwa ya Nyanya na Jinsi ya Kuyatibu',
   'Tambua magonjwa ya nyanya mapema na uchague dawa sahihi za asili na za duka.',
   'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'magonjwa', 'Nyanya', 'Kiswahili'),
  ('Kulinda Mazao dhidi ya Wadudu',
   'Mbinu za asili na za kisayansi za kupigana na viwavi, nzi, na wadudu wengine.',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'magonjwa', 'Mazao Mengi', 'Kiswahili'),
  ('Mbolea Bora kwa Udongo wa Tanzania',
   'Aina za mbolea, wakati wa kutumia, na kiasi kinachofaa kwa udongo wa Tanzania.',
   'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'kupanda', 'Mazao Mengi', 'Kiswahili')
) AS v(title, description, video_url, category, crop_name, language)
WHERE NOT EXISTS (SELECT 1 FROM public.educational_content LIMIT 1);
