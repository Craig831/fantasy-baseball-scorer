import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.usersService.getUserProfile(user.id);
    return {
      data: profile,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.updateUserProfile(
      user.id,
      updateDto,
    );
    return {
      data: updatedUser,
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account (soft delete)' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: any) {
    const result = await this.usersService.deleteAccount(user.id);
    return {
      data: result,
    };
  }
}
