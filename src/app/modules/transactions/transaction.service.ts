import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class TransactionService extends BaseApiService {
  
  getAllTransactions(filterParams?: any): Observable<any> {
    return this.get('/v1/transactions', filterParams, 'getAllTransactions');
  }

  getCustomerTransactions(customerId: string, filterParams?: any): Observable<any> {
    return this.get(`/v1/partytransactions/customers/${customerId}/transactions`, filterParams, 'getCustomerTransactions');
  }

  getSupplierTransactions(supplierId: string, filterParams?: any): Observable<any> {
    return this.get(`/v1/partytransactions/suppliers/${supplierId}/transactions`, filterParams, 'getSupplierTransactions');
  }

    getLogs(params: any): Observable<any> {
    return this.get('/v1/logs', params, 'Logs');
  }
  // getSupplierTransactions(supplierId: string): Observable<any> {
  //   return this.get(`/v1/partytransactions/suppliers/${supplierId}/transactions`, {}, 'getSupplierTransactions');
  // }

  // Special case: Blob response for CSV export
  exportTransactionsCsv(filterParams?: any): Observable<Blob> {
    const params = this.createHttpParams(filterParams);
    return this.http.get(`${this.baseUrl}/v1/transactions/export`, { 
      params,
      responseType: 'blob' 
    }).pipe(
      catchError(err => this.errorhandler.handleError(err, 'exportTransactionsCsv'))
    );
  }
}
