import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ScoringConfigsModule } from './modules/scoring-configs/scoring-configs.module';
import { PlayersModule } from './modules/players/players.module';
import { PlayerResearchModule } from './modules/player-research/player-research.module';
import { MlbStatsModule } from './modules/mlb-stats/mlb-stats.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ScoringConfigsModule,
    MlbStatsModule,
    PlayersModule,
    PlayerResearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
