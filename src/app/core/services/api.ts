import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { LoginResponse, User } from '../../modules/auth/services/auth-service';

// Interfaces for type safety
export interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface ListResponse<T> {
  status: string;
  results: number;
  type: string;
  data: T[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService extends BaseApiService {

  getMasterList(): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/v1/master-list', {}, 'getMasterList');
  }
  
  permissions(): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/v1/master-list/permissions', {}, 'getMasterList');
  }

  /**
   * Fetch specific list (e.g. Invoice, Customer)
   * We pass a simple object { type: typeName }, and BaseService handles the params conversion.
   */
  getSpecificList(typeName: string): Observable<ListResponse<any>> {
    return this.get<ListResponse<any>>(
      '/v1/master-list/list',
      { type: typeName },
      `getSpecificList-${typeName}`
    );
  }

  login(credentials: any): Observable<LoginResponse> {
    return this.post<LoginResponse>('/v1/auth/login', credentials, 'login');
  }

  logOut(): Observable<LoginResponse> {
    return this.post<LoginResponse>('/v1/auth/logout', {}, 'logout');
  }

  employeeSignup(data: any): Observable<any> {
    return this.post('/v1/auth/signup', data, 'employeeSignup');
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.post('/v1/auth/forgotPassword', data, 'forgotPassword');
  }

  resetPassword(token: string, data: any): Observable<LoginResponse> {
    return this.patch<LoginResponse>(`/v1/auth/resetPassword/${token}`, data, 'resetPassword');
  }

  getAllNotifications(): Observable<LoginResponse> {
    return this.get<LoginResponse>('/v1/notifications/my-notifications', {}, 'getAllNotifications');
  }
  // ======================== AUTH EXTRA ROUTES ========================

  // Refresh JWT Token
  refreshToken(): Observable<any> {
    return this.post('/v1/auth/refresh-token', {}, 'refreshToken');
  }

  // Verify Token Validity (useful on app load)
  verifyToken(): Observable<any> {
    return this.get('/v1/auth/verify-token', {}, 'verifyToken');
  }


  // ======================== USER ========================

  updateMyPassword(data: any): Observable<LoginResponse> {
    return this.patch<LoginResponse>('/v1/users/updateMyPassword', data, 'updateMyPassword');
  }

  getMe(): Observable<User> {
    return this.get<User>('/v1/users/me', {}, 'getMe');
  }
// ======================== USER SELF-MANAGEMENT (Missing) ========================

  updateMyProfile(data: any): Observable<any> {
    return this.patch('/v1/users/me', data, 'updateMyProfile');
  }

  uploadProfilePhoto(formData: FormData): Observable<any> {
    // Note: formData must be passed directly, don't wrap it in {}
    return this.patch('/v1/users/me/photo', formData, 'uploadProfilePhoto');
  }

  // ======================== ADMIN USER MANAGEMENT (Missing) ========================

  getAllUsers(): Observable<any> {
    return this.get('/v1/users', {}, 'getAllUsers');
  }

  createUser(data: any): Observable<any> {
    return this.post('/v1/users', data, 'createUser');
  }

  searchUsers(query: string): Observable<any> {
    return this.get('/v1/users/search', { q: query }, 'searchUsers');
  }

  getUser(id: string): Observable<any> {
    return this.get(`/v1/users/${id}`, {}, 'getUser');
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.patch(`/v1/users/${id}`, data, 'updateUser');
  }

  deleteUser(id: string): Observable<any> {
    return this.delete(`/v1/users/${id}`, 'deleteUser');
  }

  // --- Security & Status ---

  deactivateUser(id: string): Observable<any> {
    return this.patch(`/v1/users/${id}/deactivate`, {}, 'deactivateUser');
  }

  activateUser(id: string): Observable<any> {
    return this.patch(`/v1/users/${id}/activate`, {}, 'activateUser');
  }

  adminUpdatePassword(id: string, password: string): Observable<any> {
    return this.patch(`/v1/users/${id}/password`, { password }, 'adminUpdatePassword');
  }

  getUserActivity(id: string): Observable<any> {
    return this.get(`/v1/users/${id}/activity`, {}, 'getUserActivity');
  }
  // ======================== ROLES ========================

  getRoles(): Observable<any> {
    return this.get('/v1/roles', {}, 'getRoles');
  }

  createRole(data: { name: string; permissions: string[] }): Observable<any> {
    return this.post('/v1/roles', data, 'createRole');
  }

  updateRole(roleId: string, data: { name: string; permissions: string[] }): Observable<any> {
    return this.patch(`/v1/roles/${roleId}`, data, 'updateRole');
  }

  deleteRole(roleId: string): Observable<any> {
    return this.delete(`/v1/roles/${roleId}`, 'deleteRole');
  }
}

