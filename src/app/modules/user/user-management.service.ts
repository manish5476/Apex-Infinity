import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class UserManagementService extends BaseApiService {
  private endpoint = '/v1/users';
  // Admin: Get all users with pagination & search
  getAllUsers(params?: any): Observable<any> {
    return this.get(this.endpoint, params, 'getAllUsers');
  }
  // Admin: Search specific users
  searchUsers(query: string): Observable<any> {
    return this.get(`${this.endpoint}/search`, { q: query }, 'searchUsers');
  }

  uploadProfilePhoto(formData: FormData): Observable<any> {
    return this.patch('/v1/users/me/photo', formData, 'uploadProfilePhoto');
  }

  uploadUserPhoto(id: string, formData: FormData): Observable<any> {
    // Assuming your backend supports PATCH /v1/users/:id/photo
    return this.patch(`${this.endpoint}/${id}/photo`, formData, 'uploadUserPhoto');
  }

  // Admin: Create Employee/Manager
  createUser(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createUser');
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateUser');
  }

  // Admin: Security Actions
  deactivateUser(id: string): Observable<any> {
    return this.patch(`${this.endpoint}/${id}/deactivate`, {}, 'deactivateUser');
  }

  activateUser(id: string): Observable<any> {
    return this.patch(`${this.endpoint}/${id}/activate`, {}, 'activateUser');
  }

  // Admin: Reset another user's password
  adminResetPassword(id: string, password: string): Observable<any> {
    return this.patch(`${this.endpoint}/${id}/password`, { password }, 'adminResetPassword');
  }

  // Admin: View User Activity Logs
  getUserActivity(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}/activity`, {}, 'getUserActivity');
  }

  getMe(): Observable<any> {
    return this.get<any>('/v1/users/me', {}, 'getMe');
  }
  // --- 🆕 ADDED MISSING METHODS ---
  getUser(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getUser');
  }

  deleteUser(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteUser');
  }
}
