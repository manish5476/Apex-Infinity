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

  getPage(orgSlug: string, pageSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/${pageSlug}`);
  }

  getOrganizationInfo(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${slug}`);
  }

  getSitemap(slug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${slug}/sitemap`);
  }

  // ================= PRODUCTS & CATALOG =================

  getProducts(orgSlug: string, filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      // Only append valid values (ignore null/undefined/empty strings)
      if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.set(key, filters[key]);
      }
    });
    return this.http.get(`${this.baseUrl}/${orgSlug}/products`, { params });
  }

  getProductBySlug(orgSlug: string, productSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/products/${productSlug}`);
  }

  // ================= FILTERS & SEARCH =================

  getCategories(orgSlug: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/categories`);
  }

  getTags(orgSlug: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/${orgSlug}/tags`);
  }

  searchProducts(orgSlug: string, query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${orgSlug}/search`, {
      params: { q: query }
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
// export class StorefrontPublicService {
//   private http = inject(HttpClient);
  
//   // FIX: This regex removes '/api/v1' OR '/api' OR '/api/' (with slash) from the end
//   private baseUrl = environment.apiUrl.replace(/\/api(?:\/v1)?\/?$/, '') + '/public';

//   // Debugging: Check the console to see the final URL
//   constructor() {
//     console.log('Storefront Public URL set to:', this.baseUrl); 
//   }

//   getPage(orgSlug: string, pageSlug: string): Observable<any> {
//     // Should call: http://localhost:3000/public/shivam/home
//     return this.http.get(`${this.baseUrl}/${orgSlug}/${pageSlug}`);
//   }

//   getOrganizationInfo(slug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${slug}`);
//   }

//   getProducts(orgSlug: string, filters: any = {}): Observable<any> {
//     let params = new HttpParams();
//     Object.keys(filters).forEach(key => {
//       if (filters[key] !== null && filters[key] !== undefined) {
//         params = params.set(key, filters[key]);
//       }
//     });
//     return this.http.get(`${this.baseUrl}/${orgSlug}/products`, { params });
//   }

//   getProductBySlug(orgSlug: string, productSlug: string): Observable<any> {
//     return this.http.get(`${this.baseUrl}/${orgSlug}/products/${productSlug}`);
//   }
// }

// // import { Injectable, inject } from '@angular/core';
// // import { HttpClient, HttpParams } from '@angular/common/http';
// // import { Observable } from 'rxjs';
// // import { environment } from '../../../environments/environment';

// // @Injectable({
// //   providedIn: 'root'
// // })
// // export class StorefrontPublicService {
// //   private http = inject(HttpClient);
  
// //   // Mounted at /public (Root level)
// //   private baseUrl = `${environment.apiUrl.replace('/api/v1', '')}/public`;

// //   // ================= PAGE & ORG INFO =================

// //   getOrganizationInfo(slug: string): Observable<any> {
// //     return this.http.get(`${this.baseUrl}/${slug}`);
// //   }

// //   getSitemap(slug: string): Observable<any> {
// //     return this.http.get(`${this.baseUrl}/${slug}/sitemap`);
// //   }

// //   getPage(orgSlug: string, pageSlug: string): Observable<any> {
// //     return this.http.get(`${this.baseUrl}/${orgSlug}/${pageSlug}`);
// //   }

// //   // ================= PRODUCTS & CATALOG =================

// //   getProducts(orgSlug: string, filters: any = {}): Observable<any> {
// //     let params = new HttpParams();
// //     Object.keys(filters).forEach(key => {
// //       if (filters[key] !== null && filters[key] !== undefined) {
// //         params = params.set(key, filters[key]);
// //       }
// //     });

// //     return this.http.get(`${this.baseUrl}/${orgSlug}/products`, { params });
// //   }

// //   getProductBySlug(orgSlug: string, productSlug: string): Observable<any> {
// //     return this.http.get(`${this.baseUrl}/${orgSlug}/products/${productSlug}`);
// //   }

// //   getCategories(orgSlug: string): Observable<any> {
// //     return this.http.get(`${this.baseUrl}/${orgSlug}/categories`);
// //   }

// //   getTags(orgSlug: string): Observable<string[]> {
// //     return this.http.get<string[]>(`${this.baseUrl}/${orgSlug}/tags`);
// //   }

// //   searchProducts(orgSlug: string, query: string): Observable<any> {
// //     return this.http.get(`${this.baseUrl}/${orgSlug}/search`, {
// //       params: { q: query }
// //     });
// //   }
// // }