import { forwardRef, Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { GoogleGenAI } from '@google/genai';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgentModule } from 'src/agent/agent.module';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity';
import { User } from 'src/users/entity/users.entity';
import { ChatController } from './chat.controller';
import { Timetable } from 'src/timetable/entity/timetable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, User,Timetable]),
    ConfigModule,
    forwardRef(() => AgentModule),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
  ],
  exports:[ChatService]
})
export class ChatModule {}
