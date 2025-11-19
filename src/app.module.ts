import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TimetableModule } from './timetable/timetable.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TagsModule } from './tags/tags.module';
import { SubgroupsModule } from './subgroups/subgroups.module';
import { TeachersModule } from './teachers/teachers.module';
import { YearsModule } from './years/years.module';
import { GroupsModule } from './groups/groups.module';
import { BuildingsModule } from './buildings/buildings.module';
import { ActivitiesModule } from './activities/activities.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';
import { DayModule } from './day/day.module';
import { HourModule } from './hour/hour.module';
import { ConstraintsModule } from './constraints/constraints.module';
import { ChatModule } from './chat/chat.module';
import { AgentModule } from './agent/agent.module';
import { ClerkAuthGuard } from './auth/gurds/clerk-auth.guard';
import { User } from './users/entity/users.entity';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    /*BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('QUEUE_HOST', 'localhost'),
          port: configService.get('QUEUE_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),*/
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    /*
    CacheModule.register({
      ttl: 5000,
    }),
    */
    TypeOrmModule.forFeature([User]),
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        autoLoadEntities: true,
        //  subscribers: [ActivitySubscriber],

        /*   ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
        */
      }),
    }),
    TimetableModule,
    SubjectsModule,
    TagsModule,
    TeachersModule,
    YearsModule,
    GroupsModule,
    SubgroupsModule,
    RoomsModule,
    BuildingsModule,
    ActivitiesModule,
    UsersModule,
    DayModule,
    HourModule,
    ConstraintsModule,
    ChatModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: ClerkAuthGuard,
    },
    /* {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    */
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
