import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../core/services/base-api.service';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class SupplierService extends BaseApiService {
  // Base endpoint for this controller
  private endpoint = '/v1/suppliers';

  // --- STANDARD CRUD 
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
    return this.get(`${this.endpoint}/${id}/dashboard`, {}, 'getSupplierDashboard');
  }

  downloadSupplierLedger(id: string, startDate?: string, endDate?: string): Observable<Blob> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get(`${this.baseUrl}${this.endpoint}/${id}/ledger-export`, {
      params,
      responseType: 'blob',
      withCredentials: true,
    });
  }

  // ==========================================
  // 🟢 NEW: KYC DOCUMENT MANAGEMENT
  // ==========================================

  uploadKycDocument(id: string, file: File, docType: string): Observable<any> {
    // We must use FormData to send files via HTTP
    const formData = new FormData();
    formData.append('file', file);       // The actual file
    formData.append('docType', docType); // The type (e.g., 'GST_CERTIFICATE')

    return this.post(`${this.endpoint}/${id}/kyc`, formData, 'uploadKycDocument');
  }

  deleteKycDocument(id: string, docId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}/kyc/${docId}`, null, 'deleteKycDocument');
  }
}
