import { Component, OnInit, signal, computed, inject, OnDestroy } from '@angular/core';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

// Components

interface PeakData {
  count: number;
  day: number;
  hour: number;
}

@Component({
  selector: 'app-peak-hours-analysis',
  standalone: true,
  imports: [
    ProgressSpinnerModule,
    TooltipModule,
    ButtonModule,
    UniversalFilterComponent
],
  template: `
    <div class="peak-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Store Traffic Patterns</h2>
          <p class="page-subtitle">
            Heatmap of transaction density by day and hour
          </p>
        </div>
        <p-button label="Sync Live" icon="pi pi-sync" [text]="true" severity="info" (onClick)="loadData()"></p-button>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'peak-hours'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      @if (!loading()) {
        
        <div class="highlight-grid">
          
          <div class="hero-card">
            <div class="hero-content">
              <p class="hero-label">Primary Peak Window</p>
              <h1 class="hero-value">{{ formatHour(topPeak()?.hour || 0) }}</h1>
              <p class="hero-sub">Every {{ getDayName(topPeak()?.day || 0) }}</p>
              
              <div class="metric-badge">
                <i class="pi pi-users"></i>
                <span class="metric-text">{{ topPeak()?.count }} Consistent Transactions</span>
              </div>
            </div>
            <i class="pi pi-clock bg-icon"></i>
          </div>

          <div class="insights-col">
              
             <div class="insight-card">
                <h4 class="card-label">Peak Efficiency Tip</h4>
                <p class="card-text">
                  Your highest volume occurs on <span class="highlight">{{ getDayName(topPeak()?.day || 0) }}s</span>. 
                  Consider scheduling senior technicians for these windows to handle high-ticket TV consultations.
                </p>
             </div>
             
             <div class="insight-card alt-bg">
                <h4 class="card-label">Staffing Impact</h4>
                <div class="impact-row">
                   <div class="impact-value">2.5x</div>
                   <p class="impact-desc">Traffic surge compared to baseline morning hours.</p>
                </div>
                <div class="progress-track">
                   <div class="progress-fill primary" style="width: 85%"></div>
                </div>
             </div>
          </div>
        </div>

        <div class="slots-section">
          <h3 class="section-title">High-Density Time Slots</h3>
          
          <div class="slots-grid">
            @for (slot of rawData(); track $index) {
              <div class="slot-card group">
                <div class="slot-header">
                   <span class="slot-time">{{ formatHour(slot.hour) }}</span>
                   <div class="slot-badge">
                     {{ slot.count }} Orders
                   </div>
                </div>
                <p class="slot-day">{{ getDayName(slot.day) }}</p>
                <div class="progress-track small">
                   <div class="progress-fill" 
                        [class.success]="slot.count > 1"
                        [class.info]="slot.count <= 1"
                        [style.width]="(slot.count / (topPeak()?.count || 1) * 100) + '%'"></div>
                </div>
              </div>
            }
          </div>
        </div>

      } @else {
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Mapping traffic flow...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .peak-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* HEADER */
    .header-section {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    
    .filter-section { margin-bottom: var(--spacing-xl); }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-family: var(--font-heading);
      letter-spacing: -0.01em;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    /* TOP GRID */
    .highlight-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .highlight-grid { grid-template-columns: 5fr 7fr; }
    }

    /* HERO CARD (Gradient) */
    .hero-card {
      background: var(--accent-gradient);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-xl);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      color: #ffffff;
    }

    .hero-content { position: relative; z-index: 10; }

    .hero-label {
      font-size: var(--font-size-xs);
      font-weight: 900;
      text-transform: uppercase;
      opacity: 0.8;
      letter-spacing: 0.1em;
      margin: 0 0 8px 0;
    }

    .hero-value {
      font-size: 3rem;
      font-weight: var(--font-weight-bold);
      margin: 0 0 8px 0;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .hero-sub {
      font-size: var(--font-size-xl);
      font-weight: 500;
      margin: 0 0 var(--spacing-lg) 0;
    }

    .metric-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-md);
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: var(--ui-border-radius);
    }
    .metric-text { font-weight: bold; font-variant-numeric: tabular-nums; }

    .bg-icon {
      position: absolute;
      right: -20px;
      bottom: -20px;
      font-size: 10rem;
      opacity: 0.1;
      color: #ffffff;
      pointer-events: none;
    }

    /* INSIGHTS COLUMN */
    .insights-col {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
    @media(min-width: 768px) {
      .insights-col { grid-template-columns: 1fr 1fr; }
    }

    .insight-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-lg);
    }
    .insight-card.alt-bg { background: var(--bg-ternary); border-color: var(--border-secondary); }

    .card-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0 0 var(--spacing-md) 0;
    }

    .card-text {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }
    .highlight { font-weight: bold; color: var(--accent-primary); }

    .impact-row { display: flex; align-items: center; gap: var(--spacing-md); }
    
    .impact-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--accent-primary); /* Or indigo based on theme */
      font-family: var(--font-mono);
    }

    .impact-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }

    .progress-track {
      width: 100%;
      height: 6px;
      background: var(--bg-ternary); /* Or subtle white */
      border-radius: 99px;
      overflow: hidden;
      margin-top: var(--spacing-md);
    }
    .progress-track.small { height: 4px; margin-top: var(--spacing-sm); background: rgba(255,255,255,0.1); }

    .progress-fill { height: 100%; transition: width 1s ease; border-radius: 99px; }
    .progress-fill.primary { background: var(--accent-primary); }
    .progress-fill.success { background: var(--color-success); }
    .progress-fill.info { background: var(--color-info); }

    /* SLOTS SECTION */
    .slots-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-xl);
    }

    .section-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xl) 0;
      letter-spacing: -0.01em;
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .slot-card {
      background: var(--bg-ternary);
      border: 1px solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-md);
      transition: all 0.2s;
    }
    .slot-card:hover { border-color: var(--accent-secondary); transform: translateY(-2px); }

    .slot-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-sm); }
    
    .slot-time { font-weight: bold; font-size: var(--font-size-md); color: var(--text-primary); }

    .slot-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      background: var(--accent-focus);
      color: var(--accent-primary);
      border: 1px solid var(--accent-secondary);
    }

    .slot-day { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-secondary); margin: 0; }

    /* LOADER */
    .loader-container {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class PeakHoursAnalysisComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  rawData = signal<PeakData[]>([]);
  loading = signal<boolean>(false); // Start false, filter triggers load

  // Stored Filters
  private currentFilters: any = {};

  topPeak = computed(() => {
    const data = this.rawData();
    if (!data.length) return null;
    return [...data].sort((a, b) => b.count - a.count)[0];
  });

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches', // Binds to MasterListService.branches()
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Traffic'
    }
  ];

  constructor(private analyticsService: AdminAnalyticsService) { }

  ngOnInit() {
    // loadData triggered by filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // Pass branch context
    const branchId = this.currentFilters.branchId;

    this.analyticsService.getPeakBusinessHours(branchId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.rawData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // Formatting Helpers
  formatHour(hour: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}:00 ${period}`;
  }

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day] || days[0];
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { ButtonModule } from 'primeng/button';
// import { AdminAnalyticsService } from '../admin-analytics.service';

// interface PeakData {
//   count: number;
//   day: number;
//   hour: number;
// }

// @Component({
//   selector: 'app-peak-hours-analysis',
//   standalone: true,
//   imports: [CommonModule, ProgressSpinnerModule, TooltipModule, ButtonModule],
//   template: `
//     <div class="peak-container">

//       <div class="header-section">
//         <div>
//           <h2 class="page-title">Store Traffic Patterns</h2>
//           <p class="page-subtitle">
//             Heatmap of transaction density by day and hour
//           </p>
//         </div>
//         <p-button label="Sync Live" icon="pi pi-sync" [text]="true" severity="info" (onClick)="loadData()"></p-button>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="highlight-grid">
          
//           <div class="hero-card">
//             <div class="hero-content">
//               <p class="hero-label">Primary Peak Window</p>
//               <h1 class="hero-value">{{ formatHour(topPeak()?.hour || 0) }}</h1>
//               <p class="hero-sub">Every {{ getDayName(topPeak()?.day || 0) }}</p>
              
//               <div class="metric-badge">
//                 <i class="pi pi-users"></i>
//                 <span class="metric-text">{{ topPeak()?.count }} Consistent Transactions</span>
//               </div>
//             </div>
//             <i class="pi pi-clock bg-icon"></i>
//           </div>

//           <div class="insights-col">
             
//              <div class="insight-card">
//                 <h4 class="card-label">Peak Efficiency Tip</h4>
//                 <p class="card-text">
//                   Your highest volume occurs on <span class="highlight">{{ getDayName(topPeak()?.day || 0) }}s</span>. 
//                   Consider scheduling senior technicians for these windows to handle high-ticket TV consultations.
//                 </p>
//              </div>
             
//              <div class="insight-card alt-bg">
//                 <h4 class="card-label">Staffing Impact</h4>
//                 <div class="impact-row">
//                    <div class="impact-value">2.5x</div>
//                    <p class="impact-desc">Traffic surge compared to baseline morning hours.</p>
//                 </div>
//                 <div class="progress-track">
//                    <div class="progress-fill primary" style="width: 85%"></div>
//                 </div>
//              </div>
//           </div>
//         </div>

//         <div class="slots-section">
//           <h3 class="section-title">High-Density Time Slots</h3>
          
//           <div class="slots-grid">
//             @for (slot of rawData(); track $index) {
//               <div class="slot-card group">
//                 <div class="slot-header">
//                    <span class="slot-time">{{ formatHour(slot.hour) }}</span>
//                    <div class="slot-badge">
//                      {{ slot.count }} Orders
//                    </div>
//                 </div>
//                 <p class="slot-day">{{ getDayName(slot.day) }}</p>
//                 <div class="progress-track small">
//                    <div class="progress-fill" 
//                         [class.success]="slot.count > 1"
//                         [class.info]="slot.count <= 1"
//                         [style.width]="(slot.count / (topPeak()?.count || 1) * 100) + '%'"></div>
//                 </div>
//               </div>
//             }
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Mapping traffic flow...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .peak-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* HEADER */
//     .header-section {
//       display: flex;
//       flex-wrap: wrap;
//       justify-content: space-between;
//       align-items: flex-end;
//       gap: var(--spacing-md);
//       margin-bottom: var(--spacing-xl);
//     }

//     .page-title {
//       font-size: var(--font-size-2xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       font-family: var(--font-heading);
//       letter-spacing: -0.01em;
//       margin: 0 0 4px 0;
//     }

//     .page-subtitle {
//       color: var(--text-tertiary);
//       font-size: var(--font-size-sm);
//       margin: 0;
//     }

//     /* TOP GRID */
//     .highlight-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .highlight-grid { grid-template-columns: 5fr 7fr; }
//     }

//     /* HERO CARD (Gradient) */
//     .hero-card {
//       background: var(--accent-gradient);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//       position: relative;
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//       justify-content: center;
//       box-shadow: var(--shadow-lg);
//       color: #ffffff;
//     }

//     .hero-content { position: relative; z-index: 10; }

//     .hero-label {
//       font-size: var(--font-size-xs);
//       font-weight: 900;
//       text-transform: uppercase;
//       opacity: 0.8;
//       letter-spacing: 0.1em;
//       margin: 0 0 8px 0;
//     }

//     .hero-value {
//       font-size: 3rem;
//       font-weight: var(--font-weight-bold);
//       margin: 0 0 8px 0;
//       line-height: 1;
//       letter-spacing: -0.02em;
//     }

//     .hero-sub {
//       font-size: var(--font-size-xl);
//       font-weight: 500;
//       margin: 0 0 var(--spacing-lg) 0;
//     }

//     .metric-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding: var(--spacing-xs) var(--spacing-md);
//       background: rgba(255, 255, 255, 0.2);
//       border: 1px solid rgba(255, 255, 255, 0.3);
//       border-radius: var(--ui-border-radius);
//     }
//     .metric-text { font-weight: bold; font-variant-numeric: tabular-nums; }

//     .bg-icon {
//       position: absolute;
//       right: -20px;
//       bottom: -20px;
//       font-size: 10rem;
//       opacity: 0.1;
//       color: #ffffff;
//       pointer-events: none;
//     }

//     /* INSIGHTS COLUMN */
//     .insights-col {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-md);
//     }
//     @media(min-width: 768px) {
//       .insights-col { grid-template-columns: 1fr 1fr; }
//     }

//     .insight-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-lg);
//     }
//     .insight-card.alt-bg { background: var(--bg-ternary); border-color: var(--border-secondary); }

//     .card-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-label);
//       margin: 0 0 var(--spacing-md) 0;
//     }

//     .card-text {
//       font-size: var(--font-size-sm);
//       color: var(--text-secondary);
//       line-height: 1.6;
//       margin: 0;
//     }
//     .highlight { font-weight: bold; color: var(--accent-primary); }

//     .impact-row { display: flex; align-items: center; gap: var(--spacing-md); }
    
//     .impact-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--accent-primary); /* Or indigo based on theme */
//       font-family: var(--font-mono);
//     }

//     .impact-desc { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }

//     .progress-track {
//       width: 100%;
//       height: 6px;
//       background: var(--bg-ternary); /* Or subtle white */
//       border-radius: 99px;
//       overflow: hidden;
//       margin-top: var(--spacing-md);
//     }
//     .progress-track.small { height: 4px; margin-top: var(--spacing-sm); background: rgba(255,255,255,0.1); }

//     .progress-fill { height: 100%; transition: width 1s ease; border-radius: 99px; }
//     .progress-fill.primary { background: var(--accent-primary); }
//     .progress-fill.success { background: var(--color-success); }
//     .progress-fill.info { background: var(--color-info); }

//     /* SLOTS SECTION */
//     .slots-section {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-xl);
//     }

//     .section-title {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-xl) 0;
//       letter-spacing: -0.01em;
//     }

//     .slots-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//       gap: var(--spacing-md);
//     }

//     .slot-card {
//       background: var(--bg-ternary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-md);
//       transition: all 0.2s;
//     }
//     .slot-card:hover { border-color: var(--accent-secondary); transform: translateY(-2px); }

//     .slot-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-sm); }
    
//     .slot-time { font-weight: bold; font-size: var(--font-size-md); color: var(--text-primary); }

//     .slot-badge {
//       padding: 2px 6px;
//       border-radius: 4px;
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       background: var(--accent-focus);
//       color: var(--accent-primary);
//       border: 1px solid var(--accent-secondary);
//     }

//     .slot-day { font-size: var(--font-size-xs); font-weight: bold; color: var(--text-secondary); margin: 0; }

//     /* LOADER */
//     .loader-container {
//       height: 60vh;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//       font-weight: bold;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
//   `]
// })
// export class PeakHoursAnalysisComponent implements OnInit {
//   rawData = signal<PeakData[]>([]);
//   loading = signal<boolean>(true);

//   topPeak = computed(() => {
//     const data = this.rawData();
//     if (!data.length) return null;
//     return [...data].sort((a, b) => b.count - a.count)[0];
//   });

//   constructor(private analyticsService: AdminAnalyticsService) { }

//   ngOnInit() {
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getPeakBusinessHours().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.rawData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   // Formatting Helpers
//   formatHour(hour: number): string {
//     const period = hour >= 12 ? 'PM' : 'AM';
//     const h = hour % 12 || 12;
//     return `${h}:00 ${period}`;
//   }

//   getDayName(day: number): string {
//     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
//     return days[day] || days[0];
//   }
// }
