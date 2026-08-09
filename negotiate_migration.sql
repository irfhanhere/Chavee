-- ============================================================
-- CHAVEE — Negotiate Feature Migration
-- Run in Supabase Dashboard → SQL Editor
-- Adds direction + parent_offer_id to gig_offers
-- ============================================================

-- 1. Add direction column
--    Default: 'seller_to_buyer' keeps all existing rows backward-compatible
ALTER TABLE public.gig_offers
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'seller_to_buyer';

-- 2. Add parent_offer_id (self-referential FK, nullable)
--    ON DELETE SET NULL: if parent is ever deleted, child keeps its record
ALTER TABLE public.gig_offers
  ADD COLUMN IF NOT EXISTS parent_offer_id UUID
    REFERENCES public.gig_offers(id) ON DELETE SET NULL;

-- 3. Index for efficient chain-depth queries
CREATE INDEX IF NOT EXISTS idx_gig_offers_parent_id
  ON public.gig_offers(parent_offer_id);

-- 4. Verify columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'gig_offers'
ORDER BY ordinal_position;
