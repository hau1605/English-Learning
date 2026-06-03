import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '@/modules/users/services/users.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { PaginationParams } from '@/common/interfaces';
import { ReadApiThrottle } from '@/common/decorators/rate-limit.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ReadApiThrottle()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  async getMe(@Req() req: Request & { user: { id: string } }) {
    const user = await this.usersService.findById(req.user.id);
    return {
      message: 'Profile retrieved',
      data: user,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      message: 'User retrieved',
      data: user,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(req.user.id, dto);
    return {
      message: 'Profile updated',
      data: user,
    };
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  async deleteMe(@Req() req: Request & { user: { id: string } }) {
    await this.usersService.softDelete(req.user.id);
    return {
      message: 'Account deleted',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (admin)' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async findAll(@Query() params: PaginationParams) {
    const result = await this.usersService.findAll(params);
    return {
      message: 'Users retrieved',
      data: result.data,
      meta: result.meta,
    };
  }
}
