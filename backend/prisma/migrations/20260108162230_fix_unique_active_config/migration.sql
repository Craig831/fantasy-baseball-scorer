-- Drop the overly broad unique constraint
-- This constraint prevented multiple inactive configs per user, which is undesirable
DROP INDEX IF EXISTS "scoring_configurations_user_id_is_active_key";

-- Create a partial unique index that only enforces uniqueness when is_active = true
-- This allows multiple inactive configs per user, but only one active config per user
-- PostgreSQL partial indexes are perfect for "only one active record" scenarios
CREATE UNIQUE INDEX "unique_active_config"
ON "scoring_configurations"("user_id")
WHERE "is_active" = true;
