-- Migration: Refresh tokens, login attempts, invites, custom domain, slug blocklist support
-- تک سطحی جدید: moristyle.nobatet.com به جای moristyle.business.nobatet.com

-- 1. Add custom domain columns to businesses
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain" varchar(120);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "custom_domain_verified" boolean DEFAULT false NOT NULL;

-- 2. Refresh tokens table for short-lived access + rotation
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" varchar(128) NOT NULL UNIQUE,
  "jti" varchar(64) NOT NULL UNIQUE,
  "is_revoked" boolean DEFAULT false NOT NULL,
  "replaced_by_token_id" uuid,
  "ip_address" varchar(64),
  "user_agent" text,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone
);
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_idx" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_expires_at_idx" ON "refresh_tokens" ("expires_at");

-- 3. Login attempts audit
CREATE TABLE IF NOT EXISTS "login_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "phone" varchar(11),
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "success" boolean DEFAULT false NOT NULL,
  "method" varchar(20) DEFAULT 'otp' NOT NULL,
  "ip_address" varchar(64),
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "login_attempts_phone_idx" ON "login_attempts" ("phone");
CREATE INDEX IF NOT EXISTS "login_attempts_user_id_idx" ON "login_attempts" ("user_id");

-- 4. Business invites for granular RBAC
CREATE TABLE IF NOT EXISTS "business_invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "email_or_phone" varchar(100) NOT NULL,
  "role" varchar(20) DEFAULT 'staff' NOT NULL,
  "token" varchar(128) NOT NULL UNIQUE,
  "invited_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "is_accepted" boolean DEFAULT false NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "business_invites_business_id_idx" ON "business_invites" ("business_id");
CREATE INDEX IF NOT EXISTS "business_invites_token_idx" ON "business_invites" ("token");

-- 5. Comment: slug uniqueness across businesses and visitors is enforced at app level for single-level *.nobatet.com
-- No DB constraint needed, but we add comment
COMMENT ON COLUMN "businesses"."slug" IS 'Single-level tenant slug like moristyle -> moristyle.nobatet.com (new) instead of moristyle.business.nobatet.com (old nested)';
COMMENT ON COLUMN "businesses"."custom_domain" IS 'BYO domain like salon.com or app.salon.com';
