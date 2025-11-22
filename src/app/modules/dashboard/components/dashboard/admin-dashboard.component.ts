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
import { CommonMethodService } from '../../../../core/utils/common-method.service'; // <--- Using your service
import { AdminAnalyticsService } from '../../../../core/services/admin-analytics.service';
import { NotificationCalendarComponent } from "../notification-calendar/notification-calendar";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ChartModule,
    TableModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    NotificationCalendarComponent
],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  
  // Inject as PUBLIC so HTML can use 'common.formatCurrency' and 'common.mapStatusToSeverity'
  public common = inject(CommonMethodService); 

  // Signals
  loading = signal(true);
  summaryData = signal<any>(null);
  topProducts = signal<any[]>([]);
  receivables = signal<any[]>([]);
  
  // Chart Config
  chartData = signal<any>(null);
  chartOptions = signal<any>(null);

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);

    forkJoin({
      overview: this.analyticsService.getDashboardOverview(),
      trends: this.analyticsService.getMonthlyTrends(6),
      outstanding: this.analyticsService.getOutstanding('receivable', 5)
    }).subscribe({
      next: (res: any) => {
        if (res.overview?.status === 'success') {
          this.summaryData.set(res.overview.data.summary);
          this.topProducts.set(res.overview.data.topProducts);
        }

        if (res.trends?.status === 'success') {
          this.initChart(res.trends.data.series);
        }

        if (res.outstanding?.status === 'success') {
          this.receivables.set(res.outstanding.data.list);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

/**
   * Initializes the Chart with Theme-Aware Colors & Fallbacks
   */
  initChart(series: any[]) {
    const documentStyle = getComputedStyle(document.documentElement);
    
    // 1. Safe Property Fetching with Fallbacks
    // If the CSS var is missing, it defaults to a standard gray or teal to prevent crashing
    const textColor = documentStyle.getPropertyValue('--text-secondary').trim() || '#64748b';
    const surfaceBorder = documentStyle.getPropertyValue('--border-secondary').trim() || '#e2e8f0';
    
    // CRITICAL FIX: Default to Teal (#0d9488) if var is empty
    let accentPrimary = documentStyle.getPropertyValue('--accent-primary').trim();
    if (!accentPrimary) accentPrimary = '#0d9488'; 

    const validSeries = series.filter(item => typeof item.month === 'string');
    const labels = validSeries.map(i => i.month);
    const sales = validSeries.map(i => i.sales);

    this.chartData.set({
      labels: labels,
      datasets: [
        {
          label: 'Revenue',
          data: sales,
          fill: true,
          borderColor: accentPrimary, 
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            
            // 2. Use the safe helper (no more crashing)
            gradient.addColorStop(0, this.hexToRgba(accentPrimary, 0.2));
            gradient.addColorStop(1, this.hexToRgba(accentPrimary, 0.0));
            return gradient;
          },
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: accentPrimary,
          pointBorderWidth: 2
        }
      ]
    });

    this.chartOptions.set({
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff', // Hardcoded fallback for safety
          titleColor: '#1e293b',
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: 'transparent', drawBorder: false }
        },
        y: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { color: surfaceBorder, drawBorder: false, borderDash: [5, 5] }
        }
      }
    });
  }

  // 3. Updated Helper to handle missing/invalid colors
  hexToRgba(hex: string, alpha: number) {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`; // Safety fallback

    hex = hex.trim();
    
    // Handle standard Hex (#123456)
    if (hex.startsWith('#')) {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      
      if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0, 0, 0, ${alpha})`;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // If it's already an rgb/rgba string or variable, just return it (simple fallback)
    return hex;
  }
}
