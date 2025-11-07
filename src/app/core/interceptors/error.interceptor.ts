import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { AppMessageService } from '../services/message.service';
import { AuthService } from '../../modules/auth/services/auth-service';

export const ErrorInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const messageService = inject(AppMessageService);

  return next(req).pipe(
    retry(1),
    catchError((error: HttpErrorResponse) => {
      // --- Handle 401 Unauthorized: Critical for Security ---
      if (error.status === 401) {
        messageService.showError('Session Expired', 'Please log in again.');
//         authService.logout();
        return throwError(() => error);
      }

      // --- The rest of your excellent error handling logic remains the same ---
      let errorSummary = `Error ${error.status}`;
      let errorMessage = 'An unknown error occurred on the server.';
      let errorBody = error.error;

      if (errorBody && typeof errorBody === 'object' && errorBody.message) {
        errorMessage = errorBody.message;
      }
      else if (error.status === 0) {
        errorSummary = 'Network Error';
        errorMessage = 'Could not connect. Please check your internet connection.';
      }
      else {
        switch (error.status) {
          case 400: errorSummary = 'Bad Request'; break;
          case 403: errorSummary = 'Forbidden'; break;
          case 404: errorSummary = 'Not Found'; break;
          case 304: errorSummary = 'not Modified'; break;
          case 500: errorSummary = 'Server Error'; break;
        }
      }

      messageService.showError(errorSummary, errorMessage);
      console.error('HTTP Error Intercepted:', error);
      return throwError(() => error);
    })
  );
};
