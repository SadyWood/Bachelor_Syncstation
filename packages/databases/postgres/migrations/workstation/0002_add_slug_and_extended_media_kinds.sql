-- Migration: Add slug column and extended media kinds
-- Created: 2025-10-24

-- ============================================================
-- 1. Add slug column to content_nodes
-- ============================================================
ALTER TABLE content_nodes 
ADD COLUMN IF NOT EXISTS slug varchar(160);

-- Create partial unique index for root project slugs
-- Only root nodes (parent_id IS NULL) must have unique slugs per tenant
CREATE UNIQUE INDEX IF NOT EXISTS ux_root_slug
ON content_nodes(tenant_id, slug)
WHERE parent_id IS NULL AND slug IS NOT NULL;

COMMENT ON COLUMN content_nodes.slug IS 'URL-friendly slug for root nodes (projects). Auto-generated from title in frontend.';

-- ============================================================
-- 2. Extended media_kind entries
-- ============================================================

-- Insert new video kinds
INSERT INTO media_kind(media_class_id, kind_code, description) VALUES
  (1, 'teaser', 'Short teaser video'),
  (1, 'clip', 'Short video clip'),
  (1, 'featurette', 'Featurette'),
  (1, 'behind_the_scenes', 'Behind the scenes footage'),
  (1, 'interview', 'Interview video')
ON CONFLICT (kind_code) DO NOTHING;

-- Insert new audio kinds
INSERT INTO media_kind(media_class_id, kind_code, description) VALUES
  (2, 'soundtrack', 'Soundtrack/OST track'),
  (2, 'audio_trailer', 'Audio trailer or preview')
ON CONFLICT (kind_code) DO NOTHING;

-- Insert new image kinds
INSERT INTO media_kind(media_class_id, kind_code, description) VALUES
  (3, 'cover', 'Cover art'),
  (3, 'banner', 'Wide promotional banner'),
  (3, 'still', 'Scene still or frame'),
  (3, 'storyboard', 'Storyboard image')
ON CONFLICT (kind_code) DO NOTHING;
