import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService extends BaseApiService {

  private getParams(start?: string, end?: string, branchId?: string, extra?: any) {
    const params: any = { ...extra };
    if (start) params.startDate = start;
    if (end) params.endDate = end;
    if (branchId) params.branchId = branchId;
    return params;
  }

  // ------------------------- 1. EXECUTIVE -------------------------

  getDashboardOverview(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/dashboard', this.getParams(start, end, branchId), 'Dashboard Overview');
  }

  getBranchComparison(start?: string, end?: string): Observable<any> {
    return this.get('/v1/analytics/branch-comparison', this.getParams(start, end), 'Branch Comparison');
  }

  // ------------------------- 2. FINANCIAL -------------------------

  getFinancialReport(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/financials', this.getParams(start, end, branchId), 'Financial Report');
  }

  getCashFlowReport(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/cashflow', this.getParams(start, end, branchId), 'Cash Flow Report');
  }

  getTaxReport(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/tax', this.getParams(start, end, branchId), 'Tax Report');
  }

  getProfitabilityReport(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/profitability', this.getParams(start, end, branchId), 'Profitability');
  }

  getDebtorAgingReport(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/debtor-aging', this.getParams(undefined, undefined, branchId), 'Debtor Aging');
  }

  // ------------------------- 3. PROCUREMENT -------------------------

  getProcurementAnalysis(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/procurement', this.getParams(start, end, branchId), 'Procurement');
  }

  // ------------------------- 4. INVENTORY -------------------------

  getInventoryReport(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/inventory', this.getParams(undefined, undefined, branchId), 'Inventory');
  }

  getProductPerformance(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/product-performance', this.getParams(undefined, undefined, branchId), 'Product Performance');
  }

  getDeadStockReport(branchId?: string, daysThreshold: number = 90): Observable<any> {
    return this.get('/v1/analytics/dead-stock', this.getParams(undefined, undefined, branchId, { daysThreshold }), 'Dead Stock');
  }

  getStockForecast(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/stock-forecast', this.getParams(undefined, undefined, branchId), 'Stock Forecast');
  }

  // ------------------------- 5. CUSTOMER INTELLIGENCE -------------------------

  getCustomerSegmentation(): Observable<any> {
    return this.get('/v1/analytics/segmentation', {}, 'Segmentation');
  }

  getCustomerRetention(): Observable<any> {
    return this.get('/v1/analytics/retention', {}, 'Retention');
  }

  // ------------------------- 6. OPERATIONAL -------------------------

  getOperationalReport(start?: string, end?: string, branchId?: string): Observable<any> {
    return this.get('/v1/analytics/operational', this.getParams(start, end, branchId), 'Operational Stats');
  }

  getPeakBusinessHours(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/peak-hours', this.getParams(undefined, undefined, branchId), 'Peak Hours');
  }

  // ------------------------- 7. SECURITY -------------------------

  getSecurityAuditLog(start?: string, end?: string): Observable<any> {
    return this.get('/v1/analytics/security-audit', this.getParams(start, end), 'Security Audit');
  }

  // ------------------------- 8. FORECAST -------------------------

  getSalesForecast(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/forecast', this.getParams(undefined, undefined, branchId), 'Sales Forecast');
  }

  // ------------------------- 9. ALERTS -------------------------

  getAlerts(branchId?: string): Observable<any> {
    return this.get('/v1/analytics/alerts', this.getParams(undefined, undefined, branchId), 'Critical Alerts');
  }

  // ------------------------- 10. EXPORTS -------------------------

  exportData(type: string, start?: string, end?: string, format: string = 'csv'): Observable<any> {
    return this.get('/v1/analytics/export', this.getParams(start, end, undefined, { type, format }), `Export: ${type}`);
  }
}


