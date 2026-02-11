import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

export interface StockAdjustmentPayload {
  type: 'add' | 'subtract';
  quantity: number;
  reason: string;
  branchId?: string; 
}

export interface StockTransferPayload {
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService extends BaseApiService {
  // Ensure this matches your backend route prefix
  private endpoint = '/v1/products';

  // ================= CREATE =================
  createProduct(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createProduct');
  }

  // ================= GET =================
  getAllProducts(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllProducts');
  }

  getProductById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getProductById');
  }

  // Used for dropdown search
  searchProducts(query: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, query, 'searchProducts');
  }

  // ================= UPDATE =================
  updateProduct(productId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}`, data, 'updateProduct');
  }

  // PATCH /v1/products/:id/upload
  uploadProductFile(productId: string, formData: FormData): Observable<any> {
    // We access this.http directly for FormData to avoid Content-Type JSON headers
    // defined in standard BaseApiService wrappers
    const url = `${this.baseUrl}${this.endpoint}/${productId}/upload`;
    return this.http.patch(url, formData)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProductFile')));
  }

  restoreProduct(productId: string): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}/restore`, {}, 'restoreProduct');
  }

  // ================= BULK OPERATIONS =================

  // 1. Bulk Import (Create New)
  bulkImportProducts(products: any[]): Observable<any> {
    const url = `${this.endpoint}/bulk-import`;
    return this.post(url, products, 'bulkImportProducts');
  }

  // 2. Bulk Update (Edit Existing)
  bulkUpdateProducts(products: any[]): Observable<any> {
    const url = `${this.endpoint}/bulk-update`;
    return this.post(url, products, 'bulkUpdateProducts');
  }

  // ================= STOCK MANAGEMENT =================

  // Adjust Stock (Gain/Loss)
  adjustProductStock(id: string, payload: StockAdjustmentPayload): Observable<any> {
    const url = `${this.endpoint}/${id}/stock-adjust`;
    return this.post(url, payload, 'ProductsStockAdjustment');
  }

  // Transfer Stock (Branch to Branch)
  transferProductStock(id: string, payload: StockTransferPayload): Observable<any> {
    const url = `${this.endpoint}/${id}/stock-transfer`;
    return this.post(url, payload, 'ProductStockTransfer');
  }

  getProductHistory(id: string, startDate?: string | Date | any, endDate?: string | Date | any): Observable<any> {
    const params: any = {};
    
    // Check if it's already a string before calling toISOString()
    if (startDate) {
      params.startDate = typeof startDate === 'string' ? startDate : startDate.toISOString();
    }
    if (endDate) {
      params.endDate = typeof endDate === 'string' ? endDate : endDate.toISOString();
    }

    const url = `${this.endpoint}/${id}/history`;
    return this.get(url, params, 'ProductHistory');
  }
  // ================= DELETE =================
  deleteProductById(productId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${productId}`, null, 'deleteProductById');
  }
}
