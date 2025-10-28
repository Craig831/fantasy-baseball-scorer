import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ScoringConfigsService } from './scoring-configs.service';
import { CreateScoringConfigDto } from './dto/create-scoring-config.dto';
import { UpdateScoringConfigDto } from './dto/update-scoring-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Scoring Configurations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scoring-configs')
export class ScoringConfigsController {
  constructor(private readonly scoringConfigsService: ScoringConfigsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new scoring configuration' })
  @ApiResponse({ status: 201, description: 'Scoring configuration created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateScoringConfigDto,
  ) {
    const config = await this.scoringConfigsService.create(user.id, createDto);
    return { data: config };
  }

  @Get()
  @ApiOperation({ summary: "List user's scoring configurations" })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'List of scoring configurations' })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.scoringConfigsService.findAll(
      user.id,
      parseInt(page, 10),
      Math.min(parseInt(limit, 10), 100),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scoring configuration by ID' })
  @ApiResponse({ status: 200, description: 'Scoring configuration details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const config = await this.scoringConfigsService.findOne(user.id, id);
    return { data: config };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update scoring configuration' })
  @ApiResponse({ status: 200, description: 'Scoring configuration updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateScoringConfigDto,
  ) {
    const config = await this.scoringConfigsService.update(user.id, id, updateDto);
    return { data: config };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Set as active/default configuration' })
  @ApiResponse({ status: 200, description: 'Configuration activated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async activate(@CurrentUser() user: any, @Param('id') id: string) {
    const config = await this.scoringConfigsService.activate(user.id, id);
    return { data: config };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete scoring configuration' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    await this.scoringConfigsService.remove(user.id, id);
  }
}
