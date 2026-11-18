-- =============================================================================
-- FLYWHEELS COLLECTION • COMPLETE SUPABASE DATABASE & STORAGE SETUP
-- =============================================================================
-- Copy and paste this script directly into your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =============================================================================

-- 1. Ensure Table 'cars' Exists with All Required Columns
CREATE TABLE IF NOT EXISTS public.cars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available',
    image TEXT NOT NULL,
    promo_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Table 'promo_codes' Exists
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount NUMERIC NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for 'cars' Table
-- Allow ANY visitor (anon / authenticated) to read cars (SHOWROOM DISPLAY)
DROP POLICY IF EXISTS "Allow public read access on cars" ON public.cars;
CREATE POLICY "Allow public read access on cars"
    ON public.cars FOR SELECT
    TO public
    USING (true);

-- Allow authenticated users (Admin) to insert, update, delete
DROP POLICY IF EXISTS "Allow authenticated insert on cars" ON public.cars;
CREATE POLICY "Allow authenticated insert on cars"
    ON public.cars FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on cars" ON public.cars;
CREATE POLICY "Allow authenticated update on cars"
    ON public.cars FOR UPDATE
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on cars" ON public.cars;
CREATE POLICY "Allow authenticated delete on cars"
    ON public.cars FOR DELETE
    TO authenticated
    USING (true);

-- Allow anon operations so the admin dashboard functions seamlessly
DROP POLICY IF EXISTS "Allow anon all on cars" ON public.cars;
CREATE POLICY "Allow anon all on cars"
    ON public.cars FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 5. RLS Policies for 'promo_codes' Table
DROP POLICY IF EXISTS "Allow public read access on promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public read access on promo_codes"
    ON public.promo_codes FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow all on promo_codes" ON public.promo_codes;
CREATE POLICY "Allow all on promo_codes"
    ON public.promo_codes FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 6. Setup Supabase Storage Bucket for Car Images ('cars')
INSERT INTO storage.buckets (id, name, public)
VALUES ('cars', 'cars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'cars' Bucket
DROP POLICY IF EXISTS "Public access to cars bucket" ON storage.objects;
CREATE POLICY "Public access to cars bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'cars');

DROP POLICY IF EXISTS "Allow upload to cars bucket" ON storage.objects;
CREATE POLICY "Allow upload to cars bucket"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'cars');

DROP POLICY IF EXISTS "Allow update to cars bucket" ON storage.objects;
CREATE POLICY "Allow update to cars bucket"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'cars');

DROP POLICY IF EXISTS "Allow delete from cars bucket" ON storage.objects;
CREATE POLICY "Allow delete from cars bucket"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'cars');

-- 7. Seed Initial FlyWheels Collection Vehicles
INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Koenigsegg Agera RS Gryphon', 249, '1 of 1', 'Available', 'images/agera.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Koenigsegg Agera RS Gryphon');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Mercedes-AMG G63 Mansory Edition', 219, '1 of 1', 'Available', 'images/gwagon.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Mercedes-AMG G63 Mansory Edition');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'BMW M5 F90 Competition (HD Logos)', 149, 'HD Logos', 'Available', 'images/bmw.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'BMW M5 F90 Competition (HD Logos)');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Land Rover Defender 110 Trophy', 169, 'HD Logos', 'Available', 'images/defender.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Land Rover Defender 110 Trophy');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Volkswagen Golf GTI / Polo GT (HD Badges)', 129, 'HD Logos', 'Available', 'images/polo.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Volkswagen Golf GTI / Polo GT (HD Badges)');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Ford F-150 Raptor Baja Pre-Runner', 159, 'Builds', 'Available', 'images/ford.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Ford F-150 Raptor Baja Pre-Runner');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Honda Civic FD2 Stance Bart Livery', 119, 'Builds', 'Available', 'images/civic.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Honda Civic FD2 Stance Bart Livery');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Honda Civic FK8 Type R Widebody', 139, 'Builds', 'Available', 'images/typeR.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Honda Civic FK8 Type R Widebody');

INSERT INTO public.cars (name, price, category, status, image)
SELECT 'Vengeance Special Series Coach', 139, 'Bus', 'Available', 'images/pinkbus.jpg'
WHERE NOT EXISTS (SELECT 1 FROM public.cars WHERE name = 'Vengeance Special Series Coach');

-- 8. Seed Default Active Promo Codes
INSERT INTO public.promo_codes (code, discount, active)
VALUES 
    ('ANS10', 10, true),
    ('FIRSTORDER', 20, true),
    ('ABU44', 30, true)
ON CONFLICT (code) DO NOTHING;
