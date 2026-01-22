import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';

@Component({
  selector: 'app-financial-trend-chart',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    ButtonModule, 
    TooltipModule
  ],
  template: `
    <div class="trend-container">

      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="chart-card">
        
        <div class="card-header">
          <div class="header-content">
            <div class="title-row">
              <div class="icon-box">
                <i class="pi pi-chart-bar"></i>
              </div>
              <h2 class="card-title">Financial Performance</h2>
            </div>
            <p class="card-subtitle">
              Revenue Composition & Profitability Trends
            </p>
          </div>
          
          <div class="header-actions">
            <p-button 
              icon="pi pi-refresh" 
              [rounded]="true" 
              [text]="true" 
              [loading]="loading()" 
              severity="secondary" 
              pTooltip="Refresh Data"
              tooltipPosition="left"
              (onClick)="refreshData()">
            </p-button>
          </div>
        </div>

        <div class="chart-wrapper">
          
          <div *ngIf="loading()" class="chart-loader">
            <i class="pi pi-spin pi-spinner loader-icon"></i>
            <span class="loader-text">Syncing Financials...</span>
          </div>

          <p-chart type="bar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
        </div>

        <div class="legend-container">
           <div class="legend-item primary">
             <div class="legend-icon-box">
               <i class="pi pi-chart-line"></i>
             </div>
             <div class="legend-text">
               <span class="legend-label">Total Income</span>
               <span class="legend-sub">Trend Line</span>
             </div>
           </div>

           <div class="legend-item success">
             <div class="legend-dot"></div>
             <span class="legend-label">Net Profit</span>
           </div>

           <div class="legend-item error">
             <div class="legend-dot"></div>
             <span class="legend-label">Expenses</span>
           </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .trend-container {
      position: relative;
      width: 100%;
      padding: var(--spacing-sm);
      overflow: hidden;
      border-radius: var(--ui-border-radius-xl);
    }

    /* AMBIENT BLOBS */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.15; /* Subtle in light mode, effective in dark */
      pointer-events: none;
    }
    .blob-1 {
      top: -20%; left: -10%; width: 400px; height: 400px;
      background: var(--accent-primary);
      animation: pulse-slow 8s infinite;
    }
    .blob-2 {
      bottom: -20%; right: -10%; width: 300px; height: 300px;
      background: var(--color-success);
      animation: pulse-slow 8s infinite 1s;
    }

    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 0.1; }
      50% { transform: scale(1.1); opacity: 0.2; }
    }

    /* CARD STYLE */
    .chart-card {
      position: relative;
      z-index: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      /* Glassmorphism hook */
      backdrop-filter: blur(10px); 
    }

    /* HEADER */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .title-row { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: 4px; }

    .icon-box {
      padding: 6px;
      border-radius: var(--ui-border-radius);
      background: var(--accent-focus);
      color: var(--accent-primary);
      border: 1px solid var(--accent-secondary);
      display: flex; align-items: center; justify-content: center;
    }

    .card-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }

    .card-subtitle {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      padding-left: calc(2rem + var(--spacing-sm)); /* Align with title text */
      margin: 0;
    }

    /* CHART WRAPPER */
    .chart-wrapper {
      position: relative;
      height: 380px;
      width: 100%;
    }

    .chart-loader {
      position: absolute;
      inset: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      opacity: 0.8;
      backdrop-filter: blur(2px);
      border-radius: var(--ui-border-radius);
    }
    .loader-icon { font-size: 2rem; color: var(--accent-primary); margin-bottom: var(--spacing-sm); }
    .loader-text { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-secondary); }

    /* LEGEND */
    .legend-container {
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-primary);
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--spacing-xl);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: 99px;
      border: 1px solid transparent;
      background: var(--bg-ternary);
      transition: background 0.2s;
    }
    .legend-item:hover { background: var(--component-bg-hover); }

    /* Legend Color Variants */
    .legend-item.primary { border-color: var(--accent-secondary); background: var(--accent-focus); }
    .legend-item.primary .legend-label { color: var(--accent-primary); }
    
    .legend-item.success { border-color: var(--color-success-border); background: var(--color-success-bg); }
    .legend-item.success .legend-dot { background: var(--color-success); }
    
    .legend-item.error { border-color: var(--color-error-border); background: var(--color-error-bg); }
    .legend-item.error .legend-dot { background: var(--color-error); }

    .legend-icon-box {
      width: 1.25rem; height: 1.25rem;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: var(--accent-primary);
    }

    .legend-text { display: flex; flex-direction: column; }
    
    .legend-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      line-height: 1;
    }
    
    .legend-sub {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: bold;
      color: var(--text-tertiary);
    }

    .legend-dot {
      width: 0.75rem; height: 0.75rem;
      border-radius: 2px;
    }
  `]
})
export class FinancialTrendChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(true);
  chartOptions: any;

  // Cache document style for variable reading
  private documentStyle = getComputedStyle(document.documentElement);

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.initOptions(); // Init options first to get theme colors
    this.refreshData();
  }

  refreshData() {
    this.loading.set(true);
    // Refresh theme styles in case theme changed
    this.documentStyle = getComputedStyle(document.documentElement);
    this.initOptions(); 

    setTimeout(() => {
      this.analyticsService.getFinancialTrend().subscribe({
        next: (res) => {
          if (res.status === 'success') {
            this.processData(res.data);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }, 600);
  }

  private processData(rawData: any) {
    // 1. Get Theme Colors dynamically
    const primaryColor = this.getCssVar('--accent-primary');
    const successColor = this.getCssVar('--color-success');
    const errorColor = this.getCssVar('--color-error');
    
    // 2. Create Gradient Helper
    const gradientFill = (context: any, colorHex: string) => {
      const ctx = context.chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, this.hexToRgba(colorHex, 0.5));
      gradient.addColorStop(1, this.hexToRgba(colorHex, 0.0));
      return gradient;
    };

    // 3. Construct Datasets
    
    // Total Income (Line)
    const incomeDataset = {
      ...rawData.datasets[0],
      type: 'line',
      label: 'Total Income',
      borderColor: primaryColor,
      backgroundColor: (context: any) => gradientFill(context, primaryColor),
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: primaryColor,
      pointBorderColor: '#fff',
      pointRadius: 4,
      pointHoverRadius: 6,
      order: 0
    };

    // Expenses (Bar)
    const expenseDataset = {
      ...rawData.datasets[1],
      type: 'bar',
      label: 'Expenses',
      backgroundColor: errorColor,
      hoverBackgroundColor: this.hexToRgba(errorColor, 0.8),
      stack: 'combined',
      barPercentage: 0.5,
      borderRadius: { bottomLeft: 4, bottomRight: 4 },
      order: 2
    };

    // Net Profit (Bar)
    const profitDataset = {
      ...rawData.datasets[2],
      type: 'bar',
      label: 'Net Profit',
      backgroundColor: successColor,
      hoverBackgroundColor: this.hexToRgba(successColor, 0.8),
      stack: 'combined',
      barPercentage: 0.5,
      borderRadius: { topLeft: 4, topRight: 4 },
      order: 1
    };

    this.chartData.set({
      labels: rawData.labels,
      datasets: [incomeDataset, profitDataset, expenseDataset]
    });
  }

  private initOptions() {
    const textColor = this.getCssVar('--text-secondary');
    const gridColor = this.getCssVar('--border-primary');
    const toolTipBg = this.getCssVar('--bg-ternary');
    const toolTipText = this.getCssVar('--text-primary');

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      animation: { duration: 1000, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: toolTipBg,
          titleColor: toolTipText,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          boxPadding: 4,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: textColor, font: { size: 11, family: 'var(--font-body)' } },
          grid: { display: false }
        },
        y: {
          stacked: true,
          ticks: {
            color: textColor,
            font: { size: 10 },
            callback: (value: number) => {
              if (value >= 10000000) return (value / 10000000).toFixed(1) + 'Cr';
              if (value >= 100000) return (value / 100000).toFixed(1) + 'L';
              if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
              return value;
            }
          },
          grid: { color: gridColor, drawBorder: false, borderDash: [4, 4] }
        }
      }
    };
  }

  // --- Utilities ---

  private getCssVar(name: string): string {
    return this.documentStyle.getPropertyValue(name).trim() || '#000'; // Fallback to black
  }

  private hexToRgba(hex: string, alpha: number) {
    // Basic hex to rgba converter
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return hex; // Return original if not hex
  }
}
