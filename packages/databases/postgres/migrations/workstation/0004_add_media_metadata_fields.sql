-- Migration: Add comprehensive media metadata fields
-- Replace duration_seconds with duration_ms (milliseconds for frame precision)
-- Add video, audio, and image specific metadata fields

-- Drop old duration column
ALTER TABLE "media_assets" DROP COLUMN IF EXISTS "duration_seconds";--> statement-breakpoint

-- Add media type flags
ALTER TABLE "media_assets" ADD COLUMN "has_video" boolean;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "has_audio" boolean;--> statement-breakpoint

-- Add common metadata (video/audio/image)
ALTER TABLE "media_assets" ADD COLUMN "duration_ms" bigint;--> statement-breakpoint

-- Note: width and height already exist, no need to add them

-- Add video-specific metadata
ALTER TABLE "media_assets" ADD COLUMN "frame_rate" real;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "video_codec" varchar(50);--> statement-breakpoint

-- Add audio-specific metadata
ALTER TABLE "media_assets" ADD COLUMN "audio_codec" varchar(50);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "audio_channels" integer;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "audio_sample_rate" integer;--> statement-breakpoint

-- Add image-specific metadata
ALTER TABLE "media_assets" ADD COLUMN "format" varchar(50);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "color_space" varchar(50);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "dpi" integer;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "orientation" integer;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "exif_data" jsonb;
