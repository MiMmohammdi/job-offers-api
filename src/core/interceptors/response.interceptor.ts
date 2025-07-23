import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Interceptor that wraps the response data in a standardized format.
 *
 * Adds the following properties to the response:
 * - `success`: Indicates if the response is successful.
 * - `statusCode`: The HTTP status code of the response.
 * - `data`: The actual response data.
 * - `timestamp`: The ISO timestamp when the response was sent.
 *
 * @implements {NestInterceptor}
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: context.switchToHttp().getResponse().statusCode,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
