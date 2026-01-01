import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class InvoiceService extends BaseApiService {
  private endpoint = '/v1/invoices';

  // ==============================================
  // STOCK MANAGEMENT ENDPOINTS
  // ==============================================

  /** Check stock availability before creating invoice */
  checkStock(items: any[]): Observable<any> {
    return this.post(`${this.endpoint}/check-stock`, { items }, 'checkStock');
  }

  /** Get invoice with current stock information */
  getInvoiceWithStock(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/stock-info`, {}, 'getInvoiceWithStock');
  }

  /** Get low stock warnings for invoice items */
  getLowStockWarnings(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/low-stock-warnings`, {}, 'getLowStockWarnings');
  }

  /** Suggest alternative products if stock is low */
  getAlternativeProducts(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/alternatives`, {}, 'getAlternativeProducts');
  }

  // ==============================================
  // INVOICE STATUS MANAGEMENT
  // ==============================================

  /** Cancel invoice (restores stock if restock=true) */
  cancelInvoice(id: string, reason: string, restock: boolean = true): Observable<any> {
    return this.post(`${this.endpoint}/${id}/cancel`, { reason, restock }, 'cancelInvoice');
  }

  /** Convert draft invoice to active (reduces stock) */
  convertDraftToActive(id: string): Observable<any> {
    return this.post(`${this.endpoint}/${id}/convert`, {}, 'convertDraftToActive');
  }

  /** Bulk update invoice status */
  bulkUpdateStatus(ids: string[], status: string): Observable<any> {
    return this.patch(`${this.endpoint}/bulk/status`, { ids, status }, 'bulkUpdateStatus');
  }

  // ==============================================
  // PAYMENT MANAGEMENT
  // ==============================================

  /** Add payment to invoice */
  addPayment(invoiceId: string, paymentData: any): Observable<any> {
    return this.post(`${this.endpoint}/${invoiceId}/payments`, paymentData, 'addPayment');
  }

  /** Get all payments for an invoice */
  getInvoicePayments(invoiceId: string): Observable<any> {
    return this.get(`${this.endpoint}/${invoiceId}/payments`, {}, 'getInvoicePayments');
  }

  // ==============================================
  // CUSTOMER-SPECIFIC ENDPOINTS
  // ==============================================

  /** Get all invoices for a customer */
  getInvoicesByCustomer(customerId: string, filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/customer/${customerId}`, filterParams, 'getInvoicesByCustomer');
  }

  /** Get customer invoice summary */
  getCustomerInvoiceSummary(customerId: string): Observable<any> {
    return this.get(`${this.endpoint}/customer/${customerId}/summary`, {}, 'getCustomerInvoiceSummary');
  }

  // ==============================================
  // DOCUMENT GENERATION & EMAIL
  // ==============================================

  /** Download invoice as PDF */
  downloadInvoicePDF(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/${id}/download`, {
      responseType: 'blob'
    });
  }

  /** Email invoice to customer */
  emailInvoice(id: string): Observable<any> {
    return this.post(`${this.endpoint}/${id}/email`, {}, 'emailInvoice');
  }

  /** Generate invoice QR code for e-invoicing */
  generateQRCode(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/qr-code`, {}, 'generateQRCode');
  }

  // ==============================================
  // REPORTS & ANALYTICS
  // ==============================================

  /** Get profit summary report */
  getProfitSummary(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/reports/profit`, filterParams, 'getProfitSummary');
  }

  /** Get sales report by date range */
  getSalesReport(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/reports/sales`, filterParams, 'getSalesReport');
  }

  /** Get tax report */
  getTaxReport(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/reports/tax`, filterParams, 'getTaxReport');
  }

  /** Get outstanding invoices report */
  getOutstandingInvoices(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/reports/outstanding`, filterParams, 'getOutstandingInvoices');
  }

  // ==============================================
  // UTILITIES & VALIDATION
  // ==============================================

  /** Validate if invoice number is available */
  validateInvoiceNumber(number: string): Observable<any> {
    return this.get(`${this.endpoint}/validate/number/${number}`, {}, 'validateInvoiceNumber');
  }

  /** Export invoices (CSV/Excel/JSON) */
  exportInvoices(filterParams?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/export/all`, {
      params: this.createHttpParams(filterParams),
      responseType: 'blob'
    });
  }

  /** Get invoice audit history */
  getInvoiceHistory(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/history`, {}, 'getInvoiceHistory');
  }

  /** Search invoices */
  searchInvoices(query: string, limit: number = 20): Observable<any> {
    return this.get(`${this.endpoint}/search/${query}`, { limit }, 'searchInvoices');
  }

  // ==============================================
  // DRAFT INVOICE MANAGEMENT
  // ==============================================

  /** Get all draft invoices */
  getAllDrafts(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/drafts/all`, filterParams, 'getAllDrafts');
  }

  /** Bulk delete draft invoices */
  bulkDeleteDrafts(ids: string[]): Observable<any> {
    return this.delete(`${this.endpoint}/drafts/bulk`, { ids }, 'bulkDeleteDrafts');
  }

  // ==============================================
  // RECURRING INVOICES
  // ==============================================

  /** Create recurring invoice template */
  createRecurringInvoice(data: any): Observable<any> {
    return this.post(`${this.endpoint}/recurring`, data, 'createRecurringInvoice');
  }

  /** Generate recurring invoices */
  generateRecurringInvoices(date?: string): Observable<any> {
    return this.post(`${this.endpoint}/recurring/generate`, { date }, 'generateRecurringInvoices');
  }

  // ==============================================
  // SOFT DELETE & RESTORE
  // ==============================================

  /** Soft delete invoice */
  deleteInvoice(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, null, 'deleteInvoice');
  }

  /** Restore deleted invoice */
  restoreInvoice(id: string): Observable<any> {
    return this.post(`${this.endpoint}/${id}/restore`, {}, 'restoreInvoice');
  }

  /** Get all deleted invoices */
  getDeletedInvoices(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/trash/all`, filterParams, 'getDeletedInvoices');
  }

  // ==============================================
  // BULK OPERATIONS
  // ==============================================

  /** Bulk create invoices */
  bulkCreateInvoices(invoices: any[]): Observable<any> {
    return this.post(`${this.endpoint}/bulk/create`, { invoices }, 'bulkCreateInvoices');
  }

  /** Bulk cancel invoices (restores stock) */
  bulkCancelInvoices(ids: string[], reason: string, restock: boolean = true): Observable<any> {
    return this.post(`${this.endpoint}/bulk/cancel`, { ids, reason, restock }, 'bulkCancelInvoices');
  }

  // ==============================================
  // WEBHOOKS & INTEGRATIONS
  // ==============================================

  /** Trigger invoice webhook */
  triggerWebhook(invoiceId: string, event: string, url: string): Observable<any> {
    return this.post(`${this.endpoint}/${invoiceId}/webhook`, { event, url }, 'triggerWebhook');
  }

  /** Sync invoice with accounting software */
  syncWithAccounting(invoiceId: string, software: string): Observable<any> {
    return this.post(`${this.endpoint}/${invoiceId}/sync/accounting`, { software }, 'syncWithAccounting');
  }

  // ==============================================
  // BASIC CRUD (KEEPING EXISTING)
  // ==============================================

  createInvoice(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createInvoice');
  }

  getAllInvoices(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllInvoices');
  }

  getInvoiceById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getInvoiceById');
  }

  updateInvoice(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateInvoice');
  }

  // ==============================================
  // HELPER METHODS
  // ==============================================

  /**
   * Get invoice by ID with all related data
   */
  getInvoiceFullDetails(id: string): Observable<any> {
    return this.getInvoiceById(id); // You can expand this to include more data if needed
  }

  /**
   * Create invoice with stock validation
   */
  createInvoiceWithValidation(invoiceData: any): Observable<any> {
    // First check stock
    return new Observable(observer => {
      this.checkStock(invoiceData.items).subscribe({
        next: (stockCheck) => {
          if (stockCheck.isValid) {
            // Stock is available, create invoice
            this.createInvoice(invoiceData).subscribe({
              next: (invoice) => observer.next(invoice),
              error: (err) => observer.error(err)
            });
          } else {
            observer.error(new Error(`Stock validation failed: ${stockCheck.errors.join(', ')}`));
          }
        },
        error: (err) => observer.error(err)
      });
    });
  }

  /**
   * Quick cancel invoice with default reason
   */
  quickCancelInvoice(id: string, restock: boolean = true): Observable<any> {
    return this.cancelInvoice(id, 'Cancelled by user', restock);
  }

  /**
   * Get invoice statistics
   */
  getInvoiceStats(startDate?: string, endDate?: string): Observable<any> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return this.get(this.endpoint, params, 'getInvoiceStats');
  }

  /**
   * Mark invoice as paid (shortcut method)
   */
  markAsPaid(invoiceId: string, amount: number, paymentMethod: string = 'cash'): Observable<any> {
    return this.addPayment(invoiceId, {
      amount,
      paymentMethod,
      notes: 'Payment received'
    });
  }
}

// // Get filtered invoices
// const filters = {
//   page: 1,
//   limit: 20,
//   status: 'issued',
//   startDate: '2024-01-01',
//   endDate: '2024-01-31',
//   sort: 'invoiceDate',
//   order: 'desc'
// };

// this.invoiceService.getAllInvoices(filters).subscribe(response => {
//   console.log('Invoices:', response.data.invoices);
//   console.log('Pagination:', response.data.pagination);
// });



// // 1. Check stock before creating invoice
// this.invoiceService.checkStock([
//   { productId: '123', quantity: 5 }
// ]).subscribe(result => {
//   console.log('Stock available:', result.isValid);
// });

// // 2. Create invoice with stock validation
// this.invoiceService.createInvoiceWithValidation(invoiceData)
//   .subscribe(invoice => console.log('Invoice created:', invoice));

// // 3. Cancel invoice (restores stock)
// this.invoiceService.cancelInvoice('invoice123', 'Customer request', true)
//   .subscribe(() => console.log('Invoice cancelled'));

// // 4. Add payment
// this.invoiceService.addPayment('invoice123', {
//   amount: 1000,
//   paymentMethod: 'bank',
//   referenceNumber: 'PAY001'
// }).subscribe(() => console.log('Payment added'));

// // 5. Get reports
// this.invoiceService.getProfitSummary({
//   startDate: '2024-01-01',
//   endDate: '2024-01-31',
//   groupBy: 'month'
// }).subscribe(report => console.log('Profit report:', report));

// // 6. Export invoices
// this.invoiceService.exportInvoices({
//   format: 'csv',
//   startDate: '2024-01-01'
// }).subscribe(blob => {
//   // Download the blob
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = 'invoices.csv';
//   a.click();
// });

// // 7. Bulk operations
// this.invoiceService.bulkUpdateStatus(['id1', 'id2'], 'paid')
//   .subscribe(() => console.log('Bulk update completed'));

























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
