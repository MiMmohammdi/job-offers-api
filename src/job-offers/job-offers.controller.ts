import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import { JobOffersService } from './job-offers.service';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

/**
 * Handles HTTP GET requests to retrieve a paginated list of job offers.
 *
 * @param page - Page number for pagination (default: 1).
 * @param page_size - Number of job offers per page (default: 10).
 * @param title - Optional search term for job offer titles.
 * @param location - Optional search term for job offer locations.
 * @param salary - Optional search term for job offer salary range.
 * @param company - Optional search term for job offer company names.
 * @returns An object containing the paginated job offers, total count, total pages, pagination info, and current page details.
 * @throws {HttpException} If job offers cannot be found or an error occurs during fetching.
 */
@Controller('/job-offers')
export class JobOffersController {
  constructor(private readonly jobOffersService: JobOffersService) {}
  private readonly logger = new Logger(JobOffersService.name);
  @Get()
  @ApiOperation({ summary: 'Get a list of job-offers' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'page_size',
    required: false,
    description: 'Limit number of data per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Search term for names',
    type: String,
    example: 'sample',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Search term for location',
    type: String,
    example: 'Iran',
  })
  @ApiQuery({
    name: 'salary',
    required: false,
    description: 'Search term for salary',
    type: String,
    example: '10000',
  })
  @ApiQuery({
    name: 'company',
    required: false,
    description: 'Search term for company',
    type: String,
    example: 'Twitter',
  })
  async getJobOffers(
    @Query('page') page: number = 1,
    @Query('page_size') page_size: number = 10,
    @Query('title') title: string = '',
    @Query('location') location: string = '',
    @Query('salary') salary: string = '',
    @Query('company') company: string = '',
  ) {
    const filter = {
      title,
      location,
      salary,
      company,
    };

    try {
      const data = await this.jobOffersService.findAll({
        page,
        page_size,
        filter,
      });
      if (!data) {
        throw new HttpException('Job-offers not found', HttpStatus.NOT_FOUND);
      }

      return {
        data: data.data,
        total: data.total,
        totalPages: data.totalPages,
        hasPreviousPage: data.hasPreviousPage,
        hasNextPage: data.hasNextPage,
        page,
        page_size,
      };
    } catch (error) {
      this.logger.error('Error fetching job offers', error);
      throw new HttpException(
        `can not fetch Job-offers`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
