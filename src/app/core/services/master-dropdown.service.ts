import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DropdownOption {
  data: any;           // ✅ Full original object for metadata access
  label: string;
  value: string;
  meta?: any; // ✅ Support for rich data (stock, balance, etc.)
}

interface DropdownResponse {
  status: string;
  results: number;
  total: number;       // ✅ Total records matching search
  hasMore: boolean;    // ✅ Convenience for infinite scroll
  data: DropdownOption[];
}


/**
 * Must match backend dropdown routes under `/api/v1/dropdowns/:endpoint`.
 * Source: `apex-crm-backend/src/modules/master/core/routes/dropdownlist.routes.js`
 */
export type DropdownEndpoint =
  // Organization & auth
  | 'users'
  | 'branches'
  | 'roles'
  | 'customers'
  | 'suppliers'
  | 'masters'
  | 'channels'
  | 'transfer-requests'
  // Inventory
  | 'products'
  | 'purchases'
  | 'sales'
  | 'sales-returns'
  | 'purchase-returns'
  | 'brands'
  | 'categories'
  | 'subcategories'
  | 'units'
  | 'tags'
  | 'taxes'
  // Accounting
  | 'accounts'
  | 'invoices'
  | 'payments'
  | 'emis'
  // HRMS
  | 'departments'
  | 'designations'
  | 'shifts'
  | 'shift-groups'
  | 'shift-assignments'
  | 'holidays'
  | 'geofencing'
  | 'attendance-machines'
  | 'attendance-requests'
  | 'leave-requests'
  // Notes & CRM
  | 'meetings'
  | 'supplier-categories';

@Injectable({
  providedIn: 'root'
})
export class MasterDropdownService {
  private readonly baseUrl = `${environment.apiUrl}/v1/dropdowns`;
  private cache = new Map<string, Observable<DropdownResponse>>();

  constructor(private http: HttpClient) { }

  /**
   * Universal method to fetch dropdown data with built-in caching.
   * Caches results based on endpoint and all query parameters.
   */
  getDropdownData(
    endpoint: DropdownEndpoint,
    search: string = '',
    page: number = 1,
    limit: number = 100,
    includeIds?: string[],
    extraParams: any = {}
  ): Observable<DropdownResponse> {
    // Generate a unique cache key based on all parameters
    const cacheKey = JSON.stringify({ endpoint, search, page, limit, includeIds, extraParams });

    // Return cached observable if it exists
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (includeIds?.length) params = params.set('includeIds', includeIds.join(','));

    // Add any extra dynamic filters
    Object.keys(extraParams).forEach(key => {
      if (extraParams[key] !== undefined && extraParams[key] !== null) {
        params = params.set(key, extraParams[key].toString());
      }
    });

    // Create the observable, share it, and cache it
    const request$ = this.http.get<DropdownResponse>(`${this.baseUrl}/${endpoint}`, { params }).pipe(
      catchError(error => {
        console.error(`Error fetching ${endpoint}:`, error);
        // On error, remove from cache so it can be retried
        this.cache.delete(cacheKey);
        return of({ status: 'error', results: 0, total: 0, hasMore: false, data: [] });
      }),
      // ✅ Cache the successful response for future subscribers
      tap(res => {
        if (res.status === 'error') this.cache.delete(cacheKey);
      }),
      // shareReplay(1) ensures multiple components sharing the same dropdown instance 
      // get the same data without triggering multiple HTTP calls
      // bufferSize: 1, refCount: false keeps the cache alive for the session
    );

    // We store the observable itself in the map. 
    // However, for a simple "one-off" cache like this, storing the result via 'of()' 
    // after the first completion is often easier to reason about.
    // Let's use a slightly more robust "Result Cache" pattern.

    const sharedRequest$ = request$.pipe(
      tap(data => {
        // Replace the "pending" observable with a "static" one once data arrives
        this.cache.set(cacheKey, of(data));
      })
    );

    this.cache.set(cacheKey, sharedRequest$);
    return sharedRequest$;
  }

  /**
   * Manually clear the dropdown cache. 
   * Useful when a new master record is added and dropdowns need to be refreshed.
   */
  clearCache(): void {
    this.cache.clear();
  }
}

