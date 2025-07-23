import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['jobId'])
export class JobOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  jobId: string;

  @Column()
  jobType: string;

  @Column()
  title: string;

  @Column()
  location: string;

  @Column()
  salaryRange: string;

  @Column()
  currencyUnit: string;

  @Column()
  company: string;

  @Column()
  industry: string;

  @Column()
  skils: string;

  @Column()
  postedDate: string;

  @Column()
  experience: string;

  @Column()
  companyWebSite: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
