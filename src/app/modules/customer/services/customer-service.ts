import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService extends BaseApiService {
  private endpoint = '/v1/customers';

  // ============================================================
  // ── Static & Bulk Routes ────────────────────────────────────
  // ============================================================

  searchCustomers(queryParams: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, queryParams, 'searchCustomers');
  }

  checkDuplicate(queryParams: any): Observable<any> {
    return this.get(`${this.endpoint}/check-duplicate`, queryParams, 'checkDuplicate');
  }

  bulkUpdateCustomers(data: any): Observable<any> {
    return this.post(`${this.endpoint}/bulk-update`, data, 'bulkUpdateCustomers');
  }

  createBulkCustomer(data: any): Observable<any> {
    return this.post(`${this.endpoint}/bulk-customer`, data, 'createBulkCustomer');
  }


  // ============================================================
  // ── Specialized ID Actions ──────────────────────────────────
  // ============================================================

  /**
   * PATCH /v1/customers/:id/upload 
   * Fixed: Accepts ID and File, converts to FormData internally
   */
  uploadCustomerPhoto(customerId: string, file: File): Observable<any> {
    const formData = new FormData();
    // 'avatar' MUST match the key expected by your Backend middleware (upload.single('avatar'))
    formData.append('avatar', file);

    // We use the direct HttpClient (this.http) to avoid BaseApiService interfering with Content-Type
    // Angular automatically sets Content-Type: multipart/form-data when it sees a FormData object
    const url = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;

    return this.http.patch(url, formData)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadCustomerPhoto')));
  }

  restoreCustomer(customerId: string): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}/restore`, {}, 'restoreCustomer');
  }

  updateCreditLimit(customerId: string, data: { creditLimit: number }): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}/credit-limit`, data, 'updateCreditLimit');
  }


  // ============================================================
  // ── Core CRUD ───────────────────────────────────────────────
  // ============================================================

  getAllCustomerData(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllCustomerData');
  }

  createNewCustomer(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createNewCustomer');
  }

  getCustomerDataWithId(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getCustomerDataWithId');
  }

  updateCustomer(customerId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}`, data, 'updateCustomer');
  }

  deleteCustomer(customerId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${customerId}`, {}, 'deleteCustomer');
  }
}



/**import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class CustomerService extends BaseApiService {
  private endpoint = '/v1/customers';
  private analyticsEndpoint = '/v1/customer.analytics';

  // ============================================================
  // ── Static & Bulk Routes ────────────────────────────────────
  // ============================================================

  searchCustomers(queryParams: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, queryParams, 'searchCustomers');
  }

  checkDuplicate(queryParams: any): Observable<any> {
    return this.get(`${this.endpoint}/check-duplicate`, queryParams, 'checkDuplicate');
  }

  bulkUpdateCustomers(data: any): Observable<any> {
    return this.post(`${this.endpoint}/bulk-update`, data, 'bulkUpdateCustomers');
  }

  createBulkCustomer(data: any): Observable<any> {
    return this.post(`${this.endpoint}/bulk-customer`, data, 'createBulkCustomer');
  }


  // ============================================================
  // ── Specialized ID Actions ──────────────────────────────────
  // ============================================================

//   /**
//    * PATCH /v1/customers/:id/upload
//    * Fixed: Accepts ID and File, converts to FormData internally
//    */
// uploadCustomerPhoto(customerId: string, file: File): Observable < any > {
//   const formData = new FormData();
//   // 'avatar' MUST match the key expected by your Backend middleware (upload.single('avatar'))
//   formData.append('avatar', file);

//   // We use the direct HttpClient (this.http) to avoid BaseApiService interfering with Content-Type
//   // Angular automatically sets Content-Type: multipart/form-data when it sees a FormData object
//   const url = `${this.baseUrl}${this.endpoint}/${customerId}/upload`;

//   return this.http.patch(url, formData)
//     .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadCustomerPhoto')));
// }

// restoreCustomer(customerId: string): Observable < any > {
//   return this.patch(`${this.endpoint}/${customerId}/restore`, {}, 'restoreCustomer');
// }

// updateCreditLimit(customerId: string, data: { creditLimit: number }): Observable < any > {
//   return this.patch(`${this.endpoint}/${customerId}/credit-limit`, data, 'updateCreditLimit');
// }


// // ============================================================
// // ── Core CRUD ───────────────────────────────────────────────
// // ============================================================

// getAllCustomerData(filterParams ?: any): Observable < any > {
//   return this.get(this.endpoint, filterParams, 'getAllCustomerData');
// }

// createNewCustomer(data: any): Observable < any > {
//   return this.post(this.endpoint, data, 'createNewCustomer');
// }

// getCustomerDataWithId(id: string): Observable < any > {
//   return this.get(`${this.endpoint}/${id}`, {}, 'getCustomerDataWithId');
// }

// updateCustomer(customerId: string, data: any): Observable < any > {
//   return this.patch(`${this.endpoint}/${customerId}`, data, 'updateCustomer');
// }

// deleteCustomer(customerId: string): Observable < any > {
//   return this.delete(`${this.endpoint}/${customerId}`, {}, 'deleteCustomer');
// }

// // ============================================================
// // ── Customer Analytics ──────────────────────────────────────
// // ============================================================

// getAnalyticsOverview(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/overview`, params, 'getAnalyticsOverview');
// }

// getFinancialsAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/financials`, params, 'getFinancialsAnalytics');
// }

// getPaymentBehaviorAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/payment-behavior`, params, 'getPaymentBehaviorAnalytics');
// }

// getLtvAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/ltv`, params, 'getLtvAnalytics');
// }

// getSegmentationAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/segmentation`, params, 'getSegmentationAnalytics');
// }

// getGeospatialAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/geospatial`, params, 'getGeospatialAnalytics');
// }

// getRealtimeAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/realtime`, params, 'getRealtimeAnalytics');
// }

// getEmiAnalytics(params ?: any): Observable < any > {
//   return this.get(`${this.analyticsEndpoint}/emi`, params, 'getEmiAnalytics');
// }

// exportFinancialsAnalytics(params ?: any): Observable < Blob > {
//   const httpParams = this.createHttpParams(params);
//   return this.http.get(`${this.baseUrl}${this.analyticsEndpoint}/export/financials`, {
//     params: httpParams,
//     responseType: 'blob'
//   });
// }

// }
//  */