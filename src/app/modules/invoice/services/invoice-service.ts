import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class InvoiceService extends BaseApiService {
  private endpoint = '/v1/invoices';

  // --- EXISTING CRUD ---
  createInvoice(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createInvoice');
  }

  getAllInvoices(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllInvoices');
  }

  getInvoiceById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getInvoiceById');
  }

  getInvoicesByCustomer(customerId: string): Observable<any> {
    return this.get(`${this.endpoint}/customer/${customerId}`, {}, 'getInvoicesByCustomer');
  }

  updateInvoice(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateInvoice');
  }

  deleteInvoiceById(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteInvoiceById');
  }

  // --- 🌟 NEW: POWER FEATURES ---

  /** Check if invoice number is unique before submitting */
  validateInvoiceNumber(number: string): Observable<any> {
    return this.get(`${this.endpoint}/validate-number/${number}`, {}, 'validateInvoiceNumber');
  }

  /** Bulk update status (e.g., mark 10 invoices as Paid) */
  bulkUpdateStatus(ids: string[], status: string): Observable<any> {
    return this.patch(`${this.endpoint}/bulk-status`, { ids, status }, 'bulkUpdateStatus');
  }

  /** Download Export CSV/Excel */
  exportInvoices(filterParams?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/export`, {
      params: this.createHttpParams(filterParams),
      responseType: 'blob'
    });
  }

  /** Get Profit/Loss summary for invoices */
  getProfitSummary(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/profit-summary`, filterParams, 'getProfitSummary');
  }

  /** Get Audit History (Who changed what) */
  getInvoiceHistory(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/history`, {}, 'getInvoiceHistory');
  }
  // --- DOCUMENTS ---
  emailInvoice(id: string): Observable<any> {
    return this.post(`${this.endpoint}/pdf/${id}/email`, {}, 'emailInvoice');
  }

  downloadInvoice(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/pdf/${id}/download`, {
      responseType: 'blob'
    });
  }
}
