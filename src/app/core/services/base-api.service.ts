import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ErrorhandlingService } from './errorhandling.service'; // Adjust path if needed
import { environment } from '../../../environments/environment'; // Adjust path if needed

export abstract class BaseApiService {
  // Use inject() for cleaner dependency injection in base classes
  protected http = inject(HttpClient);
  protected errorhandler = inject(ErrorhandlingService);
  protected baseUrl = environment.apiUrl;
  protected createHttpParams(filterParams?: any): HttpParams {
    let params = new HttpParams();
    if (filterParams) {
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return params;
  }
}