import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class PurchaseService extends BaseApiService {
  private endpoint = '/v1/purchases';

  // ================= STANDARD CRUD =================
  getAllPurchases(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams);
  }

  getPurchaseById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`);
  }

  createPurchase(formData: FormData): Observable<any> {
    return this.post(this.endpoint, formData);
  }

  updatePurchase(id: string, formData: FormData): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, formData);
  }

  deletePurchase(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`);
  }

  // ================= STATUS & BULK =================
  updateStatus(id: string, status: string, notes?: string): Observable<any> {
    return this.patch(`${this.endpoint}/${id}/status`, { status, notes });
  }

  bulkUpdate(ids: string[], updates: any): Observable<any> {
    return this.patch(`${this.endpoint}/bulk-update`, { ids, updates });
  }

  // ================= ATTACHMENTS =================
  addAttachments(id: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('attachments', file));
    return this.post(`${this.endpoint}/${id}/attachments`, formData);
  }

  deleteAttachment(purchaseId: string, fileIndex: number): Observable<any> {
    return this.delete(`${this.endpoint}/${purchaseId}/attachments/${fileIndex}`);
  }

  // ================= PAYMENTS (Outflow) =================
  recordPayment(id: string, paymentData: any): Observable<any> {
    return this.post(`${this.endpoint}/${id}/payments`, paymentData);
  }

  getPaymentHistory(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/payments`);
  }

  deletePayment(purchaseId: string, paymentId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${purchaseId}/payments/${paymentId}`);
  }

  // ================= RETURNS & CANCELLATION =================
  cancelPurchase(id: string, reason: string): Observable<any> {
    return this.post(`${this.endpoint}/${id}/cancel`, { reason });
  }

  partialReturn(id: string, returnData: any): Observable<any> {
    return this.post(`${this.endpoint}/${id}/return`, returnData);
  }

  getAllReturns(filterParams?: any): Observable<any> {
    // Note: Matches the 'returns' path in the new router
    return this.get(`${this.endpoint}/returns`, filterParams);
  }

  getReturnById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/returns/${id}`);
  }

  // ================= ANALYTICS =================
  getAnalytics(filterParams?: any): Observable<any> {
    return this.get(`${this.endpoint}/analytics`, filterParams);
  }

  getPendingPayments(days: number = 30): Observable<any> {
    return this.get(`${this.endpoint}/pending-payments`, { days });
  }
}
