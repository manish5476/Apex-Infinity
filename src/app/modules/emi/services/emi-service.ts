import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class EmiService extends BaseApiService {
  private endpoint = '/v1/emi';

  /**
   * 💳 Create a new EMI plan
   * POST /v1/emi
   * Accessible to admins or authorized users as per backend route restrictions.
   */
  createEmiPlan(planData: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}${this.endpoint}`, planData)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('createEmiPlan', error),
        ),
      );
  }

  /**
   * 🧾 Get EMI plan(s) by invoice ID
   * GET /v1/emi/invoice/:invoiceId
   */
  getEmiByInvoice(invoiceId: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/invoice/${invoiceId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getEmiByInvoice', error),
        ),
      );
  }

  /**
   * 💰 Pay a specific EMI installment
   * PATCH /v1/emi/pay
   * The payload should include emiId, installmentNumber, amount, etc.
   */
  payEmiInstallment(paymentData: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/pay`, paymentData)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('payEmiInstallment', error),
        ),
      );
  }

  // 🚫 COMMENTED (future expansion placeholders)
  // ---------------------------------------------------------------------

  // /**
  //  * 🧮 Get all EMI plans (optional: filtered by customer, date, or status)
  //  * GET /v1/emi
  //  */
  // getAllEmiPlans(filterParams?: any): Observable<any> {
  //   return this.http
  //     .get<any>(`${this.baseUrl}${this.endpoint}`, {
  //       params: this.createHttpParams(filterParams),
  //     })
  //     .pipe(
  //       catchError((error: HttpErrorResponse) =>
  //         this.errorhandler.handleError('getAllEmiPlans', error),
  //       ),
  //     );
  // }

  // /**
  //  * 📅 Update an EMI plan (e.g., change dates, adjust schedule)
  //  * PATCH /v1/emi/:id
  //  */
  // updateEmiPlan(emiId: string, data: any): Observable<any> {
  //   return this.http
  //     .patch(`${this.baseUrl}${this.endpoint}/${emiId}`, data)
  //     .pipe(
  //       catchError((error: HttpErrorResponse) =>
  //         this.errorhandler.handleError('updateEmiPlan', error),
  //       ),
  //     );
  // }
}
