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
          <div class="stat-card border-top-primary">
            <div class="stat-icon primary"><i class="pi pi-building"></i></div>
            <div class="stat-content">
              <span class="stat-label">Total Departments</span>
              <span class="stat-value">{{ stats.totalDepartments | number }}</span>
            </div>
          </div>
          
          <div class="stat-card border-top-success">
            <div class="stat-icon success"><i class="pi pi-users"></i></div>
            <div class="stat-content">
              <span class="stat-label">Total Workforce</span>
              <span class="stat-value">{{ stats.totalEmployees | number }}</span>
            </div>
          </div>

          <div class="stat-card border-top-info">
            <div class="stat-icon info"><i class="pi pi-chart-line"></i></div>
            <div class="stat-content">
              <span class="stat-label">Avg. Headcount</span>
              <span class="stat-value">{{ stats.avgEmployeesPerDept | number:'1.0-1' }}</span>
            </div>
          </div>
        </div>

        <!-- Department Grid Card -->
        <div class="premium-card grid-card">
          <div class="card-header">
            <span>Department Breakdown</span>
            <p-tag severity="info" value="Live Data" [rounded]="true"></p-tag>
          </div>
          
          <div class="card-body p-0">
            <div class="grid-wrapper">
              <app-ag-share-grid 
                [columns]="columns" 
                [data]="stats.departments" 
                [showActions]="false"
                selectionMode="single">
              </app-ag-share-grid>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <i class="pi pi-database"></i>
          <p>No statistics available</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
      height: 100%;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-xl);
    }
    .grid-card {
      flex: 1;
      min-height: 400px;
      display: flex;
      flex-direction: column;
    }
    .card-body.p-0 { padding: 0; }
    .grid-wrapper {
      height: 400px;
      width: 100%;
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 400px; color: var(--text-tertiary);
      background: var(--bg-primary);
      border: 2px dashed var(--border-secondary);
      border-radius: var(--ui-border-radius-lg);
      i { font-size: 3rem; margin-bottom: var(--spacing-md); }
      p { margin: 0; font-size: var(--font-size-md); }
    }
  `]
})
export class WorkforceStatsComponent {
  @Input() stats: any = null;
  @Input() columns: any[] = [];
}