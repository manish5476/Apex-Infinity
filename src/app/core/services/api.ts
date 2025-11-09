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
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('getMasterList', error)));
  }

  // ==========================================================
  // ORGANIZATION ENDPOINTS (from organizationController.js)
  // ==========================================================

  createNewOrganization(data: any): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/v1/organization/create`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('createNewOrganization', error)));
  }

  approveMember(data: { userId: string, roleId: string, branchId: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/organization/approve-member`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('approveMember', error)));
  }

  getPendingMembers(): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/v1/organization/pending-members`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('pendingMember', error)));
  }

  getMyOrganization(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/organization/my-organization`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('getMyOrganization', error)));
  }

  updateOrganization(data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/v1/organization/my-organization`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('updateOrganization', error)));
  }

  deleteMyOrganization(): Observable<any> {
    const url = `${this.baseUrl}/v1/organization/my-organization`;
    return this.http.delete(url).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('deleteMyOrganization', error)));
  }



  // ======================== notifications ENDPOINTS (from authController.js)  ============================
  getAllNotifications(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(`${this.baseUrl}/v1/notifications/my-notifications`).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('getAllNOtifications', error)));
  }

  getOrganizationRoles(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/v1/roles`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('getOrganizationRoles', error)));
  }

  getOrganizationBranches(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/branches`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('getOrganizationBranches', error)));
  }

  // ============================ // AUTH ENDPOINTS (from authController.js)  // ===========================

  login(credentials: any): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/v1/auth/login`, credentials)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('login', error)));
  }

  employeeSignup(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/auth/signup`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('employeeSignup', error)));
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/auth/forgotPassword`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('forgotPassword', error)));
  }

  resetPassword(token: string, data: any): Observable<LoginResponse> {
    return this.http
      .patch<LoginResponse>(`${this.baseUrl}/v1/auth/resetPassword/${token}`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('resetPassword', error)));
  }
  // ==========================================================
  // USER ENDPOINTS (from userController.js)
  // ==========================================================

  updateMyPassword(data: any): Observable<LoginResponse> {
    return this.http
      .patch<LoginResponse>(`${this.baseUrl}/v1/users/updateMyPassword`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('updateMyPassword', error)));
  }

  getMe(): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}/v1/users/me`)
      .pipe(catchError((error: HttpErrorResponse) =>
        this.errorhandler.handleError('getMe', error)
      ));
  }

  // ========================  // ROLE MANAGEMENT ENDPOINTS  // ========================
  getRoles(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/roles`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('getRoles', error)));
  }

  createRole(data: { name: string; permissions: string[] }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/v1/roles`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('createRole', error)));
  }

  updateRole(roleId: string, data: { name: string; permissions: string[] }): Observable<any> {
    return this.http
      .patch<any>(`${this.baseUrl}/v1/roles/${roleId}`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('updateRole', error)));
  }

  deleteRole(roleId: string): Observable<any> {
    return this.http
      .delete<any>(`${this.baseUrl}/v1/roles/${roleId}`)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('deleteRole', error)));
  }
}
