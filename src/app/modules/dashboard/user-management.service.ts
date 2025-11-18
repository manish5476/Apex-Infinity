import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class UserManagementService extends BaseApiService {
  
  // === USERS (/v1/users) ===

  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/users/me`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMyProfile'))
    );
  }

  uploadProfilePhoto(formData: FormData): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/v1/users/me/photo`, formData).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'uploadProfilePhoto'))
    );
  }

  // === ROLES (/v1/roles) ===

  getAllRoles(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/roles`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAllRoles'))
    );
  }

  createRole(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/v1/roles`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createRole'))
    );
  }

  updateRole(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/v1/roles/${id}`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateRole'))
    );
  }

  deleteRole(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/v1/roles/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteRole'))
    );
  }
}