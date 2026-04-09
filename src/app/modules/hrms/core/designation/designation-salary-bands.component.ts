import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-designation-salary-bands',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="page-title">Salary Bands & Market Rates</h1>
            <p class="page-subtitle">Compare internal compensation ranges against market benchmarks.</p>
          </div>
        </div>
        
        <div class="header-right">
          <button class="icon-btn" (click)="loadSalaryBands()" title="Refresh Data" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="grid-card table-card card-anim-1">
          
          <div class="table-container" [class.loading-opacity]="isLoading()">
            <table class="se-table">
              <thead>
                <tr>
                  <th>Level / Grade</th>
                  <th>Roles & Headcount</th>
                  <th>Internal Band (INR)</th>
                  <th>Market Benchmark (INR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              
              <tbody>
                @if (bandsData().length === 0 && !isLoading()) {
                  <tr>
                    <td colspan="5" class="empty-state">
                      <p>No salary band data available.</p>
                    </td>
                  </tr>
                }

                @for (band of bandsData(); track band._id.level + band._id.grade) {
                  <tr>
                    <td>
                      <div class="badge-group">
                        <span class="badge badge-outline">Level {{ band._id.level }}</span>
                        <span class="badge badge-neutral">Grade {{ band._id.grade }}</span>
                      </div>
                    </td>
                    
                    <td>
                      <div class="primary-text">{{ band.designations.length }} Designations</div>
                      <div class="secondary-text">{{ band.count }} Total Headcount</div>
                      <div class="tags-container" style="margin-top: 4px;">
                        @for(role of band.designations; track role.code) {
                          <span class="tag-micro" title="{{role.title}}">{{ role.code }}</span>
                        }
                      </div>
                    </td>
                    
                    <td>
                      <div class="salary-block">
                        <span class="salary-range">{{ band.minSalary | number }} - {{ band.maxSalary | number }}</span>
                        <span class="salary-avg">Avg: {{ band.avgSalary | number }}</span>
                      </div>
                    </td>
                    
                    <td>
                      @if (getMarketRate(band._id.grade); as market) {
                        <div class="salary-block">
                          <span class="salary-range">{{ market.min | number }} - {{ market.max | number }}</span>
                        </div>
                      } @else {
                        <span class="secondary-text">No market data</span>
                      }
                    </td>

                    <td>
                      @if (getMarketRate(band._id.grade); as market) {
                        @if (band.avgSalary < market.min) {
                          <span class="status-badge error">Below Market</span>
                        } @else if (band.avgSalary > market.max) {
                          <span class="status-badge warning">Above Market</span>
                        } @else {
                          <span class="status-badge success">In Range</span>
                        }
                      } @else {
                        <span class="secondary-text">-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          
          @if (isLoading() && bandsData().length === 0) {
            <div class="loading-state-full">
              <div class="spinner"></div>
              <p>Loading Salary Bands...</p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* Standard Layout */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    .icon-btn.spinning svg { animation: spin 1s linear infinite; }
    
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); }
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); max-width: 1400px; margin: 0 auto; position: relative; }
    .table-card { padding: 0; overflow: hidden; min-height: 400px; }

    /* Table Styles */
    .table-container { width: 100%; overflow-x: auto; transition: opacity 0.3s; }
    .se-table { width: 100%; border-collapse: collapse; text-align: left; font-size: var(--font-size-sm); }
    .se-table th { padding: 16px; background: var(--component-surface-raised); color: var(--text-secondary); font-weight: var(--font-weight-semibold); text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.6875rem; border-bottom: 1px solid var(--border-primary); white-space: nowrap; }
    .se-table td { padding: 16px; border-bottom: 1px solid var(--border-secondary); vertical-align: top; }
    .se-table tr:hover td { background: color-mix(in srgb, var(--component-surface-raised) 50%, transparent); }
    .se-table tr:last-child td { border-bottom: none; }
    
    .primary-text { font-weight: var(--font-weight-bold); color: var(--text-primary); margin-bottom: 2px; }
    .secondary-text { color: var(--text-tertiary); font-size: 0.75rem; }

    /* Typography & Elements */
    .salary-block { display: flex; flex-direction: column; gap: 4px; }
    .salary-range { font-family: var(--font-mono, monospace); font-size: 0.875rem; font-weight: var(--font-weight-semibold); color: var(--text-primary); }
    .salary-avg { font-family: var(--font-mono, monospace); font-size: 0.75rem; color: var(--text-secondary); }

    .badge-group { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-semibold); }
    .badge-outline { border: 1px solid var(--border-primary); color: var(--color-primary); }
    .badge-neutral { background: var(--bg-secondary); color: var(--text-primary); }

    .tags-container { display: flex; flex-wrap: wrap; gap: 4px; }
    .tag-micro { font-family: var(--font-mono, monospace); font-size: 0.625rem; background: var(--border-secondary); color: var(--text-secondary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-primary); }

    .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.success { background: #ecfdf5; color: #15803d; border: 1px solid #bbf7d0; }
    .status-badge.warning { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .status-badge.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .loading-opacity { opacity: 0.4; pointer-events: none; }
    .empty-state { text-align: center; padding: 4rem 1rem !important; color: var(--text-tertiary); }
    .loading-state-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: color-mix(in srgb, var(--bg-primary) 80%, transparent); gap: 12px; color: var(--text-secondary); z-index: 10; font-size: var(--font-size-sm); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out both; }
  `]
})
export class DesignationSalaryBandsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  
  bandsData = signal<any[]>([]);
  marketRates = signal<any>({});

  ngOnInit() {
    this.loadSalaryBands();
  }

  loadSalaryBands() {
    this.isLoading.set(true);
    
    this.hrmsService.getSalaryBands().pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        // Based on JSON: res.data.internal and res.data.marketRates
        const data = res?.data?.data || res?.data;
        
        if (data) {
          // Sort internal bands primarily by Level, then by Grade
          const internalBands = (data.internal || []).sort((a: any, b: any) => {
            if (a._id.level === b._id.level) {
              return a._id.grade.localeCompare(b._id.grade);
            }
            return a._id.level - b._id.level;
          });

          this.bandsData.set(internalBands);
          this.marketRates.set(data.marketRates || {});
        }
      },
      error: (err) => {
        this.messageService.handleHttpError(err)
      }
    });
  }

  // Helper method to retrieve market rate dynamically by grade letter
  getMarketRate(grade: string) {
    return this.marketRates()[grade] || null;
  }

  goBack() {
    this.router.navigate(['/hrms/designation/list']);
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
