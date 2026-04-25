import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

// =============================================================================
// Interfaces for Payload Suggestions (IntelliSense)
// =============================================================================

export interface SearchCustomerQuery {
  q?: string;
  search?: string;
  query?: string;
  [key: string]: any;
}

export interface CheckDuplicateQuery {
  phone?: string;
  email?: string;
  gstNumber?: string;
}

export interface BulkUpdateCustomerPayload {
  customers: string[]; // Array of customer IDs
  updates: Partial<UpdateCustomerPayload>;
}

export interface BulkCreateCustomerPayload {
  customers: CreateCustomerPayload[];
}

export interface CreateCustomerPayload {
  partyName: string;
  phone: string;
  email?: string;
  address?: any;
  [key: string]: any; // Catch-all for "etc"
}

export interface UpdateCustomerPayload {
  partyName?: string;
  phone?: string;
  email?: string;
  status?: string;
  [key: string]: any;
}

export interface UpdateCreditLimitPayload {
  creditLimit: number;
}

// =============================================================================
// Customer Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class CustomerService extends BaseApiService {
  private endpoint = '/v1/customers';

  // ============================================================
  // ── Static & Bulk Routes ────────────────────────────────────
  // ============================================================

  searchCustomers(queryParams: SearchCustomerQuery): Observable<any> {
    return this.get(`${this.endpoint}/search`, queryParams, 'searchCustomers');
  }

  getCustomerFeed(customerId: string): Observable<any> {
    return this.get(`/v1/feed/customer/${customerId}`, {}, 'getCustomerFeed');
  }
  checkDuplicate(queryParams: CheckDuplicateQuery): Observable<any> {
    return this.get(`${this.endpoint}/check-duplicate`, queryParams, 'checkDuplicate');
  }

  bulkUpdateCustomers(data: BulkUpdateCustomerPayload): Observable<any> {
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

  updateCreditLimit(customerId: string, data: UpdateCreditLimitPayload): Observable<any> {
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

  updateCustomer(customerId: string, data: UpdateCustomerPayload): Observable<any> {
    return this.patch(`${this.endpoint}/${customerId}`, data, 'updateCustomer');
  }

  deleteCustomer(customerId: string): Observable<any> {
    // Fixed: Changed payload from {} to null for standard DELETE requests
    return this.delete(`${this.endpoint}/${customerId}`, null, 'deleteCustomer');
  }
}
