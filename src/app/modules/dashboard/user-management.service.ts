
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class UserManagementService extends BaseApiService {
  
  // === USERS (/v1/users) ===

  getMyProfile(): Observable<any> {
    return this.get('/v1/users/me', {}, 'getMyProfile');
  }

  uploadProfilePhoto(formData: FormData): Observable<any> {
    // Using http directly because this is FormData and might need specific header handling
    // or simpler error handling than generic JSON post
    return this.http.patch<any>(`${this.baseUrl}/v1/users/me/photo`, formData)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProfilePhoto')));
  }

  // === ROLES (/v1/roles) ===

  getAllRoles(): Observable<any> {
    return this.get('/v1/roles', {}, 'getAllRoles');
  }

  createRole(data: any): Observable<any> {
    return this.post('/v1/roles', data, 'createRole');
  }

  updateRole(id: string, data: any): Observable<any> {
    return this.patch(`/v1/roles/${id}`, data, 'updateRole');
  }

  deleteRole(id: string): Observable<any> {
    return this.delete(`/v1/roles/${id}`, 'deleteRole');
  }
}

