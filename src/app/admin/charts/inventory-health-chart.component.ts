import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ChartService } from '../chart.service';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

type FilterType = 'all' | 'critical' | 'low' | 'healthy';

@Component({
  selector: 'app-inventory-health-chart',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chart-card">
    
      <!-- Header -->
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </span>
          <div>
            <h3 class="card-title">Inventory Health</h3>
            <p class="card-subtitle">Stock status across branches</p>
          </div>
        </div>
    
        <!-- Status Filters -->
        @if (!isLoading && !hasError) {
          <div class="filter-pills">
            <button class="filter-pill all" [class.active]="activeFilter === 'all'" (click)="setFilter('all')">
              All <span class="pill-count">{{ counts.all }}</span>
            </button>
            <button class="filter-pill critical" [class.active]="activeFilter === 'critical'" (click)="setFilter('critical')">
              Critical <span class="pill-count">{{ counts.critical }}</span>
            </button>
            <button class="filter-pill low" [class.active]="activeFilter === 'low'" (click)="setFilter('low')">
              Low <span class="pill-count">{{ counts.low }}</span>
            </button>
            <button class="filter-pill healthy" [class.active]="activeFilter === 'healthy'" (click)="setFilter('healthy')">
              Healthy <span class="pill-count">{{ counts.healthy }}</span>
            </button>
          </div>
        }
      </div>
    
      <!-- Loading -->
      @if (isLoading) {
        <div class="state-overlay">
          <div class="spinner"></div><span>Loading...</span>
        </div>
      }
    
      <!-- Error -->
      @if (hasError && !isLoading) {
        <div class="state-overlay error">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Failed to load</span>
          <button class="retry-btn" (click)="loadData()">Retry</button>
        </div>
      }
    
      @if (!isLoading && !hasError) {
        <!-- Stacked Bar Chart -->
        <div class="chart-area">
          <canvas #invCanvas></canvas>
        </div>
        <!-- Divider -->
        <div class="section-divider">
          <span class="section-label">Item Details</span>
        </div>
        <!-- Search -->
        <div class="search-bar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search items..." [(ngModel)]="searchTerm" (input)="filterItems()" />
        </div>
        <!-- Items Table -->
        <div class="items-table">
          <div class="table-header">
            <span class="col-status">Status</span>
            <span class="col-name">Item</span>
            <span class="col-sku">SKU</span>
            <span class="col-qty">Qty</span>
            <span class="col-reorder">Reorder</span>
          </div>
          <div class="table-body">
            @for (item of displayedItems; track item) {
              <div class="table-row"
                [class.critical]="item.isCritical"
                [class.low]="!item.isCritical && item.isLow"
                [class.healthy]="!item.isCritical && !item.isLow">
                <span class="col-status">
                  <span class="status-badge" [class.critical]="item.isCritical" [class.low]="!item.isCritical && item.isLow" [class.healthy]="!item.isCritical && !item.isLow">
                    {{ item.isCritical ? 'Critical' : item.isLow ? 'Low' : 'Healthy' }}
                  </span>
                </span>
                <span class="col-name" [title]="item.name">{{ item.name }}</span>
                <span class="col-sku">
                  <code>{{ item.sku || '—' }}</code>
                </span>
                <span class="col-qty">
                  <span class="qty-badge" [class.zero]="item.quantity === 0">{{ item.quantity }}</span>
                </span>
                <span class="col-reorder">
                  <div class="reorder-track">
                    <div class="reorder-fill"
                      [style.width]="getQtyPct(item) + '%'"
                      [class.critical]="item.isCritical"
                      [class.low]="!item.isCritical && item.isLow"
                      [class.healthy]="!item.isCritical && !item.isLow">
                    </div>
                  </div>
                  <span class="reorder-val">{{ item.reorderLevel }}</span>
                </span>
              </div>
            }
            <!-- Empty state -->
            @if (displayedItems.length === 0) {
              <div class="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span>No items match your search</span>
              </div>
            }
          </div>
        </div>
        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="currentPage === 0" (click)="prevPage()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
            <button class="page-btn" [disabled]="currentPage >= totalPages - 1" (click)="nextPage()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        }
      }
    </div>
    `,
  styles: [`
    .chart-card {
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      padding: var(--spacing-xl);
      box-shadow: var(--elevation-1);
      transition: var(--transition-base);
      &:hover { box-shadow: var(--elevation-2); }
    }

    .card-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--spacing-md); margin-bottom: var(--spacing-xl); flex-wrap: wrap;
    }
    .card-title-group { display: flex; align-items: center; gap: var(--spacing-md); }
    .card-icon {
      width: 36px; height: 36px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, #66BB6A 12%, transparent 88%);
      color: #66BB6A; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }

    /* Filter Pills */
    .filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-pill {
      display: flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-xs); font-weight: var(--font-weight-medium);
      border: 1px solid var(--border-primary); background: var(--bg-primary);
      color: var(--text-secondary); cursor: pointer; transition: var(--transition-fast);
      &:hover { border-color: var(--border-secondary); }
      &.active.all    { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
      &.active.critical { background: #EF5350; color: #fff; border-color: #EF5350; }
      &.active.low    { background: #FFA726; color: #fff; border-color: #FFA726; }
      &.active.healthy { background: #66BB6A; color: #fff; border-color: #66BB6A; }
    }
    .pill-count {
      background: rgba(255,255,255,0.25); border-radius: 999px;
      padding: 0 5px; font-size: 10px;
      .filter-pill:not(.active) & { background: var(--bg-secondary); color: var(--text-tertiary); }
    }

    /* Chart */
    .chart-area {
      height: 180px; margin-bottom: var(--spacing-lg);
      canvas { width: 100% !important; height: 100% !important; }
    }

    /* Section Divider */
    .section-divider {
      display: flex; align-items: center; gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border-primary); }
    }
    .section-label { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-medium); white-space: nowrap; }

    /* Search */
    .search-bar {
      display: flex; align-items: center; gap: var(--spacing-sm);
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius); padding: var(--spacing-xs) var(--spacing-md);
      margin-bottom: var(--spacing-md); color: var(--text-tertiary);
      input {
        flex: 1; border: none; background: transparent; outline: none;
        font-size: var(--font-size-sm); color: var(--text-primary);
        &::placeholder { color: var(--text-tertiary); }
      }
    }

    /* Table */
    .items-table { border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius); overflow: hidden; }
    .table-header, .table-row {
      display: grid;
      grid-template-columns: 80px 1fr 120px 52px 100px;
      align-items: center; gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
    }
    .table-header {
      background: var(--bg-primary); border-bottom: 1px solid var(--border-primary);
      font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold);
      color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.04em;
    }
    .table-row {
      border-bottom: 1px solid var(--border-primary); transition: var(--transition-fast);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-hover); }
      &.critical { border-left: 3px solid #EF5350; }
      &.low { border-left: 3px solid #FFA726; }
      &.healthy { border-left: 3px solid #66BB6A; }
    }

    .col-name {
      font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
      color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .col-sku code {
      font-size: 10px; color: var(--text-tertiary);
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: 4px; padding: 1px 5px;
    }
    .col-qty { display: flex; justify-content: center; }
    .qty-badge {
      min-width: 28px; height: 22px; border-radius: var(--ui-border-radius-pill);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);
      background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-primary);
      &.zero { background: color-mix(in srgb, #EF5350 12%, transparent 88%); color: #EF5350; border-color: color-mix(in srgb, #EF5350 30%, transparent 70%); }
    }

    .status-badge {
      display: inline-flex; align-items: center; padding: 2px 8px;
      border-radius: var(--ui-border-radius-pill); font-size: 10px; font-weight: var(--font-weight-semibold);
      &.critical { background: color-mix(in srgb, #EF5350 12%, transparent 88%); color: #EF5350; }
      &.low      { background: color-mix(in srgb, #FFA726 12%, transparent 88%); color: #FFA726; }
      &.healthy  { background: color-mix(in srgb, #66BB6A 12%, transparent 88%); color: #66BB6A; }
    }

    .col-reorder { display: flex; align-items: center; gap: var(--spacing-xs); }
    .reorder-track {
      flex: 1; height: 6px; background: var(--bg-primary); border-radius: 999px;
      border: 1px solid var(--border-primary); overflow: hidden;
    }
    .reorder-fill {
      height: 100%; border-radius: 999px; transition: width 0.5s ease;
      &.critical { background: #EF5350; }
      &.low      { background: #FFA726; }
      &.healthy  { background: #66BB6A; }
    }
    .reorder-val { font-size: var(--font-size-xs); color: var(--text-tertiary); white-space: nowrap; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm); padding: var(--spacing-3xl);
      color: var(--text-tertiary); font-size: var(--font-size-sm);
    }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: var(--spacing-md); margin-top: var(--spacing-md);
    }
    .page-btn {
      width: 30px; height: 30px; border-radius: var(--ui-border-radius);
      border: 1px solid var(--border-primary); background: var(--bg-primary);
      color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: var(--transition-fast);
      &:hover:not(:disabled) { border-color: var(--accent-primary); color: var(--accent-primary); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .page-info { font-size: var(--font-size-xs); color: var(--text-tertiary); font-weight: var(--font-weight-medium); }

    /* States */
    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm); min-height: 220px;
      color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: #66BB6A; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn {
      padding: var(--spacing-xs) var(--spacing-lg); border: 1px solid var(--color-error);
      border-radius: var(--ui-border-radius-pill); background: transparent;
      color: var(--color-error); font-size: var(--font-size-xs); cursor: pointer;
    }
  `]
})
export class InventoryHealthChartComponent implements OnInit, OnDestroy {
  @ViewChild('invCanvas') invCanvas!: ElementRef<HTMLCanvasElement>;
  private destroy$ = new Subject<void>();
  private chart?: Chart;

  isLoading = true;
  hasError = false;

  allItems: any[] = [];
  filteredItems: any[] = [];
  displayedItems: any[] = [];

  activeFilter: FilterType = 'all';
  searchTerm = '';
  currentPage = 0;
  pageSize = 8;
  totalPages = 0;

  counts = { all: 0, critical: 0, low: 0, healthy: 0 };

  constructor(private chartService: ChartService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.chartService.getInventoryHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res.data;
          // Deduplicate items by _id+branchId
          const seen = new Set<string>();
          this.allItems = (data.items || []).filter((item: any) => {
            const key = `${item._id}-${item.branchId}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          this.computeCounts();
          this.filterItems();
          this.isLoading = false;
          setTimeout(() => this.renderChart(data.chart), 50);
        },
        error: () => { this.isLoading = false; this.hasError = true; }
      });
  }

  computeCounts(): void {
    this.counts.all = this.allItems.length;
    this.counts.critical = this.allItems.filter(i => i.isCritical).length;
    this.counts.low = this.allItems.filter(i => !i.isCritical && i.isLow).length;
    this.counts.healthy = this.allItems.filter(i => !i.isCritical && !i.isLow).length;
  }

  setFilter(f: FilterType): void {
    this.activeFilter = f;
    this.currentPage = 0;
    this.filterItems();
  }

  filterItems(): void {
    let items = [...this.allItems];
    if (this.activeFilter === 'critical') items = items.filter(i => i.isCritical);
    else if (this.activeFilter === 'low') items = items.filter(i => !i.isCritical && i.isLow);
    else if (this.activeFilter === 'healthy') items = items.filter(i => !i.isCritical && !i.isLow);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q));
    }
    this.filteredItems = items;
    this.totalPages = Math.ceil(items.length / this.pageSize);
    this.paginate();
  }

  paginate(): void {
    const start = this.currentPage * this.pageSize;
    this.displayedItems = this.filteredItems.slice(start, start + this.pageSize);
  }

  prevPage(): void { if (this.currentPage > 0) { this.currentPage--; this.paginate(); } }
  nextPage(): void { if (this.currentPage < this.totalPages - 1) { this.currentPage++; this.paginate(); } }

  getQtyPct(item: any): number {
    if (!item.reorderLevel) return 0;
    return Math.min(100, Math.round((item.quantity / item.reorderLevel) * 100));
  }

  renderChart(chartData: any): void {
    if (!this.invCanvas || !chartData) return;
    this.chart?.destroy();
    const ctx = this.invCanvas.nativeElement.getContext('2d')!;
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets.map((ds: any) => ({
          ...ds,
          borderRadius: 4,
          borderSkipped: false,
          barPercentage: 0.55
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: 'var(--text-tertiary)', font: { size: 11 } } },
          y: {
            stacked: true,
            grid: { color: 'var(--border-secondary, rgba(0,0,0,0.06))' },
            ticks: { color: 'var(--text-tertiary)', font: { size: 10 }, stepSize: 10 }
          }
        },
        plugins: {
          legend: {
            position: 'top', align: 'end',
            labels: { color: 'var(--text-secondary)', padding: 16, font: { size: 11, weight: 500 }, usePointStyle: true, pointStyleWidth: 8 }
          }
        }
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); this.chart?.destroy(); }
}
