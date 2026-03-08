import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorefrontAdminService {
  private http = inject(HttpClient);
  
  // ✅ FIX: Match Backend Route structure (/api/v1/...)
  // Backend Mount: app.use('/api/v1/admin/storefront', storefrontAdminRoutes);
  // Environment: apiUrl = 'http://localhost:5000/api'
  // Result: http://localhost:5000/api/v1/admin/storefront
  private baseUrl = `${environment.apiUrl}/v1/admin/storefront`;

  // ================= PAGES CRUD =================

  getPages(params?: { status?: string; search?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    
    return this.http.get<{ results: number, data: any[] }>(`${this.baseUrl}/pages`, { params: httpParams });
  }

  createPage(pageData: Partial<any>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/pages`, pageData);
  }

  getPageById(pageId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pages/${pageId}`);
  }

  updatePage(pageId: string, pageData: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/pages/${pageId}`, pageData);
  }

  deletePage(pageId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pages/${pageId}`);
  }

  // ================= ACTIONS =================

  publishPage(pageId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/publish`, {});
  }

  unpublishPage(pageId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/unpublish`, {});
  }

  duplicatePage(pageId: string, data: { newName: string; newSlug: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/duplicate`, data);
  }

  // ================= METADATA =================

  getSectionTypes(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sections`);
  }

  getTemplates(category?: string): Observable<any> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<any>(`${this.baseUrl}/templates`, { params });
  }

  getAvailableThemes(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/themes`);
  }

  getPageAnalytics(pageId: string, period: '7d' | '30d' | '90d' = '30d'): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pages/${pageId}/analytics`, {
      params: { period }
    });
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
  
//   // ✅ FIX: Use standard apiUrl (e.g. http://localhost:5000/api/v1) directly
//   // Now it matches: http://localhost:5000/api/v1/admin/storefront
//   private baseUrl = `${environment.apiUrl}/v1/admin/storefront`;

//   getPages(params?: { status?: string; search?: string }): Observable<{ pages: any[], total: number }> {
//     let httpParams = new HttpParams();
//     if (params?.status) httpParams = httpParams.set('status', params.status);
//     if (params?.search) httpParams = httpParams.set('search', params.search);
    
//     return this.http.get<{ pages: any[], total: number }>(`${this.baseUrl}/pages`, { params: httpParams });
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

//   publishPage(pageId: string): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/publish`, {});
//   }

//   unpublishPage(pageId: string): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/unpublish`, {});
//   }

//   duplicatePage(pageId: string, data: { newName: string; newSlug: string }): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/pages/${pageId}/duplicate`, data);
//   }

//   getSectionTypes(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.baseUrl}/sections`);
//   }

//   getTemplates(category?: string): Observable<any[]> {
//     let params = new HttpParams();
//     if (category) params = params.set('category', category);
    
//     return this.http.get<any[]>(`${this.baseUrl}/templates`, { params });
//   }

//   getPageAnalytics(pageId: string, period: '7d' | '30d' | '90d' = '30d'): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/pages/${pageId}/analytics`, {
//       params: { period }
//     });
//   }
// }