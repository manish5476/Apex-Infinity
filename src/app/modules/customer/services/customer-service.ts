import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService extends BaseApiService {
  private endpoint = '/v1/customers';

  // ============================================================
  // =============== STANDARD CUSTOMER CRUD =====================
  // ============================================================

  createNewCustomer(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createNewCustomer');
  }

  getAllCustomerData(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllCustomerData');
  }

  getCustomerDataWithId(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getCustomerDataWithId');
  }

  updateCustomer(customerId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}`, data, 'updateCustomer');
  }

  reStoreCustomer(customerId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}/restore`, data, 'reStoreCustomer');
  }

  deleteCustomerID(customerId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${customerId}`, 'deleteCustomerID');
  }

  deleteCustomers(customerIds: string[]): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}`;
    return this.http
      .delete(url, { body: { ids: customerIds } })
      .pipe(catchError(err => this.errorhandler.handleError(err, 'deleteCustomers')));
  }

  // ============================================================
  // =============== NEWLY ADDED API ROUTES =====================
  // ============================================================

  /** GET /v1/customers/search */
  searchCustomers(queryParams: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, queryParams, 'searchCustomers');
  }

  /** POST /v1/customers/bulk-update */
  bulkUpdateCustomers(data: any): Observable<any> {
    return this.post(`${this.endpoint}/bulk-update`, data, 'bulkUpdateCustomers');
  }

  /** PATCH /v1/customers/:id/upload */
  uploadProfileImage(formData: FormData, customerId: string): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;
    return this.http
      .patch(url, formData)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProfileImage')));
  }

  /** PATCH /v1/customers/:id/restore */
restoreCustomer(customerId: string): Observable<any> {
  return this.patch(`${this.endpoint}/${customerId}/restore`, {}, 'restoreCustomer');
}

}
