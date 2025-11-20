import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class BranchService extends BaseApiService {
  private endpoint = '/v1/branches';

  createBranch(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createBranch');
  }

  getAllBranches(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAllBranches');
  }

  getMyBranches(): Observable<any> {
    return this.get(`${this.endpoint}/my-branches`, {}, 'getMyBranches');
  }

  getBranchById(branchId: string): Observable<any> {
    return this.get(`${this.endpoint}/${branchId}`, {}, 'getBranchById');
  }

  updateBranch(branchId: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${branchId}`, data, 'updateBranch');
  }

  deleteBranch(branchId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${branchId}`, 'deleteBranch');
  }
}

// import { Injectable } from '@angular/core';
// import { BaseApiService } from './base-api.service';
// import { catchError, Observable } from 'rxjs';
// import { HttpErrorResponse } from '@angular/common/http';

// @Injectable({
//   providedIn: 'root',
// })
// export class BranchService extends BaseApiService {
//   private endpoint = '/v1/branch';

//   /**
//    * 🔹 Get all branches (GET /v1/branch)
//    */
//   getAllBranches(filterParams?: any): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}`, {
//         params: this.createHttpParams(filterParams),
//       })
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'getAllBranches')
//         )
//       );
//   }

//   /**
//    * 🔹 Get branches belonging to current logged-in admin/user (GET /v1/branch/my-branches)
//    */
//   getMyBranches(): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}/my-branches`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error, 'getMyBranches')
//         )
//       );
//   }

//   /**
//    * 🔹 Get a specific branch by ID (GET /v1/branch/:id)
//    */
//   getBranchById(id: string): Observable<any> {
//     return this.http
//       .get<any>(`${this.baseUrl}${this.endpoint}/${id}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'getBranchById')
//         )
//       );
//   }

//   /**
//    * 🔹 Create a new branch (POST /v1/branch)
//    *    Requires roles: superadmin or admin
//    */
//   createBranch(data: any): Observable<any> {
//     return this.http
//       .post<any>(`${this.baseUrl}${this.endpoint}`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'createBranch')
//         )
//       );
//   }

//   /**
//    * 🔹 Update branch by ID (PATCH /v1/branch/:id)
//    *    Requires roles: superadmin or admin
//    */
//   updateBranch(id: string, data: any): Observable<any> {
//     return this.http
//       .patch<any>(`${this.baseUrl}${this.endpoint}/${id}`, data)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'updateBranch')
//         )
//       );
//   }

//   /**
//    * 🔹 Delete branch by ID (DELETE /v1/branch/:id)
//    *    Requires role: superadmin
//    */
//   deleteBranch(id: string): Observable<any> {
//     return this.http
//       .delete<any>(`${this.baseUrl}${this.endpoint}/${id}`)
//       .pipe(
//         catchError((error: HttpErrorResponse) =>
//           this.errorhandler.handleError(error,'deleteBranch')
//         )
//       );
//   }
// }
