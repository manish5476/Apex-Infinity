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

// Mapped perfectly to your semantic theme tokens
const CATEGORY_META: Record<string, { color: string; icon: string }> = {
  Finance:    { color: 'var(--color-info, #3b82f6)', icon: 'pi pi-wallet' },
  Sales:      { color: 'var(--color-success, #10b981)', icon: 'pi pi-shopping-cart' },
  Customer:   { color: 'var(--color-warning, #f59e0b)', icon: 'pi pi-users' },
  Operations: { color: 'var(--color-primary, #6366f1)', icon: 'pi pi-cog' },
  Inventory:  { color: 'var(--color-error, #ef4444)', icon: 'pi pi-box' },
  All:        { color: 'var(--text-primary, #0f172a)', icon: 'pi pi-th-large' },
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

      <!-- ════════ COMMAND CENTER ════════ -->
      <div class="unified-control-panel">
        
        <div class="ucp-header">
          <div class="header-left">
            <div class="header-icon-wrap">
              <i class="pi pi-chart-bar"></i>
            </div>
            <div class="hub-title-block">
              <h1 class="page-title">Charts & Analysis</h1>
              <p class="page-meta">
                Interactive Visualizations
                <span class="meta-divider">·</span>
                Showing <span class="mono count-highlight">{{ filteredCharts().length }}</span> of {{ charts.length }}
              </p>
            </div>
          </div>

          <div class="header-right">
            <div class="search-wrap" [class.focused]="searchFocused()">
              <i class="pi pi-search search-icon"></i>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search metrics..."
                (focus)="searchFocused.set(true)"
                (blur)="searchFocused.set(false)" />
              @if (searchQuery()) {
                <button class="search-clear" (click)="searchQuery.set('')">
                  <i class="pi pi-times"></i>
                </button>
              }
            </div>

            <button class="action-btn" [class.spinning]="isRefreshing()"
              (click)="refreshAllCharts()"
              pTooltip="Sync Data" tooltipPosition="bottom">
              <i class="pi pi-sync"></i>
            </button>
          </div>
        </div>

        <!-- ════════ CATEGORY SEGMENTS ════════ -->
        <div class="ucp-filters">
          <div class="filter-track">
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
        </div>
      </div>

      <!-- ════════ 2-COLUMN CHART GRID ════════ -->
      <div class="charts-grid">
        @for (chart of filteredCharts(); track chart.id; let i = $index) {
          
          <div
            class="chart-card"
            [style.--delay]="(i * 35) + 'ms'"
            [style.--cc]="getCatColor(chart.category)"
            (click)="openPreview(chart)">

            <div class="card-header">
              <div class="card-title-stack">
                <span class="card-cat-badge" [style.color]="getCatColor(chart.category)">
                  <span class="cat-dot" [style.background]="getCatColor(chart.category)"></span>
                  {{ chart.category }}
                </span>
                <h3 class="card-title">{{ chart.title }}</h3>
              </div>
              
              <button class="card-expand-btn"
                (click)="$event.stopPropagation(); openPreview(chart)"
                pTooltip="Expand" tooltipPosition="left">
                <i class="pi pi-expand"></i>
              </button>
            </div>

            <!-- Chart Body with Contrast Background -->
            <div class="card-body">
              <div class="chart-aspect-ratio-wrapper">
                <ng-container [ngComponentOutlet]="chart.component"></ng-container>
              </div>
            </div>

            <div class="card-footer">
              <p class="card-desc">{{ chart.description }}</p>
              <div class="card-arrow-wrap">
                <i class="pi pi-arrow-right card-arrow"></i>
              </div>
            </div>

            <div class="card-glow"></div>
          </div>
        }

        @empty {
          <div class="empty-state">
            <div class="empty-glyph">
              <i class="pi pi-chart-line"></i>
            </div>
            <h3>No visualizations found</h3>
            <p>Try adjusting your search criteria or category filter.</p>
            <button class="btn-ghost" (click)="clearFilters()">
              <i class="pi pi-filter-slash"></i> Clear Filters
            </button>
          </div>
        }
      </div>
    </div>

    <!-- ════════ IMMERSIVE 95x90 LIGHTBOX ════════ -->
    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [modal]="true"
      [dismissableMask]="true"
      [closeOnEscape]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '95vw', height: '90vh' }"
      [contentStyle]="{ padding: '0', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }"
      [showHeader]="false"
      styleClass="premium-lightbox"
      (onHide)="onDialogHide()">

      @if (previewChart()) {
        <div class="dlg-root">

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

              <div class="kbd-row">
                <span class="kbd-hint"><kbd>←</kbd><kbd>→</kbd> Navigate</span>
                <span class="kbd-hint"><kbd>Esc</kbd> Close</span>
              </div>

              <div class="dlg-sep"></div>

              <button class="close-btn" (click)="dialogVisible.set(false)"
                pTooltip="Exit Fullscreen" tooltipPosition="bottom">
                <i class="pi pi-times"></i>
              </button>
            </div>
          </div>

          <!-- Dialog Chart Area perfectly scales to remaining height -->
          <div class="dlg-body">
            <div class="dlg-chart-wrapper">
              <ng-container [ngComponentOutlet]="previewChart()!.component"></ng-container>
            </div>
          </div>

          <!-- Thumbnail Strip -->
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
    /* ══════════════════════════════════════════════════════════
       ADMIN CHARTS DASHBOARD v2.0 - TOKENS ONLY
    ══════════════════════════════════════════════════════════ */
    :host { 
      display: block; 
      background: var(--bg-secondary); 
      min-height: 100%; 
    }

    .analysis-hub {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
      padding: var(--spacing-2xl);
      max-width: 1800px;
      margin: 0 auto;
    }

    /* ── UNIFIED CONTROL PANEL ─────────────────────────────── */
    .unified-control-panel {
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .ucp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-lg);
      padding: var(--spacing-xl);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .header-icon-wrap {
      width: 40px;
      height: 40px;
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
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
    }

    .page-meta {
      display: flex;
      align-items: center;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-tertiary);
      margin: var(--spacing-xs) 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .meta-divider {
      margin: 0 var(--spacing-sm);
      color: var(--border-primary);
    }

    .mono { font-family: var(--font-mono); letter-spacing: 0; text-transform: none; }
    .count-highlight { color: var(--accent-primary); font-weight: var(--font-weight-bold); }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    /* Search */
    .search-wrap {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-pill);
      padding: 0 var(--spacing-md);
      width: 300px;
      height: 40px;
      transition: var(--transition-base);

      &.focused {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 var(--focus-ring-width) color-mix(in srgb, var(--accent-primary) 15%, transparent);
        background: var(--bg-primary);
      }

      .search-icon {
        font-size: var(--font-size-sm);
        color: var(--text-tertiary);
        flex-shrink: 0;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        padding: var(--spacing-xs) 0;
        font-family: var(--font-body);
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        &::placeholder { color: var(--text-tertiary); }
      }

      .search-clear {
        width: 20px; height: 20px;
        border-radius: 50%;
        border: var(--ui-border-width) solid var(--border-primary);
        background: var(--bg-primary);
        color: var(--text-tertiary);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        font-size: 10px;
        transition: var(--transition-fast);
        flex-shrink: 0;
        &:hover { color: var(--color-error); border-color: var(--color-error); }
      }
    }

    /* Icon button */
    .action-btn {
      width: 40px; height: 40px;
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: var(--font-size-md);
      transition: var(--transition-base);
      &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
      &.spinning i { animation: spin 0.9s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Category Filter Segment Control */
    .ucp-filters {
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--bg-primary);
    }

    .filter-track {
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid transparent;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      transition: var(--transition-fast);

      .cat-icon { font-size: var(--font-size-xs); opacity: 0.7; }

      .pill-count {
        font-size: 10px;
        background: var(--bg-primary);
        border: var(--ui-border-width) solid var(--border-secondary);
        color: var(--text-tertiary);
        padding: 0 var(--spacing-sm);
        border-radius: 99px;
        line-height: 1.6;
        transition: var(--transition-fast);
        font-family: var(--font-mono);
      }

      &:hover {
        background: color-mix(in srgb, var(--cc) 6%, var(--bg-secondary));
        color: var(--text-primary);
      }

      &.active {
        background: color-mix(in srgb, var(--cc) 12%, var(--bg-primary) 88%);
        border-color: color-mix(in srgb, var(--cc) 30%, transparent);
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

    /* ── 2-COLUMN CHART GRID ─────────────────────────────── */
    .charts-grid {
      display: grid;
      /* Exactly 2 charts per row on large screens */
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-2xl);
    }

    /* ── CHART CARD ────────────────────────────────────── */
    .chart-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      animation: cardReveal 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) both;
      animation-delay: var(--delay, 0ms);
      transition: var(--transition-slow);
      overflow: hidden;

      &:hover {
        transform: translateY(-4px);
        border-color: color-mix(in srgb, var(--cc) 50%, var(--border-primary));
        /* Dynamic Theme-Aware Shadow */
        box-shadow: 0 16px 32px -12px color-mix(in srgb, var(--cc) 30%, rgba(0,0,0,0.15));

        .card-expand-btn { opacity: 1; transform: scale(1); }
        .card-arrow { opacity: 1; transform: translateX(0); color: var(--cc); }
        .card-arrow-wrap { 
          background: color-mix(in srgb, var(--cc) 10%, var(--bg-secondary)); 
          border-color: color-mix(in srgb, var(--cc) 30%, transparent); 
        }
        .card-glow { opacity: 1; }
      }
    }

    @keyframes cardReveal {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Top glowing accent */
    .card-glow {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--cc);
      opacity: 0;
      transition: opacity var(--transition-base);
    }

    /* Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--spacing-xl);
      z-index: 1;
    }

    .card-title-stack {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .card-cat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .cat-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .card-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: var(--line-height-tight);
    }

    /* Expand Button */
    .card-expand-btn {
      width: 32px; height: 32px;
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-primary);
      color: var(--text-tertiary);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      font-size: var(--font-size-xs);
      transition: var(--transition-base);
      opacity: 0;
      transform: scale(0.9);
      box-shadow: var(--shadow-sm);
      
      &:hover { 
        background: var(--cc); 
        color: #fff; 
        border-color: var(--cc); 
        transform: scale(1.05);
      }
    }

    /* Chart Area - Styled as a distinct inset panel */
    .card-body {
      flex: 1;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      pointer-events: none;
      user-select: none;
      background: var(--bg-secondary);
      border-top: var(--ui-border-width) solid var(--border-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      padding: var(--spacing-xl);
      z-index: 1;
    }

    .chart-aspect-ratio-wrapper {
      width: 100%;
      min-height: 320px; /* Generous height for 2-column layout */
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Footer */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-xl);
      background: var(--bg-primary);
      z-index: 1;
    }

    .card-desc {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
      line-height: var(--line-height-relaxed);
      flex: 1;
    }

    .card-arrow-wrap {
      width: 28px; height: 28px;
      border-radius: var(--ui-border-radius-pill);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-secondary);
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition-base);
      flex-shrink: 0;
    }

    .card-arrow {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      opacity: 0.5;
      transform: translateX(-2px);
      transition: var(--transition-fast);
    }

    /* ── EMPTY STATE ───────────────────────────────────── */
    .empty-state {
      grid-column: 1 / -1;
      padding: 120px 0;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
      background: var(--bg-primary);
      border: 2px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius-xl);
    }

    .empty-glyph {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px;
      color: var(--text-tertiary);
      opacity: 0.5;
    }

    .empty-state h3 { font-family: var(--font-heading); font-size: var(--font-size-xl); color: var(--text-primary); margin: 0; }
    .empty-state p { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-xl); 
      border: var(--ui-border-width) solid var(--accent-primary);
      background: transparent; color: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-sm); font-weight: var(--font-weight-bold);
      cursor: pointer; transition: var(--transition-base);
      &:hover { background: var(--accent-primary); color: #fff; }
    }

    /* ── IMMERSIVE DIALOG / LIGHTBOX ───────────────────── */
    ::ng-deep .premium-lightbox {
      border-radius: var(--ui-border-radius-xl) !important;
      overflow: hidden;
      box-shadow: var(--shadow-3xl) !important;
      border: var(--ui-border-width) solid var(--border-primary) !important;
    }

    .dlg-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: var(--bg-primary);
    }

    /* Dialog Header */
    .dlg-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-2xl);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      background: var(--bg-primary);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .dlg-header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      min-width: 0;
    }

    .dlg-cat-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid transparent;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      flex-shrink: 0;
      i { font-size: var(--font-size-xs); }
    }

    .dlg-title-block { min-width: 0; }

    .dlg-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
      line-height: var(--line-height-tight);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dlg-desc {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
      margin: 4px 0 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dlg-header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      flex-shrink: 0;
    }

    /* Prev/Next Navigation */
    .nav-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
      padding: var(--spacing-xs);
    }

    .nav-btn {
      width: 36px; height: 36px;
      border-radius: var(--ui-border-radius-xs);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-md);
      transition: var(--transition-fast);
      &:hover:not(:disabled) { background: var(--accent-focus); color: var(--accent-primary); }
      &:disabled { opacity: 0.3; cursor: not-allowed; }
    }

    .nav-label {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-semibold);
      padding: 0 var(--spacing-md);
      white-space: nowrap;
      font-family: var(--font-mono);
    }

    .dlg-sep {
      width: 1px;
      height: 32px;
      background: var(--border-secondary);
      flex-shrink: 0;
    }

    .kbd-row { display: flex; align-items: center; gap: var(--spacing-md); }
    .kbd-hint { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-medium);}
    
    kbd {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px 6px; background: var(--bg-secondary); border: var(--ui-border-width) solid var(--border-primary);
      border-bottom-width: 2px; border-radius: var(--ui-border-radius-sm); font-size: 10px; font-family: var(--font-mono);
      color: var(--text-secondary); line-height: 1.5; font-weight: bold;
    }

    .close-btn {
      width: 44px; height: 44px;
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-md);
      transition: var(--transition-fast);
      &:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); }
    }

    /* Dialog Body - Flexible area for the Chart */
    .dlg-body {
      flex: 1;
      padding: var(--spacing-2xl);
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .dlg-chart-wrapper {
      flex: 1;
      border: var(--ui-border-width) solid var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-2xl);
      background: var(--bg-primary);
      box-shadow: var(--shadow-sm);
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Dialog Footer Thumbnails */
    .dlg-footer {
      flex-shrink: 0;
      border-top: var(--ui-border-width) solid var(--border-secondary);
      background: var(--bg-primary);
      padding: var(--spacing-lg) var(--spacing-2xl);
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .dlg-thumbs {
      display: flex;
      gap: var(--spacing-sm);
      width: max-content;
      align-items: center;
    }

    .thumb-chip {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--ui-border-radius-pill);
      border: var(--ui-border-width) solid var(--border-primary);
      background: var(--bg-secondary);
      color: var(--text-tertiary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition-fast);

      .thumb-dot {
        width: 8px; height: 8px;
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
        font-weight: var(--font-weight-bold);
        .thumb-dot { opacity: 1; box-shadow: 0 0 6px var(--cc); }
      }
    }

    /* ── RESPONSIVE ────────────────────────────────────── */
    @media (max-width: 1280px) {
      .charts-grid { grid-template-columns: 1fr; } /* Stack on smaller screens */
    }
    @media (max-width: 768px) {
      .ucp-header { flex-direction: column; align-items: flex-start; }
      .search-wrap { width: 100%; }
      .kbd-row { display: none; }
      .dlg-header { padding: var(--spacing-md); }
      .dlg-body { padding: var(--spacing-md); }
      ::ng-deep .premium-lightbox { width: 100vw !important; height: 100vh !important; border-radius: 0 !important; }
    }
  `]
})
export class AdminChartsAnalysisComponent {

  searchQuery    = signal('');
  searchFocused  = signal(false);
  isRefreshing   = signal(false);
  dialogVisible  = signal(false);

  activeCategory = signal('All');
  previewChart   = signal<ChartMeta | null>(null);

  categories = ['All', 'Finance', 'Sales', 'Customer', 'Operations', 'Inventory'];

  charts: ChartMeta[] = [
    { title: 'AOV Trend',             id: 'aov',         category: 'Sales',      description: 'Avg Order Value vs quantity trends',     icon: '', component: AovTrendChartComponent },
    { title: 'Branch Radar',          id: 'radar',       category: 'Operations', description: 'Cross-branch performance comparison',   icon: '', component: BranchRadarChartComponent },
    { title: 'Customer Acquisition', id: 'acquisition',  category: 'Customer',   description: 'New customer growth over time',         icon: '', component: CustomerAcquisitionChartComponent },
    { title: 'EMI Portfolio',         id: 'emi',         category: 'Finance',    description: 'Loan health and repayment analysis',    icon: '', component: EmiPortfolioChartComponent },
    { title: 'Financial Trend',       id: 'financial',   category: 'Finance',    description: 'Revenue and expense tracking',          icon: '', component: FinancialTrendChartComponent },
    { title: 'Gross Profit',          id: 'gp',          category: 'Finance',    description: 'Monthly profit margin analysis',        icon: '', component: GrossProfitTrendChartComponent },
    { title: 'Performance Heatmap',  id: 'heatmap',      category: 'Operations', description: 'Hourly activity distribution by day',  icon: '', component: HeatmapChartComponent },
    { title: 'Inventory Health',      id: 'inventory',   category: 'Inventory',  description: 'Stock levels and critical items',       icon: '', component: InventoryHealthChartComponent },
    { title: 'Order Funnel',          id: 'funnel',      category: 'Sales',      description: 'Conversion tracking through stages',   icon: '', component: OrderFunnelChartComponent },
    { title: 'Payment Mix',           id: 'payment',     category: 'Finance',    description: 'Breakdown of transaction modes',        icon: '', component: PaymentMethodsChartComponent },
    { title: 'Purchase vs Sales',     id: 'pvs',         category: 'Finance',    description: 'Procurement vs revenue balance',        icon: '', component: PurchaseVsSalesChartComponent },
    { title: 'Sales Distribution',    id: 'dist',        category: 'Sales',      description: 'Regional and category sales mix',       icon: '', component: SalesDistributionChartComponent },
    { title: 'Return Rate',           id: 'return',      category: 'Sales',      description: 'Refunds and item returns analysis',     icon: '', component: SalesReturnRateChartComponent },
    { title: 'Top Performers',        id: 'performers',  category: 'Sales',      description: 'Best selling products and branches',   icon: '', component: TopPerformersChartComponent },
    { title: 'YoY Growth',            id: 'growth',      category: 'Finance',    description: 'Year-over-year expansion metrics',      icon: '', component: YoyGrowthChartComponent },
    { title: 'Customer Outstanding', id: 'outstanding',  category: 'Customer',   description: 'Top credit exposure by balance',        icon: '', component: CustomerOutstandingChartComponent },
  ];

  filteredCharts = computed(() => {
    const q   = this.searchQuery().toLowerCase();
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
    this.dialogVisible.set(true);
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
    if (!this.dialogVisible()) return;
    if (e.key === 'ArrowRight') { this.navigateChart(1);  return; }
    if (e.key === 'ArrowLeft')  { this.navigateChart(-1); return; }
  }

  refreshAllCharts(): void {
    this.isRefreshing.set(true);
    setTimeout(() => this.isRefreshing.set(false), 1500);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.activeCategory.set('All');
  }
}
// import { Component, signal, computed, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TooltipModule } from 'primeng/tooltip';
// import { DialogModule } from 'primeng/dialog';
// import { ButtonModule } from 'primeng/button';
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

// const CATEGORY_META: Record<string, { color: string; icon: string }> = {
//   Finance: { color: '#6366f1', icon: 'pi pi-wallet' },
//   Sales: { color: '#10b981', icon: 'pi pi-shopping-cart' },
//   Customer: { color: '#f59e0b', icon: 'pi pi-users' },
//   Operations: { color: '#3b82f6', icon: 'pi pi-cog' },
//   Inventory: { color: '#ef4444', icon: 'pi pi-box' },
//   All: { color: 'var(--accent-primary)', icon: 'pi pi-th-large' },
// };

// @Component({
//   selector: 'app-admin-charts-analysis',
//   standalone: true,
//   imports: [
//     CommonModule, FormsModule,
//     TooltipModule, DialogModule, ButtonModule,
//   ],
//   template: `
//     <div class="analysis-hub">

//       <div class="unified-control-panel">
        
//         <div class="ucp-header">
//           <div class="header-left">
//             <div class="header-icon-wrap">
//               <i class="pi pi-chart-bar"></i>
//             </div>
//             <div class="hub-title-block">
//               <h1 class="page-title">Charts & Analysis</h1>
//               <p class="page-meta">
//                 Interactive Visualizations
//                 <span class="meta-divider">·</span>
//                 Showing <span class="mono count-highlight">{{ filteredCharts().length }}</span> of {{ charts.length }}
//               </p>
//             </div>
//           </div>

//           <div class="header-right">
//             <div class="search-wrap" [class.focused]="searchFocused">
//               <i class="pi pi-search search-icon"></i>
//               <input
//                 type="text"
//                 [(ngModel)]="searchQuery"
//                 placeholder="Search metrics..."
//                 (focus)="searchFocused = true"
//                 (blur)="searchFocused = false" />
//               @if (searchQuery) {
//                 <button class="search-clear" (click)="searchQuery = ''">
//                   <i class="pi pi-times"></i>
//                 </button>
//               }
//             </div>

//             <button class="action-btn" [class.spinning]="isRefreshing"
//               (click)="refreshAllCharts()"
//               pTooltip="Sync Data" tooltipPosition="bottom">
//               <i class="pi pi-sync"></i>
//             </button>
//           </div>
//         </div>

//         <div class="ucp-filters">
//           <div class="filter-track">
//             @for (cat of categories; track cat) {
//               <button
//                 class="cat-pill"
//                 [class.active]="activeCategory() === cat"
//                 [style.--cc]="getCatColor(cat)"
//                 (click)="activeCategory.set(cat)">
//                 <i [class]="getCatIcon(cat)" class="cat-icon"></i>
//                 <span>{{ cat }}</span>
//                 <span class="pill-count">{{ getCatCount(cat) }}</span>
//               </button>
//             }
//           </div>
//         </div>

//       </div>

//       <div class="charts-grid">
//         @for (chart of filteredCharts(); track chart.id; let i = $index) {
          
//           <div
//             class="chart-card"
//             [style.--delay]="(i * 35) + 'ms'"
//             [style.--cc]="getCatColor(chart.category)"
//             (click)="openPreview(chart)">

//             <div class="card-header">
//               <div class="card-title-stack">
//                 <span class="card-cat-badge" [style.color]="getCatColor(chart.category)">
//                   <span class="cat-dot" [style.background]="getCatColor(chart.category)"></span>
//                   {{ chart.category }}
//                 </span>
//                 <h3 class="card-title">{{ chart.title }}</h3>
//               </div>
              
//               <button class="card-expand-btn"
//                 (click)="$event.stopPropagation(); openPreview(chart)"
//                 pTooltip="Fullscreen" tooltipPosition="left">
//                 <i class="pi pi-expand"></i>
//               </button>
//             </div>

//             <div class="card-body">
//               <ng-container [ngComponentOutlet]="chart.component"></ng-container>
//             </div>

//             <div class="card-footer">
//               <p class="card-desc">{{ chart.description }}</p>
//               <div class="card-arrow-wrap">
//                 <i class="pi pi-arrow-right card-arrow"></i>
//               </div>
//             </div>

//             <div class="card-glow"></div>
//           </div>
//         }

//         @empty {
//           <div class="empty-state">
//             <div class="empty-glyph">
//               <i class="pi pi-chart-line"></i>
//             </div>
//             <h3>No visualizations found</h3>
//             <p>Try adjusting your search criteria or category filter.</p>
//             <button class="btn-ghost" (click)="clearFilters()">
//               <i class="pi pi-filter-slash"></i> Clear Filters
//             </button>
//           </div>
//         }
//       </div>
//     </div>

//     <p-dialog
//       [(visible)]="dialogVisible"
//       [modal]="true"
//       [dismissableMask]="true"
//       [closeOnEscape]="true"
//       [draggable]="false"
//       [resizable]="false"
//       [style]="{ width: '96vw', height: '96vh' }"
//       [contentStyle]="{ padding: '0', height: '100%', overflow: 'hidden', background: 'var(--bg-primary)' }"
//       [showHeader]="false"
//       styleClass="premium-lightbox"
//       (onHide)="onDialogHide()">

//       @if (previewChart()) {
//         <div class="dlg-root">

//           <div class="dlg-header">
//             <div class="dlg-header-left">
//               <span class="dlg-cat-badge"
//                 [style.--cc]="getCatColor(previewChart()!.category)"
//                 [style.background]="'color-mix(in srgb,' + getCatColor(previewChart()!.category) + ' 12%, transparent 88%)'"
//                 [style.border-color]="'color-mix(in srgb,' + getCatColor(previewChart()!.category) + ' 28%, transparent 72%)'"
//                 [style.color]="getCatColor(previewChart()!.category)">
//                 <i [class]="getCatIcon(previewChart()!.category)"></i>
//                 {{ previewChart()!.category }}
//               </span>
//               <div class="dlg-title-block">
//                 <h2 class="dlg-title">{{ previewChart()!.title }}</h2>
//                 <p class="dlg-desc">{{ previewChart()!.description }}</p>
//               </div>
//             </div>

//             <div class="dlg-header-right">
//               <div class="nav-group">
//                 <button class="nav-btn"
//                   [disabled]="currentChartIndex() === 0"
//                   (click)="navigateChart(-1)"
//                   pTooltip="Previous" tooltipPosition="bottom">
//                   <i class="pi pi-chevron-left"></i>
//                 </button>
//                 <span class="nav-label">{{ currentChartIndex() + 1 }} / {{ filteredCharts().length }}</span>
//                 <button class="nav-btn"
//                   [disabled]="currentChartIndex() === filteredCharts().length - 1"
//                   (click)="navigateChart(1)"
//                   pTooltip="Next" tooltipPosition="bottom">
//                   <i class="pi pi-chevron-right"></i>
//                 </button>
//               </div>

//               <div class="dlg-sep"></div>

//               <div class="kbd-row">
//                 <span class="kbd-hint"><kbd>←</kbd><kbd>→</kbd> Navigate</span>
//                 <span class="kbd-hint"><kbd>Esc</kbd> Close</span>
//               </div>

//               <div class="dlg-sep"></div>

//               <button class="close-btn" (click)="dialogVisible = false"
//                 pTooltip="Exit Fullscreen" tooltipPosition="bottom">
//                 <i class="pi pi-times"></i>
//               </button>
//             </div>
//           </div>

//           <div class="dlg-body">
//             <div class="dlg-chart-wrapper">
//               <ng-container [ngComponentOutlet]="previewChart()!.component"></ng-container>
//             </div>
//           </div>

//           <div class="dlg-footer">
//             <div class="dlg-thumbs">
//               @for (c of filteredCharts(); track c.id; let i = $index) {
//                 <button
//                   class="thumb-chip"
//                   [class.active]="c.id === previewChart()!.id"
//                   [style.--cc]="getCatColor(c.category)"
//                   (click)="openPreview(c)"
//                   [pTooltip]="c.title"
//                   tooltipPosition="top">
//                   <span class="thumb-dot"></span>
//                   {{ c.title }}
//                 </button>
//               }
//             </div>
//           </div>

//         </div>
//       }
//     </p-dialog>
//   `,
//   styles: [`
//     /* ═══════════════════════════════════════
//        HOST & GLOBALS
//     ═══════════════════════════════════════ */
//     :host { 
//       display: block; 
//       background: var(--bg-secondary); 
//       min-height: 100%; 
//       --ui-border-radius-sharp: 6px; 
//       --elevation-1: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
//       --elevation-2: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
//     }

//     .analysis-hub {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-lg);
//       padding: var(--spacing-xl);
//       max-width: 1700px;
//       margin: 0 auto;
//     }

//     /* ══════════════════════════════════════════════════════════
//        UNIFIED COMMAND CENTER (Header + Filters)
//        ══════════════════════════════════════════════════════════ */
//     .unified-control-panel {
//       display: flex;
//       flex-direction: column;
//       flex-shrink: 0;
//       background: var(--bg-primary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-sharp);
//       box-shadow: var(--elevation-1);
//     }

//     .ucp-header {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       gap: var(--spacing-lg);
//       padding: var(--spacing-lg) var(--spacing-xl);
//       border-bottom: var(--ui-border-width) solid var(--border-primary);
//       flex-wrap: wrap;
//     }

//     .header-left {
//       display: flex;
//       align-items: flex-start;
//       gap: var(--spacing-md);
//     }

//     .header-icon-wrap {
//       width: 36px;
//       height: 36px;
//       border-radius: var(--ui-border-radius-sm);
//       background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
//       color: var(--accent-primary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: var(--font-size-lg);
//       flex-shrink: 0;
//       margin-top: 2px;
//     }

//     .page-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       line-height: var(--line-height-tight);
//       letter-spacing: -0.01em;
//     }

//     .page-meta {
//       display: flex;
//       align-items: center;
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium);
//       color: var(--text-tertiary);
//       margin: 4px 0 0 0;
//       text-transform: uppercase;
//       letter-spacing: 0.04em;
//     }

//     .meta-divider {
//       margin: 0 8px;
//       color: var(--border-secondary);
//     }

//     .mono { font-family: var(--font-mono); letter-spacing: 0; text-transform: none; }
//     .count-highlight { color: var(--accent-primary); font-weight: var(--font-weight-bold); }

//     .header-right {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     /* Search */
//     .search-wrap {
//       display: flex;
//       align-items: center;
//       gap: 7px;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-pill);
//       padding: 0 12px;
//       width: 260px;
//       height: 36px;
//       transition: var(--transition-base);

//       &.focused {
//         border-color: var(--accent-primary);
//         box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent);
//         background: var(--bg-primary);
//       }

//       .search-icon {
//         font-size: 13px;
//         color: var(--text-tertiary);
//         flex-shrink: 0;
//       }

//       input {
//         flex: 1;
//         border: none;
//         background: transparent;
//         outline: none;
//         padding: 8px 0;
//         font-size: var(--font-size-sm);
//         color: var(--text-primary);
//         &::placeholder { color: var(--text-tertiary); }
//       }

//       .search-clear {
//         width: 18px; height: 18px;
//         border-radius: 50%;
//         border: 1px solid var(--border-primary);
//         background: var(--bg-primary);
//         color: var(--text-tertiary);
//         display: flex; align-items: center; justify-content: center;
//         cursor: pointer;
//         font-size: 9px;
//         transition: var(--transition-fast);
//         flex-shrink: 0;
//         &:hover { color: var(--color-error); border-color: var(--color-error); }
//       }
//     }

//     /* Icon button (refresh) */
//     .action-btn {
//       width: 36px; height: 36px;
//       border-radius: var(--ui-border-radius-sm);
//       border: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//       display: flex; align-items: center; justify-content: center;
//       cursor: pointer;
//       font-size: 14px;
//       transition: var(--transition-base);
//       &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
//       &.spinning i { animation: spin 0.9s linear infinite; }
//     }
//     @keyframes spin { to { transform: rotate(360deg); } }

//     /* Category Filter Track inside UCP */
//     .ucp-filters {
//       padding: 12px var(--spacing-xl);
//       background: var(--bg-secondary);
//       border-bottom-left-radius: var(--ui-border-radius-sharp);
//       border-bottom-right-radius: var(--ui-border-radius-sharp);
//     }

//     .filter-track {
//       display: flex;
//       gap: var(--spacing-sm);
//       flex-wrap: wrap;
//     }

//     .cat-pill {
//       display: inline-flex;
//       align-items: center;
//       gap: 6px;
//       padding: 6px 14px;
//       border-radius: var(--ui-border-radius-pill);
//       border: 1px solid var(--border-primary);
//       background: var(--bg-primary);
//       color: var(--text-secondary);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium);
//       cursor: pointer;
//       transition: var(--transition-fast);

//       .cat-icon { font-size: 11px; opacity: 0.7; }

//       .pill-count {
//         font-size: 10px;
//         background: var(--bg-secondary);
//         border: 1px solid var(--border-primary);
//         color: var(--text-tertiary);
//         padding: 0 6px;
//         border-radius: 99px;
//         line-height: 1.6;
//         transition: var(--transition-fast);
//         font-family: var(--font-mono);
//       }

//       &:hover {
//         background: color-mix(in srgb, var(--cc) 4%, var(--bg-primary));
//         border-color: color-mix(in srgb, var(--cc) 30%, transparent);
//         color: var(--text-primary);
//       }

//       &.active {
//         background: color-mix(in srgb, var(--cc) 12%, var(--bg-primary) 88%);
//         border-color: var(--cc);
//         color: var(--text-primary);
//         font-weight: var(--font-weight-semibold);

//         .cat-icon { opacity: 1; color: var(--cc); }
//         .pill-count {
//           background: var(--cc);
//           border-color: var(--cc);
//           color: #fff;
//         }
//       }
//     }

//     /* ═══════════════════════════════════════
//        CHART GRID
//     ═══════════════════════════════════════ */
//     .charts-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
//       gap: var(--spacing-xl);
//       padding-bottom: var(--spacing-2xl);
//     }

//     /* ═══════════════════════════════════════
//        PREMIUM CHART CARD REDESIGN
//     ═══════════════════════════════════════ */
//     .chart-card {
//       position: relative;
//       display: flex;
//       flex-direction: column;
//       background: var(--bg-primary);
//       border: 1px solid var(--border-primary);
//       border-radius: 12px;
//       padding: var(--spacing-lg);
//       cursor: pointer;
//       box-shadow: var(--elevation-1);
//       animation: cardReveal 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) both;
//       animation-delay: var(--delay, 0ms);
//       transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
//       overflow: hidden;

//       &:hover {
//         transform: translateY(-4px);
//         border-color: color-mix(in srgb, var(--cc) 50%, var(--border-primary));
//         /* Colored ambient shadow */
//         box-shadow: 0 12px 24px -10px color-mix(in srgb, var(--cc) 40%, rgba(0,0,0,0.1));

//         .card-expand-btn { opacity: 1; transform: scale(1); }
//         .card-arrow { opacity: 1; transform: translateX(0); color: var(--cc); }
//         .card-arrow-wrap { background: color-mix(in srgb, var(--cc) 10%, var(--bg-secondary)); border-color: color-mix(in srgb, var(--cc) 30%, transparent); }
//         .card-glow { opacity: 1; }
//       }
//     }

//     @keyframes cardReveal {
//       from { opacity: 0; transform: translateY(15px); }
//       to   { opacity: 1; transform: translateY(0); }
//     }

//     /* Subtle top ambient glow */
//     .card-glow {
//       position: absolute;
//       top: 0; left: 0; right: 0;
//       height: 3px;
//       background: var(--cc);
//       opacity: 0;
//       transition: opacity 0.3s ease;
//     }

//     /* Header */
//     .card-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       margin-bottom: var(--spacing-md);
//       z-index: 1;
//     }

//     .card-title-stack {
//       display: flex;
//       flex-direction: column;
//       gap: 6px;
//     }

//     .card-cat-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: 6px;
//       font-size: 10px;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.08em;
//     }

//     .cat-dot {
//       width: 6px; height: 6px;
//       border-radius: 50%;
//       flex-shrink: 0;
//     }

//     .card-title {
//       font-size: 15px;
//       font-weight: 700;
//       color: var(--text-primary);
//       margin: 0;
//       line-height: 1.2;
//     }

//     /* Expand Button (FAB style) */
//     .card-expand-btn {
//       width: 32px; height: 32px;
//       border-radius: 50%;
//       border: 1px solid var(--border-primary);
//       background: var(--bg-primary);
//       color: var(--text-tertiary);
//       display: flex; align-items: center; justify-content: center;
//       cursor: pointer;
//       font-size: 12px;
//       transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
//       opacity: 0;
//       transform: scale(0.8) translate(5px, -5px);
//       box-shadow: var(--elevation-1);
      
//       &:hover { 
//         background: var(--cc); 
//         color: #fff; 
//         border-color: var(--cc); 
//         transform: scale(1.05) translate(5px, -5px);
//       }
//     }

//     /* Chart area */
//     .card-body {
//       flex: 1;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       pointer-events: none; /* Let the card handle clicks, not the inner chart SVGs */
//       user-select: none;
//       min-height: 220px;
//       margin-bottom: var(--spacing-lg);
//       z-index: 1;
//     }

//     /* Footer */
//     .card-footer {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       gap: var(--spacing-md);
//       padding-top: var(--spacing-md);
//       border-top: 1px dashed var(--border-secondary);
//       z-index: 1;
//     }

//     .card-desc {
//       font-size: 12px;
//       color: var(--text-secondary);
//       margin: 0;
//       line-height: 1.4;
//       flex: 1;
//     }

//     .card-arrow-wrap {
//       width: 26px; height: 26px;
//       border-radius: 50%;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-secondary);
//       display: flex; align-items: center; justify-content: center;
//       transition: var(--transition-base);
//       flex-shrink: 0;
//     }

//     .card-arrow {
//       font-size: 11px;
//       color: var(--text-tertiary);
//       opacity: 0.5;
//       transform: translateX(-2px);
//       transition: all 0.2s ease;
//     }

//     /* ═══════════════════════════════════════
//        EMPTY STATE
//     ═══════════════════════════════════════ */
//     .empty-state {
//       grid-column: 1 / -1;
//       padding: 100px 0;
//       text-align: center;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     .empty-glyph {
//       width: 72px; height: 72px;
//       border-radius: 50%;
//       background: var(--bg-secondary);
//       border: 1px solid var(--border-primary);
//       display: flex; align-items: center; justify-content: center;
//       font-size: 32px;
//       color: var(--text-tertiary);
//       opacity: 0.5;
//     }

//     .empty-state h3 { font-size: var(--font-size-xl); color: var(--text-primary); margin: 0; }
//     .empty-state p { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; }

//     .btn-ghost {
//       display: inline-flex; align-items: center; gap: 8px;
//       padding: 8px 24px; border: 1px solid var(--accent-primary);
//       background: transparent; color: var(--accent-primary);
//       border-radius: var(--ui-border-radius-pill);
//       font-size: var(--font-size-sm); font-weight: var(--font-weight-bold);
//       cursor: pointer; transition: var(--transition-base);
//       margin-top: var(--spacing-sm);
//       &:hover { background: var(--accent-primary); color: #fff; }
//     }

//     /* ═══════════════════════════════════════
//        PREMIUM DIALOG LIGHTBOX
//     ═══════════════════════════════════════ */
//     ::ng-deep .premium-lightbox {
//       border-radius: 12px !important;
//       overflow: hidden;
//       box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
//       border: 1px solid color-mix(in srgb, var(--border-primary) 80%, transparent) !important;
//     }

//     .dlg-root {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       width: 100%;
//       background: var(--bg-primary);
//     }

//     /* Dialog header */
//     .dlg-header {
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       gap: var(--spacing-md);
//       padding: var(--spacing-lg) var(--spacing-2xl);
//       border-bottom: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//       flex-shrink: 0;
//       flex-wrap: wrap;
//     }

//     .dlg-header-left {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-lg);
//       min-width: 0;
//     }

//     .dlg-cat-badge {
//       display: inline-flex;
//       align-items: center;
//       gap: 6px;
//       padding: 4px 12px;
//       border-radius: var(--ui-border-radius-pill);
//       border: 1px solid transparent;
//       font-size: 11px;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       white-space: nowrap;
//       flex-shrink: 0;
//       i { font-size: 11px; }
//     }

//     .dlg-title-block { min-width: 0; }

//     .dlg-title {
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0;
//       line-height: 1.2;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//     }

//     .dlg-desc {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//       margin: 2px 0 0;
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//     }

//     .dlg-header-right {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       flex-shrink: 0;
//     }

//     /* Prev/Next nav */
//     .nav-group {
//       display: flex;
//       align-items: center;
//       gap: 4px;
//       background: var(--bg-primary);
//       border: 1px solid var(--border-primary);
//       border-radius: var(--ui-border-radius-sm);
//       padding: 4px;
//     }

//     .nav-btn {
//       width: 32px; height: 32px;
//       border-radius: 4px;
//       border: none;
//       background: transparent;
//       color: var(--text-secondary);
//       cursor: pointer;
//       display: flex; align-items: center; justify-content: center;
//       font-size: 14px;
//       transition: var(--transition-fast);
//       &:hover:not(:disabled) { background: var(--accent-focus); color: var(--accent-primary); }
//       &:disabled { opacity: 0.3; cursor: not-allowed; }
//     }

//     .nav-label {
//       font-size: 12px;
//       color: var(--text-tertiary);
//       font-weight: 600;
//       padding: 0 10px;
//       white-space: nowrap;
//       font-family: var(--font-mono);
//     }

//     .dlg-sep {
//       width: 1px;
//       height: 24px;
//       background: var(--border-primary);
//       flex-shrink: 0;
//     }

//     /* Keyboard hints */
//     .kbd-row { display: flex; align-items: center; gap: var(--spacing-md); }
//     .kbd-hint { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-tertiary); font-weight: 500;}
    
//     kbd {
//       display: inline-flex; align-items: center; justify-content: center;
//       padding: 2px 6px; background: var(--bg-primary); border: 1px solid var(--border-primary);
//       border-bottom-width: 2px; border-radius: 4px; font-size: 10px; font-family: var(--font-mono);
//       color: var(--text-secondary); line-height: 1.5; font-weight: bold;
//     }

//     /* Close button */
//     .close-btn {
//       width: 40px; height: 40px;
//       border-radius: var(--ui-border-radius-sm);
//       border: 1px solid var(--border-primary);
//       background: var(--bg-primary);
//       color: var(--text-secondary);
//       cursor: pointer;
//       display: flex; align-items: center; justify-content: center;
//       font-size: 16px;
//       transition: var(--transition-fast);
//       &:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); }
//     }

//     /* Dialog chart body */
//     .dlg-body {
//       flex: 1;
//       padding: var(--spacing-2xl);
//       background: var(--bg-primary);
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//     }
    
//     .dlg-chart-wrapper {
//       flex: 1;
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-sharp);
//       padding: var(--spacing-xl);
//       background: var(--bg-secondary);
//       overflow-y: auto;
//       overflow-x: hidden;
//     }

//     /* Dialog footer thumbnails */
//     .dlg-footer {
//       flex-shrink: 0;
//       border-top: 1px solid var(--border-primary);
//       background: var(--bg-secondary);
//       padding: var(--spacing-md) var(--spacing-2xl);
//       overflow-x: auto;
//       overflow-y: hidden;
//       scrollbar-width: none;
//       &::-webkit-scrollbar { display: none; }
//     }

//     .dlg-thumbs {
//       display: flex;
//       gap: 8px;
//       width: max-content;
//       align-items: center;
//     }

//     .thumb-chip {
//       display: inline-flex;
//       align-items: center;
//       gap: 6px;
//       padding: 6px 14px;
//       border-radius: var(--ui-border-radius-pill);
//       border: 1px solid var(--border-primary);
//       background: var(--bg-primary);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium);
//       cursor: pointer;
//       white-space: nowrap;
//       transition: var(--transition-fast);

//       .thumb-dot {
//         width: 8px; height: 8px;
//         border-radius: 50%;
//         background: var(--cc);
//         flex-shrink: 0;
//         opacity: 0.5;
//         transition: var(--transition-fast);
//       }

//       &:hover {
//         border-color: var(--cc);
//         color: var(--text-primary);
//         .thumb-dot { opacity: 1; }
//       }

//       &.active {
//         background: color-mix(in srgb, var(--cc) 10%, var(--bg-primary) 90%);
//         border-color: var(--cc);
//         color: var(--text-primary);
//         font-weight: var(--font-weight-bold);
//         .thumb-dot { opacity: 1; box-shadow: 0 0 6px var(--cc); }
//       }
//     }

//     /* ═══════════════════════════════════════
//        RESPONSIVE
//     ═══════════════════════════════════════ */
//     @media (max-width: 1100px) {
//       .charts-grid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
//     }
//     @media (max-width: 768px) {
//       .charts-grid { grid-template-columns: 1fr; }
//       .ucp-header { flex-direction: column; align-items: flex-start; }
//       .search-wrap { width: 100%; }
//       .kbd-row { display: none; }
//       .dlg-header { padding: var(--spacing-md); }
//       .dlg-body { padding: var(--spacing-md); }
//     }
//   `]
// })
// export class AdminChartsAnalysisComponent {

//   searchQuery = '';
//   searchFocused = false;
//   isRefreshing = false;
//   dialogVisible = false;

//   activeCategory = signal('All');
//   previewChart = signal<ChartMeta | null>(null);

//   categories = ['All', 'Finance', 'Sales', 'Customer', 'Operations', 'Inventory'];

//   charts: ChartMeta[] = [
//     { title: 'AOV Trend', id: 'aov', category: 'Sales', description: 'Avg Order Value vs quantity trends', icon: '', component: AovTrendChartComponent },
//     { title: 'Branch Radar', id: 'radar', category: 'Operations', description: 'Cross-branch performance comparison', icon: '', component: BranchRadarChartComponent },
//     { title: 'Customer Acquisition', id: 'acquisition', category: 'Customer', description: 'New customer growth over time', icon: '', component: CustomerAcquisitionChartComponent },
//     { title: 'EMI Portfolio', id: 'emi', category: 'Finance', description: 'Loan health and repayment analysis', icon: '', component: EmiPortfolioChartComponent },
//     { title: 'Financial Trend', id: 'financial', category: 'Finance', description: 'Revenue and expense tracking', icon: '', component: FinancialTrendChartComponent },
//     { title: 'Gross Profit', id: 'gp', category: 'Finance', description: 'Monthly profit margin analysis', icon: '', component: GrossProfitTrendChartComponent },
//     { title: 'Performance Heatmap', id: 'heatmap', category: 'Operations', description: 'Hourly activity distribution by day', icon: '', component: HeatmapChartComponent },
//     { title: 'Inventory Health', id: 'inventory', category: 'Inventory', description: 'Stock levels and critical items', icon: '', component: InventoryHealthChartComponent },
//     { title: 'Order Funnel', id: 'funnel', category: 'Sales', description: 'Conversion tracking through stages', icon: '', component: OrderFunnelChartComponent },
//     { title: 'Payment Mix', id: 'payment', category: 'Finance', description: 'Breakdown of transaction modes', icon: '', component: PaymentMethodsChartComponent },
//     { title: 'Purchase vs Sales', id: 'pvs', category: 'Finance', description: 'Procurement vs revenue balance', icon: '', component: PurchaseVsSalesChartComponent },
//     { title: 'Sales Distribution', id: 'dist', category: 'Sales', description: 'Regional and category sales mix', icon: '', component: SalesDistributionChartComponent },
//     { title: 'Return Rate', id: 'return', category: 'Sales', description: 'Refunds and item returns analysis', icon: '', component: SalesReturnRateChartComponent },
//     { title: 'Top Performers', id: 'performers', category: 'Sales', description: 'Best selling products and branches', icon: '', component: TopPerformersChartComponent },
//     { title: 'YoY Growth', id: 'growth', category: 'Finance', description: 'Year-over-year expansion metrics', icon: '', component: YoyGrowthChartComponent },
//     { title: 'Customer Outstanding', id: 'outstanding', category: 'Customer', description: 'Top credit exposure by balance', icon: '', component: CustomerOutstandingChartComponent },
//   ];

//   filteredCharts = computed(() => {
//     const q = this.searchQuery.toLowerCase();
//     const cat = this.activeCategory();
//     return this.charts.filter(c => {
//       const matchSearch = !q
//         || c.title.toLowerCase().includes(q)
//         || c.category.toLowerCase().includes(q)
//         || c.description.toLowerCase().includes(q);
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
//     return CATEGORY_META[cat]?.color ?? CATEGORY_META['All'].color;
//   }

//   getCatIcon(cat: string): string {
//     return CATEGORY_META[cat]?.icon ?? CATEGORY_META['All'].icon;
//   }

//   getCatCount(cat: string): number {
//     if (cat === 'All') return this.charts.length;
//     return this.charts.filter(c => c.category === cat).length;
//   }

//   openPreview(chart: ChartMeta): void {
//     this.previewChart.set(chart);
//     this.dialogVisible = true;
//   }

//   onDialogHide(): void {
//     this.previewChart.set(null);
//   }

//   navigateChart(dir: -1 | 1): void {
//     const charts = this.filteredCharts();
//     const next = this.currentChartIndex() + dir;
//     if (next >= 0 && next < charts.length) {
//       this.previewChart.set(charts[next]);
//     }
//   }

//   @HostListener('document:keydown', ['$event'])
//   onKeyDown(e: KeyboardEvent): void {
//     if (!this.dialogVisible) return;
//     if (e.key === 'ArrowRight') { this.navigateChart(1); return; }
//     if (e.key === 'ArrowLeft') { this.navigateChart(-1); return; }
//   }

//   refreshAllCharts(): void {
//     this.isRefreshing = true;
//     setTimeout(() => this.isRefreshing = false, 1500);
//   }

//   clearFilters(): void {
//     this.searchQuery = '';
//     this.activeCategory.set('All');
//   }
// }