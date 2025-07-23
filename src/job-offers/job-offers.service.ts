import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobOffer } from './entities/job-offer.entity';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

interface GetJobOffersQuery {
  page: number;
  page_size: number;
  filter?: any;
}

@Injectable()
export class JobOffersService {
  private readonly logger = new Logger(JobOffersService.name);
  private readonly configService: ConfigService;
  private jobsData: Array<any> = [];

  private currencyMap: { [key: string]: string } = {
    USD: 'Dollar',
    EUR: 'Euro',
    GBP: 'Pound',
    JPY: 'Yen',
    INR: 'Rupee',
    RUB: 'Rouble',
    KRW: 'Won',
    $: 'Dollar',
    '€': 'Euro',
    '£': 'Pound',
    '¥': 'Yen',
    '₹': 'Rupee',
    '₽': 'Rouble',
    '₩': 'Won',
  };

  constructor(
    @InjectRepository(JobOffer)
    private readonly jobOfferRepository: Repository<JobOffer>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  /**
   * Fetches job offers from two external APIs, parses the retrieved data,
   * and stores the job offers in the database.
   * Logs a success message upon completion or an error message if any step fails.
   *
   * @returns {Promise<void>} Resolves when job offers are fetched, parsed, and stored.
   */
  async fetchAndStoreJobOffers() {
    try {
      const api1Data = await this.fetchFromApi1();
      const api2Data = await this.fetchFromApi2();

      this.parseJobData(api1Data);
      this.parseJobData(api2Data);

      await this.storeJobOffers();
      this.logger.log('Job offers fetched and stored successfully');
    } catch (error) {
      this.logger.error('Error fetching job offers', error);
    }
  }

  /**
   * Fetches job offers from the external API provider 1.
   *
   * Makes an HTTP GET request to 'https://assignment.devotel.io/api/provider1/jobs'
   * and returns the response data. Logs a success message upon successful fetch,
   * and logs an error message if the request fails.
   *
   * @returns {Promise<any>} The job offers data from API provider 1, or undefined if an error occurs.
   */
  private async fetchFromApi1() {
    try {
      const response = await axios.get(
        'https://assignment.devotel.io/api/provider1/jobs',
      );
      this.logger.log('fetch from Api 1 successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error fetching job offers from Api 1. Can not connect to Api 1',
        error,
      );
    }
  }
  /**
   * Fetches job offers from the Provider 2 API.
   *
   * Makes an HTTP GET request to `https://assignment.devotel.io/api/provider2/jobs`
   * and returns the response data. Logs a success message upon successful fetch.
   * In case of an error (e.g., network issues or API unavailability), logs an error message.
   *
   * @returns {Promise<any>} The job offers data returned by the Provider 2 API.
   * @throws Logs an error if the API request fails, but does not rethrow.
   */
  private async fetchFromApi2() {
    try {
      const response = await axios.get(
        'https://assignment.devotel.io/api/provider2/jobs',
      );
      this.logger.log('fetch from Api 2 successfully');
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error fetching job offers from Api 2. Can not connect to Api 2',
        error,
      );
    }
  }
  /**
   * Stores job offers in the database if they do not already exist.
   *
   * Iterates over the `jobsData` array and checks if each job offer exists in the repository
   * by matching `jobId` and `title`. If a job offer does not exist, it is saved to the repository.
   * Logs a success message upon completion or logs an error if the operation fails.
   *
   * @private
   * @returns {Promise<void>} Resolves when all job offers have been processed.
   */
  private async storeJobOffers() {
    try {
      for (const job of this.jobsData) {
        const exists = await this.jobOfferRepository.findOne({
          where: { jobId: job.jobId, title: job.title },
        });
        if (!exists) {
          await this.jobOfferRepository.save(job);
        }
      }
      this.logger.log('Job offers stored successfully');
    } catch (error) {
      this.logger.error('Can not store jobs in database', error);
    }
  }

  async findAll({ page, page_size, filter }: GetJobOffersQuery) {
    const { title, location, salary, company } = filter;

    const queryBuilder = this.jobOfferRepository.createQueryBuilder('joboffer');

    if (title) {
      queryBuilder.andWhere('joboffer.title = :title', { title });
    }
    if (location) {
      queryBuilder.andWhere('joboffer.location = :location', { location });
    }
    if (salary) {
      queryBuilder.andWhere('joboffer.salary = :salary', { salary });
    }
    if (company) {
      queryBuilder.andWhere('joboffer.company = :company', { company });
    }

    queryBuilder.select([
      'joboffer.id',
      'joboffer.jobId',
      'joboffer.jobType',
      'joboffer.title',
      'joboffer.location',
      'joboffer.salaryRange',
      'joboffer.currencyUnit',
      'joboffer.company',
      'joboffer.industry',
      'joboffer.skils',
      'joboffer.postedDate',
      'joboffer.experience',
      'joboffer.companyWebSite',
      'joboffer.createdAt',
    ]);

    const [data, total] = await queryBuilder
      .take(page_size)
      .skip((page - 1) * page_size)
      .getManyAndCount();

    return {
      data,
      total,
      totalPages: Math.ceil(total / page_size),
      hasNextPage: page < Math.ceil(total / page_size),
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Parses job data from various possible structures and processes each job entry.
   *
   * This method supports two formats for job data:
   * - An object with a `data.jobsList` property, where each key is a job ID and the value is the job details.
   * - An object with a `jobs` property, which is an array of job objects.
   *
   * For each job entry found, it invokes `parseSingleJob` to process the job.
   * Errors encountered during parsing are logged.
   *
   * @param jobData - The raw job data to be parsed. Can be in different formats.
   */
  public parseJobData(jobData: any): void {
    try {
      let jobs: any[] = [];

      if (jobData?.data?.jobsList) {
        jobs = Object.keys(jobData.data.jobsList).map((key) => ({
          jobId: key,
          ...jobData.data.jobsList[key],
        }));
      } else if (jobData?.jobs) {
        jobs = jobData.jobs;
      }

      jobs.map((job) => this.parseSingleJob(job));
    } catch (error) {
      this.logger.error('error on parse Job Data process', error);
    }
  }

  /**
   * Parses a single job object and extracts relevant information such as location, compensation,
   * employer details, requirements, and other metadata. The extracted data is normalized and
   * pushed into the `jobsData` array for further processing or display.
   *
   * @param job - The raw job object containing various fields from different sources.
   * @returns void
   *
   * @remarks
   * - Handles multiple possible field names for each property to support diverse job data formats.
   * - Normalizes missing or incomplete data to 'unknown' where appropriate.
   * - Infers currency from salary range if not explicitly provided.
   * - Joins technology skills into a comma-separated string.
   */
  private parseSingleJob(job: any): any {
    const location = job.location || job.details || {};
    const compensation = job.compensation || job.details || {};
    const employer = job.employer || job.company || {};
    const requirements = job.requirements || {};

    let locationStr = 'unknown';
    if (location.city && location.state) {
      locationStr = `${location.city}, ${location.state}${location.remote ? ' (Remote)' : ' (OnSite)'}`;
    } else if (location.location) {
      locationStr = location.location;
    }

    let salaryRange = 'unknown';
    if (compensation.min && compensation.max) {
      salaryRange = `${compensation.min} - ${compensation.max}`;
    } else if (compensation.salaryRange) {
      salaryRange = compensation.salaryRange;
    }

    const currency =
      compensation.currency || this.extractCurrencyFromSalary(salaryRange);

    const skills = requirements.technologies?.length
      ? requirements.technologies.join(', ')
      : job.skills?.length
        ? job.skills.join(', ')
        : 'unknown';

    const experience = requirements.experience ?? 'unknown';

    this.jobsData.push({
      jobId: job.jobId || job.id || 'unknown',
      title: job.position || job.title || 'unknown',
      location: locationStr,
      salaryRange: salaryRange,
      currencyUnit: this.currencyMap[currency] || currency || 'unknown',
      company: employer.companyName || employer.name || 'unknown',
      companyWebSite: employer.website || 'unknown',
      industry: employer.industry || 'unknown',
      jobType: job.type || job.details?.type || 'unknown',
      skils: skills,
      experience: experience,
      postedDate: job.datePosted || job.postedDate || 'unknown',
    });
  }

  /**
   * Extracts the currency symbol from the beginning of a salary range string.
   *
   * @param salaryRange - The salary range string, expected to start with a currency symbol.
   * @returns The currency symbol if recognized, otherwise 'unknown'.
   */
  private extractCurrencyFromSalary(salaryRange: string): string {
    if (!salaryRange || typeof salaryRange !== 'string') return 'unknown';
    const firstChar = salaryRange.trim().charAt(0);
    return this.currencyMap[firstChar] ? firstChar : 'unknown';
  }
}
