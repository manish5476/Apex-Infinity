import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ChartService } from '../chart.service';

@Component({
  selector: 'app-heatmap-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </span>
          <div>
            <h3 class="card-title">Activity Heatmap</h3>
            <p class="card-subtitle">Hourly activity by day of week</p>
          </div>
        </div>
        <div class="legend-scale">
          <span class="legend-label">Low</span>
          <div class="legend-cells">
            <div class="legend-cell" *ngFor="let s of legendSteps" [style.background]="getCellColor(s, maxVal)"></div>
          </div>
          <span class="legend-label">High</span>
        </div>
      </div>

      <div class="state-overlay" *ngIf="isLoading">
        <div class="spinner"></div><span>Loading...</span>
      </div>
      <div class="state-overlay error" *ngIf="hasError && !isLoading">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Failed to load</span>
        <button class="retry-btn" (click)="loadData()">Retry</button>
      </div>

      <ng-container *ngIf="!isLoading && !hasError && chartData">
        <div class="heatmap-wrapper">
          <!-- Y labels -->
          <div class="y-labels">
            <div class="y-label" *ngFor="let d of chartData.yLabels">{{ d }}</div>
          </div>
          <!-- Grid -->
          <div class="heatmap-grid">
            <!-- X labels -->
            <div class="x-labels">
              <span class="x-label" *ngFor="let h of chartData.xLabels; let i = index"
                [style.display]="i % 3 === 0 ? '' : 'invisible'">
                {{ i % 3 === 0 ? h : '' }}
              </span>
            </div>
            <!-- Rows -->
            <div class="heatmap-row" *ngFor="let row of chartData.series">
              <div class="heatmap-cell"
                *ngFor="let val of row.data; let hi = index"
                [style.background]="getCellColor(val, maxVal)"
                [title]="row.name + ' ' + chartData.xLabels[hi] + ': ' + val">
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary-row">
          <div class="summary-chip">
            <span class="chip-label">Total Activity</span>
            <span class="chip-value">{{ totalActivity }}</span>
          </div>
          <div class="summary-chip">
            <span class="chip-label">Peak Hour</span>
            <span class="chip-value">{{ peakHour }}</span>
          </div>
          <div class="summary-chip">
            <span class="chip-label">Peak Day</span>
            <span class="chip-value">{{ peakDay }}</span>
          </div>
        </div>
      </ng-container>
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
      gap: var(--spacing-md); margin-bottom: var(--spacing-xl);
      flex-wrap: wrap;
    }
    .card-title-group { display: flex; align-items: center; gap: var(--spacing-md); }
    .card-icon {
      width: 36px; height: 36px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
      color: var(--accent-primary); display: flex; align-items: center; justify-content: center;
    }
    .card-title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0; }
    .card-subtitle { font-size: var(--font-size-xs); color: var(--text-tertiary); margin: 2px 0 0; }
    .legend-scale { display: flex; align-items: center; gap: var(--spacing-sm); }
    .legend-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .legend-cells { display: flex; gap: 2px; }
    .legend-cell { width: 14px; height: 14px; border-radius: 3px; }
    .heatmap-wrapper { display: flex; gap: var(--spacing-sm); overflow-x: auto; }
    .y-labels {
      display: flex; flex-direction: column;
      gap: 3px; padding-top: 22px; flex-shrink: 0;
    }
    .y-label {
      height: 20px; display: flex; align-items: center;
      font-size: var(--font-size-xs); color: var(--text-tertiary);
      font-weight: var(--font-weight-medium); white-space: nowrap;
      min-width: 28px;
    }
    .heatmap-grid { flex: 1; min-width: 0; }
    .x-labels {
      display: grid; grid-template-columns: repeat(24, minmax(0, 1fr));
      gap: 3px; margin-bottom: 4px;
    }
    .x-label {
      font-size: 9px; color: var(--text-tertiary);
      text-align: center; white-space: nowrap; overflow: hidden;
    }
    .heatmap-row {
      display: grid; grid-template-columns: repeat(24, minmax(0, 1fr));
      gap: 3px; margin-bottom: 3px;
    }
    .heatmap-cell {
      height: 20px; border-radius: 3px; cursor: default;
      transition: transform 0.1s ease, filter 0.1s ease;
      &:hover { transform: scale(1.2); filter: brightness(1.15); z-index: 1; position: relative; }
    }
    .summary-row {
      display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-lg); flex-wrap: wrap;
    }
    .summary-chip {
      flex: 1; min-width: 100px;
      background: var(--bg-primary); border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius); padding: var(--spacing-sm) var(--spacing-md);
      display: flex; flex-direction: column; gap: 2px;
    }
    .chip-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
    .chip-value { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .state-overlay {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: var(--spacing-sm);
      min-height: 180px; color: var(--text-tertiary); font-size: var(--font-size-sm);
      &.error { color: var(--color-error); }
    }
    .spinner {
      width: 28px; height: 28px; border: 2px solid var(--border-primary);
      border-top-color: var(--accent-primary); border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .retry-btn {
      padding: var(--spacing-xs) var(--spacing-lg);
      border: 1px solid var(--color-error); border-radius: var(--ui-border-radius-pill);
      background: transparent; color: var(--color-error);
      font-size: var(--font-size-xs); cursor: pointer;
    }
    .invisible { visibility: hidden; }
  `]
})
export class HeatmapChartComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = true;
  hasError = false;
  chartData: any = null;
  maxVal = 1;
  totalActivity = 0;
  peakHour = '—';
  peakDay = '—';
  legendSteps = [0, 0.25, 0.5, 0.75, 1];

  constructor(private chartService: ChartService) { }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.chartService.getHeatmap()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.chartData = res.data;
          this.computeStats();
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; this.hasError = true; }
      });
  }

  computeStats(): void {
    if (!this.chartData) return;
    let max = 0, total = 0, peakDayIdx = 0, peakHourIdx = 0;
    this.chartData.series.forEach((row: any, di: number) => {
      row.data.forEach((val: number, hi: number) => {
        total += val;
        if (val > max) { max = val; peakDayIdx = di; peakHourIdx = hi; }
      });
    });
    this.maxVal = max || 1;
    this.totalActivity = total;
    this.peakDay = total > 0 ? this.chartData.yLabels[peakDayIdx] : '—';
    this.peakHour = total > 0 ? this.chartData.xLabels[peakHourIdx] : '—';
  }

  getCellColor(val: number, max: number): string {
    if (max === 0 || val === 0) return 'color-mix(in srgb, var(--accent-primary) 6%, var(--bg-primary) 94%)';
    const ratio = val / max;
    const pct = Math.round(ratio * 85) + 10;
    return `color-mix(in srgb, var(--accent-primary) ${pct}%, var(--bg-primary) ${100 - pct}%)`;
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
