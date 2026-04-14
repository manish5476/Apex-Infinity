import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../../core/services/base-api.service';

// =============================================================================
// Interfaces
// =============================================================================

export interface CreateProductPayload {
  name: string;
  sku: string;
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  unitId?: string;
  price?: number;
  taxes?: any;
  [key: string]: any;
}

export interface StockAdjustmentPayload {
  quantity: number; // The amount to change
  reason: string;   // e.g., 'Damaged', 'Restock'
}

export interface StockTransferPayload {
  toBranchId: string;
  quantity: number;
}

export interface ScanProductPayload {
  barcode: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService extends BaseApiService {
  private endpoint = '/v1/products';

  // ================= CREATE / READ =================

  createProduct(data: CreateProductPayload): Observable<any> {
    return this.post(this.endpoint, data, 'createProduct');
  }

  getAllProducts(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllProducts');
  }

  getProductById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getProductById');
  }

  searchProducts(q: string): Observable<any> {
    // Standardizing search to send ?q=value
    return this.get(`${this.endpoint}/search`, { q }, 'searchProducts');
  }

  scanProduct(payload: ScanProductPayload): Observable<any> {
    return this.post(`${this.endpoint}/scan`, payload, 'scanProduct');
  }

  // ================= UPDATE / RESTORE =================

  updateProduct(productId: string, data: Partial<CreateProductPayload>): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}`, data, 'updateProduct');
  }

  restoreProduct(productId: string): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}/restore`, {}, 'restoreProduct');
  }

  uploadProductFile(productId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/${productId}/upload`;
    // Accessing raw HttpClient to avoid default JSON content-type headers
    return this.http.patch(url, formData)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProductFile')));
  }

  // ================= BULK OPERATIONS =================

  bulkImportProducts(products: any[]): Observable<any> {
    // Wrapping in object to match controller @payload { products* }
    return this.post(`${this.endpoint}/bulk-import`, { products }, 'bulkImportProducts');
  }

  bulkUpdateProducts(products: any[]): Observable<any> {
    return this.post(`${this.endpoint}/bulk-update`, { products }, 'bulkUpdateProducts');
  }

  // ================= STOCK & HISTORY =================

  adjustProductStock(id: string, payload: StockAdjustmentPayload): Observable<any> {
    return this.post(`${this.endpoint}/${id}/stock-adjust`, payload, 'adjustStock');
  }

  transferProductStock(id: string, payload: StockTransferPayload): Observable<any> {
    return this.post(`${this.endpoint}/${id}/stock-transfer`, payload, 'transferStock');
  }

  getProductHistory(id: string, params?: { startDate?: string; endDate?: string }): Observable<any> {
    return this.get(`${this.endpoint}/${id}/history`, params, 'getProductHistory');
  }

  getLowStockProducts(): Observable<any> {
    return this.get(`${this.endpoint}/reports/low-stock`, {}, 'getLowStockProducts');
  }

  // ================= DELETE =================

  deleteProductById(productId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${productId}`, null, 'deleteProductById');
  }
}
