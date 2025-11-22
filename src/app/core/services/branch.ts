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
