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

  // ======================== ORGANIZATION ========================

  createNewOrganization(data: any): Observable<LoginResponse> {
    return this.post<LoginResponse>('/v1/organization/create', data, 'createNewOrganization');
  }

  approveMember(data: { userId: string, roleId: string, branchId: string }): Observable<any> {
    return this.post('/v1/organization/approve-member', data, 'approveMember');
  }

  getPendingMembers(): Observable<any> {
    return this.get('/v1/organization/pending-members', {}, 'getPendingMembers');
  }

  getMyOrganization(): Observable<any> {
    return this.get('/v1/organization/my-organization', {}, 'getMyOrganization');
  }

  updateOrganization(data: any): Observable<any> {
    return this.patch('/v1/organization/my-organization', data, 'updateOrganization');
  }

  deleteMyOrganization(): Observable<any> {
    return this.delete('/v1/organization/my-organization', 'deleteMyOrganization');
  }

  getOrganizationRoles(): Observable<any> {
    return this.get('/v1/roles', {}, 'getOrganizationRoles');
  }

  getOrganizationBranches(): Observable<any> {
    return this.get('/v1/branches', {}, 'getOrganizationBranches');
  }

  // ======================== AUTHENTICATION ========================

  login(credentials: any): Observable<LoginResponse> {
    return this.post<LoginResponse>('/v1/auth/login', credentials, 'login');
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

// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { BaseApiService } from './base-api.service';
// import { HttpErrorResponse,HttpParams } from '@angular/common/http';
// import { LoginResponse, User } from '../../modules/auth/services/auth-service';

// @Injectable({
//   providedIn: 'root',
// })
// export class ApiService extends BaseApiService {

//   getMasterList(): Observable<{ data: any }> {
//     return this.http
//       .get<{ data: any }>(`${this.baseUrl}/v1/master-list`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMasterList')));
//   }

//   /**
//    * 2. FETCH SPECIFIC (Lightweight)
//    * Gets ONLY the required list based on the 'type' name you send.
//    * URL: /v1/master-list/list?type=invoice
//    * * @param typeName - The key you want (e.g., 'invoice', 'customer', 'payment', 'emi')
//    */
//   getSpecificList(typeName: string): Observable<{ status: string; results: number; type: string; data: any[] }> {
//     let params = new HttpParams().set('type', typeName);
//     return this.http
//       .get<{ status: string; results: number; type: string; data: any[] }>(
//         `${this.baseUrl}/v1/master-list/list`,
//         { params }
//       )
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, `getSpecificList-${typeName}`)
//         )
//       );
//   }

//   // ==========================================================
//   // ORGANIZATION ENDPOINTS (from organizationController.js)
//   // ==========================================================

//   createNewOrganization(data: any): Observable<LoginResponse> {
//     return this.http
//       .post<LoginResponse>(`${this.baseUrl}/v1/organization/create`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createNewOrganization')));
//   }

//   approveMember(data: { userId: string, roleId: string, branchId: string }): Observable<any> {
//     return this.http
//       .post(`${this.baseUrl}/v1/organization/approve-member`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'approveMember')));
//   }

//   getPendingMembers(): Observable<any> {
//     return this.http
//       .get(`${this.baseUrl}/v1/organization/pending-members`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'pendingMember')));
//   }

//   getMyOrganization(): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}/v1/organization/my-organization`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getMyOrganization')));
//   }

//   updateOrganization(data: any): Observable<any> {
//     return this.http.patch(`${this.baseUrl}/v1/organization/my-organization`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateOrganization')));
//   }

//   deleteMyOrganization(): Observable<any> {
//     const url = `${this.baseUrl}/v1/organization/my-organization`;
//     return this.http.delete(url).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteMyOrganization')));
//   }



//   // ======================== notifications ENDPOINTS (from authController.js)  ============================
//   getAllNotifications(): Observable<LoginResponse> {
//     return this.http.get<LoginResponse>(`${this.baseUrl}/v1/notifications/my-notifications`).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAllNOtifications')));
//   }

//   getOrganizationRoles(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/v1/roles`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOrganizationRoles')));
//   }

//   getOrganizationBranches(): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}/v1/branches`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getOrganizationBranches')));
//   }

//   // ============================ // AUTH ENDPOINTS (from authController.js)  // ===========================

//   login(credentials: any): Observable<LoginResponse> {
//     return this.http
//       .post<LoginResponse>(`${this.baseUrl}/v1/auth/login`, credentials)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'login')));
//   }

//   employeeSignup(data: any): Observable<any> {
//     return this.http
//       .post(`${this.baseUrl}/v1/auth/signup`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'employeeSignup')));
//   }

//   forgotPassword(data: { email: string }): Observable<any> {
//     return this.http
//       .post(`${this.baseUrl}/v1/auth/forgotPassword`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'forgotPassword')));
//   }

//   resetPassword(token: string, data: any): Observable<LoginResponse> {
//     return this.http
//       .patch<LoginResponse>(`${this.baseUrl}/v1/auth/resetPassword/${token}`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'resetPassword')));
//   }
//   // ==========================================================
//   // USER ENDPOINTS (from userController.js)
//   // ==========================================================

//   updateMyPassword(data: any): Observable<LoginResponse> {
//     return this.http
//       .patch<LoginResponse>(`${this.baseUrl}/v1/users/updateMyPassword`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateMyPassword')));
//   }

//   getMe(): Observable<User> {
//     return this.http
//       .get<User>(`${this.baseUrl}/v1/users/me`)
//       .pipe(catchError((error: HttpErrorResponse) =>
//         this.errorhandler.handleError(error, 'getMe')
//       ));
//   }

//   // ========================  // ROLE MANAGEMENT ENDPOINTS  // ========================
//   getRoles(): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}/v1/roles`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getRoles')));
//   }

//   createRole(data: { name: string; permissions: string[] }): Observable<any> {
//     return this.http
//       .post<any>(`${this.baseUrl}/v1/roles`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createRole')));
//   }

//   updateRole(roleId: string, data: { name: string; permissions: string[] }): Observable<any> {
//     return this.http
//       .patch<any>(`${this.baseUrl}/v1/roles/${roleId}`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateRole')));
//   }

//   deleteRole(roleId: string): Observable<any> {
//     return this.http
//       .delete<any>(`${this.baseUrl}/v1/roles/${roleId}`)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteRole')));
//   }
// }
