// src/app/core/services/smart-rule.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export type RuleType =
  | 'new_arrivals' | 'best_sellers' | 'clearance_sale'
  | 'trending' | 'seasonal' | 'price_range' | 'category_based'
  | 'low_stock' | 'manual_selection' | 'custom_query';

export type SortField = 'createdAt' | 'sellingPrice' | 'name' | 'lastSold' | 'views' | 'salesCount';

export interface RuleFilter {
  field: 'category' | 'brand' | 'price' | 'tags' | 'stock' | 'createdAt' | 'lastSold' | 'discount';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  value2?: any; // required when operator === 'between'
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  ruleType: RuleType;
  filters?: RuleFilter[];
  sortBy?: SortField;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cacheDuration?: number;
  manualProductIds?: string[]; // required when ruleType === 'manual_selection'
}

export interface RuleListParams {
  ruleType?: RuleType;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Service
//
// ✅ FIX: Backend route is /rules, NOT /smart-rules
//
// Backend mount: embedded in admin.routes.js at /api/v1/admin/storefront/rules
// Resolved URL : {environment.apiUrl}/v1/admin/storefront/rules/...
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class SmartRuleService extends BaseApiService {

  // ✅ Corrected — was '/v1/admin/storefront/smart-rules'
  private readonly base = '/v1/admin/storefront/rules';

  // ── CRUD ──────────────────────────────────────────────────────────────────

  getAllRules(params?: RuleListParams): Observable<any> {
    return this.get(this.base, params ?? {});
  }

  getRuleById(id: string): Observable<any> {
    return this.get(`${this.base}/${id}`);
  }

  createRule(data: CreateRuleDto): Observable<any> {
    return this.post(this.base, data);
  }

  updateRule(id: string, data: Partial<CreateRuleDto>): Observable<any> {
    return this.put(`${this.base}/${id}`, data);
  }

  deleteRule(id: string): Observable<any> {
    return this.delete(`${this.base}/${id}`);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Preview an unsaved ad-hoc rule config.
   * Used by the page builder to see what products a rule would return
   * before saving the rule or the page.
   */
  previewRule(data: CreateRuleDto): Observable<any> {
    return this.post(`${this.base}/preview`, data);
  }

  /**
   * Execute a saved rule by ID and return live product results.
   * Accepts bypassCache=true to force a fresh DB query.
   */
  executeRule(id: string, bypassCache = false): Observable<any> {
    return this.post(`${this.base}/${id}/execute`, { bypassCache });
  }

  /**
   * Manually invalidate the Redis cache for a saved rule.
   * ✅ FIX: Backend uses POST /clear-cache (not DELETE /cache).
   * The DELETE /cache alias still works, kept here as primary for clarity.
   */
  clearCache(id: string): Observable<any> {
    return this.post(`${this.base}/${id}/clear-cache`, {});
  }
}


// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class SmartRuleService {
//   private http = inject(HttpClient);

//   // ✅ FIX: Match Backend Route structure (/api/v1/...)
//   // Backend Mount: app.use('/api/v1/admin/storefront/smart-rules', smartRuleRoutes);
//   // Environment: apiUrl = 'http://localhost:5000/api'
//   // Result: http://localhost:5000/api/v1/admin/storefront/smart-rules
//   private baseUrl = `${environment.apiUrl}/v1/admin/storefront/smart-rules`;

//   getAllRules(): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}`);
//   }

//   createRule(rule: Partial<any>): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}`, rule);
//   }

//   getRuleById(id: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/${id}`);
//   }

//   updateRule(id: string, rule: Partial<any>): Observable<any> {
//     return this.http.put<any>(`${this.baseUrl}/${id}`, rule);
//   }

//   deleteRule(id: string): Observable<void> {
//     return this.http.delete<void>(`${this.baseUrl}/${id}`);
//   }

//   // ================= ACTIONS =================

//   // Used for "Ad-Hoc" preview in the builder (doesn't save to DB)
//   previewRule(ruleData: Partial<any>): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/preview`, ruleData);
//   }

//   // Used for testing a Saved Rule
//   executeRule(id: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/${id}/execute`);
//   }

//   clearCache(id: string): Observable<any> {
//     return this.http.delete<any>(`${this.baseUrl}/${id}/cache`);
//   }
// }
