DO $$ BEGIN
 CREATE TYPE "public"."content_node_type" AS ENUM('group', 'content', 'bonus_content');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_activity_action" AS ENUM('CREATE', 'ASSIGN_ROLE', 'ASSIGN_USER', 'START', 'CONTENT_EDIT', 'COMPLETE', 'REOPEN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ws_role_scope" AS ENUM('platform', 'node');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_closure" (
	"ancestor_id" uuid NOT NULL,
	"descendant_id" uuid NOT NULL,
	"depth" integer NOT NULL,
	CONSTRAINT "content_closure_ancestor_id_descendant_id_pk" PRIMARY KEY("ancestor_id","descendant_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_nodes" (
	"node_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_id" uuid,
	"node_type" "content_node_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"synopsis" text,
	"position" integer DEFAULT 0,
	"media_kind_id" integer,
	"datalake_path" varchar(600),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "u_tenant_parent_title" UNIQUE("tenant_id","parent_id","title")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_class" (
	"id" integer PRIMARY KEY NOT NULL,
	"class_code" varchar(20) NOT NULL,
	CONSTRAINT "media_class_class_code_unique" UNIQUE("class_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_kind" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_class_id" integer NOT NULL,
	"kind_code" varchar(40) NOT NULL,
	"description" varchar(255),
	CONSTRAINT "media_kind_kind_code_unique" UNIQUE("kind_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_activity" (
	"activity_id" uuid PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"actor_uuid" uuid NOT NULL,
	"action_code" "task_activity_action" NOT NULL,
	"field_changed" varchar(40),
	"old_value" text,
	"new_value" text,
	"ts" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_contributor" (
	"task_id" uuid NOT NULL,
	"user_uuid" uuid NOT NULL,
	CONSTRAINT "task_contributor_task_id_user_uuid_pk" PRIMARY KEY("task_id","user_uuid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_priority" (
	"id" integer PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"weight" integer NOT NULL,
	CONSTRAINT "task_priority_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_status" (
	"id" integer PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	CONSTRAINT "task_status_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_type" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(40) NOT NULL,
	"description" varchar(255),
	"default_deadline_hours" integer NOT NULL,
	CONSTRAINT "task_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"task_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"node_id" uuid,
	"subject_id" bigint,
	"task_type_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"priority_id" integer NOT NULL,
	"title" varchar(255),
	"description" text,
	"assigned_to_user" uuid,
	"assigned_to_role" uuid,
	"due_at" timestamp with time zone,
	"created_by" uuid,
	"comment_thread" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ws_permissions_catalog" (
	"permission_code" varchar(60) PRIMARY KEY NOT NULL,
	"description" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ws_roles" (
	"role_id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(60) NOT NULL,
	"tenant_id" uuid,
	"scope_level" "ws_role_scope" NOT NULL,
	"default_perms" jsonb NOT NULL,
	CONSTRAINT "uk_role_tenant_name" UNIQUE("tenant_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ws_tenants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"code" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"external_ref" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ws_tenants_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ws_user_memberships" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"user_uuid" uuid NOT NULL,
	"tenant_id" uuid,
	"node_id" uuid,
	"role_id" uuid NOT NULL,
	"custom_perms" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_closure" ADD CONSTRAINT "content_closure_ancestor_id_content_nodes_node_id_fk" FOREIGN KEY ("ancestor_id") REFERENCES "public"."content_nodes"("node_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_closure" ADD CONSTRAINT "content_closure_descendant_id_content_nodes_node_id_fk" FOREIGN KEY ("descendant_id") REFERENCES "public"."content_nodes"("node_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_nodes" ADD CONSTRAINT "content_nodes_tenant_id_ws_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ws_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_nodes" ADD CONSTRAINT "content_nodes_media_kind_id_media_kind_id_fk" FOREIGN KEY ("media_kind_id") REFERENCES "public"."media_kind"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media_kind" ADD CONSTRAINT "media_kind_media_class_id_media_class_id_fk" FOREIGN KEY ("media_class_id") REFERENCES "public"."media_class"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_activity" ADD CONSTRAINT "task_activity_task_id_tasks_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("task_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_contributor" ADD CONSTRAINT "task_contributor_task_id_tasks_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("task_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_ws_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ws_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_node_id_content_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."content_nodes"("node_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_type_id_task_type_id_fk" FOREIGN KEY ("task_type_id") REFERENCES "public"."task_type"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_id_task_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."task_status"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_priority_id_task_priority_id_fk" FOREIGN KEY ("priority_id") REFERENCES "public"."task_priority"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_role_ws_roles_role_id_fk" FOREIGN KEY ("assigned_to_role") REFERENCES "public"."ws_roles"("role_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ws_roles" ADD CONSTRAINT "ws_roles_tenant_id_ws_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ws_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ws_user_memberships" ADD CONSTRAINT "ws_user_memberships_tenant_id_ws_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."ws_tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ws_user_memberships" ADD CONSTRAINT "ws_user_memberships_node_id_content_nodes_node_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."content_nodes"("node_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ws_user_memberships" ADD CONSTRAINT "ws_user_memberships_role_id_ws_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."ws_roles"("role_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
