CREATE TABLE IF NOT EXISTS "content_subjects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "check_times" CHECK ("content_subjects"."start_time" < "content_subjects"."end_time")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content" (
	"id" uuid PRIMARY KEY NOT NULL,
	"media_title" varchar(255) NOT NULL,
	"episode_title" varchar(255),
	"season" integer,
	"episode" integer,
	"duration_seconds" integer NOT NULL,
	"thumbnail_url" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"is_sellable" boolean DEFAULT false NOT NULL,
	"hero_image_url" text,
	"external_url" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "check_type" CHECK ("subjects"."type" IN ('person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"brand" varchar(100),
	"image_url" text,
	"base_price" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'NOK' NOT NULL,
	"product_url" text,
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subject_products" (
	"subject_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subject_products_subject_id_product_id_pk" PRIMARY KEY("subject_id","product_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_subjects" ADD CONSTRAINT "content_subjects_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_subjects" ADD CONSTRAINT "content_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subject_products" ADD CONSTRAINT "subject_products_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subject_products" ADD CONSTRAINT "subject_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_subjects_content" ON "content_subjects" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_subjects_timeline" ON "content_subjects" USING btree ("content_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_subjects_subject" ON "content_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_media_title" ON "content" USING btree ("media_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_content_season_episode" ON "content" USING btree ("season","episode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subjects_type" ON "subjects" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subjects_sellable" ON "subjects" USING btree ("is_sellable");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_price" ON "products" USING btree ("base_price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_brand" ON "products" USING btree ("brand");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subject_products_subject" ON "subject_products" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subject_products_product" ON "subject_products" USING btree ("product_id");