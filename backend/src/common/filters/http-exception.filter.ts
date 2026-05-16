import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // tránh gửi response 2 lần
    if (response.headersSent) {
      return;
    }

    try {
      let status: number;
      let message: string | object;
      let errors: unknown[] = [];

      if (exception instanceof HttpException) {
        status = exception.getStatus();

        const exceptionResponse = exception.getResponse();

        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (
          typeof exceptionResponse === 'object' &&
          exceptionResponse !== null
        ) {
          const responseObj = exceptionResponse as Record<string, unknown>;

          message = responseObj.message || exception.message;

          if (Array.isArray(responseObj.message)) {
            errors = responseObj.message;
            message = 'Validation failed';
          }
        } else {
          message = exception.message;
        }
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Internal server error';

        if (exception instanceof Error) {
          this.logger.error(
            `Unhandled exception: ${exception.message}`,
            exception.stack,
          );
        } else {
          this.logger.error('Unknown exception', String(exception));
        }
      }

      response.status(status).json({
        success: false,
        statusCode: status,
        message,
        errors: errors.length ? errors : undefined,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      });
    } catch (filterError) {
      this.logger.error(
        'Exception filter failed',
        filterError instanceof Error ? filterError.stack : String(filterError),
      );

      // tránh gửi lần 2
      if (response.headersSent) {
        return;
      }

      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}