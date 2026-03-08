import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmartRuleService {
  private http = inject(HttpClient);
  
  // ✅ FIX: Match Backend Route structure (/api/v1/...)
  // Backend Mount: app.use('/api/v1/admin/storefront/smart-rules', smartRuleRoutes);
  // Environment: apiUrl = 'http://localhost:5000/api'
  // Result: http://localhost:5000/api/v1/admin/storefront/smart-rules
  private baseUrl = `${environment.apiUrl}/v1/admin/storefront/smart-rules`;

  getAllRules(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}`);
  }

  createRule(rule: Partial<any>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}`, rule);
  }

  getRuleById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  updateRule(id: string, rule: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, rule);
  }

  deleteRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ================= ACTIONS =================

  // Used for "Ad-Hoc" preview in the builder (doesn't save to DB)
  previewRule(ruleData: Partial<any>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/preview`, ruleData);
  }

  // Used for testing a Saved Rule
  executeRule(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/execute`);
  }

  clearCache(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}/cache`);
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
  
//   // ✅ FIX: Use standard apiUrl directly
//   // Backend now listens at: /api/v1/admin/storefront/smart-rules
//   private baseUrl = `${environment.apiUrl}/admin/storefront/smart-rules`;

//   getAllRules(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.baseUrl}`);
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

//   // Actions
//   previewRule(ruleData: Partial<any>): Observable<any[]> {
//     return this.http.post<any[]>(`${this.baseUrl}/preview`, ruleData);
//   }

//   executeRule(id: string): Observable<any[]> {
//     return this.http.get<any[]>(`${this.baseUrl}/${id}/execute`);
//   }

//   createFromTemplate(templateId: string): Observable<any> {
//     return this.http.post<any>(`${this.baseUrl}/template`, { templateId });
//   }
// }
