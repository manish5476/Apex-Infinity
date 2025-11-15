import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class ProductService extends BaseApiService {
  private endpoint = '/v1/products';

  /**
   * Create a new product
   */
  createProduct(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}${this.endpoint}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'createProduct'),
        ),
      );
  }

  /**
   * Get all products (supports filters if needed)
   */
  getAllProducts(filterParams?: any): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getAllProducts'),
        ),
      );
  }

  /**
   * Get a product by ID
   */
  getProductById(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getProductById'),
        ),
      );
  }

  /**
   * Update product by ID
   */
  updateProduct(productId: string, data: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${productId}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'updateProduct'),
        ),
      );
  }

  /**
   * Restore a soft-deleted product
   */
  restoreProduct(productId: string): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${productId}/restore`, {})
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'restoreProduct'),
        ),
      );
  }

  /**
   * Delete a product by ID
   */
  deleteProductById(productId: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}${this.endpoint}/${productId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'deleteProductById'),
        ),
      );
  }

  // 🔒 The following routes are currently NOT defined in your backend routes
  // ----------------------------------------------------------------------

  // /**
  //  * Delete multiple products at once
  //  * (Needs DELETE /v1/products with body { ids: [] })
  //  */
  // deleteProducts(productIds: string[]): Observable<any> {
  //   const url = `${this.baseUrl}${this.endpoint}`;
  //   const body = { ids: productIds };
  //   return this.http
  //     .delete(url, { body })
  //     .pipe(
  //       catchError((error: HttpErrorResponse) =>
  //         this.errorhandler.handleError(error,'deleteProducts'),
  //       ),
  //     );
  // }

  // /**
  //  * Upload product image
  //  * (Needs POST /v1/products/:id/upload)
  //  */
  // uploadProductImage(formData: FormData, productId: string): Observable<any> {
  //   const apiUrl = `${this.baseUrl}${this.endpoint}/${productId}/upload`;
  //   return this.http.post(apiUrl, formData).pipe(
  //     catchError((error: HttpErrorResponse) =>
  //       this.errorhandler.handleError(error,'uploadProductImage'),
  //     ),
  //   );
  // }
}
