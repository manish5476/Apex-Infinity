import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppMessageService {
  // Injecting via 'inject' is more modern than constructor
  private messageService = inject(MessageService);

  /**
   * Show a success toast (Green)
   */
  public showSuccess(summary: string = 'Success', detail: string = 'Operation completed successfully.', life = 3000) {
    this.messageService.add({ severity: 'success', summary, detail, life });
  }

  /**
   * Show an error toast (Red)
   */
  public showError(summary: string = 'Error', detail: string = 'Something went wrong.', life = 5000) {
    this.messageService.add({ severity: 'error', summary, detail, life });
  }

  /**
   * Show an info toast (Blue)
   */
  public showInfo(summary: string, detail: string, life = 3000) {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }

  /**
   * Show a warning toast (Yellow)
   */
  public showWarn(summary: string, detail: string, life = 4000) {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  /**
   * Clear all toasts
   */
  public clear() {
    this.messageService.clear();
  }

  /**
   * 🛡️ Centralized HTTP Error Handler
   * Extracts the most meaningful message from backend errors.
   */
  public handleHttpError(error: HttpErrorResponse, context: string = 'Action') {
    let summary = `${context} Failed`;
    let detail = 'An unexpected error occurred.';

    if (error.error instanceof ErrorEvent) {
      // Client-side network error
      summary = 'Network Error';
      detail = 'Please check your internet connection.';
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          summary = 'Server Unreachable';
          detail = 'Could not connect to the server. Please try again later.';
          break;
        case 400:
          summary = 'Invalid Request';
          detail = error.error?.message || 'The data provided was invalid.';
          break;
        case 401:
          summary = 'Unauthorized';
          detail = 'Your session has expired. Please login again.';
          break;
        case 403:
          summary = 'Access Denied';
          detail = 'You do not have permission to perform this action.';
          break;
        case 404:
          summary = 'Not Found';
          detail = 'The requested resource could not be found.';
          break;
        case 409: // Conflict
          summary = 'Conflict';
          detail = error.error?.message || 'This item already exists.';
          break;
        case 500:
          summary = 'Server Error';
          detail = 'Internal server error. Please contact support.';
          break;
        default:
          detail = error.error?.message || error.message || detail;
      }
    }

    this.showError(summary, detail);
  }
}