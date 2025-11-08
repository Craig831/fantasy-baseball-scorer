-- AlterTable: Update Player model for player research
-- WARNING: This is a breaking change. Existing player data may need to be migrated or dropped.

-- Drop existing constraints and indices that conflict
DROP INDEX IF EXISTS "idx_players_team_position";
DROP INDEX IF EXISTS "idx_players_active_season";
DROP INDEX IF EXISTS "idx_players_synced_at";

-- Add new columns to players table
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "mlb_player_id" INTEGER;
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'active';
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "last_updated" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Modify existing columns
ALTER TABLE "players" ALTER COLUMN "team" TYPE VARCHAR(50);

-- Drop old columns if they exist
ALTER TABLE "players" DROP COLUMN IF EXISTS "active";
ALTER TABLE "players" DROP COLUMN IF EXISTS "synced_at";

-- Add unique constraint on mlb_player_id (after data cleanup if needed)
CREATE UNIQUE INDEX IF NOT EXISTS "players_mlb_player_id_key" ON "players"("mlb_player_id") WHERE "mlb_player_id" IS NOT NULL;

-- Add new indices
CREATE INDEX IF NOT EXISTS "idx_players_position" ON "players"("position");
CREATE INDEX IF NOT EXISTS "idx_players_team" ON "players"("team");
CREATE INDEX IF NOT EXISTS "idx_players_status" ON "players"("status");
CREATE INDEX IF NOT EXISTS "idx_players_position_team" ON "players"("position", "team");
CREATE INDEX IF NOT EXISTS "idx_players_season" ON "players"("season");

-- AlterTable: Update PlayerStatistic model for player research
-- Drop existing unique constraint
ALTER TABLE "player_statistics" DROP CONSTRAINT IF EXISTS "unique_player_game";

-- Drop existing indices
DROP INDEX IF EXISTS "idx_player_stats_player_date";
DROP INDEX IF EXISTS "idx_player_stats_season_total";

-- Add new columns
ALTER TABLE "player_statistics" ADD COLUMN IF NOT EXISTS "season" INTEGER;
ALTER TABLE "player_statistics" ADD COLUMN IF NOT EXISTS "statistic_type" VARCHAR(20);
ALTER TABLE "player_statistics" ADD COLUMN IF NOT EXISTS "statistics" JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "player_statistics" ADD COLUMN IF NOT EXISTS "date_from" DATE;
ALTER TABLE "player_statistics" ADD COLUMN IF NOT EXISTS "date_to" DATE;

-- Drop old columns
ALTER TABLE "player_statistics" DROP COLUMN IF EXISTS "stat_date";
ALTER TABLE "player_statistics" DROP COLUMN IF EXISTS "opponent";
ALTER TABLE "player_statistics" DROP COLUMN IF EXISTS "is_season_total";
ALTER TABLE "player_statistics" DROP COLUMN IF EXISTS "batting_stats";
ALTER TABLE "player_statistics" DROP COLUMN IF EXISTS "pitching_stats";

-- Add new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_player_season_stats" ON "player_statistics"("player_id", "season", "statistic_type", "date_from", "date_to");

-- Add new indices
CREATE INDEX IF NOT EXISTS "idx_player_stats_player_id" ON "player_statistics"("player_id");
CREATE INDEX IF NOT EXISTS "idx_player_stats_season" ON "player_statistics"("season");
CREATE INDEX IF NOT EXISTS "idx_player_stats_dates" ON "player_statistics"("date_from", "date_to");

-- CreateTable: SavedSearch
CREATE TABLE IF NOT EXISTS "saved_searches" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "filters" JSONB NOT NULL,
    "scoring_configuration_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: SavedSearch indices and constraints
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_search_name" ON "saved_searches"("user_id", "name");
CREATE INDEX IF NOT EXISTS "idx_saved_searches_user_id" ON "saved_searches"("user_id");

-- AddForeignKey: SavedSearch relations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_user_id_fkey') THEN
        ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_searches_scoring_configuration_id_fkey') THEN
        ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_scoring_configuration_id_fkey"
        FOREIGN KEY ("scoring_configuration_id") REFERENCES "scoring_configurations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
