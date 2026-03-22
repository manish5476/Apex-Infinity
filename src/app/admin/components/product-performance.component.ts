import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid } from '../../modules/shared/components/ag-shared-grid';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

@Component({
  selector: 'app-product-performance',
  standalone: true,
  imports: [
    CommonModule, TooltipModule, ProgressSpinnerModule,
    AgShareGrid, UniversalFilterComponent
  ],
  template: `
<div class="pp-root">

  <!-- Filter bar -->
  <div class="filter-bar">
    <app-universal-filter
      entityType="product-performance"
      [config]="filterConfig"
      (filterChange)="onFilterUpdate($event)">
    </app-universal-filter>
  </div>

  <!-- ══════════════════════════════════════
       LOADING
  ═══════════════════════════════════════ -->
  @if (loading()) {
    <div class="loader-state">
      <p-progressSpinner strokeWidth="3" styleClass="w-10 h-10"></p-progressSpinner>
      <span class="loader-text">Auditing product performance…</span>
    </div>
  }

  <!-- ══════════════════════════════════════
       CONTENT
  ═══════════════════════════════════════ -->
  @if (!loading()) {

    <!-- ── Profitability champions ── -->
    <section class="champions-section">
      <div class="section-head">
        <div>
          <h2 class="section-title">Profitability Champions</h2>
          <p class="section-sub">Products delivering the highest net margin per unit</p>
        </div>
        <div class="head-actions">
          <span class="scroll-hint">Scroll &rarr;</span>
          <button class="export-btn" pTooltip="Export CSV" tooltipPosition="bottom">
            <i class="pi pi-file-excel"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Horizontally scrollable margin cards -->
      <div class="cards-track">
        @for (prod of performanceData()?.highMargin; track prod._id) {
          <div class="margin-card">
            <div class="card-top-row">
              <span class="status-badge status-badge--success">High Margin</span>
              <i class="pi pi-arrow-up-right trend-icon"></i>
            </div>
            <p class="prod-name" [title]="prod.name">{{ prod.name }}</p>
            <p class="prod-sku">{{ prod.sku }}</p>
            <div class="card-stats">
              <div>
                <p class="card-stat-label">Margin / Unit</p>
                <p class="card-stat-value card-stat-value--success">
                  {{ commonService.formatCurrency(prod.margin) }}
                </p>
              </div>
              <div class="card-stat-right">
                <p class="card-pct">{{ prod.marginPercent | number:'1.1-1' }}%</p>
                <div class="mini-track">
                  <div class="mini-fill" [style.width.%]="prod.marginPercent > 100 ? 100 : prod.marginPercent"></div>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <p class="empty-note">No high-margin products found for this selection.</p>
        }
      </div>
    </section>

    <!-- ── Dead stock grid + sidebar ── -->
    <div class="body-grid">

      <!-- Main: dead stock table -->
      <div class="panel panel--flush">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">Dead Stock Inventory</h3>
            <p class="panel-sub">Items with zero movement — liquidation candidates</p>
          </div>
          <span class="error-badge">
            {{ performanceData()?.deadStock?.length || 0 }} items found
          </span>
        </div>
        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="deadStockColumns"
            [data]="performanceData()?.deadStock || []"
            [showActions]="true"
            (gridEvent)="handleGridAction($event)"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

      <!-- Side: asset efficiency + tip -->
      <div class="side-col">

        <div class="panel panel--tinted">
          <h4 class="widget-title">Asset Efficiency</h4>
          <p class="widget-desc">Total capital locked in non-moving stock:</p>
          <p class="locked-value">{{ commonService.formatCurrency(calculateTotalDeadStockValue()) }}</p>
          <p class="locked-label">High Risk Exposure</p>
          <button class="danger-btn">
            <i class="pi pi-bolt"></i>
            <span>Liquidate Strategy</span>
          </button>
        </div>

        <div class="panel panel--info">
          <div class="tip-row">
            <i class="pi pi-info-circle tip-icon"></i>
            <div>
              <p class="tip-title">Stock Rotation Tip</p>
              <p class="tip-body">
                <strong>Bundle Offer:</strong> Combine dead stock items with
                high-margin champions to clear inventory faster.
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
   PRODUCT PERFORMANCE — TOKEN-DRIVEN
   Zero hardcoded colors. All values use the canonical token
   system. The only intentional non-token value is the
   border-radius: 4px inside the cell-renderer button string —
   CSS custom properties work in inline styles but border-radius
   on an injected HTML string cannot reference SCSS variables.
   Using var(--ui-border-radius-sm) in the inline style string
   is safe and IS used below.
   ============================================================ */

:host { display: block; width: 100%; }

.pp-root {
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
   CHAMPIONS SECTION
   ══════════════════════════════════════════════════════════ */
.champions-section { flex-shrink: 0; }

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: var(--line-height-tight);
}

.section-sub {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.scroll-hint {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--text-tertiary);
  opacity: 0.6;
  display: none;

  @media (min-width: 768px) { display: block; }
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-md);
  height: 30px;
  padding: 0 var(--spacing-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-body);
  transition: var(--transition-base);

  &:hover { background: var(--component-bg-hover); color: var(--accent-primary); }
}

/* ── Horizontally scrollable card track ── */
.cards-track {
  display: flex;
  gap: var(--spacing-lg);
  overflow-x: auto;
  padding-bottom: var(--spacing-md);
  scroll-snap-type: x mandatory;

  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) var(--scroll-track);

  &::-webkit-scrollbar       { height: 5px; }
  &::-webkit-scrollbar-track { background: var(--scroll-track); }
  &::-webkit-scrollbar-thumb {
    background: var(--scroll-thumb);
    border-radius: var(--ui-border-radius-pill);
  }
}

.empty-note {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  font-style: italic;
  padding: var(--spacing-xl);
}

/* ── Margin card ── */
.margin-card {
  min-width: 270px;
  flex-shrink: 0;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
  transition: var(--transition-base);

  &:hover {
    transform: translateY(-2px);
    border-color: var(--border-secondary);
    box-shadow: var(--shadow-sm);
  }
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

/* Status badge */
.status-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  border: var(--ui-border-width) solid transparent;

  &--success {
    background: var(--color-success-bg);
    color: var(--color-success);
    border-color: var(--color-success-border);
  }
}

.trend-icon { color: var(--color-success); font-size: var(--font-size-base); }

.prod-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prod-sku {
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-lg) 0;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
}

.card-stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0 0 var(--spacing-xs) 0;
}

.card-stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  margin: 0;
  color: var(--text-primary);

  &--success { color: var(--color-success); }
}

.card-stat-right { text-align: right; }

.card-pct {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.mini-track {
  width: 3rem;
  height: 4px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
  margin-left: auto;
}

.mini-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: var(--ui-border-radius-pill);
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
    box-shadow: var(--shadow-sm);
  }

  &--tinted {
    background: var(--bg-ternary);
    border-color: var(--border-secondary);
  }

  &--info {
    background: var(--color-info-bg);
    border: var(--ui-border-width) dashed var(--color-info-border);
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
  gap: var(--spacing-lg);
}

.panel-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin: 0;
}

.panel-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0 0;
}

.error-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-error-bg);
  color: var(--color-error);
  border: var(--ui-border-width) solid var(--color-error-border);
  white-space: nowrap;
  flex-shrink: 0;
}

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

/* ── Side column ── */
.side-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.widget-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 0;
}

.widget-desc {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.locked-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-error);
  margin: 0;
  line-height: var(--line-height-tight);
}

.locked-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-error);
  opacity: 0.8;
  margin: var(--spacing-xs) 0 0 0;
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  width: 100%;
  height: 34px;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-body);
  transition: var(--transition-base);

  &:hover { background: var(--color-error-dark); }
}

/* ── Tip panel ── */
.tip-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.tip-icon {
  color: var(--color-info);
  font-size: var(--font-size-base);
  margin-top: 2px;
  flex-shrink: 0;
}

.tip-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  margin: 0 0 var(--spacing-xs) 0;
}

.tip-body {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}
  `]
})
export class ProductPerformanceComponent implements OnInit {
  private analyticsService = inject(AdminAnalyticsService);
  public commonService = inject(CommonMethodService);
  private cdr = inject(ChangeDetectorRef);

  performanceData = signal<any>(null);
  loading = signal(false);
  deadStockColumns: any[] = [];

  private currentFilters: Record<string, any> = {};

  filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Inventory'
    }
  ];

  ngOnInit(): void { this.setupColumns(); }

  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.analyticsService.getProductPerformance(this.currentFilters['branchId']).subscribe({
      next: (res) => {
        if (res.status === 'success') this.performanceData.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  calculateTotalDeadStockValue(): number {
    return (this.performanceData()?.deadStock ?? [])
      .reduce((sum: number, item: any) => sum + (item.value ?? 0), 0);
  }

  handleGridAction(event: any): void {
    // Handle liquidate action from grid
  }

  setupColumns(): void {
    this.deadStockColumns = [
      {
        field: 'name',
        headerName: 'Product Name',
        sortable: true,
        flex: 1.5,
        minWidth: 180,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)',
          'font-size': 'var(--font-size-sm)'
        }
      },
      {
        field: 'sku',
        headerName: 'SKU',
        sortable: true,
        width: 140,
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'color': 'var(--text-secondary)',
          'font-size': 'var(--font-size-xs)',
          'letter-spacing': '0.5px'
        }
      },
      {
        field: 'stockQuantity',
        headerName: 'Qty',
        sortable: true,
        width: 100,
        type: 'rightAligned',
        cellStyle: {
          'font-family': 'var(--font-mono)',
          'font-weight': 'var(--font-weight-semibold)',
          'text-align': 'right',
          'color': 'var(--text-primary)'
        }
      },
      {
        field: 'value',
        headerName: 'Tied Capital',
        sortable: true,
        width: 140,
        type: 'rightAligned',
        valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
        cellStyle: {
          'font-weight': 'var(--font-weight-bold)',
          'font-family': 'var(--font-mono)',
          'color': 'var(--color-error)',
          'text-align': 'right'
        }
      },
      {
        headerName: 'Action',
        width: 110,
        // CSS vars work in inline styles injected into cell renderer HTML
        cellRenderer: () =>
          `<button style="background:var(--bg-primary);border:1px solid var(--color-error-border);color:var(--color-error);padding:4px 10px;border-radius:var(--ui-border-radius-sm);font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);cursor:pointer;text-transform:uppercase;font-family:var(--font-body);">
             Liquidate
           </button>`,
        cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
      }
    ];
    this.cdr.detectChanges();
  }
}
