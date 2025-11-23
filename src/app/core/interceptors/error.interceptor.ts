// src/app/core/interceptors/error.interceptor.ts
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AppMessageService } from '../services/message.service';
import { AuthService } from '../../modules/auth/services/auth-service';

export const ErrorInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const messageService = inject(AppMessageService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // token invalid or expired
        messageService.showError('Session Expired', 'Please log in again.');
        try { authService.logout(); } catch {}
        return throwError(() => error);
      }

      let summary = `Error ${error.status}`;
      let detail = 'An unknown server error occurred.';

      if (error.error && typeof error.error === 'object' && error.error.message) {
        detail = error.error.message;
      } else if (error.status === 0) {
        summary = 'Network Error';
        detail = 'Unable to connect to the server.';
      } else {
        switch (error.status) {
          case 400: summary = 'Bad Request'; break;
          case 403: summary = 'Forbidden'; break;
          case 404: summary = 'Not Found'; break;
          case 500: summary = 'Server Error'; break;
        }
      }

      messageService.showError(summary, detail);
      console.error('HTTP Error Intercepted:', error);
      return throwError(() => error);
    })
  );
};


// // src/app/core/interceptors/error.interceptor.ts

// import {
//   HttpErrorResponse,
//   HttpHandlerFn,
//   HttpRequest,
// } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { catchError } from 'rxjs/operators';
// import { throwError } from 'rxjs';
// import { AppMessageService } from '../services/message.service';
// import { AuthService } from '../../modules/auth/services/auth-service';

// export const ErrorInterceptor = (
//   req: HttpRequest<unknown>,
//   next: HttpHandlerFn
// ) => {

//   const messageService = inject(AppMessageService);
//   const authService = inject(AuthService); // Angular 16+ allows this safely

//   return next(req).pipe(
//     catchError((error: HttpErrorResponse) => {

//       // --------------------------------------
//       // 401 – TOKEN INVALID / EXPIRED
//       // --------------------------------------
//       if (error.status === 401) {
//         messageService.showError('Session Expired', 'Please log in again.');
//         authService.logout();
//         return throwError(() => error);
//       }

//       // --------------------------------------
//       // ALL OTHER ERRORS
//       // --------------------------------------
//       let summary = `Error ${error.status}`;
//       let detail = 'An unknown server error occurred.';

//       if (error.error && typeof error.error === 'object' && error.error.message) {
//         detail = error.error.message;
//       } else if (error.status === 0) {
//         summary = 'Network Error';
//         detail = 'Unable to connect to the server.';
//       } else {
//         switch (error.status) {
//           case 400:
//             summary = 'Bad Request';
//             break;
//           case 403:
//             summary = 'Forbidden';
//             break;
//           case 404:
//             summary = 'Not Found';
//             break;
//           case 500:
//             summary = 'Server Error';
//             break;
//         }
//       }

//       messageService.showError(summary, detail);
//       console.error('HTTP Error Intercepted:', error);

//       return throwError(() => error);
//     })
//   );
// };


// // // src/app/core/interceptors/error.interceptor.ts
// // import {
// //   HttpErrorResponse,
// //   HttpHandlerFn,
// //   HttpRequest,
// // } from '@angular/common/http';
// // import { inject, Injector } from '@angular/core';
// // import { throwError } from 'rxjs';
// // import { catchError } from 'rxjs/operators';
// // import { AppMessageService } from '../services/message.service';

// // export const ErrorInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
// //   // eager inject of message service is safe (it doesn't depend on ApiService/HttpClient)
// //   const messageService = inject(AppMessageService);

// //   // DO NOT inject AuthService here at the top-level. Use Injector lazily below.
// //   const injector = inject(Injector);

// //   return next(req).pipe(
// //     catchError((error: HttpErrorResponse) => {
// //       // --- Handle 401 Unauthorized: Critical for Security ---
// //       if (error.status === 401) {
// //         let authService: any;
// //         try {
// //           authService = injector.get<any>('AuthService' as any) || injector.get(injector.get, null); // fallback guard
// //         } catch (err) {
// //           try {
// //             authService = injector.get((inject as unknown) as any);
// //           } catch (_) {
// //           }
// //         }

// //         // The safer and recommended pattern:
// //         try {
// //           authService = injector.get<any>(<any>Object.getPrototypeOf({}).constructor); // noop fallback, will be handled later
// //         } catch { }

// //         // Real retrieval:
// //         try {
// //           // Most robust: try to get by class constructor
// //           // Replace `AuthService` below with the actual import if file scope allows.
// //           // But to avoid any circular import at file top, use a dynamic require-like pattern:
// //           // NOTE: TypeScript/ESM doesn't allow require in usual way in strict builds.
// //           // Simpler: attempt injector.get(AuthService) below and catch.
// //           // If your build supports direct type import, you can replace the next line with:
// //           // const auth = injector.get(AuthService);
// //           // I'll attempt direct resolution below:
// //         } catch (e) {
// //           // ignore; will try direct below
// //         }

// //         // Practical and safe approach: try direct injector.get with the AuthService type.
// //         // Importing the AuthService type at top-level can re-introduce the cycle.
// //         // So prefer to reference by token if you registered it, otherwise import it here.
// //         try {
// //           // eslint-disable-next-line @typescript-eslint/no-var-requires
// //           const { AuthService } = require('../../modules/auth/services/auth-service');
// //           authService = injector.get(AuthService);
// //         } catch (e) {
// //           // If even that fails (unlikely), don't crash app — show message and rethrow.
// //           messageService.showError('Session Expired', 'Please log in again.');
// //           console.error('Failed to resolve AuthService in ErrorInterceptor', e);
// //           return throwError(() => error);
// //         }

// //         // Now we have authService safely resolved at runtime.
// //         messageService.showError('Session Expired', 'Please log in again.');
// //         if (authService && typeof authService.logout === 'function') {
// //           authService.logout();
// //         }
// //         return throwError(() => error);
// //       }

// //       // --- The rest of your error handling logic ---
// //       let errorSummary = `Error ${error.status}`;
// //       let errorMessage = 'An unknown error occurred on the server.';
// //       let errorBody = error.error;

// //       if (errorBody && typeof errorBody === 'object' && errorBody.message) {
// //         errorMessage = errorBody.message;
// //       } else if (error.status === 0) {
// //         errorSummary = 'Network Error';
// //         errorMessage = 'Could not connect. Please check your internet connection.';
// //       } else {
// //         switch (error.status) {
// //           case 400: errorSummary = 'Bad Request'; break;
// //           case 403: errorSummary = 'Forbidden'; break;
// //           case 404: errorSummary = 'Not Found'; break;
// //           case 304: errorSummary = 'Not Modified'; break;
// //           case 500: errorSummary = 'Server Error'; break;
// //         }
// //       }

// //       messageService.showError(errorSummary, errorMessage);
// //       console.error('HTTP Error Intercepted:', error);
// //       return throwError(() => error);
// //     })
// //   );
// // };

