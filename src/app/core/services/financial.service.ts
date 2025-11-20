import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class FinancialService extends BaseApiService {
  
  // === LEDGERS (/v1/ledgers) ===

  getAllLedgers(filterParams?: any): Observable<any> {
    return this.get('/v1/ledgers', filterParams, 'getAllLedgers');
  }

  getCustomerLedger(customerId: string): Observable<any> {
    return this.get(`/v1/ledgers/customer/${customerId}`, {}, 'getCustomerLedger');
  }

  getSupplierLedger(supplierId: string): Observable<any> {
    return this.get(`/v1/ledgers/supplier/${supplierId}`, {}, 'getSupplierLedger');
  }

  getOrgLedgerSummary(): Observable<any> {
    return this.get('/v1/ledgers/summary/org', {}, 'getOrgLedgerSummary');
  }

  getLedgerById(id: string): Observable<any> {
    return this.get(`/v1/ledgers/${id}`, {}, 'getLedgerById');
  }

  deleteLedger(id: string): Observable<any> {
    return this.delete(`/v1/ledgers/${id}`, 'deleteLedger');
  }

  // === STATEMENTS (/v1/statements) ===

  getProfitAndLoss(filterParams?: any): Observable<any> {
    return this.get('/v1/statements/pl', filterParams, 'getProfitAndLoss');
  }

  getBalanceSheet(filterParams?: any): Observable<any> {
    return this.get('/v1/statements/balance-sheet', filterParams, 'getBalanceSheet');
  }

  getTrialBalance(filterParams?: any): Observable<any> {
    return this.get('/v1/statements/trial-balance', filterParams, 'getTrialBalance');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { HttpErrorResponse } from '@angular/common/http';
// import { BaseApiService } from './base-api.service';

// @Injectable({ providedIn: 'root' })
// export class FinancialService extends BaseApiService {
  
//   // === LEDGERS (/v1/ledgers) === //
//   // Note: Your backend route implies 'ledgerController' is mapped, ensure app.use('/v1/ledgers', ledgerRoutes) exists in app.js

//   getAllLedgers(filterParams?: any): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/ledgers`, { params: this.createHttpParams(filterParams) }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAllLedgers'))
//     );
//   }

//   getCustomerLedger(customerId: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/ledgers/customer/${customerId}`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getCustomerLedger'))
//     );
//   }

//   getSupplierLedger(supplierId: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/ledgers/supplier/${supplierId}`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getSupplierLedger'))
//     );
//   }

//   getOrgLedgerSummary(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/ledgers/summary/org`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOrgLedgerSummary'))
//     );
//   }

//   // === STATEMENTS (/v1/statements) === //

//   getProfitAndLoss(filterParams?: any): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/statements/pl`, { params: this.createHttpParams(filterParams) }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getProfitAndLoss'))
//     );
//   }

//   getBalanceSheet(filterParams?: any): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/statements/balance-sheet`, { params: this.createHttpParams(filterParams) }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getBalanceSheet'))
//     );
//   }

//   getTrialBalance(filterParams?: any): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/statements/trial-balance`, { params: this.createHttpParams(filterParams) }).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getTrialBalance'))
//     );
//   }

//   getLedgerById(id: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/ledgers/${id}`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getLedgerById'))
//     );
//   }

//   /**
//    * Delete a ledger entry (Platform Admin only)
//    * DELETE /v1/ledgers/:id
//    */
//   deleteLedger(id: string): Observable<any> {
//     return this.http.delete<any>(`${this.baseUrl}/v1/ledgers/${id}`).pipe(
//       catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteLedger'))
//     );
//   }
// }