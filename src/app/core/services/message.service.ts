import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppMessageService {
  private messageService = inject(MessageService);

  // Constants for easy global adjustments
  private readonly DEFAULT_LIFE = 3000;
  private readonly ERROR_LIFE = 5000;

  public showSuccess(message: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: message, life: this.DEFAULT_LIFE });
  }

  public showError(message: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message, life: this.ERROR_LIFE });
  }

  public showInfo(message: string) {
    this.messageService.add({ severity: 'info', summary: 'Information', detail: message, life: this.DEFAULT_LIFE });
  }

  public showWarn(message: string) {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail: message, life: 4000 });
  }

  public clear() {
    this.messageService.clear();
  }

  public handleHttpError(error: HttpErrorResponse) {
    let errorMessage = 'An unexpected error occurred.';

    if (error.error instanceof ErrorEvent) {
      errorMessage = 'Network Error: Please check your internet connection.';
    } else {
      // Replaced the bulky switch statement with a cleaner object map
      const errorDictionary: Record<number, string> = {
        0: 'Could not connect to the server. Please try again later.',
        400: error.error?.message || 'The data provided was invalid.',
        401: 'Your session has expired. Please login again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource could not be found.',
        409: error.error?.message || 'This item already exists.',
        500: 'Internal server error. Please contact support.',
      };

      // Fallback to specific error messages if status isn't in the dictionary
      errorMessage = errorDictionary[error.status] || error.error?.message || error.message || errorMessage;
    }

    // Now correctly passes just the formatted message
    this.showError(errorMessage);
  }
}


// import { Injectable, inject } from '@angular/core';
// import { MessageService } from 'primeng/api';
// import { HttpErrorResponse } from '@angular/common/http';

// @Injectable({ providedIn: 'root' })
// export class AppMessageService {
//   // Injecting via 'inject' is more modern than constructor
//   private messageService = inject(MessageService);

//   public showSuccess(detail: string = 'Operation completed successfully.' ,summary: string = 'Success',  life = 3000) {
//     this.messageService.add({ severity: 'success', summary, detail, life });
//   }

//   public showError(detail: string = 'Something went wrong.',summary: string = 'Error',  life = 5000) {
//     this.messageService.add({ severity: 'error', summary, detail, life });
//   }

//   public showInfo( detail: string,summary?: string, life = 3000) {
//     this.messageService.add({ severity: 'info', summary, detail, life });
//   }

//   public showWarn(detail: string,summary?: string,  life = 4000) {
//     this.messageService.add({ severity: 'warn', summary, detail, life });
//   }

//   public clear() {
//     this.messageService.clear();
//   }

//   public handleHttpError(error: HttpErrorResponse, context: string = 'Action') {
//     let summary = `${context} Failed`;
//     let detail = 'An unexpected error occurred.';

//     if (error.error instanceof ErrorEvent) {
//       summary = 'Network Error';
//       detail = 'Please check your internet connection.';
//     } else {
//       // Server-side error
//       switch (error.status) {
//         case 0:
//           summary = 'Server Unreachable';
//           detail = 'Could not connect to the server. Please try again later.';
//           break;
//         case 400:
//           summary = 'Invalid Request';
//           detail = error.error?.message || 'The data provided was invalid.';
//           break;
//         case 401:
//           summary = 'Unauthorized';
//           detail = 'Your session has expired. Please login again.';
//           break;
//         case 403:
//           summary = 'Access Denied';
//           detail = 'You do not have permission to perform this action.';
//           break;
//         case 404:
//           summary = 'Not Found';
//           detail = 'The requested resource could not be found.';
//           break;
//         case 409: 
//           summary = 'Conflict';
//           detail = error.error?.message || 'This item already exists.';
//           break;
//         case 500:
//           summary = 'Server Error';
//           detail = 'Internal server error. Please contact support.';
//           break;
//         default:
//           detail = error.error?.message || error.message || detail;
//       }
//     }

//     this.showError(summary, detail);
//   }
// }