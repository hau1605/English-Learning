import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventListener } from '@/events/listeners/event.listener';
import { EventHandler } from '@/modules/events/event-handler';
import { EventService } from '@/modules/events/services/event.service';
import { WebsocketModule } from '@/websocket/websocket.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { QueueModule } from '@/queues/queue.module';
import { EmailModule } from '@/modules/email/email.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    WebsocketModule,
    NotificationsModule,
    QueueModule,
    EmailModule,
    UsersModule,
  ],
  providers: [EventListener, EventHandler, EventService],
  exports: [EventEmitterModule, EventService],
})
export class EventsModule {}
