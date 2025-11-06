import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorhandlingService {

  constructor() { }

  public handleError(operation: string = 'operation', error: HttpErrorResponse): Observable<never> {
    let userFriendlyMessage: string;
    if (error.error && typeof error.error === 'object' && error.error.message) {
      userFriendlyMessage = error.error.message;
    }
    else if (error.error instanceof ErrorEvent) {
      userFriendlyMessage = `A client-side error occurred: ${error.error.message}`;
    }
    else {
      userFriendlyMessage = `Request failed with status ${error.status}. Please try again later.`;
    }
    console.error(`[${operation}] failed:`, {
      status: error.status,
      message: error.message,
      url: error.url,
      fullError: error
    });
    return throwError(() => new Error(userFriendlyMessage));
  }
}
