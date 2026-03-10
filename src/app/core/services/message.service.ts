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

