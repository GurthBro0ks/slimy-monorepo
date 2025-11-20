-- AlterTable
-- Add role column to users table with default value "user"
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- Comment on the role column
COMMENT ON COLUMN "users"."role" IS 'User role for RBAC: user, mod, or admin';
