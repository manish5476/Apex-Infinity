import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class OrganizationService extends BaseApiService {
  private endpoint = '/v1/organization';

  // --- Admin Managing their own Org ---

  getMyOrganization(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}/my-organization`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMyOrganization'))
    );
  }

  updateMyOrganization(data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}${this.endpoint}/my-organization`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateMyOrganization'))
    );
  }

  getPendingMembers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}/pending-members`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getPendingMembers'))
    );
  }

  approveMember(data: { userId: string, roleId: string, branchId?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${this.endpoint}/approve-member`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'approveMember'))
    );
  }

  // --- Platform Admin Routes (Optional usage) ---
  
  getAllOrganizations(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAllOrganizations'))
    );
  }

  /**
   * Get specific organization (Platform Admin)
   * GET /v1/organization/:id
   */
  getOrganizationById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOrganizationById'))
    );
  }

  /**
   * Update specific organization (Platform Admin)
   * PATCH /v1/organization/:id
   */
  updateOrganization(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}${this.endpoint}/${id}`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateOrganization'))
    );
  }

  /**
   * Delete organization (Platform Admin)
   * DELETE /v1/organization/:id
   */
  deleteOrganization(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}${this.endpoint}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteOrganization'))
    );
  }
  
}