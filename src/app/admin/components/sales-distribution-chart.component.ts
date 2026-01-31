import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// Components
// import { UniversalFilterComponent } from '../../shared/components/universal-filter/universal-filter.component';
// import { FilterField } from '../../shared/models/filter-config.interface';

@Component({
  selector: 'app-sales-distribution-chart',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    ProgressSpinnerModule, 
    ButtonModule,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="distribution-container">

      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'sales-distribution'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <div class="chart-card">

        <div class="card-header">
          <div>
            <h2 class="card-title">
              <i class="pi pi-chart-pie header-icon"></i>
              Sales Distribution 
            </h2>
            <p class="card-subtitle">
              Revenue Share by Category & Segmentation
            </p>
          </div>
          <div class="header-actions">
             <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadDistribution()" [loading]="loading()"></p-button>
          </div>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          <div class="content-grid">
            
            <div class="chart-wrapper">
              <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
              
              <div class="center-content">
                 <span class="center-label">Total Volume</span>
                 <span class="center-value">₹{{ totalRevenue() | number }}</span>
              </div>
            </div>

            <div class="breakdown-panel">
               <h4 class="panel-title">Category Breakdown</h4>
               
               <div class="breakdown-list custom-scrollbar">
                 @for (label of chartData()?.labels; track label; let i = $index) {
                   <div class="breakdown-item group">
                      <div class="item-left">
                        <div class="dot" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
                        <span class="item-name">{{ label }}</span>
                      </div>
                      <div class="item-right">
                         <p class="item-value">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
                         <p class="item-share">
                           {{ (chartData()?.datasets[0].data[i] / (totalRevenue() || 1) * 100) | number:'1.0-1' }}% Share
                         </p>
                      </div>
                   </div>
                 }
               </div>
            </div>
          </div>
        </ng-container>

        <ng-template #loader>
          <div class="loader-container">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p class="loader-text">Slicing Sales Data...</p>
          </div>
        </ng-template>

      </div>

      <div class="insight-box">
         <div class="insight-icon-box">
           <i class="pi pi-chart-pie"></i>
         </div>
         <p class="insight-text">
           The <span class="highlight">{{ chartData()?.labels?.[0] || 'Top' }}</span> segment represents the majority of your current cycle revenue. 
           Consider enriching customer profiles to move these transactions into identified categories.
         </p>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .distribution-container {
      position: relative;
      width: 100%;
      padding: var(--spacing-sm);
      overflow: hidden;
      border-radius: var(--ui-border-radius-xl);
    }
    
    .filter-section {
      margin-bottom: var(--spacing-md);
      position: relative; 
      z-index: 2;
    }

    /* AMBIENT BLOBS */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 0;
      opacity: 0.1;
      pointer-events: none;
    }
    .blob-1 {
      top: -50%; right: -10%; width: 400px; height: 400px;
      background: var(--accent-primary);
      animation: pulse-slow 8s infinite;
    }
    .blob-2 {
      bottom: -20%; left: -10%; width: 300px; height: 300px;
      background: var(--color-info); /* Cyan/Blue */
      animation: pulse-slow 8s infinite 1s;
    }

    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 0.1; }
      50% { transform: scale(1.1); opacity: 0.15; }
    }

    /* MAIN CARD */
    .chart-card {
      position: relative;
      z-index: 1;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl);
      box-shadow: var(--shadow-sm);
      backdrop-filter: blur(10px);
    }

    /* HEADER */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--spacing-xl);
    }

    .card-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      letter-spacing: -0.01em;
    }

    .header-icon { color: var(--accent-primary); }

    .card-subtitle {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
      margin: 4px 0 0 0;
    }

    .header-actions { display: flex; gap: var(--spacing-sm); }

    /* CONTENT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-2xl);
      align-items: center;
    }
    @media (min-width: 768px) {
      .content-grid { grid-template-columns: 7fr 5fr; } /* Chart 7/12, Breakdown 5/12 */
    }

    /* CHART WRAPPER */
    .chart-wrapper {
      position: relative;
      height: 320px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .center-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .center-label {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
    }

    .center-value {
      font-size: var(--font-size-3xl);
      font-weight: 900;
      color: var(--text-primary);
      letter-spacing: -0.02em;
      line-height: 1;
    }

    /* BREAKDOWN PANEL */
    .breakdown-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
    }

    .panel-title {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--text-label);
      margin-bottom: var(--spacing-md);
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      max-height: 300px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
      background: var(--bg-ternary);
      transition: background 0.2s;
    }
    .breakdown-item:hover { background: var(--component-bg-hover); }

    .item-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    
    .dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.1); }
    
    .item-name {
      font-size: var(--font-size-xs);
      font-weight: bold;
      color: var(--text-secondary);
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.2s;
    }
    .breakdown-item:hover .item-name { color: var(--text-primary); }

    .item-right { text-align: right; }
    
    .item-value {
      font-size: var(--font-size-xs);
      font-weight: bold;
      color: var(--text-primary);
      margin: 0;
      font-variant-numeric: tabular-nums;
    }

    .item-share {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--accent-primary);
      opacity: 0.8;
      margin: 0;
    }

    /* INSIGHT BOX */
    .insight-box {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius-lg);
      border: 1px dashed var(--accent-secondary);
      background: var(--accent-focus); /* Low opacity accent bg */
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      position: relative;
      z-index: 10;
    }

    .insight-icon-box {
      padding: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .insight-text {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
    .highlight { font-weight: bold; color: var(--text-primary); }

    /* LOADER */
    .loader-container {
      height: 320px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-xs);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary);
    }

    /* SCROLLBAR UTILS */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
  `]
})
export class SalesDistributionChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(false); // Start false, filters handle loading
  chartOptions: any;

  // Stored Filters
  private currentFilters: any = {};

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches', // Connects to MasterListService
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Sales'
    },
    {
      key: 'date',
      label: 'Analysis Period',
      type: 'date-range'
    }
  ];

  private documentStyle = getComputedStyle(document.documentElement);

  totalRevenue = computed(() => {
    const data = this.chartData();
    if (!data) return 0;
    return data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
  });

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.initOptions(); 
    // loadDistribution triggered via filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadDistribution();
  }

  private initOptions() {
    // Read theme colors
    const tooltipBg = this.documentStyle.getPropertyValue('--bg-ternary').trim();
    const tooltipText = this.documentStyle.getPropertyValue('--text-primary').trim();
    const borderColor = this.documentStyle.getPropertyValue('--border-primary').trim();

    this.chartOptions = {
      cutout: '75%',
      plugins: {
        legend: { display: false }, 
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: tooltipText,
          bodyColor: this.documentStyle.getPropertyValue('--text-secondary').trim(),
          borderColor: borderColor,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          bodyFont: { size: 12, weight: 'bold' },
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.raw;
              const total = context.chart._metasets[context.datasetIndex].total;
              const percentage = ((value / total) * 100).toFixed(1) + '%';
              return ` ${label}: ₹${value.toLocaleString()} (${percentage})`;
            }
          }
        }
      },
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1000,
        easing: 'easeOutQuart'
      },
      layout: { padding: 20 },
      elements: {
        arc: {
          borderWidth: 0, 
          hoverOffset: 15
        }
      }
    };
  }

  loadDistribution() {
    this.loading.set(true);
    this.documentStyle = getComputedStyle(document.documentElement);
    this.initOptions();

    const params = {
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate,
      branchId: this.currentFilters.branchId
    };

    setTimeout(() => {
        this.analyticsService.getSalesDistribution(
          params.startDate,
          params.endDate,
          params.branchId
        ).subscribe({
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

  private processData(data: any) {
    // The data provided in the response already has `labels` and `datasets` structure required for Chart.js
    // We just need to map it directly.
    this.chartData.set(data);
  }
}

// import { Component, OnInit, signal, computed, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// // Components
// // import { UniversalFilterComponent } from '../../shared/components/universal-filter/universal-filter.component';
// // import { FilterField } from '../../shared/models/filter-config.interface';

// @Component({
//   selector: 'app-sales-distribution-chart',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ChartModule, 
//     ProgressSpinnerModule, 
//     ButtonModule,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="distribution-container">

//       <div class="blob blob-1"></div>
//       <div class="blob blob-2"></div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'sales-distribution'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <div class="chart-card">

//         <div class="card-header">
//           <div>
//             <h2 class="card-title">
//               <i class="pi pi-chart-pie header-icon"></i>
//               Sales Distribution 
//             </h2>
//             <p class="card-subtitle">
//               Revenue Share by Category & Segmentation
//             </p>
//           </div>
//           <div class="header-actions">
//              <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadDistribution()" [loading]="loading()"></p-button>
//           </div>
//         </div>

//         <ng-container *ngIf="!loading(); else loader">
//           <div class="content-grid">
            
//             <div class="chart-wrapper">
//               <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
              
//               <div class="center-content">
//                  <span class="center-label">Total Volume</span>
//                  <span class="center-value">₹{{ totalRevenue() | number }}</span>
//               </div>
//             </div>

//             <div class="breakdown-panel">
//                <h4 class="panel-title">Category Breakdown</h4>
               
//                <div class="breakdown-list custom-scrollbar">
//                  @for (label of chartData()?.labels; track label; let i = $index) {
//                    <div class="breakdown-item group">
//                       <div class="item-left">
//                         <div class="dot" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
//                         <span class="item-name">{{ label }}</span>
//                       </div>
//                       <div class="item-right">
//                          <p class="item-value">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
//                          <p class="item-share">
//                            {{ (chartData()?.datasets[0].data[i] / (totalRevenue() || 1) * 100) | number:'1.0-1' }}% Share
//                          </p>
//                       </div>
//                    </div>
//                  }
//                </div>
//             </div>
//           </div>
//         </ng-container>

//         <ng-template #loader>
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="loader-text">Slicing Sales Data...</p>
//           </div>
//         </ng-template>

//       </div>

//       <div class="insight-box">
//          <div class="insight-icon-box">
//            <i class="pi pi-chart-pie"></i>
//          </div>
//          <p class="insight-text">
//            The <span class="highlight">{{ chartData()?.labels?.[0] || 'Top' }}</span> segment represents the majority of your current cycle revenue. 
//            Consider enriching customer profiles to move these transactions into identified categories.
//          </p>
//       </div>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }

//     .distribution-container {
//       position: relative;
//       width: 100%;
//       padding: var(--spacing-sm);
//       overflow: hidden;
//       border-radius: var(--ui-border-radius-xl);
//     }
    
//     .filter-section {
//       margin-bottom: var(--spacing-md);
//       position: relative; 
//       z-index: 2;
//     }

//     /* AMBIENT BLOBS */
//     .blob {
//       position: absolute;
//       border-radius: 50%;
//       filter: blur(80px);
//       z-index: 0;
//       opacity: 0.1;
//       pointer-events: none;
//     }
//     .blob-1 {
//       top: -50%; right: -10%; width: 400px; height: 400px;
//       background: var(--accent-primary);
//       animation: pulse-slow 8s infinite;
//     }
//     .blob-2 {
//       bottom: -20%; left: -10%; width: 300px; height: 300px;
//       background: var(--color-info); /* Cyan/Blue */
//       animation: pulse-slow 8s infinite 1s;
//     }

//     @keyframes pulse-slow {
//       0%, 100% { transform: scale(1); opacity: 0.1; }
//       50% { transform: scale(1.1); opacity: 0.15; }
//     }

//     /* MAIN CARD */
//     .chart-card {
//       position: relative;
//       z-index: 1;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-xl);
//       box-shadow: var(--shadow-sm);
//       backdrop-filter: blur(10px);
//     }

//     /* HEADER */
//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-xl);
//     }

//     .card-title {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       letter-spacing: -0.01em;
//     }

//     .header-icon { color: var(--accent-primary); }

//     .card-subtitle {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin: 4px 0 0 0;
//     }

//     .header-actions { display: flex; gap: var(--spacing-sm); }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-2xl);
//       align-items: center;
//     }
//     @media (min-width: 768px) {
//       .content-grid { grid-template-columns: 7fr 5fr; } /* Chart 7/12, Breakdown 5/12 */
//     }

//     /* CHART WRAPPER */
//     .chart-wrapper {
//       position: relative;
//       height: 320px;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//     }

//     .center-content {
//       position: absolute;
//       inset: 0;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       pointer-events: none;
//     }

//     .center-label {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }

//     .center-value {
//       font-size: var(--font-size-3xl);
//       font-weight: 900;
//       color: var(--text-primary);
//       letter-spacing: -0.02em;
//       line-height: 1;
//     }

//     /* BREAKDOWN PANEL */
//     .breakdown-panel {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       height: 100%;
//     }

//     .panel-title {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin-bottom: var(--spacing-md);
//     }

//     .breakdown-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//       max-height: 300px;
//       overflow-y: auto;
//       padding-right: 4px;
//     }

//     .breakdown-item {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: 1px solid var(--border-secondary);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//     }
//     .breakdown-item:hover { background: var(--component-bg-hover); }

//     .item-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    
//     .dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.1); }
    
//     .item-name {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-secondary);
//       max-width: 100px;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       transition: color 0.2s;
//     }
//     .breakdown-item:hover .item-name { color: var(--text-primary); }

//     .item-right { text-align: right; }
    
//     .item-value {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-primary);
//       margin: 0;
//       font-variant-numeric: tabular-nums;
//     }

//     .item-share {
//       font-size: 9px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--accent-primary);
//       opacity: 0.8;
//       margin: 0;
//     }

//     /* INSIGHT BOX */
//     .insight-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius-lg);
//       border: 1px dashed var(--accent-secondary);
//       background: var(--accent-focus); /* Low opacity accent bg */
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       position: relative;
//       z-index: 10;
//     }

//     .insight-icon-box {
//       padding: 8px;
//       border-radius: 50%;
//       background: rgba(255,255,255,0.2);
//       color: var(--accent-primary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .highlight { font-weight: bold; color: var(--text-primary); }

//     /* LOADER */
//     .loader-container {
//       height: 320px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//     }

//     /* SCROLLBAR UTILS */
//     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
//   `]
// })
// export class SalesDistributionChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(false); // Start false, filters handle loading
//   chartOptions: any;

//   // Stored Filters
//   private currentFilters: any = {};

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches', // Connects to MasterListService
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Sales'
//     },
//     {
//       key: 'date',
//       label: 'Analysis Period',
//       type: 'date-range'
//     }
//   ];

//   private documentStyle = getComputedStyle(document.documentElement);

//   totalRevenue = computed(() => {
//     const data = this.chartData();
//     if (!data) return 0;
//     return data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
//   });

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.initOptions(); 
//     // loadDistribution triggered via filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadDistribution();
//   }

//   private initOptions() {
//     // Read theme colors
//     const tooltipBg = this.documentStyle.getPropertyValue('--bg-ternary').trim();
//     const tooltipText = this.documentStyle.getPropertyValue('--text-primary').trim();
//     const borderColor = this.documentStyle.getPropertyValue('--border-primary').trim();

//     this.chartOptions = {
//       cutout: '75%',
//       plugins: {
//         legend: { display: false }, 
//         tooltip: {
//           backgroundColor: tooltipBg,
//           titleColor: tooltipText,
//           bodyColor: this.documentStyle.getPropertyValue('--text-secondary').trim(),
//           borderColor: borderColor,
//           borderWidth: 1,
//           padding: 12,
//           cornerRadius: 8,
//           bodyFont: { size: 12, weight: 'bold' },
//           displayColors: true,
//           callbacks: {
//             label: (context: any) => {
//               const label = context.label || '';
//               const value = context.raw;
//               const total = context.chart._metasets[context.datasetIndex].total;
//               const percentage = ((value / total) * 100).toFixed(1) + '%';
//               return ` ${label}: ₹${value.toLocaleString()} (${percentage})`;
//             }
//           }
//         }
//       },
//       maintainAspectRatio: false,
//       animation: {
//         animateScale: true,
//         animateRotate: true,
//         duration: 1000,
//         easing: 'easeOutQuart'
//       },
//       layout: { padding: 20 },
//       elements: {
//         arc: {
//           borderWidth: 0, 
//           hoverOffset: 15
//         }
//       }
//     };
//   }

//   loadDistribution() {
//     this.loading.set(true);
//     this.documentStyle = getComputedStyle(document.documentElement);
//     this.initOptions();

//     const params = {
//       startDate: this.currentFilters.startDate,
//       endDate: this.currentFilters.endDate,
//       branchId: this.currentFilters.branchId
//     };

//     setTimeout(() => {
//         this.analyticsService.getSalesDistribution(
//           params.startDate,
//           params.endDate,
//           params.branchId
//         ).subscribe({
//         next: (res) => {
//             if (res.status === 'success') {
//                 this.processData(res.data);
//             }
//             this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//         });
//     }, 600);
//   }

//   private processData(data: any) {
//     const colors = [
//         this.documentStyle.getPropertyValue('--accent-primary').trim(), // Indigo
//         this.documentStyle.getPropertyValue('--color-success').trim(), // Emerald
//         this.documentStyle.getPropertyValue('--color-warning').trim(), // Amber
//         this.documentStyle.getPropertyValue('--color-error').trim(),   // Rose/Pink
//         this.documentStyle.getPropertyValue('--color-info').trim(),    // Cyan
//         '#8b5cf6'  // Violet (Static fallback)
//     ];

//     this.chartData.set({
//         labels: data.labels,
//         datasets: [{
//             data: data.datasets[0].data,
//             backgroundColor: colors,
//             hoverBackgroundColor: colors,
//             borderWidth: 0
//         }]
//     });
//   }
// }

// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-sales-distribution-chart',
//   standalone: true,
//   imports: [CommonModule, ChartModule, ProgressSpinnerModule, ButtonModule],
//   template: `
//     <div class="distribution-container">

//       <div class="blob blob-1"></div>
//       <div class="blob blob-2"></div>

//       <div class="chart-card">

//         <div class="card-header">
//           <div>
//             <h2 class="card-title">
//               <i class="pi pi-chart-pie header-icon"></i>
//               Sales Distribution 
//             </h2>
//             <p class="card-subtitle">
//               Revenue Share by Category & Segmentation
//             </p>
//           </div>
//           <div class="header-actions">
//              <p-button icon="pi pi-filter" [text]="true" [rounded]="true" severity="secondary" size="small"></p-button>
//              <p-button icon="pi pi-refresh" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadDistribution()" [loading]="loading()"></p-button>
//           </div>
//         </div>

//         <ng-container *ngIf="!loading(); else loader">
//           <div class="content-grid">
            
//             <div class="chart-wrapper">
//               <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
              
//               <div class="center-content">
//                  <span class="center-label">Total Volume</span>
//                  <span class="center-value">₹{{ totalRevenue() | number }}</span>
//               </div>
//             </div>

//             <div class="breakdown-panel">
//                <h4 class="panel-title">Category Breakdown</h4>
               
//                <div class="breakdown-list custom-scrollbar">
//                  @for (label of chartData()?.labels; track label; let i = $index) {
//                    <div class="breakdown-item group">
//                       <div class="item-left">
//                         <div class="dot" [style.background]="chartData()?.datasets[0].backgroundColor[i]"></div>
//                         <span class="item-name">{{ label }}</span>
//                       </div>
//                       <div class="item-right">
//                          <p class="item-value">₹{{ chartData()?.datasets[0].data[i] | number }}</p>
//                          <p class="item-share">
//                            {{ (chartData()?.datasets[0].data[i] / (totalRevenue() || 1) * 100) | number:'1.0-1' }}% Share
//                          </p>
//                       </div>
//                    </div>
//                  }
//                </div>
//             </div>
//           </div>
//         </ng-container>

//         <ng-template #loader>
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="loader-text">Slicing Sales Data...</p>
//           </div>
//         </ng-template>

//       </div>

//       <div class="insight-box">
//          <div class="insight-icon-box">
//            <i class="pi pi-chart-pie"></i>
//          </div>
//          <p class="insight-text">
//            The <span class="highlight">{{ chartData()?.labels[0] }}</span> segment represents the majority of your current cycle revenue. 
//            Consider enriching customer profiles to move these transactions into identified categories.
//          </p>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .distribution-container {
//       position: relative;
//       width: 100%;
//       padding: var(--spacing-sm);
//       overflow: hidden;
//       border-radius: var(--ui-border-radius-xl);
//     }

//     /* AMBIENT BLOBS */
//     .blob {
//       position: absolute;
//       border-radius: 50%;
//       filter: blur(80px);
//       z-index: 0;
//       opacity: 0.1;
//       pointer-events: none;
//     }
//     .blob-1 {
//       top: -50%; right: -10%; width: 400px; height: 400px;
//       background: var(--accent-primary);
//       animation: pulse-slow 8s infinite;
//     }
//     .blob-2 {
//       bottom: -20%; left: -10%; width: 300px; height: 300px;
//       background: var(--color-info); /* Cyan/Blue */
//       animation: pulse-slow 8s infinite 1s;
//     }

//     @keyframes pulse-slow {
//       0%, 100% { transform: scale(1); opacity: 0.1; }
//       50% { transform: scale(1.1); opacity: 0.15; }
//     }

//     /* MAIN CARD */
//     .chart-card {
//       position: relative;
//       z-index: 1;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-xl);
//       box-shadow: var(--shadow-sm);
//       backdrop-filter: blur(10px);
//     }

//     /* HEADER */
//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-xl);
//     }

//     .card-title {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       letter-spacing: -0.01em;
//     }

//     .header-icon { color: var(--accent-primary); }

//     .card-subtitle {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//       margin: 4px 0 0 0;
//     }

//     .header-actions { display: flex; gap: var(--spacing-sm); }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-2xl);
//       align-items: center;
//     }
//     @media (min-width: 768px) {
//       .content-grid { grid-template-columns: 7fr 5fr; } /* Chart 7/12, Breakdown 5/12 */
//     }

//     /* CHART WRAPPER */
//     .chart-wrapper {
//       position: relative;
//       height: 320px;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//     }

//     .center-content {
//       position: absolute;
//       inset: 0;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       pointer-events: none;
//     }

//     .center-label {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }

//     .center-value {
//       font-size: var(--font-size-3xl);
//       font-weight: 900;
//       color: var(--text-primary);
//       letter-spacing: -0.02em;
//       line-height: 1;
//     }

//     /* BREAKDOWN PANEL */
//     .breakdown-panel {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       height: 100%;
//     }

//     .panel-title {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin-bottom: var(--spacing-md);
//     }

//     .breakdown-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//       max-height: 300px;
//       overflow-y: auto;
//       padding-right: 4px;
//     }

//     .breakdown-item {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: 1px solid var(--border-secondary);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//     }
//     .breakdown-item:hover { background: var(--component-bg-hover); }

//     .item-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    
//     .dot { width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.1); }
    
//     .item-name {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-secondary);
//       max-width: 100px;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       transition: color 0.2s;
//     }
//     .breakdown-item:hover .item-name { color: var(--text-primary); }

//     .item-right { text-align: right; }
    
//     .item-value {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--text-primary);
//       margin: 0;
//       font-variant-numeric: tabular-nums;
//     }

//     .item-share {
//       font-size: 9px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--accent-primary);
//       opacity: 0.8;
//       margin: 0;
//     }

//     /* INSIGHT BOX */
//     .insight-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius-lg);
//       border: 1px dashed var(--accent-secondary);
//       background: var(--accent-focus); /* Low opacity accent bg */
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       position: relative;
//       z-index: 10;
//     }

//     .insight-icon-box {
//       padding: 8px;
//       border-radius: 50%;
//       background: rgba(255,255,255,0.2);
//       color: var(--accent-primary);
//       display: flex; align-items: center; justify-content: center;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .highlight { font-weight: bold; color: var(--text-primary); }

//     /* LOADER */
//     .loader-container {
//       height: 320px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-tertiary);
//     }

//     /* SCROLLBAR UTILS */
//     .custom-scrollbar::-webkit-scrollbar { width: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
//   `]
// })
// export class SalesDistributionChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   // Cache document style for theme variable reading
//   private documentStyle = getComputedStyle(document.documentElement);

//   // Computed Total Revenue
//   totalRevenue = computed(() => {
//     const data = this.chartData();
//     if (!data) return 0;
//     return data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
//   });

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.initOptions(); // Init first for colors
//     this.loadDistribution();
//   }

//   private initOptions() {
//     // Read theme colors
//     const tooltipBg = this.documentStyle.getPropertyValue('--bg-ternary').trim();
//     const tooltipText = this.documentStyle.getPropertyValue('--text-primary').trim();
//     const borderColor = this.documentStyle.getPropertyValue('--border-primary').trim();

//     this.chartOptions = {
//       cutout: '75%',
//       plugins: {
//         legend: { display: false }, 
//         tooltip: {
//           backgroundColor: tooltipBg,
//           titleColor: tooltipText,
//           bodyColor: this.documentStyle.getPropertyValue('--text-secondary').trim(),
//           borderColor: borderColor,
//           borderWidth: 1,
//           padding: 12,
//           cornerRadius: 8,
//           bodyFont: { size: 12, weight: 'bold' },
//           displayColors: true,
//           callbacks: {
//             label: (context: any) => {
//               const label = context.label || '';
//               const value = context.raw;
//               const total = context.chart._metasets[context.datasetIndex].total;
//               const percentage = ((value / total) * 100).toFixed(1) + '%';
//               return ` ${label}: ₹${value.toLocaleString()} (${percentage})`;
//             }
//           }
//         }
//       },
//       maintainAspectRatio: false,
//       animation: {
//         animateScale: true,
//         animateRotate: true,
//         duration: 1000,
//         easing: 'easeOutQuart'
//       },
//       layout: { padding: 20 },
//       elements: {
//         arc: {
//           borderWidth: 0, 
//           hoverOffset: 15
//         }
//       }
//     };
//   }

//   loadDistribution() {
//     this.loading.set(true);
//     // Refresh theme styles in case of switch
//     this.documentStyle = getComputedStyle(document.documentElement);
//     this.initOptions();

//     setTimeout(() => {
//         this.analyticsService.getSalesDistribution().subscribe({
//         next: (res) => {
//             if (res.status === 'success') {
//                 this.processData(res.data);
//             }
//             this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//         });
//     }, 600);
//   }

//   private processData(data: any) {
//     // Dynamic Theme Colors
//     const colors = [
//         this.documentStyle.getPropertyValue('--accent-primary').trim(), // Indigo
//         this.documentStyle.getPropertyValue('--color-success').trim(), // Emerald
//         this.documentStyle.getPropertyValue('--color-warning').trim(), // Amber
//         this.documentStyle.getPropertyValue('--color-error').trim(),   // Rose/Pink
//         this.documentStyle.getPropertyValue('--color-info').trim(),    // Cyan
//         '#8b5cf6'  // Violet (Static fallback for 6th item)
//     ];

//     this.chartData.set({
//         labels: data.labels,
//         datasets: [{
//             data: data.datasets[0].data,
//             backgroundColor: colors,
//             hoverBackgroundColor: colors,
//             borderWidth: 0
//         }]
//     });
//   }
// }
