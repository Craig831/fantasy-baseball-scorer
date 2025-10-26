import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      errors: [
        {
          code: typeof exceptionResponse === 'object' && 'error' in exceptionResponse
            ? (exceptionResponse as any).error
            : 'ERROR',
          message: exception.message,
          ...(typeof exceptionResponse === 'object' && 'message' in exceptionResponse
            ? { details: (exceptionResponse as any).message }
            : {}),
        },
      ],
    };

    response.status(status).json(errorResponse);
  }
}
