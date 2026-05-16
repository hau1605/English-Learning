import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { QueueModule } from '@/queues/queue.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [QueueModule, ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
