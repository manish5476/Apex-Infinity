import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

@Injectable({ providedIn: 'root' })
export class OrganizationService extends BaseApiService {
  private endpoint = '/v1/organization';
  private newEndpoint = '/v1/neworganization';

  getMyOrganization(): Observable<any> {
    return this.get(`${this.endpoint}/my-organization`, {}, 'getMyOrganization');
  }

  updateMyOrganization(data: any): Observable<any> {
    return this.patch(`${this.endpoint}/my-organization`, data, 'updateMyOrganization');
  }

  getPendingMembers(): Observable<any> {
    return this.get(`${this.endpoint}/pending-members`, {}, 'getPendingMembers');
  }

  approveMember(data: { userId: string; roleId: string; branchId?: string }): Observable<any> {
    return this.post(`${this.endpoint}/approve-member`, data, 'approveMember');
  }

  // ---------------------------------------------------
  // PLATFORM ADMIN ROUTES
  // ---------------------------------------------------

  getAllOrganizations(): Observable<any> {
    return this.get(this.endpoint, {}, 'getAllOrganizations');
  }

  getOrganizationById(id: string): Observable<any> {
    return this.get(`${this.endpoint}/${id}`, {}, 'getOrganizationById');
  }

  updateOrganization(id: string, data: any): Observable<any> {
    return this.patch(`${this.endpoint}/${id}`, data, 'updateOrganization');
  }

  deleteOrganization(id: string): Observable<any> {
    return this.delete(`${this.endpoint}/${id}`, 'deleteOrganization');
  }

  // ---------------------------------------------------
  // NEWLY ADDED ROUTES (transfer, invite, remove, logs)
  // ---------------------------------------------------

  transferOwnership(data: any): Observable<any> {
    return this.patch(`${this.newEndpoint}/transfer-ownership`, data, 'transferOwnership');
  }

  inviteUser(data: any): Observable<any> {
    return this.post(`${this.newEndpoint}/invite`, data, 'inviteUser');
  }

  removeMember(memberId: string): Observable<any> {
    return this.delete(`${this.newEndpoint}/members/${memberId}`, 'removeMember');
  }

  getActivityLog(): Observable<any> {
    return this.get(`${this.newEndpoint}/activity-log`, {}, 'getActivityLog');
  }
}
