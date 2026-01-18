CREATE TYPE "public"."ws_member_status" AS ENUM('pending', 'active', 'disabled', 'removed');--> statement-breakpoint
CREATE TABLE "ws_tenant_members" (
	"member_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_uuid" uuid NOT NULL,
	"added_by" uuid,
	"invite_token" varchar(120),
	"status" "ws_member_status" DEFAULT 'pending' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"deactivated_at" timestamp with time zone,
	CONSTRAINT "uk_ws_member_tenant_user" UNIQUE("tenant_id","user_uuid")
);
--> statement-breakpoint
ALTER TABLE "ws_tenant_members" ADD CONSTRAINT "ws_tenant_members_tenant_id_ws_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ws_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "ck_task_assign" CHECK (NOT( "tasks"."assigned_to_user" IS NOT NULL AND "tasks"."assigned_to_role" IS NOT NULL ));--> statement-breakpoint
ALTER TABLE "ws_user_memberships" ADD CONSTRAINT "ck_membership_scope" CHECK (( (CASE WHEN "ws_user_memberships"."tenant_id" IS NULL THEN 0 ELSE 1 END) + (CASE WHEN "ws_user_memberships"."node_id" IS NULL THEN 0 ELSE 1 END) ) = 1);