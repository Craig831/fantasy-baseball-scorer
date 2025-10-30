import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { MlbPeopleResponseDto } from './dto/mlb-player.dto';
import { MlbStatsResponseDto } from './dto/mlb-stats.dto';

@Injectable()
export class MlbStatsService {
  private readonly logger = new Logger(MlbStatsService.name);
  private readonly baseUrl = 'https://statsapi.mlb.com/api/v1';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetch all MLB players for a given season
   * @param season The season year (e.g., 2024)
   * @returns List of players
   */
  async fetchPlayers(season: number): Promise<MlbPeopleResponseDto> {
    try {
      this.logger.log(`Fetching players for season ${season}`);

      // MLB-StatsAPI endpoint for players by season
      const url = `${this.baseUrl}/sports/1/players?season=${season}`;

      const response = await firstValueFrom(
        this.httpService.get<MlbPeopleResponseDto>(url),
      );

      this.logger.log(`Fetched ${response.data.people?.length || 0} players for season ${season}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError, 'fetchPlayers');
    }
  }

  /**
   * Fetch a specific player by ID
   * @param playerId MLB player ID
   * @returns Player details
   */
  async fetchPlayer(playerId: number): Promise<MlbPeopleResponseDto> {
    try {
      this.logger.log(`Fetching player ${playerId}`);

      const url = `${this.baseUrl}/people/${playerId}`;

      const response = await firstValueFrom(
        this.httpService.get<MlbPeopleResponseDto>(url),
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError, 'fetchPlayer');
    }
  }

  /**
   * Search players by name
   * @param name Player name to search
   * @returns Matching players
   */
  async searchPlayers(name: string): Promise<MlbPeopleResponseDto> {
    try {
      this.logger.log(`Searching players by name: ${name}`);

      const url = `${this.baseUrl}/people/search?names=${encodeURIComponent(name)}`;

      const response = await firstValueFrom(
        this.httpService.get<MlbPeopleResponseDto>(url),
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError, 'searchPlayers');
    }
  }

  /**
   * Fetch player statistics for a season
   * @param playerId MLB player ID
   * @param season Season year
   * @param statGroup 'hitting' or 'pitching'
   * @returns Player statistics
   */
  async fetchPlayerStats(
    playerId: number,
    season: number,
    statGroup: 'hitting' | 'pitching' = 'hitting',
  ): Promise<MlbStatsResponseDto> {
    try {
      this.logger.log(`Fetching ${statGroup} stats for player ${playerId}, season ${season}`);

      const url = `${this.baseUrl}/people/${playerId}/stats?stats=season&season=${season}&group=${statGroup}`;

      const response = await firstValueFrom(
        this.httpService.get<MlbStatsResponseDto>(url),
      );

      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError, 'fetchPlayerStats');
    }
  }

  /**
   * Handle API errors with proper logging and exception throwing
   * @param error Axios error
   * @param method Method name for logging
   */
  private handleApiError(error: AxiosError, method: string): never {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.response?.data || error.message;

    this.logger.error(
      `MLB API error in ${method}: ${status} - ${JSON.stringify(message)}`,
    );

    throw new HttpException(
      {
        statusCode: status,
        message: `MLB API error: ${error.message}`,
        error: 'MLB_API_ERROR',
      },
      status,
    );
  }
}
