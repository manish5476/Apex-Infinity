import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SmartRuleService {
  private http = inject(HttpClient);
  
  // ✅ FIX: Use standard apiUrl directly
  // Backend now listens at: /api/v1/admin/storefront/smart-rules
  private baseUrl = `${environment.apiUrl}/admin/storefront/smart-rules`;

  getAllRules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
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

  // Actions
  previewRule(ruleData: Partial<any>): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/preview`, ruleData);
  }

  executeRule(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${id}/execute`);
  }

  createFromTemplate(templateId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/template`, { templateId });
  }
}

// import { Injectable, inject } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';
// // import { SmartRule } from '../models/storefront.model';


// @Injectable({
//   providedIn: 'root'
// })
// export class SmartRuleService {
//   private http = inject(HttpClient);
  
//   // Mounted at /admin/storefront/smart-rules
//   private baseUrl = `${environment.apiUrl.replace('/api/v1', '')}/admin/storefront/smart-rules`;

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