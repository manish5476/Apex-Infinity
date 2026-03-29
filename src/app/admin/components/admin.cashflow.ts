import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-cash-flow-analysis',
  standalone: true,
  imports: [
    CommonModule, TooltipModule, ProgressSpinnerModule,
    UniversalFilterComponent
  ],
  template: `
<div class="cf-root">

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="cash-flow"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- Loading overlay (sits over content, not replacing it) -->
  @if (loading()) {
    <div class="load-overlay">
      <p-progressSpinner styleClass="w-14 h-14" strokeWidth="3"></p-progressSpinner>
    </div>
  }

  <div class="content-wrap" [class.content-wrap--dim]="loading()">

    <!-- ══════════════════════════════════════
         KPI STRIP
    ═══════════════════════════════════════ -->
    <div class="kpi-strip">

      <div class="kpi-card">
        <p class="kpi-label">Available Liquidity</p>
        <p class="kpi-value kpi-value--success">
          {{ commonService.formatCurrency(cashData()?.summary?.profit?.value) }}
        </p>
        <p class="kpi-sub">Net cash position</p>
      </div>

      <div class="kpi-card">
        <p class="kpi-label">Receivables (0–30d)</p>
        <p class="kpi-value kpi-value--warning">
          {{ commonService.formatCurrency(cashData()?.receivables?.aging?.[0]?.amount) }}
        </p>
        <p class="kpi-sub">Inbound flow pending</p>
      </div>

      <div class="kpi-card kpi-card--tinted">
        <p class="kpi-label">Cash-to-Debt Ratio</p>
        <p class="kpi-value">1:2.4</p>
        <div class="progress-track">
          <div class="progress-fill progress-fill--accent" style="width:40%"></div>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════
         ANALYSIS GRID
    ═══════════════════════════════════════ -->
    <div class="analysis-grid">

      <!-- ── Main column: Aging report ── -->
      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">Inbound Aging Report</h3>
          <button class="icon-btn" pTooltip="Print" tooltipPosition="bottom">
            <i class="pi pi-print"></i>
          </button>
        </div>

        <div class="aging-list">
          @for (aging of cashData()?.receivables?.aging; track aging.range) {
            <div class="aging-row">
              <div class="aging-left">
                <span class="aging-icon"><i class="pi pi-history"></i></span>
                <div>
                  <p class="aging-range">{{ aging.range }}</p>
                  <p class="aging-count">{{ aging.count }} pending invoices</p>
                </div>
              </div>
              <div class="aging-right">
                <p class="aging-amount">{{ commonService.formatCurrency(aging.amount) }}</p>
                <span class="priority-tag">High Priority</span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="pi pi-check-circle"></i>
              <p class="empty-title">All Clear</p>
              <p class="empty-sub">No overdue receivables at this time.</p>
            </div>
          }
        </div>

        <!-- Advisory box -->
        <div class="advisory">
          <i class="pi pi-lightbulb advisory-icon"></i>
          <div>
            <p class="advisory-title">Cash Flow Advisory</p>
            <p class="advisory-body">
              @if ((cashData()?.recommendations?.recommendations?.length ?? 0) > 0) {
                {{ cashData()?.recommendations?.recommendations[0]?.reason }}.
                Target action: <strong>{{ cashData()?.recommendations?.recommendations[0]?.action }}</strong>.
              } @else {
                Liquidity is healthy. No immediate actions required.
              }
            </p>
          </div>
        </div>
      </div>

      <!-- ── Side column: Tax + Credit ── -->
      <div class="side-col">

        <!-- Tax liability -->
        <div class="panel">
          <h3 class="widget-title">Tax Liability</h3>
          <div class="tax-rows">
            <div class="tax-row">
              <span class="tax-label">Input GST</span>
              <span class="tax-value">{{ commonService.formatCurrency(cashData()?.tax?.inputTax) }}</span>
            </div>
            <div class="tax-row">
              <span class="tax-label">Output GST</span>
              <span class="tax-value">{{ commonService.formatCurrency(cashData()?.tax?.outputTax) }}</span>
            </div>
            <div class="tax-row tax-row--total">
              <span class="tax-label tax-label--strong">Net Payable</span>
              <span class="tax-value tax-value--error">{{ commonService.formatCurrency(cashData()?.tax?.netPayable) }}</span>
            </div>
          </div>
        </div>

        <!-- Active credit exposure -->
        <div class="panel">
          <h3 class="widget-title">Active Credit Exposure</h3>

          @for (emi of cashData()?.credit?.emiAnalytics; track emi._id) {
            <div class="credit-block">
              <div class="credit-head">
                <div>
                  <p class="credit-micro-label">Total Outstanding</p>
                  <p class="credit-total">{{ commonService.formatCurrency(emi.totalAmount) }}</p>
                </div>
                <div class="text-right">
                  <p class="credit-micro-label">Active EMIs</p>
                  <p class="credit-plans">{{ emi.activeEMIs }} Plans</p>
                </div>
              </div>

              <div class="repayment-box">
                <div class="repayment-head">
                  <span class="credit-micro-label">Repayment Health</span>
                  <span class="repayment-pct">{{ emi.completionRate | number:'1.0-0' }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill progress-fill--success" [style.width.%]="emi.completionRate"></div>
                </div>
                <div class="repayment-foot">
                  <span>Paid: {{ emi.paidInstallments }}</span>
                  <span>Total: {{ emi.totalInstallments }}</span>
                </div>
              </div>

              <div class="mini-stats">
                <div class="mini-stat">
                  <p class="credit-micro-label">Defaults</p>
                  <p class="mini-val" [class.mini-val--error]="emi.defaultedEMIs > 0">{{ emi.defaultedEMIs }}</p>
                </div>
                <div class="mini-stat">
                  <p class="credit-micro-label">Interest</p>
                  <p class="mini-val mini-val--success">{{ commonService.formatCurrency(emi.totalInterestEarned) }}</p>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="pi pi-wallet"></i>
              <p class="empty-sub">No active credit lines</p>
            </div>
          }
        </div>

      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
/* ============================================================
   CASH FLOW ANALYSIS — TOKEN-DRIVEN
   Only intentional non-token: the loading overlay rgba uses
   a fixed value — see note below.
   ============================================================ */

:host { display: block; width: 100%; }

.cf-root {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  font-family: var(--font-body);
  color: var(--text-primary);
  min-height: 100%;
}

/* ── Filter bar ── */
.filter-bar { flex-shrink: 0; }

/* ── Loading overlay ── */
// Overlay sits over the dimmed content, centered.
// rgba(255,255,255,0.6) is intentionally fixed — it's a
// content-blocking overlay; a theme token would invert
// undesirably in dark mode. Acceptable exception.
.load-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
}

.content-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  transition: opacity var(--transition-base);

  &--dim { opacity: 0.45; pointer-events: none; }
}

/* ══════════════════════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.kpi-card {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-base);

  &--tinted {
    background: var(--bg-ternary);
    border-color: var(--border-secondary);
  }
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
}

.kpi-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);

  &--success { color: var(--color-success); }
  &--warning { color: var(--color-warning); }
}

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0 0;
}

/* ── Shared progress track ── */
.progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
  margin-top: var(--spacing-md);
}

.progress-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);

  &--accent   { background: var(--accent-primary); }
  &--success  { background: var(--color-success); }
  &--warning  { background: var(--color-warning); }
}

/* ══════════════════════════════════════════════════════════
   ANALYSIS GRID
   ══════════════════════════════════════════════════════════ */
.analysis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);

  @media (min-width: 1024px) { grid-template-columns: 7fr 5fr; }
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
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.panel-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  padding-bottom: var(--spacing-md);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
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

/* ── Aging list ── */
.aging-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.aging-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  gap: var(--spacing-lg);
}

.aging-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.aging-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius-sm);
  background: var(--color-error-bg);
  color: var(--color-error);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.aging-range {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 2px 0;
}

.aging-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.aging-right { text-align: right; flex-shrink: 0; }

.aging-amount {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-error);
  margin: 0 0 var(--spacing-xs) 0;
}

.priority-tag {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-sm);
  background: var(--color-error-bg);
  color: var(--color-error);
  border: var(--ui-border-width) solid var(--color-error-border);
}

/* ── Advisory ── */
.advisory {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--accent-focus);
  border: var(--ui-border-width) solid var(--accent-primary);
  border-radius: var(--ui-border-radius);
  margin-top: auto;
}

.advisory-icon {
  color: var(--accent-primary);
  font-size: var(--font-size-base);
  margin-top: 2px;
  flex-shrink: 0;
}

.advisory-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.advisory-body {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

/* ── Side column ── */
.side-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ── Tax rows ── */
.tax-rows { display: flex; flex-direction: column; gap: var(--spacing-sm); }

.tax-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: var(--ui-border-width) solid var(--border-primary);

  &--total {
    border-bottom: none;
    border-top: var(--ui-border-width) solid var(--border-primary);
    margin-top: var(--spacing-xs);
    padding-top: var(--spacing-md);
  }
}

.tax-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  &--strong { font-weight: var(--font-weight-semibold); color: var(--text-primary); }
}

.tax-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--error { color: var(--color-error); }
}

/* ── Credit block ── */
.credit-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.credit-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.text-right { text-align: right; }

.credit-micro-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
}

.credit-total {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0;
}

.credit-plans {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  margin: 0;
}

.repayment-box {
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-secondary);
  border-radius: var(--ui-border-radius);
}

.repayment-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.repayment-pct {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-success);
}

.repayment-foot {
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}

.mini-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.mini-stat {
  padding: var(--spacing-md);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  text-align: center;
  background: var(--bg-secondary);
}

.mini-val {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-secondary);
  margin: 0;

  &--success { color: var(--color-success); }
  &--error   { color: var(--color-error); }
}

/* ── Empty states ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  gap: var(--spacing-md);
  border: var(--ui-border-width) dashed var(--border-secondary);
  border-radius: var(--ui-border-radius);
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

.empty-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}
  `]
})
export class CashFlowAnalysisComponent implements OnInit {
  cashData = signal<any>(null);
  loading  = signal(false);

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    { key: 'date', label: 'Financial Period', type: 'date-range' },
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'All Branches'
    }
  ];

  private analyticsService = inject(AdminAnalyticsService);
  public  commonService    = inject(CommonMethodService);

  ngOnInit(): void {
    // Initial load is triggered by UniversalFilterComponent emitting defaults on init.
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getCashFlowAnalysis(
      this.currentFilters['startDate'],
      this.currentFilters['endDate'],
      this.currentFilters['branchId']
    ).subscribe({
      next: (res) => {
        if (res.status === 'success') this.cashData.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
// import { Component, OnInit, signal, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';


// @Component({
//   selector: 'app-cash-flow-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ProgressSpinnerModule,
//     UniversalFilterComponent // <--- Imported
//   ],
//   template: `
//     <div class="cashflow-container">
      
//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'cash-flow'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <div class="dashboard-content" [class.opacity-50]="loading()">
        
//         <div *ngIf="loading()" class="loading-overlay">
//            <p-progressSpinner styleClass="w-4rem h-4rem" strokeWidth="4"></p-progressSpinner>
//         </div>

//         <div class="kpi-grid">
//           <div class="kpi-card">
//             <p class="kpi-label">Available Liquidity</p>
//             <h2 class="kpi-value success">
//               {{ commonService.formatCurrency(cashData()?.summary?.profit?.value) }}
//             </h2>
//             <p class="kpi-subtext">Net Cash Position</p>
//           </div>

//           <div class="kpi-card">
//             <p class="kpi-label">Receivables (0-30d)</p>
//             <h2 class="kpi-value warning">
//                {{ commonService.formatCurrency(cashData()?.receivables?.aging?.[0]?.amount) }}
//             </h2>
//             <p class="kpi-subtext">Inbound flow pending</p>
//           </div>

//           <div class="kpi-card ratio-card">
//             <p class="kpi-label">Cash-to-Debt Ratio</p>
//             <h2 class="kpi-value">1:2.4</h2>
//             <div class="progress-track">
//                <div class="progress-fill" [style.width]="'40%'"></div>
//             </div>
//           </div>
//         </div>

//         <div class="analysis-grid">
          
//           <div class="analysis-column main">
//             <div class="content-card">
//               <div class="card-header">
//                 <h3 class="card-title">Inbound Aging Report</h3>
//                 <p-button icon="pi pi-print" [text]="true" size="small" severity="secondary"></p-button>
//               </div>

//               <div class="aging-list">
//                 @for (aging of cashData()?.receivables?.aging; track aging.range) {
//                   <div class="aging-item">
//                     <div class="aging-info">
//                       <div class="aging-icon-box">
//                          <i class="pi pi-history"></i>
//                       </div>
//                       <div>
//                         <p class="item-title">{{ aging.range }}</p>
//                         <p class="item-subtitle">{{ aging.count }} Pending Invoices</p>
//                       </div>
//                     </div>
//                     <div class="aging-value-box">
//                       <p class="item-amount">{{ commonService.formatCurrency(aging.amount) }}</p>
//                       <span class="status-badge high-priority">High Priority</span>
//                     </div>
//                   </div>
//                 }
//                 @if (!cashData()?.receivables?.aging?.length) {
//                    <div class="empty-state">
//                       <i class="pi pi-check-circle empty-icon"></i>
//                       <p class="empty-title">All Clear</p>
//                       <p class="empty-text">No overdue receivables at this time.</p>
//                    </div>
//                 }
//               </div>

//               <div class="advisory-box">
//                 <div class="advisory-content">
//                   <i class="pi pi-lightbulb advisory-icon"></i>
//                   <div>
//                     <p class="advisory-title">Cash Flow Advisory</p>
//                     <p class="advisory-text">
//                       <ng-container *ngIf="cashData()?.recommendations?.recommendations?.length > 0; else noRecs">
//                         {{ cashData()?.recommendations?.recommendations[0]?.reason }}. Target action: <strong>{{ cashData()?.recommendations?.recommendations[0]?.action }}</strong>.
//                       </ng-container>
//                       <ng-template #noRecs>
//                         Liquidity is healthy. No immediate actions required.
//                       </ng-template>
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="analysis-column side">
            
//             <div class="content-card">
//                <h3 class="card-title mb-lg">Tax Liability</h3>
//                <div class="liability-list">
//                  <div class="liability-row">
//                    <span class="row-label">Input GST</span>
//                    <span class="row-value">{{ commonService.formatCurrency(cashData()?.tax?.inputTax) }}</span>
//                  </div>
//                  <div class="liability-row">
//                    <span class="row-label">Output GST</span>
//                    <span class="row-value">{{ commonService.formatCurrency(cashData()?.tax?.outputTax) }}</span>
//                  </div>
//                  <div class="liability-row border-top">
//                    <span class="row-label strong">Net Payable</span>
//                    <span class="row-value error">{{ commonService.formatCurrency(cashData()?.tax?.netPayable) }}</span>
//                  </div>
//                </div>
//             </div>

//             <div class="content-card mt-lg">
//               <h3 class="card-title mb-lg">Active Credit Exposure</h3>

//               @for (emi of cashData()?.credit?.emiAnalytics; track emi._id) {
//                 <div class="credit-group">
//                   <div class="credit-header">
//                     <div>
//                       <p class="mini-label">Total Outstanding</p>
//                       <p class="large-value">{{ commonService.formatCurrency(emi.totalAmount) }}</p>
//                     </div>
//                     <div class="text-right">
//                       <p class="mini-label">Active EMIs</p>
//                       <p class="highlight-value">{{ emi.activeEMIs }} Plans</p>
//                     </div>
//                   </div>

//                   <div class="repayment-box">
//                     <div class="repayment-header">
//                       <span class="mini-label">Repayment Health</span>
//                       <span class="percent-value">{{ emi.completionRate | number:'1.0-0' }}%</span>
//                     </div>
//                     <div class="progress-track">
//                       <div class="progress-fill success" [style.width]="emi.completionRate + '%'"></div>
//                     </div>
//                     <div class="repayment-footer">
//                       <span>Paid: {{ emi.paidInstallments }}</span>
//                       <span>Total: {{ emi.totalInstallments }}</span>
//                     </div>
//                   </div>

//                   <div class="mini-stats-grid">
//                     <div class="mini-stat">
//                       <p class="mini-label">DEFAULTS</p>
//                       <p class="stat-value" [class.error]="emi.defaultedEMIs > 0">{{ emi.defaultedEMIs }}</p>
//                     </div>
//                     <div class="mini-stat">
//                       <p class="mini-label">INTEREST</p>
//                       <p class="stat-value success">{{ commonService.formatCurrency(emi.totalInterestEarned) }}</p>
//                     </div>
//                   </div>
//                 </div>
//               }
              
//               @if (!cashData()?.credit?.emiAnalytics?.length) {
//                  <div class="empty-state">
//                     <i class="pi pi-wallet empty-icon"></i>
//                     <p class="empty-text">No Active Credit Lines</p>
//                  </div>
//               }
//             </div>
//           </div>
//         </div>

//       </div> </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .cashflow-container { padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-primary); min-height: 100%; position: relative; }
    
//     .filter-section { margin-bottom: var(--spacing-md); }
//     .mt-lg { margin-top: var(--spacing-lg); }

//     /* Loading States */
//     .dashboard-content { position: relative; min-height: 400px; }
//     .opacity-50 { opacity: 0.5; pointer-events: none; transition: opacity 0.2s; }
//     .loading-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; }

//     /* Existing Styles preserved below... */
//     .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); }
//     .kpi-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); transition: var(--transition-base); }
//     .kpi-card.ratio-card { background: var(--bg-ternary); border-color: var(--border-secondary); }
//     .kpi-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px; }
//     .kpi-value { font-size: 1.75rem; font-weight: bold; color: var(--text-primary); margin: 0; }
//     .kpi-value.success { color: var(--theme-success); }
//     .kpi-value.warning { color: var(--theme-warning); }
//     .kpi-subtext { margin-top: 4px; color: var(--text-tertiary); font-size: 11px; }
//     .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; margin-top: 12px; overflow: hidden; }
//     .progress-fill { height: 100%; background: var(--accent-primary); border-radius: 99px; }
//     .progress-fill.success { background: var(--theme-success); }
//     .analysis-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media (min-width: 1024px) { .analysis-grid { grid-template-columns: 7fr 5fr; } }
//     .content-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); height: 100%; }
//     .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
//     .card-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: var(--text-primary); margin: 0; }
//     .card-title.mb-lg { margin-bottom: var(--spacing-lg); }
//     .aging-list { display: flex; flex-direction: column; gap: 8px; }
//     .aging-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); }
//     .aging-info { display: flex; align-items: center; gap: 12px; }
//     .aging-icon-box { width: 2.5rem; height: 2.5rem; border-radius: var(--ui-border-radius); display: flex; align-items: center; justify-content: center; background: var(--color-error-bg); color: var(--color-error); }
//     .item-title { font-weight: bold; font-size: 13px; color: var(--text-primary); margin: 0; }
//     .item-subtitle { font-size: 11px; color: var(--text-tertiary); margin: 0; }
//     .aging-value-box { text-align: right; }
//     .item-amount { font-size: 16px; font-weight: bold; color: var(--color-error); margin: 0 0 2px 0; }
//     .status-badge { display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: var(--color-error-bg); color: var(--color-error); }
//     .advisory-box { margin-top: var(--spacing-lg); padding: var(--spacing-md); border: 1px dashed var(--accent-primary); background: var(--color-primary-bg); border-radius: var(--ui-border-radius); }
//     .advisory-content { display: flex; gap: 12px; }
//     .advisory-icon { color: var(--accent-primary); margin-top: 2px; }
//     .advisory-title { font-weight: bold; font-size: 13px; color: var(--accent-primary); margin: 0 0 4px 0; }
//     .advisory-text { font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
//     .liability-list { display: flex; flex-direction: column; gap: 8px; }
//     .liability-row { display: flex; justify-content: space-between; align-items: center; }
//     .liability-row.border-top { border-top: 1px solid var(--border-primary); padding-top: 8px; margin-top: 8px; }
//     .row-label { font-size: 12px; color: var(--text-tertiary); }
//     .row-label.strong { font-weight: bold; color: var(--text-secondary); }
//     .row-value { font-weight: bold; color: var(--text-primary); font-size: 14px; }
//     .row-value.error { color: var(--color-error); }
//     .credit-group { display: flex; flex-direction: column; gap: var(--spacing-lg); }
//     .credit-header { display: flex; justify-content: space-between; align-items: flex-end; }
//     .mini-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); margin: 0 0 2px 0; }
//     .large-value { font-size: 1.5rem; font-weight: bold; color: var(--text-primary); margin: 0; }
//     .highlight-value { font-weight: bold; color: var(--theme-info); margin: 0; }
//     .repayment-box { padding: 12px; background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); }
//     .repayment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
//     .percent-value { font-weight: bold; font-size: 12px; color: var(--theme-success); }
//     .repayment-footer { display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: var(--text-tertiary); }
//     .mini-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
//     .mini-stat { padding: 8px; border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius); text-align: center; }
//     .stat-value { font-weight: bold; color: var(--text-tertiary); margin: 0; }
//     .stat-value.error { color: var(--color-error); }
//     .stat-value.success { color: var(--theme-success); }
//     .empty-state { padding: var(--spacing-xl); border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.7; }
//     .empty-icon { font-size: 2rem; margin-bottom: var(--spacing-sm); color: var(--theme-success); }
//     .empty-text, .empty-title { font-size: 13px; color: var(--text-secondary); margin: 0; }
//     .empty-title { font-weight: bold; }
//   `]
// })
// export class CashFlowAnalysisComponent implements OnInit {
//   cashData = signal<any>(null);
//   loading = signal<boolean>(false); // Start false, filters will trigger load

//   // Active filters storage
//   private currentFilters: any = {};

//   // 1. CONFIGURE FILTERS
//   filterConfig: FilterField[] = [
//     {
//       key: 'date',
//       label: 'Financial Period',
//       type: 'date-range'
//     },
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       // Dynamic Data: Pulls from MasterListService.branches()
//       dataSourceKey: 'branches',
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'All Branches'
//     }
//   ];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService
//   ) {}

//   ngOnInit() {
//     // If Filter Component has defaults, it emits on init.
//     // If not, we might want to trigger a default load here:
//     // this.loadData(); 
//   }

//   // 2. HANDLE FILTER CHANGES
//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);

//     const params = {
//       startDate: this.currentFilters.startDate,
//       endDate: this.currentFilters.endDate,
//       branchId: this.currentFilters.branchId
//     };

//     this.analyticsService.getCashFlowAnalysis(
//       params.startDate, 
//       params.endDate, 
//       params.branchId
//     ).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.cashData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.loading.set(false);
//       }
//     });
//   }
// }