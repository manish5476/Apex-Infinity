import { Component, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

// Chart Component Imports
import { AovTrendChartComponent } from './charts/aov-trend-chart.component';
import { BranchRadarChartComponent } from './charts/branch-radar-chart.component';
import { CustomerAcquisitionChartComponent } from './charts/customer-acquisition-chart.component';
import { EmiPortfolioChartComponent } from './charts/emi-portfolio-chart.component';
import { FinancialTrendChartComponent } from './charts/financial-trend-chart.component';
import { GrossProfitTrendChartComponent } from './charts/gross-profit-trend-chart.component';
import { HeatmapChartComponent } from './charts/heatmap-chart.component';
import { InventoryHealthChartComponent } from './charts/inventory-health-chart.component';
import { OrderFunnelChartComponent } from './charts/order-funnel-chart.component';
import { PaymentMethodsChartComponent } from './charts/payment-methods-chart.component';
import { PurchaseVsSalesChartComponent } from './charts/purchase-vs-sales-chart.component';
import { SalesDistributionChartComponent } from './charts/sales-distribution-chart.component';
import { SalesReturnRateChartComponent } from './charts/sales-return-rate-chart.component';
import { TopPerformersChartComponent } from './charts/top-performers-chart.component';
import { YoyGrowthChartComponent } from './charts/yoy-growth-chart.component';
import { CustomerOutstandingChartComponent } from './charts/customer-outstanding-chart.component';

interface ChartMeta {
  id: string;
  title: string;
  component: any;
  category: string;
  description: string;
  icon: string;
}

const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  Finance:    { color: '#6366f1', icon: 'pi pi-wallet' },
  Sales:      { color: '#10b981', icon: 'pi pi-shopping-cart' },
  Customer:   { color: '#f59e0b', icon: 'pi pi-users' },
  Operations: { color: '#3b82f6', icon: 'pi pi-cog' },
  Inventory:  { color: '#ef4444', icon: 'pi pi-box' },
  All:        { color: 'var(--accent-primary)', icon: 'pi pi-th-large' },
};

@Component({
  selector: 'app-admin-charts-analysis',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    TooltipModule, DialogModule, ButtonModule,
  ],
  template: `
    <div class="analysis-hub">

      <!-- ══════════════ HEADER ══════════════ -->
      <header class="hub-header">
        <div class="header-left">
          <div class="hub-icon">
            <i class="pi pi-chart-bar"></i>
          </div>
          <div class="hub-title-block">
            <h1 class="hub-title">Charts & Analysis</h1>
            <p class="hub-subtitle">
              <span class="count-badge">{{ filteredCharts().length }}</span>
              of {{ charts.length }} charts
            </p>
          </div>
        </div>

        <div class="header-right">
          <!-- Search -->
          <div class="search-wrap" [class.focused]="searchFocused">
            <i class="pi pi-search search-icon"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search charts…"
              (focus)="searchFocused = true"
              (blur)="searchFocused = false" />
            @if (searchQuery) {
              <button class="search-clear" (click)="searchQuery = ''">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>

          <!-- Refresh -->
          <button class="icon-btn" [class.spinning]="isRefreshing"
            (click)="refreshAllCharts()"
            pTooltip="Refresh all" tooltipPosition="bottom">
            <i class="pi pi-refresh"></i>
          </button>
        </div>
      </header>

      <!-- ══════════════ CATEGORY FILTERS ══════════════ -->
      <div class="filter-bar">
        @for (cat of categories; track cat) {
          <button
            class="cat-pill"
            [class.active]="activeCategory() === cat"
            [style.--cc]="getCatColor(cat)"
            (click)="activeCategory.set(cat)">
            <i [class]="getCatIcon(cat)" class="cat-icon"></i>
            <span>{{ cat }}</span>
            <span class="pill-count">{{ getCatCount(cat) }}</span>
          </button>
        }
      </div>

      <!-- ══════════════ CHART GRID ══════════════ -->
      <div class="charts-grid">
        @for (chart of filteredCharts(); track chart.id; let i = $index) {
          <div
            class="chart-card"
            [style.--delay]="(i * 35) + 'ms'"
            [style.--cc]="getCatColor(chart.category)"
            (click)="openPreview(chart)">

            <!-- Top strip -->
            <div class="card-strip">
              <div class="strip-left">
                <span class="cat-dot" [style.background]="getCatColor(chart.category)"></span>
                <span class="cat-label">{{ chart.category }}</span>
              </div>
              <button class="card-expand-btn"
                (click)="$event.stopPropagation(); openPreview(chart)"
                pTooltip="Expand" tooltipPosition="left">
                <i class="pi pi-expand"></i>
              </button>
            </div>

            <!-- Chart area -->
            <div class="card-body">
              <ng-container [ngComponentOutlet]="chart.component"></ng-container>
            </div>

            <!-- Bottom info bar -->
            <div class="card-footer">
              <div class="card-footer-inner">
                <span class="card-title">{{ chart.title }}</span>
                <span class="card-desc">{{ chart.description }}</span>
              </div>
              <i class="pi pi-arrow-right card-arrow"></i>
            </div>
          </div>
        }

        @empty {
          <div class="empty-state">
            <div class="empty-glyph">
              <i class="pi pi-chart-line"></i>
            </div>
            <h3>No charts found</h3>
            <p>Try adjusting your search or category filter</p>
            <button class="btn-ghost" (click)="clearFilters()">
              <i class="pi pi-filter-slash"></i> Clear filters
            </button>
          </div>
        }
      </div>
    </div>

    <!-- ══════════════ PREVIEW DIALOG (p-dialog) ══════════════ -->
    <p-dialog
      [(visible)]="dialogVisible"
      [modal]="true"
      [dismissableMask]="true"
      [closeOnEscape]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '85vw', height: '80vh' }"
      [contentStyle]="{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }"
      [showHeader]="false"
      styleClass="apex-chart-dialog"
      (onHide)="onDialogHide()">

      @if (previewChart()) {
        <div class="dlg-root">

          <!-- Dialog Header -->
          <div class="dlg-header">
            <div class="dlg-header-left">
              <span class="dlg-cat-badge"
                [style.--cc]="getCatColor(previewChart()!.category)"
                [style.background]="'color-mix(in srgb,' + getCatColor(previewChart()!.category) + ' 12%, transparent 88%)'"
                [style.border-color]="'color-mix(in srgb,' + getCatColor(previewChart()!.category) + ' 28%, transparent 72%)'"
                [style.color]="getCatColor(previewChart()!.category)">
                <i [class]="getCatIcon(previewChart()!.category)"></i>
                {{ previewChart()!.category }}
              </span>
              <div class="dlg-title-block">
                <h2 class="dlg-title">{{ previewChart()!.title }}</h2>
                <p class="dlg-desc">{{ previewChart()!.description }}</p>
              </div>
            </div>

            <div class="dlg-header-right">
              <!-- Prev / Next -->
              <div class="nav-group">
                <button class="nav-btn"
                  [disabled]="currentChartIndex() === 0"
                  (click)="navigateChart(-1)"
                  pTooltip="Previous" tooltipPosition="bottom">
                  <i class="pi pi-chevron-left"></i>
                </button>
                <span class="nav-label">{{ currentChartIndex() + 1 }} / {{ filteredCharts().length }}</span>
                <button class="nav-btn"
                  [disabled]="currentChartIndex() === filteredCharts().length - 1"
                  (click)="navigateChart(1)"
                  pTooltip="Next" tooltipPosition="bottom">
                  <i class="pi pi-chevron-right"></i>
                </button>
              </div>

              <div class="dlg-sep"></div>

              <!-- Kbd hints -->
              <div class="kbd-row">
                <span class="kbd-hint"><kbd>←</kbd><kbd>→</kbd></span>
                <span class="kbd-hint"><kbd>Esc</kbd></span>
              </div>

              <div class="dlg-sep"></div>

              <button class="close-btn" (click)="dialogVisible = false"
                pTooltip="Close" tooltipPosition="bottom">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>

          <!-- Chart Body -->
          <div class="dlg-body">
            <ng-container [ngComponentOutlet]="previewChart()!.component"></ng-container>
          </div>

          <!-- Footer — thumbnail navigation -->
          <div class="dlg-footer">
            <div class="dlg-thumbs">
              @for (c of filteredCharts(); track c.id; let i = $index) {
                <button
                  class="thumb-chip"
                  [class.active]="c.id === previewChart()!.id"
                  [style.--cc]="getCatColor(c.category)"
                  (click)="openPreview(c)"
                  [pTooltip]="c.title"
                  tooltipPosition="top">
                  <span class="thumb-dot"></span>
                  {{ c.title }}
                </button>
              }
            </div>
          </div>

        </div>
      }
    </p-dialog>
  `,
  styles: [`
    /* ═══════════════════════════════════════
       HOST
    ═══════════════════════════════════════ */
    :host { display: block; background: var(--bg-secondary); min-height: 100%; }

    .analysis-hub {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      max-width: 1700px;
      margin: 0 auto;
    }

    /* ═══════════════════════════════════════
       HEADER
    ═══════════════════════════════════════ */
    .hub-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-lg);
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-lg) var(--spacing-xl);
      box-shadow: var(--elevation-1);
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .hub-icon {
      width: 40px; height: 40px;
      border-radius: var(--ui-border-radius);
      background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)));
      color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .hub-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
    }

    .hub-subtitle {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin: 2px 0 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .count-badge {
      background: var(--accent-focus);
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent 80%);
      padding: 0 6px;
      border-radius: 99px;
      font-size: 10px;
      font-weight: 700;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    /* Search */
    .search-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-pill);
      padding: 0 12px;
      width: 240px;
      transition: var(--transition-base);

      &.focused {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 3px var(--accent-focus);
        background: var(--bg-primary);
      }

      .search-icon {
        font-size: 12px;
        color: var(--text-tertiary);
        flex-shrink: 0;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        padding: 8px 0;
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        &::placeholder { color: var(--text-tertiary); }
      }

      .search-clear {
        width: 18px; height: 18px;
        border-radius: 50%;
        border: 1px solid var(--border-primary);
        background: var(--bg-primary);
        color: var(--text-tertiary);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-size: 9px;
        transition: var(--transition-fast);
        flex-shrink: 0;
        &:hover { color: var(--color-error); border-color: var(--color-error); }
      }
    }

    /* Icon button (refresh) */
    .icon-btn {
      width: 36px; height: 36px;
      border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 13px;
      transition: var(--transition-base);
      &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
      &.spinning i { animation: spin 0.9s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══════════════════════════════════════
       CATEGORY FILTER BAR
    ═══════════════════════════════════════ */
    .filter-bar {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius);
      padding: var(--spacing-sm) var(--spacing-md);
      box-shadow: var(--elevation-1);
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: var(--ui-border-radius-pill);
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-fast);

      .cat-icon { font-size: 11px; opacity: 0.7; }

      .pill-count {
        font-size: 10px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        color: var(--text-tertiary);
        padding: 0 5px;
        border-radius: 99px;
        line-height: 1.6;
        transition: var(--transition-fast);
      }

      &:hover {
        background: color-mix(in srgb, var(--cc) 8%, transparent 92%);
        border-color: color-mix(in srgb, var(--cc) 25%, transparent 75%);
        color: var(--text-primary);
      }

      &.active {
        background: color-mix(in srgb, var(--cc) 12%, var(--bg-primary) 88%);
        border-color: var(--cc);
        color: var(--text-primary);
        font-weight: var(--font-weight-semibold);

        .cat-icon { opacity: 1; color: var(--cc); }
        .pill-count {
          background: var(--cc);
          border-color: var(--cc);
          color: #fff;
        }
      }
    }

    /* ═══════════════════════════════════════
       CHART GRID
    ═══════════════════════════════════════ */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: var(--spacing-lg);
      padding-bottom: var(--spacing-2xl);
    }

    /* ═══════════════════════════════════════
       CHART CARD
    ═══════════════════════════════════════ */
    .chart-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      box-shadow: var(--elevation-1);
      animation: cardReveal 0.3s ease both;
      animation-delay: var(--delay, 0ms);
      transition:
        transform 0.2s cubic-bezier(0.2, 0.9, 0.2, 1),
        box-shadow 0.2s ease,
        border-color 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: var(--elevation-2);
        border-color: var(--cc);

        .card-expand-btn { opacity: 1; transform: scale(1); }
        .card-footer { background: color-mix(in srgb, var(--cc) 5%, var(--bg-primary) 95%); }
        .card-arrow { opacity: 1; transform: translateX(0); color: var(--cc); }
      }
    }

    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Card strip (top bar) */
    .card-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      min-height: 36px;
    }

    .strip-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cat-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .cat-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-tertiary);
    }

    .card-expand-btn {
      width: 24px; height: 24px;
      border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary);
      background: var(--bg-primary);
      color: var(--text-tertiary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: 10px;
      transition: var(--transition-fast);
      opacity: 0;
      transform: scale(0.8);
      &:hover { background: var(--cc); color: #fff; border-color: var(--cc); }
    }

    /* Card chart area */
    .card-body {
      flex: 1;
      padding: var(--spacing-md);
      pointer-events: none;
      user-select: none;
      min-height: 200px;
    }

    /* Card footer info bar */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      padding: 10px 14px;
      border-top: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      transition: background 0.2s ease;
    }

    .card-footer-inner {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .card-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-desc {
      font-size: 10px;
      color: var(--text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-arrow {
      font-size: 11px;
      color: var(--text-tertiary);
      opacity: 0.4;
      transform: translateX(-4px);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    /* ═══════════════════════════════════════
       EMPTY STATE
    ═══════════════════════════════════════ */
    .empty-state {
      grid-column: 1 / -1;
      padding: 80px 0;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
    }

    .empty-glyph {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 1px solid var(--border-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px;
      color: var(--text-tertiary);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: var(--font-size-lg);
      color: var(--text-secondary);
      margin: 0;
    }

    .empty-state p {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      margin: 0;
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: var(--spacing-sm) var(--spacing-xl);
      border: 1px solid var(--accent-primary);
      background: transparent;
      color: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: var(--transition-base);
      &:hover { background: var(--accent-primary); color: #fff; }
    }

    /* ═══════════════════════════════════════
       DIALOG INNER LAYOUT
       (p-dialog handles the outer shell;
        we control everything inside)
    ═══════════════════════════════════════ */
    .dlg-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* Dialog header */
    .dlg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-xl);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .dlg-header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      min-width: 0;
    }

    .dlg-cat-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: var(--ui-border-radius-pill);
      border: 1px solid transparent;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      flex-shrink: 0;
      i { font-size: 10px; }
    }

    .dlg-title-block { min-width: 0; }

    .dlg-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dlg-desc {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      margin: 2px 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dlg-header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-shrink: 0;
    }

    /* Prev/Next nav */
    .nav-group {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
      padding: 2px;
    }

    .nav-btn {
      width: 28px; height: 28px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px;
      transition: var(--transition-fast);
      &:hover:not(:disabled) { background: var(--accent-focus); color: var(--accent-primary); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }

    .nav-label {
      font-size: 11px;
      color: var(--text-tertiary);
      font-weight: 500;
      padding: 0 6px;
      white-space: nowrap;
    }

    .dlg-sep {
      width: 1px;
      height: 22px;
      background: var(--border-primary);
      flex-shrink: 0;
    }

    /* Keyboard hints */
    .kbd-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .kbd-hint {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1px 5px;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-bottom-width: 2px;
      border-radius: 3px;
      font-size: 9px;
      font-family: var(--font-mono);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    /* Close button */
    .close-btn {
      width: 32px; height: 32px;
      border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary);
      background: var(--bg-primary);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
      transition: var(--transition-fast);
      &:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); }
    }

    /* Dialog chart body */
    .dlg-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: var(--spacing-xl);
      scrollbar-width: thin;
      scrollbar-color: var(--border-primary) transparent;
      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 99px; }
    }

    /* Dialog footer thumbnails */
    .dlg-footer {
      flex-shrink: 0;
      border-top: 1px solid var(--border-primary);
      background: var(--bg-secondary);
      padding: var(--spacing-sm) var(--spacing-lg);
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .dlg-thumbs {
      display: flex;
      gap: 5px;
      width: max-content;
      align-items: center;
    }

    .thumb-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: var(--ui-border-radius-pill);
      border: 1px solid var(--border-primary);
      background: var(--bg-primary);
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition-fast);

      .thumb-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: var(--cc);
        flex-shrink: 0;
        opacity: 0.5;
        transition: var(--transition-fast);
      }

      &:hover {
        border-color: var(--cc);
        color: var(--text-primary);
        .thumb-dot { opacity: 1; }
      }

      &.active {
        background: color-mix(in srgb, var(--cc) 10%, var(--bg-primary) 90%);
        border-color: var(--cc);
        color: var(--text-primary);
        font-weight: var(--font-weight-semibold);
        .thumb-dot { opacity: 1; }
      }
    }

    /* ═══════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════ */
    @media (max-width: 1100px) {
      .charts-grid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
    }
    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
      .hub-header { flex-direction: column; align-items: flex-start; }
      .search-wrap { width: 100%; }
      .kbd-row { display: none; }
    }
  `]
})
export class AdminChartsAnalysisComponent {

  searchQuery    = '';
  searchFocused  = false;
  isRefreshing   = false;
  dialogVisible  = false;

  activeCategory = signal('All');
  previewChart   = signal<ChartMeta | null>(null);

  categories = ['All', 'Finance', 'Sales', 'Customer', 'Operations', 'Inventory'];

  charts: ChartMeta[] = [
    { title: 'AOV Trend',            id: 'aov',         category: 'Sales',      description: 'Avg Order Value vs quantity trends',    icon: '', component: AovTrendChartComponent },
    { title: 'Branch Radar',         id: 'radar',        category: 'Operations', description: 'Cross-branch performance comparison',   icon: '', component: BranchRadarChartComponent },
    { title: 'Customer Acquisition', id: 'acquisition',  category: 'Customer',   description: 'New customer growth over time',         icon: '', component: CustomerAcquisitionChartComponent },
    { title: 'EMI Portfolio',        id: 'emi',          category: 'Finance',    description: 'Loan health and repayment analysis',    icon: '', component: EmiPortfolioChartComponent },
    { title: 'Financial Trend',      id: 'financial',    category: 'Finance',    description: 'Revenue and expense tracking',          icon: '', component: FinancialTrendChartComponent },
    { title: 'Gross Profit',         id: 'gp',           category: 'Finance',    description: 'Monthly profit margin analysis',        icon: '', component: GrossProfitTrendChartComponent },
    { title: 'Performance Heatmap',  id: 'heatmap',      category: 'Operations', description: 'Hourly activity distribution by day',  icon: '', component: HeatmapChartComponent },
    { title: 'Inventory Health',     id: 'inventory',    category: 'Inventory',  description: 'Stock levels and critical items',       icon: '', component: InventoryHealthChartComponent },
    { title: 'Order Funnel',         id: 'funnel',       category: 'Sales',      description: 'Conversion tracking through stages',   icon: '', component: OrderFunnelChartComponent },
    { title: 'Payment Mix',          id: 'payment',      category: 'Finance',    description: 'Breakdown of transaction modes',        icon: '', component: PaymentMethodsChartComponent },
    { title: 'Purchase vs Sales',    id: 'pvs',          category: 'Finance',    description: 'Procurement vs revenue balance',        icon: '', component: PurchaseVsSalesChartComponent },
    { title: 'Sales Distribution',   id: 'dist',         category: 'Sales',      description: 'Regional and category sales mix',       icon: '', component: SalesDistributionChartComponent },
    { title: 'Return Rate',          id: 'return',       category: 'Sales',      description: 'Refunds and item returns analysis',     icon: '', component: SalesReturnRateChartComponent },
    { title: 'Top Performers',       id: 'performers',   category: 'Sales',      description: 'Best selling products and branches',   icon: '', component: TopPerformersChartComponent },
    { title: 'YoY Growth',           id: 'growth',       category: 'Finance',    description: 'Year-over-year expansion metrics',      icon: '', component: YoyGrowthChartComponent },
    { title: 'Customer Outstanding', id: 'outstanding',  category: 'Customer',   description: 'Top credit exposure by balance',        icon: '', component: CustomerOutstandingChartComponent },
  ];

  filteredCharts = computed(() => {
    const q   = this.searchQuery.toLowerCase();
    const cat = this.activeCategory();
    return this.charts.filter(c => {
      const matchSearch = !q
        || c.title.toLowerCase().includes(q)
        || c.category.toLowerCase().includes(q)
        || c.description.toLowerCase().includes(q);
      const matchCat = cat === 'All' || c.category === cat;
      return matchSearch && matchCat;
    });
  });

  currentChartIndex = computed(() => {
    const pc = this.previewChart();
    if (!pc) return 0;
    return this.filteredCharts().findIndex(c => c.id === pc.id);
  });

  getCatColor(cat: string): string {
    return CATEGORY_META[cat]?.color ?? CATEGORY_META['All'].color;
  }

  getCatIcon(cat: string): string {
    return CATEGORY_META[cat]?.icon ?? CATEGORY_META['All'].icon;
  }

  getCatCount(cat: string): number {
    if (cat === 'All') return this.charts.length;
    return this.charts.filter(c => c.category === cat).length;
  }

  openPreview(chart: ChartMeta): void {
    this.previewChart.set(chart);
    this.dialogVisible = true;
  }

  onDialogHide(): void {
    this.previewChart.set(null);
  }

  navigateChart(dir: -1 | 1): void {
    const charts = this.filteredCharts();
    const next   = this.currentChartIndex() + dir;
    if (next >= 0 && next < charts.length) {
      this.previewChart.set(charts[next]);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (!this.dialogVisible) return;
    if (e.key === 'ArrowRight') { this.navigateChart(1);  return; }
    if (e.key === 'ArrowLeft')  { this.navigateChart(-1); return; }
  }

  refreshAllCharts(): void {
    this.isRefreshing = true;
    setTimeout(() => this.isRefreshing = false, 1500);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activeCategory.set('All');
  }
}// import { Component, signal, computed, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TooltipModule } from 'primeng/tooltip';

// // Chart Component Imports
// import { AovTrendChartComponent } from './charts/aov-trend-chart.component';
// import { BranchRadarChartComponent } from './charts/branch-radar-chart.component';
// import { CustomerAcquisitionChartComponent } from './charts/customer-acquisition-chart.component';
// import { EmiPortfolioChartComponent } from './charts/emi-portfolio-chart.component';
// import { FinancialTrendChartComponent } from './charts/financial-trend-chart.component';
// import { GrossProfitTrendChartComponent } from './charts/gross-profit-trend-chart.component';
// import { HeatmapChartComponent } from './charts/heatmap-chart.component';
// import { InventoryHealthChartComponent } from './charts/inventory-health-chart.component';
// import { OrderFunnelChartComponent } from './charts/order-funnel-chart.component';
// import { PaymentMethodsChartComponent } from './charts/payment-methods-chart.component';
// import { PurchaseVsSalesChartComponent } from './charts/purchase-vs-sales-chart.component';
// import { SalesDistributionChartComponent } from './charts/sales-distribution-chart.component';
// import { SalesReturnRateChartComponent } from './charts/sales-return-rate-chart.component';
// import { TopPerformersChartComponent } from './charts/top-performers-chart.component';
// import { YoyGrowthChartComponent } from './charts/yoy-growth-chart.component';
// import { CustomerOutstandingChartComponent } from './charts/customer-outstanding-chart.component';

// interface ChartMeta {
//   id: string;
//   title: string;
//   component: any;
//   category: string;
//   description: string;
//   icon: string;
// }

// const CATEGORY_COLORS: Record<string, string> = {
//   Finance: '#6366f1',
//   Sales: '#10b981',
//   Customer: '#f59e0b',
//   Operations: '#3b82f6',
//   Inventory: '#ef4444',
//   All: 'var(--accent-primary)'
// };

// @Component({
//   selector: 'app-admin-charts-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, TooltipModule,

//   ],
//   template: `
//     <div class="analysis-hub">

//       <!-- ══════════════════════ HEADER ══════════════════════ -->
//       <header class="hub-header">
//         <div class="header-main">
//           <div class="header-title">
//             <div class="title-icon">
//               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                 <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
//                 <line x1="6" y1="20" x2="6" y2="14"/>
//               </svg>
//             </div>
//             <div>
//               <h1>Charts & Analysis</h1>
//               <p>{{ filteredCharts().length }} of {{ charts.length }} charts · Click any chart to preview</p>
//             </div>
//           </div>

//           <div class="header-actions">
//             <div class="search-box">
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//               </svg>
//               <input type="text" [(ngModel)]="searchQuery" placeholder="Search charts…" />
//               <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
//                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
//                   <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
//                 </svg>
//               </button>
//             </div>

//             <button class="refresh-btn" (click)="refreshAllCharts()"
//               pTooltip="Refresh all charts" tooltipPosition="bottom"
//               [class.spinning]="isRefreshing">
//               <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                 <polyline points="23 4 23 10 17 10"/>
//                 <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
//               </svg>
//             </button>
//           </div>
//         </div>

//         <!-- Category Filters -->
//         <div class="category-filters">
//           @for (cat of categories; track cat) {
//             <button class="cat-chip"
//               [class.active]="activeCategory() === cat"
//               [style.--cat-color]="getCatColor(cat)"
//               (click)="activeCategory.set(cat)">
//               <span class="cat-dot"></span>
//               {{ cat }}
//               <span class="cat-count">{{ getCatCount(cat) }}</span>
//             </button>
//           }
//         </div>
//       </header>

//       <!-- ══════════════════════ GRID ══════════════════════ -->
//       <div class="charts-grid">
//         @for (chart of filteredCharts(); track chart.id; let i = $index) {
//           <div class="chart-card" [style.--anim-delay]="(i * 40) + 'ms'" (click)="openPreview(chart)">

//             <!-- Card top bar -->
//             <div class="card-topbar">
//               <div class="card-badge" [style.--cat-color]="getCatColor(chart.category)">
//                 <span class="badge-dot"></span>{{ chart.category }}
//               </div>
//               <button class="expand-btn" (click)="$event.stopPropagation(); openPreview(chart)"
//                 pTooltip="Full preview" tooltipPosition="left">
//                 <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                   <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
//                 </svg>
//               </button>
//             </div>

//             <!-- Actual chart component -->
//             <div class="card-chart-wrap">
//               <ng-container [ngComponentOutlet]="chart.component"></ng-container>
//             </div>

//             <!-- Hover overlay with info -->
//             <div class="card-hover-overlay">
//               <div class="overlay-content">
//                 <span class="overlay-title">{{ chart.title }}</span>
//                 <span class="overlay-desc">{{ chart.description }}</span>
//                 <span class="overlay-cta">
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                     <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
//                   </svg>
//                   Click to expand
//                 </span>
//               </div>
//             </div>
//           </div>
//         }

//         @empty {
//           <div class="empty-state">
//             <div class="empty-icon">
//               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
//                 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
//               </svg>
//             </div>
//             <h3>No charts found</h3>
//             <p>Try a different search term or category</p>
//             <button class="clear-filters-btn" (click)="clearFilters()">Clear filters</button>
//           </div>
//         }
//       </div>
//     </div>

//     <!-- ══════════════════════ PREVIEW DIALOG ══════════════════════ -->
//     @if (previewChart()) {
//       <div class="dialog-backdrop" (click)="closePreview()" [class.closing]="isClosing">
//         <div class="dialog-panel" (click)="$event.stopPropagation()" [class.closing]="isClosing">

//           <!-- Dialog Header -->
//           <div class="dialog-header">
//             <div class="dialog-title-group">
//               <div class="dialog-badge" [style.--cat-color]="getCatColor(previewChart()!.category)">
//                 <span class="badge-dot"></span>{{ previewChart()!.category }}
//               </div>
//               <div>
//                 <h2 class="dialog-title">{{ previewChart()!.title }}</h2>
//                 <p class="dialog-subtitle">{{ previewChart()!.description }}</p>
//               </div>
//             </div>

//             <div class="dialog-controls">
//               <!-- Prev / Next navigation -->
//               <button class="nav-btn" (click)="navigateChart(-1)"
//                 [disabled]="currentChartIndex() === 0"
//                 pTooltip="Previous chart" tooltipPosition="bottom">
//                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                   <polyline points="15 18 9 12 15 6"/>
//                 </svg>
//               </button>
//               <span class="nav-counter">{{ currentChartIndex() + 1 }} / {{ filteredCharts().length }}</span>
//               <button class="nav-btn" (click)="navigateChart(1)"
//                 [disabled]="currentChartIndex() === filteredCharts().length - 1"
//                 pTooltip="Next chart" tooltipPosition="bottom">
//                 <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
//                   <polyline points="9 18 15 12 9 6"/>
//                 </svg>
//               </button>

//               <div class="dialog-sep"></div>

//               <button class="close-btn" (click)="closePreview()" pTooltip="Close (Esc)" tooltipPosition="bottom">
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
//                   <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
//                 </svg>
//               </button>
//             </div>
//           </div>

//           <!-- Keyboard hint -->
//           <div class="kbd-hints">
//             <span class="kbd-hint"><kbd>←</kbd><kbd>→</kbd> Navigate</span>
//             <span class="kbd-hint"><kbd>Esc</kbd> Close</span>
//           </div>

//           <!-- Dialog Chart Body -->
//           <div class="dialog-body">
//             <ng-container [ngComponentOutlet]="previewChart()!.component"></ng-container>
//           </div>

//           <!-- Dialog Footer -->
//           <div class="dialog-footer">
//             <!-- Sibling chart thumbnails -->
//             <div class="sibling-chips">
//               @for (c of filteredCharts(); track c.id; let i = $index) {
//                 <button class="sibling-chip"
//                   [class.active]="c.id === previewChart()!.id"
//                   [style.--cat-color]="getCatColor(c.category)"
//                   (click)="openPreview(c)"
//                   [pTooltip]="c.title" tooltipPosition="top">
//                   <span class="chip-dot"></span>
//                   {{ c.title }}
//                 </button>
//               }
//             </div>
//           </div>
//         </div>
//       </div>
//     }
//   `,
//   styles: [`
//     /* ═══════════════════════════════════════════════
//        HOST & LAYOUT
//     ═══════════════════════════════════════════════ */
//     :host { display: block; background: var(--bg-secondary); min-height: 100%; }

//     .analysis-hub {
//       padding: var(--spacing-xl);
//       max-width: 1640px;
//       margin: 0 auto;
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xl);
//     }

//     /* ═══════════════════════════════════════════════
//        HEADER
//     ═══════════════════════════════════════════════ */
//     .hub-header {
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-xl);
//       box-shadow: var(--elevation-1);
//     }

//     .header-main {
//       display: flex; justify-content: space-between; align-items: center;
//       gap: var(--spacing-xl); margin-bottom: var(--spacing-lg); flex-wrap: wrap;
//     }

//     .header-title {
//       display: flex; align-items: center; gap: var(--spacing-md);
//       h1 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }
//       p { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 3px 0 0; }
//     }

//     .title-icon {
//       width: 42px; height: 42px; border-radius: var(--ui-border-radius);
//       background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)));
//       color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
//     }

//     .header-actions { display: flex; gap: var(--spacing-md); align-items: center; }

//     .search-box {
//       position: relative; width: 300px; display: flex; align-items: center;
//       background: var(--bg-secondary); border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-pill); padding: 0 12px; gap: 8px;
//       transition: var(--transition-base);
//       &:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-focus); background: var(--bg-primary); }
//       svg { color: var(--text-tertiary); flex-shrink: 0; }
//       input {
//         flex: 1; border: none; background: transparent; outline: none; padding: 9px 0;
//         font-size: var(--font-size-sm); color: var(--text-primary);
//         &::placeholder { color: var(--text-tertiary); }
//       }
//     }

//     .search-clear {
//       background: var(--bg-primary); border: 1px solid var(--border-primary);
//       border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center;
//       justify-content: center; cursor: pointer; color: var(--text-tertiary);
//       flex-shrink: 0; transition: var(--transition-fast);
//       &:hover { color: var(--color-error); border-color: var(--color-error); }
//     }

//     .refresh-btn {
//       width: 38px; height: 38px; border-radius: 50%;
//       border: 1px solid var(--border-primary); background: var(--bg-secondary);
//       color: var(--text-secondary); cursor: pointer; display: flex;
//       align-items: center; justify-content: center; transition: var(--transition-base);
//       svg { transition: transform 0.4s ease; }
//       &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
//       &.spinning svg { animation: spin 1s linear infinite; }
//     }
//     @keyframes spin { to { transform: rotate(360deg); } }

//     /* Category Filters */
//     .category-filters { display: flex; gap: var(--spacing-xs); flex-wrap: wrap; }

//     .cat-chip {
//       display: flex; align-items: center; gap: 6px;
//       padding: 5px 14px 5px 10px; border-radius: var(--ui-border-radius-pill);
//       border: 1px solid var(--border-primary); background: var(--bg-secondary);
//       color: var(--text-secondary); font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium); cursor: pointer; transition: var(--transition-base);
//       .cat-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cat-color); opacity: 0.5; transition: var(--transition-fast); }
//       .cat-count { font-size: 10px; color: var(--text-tertiary); background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 999px; padding: 0 5px; }
//       &:hover { border-color: var(--cat-color); color: var(--text-primary); .cat-dot { opacity: 1; } }
//       &.active { background: color-mix(in srgb, var(--cat-color) 10%, var(--bg-secondary) 90%); border-color: var(--cat-color); color: var(--text-primary); .cat-dot { opacity: 1; } .cat-count { background: var(--cat-color); color: #fff; border-color: var(--cat-color); } }
//     }

//     /* ═══════════════════════════════════════════════
//        GRID
//     ═══════════════════════════════════════════════ */
//     .charts-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
//       gap: var(--spacing-xl);
//       padding-bottom: var(--spacing-3xl);
//     }

//     .chart-card {
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       overflow: hidden;
//       cursor: pointer;
//       position: relative;
//       display: flex; flex-direction: column;
//       box-shadow: var(--elevation-1);
//       animation: cardIn 0.3s ease both;
//       animation-delay: var(--anim-delay, 0ms);
//       transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.22s ease, border-color 0.22s ease;

//       &:hover {
//         transform: translateY(-5px) scale(1.005);
//         box-shadow: var(--elevation-3);
//         border-color: var(--accent-primary);
//         .card-hover-overlay { opacity: 1; }
//         .expand-btn { opacity: 1; transform: scale(1); }
//       }
//     }
//     @keyframes cardIn {
//       from { opacity: 0; transform: translateY(12px); }
//       to   { opacity: 1; transform: translateY(0); }
//     }

//     .card-topbar {
//       display: flex; align-items: center; justify-content: space-between;
//       padding: var(--spacing-sm) var(--spacing-md);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//     }

//     .card-badge {
//       display: flex; align-items: center; gap: 5px;
//       font-size: 10px; font-weight: var(--font-weight-bold);
//       text-transform: uppercase; letter-spacing: 0.05em;
//       color: var(--cat-color);
//       .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cat-color); }
//     }

//     .expand-btn {
//       width: 26px; height: 26px; border-radius: var(--ui-border-radius-sm);
//       border: 1px solid var(--border-primary); background: var(--bg-primary);
//       color: var(--text-tertiary); cursor: pointer; display: flex;
//       align-items: center; justify-content: center; transition: var(--transition-fast);
//       opacity: 0; transform: scale(0.85);
//       &:hover { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
//     }

//     .card-chart-wrap {
//       flex: 1; padding: var(--spacing-md);
//       pointer-events: none; /* prevent interaction inside grid cards */
//       user-select: none;
//     }

//     /* Hover overlay */
//     .card-hover-overlay {
//       position: absolute; inset: 0;
//       background: linear-gradient(to bottom, transparent 40%, color-mix(in srgb, var(--bg-primary) 92%, var(--accent-primary) 8%) 100%);
//       opacity: 0; transition: opacity 0.2s ease;
//       display: flex; align-items: flex-end;
//     }

//     .overlay-content {
//       padding: var(--spacing-xl) var(--spacing-lg);
//       display: flex; flex-direction: column; gap: 3px;
//     }

//     .overlay-title { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
//     .overlay-desc  { font-size: var(--font-size-xs); color: var(--text-secondary); }
//     .overlay-cta {
//       display: flex; align-items: center; gap: 5px;
//       font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
//       color: var(--accent-primary); margin-top: 4px;
//     }

//     /* Empty State */
//     .empty-state {
//       grid-column: 1 / -1; padding: 80px 0; text-align: center; color: var(--text-tertiary);
//       .empty-icon { margin-bottom: var(--spacing-xl); opacity: 0.25; }
//       h3 { font-size: var(--font-size-xl); color: var(--text-secondary); margin-bottom: var(--spacing-xs); }
//       p { font-size: var(--font-size-sm); margin-bottom: var(--spacing-xl); }
//     }
//     .clear-filters-btn {
//       padding: var(--spacing-sm) var(--spacing-2xl); border: 1px solid var(--accent-primary);
//       background: transparent; color: var(--accent-primary); border-radius: var(--ui-border-radius-pill);
//       cursor: pointer; font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm);
//       transition: var(--transition-base);
//       &:hover { background: var(--accent-primary); color: #fff; }
//     }

//     /* ═══════════════════════════════════════════════
//        DIALOG BACKDROP
//     ═══════════════════════════════════════════════ */
//     .dialog-backdrop {
//       position: fixed; inset: 0; z-index: var(--z-modal-backdrop);
//       background: rgba(0, 0, 0, 0.55);
//       backdrop-filter: blur(6px);
//       -webkit-backdrop-filter: blur(6px);
//       display: flex; align-items: center; justify-content: center;
//       padding: var(--spacing-xl);
//       animation: backdropIn 0.2s ease;

//       &.closing { animation: backdropOut 0.22s ease forwards; }
//     }
//     @keyframes backdropIn  { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes backdropOut { from { opacity: 1; } to { opacity: 0; } }

//     /* ═══════════════════════════════════════════════
//        DIALOG PANEL
//     ═══════════════════════════════════════════════ */
//     .dialog-panel {
//       width: 100%; max-width: 1000px; max-height: 90vh;
//       background: var(--bg-primary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       box-shadow: var(--elevation-3), 0 0 0 1px color-mix(in srgb, var(--accent-primary) 15%, transparent 85%);
//       display: flex; flex-direction: column;
//       overflow: hidden;
//       animation: panelIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);

//       &.closing { animation: panelOut 0.22s cubic-bezier(0.7, 0, 1, 0.6) forwards; }
//     }
//     @keyframes panelIn  { from { opacity: 0; transform: scale(0.93) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
//     @keyframes panelOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.94) translateY(8px); } }

//     /* Dialog Header */
//     .dialog-header {
//       display: flex; align-items: center; justify-content: space-between;
//       gap: var(--spacing-md); padding: var(--spacing-lg) var(--spacing-xl);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-secondary); flex-shrink: 0;
//     }

//     .dialog-title-group { display: flex; align-items: center; gap: var(--spacing-md); }

//     .dialog-badge {
//       display: flex; align-items: center; gap: 5px; flex-shrink: 0;
//       font-size: 10px; font-weight: var(--font-weight-bold); text-transform: uppercase;
//       letter-spacing: 0.06em; color: var(--cat-color);
//       background: color-mix(in srgb, var(--cat-color) 10%, transparent 90%);
//       border: 1px solid color-mix(in srgb, var(--cat-color) 25%, transparent 75%);
//       border-radius: var(--ui-border-radius-pill); padding: 3px 10px 3px 7px;
//       .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cat-color); }
//     }

//     .dialog-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }
//     .dialog-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

//     .dialog-controls { display: flex; align-items: center; gap: var(--spacing-xs); flex-shrink: 0; }

//     .nav-btn {
//       width: 32px; height: 32px; border-radius: var(--ui-border-radius-sm);
//       border: 1px solid var(--border-primary); background: var(--bg-primary);
//       color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
//       transition: var(--transition-fast);
//       &:hover:not(:disabled) { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
//       &:disabled { opacity: 0.35; cursor: not-allowed; }
//     }

//     .nav-counter {
//       font-size: var(--font-size-xs); color: var(--text-tertiary);
//       font-weight: var(--font-weight-medium); padding: 0 var(--spacing-xs); white-space: nowrap;
//     }

//     .dialog-sep { width: 1px; height: 24px; background: var(--border-primary); margin: 0 var(--spacing-xs); }

//     .close-btn {
//       width: 32px; height: 32px; border-radius: var(--ui-border-radius-sm);
//       border: 1px solid var(--border-primary); background: var(--bg-primary);
//       color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
//       transition: var(--transition-fast);
//       &:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); }
//     }

//     /* Keyboard hints */
//     .kbd-hints {
//       display: flex; gap: var(--spacing-lg); padding: var(--spacing-xs) var(--spacing-xl);
//       background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);
//       flex-shrink: 0;
//     }
//     .kbd-hint {
//       display: flex; align-items: center; gap: 5px;
//       font-size: 10px; color: var(--text-tertiary);
//     }
//     kbd {
//       display: inline-flex; align-items: center; justify-content: center;
//       padding: 1px 5px; background: var(--bg-primary); border: 1px solid var(--border-primary);
//       border-bottom-width: 2px; border-radius: 4px; font-family: var(--font-mono);
//       font-size: 9px; color: var(--text-secondary); line-height: 1.4;
//     }

//     /* Dialog Body */
//     .dialog-body {
//       flex: 1; overflow-y: auto; padding: var(--spacing-xl);
//       scroll-behavior: smooth;
//       scrollbar-width: thin;
//       scrollbar-color: var(--scroll-thumb-c, var(--border-primary)) transparent;
//       &::-webkit-scrollbar { width: 5px; }
//       &::-webkit-scrollbar-track { background: transparent; }
//       &::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 999px; }
//     }

//     /* Dialog Footer - Sibling chips */
//     .dialog-footer {
//       border-top: 1px solid var(--border-primary);
//       padding: var(--spacing-md) var(--spacing-xl);
//       background: var(--bg-secondary); flex-shrink: 0;
//       overflow-x: auto;
//       scrollbar-width: none;
//       &::-webkit-scrollbar { display: none; }
//     }

//     .sibling-chips { display: flex; gap: var(--spacing-xs); align-items: center; width: max-content; }

//     .sibling-chip {
//       display: flex; align-items: center; gap: 5px;
//       padding: 4px 12px 4px 8px; border-radius: var(--ui-border-radius-pill);
//       border: 1px solid var(--border-primary); background: var(--bg-primary);
//       color: var(--text-tertiary); font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium); cursor: pointer; white-space: nowrap;
//       transition: var(--transition-fast);
//       .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cat-color); flex-shrink: 0; }
//       &:hover { border-color: var(--cat-color); color: var(--text-primary); }
//       &.active { background: color-mix(in srgb, var(--cat-color) 10%, var(--bg-primary) 90%); border-color: var(--cat-color); color: var(--text-primary); font-weight: var(--font-weight-semibold); }
//     }

//     /* ═══════════════════════════════════════════════
//        RESPONSIVE
//     ═══════════════════════════════════════════════ */
//     @media (max-width: 1024px) {
//       .charts-grid { grid-template-columns: 1fr; }
//       .header-main { flex-direction: column; align-items: flex-start; }
//       .search-box { width: 100%; }
//     }

//     @media (max-width: 640px) {
//       .analysis-hub { padding: var(--spacing-md); }
//       .dialog-panel { max-height: 95vh; border-radius: var(--ui-border-radius-lg); }
//       .dialog-body { padding: var(--spacing-md); }
//       .kbd-hints { display: none; }
//     }
//   `]
// })
// export class AdminChartsAnalysisComponent {
//   searchQuery = '';
//   activeCategory = signal('All');
//   viewMode = signal('grid');
//   isRefreshing = false;
//   isClosing = false;

//   previewChart = signal<ChartMeta | null>(null);

//   categories = ['All', 'Finance', 'Sales', 'Customer', 'Operations', 'Inventory'];

//   charts: ChartMeta[] = [
//     { title: 'AOV Trend',            id: 'aov',        category: 'Sales',      description: 'Avg Order Value vs quantity trends',    icon: '', component: AovTrendChartComponent },
//     { title: 'Branch Radar',         id: 'radar',       category: 'Operations', description: 'Cross-branch performance comparison',   icon: '', component: BranchRadarChartComponent },
//     { title: 'Customer Acquisition', id: 'acquisition', category: 'Customer',   description: 'New customer growth over time',         icon: '', component: CustomerAcquisitionChartComponent },
//     { title: 'EMI Portfolio',        id: 'emi',         category: 'Finance',    description: 'Loan health and repayment analysis',    icon: '', component: EmiPortfolioChartComponent },
//     { title: 'Financial Trend',      id: 'financial',   category: 'Finance',    description: 'Revenue and expense tracking',          icon: '', component: FinancialTrendChartComponent },
//     { title: 'Gross Profit',         id: 'gp',          category: 'Finance',    description: 'Monthly profit margin analysis',        icon: '', component: GrossProfitTrendChartComponent },
//     { title: 'Performance Heatmap',  id: 'heatmap',     category: 'Operations', description: 'Hourly activity distribution by day',  icon: '', component: HeatmapChartComponent },
//     { title: 'Inventory Health',     id: 'inventory',   category: 'Inventory',  description: 'Stock levels and critical items',       icon: '', component: InventoryHealthChartComponent },
//     { title: 'Order Funnel',         id: 'funnel',      category: 'Sales',      description: 'Conversion tracking through stages',   icon: '', component: OrderFunnelChartComponent },
//     { title: 'Payment Mix',          id: 'payment',     category: 'Finance',    description: 'Breakdown of transaction modes',        icon: '', component: PaymentMethodsChartComponent },
//     { title: 'Purchase vs Sales',    id: 'pvs',         category: 'Finance',    description: 'Procurement vs revenue balance',        icon: '', component: PurchaseVsSalesChartComponent },
//     { title: 'Sales Distribution',   id: 'dist',        category: 'Sales',      description: 'Regional and category sales mix',       icon: '', component: SalesDistributionChartComponent },
//     { title: 'Return Rate',          id: 'return',      category: 'Sales',      description: 'Refunds and item returns analysis',     icon: '', component: SalesReturnRateChartComponent },
//     { title: 'Top Performers',       id: 'performers',  category: 'Sales',      description: 'Best selling products and branches',   icon: '', component: TopPerformersChartComponent },
//     { title: 'YoY Growth',           id: 'growth',      category: 'Finance',    description: 'Year-over-year expansion metrics',      icon: '', component: YoyGrowthChartComponent },
//     { title: 'Customer Outstanding', id: 'outstanding', category: 'Customer',   description: 'Top credit exposure by balance',        icon: '', component: CustomerOutstandingChartComponent }
//   ];

//   filteredCharts = computed(() => {
//     const q = this.searchQuery.toLowerCase();
//     const cat = this.activeCategory();
//     return this.charts.filter(c => {
//       const matchSearch = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
//       const matchCat = cat === 'All' || c.category === cat;
//       return matchSearch && matchCat;
//     });
//   });

//   currentChartIndex = computed(() => {
//     const pc = this.previewChart();
//     if (!pc) return 0;
//     return this.filteredCharts().findIndex(c => c.id === pc.id);
//   });

//   getCatColor(cat: string): string {
//     return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['All'];
//   }

//   getCatCount(cat: string): number {
//     if (cat === 'All') return this.charts.length;
//     return this.charts.filter(c => c.category === cat).length;
//   }

//   openPreview(chart: ChartMeta): void {
//     this.isClosing = false;
//     this.previewChart.set(chart);
//     document.body.style.overflow = 'hidden';
//   }

//   closePreview(): void {
//     this.isClosing = true;
//     setTimeout(() => {
//       this.previewChart.set(null);
//       this.isClosing = false;
//       document.body.style.overflow = '';
//     }, 220);
//   }

//   navigateChart(dir: -1 | 1): void {
//     const charts = this.filteredCharts();
//     const idx = this.currentChartIndex();
//     const next = idx + dir;
//     if (next >= 0 && next < charts.length) {
//       this.previewChart.set(charts[next]);
//     }
//   }

//   @HostListener('document:keydown', ['$event'])
//   onKeyDown(e: KeyboardEvent): void {
//     if (!this.previewChart()) return;
//     if (e.key === 'Escape') { this.closePreview(); return; }
//     if (e.key === 'ArrowRight') { this.navigateChart(1); return; }
//     if (e.key === 'ArrowLeft') { this.navigateChart(-1); return; }
//   }

//   refreshAllCharts(): void {
//     this.isRefreshing = true;
//     setTimeout(() => { this.isRefreshing = false; }, 1500);
//   }

//   clearFilters(): void {
//     this.searchQuery = '';
//     this.activeCategory.set('All');
//   }
// }

// import { Component, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TooltipModule } from 'primeng/tooltip';

// // Chart Component Imports
// import { AovTrendChartComponent } from './charts/aov-trend-chart.component';
// import { BranchRadarChartComponent } from './charts/branch-radar-chart.component';
// import { CustomerAcquisitionChartComponent } from './charts/customer-acquisition-chart.component';
// import { EmiPortfolioChartComponent } from './charts/emi-portfolio-chart.component';
// import { FinancialTrendChartComponent } from './charts/financial-trend-chart.component';
// import { GrossProfitTrendChartComponent } from './charts/gross-profit-trend-chart.component';
// import { HeatmapChartComponent } from './charts/heatmap-chart.component';
// import { InventoryHealthChartComponent } from './charts/inventory-health-chart.component';
// import { OrderFunnelChartComponent } from './charts/order-funnel-chart.component';
// import { PaymentMethodsChartComponent } from './charts/payment-methods-chart.component';
// import { PurchaseVsSalesChartComponent } from './charts/purchase-vs-sales-chart.component';
// import { SalesDistributionChartComponent } from './charts/sales-distribution-chart.component';
// import { SalesReturnRateChartComponent } from './charts/sales-return-rate-chart.component';
// import { TopPerformersChartComponent } from './charts/top-performers-chart.component';
// import { YoyGrowthChartComponent } from './charts/yoy-growth-chart.component';

// interface ChartMeta {
//   id: string;
//   title: string;
//   component: any;
//   category: string;
//   description: string;
// }

// @Component({
//   selector: 'app-admin-charts-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule, TooltipModule
//   ],
//   template: `
//     <div class="analysis-hub">
//       <header class="hub-header">
//         <div class="header-main">
//           <div class="header-title">
//             <h1>Charts Analysis</h1>
//             <p>Comprehensive overview of all system analytics</p>
//           </div>
          
//           <div class="header-actions">
//             <div class="search-box">
//               <i class="pi pi-search"></i>
//               <input type="text" [(ngModel)]="searchQuery" placeholder="Find a chart (e.g. Sales, AOV...)" />
//             </div>
            
//             <button class="refresh-btn" (click)="refreshAllCharts()" pTooltip="Refresh All Data" tooltipPosition="bottom">
//               <i class="pi pi-refresh" [class.pi-spin]="isRefreshing"></i>
//             </button>
//           </div>
//         </div>

//         <div class="category-filters">
//           @for (cat of categories; track cat) {
//             <button 
//               class="cat-chip" 
//               [class.active]="activeCategory() === cat"
//               (click)="activeCategory.set(cat)">
//               {{ cat }}
//             </button>
//           }
//         </div>
//       </header>

//       <!-- Charts Grid -->
//       <div class="charts-grid" [class.list-view]="viewMode() === 'list'">
//         @for (chart of filteredCharts(); track chart.id) {
//           <div class="chart-container">
//             <div class="chart-meta">
//               <span class="chart-tag">{{ chart.category }}</span>
//               <p class="chart-info">{{ chart.description }}</p>
//             </div>
//             <ng-container [ngComponentOutlet]="chart.component"></ng-container>
//           </div>
//         } @empty {
//           <div class="empty-results">
//             <i class="pi pi-search-minus"></i>
//             <h3>No charts found</h3>
//             <p>Try adjusting your search or category filters</p>
//             <button class="clear-btn" (click)="clearFilters()">Clear Filters</button>
//           </div>
//         }
//       </div>
//     </div>
//   `,
//   styles: [`
//     :host {
//       display: block;
//       height: 100%;
//       background: var(--bg-secondary);
//     }

//     .analysis-hub {
//       padding: var(--spacing-xl);
//       max-width: 1600px;
//       margin: 0 auto;
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xl);
//     }

//     /* Header Styling */
//     .hub-header {
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-xl);
//       box-shadow: var(--elevation-1);
//     }

//     .header-main {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       gap: var(--spacing-xl);
//       margin-bottom: var(--spacing-xl);
//       flex-wrap: wrap;
//     }

//     .header-title {
//       h1 {
//         font-size: var(--font-size-2xl);
//         font-weight: var(--font-weight-bold);
//         color: var(--text-primary);
//         margin: 0;
//       }
//       p {
//         font-size: var(--font-size-sm);
//         color: var(--text-tertiary);
//         margin: 4px 0 0;
//       }
//     }

//     .header-actions {
//       display: flex;
//       gap: var(--spacing-md);
//       align-items: center;
//     }

//     .search-box {
//       position: relative;
//       width: 320px;
      
//       i {
//         position: absolute;
//         left: 12px;
//         top: 50%;
//         transform: translateY(-50%);
//         color: var(--text-tertiary);
//         font-size: var(--font-size-sm);
//       }

//       input {
//         width: 100%;
//         padding: 10px 12px 10px 36px;
//         border: var(--ui-border-width) solid var(--border-primary);
//         border-radius: var(--ui-border-radius-pill);
//         background: var(--bg-secondary);
//         color: var(--text-primary);
//         font-size: var(--font-size-sm);
//         transition: var(--transition-base);

//         &:focus {
//           outline: none;
//           border-color: var(--accent-primary);
//           box-shadow: 0 0 0 2px var(--accent-focus);
//           background: var(--bg-primary);
//         }
//       }
//     }

//     .refresh-btn {
//       width: 40px;
//       height: 40px;
//       border-radius: 50%;
//       border: var(--ui-border-width) solid var(--border-primary);
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//       cursor: pointer;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: var(--transition-base);

//       &:hover {
//         background: var(--accent-focus);
//         color: var(--accent-primary);
//         border-color: var(--accent-primary);
//       }
//     }

//     .category-filters {
//       display: flex;
//       gap: var(--spacing-xs);
//       flex-wrap: wrap;
//     }

//     .cat-chip {
//       padding: var(--spacing-xs) var(--spacing-lg);
//       border-radius: var(--ui-border-radius-pill);
//       border: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium);
//       cursor: pointer;
//       transition: var(--transition-base);

//       &:hover {
//         background: var(--component-bg-hover);
//         color: var(--text-primary);
//       }

//       &.active {
//         background: var(--accent-primary);
//         color: #fff;
//         border-color: var(--accent-primary);
//       }
//     }

//     /* Grid Styling */
//     .charts-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
//       gap: var(--spacing-xl);
//       padding-bottom: var(--spacing-3xl);
//     }

//     .chart-container {
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       box-shadow: var(--elevation-1);
//       transition: transform var(--transition-base), box-shadow var(--transition-base);
//       position: relative;
//       display: flex;
//       flex-direction: column;

//       &:hover {
//         transform: translateY(-4px);
//         box-shadow: var(--elevation-3);
//       }
//     }

//     .chart-meta {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-md);
      
//       .chart-tag {
//         font-size: 10px;
//         font-weight: var(--font-weight-bold);
//         text-transform: uppercase;
//         letter-spacing: 0.05em;
//         color: var(--accent-primary);
//         background: var(--accent-focus);
//         padding: 2px 8px;
//         border-radius: 4px;
//       }

//       .chart-info {
//         font-size: var(--font-size-xs);
//         color: var(--text-tertiary);
//         margin: 0;
//         max-width: 70%;
//         text-align: right;
//       }
//     }

//     .empty-results {
//       grid-column: 1 / -1;
//       padding: 100px 0;
//       text-align: center;
//       color: var(--text-tertiary);

//       i { font-size: 64px; opacity: 0.2; margin-bottom: var(--spacing-xl); display: block; }
//       h3 { font-size: var(--font-size-xl); color: var(--text-secondary); margin-bottom: var(--spacing-sm); }
//       p { font-size: var(--font-size-sm); margin-bottom: var(--spacing-xl); }

//       .clear-btn {
//         padding: var(--spacing-sm) var(--spacing-xl);
//         border: 1px solid var(--accent-primary);
//         background: transparent;
//         color: var(--accent-primary);
//         border-radius: var(--ui-border-radius-pill);
//         cursor: pointer;
//         font-weight: var(--font-weight-semibold);
//         transition: var(--transition-base);

//         &:hover {
//           background: var(--accent-primary);
//           color: #fff;
//         }
//       }
//     }

//     /* Responsive Adjustments */
//     @media (max-width: 1024px) {
//       .charts-grid { grid-template-columns: 1fr; }
//       .header-main { flex-direction: column; align-items: flex-start; }
//       .search-box { width: 100%; }
//     }
//   `]
// })
// export class AdminChartsAnalysisComponent {
//   searchQuery = '';
//   activeCategory = signal('All');
//   viewMode = signal('grid');
//   isRefreshing = false;

//   categories = ['All', 'Finance', 'Sales', 'Customer', 'Operations', 'Inventory'];

//   charts: ChartMeta[] = [
//     { title: 'AOV Trend', id: 'aov', category: 'Sales', description: 'Avg Order Value vs Quantity', component: AovTrendChartComponent },
//     { title: 'Branch Radar', id: 'radar', category: 'Operations', description: 'Cross-branch performance comparison', component: BranchRadarChartComponent },
//     { title: 'Customer Acquisition', id: 'acquisition', category: 'Customer', description: 'New customer growth trends', component: CustomerAcquisitionChartComponent },
//     { title: 'EMI Portfolio', id: 'emi', category: 'Finance', description: 'Loan health and repayment analysis', component: EmiPortfolioChartComponent },
//     { title: 'Financial Trend', id: 'financial', category: 'Finance', description: 'Revenue and expense tracking', component: FinancialTrendChartComponent },
//     { title: 'Gross Profit', id: 'gp', category: 'Finance', description: 'Monthly profit margin analysis', component: GrossProfitTrendChartComponent },
//     { title: 'Performance Heatmap', id: 'heatmap', category: 'Operations', description: 'Relative performance distribution', component: HeatmapChartComponent },
//     { title: 'Inventory Health', id: 'inventory', category: 'Inventory', description: 'Stock levels and turnover rate', component: InventoryHealthChartComponent },
//     { title: 'Order Funnel', id: 'funnel', category: 'Sales', description: 'Conversion tracking through stages', component: OrderFunnelChartComponent },
//     { title: 'Payment Mix', id: 'payment', category: 'Finance', description: 'Breakdown of transaction modes', component: PaymentMethodsChartComponent },
//     { title: 'Purchase vs Sales', id: 'pvs', category: 'Finance', description: 'Procurement vs revenue balance', component: PurchaseVsSalesChartComponent },
//     { title: 'Sales Distribution', id: 'dist', category: 'Sales', description: 'Regional and category sales mix', component: SalesDistributionChartComponent },
//     { title: 'Return Rate', id: 'return', category: 'Sales', description: 'Refunds and items return analysis', component: SalesReturnRateChartComponent },
//     { title: 'Top Performers', id: 'performers', category: 'Sales', description: 'Best selling products and branches', component: TopPerformersChartComponent },
//     { title: 'YoY Growth', id: 'growth', category: 'Finance', description: 'Year-over-year expansion metrics', component: YoyGrowthChartComponent }
//   ];

//   filteredCharts = computed(() => {
//     const q = this.searchQuery.toLowerCase();
//     const cat = this.activeCategory();

//     return this.charts.filter(c => {
//       const matchSearch = c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
//       const matchCat = cat === 'All' || c.category === cat;
//       return matchSearch && matchCat;
//     });
//   });

//   refreshAllCharts() {
//     this.isRefreshing = true;
//     // Simulate a global refresh trigger
//     setTimeout(() => {
//       this.isRefreshing = false;
//       // In a real app, we'd trigger a reload event via a shared service
//     }, 1500);
//   }

//   clearFilters() {
//     this.searchQuery = '';
//     this.activeCategory.set('All');
//   }
// }
