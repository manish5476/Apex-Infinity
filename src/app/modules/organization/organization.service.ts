import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../core/services/base-api.service';

// =============================================================================
// Interfaces for Payload Suggestions (IntelliSense)
// =============================================================================

export interface CreateOrganizationPayload {
  organizationName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  uniqueShopId?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  gstNumber?: string;
  mainBranchName?: string;
  mainBranchAddress?: string;
}

export interface LookupOrganizationPayload {
  email: string;
}

export interface ApproveMemberPayload {
  userId: string;
  roleId: string;
  branchId: string; // Updated to required based on your route comments
}

export interface RejectMemberPayload {
  userId: string;
}

export interface UpdateOrganizationPayload {
  name?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  gstNumber?: string;
  uniqueShopId?: string;
  logo?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  settings?: {
    currency?: string;
    timezone?: string;
    financialYearStart?: string;
  };
}

// =============================================================================
// Organization Service
// =============================================================================

@Injectable({ providedIn: 'root' })
export class OrganizationService extends BaseApiService {
  private endpoint = '/v1/organization';
  private newEndpoint = '/v1/neworganization';
  private ownershipEndpoint = '/v1/ownership';

  // ── Public ───────────────────────────────────────────────────────────────────

  createNewOrganization(data: CreateOrganizationPayload): Observable<any> {
    return this.post<any>(`${this.endpoint}/create`, data, 'createNewOrganization');
  }

  lookupOrganizations(data: LookupOrganizationPayload): Observable<any> {
    return this.post<any>(`${this.endpoint}/lookup`, data, 'lookupOrganizations');
  }

  getOrganizationByShopId(uniqueShopId: string): Observable<any> {
    return this.get(`${this.endpoint}/shop/${uniqueShopId}`, {}, 'getOrganizationByShopId');
  }

  // ── Self-service ─────────────────────────────────────────────────────────────

  getMyOrganization(): Observable<any> {
    return this.get(`${this.endpoint}/my-organization`, {}, 'getMyOrganization');
  }

  updateMyOrganization(data: UpdateOrganizationPayload): Observable<any> {
    return this.patch(`${this.endpoint}/my-organization`, data, 'updateMyOrganization');
  }

  deleteMyOrganization(): Observable<any> {
    return this.delete(`${this.endpoint}/my-organization`, null, 'deleteMyOrganization');
  }

  // ── Member management ────────────────────────────────────────────────────────

  getPendingMembers(): Observable<any> {
    return this.get(`${this.endpoint}/pending-members`, {}, 'getPendingMembers');
  }

  approveMember(data: ApproveMemberPayload): Observable<any> {
    return this.post(`${this.endpoint}/approve-member`, data, 'approveMember');
  }

  rejectMember(data: RejectMemberPayload): Observable<any> {
    return this.post(`${this.endpoint}/reject-member`, data, 'rejectMember');
  }

  // ---------------------------------------------------
  // PLATFORM ADMIN ROUTES
  // ---------------------------------------------------
  // Keeping 'any' here as specific payloads weren't detailed in the comments
  // but you can easily create interfaces for these later if needed.

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
    return this.delete(`${this.endpoint}/${id}`, null, 'deleteOrganization');
  }

  // ---------------------------------------------------
  // NEWLY ADDED ROUTES (invite, remove, logs)
  // ---------------------------------------------------

  inviteUser(data: any): Observable<any> {
    return this.post(`${this.newEndpoint}/invite`, data, 'inviteUser');
  }

  removeMember(memberId: string): Observable<any> {
    return this.delete(`${this.newEndpoint}/members/${memberId}`, null, 'removeMember');
  }

  getActivityLog(): Observable<any> {
    return this.get(`${this.newEndpoint}/activity-log`, {}, 'getActivityLog');
  }

  // =======================================
  // organization ownership transfer 
  // =======================================

  initiateOwnershipTransfer(data: { userId: string }): Observable<any> {
    return this.post(`${this.ownershipEndpoint}/initiate`, data, 'initiateOwnershipTransfer');
  }

  finalizeOwnershipTransfer(data: { token: string; action: 'accept' | 'reject' }): Observable<any> {
    return this.post(`${this.ownershipEndpoint}/finalize`, data, 'finalizeOwnershipTransfer');
  }

  cancelOwnershipTransfer(): Observable<any> {
    return this.post(`${this.ownershipEndpoint}/cancel`, {}, 'cancelOwnershipTransfer');
  }

  forceTransferOwnership(data: { newOwnerId: string }): Observable<any> {
    return this.post(`${this.ownershipEndpoint}/force`, data, 'forceTransferOwnership');
  }
}


























































