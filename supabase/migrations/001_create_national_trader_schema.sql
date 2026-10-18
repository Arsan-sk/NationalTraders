-- ==============================================================================
-- National Traders - Supabase Database Schema & Initial Data
-- Project table prefix: NT_
-- Compatible with PostgreSQL and Supabase
-- ==============================================================================

-- 1. Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if needed (safe rebuild order)
-- DROP TABLE IF EXISTS "NT_product_featured_sections" CASCADE;
-- DROP TABLE IF EXISTS "NT_featured_sections" CASCADE;
-- DROP TABLE IF EXISTS "NT_products" CASCADE;
-- DROP TABLE IF EXISTS "NT_categories" CASCADE;
-- DROP TABLE IF EXISTS "NT_shop_info" CASCADE;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS "NT_categories" (
  "id" TEXT PRIMARY KEY,
  "label" TEXT NOT NULL,
  "e" TEXT NOT NULL DEFAULT '🛍️',
  "blurb" TEXT,
  "home" BOOLEAN NOT NULL DEFAULT true,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS "NT_products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "cat" TEXT NOT NULL,
  "price" NUMERIC(10, 2),
  "note" TEXT,
  "e" TEXT DEFAULT '🛍️',
  "img" TEXT,
  "fallback_url" TEXT,
  "image_path" TEXT,
  "q" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on category for fast filtering
CREATE INDEX IF NOT EXISTS "idx_NT_products_cat" ON "NT_products"("cat");
CREATE INDEX IF NOT EXISTS "idx_NT_products_price" ON "NT_products"("price");

-- 5. Featured Sections Table
CREATE TABLE IF NOT EXISTS "NT_featured_sections" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Product-to-Section Membership (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS "NT_product_featured_sections" (
  "product_id" TEXT NOT NULL REFERENCES "NT_products"("id") ON DELETE CASCADE,
  "section_id" TEXT NOT NULL REFERENCES "NT_featured_sections"("id") ON DELETE CASCADE,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("product_id", "section_id")
);

CREATE INDEX IF NOT EXISTS "idx_NT_pfs_section" ON "NT_product_featured_sections"("section_id");
CREATE INDEX IF NOT EXISTS "idx_NT_pfs_product" ON "NT_product_featured_sections"("product_id");

-- 7. Shop Information Table
CREATE TABLE IF NOT EXISTS "NT_shop_info" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "wa" TEXT NOT NULL,
  "branches" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "instagram" TEXT,
  "wholesale_ig" TEXT,
  "youtube" TEXT,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Public can READ (SELECT), Service Role & Authenticated Admins have FULL access
-- ==============================================================================
ALTER TABLE "NT_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NT_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NT_featured_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NT_product_featured_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NT_shop_info" ENABLE ROW LEVEL SECURITY;

-- Anonymous public read policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_categories' AND policyname = 'Public read categories') THEN
    CREATE POLICY "Public read categories" ON "NT_categories" FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_products' AND policyname = 'Public read products') THEN
    CREATE POLICY "Public read products" ON "NT_products" FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_featured_sections' AND policyname = 'Public read featured sections') THEN
    CREATE POLICY "Public read featured sections" ON "NT_featured_sections" FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_product_featured_sections' AND policyname = 'Public read product featured sections') THEN
    CREATE POLICY "Public read product featured sections" ON "NT_product_featured_sections" FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_shop_info' AND policyname = 'Public read shop info') THEN
    CREATE POLICY "Public read shop info" ON "NT_shop_info" FOR SELECT USING (true);
  END IF;
END $$;

-- Write policies for service_role and authenticated users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_categories' AND policyname = 'Admin write categories') THEN
    CREATE POLICY "Admin write categories" ON "NT_categories" FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_products' AND policyname = 'Admin write products') THEN
    CREATE POLICY "Admin write products" ON "NT_products" FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_featured_sections' AND policyname = 'Admin write featured sections') THEN
    CREATE POLICY "Admin write featured sections" ON "NT_featured_sections" FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_product_featured_sections' AND policyname = 'Admin write product featured sections') THEN
    CREATE POLICY "Admin write product featured sections" ON "NT_product_featured_sections" FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'NT_shop_info' AND policyname = 'Admin write shop info') THEN
    CREATE POLICY "Admin write shop info" ON "NT_shop_info" FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;
END $$;

-- ==============================================================================
-- Storage Bucket & Policies for "nt_products"
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nt_products',
  'nt_products',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access nt_products') THEN
    CREATE POLICY "Public Access nt_products" ON storage.objects FOR SELECT USING (bucket_id = 'nt_products');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admin Insert nt_products') THEN
    CREATE POLICY "Admin Insert nt_products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'nt_products');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admin Update nt_products') THEN
    CREATE POLICY "Admin Update nt_products" ON storage.objects FOR UPDATE USING (bucket_id = 'nt_products');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Admin Delete nt_products') THEN
    CREATE POLICY "Admin Delete nt_products" ON storage.objects FOR DELETE USING (bucket_id = 'nt_products');
  END IF;
END $$;

-- ==============================================================================
-- Seed Initial Data
-- ==============================================================================

-- Seed Shop Info
INSERT INTO "NT_shop_info" ("id", "wa", "branches", "instagram", "wholesale_ig", "youtube")
VALUES (
  'default',
  '919156924664',
  '[{"name":"Branch 1 & 2, Bhiwandi","phone":"9156924664"},{"name":"Shanti Nagar & Koter Gate, Bhiwandi","phone":"9503606280"}]'::jsonb,
  'https://www.instagram.com/thenational_trader.04/',
  'https://www.instagram.com/thenational.trader.4_wholesale/',
  'https://youtube.com/@theatlanticwaves'
)
ON CONFLICT ("id") DO UPDATE SET
  "wa" = EXCLUDED."wa",
  "branches" = EXCLUDED."branches",
  "instagram" = EXCLUDED."instagram",
  "wholesale_ig" = EXCLUDED."wholesale_ig",
  "youtube" = EXCLUDED."youtube";

-- Seed Featured Sections
INSERT INTO "NT_featured_sections" ("id", "title", "description", "display_order", "is_active")
VALUES
  ('hero_deals', 'Hero Deals & Stickers', 'Highlighted deals displayed in the homepage hero banner sticker tags', 1, true),
  ('rs20_specials', '₹20 Dhamaka Specials', 'Best-selling items in the ₹20 range', 2, true),
  ('kitchen_steel', 'Kitchen & Steel Essentials', 'Top cookware, tiffins, and dinner sets', 3, true),
  ('popular_appliances', 'Appliances & Purifiers', 'Mixers, water purifiers, and stoves with reviews', 4, true)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "display_order" = EXCLUDED."display_order",
  "is_active" = EXCLUDED."is_active";

-- Seed Categories
INSERT INTO "NT_categories" ("id", "label", "e", "blurb", "home", "display_order")
VALUES
  ('rs20', 'Everything at ₹20', '🏷️', 'Buckets, bottles, scratchers and more plastic basics, all one price.', true, 1),
  ('cups', 'Chini & Glass Cups', '☕', 'Tea cups, coffee mugs and cup sets in many sizes and price ranges.', true, 2),
  ('steel', 'Steel & Containers', '🥘', 'Steel containers, dabbas, plates and cookware for every kitchen.', true, 3),
  ('dinner', 'Dinner Sets & Glassware', '🍽️', 'Wedding, Eid and gift sets from ₹550.', true, 4),
  ('plastic', 'Plastic Homeware', '🧺', 'Racks, baskets and mops that last.', true, 5),
  ('bottles', 'Bottles & Thermos', '🍶', 'Water bottles and thermos from ₹18.', false, 6),
  ('appliances', 'Home Appliances', '🔌', 'Mixer grinders, RO purifiers and gas stoves with honest reviews.', true, 7),
  ('daily', 'Daily Needs', '☂️', 'Raincoats, umbrellas and study tables.', false, 8)
ON CONFLICT ("id") DO UPDATE SET
  "label" = EXCLUDED."label",
  "e" = EXCLUDED."e",
  "blurb" = EXCLUDED."blurb",
  "home" = EXCLUDED."home",
  "display_order" = EXCLUDED."display_order";

-- Seed Products
INSERT INTO "NT_products" ("id", "name", "cat", "price", "note", "e", "img", "q")
VALUES
  ('a1', 'Small plastic bucket', 'rs20', 20, 'Part of the ₹20 range', '🪣', '', 'plastic bucket'),
  ('a2', 'Plastic bottle', 'rs20', 20, 'Part of the ₹20 range', '🧴', '', 'plastic bottle'),
  ('a3', 'Dish scratcher', 'rs20', 20, 'Part of the ₹20 range', '🧽', '', 'scouring pad'),
  ('a4', 'Plastic mug', 'rs20', 20, 'Part of the ₹20 range', '🥤', '', 'plastic mug'),
  ('a5', 'Soap dish', 'rs20', 20, 'Part of the ₹20 range', '🧼', '', 'soap dish'),
  ('a6', 'Plastic basket', 'rs20', 20, 'Part of the ₹20 range', '🧺', '', 'plastic basket'),
  ('b1', 'Glass tea cups', 'cups', 20, 'Price as shown in shop video', '🍵', '', 'glass tea cup'),
  ('b2', 'Chini tea cups', 'cups', NULL, 'Ceramic, many designs', '🍵', '', 'ceramic tea cup'),
  ('b3', 'Coffee mugs', 'cups', NULL, 'Small to large sizes', '☕', '', 'coffee mug'),
  ('b4', 'Cup & saucer sets', 'cups', NULL, 'Gift-ready sets', '🫖', '', 'cup and saucer set'),
  ('c1', 'Steel containers', 'steel', NULL, 'Kitchen storage in all sizes', '🥫', '', 'stainless steel container'),
  ('c2', 'Steel tiffins & dabbas', 'steel', NULL, 'Lunch and kitchen use', '🍱', '', 'stainless steel tiffin'),
  ('c3', 'Steel plates & bowls', 'steel', NULL, 'Everyday and wedding use', '🍽️', '', 'stainless steel plate'),
  ('c4', 'Pressure cookers', 'steel', NULL, 'Prince, Shuddhi, Doctor’s Choice', '🍲', '', 'pressure cooker'),
  ('d1', 'Dinner set (32 pcs)', 'dinner', 550, 'Designs at ₹550 / ₹650 / ₹750', '🍽️', '', 'dinner set plates'),
  ('d2', 'Glass bowl & dessert sets', 'dinner', NULL, 'Eid and wedding special', '🥣', '', 'glass bowl set'),
  ('d3', 'Cello glassware', 'dinner', NULL, 'Old Fashioned and more', '🥃', '', 'drinking glass set'),
  ('e1', '3-tier vegetable rack', 'plastic', 99, 'Strong plastic, 3 baskets', '🧺', '', 'vegetable rack kitchen'),
  ('e2', 'Plastic baskets & organisers', 'plastic', NULL, 'Kitchen and home storage', '🧺', '', 'plastic storage basket'),
  ('e3', 'Spin mop bucket set', 'plastic', NULL, 'Easy floor cleaning', '🧹', '', 'spin mop bucket'),
  ('f1', 'Thermos bottle', 'bottles', 100, 'Hot & cold', '🍶', '', 'thermos flask'),
  ('f2', 'Water bottle', 'bottles', 18, 'Wholesale rate', '💧', '', 'water bottle'),
  ('g1', 'Mixer grinder – Sumeet', 'appliances', 1800, 'Comparison review on YouTube', '🌀', '', 'mixer grinder'),
  ('g2', 'Mixer grinder – Orient', 'appliances', 2700, 'Comparison review on YouTube', '🌀', '', 'mixer grinder kitchen'),
  ('g3', 'Water purifier (RO)', 'appliances', NULL, 'Ask for models', '🚰', '', 'water purifier'),
  ('g4', 'Gas stove', 'appliances', NULL, 'Ask for models', '🔥', '', 'gas stove'),
  ('h1', 'Raincoats & umbrellas', 'daily', NULL, 'Monsoon offers, 30–50% off', '☂️', '', 'raincoat umbrella'),
  ('h2', 'Study tables', 'daily', NULL, 'For kids and students', '📚', '', 'study table')
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "cat" = EXCLUDED."cat",
  "price" = EXCLUDED."price",
  "note" = EXCLUDED."note",
  "e" = EXCLUDED."e",
  "img" = EXCLUDED."img",
  "q" = EXCLUDED."q";

-- Seed Initial Product-to-Section Memberships
INSERT INTO "NT_product_featured_sections" ("product_id", "section_id", "display_order")
VALUES
  ('a1', 'hero_deals', 1),
  ('b1', 'hero_deals', 2),
  ('f2', 'hero_deals', 3),
  ('a1', 'rs20_specials', 1),
  ('a2', 'rs20_specials', 2),
  ('a3', 'rs20_specials', 3),
  ('a4', 'rs20_specials', 4),
  ('c1', 'kitchen_steel', 1),
  ('c2', 'kitchen_steel', 2),
  ('c4', 'kitchen_steel', 3),
  ('d1', 'kitchen_steel', 4),
  ('g1', 'popular_appliances', 1),
  ('g2', 'popular_appliances', 2),
  ('g3', 'popular_appliances', 3)
ON CONFLICT ("product_id", "section_id") DO NOTHING;
