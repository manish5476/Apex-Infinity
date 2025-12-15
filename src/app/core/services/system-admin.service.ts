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
  downloadSalesReport(format: 'pdf' | 'csv' = 'pdf'): void {
    // Downloads usually require specific handling for Blob responses
    const url = `/v1/analytics/export/sales?format=${format}`;
    window.open(this.apiUrl + url, '_blank'); 
  }

  // --- Organization Extras ---
  updateBranding(data: FormData): Observable<any> {
    return this.patch('/v1/organization/extras/branding', data, 'updateBranding');
  }
}
