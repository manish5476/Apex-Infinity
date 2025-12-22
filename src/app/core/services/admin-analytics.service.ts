import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService extends BaseApiService {

  // ==========================================================================
  // 🛠️ HELPER: Standardize Query Params
  // ==========================================================================
  private buildParams(startDate?: string, endDate?: string, branchId?: string, extra: any = {}) {
    // BaseApiService will automatically filter out null/undefined/empty strings
    return {
      startDate,
      endDate,
      branchId,
      ...extra
    };
  }

  // ==========================================================================
  // 1. EXECUTIVE & STRATEGIC (Dashboard & Benchmarks)
  // ==========================================================================

  // 📊 Main KPI Dashboard
  getDashboardOverview(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/dashboard', params, 'Dashboard Overview');
  }

  // 🆚 Branch vs. Branch Comparison
  getBranchComparison(startDate?: string, endDate?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate);
    return this.get<any>('/v1/analytics/branch-comparison', params, 'Branch Comparison');
  }

  // 🔮 AI Revenue Forecast (Linear Regression)
  getSalesForecast(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/forecast', params, 'Sales Forecast');
  }

  // 🚨 Critical Alerts (Low Stock + High Risk Debt)
  getCriticalAlerts(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/critical-alerts', params, 'Critical Alerts');
  }

  // ==========================================================================
  // 2. FINANCIAL INTELLIGENCE (P&L, Tax, Cash)
  // ==========================================================================

  getFinancialReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/financials', params, 'Financial Report');
  }

  // 💰 Real Profit (Sales - COGS)
  getProfitabilityReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/profitability', params, 'Profitability Report');
  }

  getCashFlowReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/cash-flow', params, 'Cash Flow Report');
  }

  // ⏳ Who owes money? (0-30, 31-60, 90+ days)
  getDebtorAgingReport(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/debtor-aging', params, 'Debtor Aging');
  }

  getTaxReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/tax-report', params, 'Tax Report');
  }

  // ==========================================================================
  // 3. OPERATIONAL & STAFF EFFICIENCY
  // ==========================================================================

  // 🏆 Employee Leaderboard
  getStaffPerformance(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/staff-performance', params, 'Staff Performance');
  }

  // 📉 Cancellation Rates & Discounts
  getOperationalMetrics(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/operational-metrics', params, 'Operational Metrics');
  }

  // 🔥 Heatmap (Busiest Hours)
  getPeakBusinessHours(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/peak-hours', params, 'Peak Business Hours');
  }

  getProcurementAnalysis(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/procurement', params, 'Procurement Analysis');
  }

  // ==========================================================================
  // 4. INVENTORY INTELLIGENCE
  // ==========================================================================

  getInventoryReport(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/inventory', params, 'Inventory Report');
  }

  getProductPerformance(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/product-performance', params, 'Product Performance');
  }

  // 💀 Items stuck on shelves > X days
  getDeadStockReport(branchId?: string, daysThreshold: number = 90): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId, { daysThreshold });
    return this.get<any>('/v1/analytics/dead-stock', params, 'Dead Stock Report');
  }

  // 📉 "Will run out in 7 days" predictions
  getStockOutPredictions(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/stock-predictions', params, 'Stock Predictions');
  }

  // ==========================================================================
  // 5. CUSTOMER INSIGHTS
  // ==========================================================================

  getCustomerInsights(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/customer-insights', params, 'Customer Insights');
  }

  // 🎯 RFM Segmentation (Champions, Loyal, At Risk)
  getCustomerSegmentation(): Observable<any> {
    return this.get<any>('/v1/analytics/customer-segmentation', {}, 'Customer Segmentation');
  }

  // 🔄 Cohort Analysis (Retention)
  getCustomerRetention(months: number = 6): Observable<any> {
    return this.get<any>('/v1/analytics/customer-retention', { months }, 'Customer Retention');
  }

  // ==========================================================================
  // 6. SECURITY & EXPORTS
  // ==========================================================================

  getSecurityAuditLog(startDate?: string, endDate?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate);
    return this.get<any>('/v1/analytics/security-audit', params, 'Security Audit Log');
  }

  // ==========================================================================
  // 7. CHARTS & VISUAL ANALYTICS
  // ==========================================================================

  getFinancialTrend(startDate?: string, endDate?: string, branchId?: string) {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/chart/financial-trend', params, 'Financial Trend');
  }

  getSalesDistribution(startDate?: string, endDate?: string, branchId?: string) {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/chart/sales-distribution', params, 'Sales Distribution');
  }

  getBranchPerformanceRadar(branchId?: string) {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/chart/branch-radar', params, 'Branch Radar');
  }

  getOrderFunnel(startDate?: string, endDate?: string, branchId?: string) {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/chart/order-funnel', params, 'Order Funnel');
  }

  /**
   * 📥 EXPORT DATA (Handles Binary/Blob)
   * We skip `this.get()` because BaseApiService expects JSON, 
   * but this endpoint returns a file (Blob).
   */

  exportAnalyticsData(type: 'sales' | 'inventory' | 'tax', startDate?: string, endDate?: string): Observable<Blob> {
    // 1. Build Params
    const rawParams = this.buildParams(startDate, endDate, undefined, { type, format: 'csv' });

    // 2. Convert to HttpParams using your BaseApiService helper
    const httpParams = this.createHttpParams(rawParams);

    // 3. Raw HTTP call with 'blob' response type
    return this.http.get(`${this.baseUrl}/v1/analytics/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }
}
