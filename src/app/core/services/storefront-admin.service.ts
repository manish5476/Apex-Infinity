// src/app/core/services/storefront-admin.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

// ---------------------------------------------------------------------------
// Lightweight DTOs
// ---------------------------------------------------------------------------

export interface PageListParams {
  status?: 'draft' | 'published' | 'archived';
  pageType?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  hasChanges?: boolean;
}

export interface StorefrontPage {
  _id: string;
  name: string;
  slug: string;
  pageType: string;
  status: 'draft' | 'published' | 'archived';
  isPublished: boolean;
  isHomepage?: boolean;
  viewCount?: number;
  sectionsCount?: number;
  updatedAt?: string;
  createdAt?: string;
  hasUnpublishedChanges?: boolean;
  publishedVersion?: number;
  version?: number;
  publishedAt?: string;
  lastEditedBy?: string;
  publishedBy?: string;
  draftUpdatedAt?: string;
}

export interface CreatePageDto {
  name: string;
  slug: string;
  pageType?: string;
  sections?: any[];
  seo?: Record<string, any>;
  themeOverride?: Record<string, any>;
  isHomepage?: boolean;
}

export interface DuplicatePageDto {
  newName?: string;
  newSlug?: string;
}

// ---------------------------------------------------------------------------
// Service
//
// Backend mount: app.use('/api/v1/admin/storefront', adminRoutes)
// Resolved URL : {environment.apiUrl}/v1/admin/storefront/...
//                e.g. http://localhost:5000/api/v1/admin/storefront/pages
//
// All methods delegate to BaseApiService which handles:
//   - withCredentials: true  (auth cookie / refresh token)
//   - baseUrl prefix         (environment.apiUrl)
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class StorefrontAdminService extends BaseApiService {

  private readonly base = '/v1/admin/storefront';

  // â”€â”€ Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getLayout(): Observable<any> {
    return this.get(`${this.base}/layout`);
  }

  updateLayout(data: {
    header?: any[];
    footer?: any[];
    globalSettings?: any;
  }): Observable<any> {
    return this.put(`${this.base}/layout`, data);
  }

  resetLayout(): Observable<any> {
    return this.delete(`${this.base}/layout/reset`);
  }

  // â”€â”€ Builder catalogue â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  /** Section type definitions that drive the page-builder sidebar UI. */
  getSectionTypes(includeSystem = false): Observable<any> {
    return this.get(`${this.base}/sections`, { includeSystem: String(includeSystem) });
  }

  getTemplates(params?: { sectionType?: string; category?: string }): Observable<any> {
    return this.get(`${this.base}/templates`, params ?? {});
  }

  getAvailableThemes(): Observable<any> {
    return this.get(`${this.base}/themes`);
  }

  // â”€â”€ Pages CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getPages(params?: PageListParams): Observable<any> {
    return this.get(`${this.base}/pages`, params ?? {});
  }

  createPage(data: CreatePageDto): Observable<any> {
    return this.post(`${this.base}/pages`, data);
  }

  getPageById(pageId: string): Observable<any> {
    return this.get(`${this.base}/pages/${pageId}`);
  }

  /** Core builder save â€” sends partial page data (sections, seo, name, etc.) with optional expectedVersion for optimistic locking */
  updatePage(pageId: string, data: Partial<any> & { expectedVersion?: number }): Observable<any> {
    return this.put(`${this.base}/pages/${pageId}`, data);
  }

  deletePage(pageId: string): Observable<any> {
    return this.delete(`${this.base}/pages/${pageId}`);
  }

  /** Returns draft snapshot preview with full hydration for unpublished changes */
  getDraftPreview(pageId: string): Observable<any> {
    return this.get(`${this.base}/pages/${pageId}/preview`);
  }

  // â”€â”€ Page lifecycle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  publishPage(pageId: string): Observable<any> {
    return this.post(`${this.base}/pages/${pageId}/publish`, {});
  }

  unpublishPage(pageId: string): Observable<any> {
    return this.post(`${this.base}/pages/${pageId}/unpublish`, {});
  }

  /** Marks this page as the homepage. Page must be published first. */
  setHomepage(pageId: string): Observable<any> {
    return this.post(`${this.base}/pages/${pageId}/set-homepage`, {});
  }

  duplicatePage(pageId: string, data: DuplicatePageDto = {}): Observable<any> {
    return this.post(`${this.base}/pages/${pageId}/duplicate`, data);
  }

  getPageAnalytics(
    pageId: string,
    period: '7d' | '30d' | '90d' = '30d'
  ): Observable<any> {
    return this.get(`${this.base}/pages/${pageId}/analytics`, { period });
  }

  getStorefrontOrders(params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.get(`${this.base}/orders`, params ?? {});
  }

  getCommandCenter(): Observable<any> {
    return this.get(`${this.base}/command-center`);
  }

  updateOrderStatus(orderId: string, data: { orderStatus?: string; fulfillmentStatus?: string; paymentStatus?: string }): Observable<any> {
    return this.put(`${this.base}/orders/${orderId}/status`, data);
  }

  getDeliveryAgents(params?: { search?: string; page?: number; limit?: number }): Observable<any> {
    return this.get(`${this.base}/delivery-agents`, params ?? {});
  }

  createDeliveryAgent(data: any): Observable<any> {
    return this.post(`${this.base}/delivery-agents`, data);
  }

  getDeliveryAgentById(agentId: string): Observable<any> {
    return this.get(`${this.base}/delivery-agents/${agentId}`);
  }

  updateDeliveryAgent(agentId: string, data: any): Observable<any> {
    return this.put(`${this.base}/delivery-agents/${agentId}`, data);
  }

  deleteDeliveryAgent(agentId: string): Observable<any> {
    return this.delete(`${this.base}/delivery-agents/${agentId}`);
  }

  sendDeliveryAgentInvite(agentId: string): Observable<any> {
    return this.post(`${this.base}/delivery-agents/${agentId}/send-invite`, {});
  }

  assignDeliveryAgent(orderId: string, data: any): Observable<any> {
    return this.patch(`${this.base}/orders/${orderId}/assign-agent`, data);
  }
  getStorefrontCustomers(params?: {
    status?: string;
    converted?: boolean;
    guest?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    return this.get(`${this.base}/customers`, {
      ...params,
      converted: params?.converted === undefined ? undefined : String(params.converted),
      guest: params?.guest === undefined ? undefined : String(params.guest)
    });
  }

  getStorefrontCustomer(customerId: string): Observable<any> {
    return this.get(`${this.base}/customers/${customerId}`);
  }

  convertStorefrontCustomerToCrm(customerId: string): Observable<any> {
    return this.post(`${this.base}/customers/${customerId}/convert-to-crm`, {});
  }

  // â”€â”€ Coupons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  getCoupons(params?: { search?: string; page?: number; limit?: number }): Observable<any> {
    return this.get(`${this.base}/coupons`, params ?? {});
  }

  createCoupon(data: any): Observable<any> {
    return this.post(`${this.base}/coupons`, data);
  }

  getCouponById(couponId: string): Observable<any> {
    return this.get(`${this.base}/coupons/${couponId}`);
  }

  updateCoupon(couponId: string, data: any): Observable<any> {
    return this.put(`${this.base}/coupons/${couponId}`, data);
  }

  deleteCoupon(couponId: string): Observable<any> {
    return this.delete(`${this.base}/coupons/${couponId}`);
  }
}
