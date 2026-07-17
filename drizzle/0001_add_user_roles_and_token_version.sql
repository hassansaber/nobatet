CREATE TYPE "public"."global_role" AS ENUM('super_admin', 'visitor');--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "global_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"amount" integer NOT NULL,
	"category" varchar(40) DEFAULT 'other' NOT NULL,
	"description" text,
	"expense_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"phone" varchar(11) NOT NULL,
	"pattern" varchar(40) NOT NULL,
	"body_id" varchar(40),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"provider_ref" varchar(120),
	"cost" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plans" ALTER COLUMN "features" SET DEFAULT '{"crm":false,"loyalty":false,"reports":false,"customTheme":false,"cardToCard":true,"gateway":true,"smsReminders":false,"customDomain":false,"expenses":false,"qrCode":true,"advancedCharts":false}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "business_members" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "gallery_urls" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "latitude" varchar(32);--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "longitude" varchar(32);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transfer_code" varchar(80);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transfer_note" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "long_description" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "price_3months" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "max_sms_per_month" integer;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "tier" varchar(20) DEFAULT 'base' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_unique" ON "user_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "expenses_business_idx" ON "expenses" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "sms_logs_business_idx" ON "sms_logs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "sms_logs_created_idx" ON "sms_logs" USING btree ("created_at");--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role") SELECT "id", 'super_admin' FROM "users" WHERE "role" = 'super_admin' ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role") SELECT "user_id", 'visitor' FROM "visitors" ON CONFLICT DO NOTHING;