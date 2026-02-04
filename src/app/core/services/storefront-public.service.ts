import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorefrontPublicService {
  private http = inject(HttpClient);
  
  // 1. Base URL Logic (Robust Regex Version)
  // Removes '/api/v1', '/api', or '/api/' from the end of environment.apiUrl
  // Result: http://localhost:3000/public
  private baseUrl = environment.apiUrl.replace(/\/api(?:\/v1)?\/?$/, '') + '/public';

  constructor() {
    console.log('Storefront Public URL set to:', this.baseUrl); 
  }

  // ================= PAGE & ORG INFO =================

  // getPage(orgSlug: string, pageSlug: string): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/${orgSlug}/${pageSlug}`);
  // }

  getOrganizationInfo(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${slug}`);
  }

  // ================= FILTERS & SEARCH =================

  getCategories(orgSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/categories`);
  }

  getTags(orgSlug: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${orgSlug}/tags`);
  }

   // ================= 3. METADATA (The Performance Upgrade) =================
  // ✅ NEW: Fetch all Dropdowns, Tags, and Price Ranges in ONE call
  getStoreMetadata(orgSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/meta`);
  }

  // Legacy (Keep if needed, but prefer getStoreMetadata)
  searchProducts(orgSlug: string, query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/products/search`, {
      params: { q: query }
    });
  }
  // ================= 1. PAGE & ORG INFO =================
  getPage(orgSlug: string, pageSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/${pageSlug}`);
  }

  getSitemap(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${slug}/sitemap`);
  }

  // ================= 2. PRODUCTS & CATALOG =================
  getProducts(orgSlug: string, filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      // Filter out null/undefined/empty
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get(`${this.baseUrl}/${orgSlug}/products`, { params });
  }

  getProductBySlug(orgSlug: string, productSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/products/${productSlug}`);
  }

  // searchProducts(orgSlug: string, query: string): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/${orgSlug}/search`, {
  //     params: { q: query }
  //   });
  // }
}