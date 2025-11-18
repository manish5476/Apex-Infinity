import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AccountService extends BaseApiService {
  private endpoint = '/v1/accounts';

  createAccount(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}${this.endpoint}`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'createAccount'))
    );
  }

  getAccounts(filterParams?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}`, { params: this.createHttpParams(filterParams) }).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAccounts'))
    );
  }

  getAccountById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getAccountById'))
    );
  }

  getHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}/hierarchy`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'getHierarchy'))
    );
  }

  updateAccount(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}${this.endpoint}/${id}`, data).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'updateAccount'))
    );
  }

  reparentAccount(id: string, newParentId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}${this.endpoint}/${id}/reparent`, { parentAccount: newParentId }).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'reparentAccount'))
    );
  }

  deleteAccount(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}${this.endpoint}/${id}`).pipe(
      catchError((error: HttpErrorResponse) => this.errorhandler.handleError(error, 'deleteAccount'))
    );
  }
}