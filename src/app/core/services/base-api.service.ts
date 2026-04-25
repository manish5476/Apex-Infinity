import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
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

  private normalizeParamValue(value: any): string | null {
    if (value === undefined || value === null || value === '') return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.length ? value.join(',') : null;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  protected createHttpParams(filterParams?: any): HttpParams {
    let params = new HttpParams();
    if (!filterParams) return params;
    // If it's already HttpParams, return it directly
    if (filterParams instanceof HttpParams) return filterParams;
    Object.entries(filterParams).forEach(([key, value]) => {
      const normalized = this.normalizeParamValue(value);
      if (normalized !== null) {
        params = params.set(key, normalized);
      }
    });
    return params;
  }

  // -------------------------------
  // GET
  // -------------------------------
  protected get<T>(url: string, params?: any, _context?: string): Observable<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    // console.log(`[BaseApiService] GET Request to: ${fullUrl}`);
    // console.log(`[BaseApiService] Base URL: ${this.baseUrl}`);
    // console.log(`[BaseApiService] Relative URL: ${url}`);

    const httpParams = this.createHttpParams(params);

    return this.http.get<T>(`${this.baseUrl}${url}`, {
      params: httpParams,
      withCredentials: true,      // <-- CRITICAL FOR REFRESH TOKEN
    });
  }

  // -------------------------------
  // GET BLOB (For file downloads)
  // -------------------------------
  protected getBlob(url: string, params?: any, _context?: string): Observable<Blob> {
    const httpParams = this.createHttpParams(params);

    return this.http.get(`${this.baseUrl}${url}`, {
      params: httpParams,
      withCredentials: true,
      responseType: 'blob'  // Important for file downloads
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

  // -------------------------------
  // PUT
  // -------------------------------
  protected put<T>(url: string, body: any, _context?: string): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${url}`, body, {
      withCredentials: true,   // <-- REQUIRED (same as others)
    });
  }

  // -------------------------------
  // UPLOAD (FILE UPLOAD)
  // -------------------------------
  protected upload<T>(url: string, formData: FormData, _context?: string): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${url}`, formData, {
      withCredentials: true,
    });
  }

  // -------------------------------
  // POST WITH CUSTOM HEADERS
  // -------------------------------
  protected postWithCustomHeaders<T>(url: string, body: any, customHeaders: { [key: string]: string }, _context?: string): Observable<T> {
    const headers = new HttpHeaders(customHeaders);
    return this.http.post<T>(`${this.baseUrl}${url}`, body, {
      headers,
      withCredentials: true,
    });
  }
}
