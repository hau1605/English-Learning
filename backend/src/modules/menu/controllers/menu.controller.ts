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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MenuService } from '@/modules/menu/services/menu.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PermissionGuard } from '@/modules/permissions/guards/permission.guard';
import { Permissions } from '@/modules/permissions/decorators/permissions.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { CreateMenuItemDto, UpdateMenuItemDto, ReorderMenuItemDto } from '@/modules/menu/dto/menu-item.dto';
import { SafeUserDto } from '@/modules/users/dto/safe-user.dto';

@ApiTags('menus')
@ApiBearerAuth()
@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.view')
  @ApiOperation({ summary: 'Get all menu items (admin)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Menu items retrieved' })
  async getAllMenus(@Query('includeInactive') includeInactive?: string) {
    const items = await this.menuService.getAllMenus(includeInactive === 'true');
    return {
      message: 'Menu items retrieved',
      data: items,
    };
  }

  @Get('tree')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.view')
  @ApiOperation({ summary: 'Get menu tree (admin)' })
  @ApiResponse({ status: 200, description: 'Menu tree retrieved' })
  async getMenuTree() {
    const items = await this.menuService.getAllMenus(true);
    return {
      message: 'Menu tree retrieved',
      data: items,
    };
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get menu for current user' })
  @ApiResponse({ status: 200, description: 'User menu retrieved' })
  async getMenuForUser(@CurrentUser() user: SafeUserDto) {
    const roleCodes = (user as any).roles || [];
    const items = await this.menuService.getMenuForUser(roleCodes);
    return {
      message: 'User menu retrieved',
      data: items,
    };
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.view')
  @ApiOperation({ summary: 'Get all roles for menu configuration' })
  @ApiResponse({ status: 200, description: 'Roles retrieved' })
  async getAllRoles() {
    const roles = await this.menuService.getAllRoles();
    return {
      message: 'Roles retrieved',
      data: roles,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.view')
  @ApiOperation({ summary: 'Get menu item by ID' })
  @ApiResponse({ status: 200, description: 'Menu item retrieved' })
  async getMenuById(@Param('id') id: string) {
    const item = await this.menuService.getMenuById(id);
    return {
      message: 'Menu item retrieved',
      data: item,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.create')
  @ApiOperation({ summary: 'Create menu item' })
  @ApiResponse({ status: 201, description: 'Menu item created' })
  async createMenu(@Body() dto: CreateMenuItemDto) {
    const item = await this.menuService.createMenuItem(dto);
    return {
      message: 'Menu item created',
      data: item,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.update')
  @ApiOperation({ summary: 'Update menu item' })
  @ApiResponse({ status: 200, description: 'Menu item updated' })
  async updateMenu(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    const item = await this.menuService.updateMenuItem(id, dto);
    return {
      message: 'Menu item updated',
      data: item,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete menu item' })
  @ApiResponse({ status: 200, description: 'Menu item deleted' })
  async deleteMenu(@Param('id') id: string) {
    await this.menuService.deleteMenuItem(id);
    return {
      message: 'Menu item deleted',
    };
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Permissions('menu.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder menu items' })
  @ApiResponse({ status: 200, description: 'Menu items reordered' })
  async reorderMenus(@Body() items: ReorderMenuItemDto[]) {
    await this.menuService.reorderMenuItems(items);
    return {
      message: 'Menu items reordered',
    };
  }
}
