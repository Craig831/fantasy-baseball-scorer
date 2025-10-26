import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fantasy_baseball',
}));
