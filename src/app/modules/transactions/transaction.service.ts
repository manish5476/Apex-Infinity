import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class TransactionService extends BaseApiService {
  
  // --- Global Transactions (/v1/transactions) ---

  getAllTransactions(filterParams?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/transactions`, { params: this.createHttpParams(filterParams) }).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAllTransactions'))
    );
  }

  exportTransactionsCsv(filterParams?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/transactions/export`, { 
      params: this.createHttpParams(filterParams),
      responseType: 'blob' 
    }).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'exportTransactionsCsv'))
    );
  }

  // --- Party Specific Transactions (Routes were mapped to /api/v1 root in app.js) ---
  // app.use('/api/v1', partyTransactionRouter) -> /api/v1/customers/:id/transactions
  
  getCustomerTransactions(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/customers/${customerId}/transactions`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getCustomerTransactions'))
    );
  }

  getSupplierTransactions(supplierId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/suppliers/${supplierId}/transactions`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getSupplierTransactions'))
    );
  }
}