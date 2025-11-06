import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { HttpErrorResponse } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class ApiService extends BaseApiService {
  getMyOrganization(filterParams?: any): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/v1/organization/my-organization`, {
        params: this.createHttpParams(filterParams),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('getMyOrganization', error),
        ),
      );
  }

  createNewOrganization(data: any | any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/organization/create`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('createNewOrganization', error),
        ),
      );
  }

  approvemember(data: any | any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/v1/organization/approve-member`, data)
      .pipe(
        catchError((error: HttpErrorResponse) =>
          this.errorhandler.handleError('approveMember', error),
        ),
      );
  }

  updateOrganization(customerId: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/v1/organization/my-organization`, data)
      .pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('updateOrganization', error),),);
  }

  /**
   * Deletes a single customer by their ID.
   * @param customerId The ID of the customer to delete.
   */

  deleteMyOrganization(MyOrganization: string): Observable<any> {
    const url = `${this.baseUrl}/v1/organization/my-organization`;
    return this.http.delete(url).pipe(catchError((error: HttpErrorResponse) => this.errorhandler.handleError('deleteMyOrganization', error),),
    );
  }


}
