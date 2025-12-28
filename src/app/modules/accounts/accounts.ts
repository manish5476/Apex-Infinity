import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class AccountService extends BaseApiService {

  private readonly endpoint = '/v1/accounts';

  /* =============================
     CREATE
  ============================= */
  createAccount(data: any): Observable<any> {
    return this.post(this.endpoint, data, 'createAccount');
  }

  /* =============================
     READ
  ============================= */
  getAccounts(params?: any): Observable<any> {
    return this.get(this.endpoint, params, 'getAccounts');
  }

  getAccountById(accountId: string): Observable<any> {
    return this.get(`${this.endpoint}/${accountId}`, {}, 'getAccountById');
  }

  getAccountHierarchy(): Observable<any> {
    return this.get(`${this.endpoint}/hierarchy`, {}, 'getAccountHierarchy');
  }

  /* =============================
     UPDATE
  ============================= */
  updateAccount(accountId: string, data: any): Observable<any> {
    return this.put(`${this.endpoint}/${accountId}`, data, 'updateAccount');
  }

  reparentAccount(
    accountId: string,
    parentId: string | null
  ): Observable<any> {
    return this.put(
      `${this.endpoint}/${accountId}/reparent`,
      { parentId },
      'reparentAccount'
    );
  }

  /* =============================
     DELETE
  ============================= */
  deleteAccount(accountId: string): Observable<any> {
    return this.delete(`${this.endpoint}/${accountId}`, null, 'deleteAccount');
  }
}
