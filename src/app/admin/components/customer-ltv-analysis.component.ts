import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { MasterListService } from '../../core/services/master-list.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-customer-ltv-analysis',
  standalone: true,
  imports: [
    CommonModule, ProgressSpinnerModule, TooltipModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="ltv-root">

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="ltv-analysis"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" styleClass="w-12 h-12"></p-progressSpinner>
      <span class="loader-text">Reconstructing customer lifecycles…</span>
    </div>
  }

  <!-- Content -->
  @if (!loading()) {

    <!-- KPI strip -->
    <div class="kpi-strip">

      <div class="kpi-card">
        <p class="kpi-label">Total Network LTV</p>
        <p class="kpi-value">{{ commonService.formatCurrency(calculateTotalLTV()) }}</p>
      </div>

      <div class="kpi-card">
        <p class="kpi-label">Avg Customer Value</p>
        <p class="kpi-value kpi-value--accent">{{ commonService.formatCurrency(ltvData()?.summary?.avgLTV) }}</p>
      </div>

      <!-- Gradient performer card -->
      <div class="kpi-card kpi-card--performer">
        <div class="performer-info">
          <p class="performer-label">Top Performer</p>
          <p class="performer-name">{{ getTopCustomerName() }}</p>
        </div>
        <div class="performer-icon-wrap">
          <i class="pi pi-star-fill"></i>
        </div>
      </div>

    </div>

    <!-- Body grid -->
    <div class="body-grid">

      <!-- LTV ranking grid -->
      <div class="panel panel--flush">
        <div class="panel-head">
          <h3 class="panel-title">Lifetime Value Ranking</h3>
          <button class="export-btn" pTooltip="Export" tooltipPosition="bottom">
            <i class="pi pi-download"></i>
          </button>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="ltvColumns"
            [data]="ltvData()?.customers || []"
            [showActions]="false"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

      <!-- Side: Top contributor + retention nudge -->
      <div class="side-col">

        @if (getTopCustomer()) {
          <div class="panel panel--tinted">
            <h4 class="widget-title">Top Contributor Details</h4>

            <div class="profile-center">
              <div class="avatar-circle">{{ getTopCustomer().name.charAt(0).toUpperCase() }}</div>
              <p class="profile-name">{{ getTopCustomer().name }}</p>
              <span class="profile-badge">{{ getTopCustomer().tier || 'VIP' }}</span>
            </div>

            <div class="stats-rows">
              <div class="stats-row">
                <span class="stats-label">Avg Ticket Size</span>
                <span class="stats-val">{{ commonService.formatCurrency(getTopCustomer().avgOrder) }}</span>
              </div>
              <div class="stats-row">
                <span class="stats-label">Total Contribution</span>
                <span class="stats-val">{{ commonService.formatCurrency(getTopCustomer().ltv) }}</span>
              </div>
            </div>
          </div>
        }

        <div class="panel panel--retention">
          <h4 class="widget-title widget-title--success">Retention Trigger</h4>
          <p class="retention-text">
            <i class="pi pi-bolt retention-icon"></i>
            High value detected for
            <strong class="retention-name">{{ getTopCustomerName() }}</strong>.
            Triggering a VIP concierge invite could increase retention.
          </p>
        </div>

      </div>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   CUSTOMER LTV ANALYSIS — TOKEN-DRIVEN
   .kpi-card--performer and .avatar-circle use var(--accent-gradient)
   which is a canonical token from apply-canonical-mapping.
   Text on those surfaces uses #fff — intentionally fixed for
   legibility on any accent-gradient background.
   Tier colors in setupColumns() (Platinum/Gold) use semantic
   token variables so they fully adapt to the active theme.
   ============================================================ */

:host { display: block; width: 100%; }

.ltv-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Filter bar ── */
.filter-bar { flex-shrink: 0; }

/* ── Loader ── */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-5xl);
  min-height: 300px;
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex-shrink: 0;

  @media (min-width: 768px) { grid-template-columns: repeat(3, 1fr); }
}

.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-base);

  &:hover { box-shadow: var(--shadow-sm); border-color: var(--border-secondary); }

  &--performer {
    background: var(--accent-gradient);
    border: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-lg);
  }
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-sm) 0;
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);

  &--accent { color: var(--accent-primary); }
}

/* Performer card internals */
.performer-info { flex: 1; min-width: 0; }

.performer-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  /* White on gradient — intentionally fixed */
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 var(--spacing-xs) 0;
}

.performer-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: #fff;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.performer-icon-wrap {
  width: 3rem;
  height: 3rem;
  border-radius: var(--ui-border-radius-pill);
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  i { font-size: var(--font-size-xl); color: #fff; }
}

/* ══════════════════════════════════════════════════════════
   BODY GRID
   ══════════════════════════════════════════════════════════ */
.body-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;

  @media (min-width: 1024px) { grid-template-columns: 2fr 1fr; }
}

/* ── Shared panel ── */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  &--flush {
    padding: 0;
    overflow: hidden;
    min-height: 400px;
  }

  &--tinted {
    background: var(--bg-ternary);
    border-color: var(--border-secondary);
  }

  &--retention {
    border: var(--ui-border-width) dashed var(--color-success-border);
    background: var(--color-success-bg);
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

.widget-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0;

  &--success { color: var(--color-success); }
}

.export-btn {
  width: 28px;
  height: 28px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);

  &:hover { background: var(--component-bg-hover); color: var(--accent-primary); }
}

/* Grid wrap */
.grid-wrap {
  flex: 1;
  position: relative;
  min-height: 0;
}

.fill-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* Side column */
.side-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ── Profile block ── */
.profile-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.avatar-circle {
  width: 4rem;
  height: 4rem;
  border-radius: var(--ui-border-radius-pill);
  background: var(--accent-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  /* White on gradient — intentionally fixed */
  color: #fff;
  box-shadow: var(--shadow-md);
  flex-shrink: 0;
}

.profile-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.profile-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--accent-primary);
  background: var(--accent-focus);
  border: var(--ui-border-width) solid var(--accent-primary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
}

/* Stats rows */
.stats-rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: var(--ui-border-width) solid var(--border-primary);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
}

.stats-label { color: var(--text-tertiary); }
.stats-val   { font-weight: var(--font-weight-semibold); color: var(--text-primary); font-family: var(--font-mono); }

/* Retention text */
.retention-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.retention-icon { color: var(--color-warning); margin-right: var(--spacing-xs); }

.retention-name {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}
  `]
})
export class CustomerLtvAnalysisComponent implements OnInit {
  public  masterList       = inject(MasterListService);
  public  commonService    = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr              = inject(ChangeDetectorRef);

  ltvData   = signal<any>(null);
  loading   = signal(false);
  ltvColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

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

  ngOnInit(): void { this.setupColumns(); }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getCustomerLifetimeValue(this.currentFilters['branchId']).subscribe({
      next: (res) => {
        if (res.status === 'success') this.ltvData.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  calculateTotalLTV(): number {
    return (this.ltvData()?.customers ?? []).reduce((s: number, c: any) => s + (c.ltv ?? 0), 0);
  }

  getTopCustomer(): any {
    const customers: any[] = this.ltvData()?.customers ?? [];
    if (!customers.length) return null;
    return [...customers].sort((a, b) => b.ltv - a.ltv)[0];
  }

  getTopCustomerName(): string {
    return this.getTopCustomer()?.name ?? '—';
  }

  setupColumns(): void {
    this.ltvColumns = [
      {
        headerName: 'Rank',
        width: 70,
        sortable: false,
        cellRenderer: (p: any) => {
          const rank = (p.node.rowIndex ?? 0) + 1;
          return `<span style="font-weight:var(--font-weight-semibold);opacity:.5;color:var(--text-tertiary);">#${rank}</span>`;
        },
        cellStyle: { 'text-align': 'center', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      },
      {
        field: 'name',
        headerName: 'Customer',
        flex: 1,
        minWidth: 200,
        cellRenderer: (p: any) => {
          const tier = p.data.tier || 'Standard';
          // Tier styles use semantic tokens — fully theme-adaptive
          const tierStyles: Record<string, string> = {
            Platinum: 'color:var(--accent-primary);background:var(--accent-focus);border:1px solid var(--accent-primary);',
            Gold:     'color:var(--color-warning);background:var(--color-warning-bg);border:1px solid var(--color-warning-border);',
          };
          const tierStyle = tierStyles[tier] ?? 'color:var(--text-secondary);background:var(--bg-ternary);border:1px solid var(--border-secondary);';
          return `<div style="display:flex;flex-direction:column;justify-content:center;height:100%;overflow:hidden;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-weight:var(--font-weight-semibold);color:var(--text-primary);font-size:var(--font-size-base);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.value}">${p.value}</span>
                      <span style="padding:1px 5px;border-radius:4px;font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);text-transform:uppercase;flex-shrink:0;${tierStyle}">${tier}</span>
                    </div>
                    <span style="font-size:var(--font-size-xs);color:var(--text-tertiary);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.data._id}">
                      ID: …${p.data._id.slice(-6)}
                    </span>
                  </div>`;
        }
      },
      {
        field: 'avgOrder',
        headerName: 'Avg Ticket',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => p.value == null ? '—' : '₹' + Math.round(p.value).toLocaleString(),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-xs)',
          'color': 'var(--text-secondary)',
          'text-align': 'right'
        }
      },
      {
        field: 'ltv',
        headerName: 'Lifetime Value',
        width: 140,
        type: 'rightAligned',
        valueFormatter: (p: any) => p.value == null ? '—' : '₹' + p.value.toLocaleString(),
        cellStyle: {
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--color-success)',
          'text-align': 'right'
        }
      }
    ];
    this.cdr.detectChanges();
  }
}
// import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { MasterListService } from '../../core/services/master-list.service'; // Ensure this is imported
// import { CommonMethodService } from '../../core/utils/common-method.service'; // Added CommonMethodService

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-customer-ltv-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     ProgressSpinnerModule, 
//     TooltipModule,
//     AgShareGrid,
//     UniversalFilterComponent
//   ],
//   template: `
//     <div class="ltv-container">

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'ltv-analysis'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card total-ltv">
//             <p class="kpi-label">Total Network LTV</p>
//             <h2 class="kpi-value">{{ commonService.formatCurrency(calculateTotalLTV()) }}</h2>
//           </div>

//           <div class="kpi-card avg-value">
//             <p class="kpi-label">Avg Customer Value</p>
//             <h2 class="kpi-value highlight">{{ commonService.formatCurrency(ltvData()?.summary?.avgLTV) }}</h2>
//           </div>

//           <div class="kpi-card performer-card">
//             <div class="performer-info">
//               <p class="performer-label">Top Performer</p>
//               <h3 class="performer-name">{{ getTopCustomerName() }}</h3>
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
            
//             <div class="side-card profile-card" *ngIf="getTopCustomer()">
//               <h4 class="side-title mb-lg">Top Contributor Details</h4>
              
//               <div class="profile-header">
//                 <div class="avatar-circle">
//                   {{ getTopCustomer().name.charAt(0) }}
//                 </div>
//                 <p class="profile-name">{{ getTopCustomer().name }}</p>
//                 <span class="profile-badge">{{ getTopCustomer().tier || 'VIP' }}</span>
//               </div>

//               <div class="stats-list">
//                 <div class="stat-row">
//                   <span class="stat-label">Avg Ticket Size</span>
//                   <span class="stat-value">{{ commonService.formatCurrency(getTopCustomer().avgOrder) }}</span>
//                 </div>
//                 <div class="stat-row">
//                   <span class="stat-label">Total Contribution</span>
//                   <span class="stat-value">{{ commonService.formatCurrency(getTopCustomer().ltv) }}</span>
//                 </div>
//               </div>
//             </div>

//             <div class="side-card retention-card">
//               <h4 class="side-title success mb-sm">Retention Trigger</h4>
//               <p class="retention-text">
//                 <i class="pi pi-bolt retention-icon"></i>
//                 High value detected for <span class="highlight-text">{{ getTopCustomerName() }}</span>. 
//                 Triggering a VIP concierge invite could increase retention.
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
//     :host { display: block; width: 100%; }

//     .ltv-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* Filter Section */
//     .filter-section { margin-bottom: var(--spacing-lg); }

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
//       border-radius: var(--radius-2xl);
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
//       border-radius: var(--radius-2xl);
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
//       border-radius: var(--radius-2xl);
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
//   // Injections
//   public masterList = inject(MasterListService); 
//   public commonService = inject(CommonMethodService); // Injected here
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr = inject(ChangeDetectorRef);

//   // Signals
//   ltvData = signal<any>(null);
//   loading = signal<boolean>(false);
//   ltvColumns: any[] = [];

//   // Filter State
//   private currentFilters: any = {};

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches', // Binds to MasterListService.branches()
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Network Average'
//     }
//   ];

//   ngOnInit() {
//     this.setupColumns();
//     // loadData triggers on filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
    
//     const branchId = this.currentFilters.branchId;

//     this.analyticsService.getCustomerLifetimeValue(branchId).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.ltvData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   // Helper Methods
//   calculateTotalLTV(): number {
//     const customers = this.ltvData()?.customers || [];
//     return customers.reduce((sum: number, c: any) => sum + (c.ltv || 0), 0);
//   }

//   getTopCustomer() {
//     const customers = this.ltvData()?.customers || [];
//     if (customers.length === 0) return null;
//     // Assuming the list is sorted by LTV descending, or we sort it
//     return customers.sort((a: any, b: any) => b.ltv - a.ltv)[0];
//   }

//   getTopCustomerName(): string {
//     const top = this.getTopCustomer();
//     return top ? top.name : '--';
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
//                     <span style="font-size: 11px; color: var(--text-tertiary); margin-top: 3px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${params.data._id}">
//                       ID: ...${params.data._id.slice(-6)}
//                     </span>
//                   </div>`;
//         }
//       },
//       {
//         field: 'avgOrder', 
//         headerName: 'Avg Ticket', 
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => {
//            if(params.value == null) return '-';
//            return '₹' + Math.round(params.value).toLocaleString();
//         },
//         cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px', 'color': 'var(--text-secondary)' }
//       },
//       {
//         field: 'ltv', 
//         headerName: 'Lifetime Value', 
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => {
//            if(params.value == null) return '-';
//            return '₹' + params.value.toLocaleString();
//         },
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-success)', 'text-align': 'right' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }
