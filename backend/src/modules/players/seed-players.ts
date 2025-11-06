/**
 * Data seeding script to populate Player table from MLB-StatsAPI
 *
 * Usage: npx ts-node src/modules/players/seed-players.ts [season]
 * Example: npx ts-node src/modules/players/seed-players.ts 2024
 */

import { PrismaClient } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MlbPeopleResponseDto, MlbPlayerDto } from '../mlb-stats/dto/mlb-player.dto';

const prisma = new PrismaClient();
const httpService = new HttpService();
const MLB_API_BASE_URL = 'https://statsapi.mlb.com/api/v1';

interface PlayerSeedStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Team name mapping cache
let teamNameToIdMap: Map<string, string> | null = null;

/**
 * Load teams from database and create name -> ID mapping
 */
async function loadTeamMapping(): Promise<Map<string, string>> {
  if (teamNameToIdMap) {
    return teamNameToIdMap;
  }

  const teams = await prisma.team.findMany({
    select: { id: true, name: true },
  });

  teamNameToIdMap = new Map(teams.map(t => [t.name, t.id]));
  console.log(`Loaded ${teamNameToIdMap.size} teams from database`);

  return teamNameToIdMap;
}

/**
 * Fetch all players from MLB-StatsAPI for a given season
 */
async function fetchMlbPlayers(season: number): Promise<MlbPlayerDto[]> {
  console.log(`Fetching players from MLB-StatsAPI for season ${season}...`);

  try {
    const url = `${MLB_API_BASE_URL}/sports/1/players?season=${season}`;
    const response = await firstValueFrom(
      httpService.get<MlbPeopleResponseDto>(url),
    );

    const players = response.data.people || [];
    console.log(`Fetched ${players.length} players from MLB API`);
    return players;
  } catch (error) {
    console.error('Error fetching players from MLB API:', error.message);
    throw error;
  }
}

/**
 * Seed a single player into the database
 */
async function seedPlayer(
  mlbPlayer: MlbPlayerDto,
  season: number,
  teamMap: Map<string, string>,
): Promise<'created' | 'updated' | 'skipped'> {
  try {
    // Extract player data
    const mlbPlayerId = mlbPlayer.id;
    const name = mlbPlayer.fullName;
    const teamName = mlbPlayer.currentTeam?.name;
    const position = mlbPlayer.primaryPosition?.abbreviation || mlbPlayer.primaryPosition?.code || 'UTIL';
    const status = mlbPlayer.active ? 'active' : 'inactive';
    const jerseyNumber = mlbPlayer.primaryNumber ? parseInt(mlbPlayer.primaryNumber, 10) : null;

    // Find team ID from team name
    const teamId = teamName ? teamMap.get(teamName) : null;

    if (!teamId) {
      // Skip players without a valid team (free agents, etc.)
      return 'skipped';
    }

    // Check if player already exists
    const existing = await prisma.player.findUnique({
      where: { mlbPlayerId },
    });

    if (existing) {
      // Update existing player
      await prisma.player.update({
        where: { mlbPlayerId },
        data: {
          name,
          teamId,
          position,
          status,
          jerseyNumber,
          season,
          lastUpdated: new Date(),
        },
      });
      return 'updated';
    } else {
      // Create new player
      await prisma.player.create({
        data: {
          mlbPlayerId,
          name,
          teamId,
          position,
          status,
          jerseyNumber,
          season,
        },
      });
      return 'created';
    }
  } catch (error) {
    console.error(`Error seeding player ${mlbPlayer.id} (${mlbPlayer.fullName}):`, error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedPlayers(season: number): Promise<void> {
  console.log('='.repeat(60));
  console.log('MLB Player Data Seeding Script');
  console.log('='.repeat(60));
  console.log(`Season: ${season}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  const stats: PlayerSeedStats = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Load team mapping
    const teamMap = await loadTeamMapping();

    // Fetch players from MLB API
    const mlbPlayers = await fetchMlbPlayers(season);
    stats.total = mlbPlayers.length;

    console.log(`\nSeeding ${stats.total} players into database...\n`);

    // Seed each player
    for (let i = 0; i < mlbPlayers.length; i++) {
      const mlbPlayer = mlbPlayers[i];

      try {
        const result = await seedPlayer(mlbPlayer, season, teamMap);

        if (result === 'created') {
          stats.created++;
        } else if (result === 'updated') {
          stats.updated++;
        } else {
          stats.skipped++;
        }

        // Progress indicator
        if ((i + 1) % 100 === 0) {
          console.log(`Progress: ${i + 1}/${stats.total} players processed`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`Failed to seed player ${mlbPlayer.id}: ${error.message}`);
      }
    }

    // Final statistics
    console.log('\n' + '='.repeat(60));
    console.log('Seeding Complete');
    console.log('='.repeat(60));
    console.log(`Total players: ${stats.total}`);
    console.log(`Created: ${stats.created}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Finished at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\nFatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const season = args[0] ? parseInt(args[0], 10) : new Date().getFullYear();

if (isNaN(season) || season < 1900 || season > 2100) {
  console.error('Invalid season provided. Usage: npx ts-node seed-players.ts [season]');
  process.exit(1);
}

// Run seeding
seedPlayers(season)
  .then(() => {
    console.log('\n✓ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Seeding failed:', error);
    process.exit(1);
  });
