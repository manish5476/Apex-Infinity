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

  // ── Layout ────────────────────────────────────────────────────────────────

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

  // ── Builder catalogue ─────────────────────────────────────────────────────

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

  // ── Pages CRUD ────────────────────────────────────────────────────────────

  getPages(params?: PageListParams): Observable<any> {
    return this.get(`${this.base}/pages`, params ?? {});
  }

  createPage(data: CreatePageDto): Observable<any> {
    return this.post(`${this.base}/pages`, data);
  }

  getPageById(pageId: string): Observable<any> {
    return this.get(`${this.base}/pages/${pageId}`);
  }

  /** Core builder save — sends partial page data (sections, seo, name, etc.) */
  updatePage(pageId: string, data: Partial<any>): Observable<any> {
    return this.put(`${this.base}/pages/${pageId}`, data);
  }

  deletePage(pageId: string): Observable<any> {
    return this.delete(`${this.base}/pages/${pageId}`);
  }

  // ── Page lifecycle ────────────────────────────────────────────────────────

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

  updateOrderStatus(orderId: string, data: { orderStatus?: string; fulfillmentStatus?: string; paymentStatus?: string }): Observable<any> {
    return this.put(`${this.base}/orders/${orderId}/status`, data);
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

  // ── Coupons ───────────────────────────────────────────────────────────────

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

// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class StorefrontAdminService {
//   private http = inject(HttpClient);

//   // ✅ FIX: Match Backend Route structure (/api/v1/...)
//   // Backend Mount: app.use('/api/v1/admin/storefront', storefrontAdminRoutes);
//   // Environment: apiUrl = 'http://localhost:5000/api'
//   // Result: http://localhost:5000/api/v1/admin/storefront
//   private baseUrl = `${environment.apiUrl}/v1/admin/storefront`;

//   // ================= PAGES CRUD =================

//   getPages(params?: { status?: string; search?: string }): Observable<any> {
//     let httpParams = new HttpParams();
//     if (params?.status) httpParams = httpParams.set('status', params.status);
//     if (params?.search) httpParams = httpParams.set('search', params.search);

//     return this.http.get<{ results: number, data: any[] }>(`${this.baseUrl}/pages`, { params: httpParams });
//   }

//   createPage(pageData: Partial<any>): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages`, pageData);
//   }

//   getPageById(pageId: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/pages/${pageId}`);
//   }

//   updatePage(pageId: string, pageData: Partial<any>): Observable<any> {
//     return this.http.put<any>(`${this.baseUrl}/pages/${pageId}`, pageData);
//   }

//   deletePage(pageId: string): Observable<void> {
//     return this.http.delete<void>(`${this.baseUrl}/pages/${pageId}`);
//   }

//   // ================= ACTIONS =================

//   publishPage(pageId: string): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/publish`, {});
//   }

//   unpublishPage(pageId: string): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/unpublish`, {});
//   }

//   duplicatePage(pageId: string, data: { newName: string; newSlug: string }): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/duplicate`, data);
//   }

//   // ================= METADATA =================

//   getSectionTypes(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/sections`);
//   }

//   getTemplates(category?: string): Observable<any> {
//     let params = new HttpParams();
//     if (category) params = params.set('category', category);
//     return this.http.get<any>(`${this.baseUrl}/templates`, { params });
//   }

//   getAvailableThemes(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/themes`);
//   }

//   getPageAnalytics(pageId: string, period: '7d' | '30d' | '90d' = '30d'): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/pages/${pageId}/analytics`, {
//       params: { period }
//     });
//   }
// }
