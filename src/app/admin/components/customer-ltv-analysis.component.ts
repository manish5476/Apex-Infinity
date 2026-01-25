import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { MasterListService } from '../../core/services/master-list.service'; // Ensure this is imported

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-customer-ltv-analysis',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    ProgressSpinnerModule, 
    TooltipModule,
    AgShareGrid,
    UniversalFilterComponent // <--- Imported
  ],
  template: `
    <div class="ltv-container">

      <div class="filter-section">
        <app-universal-filter
          [entityType]="'ltv-analysis'"
          [config]="filterConfig"
          (filterChange)="onFilterUpdate($event)">
        </app-universal-filter>
      </div>

      <ng-container *ngIf="!loading(); else loader">
        
        <div class="kpi-grid">
          
          <div class="kpi-card total-ltv">
            <p class="kpi-label">Total Network LTV</p>
            <h2 class="kpi-value">₹{{ ltvData()?.summary?.totalLTV | number }}</h2>
          </div>

          <div class="kpi-card avg-value">
            <p class="kpi-label">Avg Customer Value</p>
            <h2 class="kpi-value highlight">₹{{ ltvData()?.summary?.avgLTV | number:'1.0-0' }}</h2>
          </div>

          <div class="kpi-card performer-card">
            <div class="performer-info">
              <p class="performer-label">Top Performer</p>
              <h3 class="performer-name">{{ ltvData()?.summary?.topCustomer?.name }}</h3>
            </div>
            <div class="star-badge">
              <i class="pi pi-star-fill star-icon"></i>
            </div>
          </div>
        </div>

        <div class="content-grid">
          
          <div class="main-column">
            <div class="grid-card">
              <div class="grid-header">
                <h3 class="grid-title">Lifetime Value Ranking</h3>
                <p-button icon="pi pi-download" [text]="true" size="small" severity="secondary"></p-button>
              </div>

              <div class="grid-container">
                 <app-ag-share-grid 
                   [columns]="ltvColumns" 
                   [data]="ltvData()?.customers || []" 
                   [showActions]="false" 
                   class="full-size-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="side-column">
            
            <div class="side-card profile-card">
              <h4 class="side-title mb-lg">Top Contributor Details</h4>
              
              <div class="profile-header">
                <div class="avatar-circle">
                  {{ ltvData()?.summary?.topCustomer?.name.charAt(0) }}
                </div>
                <p class="profile-name">{{ ltvData()?.summary?.topCustomer?.name }}</p>
                <span class="profile-badge">High-Ticket Buyer</span>
              </div>

              <div class="stats-list">
                <div class="stat-row">
                  <span class="stat-label">Avg Ticket Size</span>
                  <span class="stat-value">₹{{ ltvData()?.summary?.topCustomer?.avgOrderValue | number }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Frequency</span>
                  <span class="stat-value">{{ ltvData()?.summary?.topCustomer?.transactionCount }} Orders</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Account Lifespan</span>
                  <span class="stat-value">{{ ltvData()?.summary?.topCustomer?.lifespanDays | number:'1.1-1' }} Days</span>
                </div>
              </div>
            </div>

            <div class="side-card retention-card">
              <h4 class="side-title success mb-sm">Retention Trigger</h4>
              <p class="retention-text">
                <i class="pi pi-bolt retention-icon"></i>
                High AOV detected for <span class="highlight-text">{{ ltvData()?.customers[0]?.name }}</span>. 
                Triggering a VIP concierge invite could increase retention by 15%.
              </p>
            </div>
          </div>
        </div>

      </ng-container>

      <ng-template #loader>
        <div class="loader-container">
          <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
          <p class="loader-text">Reconstructing customer lifecycles...</p>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .ltv-container {
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      font-family: var(--font-body);
      min-height: 100%;
    }

    /* Filter Section */
    .filter-section { margin-bottom: var(--spacing-lg); }

    /* KPI GRID */
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }
    @media(min-width: 768px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }

    /* KPI CARDS */
    .kpi-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
      transition: var(--transition-base);
    }
    .kpi-card:hover {
      box-shadow: var(--shadow-sm);
      border-color: var(--border-secondary);
    }

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
      color: var(--text-primary);
      margin: 0;
      font-family: var(--font-heading);
    }
    .kpi-value.highlight { color: var(--accent-primary); }

    /* PERFORMER CARD (Accented) */
    .performer-card {
      background: var(--accent-gradient);
      border: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #ffffff; /* Always white on gradient */
    }

    .performer-info { color: #ffffff; }
    
    .performer-label {
      font-size: var(--font-size-xs);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.9;
      margin: 0 0 2px 0;
    }

    .performer-name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .star-badge {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
    }
    .star-icon { font-size: 1.25rem; color: #ffffff; }

    /* CONTENT GRID */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
    }
    @media(min-width: 1024px) {
      .content-grid { grid-template-columns: 2fr 1fr; }
    }

    /* GRID CARD */
    .grid-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      overflow: hidden;
      height: 100%;
      min-height: 400px;
      display: flex;
      flex-direction: column;
    }

    .grid-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-ternary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .grid-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-primary);
      margin: 0;
    }

    .grid-container { flex: 1; position: relative; }
    .full-size-grid { width: 100%; height: 100%; display: block; }

    /* SIDE COLUMN */
    .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

    .side-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-lg);
    }

    .profile-card { background: var(--bg-ternary); border-color: var(--border-secondary); }

    .side-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      color: var(--text-label);
      margin: 0;
    }
    .side-title.mb-lg { margin-bottom: var(--spacing-lg); }
    .side-title.mb-sm { margin-bottom: var(--spacing-sm); }
    .side-title.success { color: var(--color-success); }

    /* PROFILE HEADER */
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: var(--spacing-lg);
    }

    .avatar-circle {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffffff;
      box-shadow: var(--shadow-md);
      margin-bottom: var(--spacing-sm);
    }

    .profile-name {
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .profile-badge {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      color: var(--accent-primary);
      background: var(--accent-focus);
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* STATS LIST */
    .stats-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--border-primary);
    }

    .stat-row { display: flex; justify-content: space-between; font-size: var(--font-size-xs); }
    .stat-label { color: var(--text-tertiary); }
    .stat-value { font-weight: bold; color: var(--text-primary); }

    /* RETENTION CARD */
    .retention-card {
      border: 1px dashed var(--color-success);
      background: var(--color-success-bg);
    }

    .retention-text {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 0;
    }
    .retention-icon { margin-right: 4px; color: var(--color-warning); }
    .highlight-text { font-weight: bold; color: var(--text-primary); }

    /* LOADER */
    .loader-container {
      height: 50vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
    }
    .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }
  `]
})
export class CustomerLtvAnalysisComponent implements OnInit {
  // Injections
  public masterList = inject(MasterListService); // Needed for branch dropdown
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  // Signals
  ltvData = signal<any>(null);
  loading = signal<boolean>(false);
  ltvColumns: any[] = [];

  // Filter State
  private currentFilters: any = {};

  // 1. FILTER CONFIG
  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches', // Binds to MasterListService.branches()
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Network Average'
    }
  ];

  ngOnInit() {
    this.setupColumns();
    // loadData triggers on filter init
  }

  // 2. FILTER HANDLER
  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    
    // Pass branchId if selected, otherwise undefined for global
    const branchId = this.currentFilters.branchId;

    this.analyticsService.getCustomerLifetimeValue(branchId).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.ltvData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.ltvColumns = [
      {
        headerName: 'Rank',
        width: 70,
        sortable: false,
        cellRenderer: (params: any) => {
          const rank = (params.node.rowIndex || 0) + 1;
          return `<span style="font-weight: 700; opacity: 0.5; color: var(--text-tertiary);">#${rank}</span>`;
        },
        cellStyle: { 'text-align': 'center', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      },
      {
        field: 'name', 
        headerName: 'Customer', 
        sortable: true, 
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const tier = params.data.tier || 'Standard';
          let colorStyle = 'color: var(--text-secondary); background: var(--bg-ternary); border: 1px solid var(--border-secondary);';

          if(tier === 'Platinum') { 
            colorStyle = 'color: var(--accent-primary); background: var(--accent-focus); border: 1px solid var(--accent-secondary);';
          }
          else if(tier === 'Gold') { 
            colorStyle = 'color: var(--color-warning); background: var(--color-warning-bg); border: 1px solid var(--color-warning-border);';
          }
          
          return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; width: 100%; overflow: hidden;">
                    <div style="display: flex; align-items: center; gap: 6px; width: 100%;">
                      <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-base); line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${params.value}">
                        ${params.value}
                      </span>
                      <span style="padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0; line-height: 1; ${colorStyle}">
                        ${tier}
                      </span>
                    </div>
                    <span style="font-size: 11px; color: var(--text-tertiary); margin-top: 3px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${params.data.email || ''}">
                      ${params.data.email || ''}
                    </span>
                  </div>`;
        }
      },
      {
        field: 'avgOrderValue', 
        headerName: 'AOV', 
        sortable: true, 
        width: 100,
        type: 'rightAligned',
        valueFormatter: (params: any) => {
           if(params.value == null) return '-';
           return '₹' + Math.round(params.value).toLocaleString();
        },
        cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px', 'color': 'var(--text-secondary)' }
      },
      {
        field: 'totalSpent', 
        headerName: 'Total Spent', 
        sortable: true, 
        width: 120,
        type: 'rightAligned',
        valueFormatter: (params: any) => {
           if(params.value == null) return '-';
           return '₹' + params.value.toLocaleString();
        },
        cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right' }
      },
      {
        field: 'valueScore', 
        headerName: 'Score', 
        sortable: true, 
        width: 100,
        cellRenderer: (params: any) => {
           const val = params.value || 0;
           return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 2px;">
                     <span style="font-size: 10px; font-weight: 700; color: var(--text-primary);">${val.toFixed(0)}%</span>
                     <div style="width: 100%; height: 3px; background: var(--bg-ternary); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${val}%; height: 100%; background: var(--accent-primary);"></div>
                     </div>
                    </div>`;
        }
      }
    ];
    this.cdr.detectChanges();
  }
}

// import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';

// @Component({
//   selector: 'app-customer-ltv-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     ProgressSpinnerModule, 
//     TooltipModule,
//     AgShareGrid
//   ],
//   template: `
//     <div class="ltv-container">

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card total-ltv">
//             <p class="kpi-label">Total Network LTV</p>
//             <h2 class="kpi-value">₹{{ ltvData()?.summary?.totalLTV | number }}</h2>
//           </div>

//           <div class="kpi-card avg-value">
//             <p class="kpi-label">Avg Customer Value</p>
//             <h2 class="kpi-value highlight">₹{{ ltvData()?.summary?.avgLTV | number:'1.0-0' }}</h2>
//           </div>

//           <div class="kpi-card performer-card">
//             <div class="performer-info">
//               <p class="performer-label">Top Performer</p>
//               <h3 class="performer-name">{{ ltvData()?.summary?.topCustomer?.name }}</h3>
//             </div>
//             <div class="star-badge">
//               <i class="pi pi-star-fill star-icon"></i>
//             </div>
//           </div>
//         </div>

//         <div class="content-grid">
          
//           <div class="main-column">
//             <div class="grid-card">
//               <div class="grid-header">
//                 <h3 class="grid-title">Lifetime Value Ranking</h3>
//                 <p-button icon="pi pi-download" [text]="true" size="small" severity="secondary"></p-button>
//               </div>

//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="ltvColumns" 
//                    [data]="ltvData()?.customers || []" 
//                    [showActions]="false" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//           <div class="side-column">
            
//             <div class="side-card profile-card">
//               <h4 class="side-title mb-lg">Top Contributor Details</h4>
              
//               <div class="profile-header">
//                 <div class="avatar-circle">
//                   {{ ltvData()?.summary?.topCustomer?.name.charAt(0) }}
//                 </div>
//                 <p class="profile-name">{{ ltvData()?.summary?.topCustomer?.name }}</p>
//                 <span class="profile-badge">High-Ticket Buyer</span>
//               </div>

//               <div class="stats-list">
//                 <div class="stat-row">
//                   <span class="stat-label">Avg Ticket Size</span>
//                   <span class="stat-value">₹{{ ltvData()?.summary?.topCustomer?.avgOrderValue | number }}</span>
//                 </div>
//                 <div class="stat-row">
//                   <span class="stat-label">Frequency</span>
//                   <span class="stat-value">{{ ltvData()?.summary?.topCustomer?.transactionCount }} Orders</span>
//                 </div>
//                 <div class="stat-row">
//                   <span class="stat-label">Account Lifespan</span>
//                   <span class="stat-value">{{ ltvData()?.summary?.topCustomer?.lifespanDays | number:'1.1-1' }} Days</span>
//                 </div>
//               </div>
//             </div>

//             <div class="side-card retention-card">
//               <h4 class="side-title success mb-sm">Retention Trigger</h4>
//               <p class="retention-text">
//                 <i class="pi pi-bolt retention-icon"></i>
//                 High AOV detected for <span class="highlight-text">{{ ltvData()?.customers[0]?.name }}</span>. 
//                 Triggering a VIP concierge invite could increase retention by 15%.
//               </p>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Reconstructing customer lifecycles...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     /* HOST & LAYOUT */
//     :host { display: block; width: 100%; }

//     .ltv-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* KPI GRID */
//     .kpi-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//       margin-bottom: var(--spacing-lg);
//     }
//     @media(min-width: 768px) {
//       .kpi-grid { grid-template-columns: repeat(3, 1fr); }
//     }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//     }
//     .kpi-card:hover {
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
//       color: var(--text-primary);
//       margin: 0;
//       font-family: var(--font-heading);
//     }
//     .kpi-value.highlight { color: var(--accent-primary); }

//     /* PERFORMER CARD (Accented) */
//     .performer-card {
//       background: var(--accent-gradient);
//       border: none;
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       color: #ffffff; /* Always white on gradient */
//     }

//     .performer-info { color: #ffffff; }
    
//     .performer-label {
//       font-size: var(--font-size-xs);
//       font-weight: 900;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       opacity: 0.9;
//       margin: 0 0 2px 0;
//     }

//     .performer-name {
//       font-size: var(--font-size-lg);
//       font-weight: var(--font-weight-bold);
//       margin: 0;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       max-width: 140px;
//     }

//     .star-badge {
//       width: 3rem;
//       height: 3rem;
//       border-radius: 50%;
//       background: rgba(255, 255, 255, 0.2);
//       border: 1px solid rgba(255, 255, 255, 0.3);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       box-shadow: var(--shadow-md);
//     }
//     .star-icon { font-size: 1.25rem; color: #ffffff; }

//     /* CONTENT GRID */
//     .content-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: var(--spacing-lg);
//     }
//     @media(min-width: 1024px) {
//       .content-grid { grid-template-columns: 2fr 1fr; }
//     }

//     /* GRID CARD */
//     .grid-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       overflow: hidden;
//       height: 100%;
//       min-height: 400px;
//       display: flex;
//       flex-direction: column;
//     }

//     .grid-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-ternary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .grid-title {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-primary);
//       margin: 0;
//     }

//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* SIDE COLUMN */
//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }

//     .side-card {
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-lg);
//     }

//     .profile-card { background: var(--bg-ternary); border-color: var(--border-secondary); }

//     .side-title {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       color: var(--text-label);
//       margin: 0;
//     }
//     .side-title.mb-lg { margin-bottom: var(--spacing-lg); }
//     .side-title.mb-sm { margin-bottom: var(--spacing-sm); }
//     .side-title.success { color: var(--color-success); }

//     /* PROFILE HEADER */
//     .profile-header {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       margin-bottom: var(--spacing-lg);
//     }

//     .avatar-circle {
//       width: 4rem;
//       height: 4rem;
//       border-radius: 50%;
//       background: var(--accent-gradient);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1.5rem;
//       font-weight: bold;
//       color: #ffffff;
//       box-shadow: var(--shadow-md);
//       margin-bottom: var(--spacing-sm);
//     }

//     .profile-name {
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 4px 0;
//     }

//     .profile-badge {
//       font-size: 10px;
//       font-weight: bold;
//       text-transform: uppercase;
//       color: var(--accent-primary);
//       background: var(--accent-focus);
//       padding: 2px 8px;
//       border-radius: 4px;
//     }

//     /* STATS LIST */
//     .stats-list {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//       padding-top: var(--spacing-md);
//       border-top: 1px solid var(--border-primary);
//     }

//     .stat-row { display: flex; justify-content: space-between; font-size: var(--font-size-xs); }
//     .stat-label { color: var(--text-tertiary); }
//     .stat-value { font-weight: bold; color: var(--text-primary); }

//     /* RETENTION CARD */
//     .retention-card {
//       border: 1px dashed var(--color-success);
//       background: var(--color-success-bg);
//     }

//     .retention-text {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       line-height: 1.5;
//       margin: 0;
//     }
//     .retention-icon { margin-right: 4px; color: var(--color-warning); }
//     .highlight-text { font-weight: bold; color: var(--text-primary); }

//     /* LOADER */
//     .loader-container {
//       height: 50vh;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-md);
//     }
//     .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }
//   `]
// })
// export class CustomerLtvAnalysisComponent implements OnInit {
//   ltvData = signal<any>(null);
//   loading = signal<boolean>(true);
//   ltvColumns: any[] = [];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     private cdr: ChangeDetectorRef
//   ) { }

//   ngOnInit() {
//     this.setupColumns();
//     this.loadData();
//   }

//   setupColumns(): void {
//     this.ltvColumns = [
//       {
//         headerName: 'Rank',
//         width: 70,
//         sortable: false,
//         cellRenderer: (params: any) => {
//           const rank = (params.node.rowIndex || 0) + 1;
//           return `<span style="font-weight: 700; opacity: 0.5; color: var(--text-tertiary);">#${rank}</span>`;
//         },
//         cellStyle: { 'text-align': 'center', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
//       },
//       {
//         field: 'name', 
//         headerName: 'Customer', 
//         sortable: true, 
//         flex: 1,
//         minWidth: 200,
//         cellRenderer: (params: any) => {
//           const tier = params.data.tier || 'Standard';
//           // Using CSS variables for Tier styling
//           let tierClass = 'tier-standard';
//           let colorStyle = 'color: var(--text-secondary); background: var(--bg-ternary); border: 1px solid var(--border-secondary);';

//           if(tier === 'Platinum') { 
//             colorStyle = 'color: var(--accent-primary); background: var(--accent-focus); border: 1px solid var(--accent-secondary);';
//           }
//           else if(tier === 'Gold') { 
//             colorStyle = 'color: var(--color-warning); background: var(--color-warning-bg); border: 1px solid var(--color-warning-border);';
//           }
          
//           return `<div style="display: flex; flex-direction: column; justify-content: center; height: 100%; width: 100%; overflow: hidden;">
//                     <div style="display: flex; align-items: center; gap: 6px; width: 100%;">
//                       <span style="font-weight: 600; color: var(--text-primary); font-size: var(--font-size-base); line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${params.value}">
//                         ${params.value}
//                       </span>
//                       <span style="padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0; line-height: 1; ${colorStyle}">
//                         ${tier}
//                       </span>
//                     </div>
//                     <span style="font-size: 11px; color: var(--text-tertiary); margin-top: 3px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${params.data.email || ''}">
//                       ${params.data.email || ''}
//                     </span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'avgOrderValue', 
//         headerName: 'AOV', 
//         sortable: true, 
//         width: 100,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => {
//            if(params.value == null) return '-';
//            return '₹' + Math.round(params.value).toLocaleString();
//         },
//         cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'totalSpent', 
//         headerName: 'Total Spent', 
//         sortable: true, 
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => {
//            if(params.value == null) return '-';
//            return '₹' + params.value.toLocaleString();
//         },
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right' }
//       },
//       {
//         field: 'valueScore', 
//         headerName: 'Score', 
//         sortable: true, 
//         width: 100,
//         cellRenderer: (params: any) => {
//            const val = params.value || 0;
//            return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 2px;">
//                     <span style="font-size: 10px; font-weight: 700; color: var(--text-primary);">${val.toFixed(0)}%</span>
//                     <div style="width: 100%; height: 3px; background: var(--bg-ternary); border-radius: 2px; overflow: hidden;">
//                        <div style="width: ${val}%; height: 100%; background: var(--accent-primary);"></div>
//                     </div>
//                    </div>`;
//         }
//       }
//     ];
//     this.cdr.detectChanges();
//   }

//   loadData() {
//     this.loading.set(true);
//     this.analyticsService.getCustomerLifetimeValue().subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.ltvData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
