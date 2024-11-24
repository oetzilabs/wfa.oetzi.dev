CREATE SCHEMA "workflowautomation";
--> statement-breakpoint
CREATE TYPE "workflowautomation"."mailbouncer_type" AS ENUM('Transient.General', 'Transient.AttachmentRejected', 'Transient.MailboxFull', 'Transient.MessageTooLarge', 'Transient.ContentRejected', 'Transient.RecipientThrottled', 'Permanent.General', 'Permanent.NoEmailAddress', 'Permanent.Suppressed', 'Permanent.MailboxDoesNotExist', 'Permanent.MailboxUnavailable', 'Permanent.MessageContentRejected', 'Permanent.MessageRejected', 'Undetermined');--> statement-breakpoint
CREATE TYPE "workflowautomation"."mailcomplaint_type" AS ENUM('Spam', 'Abuse', 'Other', 'Unknown');--> statement-breakpoint
CREATE TYPE "workflowautomation"."document_status" AS ENUM('uploaded', 'in_process', 'completed', 'errored');--> statement-breakpoint
CREATE TYPE "workflowautomation"."activity_enums" AS ENUM('idle', 'running', 'success', 'failure', 'aborted', 'skipped', 'paused', 'pending');--> statement-breakpoint
CREATE TYPE "workflowautomation"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "workflowautomation"."client_role" AS ENUM('web:admin', 'web:member', 'app:admin', 'app:member');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."mailbouncer" (
	"email" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"type" "workflowautomation"."mailbouncer_type" NOT NULL,
	"t" text NOT NULL,
	"st" text NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."mailcomplaint" (
	"email" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"type" "workflowautomation"."mailcomplaint_type" NOT NULL,
	"t" text NOT NULL,
	"complaintTimestamp" timestamp NOT NULL,
	"feedbackId" text NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."users" (
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text,
	"verified_at" timestamp with time zone,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"user_id" varchar NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"access_token" text,
	"organization_id" text,
	"application_id" text,
	"browser" text,
	"ip" text,
	"fingerprint" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."folders" (
	"foldername" text NOT NULL,
	"path" text NOT NULL,
	"parent_folder_id" text,
	"app_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."documents" (
	"name" text NOT NULL,
	"filepath" text NOT NULL,
	"folder_id" text NOT NULL,
	"hash" text,
	"status" "workflowautomation"."document_status" DEFAULT 'uploaded',
	"app_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."applications" (
	"name" text NOT NULL,
	"description" text,
	"token" text NOT NULL,
	"owner_id" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
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
	"run_by_user_id" text NOT NULL,
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
CREATE TABLE IF NOT EXISTS "workflowautomation"."verifications" (
	"owner_id" text NOT NULL,
	"code" text NOT NULL,
	"status" "workflowautomation"."verification_status" DEFAULT 'pending' NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."organizations" (
	"owner_id" text,
	"name" text NOT NULL,
	"website" text,
	"email" text,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."user_organizations" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp with time zone,
	CONSTRAINT "user_organization_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."customer_payments" (
	"owner_id" text NOT NULL,
	"charge" numeric DEFAULT '0.0' NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."system_notifications" (
	"title" text NOT NULL,
	"message" text,
	"action" json DEFAULT '{"type":"hide","label":"Close"}'::json,
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workflowautomation"."user_hidden_system_notifications" (
	"user_id" text NOT NULL,
	"system_notification_id" text NOT NULL,
	CONSTRAINT "user_hidden_system_notification_pk" PRIMARY KEY("user_id","system_notification_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."folders" ADD CONSTRAINT "folders_parent_folder_id_folders_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "workflowautomation"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."folders" ADD CONSTRAINT "folders_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "workflowautomation"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."folders" ADD CONSTRAINT "folders_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."documents" ADD CONSTRAINT "documents_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "workflowautomation"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."documents" ADD CONSTRAINT "documents_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "workflowautomation"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."documents" ADD CONSTRAINT "documents_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."applications" ADD CONSTRAINT "applications_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
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
 ALTER TABLE "workflowautomation"."activity_logs" ADD CONSTRAINT "activity_logs_run_by_user_id_users_id_fk" FOREIGN KEY ("run_by_user_id") REFERENCES "workflowautomation"."users"("id") ON DELETE no action ON UPDATE no action;
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
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."verifications" ADD CONSTRAINT "verifications_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."user_organizations" ADD CONSTRAINT "user_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."user_organizations" ADD CONSTRAINT "user_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "workflowautomation"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."customer_payments" ADD CONSTRAINT "customer_payments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."user_hidden_system_notifications" ADD CONSTRAINT "user_hidden_system_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "workflowautomation"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "workflowautomation"."user_hidden_system_notifications" ADD CONSTRAINT "user_hidden_system_notifications_system_notification_id_system_notifications_id_fk" FOREIGN KEY ("system_notification_id") REFERENCES "workflowautomation"."system_notifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
