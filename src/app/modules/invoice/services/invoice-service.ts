import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ApiResponse, ListResponse } from './api.service'; // Assuming these interfaces exist

@Injectable({
  providedIn: 'root',
})
export class InvoiceService extends BaseApiService {
  private readonly baseUrl = '/v1/invoices';

  // ======================== 1. CORE CRUD & PAGINATION ========================

  getAllInvoices(filters?: any): Observable<ListResponse<any>> {
    return this.get<ListResponse<any>>(this.baseUrl, filters || {}, 'getAllInvoices');
  }

  getInvoice(id: string): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>(`${this.baseUrl}/${id}`, {}, `getInvoice-${id}`);
  }

  createInvoice(data: any): Observable<ApiResponse<any>> {
    return this.post<ApiResponse<any>>(this.baseUrl, data, 'createInvoice');
  }

  updateInvoice(id: string, data: any): Observable<ApiResponse<any>> {
    return this.patch<ApiResponse<any>>(`${this.baseUrl}/${id}`, data, `updateInvoice-${id}`);
  }

  deleteInvoice(id: string): Observable<ApiResponse<any>> {
    return this.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`, null, `deleteInvoice-${id}`);
  }

  // ======================== 2. BULK OPERATIONS ========================

  bulkUpdateStatus(ids: string[], status: string): Observable<any> {
    return this.patch(`${this.baseUrl}/bulk/status`, { ids, status }, 'bulkUpdateStatus');
  }

  bulkCreateInvoices(invoices: any[]): Observable<any> {
    return this.post(`${this.baseUrl}/bulk/create`, { invoices }, 'bulkCreateInvoices');
  }

  bulkCancelInvoices(ids: string[], reason: string, restock: boolean = true): Observable<any> {
    return this.post(`${this.baseUrl}/bulk/cancel`, { ids, reason, restock }, 'bulkCancelInvoices');
  }

  // ======================== 3. ANALYTICS & REPORTS ========================

  getProfitAnalysis(): Observable<any> {
    return this.get(`${this.baseUrl}/analytics/profit`, {}, 'getProfitAnalysis');
  }

  getProfitDashboard(): Observable<any> {
    return this.get(`${this.baseUrl}/analytics/profit-dashboard`, {}, 'getProfitDashboard');
  }

  getSalesReport(filters: { startDate?: string; endDate?: string; groupBy?: string }): Observable<any> {
    return this.get(`${this.baseUrl}/reports/sales`, filters, 'getSalesReport');
  }

  getTaxReport(startDate?: string, endDate?: string): Observable<any> {
    return this.get(`${this.baseUrl}/reports/tax`, { startDate, endDate }, 'getTaxReport');
  }

  // ======================== 4. STOCK & VALIDATION ========================

  checkStock(items: { productId: string; quantity: number }[]): Observable<any> {
    return this.post(`${this.baseUrl}/check-stock`, { items }, 'checkStock');
  }

  validateInvoiceNumber(number: string): Observable<any> {
    return this.get(`${this.baseUrl}/validate/number/${number}`, {}, 'validateInvoiceNumber');
  }

  // ======================== 5. CUSTOMER SPECIFIC ========================

  getInvoicesByCustomer(customerId: string, filters?: any): Observable<any> {
    return this.get(`${this.baseUrl}/customer/${customerId}`, filters || {}, 'getInvoicesByCustomer');
  }

  getCustomerSummary(customerId: string): Observable<any> {
    return this.get(`${this.baseUrl}/customer/${customerId}/summary`, {}, 'getCustomerSummary');
  }

  // ======================== 6. DOCUMENTS & EMAILS ========================

  downloadInvoicePDF(id: string): Observable<Blob> {
    return this.getBlob(`${this.baseUrl}/${id}/download`, {}, `downloadPDF-${id}`);
  }

  emailInvoice(id: string): Observable<any> {
    return this.post(`${this.baseUrl}/${id}/email`, {}, `emailInvoice-${id}`);
  }

  // ======================== 7. ACTIONS & STATUS ========================

  cancelInvoice(id: string, reason: string, restock: boolean = true): Observable<any> {
    return this.post(`${this.baseUrl}/${id}/cancel`, { reason, restock }, `cancelInvoice-${id}`);
  }

  addPayment(id: string, amount: number): Observable<any> {
    return this.post(`${this.baseUrl}/${id}/payments`, { amount }, `addPayment-${id}`);
  }

  restoreInvoice(id: string): Observable<any> {
    return this.post(`${this.baseUrl}/${id}/restore`, {}, `restoreInvoice-${id}`);
  }
}
// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class InvoiceService extends BaseApiService {
//   private endpoint = '/v1/invoices';

//   // --- EXISTING CRUD ---
//   createInvoice(data: any): Observable<any> {
//     return this.post(this.endpoint, data, 'createInvoice');
//   }

//   getAllInvoices(filterParams?: any): Observable<any> {
//     return this.get(this.endpoint, filterParams, 'getAllInvoices');
//   }

//   getInvoiceById(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getInvoiceById');
//   }

//   getInvoicesByCustomer(customerId: string): Observable<any> {
//     return this.get(`${this.endpoint}/customer/${customerId}`, {}, 'getInvoicesByCustomer');
//   }

//   updateInvoice(id: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}`, data, 'updateInvoice');
//   }

//   deleteInvoiceById(id: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${id}`,null, 'deleteInvoiceById');
//   }

//   // --- 🌟 NEW: POWER FEATURES ---

//   /** Check if invoice number is unique before submitting */
//   validateInvoiceNumber(number: string): Observable<any> {
//     return this.get(`${this.endpoint}/validate-number/${number}`, {}, 'validateInvoiceNumber');
//   }

//   /** Bulk update status (e.g., mark 10 invoices as Paid) */
//   bulkUpdateStatus(ids: string[], status: string): Observable<any> {
//     return this.patch(`${this.endpoint}/bulk-status`, { ids, status }, 'bulkUpdateStatus');
//   }

//   /** Download Export CSV/Excel */
//   exportInvoices(filterParams?: any): Observable<Blob> {
//     return this.http.get(`${this.baseUrl}${this.endpoint}/export`, {
//       params: this.createHttpParams(filterParams),
//       responseType: 'blob'
//     });
//   }

//   /** Get Profit/Loss summary for invoices */
//   getProfitSummary(filterParams?: any): Observable<any> {
//     return this.get(`${this.endpoint}/profit-summary`, filterParams, 'getProfitSummary');
//   }

//   /** Get Audit History (Who changed what) */
//   getInvoiceHistory(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}/history`, {}, 'getInvoiceHistory');
//   }
//   // --- DOCUMENTS ---
//   emailInvoice(id: string): Observable<any> {
//     return this.post(`${this.endpoint}/pdf/${id}/email`, {}, 'emailInvoice');
//   }

//   downloadInvoice(id: string): Observable<Blob> {
//     return this.http.get(`${this.baseUrl}${this.endpoint}/pdf/${id}/download`, {
//       responseType: 'blob'
//     });
//   }
// }
