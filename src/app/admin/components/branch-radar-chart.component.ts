import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';


@Component({
  selector: 'app-branch-radar-chart',
  standalone: true,
  imports: [
    CommonModule, 
    ChartModule, 
    ProgressSpinnerModule, 
    ButtonModule, 
    TooltipModule,
    UniversalFilterComponent 
  ],
  template: `
    <div class="radar-container">

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'branch-radar'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <div class="chart-card">

        <div class="card-header">
          <div>
            <h2 class="card-title">
              <i class="pi pi-compass header-icon"></i>
              Operational Radar 
            </h2>
            <p class="card-subtitle">
              {{ currentBranchName || 'Global Network Efficiency' }}
            </p>
          </div>
          <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadRadar()" [loading]="loading()"></p-button>
        </div>

        <ng-container *ngIf="!loading(); else loader">
          
          <div class="content-grid">
            
            <div class="chart-wrapper">
               <p-chart type="radar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
               
               <div class="center-marker">
                 <i class="pi pi-crosshairs"></i>
               </div>
            </div>

            <div class="metrics-panel">
               <div class="metrics-list custom-scrollbar">
                 <h4 class="section-label">Metric Breakdown</h4>
                 
                 @for (label of chartData()?.labels; track label; let i = $index) {
                   <div class="metric-row group">
                      <span class="metric-name">{{ label }}</span>
                      <span class="metric-score" 
                            [ngClass]="getScoreClass(chartData()?.datasets[0].data[i])">
                        {{ chartData()?.datasets[0].data[i] }}%
                      </span>
                   </div>
                 }
               </div>

               <div class="insight-box">
                 <div class="insight-content">
                   <i class="pi pi-info-circle insight-icon"></i>
                   <div>
                     <p class="insight-title">Efficiency Profile: {{ chartData()?.datasets[0].label }}</p>
                     <p class="insight-text">
                       Current profile shows a <span class="highlight">{{ getDominantMetric(chartData()) }}</span> focus.
                       <br>Optimization suggested for lower scoring quadrants.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

        </ng-container>

        <ng-template #loader>
          <div class="loader-container">
            <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
            <p class="loader-text">Calibrating Performance Matrix...</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    /* HOST & LAYOUT */
    :host { display: block; width: 100%; }

    .radar-container {
      padding: var(--spacing-sm);
      font-family: var(--font-body);
      background: radial-gradient(circle at top right, var(--bg-ternary), transparent 70%);
      border-radius: var(--radius-2xl);
    }

    .filter-section {
      margin-bottom: var(--spacing-md);
      /* Make filter blend in slightly */
      opacity: 0.95;
    }

    /* CARD STYLES */
    .chart-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-xl);
      position: relative;
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow-lg);
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
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
      margin-top: 4px;
    }

    /* CONTENT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-2xl);
    }
    @media (min-width: 768px) {
      .content-grid { grid-template-columns: 2fr 1fr; } /* Chart takes 2/3 */
    }

    /* CHART SECTION */
    .chart-wrapper {
      height: 400px;
      position: relative;
      display: flex;
      justify-content: center;
    }

    .center-marker {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0.1;
      font-size: 4rem;
      color: var(--text-primary);
    }

    /* METRICS PANEL */
    .metrics-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--spacing-lg);
    }

    .section-label {
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-label);
      margin-bottom: var(--spacing-md);
    }

    .metrics-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      max-height: 250px;
      overflow-y: auto;
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md);
      border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-secondary);
      background: var(--bg-ternary);
      transition: background 0.2s;
    }
    .metric-row:hover {
      background: var(--component-bg-hover);
    }

    .metric-name {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      transition: color 0.2s;
    }
    .metric-row:hover .metric-name { color: var(--text-primary); }

    .metric-score {
      font-family: var(--font-mono);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
    }
    /* Dynamic Score Colors handled by ngClass */
    .score-high { color: var(--color-success); }
    .score-mid { color: var(--color-info); }
    .score-low { color: var(--color-error); }

    /* INSIGHT BOX */
    .insight-box {
      margin-top: var(--spacing-md);
      padding: var(--spacing-md);
      border: 1px dashed var(--accent-primary);
      border-radius: var(--ui-border-radius);
      background: var(--color-primary-bg); /* Mix token */
    }

    .insight-content { display: flex; gap: var(--spacing-sm); }
    .insight-icon { color: var(--accent-primary); margin-top: 2px; }

    .insight-title {
      font-weight: var(--font-weight-bold);
      color: var(--accent-primary);
      font-size: var(--font-size-xs);
      margin: 0 0 4px 0;
    }

    .insight-text {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
    .highlight { color: var(--text-primary); font-weight: bold; }

    /* SCROLLBAR */
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-ternary); }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }

    /* LOADER */
    .loader-container {
      height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-tertiary);
    }
  `]
})
export class BranchRadarChartComponent implements OnInit {
  chartData = signal<any>(null);
  loading = signal<boolean>(false);
  chartOptions: any;
  currentBranchName = '';

  private currentFilters: any = {};
  private documentStyle = getComputedStyle(document.documentElement);

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Network Average'
    }
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit() {
    this.initOptions();
    // loadRadar triggered by filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    
    // Optional: Extract name for display if needed
    if (!filters.branchId) {
       this.currentBranchName = '';
    } else {
       this.currentBranchName = 'Branch Specific Analysis';
    }

    this.loadRadar();
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-mid';
    return 'score-low';
  }

  // Helper to find strongest metric for dynamic text
  getDominantMetric(data: any): string {
    if (!data || !data.datasets || !data.datasets[0]) return 'Balanced';
    const values = data.datasets[0].data;
    const maxVal = Math.max(...values);
    const index = values.indexOf(maxVal);
    return data.labels[index] || 'Balanced';
  }

  private initOptions() {
    const textColor = this.documentStyle.getPropertyValue('--text-secondary');
    const gridColor = this.documentStyle.getPropertyValue('--border-secondary');

    this.chartOptions = {
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: this.documentStyle.getPropertyValue('--bg-ternary'),
          titleColor: this.documentStyle.getPropertyValue('--text-primary'),
          bodyColor: this.documentStyle.getPropertyValue('--text-secondary'),
          borderColor: this.documentStyle.getPropertyValue('--border-primary'),
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => ` ${context.label}: ${context.raw}%`
          }
        }
      },
      scales: {
        r: {
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: {
            color: textColor,
            font: { size: 11, weight: '700', family: 'var(--font-body)' }
          },
          ticks: {
            display: false,
            stepSize: 20,
            backdropColor: 'transparent'
          },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      maintainAspectRatio: false
    };
  }

  loadRadar() {
    this.loading.set(true);
    
    // Add artificial delay for animation smoothness or remove if production
    setTimeout(() => {
        // Pass the Branch ID from filters
        this.analyticsService.getBranchPerformanceRadar(this.currentFilters.branchId).subscribe({
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
    const style = getComputedStyle(document.documentElement);
    const accentColor = style.getPropertyValue('--accent-primary').trim(); 
    
    const gradientFill = (context: any) => {
        const ctx = context.chart.ctx;
        const width = context.chart.width;
        const height = context.chart.height;
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        gradient.addColorStop(0, this.hexToRgba(accentColor, 0.5)); 
        gradient.addColorStop(1, this.hexToRgba(accentColor, 0.05));
        return gradient;
    };

    const dataset = {
        ...rawData.datasets[0],
        backgroundColor: gradientFill,
        borderColor: accentColor, 
        borderWidth: 2,
        pointBackgroundColor: accentColor,
        pointBorderColor: style.getPropertyValue('--bg-secondary'),
        pointHoverBackgroundColor: style.getPropertyValue('--text-primary'),
        pointHoverBorderColor: accentColor,
        pointRadius: 4,
        pointHoverRadius: 6
    };

    this.chartData.set({
        labels: rawData.labels,
        datasets: [dataset]
    });
  }

  private hexToRgba(hex: string, alpha: number) {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return `rgba(56, 189, 248, ${alpha})`; 
  }
}
// import { Component, OnInit, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ChartModule } from 'primeng/chart';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// @Component({
//   selector: 'app-branch-radar-chart',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ChartModule, 
//     ProgressSpinnerModule, 
//     ButtonModule, 
//     TooltipModule
//   ],
//   template: `
//     <div class="radar-container">

//       <div class="chart-card">

//         <div class="card-header">
//           <div>
//             <h2 class="card-title">
//               <i class="pi pi-compass header-icon"></i>
//               Operational Radar 
//             </h2>
//             <p class="card-subtitle">
//               Multidimensional Efficiency Metrics
//             </p>
//           </div>
//           <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="secondary" size="small" (onClick)="loadRadar()" [loading]="loading()"></p-button>
//         </div>

//         <ng-container *ngIf="!loading(); else loader">
          
//           <div class="content-grid">
            
//             <div class="chart-wrapper">
//                <p-chart type="radar" [data]="chartData()" [options]="chartOptions" height="100%" width="100%"></p-chart>
               
//                <div class="center-marker">
//                  <i class="pi pi-crosshairs"></i>
//                </div>
//             </div>

//             <div class="metrics-panel">
//                <div class="metrics-list">
//                  <h4 class="section-label">Metric Breakdown</h4>
                 
//                  @for (label of chartData()?.labels; track label; let i = $index) {
//                    <div class="metric-row group">
//                       <span class="metric-name">{{ label }}</span>
//                       <span class="metric-score" 
//                             [ngClass]="getScoreClass(chartData()?.datasets[0].data[i])">
//                         {{ chartData()?.datasets[0].data[i] }}%
//                       </span>
//                    </div>
//                  }
//                </div>

//                <div class="insight-box">
//                  <div class="insight-content">
//                    <i class="pi pi-info-circle insight-icon"></i>
//                    <div>
//                      <p class="insight-title">Efficiency Profile: {{ chartData()?.datasets[0].label }}</p>
//                      <p class="insight-text">
//                        Revenue & Volume are peaking at <span class="highlight">100%</span>. 
//                        <br>Zero discounts indicate strong pricing power.
//                      </p>
//                    </div>
//                  </div>
//                </div>
//             </div>
//           </div>

//         </ng-container>

//         <ng-template #loader>
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-10 h-10"></p-progressSpinner>
//             <p class="loader-text">Calibrating Performance Matrix...</p>
//           </div>
//         </ng-template>

//       </div>
//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .radar-container {
//       padding: var(--spacing-sm);
//       font-family: var(--font-body);
//       /* Optional: subtle background glow using theme color */
//       background: radial-gradient(circle at top right, var(--bg-ternary), transparent 70%);
//       border-radius: var(--radius-2xl);
//     }

//     /* CARD STYLES */
//     .chart-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       position: relative;
//       /* Glass effect base */
//       backdrop-filter: blur(10px);
//       box-shadow: var(--shadow-lg);
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
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//       margin-top: 4px;
//     }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-2xl);
//     }
//     @media (min-width: 768px) {
//       .content-grid { grid-template-columns: 2fr 1fr; } /* Chart takes 2/3 */
//     }

//     /* CHART SECTION */
//     .chart-wrapper {
//       height: 400px;
//       position: relative;
//       display: flex;
//       justify-content: center;
//     }

//     .center-marker {
//       position: absolute;
//       top: 50%;
//       left: 50%;
//       transform: translate(-50%, -50%);
//       pointer-events: none;
//       opacity: 0.1;
//       font-size: 4rem;
//       color: var(--text-primary);
//     }

//     /* METRICS PANEL */
//     .metrics-panel {
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       gap: var(--spacing-lg);
//     }

//     .section-label {
//       font-size: 10px;
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin-bottom: var(--spacing-md);
//     }

//     .metrics-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-sm);
//     }

//     .metric-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-md);
//       border-radius: var(--ui-border-radius);
//       border: 1px solid var(--border-secondary);
//       background: var(--bg-ternary);
//       transition: background 0.2s;
//     }
//     .metric-row:hover {
//       background: var(--component-bg-hover);
//     }

//     .metric-name {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-secondary);
//       transition: color 0.2s;
//     }
//     .metric-row:hover .metric-name { color: var(--text-primary); }

//     .metric-score {
//       font-family: var(--font-mono);
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//     }
//     /* Dynamic Score Colors handled by ngClass */
//     .score-high { color: var(--color-success); }
//     .score-mid { color: var(--color-info); }
//     .score-low { color: var(--color-error); }

//     /* INSIGHT BOX */
//     .insight-box {
//       margin-top: var(--spacing-md);
//       padding: var(--spacing-md);
//       border: 1px dashed var(--accent-primary);
//       border-radius: var(--ui-border-radius);
//       background: var(--color-primary-bg); /* Mix token */
//     }

//     .insight-content { display: flex; gap: var(--spacing-sm); }
//     .insight-icon { color: var(--accent-primary); margin-top: 2px; }

//     .insight-title {
//       font-weight: var(--font-weight-bold);
//       color: var(--accent-primary);
//       font-size: var(--font-size-xs);
//       margin: 0 0 4px 0;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .highlight { color: var(--text-primary); font-weight: bold; }

//     /* LOADER */
//     .loader-container {
//       height: 400px;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }
//   `]
// })
// export class BranchRadarChartComponent implements OnInit {
//   chartData = signal<any>(null);
//   loading = signal<boolean>(true);
//   chartOptions: any;

//   // Cache theme colors for canvas
//   private documentStyle = getComputedStyle(document.documentElement);

//   constructor(private analyticsService: AdminAnalyticsService) {}

//   ngOnInit() {
//     this.initOptions();
//     this.loadRadar();
//   }

//   // Use CSS classes instead of hardcoded tailwind classes
//   getScoreClass(score: number): string {
//     if (score >= 80) return 'score-high';
//     if (score >= 50) return 'score-mid';
//     return 'score-low';
//   }

//   private initOptions() {
//     // Read CSS Variables for Chart Config
//     const textColor = this.documentStyle.getPropertyValue('--text-secondary');
//     const gridColor = this.documentStyle.getPropertyValue('--border-secondary');

//     this.chartOptions = {
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: this.documentStyle.getPropertyValue('--bg-ternary'),
//           titleColor: this.documentStyle.getPropertyValue('--text-primary'),
//           bodyColor: this.documentStyle.getPropertyValue('--text-secondary'),
//           borderColor: this.documentStyle.getPropertyValue('--border-primary'),
//           borderWidth: 1,
//           padding: 10,
//           cornerRadius: 8,
//           displayColors: false,
//           callbacks: {
//             label: (context: any) => ` ${context.label}: ${context.raw}%`
//           }
//         }
//       },
//       scales: {
//         r: {
//           grid: { color: gridColor },
//           angleLines: { color: gridColor },
//           pointLabels: {
//             color: textColor,
//             font: { size: 11, weight: '700', family: 'var(--font-body)' }
//           },
//           ticks: {
//             display: false,
//             stepSize: 20,
//             backdropColor: 'transparent'
//           },
//           suggestedMin: 0,
//           suggestedMax: 100
//         }
//       },
//       maintainAspectRatio: false
//     };
//   }

//   loadRadar() {
//     this.loading.set(true);
//     setTimeout(() => {
//         this.analyticsService.getBranchPerformanceRadar().subscribe({
//         next: (res) => {
//             if (res.status === 'success') {
//                this.processData(res.data);
//             }
//             this.loading.set(false);
//         },
//         error: () => this.loading.set(false)
//         });
//     }, 600);
//   }

//   private processData(rawData: any) {
//     // Dynamic Theme Coloring for Canvas
//     // We re-fetch computed style in case theme changed
//     const style = getComputedStyle(document.documentElement);
//     const accentColor = style.getPropertyValue('--accent-primary').trim(); 
    
//     // Create Gradient Helper
//     const gradientFill = (context: any) => {
//         const ctx = context.chart.ctx;
//         const width = context.chart.width;
//         const height = context.chart.height;
        
//         const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
        
//         // Use CSS Variable Color with Opacity
//         // Note: For canvas, we usually need hex/rgb. 
//         // If var is #hex, we can't easily add opacity without conversion.
//         // For simplicity/robustness, we assume a fallback or usage of a known utility.
//         // However, a safe visual trick is to use the Accent Color for stroke 
//         // and a low opacity generic fill, OR use canvas `globalAlpha`.
        
//         gradient.addColorStop(0, this.hexToRgba(accentColor, 0.5)); 
//         gradient.addColorStop(1, this.hexToRgba(accentColor, 0.05));
//         return gradient;
//     };

//     const dataset = {
//         ...rawData.datasets[0],
//         backgroundColor: gradientFill,
//         borderColor: accentColor, 
//         borderWidth: 2,
//         pointBackgroundColor: accentColor,
//         pointBorderColor: style.getPropertyValue('--bg-secondary'),
//         pointHoverBackgroundColor: style.getPropertyValue('--text-primary'),
//         pointHoverBorderColor: accentColor,
//         pointRadius: 4,
//         pointHoverRadius: 6
//     };

//     this.chartData.set({
//         labels: rawData.labels,
//         datasets: [dataset]
//     });
//   }

//   // Simple Helper to convert Hex to RGBA for canvas opacity
//   private hexToRgba(hex: string, alpha: number) {
//     let c: any;
//     if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
//         c= hex.substring(1).split('');
//         if(c.length== 3){
//             c= [c[0], c[0], c[1], c[1], c[2], c[2]];
//         }
//         c= '0x'+c.join('');
//         return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
//     }
//     // Fallback if var isn't hex (e.g. named color)
//     return `rgba(56, 189, 248, ${alpha})`; 
//   }
// }
