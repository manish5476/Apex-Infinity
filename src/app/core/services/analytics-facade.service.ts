import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminAnalyticsService } from './admin-analytics.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsFacadeService {

  private api = inject(AdminAnalyticsService);

  // ================= STATE =================
  loading = signal(false);
  error = signal<string | null>(null);

  // ================= Normalized Outputs =================
  kpi = signal<any>(null);
  timelineChart = signal<any>(null);
  paymentModes = signal<any>(null);
  leaders = signal<{ topProducts: any[]; topCustomers: any[] } | null>(null);
  branchComparison = signal<any[]>([]);
  inventory = signal<any>(null);
  
  // Risk & Alerts (Low Stock / High Debt)
  risk = signal<any>(null);
  
  // Segmentation (Champions, Loyal, etc.)
  segmentation = signal<any>(null); 

  // Detailed Customer Insights (Credit Risk list)
  customerInsights = signal<any>(null); 
  
  profitability = signal<any>(null);
  tax = signal<any>(null);
  deadStock = signal<any[]>([]); 
  security = signal<any[]>([]);
  forecast = signal<any>(null);

  // === NEW SIGNALS FOR MISSING DATA ===
  financialReport = signal<any>(null);
  debtorAging = signal<any[]>([]);
  staffPerformance = signal<any>(null);
  operationalMetrics = signal<any>(null);
  peakHours = signal<any[]>([]);
  procurement = signal<any>(null);
  productPerformance = signal<any[]>([]);
  stockPredictions = signal<any[]>([]);
  customerRetention = signal<any[]>([]);

  // === CHART SIGNALS ===
  financialTrend = signal<any>(null);
  salesDistribution = signal<any>(null);
  branchRadar = signal<any>(null);
  orderFunnel = signal<any>(null);

  // ================= LOAD DASHBOARD =================
  load(start?: Date, end?: Date, branchId?: string) {
    this.loading.set(true);
    this.error.set(null);

    const startStr = start?.toISOString().split('T')[0]; // YYYY-MM-DD format
    const endStr = end?.toISOString().split('T')[0];

    forkJoin({
      // Executive Dashboards
      dashboard: this.api.getDashboardOverview(startStr, endStr, branchId),
      comparison: this.api.getBranchComparison(startStr, endStr, 'revenue'),
      
      // Financial Intelligence Suite
      financialReport: this.api.getFinancialDashboard(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      cashflow: this.api.getCashFlowAnalysis(startStr, endStr, branchId),
      tax: this.api.getComplianceDashboard(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      
      // Customer Intelligence Hub
      customerInsights: this.api.getCustomerInsights(branchId),
      segmentation: this.api.getCustomerSegmentation().pipe(catchError(() => of({ data: null }))),
      debtorAging: this.api.getCustomerIntelligence(branchId).pipe(catchError(() => of({ data: { debtorAging: [] } }))),
      customerRetention: this.api.getCustomerLifetimeValue(branchId).pipe(catchError(() => of({ data: [] }))),
      
      // Inventory Intelligence Suite
      inventory: this.api.getInventoryHealth(branchId),
      deadStock: this.api.getDeadStockReport(branchId),
      productPerformance: this.api.getProductPerformance(branchId).pipe(catchError(() => of({ data: [] }))),
      stockPredictions: this.api.getStockOutPredictions(branchId).pipe(catchError(() => of({ data: [] }))),
      
      // Operational Excellence Suite
      staffPerformance: this.api.getStaffPerformance(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      operationalMetrics: this.api.getOperationalMetrics(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      peakHours: this.api.getPeakBusinessHours(branchId).pipe(catchError(() => of({ data: [] }))),
      procurement: this.api.getProcurementAnalysis(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      
      // Predictive Analytics & Forecasting
      forecast: this.api.getSalesForecast(branchId).pipe(catchError(() => of({ data: null }))),
      
      // Real-time Monitoring & Alerts
      risk: this.api.getCriticalAlerts(branchId).pipe(catchError(() => of({ data: null }))),
      security: this.api.getSecurityAuditLog(startStr, endStr, branchId),
      
      // Legacy Chart Endpoints
      financialTrend: this.api.getFinancialTrend(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      salesDistribution: this.api.getSalesDistribution(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
      branchRadar: this.api.getBranchPerformanceRadar(branchId).pipe(catchError(() => of({ data: null }))),
      orderFunnel: this.api.getOrderFunnel(startStr, endStr, branchId).pipe(catchError(() => of({ data: null })))
    })
    .subscribe({
      next: (res) => {
        this.mapResponse(res);
      },
      error: (err) => {
        this.error.set('Failed to fetch analytics');
        console.error(err);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  // ================= MAPPING =================
  private mapResponse(res: any) {
    const d = res.dashboard?.data;

    // KPI - Updated to match AdminAnalyticsService response structure
    this.kpi.set({
      revenue: d?.kpi?.totalRevenue?.value ?? d?.kpi?.revenue ?? 0,
      revenueGrowth: d?.kpi?.totalRevenue?.growth ?? d?.kpi?.revenueGrowth ?? 0,
      profit: d?.kpi?.netProfit?.value ?? d?.kpi?.profit ?? 0,
      profitGrowth: d?.kpi?.netProfit?.growth ?? d?.kpi?.profitGrowth ?? 0,
      expense: d?.kpi?.totalExpense?.value ?? d?.kpi?.expenses ?? 0,
      receivables: d?.kpi?.outstanding?.receivables ?? d?.financials?.receivables ?? 0
    });

    // Charts
    this.timelineChart.set({
      labels: d?.charts?.timeline?.map((e: any) => e.date) ?? d?.timeSeries?.map((e: any) => e.period) ?? [],
      series: d?.charts?.timeline?.map((e: any) => e.income) ?? d?.timeSeries?.map((e: any) => e.revenue) ?? [], 
    });

    this.leaders.set({
      topCustomers: d?.leaders?.topCustomers ?? d?.topCustomers ?? [],
      topProducts: d?.leaders?.topProducts ?? d?.topProducts ?? []
    });

    // Financial Data
    this.profitability.set(res.financialReport?.data ?? null);
    this.tax.set(res.tax?.data ?? null);

    // Cashflow
    const cf = res.cashflow?.data;
    this.paymentModes.set({
      labels: cf?.paymentModes?.map((e: any) => e.name) ?? cf?.paymentMethods?.map((e: any) => e.method) ?? [],
      values: cf?.paymentModes?.map((e: any) => e.value) ?? cf?.paymentMethods?.map((e: any) => e.amount) ?? []
    });

    // Inventory: Prioritize Dashboard snapshot if available, else separate report
    const dashboardInv = d?.inventory;
    const reportInv = res.inventory?.data;
    const activeInv = dashboardInv || reportInv;

    this.inventory.set({
      totalValue: activeInv?.inventoryValuation?.totalValue ?? activeInv?.totalValue ?? 0,
      totalItems: activeInv?.inventoryValuation?.totalItems ?? activeInv?.totalItems ?? 0,
      products: activeInv?.inventoryValuation?.productCount ?? activeInv?.productCount ?? 0,
      lowStockCount: activeInv?.lowStockAlerts?.length ?? activeInv?.lowStockCount ?? 0
    });
    
    this.deadStock.set(res.deadStock?.data ?? []);
    this.branchComparison.set(res.comparison?.data ?? []);

    // Customer Insights (Credit Risk)
    const customerData = res.customerInsights?.data;
    this.customerInsights.set({
      creditRisk: customerData?.creditRisk ?? customerData?.highRiskCustomers ?? [],
      churnCount: customerData?.churnCount ?? customerData?.atRiskCustomers?.length ?? 0
    });

    this.segmentation.set(res.segmentation?.data ?? null);
    this.risk.set(res.risk?.data ?? null);
    this.security.set(res.security?.data?.recentEvents ?? res.security?.data?.logs ?? []);
    this.forecast.set(res.forecast?.data ?? null);

    // === MAPPING NEW DATA ===
    this.financialReport.set(res.financialReport?.data ?? null);
    
    // Debtor Aging from Customer Intelligence
    const customerIntelligence = res.debtorAging?.data;
    this.debtorAging.set(customerIntelligence?.debtorAging ?? customerIntelligence?.agingReport ?? []);
    
    this.staffPerformance.set(res.staffPerformance?.data ?? null);
    this.operationalMetrics.set(res.operationalMetrics?.data ?? null);
    this.peakHours.set(res.peakHours?.data ?? []);
    this.procurement.set(res.procurement?.data ?? null);
    this.productPerformance.set(res.productPerformance?.data ?? []);
    this.stockPredictions.set(res.stockPredictions?.data ?? []);
    
    // Customer Retention from Lifetime Value
    const ltvData = res.customerRetention?.data;
    this.customerRetention.set(ltvData?.retentionData ?? ltvData?.customerSegments ?? []);

    // === MAPPING CHART DATA ===
    this.financialTrend.set(res.financialTrend?.data ?? null);
    this.salesDistribution.set(res.salesDistribution?.data ?? null);
    this.branchRadar.set(res.branchRadar?.data ?? null);
    this.orderFunnel.set(res.orderFunnel?.data ?? null);
  }

  // Helper for manual export trigger
  exportData(type: 'sales' | 'inventory' | 'customers', start?: Date, end?: Date) {
    const startStr = start?.toISOString().split('T')[0];
    const endStr = end?.toISOString().split('T')[0];
    return this.api.exportAnalyticsData(type, startStr, endStr);
  }

  // ================= ADDITIONAL CONVENIENCE METHODS =================

  /**
   * Load comprehensive analytics for a specific time period
   */
  loadComprehensiveAnalytics(start: Date, end: Date, branchId?: string) {
    return this.load(start, end, branchId);
  }

  /**
   * Load quick metrics for dashboard
   */
  loadQuickMetrics(start?: Date, end?: Date, branchId?: string) {
    this.loading.set(true);
    const startStr = start?.toISOString().split('T')[0];
    const endStr = end?.toISOString().split('T')[0];
    
    this.api.getQuickMetrics(startStr, endStr, branchId)
      .pipe(catchError(err => {
        this.error.set('Failed to load quick metrics');
        console.error(err);
        return of({ data: null });
      }))
      .subscribe({
        next: (response) => {
          const data = response?.data;
          this.kpi.set({
            revenue: data?.revenue ?? 0,
            revenueGrowth: data?.revenueGrowth ?? 0,
            profit: data?.profit ?? 0,
            profitGrowth: data?.profitGrowth ?? 0,
            expense: data?.expenses ?? 0,
            receivables: data?.receivables ?? 0
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  /**
   * Refresh alerts and notifications
   */
  refreshAlerts(branchId?: string) {
    forkJoin({
      risk: this.api.getCriticalAlerts(branchId).pipe(catchError(() => of({ data: null }))),
      realtime: this.api.getRealTimeMonitoring(branchId).pipe(catchError(() => of({ data: null })))
    }).subscribe({
      next: (res) => {
        // Combine both alert sources
        const combinedAlerts = [
          ...(res.risk?.data?.alerts ?? []),
          ...(res.realtime?.data?.alerts ?? [])
        ];
        this.risk.set({ alerts: combinedAlerts });
      }
    });
  }
}

// import { inject, Injectable, signal } from '@angular/core';
// import { forkJoin, of } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { AdminAnalyticsService } from './admin-analytics.service';

// @Injectable({ providedIn: 'root' })
// export class AnalyticsFacadeService {

//   private api = inject(AdminAnalyticsService);

//   // ================= STATE =================
//   loading = signal(false);
//   error = signal<string | null>(null);

//   // ================= Normalized Outputs =================
//   kpi = signal<any>(null);
//   timelineChart = signal<any>(null);
//   paymentModes = signal<any>(null);
//   leaders = signal<{ topProducts: any[]; topCustomers: any[] } | null>(null);
//   branchComparison = signal<any[]>([]);
//   inventory = signal<any>(null);
  
//   // Risk & Alerts (Low Stock / High Debt)
//   risk = signal<any>(null);
  
//   // Segmentation (Champions, Loyal, etc.)
//   segmentation = signal<any>(null); 

//   // Detailed Customer Insights (Credit Risk list)
//   customerInsights = signal<any>(null); 
  
//   profitability = signal<any>(null);
//   tax = signal<any>(null);
//   deadStock = signal<any[]>([]); 
//   security = signal<any[]>([]);
//   forecast = signal<any>(null);

//   // === NEW SIGNALS FOR MISSING DATA ===
//   financialReport = signal<any>(null);
//   debtorAging = signal<any[]>([]);
//   staffPerformance = signal<any>(null);
//   operationalMetrics = signal<any>(null);
//   peakHours = signal<any[]>([]);
//   procurement = signal<any>(null);
//   productPerformance = signal<any[]>([]);
//   stockPredictions = signal<any[]>([]);
//   customerRetention = signal<any[]>([]);

//   // === CHART SIGNALS ===
//   financialTrend = signal<any>(null);
//   salesDistribution = signal<any>(null);
//   branchRadar = signal<any>(null);
//   orderFunnel = signal<any>(null);

//   // ================= LOAD DASHBOARD =================
//   load(start?: Date, end?: Date, branchId?: string) {
//     this.loading.set(true);
//     this.error.set(null);

//     const startStr = start?.toISOString();
//     const endStr = end?.toISOString();

//     forkJoin({
//       // Existing Calls
//       dashboard: this.api.getDashboardOverview(startStr, endStr, branchId),
//       comparison: this.api.getBranchComparison(startStr, endStr),
//       profitability: this.api.getProfitabilityReport(startStr, endStr, branchId),
//       cashflow: this.api.getCashFlowReport(startStr, endStr, branchId),
//       tax: this.api.getTaxReport(startStr, endStr, branchId),
//       inventory: this.api.getInventoryReport(branchId),
//       deadStock: this.api.getDeadStockReport(branchId),
//       customerInsights: this.api.getCustomerInsights(branchId),
//       segmentation: this.api.getCustomerSegmentation().pipe(catchError(() => of({ data: null }))),
//       forecast: this.api.getSalesForecast(branchId).pipe(catchError(() => of({ data: null }))),
//       risk: this.api.getCriticalAlerts(branchId).pipe(catchError(() => of({ data: null }))),
//       security: this.api.getSecurityAuditLog(startStr, endStr),

//       // New Calls for Comprehensive Coverage
//       financialReport: this.api.getFinancialReport(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
//       debtorAging: this.api.getDebtorAgingReport(branchId).pipe(catchError(() => of({ data: [] }))),
//       staffPerformance: this.api.getStaffPerformance(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
//       operationalMetrics: this.api.getOperationalMetrics(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
//       peakHours: this.api.getPeakBusinessHours(branchId).pipe(catchError(() => of({ data: [] }))),
//       procurement: this.api.getProcurementAnalysis(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
//       productPerformance: this.api.getProductPerformance(startStr, endStr, branchId).pipe(catchError(() => of({ data: [] }))),
//       stockPredictions: this.api.getStockOutPredictions(branchId).pipe(catchError(() => of({ data: [] }))),
//       customerRetention: this.api.getCustomerRetention().pipe(catchError(() => of({ data: [] }))),

//       // Specific Chart Data
//       financialTrend: this.api.getFinancialTrend(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
//       salesDistribution: this.api.getSalesDistribution(startStr, endStr, branchId).pipe(catchError(() => of({ data: null }))),
//       branchRadar: this.api.getBranchPerformanceRadar(branchId).pipe(catchError(() => of({ data: null }))),
//       orderFunnel: this.api.getOrderFunnel(startStr, endStr, branchId).pipe(catchError(() => of({ data: null })))
//     })
//     .subscribe({
//       next: (res) => {
//         this.mapResponse(res);
//       },
//       error: (err) => {
//         this.error.set('Failed to fetch analytics');
//         console.error(err);
//         this.loading.set(false);
//       },
//       complete: () => this.loading.set(false)
//     });
//   }

//   // ================= MAPPING =================
//   private mapResponse(res: any) {
//     const d = res.dashboard?.data;

//     // KPI
//     this.kpi.set({
//       revenue: d?.kpi?.totalRevenue?.value ?? 0,
//       revenueGrowth: d?.kpi?.totalRevenue?.growth ?? 0,
//       profit: d?.kpi?.netProfit?.value ?? 0,
//       profitGrowth: d?.kpi?.netProfit?.growth ?? 0,
//       expense: d?.kpi?.totalExpense?.value ?? 0,
//       receivables: d?.kpi?.outstanding?.receivables ?? 0
//     });

//     // Charts
//     this.timelineChart.set({
//       labels: d?.charts?.timeline?.map((e: any) => e.date) ?? [],
//       series: d?.charts?.timeline?.map((e: any) => e.income) ?? [], 
//     });

//     this.leaders.set({
//       topCustomers: d?.leaders?.topCustomers ?? [],
//       topProducts: d?.leaders?.topProducts ?? []
//     });

//     this.profitability.set(res.profitability?.data ?? null);
//     this.tax.set(res.tax?.data ?? null);

//     // Cashflow
//     const cf = res.cashflow?.data;
//     this.paymentModes.set({
//       labels: cf?.paymentModes?.map((e: any) => e.name) ?? [],
//       values: cf?.paymentModes?.map((e: any) => e.value) ?? []
//     });

//     // Inventory: Prioritize Dashboard snapshot if available, else separate report
//     const dashboardInv = d?.inventory;
//     const reportInv = res.inventory?.data;
//     const activeInv = dashboardInv || reportInv;

//     this.inventory.set({
//       totalValue: activeInv?.inventoryValuation?.totalValue ?? 0,
//       totalItems: activeInv?.inventoryValuation?.totalItems ?? 0,
//       products: activeInv?.inventoryValuation?.productCount ?? 0,
//       lowStockCount: activeInv?.lowStockAlerts?.length ?? 0
//     });
    
//     this.deadStock.set(res.deadStock?.data ?? []);
//     this.branchComparison.set(res.comparison?.data ?? []);

//     // Customer Insights (Credit Risk)
//     this.customerInsights.set({
//        creditRisk: res.customerInsights?.data?.creditRisk ?? [],
//        churnCount: res.customerInsights?.data?.churnCount ?? 0
//     });

//     this.segmentation.set(res.segmentation?.data ?? null);
//     this.risk.set(res.risk?.data ?? null);
//     this.security.set(res.security?.data?.recentEvents ?? []);
//     this.forecast.set(res.forecast?.data ?? null);

//     // === MAPPING NEW DATA ===
//     this.financialReport.set(res.financialReport?.data ?? null);
//     this.debtorAging.set(res.debtorAging?.data ?? []);
//     this.staffPerformance.set(res.staffPerformance?.data ?? null);
//     this.operationalMetrics.set(res.operationalMetrics?.data ?? null);
//     this.peakHours.set(res.peakHours?.data ?? []);
//     this.procurement.set(res.procurement?.data ?? null);
//     this.productPerformance.set(res.productPerformance?.data ?? []);
//     this.stockPredictions.set(res.stockPredictions?.data ?? []);
//     this.customerRetention.set(res.customerRetention?.data ?? []);

//     // === MAPPING CHART DATA ===
//     this.financialTrend.set(res.financialTrend?.data ?? null);
//     this.salesDistribution.set(res.salesDistribution?.data ?? null);
//     this.branchRadar.set(res.branchRadar?.data ?? null);
//     this.orderFunnel.set(res.orderFunnel?.data ?? null);
//   }

//   // Helper for manual export trigger
//   exportData(type: 'sales' | 'inventory' | 'tax', start?: Date, end?: Date) {
//     const startStr = start?.toISOString();
//     const endStr = end?.toISOString();
//     return this.api.exportAnalyticsData(type, startStr, endStr);
//   }
// }