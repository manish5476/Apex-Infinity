import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SystemAdminService extends BaseApiService {
  
  // --- Logs & Audits ---
  getSystemLogs(params?: any): Observable<any> {
    return this.get('/v1/logs', params, 'getSystemLogs');
  }

  getAuditTrail(userId?: string): Observable<any> {
    return this.get('/v1/logs/audit', { userId }, 'getAuditTrail');
  }

  // --- Reconciliation ---
  getReconciliationSummary(dateRange: any): Observable<any> {
    return this.get('/v1/reconciliation/summary', dateRange, 'getReconciliationSummary');
  }

  // --- Exports ---
  downloadSalesReport(
    format: 'pdf' | 'csv' = 'csv',
    startDate?: string,
    endDate?: string
  ): Observable<Blob> {
    const params = this.createHttpParams({
      type: 'sales',
      format,
      startDate,
      endDate,
    });
    return this.http.get(`${this.baseUrl}/v1/analytics/export`, {
      params,
      responseType: 'blob',
      withCredentials: true,
    });
  }

  // --- Organization Extras ---
  updateBranding(data: FormData): Observable<any> {
    return this.patch('/v1/organization/extras/branding', data, 'updateBranding');
  }
}
