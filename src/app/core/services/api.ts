import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { LoginResponse, User, VerifyTokenResponse, SignupResponse } from '../../modules/auth/services/auth-service';

// ======================================================
// INTERFACES
// ======================================================

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface ListResponse<T> {
  status: string;
  results: number;
  total?: number;
  page?: number;
  totalPages?: number;
  data: T[];
}

// ======================================================
// API SERVICE
// ======================================================

@Injectable({
  providedIn: 'root',
})
export class ApiService extends BaseApiService {

  // ======================== AUTH ROUTES ========================

  /**
   * Login with email/phone
   */
  login(credentials: any): Observable<LoginResponse> {
    return this.post<LoginResponse>('/v1/auth/login', credentials, 'login');
  }

  /**
   * Employee signup (requires approval)
   */
  employeeSignup(data: any): Observable<SignupResponse> {
    return this.post<SignupResponse>('/v1/auth/signup', data, 'employeeSignup');
  }

  /**
   * Logout current user
   */
  logOut(): Observable<{ status: string; message: string }> {
    return this.post<{ status: string; message: string }>('/v1/auth/logout', {}, 'logout');
  }

  /**
   * Logout from all devices
   */
  logoutAll(): Observable<{ status: string; message: string }> {
    return this.post<{ status: string; message: string }>('/v1/auth/logout-all', {}, 'logoutAll');
  }

  /**
   * Refresh JWT Token
   */
  refreshToken(): Observable<{ status: string; token: string }> {
    return this.post<{ status: string; token: string }>('/v1/auth/refresh-token', {}, 'refreshToken');
  }

  /**
   * Verify Token Validity
   */
  verifyToken(): Observable<VerifyTokenResponse> {
    return this.get<VerifyTokenResponse>('/v1/auth/verify-token', {}, 'verifyToken');
  }

  /**
   * Forgot password - send reset email
   */
  forgotPassword(data: { email: string }): Observable<{ status: string; message: string }> {
    return this.post<{ status: string; message: string }>('/v1/auth/forgotPassword', data, 'forgotPassword');
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, data: any): Observable<LoginResponse> {
    return this.patch<LoginResponse>(`/v1/auth/resetPassword/${token}`, data, 'resetPassword');
  }

  /**
   * Send email verification link
   */
  sendVerificationEmail(): Observable<{ status: string; message: string }> {
    return this.post<{ status: string; message: string }>('/v1/auth/send-verification-email', {}, 'sendVerificationEmail');
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string): Observable<{ status: string; message: string }> {
    return this.get<{ status: string; message: string }>(`/v1/auth/verify-email/${token}`, {}, 'verifyEmail');
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): Observable<{ sessions: any[] }> {
    return this.get<{ sessions: any[] }>('/v1/auth/sessions', {}, 'getActiveSessions');
  }

  /**
   * Terminate specific session
   */
  terminateSession(sessionId: string): Observable<{ status: string; message: string }> {
    return this.delete<{ status: string; message: string }>(`/v1/auth/sessions/${sessionId}`, null, 'terminateSession');
  }

  // ======================== USER ROUTES ========================

  /**
   * Get current user profile
   */
  getMe(): Observable<{ status: string; data: { user: User } }> {
    return this.get<{ status: string; data: { user: User } }>('/v1/users/me', {}, 'getMe');
  }

  /**
   * Update current user profile
   */
  updateMyProfile(data: any): Observable<any> {
    return this.patch('/v1/users/me', data, 'updateMyProfile');
  }

  /**
   * Upload profile photo
   */
  uploadProfilePhoto(formData: FormData): Observable<any> {
    return this.patch('/v1/users/me/photo', formData, 'uploadProfilePhoto');
  }

  /**
   * Update my password
   */
  updateMyPassword(data: any): Observable<LoginResponse> {
    return this.patch<LoginResponse>('/v1/users/updateMyPassword', data, 'updateMyPassword');
  }

  /**
   * Get my permissions
   */
  getMyPermissions(): Observable<{ status: string; data: any }> {
    return this.get<{ status: string; data: any }>('/v1/users/me/permissions', {}, 'getMyPermissions');
  }

  // ======================== ADMIN USER MANAGEMENT ========================

  /**
   * Get all users (admin)
   */
  getAllUsers(params?: any): Observable<ListResponse<User>> {
    return this.get<ListResponse<User>>('/v1/users', params || {}, 'getAllUsers');
  }

  /**
   * Search users
   */
  searchUsers(query: string): Observable<ListResponse<User>> {
    return this.get<ListResponse<User>>('/v1/users/search', { q: query }, 'searchUsers');
  }

  /**
   * Get user by ID
   */
  getUser(id: string): Observable<{ status: string; data: { user: User } }> {
    return this.get<{ status: string; data: { user: User } }>(`/v1/users/${id}`, {}, 'getUser');
  }

  /**
   * Create new user (admin)
   */
  createUser(data: any): Observable<{ status: string; data: { user: User } }> {
    return this.post<{ status: string; data: { user: User } }>('/v1/users', data, 'createUser');
  }

  /**
   * Update user (admin)
   */
  updateUser(id: string, data: any): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>(`/v1/users/${id}`, data, 'updateUser');
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(id: string): Observable<any> {
    return this.delete(`/v1/users/${id}`, null, 'deleteUser');
  }

  /**
   * Get user activity logs
   */
  getUserActivity(id: string): Observable<any> {
    return this.get(`/v1/users/${id}/activity`, {}, 'getUserActivity');
  }

  /**
   * Get organization hierarchy
   */
  getOrgHierarchy(): Observable<any> {
    return this.get('/v1/users/hierarchy', {}, 'getOrgHierarchy');
  }

  // --- User Status Management ---

  /**
   * Activate user
   */
  activateUser(id: string): Observable<any> {
    return this.patch(`/v1/users/${id}/activate`, {}, 'activateUser');
  }

  /**
   * Deactivate user
   */
  deactivateUser(id: string): Observable<any> {
    return this.patch(`/v1/users/${id}/deactivate`, {}, 'deactivateUser');
  }

  /**
   * Toggle user block status
   */
  toggleUserBlock(data: { userId: string; blockStatus: boolean; reason?: string }): Observable<any> {
    return this.post('/v1/users/toggle-block', data, 'toggleUserBlock');
  }

  /**
   * Admin update user password
   */
  adminUpdatePassword(id: string, password: string, passwordConfirm: string): Observable<any> {
    return this.patch(`/v1/users/${id}/password`, { password, passwordConfirm }, 'adminUpdatePassword');
  }

  /**
   * Upload user photo by admin
   */
  uploadUserPhotoByAdmin(id: string, formData: FormData): Observable<any> {
    return this.patch(`/v1/users/${id}/photo`, formData, 'uploadUserPhotoByAdmin');
  }

  // ======================== ROLES ========================

  /**
   * Get all roles
   */
  getRoles(): Observable<ListResponse<any>> {
    return this.get<ListResponse<any>>('/v1/roles', {}, 'getRoles');
  }

  /**
   * Create new role
   */
  createRole(data: { name: string; permissions: string[] }): Observable<any> {
    return this.post('/v1/roles', data, 'createRole');
  }

  /**
   * Update role
   */
  updateRole(roleId: string, data: { name: string; permissions: string[] }): Observable<any> {
    return this.patch(`/v1/roles/${roleId}`, data, 'updateRole');
  }

  /**
   * Delete role
   */
  deleteRole(roleId: string): Observable<any> {
    return this.delete(`/v1/roles/${roleId}`, null, 'deleteRole');
  }

  // ======================== MASTER LIST ROUTES ========================

  /**
   * Get master list data
   */
  getMasterList(filters?: any): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/v1/master-list', filters || {}, 'getMasterList');
  }
  
  /**
   * Get permissions list
   */
  permissions(): Observable<ApiResponse<any>> {
    return this.get<ApiResponse<any>>('/v1/master-list/permissions', {}, 'getMasterList');
  }

  /**
   * Fetch specific list with advanced filters
   */
  getSpecificList(typeName: string, filters?: any): Observable<ListResponse<any>> {
    return this.get<ListResponse<any>>(
      '/v1/master-list/list',
      { type: typeName, ...filters },
      `getSpecificList-${typeName}`
    );
  }

  /**
   * Get filter options for a specific entity type
   */
  getFilterOptions(type: string): Observable<any> {
    return this.get<any>(
      '/v1/master-list/filter-options',
      { type },
      `getFilterOptions-${type}`
    );
  }

  /**
   * Get quick stats dashboard
   */
  getQuickStats(period?: string): Observable<any> {
    return this.get<any>(
      '/v1/master-list/quick-stats',
      { period: period || 'month' },
      'getQuickStats'
    );
  }

  /**
   * Get entity details by type and ID
   */
  getEntityDetails(type: string, id: string): Observable<any> {
    return this.get<any>(
      `/v1/master-list/details/${type}/${id}`,
      {},
      `getEntityDetails-${type}-${id}`
    );
  }

  /**
   * Export filtered data
   */
  exportFilteredData(params: any): Observable<Blob> {
    return this.getBlob(
      '/v1/master-list/export-filtered',
      params,
      `exportFilteredData-${params.type || 'all'}`
    );
  }

  /**
   * Export master list
   */
  exportMasterList(format: string = 'json'): Observable<Blob> {
    return this.getBlob(
      '/v1/master-list/export',
      { format },
      'exportMasterList'
    );
  }

  // ======================== NOTIFICATIONS ========================

  /**
   * Get my notifications
   */
  getMyNotifications(params?: any): Observable<any> {
    return this.get('/v1/notifications/my-notifications', params || {}, 'getMyNotifications');
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(id: string): Observable<any> {
    return this.patch(`/v1/notifications/${id}/read`, {}, 'markNotificationAsRead');
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead(): Observable<any> {
    return this.patch('/v1/notifications/read-all', {}, 'markAllNotificationsAsRead');
  }

  // ======================== HRMS ROUTES ========================
  // These will be moved to a separate HRMSService later
  // But included here for completeness

  /**
   * Get departments
   */
  getDepartments(params?: any): Observable<any> {
    return this.get('/v1/hrms/departments', params || {}, 'getDepartments');
  }

  /**
   * Get shifts
   */
  getShifts(params?: any): Observable<any> {
    return this.get('/v1/hrms/shifts', params || {}, 'getShifts');
  }

  /**
   * Get leave requests
   */
  getLeaveRequests(params?: any): Observable<any> {
    return this.get('/v1/hrms/leave-requests', params || {}, 'getLeaveRequests');
  }

  /**
   * Get attendance logs
   */
  getAttendanceLogs(params?: any): Observable<any> {
    return this.get('/v1/hrms/attendance/logs', params || {}, 'getAttendanceLogs');
  }

  /**
   * Get holidays
   */
  getHolidays(params?: any): Observable<any> {
    return this.get('/v1/hrms/attendance/holidays', params || {}, 'getHolidays');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from './base-api.service';
// import { LoginResponse, User } from '../../modules/auth/services/auth-service';

// // Interfaces for type safety
// export interface ApiResponse<T> {
//   status: string;
//   data: T;
// }

// export interface ListResponse<T> {
//   status: string;
//   results: number;
//   type: string;
//   data: T[];
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class ApiService extends BaseApiService {

//   // getMasterList(): Observable<ApiResponse<any>> {
//   //   return this.get<ApiResponse<any>>('/v1/master-list', {}, 'getMasterList');
//   // }
  
//   // permissions(): Observable<ApiResponse<any>> {
//   //   return this.get<ApiResponse<any>>('/v1/master-list/permissions', {}, 'getMasterList');
//   // }
//  // ======================== MASTER LIST ROUTES ========================

//   getMasterList(filters?: any): Observable<ApiResponse<any>> {
//     return this.get<ApiResponse<any>>('/v1/master-list', filters || {}, 'getMasterList');
//   }
  
//   permissions(): Observable<ApiResponse<any>> {
//     return this.get<ApiResponse<any>>('/v1/master-list/permissions', {}, 'getMasterList');
//   }

//   /**
//    * Fetch specific list with advanced filters
//    */
//   getSpecificList(typeName: string, filters?: any): Observable<ListResponse<any>> {
//     return this.get<ListResponse<any>>(
//       '/v1/master-list/list',
//       { type: typeName, ...filters },
//       `getSpecificList-${typeName}`
//     );
//   }

//   /**
//    * Get filter options for a specific entity type
//    */
//   getFilterOptions(type: string): Observable<any> {
//     return this.get<any>(
//       '/v1/master-list/filter-options',
//       { type },
//       `getFilterOptions-${type}`
//     );
//   }

//   /**
//    * Get quick stats dashboard
//    */
//   getQuickStats(period?: string): Observable<any> {
//     return this.get<any>(
//       '/v1/master-list/quick-stats',
//       { period: period || 'month' },
//       'getQuickStats'
//     );
//   }

//   /**
//    * Get entity details by type and ID
//    */
//   getEntityDetails(type: string, id: string): Observable<any> {
//     return this.get<any>(
//       `/v1/master-list/details/${type}/${id}`,
//       {},
//       `getEntityDetails-${type}-${id}`
//     );
//   }

//   /**
//    * Export filtered data
//    */
//   exportFilteredData(params: any): Observable<Blob> {
//     return this.getBlob(
//       '/v1/master-list/export-filtered',
//       params,
//       `exportFilteredData-${params.type || 'all'}`
//     );
//   }

//   /**
//    * Export master list
//    */
//   exportMasterList(format: string = 'json'): Observable<Blob> {
//     return this.getBlob(
//       '/v1/master-list/export',
//       { format },
//       'exportMasterList'
//     );
//   }
//   /**
//    * Fetch specific list (e.g. Invoice, Customer)
//    * We pass a simple object { type: typeName }, and BaseService handles the params conversion.
//    */
//   // getSpecificList(typeName: string): Observable<ListResponse<any>> {
//   //   return this.get<ListResponse<any>>(
//   //     '/v1/master-list/list',
//   //     { type: typeName },
//   //     `getSpecificList-${typeName}`
//   //   );
//   // }

//   login(credentials: any): Observable<LoginResponse> {
//     return this.post<LoginResponse>('/v1/auth/login', credentials, 'login');
//   }

//   logOut(): Observable<LoginResponse> {
//     return this.post<LoginResponse>('/v1/auth/logout', {}, 'logout');
//   }

//   employeeSignup(data: any): Observable<any> {
//     return this.post('/v1/auth/signup', data, 'employeeSignup');
//   }

//   forgotPassword(data: { email: string }): Observable<any> {
//     return this.post('/v1/auth/forgotPassword', data, 'forgotPassword');
//   }

//   resetPassword(token: string, data: any): Observable<LoginResponse> {
//     return this.patch<LoginResponse>(`/v1/auth/resetPassword/${token}`, data, 'resetPassword');
//   }

//   // getAllNotifications(): Observable<LoginResponse> {
//   //   return this.get<LoginResponse>('/v1/notifications/my-notifications', {}, 'getAllNotifications');
//   // }
//   // ======================== AUTH EXTRA ROUTES ========================

//   // Refresh JWT Token
//   refreshToken(): Observable<any> {
//     return this.post('/v1/auth/refresh-token', {}, 'refreshToken');
//   }

//   // Verify Token Validity (useful on app load)
//   verifyToken(): Observable<any> {
//     return this.get('/v1/auth/verify-token', {}, 'verifyToken');
//   }

//   // ======================== USER ========================

//   updateMyPassword(data: any): Observable<LoginResponse> {
//     return this.patch<LoginResponse>('/v1/users/updateMyPassword', data, 'updateMyPassword');
//   }

//   getMe(): Observable<User> {
//     return this.get<User>('/v1/users/me', {}, 'getMe');
//   }
// // ======================== USER SELF-MANAGEMENT (Missing) ========================

//   updateMyProfile(data: any): Observable<any> {
//     return this.patch('/v1/users/me', data, 'updateMyProfile');
//   }

//   uploadProfilePhoto(formData: FormData): Observable<any> {
//     // Note: formData must be passed directly, don't wrap it in {}
//     return this.patch('/v1/users/me/photo', formData, 'uploadProfilePhoto');
//   }

//   // ======================== ADMIN USER MANAGEMENT (Missing) ========================

//   getAllUsers(): Observable<any> {
//     return this.get('/v1/users', {}, 'getAllUsers');
//   }

//   createUser(data: any): Observable<any> {
//     return this.post('/v1/users', data, 'createUser');
//   }

//   searchUsers(query: string): Observable<any> {
//     return this.get('/v1/users/search', { q: query }, 'searchUsers');
//   }

//   getUser(id: string): Observable<any> {
//     return this.get(`/v1/users/${id}`, {}, 'getUser');
//   }

//   updateUser(id: string, data: any): Observable<any> {
//     return this.patch(`/v1/users/${id}`, data, 'updateUser');
//   }

//   deleteUser(id: string): Observable<any> {
//     return this.delete(`/v1/users/${id}`,null, 'deleteUser');
//   }

//   // --- Security & Status ---

//   deactivateUser(id: string): Observable<any> {
//     return this.patch(`/v1/users/${id}/deactivate`, {}, 'deactivateUser');
//   }

//   activateUser(id: string): Observable<any> {
//     return this.patch(`/v1/users/${id}/activate`, {}, 'activateUser');
//   }

//   adminUpdatePassword(id: string, password: string): Observable<any> {
//     return this.patch(`/v1/users/${id}/password`, { password }, 'adminUpdatePassword');
//   }

//   getUserActivity(id: string): Observable<any> {
//     return this.get(`/v1/users/${id}/activity`, {}, 'getUserActivity');
//   }
//   // ======================== ROLES ========================

//   getRoles(): Observable<any> {
//     return this.get('/v1/roles', {}, 'getRoles');
//   }

//   createRole(data: { name: string; permissions: string[] }): Observable<any> {
//     return this.post('/v1/roles', data, 'createRole');
//   }

//   updateRole(roleId: string, data: { name: string; permissions: string[] }): Observable<any> {
//     return this.patch(`/v1/roles/${roleId}`, data, 'updateRole');
//   }

//   deleteRole(roleId: string): Observable<any> {
//     return this.delete(`/v1/roles/${roleId}`,null, 'deleteRole');
//   }
// }

