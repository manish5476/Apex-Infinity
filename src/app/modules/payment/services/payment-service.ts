import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class PaymentService extends BaseApiService {
  private endpoint = '/v1/payments';

  createPayment(paymentData: any): Observable<any> {
    return this.post(this.endpoint, paymentData, 'createPayment');
  }

  getAllPayments(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllPayments');
  }

  getPaymentById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getPaymentById');
  }

  getPaymentsByCustomer(customerId: string): Observable<any> {
    return this.get(`${this.endpoint}/customer/${customerId}`, {}, 'getPaymentsByCustomer');
  }

  getPaymentsBySupplier(supplierId: string): Observable<any> {
    return this.get(`${this.endpoint}/supplier/${supplierId}`, {}, 'getPaymentsBySupplier');
  }

  updatePayment(paymentId: string, paymentData: any): Observable<any> {
    return this.patch(`${this.endpoint}/${paymentId}`, paymentData, 'updatePayment');
  }

  deletePayment(paymentId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${paymentId}`, 'deletePayment');
  }

  // ============================================================
  // 📄 DOCUMENTS & ACTIONS
  // ============================================================

  /**
   * Download Payment Receipt (PDF)
   * NOTE: We use this.http.get directly because BaseApi.get() expects JSON, 
   * but here we need 'blob' (Binary Large Object) for files.
   */
  downloadReceipt(paymentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}${this.endpoint}/${paymentId}/receipt/download`, {
      responseType: 'blob', // <--- CRITICAL for files
      observe: 'response'
    }).pipe(
      catchError(err => this.errorhandler.handleError(err, 'downloadReceipt'))
    );
  }

  /**
   * Email Payment Receipt
   */
  emailReceipt(paymentId: string): Observable<any> {
    return this.post(`${this.endpoint}/${paymentId}/receipt/email`, {}, 'emailReceipt');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class PaymentService extends BaseApiService {
//   private endpoint = '/v1/payments';

//   createPayment(paymentData: any): Observable<any> {
//     return this.post(this.endpoint, paymentData, 'createPayment');
//   }

//   getAllPayments(filterParams?: any): Observable<any> {
//     return this.get(this.endpoint, filterParams, 'getAllPayments');
//   }

//   getPaymentById(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getPaymentById');
//   }

//   getPaymentsByCustomer(customerId: string): Observable<any> {
//     return this.get(`${this.endpoint}/customer/${customerId}`, {}, 'getPaymentsByCustomer');
//   }

//   downloadPaymentsByCustomer(paymentId: string): Observable<any> {
//     return this.get(`${this.endpoint}/${paymentId}/receipt/download`, {}, 'downloadPaymentsByCustomer');
//   }

//   EmailPaymentsByCustomer(paymentId: string): Observable<any> {
//     return this.post(`${this.endpoint}/${paymentId}/receipt/email`, {}, 'EmailPaymentsByCustomer');
//   }

//   getPaymentsBySupplier(supplierId: string): Observable<any> {
//     return this.get(`${this.endpoint}/supplier/${supplierId}`, {}, 'getPaymentsBySupplier');
//   }

//   updatePayment(paymentId: string, paymentData: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${paymentId}`, paymentData, 'updatePayment');
//   }

//   deletePayment(paymentId: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${paymentId}`, 'deletePayment');
//   }
// }
