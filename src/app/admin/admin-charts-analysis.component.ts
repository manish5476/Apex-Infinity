import { Component, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

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

const CATEGORY_COLORS: Record<string, string> = {
  Finance: '#6366f1',
  Sales: '#10b981',
  Customer: '#f59e0b',
  Operations: '#3b82f6',
  Inventory: '#ef4444',
  All: 'var(--accent-primary)'
};

@Component({
  selector: 'app-admin-charts-analysis',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TooltipModule,
    // AovTrendChartComponent, BranchRadarChartComponent, CustomerAcquisitionChartComponent,
    // EmiPortfolioChartComponent, FinancialTrendChartComponent, GrossProfitTrendChartComponent,
    // HeatmapChartComponent, InventoryHealthChartComponent, OrderFunnelChartComponent,
    // PaymentMethodsChartComponent, PurchaseVsSalesChartComponent, SalesDistributionChartComponent,
    // SalesReturnRateChartComponent, TopPerformersChartComponent, YoyGrowthChartComponent
    // CustomerOutstandingChartComponent
  ],
  template: `
    <div class="analysis-hub">

      <!-- ══════════════════════ HEADER ══════════════════════ -->
      <header class="hub-header">
        <div class="header-main">
          <div class="header-title">
            <div class="title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <h1>Charts & Analysis</h1>
              <p>{{ filteredCharts().length }} of {{ charts.length }} charts · Click any chart to preview</p>
            </div>
          </div>

          <div class="header-actions">
            <div class="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" [(ngModel)]="searchQuery" placeholder="Search charts…" />
              <button class="search-clear" *ngIf="searchQuery" (click)="searchQuery = ''">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <button class="refresh-btn" (click)="refreshAllCharts()"
              pTooltip="Refresh all charts" tooltipPosition="bottom"
              [class.spinning]="isRefreshing">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Category Filters -->
        <div class="category-filters">
          @for (cat of categories; track cat) {
            <button class="cat-chip"
              [class.active]="activeCategory() === cat"
              [style.--cat-color]="getCatColor(cat)"
              (click)="activeCategory.set(cat)">
              <span class="cat-dot"></span>
              {{ cat }}
              <span class="cat-count">{{ getCatCount(cat) }}</span>
            </button>
          }
        </div>
      </header>

      <!-- ══════════════════════ GRID ══════════════════════ -->
      <div class="charts-grid">
        @for (chart of filteredCharts(); track chart.id; let i = $index) {
          <div class="chart-card" [style.--anim-delay]="(i * 40) + 'ms'" (click)="openPreview(chart)">

            <!-- Card top bar -->
            <div class="card-topbar">
              <div class="card-badge" [style.--cat-color]="getCatColor(chart.category)">
                <span class="badge-dot"></span>{{ chart.category }}
              </div>
              <button class="expand-btn" (click)="$event.stopPropagation(); openPreview(chart)"
                pTooltip="Full preview" tooltipPosition="left">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>

            <!-- Actual chart component -->
            <div class="card-chart-wrap">
              <ng-container [ngComponentOutlet]="chart.component"></ng-container>
            </div>

            <!-- Hover overlay with info -->
            <div class="card-hover-overlay">
              <div class="overlay-content">
                <span class="overlay-title">{{ chart.title }}</span>
                <span class="overlay-desc">{{ chart.description }}</span>
                <span class="overlay-cta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                  Click to expand
                </span>
              </div>
            </div>
          </div>
        }

        @empty {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3>No charts found</h3>
            <p>Try a different search term or category</p>
            <button class="clear-filters-btn" (click)="clearFilters()">Clear filters</button>
          </div>
        }
      </div>
    </div>

    <!-- ══════════════════════ PREVIEW DIALOG ══════════════════════ -->
    @if (previewChart()) {
      <div class="dialog-backdrop" (click)="closePreview()" [class.closing]="isClosing">
        <div class="dialog-panel" (click)="$event.stopPropagation()" [class.closing]="isClosing">

          <!-- Dialog Header -->
          <div class="dialog-header">
            <div class="dialog-title-group">
              <div class="dialog-badge" [style.--cat-color]="getCatColor(previewChart()!.category)">
                <span class="badge-dot"></span>{{ previewChart()!.category }}
              </div>
              <div>
                <h2 class="dialog-title">{{ previewChart()!.title }}</h2>
                <p class="dialog-subtitle">{{ previewChart()!.description }}</p>
              </div>
            </div>

            <div class="dialog-controls">
              <!-- Prev / Next navigation -->
              <button class="nav-btn" (click)="navigateChart(-1)"
                [disabled]="currentChartIndex() === 0"
                pTooltip="Previous chart" tooltipPosition="bottom">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span class="nav-counter">{{ currentChartIndex() + 1 }} / {{ filteredCharts().length }}</span>
              <button class="nav-btn" (click)="navigateChart(1)"
                [disabled]="currentChartIndex() === filteredCharts().length - 1"
                pTooltip="Next chart" tooltipPosition="bottom">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>

              <div class="dialog-sep"></div>

              <button class="close-btn" (click)="closePreview()" pTooltip="Close (Esc)" tooltipPosition="bottom">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Keyboard hint -->
          <div class="kbd-hints">
            <span class="kbd-hint"><kbd>←</kbd><kbd>→</kbd> Navigate</span>
            <span class="kbd-hint"><kbd>Esc</kbd> Close</span>
          </div>

          <!-- Dialog Chart Body -->
          <div class="dialog-body">
            <ng-container [ngComponentOutlet]="previewChart()!.component"></ng-container>
          </div>

          <!-- Dialog Footer -->
          <div class="dialog-footer">
            <!-- Sibling chart thumbnails -->
            <div class="sibling-chips">
              @for (c of filteredCharts(); track c.id; let i = $index) {
                <button class="sibling-chip"
                  [class.active]="c.id === previewChart()!.id"
                  [style.--cat-color]="getCatColor(c.category)"
                  (click)="openPreview(c)"
                  [pTooltip]="c.title" tooltipPosition="top">
                  <span class="chip-dot"></span>
                  {{ c.title }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ═══════════════════════════════════════════════
       HOST & LAYOUT
    ═══════════════════════════════════════════════ */
    :host { display: block; background: var(--bg-secondary); min-height: 100%; }

    .analysis-hub {
      padding: var(--spacing-xl);
      max-width: 1640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    /* ═══════════════════════════════════════════════
       HEADER
    ═══════════════════════════════════════════════ */
    .hub-header {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--elevation-1);
    }

    .header-main {
      display: flex; justify-content: space-between; align-items: center;
      gap: var(--spacing-xl); margin-bottom: var(--spacing-lg); flex-wrap: wrap;
    }

    .header-title {
      display: flex; align-items: center; gap: var(--spacing-md);
      h1 { font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }
      p { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 3px 0 0; }
    }

    .title-icon {
      width: 42px; height: 42px; border-radius: var(--ui-border-radius);
      background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)));
      color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .header-actions { display: flex; gap: var(--spacing-md); align-items: center; }

    .search-box {
      position: relative; width: 300px; display: flex; align-items: center;
      background: var(--bg-secondary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-pill); padding: 0 12px; gap: 8px;
      transition: var(--transition-base);
      &:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-focus); background: var(--bg-primary); }
      svg { color: var(--text-tertiary); flex-shrink: 0; }
      input {
        flex: 1; border: none; background: transparent; outline: none; padding: 9px 0;
        font-size: var(--font-size-sm); color: var(--text-primary);
        &::placeholder { color: var(--text-tertiary); }
      }
    }

    .search-clear {
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center;
      justify-content: center; cursor: pointer; color: var(--text-tertiary);
      flex-shrink: 0; transition: var(--transition-fast);
      &:hover { color: var(--color-error); border-color: var(--color-error); }
    }

    .refresh-btn {
      width: 38px; height: 38px; border-radius: 50%;
      border: 1px solid var(--border-primary); background: var(--bg-secondary);
      color: var(--text-secondary); cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: var(--transition-base);
      svg { transition: transform 0.4s ease; }
      &:hover { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
      &.spinning svg { animation: spin 1s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Category Filters */
    .category-filters { display: flex; gap: var(--spacing-xs); flex-wrap: wrap; }

    .cat-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 14px 5px 10px; border-radius: var(--ui-border-radius-pill);
      border: 1px solid var(--border-primary); background: var(--bg-secondary);
      color: var(--text-secondary); font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium); cursor: pointer; transition: var(--transition-base);
      .cat-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--cat-color); opacity: 0.5; transition: var(--transition-fast); }
      .cat-count { font-size: 10px; color: var(--text-tertiary); background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 999px; padding: 0 5px; }
      &:hover { border-color: var(--cat-color); color: var(--text-primary); .cat-dot { opacity: 1; } }
      &.active { background: color-mix(in srgb, var(--cat-color) 10%, var(--bg-secondary) 90%); border-color: var(--cat-color); color: var(--text-primary); .cat-dot { opacity: 1; } .cat-count { background: var(--cat-color); color: #fff; border-color: var(--cat-color); } }
    }

    /* ═══════════════════════════════════════════════
       GRID
    ═══════════════════════════════════════════════ */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
      gap: var(--spacing-xl);
      padding-bottom: var(--spacing-3xl);
    }

    .chart-card {
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      display: flex; flex-direction: column;
      box-shadow: var(--elevation-1);
      animation: cardIn 0.3s ease both;
      animation-delay: var(--anim-delay, 0ms);
      transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 0.22s ease, border-color 0.22s ease;

      &:hover {
        transform: translateY(-5px) scale(1.005);
        box-shadow: var(--elevation-3);
        border-color: var(--accent-primary);
        .card-hover-overlay { opacity: 1; }
        .expand-btn { opacity: 1; transform: scale(1); }
      }
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .card-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary);
    }

    .card-badge {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; font-weight: var(--font-weight-bold);
      text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--cat-color);
      .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cat-color); }
    }

    .expand-btn {
      width: 26px; height: 26px; border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary); background: var(--bg-primary);
      color: var(--text-tertiary); cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: var(--transition-fast);
      opacity: 0; transform: scale(0.85);
      &:hover { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
    }

    .card-chart-wrap {
      flex: 1; padding: var(--spacing-md);
      pointer-events: none; /* prevent interaction inside grid cards */
      user-select: none;
    }

    /* Hover overlay */
    .card-hover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to bottom, transparent 40%, color-mix(in srgb, var(--bg-primary) 92%, var(--accent-primary) 8%) 100%);
      opacity: 0; transition: opacity 0.2s ease;
      display: flex; align-items: flex-end;
    }

    .overlay-content {
      padding: var(--spacing-xl) var(--spacing-lg);
      display: flex; flex-direction: column; gap: 3px;
    }

    .overlay-title { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .overlay-desc  { font-size: var(--font-size-xs); color: var(--text-secondary); }
    .overlay-cta {
      display: flex; align-items: center; gap: 5px;
      font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
      color: var(--accent-primary); margin-top: 4px;
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1; padding: 80px 0; text-align: center; color: var(--text-tertiary);
      .empty-icon { margin-bottom: var(--spacing-xl); opacity: 0.25; }
      h3 { font-size: var(--font-size-xl); color: var(--text-secondary); margin-bottom: var(--spacing-xs); }
      p { font-size: var(--font-size-sm); margin-bottom: var(--spacing-xl); }
    }
    .clear-filters-btn {
      padding: var(--spacing-sm) var(--spacing-2xl); border: 1px solid var(--accent-primary);
      background: transparent; color: var(--accent-primary); border-radius: var(--ui-border-radius-pill);
      cursor: pointer; font-weight: var(--font-weight-semibold); font-size: var(--font-size-sm);
      transition: var(--transition-base);
      &:hover { background: var(--accent-primary); color: #fff; }
    }

    /* ═══════════════════════════════════════════════
       DIALOG BACKDROP
    ═══════════════════════════════════════════════ */
    .dialog-backdrop {
      position: fixed; inset: 0; z-index: var(--z-modal-backdrop);
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: var(--spacing-xl);
      animation: backdropIn 0.2s ease;

      &.closing { animation: backdropOut 0.22s ease forwards; }
    }
    @keyframes backdropIn  { from { opacity: 0; } to { opacity: 1; } }
    @keyframes backdropOut { from { opacity: 1; } to { opacity: 0; } }

    /* ═══════════════════════════════════════════════
       DIALOG PANEL
    ═══════════════════════════════════════════════ */
    .dialog-panel {
      width: 100%; max-width: 1000px; max-height: 90vh;
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--elevation-3), 0 0 0 1px color-mix(in srgb, var(--accent-primary) 15%, transparent 85%);
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: panelIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);

      &.closing { animation: panelOut 0.22s cubic-bezier(0.7, 0, 1, 0.6) forwards; }
    }
    @keyframes panelIn  { from { opacity: 0; transform: scale(0.93) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes panelOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.94) translateY(8px); } }

    /* Dialog Header */
    .dialog-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: var(--spacing-md); padding: var(--spacing-lg) var(--spacing-xl);
      border-bottom: 1px solid var(--border-primary);
      background: var(--bg-secondary); flex-shrink: 0;
    }

    .dialog-title-group { display: flex; align-items: center; gap: var(--spacing-md); }

    .dialog-badge {
      display: flex; align-items: center; gap: 5px; flex-shrink: 0;
      font-size: 10px; font-weight: var(--font-weight-bold); text-transform: uppercase;
      letter-spacing: 0.06em; color: var(--cat-color);
      background: color-mix(in srgb, var(--cat-color) 10%, transparent 90%);
      border: 1px solid color-mix(in srgb, var(--cat-color) 25%, transparent 75%);
      border-radius: var(--ui-border-radius-pill); padding: 3px 10px 3px 7px;
      .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cat-color); }
    }

    .dialog-title { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); margin: 0; }
    .dialog-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

    .dialog-controls { display: flex; align-items: center; gap: var(--spacing-xs); flex-shrink: 0; }

    .nav-btn {
      width: 32px; height: 32px; border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary); background: var(--bg-primary);
      color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: var(--transition-fast);
      &:hover:not(:disabled) { background: var(--accent-focus); color: var(--accent-primary); border-color: var(--accent-primary); }
      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }

    .nav-counter {
      font-size: var(--font-size-xs); color: var(--text-tertiary);
      font-weight: var(--font-weight-medium); padding: 0 var(--spacing-xs); white-space: nowrap;
    }

    .dialog-sep { width: 1px; height: 24px; background: var(--border-primary); margin: 0 var(--spacing-xs); }

    .close-btn {
      width: 32px; height: 32px; border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--border-primary); background: var(--bg-primary);
      color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: var(--transition-fast);
      &:hover { background: var(--color-error-bg); color: var(--color-error); border-color: var(--color-error); }
    }

    /* Keyboard hints */
    .kbd-hints {
      display: flex; gap: var(--spacing-lg); padding: var(--spacing-xs) var(--spacing-xl);
      background: var(--bg-secondary); border-bottom: 1px solid var(--border-primary);
      flex-shrink: 0;
    }
    .kbd-hint {
      display: flex; align-items: center; gap: 5px;
      font-size: 10px; color: var(--text-tertiary);
    }
    kbd {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 1px 5px; background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-bottom-width: 2px; border-radius: 4px; font-family: var(--font-mono);
      font-size: 9px; color: var(--text-secondary); line-height: 1.4;
    }

    /* Dialog Body */
    .dialog-body {
      flex: 1; overflow-y: auto; padding: var(--spacing-xl);
      scroll-behavior: smooth;
      scrollbar-width: thin;
      scrollbar-color: var(--scroll-thumb-c, var(--border-primary)) transparent;
      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 999px; }
    }

    /* Dialog Footer - Sibling chips */
    .dialog-footer {
      border-top: 1px solid var(--border-primary);
      padding: var(--spacing-md) var(--spacing-xl);
      background: var(--bg-secondary); flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .sibling-chips { display: flex; gap: var(--spacing-xs); align-items: center; width: max-content; }

    .sibling-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 12px 4px 8px; border-radius: var(--ui-border-radius-pill);
      border: 1px solid var(--border-primary); background: var(--bg-primary);
      color: var(--text-tertiary); font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium); cursor: pointer; white-space: nowrap;
      transition: var(--transition-fast);
      .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cat-color); flex-shrink: 0; }
      &:hover { border-color: var(--cat-color); color: var(--text-primary); }
      &.active { background: color-mix(in srgb, var(--cat-color) 10%, var(--bg-primary) 90%); border-color: var(--cat-color); color: var(--text-primary); font-weight: var(--font-weight-semibold); }
    }

    /* ═══════════════════════════════════════════════
       RESPONSIVE
    ═══════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .charts-grid { grid-template-columns: 1fr; }
      .header-main { flex-direction: column; align-items: flex-start; }
      .search-box { width: 100%; }
    }

    @media (max-width: 640px) {
      .analysis-hub { padding: var(--spacing-md); }
      .dialog-panel { max-height: 95vh; border-radius: var(--ui-border-radius-lg); }
      .dialog-body { padding: var(--spacing-md); }
      .kbd-hints { display: none; }
    }
  `]
})
export class AdminChartsAnalysisComponent {
  searchQuery = '';
  activeCategory = signal('All');
  viewMode = signal('grid');
  isRefreshing = false;
  isClosing = false;

  previewChart = signal<ChartMeta | null>(null);

  categories = ['All', 'Finance', 'Sales', 'Customer', 'Operations', 'Inventory'];

  charts: ChartMeta[] = [
    { title: 'AOV Trend',            id: 'aov',        category: 'Sales',      description: 'Avg Order Value vs quantity trends',    icon: '', component: AovTrendChartComponent },
    { title: 'Branch Radar',         id: 'radar',       category: 'Operations', description: 'Cross-branch performance comparison',   icon: '', component: BranchRadarChartComponent },
    { title: 'Customer Acquisition', id: 'acquisition', category: 'Customer',   description: 'New customer growth over time',         icon: '', component: CustomerAcquisitionChartComponent },
    { title: 'EMI Portfolio',        id: 'emi',         category: 'Finance',    description: 'Loan health and repayment analysis',    icon: '', component: EmiPortfolioChartComponent },
    { title: 'Financial Trend',      id: 'financial',   category: 'Finance',    description: 'Revenue and expense tracking',          icon: '', component: FinancialTrendChartComponent },
    { title: 'Gross Profit',         id: 'gp',          category: 'Finance',    description: 'Monthly profit margin analysis',        icon: '', component: GrossProfitTrendChartComponent },
    { title: 'Performance Heatmap',  id: 'heatmap',     category: 'Operations', description: 'Hourly activity distribution by day',  icon: '', component: HeatmapChartComponent },
    { title: 'Inventory Health',     id: 'inventory',   category: 'Inventory',  description: 'Stock levels and critical items',       icon: '', component: InventoryHealthChartComponent },
    { title: 'Order Funnel',         id: 'funnel',      category: 'Sales',      description: 'Conversion tracking through stages',   icon: '', component: OrderFunnelChartComponent },
    { title: 'Payment Mix',          id: 'payment',     category: 'Finance',    description: 'Breakdown of transaction modes',        icon: '', component: PaymentMethodsChartComponent },
    { title: 'Purchase vs Sales',    id: 'pvs',         category: 'Finance',    description: 'Procurement vs revenue balance',        icon: '', component: PurchaseVsSalesChartComponent },
    { title: 'Sales Distribution',   id: 'dist',        category: 'Sales',      description: 'Regional and category sales mix',       icon: '', component: SalesDistributionChartComponent },
    { title: 'Return Rate',          id: 'return',      category: 'Sales',      description: 'Refunds and item returns analysis',     icon: '', component: SalesReturnRateChartComponent },
    { title: 'Top Performers',       id: 'performers',  category: 'Sales',      description: 'Best selling products and branches',   icon: '', component: TopPerformersChartComponent },
    { title: 'YoY Growth',           id: 'growth',      category: 'Finance',    description: 'Year-over-year expansion metrics',      icon: '', component: YoyGrowthChartComponent },
    { title: 'Customer Outstanding', id: 'outstanding', category: 'Customer',   description: 'Top credit exposure by balance',        icon: '', component: CustomerOutstandingChartComponent }
  ];

  filteredCharts = computed(() => {
    const q = this.searchQuery.toLowerCase();
    const cat = this.activeCategory();
    return this.charts.filter(c => {
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
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
    return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['All'];
  }

  getCatCount(cat: string): number {
    if (cat === 'All') return this.charts.length;
    return this.charts.filter(c => c.category === cat).length;
  }

  openPreview(chart: ChartMeta): void {
    this.isClosing = false;
    this.previewChart.set(chart);
    document.body.style.overflow = 'hidden';
  }

  closePreview(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.previewChart.set(null);
      this.isClosing = false;
      document.body.style.overflow = '';
    }, 220);
  }

  navigateChart(dir: -1 | 1): void {
    const charts = this.filteredCharts();
    const idx = this.currentChartIndex();
    const next = idx + dir;
    if (next >= 0 && next < charts.length) {
      this.previewChart.set(charts[next]);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (!this.previewChart()) return;
    if (e.key === 'Escape') { this.closePreview(); return; }
    if (e.key === 'ArrowRight') { this.navigateChart(1); return; }
    if (e.key === 'ArrowLeft') { this.navigateChart(-1); return; }
  }

  refreshAllCharts(): void {
    this.isRefreshing = true;
    setTimeout(() => { this.isRefreshing = false; }, 1500);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.activeCategory.set('All');
  }
}

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
