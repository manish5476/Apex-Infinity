import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class SupplierService extends BaseApiService {
  private endpoint = '/v1/suppliers';

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
    return this.delete(`${this.endpoint}/${id}`, 'deleteSupplier');
  }

  // For file upload (direct http usage needed for FormData if not auto-handled)
  // but can be done via post if your interceptor handles FormData correctly.
  // Usually manual post is safer for FormData to avoid Content-Type JSON headers.
}
