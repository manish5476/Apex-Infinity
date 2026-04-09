import { Component, OnInit, signal, computed, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface StaffPerformance {
  _id: string;
  name: string;
  email: string;
  totalSales: number;
  invoiceCount: number;
  totalDiscountGiven: number;
  avgTicketSize: number;
}

@Component({
  selector: 'app-staff-performance-analysis',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TooltipModule, 
    ProgressSpinnerModule,
    AgShareGrid,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="staff-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Staff Performance</h2>
          <p class="page-subtitle">
            Detailed revenue contribution and sales efficiency metrics per associate
          </p>
        </div>
        <div class="action-group">
           <p-button label="Download CSV" icon="pi pi-download" [text]="true" size="small"></p-button>
        </div>
      </div>

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'staff-performance'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      @if (!loading()) {
        
        <div class="kpi-grid">
          
          <div class="kpi-card sales-card">
            <p class="kpi-label">Total Team Sales</p>
            <h2 class="kpi-value primary">{{ commonService.formatCurrency(totalRevenue()) }}</h2>
            <p class="kpi-meta">Across {{ staffData().length }} sales associates</p>
          </div>

          <div class="kpi-card mvp-card">
            <p class="kpi-label">MVP of the Period</p>
            <div class="mvp-content">
               <div class="mvp-avatar">
                 {{ commonService.getInitials(staffData()[0]?.name || 'U') }}
               </div>
               <div>
                 <h3 class="mvp-name">{{ staffData()[0]?.name }}</h3>
                 <p class="mvp-value">{{ commonService.formatCurrency(staffData()[0]?.totalSales) }}</p>
               </div>
            </div>
            <i class="pi pi-bolt mvp-bg-icon"></i>
          </div>

          <div class="kpi-card ticket-card">
            <p class="kpi-label">Avg Ticket Size</p>
            <h2 class="kpi-value info">{{ commonService.formatCurrency(avgTicketSize()) }}</h2>
            <p class="kpi-meta">Network-wide average per invoice</p>
          </div>
        </div>

        <div class="table-card">
          
          <div class="card-header">
            <h3 class="card-title">Performance Breakdown</h3>
            <span class="sync-badge">SYNCED: {{ meta()?.timestamp | date:'shortTime' }}</span>
          </div>

          <div class="grid-container">
             <app-ag-share-grid 
               [columns]="staffColumns" 
               [data]="staffData()" 
               class="full-size-grid">
             </app-ag-share-grid>
          </div>
        </div>

        <div class="insight-box">
          <i class="pi pi-chart-line insight-icon"></i>
          <div>
            <p class="insight-title">Associate Optimization</p>
            <p class="insight-text">
              <span class="highlight-white">{{ staffData()[0]?.name }}</span> is maintaining an Average Ticket Size of 
              <span class="highlight-color">{{ commonService.formatCurrency(staffData()[0]?.avgTicketSize) }}</span>. 
              Review their cross-selling techniques to implement across the rest of the team.
            </p>
          </div>
        </div>

      } @else {
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Aggregating Sales Force Data...</p>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .staff-container {
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
    
    .filter-section { margin-bottom: var(--spacing-lg); }

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

    .action-group { display: flex; align-items: center; gap: var(--spacing-sm); }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    /* KPI CARDS */
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
      position: relative;
      overflow: hidden;
    }
    .kpi-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

    .kpi-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-label);
      margin: 0 0 4px 0;
    }

    .kpi-value {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-heading);
      margin: 0;
      line-height: 1;
    }
    .kpi-value.primary { color: var(--text-primary); }
    .kpi-value.info { color: var(--color-info); }

    .kpi-meta {
      margin-top: var(--spacing-sm);
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
    }

    /* MVP CARD SPECIFIC */
    .mvp-card {
      border-left: 4px solid var(--accent-primary);
    }

    .mvp-content { display: flex; align-items: center; gap: var(--spacing-md); }

    .mvp-avatar {
      width: 3rem; height: 3rem;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .mvp-name {
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .mvp-value {
      font-weight: var(--font-weight-bold);
      color: var(--color-success);
      font-size: var(--font-size-md);
      margin: 0;
    }

    .mvp-bg-icon {
      position: absolute;
      right: 10px; bottom: 10px;
      font-size: 2.5rem;
      opacity: 0.05;
      color: var(--text-primary);
      pointer-events: none;
    }

    /* TABLE CARD */
    .table-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--radius-2xl);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }

    .sync-badge { font-size: 10px; font-weight: bold; color: var(--text-label); }

    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* INSIGHT BOX */
    .insight-box {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      border: 1px dashed var(--accent-primary);
      border-radius: var(--ui-border-radius-lg);
      background: var(--color-primary-bg); /* Mix token */
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .insight-icon { color: var(--accent-primary); margin-top: 2px; }

    .insight-title {
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      margin: 0 0 2px 0;
    }

    .insight-text {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.4;
      margin: 0;
    }

    .highlight-white { font-weight: bold; color: var(--text-primary); }
    .highlight-color { font-weight: bold; color: var(--accent-primary); }

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
export class StaffPerformanceAnalysisComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  staffData = signal<StaffPerformance[]>([]);
  meta = signal<any>(null);
  loading = signal<boolean>(false);
  staffColumns: any[] = [];

  // Filter State
  private currentFilters: any = {
    minSales: 0,
    sortBy: 'revenue'
  };

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches', // Binds to MasterListService
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    {
      key: 'date',
      label: 'Performance Period',
      type: 'date-range'
    },
    {
      key: 'minSales',
      label: 'Min Revenue',
      type: 'select',
      staticOptions: [
        { label: 'All Staff', value: 0 },
        { label: '> ₹10,000', value: 10000 },
        { label: '> ₹50,000', value: 50000 },
        { label: '> ₹1 Lakh', value: 100000 }
      ],
      defaultValue: 0
    }
  ];

  // Computed Totals
  totalRevenue = computed(() => this.staffData().reduce((acc, s) => acc + s.totalSales, 0));
  avgTicketSize = computed(() => {
    const total = this.staffData().reduce((acc, s) => acc + s.avgTicketSize, 0);
    return this.staffData().length ? total / this.staffData().length : 0;
  });

  ngOnInit() {
    this.setupColumns();
    // loadData triggered by filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // API Call with Filters
    const params = {
      branchId: this.currentFilters.branchId,
      startDate: this.currentFilters.startDate,
      endDate: this.currentFilters.endDate,
      minSales: this.currentFilters.minSales || 0,
      sortBy: 'revenue' // Default sort
    };

    this.analyticsService.getStaffPerformance(
            params.startDate, 
            params.endDate, 
            params.branchId, 
            params.minSales, 
            params.sortBy
          ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.staffData.set(res.data);
          this.meta.set(res.meta);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    // Grid columns using Theme Tokens
    this.staffColumns = [
      {
        field: 'name', 
        headerName: 'Associate', 
        sortable: true, 
        flex: 1, 
        minWidth: 200,
        cellRenderer: (params: any) => {
          const name = params.value || 'Unknown';
          const email = params.data.email || '';
          const initials = this.commonService.getInitials(name);

          // Avatar using Accent Colors
          return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-ternary); border: 1px solid var(--border-secondary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">
                      ${initials}
                    </div>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm);">${name}</span>
                      <span style="font-size: 10px; color: var(--text-tertiary);">${email}</span>
                    </div>
                  </div>`;
        }
      },
      {
        field: 'invoiceCount', 
        headerName: 'Invoices', 
        sortable: true, 
        width: 100,
        type: 'rightAligned',
        cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--text-secondary)' }
      },
      {
        field: 'totalDiscountGiven', 
        headerName: 'Total Discount', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: (params: any) => {
           return {
             'font-weight': '700',
             'text-align': 'right',
             'color': params.value > 0 ? 'var(--color-error)' : 'var(--text-tertiary)'
           };
        }
      },
      {
        field: 'avgTicketSize', 
        headerName: 'Avg Ticket', 
        sortable: true, 
        width: 130,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-info)', 'text-align': 'right' }
      },
      {
        field: 'totalSales', 
        headerName: 'Revenue', 
        sortable: true, 
        width: 150,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right', 'font-size': '14px' }
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// interface StaffPerformance {
//   _id: string;
//   name: string;
//   email: string;
//   totalSales: number;
//   invoiceCount: number;
//   totalDiscountGiven: number;
//   avgTicketSize: number;
// }

// @Component({
//   selector: 'app-staff-performance-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ProgressSpinnerModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="staff-container">

//       <div class="header-section">
//         <div>
//           <h2 class="page-title">Staff Performance</h2>
//           <p class="page-subtitle">
//             Detailed revenue contribution and sales efficiency metrics per associate
//           </p>
//         </div>
//         <div class="action-group">
//            <p-button label="Filters" icon="pi pi-filter" severity="secondary" [outlined]="true" size="small"></p-button>
//            <p-button label="Download CSV" icon="pi pi-download" [text]="true" size="small"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card sales-card">
//             <p class="kpi-label">Total Team Sales</p>
//             <h2 class="kpi-value primary">₹{{ totalRevenue() | number }}</h2>
//             <p class="kpi-meta">Across {{ staffData().length }} sales associates</p>
//           </div>

//           <div class="kpi-card mvp-card">
//             <p class="kpi-label">MVP of the Period</p>
//             <div class="mvp-content">
//                <div class="mvp-avatar">
//                  {{ commonService.getInitials(staffData()[0]?.name || 'U') }}
//                </div>
//                <div>
//                  <h3 class="mvp-name">{{ staffData()[0]?.name }}</h3>
//                  <p class="mvp-value">₹{{ staffData()[0]?.totalSales | number }}</p>
//                </div>
//             </div>
//             <i class="pi pi-bolt mvp-bg-icon"></i>
//           </div>

//           <div class="kpi-card ticket-card">
//             <p class="kpi-label">Avg Ticket Size</p>
//             <h2 class="kpi-value info">₹{{ avgTicketSize() | number:'1.0-0' }}</h2>
//             <p class="kpi-meta">Network-wide average per invoice</p>
//           </div>
//         </div>

//         <div class="table-card">
          
//           <div class="card-header">
//             <h3 class="card-title">Performance Breakdown</h3>
//             <span class="sync-badge">SYNCED: {{ meta()?.timestamp | date:'shortTime' }}</span>
//           </div>

//           <div class="grid-container">
//              <app-ag-share-grid 
//                [columns]="staffColumns" 
//                [data]="staffData()" 
// 
//                class="full-size-grid">
//              </app-ag-share-grid>
//           </div>
//         </div>

//         <div class="insight-box">
//           <i class="pi pi-chart-line insight-icon"></i>
//           <div>
//             <p class="insight-title">Associate Optimization</p>
//             <p class="insight-text">
//               <span class="highlight-white">{{ staffData()[0]?.name }}</span> is maintaining an Average Ticket Size of 
//               <span class="highlight-color">₹{{ staffData()[0]?.avgTicketSize | number }}</span>. 
//               Review their cross-selling techniques to implement across the rest of the team.
//             </p>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Aggregating Sales Force Data...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .staff-container {
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

//     .action-group { display: flex; align-items: center; gap: var(--spacing-sm); }

//     /* KPI GRID */
//     .kpi-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//       position: relative;
//       overflow: hidden;
//     }
//     .kpi-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-sm); }

//     .kpi-label {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       color: var(--text-label);
//       margin: 0 0 4px 0;
//     }

//     .kpi-value {
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       font-family: var(--font-heading);
//       margin: 0;
//       line-height: 1;
//     }
//     .kpi-value.primary { color: var(--text-primary); }
//     .kpi-value.info { color: var(--color-info); }

//     .kpi-meta {
//       margin-top: var(--spacing-sm);
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }

//     /* MVP CARD SPECIFIC */
//     .mvp-card {
//       border-left: 4px solid var(--accent-primary);
//     }

//     .mvp-content { display: flex; align-items: center; gap: var(--spacing-md); }

//     .mvp-avatar {
//       width: 3rem; height: 3rem;
//       border-radius: 50%;
//       background: var(--accent-gradient);
//       color: #fff;
//       display: flex; align-items: center; justify-content: center;
//       font-weight: bold;
//       font-size: 1.2rem;
//     }

//     .mvp-name {
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       line-height: 1.2;
//     }

//     .mvp-value {
//       font-weight: var(--font-weight-bold);
//       color: var(--color-success);
//       font-size: var(--font-size-md);
//       margin: 0;
//     }

//     .mvp-bg-icon {
//       position: absolute;
//       right: 10px; bottom: 10px;
//       font-size: 2.5rem;
//       opacity: 0.05;
//       color: var(--text-primary);
//       pointer-events: none;
//     }

//     /* TABLE CARD */
//     .table-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl);
//       overflow: hidden;
//       height: 100%;
//       min-height: 400px;
//       display: flex;
//       flex-direction: column;
//       box-shadow: var(--shadow-sm);
//     }

//     .card-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .card-title {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .sync-badge { font-size: 10px; font-weight: bold; color: var(--text-label); }

//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* INSIGHT BOX */
//     .insight-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border: 1px dashed var(--accent-primary);
//       border-radius: var(--ui-border-radius-lg);
//       background: var(--color-primary-bg); /* Mix token */
//       display: flex;
//       align-items: flex-start;
//       gap: var(--spacing-md);
//     }

//     .insight-icon { color: var(--accent-primary); margin-top: 2px; }

//     .insight-title {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//       color: var(--text-primary);
//       margin: 0 0 2px 0;
//     }

//     .insight-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.4;
//       margin: 0;
//     }

//     .highlight-white { font-weight: bold; color: var(--text-primary); }
//     .highlight-color { font-weight: bold; color: var(--accent-primary); }

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
// export class StaffPerformanceAnalysisComponent implements OnInit {
//   staffData = signal<StaffPerformance[]>([]);
//   meta = signal<any>(null);
//   loading = signal<boolean>(true);
//   staffColumns: any[] = [];

//   // Computed Totals
//   totalRevenue = computed(() => this.staffData().reduce((acc, s) => acc + s.totalSales, 0));
//   avgTicketSize = computed(() => {
//     const total = this.staffData().reduce((acc, s) => acc + s.avgTicketSize, 0);
//     return this.staffData().length ? total / this.staffData().length : 0;
//   });

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

//   setupColumns(): void {
//     // Grid columns using Theme Tokens
//     this.staffColumns = [
//       {
//         field: 'name', 
//         headerName: 'Associate', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 200,
//         cellRenderer: (params: any) => {
//           const name = params.value || 'Unknown';
//           const email = params.data.email || '';
//           const initials = this.commonService.getInitials(name);

//           // Avatar using Accent Colors
//           return `<div style="display: flex; align-items: center; gap: 12px; height: 100%;">
//                     <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--bg-ternary); border: 1px solid var(--border-secondary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10px;">
//                       ${initials}
//                     </div>
//                     <div style="display: flex; flex-direction: column;">
//                       <span style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm);">${name}</span>
//                       <span style="font-size: 10px; color: var(--text-tertiary);">${email}</span>
//                     </div>
//                   </div>`;
//         }
//       },
//       {
//         field: 'invoiceCount', 
//         headerName: 'Invoices', 
//         sortable: true, 
//         width: 100,
//         type: 'rightAligned',
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'totalDiscountGiven', 
//         headerName: 'Total Discount', 
//         sortable: true, 
//         width: 130,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: (params: any) => {
//            return {
//              'font-weight': '700',
//              'text-align': 'right',
//              'color': params.value > 0 ? 'var(--color-error)' : 'var(--text-tertiary)'
//            };
//         }
//       },
//       {
//         field: 'avgTicketSize', 
//         headerName: 'Avg Ticket', 
//         sortable: true, 
//         width: 130,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-info)', 'text-align': 'right' }
//       },
//       {
//         field: 'totalSales', 
//         headerName: 'Revenue', 
//         sortable: true, 
//         width: 150,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right', 'font-size': '14px' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getStaffPerformance().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.staffData.set(res.data);
//           this.meta.set(res.meta);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
