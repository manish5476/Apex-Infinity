import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class FinancialService extends BaseApiService {
  
  // ==========================================================================
  // 📒 LEDGERS (/v1/ledgers)
  // ==========================================================================

  /**
   * Get All Ledgers with filtering (startDate, endDate, type, etc.)
   */
  getAllLedgers(filterParams?: any): Observable<any> {
    return this.get('/v1/ledgers', filterParams, 'getAllLedgers');
  }

  /**
   * Get Customer Ledger with Date Filters
   * Backend expects: /v1/ledgers/customer/:id?startDate=...&endDate=...
   */
  getCustomerLedger(customerId: string, filterParams?: any): Observable<any> {
    // We pass filterParams as the 2nd argument to .get()
    return this.get(`/v1/ledgers/customer/${customerId}`, filterParams, 'getCustomerLedger');
  }

  /**
   * Get Supplier Ledger with Date Filters
   */
  getSupplierLedger(supplierId: string, filterParams?: any): Observable<any> {
    return this.get(`/v1/ledgers/supplier/${supplierId}`, filterParams, 'getSupplierLedger');
  }

  /**
   * Get Organization Summary (Income vs Expense)
   * Supports Date Filtering now too
   */
  getOrgLedgerSummary(filterParams?: any): Observable<any> {
    return this.get('/v1/ledgers/summary/org', filterParams, 'getOrgLedgerSummary');
  }

  getLedgerById(id: string): Observable<any> {
    return this.get(`/v1/ledgers/${id}`, {}, 'getLedgerById');
  }

  deleteLedger(id: string): Observable<any> {
    return this.delete(`/v1/ledgers/${id}`,null, 'deleteLedger');
  }

  /**
   * 📥 NEW: Export Ledgers to CSV
   * Uses 'blob' response type for file download
   */
  exportLedgers(filterParams?: any): Observable<Blob> {
    // BaseApiService handles simple JSON, so we use raw http for Blobs if needed, 
    // OR we can use the helper if we add specific headers. 
    // Usually easier to call http directly for files to set responseType: 'blob'
    return this.http.get(`${this.baseUrl}/v1/ledgers/export`, {
      params: this.createHttpParams(filterParams),
      responseType: 'blob',
      withCredentials: true
    });
  }

  // ==========================================================================
  // 📊 STATEMENTS (/v1/statements)
  // ==========================================================================

  getProfitAndLoss(filterParams?: any): Observable<any> {
    return this.get('/v1/statements/pl', filterParams, 'getProfitAndLoss');
  }

  getBalanceSheet(filterParams?: any): Observable<any> {
    return this.get('/v1/statements/balance-sheet', filterParams, 'getBalanceSheet');
  }

  getTrialBalance(filterParams?: any): Observable<any> {
    return this.get('/v1/statements/trial-balance', filterParams, 'getTrialBalance');
  }

  /**
   * 📥 NEW: Export Statements (P&L, BS, Trial) to CSV
   * Backend: /v1/statements/export?type=pl&format=csv...
   */
  
  exportStatement(type: 'pl' | 'bs' | 'tb', filterParams?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/v1/statements/export`, {
      params: this.createHttpParams({ type, ...filterParams }), // Merge type into params
      responseType: 'blob',
      withCredentials: true
    });
  }
}
