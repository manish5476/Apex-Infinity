import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class EmiService extends BaseApiService {
  private endpoint = '/v1/emi';

  /**
   * Create a new EMI Plan
   */
  createEmiPlan(planData: any): Observable<any> {
    return this.post(this.endpoint, planData, 'createEmiPlan');
  }

  /**
   * Get All EMIs with filters (pagination, status, customer, etc.)
   * Maps to: GET /v1/emi?page=1&limit=10&status=active...
   */
  getAllEmiData(filterParams: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllEmiData');
  }

  /**
   * Get specific EMI details by its unique EMI ID
   * Maps to: GET /v1/emi/:id
   */
  getEmiById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getEmiById');
  }

  /**
   * Get EMI details by Invoice ID
   * Maps to: GET /v1/emi/invoice/:invoiceId
   */
  getEmiByInvoice(invoiceId: string): Observable<any> {
    return this.get(`${this.endpoint}/invoice/${invoiceId}`, {}, 'getEmiByInvoice');
  }

  /**
   * Pay an installment
   */
  payEmiInstallment(paymentData: any): Observable<any> {
    return this.patch(`${this.endpoint}/pay`, paymentData, 'payEmiInstallment');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class EmiService extends BaseApiService {
//   private endpoint = '/v1/emi';

//   createEmiPlan(planData: any): Observable<any> {
//     return this.post(this.endpoint, planData, 'createEmiPlan');
//   }

//   getEmiByInvoice(invoiceId: string): Observable<any> {
//     return this.get(`${this.endpoint}/invoice/${invoiceId}`, {}, 'getEmiByInvoice');
//   }

//   payEmiInstallment(paymentData: any): Observable<any> {
//     return this.patch(`${this.endpoint}/pay`, paymentData, 'payEmiInstallment');
//   }
// }
