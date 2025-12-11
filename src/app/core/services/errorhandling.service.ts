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

