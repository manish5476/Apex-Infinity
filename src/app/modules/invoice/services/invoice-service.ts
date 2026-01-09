
// Get filtered invoices
const filters = {
  page: 1,
  limit: 20,
  status: 'issued',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  sort: 'invoiceDate',
  order: 'desc'
};

this.invoiceService.getAllInvoices(filters).subscribe(response => {
  console.log('Invoices:', response.data.invoices);
  console.log('Pagination:', response.data.pagination);
});



// 1. Check stock before creating invoice
this.invoiceService.checkStock([
  { productId: '123', quantity: 5 }
]).subscribe(result => {
  console.log('Stock available:', result.isValid);
});

// 2. Create invoice with stock validation
this.invoiceService.createInvoiceWithValidation(invoiceData)
  .subscribe(invoice => console.log('Invoice created:', invoice));

// 3. Cancel invoice (restores stock)
this.invoiceService.cancelInvoice('invoice123', 'Customer request', true)
  .subscribe(() => console.log('Invoice cancelled'));

// 4. Add payment
this.invoiceService.addPayment('invoice123', {
  amount: 1000,
  paymentMethod: 'bank',
  referenceNumber: 'PAY001'
}).subscribe(() => console.log('Payment added'));

// 5. Get reports
this.invoiceService.getProfitSummary({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  groupBy: 'month'
}).subscribe(report => console.log('Profit report:', report));

// 6. Export invoices
this.invoiceService.exportInvoices({
  format: 'csv',
  startDate: '2024-01-01'
}).subscribe(blob => {
  // Download the blob
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoices.csv';
  a.click();
});

// 7. Bulk operations
this.invoiceService.bulkUpdateStatus(['id1', 'id2'], 'paid')
  .subscribe(() => console.log('Bulk update completed'));

























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
    return this.delete(`${this.endpoint}/${id}`,null, 'deleteInvoiceById');
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
