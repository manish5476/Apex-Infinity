import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, Subject } from 'rxjs';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '../../../../core/services/message.service';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-machine-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <div class="icon-brand" style="background: var(--color-primary); color: white;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
          <div>
            <h1 class="page-title">Hardware Analytics</h1>
            <p class="page-subtitle">Ecosystem health, transaction volume, and error rates.</p>
          </div>
        </div>
        <div class="header-right">
          <div class="select-wrapper">
            <select [(ngModel)]="filterDays" (change)="loadAnalytics()" class="se-input">
              <option [ngValue]="7">Last 7 Days</option>
              <option [ngValue]="15">Last 15 Days</option>
              <option [ngValue]="30">Last 30 Days</option>
            </select>
          </div>
          <button class="icon-btn" (click)="loadAnalytics()" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        @if (isLoading()) {
          <div class="loading-state-box card-anim-1">
            <div class="spinner"></div>
            <p>Crunching hardware data...</p>
          </div>
        } @else if (analytics(); as data) {
          <div class="bento-grid">
            
            <div class="grid-card stat-card card-anim-1 success-tint">
              <div class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line></svg></div>
              <div class="stat-content">
                <span class="stat-label">Total Active Devices</span>
                <span class="stat-value">{{ data.totalActiveMachines || 0 }}</span>
              </div>
            </div>

            <div class="grid-card stat-card card-anim-2 primary-tint">
              <div class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg></div>
              <div class="stat-content">
                <span class="stat-label">Total Transactions</span>
                <span class="stat-value">{{ data.totalTransactions | number }}</span>
              </div>
            </div>

            <div class="grid-card stat-card card-anim-3 error-tint">
              <div class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>
              <div class="stat-content">
                <span class="stat-label">Offline Devices</span>
                <span class="stat-value">{{ data.offlineMachines || 0 }}</span>
              </div>
            </div>

            <div class="grid-card span-2 card-anim-4">
              <h2 class="card-title mb-3">Verification Success Rate</h2>
              <div class="progress-bar-container">
                @let total = (data.successfulReads || 0) + (data.failedReads || 0);
                @let successPct = total > 0 ? ((data.successfulReads / total) * 100).toFixed(1) : 100;
                @let failPct = total > 0 ? ((data.failedReads / total) * 100).toFixed(1) : 0;
                
                <div class="progress-bar">
                  <div class="progress-fill success" [style.width.%]="successPct"></div>
                  <div class="progress-fill error" [style.width.%]="failPct"></div>
                </div>
                <div class="progress-labels">
                  <span style="color: #15803d; font-weight: 600;">{{ successPct }}% Success ({{ data.successfulReads || 0 }})</span>
                  <span style="color: #b91c1c; font-weight: 600;">{{ failPct }}% Failed ({{ data.failedReads || 0 }})</span>
                </div>
              </div>
            </div>

            <div class="grid-card card-anim-5" style="border-color: #fecaca;">
              <h2 class="card-title mb-3" style="color: #b91c1c;">Devices Requiring Attention</h2>
              <div class="error-list">
                @if (data.offlineDeviceList && data.offlineDeviceList.length > 0) {
                  @for (dev of data.offlineDeviceList; track dev._id) {
                    <div class="error-item">
                      <div class="ei-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg></div>
                      <div class="ei-content">
                        <span class="ei-name">{{ dev.name }}</span>
                        <span class="ei-meta">Last Ping: {{ dev.lastPingAt ? (dev.lastPingAt | date:'short') : 'Unknown' }}</span>
                      </div>
                    </div>
                  }
                } @else {
                  <p class="secondary-text" style="text-align: center; margin-top: 20px;">All monitored devices are currently online.</p>
                }
              </div>
            </div>

          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); border-bottom: 1px solid var(--border-primary); }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-brand { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .page-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
    .page-subtitle { font-size: 0.75rem; color: var(--text-secondary); margin: 0; }
    
    .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: 4px; padding: 0.4rem 0.6rem; font-size: 0.875rem; color: var(--text-primary); outline: none; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
    .icon-btn { background: var(--component-bg); border: 1px solid var(--border-primary); color: var(--text-secondary); width: 34px; height: 34px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .icon-btn.spinning svg { animation: spin 1s linear infinite; }

    .dashboard-content { flex: 1; padding: var(--spacing-xl); overflow-y: auto; background: var(--bg-primary); }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); max-width: 1400px; margin: 0 auto; }
    .span-2 { grid-column: span 2; }
    
    .grid-card { background: var(--component-bg); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; }
    .card-title { font-size: 1rem; font-weight: 600; margin: 0; }
    .mb-3 { margin-bottom: 16px; }

    /* STAT CARDS */
    .stat-card { flex-direction: row; align-items: center; gap: 16px; padding: 24px; border-left: 4px solid transparent; }
    .stat-card.success-tint { border-left-color: #10b981; background: color-mix(in srgb, #10b981 3%, var(--component-bg)); }
    .stat-card.primary-tint { border-left-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 3%, var(--component-bg)); }
    .stat-card.error-tint { border-left-color: #ef4444; background: color-mix(in srgb, #ef4444 3%, var(--component-bg)); }
    
    .stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-secondary); }
    .stat-card.success-tint .stat-icon { color: #10b981; border-color: #a7f3d0; }
    .stat-card.primary-tint .stat-icon { color: var(--color-primary); border-color: var(--color-primary); }
    .stat-card.error-tint .stat-icon { color: #ef4444; border-color: #fecaca; }

    .stat-content { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.5px; }
    .stat-value { font-size: 2rem; font-weight: 700; font-family: monospace; color: var(--text-primary); line-height: 1.2; }

    /* PROGRESS BAR */
    .progress-bar-container { padding: 10px 0; }
    .progress-bar { width: 100%; height: 24px; background: var(--bg-secondary); border-radius: 12px; display: flex; overflow: hidden; margin-bottom: 12px; }
    .progress-fill.success { background: #10b981; transition: width 0.5s ease; }
    .progress-fill.error { background: #ef4444; transition: width 0.5s ease; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 0.8rem; font-family: monospace; }

    /* ERROR LIST */
    .error-list { display: flex; flex-direction: column; gap: 8px; }
    .error-item { display: flex; gap: 12px; align-items: center; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; }
    .ei-icon { color: #b91c1c; }
    .ei-content { display: flex; flex-direction: column; }
    .ei-name { font-weight: 600; font-size: 0.875rem; color: #7f1d1d; line-height: 1; }
    .ei-meta { font-size: 0.7rem; color: #b91c1c; margin-top: 4px; font-family: monospace; }
    
    .loading-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 4rem; color: var(--text-secondary); }
    .secondary-text { color: var(--text-tertiary); font-size: 0.8rem; }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.3s ease-out both; }
    .card-anim-2 { animation: popIn 0.3s ease-out 0.1s both; }
    .card-anim-3 { animation: popIn 0.3s ease-out 0.15s both; }
    .card-anim-4 { animation: popIn 0.3s ease-out 0.2s both; }
    .card-anim-5 { animation: popIn 0.3s ease-out 0.25s both; }

    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
    }
  `]
})
export class MachineAnalyticsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  filterDays: number = 7;
  analytics = signal<any | null>(null);

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.isLoading.set(true);
    this.hrmsService.getMachineAnalytics(this.filterDays).pipe(
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        // Unwraps JSON based on standard data object hierarchy
        this.analytics.set(res.data?.analytics || res.data || null);
      },
      error: (err) => this.messageService.handleHttpError(err)
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}