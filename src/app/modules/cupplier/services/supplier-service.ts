import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SupplierService extends BaseApiService {
  // Base endpoint for this controller
  private endpoint = '/v1/suppliers';

  // --- STANDARD CRUD ---

  createSupplier(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createSupplier');
  }

  getAllSuppliers(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllSuppliers');
  }

  getSupplierList(): Observable<any[]> {
    return this.get(`${this.endpoint}/list`, {}, 'getSupplierList');
  }

  getSupplierById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getSupplierById');
  }

  updateSupplier(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateSupplier');
  }

  deleteSupplier(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, null, 'deleteSupplier');
  }

  // --- NEW: BULK IMPORT ---

  createBulkSupplier(data: any[]): Observable<any> {
    return this.post(`${this.endpoint}/bulk-supplier`, data, 'createBulkSupplier');
  }

  // --- NEW: SEARCH ---

  searchSuppliers(query: string): Observable<any> {
    return this.get(`${this.endpoint}/search`, { q: query }, 'searchSuppliers');
  }

  // --- NEW: DASHBOARD ANALYTICS ---

  getSupplierDashboard(id: string): Observable<any> {
    // This calls /v1/suppliers/:id/dashboard
    return this.get(`${this.endpoint}/${id}/dashboard`, {}, 'getSupplierDashboard');
  }
  downloadSupplierLedger(id: string, startDate?: string, endDate?: string): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get(`${this.endpoint}/${id}/ledger-export`, {
      params,
      responseType: 'blob' 
    });
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from '../../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class SupplierService extends BaseApiService {
//   private endpoint = '/v1/suppliers';

//   createSupplier(data: any): Observable<any> {
//     return this.post(this.endpoint, data, 'createSupplier');
//   }

//   getAllSuppliers(filterParams?: any): Observable<any> {
//     return this.get(this.endpoint, filterParams, 'getAllSuppliers');
//   }

//   getSupplierList(): Observable<any[]> {
//     return this.get(`${this.endpoint}/list`, {}, 'getSupplierList');
//   }

//   getSupplierById(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getSupplierById');
//   }

//   updateSupplier(id: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}`, data, 'updateSupplier');
//   }

//   deleteSupplier(id: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${id}`,null, 'deleteSupplier');
//   }

//   // For file upload (direct http usage needed for FormData if not auto-handled)
//   // but can be done via post if your interceptor handles FormData correctly.
//   // Usually manual post is safer for FormData to avoid Content-Type JSON headers.
// }
