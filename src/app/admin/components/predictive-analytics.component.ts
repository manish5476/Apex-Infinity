import { Component, OnInit, signal, inject, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';

// Components
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-predictive-analytics',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    TooltipModule,
    AgShareGrid,
    UniversalFilterComponent
  ],
  template: `
    <div class="pa-root">

      <div class="unified-control-panel">
        
        <div class="ucp-header">
          <div class="header-left">
            <div class="header-icon-wrap">
              <i class="pi pi-chart-line"></i>
            </div>
            <div>
              <h2 class="page-title">Future-State Modeling</h2>
              <p class="page-meta">
                AI-driven forecasts
                <span class="meta-divider">·</span>
                Horizon: <span class="mono">{{ currentFilters.periods }} Periods</span>
              </p>
            </div>
          </div>
          
          <div class="header-actions">
             <div class="confidence-badge" [class.high]="(forecast()?.confidence || 0) >= 80">
               <i class="pi pi-verified"></i>
               <span>Model Confidence: {{ forecast()?.confidence || 0 }}%</span>
             </div>
             <button class="action-btn action-btn--primary" (click)="loadData()" [disabled]="loading()" pTooltip="Run Simulation" tooltipPosition="bottom">
               <i class="pi pi-sync" [class.spinning]="loading()"></i>
             </button>
          </div>
        </div>

        <div class="ucp-filters">
          <app-universal-filter
            entityType="predictive-analytics"
            [config]="filterConfig"
            (filterChange)="onFilterUpdate($event)">
          </app-universal-filter>
        </div>

      </div>

      @if (loading()) {
        <div class="loader-state">
          <p-progressSpinner strokeWidth="3" animationDuration=".8s"></p-progressSpinner>
          <span class="loader-text">Running Monte Carlo Simulations…</span>
        </div>
      }

      @if (!loading()) {
        
        <div class="kpi-strip">
          
          <div class="kpi-card">
            <p class="kpi-label">Revenue Forecast ({{ forecast()?.period || 'N/A' }})</p>
            <h2 class="kpi-value">{{ commonService.formatCurrency(forecast()?.predictedRevenue || 0) }}</h2>
            
            <div class="range-box">
              <div class="range-labels">
                 <span class="range-low">Low: {{ commonService.formatCurrency(forecast()?.range?.low || 0) }}</span>
                 <span class="range-high">High: {{ commonService.formatCurrency(forecast()?.range?.high || 0) }}</span>
              </div>
              <div class="range-track">
                 <div class="range-bar" style="left: 15%; right: 15%;"></div>
                 <div class="range-dot" style="left: 50%"></div>
              </div>
            </div>
          </div>

          <div class="kpi-card kpi-card--success" style="--accent: var(--color-success)">
            <p class="kpi-label">Projected Cash Position</p>
            <h2 class="kpi-value kpi-value--success">{{ commonService.formatCurrency(predictData()?.cashFlow?.projectedCash || 0) }}</h2>
            <p class="kpi-sub">End-of-Period Estimate</p>
          </div>

          <div class="kpi-card model-card">
             <p class="model-label">Prediction Quality</p>
             <h3 class="model-value">{{ (forecast()?.confidence || 0) >= 80 ? 'High Accuracy' : 'Moderate' }}</h3>
             <div class="progress-track">
                <div class="progress-fill" [style.width.%]="forecast()?.confidence || 0"></div>
             </div>
          </div>

        </div>

        <div class="body-grid">
          
          <div class="body-main">
            <div class="panel panel--flex">
              <div class="panel-head">
                <h3 class="panel-title">30-Day Liquidity Map</h3>
                <div class="legend-row">
                  <div class="legend-item"><div class="dot positive"></div><span>Inflow</span></div>
                  <div class="legend-item"><div class="dot neutral"></div><span>Net Position</span></div>
                </div>
              </div>
              <div class="grid-wrap">
                 <app-ag-share-grid 
                   [columns]="projectionColumns" 
                   [data]="predictData()?.cashFlow?.dailyProjections || []" 
                   class="fill-grid">
                 </app-ag-share-grid>
              </div>
            </div>
          </div>

          <div class="body-sidebar">
            
            <div class="panel panel--flex">
              <div class="panel-head">
                <h3 class="panel-title">Inventory Risk Engine</h3>
              </div>
              
              <div class="risk-content">
                @if (predictData()?.inventory?.predictions?.length) {
                  <div class="risk-list">
                     @for (pred of predictData()?.inventory?.predictions; track pred._id) {
                       <div class="risk-item">
                          <span class="risk-prod">{{ pred.name }}</span>
                          <span class="risk-prob">High Prob</span>
                       </div>
                     }
                  </div>
                } @else {
                  <div class="empty-state">
                     <i class="pi pi-box empty-icon"></i>
                     <p class="empty-text">No immediate stock-out risks detected.</p>
                  </div>
                }
              </div>

              <div class="ai-box">
                  <div class="ai-icon-box"><i class="pi pi-sparkles ai-icon"></i></div>
                  <div>
                    <p class="ai-title">AI Insight</p>
                    <p class="ai-text">
                      Projected revenue variance is 
                      <span class="highlight">±{{ getVariance() | number:'1.0-1' }}%</span>. 
                      Cash flow stability remains high for the selected period.
                    </p>
                  </div>
              </div>
            </div>

          </div>
        </div>

      }

    </div>
  `,
  styles: [`
/* ============================================================
   PREDICTIVE ANALYTICS — PREMIUM TOKEN-DRIVEN
   ============================================================ */

:host {
  display: block;
  height: 100%;
  width: 100%;
  overflow: hidden;

  /* Component specific fallback tokens */
  --elevation-1: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
  --elevation-2: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
  --ui-border-radius-sharp: 6px; 
}

/* ── Root shell ── */
.pa-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  background: var(--bg-secondary);
  overflow: hidden;
  font-family: var(--font-body);
  color: var(--text-primary);
}

/* ══════════════════════════════════════════════════════════
   UNIFIED COMMAND CENTER (Header + Filters)
   ══════════════════════════════════════════════════════════ */
.unified-control-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sharp);
  box-shadow: var(--elevation-1);
}

.ucp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.header-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--ui-border-radius-sm);
  background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  margin-top: 2px;
}

.page-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.01em;
}

.page-meta {
  display: flex;
  align-items: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  margin: 4px 0 0 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-divider {
  margin: 0 8px;
  color: var(--border-secondary);
}

.mono { font-family: var(--font-mono); letter-spacing: 0; text-transform: none; }

/* Header action buttons */
.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.confidence-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--spacing-md);
  height: 28px;
  border-radius: var(--ui-border-radius-pill);
  border: 1px dashed var(--border-secondary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: var(--transition-base);

  &.high {
    border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
    background: var(--color-success-bg);
    color: var(--color-success);
  }
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius-sm);
  cursor: pointer;
  transition: var(--transition-base);

  i { font-size: var(--font-size-base); }

  &--primary {
    background: var(--accent-gradient, var(--accent-primary));
    color: #fff;
    border-color: transparent;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent-primary) 30%, transparent);

    &:hover:not(:disabled) {
      filter: brightness(1.05);
      transform: translateY(-1px);
    }
  }

  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Bottom Filter Container inside UCP */
.ucp-filters {
  padding: 10px var(--spacing-xl);
  background: var(--bg-secondary);
  border-bottom-left-radius: var(--ui-border-radius-sharp);
  border-bottom-right-radius: var(--ui-border-radius-sharp);
}

/* ══════════════════════════════════════════════════════════
   LOADER STATE
   ══════════════════════════════════════════════════════════ */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

.kpi-card {
  position: relative;
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sharp);
  box-shadow: var(--elevation-1);
  padding: var(--spacing-lg);
  border-bottom: 3px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;

  /* Soft premium glow effect */
  &::before {
    content: '';
    position: absolute;
    top: -20px; right: -20px;
    width: 80px; height: 80px;
    background: var(--accent, var(--accent-primary));
    border-radius: 50%;
    filter: blur(30px);
    opacity: 0.08;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  &:hover {
    box-shadow: var(--elevation-2);
    transform: translateY(-2px);
    &::before { opacity: 0.15; }
  }

  &--success { border-bottom-color: var(--color-success); }
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
  font-family: var(--font-mono);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);

  &--success { color: var(--color-success); }
}

.kpi-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: var(--spacing-sm) 0 0 0;
}

/* Range Box */
.range-box { margin-top: 14px; }
.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  margin-bottom: 6px;
}
.range-track {
  width: 100%;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: var(--ui-border-radius-pill);
  position: relative;
  overflow: hidden;
}
.range-bar {
  position: absolute;
  height: 100%;
  background: color-mix(in srgb, var(--accent-primary) 40%, var(--bg-secondary));
  border-radius: var(--ui-border-radius-pill);
}
.range-dot {
  position: absolute;
  width: 4px;
  height: 10px;
  background: var(--accent-primary);
  top: -2px;
  border-radius: 2px;
  transform: translateX(-50%);
}

/* Prediction Quality Card */
.model-card {
  background: var(--accent-gradient, var(--accent-primary));
  border: none;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &::before { display: none; } /* Remove standard glow */
  
  .model-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    opacity: 0.85;
    margin: 0 0 4px 0;
  }
  .model-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
  }
  .progress-track {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--ui-border-radius-pill);
    margin-top: var(--spacing-md);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #ffffff;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
    transition: width 0.6s ease;
  }
}

/* ══════════════════════════════════════════════════════════
   BODY GRID
   ══════════════════════════════════════════════════════════ */
.body-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
}

/* ══════════════════════════════════════════════════════════
   SHARED PANEL
   ══════════════════════════════════════════════════════════ */
.panel {
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sharp);
  box-shadow: var(--elevation-1);

  &--flex {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    min-height: 0;
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-primary);
  margin: 0;
}

/* ══════════════════════════════════════════════════════════
   MAIN COLUMN (Liquidity Grid)
   ══════════════════════════════════════════════════════════ */
.body-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.legend-row {
  display: flex;
  gap: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .dot { width: 8px; height: 8px; border-radius: 50%; }
  .dot.positive { background: var(--color-success); }
  .dot.neutral { background: var(--text-tertiary); }
  
  span {
    font-size: 9px;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    color: var(--text-secondary);
  }
}

/* Grid wrapper for strict flex sizing */
.grid-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.fill-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ══════════════════════════════════════════════════════════
   SIDEBAR (Risk Engine + AI Box)
   ══════════════════════════════════════════════════════════ */
.body-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
}

.risk-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-sm);
  border-left: 3px solid var(--color-error);
}

.risk-prod {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.risk-prob {
  font-size: 9px;
  color: var(--color-error);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 28px;
  color: var(--text-tertiary);
  opacity: 0.5;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: var(--font-size-sm);
  margin: 0;
  font-weight: var(--font-weight-medium);
}

/* AI Box */
.ai-box {
  margin: var(--spacing-md);
  padding: var(--spacing-md);
  background: color-mix(in srgb, var(--accent-primary) 5%, var(--bg-primary));
  border: 1px dashed color-mix(in srgb, var(--accent-primary) 30%, transparent);
  border-radius: var(--ui-border-radius-sm);
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.ai-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
  color: var(--accent-primary);
  flex-shrink: 0;
  margin-top: 2px;
  
  .ai-icon { font-size: 12px; }
}

.ai-title {
  font-weight: var(--font-weight-bold);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  margin: 0 0 4px 0;
}

.ai-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.highlight {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  font-family: var(--font-mono);
}
  `]
})
export class PredictiveAnalyticsComponent implements OnInit {
  public commonService = inject(CommonMethodService);
  private analyticsService = inject(AdminAnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  predictData = signal<any>(null);
  loading = signal<boolean>(false);
  projectionColumns: any[] = [];

  public currentFilters: any = { periods: 3, confidence: 0.95 };

  // Computed helper for template
  forecast = computed(() => {
    const sales = this.predictData()?.sales?.forecast;
    return sales && sales.length ? sales[0] : null;
  });

  filterConfig: FilterField[] = [
    { key: 'branchId', label: 'Branch Context', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'Global Forecast' },
    { key: 'periods', label: 'Forecast Horizon', type: 'select', staticOptions: [{ label: 'Next Month', value: 1 }, { label: '3 Months', value: 3 }, { label: '6 Months', value: 6 }], defaultValue: 3 },
    { key: 'confidence', label: 'Model Confidence', type: 'select', staticOptions: [{ label: '80%', value: 0.8 }, { label: '95%', value: 0.95 }], defaultValue: 0.95 }
  ];

  ngOnInit() {
    this.setupColumns();
  }

  onFilterUpdate(filters: any) {
    this.currentFilters = filters;
    this.loadData();
  }

  getVariance(): number {
    const f = this.forecast();
    if (!f || !f.range) return 0;
    const mid = f.predictedRevenue;
    const high = f.range.high;
    return ((high - mid) / mid) * 100;
  }

  loadData() {
    this.loading.set(true);
    const { branchId, periods, confidence } = this.currentFilters;

    this.analyticsService.getPredictiveAnalytics(branchId, periods, confidence).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          this.predictData.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setupColumns(): void {
    this.projectionColumns = [
      {
        field: 'date',
        headerName: 'Date',
        width: 110,
        valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM yy'),
        cellStyle: { 'color': 'var(--text-primary)', 'font-weight': 'var(--font-weight-semibold)', 'font-size': '11px', 'display': 'flex', 'align-items': 'center' }
      },
      {
        field: 'projectedInflow',
        headerName: 'Predicted Inflow',
        flex: 1,
        type: 'rightAligned',
        valueFormatter: (params: any) => `+${this.commonService.formatCurrency(params.value)}`,
        cellStyle: { 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
      },
      {
        field: 'netCash',
        headerName: 'Net Position',
        width: 120,
        type: 'rightAligned',
        valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
        cellStyle: (params: any) => ({
          'font-weight': 'var(--font-weight-semibold)',
          'text-align': 'right',
          'font-family': 'var(--font-mono)',
          'font-size': '11px',
          'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end',
          'color': params.value >= 0 ? 'var(--text-primary)' : 'var(--color-error)'
        })
      }
    ];
    this.cdr.detectChanges();
  }
}
// import { Component, OnInit, signal, inject, ChangeDetectorRef, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
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

// @Component({
//   selector: 'app-predictive-analytics',
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
//     <div class="predictive-container">

//       <div class="main-card">

//         <div class="header-row">
//           <div>
//             <h2 class="page-title">
//               <i class="pi pi-chart-line header-icon"></i>
//               Future-State Modeling
//             </h2>
//             <p class="page-subtitle">
//               AI-driven forecasts for Sales & Liquidity ({{ currentFilters.periods }} Periods)
//             </p>
//           </div>
//           <div class="header-actions">
//              <div class="confidence-badge" [class.high]="(forecast()?.confidence || 0) >= 80">
//                <i class="pi pi-verified"></i>
//                <span>Model Confidence: {{ forecast()?.confidence || 0 }}%</span>
//              </div>
//              <p-button icon="pi pi-sync" [text]="true" [rounded]="true" severity="info" (onClick)="loadData()" [loading]="loading()"></p-button>
//           </div>
//         </div>

//         <div class="filter-section">
//           <app-universal-filter
//             [entityType]="'predictive-analytics'"
//             [config]="filterConfig"
//             (filterChange)="onFilterUpdate($event)">
//           </app-universal-filter>
//         </div>

//         @if (!loading()) {
          
//           <div class="kpi-grid">
            
//             <div class="kpi-card forecast-card">
//               <p class="kpi-label">Revenue Forecast ({{ forecast()?.period }})</p>
//               <h2 class="kpi-value">{{ commonService.formatCurrency(forecast()?.predictedRevenue) }}</h2>
              
//               <div class="range-box">
//                 <div class="range-labels">
//                    <span class="range-low">Low: {{ commonService.formatCurrency(forecast()?.range?.low) }}</span>
//                    <span class="range-high">High: {{ commonService.formatCurrency(forecast()?.range?.high) }}</span>
//                 </div>
//                 <div class="range-track">
//                    <div class="range-bar" style="left: 20%; right: 20%;"></div>
//                    <div class="range-dot" style="left: 50%"></div>
//                 </div>
//               </div>
//             </div>

//             <div class="kpi-card cash-card">
//               <p class="kpi-label">Projected Cash Position</p>
//               <h2 class="kpi-value highlight">{{ commonService.formatCurrency(predictData()?.cashFlow?.projectedCash) }}</h2>
//               <p class="kpi-sub">End-of-Period Estimate</p>
//             </div>

//             <div class="kpi-card model-card">
//                 <p class="model-label">Prediction Quality</p>
//                 <h3 class="model-value">{{ forecast()?.confidence >= 80 ? 'High Accuracy' : 'Moderate' }}</h3>
//                 <div class="progress-track">
//                    <div class="progress-fill" [style.width.%]="forecast()?.confidence || 0"></div>
//                 </div>
//             </div>
//           </div>

//           <div class="content-grid">
            
//             <div class="projection-section">
//               <div class="section-header">
//                 <h3 class="section-title">30-Day Liquidity Map</h3>
//                 <div class="legend-row">
//                   <div class="legend-item"><div class="dot positive"></div><span>Inflow</span></div>
//                   <div class="legend-item"><div class="dot neutral"></div><span>Net Position</span></div>
//                 </div>
//               </div>

//               <div class="grid-container">
//                  <app-ag-share-grid 
//                    [columns]="projectionColumns" 
//                    [data]="predictData()?.cashFlow?.dailyProjections || []" 
//                    class="full-size-grid">
//                  </app-ag-share-grid>
//               </div>
//             </div>

//             <div class="risk-section">
//               <div class="risk-card">
//                 <h4 class="risk-title">Inventory Risk Engine</h4>
                
//                 <div class="risk-content">
//                   @if (predictData()?.inventory?.predictions?.length) {
//                     <div class="risk-list custom-scrollbar">
//                        @for (pred of predictData()?.inventory?.predictions; track pred._id) {
//                          <div class="risk-item">
//                             <span class="risk-prod">{{pred.name}}</span>
//                             <span class="risk-prob">High Probability</span>
//                          </div>
//                        }
//                     </div>
//                   } @else {
//                     <div class="empty-state">
//                        <i class="pi pi-box empty-icon"></i>
//                        <p class="empty-text">No immediate stock-out risks detected.</p>
//                     </div>
//                   }
//                 </div>

//                 <div class="ai-box">
//                     <div class="ai-icon-box"><i class="pi pi-info-circle ai-icon"></i></div>
//                     <div>
//                       <p class="ai-title">AI Insight</p>
//                       <p class="ai-text">
//                         Projected revenue range is 
//                         <span class="highlight">±{{ getVariance() | number:'1.0-1' }}%</span>. 
//                         Cash flow stability is high for the selected period.
//                       </p>
//                     </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//         } @else {
//           <div class="loader-container">
//             <p-progressSpinner strokeWidth="4" animationDuration=".8s" styleClass="w-12 h-12"></p-progressSpinner>
//             <p class="loader-text">Running Monte Carlo Simulations...</p>
//           </div>
//         }

//       </div>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; }
//     .predictive-container { padding: var(--spacing-sm); font-family: var(--font-body); }
//     .main-card { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--radius-2xl); padding: var(--spacing-xl); backdrop-filter: blur(10px); box-shadow: var(--shadow-lg); }

//     .header-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
//     .filter-section { margin-bottom: var(--spacing-xl); }

//     .page-title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--text-primary); display: flex; align-items: center; gap: var(--spacing-sm); margin: 0 0 4px 0; letter-spacing: -0.01em; }
//     .header-icon { color: var(--accent-primary); }
//     .page-subtitle { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin: 0; }
//     .header-actions { display: flex; align-items: center; gap: var(--spacing-sm); }

//     .confidence-badge { display: flex; align-items: center; gap: var(--spacing-xs); padding: 4px 12px; border-radius: 99px; border: 1px dashed var(--border-secondary); background: var(--bg-ternary); color: var(--text-secondary); font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
//     .confidence-badge.high { border-color: var(--color-success); background: var(--color-success-bg); color: var(--color-success); }

//     /* KPI GRID */
//     .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
//     .kpi-card { background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); transition: var(--transition-base); }
//     .kpi-card:hover { border-color: var(--border-primary); transform: translateY(-2px); }
    
//     .kpi-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); margin: 0 0 8px 0; }
//     .kpi-value { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); color: var(--text-primary); margin: 0; line-height: 1; }
//     .kpi-value.highlight { color: var(--color-success); }
//     .kpi-sub { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: var(--spacing-sm); }
    
//     /* Range Box */
//     .range-box { margin-top: 12px; }
//     .range-labels { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-tertiary); font-weight: 700; margin-bottom: 4px; }
//     .range-track { width: 100%; height: 6px; background: var(--bg-secondary); border-radius: 4px; position: relative; border: 1px solid var(--border-secondary); }
//     .range-bar { position: absolute; height: 100%; background: var(--accent-focus); border-radius: 4px; }
//     .range-dot { position: absolute; width: 2px; height: 10px; background: var(--text-primary); top: -2px; }

//     /* MODEL CARD */
//     .model-card { background: var(--accent-gradient); border: none; color: #ffffff; display: flex; flex-direction: column; justify-content: center; }
//     .model-label { font-size: var(--font-size-xs); font-weight: 900; text-transform: uppercase; opacity: 0.8; margin: 0 0 4px 0; }
//     .model-value { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); text-transform: uppercase; font-style: italic; letter-spacing: 0.05em; margin: 0; }
//     .progress-track { width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 99px; margin-top: var(--spacing-md); overflow: hidden; }
//     .progress-fill { height: 100%; background: #ffffff; box-shadow: 0 0 10px rgba(255,255,255,0.5); }

//     /* CONTENT GRID */
//     .content-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); }
//     @media(min-width: 1024px) { .content-grid { grid-template-columns: 2fr 1fr; } }

//     /* PROJECTION SECTION */
//     .projection-section { border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); background: var(--bg-ternary); overflow: hidden; display: flex; flex-direction: column; height: 100%; min-height: 400px; }
//     .section-header { padding: var(--spacing-md); border-bottom: 1px solid var(--border-secondary); background: var(--bg-secondary); display: flex; justify-content: space-between; align-items: center; }
//     .section-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-primary); margin: 0; }
    
//     .legend-row { display: flex; gap: var(--spacing-lg); }
//     .legend-item { display: flex; align-items: center; gap: 6px; }
//     .dot { width: 8px; height: 8px; border-radius: 50%; }
//     .dot.positive { background: var(--color-success); }
//     .dot.neutral { background: var(--text-secondary); }
//     .legend-item span { font-size: 10px; font-weight: bold; color: var(--text-tertiary); }
    
//     .grid-container { flex: 1; position: relative; }
//     .full-size-grid { width: 100%; height: 100%; display: block; }

//     /* RISK SECTION */
//     .risk-section { height: 100%; }
//     .risk-card { background: var(--bg-ternary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); height: 100%; display: flex; flex-direction: column; }
//     .risk-title { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-tertiary); margin: 0 0 var(--spacing-lg) 0; }
//     .risk-content { flex: 1; display: flex; flex-direction: column; }
//     .risk-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; max-height: 250px; }
//     .risk-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-secondary); border-radius: var(--ui-border-radius); border-left: 3px solid var(--color-error); }
//     .risk-prod { font-weight: 600; font-size: 13px; color: var(--text-primary); }
//     .risk-prob { font-size: 10px; color: var(--color-error); font-weight: bold; text-transform: uppercase; }

//     .empty-state { text-align: center; opacity: 0.6; padding: var(--spacing-xl); }
//     .empty-icon { font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--spacing-md); }
//     .empty-text { font-size: var(--font-size-sm); color: var(--text-tertiary); }

//     /* AI BOX */
//     .ai-box { margin-top: auto; padding: var(--spacing-md); border: 1px dashed var(--accent-secondary); background: var(--accent-focus); border-radius: var(--ui-border-radius); display: flex; gap: var(--spacing-md); }
//     .ai-icon-box { margin-top: 2px; }
//     .ai-icon { color: var(--accent-primary); }
//     .ai-title { font-weight: var(--font-weight-bold); font-size: var(--font-size-xs); color: var(--accent-primary); margin: 0 0 4px 0; }
//     .ai-text { font-size: var(--font-size-xs); color: var(--text-secondary); line-height: 1.4; margin: 0; }
//     .highlight { font-weight: bold; color: var(--text-primary); }

//     /* LOADER */
//     .loader-container { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); }
//     .loader-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
//   `]
// })
// export class PredictiveAnalyticsComponent implements OnInit {
//   public commonService = inject(CommonMethodService);
//   private analyticsService = inject(AdminAnalyticsService);
//   private cdr = inject(ChangeDetectorRef);

//   predictData = signal<any>(null);
//   loading = signal<boolean>(false);
//   projectionColumns: any[] = [];

//   public currentFilters: any = { periods: 3, confidence: 0.95 };

//   // Computed helper for template
//   forecast = computed(() => {
//     const sales = this.predictData()?.sales?.forecast;
//     return sales && sales.length ? sales[0] : null;
//   });

//   filterConfig: FilterField[] = [
//     { key: 'branchId', label: 'Branch Context', type: 'select', dataSourceKey: 'branches', optionLabel: 'name', optionValue: '_id', placeholder: 'Global Forecast' },
//     { key: 'periods', label: 'Forecast Horizon', type: 'select', staticOptions: [{ label: 'Next Month', value: 1 }, { label: '3 Months', value: 3 }, { label: '6 Months', value: 6 }], defaultValue: 3 },
//     { key: 'confidence', label: 'Model Confidence', type: 'select', staticOptions: [{ label: '80%', value: 0.8 }, { label: '95%', value: 0.95 }], defaultValue: 0.95 }
//   ];

//   ngOnInit() {
//     this.setupColumns();
//   }

//   onFilterUpdate(filters: any) {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   getVariance(): number {
//     const f = this.forecast();
//     if (!f || !f.range) return 0;
//     const mid = f.predictedRevenue;
//     const high = f.range.high;
//     return ((high - mid) / mid) * 100;
//   }

//   loadData() {
//     this.loading.set(true);
//     const { branchId, periods, confidence } = this.currentFilters;

//     this.analyticsService.getPredictiveAnalytics(branchId, periods, confidence).subscribe({
//       next: (res) => {
//         if (res.status === 'success') {
//           this.predictData.set(res.data);
//         }
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   setupColumns(): void {
//     this.projectionColumns = [
//       {
//         field: 'date',
//         headerName: 'Date',
//         width: 110,
//         valueFormatter: (params: any) => this.commonService.formatDate(params.value, 'dd MMM yy'),
//         cellStyle: { 'color': 'var(--text-primary)', 'font-weight': '700', 'font-size': '11px', 'display': 'flex', 'align-items': 'center' }
//       },
//       {
//         field: 'projectedInflow',
//         headerName: 'Predicted Inflow',
//         flex: 1,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => `+${this.commonService.formatCurrency(params.value)}`,
//         cellStyle: { 'color': 'var(--color-success)', 'font-family': 'var(--font-mono)', 'text-align': 'right', 'font-size': '11px', 'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end' }
//       },
//       {
//         field: 'netCash',
//         headerName: 'Net Position',
//         width: 120,
//         type: 'rightAligned',
//         valueFormatter: (params: any) => this.commonService.formatCurrency(params.value),
//         cellStyle: (params: any) => ({
//           'font-weight': '700',
//           'text-align': 'right',
//           'font-family': 'var(--font-mono)',
//           'font-size': '11px',
//           'display': 'flex', 'align-items': 'center', 'justify-content': 'flex-end',
//           'color': params.value >= 0 ? 'var(--text-primary)' : 'var(--color-error)'
//         })
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }