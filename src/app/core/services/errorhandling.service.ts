// src/app/core/services/errorhandling.service.ts
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { throwError } from 'rxjs';
import { AppMessageService } from './message.service';

@Injectable({ providedIn: 'root' })
export class ErrorhandlingService {
  constructor(
    private messageService: AppMessageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  public handleError(error: HttpErrorResponse | any, operationName?: string) {
    let errorMessage = '';
    let errorSummary = operationName || 'Error';

    if (isPlatformBrowser(this.platformId) && error instanceof ErrorEvent) {
      errorSummary = 'Client Error';
      errorMessage = `An error occurred: ${error.message}`;
    } else {
      if (error instanceof HttpErrorResponse) {
        errorSummary = `Error ${error.status}`;
        if (error.error && typeof error.error === 'object' && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorSummary = 'Network Error';
          errorMessage = 'Could not connect. Please check your internet connection.';
        } else {
          errorMessage = `Server returned ${error.status}: ${error.statusText}`;
        }
      } else {
        errorMessage = error?.message ?? String(error);
      }
    }

    if ((error as any)?.status !== 401) {
      this.messageService.showError(errorSummary, errorMessage);
    }

    console.error(`[ApiService] ${errorSummary}: ${errorMessage}`, error);
    return throwError(() => new Error(errorMessage));
  }
}


// import { HttpErrorResponse } from '@angular/common/http';
// import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';
// import { throwError } from 'rxjs';
// import { AppMessageService } from './message.service';

// @Injectable({
//   providedIn: 'root',
// })
// export class ErrorhandlingService {
//   constructor(
//     private messageService: AppMessageService,
//     // ✅ FIX: Inject PLATFORM_ID
//     @Inject(PLATFORM_ID) private platformId: Object 
//   ) {}

//   public handleError(errors: HttpErrorResponse | any,error:any) {
//     let errorMessage = '';
//     let errorSummary = 'Error';

//     // ✅ FIX: Wrap this check to only run in the browser
//     if (isPlatformBrowser(this.platformId) && error instanceof ErrorEvent) {
//       // Client-side error
//       errorSummary = 'Client Error';
//       errorMessage = `An error occurred: ${error.error.message}`;
//     } else {
//       // Server-side error (or SSR error)
//       if (error instanceof HttpErrorResponse) {
//         errorSummary = `Error ${error.status}`;
//         if (error.error && typeof error.error === 'object' && error.error.message) {
//           errorMessage = error.error.message;
//         } else if (error.status === 0) {
//           errorSummary = 'Network Error';
//           errorMessage = 'Could not connect. Please check your internet connection.';
//         } else {
//           errorMessage = `Server returned ${error.status}: ${error.statusText}`;
//         }
//       } else {
//         // Handle non-Http errors
//         errorMessage = error.message ? error.message : error.toString();
//       }
//     }

//     // Don't show toast for 401s, the interceptor already did
//     if (error.status !== 401) {
//       this.messageService.showError(errorSummary, errorMessage);
//     }

//     console.error(`[ApiService] ${errorSummary}: ${errorMessage}`, error);
//     return throwError(() => new Error(errorMessage));
//   }
// }
// // import { HttpErrorResponse } from '@angular/common/http';
// // import { Injectable } from '@angular/core';
// // import { Observable, throwError } from 'rxjs';

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class ErrorhandlingService {

// //   constructor() { }

// //   public handleError(operation: string = 'operation', error: HttpErrorResponse): Observable<never> {
// //     let userFriendlyMessage: string;
// //     if (error.error && typeof error.error === 'object' && error.error.message) {
// //       userFriendlyMessage = error.error.message;
// //     }
// //     else if (error.error instanceof ErrorEvent) {
// //       userFriendlyMessage = `A client-side error occurred: ${error.error.message}`;
// //     }
// //     else {
// //       userFriendlyMessage = `Request failed with status ${error.status}. Please try again later.`;
// //     }
// //     console.error(`[${operation}] failed:`, {
// //       status: error.status,
// //       message: error.message,
// //       url: error.url,
// //       fullError: error
// //     });
// //     return throwError(() => new Error(userFriendlyMessage));
// //   }
// // }
