import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ResponseInterceptor } from './core/interceptors/response.interceptor';

/**
 * Bootstraps the NestJS application.
 *
 * - Creates the application instance using the main AppModule.
 * - Applies a global response interceptor for consistent API responses.
 * - Configures Swagger documentation with custom title, description, version, and server path.
 * - Sets up the Swagger UI at the `/docs` endpoint.
 * - Sets a global API prefix (`/api`) for all routes.
 * - Enables Cross-Origin Resource Sharing (CORS).
 * - Logs the port on which the application is running.
 * - Starts the application and listens on the specified port (default: 3000).
 *
 * @async
 * @function
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new ResponseInterceptor());

  const options = new DocumentBuilder()
    .setTitle('Invoice Service API')
    .setDescription('API list for Invoice Service project')
    .setVersion('1.0')
    .addServer('/api')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('api');
  app.enableCors();

  Logger.log(`Application is Running on port ${process.env.PORT ?? 3000}`);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
