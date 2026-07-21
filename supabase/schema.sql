-- ============================================================
-- KILIMO APP, COMPLETE DATABASE SETUP
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
  ADD COLUMN IF NOT EXISTS avatar_url         text,
  ADD COLUMN IF NOT EXISTS is_active          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_active_at     timestamptz,
  ADD COLUMN IF NOT EXISTS first_active_at    timestamptz;

-- Backfill profiles.email for any row left null (e.g. rows created directly in
-- the SQL editor / dashboard rather than through the app's signup flow).
-- auth.users always has an email, profiles.email is just a denormalized copy.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Best-effort backfill for first_active_at on rows that were already active
-- before this column existed: we never recorded a real "first seen" for them,
-- so approximate it with created_at (closest thing we have to "day one").
-- Going forward, the trigger below sets this exactly, once, per user.
UPDATE public.profiles
SET first_active_at = created_at
WHERE first_active_at IS NULL AND last_active_at IS NOT NULL;

-- Lock in first_active_at the first time last_active_at is ever set for a
-- user (i.e. their first presence heartbeat), and never touch it again.
CREATE OR REPLACE FUNCTION public.set_first_active_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.last_active_at IS DISTINCT FROM OLD.last_active_at AND OLD.first_active_at IS NULL THEN
    NEW.first_active_at := NEW.last_active_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_first_active_at ON public.profiles;
CREATE TRIGGER profiles_set_first_active_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_first_active_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop every policy that may exist (old recursive ones included)
DROP POLICY IF EXISTS "profiles_select_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_super_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_privileged"  ON public.profiles;

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

-- Admins and super_admins may reach other users' rows at the RLS layer;
-- the guard_profile_privileged_fields trigger below enforces the actual
-- business rules for *which* rows/fields each role may change.
CREATE POLICY "profiles_update_privileged"
  ON public.profiles FOR UPDATE
  USING (get_my_role() IN ('admin', 'super_admin'));

-- Guard who can change `role` / `is_active`, regardless of which RLS policy
-- allowed the UPDATE through (closes the gap where profiles_update_own has
-- no column-level restriction).
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role) OR (NEW.is_active IS DISTINCT FROM OLD.is_active) THEN
    IF NEW.id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot change your own role or active status';
    ELSIF public.get_my_role() NOT IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Not authorized to change role or active status';
    ELSIF public.get_my_role() = 'admin' AND (OLD.role = 'super_admin' OR NEW.role = 'super_admin') THEN
      RAISE EXCEPTION 'Admins may not manage or grant super admin access';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_fields ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();


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
  image_url    text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crop_info ADD COLUMN IF NOT EXISTS image_url text;

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


-- ── 4b. BRANDING IMAGES ──────────────────────────────────────────────────────
-- Admin-managed photos shown on the public landing page (app/page.tsx).

CREATE TABLE IF NOT EXISTS public.branding_images (
  id         bigserial PRIMARY KEY,
  image_url  text NOT NULL,
  caption    text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "branding_images_select" ON public.branding_images;
DROP POLICY IF EXISTS "branding_images_write"  ON public.branding_images;

-- Public landing page is unauthenticated — anyone (including anon visitors) can view.
CREATE POLICY "branding_images_select"
  ON public.branding_images FOR SELECT
  USING (true);

CREATE POLICY "branding_images_write"
  ON public.branding_images FOR ALL
  USING     (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));


-- ── 4c. SITE SETTINGS ────────────────────────────────────────────────────────
-- Single-row app-wide config, managed only by super_admin (app/admin/settings/page.tsx).

CREATE TABLE IF NOT EXISTS public.site_settings (
  id                         int PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces a single row
  app_name                   text NOT NULL DEFAULT 'Kilimo AI',
  logo_url                   text,
  accent_color               text NOT NULL DEFAULT '#2a5c3f',
  hero_slideshow_interval_ms int NOT NULL DEFAULT 5000,
  google_login_enabled       boolean NOT NULL DEFAULT true,
  email_login_enabled        boolean NOT NULL DEFAULT true,
  signups_enabled            boolean NOT NULL DEFAULT true,
  password_reset_enabled     boolean NOT NULL DEFAULT true,
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_write"  ON public.site_settings;

-- Public read — login/register/landing pages are unauthenticated.
CREATE POLICY "site_settings_select"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only super_admin may change site-wide config — not plain admin.
CREATE POLICY "site_settings_write"
  ON public.site_settings FOR ALL
  USING     (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');


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


-- ── 6. STORAGE, AVATARS BUCKET ─────────────────────────────────────────────

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


-- ── 6b. STORAGE, SITE MEDIA BUCKET ──────────────────────────────────────────
-- Shared admin-managed media: crop photos (crops/...) and landing-page
-- branding images (branding/...). Unlike avatars this isn't per-user-owned,
-- so writes are gated by role instead of folder ownership.

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site_media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "site_media_admin_write"   ON storage.objects;

CREATE POLICY "site_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-media');

CREATE POLICY "site_media_admin_write"
  ON storage.objects FOR ALL
  USING     (bucket_id = 'site-media' AND get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (bucket_id = 'site-media' AND get_my_role() IN ('admin', 'super_admin'));


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
   'Mwongozo kamili wa kupanda mahindi kwa wakulima wadogo, kuandaa shamba, kupanda, na kutunza.',
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

-- These were previously hardcoded directly in app/(protected)/crops/page.tsx.
-- Migrating them here so the farmer-facing Crops page (now reading from this
-- table) keeps showing the same 5 crops, and so the existing admin CRUD at
-- app/admin/crops/page.tsx actually has something to manage.
INSERT INTO public.crop_info (name, name_en, emoji, season_sw, season_en, water_sw, water_en, temperature, yield_sw, yield_en, diseases, tips_sw, tips_en, accent_color)
SELECT * FROM (VALUES
  ('Mahindi', 'Maize', '🌽',
   'Masika (Machi–Juni) na Vuli (Okt–Jan)', 'Long rains (Mar–Jun) & short rains (Oct–Jan)',
   'Wastani, mm 500–800 kwa msimu', 'Moderate, 500–800 mm per season',
   '18–30°C',
   '2–4 t/ha (kawaida) | 6–8 t/ha (na mbolea)', '2–4 t/ha (basic) | 6–8 t/ha (with fertiliser)',
   '["Maize streak", "Rust (Kutu)", "Smut", "Fall armyworm"]'::jsonb,
   'Panda mbegu bora. Weka DAP wakati wa kupanda, urea wiki 4–6 baadaye.',
   'Use certified seeds. Apply DAP at planting, urea at 4–6 weeks.',
   '#2a5c3f'),
  ('Mchele', 'Rice', '🌾',
   'Masika (Machi–Agosti), unahitaji mvua nyingi', 'Rainy season (Mar–Aug), needs heavy rain',
   'Nyingi, mm 1000–2000 au umwagiliaji', 'Heavy, 1000–2000 mm or irrigation needed',
   '20–35°C',
   '2–3 t/ha (mvua) | 4–6 t/ha (umwagiliaji)', '2–3 t/ha (rain-fed) | 4–6 t/ha (irrigated)',
   '["Rice blast", "Sheath blight", "Leaf rust"]'::jsonb,
   'Panda katika safu cm 20×20. Punguza maji wiki 2 kabla ya kuvuna.',
   'Plant in rows 20×20 cm. Reduce water 2 weeks before harvest.',
   '#2a5878'),
  ('Nyanya', 'Tomatoes', '🍅',
   'Mwaka mzima (bora hali kavu na umwagiliaji)', 'Year-round (best in dry season with irrigation)',
   'Wastani–nyingi; umwagiliaji mara kwa mara', 'Moderate–heavy; regular irrigation',
   '18–27°C',
   '15–25 t/ha', '15–25 t/ha',
   '["Early blight", "Late blight", "Fusarium wilt", "Leaf miner"]'::jsonb,
   'Tumia mbegu zilizothibitishwa. Funga mimea kwa nguzo. Dawa mapema.',
   'Use certified seeds. Stake plants for support. Start pest control early.',
   '#7c2020'),
  ('Maharage', 'Beans', '🫘',
   'Masika na Vuli, fuata mvua', 'Both rainy seasons, follow the rains',
   'Kidogo–wastani, mm 300–500 kwa msimu', 'Low–moderate, 300–500 mm per season',
   '16–24°C',
   '0.8–1.5 t/ha', '0.8–1.5 t/ha',
   '["Angular leaf spot", "Bean rust", "Bacterial blight", "Aphids"]'::jsonb,
   'Zungushia mazao kila msimu. Vuna mapema ili mbegu zisiote.',
   'Rotate crops each season. Harvest early to prevent seed sprouting.',
   '#5a4010'),
  ('Vitunguu', 'Onions', '🧅',
   'Hali kavu (Juni–Novemba), ukanda kame bora', 'Dry season (Jun–Nov), arid zones best',
   'Kidogo, mm 350–500, umwagiliaji kidogo', 'Low, 350–500 mm, light irrigation',
   '13–24°C',
   '10–20 t/ha', '10–20 t/ha',
   '["Purple blotch", "Downy mildew", "Thrips"]'::jsonb,
   'Usimwagilie kupita kiasi, vitunguu vinaoza. Vuna vikisalia nje.',
   E'Don\'t overwater, bulbs rot easily. Harvest when tops fall over.',
   '#4a2a6e')
) AS v(name, name_en, emoji, season_sw, season_en, water_sw, water_en, temperature, yield_sw, yield_en, diseases, tips_sw, tips_en, accent_color)
WHERE NOT EXISTS (SELECT 1 FROM public.crop_info LIMIT 1);
