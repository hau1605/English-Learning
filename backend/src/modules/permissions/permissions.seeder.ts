import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PermissionsService } from './services/permissions.service';

@Injectable()
export class PermissionsSeeder implements OnModuleInit {
  private readonly logger = new Logger(PermissionsSeeder.name);

  private readonly permissions = [
    { code: 'crawler:read', description: 'View crawler data and logs', resource: 'crawler', action: 'read' },
    { code: 'crawler:create', description: 'Import vocabulary and grammar from crawler', resource: 'crawler', action: 'create' },
    { code: 'crawler:trigger', description: 'Trigger crawl jobs', resource: 'crawler', action: 'trigger' },
  ];

  constructor(private readonly permissionsService: PermissionsService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    for (const permission of this.permissions) {
      try {
        const exists = await this.permissionsService.findByCode(permission.code);
        if (!exists) {
          await this.permissionsService.createPermission(permission);
          this.logger.log(`Created permission: ${permission.code}`);
        } else {
          this.logger.debug(`Permission already exists: ${permission.code}`);
        }
      } catch (error) {
        this.logger.error(`Failed to create permission: ${permission.code}`, error);
      }
    }
  }
}
