import { Component, OnInit, signal, computed, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

interface EMIData {
  _id: string;
  totalPortfolio: number;
  collectionEfficiency: number;
  defaultRate: number;
  status: string;
}

@Component({
  selector: 'app-emi-analytics',
  standalone: true,
  imports: [
    CommonModule, ProgressSpinnerModule, TooltipModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="emi-root">

  <!-- ══════════════════════════════════════
       HEADER
  ═══════════════════════════════════════ -->
  <div class="page-header">
    <div>
      <h2 class="page-title">Credit &amp; EMI Intelligence</h2>
      <p class="page-sub">Monitoring credit exposure, repayment health, and default risks</p>
    </div>
    <div class="header-actions">
      <button class="action-btn" pTooltip="Credit Limits" tooltipPosition="bottom">
        <i class="pi pi-shield"></i>
        <span>Credit Limits</span>
      </button>
      <button class="action-btn action-btn--primary" (click)="loadData()" [disabled]="loading()" pTooltip="Sync portfolio" tooltipPosition="bottom">
        <i class="pi pi-refresh" [class.spinning]="loading()"></i>
        <span>Sync Portfolio</span>
      </button>
    </div>
  </div>

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="emi-analytics"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- ══════════════════════════════════════
       LOADING
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" styleClass="w-12 h-12"></p-progressSpinner>
      <span class="loader-text">Auditing credit portfolio…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading()) {

    <!-- KPI strip -->
    <div class="kpi-strip">

      <div class="kpi-card">
        <i class="pi pi-briefcase kpi-watermark" aria-hidden="true"></i>
        <p class="kpi-label">Total Portfolio Value</p>
        <p class="kpi-value kpi-value--accent">
          {{ commonService.formatCurrency(emiSummary()?.totalPortfolio) }}
        </p>
        <p class="kpi-sub">Across active credit lines</p>
      </div>

      <div class="kpi-card">
        <p class="kpi-label">Collection Efficiency</p>
        <p class="kpi-value kpi-value--warning">
          {{ emiSummary()?.collectionEfficiency | number:'1.0-1' }}%
        </p>
        <span class="kpi-badge kpi-badge--warning">Needs attention</span>
      </div>

      <!-- Health card uses accent gradient — intentionally a themed surface -->
      <div class="kpi-card kpi-card--gradient">
        <p class="kpi-label kpi-label--light">Portfolio Health</p>
        <p class="kpi-value kpi-value--light">
          {{ 100 - ((emiSummary()?.defaultRate || 0) * 100) | number:'1.0-1' }}%
        </p>
        <p class="kpi-sub kpi-sub--light">
          Default Rate: {{ (emiSummary()?.defaultRate || 0) * 100 | number:'1.2-2' }}%
        </p>
      </div>

    </div>

    <!-- Body grid: table + sidebar -->
    <div class="body-grid">

      <!-- ── Main: portfolio grid ── -->
      <div class="panel">
        <div class="panel-head">
          <h3 class="panel-title">Portfolio Segments</h3>
          <span class="data-tag">Data view</span>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="emiColumns"
            [data]="emiRawData()"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

      <!-- ── Side: risk gauge + recovery ── -->
      <div class="side-col">

        <!-- Risk gauge -->
        <div class="panel panel--center">
          <h3 class="widget-title">Risk Assessment</h3>

          <div class="gauge-wrap">
            <svg viewBox="0 0 36 36" class="gauge-svg" aria-label="Default rate gauge">
              <path class="gauge-track"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="gauge-fill"
                [attr.stroke-dasharray]="((emiSummary()?.defaultRate || 0) * 100) + ', 100'"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            </svg>
            <div class="gauge-center">
              <span class="gauge-pct">{{ (emiSummary()?.defaultRate || 0) * 100 | number:'1.1-1' }}%</span>
              <span class="gauge-lbl">Default</span>
            </div>
          </div>

          <div class="gauge-legend">
            <div class="legend-row">
              <span class="legend-dot legend-dot--healthy"></span>
              Active ({{ 100 - ((emiSummary()?.defaultRate || 0) * 100) | number:'1.0-0' }}%)
            </div>
            <div class="legend-row">
              <span class="legend-dot legend-dot--risk"></span>
              Default ({{ (emiSummary()?.defaultRate || 0) * 100 | number:'1.0-0' }}%)
            </div>
          </div>
        </div>

        <!-- Recovery pipeline -->
        <div class="panel">
          <h3 class="widget-title">Recovery Pipeline</h3>
          <div class="pipeline-row">
            <span class="pipeline-label">Efficiency Target</span>
            <span class="pipeline-value">95%</span>
          </div>
          <div class="pipeline-row">
            <span class="pipeline-label">Current Rate</span>
            <span class="pipeline-value pipeline-value--warning">{{ emiSummary()?.collectionEfficiency }}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill progress-fill--warning" [style.width.%]="emiSummary()?.collectionEfficiency"></div>
          </div>
        </div>

      </div>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   EMI ANALYTICS — TOKEN-DRIVEN
   .kpi-card--gradient uses var(--accent-gradient) which IS a
   token — it's mapped in apply-canonical-mapping. The #fff
   used for text on that card is intentional — it renders on
   an accent-colored background where white is universally
   correct regardless of light/dark theme.
   ============================================================ */

:host { display: block; width: 100%; }

.emi-root {
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
  flex-wrap: wrap;
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

.header-actions { display: flex; align-items: center; gap: var(--spacing-md); }

.action-btn {
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

  &:hover:not(:disabled) { background: var(--component-bg-hover); color: var(--accent-primary); }
  &:disabled { opacity: var(--state-loading-opacity); cursor: not-allowed; }

  &--primary {
    background: var(--accent-primary);
    color: #fff;
    border-color: var(--accent-primary);

    &:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); color: #fff; }
  }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

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
   KPI STRIP
   ══════════════════════════════════════════════════════════ */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.kpi-card {
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  /* Gradient card: uses the theme's accent-gradient token */
  &--gradient {
    background: var(--accent-gradient);
    border: none;
    box-shadow: var(--shadow-lg);
  }
}

/* Watermark icon */
.kpi-watermark {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: var(--font-size-5xl);
  opacity: 0.05;
  pointer-events: none;
  color: var(--text-primary);
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0;

  &--light { color: rgba(255, 255, 255, 0.75); }
}

.kpi-value {
  font-family: var(--font-heading);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);

  &--accent  { color: var(--accent-primary); }
  &--warning { color: var(--color-warning); }
  /* White on gradient card — intentionally fixed, universally legible */
  &--light   { color: #fff; }
}

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;

  &--light { color: rgba(255, 255, 255, 0.85); font-weight: var(--font-weight-semibold); }
}

.kpi-badge {
  display: inline-flex;
  align-items: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);

  &--warning {
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border: var(--ui-border-width) solid var(--color-warning-border);
  }
}

/* ══════════════════════════════════════════════════════════
   BODY GRID
   ══════════════════════════════════════════════════════════ */
.body-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 400px;

  @media (min-width: 1024px) { grid-template-columns: 3fr 1fr; }
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
  overflow: hidden;

  &--center { align-items: center; text-align: center; }
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding-bottom: var(--spacing-md);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  width: 100%;
}

.data-tag {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-secondary);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-sm);
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

/* ── Risk gauge ── */
.gauge-wrap {
  position: relative;
  width: 120px;
  height: 120px;
}

.gauge-svg { display: block; width: 100%; height: 100%; }

.gauge-track {
  fill: none;
  stroke: var(--bg-ternary);
  stroke-width: 3.8;
}

.gauge-fill {
  fill: none;
  stroke: var(--color-error);
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray var(--transition-slow);
}

.gauge-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-pct {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  line-height: 1;
}

.gauge-lbl {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  color: var(--color-error);
}

/* Gauge legend */
.gauge-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  width: 100%;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--ui-border-radius-pill);
  flex-shrink: 0;

  &--healthy { background: var(--bg-ternary); border: var(--ui-border-width) solid var(--border-secondary); }
  &--risk    { background: var(--color-error); }
}

/* ── Recovery pipeline ── */
.pipeline-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.pipeline-label { color: var(--text-secondary); }

.pipeline-value {
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--warning { color: var(--color-warning); }
}

.progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);
  &--warning { background: var(--color-warning); }
}
  `]
})
export class EmiAnalyticsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  emiRawData = signal<EMIData[]>([]);
  loading    = signal(false);
  emiColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  // First entry is the summary row
  emiSummary = computed<EMIData | null>(() => this.emiRawData()[0] ?? null);

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Portfolio'
    }
  ];

  private analyticsService = inject(AdminAnalyticsService);
  public  commonService    = inject(CommonMethodService);
  private cdr              = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.setupColumns();
  }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getEMIAnalytics(this.currentFilters['branchId']).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.status === 'success') this.emiRawData.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.emiColumns = [
      {
        field: '_id',
        headerName: 'Segment',
        width: 120,
        cellRenderer: (p: any) => {
          const status   = p.value ?? 'Unknown';
          const isActive = status === 'active';
          const bg     = isActive ? 'var(--color-success-bg)'    : 'var(--bg-ternary)';
          const color  = isActive ? 'var(--color-success)'       : 'var(--text-secondary)';
          const border = isActive ? 'var(--color-success-border)' : 'var(--border-secondary)';
          return `<span style="font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);text-transform:uppercase;padding:2px 8px;border-radius:var(--ui-border-radius-sm);background:${bg};color:${color};border:1px solid ${border};">${status}</span>`;
        }
      },
      {
        field: 'totalPortfolio',
        headerName: 'Total Portfolio',
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--text-primary)',
          'text-align': 'right'
        }
      },
      {
        field: 'collectionEfficiency',
        headerName: 'Efficiency',
        width: 120,
        type: 'rightAligned',
        cellRenderer: (p: any) => {
          const val   = p.value ?? 0;
          const color = val > 80 ? 'var(--color-success)' : 'var(--color-warning)';
          return `<span style="font-weight:var(--font-weight-bold);font-family:var(--font-mono);color:${color};">${val}%</span>`;
        }
      },
      {
        field: 'defaultRate',
        headerName: 'Default Risk',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (p: any) => (((p.value ?? 0) * 100).toFixed(2)) + '%',
        cellStyle: {
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--color-error)',
          'text-align': 'right'
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
// import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { TooltipModule } from 'primeng/tooltip';

// // Services
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';

// // Components
// import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// interface EMIData {
//   _id: string;
//   totalPortfolio: number; // Mapped from JSON
//   collectionEfficiency: number;
//   defaultRate: number;
//   status: string;
// }

// @Component({
//   selector: 'app-emi-analytics',
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
//     <div class="emi-container">

//       <div class="header-section">
//         <div>
//           <h2 class="page-title">Credit & EMI Intelligence</h2>
//           <p class="page-subtitle">
//             Monitoring credit exposure, repayment health, and default risks
//           </p>
//         </div>
//         <div class="action-group">
//             <p-button label="Credit Limits" icon="pi pi-shield" [text]="true" severity="secondary" size="small"></p-button>
//             <p-button label="Sync Portfolio" icon="pi pi-refresh" severity="info" size="small" (onClick)="loadData()"></p-button>
//         </div>
//       </div>

//       <div class="filter-section">
//         <app-universal-filter
//           [entityType]="'emi-analytics'"
//           [config]="filterConfig"
//           (filterChange)="onFilterUpdate($event)">
//         </app-universal-filter>
//       </div>

//       <ng-container *ngIf="!loading(); else loader">
        
//         <div class="kpi-grid">
          
//           <div class="kpi-card exposure-card">
//             <p class="kpi-label">Total Portfolio Value</p>
//             <h2 class="kpi-value primary">{{ commonService.formatCurrency(emiSummary()?.totalPortfolio) }}</h2>
//             <p class="kpi-subtext">Across active credit lines</p>
//             <i class="pi pi-briefcase kpi-bg-icon"></i>
//           </div>

//           <div class="kpi-card efficiency-card">
//             <p class="kpi-label">Collection Efficiency</p>
//             <h2 class="kpi-value warning">{{ emiSummary()?.collectionEfficiency | number:'1.0-1' }}%</h2>
//             <div class="kpi-badge-row">
//                <span class="badge warning">Needs Attention</span>
//             </div>
//           </div>

//           <div class="kpi-card health-card">
//             <p class="kpi-label dark">Portfolio Health</p>
//             <h2 class="kpi-value dark">{{ 100 - ((emiSummary()?.defaultRate || 0) * 100) | number:'1.0-1' }}%</h2>
//             <p class="kpi-subtext dark">Default Rate: {{ (emiSummary()?.defaultRate || 0) * 100 | number:'1.2-2' }}%</p>
//           </div>
//         </div>

//         <div class="content-grid">
          
//           <div class="main-column">
//             <div class="grid-card">
//                <div class="grid-header">
//                  <h3 class="grid-title">Portfolio Segments</h3>
//                  <span class="grid-tag">DATA VIEW</span>
//                </div>

//                <div class="grid-container">
//                   <app-ag-share-grid 
//                     [columns]="emiColumns" 
//                     [data]="emiRawData()" 
// 
//                     class="full-size-grid">
//                   </app-ag-share-grid>
//                </div>
//             </div>
//           </div>

//           <div class="side-column">
            
//             <div class="risk-card">
//                <h3 class="side-title">Risk Assessment</h3>
               
//                <div class="gauge-container">
//                   <svg viewBox="0 0 36 36" class="circular-chart">
//                     <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
//                     <path class="circle" 
//                           [attr.stroke-dasharray]="((emiSummary()?.defaultRate || 0) * 100) + ', 100'" 
//                           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
//                   </svg>
//                   <div class="gauge-text">
//                      <span class="risk-val">{{ (emiSummary()?.defaultRate || 0) * 100 | number:'1.1-1' }}%</span>
//                      <span class="risk-lbl">Default</span>
//                   </div>
//                </div>

//                <div class="risk-legend">
//                   <div class="legend-item">
//                      <span class="dot healthy"></span> Active ({{ 100 - ((emiSummary()?.defaultRate || 0) * 100) | number:'1.0-0' }}%)
//                   </div>
//                   <div class="legend-item">
//                      <span class="dot risk"></span> Default ({{ (emiSummary()?.defaultRate || 0) * 100 | number:'1.0-0' }}%)
//                   </div>
//                </div>
//             </div>

//             <div class="pipeline-card">
//                <h3 class="side-title">Recovery Pipeline</h3>
//                <div class="pipeline-row">
//                   <span class="lbl">Efficiency Target</span>
//                   <span class="val">95%</span>
//                </div>
//                <div class="pipeline-row">
//                   <span class="lbl">Current Rate</span>
//                   <span class="val warning">{{ emiSummary()?.collectionEfficiency }}%</span>
//                </div>
//                <div class="progress-track">
//                   <div class="progress-fill warning" [style.width]="emiSummary()?.collectionEfficiency + '%'"></div>
//                </div>
//             </div>

//           </div>
//         </div>

//       </ng-container>

//       <ng-template #loader>
//         <div class="loader-container">
//           <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//           <p class="loader-text">Auditing Credit Portfolio...</p>
//         </div>
//       </ng-template>

//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }

//     .emi-container {
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--bg-primary);
//       font-family: var(--font-body);
//       min-height: 100%;
//     }

//     /* HEADER */
//     .header-section {
//       display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end;
//       gap: var(--spacing-md); margin-bottom: var(--spacing-md);
//     }
    
//     .filter-section { margin-bottom: var(--spacing-lg); }

//     .page-title { font-size: var(--font-size-2xl); font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
//     .page-subtitle { color: var(--text-tertiary); font-size: var(--font-size-sm); margin: 0; }
//     .action-group { display: flex; align-items: center; gap: var(--spacing-sm); }

//     /* KPI GRID */
//     .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }

//     /* KPI CARDS */
//     .kpi-card {
//       background: var(--bg-secondary); border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl); padding: var(--spacing-lg);
//       position: relative; overflow: hidden;
//     }

//     .kpi-label { font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; color: var(--text-label); margin: 0 0 4px 0; }
//     .kpi-label.dark { color: rgba(255,255,255,0.8); }

//     .kpi-value { font-size: var(--font-size-3xl); font-weight: 800; font-family: var(--font-heading); margin: 0; color: var(--text-primary); }
//     .kpi-value.warning { color: var(--color-warning); }
//     .kpi-value.dark { color: #ffffff; }

//     .kpi-subtext { margin-top: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--text-tertiary); }
//     .kpi-subtext.dark { color: rgba(255,255,255,0.9); font-weight: 600; }

//     .kpi-bg-icon { position: absolute; right: -10px; bottom: -10px; font-size: 4rem; opacity: 0.05; pointer-events: none; }

//     .kpi-badge-row { display: flex; margin-top: var(--spacing-sm); }
//     .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
//     .badge.warning { background: var(--color-warning-bg); color: var(--color-warning); }

//     .health-card { background: var(--accent-gradient); border: none; color: #ffffff; box-shadow: var(--shadow-lg); }

//     /* LAYOUT GRID */
//     .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media (min-width: 1024px) { .content-grid { grid-template-columns: 3fr 1fr; } }

//     /* MAIN GRID CARD */
//     .grid-card {
//       background: var(--bg-secondary); border: 1px solid var(--border-primary);
//       border-radius: var(--radius-2xl); overflow: hidden; height: 100%; min-height: 400px;
//       display: flex; flex-direction: column;
//     }
//     .grid-header { padding: var(--spacing-md) var(--spacing-lg); border-bottom: 1px solid var(--border-primary); background: var(--bg-ternary); display: flex; justify-content: space-between; align-items: center; }
//     .grid-title { font-size: var(--font-size-sm); font-weight: 800; text-transform: uppercase; color: var(--text-primary); margin: 0; }
//     .grid-tag { font-size: 10px; font-weight: bold; color: var(--text-label); background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-secondary); }
//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* SIDE COLUMN */
//     .side-column { display: flex; flex-direction: column; gap: var(--spacing-lg); }
//     .side-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: var(--spacing-lg); }

//     /* RISK GAUGE */
//     .risk-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); padding: var(--spacing-xl); text-align: center; }
//     .gauge-container { position: relative; width: 120px; height: 120px; margin: 0 auto var(--spacing-lg); }
//     .circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 100%; }
//     .circle-bg { fill: none; stroke: var(--bg-ternary); stroke-width: 3.8; }
//     .circle { fill: none; stroke-width: 3.8; stroke-linecap: round; stroke: var(--color-error); transition: stroke-dasharray 1s ease; }
    
//     .gauge-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
//     .risk-val { font-size: 18px; font-weight: 800; color: var(--text-primary); }
//     .risk-lbl { font-size: 10px; font-weight: 700; color: var(--color-error); text-transform: uppercase; }

//     .risk-legend { display: flex; justify-content: center; gap: var(--spacing-md); font-size: 11px; color: var(--text-secondary); }
//     .legend-item { display: flex; align-items: center; gap: 6px; }
//     .dot { width: 8px; height: 8px; border-radius: 50%; }
//     .dot.healthy { background: var(--bg-ternary); }
//     .dot.risk { background: var(--color-error); }

//     /* PIPELINE CARD */
//     .pipeline-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); padding: var(--spacing-lg); }
//     .pipeline-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
//     .pipeline-row .val { font-weight: 700; }
//     .pipeline-row .val.warning { color: var(--color-warning); }
    
//     .progress-track { width: 100%; height: 6px; background: var(--bg-ternary); border-radius: 99px; overflow: hidden; margin-top: 8px; }
//     .progress-fill.warning { background: var(--color-warning); height: 100%; }

//     /* LOADER */
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//     .loader-text { font-size: var(--font-size-sm); font-weight: 700; text-transform: uppercase; color: var(--text-tertiary); }
//   `]
// })
// export class EmiAnalyticsComponent implements OnInit {
//   emiRawData = signal<EMIData[]>([]);
//   loading = signal<boolean>(false);
//   emiColumns: any[] = [];

//   // Filter State
//   private currentFilters: any = {};

//   // Computed Summary
//   emiSummary: any = computed(() => this.emiRawData().length ? this.emiRawData()[0] : null);

//   filterConfig: FilterField[] = [
//     { key: 'branchId', label: 'Branch Context', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'Global Portfolio' }
//   ];

//   constructor(
//     private analyticsService: AdminAnalyticsService,
//     public commonService: CommonMethodService,
//     private cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit() {
//     this.setupColumns();
//     // loadData triggered by filter init
//   }

//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData() {
//     this.loading.set(true);
//     const branchId = this.currentFilters.branchId;

//     this.analyticsService.getEMIAnalytics(branchId).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.emiRawData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   setupColumns(): void {
//     this.emiColumns = [
//       {
//         field: '_id', 
//         headerName: 'Segment', 
//         width: 120,
//         cellRenderer: (params: any) => {
//           const status = params.value || 'Unknown';
//           const isActive = status === 'active';
          
//           const bg = isActive ? 'var(--color-success-bg)' : 'var(--bg-ternary)';
//           const color = isActive ? 'var(--color-success)' : 'var(--text-secondary)';
//           const border = isActive ? 'var(--color-success-border)' : 'var(--border-secondary)';
          
//           return `<span style="font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; background: ${bg}; color: ${color}; border: 1px solid ${border};">
//                     ${status}
//                   </span>`;
//         }
//       },
//       {
//         field: 'totalPortfolio', 
//         headerName: 'Total Portfolio', 
//         flex: 1,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: { 'font-weight': '700', 'color': 'var(--text-primary)', 'font-family': 'var(--font-mono)' }
//       },
//       {
//         field: 'collectionEfficiency', 
//         headerName: 'Efficiency', 
//         width: 120,
//         type: 'rightAligned',
//         cellRenderer: (params: any) => {
//            const val = params.value || 0;
//            // If 0 efficiency, show warning
//            const color = val > 80 ? 'var(--color-success)' : 'var(--color-warning)';
//            return `<span style="font-weight: 700; color: ${color}; font-family: var(--font-mono);">${val}%</span>`;
//         }
//       },
//       {
//         field: 'defaultRate', 
//         headerName: 'Default Risk', 
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => ((params.value || 0) * 100).toFixed(2) + '%',
//         cellStyle: { 'font-weight': '700', 'color': 'var(--color-error)', 'font-family': 'var(--font-mono)' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }