import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppGateway } from '@/websocket/gateways/app.gateway';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebsocketModule {}
