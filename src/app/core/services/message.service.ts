// src/app/core/services/message.service.ts
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppMessageService {
  constructor(public messageService: MessageService) {}

  public showSuccess(summary?: string, detail?: string, life = 3000) {
    this.messageService.add({ severity: 'success', summary: summary ?? 'Success', detail: detail ?? '', life });
  }

  public showError(summary?: string, detail?: string, life = 5000) {
    this.messageService.add({ severity: 'error', summary: summary ?? 'Error', detail: detail ?? '', life });
  }

  public showInfo(summary: string, detail?: string, life = 3000) {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }

  public showWarn(summary: string, detail?: string, life = 3000) {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  public clear() { this.messageService.clear(); }

  // helper for HTTP errors if you want to call directly
  public handleHttpError(error: HttpErrorResponse, operationName: string = 'API Operation') {
    let summary = `${operationName} Failed`;
    let detail = 'An unknown error occurred. Please try again later.';
    if (error?.error?.message) { detail = error.error.message; }
    else if (error?.status === 0) { summary = 'Network Error'; detail = 'Could not reach server.'; }
    this.showError(summary, detail);
  }
}


// // app-message.service.ts
// import { Injectable } from '@angular/core';
// import { MessageService } from 'primeng/api';
// import { HttpErrorResponse } from '@angular/common/http';

// @Injectable({
//   providedIn: 'root',
// })
// export class AppMessageService {
//   constructor(public messageService: MessageService) { }

//   handleResponse(response: any, successSummary?: string, successDetail?: string) {
//     if (this.isSuccessful(response)) {
//       this.showSuccess(successSummary, successDetail);
//     } else if (this.isNoContent(response)) {
//       this.showNoContentSuccess(successSummary, successDetail);
//     } else {
//       this.handleError(response);
//     }
//   }

//   public isSuccessful(response: any): boolean {
//     if (!response) return false;
//     return (
//       response === 'success' ||
//       response.statusCode === 200 ||
//       response.status === 200 ||
//       response.status === 201
//     );
//   }

//   public isNoContent(response: any): boolean {
//     return response && response.status === 204;
//   }

//   public showSuccess(summary?: string, detail?: string) {
//     this.add({
//       severity: 'success',
//       summary: summary || 'Success',
//       detail: detail || 'Operation successful',
//       life: 3000,
//     });
//   }

//   public showNoContentSuccess(summary?: string, detail?: string) {
//     this.add({
//       severity: 'success',
//       summary: summary || 'Success',
//       detail: detail || 'Operation completed with no content',
//       life: 3000,
//     });
//   }


//   /**
//    * A smart handler that parses an HttpErrorResponse and shows a user-friendly error toast.
//    * This should be called from your ErrorInterceptor or the catchError block of a service.
//    * @param error The HttpErrorResponse object.
//    * @param operationName A friendly name for the operation that failed (e.g., 'Login').
//    */
//   handleHttpError(error: HttpErrorResponse, operationName: string = 'API Operation') {
//     let summary = `${operationName} Failed`;
//     let detail = 'An unknown error occurred. Please try again later.';

//     // Priority 1: Use the specific, user-friendly message from our backend API.
//     if (error.error && typeof error.error === 'object' && error.error.message) {
//       detail = error.error.message;
//     }
//     // Priority 2: Handle client-side or network errors.
//     else if (error.status === 0) {
//       summary = 'Network Error';
//       detail = 'Could not connect to the server. Please check your internet connection.';
//     }
//     // Priority 3: Fallback to a generic message for the HTTP status.
//     else {
//       summary = `Error ${error.status}`;
//       detail = `The server responded with a ${error.status} error.`;
//     }

//     this.showError(summary, detail);
//   }

//   handleError(error: any, customSummary?: string) {
//     let errorMessage = 'An unexpected error occurred';
//     let summary = customSummary || 'Error';

//     if (error instanceof HttpErrorResponse) {
//       if (error.error instanceof ErrorEvent) {
//         errorMessage = `Client Error: ${error.error.message}`;
//       } else {
//         // Server-side error
//         errorMessage = `Server Error (Status ${error.status}): `;
//         if (typeof error.error === 'string') {
//           errorMessage += error.error;
//         } else if (typeof error.error === 'object') {
//           if (error.error.message) {
//             errorMessage += error.error.message;
//           }
//           if (error.error.errors && Array.isArray(error.error.errors)) {
//             errorMessage += '\nValidation Errors:\n';
//             error.error.errors.forEach((validationError: any) => {
//               errorMessage += `- ${validationError.msg || validationError.message || validationError.path}: ${validationError.value} \n`;
//             });
//           }
//         } else {
//           errorMessage += JSON.stringify(error.error);
//         }
//       }
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
//     this.showError(summary, errorMessage);
//   }

//   showInfo(summary: string, detail?: string, life: number = 3000) {
//     this.add({ severity: 'info', summary, detail, life });
//   }

//   showWarn(summary: string, detail?: string, life: number = 3000) {
//     this.add({ severity: 'warn', summary, detail, life });
//   }

//   showError(summary: string, detail?: string, life: number = 5000) {
//     this.add({ severity: 'error', summary, detail, life });
//   }

//   showSuccessMessage(summary: string, detail?: string, life: number = 3000) {
//     this.add({ severity: 'success', summary, detail, life });
//   }

//   add(message: { severity: string; summary: string; detail?: string; life?: number }) {
//     this.messageService.add(message);
//   }

//   clear() {
//     this.messageService.clear();
//   }
// }
