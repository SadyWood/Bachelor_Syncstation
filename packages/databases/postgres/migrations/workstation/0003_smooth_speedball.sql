CREATE TYPE "public"."media_asset_status" AS ENUM('uploaded', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."media_variant_type" AS ENUM('thumbnail', 'poster', 'hls', 'dash');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('local', 'azure-blob');--> statement-breakpoint
CREATE TABLE "media_assets" (
	"media_asset_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"storage_provider" "storage_provider" DEFAULT 'local' NOT NULL,
	"storage_path" varchar(600) NOT NULL,
	"status" "media_asset_status" DEFAULT 'uploaded' NOT NULL,
	"duration_seconds" integer,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_media_asset_node" UNIQUE("node_id")
);
--> statement-breakpoint
CREATE TABLE "media_variants" (
	"variant_id" uuid PRIMARY KEY NOT NULL,
	"asset_id" uuid NOT NULL,
	"variant_type" "media_variant_type" NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"storage_path" varchar(600) NOT NULL,
	"size_bytes" bigint,
	"width" integer,
	"height" integer,
	"bitrate" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tenant_id_ws_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ws_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_node_id_content_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."content_nodes"("node_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_asset_id_media_assets_media_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."media_assets"("media_asset_id") ON DELETE cascade ON UPDATE no action;