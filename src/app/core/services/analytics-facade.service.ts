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
  
  // Segmentation (Champions, Loyal, etc.) - ADDED THIS BACK
  segmentation = signal<any>(null); 

  // Detailed Customer Insights (Credit Risk list)
  customerInsights = signal<any>(null); 
  
  profitability = signal<any>(null);
  tax = signal<any>(null);
  deadStock = signal<any[]>([]); 
  security = signal<any[]>([]);
  forecast = signal<any>(null);

  // ================= LOAD DASHBOARD =================
  load(start?: Date, end?: Date, branchId?: string) {
    this.loading.set(true);
    this.error.set(null);

    const startStr = start?.toISOString();
    const endStr = end?.toISOString();

    forkJoin({
      dashboard: this.api.getDashboardOverview(startStr, endStr, branchId),
      comparison: this.api.getBranchComparison(startStr, endStr),
      profitability: this.api.getProfitabilityReport(startStr, endStr, branchId),
      cashflow: this.api.getCashFlowReport(startStr, endStr, branchId),
      tax: this.api.getTaxReport(startStr, endStr, branchId),
      inventory: this.api.getInventoryReport(branchId),
      deadStock: this.api.getDeadStockReport(branchId),
      
      // Credit Risk Data
      customerInsights: this.api.getCustomerInsights(branchId),

      // ADDED: Segmentation Data (Pie Chart)
      segmentation: this.api.getCustomerSegmentation().pipe(catchError(() => of({ data: null }))),

      // Forecast & Risk (Protected with catchError)
      forecast: this.api.getSalesForecast(branchId).pipe(catchError(() => of({ data: null }))),
      risk: this.api.getCriticalAlerts(branchId).pipe(catchError(() => of({ data: null }))),
      
      security: this.api.getSecurityAuditLog(startStr, endStr)
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

    // KPI
    this.kpi.set({
      revenue: d?.kpi?.totalRevenue?.value ?? 0,
      revenueGrowth: d?.kpi?.totalRevenue?.growth ?? 0,
      profit: d?.kpi?.netProfit?.value ?? 0,
      profitGrowth: d?.kpi?.netProfit?.growth ?? 0,
      expense: d?.kpi?.totalExpense?.value ?? 0,
      receivables: d?.kpi?.outstanding?.receivables ?? 0
    });

    // Charts
    this.timelineChart.set({
      labels: d?.charts?.timeline?.map((e: any) => e.date) ?? [],
      series: d?.charts?.timeline?.map((e: any) => e.income) ?? [], // Changed to 'series' to match RevenueChart component
    });

    this.leaders.set({
      topCustomers: d?.leaders?.topCustomers ?? [],
      topProducts: d?.leaders?.topProducts ?? []
    });

    this.profitability.set(res.profitability?.data ?? null);
    this.tax.set(res.tax?.data ?? null);

    // Cashflow
    const cf = res.cashflow?.data;
    this.paymentModes.set({
      labels: cf?.paymentModes?.map((e: any) => e.name) ?? [],
      values: cf?.paymentModes?.map((e: any) => e.value) ?? []
    });

    // Inventory
    const inv = res.inventory?.data;
    this.inventory.set({
      totalValue: inv?.inventoryValuation?.totalValue ?? 0,
      totalItems: inv?.inventoryValuation?.totalItems ?? 0,
      products: inv?.inventoryValuation?.productCount ?? 0,
      lowStockCount: inv?.lowStockAlerts?.length ?? 0
    });
    
    this.deadStock.set(res.deadStock?.data ?? []);
    this.branchComparison.set(res.comparison?.data ?? []);

    // Customer Insights (Credit Risk)
    this.customerInsights.set({
       creditRisk: res.customerInsights?.data?.creditRisk ?? [],
       churnCount: res.customerInsights?.data?.churnCount ?? 0
    });

    // ADDED: Segmentation Mapping
    this.segmentation.set(res.segmentation?.data ?? null);

    this.risk.set(res.risk?.data ?? null);
    this.security.set(res.security?.data?.recentEvents ?? []);
    this.forecast.set(res.forecast?.data ?? null);
  }
}

// import { inject, Injectable, signal } from '@angular/core';
// import { forkJoin, of } from 'rxjs';
// import { catchError } from 'rxjs/operators'; // Import this
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
//   risk = signal<any>(null);
  
//   // FIX: Separate Insights (Credit risk) from Segmentation
//   customerInsights = signal<any>(null); 
  
//   // FIX: Add missing signals
//   profitability = signal<any>(null);
//   tax = signal<any>(null);
//   deadStock = signal<any[]>([]); // Added this

//   security = signal<any[]>([]);
//   forecast = signal<any>(null);

//   // ================= LOAD DASHBOARD =================
//   load(start?: Date, end?: Date, branchId?: string) {
//     this.loading.set(true);
//     this.error.set(null);

//     const startStr = start?.toISOString();
//     const endStr = end?.toISOString();

//     forkJoin({
//       dashboard: this.api.getDashboardOverview(startStr, endStr, branchId),
//       comparison: this.api.getBranchComparison(startStr, endStr),
//       profitability: this.api.getProfitabilityReport(startStr, endStr, branchId),
//       cashflow: this.api.getCashFlowReport(startStr, endStr, branchId),
//       tax: this.api.getTaxReport(startStr, endStr, branchId),
//       inventory: this.api.getInventoryReport(branchId),
//       // productPerf: this.api.getProductPerformance... (You weren't using this in mapResponse)
//       deadStock: this.api.getDeadStockReport(branchId), // FIX: Use this instead of generic product perf
//       customer: this.api.getCustomerInsights(branchId),
      
//       // FIX: Add catchError to prevent full crash if AI/Risk fails
//       forecast: this.api.getSalesForecast(branchId).pipe(catchError(() => of({ data: null }))),
//       risk: this.api.getCriticalAlerts(branchId).pipe(catchError(() => of({ data: null }))),
//       security: this.api.getSecurityAuditLog(startStr, endStr)
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
//     const d = res.dashboard?.data; // Shorten for readability

//     // ---------- KPI (Validated against JSON) ----------
//     this.kpi.set({
//       revenue: d?.kpi?.totalRevenue?.value ?? 0,
//       revenueGrowth: d?.kpi?.totalRevenue?.growth ?? 0,
//       profit: d?.kpi?.netProfit?.value ?? 0,
//       expense: d?.kpi?.totalExpense?.value ?? 0,
//       receivables: d?.kpi?.outstanding?.receivables ?? 0
//     });

//     // ---------- Timeline Chart ----------
//     this.timelineChart.set({
//       labels: d?.charts?.timeline?.map((e: any) => e.date) ?? [],
//       revenue: d?.charts?.timeline?.map((e: any) => e.income) ?? [],
//       expense: d?.charts?.timeline?.map((e: any) => e.expense) ?? [],
//       profit: d?.charts?.timeline?.map((e: any) => e.profit) ?? []
//     });

//     // ---------- Leaders ----------
//     this.leaders.set({
//       topCustomers: d?.leaders?.topCustomers ?? [],
//       topProducts: d?.leaders?.topProducts ?? []
//     });

//     // ---------- Financials (FIX: Now mapping these) ----------
//     this.profitability.set(res.profitability?.data ?? null);
//     this.tax.set(res.tax?.data ?? null);

//     // ---------- Cashflow ----------
//     const cf = res.cashflow?.data;
//     this.paymentModes.set({
//       labels: cf?.paymentModes?.map((e: any) => e.name) ?? [],
//       values: cf?.paymentModes?.map((e: any) => e.value) ?? []
//     });

//     // ---------- Inventory (Validated) ----------
//     const inv = res.inventory?.data;
//     this.inventory.set({
//       totalValue: inv?.inventoryValuation?.totalValue ?? 0,
//       totalItems: inv?.inventoryValuation?.totalItems ?? 0,
//       products: inv?.inventoryValuation?.productCount ?? 0,
//       lowStockCount: inv?.lowStockAlerts?.length ?? 0 // Note: In your JSON, lowStockAlerts is an array
//     });
    
//     // FIX: Mapping Dead Stock
//     this.deadStock.set(res.deadStock?.data ?? []);

//     // ---------- Customer Insights (FIX: Correct Mapping) ----------
//     // This is NOT segmentation. This is credit risk.
//     this.customerInsights.set({
//        creditRisk: res.customer?.data?.creditRisk ?? [],
//        churnCount: res.customer?.data?.churnCount ?? 0
//     });

//     // ---------- Security ----------
//     // JSON says: data: { recentEvents: [...] }
//     this.security.set(res.security?.data?.recentEvents ?? []);

//     // ---------- Forecast ----------
//     this.forecast.set(res.forecast?.data ?? null);
//   }
// }

// // import { inject, Injectable, signal } from '@angular/core';
// // import { forkJoin } from 'rxjs';
// // import { AdminAnalyticsService } from './admin-analytics.service';

// // @Injectable({ providedIn: 'root' })
// // export class AnalyticsFacadeService {

// //   private api = inject(AdminAnalyticsService);

// //   // ================= STATE =================
// //   loading = signal(false);
// //   error = signal<string | null>(null);

// //   raw = signal<any>(null);

// //   // ================= Normalized Outputs =================
// //   kpi = signal<any>(null);
// //   timelineChart = signal<any>(null);
// //   paymentModes = signal<any>(null);
// //   leaders = signal<{ topProducts: any[]; topCustomers: any[] } | null>(null);
// //   branchComparison = signal<any[]>([]);
// //   inventory = signal<any>(null);
// //   risk = signal<any>(null);
// //   segmentation = signal<any>(null);
// //   security = signal<any[]>([]);
// //   forecast = signal<any>(null);

// //   // ================= LOAD DASHBOARD =================
// //   load(start?: Date, end?: Date, branchId?: string) {
// //     this.loading.set(true);
// //     this.error.set(null);

// //     const startStr = start?.toISOString();
// //     const endStr = end?.toISOString();

// //     forkJoin({
// //       dashboard: this.api.getDashboardOverview(startStr, endStr, branchId),
// //       comparison: this.api.getBranchComparison(startStr, endStr),
// //       profitability: this.api.getProfitabilityReport(startStr, endStr, branchId),
// //       cashflow: this.api.getCashFlowReport(startStr, endStr, branchId),
// //       tax: this.api.getTaxReport(startStr, endStr, branchId),
// //       inventory: this.api.getInventoryReport(branchId),
// //       productPerf: this.api.getProductPerformance(startStr, endStr, branchId),
// //       customer: this.api.getCustomerInsights(branchId),
// //       forecast: this.api.getSalesForecast(branchId),
// //       risk: this.api.getCriticalAlerts(branchId),
// //       security: this.api.getSecurityAuditLog(branchId)
// //     })
// //     .subscribe({
// //       next: (res) => {
// //         this.raw.set(res);
// //         this.mapResponse(res);
// //       },
// //       error: (err) => {
// //         this.error.set('Failed to fetch analytics');
// //         console.error(err);
// //       },
// //       complete: () => this.loading.set(false)
// //     });
// //   }


// //   // ================= MAPPING =================
// //   private mapResponse(res: any) {
// //     const dashboard = res.dashboard?.data;
// //     const cashflow = res.cashflow?.data;
// //     const inventory = res.inventory?.data;
// //     const customer = res.customer?.data;
// //     const risk = res.risk?.data;
// //     const security = res.security?.data?.recentEvents ?? [];

// //     // ---------- KPI ----------
// //     this.kpi.set({
// //       revenue: dashboard?.kpi?.totalRevenue?.value ?? 0,
// //       revenueGrowth: dashboard?.kpi?.totalRevenue?.growth ?? null,
// //       profit: dashboard?.kpi?.netProfit?.value ?? 0,
// //       profitGrowth: dashboard?.kpi?.netProfit?.growth ?? null,
// //       receivables: dashboard?.kpi?.outstanding?.receivables ?? 0,
// //       expense: dashboard?.kpi?.totalExpense?.value ?? 0
// //     });

// //     // ---------- Timeline ----------
// //     this.timelineChart.set({
// //       labels: dashboard?.charts?.timeline?.map((e: any) => e.date) ?? [],
// //       revenue: dashboard?.charts?.timeline?.map((e: any) => e.income) ?? [],
// //       expense: dashboard?.charts?.timeline?.map((e: any) => e.expense) ?? [],
// //       profit: dashboard?.charts?.timeline?.map((e: any) => e.profit) ?? []
// //     });

// //     // ---------- Payment Modes ----------
// //     this.paymentModes.set({
// //       labels: cashflow?.paymentModes?.map((e: any) => e.name) ?? [],
// //       values: cashflow?.paymentModes?.map((e: any) => e.value) ?? []
// //     });

// //     // ---------- Leaders ----------
// //     this.leaders.set({
// //       topCustomers: dashboard?.leaders?.topCustomers ?? [],
// //       topProducts: dashboard?.leaders?.topProducts ?? []
// //     });

// //     // ---------- Branch Comparison ----------
// //     this.branchComparison.set(res.comparison?.data ?? []);

// //     // ---------- Inventory ----------
// //     this.inventory.set({
// //       totalValue: inventory?.inventoryValuation?.totalValue ?? 0,
// //       totalItems: inventory?.inventoryValuation?.totalItems ?? 0,
// //       products: inventory?.inventoryValuation?.productCount ?? 0,
// //       lowStockCount: inventory?.lowStockAlerts?.length ?? 0
// //     });

// //     // ---------- Risk ----------
// //     this.risk.set({
// //       lowStock: risk?.lowStockCount ?? 0,
// //       highDebt: risk?.highRiskDebtCount ?? 0,
// //       reorderItems: risk?.itemsToReorder ?? []
// //     });

// //     // ---------- Customer Segmentation ----------
// //     this.segmentation.set(customer ?? null);

// //     // ---------- Security Audit ----------
// //     this.security.set(security);

// //     // ---------- Forecast ----------
// //     this.forecast.set({
// //       revenue: res.forecast?.data?.revenue ?? 0,
// //       trend: res.forecast?.data?.trend ?? 'stable'
// //     });
// //   }
// // }

