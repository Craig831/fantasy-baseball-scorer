import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TeamData {
  mlbTeamId: number;
  name: string;
  abbreviation: string;
  league: string;
  division: string;
}

// MLB teams data with league and division information
const MLB_TEAMS: TeamData[] = [
  // American League East
  { mlbTeamId: 110, name: 'Baltimore Orioles', abbreviation: 'BAL', league: 'AL', division: 'East' },
  { mlbTeamId: 111, name: 'Boston Red Sox', abbreviation: 'BOS', league: 'AL', division: 'East' },
  { mlbTeamId: 147, name: 'New York Yankees', abbreviation: 'NYY', league: 'AL', division: 'East' },
  { mlbTeamId: 139, name: 'Tampa Bay Rays', abbreviation: 'TB', league: 'AL', division: 'East' },
  { mlbTeamId: 141, name: 'Toronto Blue Jays', abbreviation: 'TOR', league: 'AL', division: 'East' },

  // American League Central
  { mlbTeamId: 145, name: 'Chicago White Sox', abbreviation: 'CWS', league: 'AL', division: 'Central' },
  { mlbTeamId: 114, name: 'Cleveland Guardians', abbreviation: 'CLE', league: 'AL', division: 'Central' },
  { mlbTeamId: 116, name: 'Detroit Tigers', abbreviation: 'DET', league: 'AL', division: 'Central' },
  { mlbTeamId: 118, name: 'Kansas City Royals', abbreviation: 'KC', league: 'AL', division: 'Central' },
  { mlbTeamId: 142, name: 'Minnesota Twins', abbreviation: 'MIN', league: 'AL', division: 'Central' },

  // American League West
  { mlbTeamId: 117, name: 'Houston Astros', abbreviation: 'HOU', league: 'AL', division: 'West' },
  { mlbTeamId: 108, name: 'Los Angeles Angels', abbreviation: 'LAA', league: 'AL', division: 'West' },
  { mlbTeamId: 133, name: 'Oakland Athletics', abbreviation: 'OAK', league: 'AL', division: 'West' },
  { mlbTeamId: 136, name: 'Seattle Mariners', abbreviation: 'SEA', league: 'AL', division: 'West' },
  { mlbTeamId: 140, name: 'Texas Rangers', abbreviation: 'TEX', league: 'AL', division: 'West' },

  // National League East
  { mlbTeamId: 144, name: 'Atlanta Braves', abbreviation: 'ATL', league: 'NL', division: 'East' },
  { mlbTeamId: 146, name: 'Miami Marlins', abbreviation: 'MIA', league: 'NL', division: 'East' },
  { mlbTeamId: 121, name: 'New York Mets', abbreviation: 'NYM', league: 'NL', division: 'East' },
  { mlbTeamId: 143, name: 'Philadelphia Phillies', abbreviation: 'PHI', league: 'NL', division: 'East' },
  { mlbTeamId: 120, name: 'Washington Nationals', abbreviation: 'WSH', league: 'NL', division: 'East' },

  // National League Central
  { mlbTeamId: 112, name: 'Chicago Cubs', abbreviation: 'CHC', league: 'NL', division: 'Central' },
  { mlbTeamId: 113, name: 'Cincinnati Reds', abbreviation: 'CIN', league: 'NL', division: 'Central' },
  { mlbTeamId: 158, name: 'Milwaukee Brewers', abbreviation: 'MIL', league: 'NL', division: 'Central' },
  { mlbTeamId: 134, name: 'Pittsburgh Pirates', abbreviation: 'PIT', league: 'NL', division: 'Central' },
  { mlbTeamId: 138, name: 'St. Louis Cardinals', abbreviation: 'STL', league: 'NL', division: 'Central' },

  // National League West
  { mlbTeamId: 109, name: 'Arizona Diamondbacks', abbreviation: 'ARI', league: 'NL', division: 'West' },
  { mlbTeamId: 115, name: 'Colorado Rockies', abbreviation: 'COL', league: 'NL', division: 'West' },
  { mlbTeamId: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', league: 'NL', division: 'West' },
  { mlbTeamId: 135, name: 'San Diego Padres', abbreviation: 'SD', league: 'NL', division: 'West' },
  { mlbTeamId: 137, name: 'San Francisco Giants', abbreviation: 'SF', league: 'NL', division: 'West' },
];

async function seedTeams() {
  console.log('Starting team seeding...');

  try {
    for (const teamData of MLB_TEAMS) {
      await prisma.team.upsert({
        where: { mlbTeamId: teamData.mlbTeamId },
        update: {
          name: teamData.name,
          abbreviation: teamData.abbreviation,
          league: teamData.league,
          division: teamData.division,
        },
        create: teamData,
      });
    }

    console.log(`✅ Successfully seeded ${MLB_TEAMS.length} MLB teams`);

    // Display summary
    const alCount = await prisma.team.count({ where: { league: 'AL' } });
    const nlCount = await prisma.team.count({ where: { league: 'NL' } });
    console.log(`   - American League: ${alCount} teams`);
    console.log(`   - National League: ${nlCount} teams`);
  } catch (error) {
    console.error('Error seeding teams:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTeams();
