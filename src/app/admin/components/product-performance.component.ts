import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AdminAnalyticsService } from '../admin-analytics.service';
import { CommonMethodService } from '../../core/utils/common-method.service';
import { AgShareGrid, ActionColumnConfig } from '../../modules/shared/components/ag-shared-grid';
import { PERMISSIONS } from '../../core/auth/permissions.constants';
import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

interface HighMarginProduct {
  _id: string;
  name: string;
  sku: string | null;
  margin: number;
  marginPercent: number;
}

interface DeadStockProduct {
  _id: string;
  name: string;
  sku: string | null;
  stockQuantity: number;
  value: number;
}

interface PerformanceData {
  highMargin: HighMarginProduct[];
  deadStock: DeadStockProduct[];
}

@Component({
  selector: 'app-product-performance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DecimalPipe,
    TooltipModule,
    ProgressSpinnerModule,
    AgShareGrid,
    UniversalFilterComponent,
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

  <!-- ── Loading state ── -->
  @if (loading()) {
    <div class="loader-state">
      <div class="loader-ring">
        <span></span><span></span><span></span>
      </div>
      <span class="loader-text">Auditing product performance…</span>
    </div>
  }

  <!-- ── Content ── -->
  @if (!loading()) {

    <!-- Profitability Champions -->
    <section class="champions-section">
      <!-- <div class="section-head">
        <div class="section-head-left">
          <div class="section-eyebrow">
            <span class="eyebrow-dot"></span>
            Top Performers
          </div>
          <h2 class="section-title">Profitability Champions</h2>
          <p class="section-sub">Products delivering highest net margin per unit</p>
        </div>
        <div class="head-actions">
          <span class="scroll-hint">Scroll to explore →</span>
          <button class="export-btn" pTooltip="Export as CSV" tooltipPosition="bottom">
            <i class="pi pi-download"></i>
            Export
          </button>
        </div>
      </div> -->

      <!-- KPI strip above cards -->
      <div class="kpi-strip">
        <div class="kpi-item">
          <span class="kpi-label">Products</span>
          <span class="kpi-value">{{ performanceData()?.highMargin?.length ?? 0 }}</span>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <span class="kpi-label">Avg Margin %</span>
          <span class="kpi-value kpi-value--success">
            {{ avgMarginPercent() | number:'1.1-1' }}%
          </span>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <span class="kpi-label">Top Margin</span>
          <span class="kpi-value kpi-value--success">
            {{ common.formatCurrency(topMargin()) }}
          </span>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-item">
          <span class="kpi-label">Dead Stock Risk</span>
          <span class="kpi-value kpi-value--error">
            {{ common.formatCurrency(totalDeadStockValue()) }}
          </span>
        </div>
      </div>

      <!-- Horizontally scrollable margin cards -->
      <div class="cards-track">
        @for (prod of performanceData()?.highMargin; track prod._id; let i = $index) {
          <div class="margin-card" [class.margin-card--top]="i === 0">

            <!-- Rank badge -->
            <div class="rank-badge" [class.rank-badge--gold]="i === 0"
                                    [class.rank-badge--silver]="i === 1"
                                    [class.rank-badge--bronze]="i === 2">
              #{{ i + 1 }}
            </div>

            <div class="card-top-row">
              <span class="status-pill status-pill--success">High Margin</span>
              <span class="margin-pct-badge">{{ prod.marginPercent | number:'1.1-1' }}%</span>
            </div>

            <p class="prod-name" [title]="prod.name">{{ prod.name }}</p>
            <p class="prod-sku">{{ prod.sku ?? 'No SKU' }}</p>

            <!-- Progress bar -->
            <div class="margin-bar-wrap">
              <div class="margin-bar-track">
                <div class="margin-bar-fill"
                     [style.width.%]="prod.marginPercent > 100 ? 100 : prod.marginPercent"
                     [class.margin-bar-fill--high]="prod.marginPercent >= 30"
                     [class.margin-bar-fill--mid]="prod.marginPercent >= 20 && prod.marginPercent < 30"
                     [class.margin-bar-fill--low]="prod.marginPercent < 20">
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="card-stat">
                <span class="stat-label">Net / Unit</span>
                <span class="stat-value stat-value--success">
                  {{ common.formatCurrency(prod.margin) }}
                </span>
              </div>
              <div class="card-action-pill">
                <i class="pi pi-arrow-up-right"></i>
              </div>
            </div>

          </div>
        } @empty {
          <div class="empty-track">
            <i class="pi pi-inbox empty-icon"></i>
            <p class="empty-note">No high-margin products for this selection.</p>
          </div>
        }
      </div>
    </section>

    <!-- ── Body: dead stock + sidebar ── -->
    <div class="body-grid">

      <!-- Dead Stock Table -->
      <div class="panel panel--flush">
        <div class="panel-head">
          <div class="panel-head-info">
            <div class="panel-eyebrow">
              <span class="eyebrow-dot eyebrow-dot--error"></span>
              Inventory Alert
            </div>
            <h3 class="panel-title">Dead Stock Inventory</h3>
            <p class="panel-sub">Zero-movement items · Liquidation candidates</p>
          </div>
          <div class="panel-head-meta">
            <span class="alert-badge">
              <i class="pi pi-exclamation-triangle"></i>
              {{ performanceData()?.deadStock?.length ?? 0 }} items
            </span>
          </div>
        </div>

        <div class="grid-wrap">
          <app-ag-share-grid
            [columns]="deadStockColumns"
            [data]="performanceData()?.deadStock ?? []"
            [actionColumn]="deadStockActionColumn"
            (gridEvent)="handleGridAction($event)"
            class="fill-grid">
          </app-ag-share-grid>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="side-col">

        <!-- Asset Efficiency Widget -->
        <div class="panel side-panel side-panel--danger">
          <div class="side-panel-icon-row">
            <div class="side-icon side-icon--error">
              <i class="pi pi-chart-line"></i>
            </div>
            <div>
              <p class="side-widget-label">Capital at Risk</p>
              <p class="side-widget-sub">Asset Efficiency</p>
            </div>
          </div>

          <div class="locked-block">
            <p class="locked-value">{{ common.formatCurrency(totalDeadStockValue()) }}</p>
            <p class="locked-label">
              <span class="pulse-dot"></span>
              High Risk Exposure
            </p>
          </div>

          <div class="risk-meta">
            <div class="risk-meta-item">
              <span class="risk-meta-key">Items locked</span>
              <span class="risk-meta-val">{{ performanceData()?.deadStock?.length ?? 0 }}</span>
            </div>
            <div class="risk-meta-item">
              <span class="risk-meta-key">Avg per item</span>
              <span class="risk-meta-val">
                {{ common.formatCurrency(avgDeadStockValue()) }}
              </span>
            </div>
          </div>

          <button class="danger-btn" pTooltip="Plan a liquidation strategy" tooltipPosition="top">
            <i class="pi pi-bolt"></i>
            Liquidate Strategy
          </button>
        </div>

        <!-- Top Dead Stock by Value -->
        <div class="panel side-panel">
          <div class="side-panel-icon-row">
            <div class="side-icon side-icon--warning">
              <i class="pi pi-sort-amount-down"></i>
            </div>
            <div>
              <p class="side-widget-label">Highest Exposure</p>
              <p class="side-widget-sub">Top 3 by tied capital</p>
            </div>
          </div>
          <div class="top-dead-list">
            @for (item of topDeadStock(); track item._id; let i = $index) {
              <div class="top-dead-row">
                <span class="top-dead-rank">{{ i + 1 }}</span>
                <div class="top-dead-info">
                  <span class="top-dead-name" [title]="item.name">{{ item.name }}</span>
                  <span class="top-dead-qty">{{ item.stockQuantity }} units</span>
                </div>
                <span class="top-dead-val">{{ common.formatCurrency(item.value) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Tip Card -->
        <div class="panel side-panel side-panel--info">
          <div class="tip-header">
            <i class="pi pi-lightbulb tip-icon"></i>
            <span class="tip-title">Stock Rotation Tip</span>
          </div>
          <p class="tip-body">
            <strong>Bundle Offer:</strong> Pair dead stock items with
            high-margin champions to create value combos that clear
            inventory while protecting overall margins.
          </p>
        </div>

      </aside>
    </div>

  }

</div>
  `,
  styles: [`
/* ============================================================
   PRODUCT PERFORMANCE — 100% TOKEN-DRIVEN
   All values use the canonical global token system.
   Zero hardcoded colors. Vars pulled from _tokens.scss mixin.
   ============================================================ */

:host { display: block; width: 100%; }

/* ── Root layout ──────────────────────────────────────────── */
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

.filter-bar { flex-shrink: 0; }

/* ── Loader ───────────────────────────────────────────────── */
.loader-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  min-height: 320px;
}

.loader-ring {
  position: relative;
  width: 40px;
  height: 40px;

  span {
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-radius: var(--ui-border-radius-pill);
    animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;

    &:nth-child(1) {
      border-top-color: var(--accent-primary);
      animation-delay: -0.45s;
    }
    &:nth-child(2) {
      border-top-color: var(--color-success);
      animation-delay: -0.3s;
      inset: 6px;
    }
    &:nth-child(3) {
      border-top-color: var(--color-warning);
      animation-delay: -0.15s;
      inset: 12px;
    }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

.loader-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
}

/* ── Eyebrow label ────────────────────────────────────────── */
.section-eyebrow,
.panel-eyebrow {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--accent-primary);
  flex-shrink: 0;

  &--error { background: var(--color-error); }
}

/* ══════════════════════════════════════════════════════════
   CHAMPIONS SECTION
   ══════════════════════════════════════════════════════════ */
.champions-section { flex-shrink: 0; }

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-head-left { flex: 1; min-width: 0; }

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
  padding-top: var(--spacing-xl);
}

.scroll-hint {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-tertiary);
  display: none;

  @media (min-width: 768px) { display: block; }
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  height: 28px;
  padding: 0 var(--spacing-lg);
  border: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-body);
  transition: var(--transition-base);

  i { font-size: 11px; }

  &:hover {
    background: var(--component-bg-hover);
    color: var(--accent-primary);
    border-color: var(--border-secondary);
  }
}

/* ── KPI Strip ────────────────────────────────────────────── */
.kpi-strip {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  padding: var(--spacing-md) var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.kpi-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.kpi-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--text-tertiary);
}

.kpi-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);
  line-height: var(--line-height-tight);

  &--success { color: var(--color-success); }
  &--error   { color: var(--color-error);   }
}

.kpi-divider {
  width: var(--ui-border-width);
  height: 32px;
  background: var(--border-primary);
  flex-shrink: 0;
}

/* ── Card track ───────────────────────────────────────────── */
.cards-track {
  display: flex;
  gap: var(--spacing-lg);
  overflow-x: auto;
  padding-bottom: var(--spacing-md);
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) var(--scroll-track);

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-track { background: var(--scroll-track); }
  &::-webkit-scrollbar-thumb {
    background: var(--scroll-thumb);
    border-radius: var(--ui-border-radius-pill);
  }
}

.empty-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-3xl);
  color: var(--text-tertiary);
  min-width: 280px;
}
.empty-icon { font-size: 28px; opacity: 0.35; }
.empty-note { font-size: var(--font-size-sm); margin: 0; }

/* ── Margin card ──────────────────────────────────────────── */
.margin-card {
  position: relative;
  min-width: 240px;
  flex-shrink: 0;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  scroll-snap-align: start;
  transition: var(--transition-base);
  cursor: default;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--border-secondary);
    box-shadow: var(--elevation-2);
  }

  /* Top card gets accent border */
  &--top {
    border-color: var(--accent-primary);
    box-shadow: var(--elevation-1);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--ui-border-radius-lg);
      background: linear-gradient(135deg,
        color-mix(in srgb, var(--accent-primary) 6%, transparent) 0%,
        transparent 60%);
      pointer-events: none;
    }
  }
}

/* Rank badge */
.rank-badge {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 22px;
  height: 22px;
  border-radius: var(--ui-border-radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  background: var(--bg-ternary);
  color: var(--text-tertiary);
  border: var(--ui-border-width) solid var(--border-primary);

  &--gold   { background: color-mix(in srgb, var(--color-warning) 15%, transparent); color: var(--color-warning); border-color: color-mix(in srgb, var(--color-warning) 35%, transparent); }
  &--silver { background: var(--bg-ternary); color: var(--text-secondary); }
  &--bronze { background: color-mix(in srgb, var(--color-error) 10%, transparent); color: color-mix(in srgb, var(--color-error) 80%, var(--color-warning) 20%); }
}

.card-top-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

/* Status pill */
.status-pill {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px var(--spacing-md);
  border-radius: var(--ui-border-radius-pill);
  border: var(--ui-border-width) solid transparent;

  &--success {
    background: var(--color-success-bg);
    color: var(--color-success);
    border-color: var(--color-success-border);
  }
}

.margin-pct-badge {
  margin-left: auto;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-success);
  padding-right: var(--spacing-xl); /* avoid rank badge overlap */
}

.prod-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--line-height-normal);
}

.prod-sku {
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  margin: 0;
}

/* Margin bar */
.margin-bar-wrap { margin: var(--spacing-xs) 0; }
.margin-bar-track {
  height: 4px;
  background: var(--bg-ternary);
  border-radius: var(--ui-border-radius-pill);
  overflow: hidden;
}
.margin-bar-fill {
  height: 100%;
  border-radius: var(--ui-border-radius-pill);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  &--high { background: var(--color-success); }
  &--mid  { background: var(--color-warning); }
  &--low  { background: var(--color-info);    }
}

/* Card footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: var(--spacing-sm);
  border-top: var(--ui-border-width) solid var(--border-primary);
}

.card-stat { display: flex; flex-direction: column; gap: 2px; }

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.stat-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-primary);

  &--success { color: var(--color-success); }
}

.card-action-pill {
  width: 26px;
  height: 26px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-success-bg);
  border: var(--ui-border-width) solid var(--color-success-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-success);
  font-size: 11px;
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
    min-height: 420px;
    box-shadow: var(--shadow-sm);
  }
}

/* Panel header */
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: var(--ui-border-width) solid var(--border-primary);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.panel-head-info { flex: 1; min-width: 0; }
.panel-head-meta { flex-shrink: 0; padding-top: var(--spacing-xs); }

.panel-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 2px 0;
  line-height: var(--line-height-tight);
}

.panel-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

.alert-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
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

  i { font-size: 10px; }
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

/* ── Sidebar ── */
.side-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.side-panel {
  padding: var(--spacing-lg);
  gap: var(--spacing-md);

  &--danger {
    border-color: var(--color-error-border);
    background: color-mix(in srgb, var(--color-error-bg) 60%, var(--bg-primary) 40%);
  }
  &--info {
    background: var(--color-info-bg);
    border-color: var(--color-info-border);
    border-style: dashed;
  }
}

.side-panel-icon-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.side-icon {
  width: 34px;
  height: 34px;
  border-radius: var(--ui-border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--font-size-base);

  &--error   { background: var(--color-error-bg);   color: var(--color-error);   border: var(--ui-border-width) solid var(--color-error-border); }
  &--warning { background: var(--color-warning-bg); color: var(--color-warning); border: var(--ui-border-width) solid var(--color-warning-border); }
}

.side-widget-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.side-widget-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin: 0;
}

/* Locked value block */
.locked-block { margin: var(--spacing-xs) 0; }

.locked-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-error);
  margin: 0;
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}

.locked-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-error);
  opacity: 0.85;
  margin: var(--spacing-xs) 0 0 0;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--ui-border-radius-pill);
  background: var(--color-error);
  flex-shrink: 0;
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.75); }
}

/* Risk meta */
.risk-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: color-mix(in srgb, var(--color-error) 6%, transparent);
  border-radius: var(--ui-border-radius);
  border: var(--ui-border-width) solid var(--color-error-border);
}

.risk-meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.risk-meta-key {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.risk-meta-val {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-error);
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  width: 100%;
  height: 32px;
  background: var(--color-error);
  color: #fff;
  border: none;
  border-radius: var(--ui-border-radius);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: var(--transition-base);

  i { font-size: 11px; }
  &:hover { background: var(--color-error-dark); }
}

/* Top dead stock list */
.top-dead-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.top-dead-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-secondary);
  border: var(--ui-border-width) solid var(--border-primary);
  border-radius: var(--ui-border-radius);
  transition: var(--transition-fast);

  &:hover { border-color: var(--border-secondary); background: var(--component-bg-hover); }
}

.top-dead-rank {
  width: 18px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  flex-shrink: 0;
  text-align: center;
}

.top-dead-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.top-dead-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-dead-qty {
  font-size: 10px;
  color: var(--text-tertiary);
}

.top-dead-val {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-error);
  flex-shrink: 0;
}

/* Tip card */
.tip-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.tip-icon {
  color: var(--color-info);
  font-size: var(--font-size-base);
  flex-shrink: 0;
}

.tip-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  margin: 0;
}

.tip-body {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;

  strong { color: var(--text-primary); }
}
  `],
})
export class ProductPerformanceComponent implements OnInit, OnDestroy {

  // ─── DI ──────────────────────────────────────────────────────────────────────
  private readonly analyticsService = inject(AdminAnalyticsService);
  public readonly common = inject(CommonMethodService);

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  private readonly destroy$ = new Subject<void>();

  // ─── State ───────────────────────────────────────────────────────────────────
  readonly performanceData = signal<PerformanceData | null>(null);
  readonly loading = signal(false);

  // ─── Derived (computed — no effects, no manual sync) ─────────────────────────
  readonly avgMarginPercent = computed(() => {
    const list = this.performanceData()?.highMargin ?? [];
    if (!list.length) return 0;
    return list.reduce((s, p) => s + p.marginPercent, 0) / list.length;
  });

  readonly topMargin = computed(() =>
    this.performanceData()?.highMargin?.[0]?.margin ?? 0
  );

  readonly totalDeadStockValue = computed(() =>
    (this.performanceData()?.deadStock ?? [])
      .reduce((s, i) => s + (i.value ?? 0), 0)
  );

  readonly avgDeadStockValue = computed(() => {
    const list = this.performanceData()?.deadStock ?? [];
    return list.length ? this.totalDeadStockValue() / list.length : 0;
  });

  readonly topDeadStock = computed(() =>
    [...(this.performanceData()?.deadStock ?? [])]
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
  );

  // ─── Grid ─────────────────────────────────────────────────────────────────────
  deadStockColumns: any[] = [];

  readonly deadStockActionColumn: ActionColumnConfig = {
    showView: true,
    showEdit: false,
    showDelete: false,
    viewPermission: PERMISSIONS.PRODUCT.READ,
  };

  // ─── Filters ─────────────────────────────────────────────────────────────────
  private currentFilters: Record<string, any> = {};

  readonly filterConfig: FilterField[] = [
    {
      key: 'branchId',
      label: 'Branch Context',
      type: 'select',
      dataSourceKey: 'branches',
      optionLabel: 'name',
      optionValue: '_id',
      placeholder: 'Global Inventory',
    },
  ];

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildColumns();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Public handlers ─────────────────────────────────────────────────────────
  onFilterUpdate(filters: Record<string, any>): void {
    this.currentFilters = filters;
    this.loadData();
  }

  handleGridAction(_event: any): void {
    // Handle liquidate / view action from grid
  }

  // ─── Data ────────────────────────────────────────────────────────────────────
  private loadData(): void {
    this.loading.set(true);

    this.analyticsService
      .getProductPerformance(this.currentFilters['branchId'])
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res: any) => {
          if (res?.status === 'success') {
            this.performanceData.set(res.data as PerformanceData);
          }
        },
      });
  }

  // ─── Column definitions ───────────────────────────────────────────────────────
  private buildColumns(): void {
    this.deadStockColumns = [
      {
        field: 'name',
        headerName: 'Product',
        sortable: true,
        flex: 1.5,
        minWidth: 160,
        cellStyle: {
          'font-weight': 'var(--font-weight-semibold)',
          'color': 'var(--text-primary)',
          'font-size': 'var(--font-size-sm)',
        },
      },
      {
        field: 'sku',
        headerName: 'SKU',
        sortable: true,
        width: 150,
        cellRenderer: (p: any) =>
          p.value
            ? `<span style="font-family:var(--font-mono);color:var(--text-secondary);font-size:var(--font-size-xs);letter-spacing:0.4px;">${p.value}</span>`
            : `<span style="color:var(--text-tertiary);font-size:var(--font-size-xs);font-style:italic;">No SKU</span>`,
      },
      {
        field: 'stockQuantity',
        headerName: 'Qty',
        sortable: true,
        width: 80,
        type: 'rightAligned',
        cellRenderer: (p: any) => {
          const danger = p.value >= 15;
          const color = danger ? 'var(--color-error)' : 'var(--color-warning)';
          return `<span style="font-family:var(--font-mono);font-weight:var(--font-weight-bold);color:${color};">${p.value}</span>`;
        },
      },
      {
        field: 'value',
        headerName: 'Tied Capital',
        sortable: true,
        width: 140,
        type: 'rightAligned',
        cellRenderer: (p: any) =>
          `<span style="font-weight:var(--font-weight-bold);font-family:var(--font-mono);color:var(--color-error);font-size:var(--font-size-sm);">
            ${this.common.formatCurrency(p.value ?? 0)}
          </span>`,
      },
      {
        headerName: 'Action',
        width: 110,
        suppressHeaderMenuButton: true,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
        cellRenderer: () =>
          `<button style="
            background:var(--color-error-bg);
            border:1px solid var(--color-error-border);
            color:var(--color-error);
            padding:3px 10px;
            border-radius:var(--ui-border-radius-sm);
            font-size:var(--font-size-xs);
            font-weight:var(--font-weight-bold);
            font-family:var(--font-body);
            cursor:pointer;
            text-transform:uppercase;
            letter-spacing:0.05em;
            transition:var(--transition-fast);">
            Liquidate
          </button>`,
      },
    ];
  }
}

// import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TooltipModule } from 'primeng/tooltip';
// import { ProgressSpinnerModule } from 'primeng/progressspinner';
// import { AdminAnalyticsService } from '../admin-analytics.service';
// import { CommonMethodService } from '../../core/utils/common-method.service';
// import { AgShareGrid, ActionColumnConfig } from '../../modules/shared/components/ag-shared-grid';
// import { PERMISSIONS } from '../../core/auth/permissions.constants';
// import { FilterField } from '../../modules/shared/components/universal-filter/filter-config.interface';
// import { UniversalFilterComponent } from '../../modules/shared/components/universal-filter/universal-filter';

// @Component({
//   selector: 'app-product-performance',
//   standalone: true,
//   imports: [
//     CommonModule, TooltipModule, ProgressSpinnerModule,
//     AgShareGrid, UniversalFilterComponent
//   ],
//   template: `
// <div class="pp-root">

//   <!-- Filter bar -->
//   <div class="filter-bar">
//     <app-universal-filter
//       entityType="product-performance"
//       [config]="filterConfig"
//       (filterChange)="onFilterUpdate($event)">
//     </app-universal-filter>
//   </div>

//   <!-- ══════════════════════════════════════
//        LOADING
//   ═══════════════════════════════════════ -->
//   @if (loading()) {
//     <div class="loader-state">
//       <p-progressSpinner strokeWidth="3" styleClass="w-10 h-10"></p-progressSpinner>
//       <span class="loader-text">Auditing product performance…</span>
//     </div>
//   }

//   <!-- ══════════════════════════════════════
//        CONTENT
//   ═══════════════════════════════════════ -->
//   @if (!loading()) {

//     <!-- ── Profitability champions ── -->
//     <section class="champions-section">
//       <div class="section-head">
//         <div>
//           <h2 class="section-title">Profitability Champions</h2>
//           <p class="section-sub">Products delivering the highest net margin per unit</p>
//         </div>
//         <div class="head-actions">
//           <span class="scroll-hint">Scroll &rarr;</span>
//           <button class="export-btn" pTooltip="Export CSV" tooltipPosition="bottom">
//             <i class="pi pi-file-excel"></i>
//             <span>Export CSV</span>
//           </button>
//         </div>
//       </div>

//       <!-- Horizontally scrollable margin cards -->
//       <div class="cards-track">
//         @for (prod of performanceData()?.highMargin; track prod._id) {
//           <div class="margin-card">
//             <div class="card-top-row">
//               <span class="status-badge status-badge--success">High Margin</span>
//               <i class="pi pi-arrow-up-right trend-icon"></i>
//             </div>
//             <p class="prod-name" [title]="prod.name">{{ prod.name }}</p>
//             <p class="prod-sku">{{ prod.sku }}</p>
//             <div class="card-stats">
//               <div>
//                 <p class="card-stat-label">Margin / Unit</p>
//                 <p class="card-stat-value card-stat-value--success">
//                   {{ commonService.formatCurrency(prod.margin) }}
//                 </p>
//               </div>
//               <div class="card-stat-right">
//                 <p class="card-pct">{{ prod.marginPercent | number:'1.1-1' }}%</p>
//                 <div class="mini-track">
//                   <div class="mini-fill" [style.width.%]="prod.marginPercent > 100 ? 100 : prod.marginPercent"></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         } @empty {
//           <p class="empty-note">No high-margin products found for this selection.</p>
//         }
//       </div>
//     </section>

//     <!-- ── Dead stock grid + sidebar ── -->
//     <div class="body-grid">

//       <!-- Main: dead stock table -->
//       <div class="panel panel--flush">
//         <div class="panel-head">
//           <div>
//             <h3 class="panel-title">Dead Stock Inventory</h3>
//             <p class="panel-sub">Items with zero movement — liquidation candidates</p>
//           </div>
//           <span class="error-badge">
//             {{ performanceData()?.deadStock?.length || 0 }} items found
//           </span>
//         </div>
//         <div class="grid-wrap">
//           <app-ag-share-grid
//             [columns]="deadStockColumns"
//             [data]="performanceData()?.deadStock || []"
//             [actionColumn]="deadStockActionColumn"
//             (gridEvent)="handleGridAction($event)"
//             class="fill-grid">
//           </app-ag-share-grid>
//         </div>
//       </div>

//       <!-- Side: asset efficiency + tip -->
//       <div class="side-col">

//         <div class="panel panel--tinted">
//           <h4 class="widget-title">Asset Efficiency</h4>
//           <p class="widget-desc">Total capital locked in non-moving stock:</p>
//           <p class="locked-value">{{ commonService.formatCurrency(calculateTotalDeadStockValue()) }}</p>
//           <p class="locked-label">High Risk Exposure</p>
//           <button class="danger-btn">
//             <i class="pi pi-bolt"></i>
//             <span>Liquidate Strategy</span>
//           </button>
//         </div>

//         <div class="panel panel--info">
//           <div class="tip-row">
//             <i class="pi pi-info-circle tip-icon"></i>
//             <div>
//               <p class="tip-title">Stock Rotation Tip</p>
//               <p class="tip-body">
//                 <strong>Bundle Offer:</strong> Combine dead stock items with
//                 high-margin champions to clear inventory faster.
//               </p>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>

//   }

// </div>
//   `,
//   styles: [`
// /* ============================================================
//    PRODUCT PERFORMANCE — TOKEN-DRIVEN
//    Zero hardcoded colors. All values use the canonical token
//    system. The only intentional non-token value is the
//    border-radius: 4px inside the cell-renderer button string —
//    CSS custom properties work in inline styles but border-radius
//    on an injected HTML string cannot reference SCSS variables.
//    Using var(--ui-border-radius-sm) in the inline style string
//    is safe and IS used below.
//    ============================================================ */

// :host { display: block; width: 100%; }

// .pp-root {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-xl);
//   padding: var(--spacing-xl);
//   background: var(--bg-secondary);
//   font-family: var(--font-body);
//   color: var(--text-primary);
//   min-height: 100%;
// }

// /* ── Filter bar ── */
// .filter-bar { flex-shrink: 0; }

// /* ── Loader ── */
// .loader-state {
//   flex: 1;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: var(--spacing-lg);
//   padding: var(--spacing-5xl);
//   min-height: 300px;
// }

// .loader-text {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
// }

// /* ══════════════════════════════════════════════════════════
//    CHAMPIONS SECTION
//    ══════════════════════════════════════════════════════════ */
// .champions-section { flex-shrink: 0; }

// .section-head {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-end;
//   gap: var(--spacing-lg);
//   margin-bottom: var(--spacing-lg);
// }

// .section-title {
//   font-family: var(--font-heading);
//   font-size: var(--font-size-xl);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-xs) 0;
//   line-height: var(--line-height-tight);
// }

// .section-sub {
//   font-size: var(--font-size-sm);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .head-actions {
//   display: flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   flex-shrink: 0;
// }

// .scroll-hint {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   color: var(--text-tertiary);
//   opacity: 0.6;
//   display: none;

//   @media (min-width: 768px) { display: block; }
// }

// .export-btn {
//   display: inline-flex;
//   align-items: center;
//   gap: var(--spacing-md);
//   height: 30px;
//   padding: 0 var(--spacing-lg);
//   border: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-primary);
//   color: var(--text-secondary);
//   border-radius: var(--ui-border-radius);
//   cursor: pointer;
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-medium);
//   font-family: var(--font-body);
//   transition: var(--transition-base);

//   &:hover { background: var(--component-bg-hover); color: var(--accent-primary); }
// }

// /* ── Horizontally scrollable card track ── */
// .cards-track {
//   display: flex;
//   gap: var(--spacing-lg);
//   overflow-x: auto;
//   padding-bottom: var(--spacing-md);
//   scroll-snap-type: x mandatory;

//   scrollbar-width: thin;
//   scrollbar-color: var(--scroll-thumb) var(--scroll-track);

//   &::-webkit-scrollbar       { height: 5px; }
//   &::-webkit-scrollbar-track { background: var(--scroll-track); }
//   &::-webkit-scrollbar-thumb {
//     background: var(--scroll-thumb);
//     border-radius: var(--ui-border-radius-pill);
//   }
// }

// .empty-note {
//   font-size: var(--font-size-sm);
//   color: var(--text-tertiary);
//   font-style: italic;
//   padding: var(--spacing-xl);
// }

// /* ── Margin card ── */
// .margin-card {
//   min-width: 270px;
//   flex-shrink: 0;
//   padding: var(--spacing-lg);
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   display: flex;
//   flex-direction: column;
//   scroll-snap-align: start;
//   transition: var(--transition-base);

//   &:hover {
//     transform: translateY(-2px);
//     border-color: var(--border-secondary);
//     box-shadow: var(--shadow-sm);
//   }
// }

// .card-top-row {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-start;
//   margin-bottom: var(--spacing-md);
// }

// /* Status badge */
// .status-badge {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.04em;
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
//   border: var(--ui-border-width) solid transparent;

//   &--success {
//     background: var(--color-success-bg);
//     color: var(--color-success);
//     border-color: var(--color-success-border);
//   }
// }

// .trend-icon { color: var(--color-success); font-size: var(--font-size-base); }

// .prod-name {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-xs) 0;
//   white-space: nowrap;
//   overflow: hidden;
//   text-overflow: ellipsis;
// }

// .prod-sku {
//   font-size: var(--font-size-xs);
//   font-family: var(--font-mono);
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-lg) 0;
// }

// .card-stats {
//   display: flex;
//   justify-content: space-between;
//   align-items: flex-end;
//   margin-top: auto;
// }

// .card-stat-label {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0 0 var(--spacing-xs) 0;
// }

// .card-stat-value {
//   font-size: var(--font-size-lg);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   margin: 0;
//   color: var(--text-primary);

//   &--success { color: var(--color-success); }
// }

// .card-stat-right { text-align: right; }

// .card-pct {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   color: var(--text-primary);
//   margin: 0 0 var(--spacing-xs) 0;
// }

// .mini-track {
//   width: 3rem;
//   height: 4px;
//   background: var(--bg-ternary);
//   border-radius: var(--ui-border-radius-pill);
//   overflow: hidden;
//   margin-left: auto;
// }

// .mini-fill {
//   height: 100%;
//   background: var(--color-success);
//   border-radius: var(--ui-border-radius-pill);
// }

// /* ══════════════════════════════════════════════════════════
//    BODY GRID
//    ══════════════════════════════════════════════════════════ */
// .body-grid {
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: var(--spacing-lg);
//   flex: 1;
//   min-height: 0;

//   @media (min-width: 1024px) { grid-template-columns: 2fr 1fr; }
// }

// /* ── Shared panel ── */
// .panel {
//   background: var(--bg-primary);
//   border: var(--ui-border-width) solid var(--border-primary);
//   border-radius: var(--ui-border-radius-lg);
//   padding: var(--spacing-lg);
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-lg);

//   &--flush {
//     padding: 0;
//     overflow: hidden;
//     min-height: 400px;
//     box-shadow: var(--shadow-sm);
//   }

//   &--tinted {
//     background: var(--bg-ternary);
//     border-color: var(--border-secondary);
//   }

//   &--info {
//     background: var(--color-info-bg);
//     border: var(--ui-border-width) dashed var(--color-info-border);
//   }
// }

// .panel-head {
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: var(--spacing-md) var(--spacing-lg);
//   border-bottom: var(--ui-border-width) solid var(--border-primary);
//   background: var(--bg-secondary);
//   flex-shrink: 0;
//   gap: var(--spacing-lg);
// }

// .panel-title {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-secondary);
//   margin: 0;
// }

// .panel-sub {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: var(--spacing-xs) 0 0 0;
// }

// .error-badge {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.04em;
//   padding: var(--spacing-xs) var(--spacing-md);
//   border-radius: var(--ui-border-radius-pill);
//   background: var(--color-error-bg);
//   color: var(--color-error);
//   border: var(--ui-border-width) solid var(--color-error-border);
//   white-space: nowrap;
//   flex-shrink: 0;
// }

// .grid-wrap {
//   flex: 1;
//   position: relative;
//   min-height: 0;
// }

// .fill-grid {
//   position: absolute;
//   inset: 0;
//   width: 100%;
//   height: 100%;
//   display: block;
// }

// /* ── Side column ── */
// .side-col {
//   display: flex;
//   flex-direction: column;
//   gap: var(--spacing-lg);
// }

// .widget-title {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.08em;
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .widget-desc {
//   font-size: var(--font-size-xs);
//   color: var(--text-tertiary);
//   margin: 0;
// }

// .locked-value {
//   font-size: var(--font-size-3xl);
//   font-weight: var(--font-weight-bold);
//   font-family: var(--font-mono);
//   color: var(--color-error);
//   margin: 0;
//   line-height: var(--line-height-tight);
// }

// .locked-label {
//   font-size: var(--font-size-xs);
//   font-weight: var(--font-weight-bold);
//   text-transform: uppercase;
//   letter-spacing: 0.06em;
//   color: var(--color-error);
//   opacity: 0.8;
//   margin: var(--spacing-xs) 0 0 0;
// }

// .danger-btn {
//   display: inline-flex;
//   align-items: center;
//   justify-content: center;
//   gap: var(--spacing-md);
//   width: 100%;
//   height: 34px;
//   background: var(--color-error);
//   color: #fff;
//   border: none;
//   border-radius: var(--ui-border-radius);
//   cursor: pointer;
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   font-family: var(--font-body);
//   transition: var(--transition-base);

//   &:hover { background: var(--color-error-dark); }
// }

// /* ── Tip panel ── */
// .tip-row {
//   display: flex;
//   gap: var(--spacing-md);
//   align-items: flex-start;
// }

// .tip-icon {
//   color: var(--color-info);
//   font-size: var(--font-size-base);
//   margin-top: 2px;
//   flex-shrink: 0;
// }

// .tip-title {
//   font-size: var(--font-size-sm);
//   font-weight: var(--font-weight-semibold);
//   color: var(--color-info);
//   margin: 0 0 var(--spacing-xs) 0;
// }

// .tip-body {
//   font-size: var(--font-size-xs);
//   color: var(--text-secondary);
//   line-height: var(--line-height-relaxed);
//   margin: 0;
// }
//   `]
// })
// export class ProductPerformanceComponent implements OnInit {
//   private analyticsService = inject(AdminAnalyticsService);
//   public commonService = inject(CommonMethodService);
//   private cdr = inject(ChangeDetectorRef);

//   performanceData = signal<any>(null);
//   loading = signal(false);
//   deadStockColumns: any[] = [];

//   readonly deadStockActionColumn: ActionColumnConfig = {
//     showView: true,
//     showEdit: false,
//     showDelete: false,
//     viewPermission: PERMISSIONS.PRODUCT.READ,
//   };

//   private currentFilters: Record<string, any> = {};

//   filterConfig: FilterField[] = [
//     {
//       key: 'branchId',
//       label: 'Branch Context',
//       type: 'select',
//       dataSourceKey: 'branches',
//       optionLabel: 'name',
//       optionValue: '_id',
//       placeholder: 'Global Inventory'
//     }
//   ];

//   ngOnInit(): void { this.setupColumns(); }

//   onFilterUpdate(filters: Record<string, any>): void {
//     this.currentFilters = filters;
//     this.loadData();
//   }

//   loadData(): void {
//     this.loading.set(true);
//     this.analyticsService.getProductPerformance(this.currentFilters['branchId']).subscribe({
//       next: (res) => {
//         if (res.status === 'success') this.performanceData.set(res.data);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false)
//     });
//   }

//   calculateTotalDeadStockValue(): number {
//     return (this.performanceData()?.deadStock ?? [])
//       .reduce((sum: number, item: any) => sum + (item.value ?? 0), 0);
//   }

//   handleGridAction(event: any): void {
//     // Handle liquidate action from grid
//   }

//   setupColumns(): void {
//     this.deadStockColumns = [
//       {
//         field: 'name',
//         headerName: 'Product Name',
//         sortable: true,
//         flex: 1.5,
//         minWidth: 180,
//         cellStyle: {
//           'font-weight': 'var(--font-weight-semibold)',
//           'color': 'var(--text-primary)',
//           'font-size': 'var(--font-size-sm)'
//         }
//       },
//       {
//         field: 'sku',
//         headerName: 'SKU',
//         sortable: true,
//         width: 140,
//         cellStyle: {
//           'font-family': 'var(--font-mono)',
//           'color': 'var(--text-secondary)',
//           'font-size': 'var(--font-size-xs)',
//           'letter-spacing': '0.5px'
//         }
//       },
//       {
//         field: 'stockQuantity',
//         headerName: 'Qty',
//         sortable: true,
//         width: 100,
//         type: 'rightAligned',
//         cellStyle: {
//           'font-family': 'var(--font-mono)',
//           'font-weight': 'var(--font-weight-semibold)',
//           'text-align': 'right',
//           'color': 'var(--text-primary)'
//         }
//       },
//       {
//         field: 'value',
//         headerName: 'Tied Capital',
//         sortable: true,
//         width: 140,
//         type: 'rightAligned',
//         valueFormatter: (p: any) => this.commonService.formatCurrency(p.value),
//         cellStyle: {
//           'font-weight': 'var(--font-weight-bold)',
//           'font-family': 'var(--font-mono)',
//           'color': 'var(--color-error)',
//           'text-align': 'right'
//         }
//       },
//       {
//         headerName: 'Action',
//         width: 110,
//         // CSS vars work in inline styles injected into cell renderer HTML
//         cellRenderer: () =>
//           `<button style="background:var(--bg-primary);border:1px solid var(--color-error-border);color:var(--color-error);padding:4px 10px;border-radius:var(--ui-border-radius-sm);font-size:var(--font-size-xs);font-weight:var(--font-weight-bold);cursor:pointer;text-transform:uppercase;font-family:var(--font-body);">
//              Liquidate
//            </button>`,
//         cellStyle: { 'display': 'flex', 'align-items': 'center', 'justify-content': 'center' }
//       }
//     ];
//     this.cdr.detectChanges();
//   }
// }
