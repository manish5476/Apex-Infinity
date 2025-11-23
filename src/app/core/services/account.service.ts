import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
// /////////////////////////////////////////////////////////////////////////////// for future ========================
@Injectable({ providedIn: 'root' })
export class AccountService extends BaseApiService {
  private endpoint = '/v1/accounts';

  createAccount(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createAccount');
  }

  getAccounts(filterParams?: any): Observable<any> {
    return this.get(this.endpoint, filterParams, 'getAccounts');
  }

  getAccountById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getAccountById');
  }

  getHierarchy(): Observable<any> {
    return this.get(`${this.endpoint}/hierarchy`, {}, 'getHierarchy');
  }

  deleteAccount(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteAccount');
  }

  // Custom PUT requests (since BaseApiService only has GET/POST/PATCH/DELETE)
  updateAccount(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}${this.endpoint}/${id}`, data)
      .pipe(catchError(err => this.errorhandler.handleError(err, 'updateAccount')));
  }

  reparentAccount(id: string, newParentId: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}${this.endpoint}/${id}/reparent`, { parentAccount: newParentId })
      .pipe(catchError(err => this.errorhandler.handleError(err, 'reparentAccount')));
  }
}
