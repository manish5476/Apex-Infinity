
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class PurchaseService extends BaseApiService {
  private endpoint = '/v1/purchases';

  // ================= CREATE =================
  createPurchase(formData: FormData): Observable<any> {
    return this.post(this.endpoint, formData, 'createPurchase');
  }

  // ================= GET =================
  getAllPurchases(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllPurchases');
  }

  getPurchaseById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getPurchaseById');
  }

  // ================= UPDATE =================
  updatePurchase(id: string, formData: FormData): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, formData, 'updatePurchase');
  }

  // ================= DELETE =================
  deletePurchase(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deletePurchase');
  }

  // ================= ATTACHMENT OPERATIONS =================
  // DELETE /v1/purchases/:id/attachments/:fileIndex
  deleteAttachment(purchaseId: string, fileIndex: number): Observable<any> {
    const url = `${this.endpoint}/${purchaseId}/attachments/${fileIndex}`;
    return this.delete(url, 'deleteAttachment');
  }

  // ================= HELPER =================
  private catchAndHandle(operation: string) {
    return (source: Observable<any>) => {
      return source.pipe(
        catchError(err => this.errorhandler.handleError(err, operation))
      );
    };
  }
}

// const fd = new FormData();
// fd.append('supplierId', supplierId);
// fd.append('invoiceNumber', invoiceNum);
// fd.append('items', JSON.stringify(itemsArray));
// files.forEach(f => fd.append('attachments', f));
// this.purchaseService.createPurchase(fd).subscribe(...);
