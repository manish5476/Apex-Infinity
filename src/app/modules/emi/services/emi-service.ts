import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

// =============================================================================
// Interfaces for Payload Suggestions (IntelliSense)
// =============================================================================

export interface CreateEmiPlanPayload {
  invoiceId: string;
  principalAmount: number;
  interestRate: number; // e.g., 10 for 10%
  tenureMonths: number;
  startDate: string | Date;
  downPayment?: number;
  [key: string]: any;
}

export interface GetAllEmiQuery {
  page?: number;
  limit?: number;
  status?: 'active' | 'completed' | 'defaulted' | string;
  customerId?: string;
  invoiceId?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export interface PayEmiInstallmentPayload {
  installmentId: string;
  amount: number;
  paymentMethod: string;
  paymentDate?: string | Date;
  referenceNumber?: string;
  notes?: string;
}

export interface ApplyAdvanceBalancePayload {
  installmentId: string;
  amount: number;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

// =============================================================================
// EMI Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class EmiService extends BaseApiService {
  private endpoint = '/v1/emi';

  // ============================================================
  // ── STATIC / UTILITY ROUTES ─────────────────────────────────
  // ============================================================

  getEmiAnalytics(queryParams?: DateRangeQuery): Observable<any> {
    return this.get(`${this.endpoint}/analytics`, queryParams, 'getEmiAnalytics');
  }

  getEmiLedgerReport(queryParams?: DateRangeQuery): Observable<any> {
    return this.get(`${this.endpoint}/ledger`, queryParams, 'getEmiLedgerReport');
  }

  markOverdueInstallments(): Observable<any> {
    return this.post(`${this.endpoint}/mark-overdue`, {}, 'markOverdueInstallments');
  }

  getEmiByInvoice(invoiceId: string): Observable<any> {
    return this.get(`${this.endpoint}/invoice/${invoiceId}`, {}, 'getEmiByInvoice');
  }

  // ============================================================
  // ── ROOT CRUD ───────────────────────────────────────────────
  // ============================================================

  getAllEmiData(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllEmiData');
  }

  createEmiPlan(planData: CreateEmiPlanPayload): Observable<any> {
    return this.post(this.endpoint, planData, 'createEmiPlan');
  }

  // ============================================================
  // ── ID-BASED OPERATIONS ─────────────────────────────────────
  // ============================================================

  getEmiById(emiId: string): Observable<any> {
    return this.get(`${this.endpoint}/${emiId}`, {}, 'getEmiById');
  }

  deleteEmi(emiId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${emiId}`, null, 'deleteEmi');
  }

  payEmiInstallment(emiId: string, paymentData: any): Observable<any> {
    return this.post(`${this.endpoint}/${emiId}/pay`, paymentData, 'payEmiInstallment');
  }

  getEmiHistory(emiId: string): Observable<any> {
    return this.get(`${this.endpoint}/${emiId}/history`, {}, 'getEmiHistory');
  }

  applyAdvanceBalance(emiId: string, payload: ApplyAdvanceBalancePayload): Observable<any> {
    return this.post(`${this.endpoint}/${emiId}/apply-advance`, payload, 'applyAdvanceBalance');
  }
}