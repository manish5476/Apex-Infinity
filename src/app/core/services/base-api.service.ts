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
  protected delete<T>(url: string, _context?: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${url}`, {
      withCredentials: true,      // <-- REQUIRED
    });
  }
}


// import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
// import { inject, Injectable } from '@angular/core'; // Added Injectable
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { ErrorhandlingService } from './errorhandling.service';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root' // Optional, but good practice for abstract services in some setups
// })
// export abstract class BaseApiService {
//   protected http = inject(HttpClient);
//   protected errorhandler = inject(ErrorhandlingService);
//   protected baseUrl = environment.apiUrl;

//   // Converts a plain object { key: value } into HttpParams.Filters out null, undefined, and empty strings.   */
//   protected createHttpParams(filterParams?: any): HttpParams {
//     let params = new HttpParams();
//     if (!filterParams) return params;
//     // If it's already HttpParams, return it directly
//     if (filterParams instanceof HttpParams) return filterParams;
//     Object.entries(filterParams).forEach(([key, value]) => {
//       if (value !== undefined && value !== null && value !== '') {
//         params = params.set(key, String(value));
//       }
//     });
//     return params;
//   }

//   protected get<T>(endpoint: string, params: any = {}, context: string = 'API GET'): Observable<T> {
//     const httpParams = this.createHttpParams(params);
//     return this.http
//       .get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams, withCredentials: true })
//       .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   }

//   protected post<T>(endpoint: string, data: any, context: string = 'API POST'): Observable<T> {
//     return this.http
//       .post<T>(`${this.baseUrl}${endpoint}`, data, { withCredentials: true })
//       .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   }

//   protected patch<T>(endpoint: string, data: any, context: string = 'API PATCH'): Observable<T> {
//     return this.http
//       .patch<T>(`${this.baseUrl}${endpoint}`, data, { withCredentials: true })
//       .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   }

//   protected delete<T>(endpoint: string, context: string = 'API DELETE'): Observable<T> {
//     return this.http
//       .delete<T>(`${this.baseUrl}${endpoint}`, { withCredentials: true })
//       .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   }


//   // Generic GET Automatically converts 'params' object to HttpParams   */
//   // protected get<T>(endpoint: string, params: any = {}, context: string = 'API GET'): Observable<T> {
//   //   const httpParams = this.createHttpParams(params);
//   //   return this.http
//   //     .get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams })
//   //     .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   // }

//   // // Generic POST   */
//   // protected post<T>(endpoint: string, data: any, context: string = 'API POST'): Observable<T> {
//   //   return this.http
//   //     .post<T>(`${this.baseUrl}${endpoint}`, data)
//   //     .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   // }

//   // // Generic PATCH   */
//   // protected patch<T>(endpoint: string, data: any, context: string = 'API PATCH'): Observable<T> {
//   //   return this.http
//   //     .patch<T>(`${this.baseUrl}${endpoint}`, data)
//   //     .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   // }

//   // // Generic DELETE   */
//   // protected delete<T>(endpoint: string, context: string = 'API DELETE'): Observable<T> {
//   //   return this.http
//   //     .delete<T>(`${this.baseUrl}${endpoint}`)
//   //     .pipe(catchError((error) => this.errorhandler.handleError(error, context)));
//   // }
// }

