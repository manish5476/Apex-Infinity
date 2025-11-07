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

  // ==========================================================
  // AUTH ENDPOINTS (from authController.js)
  // ==========================================================

  /**
   * Logs in any existing, approved user.
   */
  login(credentials: any): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/v1/auth/login`, credentials)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('login', error)
        )
      );
  }

  /**
   * Signs up a new EMPLOYEE (status: 'pending').
   * Does NOT return a token.
   */
  employeeSignup(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/auth/signup`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('employeeSignup', error)
        )
      );
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/auth/forgotPassword`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('forgotPassword', error)
        )
      );
  }

  resetPassword(token: string, data: any): Observable<LoginResponse> {
    return this.http
      .patch<LoginResponse>(`${this.baseUrl}/v1/auth/resetPassword/${token}`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('resetPassword', error)
        )
      );
  }

  // ==========================================================
  // ORGANIZATION ENDPOINTS (from organizationController.js)
  // ==========================================================

  /**
   * Creates a new Organization, Owner, Role, and Branch.
   * This endpoint *does* log the new owner in and returns a token.
   */
  createNewOrganization(data: any): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/v1/organization/create`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('createNewOrganization', error)
        )
      );
  }

  /**
   * Approves a pending employee (by Super Admin)
   */
  approveMember(data: { userId: string, roleId: string, branchId: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/organization/approve-member`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('approveMember', error)
        )
      );
  }

  getMyOrganization(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/organization/my-organization`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getMyOrganization', error)
        )
      );
  }

  // ... (keep your update/delete organization methods) ...
  updateOrganization(data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/v1/organization/my-organization`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('updateOrganization', error)));
  }

  deleteMyOrganization(): Observable<any> {
    const url = `${this.baseUrl}/v1/organization/my-organization`;
    return this.http.delete(url).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('deleteMyOrganization', error)));
  }

  // ==========================================================
  // USER ENDPOINTS (from userController.js)
  // ==========================================================

  /**
   * Updates the logged-in user's password.
   * Returns a new token.
   */
  updateMyPassword(data: any): Observable<LoginResponse> {
    return this.http
      .patch<LoginResponse>(`${this.baseUrl}/v1/users/updateMyPassword`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('updateMyPassword', error)
        )
      );
  }

  /**
   * Gets the profile of the currently logged-in user.
   */
  getMe(): Observable<User> {
    return this.http
      .get<User>(`${this.baseUrl}/v1/users/getMe`)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getMe', error)
        )
      );
  }
}











// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { BaseApiService } from './base-api.service';
// import { HttpErrorResponse } from '@angular/common/http';


// @Injectable({
//   providedIn: 'root',
// })
// export class ApiService extends BaseApiService {
//   getMyOrganization(filterParams?: any): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}/v1/organization/my-organization`, {
//         params: this.createHttpParams(filterParams),
//       })
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError('getMyOrganization', error),
//         ),
//       );
//   }

//   createNewOrganization(data: any | any): Observable<any> {
//     return this.http
//       .post(`${this.baseUrl}/v1/organization/create`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError('createNewOrganization', error),
//         ),
//       );
//   }

//   approvemember(data: any | any): Observable<any> {
//     return this.http
//       .post(`${this.baseUrl}/v1/organization/approve-member`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError('approveMember', error),
//         ),
//       );
//   }

//   updateOrganization(customerId: string, data: any): Observable<any> {
//     return this.http.patch(`${this.baseUrl}/v1/organization/my-organization`, data)
//       .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('updateOrganization', error),),);
//   }


//   deleteMyOrganization(MyOrganization: string): Observable<any> {
//     const url = `${this.baseUrl}/v1/organization/my-organization`;
//     return this.http.delete(url).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('deleteMyOrganization', error),),
//     );
//   }


// }
