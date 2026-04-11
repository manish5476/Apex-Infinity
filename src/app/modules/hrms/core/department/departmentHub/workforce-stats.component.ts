import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { AgShareGrid } from '../../../../shared/components/ag-shared-grid';

@Component({
  selector: 'app-workforce-stats',
  standalone: true,
  imports: [CommonModule, DecimalPipe, TagModule, AgShareGrid],
  template: `
    <div class="stats-container">
      <!-- Stats Cards -->
      @if (stats) {
        <div class="stats-grid">
          
          <!-- Stat Card 1 -->
          <div class="stat-card">
            <div class="stat-content">
              <span class="stat-label">Total Departments</span>
              <span class="stat-value">{{ stats.totalDepartments | number }}</span>
            </div>
            <div class="stat-icon icon-primary">
              <i class="pi pi-building"></i>
            </div>
            <div class="stat-glow glow-primary"></div>
          </div>
          
          <!-- Stat Card 2 -->
          <div class="stat-card">
            <div class="stat-content">
              <span class="stat-label">Total Workforce</span>
              <span class="stat-value">{{ stats.totalEmployees | number }}</span>
            </div>
            <div class="stat-icon icon-success">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-glow glow-success"></div>
          </div>

          <!-- Stat Card 3 -->
          <div class="stat-card">
            <div class="stat-content">
              <span class="stat-label">Avg. Headcount</span>
              <span class="stat-value">{{ stats.avgEmployeesPerDept | number:'1.0-1' }}</span>
            </div>
            <div class="stat-icon icon-info">
              <i class="pi pi-chart-line"></i>
            </div>
            <div class="stat-glow glow-info"></div>
          </div>
          
        </div>

        <!-- Department Grid Card -->
        <div class="premium-card grid-card">
          <div class="card-header">
            <div class="header-title">
              <div class="header-icon"><i class="pi pi-table"></i></div>
              <span>Department Breakdown</span>
            </div>
            <div class="badge-live">
              <span class="pulse-dot"></span> Live Data
            </div>
          </div>
          
          <div class="card-body p-0">
            <div class="grid-wrapper">
              <app-ag-share-grid 
                [columns]="columns" 
                [data]="stats.departments"
                selectionMode="single">
              </app-ag-share-grid>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-glyph"><i class="pi pi-database"></i></div>
          <h3>No Statistics Available</h3>
          <p>There is currently no workforce data to display.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════
       WORKFORCE STATS - PREMIUM UI
    ══════════════════════════════════════════════════════ */
    :host {
      display: block;
      height: 100%;
    }

    .stats-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
      height: 100%;
    }

    /* ── METRICS GRID ──────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-xl);
      flex-shrink: 0;
    }

    .stat-card {
      position: relative;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-xl) var(--spacing-2xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-base);
      overflow: hidden;
      cursor: default;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--border-secondary);
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      z-index: 1;
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: var(--font-weight-medium);
      letter-spacing: 0.02em;
    }

    .stat-value {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      line-height: var(--line-height-tight);
      letter-spacing: -0.02em;
    }
    
    .stat-icon {
      width: 56px; 
      height: 56px;
      border-radius: 16px;
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-size: 24px;
      z-index: 1;
    }

    .icon-primary { 
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent); 
      color: var(--accent-primary); 
    }
    .icon-success { 
      background: color-mix(in srgb, var(--color-success) 12%, transparent); 
      color: var(--color-success); 
    }
    .icon-info { 
      background: color-mix(in srgb, var(--color-info) 12%, transparent); 
      color: var(--color-info); 
    }

    /* Ambient Top Glow */
    .stat-glow {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      opacity: 0.8;
    }
    .glow-primary { background: var(--accent-primary); }
    .glow-success { background: var(--color-success); }
    .glow-info { background: var(--color-info); }

    /* ── GRID CARD ─────────────────────────────────────── */
    .grid-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      min-height: 400px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-lg) var(--spacing-2xl);
      background: var(--bg-secondary);
      border-bottom: var(--ui-border-width) solid var(--border-secondary);
      z-index: 2;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }

    .header-icon {
      width: 32px; height: 32px;
      background: color-mix(in srgb, var(--text-primary) 8%, transparent);
      color: var(--text-primary);
      border-radius: var(--ui-border-radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-sm);
    }

    /* Live Data Badge */
    .badge-live {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: var(--ui-border-radius-pill);
      background: color-mix(in srgb, var(--color-info) 10%, transparent);
      color: var(--color-info-dark, var(--color-info));
      border: 1px solid color-mix(in srgb, var(--color-info) 25%, transparent);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pulse-dot {
      width: 6px; height: 6px;
      background: var(--color-info);
      border-radius: 50%;
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-info) 40%, transparent);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-info) 40%, transparent); }
      70% { box-shadow: 0 0 0 6px rgba(0, 0, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
    }

    .card-body.p-0 { 
      padding: 0; 
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .grid-wrapper {
      flex: 1;
      width: 100%;
      height: 100%;
    }

    /* Override AG Grid borders to seamlessly blend into our card */
    ::ng-deep .grid-wrapper .ag-root-wrapper {
      border: none !important;
      border-radius: 0 0 var(--ui-border-radius-xl) var(--ui-border-radius-xl) !important;
    }

    /* ── EMPTY STATE ───────────────────────────────────── */
    .empty-state {
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center;
      height: 100%; 
      min-height: 400px;
      text-align: center;
      background: var(--bg-primary);
      border: 2px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-3xl);
    }
    
    .empty-glyph {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
      opacity: 0.7;
    }

    .empty-state h3 { 
      margin: 0 0 8px 0; 
      font-family: var(--font-heading); 
      font-size: var(--font-size-xl); 
      color: var(--text-primary); 
    }
    
    .empty-state p { 
      margin: 0; 
      font-size: var(--font-size-sm); 
      color: var(--text-secondary); 
    }
  `]
})
export class WorkforceStatsComponent {
  @Input() stats: any = null;
  @Input() columns: any[] = [];
}