import { Component, OnInit, signal, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-customer-intelligence',
  standalone: true,
  imports: [
    CommonModule, TooltipModule, ProgressSpinnerModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="ci-root">

  <!-- Filter + refresh row -->
  <div class="filter-row">
    <app-universal-filter
      entityType="customer-intelligence"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)"
      class="filter-grow">
    </app-universal-filter>
    <button class="refresh-btn" (click)="loadData()" [disabled]="loading()" pTooltip="Refresh" tooltipPosition="bottom">
      <i class="pi pi-refresh" [class.spinning]="loading()"></i>
    </button>
  </div>

  <!-- ══════════════════════════════════════
       LOADING
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3"></p-progressSpinner>
      <span class="loader-text">Analysing customer lifecycle patterns…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading()) {

    <!-- Stats strip -->
    <div class="stats-strip">

      <div class="stat-card">
        <p class="stat-label">Total Portfolio LTV</p>
        <p class="stat-value">{{ commonService.formatCurrency(intelligenceData()?.valueAnalysis?.totalLTV) }}</p>
        <p class="stat-footer">
          Network avg: {{ commonService.formatCurrency(intelligenceData()?.valueAnalysis?.avgLTV) }}
        </p>
      </div>

      <div class="segments-card">
        @for (seg of intelligenceData()?.segmentation; track seg._id) {
          <div class="seg-item">
            <p class="seg-count" [class.seg-count--active]="seg.count > 0">{{ seg.count || 0 }}</p>
            <p class="seg-name">{{ seg._id }}</p>
          </div>
        } @empty {
          <p class="seg-empty">No acquisition data for this period.</p>
        }
      </div>

    </div>

    <!-- Body grid -->
    <div class="body-grid">

      <!-- LTV grid -->
      <div class="panel panel--flush">
        <div class="panel-head">
          <h3 class="panel-title">Top Value Performers (LTV)</h3>
          <span class="panel-meta">
            Top {{ intelligenceData()?.valueAnalysis?.topLTV?.length || 0 }} customers
          </span>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="ltvColumns"
            [data]="intelligenceData()?.valueAnalysis?.topLTV || []"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

      <!-- Side widgets -->
      <div class="side-col">

        <!-- Credit risk monitor -->
        <div class="panel">
          <div class="panel-head">
            <h4 class="panel-title">Credit Risk Monitor</h4>
            <span class="flag-badge">
              Flagged: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length || 0 }}
            </span>
          </div>

          <div class="risk-list">
            @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
              <div class="risk-row">
                <div class="risk-top">
                  <span class="risk-name">{{ risk.name }}</span>
                  <i class="pi pi-exclamation-circle risk-icon"></i>
                </div>
                <div class="risk-detail">
                  <span class="detail-label">Outstanding</span>
                  <span class="detail-value detail-value--error">
                    {{ commonService.formatCurrency(risk.outstandingBalance) }}
                  </span>
                </div>
                <div class="risk-bar"><div class="risk-bar-fill"></div></div>
              </div>
            } @empty {
              <div class="empty-state">
                <i class="pi pi-check-circle empty-icon"></i>
                <p class="empty-title">All Accounts Healthy</p>
                <p class="empty-sub">No high-risk credit exposure.</p>
              </div>
            }
          </div>
        </div>

        <!-- Loyalty intelligence -->
        <div class="panel panel--advisory">
          <h4 class="panel-title panel-title--accent">Loyalty Intelligence</h4>
          @if ((intelligenceData()?.recommendations?.highValue?.length ?? 0) > 0) {
            <p class="advisory-text">
              <i class="pi pi-bolt advisory-icon"></i>
              <strong>{{ intelligenceData()?.recommendations?.highValue[0]?.name }}</strong>
              is your top contributor. Suggest a VIP membership.
            </p>
          } @else {
            <p class="advisory-text advisory-text--muted">
              Generating strategic recommendations…
            </p>
          }
        </div>

        <!-- Payment reliability placeholder -->
        <div class="panel">
          <h4 class="panel-title">Payment Reliability</h4>
          <div class="placeholder-block">
            <i class="pi pi-chart-line placeholder-icon"></i>
            <p class="placeholder-text">
              Payment behaviour scoring is processing for
              {{ currentFilters['branchId'] ? 'selected branch' : 'all branches' }}.
            </p>
          </div>
        </div>

      </div>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   CUSTOMER INTELLIGENCE — TOKEN-DRIVEN
   The tier badge colors in setupColumns() (Platinum/Gold/Silver)
   use hardcoded hex because they are data-encoding categorical
   colors that must remain consistent across all themes — they
   are not UI surface colors. All other values use tokens.
   ============================================================ */

:host { display: block; width: 100%; }

.ci-root {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Filter row ── */
.filter-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.filter-grow { flex: 1; }

.refresh-btn {
  width: 32px;
  height: 32px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
  margin-top: 28px; // Aligns with filter input height
  transition: var(--transition-base);

  &:hover:not(:disabled) { background: var(--component-bg-hover); color: var(--accent-primary); }
  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

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
   STATS STRIP
   ══════════════════════════════════════════════════════════ */
.stats-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex-shrink: 0;

  @media (min-width: 1024px) { grid-template-columns: 1fr 3fr; }
}

.stat-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
}

.stat-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-sm) 0;
}

.stat-value {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.stat-footer {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-success);
  margin: var(--spacing-sm) 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Segments card */
.segments-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.seg-item { text-align: center; }

.seg-count {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);

  &--active { color: var(--accent-primary); }
}

.seg-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;
}

.seg-empty {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-style: italic;
  text-align: center;
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
  gap: var(--spacing-md);

  &--flush {
    padding: 0;
    overflow: hidden;
    min-height: 500px;
  }

  &--advisory {
    border: var(--ui-border-width) dashed var(--accent-primary);
    background: var(--accent-focus);
  }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

// Flush panel: head has its own padding
.panel--flush .panel-head {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
}

.panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;

  &--accent { color: var(--accent-primary); }
}

.panel-meta {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Flagged badge */
.flag-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-error-bg);
  color: var(--color-error);
  border: var(--ui-border-width) solid var(--color-error-border);
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

/* ── Risk list ── */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.risk-row {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-sm);
  border: var(--ui-border-width) solid var(--border-primary);
}

.risk-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.risk-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.risk-icon { color: var(--color-error); font-size: var(--font-size-base); }

.risk-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.detail-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }

.detail-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--error { color: var(--color-error); }
}

.risk-bar {
  height: 4px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
}

.risk-bar-fill {
  width: 100%;
  height: 100%;
  background: var(--color-error);
  border-radius: var(--ui-border-radius-pill);
}

/* ── Advisory panel ── */
.advisory-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;

  &--muted { color: var(--text-tertiary); font-style: italic; }
}

.advisory-icon { color: var(--accent-primary); margin-right: var(--spacing-md); }

/* ── Placeholder block ── */
.placeholder-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  opacity: 0.5;
  text-align: center;
  gap: var(--spacing-md);
}

.placeholder-icon { font-size: var(--font-size-2xl); color: var(--accent-primary); }

.placeholder-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin: 0;
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  opacity: 0.8;
  gap: var(--spacing-sm);
}

.empty-icon { font-size: var(--font-size-2xl); color: var(--color-success); }
.empty-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
.empty-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 0; }
  `]
})
export class CustomerIntelligenceComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  public  commonService    = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr              = inject(ChangeDetectorRef);

  intelligenceData = signal<any>(null);
  loading          = signal(false);
  ltvColumns: any[] = [];

  public currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    },
    { key: 'date', label: 'Analysis Period', type: 'date-range' }
  ];

  ngOnInit(): void {
    this.setupColumns();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getCustomerIntelligence(this.currentFilters['branchId']).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') this.intelligenceData.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.ltvColumns = [
      {
        field: 'name',
        headerName: 'Customer Name',
        flex: 1,
        minWidth: 160,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)',
          'display': 'flex',
          'align-items': 'center'
        }
      },
      {
        field: '_id',
        headerName: 'System ID',
        width: 120,
        valueFormatter: (p: any) => p.value ? '…' + p.value.slice(-8) : '—',
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'color': 'var(--text-tertiary)',
          'font-size': 'var(--font-size-xs)',
          'display': 'flex',
          'align-items': 'center'
        }
      },
      {
        field: 'tier',
        headerName: 'Status',
        width: 110,
        cellRenderer: (p: any) => {
          const tier = p.value || 'Standard';
          // Data-encoding tier colors — intentionally fixed for visual consistency
          const map: Record<string, { color: string; bg: string }> = {
            Platinum: { color: '#8b5cf6', bg: '#f3e8ff' },
            Gold:     { color: '#f59e0b', bg: '#fef3c7' },
            Silver:   { color: '#64748b', bg: '#e2e8f0' },
          };
          const style = map[tier] ?? { color: '#94a3b8', bg: '#f1f5f9' };
          return `<div style="display:flex;align-items:center;height:100%;">
                    <span style="padding:1px 8px;border-radius:4px;font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);text-transform:uppercase;background:${style.bg};color:${style.color};border:1px solid ${style.color}33;">
                      ${tier}
                    </span>
                  </div>`;
        }
      },
      {
        field: 'avgOrder',
        headerName: 'Avg Ticket',
        width: 130,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-secondary)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        }
      },
      {
        field: 'ltv',
        headerName: 'Lifetime Value',
        width: 150,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--color-success)',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'flex-end'
        }
      }
    ];
    this.cdr.detectChanges();
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { TagModule } from 'primeng/tag';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-customer-intelligence',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     TooltipModule,
//     TagModule,
//     ProgressSpinnerModule,
//     AgShareGrid,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="intelligence-container">

//       <div class="filter-section">
//         <div class="filter-row">
//            <app-universal-filter
//              [entityType]="'customer-intelligence'"
//              [config]="filterConfig"
//              (filterChange)="onFilterUpdate($event)"
//              class="flex-grow-1">
//            </app-universal-filter>
           
//            <div class="header-actions">
//               <p-button icon="pi pi-refresh" [outlined]="true" severity="secondary" (onClick)="loadData()" size="small"></p-button>
//            </div>
//         </div>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="stats-grid">
//           <div class="stat-card ltv-card">
//             <p class="card-label">Total Portfolio LTV</p>
//             <h2 class="card-value">{{ commonService.formatCurrency(intelligenceData()?.valueAnalysis?.totalLTV) }}</h2>
//             <div class="card-footer">
//               <span class="footer-metric success">
//                 NETWORK AVG: {{ commonService.formatCurrency(intelligenceData()?.valueAnalysis?.avgLTV) }}
//               </span>
//             </div>
//           </div>

//           <div class="stat-card segments-card">
//             @for (segment of intelligenceData()?.segmentation; track segment._id) {
//               <div class="segment-item">
//                 <p class="segment-value" [class.active]="segment.count > 0">
//                   {{ segment.count || '0' }}
//                 </p>
//                 <p class="segment-label">{{ segment._id }}</p>
//               </div>
//             } @empty {
//               <p class="segment-label">No acquisition data found for this period.</p>
//             }
//           </div>
//         </div>

//         <div class="content-grid">
//           <div class="main-column">
//             <div class="grid-card">
//               <div class="grid-header">
//                 <h3 class="grid-title">Top Value Performers (LTV)</h3>
//                 <span class="grid-meta">Top {{ intelligenceData()?.valueAnalysis?.topLTV?.length || 0 }} Customers</span>
//               </div>
              
//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="ltvColumns" 
//                    [data]="intelligenceData()?.valueAnalysis?.topLTV || []" 
// 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>
//           </div>

//           <div class="side-column">
            
//             <div class="side-card risk-monitor">
//               <div class="side-header">
//                 <h4 class="side-title">Credit Risk Monitor</h4>
//                 <span class="flag-badge">FLAGGED: {{ intelligenceData()?.riskAnalysis?.creditRisk?.length || 0 }}</span>
//               </div>
              
//               <div class="risk-list">
//                 @for (risk of intelligenceData()?.riskAnalysis?.creditRisk; track risk._id) {
//                   <div class="risk-item">
//                     <div class="risk-header">
//                       <p class="risk-name">{{ risk.name }}</p>
//                       <i class="pi pi-exclamation-circle risk-icon"></i>
//                     </div>
//                     <div class="risk-details">
//                       <div class="detail-row">
//                         <span class="detail-label">Outstanding</span>
//                         <span class="detail-value error">{{ commonService.formatCurrency(risk.outstandingBalance) }}</span>
//                       </div>
//                     </div>
//                     <div class="risk-bar">
//                        <div class="bar-fill error" style="width: 100%"></div>
//                     </div>
//                   </div>
//                 } @empty {
//                    <div class="empty-state">
//                       <i class="pi pi-check-circle empty-icon success"></i>
//                       <p class="empty-title">All Accounts Healthy</p>
//                       <p class="empty-text">No high-risk credit exposure detected.</p>
//                    </div>
//                 }
//               </div>
//             </div>

//             <div class="side-card strategy-card">
//               <h4 class="side-title highlight">Loyalty Intelligence</h4>
//               <div class="strategy-content">
//                 @if (intelligenceData()?.recommendations?.highValue?.length > 0) {
//                    <div class="strategy-item">
//                      <p class="strategy-text">
//                        <i class="pi pi-bolt strategy-icon"></i>
//                        <b>{{ intelligenceData()?.recommendations?.highValue[0]?.name }}</b> is currently your top contributor. Suggest a VIP membership.
//                      </p>
//                    </div>
//                 } @else {
//                    <p class="strategy-text empty">Generating strategic recommendations...</p>
//                 }
//               </div>
//             </div>

//             <div class="side-card">
//                <h4 class="side-title mb-md">Payment Reliability</h4>
//                <div class="placeholder-box">
//                   <i class="pi pi-chart-line placeholder-icon"></i>
//                   <p class="placeholder-text">Payment behavior scoring is processing for {{ currentFilters.branchId ? 'selected branch' : 'all branches' }}.</p>
//                </div>
//             </div>

//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4"></p-progressSpinner>
//           <p class="loader-text">Analyzing customer lifecycle patterns...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .intelligence-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100vh; }

//     /* Filter Layout */
//     .filter-section { margin-bottom: var(--spacing-xl); }
//     .filter-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-md); }
//     .flex-grow-1 { flex: 1; }
//     .header-actions { margin-top: 28px; /* Align with filter inputs roughly */ }

//     .stats-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     @media(min-width: 1024px) { .stats-grid { grid-template-columns: 1fr 3fr; } }

//     .stat-card, .side-card, .grid-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); padding: var(--spacing-lg); }
//     .card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-label); margin-bottom: 8px; letter-spacing: 0.5px; }
//     .card-value { font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin: 0; }
//     .card-footer { margin-top: 8px; font-size: 11px; font-weight: 700; color: var(--text-tertiary); }
    
//     .segments-card { display: flex; justify-content: space-around; align-items: center; }
//     .segment-item { text-align: center; .segment-value { font-size: 2.2rem; font-weight: 800; color: var(--text-tertiary); margin: 0; &.active { color: var(--accent-primary); } } .segment-label { font-size: 10px; font-weight: 700; color: var(--text-label); text-transform: uppercase; } }

//     .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media(min-width: 1024px) { .content-grid { grid-template-columns: 2fr 1fr; } }

//     .grid-card { padding: 0; overflow: hidden; height: 100%; min-height: 550px; display: flex; flex-direction: column; }
//     .grid-header { padding: var(--spacing-md) var(--spacing-lg); background: var(--bg-ternary); border-bottom: 1px solid var(--border-primary); display: flex; justify-content: space-between; align-items: center; }
//     .grid-title { font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; margin: 0; }
//     .grid-meta { font-size: 10px; color: var(--text-tertiary); }
//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
//     .side-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
//     .side-title { font-size: var(--font-size-sm); font-weight: 800; text-transform: uppercase; color: var(--text-primary); margin: 0; }
//     .flag-badge { font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: var(--color-error-bg); color: var(--color-error); }

//     .risk-item { padding: var(--spacing-md); background: var(--bg-ternary); border-radius: var(--ui-border-radius-lg); margin-bottom: 12px; .risk-header { display: flex; justify-content: space-between; margin-bottom: 8px; .risk-name { font-weight: 600; font-size: 13px; } .risk-icon { color: var(--color-error); font-size: 14px; } } .detail-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; } .risk-bar { height: 4px; background: var(--bg-primary); border-radius: 2px; overflow: hidden; .bar-fill { height: 100%; } } }

//     .strategy-card { border: 1px dashed var(--accent-primary); .highlight { color: var(--accent-primary); } .strategy-text { font-size: 12px; line-height: 1.5; margin: 10px 0 0 0; } .strategy-icon { color: var(--accent-primary); margin-right: 6px; } }

//     .placeholder-box { text-align: center; padding: 30px 10px; opacity: 0.5; .placeholder-icon { font-size: 1.5rem; color: var(--accent-primary); margin-bottom: 10px; } .placeholder-text { font-size: 11px; font-weight: 500; } }
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; .loader-text { font-size: 13px; color: var(--text-tertiary); font-weight: 500; } }
//     .success { color: var(--color-success); }
//     .empty-state { text-align: center; padding: 1rem; opacity: 0.8; }
//     .empty-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
//     .empty-title { font-weight: bold; font-size: 12px; margin: 0; }
//     .empty-text { font-size: 11px; margin: 0; }
//   `]
// })
// export class CustomerIntelligenceComponent implements OnInit {
//   public commonService = inject(CommonMethodService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr = inject(ChangeDetectorRef);

//   intelligenceData = signal<any>(null);
//   loading = signal<boolean>(false);
//   ltvColumns: any[] = [];

//   // Stored Filters
//   public currentFilters: any = {};

//   // 1. FILTER CONFIG
//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches', // Connects to MasterListService.branches()
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'All Branches'
//     },
//     {
//       key: 'date',
//       label: 'Analysis Period',
//       type: 'date-range',
//       placeholder: 'Select Dates'
//     }
//   ];

//   ngOnInit() {
//     this.setupColumns();
//     // loadData triggered by filter init
//   }

//   // 2. FILTER HANDLER
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);

//     // Prepare params from filter object
//     // Note: Assuming service accepts dates, if not it will just ignore them
//     // based on your original service signature: getCustomerIntelligence(branchId)
//     // If you've updated the backend to support dates, you can pass them here.
//     const branchId = this.currentFilters.branchId;

//     this.analyticsService.getCustomerIntelligence(branchId).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.intelligenceData.set(res.data);
//         }
//         this.loading.set(false);
//         this.cdr.detectChanges();
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   setupColumns(): void {
//     this.ltvColumns = [
//       // 1. CUSTOMER NAME
//       {
//         field: 'name',
//         headerName: 'Customer Name',
//         flex: 1,
//         minWidth: 160,
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'display': 'flex', 'align-items': 'center' }
//       },

//       // 2. CUSTOMER ID (Separate Column)
//       {
//         field: '_id',
//         headerName: 'System ID',
//         width: 120,
//         // displaying last 8 chars for cleaner UI, or remove valueFormatter to show full ID
//         valueFormatter: (params: any) => params.value ? '...' + params.value.slice(-8) : '--',
//         cellStyle: { 'font-family': 'var(--font-mono)', 'color': 'var(--text-tertiary)', 'font-size': '11px', 'display': 'flex', 'align-items': 'center' }
//       },

//       // 3. STATUS (Slimmer Badge)
//       {
//         field: 'tier',
//         headerName: 'Status',
//         width: 110,
//         cellRenderer: (params: any) => {
//           const tier = params.value || 'Standard';

//           let color = '#94a3b8'; // gray
//           let bg = '#f1f5f9';
//           if (tier === 'Platinum') { color = '#8b5cf6'; bg = '#f3e8ff'; }
//           if (tier === 'Gold') { color = '#f59e0b'; bg = '#fef3c7'; }
//           if (tier === 'Silver') { color = '#64748b'; bg = '#e2e8f0'; }

//           // Slim padding (1px 8px) and line-height: 1
//           return `<div style="display: flex; align-items: center; height: 100%;">
//                     <span style="padding: 1px 8px; border-radius: 4px; font-size: 9px; line-height: 1; font-weight: 800; text-transform: uppercase; background: ${bg}; color: ${color}; border: 1px solid ${color}33;">
//                       ${tier}
//                     </span>
//                   </div>`;
//         }
//       },

//       // 4. AVERAGE ORDER
//       {
//         field: 'avgOrder',
//         headerName: 'Avg Ticket',
//         width: 130,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-weight': '600', 'color': 'var(--text-secondary)', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
//       },

//       // 5. LIFETIME VALUE
//       {
//         field: 'ltv',
//         headerName: 'Lifetime Value',
//         width: 150,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '800', 'color': 'var(--color-success)', 'text-align': 'right', 'font-size': '13px', 'font-family': 'var(--font-mono)', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }

