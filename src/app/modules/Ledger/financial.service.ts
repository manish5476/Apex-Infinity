  import { Injectable } from '@angular/core';
  import { Observable } from 'rxjs';
  import { BaseApiService } from '../../core/services/base-api.service';

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