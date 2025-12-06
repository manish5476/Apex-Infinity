import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DatePicker } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';

// Services
import { CommonMethodService } from '../../../../core/utils/common-method.service';
import { AdminAnalyticsService } from '../../../../core/services/admin-analytics.service';

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
    TooltipModule,
    SelectButtonModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  public common = inject(CommonMethodService);

  // --- State Signals ---
  loading = signal(true);
  
  // Data Buckets
  dashboardData = signal<any>(null); // KPIs, Leaders, Main Chart
  financeData = signal<any>(null);   // Payment Modes
  taxData = signal<any>(null);       // Input/Output Tax
  inventoryData = signal<any>(null); // Valuation, Low Stock
  productData = signal<any>(null);   // Margins, Dead Stock
  customerData = signal<any>(null);  // Risks

  // Charts
  revenueChartData = signal<any>(null);
  revenueChartOptions = signal<any>(null);
  
  paymentChartData = signal<any>(null);
  paymentChartOptions = signal<any>(null);

  // Date Filters
  dateRange: Date[] | null = null;
  activePreset = signal<'all' | 'month'>('all');

  ngOnInit() {
    this.loadAllData();
  }

  // --- Data Loading ---
  loadAllData(start?: string, end?: string) {
    this.loading.set(true);

    forkJoin({
      dashboard: this.analyticsService.getDashboardOverview(start, end),
      financials: this.analyticsService.getFinancialReport(start, end),
      tax: this.analyticsService.getTaxReport(start, end),
      inventory: this.analyticsService.getInventoryReport(),
      // products: this.analyticsService.getProductPerformance(start, end),
      // customers: this.analyticsService.getCustomerInsights()
    }).subscribe({
      next: (res: any) => {
        if(res.dashboard?.status === 'success') {
          this.dashboardData.set(res.dashboard.data);
          this.initRevenueChart(res.dashboard.data.charts?.timeline || []);
        }
        if(res.financials?.status === 'success') {
          this.financeData.set(res.financials.data);
          this.initPaymentChart(res.financials.data.paymentModes || []);
        }
        if(res.tax?.status === 'success') this.taxData.set(res.tax.data);
        if(res.inventory?.status === 'success') this.inventoryData.set(res.inventory.data);
        if(res.products?.status === 'success') this.productData.set(res.products.data);
        if(res.customers?.status === 'success') this.customerData.set(res.customers.data);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Dashboard Load Error', err);
        this.loading.set(false);
      }
    });
  }

  // --- Chart Initialization ---

  initRevenueChart(timeline: any[]) {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = '#64748b';
    const textColorSecondary = '#94a3b8';
    const surfaceBorder = '#f1f5f9';
    
    // Gradient Setup happens in the canvas context, but here we define colors
    const accentColor = '#6366f1'; // Indigo 500
    const profitColor = '#10b981'; // Emerald 500

    this.revenueChartData.set({
      labels: timeline.map(t => t.date),
      datasets: [
        {
          label: 'Total Revenue',
          data: timeline.map(t => t.income),
          fill: true,
          borderColor: accentColor,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)'); // Indigo with opacity
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
            return gradient;
          },
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: accentColor,
          pointBorderWidth: 2
        },
        {
          label: 'Net Profit',
          data: timeline.map(t => t.profit),
          fill: false,
          borderColor: profitColor,
          borderDash: [5, 5],
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4
        }
      ]
    });

    this.revenueChartOptions.set({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, usePointStyle: true, font: { family: "'Inter', sans-serif", size: 12 } }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          bodyColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary, font: { size: 11 } },
          grid: { display: false, drawBorder: false }
        },
        y: {
          ticks: { color: textColorSecondary, callback: (val: any) => this.formatK(val) },
          grid: { color: surfaceBorder, borderDash: [4, 4], drawBorder: false },
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'index',
        intersect: false,
      }
    });
  }

  initPaymentChart(modes: any[]) {
    this.paymentChartData.set({
      labels: modes.map(m => m.name.toUpperCase()),
      datasets: [{
        data: modes.map(m => m.value),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        hoverBackgroundColor: ['#2563eb', '#059669', '#d97706', '#dc2626'],
        borderWidth: 0
      }]
    });

    this.paymentChartOptions.set({
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 11 } } }
      }
    });
  }

  // --- Filter Logic ---
  applyPreset(type: 'all' | 'month') {
    this.activePreset.set(type);
    this.dateRange = null;
    const now = new Date();
    
    if (type === 'all') {
      this.loadAllData();
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = now.toISOString();
      this.loadAllData(start, end);
    }
  }

  onDateSelect() {
    if (this.dateRange && this.dateRange[1]) {
      this.activePreset.set('all'); // Clear preset visuals
      this.loadAllData(this.dateRange[0].toISOString(), this.dateRange[1].toISOString());
    }
  }

  // --- Helpers ---
  get kpi() { return this.dashboardData()?.kpi || {}; }
  get stockVal() { return this.inventoryData()?.inventoryValuation || {}; }

  // Simple formatter for chart Y-axis (e.g., 1200 -> 1.2k)
  formatK(value: number) {
    if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
    return value;
  }
}
