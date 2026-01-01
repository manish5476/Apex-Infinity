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
  // 1. EXECUTIVE DASHBOARDS (High-level overviews)
  // ==========================================================================

  /** Get comprehensive executive dashboard with all key metrics */
  getDashboardOverview(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/dashboard', params, 'getDashboardOverview');
  }

  /** Compare performance across all branches */
  getBranchComparison(startDate?: string, endDate?: string, groupBy: string = 'revenue', limit: number = 50): Observable<any> {
    const params = this.buildParams(startDate, endDate, undefined, { groupBy, limit });
    return this.get<any>('/v1/analytics/branch-comparison', params, 'getBranchComparison');
  }

  // ==========================================================================
  // 2. FINANCIAL INTELLIGENCE SUITE
  // ==========================================================================

  /** Deep dive into financial metrics */
  getFinancialDashboard(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/financials', params, 'getFinancialDashboard');
  }

  /** Cash flow analysis (alias for financials) */
  getCashFlowAnalysis(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/cash-flow', params, 'getCashFlowAnalysis');
  }

  // ==========================================================================
  // 3. CUSTOMER INTELLIGENCE HUB
  // ==========================================================================

  /** Comprehensive customer analytics */
  getCustomerIntelligence(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/customer-intelligence', params, 'getCustomerIntelligence');
  }

  /** RFM customer segmentation */
  getCustomerSegmentation(): Observable<any> {
    return this.get<any>('/v1/analytics/customer-segmentation', {}, 'getCustomerSegmentation');
  }

  /** Customer lifetime value analysis */
  getCustomerLifetimeValue(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/customer-ltv', params, 'getCustomerLifetimeValue');
  }

  /** Customer churn risk analysis */
  getChurnRiskAnalysis(threshold: number = 90): Observable<any> {
    const params = { threshold };
    return this.get<any>('/v1/analytics/churn-risk', params, 'getChurnRiskAnalysis');
  }

  /** Market basket analysis (products bought together) */
  getMarketBasketAnalysis(minSupport: number = 2): Observable<any> {
    const params = { minSupport };
    return this.get<any>('/v1/analytics/market-basket', params, 'getMarketBasketAnalysis');
  }

  /** Customer payment behavior analysis */
  getPaymentBehaviorStats(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/payment-behavior', params, 'getPaymentBehaviorStats');
  }

  /** Combined customer insights */
  getCustomerInsights(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/customer-insights', params, 'getCustomerInsights');
  }

  // ==========================================================================
  // 4. INVENTORY INTELLIGENCE SUITE
  // ==========================================================================

  /** Complete inventory health dashboard */
  getInventoryHealth(branchId?: string, includeValuation: boolean = true, includePredictions: boolean = true): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId, { includeValuation, includePredictions });
    return this.get<any>('/v1/analytics/inventory-health', params, 'getInventoryHealth');
  }

  /** Product performance analysis */
  getProductPerformance(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/product-performance', params, 'getProductPerformance');
  }

  /** Dead stock analysis */
  getDeadStockReport(branchId?: string, days: number = 90): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId, { days });
    return this.get<any>('/v1/analytics/dead-stock', params, 'getDeadStockReport');
  }

  /** Stock-out predictions */
  getStockOutPredictions(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/stock-predictions', params, 'getStockOutPredictions');
  }

  /** Category performance analysis */
  getCategoryAnalytics(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/category-performance', params, 'getCategoryAnalytics');
  }

  /** Supplier performance analysis */
  getSupplierPerformance(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/supplier-performance', params, 'getSupplierPerformance');
  }

  // ==========================================================================
  // 5. OPERATIONAL EXCELLENCE SUITE
  // ==========================================================================

  /** Comprehensive operational metrics */
  getOperationalMetrics(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/operational-metrics', params, 'getOperationalMetrics');
  }

  /** Staff performance analysis */
  getStaffPerformance(startDate?: string, endDate?: string, branchId?: string, minSales: number = 0, sortBy: string = 'revenue'): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId, { minSales, sortBy });
    return this.get<any>('/v1/analytics/staff-performance', params, 'getStaffPerformance');
  }

  /** Staff attendance & productivity correlation */
  getStaffAttendancePerformance(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/staff-attendance-performance', params, 'getStaffAttendancePerformance');
  }

  /** Peak business hours analysis */
  getPeakBusinessHours(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/peak-hours', params, 'getPeakBusinessHours');
  }

  /** Time-based analytics (hourly, daily, weekly, monthly) */
  getTimeBasedAnalytics(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/time-analytics', params, 'getTimeBasedAnalytics');
  }

  /** Procurement analysis */
  getProcurementAnalysis(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/procurement', params, 'getProcurementAnalysis');
  }

  // ==========================================================================
  // 6. PREDICTIVE ANALYTICS & FORECASTING
  // ==========================================================================

  /** Sales forecasting with linear regression */
  getSalesForecast(branchId?: string, periods: number = 3, confidence: number = 0.95): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId, { periods, confidence });
    return this.get<any>('/v1/analytics/forecast', params, 'getSalesForecast');
  }

  /** Comprehensive predictive analytics */
  getPredictiveAnalytics(branchId?: string, periods: number = 3, confidence: number = 0.95): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId, { periods, confidence });
    return this.get<any>('/v1/analytics/predictive-analytics', params, 'getPredictiveAnalytics');
  }

  /** EMI and credit sales analysis */
  getEMIAnalytics(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/emi-analytics', params, 'getEMIAnalytics');
  }

  // ==========================================================================
  // 7. REAL-TIME MONITORING & ALERTS
  // ==========================================================================

  /** Real-time monitoring dashboard */
  getRealTimeMonitoring(branchId?: string, severity?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId, { severity });
    return this.get<any>('/v1/analytics/alerts/realtime', params, 'getRealTimeMonitoring');
  }

  /** Critical alerts summary */
  getCriticalAlerts(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/analytics/critical-alerts', params, 'getCriticalAlerts');
  }

  /** Security audit logs */
  getSecurityAuditLog(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/security-audit', params, 'getSecurityAuditLog');
  }

  /** Compliance dashboard */
  getComplianceDashboard(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/compliance-dashboard', params, 'getComplianceDashboard');
  }

  // ==========================================================================
  // 8. DATA MANAGEMENT & EXPORT
  // ==========================================================================

  /** Export analytics data in CSV format */
  exportAnalyticsData(type: 'sales' | 'inventory' | 'customers', startDate?: string, endDate?: string): Observable<Blob> {
    const params = this.buildParams(startDate, endDate, undefined, { type, format: 'csv' });
    const httpParams = this.createHttpParams(params);
    
    return this.http.get(`${this.baseUrl}/v1/analytics/export`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  /** Custom analytics query */
  customAnalyticsQuery(queryData: { queryType: string; parameters?: any; format?: string; limit?: number }): Observable<any> {
    return this.post<any>('/v1/analytics/query', queryData, 'customAnalyticsQuery');
  }

  // ==========================================================================
  // 9. SYSTEM PERFORMANCE & HEALTH
  // ==========================================================================

  /** Analytics system performance monitoring */
  getAnalyticsPerformance(hours: number = 24): Observable<any> {
    const params = { hours };
    return this.get<any>('/v1/analytics/performance', params, 'getAnalyticsPerformance');
  }

  /** Data health check */
  getDataHealth(): Observable<any> {
    return this.get<any>('/v1/analytics/health/data', {}, 'getDataHealth');
  }

  /** Redis status */
  getRedisStatus(): Observable<any> {
    return this.get<any>('/v1/analytics/redis-status', {}, 'getRedisStatus');
  }

  // ==========================================================================
  // 10. CHARTS & VISUAL ANALYTICS (Legacy endpoints - keeping for backward compatibility)
  // ==========================================================================

  getFinancialTrend(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/chart/financial-trend', params, 'getFinancialTrend');
  }

  getSalesDistribution(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/chart/sales-distribution', params, 'getSalesDistribution');
  }

  getBranchPerformanceRadar(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    return this.get<any>('/v1/chart/branch-radar', params, 'getBranchPerformanceRadar');
  }

  getOrderFunnel(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/chart/order-funnel', params, 'getOrderFunnel');
  }

  // ==========================================================================
  // 📋 CONVENIENCE METHODS
  // ==========================================================================

  /**
   * Get all analytics for a specific time period
   */
  getAllAnalyticsForPeriod(startDate: string, endDate: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    // Note: This is a convenience method that could be enhanced to make parallel calls
    return this.getDashboardOverview(startDate, endDate, branchId);
  }

  /**
   * Get summary of key metrics for quick display
   */
  getQuickMetrics(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
    const params = this.buildParams(startDate, endDate, branchId);
    return this.get<any>('/v1/analytics/dashboard', params, 'getQuickMetrics');
  }

  /**
   * Get alerts for notification center
   */
  getNotificationAlerts(branchId?: string): Observable<any> {
    const params = this.buildParams(undefined, undefined, branchId);
    // Combine critical alerts and real-time monitoring
    return this.getCriticalAlerts(branchId);
  }

  /**
   * Export multiple analytics reports in a zip file
   * This is a client-side implementation that would combine multiple exports
   */
  exportComprehensiveReport(startDate: string, endDate: string, branchId?: string): Observable<Blob[]> {
    // This would need server-side support for multi-export or client-side zip creation
    throw new Error('Comprehensive export requires server-side implementation');
  }
}


// // This month's data
// const today = new Date();
// const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
// const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

// const startDate = firstDay.toISOString().split('T')[0];
// const endDate = lastDay.toISOString().split('T')[0];

// this.analyticsService.getDashboardOverview(startDate, endDate)
//   .subscribe(dashboard => console.log('Monthly dashboard:', dashboard));

// // Last 7 days
// const sevenDaysAgo = new Date();
// sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

// this.analyticsService.getOperationalMetrics(
//   sevenDaysAgo.toISOString().split('T')[0],
//   today.toISOString().split('T')[0]
// ).subscribe(metrics => console.log('Weekly metrics:', metrics));
// this.analyticsService.getDashboardOverview()
//   .subscribe({
//     next: (data) => {
//       // Handle successful response
//       this.dashboardData = data.data;
//       this.meta = data.meta;
//     },
//     error: (error) => {
//       // Handle error
//       console.error('Failed to load dashboard:', error);
//       if (error.status === 401) {
//         // Handle unauthorized
//         this.router.navigate(['/login']);
//       } else if (error.status === 403) {
//         // Handle insufficient permissions
//         this.showPermissionError();
//       } else {
//         // Handle other errors
//         this.showErrorMessage('Failed to load analytics data');
//       }
//     },
//     complete: () => {
//       // Optional: Handle completion
//       console.log('Dashboard data loaded');
//     }
//   });

// // 1. Get executive dashboard
// this.analyticsService.getDashboardOverview('2024-01-01', '2024-01-31', 'branch123')
//   .subscribe(data => console.log('Dashboard:', data));

// // 2. Compare branch performance
// this.analyticsService.getBranchComparison('2024-01-01', '2024-01-31', 'revenue', 10)
//   .subscribe(comparison => console.log('Branch comparison:', comparison));

// // 3. Customer segmentation
// this.analyticsService.getCustomerSegmentation()
//   .subscribe(segments => console.log('RFM segments:', segments));

// // 4. Inventory health
// this.analyticsService.getInventoryHealth('branch123', true, true)
//   .subscribe(health => console.log('Inventory health:', health));

// // 5. Sales forecast
// this.analyticsService.getSalesForecast('branch123', 6, 0.90)
//   .subscribe(forecast => console.log('Sales forecast:', forecast));

// // 6. Real-time alerts
// this.analyticsService.getRealTimeMonitoring('branch123', 'critical')
//   .subscribe(alerts => console.log('Critical alerts:', alerts));

// // 7. Export data
// this.analyticsService.exportAnalyticsData('sales', '2024-01-01', '2024-01-31')
//   .subscribe(blob => {
//     // Download the CSV file
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'sales_report.csv';
//     a.click();
//   });

// // 8. Custom query
// this.analyticsService.customAnalyticsQuery({
//   queryType: 'product_movement',
//   parameters: { branchId: 'branch123' },
//   format: 'csv',
//   limit: 1000
// }).subscribe(result => console.log('Custom query result:', result));


// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { BaseApiService } from './base-api.service';

// @Injectable({ providedIn: 'root' })
// export class AdminAnalyticsService extends BaseApiService {

//   // ==========================================================================
//   // 🛠️ HELPER: Standardize Query Params
//   // ==========================================================================
//   private buildParams(startDate?: string, endDate?: string, branchId?: string, extra: any = {}) {
//     // BaseApiService will automatically filter out null/undefined/empty strings
//     return {
//       startDate,
//       endDate,
//       branchId,
//       ...extra
//     };
//   }

//   // ==========================================================================
//   // 1. EXECUTIVE & STRATEGIC (Dashboard & Benchmarks)
//   // ==========================================================================

//   // 📊 Main KPI Dashboard
//   getDashboardOverview(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/dashboard', params, 'Dashboard Overview');
//   }

//   // 🆚 Branch vs. Branch Comparison
//   getBranchComparison(startDate?: string, endDate?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate);
//     return this.get<any>('/v1/analytics/branch-comparison', params, 'Branch Comparison');
//   }

//   // 🔮 AI Revenue Forecast (Linear Regression)
//   getSalesForecast(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/forecast', params, 'Sales Forecast');
//   }

//   // 🚨 Critical Alerts (Low Stock + High Risk Debt)
//   getCriticalAlerts(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/critical-alerts', params, 'Critical Alerts');
//   }

//   // ==========================================================================
//   // 2. FINANCIAL INTELLIGENCE (P&L, Tax, Cash)
//   // ==========================================================================

//   getFinancialReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/financials', params, 'Financial Report');
//   }

//   // 💰 Real Profit (Sales - COGS)
//   getProfitabilityReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/profitability', params, 'Profitability Report');
//   }

//   getCashFlowReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/cash-flow', params, 'Cash Flow Report');
//   }

//   // ⏳ Who owes money? (0-30, 31-60, 90+ days)
//   getDebtorAgingReport(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/debtor-aging', params, 'Debtor Aging');
//   }

//   getTaxReport(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/tax-report', params, 'Tax Report');
//   }

//   // ==========================================================================
//   // 3. OPERATIONAL & STAFF EFFICIENCY
//   // ==========================================================================

//   // 🏆 Employee Leaderboard
//   getStaffPerformance(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/staff-performance', params, 'Staff Performance');
//   }

//   // 📉 Cancellation Rates & Discounts
//   getOperationalMetrics(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/operational-metrics', params, 'Operational Metrics');
//   }

//   // 🔥 Heatmap (Busiest Hours)
//   getPeakBusinessHours(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/peak-hours', params, 'Peak Business Hours');
//   }

//   getProcurementAnalysis(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/procurement', params, 'Procurement Analysis');
//   }

//   // ==========================================================================
//   // 4. INVENTORY INTELLIGENCE
//   // ==========================================================================

//   getInventoryReport(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/inventory', params, 'Inventory Report');
//   }

//   getProductPerformance(startDate?: string, endDate?: string, branchId?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/analytics/product-performance', params, 'Product Performance');
//   }

//   // 💀 Items stuck on shelves > X days
//   getDeadStockReport(branchId?: string, daysThreshold: number = 90): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId, { daysThreshold });
//     return this.get<any>('/v1/analytics/dead-stock', params, 'Dead Stock Report');
//   }

//   // 📉 "Will run out in 7 days" predictions
//   getStockOutPredictions(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/stock-predictions', params, 'Stock Predictions');
//   }

//   // ==========================================================================
//   // 5. CUSTOMER INSIGHTS
//   // ==========================================================================

//   getCustomerInsights(branchId?: string): Observable<any> {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/analytics/customer-insights', params, 'Customer Insights');
//   }

//   // 🎯 RFM Segmentation (Champions, Loyal, At Risk)
//   getCustomerSegmentation(): Observable<any> {
//     return this.get<any>('/v1/analytics/customer-segmentation', {}, 'Customer Segmentation');
//   }

//   // 🔄 Cohort Analysis (Retention)
//   getCustomerRetention(months: number = 6): Observable<any> {
//     return this.get<any>('/v1/analytics/customer-retention', { months }, 'Customer Retention');
//   }

//   // ==========================================================================
//   // 6. SECURITY & EXPORTS
//   // ==========================================================================

//   getSecurityAuditLog(startDate?: string, endDate?: string): Observable<any> {
//     const params = this.buildParams(startDate, endDate);
//     return this.get<any>('/v1/analytics/security-audit', params, 'Security Audit Log');
//   }

//   // ==========================================================================
//   // 7. CHARTS & VISUAL ANALYTICS
//   // ==========================================================================

//   getFinancialTrend(startDate?: string, endDate?: string, branchId?: string) {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/chart/financial-trend', params, 'Financial Trend');
//   }

//   getSalesDistribution(startDate?: string, endDate?: string, branchId?: string) {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/chart/sales-distribution', params, 'Sales Distribution');
//   }

//   getBranchPerformanceRadar(branchId?: string) {
//     const params = this.buildParams(undefined, undefined, branchId);
//     return this.get<any>('/v1/chart/branch-radar', params, 'Branch Radar');
//   }

//   getOrderFunnel(startDate?: string, endDate?: string, branchId?: string) {
//     const params = this.buildParams(startDate, endDate, branchId);
//     return this.get<any>('/v1/chart/order-funnel', params, 'Order Funnel');
//   }

//   /**
//    * 📥 EXPORT DATA (Handles Binary/Blob)
//    * We skip `this.get()` because BaseApiService expects JSON, 
//    * but this endpoint returns a file (Blob).
//    */

//   exportAnalyticsData(type: 'sales' | 'inventory' | 'tax', startDate?: string, endDate?: string): Observable<Blob> {
//     // 1. Build Params
//     const rawParams = this.buildParams(startDate, endDate, undefined, { type, format: 'csv' });

//     // 2. Convert to HttpParams using your BaseApiService helper
//     const httpParams = this.createHttpParams(rawParams);

//     // 3. Raw HTTP call with 'blob' response type
//     return this.http.get(`${this.baseUrl}/v1/analytics/export`, {
//       params: httpParams,
//       responseType: 'blob'
//     });
//   }
// }
