/**
 * Database seed file for development and testing
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuration
const BCRYPT_ROUNDS = 10;
const CURRENT_SEASON = new Date().getFullYear();

// Sample password for all test users: "Password123!"
const TEST_PASSWORD = 'Password123!';

/**
 * Seed test users
 */
async function seedUsers() {
  console.log('Seeding users...');

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`  ↳ Skipping: ${existingUsers} users already exist`);
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, BCRYPT_ROUNDS);

  const users = [
    {
      email: 'admin@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'john.doe@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'jane.smith@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP', // Example TOTP secret
    },
    {
      email: 'mike.johnson@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'sarah.williams@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'david.brown@example.com',
      passwordHash,
      emailVerified: false,
      emailVerificationToken: 'test-verification-token-123',
      mfaEnabled: false,
    },
    {
      email: 'emily.davis@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'chris.martinez@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'lisa.garcia@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
    {
      email: 'robert.rodriguez@example.com',
      passwordHash,
      emailVerified: true,
      mfaEnabled: false,
    },
  ];

  await prisma.user.createMany({ data: users });
  console.log(`  ✓ Created ${users.length} users`);
}

/**
 * Seed MLB teams
 */
async function seedTeams() {
  console.log('Seeding teams...');

  const existingTeams = await prisma.team.count();
  if (existingTeams > 0) {
    console.log(`  ↳ Skipping: ${existingTeams} teams already exist`);
    return;
  }

  const teams = [
    // AL East
    { mlbTeamId: 147, name: 'New York Yankees', abbreviation: 'NYY', league: 'AL', division: 'East' },
    { mlbTeamId: 110, name: 'Baltimore Orioles', abbreviation: 'BAL', league: 'AL', division: 'East' },
    { mlbTeamId: 111, name: 'Boston Red Sox', abbreviation: 'BOS', league: 'AL', division: 'East' },
    { mlbTeamId: 139, name: 'Tampa Bay Rays', abbreviation: 'TB', league: 'AL', division: 'East' },
    { mlbTeamId: 141, name: 'Toronto Blue Jays', abbreviation: 'TOR', league: 'AL', division: 'East' },

    // AL Central
    { mlbTeamId: 114, name: 'Cleveland Guardians', abbreviation: 'CLE', league: 'AL', division: 'Central' },
    { mlbTeamId: 142, name: 'Minnesota Twins', abbreviation: 'MIN', league: 'AL', division: 'Central' },
    { mlbTeamId: 145, name: 'Chicago White Sox', abbreviation: 'CWS', league: 'AL', division: 'Central' },
    { mlbTeamId: 116, name: 'Detroit Tigers', abbreviation: 'DET', league: 'AL', division: 'Central' },
    { mlbTeamId: 118, name: 'Kansas City Royals', abbreviation: 'KC', league: 'AL', division: 'Central' },

    // AL West
    { mlbTeamId: 117, name: 'Houston Astros', abbreviation: 'HOU', league: 'AL', division: 'West' },
    { mlbTeamId: 133, name: 'Oakland Athletics', abbreviation: 'OAK', league: 'AL', division: 'West' },
    { mlbTeamId: 136, name: 'Seattle Mariners', abbreviation: 'SEA', league: 'AL', division: 'West' },
    { mlbTeamId: 140, name: 'Texas Rangers', abbreviation: 'TEX', league: 'AL', division: 'West' },
    { mlbTeamId: 108, name: 'Los Angeles Angels', abbreviation: 'LAA', league: 'AL', division: 'West' },

    // NL East
    { mlbTeamId: 144, name: 'Atlanta Braves', abbreviation: 'ATL', league: 'NL', division: 'East' },
    { mlbTeamId: 121, name: 'New York Mets', abbreviation: 'NYM', league: 'NL', division: 'East' },
    { mlbTeamId: 143, name: 'Philadelphia Phillies', abbreviation: 'PHI', league: 'NL', division: 'East' },
    { mlbTeamId: 146, name: 'Miami Marlins', abbreviation: 'MIA', league: 'NL', division: 'East' },
    { mlbTeamId: 120, name: 'Washington Nationals', abbreviation: 'WSH', league: 'NL', division: 'East' },

    // NL Central
    { mlbTeamId: 158, name: 'Milwaukee Brewers', abbreviation: 'MIL', league: 'NL', division: 'Central' },
    { mlbTeamId: 112, name: 'Chicago Cubs', abbreviation: 'CHC', league: 'NL', division: 'Central' },
    { mlbTeamId: 113, name: 'Cincinnati Reds', abbreviation: 'CIN', league: 'NL', division: 'Central' },
    { mlbTeamId: 134, name: 'Pittsburgh Pirates', abbreviation: 'PIT', league: 'NL', division: 'Central' },
    { mlbTeamId: 138, name: 'St. Louis Cardinals', abbreviation: 'STL', league: 'NL', division: 'Central' },

    // NL West
    { mlbTeamId: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', league: 'NL', division: 'West' },
    { mlbTeamId: 135, name: 'San Diego Padres', abbreviation: 'SD', league: 'NL', division: 'West' },
    { mlbTeamId: 109, name: 'Arizona Diamondbacks', abbreviation: 'ARI', league: 'NL', division: 'West' },
    { mlbTeamId: 137, name: 'San Francisco Giants', abbreviation: 'SF', league: 'NL', division: 'West' },
    { mlbTeamId: 115, name: 'Colorado Rockies', abbreviation: 'COL', league: 'NL', division: 'West' },
  ];

  await prisma.team.createMany({ data: teams });
  console.log(`  ✓ Created ${teams.length} teams`);
}

/**
 * Seed scoring configurations for test users
 */
async function seedScoringConfigurations() {
  console.log('Seeding scoring configurations...');

  const existingConfigs = await prisma.scoringConfiguration.count();
  if (existingConfigs > 0) {
    console.log(`  ↳ Skipping: ${existingConfigs} configs already exist`);
    return;
  }

  const users = await prisma.user.findMany({ take: 3 });
  if (users.length === 0) {
    console.log('  ⚠ No users found, skipping scoring configurations');
    return;
  }

  const standardHittingCategories = {
    hitting: {
      runs: 1,
      hits: 1,
      doubles: 2,
      triples: 3,
      homeRuns: 4,
      rbi: 1,
      stolenBases: 2,
      walks: 1,
      strikeouts: -0.5,
      battingAverage: 10,
    },
    pitching: {
      wins: 5,
      losses: -3,
      saves: 5,
      strikeouts: 1,
      walks: -1,
      era: -10,
      whip: -10,
      inningsPitched: 3,
    },
  };

  const rotisserieCategories = {
    hitting: {
      runs: 1,
      homeRuns: 1,
      rbi: 1,
      stolenBases: 1,
      battingAverage: 1,
    },
    pitching: {
      wins: 1,
      saves: 1,
      strikeouts: 1,
      era: 1,
      whip: 1,
    },
  };

  const powerHitterCategories = {
    hitting: {
      homeRuns: 5,
      rbi: 2,
      sluggingPercentage: 15,
      extraBaseHits: 3,
      totalBases: 1,
    },
    pitching: {
      strikeouts: 2,
      wins: 4,
      qualityStarts: 5,
    },
  };

  const configs = [
    {
      userId: users[0].id,
      name: 'Standard Points',
      categories: standardHittingCategories,
      isActive: true,
    },
    {
      userId: users[0].id,
      name: 'Rotisserie League',
      categories: rotisserieCategories,
      isActive: false,
    },
    {
      userId: users[1].id,
      name: 'Power Hitter League',
      categories: powerHitterCategories,
      isActive: true,
    },
    {
      userId: users[2].id,
      name: 'Custom League',
      categories: standardHittingCategories,
      isActive: true,
    },
  ];

  await prisma.scoringConfiguration.createMany({ data: configs });
  console.log(`  ✓ Created ${configs.length} scoring configurations`);
}

/**
 * Seed MLB players
 */
async function seedPlayers() {
  console.log('Seeding players...');

  const existingPlayers = await prisma.player.count();
  if (existingPlayers > 0) {
    console.log(`  ↳ Skipping: ${existingPlayers} players already exist`);
    return;
  }

  const teams = await prisma.team.findMany();
  if (teams.length === 0) {
    console.log('  ⚠ No teams found, skipping players');
    return;
  }

  // Sample players (mix of real MLB player IDs and names)
  const playerData = [
    // Yankees
    { mlbPlayerId: 592450, name: 'Aaron Judge', position: 'OF', jerseyNumber: 99, teamAbbr: 'NYY' },
    { mlbPlayerId: 660271, name: 'Gerrit Cole', position: 'P', jerseyNumber: 45, teamAbbr: 'NYY' },
    { mlbPlayerId: 596115, name: 'Giancarlo Stanton', position: 'OF', jerseyNumber: 27, teamAbbr: 'NYY' },

    // Dodgers
    { mlbPlayerId: 660670, name: 'Mookie Betts', position: 'OF', jerseyNumber: 50, teamAbbr: 'LAD' },
    { mlbPlayerId: 605141, name: 'Freddie Freeman', position: '1B', jerseyNumber: 5, teamAbbr: 'LAD' },
    { mlbPlayerId: 624133, name: 'Clayton Kershaw', position: 'P', jerseyNumber: 22, teamAbbr: 'LAD' },

    // Astros
    { mlbPlayerId: 514888, name: 'Jose Altuve', position: '2B', jerseyNumber: 27, teamAbbr: 'HOU' },
    { mlbPlayerId: 608324, name: 'Alex Bregman', position: '3B', jerseyNumber: 2, teamAbbr: 'HOU' },
    { mlbPlayerId: 543760, name: 'Justin Verlander', position: 'P', jerseyNumber: 35, teamAbbr: 'HOU' },

    // Braves
    { mlbPlayerId: 645277, name: 'Ronald Acuña Jr.', position: 'OF', jerseyNumber: 13, teamAbbr: 'ATL' },
    { mlbPlayerId: 571448, name: 'Matt Olson', position: '1B', jerseyNumber: 28, teamAbbr: 'ATL' },
    { mlbPlayerId: 675911, name: 'Spencer Strider', position: 'P', jerseyNumber: 99, teamAbbr: 'ATL' },

    // Padres
    { mlbPlayerId: 665742, name: 'Fernando Tatis Jr.', position: 'OF', jerseyNumber: 23, teamAbbr: 'SD' },
    { mlbPlayerId: 630023, name: 'Manny Machado', position: '3B', jerseyNumber: 13, teamAbbr: 'SD' },
    { mlbPlayerId: 621111, name: 'Yu Darvish', position: 'P', jerseyNumber: 11, teamAbbr: 'SD' },

    // Blue Jays
    { mlbPlayerId: 665489, name: 'Vladimir Guerrero Jr.', position: '1B', jerseyNumber: 27, teamAbbr: 'TOR' },
    { mlbPlayerId: 645302, name: 'Bo Bichette', position: 'SS', jerseyNumber: 11, teamAbbr: 'TOR' },
    { mlbPlayerId: 592332, name: 'Kevin Gausman', position: 'P', jerseyNumber: 34, teamAbbr: 'TOR' },

    // Phillies
    { mlbPlayerId: 592804, name: 'Bryce Harper', position: 'OF', jerseyNumber: 3, teamAbbr: 'PHI' },
    { mlbPlayerId: 592663, name: 'Trea Turner', position: 'SS', jerseyNumber: 7, teamAbbr: 'PHI' },
    { mlbPlayerId: 592791, name: 'Zack Wheeler', position: 'P', jerseyNumber: 45, teamAbbr: 'PHI' },

    // Mets
    { mlbPlayerId: 624413, name: 'Pete Alonso', position: '1B', jerseyNumber: 20, teamAbbr: 'NYM' },
    { mlbPlayerId: 660271, name: 'Francisco Lindor', position: 'SS', jerseyNumber: 12, teamAbbr: 'NYM' },
    { mlbPlayerId: 592789, name: 'Edwin Díaz', position: 'P', jerseyNumber: 39, teamAbbr: 'NYM' },

    // Red Sox
    { mlbPlayerId: 646240, name: 'Rafael Devers', position: '3B', jerseyNumber: 11, teamAbbr: 'BOS' },
    { mlbPlayerId: 605480, name: 'Masataka Yoshida', position: 'OF', jerseyNumber: 7, teamAbbr: 'BOS' },

    // White Sox
    { mlbPlayerId: 677551, name: 'Luis Robert Jr.', position: 'OF', jerseyNumber: 88, teamAbbr: 'CWS' },

    // Guardians
    { mlbPlayerId: 666205, name: 'José Ramírez', position: '3B', jerseyNumber: 11, teamAbbr: 'CLE' },

    // Twins
    { mlbPlayerId: 516416, name: 'Carlos Correa', position: 'SS', jerseyNumber: 4, teamAbbr: 'MIN' },

    // Brewers
    { mlbPlayerId: 669257, name: 'Christian Yelich', position: 'OF', jerseyNumber: 22, teamAbbr: 'MIL' },

    // Cardinals
    { mlbPlayerId: 660162, name: 'Nolan Arenado', position: '3B', jerseyNumber: 28, teamAbbr: 'STL' },
    { mlbPlayerId: 571945, name: 'Paul Goldschmidt', position: '1B', jerseyNumber: 46, teamAbbr: 'STL' },

    // Cubs
    { mlbPlayerId: 682073, name: 'Christopher Morel', position: 'OF', jerseyNumber: 5, teamAbbr: 'CHC' },

    // Rangers
    { mlbPlayerId: 608070, name: 'Corey Seager', position: 'SS', jerseyNumber: 5, teamAbbr: 'TEX' },
    { mlbPlayerId: 605131, name: 'Marcus Semien', position: '2B', jerseyNumber: 2, teamAbbr: 'TEX' },

    // Mariners
    { mlbPlayerId: 666176, name: 'Julio Rodríguez', position: 'OF', jerseyNumber: 44, teamAbbr: 'SEA' },

    // Angels
    { mlbPlayerId: 660670, name: 'Mike Trout', position: 'OF', jerseyNumber: 27, teamAbbr: 'LAA' },
    { mlbPlayerId: 660271, name: 'Shohei Ohtani', position: 'DH', jerseyNumber: 17, teamAbbr: 'LAA' },
  ];

  // Create players with team relationships
  const players = [];
  for (const p of playerData) {
    const team = teams.find((t) => t.abbreviation === p.teamAbbr);
    if (team) {
      players.push({
        mlbPlayerId: p.mlbPlayerId,
        name: p.name,
        teamId: team.id,
        position: p.position,
        status: 'active',
        jerseyNumber: p.jerseyNumber,
        season: CURRENT_SEASON,
      });
    }
  }

  // Add 60 more generic players across various teams
  let mlbPlayerIdCounter = 700000;
  const positions = ['C', '1B', '2B', '3B', 'SS', 'OF', 'P', 'DH'];
  const firstNames = ['Jake', 'Tyler', 'Ryan', 'Matt', 'Josh', 'Nick', 'Kyle', 'Chris', 'Brandon', 'Daniel'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  for (let i = 0; i < 60 && players.length < 100; i++) {
    const team = teams[i % teams.length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];

    players.push({
      mlbPlayerId: mlbPlayerIdCounter++,
      name: `${firstName} ${lastName}`,
      teamId: team.id,
      position,
      status: 'active',
      jerseyNumber: Math.floor(Math.random() * 99) + 1,
      season: CURRENT_SEASON,
    });
  }

  await prisma.player.createMany({ data: players });
  console.log(`  ✓ Created ${players.length} players`);
}

/**
 * Seed player statistics for some players
 */
async function seedPlayerStatistics() {
  console.log('Seeding player statistics...');

  const existingStats = await prisma.playerStatistic.count();
  if (existingStats > 0) {
    console.log(`  ↳ Skipping: ${existingStats} statistics already exist`);
    return;
  }

  const players = await prisma.player.findMany({ take: 20 });
  if (players.length === 0) {
    console.log('  ⚠ No players found, skipping statistics');
    return;
  }

  const seasonStart = new Date(`${CURRENT_SEASON}-04-01`);
  const seasonEnd = new Date(`${CURRENT_SEASON}-09-30`);

  const statistics = [];

  for (const player of players) {
    const isHitter = !['P'].includes(player.position);

    if (isHitter) {
      // Hitting statistics
      statistics.push({
        playerId: player.id,
        season: CURRENT_SEASON,
        statisticType: 'season',
        statistics: {
          gamesPlayed: Math.floor(Math.random() * 50) + 100,
          atBats: Math.floor(Math.random() * 200) + 400,
          runs: Math.floor(Math.random() * 50) + 50,
          hits: Math.floor(Math.random() * 80) + 120,
          doubles: Math.floor(Math.random() * 20) + 20,
          triples: Math.floor(Math.random() * 5) + 2,
          homeRuns: Math.floor(Math.random() * 30) + 15,
          rbi: Math.floor(Math.random() * 50) + 50,
          stolenBases: Math.floor(Math.random() * 20) + 5,
          walks: Math.floor(Math.random() * 40) + 40,
          strikeouts: Math.floor(Math.random() * 80) + 80,
          battingAverage: (Math.random() * 0.1 + 0.25).toFixed(3),
          onBasePercentage: (Math.random() * 0.1 + 0.32).toFixed(3),
          sluggingPercentage: (Math.random() * 0.15 + 0.4).toFixed(3),
        },
        dateFrom: seasonStart,
        dateTo: seasonEnd,
      });
    } else {
      // Pitching statistics
      statistics.push({
        playerId: player.id,
        season: CURRENT_SEASON,
        statisticType: 'season',
        statistics: {
          gamesPlayed: Math.floor(Math.random() * 20) + 25,
          gamesStarted: Math.floor(Math.random() * 20) + 20,
          wins: Math.floor(Math.random() * 10) + 8,
          losses: Math.floor(Math.random() * 8) + 5,
          saves: Math.floor(Math.random() * 5),
          inningsPitched: (Math.random() * 50 + 150).toFixed(1),
          strikeouts: Math.floor(Math.random() * 100) + 150,
          walks: Math.floor(Math.random() * 30) + 30,
          earnedRuns: Math.floor(Math.random() * 40) + 40,
          era: (Math.random() * 2 + 2.5).toFixed(2),
          whip: (Math.random() * 0.3 + 1.0).toFixed(2),
        },
        dateFrom: seasonStart,
        dateTo: seasonEnd,
      });
    }
  }

  await prisma.playerStatistic.createMany({ data: statistics });
  console.log(`  ✓ Created ${statistics.length} player statistics`);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedUsers();
    await seedTeams();
    await seedScoringConfigurations();
    await seedPlayers();
    await seedPlayerStatistics();

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Teams: ${await prisma.team.count()}`);
    console.log(`   Scoring Configs: ${await prisma.scoringConfiguration.count()}`);
    console.log(`   Players: ${await prisma.player.count()}`);
    console.log(`   Player Statistics: ${await prisma.playerStatistic.count()}`);
    console.log('\n💡 Test login credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Password123!');
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
