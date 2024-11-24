CREATE TYPE "workflowautomation"."activity_enums" AS ENUM('idle', 'running', 'success', 'failure', 'aborted', 'skipped', 'paused', 'pending');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."applications_workflows" (
	"application_id" text NOT NULL,
	"workflow_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."workflows" (
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."workflows_steps" (
	"workflow_id" text NOT NULL,
	"step_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."steps" (
	"name" text NOT NULL,
	"token" text NOT NULL,
	"previous_step_id" text,
	"owner_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."steps_tasks" (
	"step_id" text NOT NULL,
	"task_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."tasks" (
	"name" text NOT NULL,
	"token" text NOT NULL,
	"owner_id" text NOT NULL,
	"previous_task_id" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."activity_logs" (
	"previous_activity_log_id" text,
	"application_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"step_id" text NOT NULL,
	"task_id" text NOT NULL,
	"status" "workflowautomation"."activity_enums" DEFAULT 'idle' NOT NULL,
	"duration" integer DEFAULT 0,
	"output" jsonb DEFAULT 'null'::jsonb,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."applications_workflows" ADD CONSTRAINT "applications_workflows_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "workflowautomation"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."applications_workflows" ADD CONSTRAINT "applications_workflows_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflowautomation"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."workflows" ADD CONSTRAINT "workflows_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."workflows_steps" ADD CONSTRAINT "workflows_steps_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflowautomation"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."workflows_steps" ADD CONSTRAINT "workflows_steps_step_id_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "workflowautomation"."steps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."steps" ADD CONSTRAINT "steps_previous_step_id_steps_id_fk" FOREIGN KEY ("previous_step_id") REFERENCES "workflowautomation"."steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."steps" ADD CONSTRAINT "steps_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."steps_tasks" ADD CONSTRAINT "steps_tasks_step_id_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "workflowautomation"."steps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."steps_tasks" ADD CONSTRAINT "steps_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "workflowautomation"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."tasks" ADD CONSTRAINT "tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."tasks" ADD CONSTRAINT "tasks_previous_task_id_tasks_id_fk" FOREIGN KEY ("previous_task_id") REFERENCES "workflowautomation"."tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."activity_logs" ADD CONSTRAINT "activity_logs_previous_activity_log_id_activity_logs_id_fk" FOREIGN KEY ("previous_activity_log_id") REFERENCES "workflowautomation"."activity_logs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."activity_logs" ADD CONSTRAINT "activity_logs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "workflowautomation"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."activity_logs" ADD CONSTRAINT "activity_logs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "workflowautomation"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."activity_logs" ADD CONSTRAINT "activity_logs_step_id_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "workflowautomation"."steps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."activity_logs" ADD CONSTRAINT "activity_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "workflowautomation"."tasks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
