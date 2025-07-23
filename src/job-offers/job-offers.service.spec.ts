import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOffersService } from './job-offers.service';
import { JobOffer } from './entities/job-offer.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JobOffersService', () => {
  let service: JobOffersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jobOfferRepository: Repository<JobOffer>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let schedulerRegistry: SchedulerRegistry;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('0 * * * *'),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    getCronJobs: jest.fn().mockReturnValue(new Map()),
  };

  const mockJobOfferRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobOffersService,
        {
          provide: getRepositoryToken(JobOffer),
          useValue: mockJobOfferRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    service = module.get<JobOffersService>(JobOffersService);
    jobOfferRepository = module.get(getRepositoryToken(JobOffer));
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAndStoreJobOffers', () => {
    it('should fetch and store job offers from both APIs', async () => {
      const mockApi1Data = {
        jobs: [
          {
            jobId: 'P1-666',
            title: 'Data Scientist',
            details: {
              location: 'Seattle, WA',
              type: 'Contract',
              salaryRange: '$87k - $129k',
            },
            company: { name: 'BackEnd Solutions', industry: 'Solutions' },
            skills: ['Python', 'Machine Learning', 'SQL'],
            postedDate: '2025-07-15T05:04:39.783Z',
          },
        ],
      };

      const mockApi2Data = {
        data: {
          jobsList: {
            'job-341': {
              position: 'Frontend Developer',
              location: { city: 'Seattle', state: 'NY', remote: true },
              compensation: { min: 65000, max: 93000, currency: 'USD' },
              employer: {
                companyName: 'TechCorp',
                website: 'https://techcorp.com',
              },
              requirements: {
                experience: 3,
                technologies: ['Java', 'Spring Boot', 'AWS'],
              },
              datePosted: '2025-07-14',
            },
          },
        },
      };

      mockedAxios.get
        .mockImplementationOnce(() => Promise.resolve({ data: mockApi1Data }))
        .mockImplementationOnce(() => Promise.resolve({ data: mockApi2Data }));

      mockJobOfferRepository.findOne.mockResolvedValue(null);

      await service.fetchAndStoreJobOffers();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockJobOfferRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('parseJobData', () => {
    it('should parse job data from provider 1', () => {
      const mockApi1Data = {
        jobs: [
          {
            jobId: 'P1-666',
            title: 'Data Scientist',
            details: {
              location: 'Seattle, WA',
              type: 'Contract',
              salaryRange: '$87k - $129k',
            },
            company: { name: 'BackEnd Solutions', industry: 'Solutions' },
            skills: ['Python', 'Machine Learning', 'SQL'],
            postedDate: '2025-07-15T05:04:39.783Z',
          },
        ],
      };

      service.parseJobData(mockApi1Data);

      // Accessing private jobsData through a workaround
      const jobsData = (service as any).jobsData;
      expect(jobsData).toHaveLength(1);
      expect(jobsData[0].title).toBe('Data Scientist');
    });

    it('should parse job data from provider 2', () => {
      const mockApi2Data = {
        data: {
          jobsList: {
            'job-341': {
              position: 'Frontend Developer',
              location: { city: 'Seattle', state: 'NY', remote: true },
              compensation: { min: 65000, max: 93000, currency: 'USD' },
              employer: {
                companyName: 'TechCorp',
                website: 'https://techcorp.com',
              },
              requirements: {
                experience: 3,
                technologies: ['Java', 'Spring Boot', 'AWS'],
              },
              datePosted: '2025-07-14',
            },
          },
        },
      };

      service.parseJobData(mockApi2Data);

      // Accessing private jobsData through a workaround
      const jobsData = (service as any).jobsData;
      expect(jobsData).toHaveLength(1);
      expect(jobsData[0].title).toBe('Frontend Developer');
    });
  });

  describe('findAll', () => {
    it('should return paginated job offers with filters', async () => {
      const query = {
        page: 1,
        page_size: 10,
        filter: {
          title: 'Data Scientist',
          location: 'Seattle, WA',
          salary: '87k',
          company: 'BackEnd Solutions',
        },
      };

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: [],
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });
});
