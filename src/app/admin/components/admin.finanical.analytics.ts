import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule, TooltipModule, ProgressSpinnerModule, TagModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="fin-root">

  <!-- ══════════════════════════════════════
       HEADER
  ═══════════════════════════════════════ -->
  <div class="page-header">
    <div>
      <h2 class="page-title">Financial Health Center</h2>
      <p class="page-sub">Real-time P&amp;L, Cash Flow, and Credit Risk Analysis</p>
    </div>
    <button class="export-btn" pTooltip="Download Report" tooltipPosition="bottom">
      <i class="pi pi-file-pdf"></i>
      <span>Download Report</span>
    </button>
  </div>

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="financial-dashboard"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- ══════════════════════════════════════
       LOADING
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3"></p-progressSpinner>
      <span class="loader-text">Compiling financial data…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading() && financialData()) {

    <!-- Top row: Profitability + Cash Flow -->
    <div class="top-grid">

      <!-- Profitability card -->
      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-label">Profitability Engine</h3>
          <span class="margin-badge"
                [class.margin-badge--positive]="(financialData()?.profitability?.marginPercent || 0) > 0">
            {{ financialData()?.profitability?.marginPercent || 0 | number:'1.1-1' }}% Margin
          </span>
        </div>

        <div class="profit-stats">
          <div class="profit-stat">
            <p class="stat-label">Total Revenue</p>
            <p class="stat-value">{{ commonService.formatCurrency(financialData()?.profitability?.revenue) }}</p>
          </div>
          <div class="profit-stat">
            <p class="stat-label">COGS</p>
            <p class="stat-value stat-value--error">{{ commonService.formatCurrency(financialData()?.profitability?.costOfGoodsSold) }}</p>
          </div>
          <div class="profit-stat profit-stat--highlight">
            <p class="stat-label">Gross Profit</p>
            <p class="stat-value stat-value--success">{{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}</p>
          </div>
        </div>

        @if ((financialData()?.recommendations?.recommendations?.length ?? 0) > 0) {
          <div class="alert-strip alert-strip--warning">
            <i class="pi pi-exclamation-circle"></i>
            <div>
              <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
              <p class="alert-sub">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
            </div>
          </div>
        } @else {
          <div class="alert-strip alert-strip--success">
            <i class="pi pi-check-circle"></i>
            <p class="alert-title">Financial health appears stable for this period.</p>
          </div>
        }
      </div>

      <!-- Cash flow card -->
      <div class="panel">
        <h3 class="panel-label">Liquidity Sources</h3>

        <div class="flow-list">
          @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
            <div class="flow-item">
              <div class="flow-row">
                <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
                <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill progress-fill--success"
                     [style.width.%]="(mode.value / (financialData()?.profitability?.revenue || 1)) * 100">
                </div>
              </div>
            </div>
          } @empty {
            <p class="empty-note">No cash transactions for selected criteria</p>
          }
        </div>

        <div class="panel-footer">
          <p class="footer-label">Estimated Tax Payable (GST)</p>
          <p class="footer-value footer-value--error">{{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}</p>
        </div>
      </div>

    </div>

    <!-- Bottom row: Credit Risk + Aging Grid -->
    <div class="bottom-grid">

      <!-- Credit portfolio -->
      <div class="panel">
        <div class="panel-head">
          <span class="head-icon"><i class="pi pi-credit-card"></i></span>
          <h3 class="panel-label">Credit Portfolio Risk</h3>
        </div>

        @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
          <div class="emi-layout">
            <div class="emi-stat">
              <p class="emi-total">{{ commonService.formatCurrency(emi.totalPortfolio) }}</p>
              <p class="emi-total-label">Total Exposure</p>
            </div>
            <div class="emi-details">
              <div class="emi-row">
                <div>
                  <p class="detail-label">Portfolio Status</p>
                  <p class="detail-value capitalize">{{ emi.status }}</p>
                </div>
                <div class="text-right">
                  <p class="detail-label">Collection Efficiency</p>
                  <p class="detail-value detail-value--success">{{ emi.collectionEfficiency }}%</p>
                </div>
              </div>
              <div class="default-section">
                <div class="default-head">
                  <span class="detail-label">Default Risk Rate</span>
                  <span class="default-pct">{{ (emi.defaultRate * 100) | number:'1.1-1' }}%</span>
                </div>
                <div class="progress-track progress-track--bordered">
                  <div class="progress-fill progress-fill--gradient" [style.width.%]="emi.defaultRate * 100"></div>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-panel">
            <i class="pi pi-verified"></i>
            <p class="empty-title">Clean Credit Sheet</p>
            <p class="empty-sub">No active EMIs or high-risk debts found.</p>
          </div>
        }
      </div>

      <!-- Receivables aging grid -->
      <div class="panel panel--flush">
        <div class="grid-head">
          <h4 class="panel-label">Receivables Aging Report</h4>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="agingColumns"
            [data]="financialData()?.receivables?.aging || []"
            [showActions]="false"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   FINANCIAL DASHBOARD — TOKEN-DRIVEN
   The gradient on .progress-fill--gradient uses two token
   values (--color-warning, --color-error) which is valid SCSS
   interpolation — these ARE token references, not hardcoded hex.
   ============================================================ */

:host { display: block; width: 100%; }

.fin-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Page header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);
}

.page-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  height: 32px;
  padding: 0 var(--spacing-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-body);
  transition: var(--transition-base);
  flex-shrink: 0;

  &:hover {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--border-secondary);
  }
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
}

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

/* ══════════════════════════════════════════════════════════
   LAYOUT GRIDS
   ══════════════════════════════════════════════════════════ */
.top-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);

  @media (min-width: 1024px) { grid-template-columns: 1.8fr 1.2fr; }
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);

  @media (min-width: 1024px) { grid-template-columns: 2fr 1fr; }
}

/* ══════════════════════════════════════════════════════════
   SHARED PANEL
   ══════════════════════════════════════════════════════════ */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);

  /* Flush panel: header has no padding, content is flush to edges */
  &--flush {
    padding: 0;
    overflow: hidden;
    min-height: 280px;
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.panel-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0;
}

.head-icon {
  width: 30px;
  height: 30px;
  border-radius: var(--ui-border-radius-sm);
  background: var(--accent-focus);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

/* ── Margin badge ── */
.margin-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-xs) var(--spacing-lg);
  border-radius: var(--ui-border-radius-pill);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-secondary);
  color: var(--text-secondary);

  &--positive {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
    color: var(--color-success);
  }
}

/* ── Profitability stats ── */
.profit-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.profit-stat {
  padding: var(--spacing-md);
  border-radius: var(--ui-border-radius);
  border: var(--ui-border-width) solid transparent;

  &--highlight {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
  }
}

.stat-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;

  &--success { color: var(--color-success); }
  &--error   { color: var(--color-error); }
}

/* ── Alert strip ── */
.alert-strip {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--ui-border-radius);
  border: var(--ui-border-width) dashed;
  margin-top: auto;

  i { flex-shrink: 0; margin-top: 1px; font-size: var(--font-size-base); }

  &--warning {
    background: var(--color-warning-bg);
    border-color: var(--color-warning-border);
    color: var(--color-warning);
  }

  &--success {
    background: var(--color-success-bg);
    border-color: var(--color-success-border);
    color: var(--color-success);
  }
}

.alert-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin: 0 0 2px 0;
  color: inherit;
}

.alert-sub {
  font-size: var(--font-size-xs);
  margin: 0;
  opacity: 0.8;
  color: inherit;
}

/* ── Cash flow list ── */
.flow-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  flex: 1;
}

.flow-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.flow-name  { color: var(--text-primary); }
.flow-amount { color: var(--text-secondary); font-family: var(--font-mono); }

/* ── Shared progress track ── */
.progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;

  &--bordered {
    background: var(--bg-secondary);
    border: var(--ui-border-width) solid var(--border-secondary);
    height: 8px;
  }
}

.progress-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);

  &--success  { background: var(--color-success); }
  &--warning  { background: var(--color-warning); }
  /* gradient uses two tokens — this is valid CSS variable interpolation */
  &--gradient { background: linear-gradient(90deg, var(--color-warning), var(--color-error)); }
}

/* ── Panel footer (tax) ── */
.panel-footer {
  margin-top: auto;
  padding-top: var(--spacing-lg);
  border-top: var(--ui-border-width) solid var(--border-primary);
}

.footer-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
}

.footer-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  margin: 0;
  color: var(--text-primary);

  &--error { color: var(--color-error); }
}

/* ── EMI layout ── */
.emi-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-xl);
  align-items: center;
}

.emi-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: var(--ui-border-width) solid var(--border-primary);
  padding-right: var(--spacing-lg);
}

.emi-total {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.emi-total-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0 0;
}

.emi-details { display: flex; flex-direction: column; gap: var(--spacing-md); }

.emi-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.text-right { text-align: right; }

.detail-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
}

.detail-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;

  &--success { color: var(--color-success); }
}

.capitalize { text-transform: capitalize; }

.default-section { display: flex; flex-direction: column; gap: var(--spacing-xs); }

.default-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.default-pct {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-error);
}

/* ── Empty panel state ── */
.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-md);
  text-align: center;
  opacity: 0.7;

  i { font-size: var(--font-size-3xl); color: var(--color-success); }
}

.empty-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.empty-sub, .empty-note {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
  font-style: italic;
}

/* ── Aging grid ── */
.grid-head {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.grid-wrap {
  flex: 1;
  position: relative;
  min-height: 240px;
}

.fill-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
  `]
})
export class FinancialDashboardComponent implements OnInit {
  public  commonService    = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr              = inject(ChangeDetectorRef);

  financialData = signal<any>(null);
  loading       = signal(false);
  agingColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Select Branch',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    { key: 'date', label: 'Reporting Period', type: 'date-range' }
  ];

  ngOnInit(): void {
    this.setupAgingColumns();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getFinancialDashboard(
      this.currentFilters['date']?.[0]?.toISOString(),
      this.currentFilters['date']?.[1]?.toISOString(),
      this.currentFilters['branchId']
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') this.financialData.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => this.loading.set(false)
    });
  }

  setupAgingColumns(): void {
    this.agingColumns = [
      {
        field: 'range',
        headerName: 'Aging Period',
        flex: 1,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)'
        }
      },
      {
        field: 'amount',
        headerName: 'Balance',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'color': 'var(--color-error)',
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'text-align': 'right'
        }
      }
    ];
  }
}
// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TagModule } from 'primeng/tag';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';


// @Component({
//   selector: 'app-financial-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     TooltipModule,
//     ProgressSpinnerModule,
//     AgShareGrid,
//     TagModule,
//     UniversalFilterComponent // <--- Imported here
//   ],
//   template: `
//     <div class="financial-container">
      
//       <div class="header-section">
//         <div class="header-content">
//            <h2 class="page-title">Financial Health Center</h2>
//            <p class="page-subtitle">Real-time P&L, Cash Flow, and Credit Risk Analysis</p>
//         </div>
//         <div class="header-actions">
//            <p-button icon="pi pi-file-pdf" label="Download Report" severity="secondary" [outlined]="true" size="small"></p-button>
//         </div>
//       </div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'financial-dashboard'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="metrics-grid">
          
//           <div class="metric-card profitability-card">
//             <div class="card-header">
//               <h3 class="card-title">Profitability Engine</h3>
//               <span class="status-badge" [class.success]="(financialData()?.profitability?.marginPercent || 0) > 0">
//                 {{ financialData()?.profitability?.marginPercent || '0' | number:'1.1-1' }}% Margin
//               </span>
//             </div>
            
//             <div class="stats-row">
//               <div class="stat-item">
//                 <p class="stat-label">Total Revenue</p>
//                 <p class="stat-value">
//                   {{ commonService.formatCurrency(financialData()?.profitability?.revenue) }}
//                 </p>
//               </div>
//               <div class="stat-item">
//                 <p class="stat-label">Cost of Goods (COGS)</p>
//                 <p class="stat-value error">
//                   {{ commonService.formatCurrency(financialData()?.profitability?.costOfGoodsSold) }}
//                 </p>
//               </div>
//               <div class="stat-item highlight">
//                 <p class="stat-label">Gross Profit</p>
//                 <p class="stat-value success">
//                   {{ commonService.formatCurrency(financialData()?.profitability?.grossProfit) }}
//                 </p>
//               </div>
//             </div>

//             @if (financialData()?.recommendations?.recommendations?.length > 0) {
//                <div class="alert-box warning">
//                  <i class="pi pi-exclamation-circle alert-icon"></i>
//                  <div class="alert-content">
//                    <p class="alert-title">Strategy: {{ financialData()?.recommendations?.recommendations[0]?.action }}</p>
//                    <p class="alert-subtitle">{{ financialData()?.recommendations?.recommendations[0]?.reason }}</p>
//                  </div>
//                </div>
//             } @else {
//               <div class="alert-box positive">
//                 <i class="pi pi-check-circle alert-icon"></i>
//                 <p class="alert-title">Financial health appears stable for this period.</p>
//               </div>
//             }
//           </div>

//           <div class="metric-card cashflow-card">
//             <div class="card-section">
//               <h3 class="card-title">Liquidity Sources</h3>
//               <div class="flow-list">
//                 @for (mode of financialData()?.cashFlow?.paymentModes; track mode.name) {
//                   <div class="flow-item">
//                     <div class="flow-header">
//                       <span class="flow-name">{{ mode.name || 'Unknown' }}</span>
//                       <span class="flow-amount">{{ commonService.formatCurrency(mode.value) }}</span>
//                     </div>
//                     <div class="progress-track">
//                        <div class="progress-fill success" 
//                             [style.width]="((mode.value / (financialData()?.profitability?.revenue || 1)) * 100) + '%'"></div>
//                     </div>
//                   </div>
//                 } @empty {
//                   <p class="empty-placeholder">No cash transactions found for selected criteria</p>
//                 }
//               </div>
//             </div>
            
//             <div class="card-footer">
//                <div class="tax-info">
//                   <p class="footer-label">Estimated Tax Payable (GST)</p>
//                   <p class="footer-value error">
//                     {{ commonService.formatCurrency(financialData()?.tax?.netPayable) }}
//                   </p>
//                </div>
//             </div>
//           </div>
//         </div>

//         <div class="details-grid">
          
//           <div class="detail-card credit-card">
//             <div class="card-header">
//               <div class="header-icon-box"><i class="pi pi-credit-card"></i></div>
//               <h3 class="card-title">Credit Portfolio Risk</h3>
//             </div>

//             @for (emi of financialData()?.credit?.emiAnalytics; track emi._id) {
//               <div class="emi-layout">
//                 <div class="emi-stat-box">
//                   <p class="big-number">{{ commonService.formatCurrency(emi.totalPortfolio) }}</p>
//                   <p class="mini-label">Total Exposure</p>
//                 </div>
                
//                 <div class="emi-details">
//                   <div class="details-row">
//                     <div>
//                       <p class="detail-label">Portfolio Status</p>
//                       <p class="detail-value capitalize">{{ emi.status }}</p>
//                     </div>
//                     <div class="text-right">
//                       <p class="detail-label">Collection Efficiency</p>
//                       <p class="detail-value success">{{ emi.collectionEfficiency }}%</p>
//                     </div>
//                   </div>

//                   <div class="progress-section">
//                     <div class="progress-header">
//                       <span class="mini-label">Default Risk Rate</span>
//                       <span class="progress-text">{{ (emi.defaultRate * 100) | number:'1.1-1' }}%</span>
//                     </div>
//                     <div class="progress-track border">
//                       <div class="progress-fill gradient" [style.width]="(emi.defaultRate * 100) + '%'"></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             } @empty {
//                 <div class="empty-state">
//                     <i class="pi pi-verified empty-icon"></i>
//                     <p class="empty-title">Clean Credit Sheet</p>
//                     <p class="empty-subtitle">No active EMIs or high-risk debts found.</p>
//                 </div>
//             }
//           </div>

//           <div class="side-column">
//             <div class="detail-card grid-card">
//                <div class="card-header small">
//                   <h4 class="card-subtitle">Receivables Aging Report</h4>
//                </div>
//                <div class="grid-container">
//                   <app-ag-share-grid [columns]="agingColumns" [data]="financialData()?.receivables?.aging || []" [showActions]="false" class="full-size-grid"></app-ag-share-grid>
//                </div>
//             </div>
//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4"></p-progressSpinner>
//           <p class="loader-text">Compiling Financial Data...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .financial-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; }

//     /* HEADER */
//     .header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-lg); }
//     .page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
//     .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }

//     .filter-section { margin-bottom: var(--spacing-md); }

//     /* METRICS GRID (Top Row) */
//     .metrics-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     @media(min-width: 1024px) { .metrics-grid { grid-template-columns: 1.8fr 1.2fr; } }

//     .metric-card, .detail-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); display: flex; flex-direction: column; }

//     /* PROFITABILITY CARD */
//     .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
//     .card-title { font-size: var(--font-size-sm); font-weight: bold; text-transform: uppercase; color: var(--text-label); margin: 0; }
    
//     .status-badge { padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; background: var(--bg-ternary); color: var(--text-secondary); border: 1px solid var(--border-secondary); }
//     .status-badge.success { background: var(--color-success-bg); color: var(--color-success); border-color: var(--color-success-border); }

//     .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     .stat-item { padding: var(--spacing-md); border-radius: var(--ui-border-radius); border: 1px solid transparent; }
//     .stat-item.highlight { background: var(--bg-ternary); border-color: var(--border-secondary); }
    
//     .stat-label { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0 0 4px 0; font-weight: 600; text-transform: uppercase; }
//     .stat-value { font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary); margin: 0; font-family: var(--font-mono); }
//     .stat-value.success { color: var(--color-success); }
//     .stat-value.error { color: var(--color-error); }

//     /* ALERTS */
//     .alert-box { padding: var(--spacing-md); border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-md); align-items: flex-start; border: 1px dashed; margin-top: auto; }
//     .alert-box.warning { border-color: var(--color-warning); background: var(--color-warning-bg); .alert-icon { color: var(--color-warning); } }
//     .alert-box.positive { border-color: var(--color-success); background: var(--color-success-bg); .alert-icon { color: var(--color-success); } }
//     .alert-title { font-weight: bold; margin: 0 0 2px 0; font-size: 12px; }
//     .alert-subtitle { font-size: 11px; margin: 0; opacity: 0.8; }

//     /* CASHFLOW */
//     .flow-list { display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: var(--spacing-md); }
//     .flow-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: var(--font-size-sm); font-weight: 600; }
//     .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; overflow: hidden; }
//     .progress-fill.success { background: var(--color-success); height: 100%; }

//     .card-footer { margin-top: auto; padding-top: var(--spacing-lg); border-top: 1px solid var(--border-primary); }
//     .footer-label { font-size: 10px; font-weight: 700; color: var(--text-tertiary); margin-bottom: 4px; text-transform: uppercase; }
//     .footer-value { font-size: var(--font-size-2xl); font-weight: 800; margin: 0; font-family: var(--font-mono); }

//     /* DETAILS GRID (Bottom Row) */
//     .details-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media(min-width: 1024px) { .details-grid { grid-template-columns: 2fr 1fr; } }

//     /* CREDIT CARD */
//     .emi-layout { display: grid; grid-template-columns: 1fr 2fr; gap: var(--spacing-xl); align-items: center; }
//     .emi-stat-box { display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border-primary); padding-right: var(--spacing-lg); }
//     .big-number { font-size: 2.5rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1; font-family: var(--font-mono); }
//     .mini-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin-top: 4px; }

//     .details-row { display: flex; justify-content: space-between; margin-bottom: var(--spacing-lg); }
//     .detail-value { font-size: var(--font-size-lg); font-weight: 700; margin: 0; }
//     .capitalize { text-transform: capitalize; }

//     .progress-section { margin-top: var(--spacing-md); }
//     .progress-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
//     .progress-text { font-size: 12px; font-weight: 700; }
//     .progress-track.border { border: 1px solid var(--border-secondary); background: var(--bg-primary); height: 8px; }
//     .progress-fill.gradient { background: linear-gradient(90deg, var(--color-warning), var(--color-error)); height: 100%; }

//     /* GRID CARD */
//     .grid-card { padding: 0; overflow: hidden; min-height: 300px; }
//     .card-header.small { padding: 12px 16px; border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); margin: 0; }
//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* UTILS */
//     .empty-placeholder { font-size: var(--font-size-xs); color: var(--text-tertiary); font-style: italic; text-align: center; margin-top: 20px; }
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//     .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
//     .empty-state { text-align: center; padding: 2rem; }
//     .empty-icon { font-size: 2rem; color: var(--theme-success); margin-bottom: 0.5rem; }
//   `]
// })
// export class FinancialDashboardComponent implements OnInit {
//   public commonService = inject(CommonMethodService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr = inject(ChangeDetectorRef);

//   financialData = signal<any>(null);
//   loading = signal<boolean>(false);
//   agingColumns: any[] = [];

//   private currentFilters: any = {};

//   filterConfig: FilterField[] = [
//     { key: 'branchId', label: 'Select Branch', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'All Branches' },
//     { key: 'date', label: 'Reporting Period', type: 'date-range', placeholder: 'Select Dates' }
//   ];

//   ngOnInit() {
//     this.setupAgingColumns();
//   }

//   setupAgingColumns(): void {
//     this.agingColumns = [
//       { field: 'range', headerName: 'Aging Period', flex: 1, cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)' } },
//       { field: 'amount', headerName: 'Balance', width: 120, valueFormatter: (params: any) => this.commonService.formatCurrency(params.value), cellStyle: { 'color': 'var(--color-error)', 'font-weight': 'bold', 'text-align': 'right' } }
//     ];
//   }

//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     const params = {
//       startDate: this.currentFilters.date?.[0]?.toISOString(),
//       endDate: this.currentFilters.date?.[1]?.toISOString(),
//       branchId: this.currentFilters.branchId
//     };

//     this.analyticsService.getFinancialDashboard(params.startDate, params.endDate, params.branchId).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.financialData.set(res.data);
//         }
//         this.loading.set(false);
//         this.cdr.detectChanges();
//       },
//       error: () => this.loading.set(false)
//     });
//   }
// }
