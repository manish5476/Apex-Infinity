import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentService extends BaseApiService {
  private endpoint = '/v1/payments';

  /**
   * 🧾 Create a new payment
   */
  createPayment(paymentData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}${this.endpoint}`, paymentData)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('createPayment', error),
        ),
      );
  }

  /**
   * 📄 Get all payments (with optional filters)
   */
  getAllPayments(filterParams?: any): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getAllPayments', error),
        ),
      );
  }

  /**
   * 🔍 Get payment by ID
   */
  getPaymentById(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getPaymentById', error),
        ),
      );
  }

  /**
   * 👥 Get payments by customer ID
   */
  getPaymentsByCustomer(customerId: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/customer/${customerId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getPaymentsByCustomer', error),
        ),
      );
  }

  /**
   * 🏢 Get payments by supplier ID
   */
  getPaymentsBySupplier(supplierId: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/supplier/${supplierId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getPaymentsBySupplier', error),
        ),
      );
  }

  /**
   * ✏️ Update payment details
   */
  updatePayment(paymentId: string, paymentData: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${paymentId}`, paymentData)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('updatePayment', error),
        ),
      );
  }

  /**
   * 🗑️ Delete a payment by ID
   */
  deletePayment(paymentId: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}${this.endpoint}/${paymentId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('deletePayment', error),
        ),
      );
  }

  // 💡 Future extensions
  // -------------------------------------------------------
  // restorePayment(paymentId: string)
  // bulkDeletePayments(paymentIds: string[])
  // uploadPaymentProof(paymentId: string, formData: FormData)
}


// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root',
// })
// export class PaymentService {
  
// }
