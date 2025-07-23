/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOffer } from './../src/job-offers/entities/job-offer.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class JobOfferQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 10;

  @IsOptional()
  title?: string;

  @IsOptional()
  location?: string;

  @IsOptional()
  salary?: string;

  @IsOptional()
  company?: string;
}

describe('Job Offers Application (e2e)', () => {
  let app: INestApplication;
  let jobOfferRepository: Repository<JobOffer>;
  let configService: ConfigService;

  // Sample job offers for testing
  const sampleJobOffers: Partial<JobOffer>[] = [
    {
      jobId: 'test-001',
      title: 'Senior Software Engineer',
      location: 'Seattle, WA',
      salaryRange: '100000 - 150000',
      currencyUnit: 'Dollar',
      company: 'TechCorp',
      jobType: 'Full-Time',
      skils: 'JavaScript, React, Node.js',
      postedDate: new Date().toISOString(),
      industry: 'Technology',
      experience: '5+ years',
      companyWebSite: 'https://techcorp.com',
    },
    {
      jobId: 'test-002',
      title: 'Data Scientist',
      location: 'San Francisco, CA',
      salaryRange: '90000 - 130000',
      currencyUnit: 'Dollar',
      company: 'DataWorks',
      jobType: 'Contract',
      skils: 'Python, Machine Learning, SQL',
      postedDate: new Date().toISOString(),
      industry: 'Data',
      experience: '3+ years',
      companyWebSite: 'https://dataworks.com',
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        AppModule,
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', ''),
            database: configService.get('DB_NAME', 'job_offers_test'),
            autoLoadEntities: true,
            synchronize: true,
            dropSchema: true,
          }),
          inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([JobOffer]),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Safe validation pipe configuration
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Get repositories and services
    jobOfferRepository = app.get(getRepositoryToken(JobOffer));
    configService = app.get(ConfigService);

    // Seed database with sample job offers
    await jobOfferRepository.save(sampleJobOffers);
  });

  afterAll(async () => {
    // Clear database and close connection
    await jobOfferRepository.clear();
    await app.close();
  });

  describe('/api/job-offers (GET)', () => {
    it('should return paginated job offers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.totalPages).toBeGreaterThan(0);
      expect(response.body.page).toBe(1);
      expect(response.body.page_size).toBe(10);
    });

    it('should filter job offers by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?title=Senior%20Software%20Engineer')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toBe('Senior Software Engineer');
    });

    it('should filter job offers by location', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?location=Seattle')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].location).toContain('Seattle');
    });

    it('should filter job offers by company', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?company=TechCorp')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].company).toBe('TechCorp');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?page=1&page_size=1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.page_size).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid page number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?page=-1')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should handle invalid page size', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?page_size=0')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Performance and Limits', () => {
    it('should limit maximum page size', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/job-offers?page_size=1000')
        .expect(200);

      expect(response.body.page_size).toBeLessThanOrEqual(100);
    });
  });

  describe('Swagger Documentation', () => {
    it('should have Swagger documentation available', async () => {
      const response = await request(app.getHttpServer())
        .get('/docs')
        .expect(200);

      expect(response.text).toContain('swagger');
    });
  });
});
