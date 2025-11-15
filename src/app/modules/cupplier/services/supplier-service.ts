import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';

/**
 * 🧾 SupplierService
 * Handles all Supplier CRUD operations
 * Backend: /api/v1/suppliers
 */
@Injectable({ providedIn: 'root' })
export class SupplierService extends BaseApiService {
  private endpoint = '/v1/suppliers';

  /**
   * 🧾 Create a new supplier
   * POST /api/v1/suppliers
   * Access: Superadmin/Admin only
   */
  createSupplier(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}${this.endpoint}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'createSupplier'),
        ),
      );
  }

  /**
   * 📋 Get all suppliers (with optional filters)
   * GET /api/v1/suppliers
   */
  getAllSuppliers(filterParams?: any): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getAllSuppliers'),
        ),
      );
  }

  /**
   * 📜 Get supplier list for dropdown
   * GET /api/v1/suppliers/list
   */
  getSupplierList(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}${this.endpoint}/list`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getSupplierList'),
        ),
      );
  }

  /**
   * 🔍 Get supplier by ID
   * GET /api/v1/suppliers/:id
   */
  getSupplierById(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getSupplierById'),
        ),
      );
  }

  /**
   * ✏️ Update supplier
   * PATCH /api/v1/suppliers/:id
   */
  updateSupplier(id: string, data: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${id}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'updateSupplier'),
        ),
      );
  }

  /**
   * 🗑️ Delete supplier
   * DELETE /api/v1/suppliers/:id
   * Access: Superadmin only
   */
  deleteSupplier(id: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}${this.endpoint}/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'deleteSupplier'),
        ),
      );
  }

  // 🚫 Optional: Reserved for future use
  // -------------------------------------------------------------

  // uploadProfileImage(formData: FormData, supplierId: string): Observable<any> {
  //   const apiUrl = `${this.baseUrl}${this.endpoint}/${supplierId}/upload`;
  //   return this.http.post(apiUrl, formData).pipe(
  //     catchError((error: HttpErrorResponse) =>
  //       this.errorhandler.handleError(error,'uploadProfileImage'),
  //     ),
  //   );
  // }
}
