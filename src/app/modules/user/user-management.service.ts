import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  organizationId: string;
  branchId?: string;
  role?: any;
  isOwner: boolean;
  isSuperAdmin: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'inactive' | 'suspended';
  isActive: boolean;
  isLoginBlocked: boolean;
  emailVerified: boolean;
  employeeProfile?: {
    employeeId?: string;
    departmentId?: any;
    designationId?: any;
    dateOfJoining?: Date;
    dateOfBirth?: Date;
    reportingManagerId?: string;
    employmentType?: string;
    workLocation?: string;
    secondaryPhone?: string;
    guarantorDetails?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  attendanceConfig?: {
    machineUserId?: string;
    shiftId?: any;
    shiftGroupId?: string;
    isAttendanceEnabled: boolean;
    allowWebPunch: boolean;
    allowMobilePunch: boolean;
    enforceGeoFence: boolean;
    geoFenceId?: string;
    biometricVerified: boolean;
  };
  devices?: any[];
  preferences?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Device {
  _id: string;
  deviceId: string;
  deviceType: 'web' | 'mobile' | 'tablet';
  lastActive: Date;
  userAgent: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  current?: boolean;
}

export interface ActivityLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  data?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService extends BaseApiService {
  private endpoint = '/v1/users';

  // ======================================================
  // SELF MANAGEMENT (Current User)
  // ======================================================

  /**
   * Get current user profile
   */
  getMe(): Observable<{ status: string; data: { user: User } }> {
    return this.get<{ status: string; data: { user: User } }>('/v1/users/me', {}, 'getMe');
  }

  /**
   * Update current user profile
   */
  updateMyProfile(data: any): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>('/v1/users/me', data, 'updateMyProfile');
  }

  /**
   * Upload profile photo
   */
  uploadProfilePhoto(formData: FormData): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>('/v1/users/me/photo', formData, 'uploadProfilePhoto');
  }

  /**
   * Get my permissions
   */
  getMyPermissions(): Observable<{ status: string; data: { permissions: string[]; role: string; isOwner: boolean; isSuperAdmin: boolean } }> {
    return this.get<{ status: string; data: any }>('/v1/users/me/permissions', {}, 'getMyPermissions');
  }

  /**
   * Get my active devices/sessions
   */
  getMyDevices(): Observable<{ status: string; data: { currentSessionId: string; devices: Device[] } }> {
    return this.get<{ status: string; data: { currentSessionId: string; devices: Device[] } }>('/v1/users/me/devices', {}, 'getMyDevices');
  }

  /**
   * Revoke a specific device session
   */
  revokeDevice(sessionId: string): Observable<{ status: string; message: string }> {
    return this.delete<{ status: string; message: string }>(`/v1/users/me/devices/${sessionId}`, null, 'revokeDevice');
  }

  // ======================================================
  // ADMIN USER MANAGEMENT - READ OPERATIONS
  // ======================================================

  /**
   * Get all users with pagination & filters
   */
  getAllUsers(params?: any): Observable<{ status: string; results: number; data: { users: User[] } }> {
    return this.get<{ status: string; results: number; data: { users: User[] } }>(this.endpoint, params, 'getAllUsers');
  }

  /**
   * Search users
   */
  searchUsers(query: string): Observable<{ status: string; results: number; data: { users: User[] } }> {
    return this.get<{ status: string; results: number; data: { users: User[] } }>(`${this.endpoint}/search`, { q: query }, 'searchUsers');
  }

  /**
   * Get organization hierarchy (reporting structure)
   */
  getOrgHierarchy(): Observable<{ status: string; data: { totalUsers: number; hierarchy: any[] } }> {
    return this.get<{ status: string; data: { totalUsers: number; hierarchy: any[] } }>(`${this.endpoint}/hierarchy`, {}, 'getOrgHierarchy');
  }

  /**
   * Export users data
   */
  exportUsers(params?: { format?: 'json' | 'csv'; departmentId?: string; isActive?: boolean }): Observable<any> {
    return this.get<any>(`${this.endpoint}/export`, params, 'exportUsers');
  }

  /**
   * Get users by department
   */
  getUsersByDepartment(departmentId: string, params?: any): Observable<{ status: string; results: number; data: { users: User[] } }> {
    return this.get<{ status: string; results: number; data: { users: User[] } }>(`${this.endpoint}/by-department/${departmentId}`, params, 'getUsersByDepartment');
  }

  /**
   * Get user by ID
   */
  getUser(id: string): Observable<{ status: string; data: { user: User } }> {
    return this.get<{ status: string; data: { user: User } }>(`${this.endpoint}/${id}`, {}, 'getUser');
  }

  /**
   * Get user activity logs
   */
  getUserActivity(id: string): Observable<{ status: string; data: { activities: ActivityLog[]; sessions: any[] } }> {
    return this.get<{ status: string; data: { activities: ActivityLog[]; sessions: any[] } }>(`${this.endpoint}/${id}/activity`, {}, 'getUserActivity');
  }

  // ======================================================
  // ADMIN USER MANAGEMENT - WRITE OPERATIONS
  // ======================================================

  /**
   * Create new user (with leave balance)
   */
  createUser(data: Partial<User>): Observable<{ status: string; data: { user: User; message: string } }> {
    return this.post<{ status: string; data: { user: User; message: string } }>(this.endpoint, data, 'createUser');
  }

  /**
   * Update user
   */
  updateUser(id: string, data: Partial<User>): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>(`${this.endpoint}/${id}`, data, 'updateUser');
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(id: string): Observable<{ status: string; data: null }> {
    return this.delete<{ status: string; data: null }>(`${this.endpoint}/${id}`, null, 'deleteUser');
  }

  /**
   * Upload user photo (admin)
   */
  uploadUserPhoto(id: string, formData: FormData): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>(`${this.endpoint}/${id}/photo`, formData, 'uploadUserPhoto');
  }

  /**
   * Admin reset user password
   */
  adminResetPassword(id: string, password: string, passwordConfirm: string): Observable<{ status: string; message: string }> {
    return this.patch<{ status: string; message: string }>(`${this.endpoint}/${id}/password`, { password, passwordConfirm }, 'adminResetPassword');
  }

  // ======================================================
  // STATUS MANAGEMENT
  // ======================================================

  /**
   * Activate user
   */
  activateUser(id: string): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>(`${this.endpoint}/${id}/activate`, {}, 'activateUser');
  }

  /**
   * Deactivate user
   */
  deactivateUser(id: string): Observable<{ status: string; data: { user: User } }> {
    return this.patch<{ status: string; data: { user: User } }>(`${this.endpoint}/${id}/deactivate`, {}, 'deactivateUser');
  }

  /**
   * Toggle user block status (kill switch)
   */
  toggleUserBlock(data: { userId: string; blockStatus: boolean; reason?: string }): Observable<{ status: string; message: string; data: { id: string; isLoginBlocked: boolean; reason?: string } }> {
    return this.post<{ status: string; message: string; data: { id: string; isLoginBlocked: boolean; reason?: string } }>(`${this.endpoint}/toggle-block`, data, 'toggleUserBlock');
  }

  /**
   * Check if current user has specific permission
   */
  checkPermission(permission: string): Observable<{ status: string; data: { hasPermission: boolean; permission: string; role?: string } }> {
    return this.post<{ status: string; data: { hasPermission: boolean; permission: string; role?: string } }>(`${this.endpoint}/check-permission`, { permission }, 'checkPermission');
  }

  /**
   * Bulk update user statuses
   */
  bulkUpdateStatus(data: { userIds: string[]; status: string; reason?: string }): Observable<{ status: string; data: { matched: number; modified: number } }> {
    return this.post<{ status: string; data: { matched: number; modified: number } }>(`${this.endpoint}/bulk-status`, data, 'bulkUpdateStatus');
  }

  // ======================================================
  // LEGACY METHODS (Keep for backward compatibility)
  // ======================================================

  /**
   * @deprecated Use toggleUserBlock instead
   */
  togglestatus(formData: FormData): Observable<any> {
    console.warn('togglestatus is deprecated. Use toggleUserBlock instead.');
    return this.patch('/v1/users/togglestatus', formData, 'togglestatus');
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from '../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class UserManagementService extends BaseApiService {
//   private endpoint = '/v1/users';
//   // Admin: Get all users with pagination & search
//   getAllUsers(params?: any): Observable<any> {
//     return this.get(this.endpoint, params, 'getAllUsers');
//   }
//   // Admin: Search specific users
//   searchUsers(query: string): Observable<any> {
//     return this.get(`${this.endpoint}/search`, { q: query }, 'searchUsers');
//   }

//   uploadProfilePhoto(formData: FormData): Observable<any> {
//     return this.patch('/v1/users/me/photo', formData, 'uploadProfilePhoto');
//   }

//   togglestatus(formData: FormData): Observable<any> {
//     return this.patch('/v1/users/togglestatus', formData, 'togglestatus');
//   }

//   uploadUserPhoto(id: string, formData: FormData): Observable<any> {
//     // Assuming your backend supports PATCH /v1/users/:id/photo
//     return this.patch(`${this.endpoint}/${id}/photo`, formData, 'uploadUserPhoto');
//   }

//   // Admin: Create Employee/Manager
//   createUser(data: any): Observable<any> {
//     return this.post(this.endpoint, data, 'createUser');
//   }

//   updateUser(id: string, data: any): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}`, data, 'updateUser');
//   }

//   // Admin: Security Actions
//   deactivateUser(id: string): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}/deactivate`, {}, 'deactivateUser');
//   }

//   activateUser(id: string): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}/activate`, {}, 'activateUser');
//   }

//   // Admin: Reset another user's password
//   adminResetPassword(id: string, password: string): Observable<any> {
//     return this.patch(`${this.endpoint}/${id}/password`, { password }, 'adminResetPassword');
//   }

//   // Admin: View User Activity Logs
//   getUserActivity(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}/activity`, {}, 'getUserActivity');
//   }

//   getMe(): Observable<any> {
//     return this.get<any>('/v1/users/me', {}, 'getMe');
//   }
//   // --- 🆕 ADDED MISSING METHODS ---
//   getUser(id: string): Observable<any> {
//     return this.get(`${this.endpoint}/${id}`, {}, 'getUser');
//   }

//   deleteUser(id: string): Observable<any> {
//     return this.delete(`${this.endpoint}/${id}`,null, 'deleteUser');
//   }
// }
