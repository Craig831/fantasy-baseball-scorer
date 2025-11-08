/**
 * Lineups Controller
 * API endpoints for lineup management
 * All endpoints require JWT authentication
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LineupsService } from './lineups.service';
import { CreateLineupDto } from './dto/create-lineup.dto';
import { UpdateLineupDto } from './dto/update-lineup.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('lineups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lineups')
export class LineupsController {
  constructor(private readonly lineupsService: LineupsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new lineup',
    description: 'Creates a new lineup for the authenticated user. Lineups are NOT tied to scoring configurations - scores are calculated dynamically using the active config.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lineup created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async create(@CurrentUser() user: any, @Body() dto: CreateLineupDto) {
    const lineup = await this.lineupsService.create(user.id, dto);
    return {
      data: lineup,
      message: 'Lineup created successfully',
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List all lineups',
    description: 'Returns all non-deleted lineups for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Lineups retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async findAll(@CurrentUser() user: any) {
    const lineups = await this.lineupsService.findAll(user.id);
    return {
      data: lineups,
      count: lineups.length,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single lineup',
    description: 'Returns detailed lineup information including all slots, players, teams, and statistics',
  })
  @ApiParam({
    name: 'id',
    description: 'Lineup ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lineup retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this lineup',
  })
  @ApiResponse({
    status: 404,
    description: 'Lineup not found',
  })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const lineup = await this.lineupsService.findOne(id, user.id);
    return {
      data: lineup,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a lineup',
    description: 'Updates lineup name and/or slots. Validates constraints (max 25 players, no duplicates).',
  })
  @ApiParam({
    name: 'id',
    description: 'Lineup ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lineup updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this lineup',
  })
  @ApiResponse({
    status: 404,
    description: 'Lineup not found',
  })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLineupDto,
  ) {
    const lineup = await this.lineupsService.update(id, user.id, dto);
    return {
      data: lineup,
      message: 'Lineup updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a lineup',
    description: 'Soft deletes a lineup (sets deletedAt timestamp)',
  })
  @ApiParam({
    name: 'id',
    description: 'Lineup ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lineup deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this lineup',
  })
  @ApiResponse({
    status: 404,
    description: 'Lineup not found',
  })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.lineupsService.remove(id, user.id);
    return {
      message: 'Lineup deleted successfully',
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({
    summary: 'Duplicate a lineup',
    description: 'Creates a copy of an existing lineup with all its slots',
  })
  @ApiParam({
    name: 'id',
    description: 'Source lineup ID',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Lineup duplicated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this lineup',
  })
  @ApiResponse({
    status: 404,
    description: 'Lineup not found',
  })
  async duplicate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    const lineup = await this.lineupsService.duplicate(id, user.id, name);
    return {
      data: lineup,
      message: 'Lineup duplicated successfully',
    };
  }

  @Get(':id/score')
  @ApiOperation({
    summary: 'Calculate lineup score',
    description: 'Calculates lineup score using the user\'s active scoring configuration. Returns raw stats if no active config exists.',
  })
  @ApiParam({
    name: 'id',
    description: 'Lineup ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Score calculated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not own this lineup',
  })
  @ApiResponse({
    status: 404,
    description: 'Lineup not found',
  })
  async calculateScore(@CurrentUser() user: any, @Param('id') id: string) {
    const result = await this.lineupsService.calculateScore(id, user.id);
    return {
      data: result,
    };
  }
}
