import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JobOffersModule } from './job-offers/job-offers.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import AppDataSource from './database/database.config';

/**
 * The root application module that configures and initializes core modules and global providers.
 *
 * @module AppModule
 *
 * @remarks
 * - Loads environment variables using `ConfigModule`.
 * - Sets up request rate limiting via `ThrottlerModule` with configurable TTL and max requests.
 * - Initializes TypeORM with application data source options.
 * - Enables scheduling capabilities with `ScheduleModule`.
 * - Registers the `JobOffersModule` for job offer-related features.
 * - Provides a global logger and applies the `ThrottlerGuard` as an application-wide guard.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env`,
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL),
          limit: Number(process.env.RATE_LIMIT_MAX_REQUEST),
        },
      ],
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    JobOffersModule,
  ],
  providers: [
    Logger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
