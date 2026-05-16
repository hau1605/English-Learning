import { Module } from '@nestjs/common';
import { AppGateway } from '@/websocket/gateways/app.gateway';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebsocketModule {}
