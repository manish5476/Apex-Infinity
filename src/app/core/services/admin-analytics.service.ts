// src/app/core/services/admin-analytics.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService extends BaseApiService {
  // 1. ADMIN SUMMARY
  getSummary(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    return this.get(
      '/v1/admin/summary',
      { startDate, endDate, branchId },
      'getSummary'
    );
  }

  // 2. MONTHLY TRENDS
  getMonthlyTrends(months: number = 12, branchId?: string): Observable<any> {
    return this.get('/v1/admin/monthly', { months, branchId }, 'getMonthlyTrends');
  }

  // 3. OUTSTANDING LIST
  getOutstanding(
    type: 'receivable' | 'payable',
    limit: number = 20,
    branchId?: string
  ): Observable<any> {
    return this.get('/v1/admin/outstanding', { type, limit, branchId }, 'getOutstanding');
  }

  // 4. TOP CUSTOMERS (already date-aware)
  topCustomers(limit: number = 10, start?: string, end?: string): Observable<any> {
    return this.get('/v1/admin/top-customers', { limit, start, end }, 'topCustomers');
  }

  // 5. TOP PRODUCTS (already date-aware)
  topProducts(limit: number = 10, start?: string, end?: string): Observable<any> {
    return this.get('/v1/admin/top-products', { limit, start, end }, 'topProducts');
  }

  // 6. BRANCH SALES
  branchSales(start?: string, end?: string): Observable<any> {
    return this.get('/v1/admin/branch-sales', { start, end }, 'branchSales');
  }

  // 🔴 UPDATED: make overview date-aware
  getDashboardOverview(start?: string, end?: string): Observable<any> {
    const params: any = {};
    if (start) params.start = start;
    if (end) params.end = end;
    return this.get('/v1/dashboard', params, 'getDashboardOverview');
  }
}

// // import { Injectable } from '@angular/core';
// // import { Observable } from 'rxjs';
// // import { BaseApiService } from './base-api.service';

// // @Injectable({ providedIn: 'root' })
// // export class AdminAnalyticsService extends BaseApiService {
// //   getSummary(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
// //     return this.get('/v1/admin/summary', { startDate, endDate, branchId }, 'getSummary');
// //   }

// //   getMonthlyTrends(months: number = 12): Observable<any> {
// //     return this.get('/v1/admin/monthly', { months }, 'getMonthlyTrends');
// //   }

// //   getOutstanding(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
// //     return this.get('/v1/admin/outstanding', { type, limit }, 'getOutstanding');
// //   }

// //   topCustomers(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
// //     return this.get('/v1/admin/top-customers', { type, limit }, 'getOutstanding');
// //   }

// //   topProducts(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
// //     return this.get('/v1/admin/topProducts', { type, limit }, 'getOutstanding');
// //   }

// //   topSales(type: 'receivable' | 'payable', limit: number = 20): Observable<any> {
// //     return this.get('/v1/admin/topSales', { type, limit }, 'getOutstanding');
// //   }
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from './base-api.service';

// @Injectable({ providedIn: 'root' })
// export class AdminAnalyticsService extends BaseApiService {

//   // 1. ADMIN SUMMARY
//   getSummary(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     return this.get('/v1/admin/summary', { startDate, endDate, branchId }, 'getSummary');
//   }

//   // 2. MONTHLY TRENDS
//   getMonthlyTrends(months: number = 12, branchId?: string): Observable<any> {
//     return this.get('/v1/admin/monthly', { months, branchId }, 'getMonthlyTrends');
//   }

//   // 3. OUTSTANDING LIST
//   getOutstanding(
//     type: 'receivable' | 'payable',
//     limit: number = 20,
//     branchId?: string
//   ): Observable<any> {
//     return this.get('/v1/admin/outstanding', { type, limit, branchId }, 'getOutstanding');
//   }

//   // 4. TOP CUSTOMERS
//   topCustomers(limit: number = 10, start?: string, end?: string): Observable<any> {
//     return this.get('/v1/admin/top-customers', { limit, start, end }, 'topCustomers');
//   }

//   // 5. TOP PRODUCTS
//   topProducts(limit: number = 10, start?: string, end?: string): Observable<any> {
//     return this.get('/v1/admin/top-products', { limit, start, end }, 'topProducts');
//   }

//   // 6. BRANCH SALES
//   branchSales(start?: string, end?: string): Observable<any> {
//     return this.get('/v1/admin/branch-sales', { start, end }, 'branchSales');
//   }

//   getDashboardOverview(): Observable<any> {
//     return this.get('/v1/dashboard', {}, 'getDashboardOverview');
//   }
// }