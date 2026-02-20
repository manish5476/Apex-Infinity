import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map, finalize } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';


@Component({
  selector: 'app-shift-details',
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
          
          @if (shift(); as sh) {
            <div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <h1 class="page-title">{{ sh.name }}</h1>
                <span class="status-badge" [class.active]="sh.isActive" [class.inactive]="!sh.isActive">
                  {{ sh.isActive ? 'Active' : 'Inactive' }}
                </span>
                @if (sh.isNightShift) {
                  <span class="badge badge-night"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Night Shift</span>
                }
              </div>
              <p class="page-subtitle">{{ sh.code }} • {{ sh.shiftType | titlecase }} Shift</p>
            </div>
          } @else if (!isLoading()) {
            <div>
              <h1 class="page-title">Shift Not Found</h1>
            </div>
          }
        </div>
        
        <div class="header-right">
          <button type="button" class="btn btn-outline" (click)="goBack()">Close</button>
          @if (shift()) {
            <button type="button" class="btn btn-primary" (click)="editShift()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit Shift
            </button>
          }
        </div>
      </header>

      <main class="dashboard-content">
        
        @if (isLoading()) {
          <div class="loading-state-full">
            <div class="spinner"></div>
            <p>Loading Shift Details...</p>
          </div>
        } 
        
        @if (shift(); as sh) {
          <div class="bento-grid">
            
            <div class="grid-card span-2 card-anim-1" style="border-color: var(--color-primary);">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
                <h2 class="card-title">Schedule Overview</h2>
              </div>
              <div class="card-body">
                
                <div class="timing-block">
                  <div class="time-node">
                    <span class="time-label">Start Time</span>
                    <span class="time-value">{{ sh.startTime }}</span>
                  </div>
                  <div class="time-connector">
                    <div class="connector-line"></div>
                    <span class="duration-badge">{{ sh.duration || 'Shift Duration' }}</span>
                    @if (sh.crossesMidnight) {
                      <span class="detail-text" style="font-size: 0.65rem; color: var(--color-warning); position: absolute; top: 18px;">+1 Day</span>
                    }
                  </div>
                  <div class="time-node">
                    <span class="time-label">End Time</span>
                    <span class="time-value">{{ sh.endTime }}</span>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="inner-grid-3">
                  <div class="info-group">
                    <label>Break Duration</label>
                    <p class="detail-text bold">{{ sh.breakDurationMins }} Minutes</p>
                  </div>
                  <div class="info-group">
                    <label>Effective From</label>
                    <p class="detail-text">{{ sh.effectiveFrom ? (sh.effectiveFrom | date) : 'Always Active' }}</p>
                  </div>
                  <div class="info-group">
                    <label>Description</label>
                    <p class="detail-text">{{ sh.description || 'No description provided.' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-card card-anim-2">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                <h2 class="card-title">Weekly Schedule</h2>
              </div>
              <div class="card-body flex-col">
                <div class="info-group">
                  <label>Weekly Off Days</label>
                  <div class="tags-container mt-1">
                    @if (sh.weeklyOffs && sh.weeklyOffs.length > 0) {
                      @for (day of getFormattedDays(sh.weeklyOffs); track day) {
                        <span class="tag tag-gray">{{ day }}</span>
                      }
                    } @else {
                      <span class="detail-text">No weekly offs configured.</span>
                    }
                  </div>
                </div>

                <div class="divider"></div>

                <div class="info-group">
                  <label>Applicable Working Days</label>
                  <div class="tags-container mt-1">
                    @if (sh.applicableDays && sh.applicableDays.length > 0) {
                      @for (day of getFormattedDays(sh.applicableDays); track day) {
                        <span class="tag tag-blue">{{ day }}</span>
                      }
                    } @else {
                      <span class="detail-text">Applies to all working days.</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-card card-anim-3">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
                <h2 class="card-title">Attendance Policy</h2>
              </div>
              <div class="card-body flex-col">
                <div class="inner-grid-2">
                  <div class="info-group">
                    <label>Grace Period</label>
                    <p class="detail-text bold">{{ sh.gracePeriodMins }} Mins</p>
                  </div>
                  <div class="info-group">
                    <label>Late Mark After</label>
                    <p class="detail-text bold color-error">{{ sh.lateThresholdMins }} Mins</p>
                  </div>
                </div>
                
                <div class="info-group">
                  <label>Early Departure Penalty After</label>
                  <p class="detail-text bold color-error">{{ sh.earlyDepartureThresholdMins }} Mins</p>
                </div>

                <div class="divider"></div>

                <div class="inner-grid-2">
                  <div class="info-group">
                    <label>Half Day Threshold</label>
                    <p class="detail-text">{{ sh.halfDayThresholdHrs }} Hrs</p>
                  </div>
                  <div class="info-group">
                    <label>Full Day Threshold</label>
                    <p class="detail-text">{{ sh.minFullDayHrs }} Hrs</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-card card-anim-4">
              <div class="card-header">
                <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
                <h2 class="card-title">Overtime Rules</h2>
              </div>
              <div class="card-body flex-col">
                @if (sh.overtimeRules?.enabled) {
                  <span class="status-badge success mb-2" style="width: fit-content;">Overtime Enabled</span>
                  
                  <div class="inner-grid-2">
                    <div class="info-group">
                      <label>Standard OT</label>
                      <p class="detail-text bold">{{ sh.overtimeRules.multiplier }}x</p>
                    </div>
                    <div class="info-group">
                      <label>Holiday OT</label>
                      <p class="detail-text bold">{{ sh.overtimeRules.holidayMultiplier }}x</p>
                    </div>
                  </div>

                  <div class="divider"></div>

                  <div class="inner-grid-2">
                    <div class="info-group">
                      <label>Eligible After</label>
                      <p class="detail-text">{{ sh.overtimeRules.afterHours }} Hrs</p>
                    </div>
                    <div class="info-group">
                      <label>Double OT After</label>
                      <p class="detail-text">{{ sh.overtimeRules.doubleAfterHours }} Hrs</p>
                    </div>
                  </div>
                  
                  <div class="info-group mt-2">
                    <label>Max Overtime Limit</label>
                    <p class="detail-text">{{ sh.maxOvertimeHrs }} Hrs / Day</p>
                  </div>
                } @else {
                  <div class="empty-state-inline" style="padding: 1rem;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    <p>Overtime is disabled for this shift.</p>
                  </div>
                }
              </div>
            </div>

            @if (sh.shiftType === 'flexi' && sh.flexiConfig) {
              <div class="grid-card card-anim-5" style="border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 2%, var(--component-bg));">
                <div class="card-header">
                  <div class="card-icon" style="color: var(--color-success);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>
                  <h2 class="card-title">Flexi-Time Boundaries</h2>
                </div>
                <div class="card-body flex-col">
                  
                  <div class="info-group">
                    <label>Core Hours (Mandatory Presence)</label>
                    <p class="detail-text bold">{{ sh.flexiConfig.coreStartTime || 'N/A' }} — {{ sh.flexiConfig.coreEndTime || 'N/A' }}</p>
                  </div>

                  <div class="divider"></div>

                  <div class="inner-grid-2">
                    <div class="info-group">
                      <label>Flexi Start Band</label>
                      <p class="detail-text">{{ sh.flexiConfig.flexibleBandStart || 'N/A' }}</p>
                    </div>
                    <div class="info-group">
                      <label>Flexi End Band</label>
                      <p class="detail-text">{{ sh.flexiConfig.flexibleBandEnd || 'N/A' }}</p>
                    </div>
                  </div>

                  <div class="info-group mt-2">
                    <label>Minimum Required Hours</label>
                    <p class="detail-text bold color-success">{{ sh.flexiConfig.minHoursPerDay || 0 }} Hrs / Day</p>
                  </div>

                </div>
              </div>
            }

          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE THEME & LAYOUT
       ========================================================================== */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); }
    
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 4px 0 0 0; }
    
    /* Buttons */
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
    .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:hover { background: var(--component-surface-raised); border-color: var(--border-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover { background: var(--color-primary-dark); }

    /* Main Content Grid */
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); position: relative; }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
    .span-2 { grid-column: span 2; }
    
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; }
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); margin-bottom: var(--spacing-md); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    
    .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .inner-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); }

    /* Visual Timing Block */
    .timing-block { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-lg) var(--spacing-xl); background: var(--component-surface-raised); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); margin-bottom: var(--spacing-md); }
    .time-node { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .time-label { font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-tertiary); letter-spacing: 0.05em; }
    .time-value { font-size: 2rem; font-family: var(--font-mono, monospace); font-weight: var(--font-weight-bold); color: var(--text-primary); line-height: 1; }
    
    .time-connector { flex: 1; margin: 0 var(--spacing-xl); display: flex; justify-content: center; align-items: center; position: relative; }
    .connector-line { width: 100%; height: 2px; background: var(--border-primary); border-radius: 2px; }
    .duration-badge { position: absolute; background: var(--bg-primary); padding: 2px 12px; border-radius: 999px; border: 1px solid var(--border-primary); font-size: 0.75rem; font-weight: var(--font-weight-semibold); color: var(--text-secondary); }

    /* Detail Typography & Elements */
    .info-group { display: flex; flex-direction: column; gap: 6px; }
    .info-group label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .detail-text { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0; line-height: 1.5; }
    .detail-text.bold { font-weight: var(--font-weight-semibold); }
    .color-primary { color: var(--color-primary); }
    .color-error { color: var(--color-error); }
    .color-success { color: var(--color-success); }
    .color-warning { color: #d97706; }
    .empty-text { font-size: var(--font-size-sm); color: var(--text-tertiary); font-style: italic; margin: 0; }
    
    .divider { height: 1px; background: var(--border-primary); margin: var(--spacing-xs) 0; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mb-2 { margin-bottom: 8px; }

    /* Badges & Tags */
    .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.active { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
    .status-badge.inactive { background: color-mix(in srgb, var(--text-tertiary) 15%, transparent); color: var(--text-tertiary); }
    .status-badge.success { background: #ecfdf5; color: #15803d; border: 1px solid #bbf7d0; }

    .badge { padding: 4px 10px; border-radius: 999px; font-size: 0.6875rem; font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; display: inline-flex; align-items: center; }
    .badge-night { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }

    .tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: var(--font-weight-medium); border: 1px solid transparent; }
    .tag-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .tag-gray { background: var(--bg-secondary); color: var(--text-secondary); border-color: var(--border-secondary); }

    /* States */
    .empty-state-inline { display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); text-align: center; gap: 8px; border: 1px dashed var(--border-secondary); border-radius: var(--ui-border-radius-lg); background: var(--bg-primary); }
    .loading-state-full { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-primary); gap: 12px; color: var(--text-secondary); z-index: 10; font-size: var(--font-size-sm); }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } 
    .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } 
    .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } 
    .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; }
    .card-anim-5 { animation: popIn 0.4s ease-out 0.25s both; }
    
    /* Responsive Grid */
    @media (max-width: 1024px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2 { grid-column: span 2; }
    }
    @media (max-width: 768px) {
      .bento-grid { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .inner-grid-2, .inner-grid-3 { grid-template-columns: 1fr; }
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
      .header-right { justify-content: flex-end; }
      .timing-block { flex-direction: column; gap: 24px; padding: var(--spacing-md); }
      .time-connector { width: 100%; margin: 0; }
      .connector-line { width: 2px; height: 40px; }
    }
  `]
})
export class ShiftDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  shift = signal<any | null>(null);
  isLoading = signal(true);
  shiftId: string | null = null;

  // Map numbers to human-readable days
  private daysMap: { [key: number]: string } = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday'
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.shiftId = params.get('id');
      if (this.shiftId) {
        this.loadShiftDetails();
      } else {
        this.isLoading.set(false);
        this.messageService.showError('Error', 'Invalid shift ID.');
        this.goBack();
      }
    });
  }

  private loadShiftDetails() {
    this.isLoading.set(true);
    // Using generic .get() based on previous component structure
    this.hrmsService.getShift(this.shiftId).pipe(
      map((res: any) => res?.data?.shift || res?.data?.data || res?.data || res),
      catchError(err => {
        this.messageService.showError('Error', 'Failed to load shift details.');
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(data => {
      if (data) {
        this.shift.set(data);
      } else {
        this.shift.set(null);
      }
    });
  }

  // Helper template method to format arrays of day indices to string names
  getFormattedDays(dayIndices: number[]): string[] {
    if (!dayIndices || !Array.isArray(dayIndices)) return [];
    
    // Sort them 0 to 6 so they appear in order Sunday->Saturday
    const sorted = [...dayIndices].sort((a, b) => a - b);
    return sorted.map(idx => this.daysMap[idx] || `Day ${idx}`);
  }

  editShift() {
    if (this.shiftId) {
      this.router.navigate(['/hrms/shift/edit', this.shiftId]);
    }
  }

  goBack() {
    this.router.navigate(['/hrms/shift/list']);
  }
}
