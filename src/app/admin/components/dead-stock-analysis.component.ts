import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

// Services & Shared
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

interface DeadStockItem {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  value: number;
  daysInactive: number;
}

@Component({
  selector: 'app-dead-stock-analysis',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    TooltipModule, 
    TagModule,
    AgShareGrid
  ],
  template: `
    <div class="deadstock-container">

      <div class="header-section">
        <div>
          <h2 class="page-title">Dead Stock Audit</h2>
          <p class="page-subtitle">
            Identifying inventory with zero movement for over 90 days
          </p>
        </div>
        <div class="action-group">
           <p-button label="Export Report" icon="pi pi-file-pdf" severity="secondary" [outlined]="true" size="small"></p-button>
           <p-button label="Clear Inventory" icon="pi pi-bolt" severity="danger" size="small"></p-button>
        </div>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          
          <div class="kpi-card locked-card">
            <p class="kpi-label">Capital Locked</p>
            <h2 class="kpi-value error">₹{{ totalValueLocked() | number }}</h2>
            <p class="kpi-meta">Across {{ deadStock().length }} Unique SKUs</p>
            <div class="bg-icon"><i class="pi pi-lock"></i></div>
          </div>

          <div class="kpi-card units-card">
            <p class="kpi-label">Non-Moving Units</p>
            <h2 class="kpi-value primary">{{ totalUnits() | number }}</h2>
            <p class="kpi-alert">90+ Days of Inactivity</p>
          </div>

          <div class="kpi-card risk-card">
            <p class="kpi-label">Highest Single Risk</p>
            <h3 class="risk-name" [title]="deadStock()[0]?.name">{{ deadStock()[0]?.name }}</h3>
            <div class="risk-footer">
               <span class="risk-value">₹{{ deadStock()[0]?.value | number }}</span>
               <span class="badge critical">Critical</span>
            </div>
          </div>
        </div>

        <div class="table-card">
          <div class="card-header">
            <h3 class="card-title">Inventory Liquidation Priority</h3>
            <span class="header-tag">SORTED BY CAPITAL VALUE</span>
          </div>

          <div class="grid-container">
             <app-ag-share-grid 
               [columns]="stockColumns" 
               [data]="deadStock()" 
               [showActions]="false" 
               style="width: 100%; height: 100%; display: block;"
               class="full-size-grid">
             </app-ag-share-grid>
          </div>
        </div>

        <div class="advisory-box">
          <i class="pi pi-exclamation-circle advisory-icon"></i>
          <div>
            <p class="advisory-title">Liquidation Notice</p>
            <p class="advisory-text">
              Inventory worth <span class="highlight">₹{{ totalValueLocked() | number }}</span> has exceeded the 90-day threshold. 
              We recommend a 15% markdown or bundled promotion for the <span class="highlight-white">{{ deadStock()[0]?.name }}</span> and other high-value SKUs.
            </p>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Auditing Stock Lifecycle...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }

    .deadstock-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      height: 100%;
      overflow-y: auto;
    }

    /* HEADER */
    .header-section {
      display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end;
      gap: var(--spacing-md); margin-bottom: var(--spacing-xl);
    }
    .page-title {
      font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);
      color: var(--text-primary); font-family: var(--font-heading); margin: 0 0 4px 0;
    }
    .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }
    .action-group { display: flex; align-items: center; gap: var(--spacing-sm); }

    /* KPI GRID */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);
    }

    .kpi-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); padding: var(--spacing-lg);
      position: relative; overflow: hidden;
    }

    .kpi-label {
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-label); margin: 0 0 4px 0;
    }
    .kpi-value {
      font-size: 2rem; font-weight: 700; margin: 0; line-height: 1;
      &.error { color: var(--color-error); }
      &.primary { color: var(--text-primary); }
    }
    .kpi-meta { margin-top: 8px; font-size: 12px; color: var(--text-tertiary); }
    .kpi-alert { margin-top: 8px; font-size: 12px; font-weight: 700; color: var(--color-warning); }

    .bg-icon {
      position: absolute; bottom: -10px; right: -10px; opacity: 0.05;
      font-size: 4rem; pointer-events: none; color: var(--text-primary);
    }

    /* Risk Card Specifics */
    .risk-card { background: var(--bg-ternary); border-color: var(--border-secondary); }
    .risk-name {
      font-size: 1rem; font-weight: 700; color: var(--text-primary);
      margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .risk-footer {
      display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;
    }
    .risk-value { font-weight: 700; color: var(--color-error); font-family: var(--font-mono); }
    .badge.critical {
      background: rgba(239, 68, 68, 0.1); color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2); font-size: 10px;
      padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;
    }

    /* TABLE CARD (Grid Fixes) */
    .table-card {
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); overflow: hidden;
      
      /* Flex Column to manage height */
      display: flex; flex-direction: column;
      height: 600px; /* Defined height for flex container */
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center;
      flex-shrink: 0;
    }
    .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-primary); margin: 0; }
    .header-tag { font-size: 10px; font-weight: 700; color: var(--text-label); }

    .grid-container { 
      flex: 1; /* Fills remaining space in card */
      position: relative; 
      min-height: 0; /* Important for flex scrolling */
      overflow: hidden; 
    }

    /* ADVISORY BOX */
    .advisory-box {
      margin-top: var(--spacing-lg); padding: var(--spacing-md);
      border: 1px dashed var(--border-secondary); background: rgba(239, 68, 68, 0.03);
      border-radius: var(--ui-border-radius-lg); display: flex; gap: var(--spacing-md);
    }
    .advisory-icon { color: var(--color-error); margin-top: 2px; }
    .advisory-title { font-weight: 700; font-size: 14px; color: var(--text-primary); margin: 0 0 2px 0; }
    .advisory-text { font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4; }
    .highlight { color: var(--color-error); font-weight: 700; }
    .highlight-white { color: var(--text-primary); font-weight: 700; }

    /* LOADER */
    .loader-container {
      height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    }
    .loader-text { font-size: 12px; color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class DeadStockAnalysisComponent implements OnInit {
  deadStock = signal<DeadStockItem[]>([]);
  loading = signal<boolean>(true);
  stockColumns: any[] = [];

  totalValueLocked = computed(() => this.deadStock().reduce((acc, item) => acc + item.value, 0));
  totalUnits = computed(() => this.deadStock().reduce((acc, item) => acc + item.quantity, 0));

  constructor(
    private analyticsService: AdminAnalyticsService,
    public commonService: CommonMethodService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setupColumns();
    this.loadData();
  }

 setupColumns(): void {
  this.stockColumns = [
    {
      field: 'name', 
      headerName: 'Product Detail', 
      sortable: true, 
      flex: 1, 
      minWidth: 220,
      // Combined Name & SKU in one clean cell
      cellRenderer: (params: any) => `
        <div style="display: flex; flex-direction: column; justify-content: center; height: 100%; line-height: 1.2;">
          <span style="font-weight: 700; color: var(--theme-text-primary); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${params.value}</span>
          <span style="font-size: 10px; color: var(--theme-text-tertiary); font-family: var(--font-mono); margin-top: 1px;">${params.data.sku}</span>
        </div>`
    },
    {
      field: 'quantity', 
      headerName: 'Qty', 
      sortable: true, 
      width: 90, 
      type: 'rightAligned',
      cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--theme-text-secondary)' }
    },
    {
      field: 'value', 
      headerName: 'Value Locked', 
      sortable: true, 
      width: 130, 
      type: 'rightAligned',
      valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
      cellStyle: (params: any) => ({
        'font-weight': '700', 
        'color': params.value > 2000000 ? 'var(--color-error)' : 'var(--theme-text-primary)',
        'text-align': 'right',
        'font-family': 'var(--font-mono)'
      })
    },
    {
      field: 'daysInactive', 
      headerName: 'Days Idle', 
      sortable: true, 
      width: 100,
      cellStyle: { 'font-weight': '700', 'color': 'var(--color-warning)', 'text-align': 'center' }
    },
    {
      headerName: 'Strategy',
      width: 130,
      // Reduced height buttons (20px height, 0 padding top/bottom)
      cellRenderer: (params: any) => `
        <div style="display: flex; gap: 6px; align-items: center; height: 100%;">
          <button style="
            background: rgba(59, 130, 246, 0.1); 
            border: 1px solid #3b82f6; 
            color: #3b82f6; 
            padding: 0px 6px; 
            height: 20px; 
            border-radius: 4px; 
            font-size: 9px; 
            font-weight: 800; 
            cursor: pointer; 
            line-height: 18px;">
            SALE
          </button>
          <button style="
            background: rgba(245, 158, 11, 0.1); 
            border: 1px solid #f59e0b; 
            color: #f59e0b; 
            padding: 0px 6px; 
            height: 20px; 
            border-radius: 4px; 
            font-size: 9px; 
            font-weight: 800; 
            cursor: pointer; 
            line-height: 18px;">
            MOVE
          </button>
        </div>`,
      cellStyle: { 'display': 'flex', 'align-items': 'center' }
    }
  ];
  this.cdr.detectChanges();
}

  loadData() {
    this.loading.set(true);
    this.analyticsService.getDeadStockReport().subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.deadStock.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
// import { Component, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// interface DeadStockItem {
//   _id: string;
//   name: string;
//   sku: string;
//   quantity: number;
//   value: number;
//   daysInactive: number;
// }

// @Component({
//   selector: 'app-dead-stock-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     ProgressSpinnerModule, 
//     TooltipModule, 
//     TagModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="deadstock-container">

//       <div class="header-section">
//         <div>
//           <h2 class="page-title">Dead Stock Audit</h2>
//           <p class="page-subtitle">
//             Identifying inventory with zero movement for over 90 days
//           </p>
//         </div>
//         <div class="action-group">
//            <p-button label="Export Report" icon="pi pi-file-pdf" severity="secondary" [outlined]="true" size="small"></p-button>
//            <p-button label="Clear Inventory" icon="pi pi-bolt" severity="danger" size="small"></p-button>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card locked-card">
//             <p class="kpi-label">Capital Locked</p>
//             <h2 class="kpi-value error">₹{{ totalValueLocked() | number }}</h2>
//             <p class="kpi-meta">Across {{ deadStock().length }} Unique SKUs</p>
//             <div class="bg-icon">
//               <i class="pi pi-lock"></i>
//             </div>
//           </div>

//           <div class="kpi-card units-card">
//             <p class="kpi-label">Non-Moving Units</p>
//             <h2 class="kpi-value primary">{{ totalUnits() | number }}</h2>
//             <p class="kpi-alert">90+ Days of Inactivity</p>
//           </div>

//           <div class="kpi-card risk-card">
//             <p class="kpi-label">Highest Single Risk</p>
//             <h3 class="risk-name" [title]="deadStock()[0]?.name">{{ deadStock()[0]?.name }}</h3>
//             <div class="risk-footer">
//                <span class="risk-value">₹{{ deadStock()[0]?.value | number }}</span>
//                <span class="badge critical">Critical</span>
//             </div>
//           </div>
//         </div>

//         <div class="table-card">
//           <div class="card-header">
//             <h3 class="card-title">Inventory Liquidation Priority</h3>
//             <span class="header-tag">SORTED BY CAPITAL VALUE</span>
//           </div>

//           <div class="grid-container">
//              <app-ag-share-grid 
//                [columns]="stockColumns" 
//                [data]="deadStock()" 
//                [showActions]="false" 
//                class="full-size-grid">
//              </app-ag-share-grid>
//           </div>
//         </div>

//         <div class="advisory-box">
//           <i class="pi pi-exclamation-circle advisory-icon"></i>
//           <div>
//             <p class="advisory-title">Liquidation Notice</p>
//             <p class="advisory-text">
//               Inventory worth <span class="highlight">₹{{ totalValueLocked() | number }}</span> has exceeded the 90-day threshold. 
//               We recommend a 15% markdown or bundled promotion for the <span class="highlight-white">{{ deadStock()[0]?.name }}</span> and other high-value SKUs.
//             </p>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Auditing Stock Lifecycle...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .deadstock-container {
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
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//       position: relative;
//       overflow: hidden;
//       transition: var(--transition-base);
//     }
    
//     .locked-card:hover, .units-card:hover, .risk-card:hover {
//       box-shadow: var(--shadow-sm);
//       border-color: var(--border-secondary);
//     }

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
//     .kpi-value.error { color: var(--color-error); }
//     .kpi-value.primary { color: var(--text-primary); }

//     .kpi-meta {
//       margin-top: var(--spacing-sm);
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }

//     .kpi-alert {
//       margin-top: var(--spacing-sm);
//       font-size: var(--font-size-xs);
//       font-weight: bold;
//       color: var(--color-warning);
//     }

//     .bg-icon {
//       position: absolute;
//       bottom: -10px;
//       right: -10px;
//       opacity: 0.05;
//       font-size: 4rem;
//       pointer-events: none;
//       color: var(--text-primary);
//     }

//     /* RISK CARD SPECIFIC */
//     .risk-card {
//       background: var(--bg-ternary);
//       border-color: var(--border-secondary);
//     }

//     .risk-name {
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//     }

//     .risk-footer {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-end;
//       margin-top: var(--spacing-sm);
//     }

//     .risk-value {
//       font-weight: bold;
//       color: var(--color-error);
//       font-family: var(--font-mono);
//     }

//     .badge {
//       font-size: 10px;
//       padding: 2px 6px;
//       border-radius: 4px;
//       font-weight: bold;
//       text-transform: uppercase;
//       border: 1px solid transparent;
//     }
//     .badge.critical {
//       background: var(--color-error-bg);
//       color: var(--color-error);
//       border-color: var(--color-error-border);
//     }

//     /* TABLE CARD */
//     .table-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       overflow: hidden;
//       height: 100%;
//       min-height: 500px;
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

//     .header-tag {
//       font-size: 10px;
//       font-weight: bold;
//       color: var(--text-label);
//     }

//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* ADVISORY BOX */
//     .advisory-box {
//       margin-top: var(--spacing-lg);
//       padding: var(--spacing-md);
//       border: 1px dashed var(--border-secondary);
//       background: var(--color-error-bg); /* Subtle red tint */
//       border-radius: var(--ui-border-radius-lg);
//       display: flex;
//       align-items: flex-start;
//       gap: var(--spacing-md);
//     }

//     .advisory-icon { color: var(--color-error); margin-top: 2px; }

//     .advisory-title {
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-sm);
//       color: var(--text-primary);
//       margin: 0 0 2px 0;
//     }

//     .advisory-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       margin: 0;
//       line-height: 1.4;
//     }

//     .highlight { color: var(--color-error); font-weight: bold; }
//     .highlight-white { color: var(--text-primary); font-weight: bold; }

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
// export class DeadStockAnalysisComponent implements OnInit {
//   deadStock = signal<DeadStockItem[]>([]);
//   loading = signal<boolean>(true);
//   stockColumns: any[] = [];

//   // Computed totals for the KPI cards
//   totalValueLocked = computed(() => this.deadStock().reduce((acc, item) => acc + item.value, 0));
//   totalUnits = computed(() => this.deadStock().reduce((acc, item) => acc + item.quantity, 0));

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
//     // Grid columns using theme variables
//     this.stockColumns = [
//       {
//         field: 'name', 
//         headerName: 'Product Detail', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 200,
//         cellRenderer: (params: any) => {
//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%;">
//                     <span style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-base);">${params.value}</span>
//                     <span style="font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); margin-top: 2px;">${params.data.sku}</span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'quantity', 
//         headerName: 'Qty', 
//         sortable: true, 
//         width: 100,
//         type: 'rightAligned',
//         cellStyle: { 'font-family': 'var(--font-mono)', 'font-weight': '700', 'text-align': 'right', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'value', 
//         headerName: 'Value Locked', 
//         sortable: true, 
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: (params: any) => {
//            return { 
//              'font-weight': '700', 
//              'color': params.value > 2000000 ? 'var(--color-error)' : 'var(--text-primary)',
//              'text-align': 'right' 
//            };
//         }
//       },
//       {
//         field: 'daysInactive', 
//         headerName: 'Days Idle', 
//         sortable: true, 
//         width: 100,
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-warning)', 'text-align': 'center' }
//       },
//       {
//         headerName: 'Strategy',
//         width: 140,
//         cellRenderer: (params: any) => {
//            // Using inline styles for buttons inside grid renderer (simulating components)
//            return `<div style="display: flex; gap: 4px; justify-content: center;">
//                      <button style="background: var(--accent-focus); border: 1px solid var(--accent-secondary); color: var(--accent-primary); padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer;" title="Flash Sale">SALE</button>
//                      <button style="background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); color: var(--color-warning); padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; cursor: pointer;" title="Branch Transfer">MOVE</button>
//                    </div>`;
//         },
//         cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getDeadStockReport().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.deadStock.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
