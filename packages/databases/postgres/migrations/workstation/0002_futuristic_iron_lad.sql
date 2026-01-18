ALTER TABLE "content_nodes" DROP CONSTRAINT "u_tenant_parent_title";--> statement-breakpoint
ALTER TABLE "content_nodes" ADD COLUMN "slug" varchar(160);