import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class UserManagementService extends BaseApiService {

  // ============================================================
  // =============== USER SELF-SERVICE ROUTES ====================
  // ============================================================

  /** PATCH /v1/users/me — Update profile */
  updateMyProfile(data: any): Observable<any> {
    return this.patch('/v1/users/me', data, 'updateMyProfile');
  }

  /** PATCH /v1/users/me/photo — Upload or update profile image */
  uploadProfilePhoto(formData: FormData): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/v1/users/me/photo`, 
      formData
    ).pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProfilePhoto')));
  }

  /** GET /v1/users/me — Fetch logged-in user profile */
  getMyProfile(): Observable<any> {
    return this.get('/v1/users/me', {}, 'getMyProfile');
  }


  // ============================================================
  // ======================= ADMIN ROUTES ========================
  // ============================================================

  /** GET /v1/users — Admin: Get all users */
  getAllUsers(): Observable<any> {
    return this.get('/v1/users', {}, 'getAllUsers');
  }

  /** POST /v1/users — Admin: Create new user */
  createUser(data: any): Observable<any> {
    return this.post('/v1/users', data, 'createUser');
  }

  /** PATCH /v1/users/:id — Admin: Update any user */
  updateUser(id: string, data: any): Observable<any> {
    return this.patch(`/v1/users/${id}`, data, 'updateUser');
  }

  /** PATCH /v1/users/:id/password — Admin: Reset any user's password */
  resetUserPassword(id: string, data: { password: string }): Observable<any> {
    return this.patch(`/v1/users/${id}/password`, data, 'resetUserPassword');
  }

  /** DELETE /v1/users/:id — Admin: Soft delete a user */
  deleteUser(id: string): Observable<any> {
    return this.delete(`/v1/users/${id}`, 'deleteUser');
  }


  // ============================================================
  // ===================== ROLE MANAGEMENT =======================
  // ============================================================

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



// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { BaseApiService } from '../../core/services/base-api.service';

// @Injectable({ providedIn: 'root' })
// export class UserManagementService extends BaseApiService {
  
//   // === USERS (/v1/users) ===

//   getMyProfile(): Observable<any> {
//     return this.get('/v1/users/me', {}, 'getMyProfile');
//   }

//   uploadProfilePhoto(formData: FormData): Observable<any> {
//     // Using http directly because this is FormData and might need specific header handling
//     // or simpler error handling than generic JSON post
//     return this.http.patch<any>(`${this.baseUrl}/v1/users/me/photo`, formData)
//       .pipe(catchError(err => this.errorhandler.handleError(err, 'uploadProfilePhoto')));
//   }

//   // === ROLES (/v1/roles) ===

//   getAllRoles(): Observable<any> {
//     return this.get('/v1/roles', {}, 'getAllRoles');
//   }

//   createRole(data: any): Observable<any> {
//     return this.post('/v1/roles', data, 'createRole');
//   }

//   updateRole(id: string, data: any): Observable<any> {
//     return this.patch(`/v1/roles/${id}`, data, 'updateRole');
//   }

//   deleteRole(id: string): Observable<any> {
//     return this.delete(`/v1/roles/${id}`, 'deleteRole');
//   }
// }

