import { Test, TestingModule } from '@nestjs/testing';
import { JobOffersController } from './job-offers.controller';
import { JobOffersService } from './job-offers.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('JobOffersController', () => {
  let controller: JobOffersController;
  let mockJobOffersService: Partial<JobOffersService>;

  beforeEach(async () => {
    // Create a mock JobOffersService
    mockJobOffersService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobOffersController],
      providers: [
        {
          provide: JobOffersService,
          useValue: mockJobOffersService,
        },
      ],
    }).compile();

    controller = module.get<JobOffersController>(JobOffersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getJobOffers', () => {
    const mockJobOffers = {
      data: [
        {
          id: 1,
          title: 'Software Engineer',
          location: 'New York',
          company: 'Tech Corp',
        },
      ],
      total: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    it('should return job offers successfully', async () => {
      // Mock the service method to return job offers
      (mockJobOffersService.findAll as jest.Mock).mockResolvedValue(
        mockJobOffers,
      );

      const result = await controller.getJobOffers();

      expect(result).toEqual({
        data: mockJobOffers.data,
        total: mockJobOffers.total,
        totalPages: mockJobOffers.totalPages,
        hasPreviousPage: mockJobOffers.hasPreviousPage,
        hasNextPage: mockJobOffers.hasNextPage,
        page: 1,
        page_size: 10,
      });
    });

    it('should handle default parameters', async () => {
      // Mock the service method to return job offers
      (mockJobOffersService.findAll as jest.Mock).mockResolvedValue(
        mockJobOffers,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await controller.getJobOffers();

      expect(mockJobOffersService.findAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        filter: {
          title: '',
          location: '',
          salary: '',
          company: '',
        },
      });
    });

    it('should handle custom parameters', async () => {
      // Mock the service method to return job offers
      (mockJobOffersService.findAll as jest.Mock).mockResolvedValue(
        mockJobOffers,
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await controller.getJobOffers(
        2,
        20,
        'Developer',
        'San Francisco',
        '100000',
        'Google',
      );

      expect(mockJobOffersService.findAll).toHaveBeenCalledWith({
        page: 2,
        page_size: 20,
        filter: {
          title: 'Developer',
          location: 'San Francisco',
          salary: '100000',
          company: 'Google',
        },
      });
    });

    it('should throw HttpException when no data is found', async () => {
      // Mock the service method to return null
      (mockJobOffersService.findAll as jest.Mock).mockResolvedValue(null);

      await expect(controller.getJobOffers()).rejects.toThrow(HttpException);
      await expect(controller.getJobOffers()).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: 'can not fetch Job-offers',
      });
    });

    it('should handle service errors', async () => {
      // Mock the service method to throw an error
      (mockJobOffersService.findAll as jest.Mock).mockRejectedValue(
        new Error('Service error'),
      );

      await expect(controller.getJobOffers()).rejects.toThrow(HttpException);
      await expect(controller.getJobOffers()).rejects.toMatchObject({
        status: HttpStatus.BAD_REQUEST,
        message: 'can not fetch Job-offers',
      });
    });
  });

  describe('Query Parameter Validation', () => {
    it('should use default values when no parameters are provided', async () => {
      // Mock the service method to return job offers
      (mockJobOffersService.findAll as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });

      await controller.getJobOffers();

      expect(mockJobOffersService.findAll).toHaveBeenCalledWith({
        page: 1,
        page_size: 10,
        filter: {
          title: '',
          location: '',
          salary: '',
          company: '',
        },
      });
    });

    it('should handle numeric query parameters', async () => {
      // Mock the service method to return job offers
      (mockJobOffersService.findAll as jest.Mock).mockResolvedValue({
        data: [],
        total: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });

      await controller.getJobOffers(5, 15);

      expect(mockJobOffersService.findAll).toHaveBeenCalledWith({
        page: 5,
        page_size: 15,
        filter: {
          title: '',
          location: '',
          salary: '',
          company: '',
        },
      });
    });
  });
});
