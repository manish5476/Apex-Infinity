import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../../../../core/services/admin-analytics.service';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ChartModule,
    FormsModule,          
    DatePicker,
    TableModule,
    SkeletonModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);

  // Expose for template usage
  public common = inject(CommonMethodService);

  // State
  loading = signal(true);

  // Overview summary from /v1/dashboard
  overviewSummary = signal<any | null>(null);

  // Ledger-style summary from /v1/admin/summary (totals)
  financeSummary = signal<any | null>(null);

  topProducts = signal<any[]>([]);
  topCustomers = signal<any[]>([]);
  receivables = signal<any[]>([]);
  payables = signal<any[]>([]); // For future use if needed

  // Chart
  chartData = signal<any>(null);
  chartOptions = signal<any>(null);

  // UI
  activeRankingTab = signal<'products' | 'customers'>('products');

  ngOnInit() {
    this.loadDashboard();
  }
 loadDashboard(start?: string, end?: string) {
    this.loading.set(true);

    forkJoin({
      overview: this.analyticsService.getDashboardOverview(start, end),
      summary: this.analyticsService.getSummary(start, end),
      trends: this.analyticsService.getMonthlyTrends(6), // still month-based overall
      outstanding: this.analyticsService.getOutstanding('receivable', 5)
    }).subscribe({
      next: (res: any) => {
        if (res.overview?.status === 'success') {
          const data = res.overview.data;
          this.overviewSummary.set(data.summary || null);
          this.topProducts.set(data.topProducts || []);
          this.topCustomers.set(data.topCustomers || []);
        }

        if (res.summary?.status === 'success') {
          this.financeSummary.set(res.summary.data?.totals || null);
        }

        if (res.trends?.status === 'success') {
          this.initChart(res.trends.data.series || []);
        }

        if (res.outstanding?.status === 'success') {
          this.receivables.set(res.outstanding.data?.list || []);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }
    // ---------------------------
  // DATE FILTER STATE + HELPERS
  // ---------------------------

  // Stores the date range selected from calendar
  dateRangeModel: Date[] | null = null;

  // Tracks which preset filter is active: All time, This month or Custom
  activePreset = signal<'all' | 'month' | 'custom'>('all');

  // Returns today so we use it as calendar limit
  get today(): Date {
    return new Date();
  }

  // Converts JS Date → backend format yyyy-MM-dd
  private toApiDate(d?: Date | null): string | undefined {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Apply quick preset filters
  applyPreset(preset: 'all' | 'month') {
    this.activePreset.set(preset);
    this.dateRangeModel = null; // Reset custom date selection

    if (preset === 'all') {
      this.loadDashboard(undefined, undefined);
      return;
    }

    if (preset === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const startStr = this.toApiDate(start);
      const endStr = this.toApiDate(now);

      this.loadDashboard(startStr, endStr);
    }
  }

  // Triggered when user picks custom date
  onDateRangeChange() {
    this.activePreset.set('custom');

    if (!this.dateRangeModel || this.dateRangeModel.length < 2) return;

    const [startDate, endDate] = this.dateRangeModel;
    const startStr = this.toApiDate(startDate);
    const endStr = this.toApiDate(endDate || startDate);

    this.loadDashboard(startStr, endStr);
  }

  // loadDashboard() {
  //   this.loading.set(true);

  //   forkJoin({
  //     overview: this.analyticsService.getDashboardOverview(),       // /v1/dashboard
  //     summary: this.analyticsService.getSummary(),                  // /v1/admin/summary
  //     trends: this.analyticsService.getMonthlyTrends(6),            // /v1/admin/monthly
  //     outstandingReceivable: this.analyticsService.getOutstanding('receivable', 5),
  //     // If you later want payables UI, just use this:
  //     // outstandingPayable: this.analyticsService.getOutstanding('payable', 5)
  //   }).subscribe({
  //     next: (res: any) => {
  //       // 1. Dashboard overview
  //       if (res.overview?.status === 'success') {
  //         const data = res.overview.data;
  //         this.overviewSummary.set(data.summary || null);
  //         this.topProducts.set(data.topProducts || []);
  //         this.topCustomers.set(data.topCustomers || []);
  //       }

  //       // 2. Admin summary (ledger style)
  //       if (res.summary?.status === 'success') {
  //         this.financeSummary.set(res.summary.data?.totals || null);
  //       }

  //       // 3. Monthly chart
  //       if (res.trends?.status === 'success') {
  //         this.initChart(res.trends.data.series || []);
  //       }

  //       // 4. Outstanding receivables
  //       if (res.outstandingReceivable?.status === 'success') {
  //         this.receivables.set(res.outstandingReceivable.data?.list || []);
  //       }

  //       // If you use payables later:
  //       // if (res.outstandingPayable?.status === 'success') {
  //       //   this.payables.set(res.outstandingPayable.data?.list || []);
  //       // }

  //       this.loading.set(false);
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.loading.set(false);
  //     }
  //   });
  // }

  setRankingTab(tab: 'products' | 'customers') {
    this.activeRankingTab.set(tab);
  }

  /**
   * Build "Revenue vs Receipts" line+bar chart
   */
  initChart(series: any[]) {
    const documentStyle = getComputedStyle(document.documentElement);

    const textColor =
      documentStyle.getPropertyValue('--text-secondary').trim() || '#64748b';
    const surfaceBorder =
      documentStyle.getPropertyValue('--border-secondary').trim() || '#e2e8f0';

    let accentPrimary = documentStyle.getPropertyValue('--accent-primary').trim();
    if (!accentPrimary) accentPrimary = '#0d9488';

    let accentSecondary = documentStyle.getPropertyValue('--accent-secondary').trim();
    if (!accentSecondary) accentSecondary = '#6366f1';

    // Filter out broken records (where month is an object)
    const validSeries = (series || []).filter(
      (item: any) => typeof item.month === 'string'
    );

    const labels = validSeries.map((i: any) => i.month);
    const sales = validSeries.map((i: any) => i.sales || 0);
    const receipts = validSeries.map((i: any) => i.paymentsIn || 0);

    this.chartData.set({
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Sales',
          data: sales,
          fill: true,
          borderColor: accentPrimary,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: accentPrimary,
          pointBorderWidth: 2,
          tension: 0.35,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, this.hexToRgba(accentPrimary, 0.25));
            gradient.addColorStop(1, this.hexToRgba(accentPrimary, 0));
            return gradient;
          }
        },
        {
          type: 'bar',
          label: 'Receipts',
          data: receipts,
          borderRadius: 6,
          barPercentage: 0.45,
          categoryPercentage: 0.5,
          backgroundColor: this.hexToRgba(accentSecondary, 0.65)
        }
      ]
    });

    this.chartOptions.set({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            usePointStyle: true,
            color: textColor,
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#0f172a',
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          padding: 10,
          displayColors: true
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: 'transparent', drawBorder: false }
        },
        y: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
            borderDash: [5, 5]
          }
        }
      }
    });
  }

  hexToRgba(hex: string, alpha: number) {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`;

    hex = hex.trim();

    if (hex.startsWith('#')) {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);

      if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Assume already rgb/rgba
    return hex;
  }

  // Small helpers for template (avoid ugly null checks in HTML)
  totalSales() {
    return this.overviewSummary()?.totalSales || 0;
  }

  netProfit() {
    return this.overviewSummary()?.netProfit || 0;
  }

  totalReceipts() {
    return this.overviewSummary()?.totalReceipts || 0;
  }

  totalExpenses() {
    return this.overviewSummary()?.expenses || 0;
  }

  invoiceCount() {
    return this.financeSummary()?.invoiceCount || 0;
  }

  outstandingReceivables() {
    return this.financeSummary()?.outstandingReceivables || 0;
  }

  outstandingPayables() {
    return this.financeSummary()?.outstandingPayables || 0;
  }

  income() {
    return this.overviewSummary()?.income || 0;
  }

  totalCustomers() {
    return this.overviewSummary()?.totalCustomers || 0;
  }

  totalSuppliers() {
    return this.overviewSummary()?.totalSuppliers || 0;
  }

  stockValue() {
    return this.overviewSummary()?.stockValue || 0;
  }

  stockQty() {
    return this.overviewSummary()?.totalStockQuantity || 0;
  }

  netProfitSeverity(): 'success' | 'danger' | 'warning' {
    const value = this.netProfit();
    if (value > 0) return 'success';
    if (value < 0) return 'danger';
    return 'warning';
  }
}


// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { forkJoin } from 'rxjs';

// // PrimeNG Modules
// import { ButtonModule } from 'primeng/button';
// import { ChartModule } from 'primeng/chart';
// import { TableModule } from 'primeng/table';
// import { SkeletonModule } from 'primeng/skeleton';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';

// // Services
// import { CommonMethodService } from '../../../../core/utils/common-method.service'; // <--- Using your service
// import { AdminAnalyticsService } from '../../../../core/services/admin-analytics.service';
// import { NotificationCalendarComponent } from "../notification-calendar/notification-calendar";

// @Component({
//   selector: 'app-admin-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ButtonModule,
//     ChartModule,
//     TableModule,
//     SkeletonModule,
//     TagModule,
//     TooltipModule,
//     // NotificationCalendarComponent
// ],
//   templateUrl: './admin-dashboard.component.html',
//   styleUrl: './admin-dashboard.component.scss'
// })
// export class AdminDashboardComponent implements OnInit {
//   private analyticsService = inject(AdminAnalyticsService);
  
//   // Inject as PUBLIC so HTML can use 'common.formatCurrency' and 'common.mapStatusToSeverity'
//   public common = inject(CommonMethodService); 

//   // Signals
//   loading = signal(true);
//   summaryData = signal<any>(null);
//   topProducts = signal<any[]>([]);
//   receivables = signal<any[]>([]);
  
//   // Chart Config
//   chartData = signal<any>(null);
//   chartOptions = signal<any>(null);

//   ngOnInit() {
//     this.loadDashboard();
//   }

//   loadDashboard() {
//     this.loading.set(true);

//     forkJoin({
//       overview: this.analyticsService.getDashboardOverview(),
//       trends: this.analyticsService.getMonthlyTrends(6),
//       outstanding: this.analyticsService.getOutstanding('receivable', 5)
//     }).subscribe({
//       next: (res: any) => {
//         if (res.overview?.status === 'success') {
//           this.summaryData.set(res.overview.data.summary);
//           this.topProducts.set(res.overview.data.topProducts);
//         }

//         if (res.trends?.status === 'success') {
//           this.initChart(res.trends.data.series);
//         }

//         if (res.outstanding?.status === 'success') {
//           this.receivables.set(res.outstanding.data.list);
//         }

//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading.set(false);
//       }
//     });
//   }

// /**
//    * Initializes the Chart with Theme-Aware Colors & Fallbacks
//    */
//   initChart(series: any[]) {
//     const documentStyle = getComputedStyle(document.documentElement);
    
//     // 1. Safe Property Fetching with Fallbacks
//     // If the CSS var is missing, it defaults to a standard gray or teal to prevent crashing
//     const textColor = documentStyle.getPropertyValue('--text-secondary').trim() || '#64748b';
//     const surfaceBorder = documentStyle.getPropertyValue('--border-secondary').trim() || '#e2e8f0';
    
//     // CRITICAL FIX: Default to Teal (#0d9488) if var is empty
//     let accentPrimary = documentStyle.getPropertyValue('--accent-primary').trim();
//     if (!accentPrimary) accentPrimary = '#0d9488'; 

//     const validSeries = series.filter(item => typeof item.month === 'string');
//     const labels = validSeries.map(i => i.month);
//     const sales = validSeries.map(i => i.sales);

//     this.chartData.set({
//       labels: labels,
//       datasets: [
//         {
//           label: 'Revenue',
//           data: sales,
//           fill: true,
//           borderColor: accentPrimary, 
//           backgroundColor: (context: any) => {
//             const ctx = context.chart.ctx;
//             const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            
//             // 2. Use the safe helper (no more crashing)
//             gradient.addColorStop(0, this.hexToRgba(accentPrimary, 0.2));
//             gradient.addColorStop(1, this.hexToRgba(accentPrimary, 0.0));
//             return gradient;
//           },
//           tension: 0.4,
//           pointBackgroundColor: '#ffffff',
//           pointBorderColor: accentPrimary,
//           pointBorderWidth: 2
//         }
//       ]
//     });

//     this.chartOptions.set({
//       maintainAspectRatio: false,
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: '#ffffff', // Hardcoded fallback for safety
//           titleColor: '#1e293b',
//           bodyColor: textColor,
//           borderColor: surfaceBorder,
//           borderWidth: 1,
//           padding: 10,
//           displayColors: false
//         }
//       },
//       scales: {
//         x: {
//           ticks: { color: textColor, font: { size: 11 } },
//           grid: { color: 'transparent', drawBorder: false }
//         },
//         y: {
//           ticks: { color: textColor, font: { size: 11 } },
//           grid: { color: surfaceBorder, drawBorder: false, borderDash: [5, 5] }
//         }
//       }
//     });
//   }

//   // 3. Updated Helper to handle missing/invalid colors
//   hexToRgba(hex: string, alpha: number) {
//     if (!hex) return `rgba(0, 0, 0, ${alpha})`; // Safety fallback

//     hex = hex.trim();
    
//     // Handle standard Hex (#123456)
//     if (hex.startsWith('#')) {
//       const r = parseInt(hex.substring(1, 3), 16);
//       const g = parseInt(hex.substring(3, 5), 16);
//       const b = parseInt(hex.substring(5, 7), 16);
      
//       if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`;
//       return `rgba(${r}, ${g}, ${b}, ${alpha})`;
//     }
    
//     // If it's already an rgb/rgba string or variable, just return it (simple fallback)
//     return hex;
//   }
// }
