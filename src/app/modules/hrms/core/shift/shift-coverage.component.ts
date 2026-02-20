import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-coverage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="page-title">Daily Shift Coverage</h1>
            <p class="page-subtitle">Monitor staffing levels and shift timelines for any given day.</p>
          </div>
        </div>
        
        <div class="header-right">
          <div class="date-picker-wrapper">
            <input type="date" [(ngModel)]="selectedDateStr" (change)="loadDashboardData()" class="se-input date-input" />
          </div>
          <button class="icon-btn" (click)="loadDashboardData()" title="Refresh" [class.spinning]="isLoading()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        
        @if (isLoading()) {
          <div class="loading-state-box card-anim-1">
            <div class="spinner"></div>
            <p>Loading coverage and timeline data...</p>
          </div>
        } @else {
          
          <div class="bento-grid">
            
            <div class="grid-card span-3 card-anim-1">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                <h2 class="card-title">24-Hour Timeline</h2>
                <span class="detail-text" style="margin-left: auto; color: var(--text-tertiary);">{{ formattedDate }}</span>
              </div>
              
              <div class="card-body">
                @if (timelineData().length > 0) {
                  <div class="timeline-wrapper">
                    <div class="timeline-scale">
                      @for (hour of [0,3,6,9,12,15,18,21,24]; track hour) {
                        <div class="scale-marker" [style.left.%]="(hour / 24) * 100">
                          <div class="tick"></div>
                          <span class="tick-label">{{ hour === 24 ? '00' : (hour < 10 ? '0'+hour : hour) }}:00</span>
                        </div>
                      }
                    </div>

                    <div class="timeline-tracks">
                      @for (item of timelineData(); track item.shift._id) {
                        <div class="shift-track">
                          <div class="shift-label">{{ item.shift.name }} ({{ item.shift.code || 'SYS' }})</div>
                          <div class="track-bar-container">
                            <div class="shift-bar" 
                                 [style.left.%]="calculateLeft(item.startTime)" 
                                 [style.width.%]="calculateWidth(item.startTime, item.endTime)"
                                 [class.night-bar]="item.isNightShift">
                               <span class="bar-time-text">
                                 {{ item.startTime | date:'HH:mm':'UTC' }} - {{ item.endTime | date:'HH:mm':'UTC' }}
                               </span>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="empty-state-inline">
                    <p>No shifts scheduled for this timeline.</p>
                  </div>
                }
              </div>
            </div>

            <div class="grid-card span-3 card-anim-2">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
                <h2 class="card-title">Staffing Coverage</h2>
              </div>
              
              <div class="card-body">
                <div class="coverage-grid">
                  @if (coverageData().length > 0) {
                    @for (cov of coverageData(); track cov.shift._id) {
                      <div class="coverage-card" [class.inactive-cov]="!cov.isWorkingDay">
                        <div class="cov-header">
                          <h4 class="cov-title">{{ cov.shift.name }}</h4>
                          <span class="badge badge-neutral">{{ cov.shift.startTime }} - {{ cov.shift.endTime }}</span>
                        </div>
                        
                        <div class="cov-body">
                          <div class="cov-stat">
                            <span class="cov-number">{{ cov.assignedUsers }}</span>
                            <span class="cov-label">Assigned Users</span>
                          </div>
                          <div class="cov-status">
                            @if (cov.isWorkingDay) {
                              <span class="status-badge success">Working Day</span>
                            } @else {
                              <span class="status-badge error">Off Day</span>
                            }
                          </div>
                        </div>
                        
                        <div class="cov-footer">
                          <span class="secondary-text">Status: {{ cov.status | titlecase }}</span>
                        </div>
                      </div>
                    }
                  } @else {
                    <div class="empty-state-inline" style="grid-column: 1 / -1;">
                      <p>No coverage data found for this date.</p>
                    </div>
                  }
                </div>
              </div>
            </div>

          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    
    .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); color: var(--text-primary); height: 38px; box-sizing: border-box; outline: none; transition: all 0.2s; }
    .se-input:focus { border-color: var(--color-primary); }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    .icon-btn.spinning svg { animation: spin 1s linear infinite; }

    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); max-width: 1400px; margin: 0 auto; }
    .span-3 { grid-column: span 3; }
    
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; }
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); margin-bottom: var(--spacing-md); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }

    /* TIMELINE STYLES */
    .timeline-wrapper { position: relative; padding-top: 20px; padding-bottom: 10px; }
    .timeline-scale { position: relative; height: 20px; border-bottom: 1px solid var(--border-secondary); margin-left: 150px; margin-bottom: 10px; }
    .scale-marker { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
    .tick { width: 1px; height: 6px; background: var(--text-tertiary); }
    .tick-label { font-size: 0.625rem; color: var(--text-tertiary); font-family: var(--font-mono, monospace); margin-top: 2px; }

    .timeline-tracks { display: flex; flex-direction: column; gap: 8px; }
    .shift-track { display: flex; align-items: center; }
    .shift-label { width: 140px; font-size: 0.75rem; font-weight: var(--font-weight-semibold); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 10px; flex-shrink: 0; }
    .track-bar-container { flex: 1; height: 28px; background: var(--bg-secondary); border-radius: 4px; position: relative; overflow: hidden; border: 1px solid var(--border-secondary); }
    
    .shift-bar { position: absolute; height: 100%; top: 0; background: color-mix(in srgb, var(--color-primary) 80%, transparent); border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; min-width: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); transition: all 0.3s; }
    .shift-bar.night-bar { background: #4f46e5; }
    .bar-time-text { font-size: 0.65rem; color: white; font-weight: var(--font-weight-bold); font-family: var(--font-mono, monospace); white-space: nowrap; padding: 0 4px; }

    /* COVERAGE CARDS */
    .coverage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-lg); }
    .coverage-card { background: var(--component-surface-raised); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-lg); padding: var(--spacing-lg); display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s; }
    .coverage-card:hover { border-color: var(--color-primary); }
    .coverage-card.inactive-cov { opacity: 0.6; filter: grayscale(80%); }
    
    .cov-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .cov-title { font-size: var(--font-size-md); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
    .cov-body { display: flex; justify-content: space-between; align-items: center; background: var(--bg-primary); padding: 12px; border-radius: var(--ui-border-radius); border: 1px dashed var(--border-secondary); }
    .cov-stat { display: flex; flex-direction: column; align-items: flex-start; }
    .cov-number { font-size: 1.75rem; font-weight: var(--font-weight-bold); color: var(--color-primary); line-height: 1; }
    .cov-label { font-size: 0.6875rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
    .cov-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-primary); padding-top: 8px; }

    .badge-neutral { background: var(--bg-secondary); color: var(--text-primary); padding: 2px 8px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-semibold); border: 1px solid var(--border-secondary); }
    .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.625rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.success { background: #ecfdf5; color: #15803d; border: 1px solid #bbf7d0; }
    .status-badge.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .secondary-text { color: var(--text-tertiary); font-size: 0.75rem; }

    .empty-state-inline { display: flex; justify-content: center; padding: 2rem; color: var(--text-tertiary); border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius-lg); }
    .loading-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 4rem; color: var(--text-secondary); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.3s ease-out both; }
    .card-anim-2 { animation: popIn 0.3s ease-out 0.1s both; }
    
    @media (max-width: 768px) {
      .shift-label { width: 80px; font-size: 0.65rem; }
      .timeline-scale { margin-left: 90px; }
      .bar-time-text { font-size: 0.5rem; }
    }
  `]
})
export class ShiftCoverageComponent implements OnInit {
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private datePipe = inject(DatePipe);

  // State
  selectedDateStr: string = new Date().toISOString().split('T')[0];
  isLoading = signal(false);
  
  coverageData = signal<any[]>([]);
  timelineData = signal<any[]>([]);

  get formattedDate() {
    return this.datePipe.transform(this.selectedDateStr, 'fullDate');
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    const targetDate = new Date(this.selectedDateStr);

    // Call both endpoints simultaneously
    // Assumes getShiftTimeline exists in service returning the timeline JSON structure
    forkJoin({
      coverage: this.hrmsService.getShiftCoverage(targetDate),
      timeline: this.hrmsService.getShiftTimeline({ date: this.selectedDateStr }) // Adjust path/method if needed
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (res: any) => {
        // Map coverage array
        const covArray = res.coverage?.data?.coverage || [];
        this.coverageData.set(covArray);

        // Map timeline array
        const timeArray = res.timeline?.data?.timeline || [];
        this.timelineData.set(timeArray);
      },
      error: () => {
        this.messageService.showError('Error', 'Failed to load shift dashboard data.');
      }
    });
  }

  // --- Visual Timeline Calculators ---
  // Calculates CSS 'left' percentage based on the 24-hour scale
  calculateLeft(startTimeIso: string): number {
    const d = new Date(startTimeIso);
    // Using UTC to avoid local timezone offset messing up the visual scale if the server sends absolute UTC times
    const mins = d.getUTCHours() * 60 + d.getUTCMinutes(); 
    return (mins / 1440) * 100;
  }

  // Calculates CSS 'width' percentage
  calculateWidth(startTimeIso: string, endTimeIso: string): number {
    const start = new Date(startTimeIso);
    const end = new Date(endTimeIso);
    
    let startMins = start.getUTCHours() * 60 + start.getUTCMinutes();
    let endMins = end.getUTCHours() * 60 + end.getUTCMinutes();
    
    // Handle cross-midnight shifts (e.g., 22:00 to 06:00 next day)
    if (endMins < startMins) {
      endMins += 1440; 
    }
    
    const durationMins = endMins - startMins;
    return (durationMins / 1440) * 100;
  }

  goBack() {
    this.router.navigate(['/hrms/shifts/list']);
  }
}
