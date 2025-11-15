import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class BranchService extends BaseApiService {
  private endpoint = '/v1/branches';

  /**
   * 🧾 Create a new branch
   * Accessible to superadmin and admin (as per backend route restrictions)
   */
  createBranch(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}${this.endpoint}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'createBranch'),
        ),
      );
  }

  /**
   * 📋 Get all branches (supports optional filters)
   * GET /v1/branches
   */
  getAllBranches(filterParams?: any): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getAllBranches'),
        ),
      );
  }

  /**
   * 🏢 Get branches of the currently logged-in organization/user
   * GET /v1/branches/my-branches
   */
  getMyBranches(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/my-branches`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getMyBranches'),
        ),
      );
  }

  /**
   * 🔍 Get a single branch by ID
   * GET /v1/branches/:id
   */
  getBranchById(branchId: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}${this.endpoint}/${branchId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'getBranchById'),
        ),
      );
  }

  /**
   * ✏️ Update an existing branch
   * PATCH /v1/branches/:id
   */
  updateBranch(branchId: string, data: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}${this.endpoint}/${branchId}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'updateBranch'),
        ),
      );
  }

  /**
   * 🗑️ Delete a branch
   * DELETE /v1/branches/:id
   * Accessible only to superadmin (per backend restriction)
   */
  deleteBranch(branchId: string): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}${this.endpoint}/${branchId}`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError(error,'deleteBranch'),
        ),
      );
  }

  // 🚫 COMMENTED (future expansions)
  // ---------------------------------------------------------------------

  // /**
  //  * Restore a soft-deleted branch (if supported in backend)
  //  * PATCH /v1/branches/:id/restore
  //  */
  // restoreBranch(branchId: string): Observable<any> {
  //   return this.http
  //     .patch(`${this.baseUrl}${this.endpoint}/${branchId}/restore`, {})
  //     .pipe(
  //       catchError((error: HttpErrorResponse) =>
  //         this.errorhandler.handleError(error,'restoreBranch'),
  //       ),
  //     );
  // }

  // /**
  //  * Upload branch-related files (if supported later)
  //  * POST /v1/branches/:id/upload
  //  */
  // uploadBranchFile(formData: FormData, branchId: string): Observable<any> {
  //   const apiUrl = `${this.baseUrl}${this.endpoint}/${branchId}/upload`;
  //   return this.http.post(apiUrl, formData).pipe(
  //     catchError((error: any) =>
  //       this.errorhandler.handleError(error,'uploadBranchFile'),
  //     ),
  //   );
  // }
}
