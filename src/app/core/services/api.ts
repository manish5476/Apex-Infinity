import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginResponse, User } from '../../modules/auth/services/auth-service';

@Injectable({
  providedIn: 'root',
})
export class ApiService extends BaseApiService {

  getMasterList(): Observable<{ data: any }> {
    return this.http
      .get<{ data: any }>(`${this.baseUrl}/v1/master-list`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMasterList')));
  }

  // ==========================================================
  // ORGANIZATION ENDPOINTS (from organizationController.js)
  // ==========================================================

  createNewOrganization(data: any): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/v1/organization/create`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createNewOrganization')));
  }

  approveMember(data: { userId: string, roleId: string, branchId: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/organization/approve-member`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'approveMember')));
  }

  getPendingMembers(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/v1/organization/pending-members`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'pendingMember')));
  }

  getMyOrganization(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/organization/my-organization`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMyOrganization')));
  }

  updateOrganization(data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/v1/organization/my-organization`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateOrganization')));
  }

  deleteMyOrganization(): Observable<any> {
    const url = `${this.baseUrl}/v1/organization/my-organization`;
    return this.http.delete(url).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteMyOrganization')));
  }



  // ======================== notifications ENDPOINTS (from authController.js)  ============================
  getAllNotifications(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.baseUrl}/v1/notifications/my-notifications`).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAllNOtifications')));
  }

  getOrganizationRoles(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/roles`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOrganizationRoles')));
  }

  getOrganizationBranches(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/branches`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOrganizationBranches')));
  }

  // ============================ // AUTH ENDPOINTS (from authController.js)  // ===========================

  login(credentials: any): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/v1/auth/login`, credentials)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'login')));
  }

  employeeSignup(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/auth/signup`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'employeeSignup')));
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/auth/forgotPassword`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'forgotPassword')));
  }

  resetPassword(token: string, data: any): Observable<LoginResponse> {
    return this.http
      .patch<LoginResponse>(`${this.baseUrl}/v1/auth/resetPassword/${token}`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'resetPassword')));
  }
  // ==========================================================
  // USER ENDPOINTS (from userController.js)
  // ==========================================================

  updateMyPassword(data: any): Observable<LoginResponse> {
    return this.http
      .patch<LoginResponse>(`${this.baseUrl}/v1/users/updateMyPassword`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateMyPassword')));
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}/v1/users/me`)
      .pipe(catchError((error: HttpErrorResponse) =>
        this.errorhandler.handleError(error, 'getMe')
      ));
  }

  // ========================  // ROLE MANAGEMENT ENDPOINTS  // ========================
  getRoles(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/roles`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getRoles')));
  }

  createRole(data: { name: string; permissions: string[] }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/v1/roles`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createRole')));
  }

  updateRole(roleId: string, data: { name: string; permissions: string[] }): Observable<any> {
    return this.http
      .patch<any>(`${this.baseUrl}/v1/roles/${roleId}`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateRole')));
  }

  deleteRole(roleId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}/v1/roles/${roleId}`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteRole')));
  }
}
