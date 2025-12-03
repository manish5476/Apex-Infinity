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

  // ======================== MASTER LISTS ========================

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



  // ======================== ORGANIZATION ========================

  // createNewOrganization(data: any): Observable<LoginResponse> {
  //   return this.post<LoginResponse>('/v1/organization/create', data, 'createNewOrganization');
  // }

  // approveMember(data: { userId: string, roleId: string, branchId: string }): Observable<any> {
  //   return this.post('/v1/organization/approve-member', data, 'approveMember');
  // }

  // getPendingMembers(): Observable<any> {
  //   return this.get('/v1/organization/pending-members', {}, 'getPendingMembers');
  // }

  // getMyOrganization(): Observable<any> {
  //   return this.get('/v1/organization/my-organization', {}, 'getMyOrganization');
  // }

  // updateOrganization(data: any): Observable<any> {
  //   return this.patch('/v1/organization/my-organization', data, 'updateOrganization');
  // }

  // deleteMyOrganization(): Observable<any> {
  //   return this.delete('/v1/organization/my-organization', 'deleteMyOrganization');
  // }

  // getOrganizationRoles(): Observable<any> {
  //   return this.get('/v1/roles', {}, 'getOrganizationRoles');
  // }

  // getOrganizationBranches(): Observable<any> {
  //   return this.get('/v1/branches', {}, 'getOrganizationBranches');
  // }

  // ======================== AUTHENTICATION ========================
