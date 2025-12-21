import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class SalesService extends BaseApiService {
  private endpoint = '/v1/sales';

  // ================= CREATE =================
  createSales(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createSales');
  }

  createFromInvoice(invoiceId: string): Observable<any> {
    return this.post(`${this.endpoint}/from-invoice/${invoiceId}`, {}, 'createFromInvoice');
  }

  // ================= GET =================
  getAllSales(filterParams?: any): Observable<any> {
    // filterParams handles page, limit, customer, invoice, branch
    return this.get(this.endpoint, filterParams, 'getAllSales');
  }

  getSalesById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getSalesById');
  }

  // ================= UPDATE =================
  updateSales(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateSales');
  }

  // ================= DELETE =================
  deleteSales(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`,null, 'deleteSales');
  }
}
