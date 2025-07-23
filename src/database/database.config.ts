import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

dotenv.config();

/**
 * Initializes and configures the TypeORM DataSource for connecting to a PostgreSQL database.
 *
 * The configuration uses environment variables for database connection details such as host, port,
 * username, password, and database name. It automatically loads entity files and migration scripts
 * from specified directories using glob patterns.
 *
 * @remarks
 * - `migrationsRun` is set to `false`, so migrations will not run automatically on startup.
 * - `logging` is enabled for errors and warnings.
 * - `synchronize` is set to `false` to prevent automatic schema synchronization.
 *
 * @see {@link https://typeorm.io/data-source}
 */
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [
    join(__dirname, 'migrations', '*.migrations.{ts,js}'),
    join(__dirname, '..', 'migrations', '*.migrations.{ts,js}'),
    join(__dirname, '..', '**', 'migrations', '*.{ts,js}'),
  ],
  migrationsRun: false,
  logging: ['error', 'warn'],
  synchronize: false,
});

export default AppDataSource;
