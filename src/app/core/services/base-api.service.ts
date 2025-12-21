import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorhandlingService } from './errorhandling.service';

@Injectable({
  providedIn: 'root',
})
export class BaseApiService {
  protected http = inject(HttpClient);

  // Example:
  // environment.apiUrl = "http://localhost:3000/api"
  protected baseUrl = environment.apiUrl;
  protected errorhandler = inject(ErrorhandlingService);

  protected createHttpParams(filterParams?: any): HttpParams {
    let params = new HttpParams();
    if (!filterParams) return params;
    // If it's already HttpParams, return it directly
    if (filterParams instanceof HttpParams) return filterParams;
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }

  // -------------------------------
  // GET
  // -------------------------------
  protected get<T>(url: string, params?: any, _context?: string): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}${url}`, {
      params: httpParams,
      withCredentials: true,      // <-- CRITICAL FOR REFRESH TOKEN
    });
  }

  // -------------------------------
  // POST
  // -------------------------------
  protected post<T>(url: string, body: any, _context?: string): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${url}`, body, {
      withCredentials: true,      // <-- REQUIRED
    });
  }

  // -------------------------------
  // PATCH
  // -------------------------------
  protected patch<T>(url: string, body: any, _context?: string): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${url}`, body, {
      withCredentials: true,      // <-- REQUIRED
    });
  }

  // -------------------------------
  // DELETE
  // -------------------------------
  protected delete<T>(url: string, body?: any, _context?: string): Observable<T> {
  return this.http.delete<T>(`${this.baseUrl}${url}`, {
    body: body,             
    withCredentials: true,
  });
}
  
}
