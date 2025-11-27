import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators'; // <--- IMPORT THIS
import { BaseApiService } from '../../../core/services/base-api.service';
@Injectable({ providedIn: 'root' })
export class ProductService extends BaseApiService {
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

  searchProducts(query: any): Observable<any> {
    return this.get(`${this.endpoint}/search`, query, 'searchProducts');
  }

  // ================= UPDATE =================
  updateProduct(productId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}`, data, 'updateProduct');
  }

  // PATCH /v1/products/:id/upload
  uploadProductFile(productId: string, formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/${productId}/upload`;

    // 1. Use standard http.patch
    // 2. Use the fixed catchAndHandle
    return this.http.patch(url, formData)
      .pipe(this.catchAndHandle('uploadProductFile'));
  }

  restoreProduct(productId: string): Observable<any> {
    return this.patch(`${this.endpoint}/${productId}/restore`, {}, 'restoreProduct');
  }
  // ================= BULK OPERATIONS =================
  bulkImportProducts(formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/bulk-import`;
    return this.http.post(url, formData)
      .pipe(this.catchAndHandle('bulkImportProducts'));
  }
  bulkProductUpdate(formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/bulk-update`;
    return this.http.post(url, formData).pipe(this.catchAndHandle('bulkImportProducts'));
  }
  ProductsStockAdjustment(formData: FormData): Observable<any> {
    const url = `${this.baseUrl}${this.endpoint}/:id/stock-adjust`;
    return this.http.post(url, formData).pipe(this.catchAndHandle('bulkImportProducts'));
  }

  // ================= DELETE =================
  deleteProductById(productId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${productId}`, 'deleteProductById');
  }

  // ================= HELPER (FIXED) =================
  private catchAndHandle(operation: string) {
    return (source: Observable<any>) => {
      return source.pipe(
        // FIX: You must use the 'catchError' operator here
        catchError(err => this.errorhandler.handleError(err, operation))
      );
    };
  }
}
