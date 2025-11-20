import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService extends BaseApiService {
  
  // --- Admin Routes (/v1/admin) ---
  
  getSummary(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    return this.get('/v1/admin/summary', { startDate, endDate, branchId }, 'getSummary');
  }

  getMonthlyTrends(months: number = 12): Observable<any> {
    return this.get('/v1/admin/monthly', { months }, 'getMonthlyTrends');
  }

  getOutstanding(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
    return this.get('/v1/admin/outstanding', { type, limit }, 'getOutstanding');
  }

  // --- Dashboard Controller Route (/v1/dashboard) ---
  
  getDashboardOverview(): Observable<any> {
    return this.get('/v1/dashboard', {}, 'getDashboardOverview');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { HttpErrorResponse } from '@angular/common/http';
// import { BaseApiService } from './base-api.service';

// @Injectable({ providedIn: 'root' })
// export class AdminAnalyticsService extends BaseApiService {
  
//   // --- Admin Routes (/v1/admin) ---
  
//   getSummary(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.createHttpParams({ startDate, endDate, branchId });
//     return this.http.get<any>(`${this.baseUrl}/v1/admin/summary`, { params }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getSummary'))
//     );
//   }

//   getMonthlyTrends(months: number = 12): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/admin/monthly`, { params: this.createHttpParams({ months }) }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMonthlyTrends'))
//     );
//   }

//   getOutstanding(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/admin/outstanding`, { params: this.createHttpParams({ type, limit }) }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOutstanding'))
//     );
//   }

//   // --- Dashboard Controller Route (/v1/dashboard) ---
  
//   getDashboardOverview(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/dashboard`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getDashboardOverview'))
//     );
//   }
// }