import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="page-title">{{ isEditMode() ? 'Edit Shift' : 'Create Shift' }}</h1>
            <p class="page-subtitle">Configure working hours, rules, and overtime policies.</p>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-status" [class.valid]="shiftForm.valid">
            <div class="status-dot"></div>
            <span>{{ shiftForm.valid ? 'Ready' : 'Draft' }}</span>
          </div>
          <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || shiftForm.invalid" (click)="onSubmit()">
            <ng-container *ngIf="!isSubmitting(); else loadingState">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              <span>{{ isEditMode() ? 'Update' : 'Save' }}</span>
            </ng-container>
            <ng-template #loadingState>
              <div class="spinner"></div>
              <span>{{ isEditMode() ? 'Updating' : 'Saving' }}</span>
            </ng-template>
          </button>
        </div>
      </header>

      <main class="dashboard-content" [class.loading-opacity]="isLoading()">
        <form [formGroup]="shiftForm" class="bento-grid">
          
          <div class="grid-card span-2 card-anim-1">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
              <h2 class="card-title">Basic Info & Timing</h2>
            </div>
            
            <div class="card-body">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="name">Shift Name <span class="required">*</span></label>
                  <input id="name" type="text" formControlName="name" class="se-input" placeholder="e.g. Morning Shift">
                </div>

                <div class="form-field">
                  <label for="code">Shift Code <span class="required">*</span></label>
                  <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. MOR-01">
                </div>

                <div class="form-field">
                  <label for="shiftType">Shift Type</label>
                  <div class="select-wrapper">
                    <select id="shiftType" formControlName="shiftType" class="se-input">
                      <option value="fixed">Fixed</option>
                      <option value="rotating">Rotating</option>
                      <option value="flexi">Flexible</option>
                      <option value="split">Split</option>
                      <option value="night">Night</option>
                    </select>
                  </div>
                </div>

                <div class="form-field">
                  <label for="breakDurationMins">Break Duration (Mins)</label>
                  <input id="breakDurationMins" type="number" formControlName="breakDurationMins" class="se-input" min="0" placeholder="60">
                </div>

                <div class="form-field">
                  <label for="startTime">Start Time <span class="required">*</span></label>
                  <input id="startTime" type="time" formControlName="startTime" class="se-input">
                </div>

                <div class="form-field">
                  <label for="endTime">End Time <span class="required">*</span></label>
                  <input id="endTime" type="time" formControlName="endTime" class="se-input">
                </div>

                <div class="form-field span-2-inner">
                  <label for="description">Description</label>
                  <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief details about this shift..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-2">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
              <h2 class="card-title">Attendance Rules</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="gracePeriodMins">Grace Period (Mins)</label>
                  <input id="gracePeriodMins" type="number" formControlName="gracePeriodMins" class="se-input" min="0" placeholder="15">
                </div>
                <div class="form-field">
                  <label for="lateThresholdMins">Late Mark After (Mins)</label>
                  <input id="lateThresholdMins" type="number" formControlName="lateThresholdMins" class="se-input" min="0" placeholder="30">
                </div>
              </div>

              <div class="form-field">
                <label for="earlyDepartureThresholdMins">Early Departure Penalty After (Mins)</label>
                <input id="earlyDepartureThresholdMins" type="number" formControlName="earlyDepartureThresholdMins" class="se-input" min="0" placeholder="15">
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="halfDayThresholdHrs">Half Day (Hrs)</label>
                  <input id="halfDayThresholdHrs" type="number" formControlName="halfDayThresholdHrs" class="se-input" min="0" step="0.5" placeholder="4">
                </div>
                <div class="form-field">
                  <label for="minFullDayHrs">Full Day (Hrs)</label>
                  <input id="minFullDayHrs" type="number" formControlName="minFullDayHrs" class="se-input" min="0" step="0.5" placeholder="8">
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-3">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
              <h2 class="card-title">Weekly Schedule</h2>
            </div>
            
            <div class="card-body flex-col">
              
              <div class="form-field">
                <label for="weeklyOffs">Weekly Off Days</label>
                <select id="weeklyOffs" formControlName="weeklyOffs" multiple class="se-input" style="height: 100px; padding: 0.5rem;">
                  @for (day of daysOfWeek; track day.val) {
                    <option [value]="day.val" style="padding: 4px; margin-bottom: 2px;">{{ day.name }}</option>
                  }
                </select>
                <span class="detail-text" style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 2px;">Hold Ctrl/Cmd to select multiple. Defaults to Sunday.</span>
              </div>

              <div class="form-field mt-2">
                <label for="applicableDays">Applicable Days</label>
                <select id="applicableDays" formControlName="applicableDays" multiple class="se-input" style="height: 100px; padding: 0.5rem;">
                  @for (day of daysOfWeek; track day.val) {
                    <option [value]="day.val" style="padding: 4px; margin-bottom: 2px;">{{ day.name }}</option>
                  }
                </select>
                <span class="detail-text" style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 2px;">Leave empty to apply to all working days.</span>
              </div>

            </div>
          </div>

          <div class="grid-card card-anim-4" formGroupName="overtimeRules">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div>
              <h2 class="card-title">Overtime Policy</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="status-toggle-wrapper" style="margin-top: 0; margin-bottom: var(--spacing-sm);">
                <label class="toggle-container">
                  <input type="checkbox" formControlName="enabled" class="toggle-input">
                  <span class="toggle-slider"></span>
                  <div class="toggle-text"><span class="toggle-label">Enable Overtime</span></div>
                </label>
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="multiplier">Standard OT Multiplier</label>
                  <input id="multiplier" type="number" formControlName="multiplier" class="se-input" step="0.1" placeholder="1.5">
                </div>
                <div class="form-field">
                  <label for="holidayMultiplier">Holiday OT Multiplier</label>
                  <input id="holidayMultiplier" type="number" formControlName="holidayMultiplier" class="se-input" step="0.1" placeholder="2.0">
                </div>
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="afterHours">OT After (Hrs)</label>
                  <input id="afterHours" type="number" formControlName="afterHours" class="se-input" placeholder="8">
                </div>
                <div class="form-field">
                  <label for="doubleAfterHours">Double OT After (Hrs)</label>
                  <input id="doubleAfterHours" type="number" formControlName="doubleAfterHours" class="se-input" placeholder="12">
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-5" formGroupName="flexiConfig" [class.disabled-card]="shiftForm.get('shiftType')?.value !== 'flexi'">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>
              <h2 class="card-title">Flexi-Time Setup</h2>
            </div>
            
            <div class="card-body flex-col">
              <span class="detail-text" style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">Only applies if Shift Type is set to "Flexible".</span>
              
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="coreStartTime">Core Start Time</label>
                  <input id="coreStartTime" type="time" formControlName="coreStartTime" class="se-input">
                </div>
                <div class="form-field">
                  <label for="coreEndTime">Core End Time</label>
                  <input id="coreEndTime" type="time" formControlName="coreEndTime" class="se-input">
                </div>
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="flexibleBandStart">Flexi Band Start</label>
                  <input id="flexibleBandStart" type="time" formControlName="flexibleBandStart" class="se-input">
                </div>
                <div class="form-field">
                  <label for="flexibleBandEnd">Flexi Band End</label>
                  <input id="flexibleBandEnd" type="time" formControlName="flexibleBandEnd" class="se-input">
                </div>
              </div>

              <div class="form-field mt-1">
                <label for="minHoursPerDay">Minimum Hours Per Day</label>
                <input id="minHoursPerDay" type="number" formControlName="minHoursPerDay" class="se-input" placeholder="4">
              </div>
            </div>
          </div>

          <div class="grid-card span-3 card-anim-5" style="padding: var(--spacing-md) var(--spacing-lg);">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-md);">
              
              <div style="display: flex; gap: var(--spacing-xl);">
                <div class="form-field">
                  <label for="effectiveFrom">Effective From</label>
                  <input id="effectiveFrom" type="date" formControlName="effectiveFrom" class="se-input" style="width: 200px;">
                </div>
                <div class="form-field">
                  <label for="effectiveTo">Effective To</label>
                  <input id="effectiveTo" type="date" formControlName="effectiveTo" class="se-input" style="width: 200px;">
                </div>
              </div>

              <div class="status-toggle-wrapper" style="border-color: var(--color-primary); margin: 0;">
                <label class="toggle-container">
                  <input type="checkbox" formControlName="isActive" class="toggle-input">
                  <span class="toggle-slider"></span>
                  <div class="toggle-text"><span class="toggle-label">Shift is Active</span></div>
                </label>
              </div>

            </div>
          </div>

        </form>
      </main>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       THEME FALLBACKS & BASE
       ========================================================================== */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .icon-btn:hover { background: var(--component-surface-raised); color: var(--text-primary); border-color: var(--border-secondary); }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    
    .header-status { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--text-secondary); padding: 6px 12px; background: var(--component-surface-raised); border-radius: 999px; border: 1px solid var(--border-primary); margin-right: var(--spacing-md); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success); border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 5%, transparent); }
    .header-status.valid .status-dot { background: var(--color-success); }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
    .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-outline:hover:not(:disabled) { background: var(--component-surface-raised); border-color: var(--border-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); transition: opacity 0.3s; }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
    .span-2 { grid-column: span 2; } .span-2-inner { grid-column: span 2; } .span-3 { grid-column: span 3; }
    
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); transition: var(--transition-base); display: flex; flex-direction: column; gap: var(--spacing-md); }
    .grid-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-md); }
    .disabled-card { opacity: 0.5; pointer-events: none; filter: grayscale(100%); }
    
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    
    .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
    
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.03em; }
    .required { color: var(--color-error); }
    
    .se-input { width: 100%; background: var(--component-bg); border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--text-primary); transition: var(--transition-base); box-sizing: border-box; height: 36px; }
    .se-input::placeholder { color: var(--text-tertiary); }
    .se-input:focus { border-color: var(--component-border-focus); box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color); outline: none; }
    .uppercase-input { text-transform: uppercase; }
    .se-textarea { height: auto; min-height: 60px; resize: vertical; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }

    .select-wrapper { position: relative; } select.se-input:not([multiple]) { appearance: none; padding-right: 2rem; cursor: pointer; }
    .select-wrapper::after { content: ""; position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); width: 8px; height: 5px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; pointer-events: none; }

    .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
    .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
    .toggle-input { display: none; }
    .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
    .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
    .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
    .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }

    .loading-opacity { opacity: 0.5; pointer-events: none; }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; }
    .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; }
    .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; }
    .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; }
    .card-anim-5 { animation: popIn 0.4s ease-out 0.25s both; }

    @media (max-width: 1200px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2, .span-3 { grid-column: span 2; }
    }
    @media (max-width: 768px) {
      .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
      .header-right { justify-content: space-between; }
      .bento-grid { grid-template-columns: 1fr; }
      .span-2, .span-2-inner, .span-3 { grid-column: span 1; }
      .inner-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class ShiftFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  shiftForm!: FormGroup;
  
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  shiftId: string | null = null;

  daysOfWeek = [
    { val: 0, name: 'Sunday' },
    { val: 1, name: 'Monday' },
    { val: 2, name: 'Tuesday' },
    { val: 3, name: 'Wednesday' },
    { val: 4, name: 'Thursday' },
    { val: 5, name: 'Friday' },
    { val: 6, name: 'Saturday' }
  ];

  ngOnInit() {
    this.initForm();
    this.checkEditMode();
  }

  private initForm() {
    this.shiftForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      description: [''],
      
      startTime: ['09:00', [Validators.required]],
      endTime: ['18:00', [Validators.required]],
      breakDurationMins: [60, [Validators.min(0)]],
      
      gracePeriodMins: [15, [Validators.min(0)]],
      lateThresholdMins: [30, [Validators.min(0)]],
      earlyDepartureThresholdMins: [15, [Validators.min(0)]],
      halfDayThresholdHrs: [4, [Validators.min(0)]],
      minFullDayHrs: [8, [Validators.min(0)]],
      maxOvertimeHrs: [4, [Validators.min(0)]],

      shiftType: ['fixed'],
      
      weeklyOffs: [[0]], // Defaults to Sunday
      applicableDays: [[]],

      overtimeRules: this.fb.group({
        enabled: [false],
        multiplier: [1.5],
        afterHours: [8],
        doubleAfterHours: [12],
        holidayMultiplier: [2.0]
      }),

      flexiConfig: this.fb.group({
        coreStartTime: [''],
        coreEndTime: [''],
        flexibleBandStart: [''],
        flexibleBandEnd: [''],
        minHoursPerDay: [4]
      }),

      isActive: [true],
      effectiveFrom: [null],
      effectiveTo: [null]
    });

    // Auto-uppercase code field
    this.shiftForm.get('code')?.valueChanges.subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.shiftForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private checkEditMode() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.shiftId = id;
        this.loadShiftDetails();
      }
    });
  }

  private loadShiftDetails() {
    this.isLoading.set(true);
    this.shiftForm.disable(); 
    
    // Using standard HTTP get pattern assumed in your service
    // Adjust mapping if your backend nests it differently (e.g. res.data.data)
    this.hrmsService.getShift(this.shiftId).pipe(
      map((res: any) => res?.data?.shift || res?.data?.data || res?.data || res),
      catchError(err => {
        this.isLoading.set(false);
        this.shiftForm.enable();
        this.messageService.handleHttpError(err);
        return of(null);
      })
    ).subscribe((data) => {
      if (data) {
        this.patchFormValues(data);
      }
      this.isLoading.set(false);
      this.shiftForm.enable();
    });
  }

  private patchFormValues(data: any) {
    const formatToDateStr = (dateVal: string) => {
      return dateVal ? new Date(dateVal).toISOString().split('T')[0] : null;
    };

    this.shiftForm.patchValue({
      name: data.name,
      code: data.code,
      description: data.description,
      
      startTime: data.startTime,
      endTime: data.endTime,
      breakDurationMins: data.breakDurationMins,
      
      gracePeriodMins: data.gracePeriodMins,
      lateThresholdMins: data.lateThresholdMins,
      earlyDepartureThresholdMins: data.earlyDepartureThresholdMins,
      halfDayThresholdHrs: data.halfDayThresholdHrs,
      minFullDayHrs: data.minFullDayHrs,
      maxOvertimeHrs: data.maxOvertimeHrs,

      shiftType: data.shiftType || 'fixed',
      
      weeklyOffs: data.weeklyOffs || [],
      applicableDays: data.applicableDays || [],

      overtimeRules: {
        enabled: data.overtimeRules?.enabled || false,
        multiplier: data.overtimeRules?.multiplier || 1.5,
        afterHours: data.overtimeRules?.afterHours || 8,
        doubleAfterHours: data.overtimeRules?.doubleAfterHours || 12,
        holidayMultiplier: data.overtimeRules?.holidayMultiplier || 2.0
      },

      flexiConfig: {
        coreStartTime: data.flexiConfig?.coreStartTime || '',
        coreEndTime: data.flexiConfig?.coreEndTime || '',
        flexibleBandStart: data.flexiConfig?.flexibleBandStart || '',
        flexibleBandEnd: data.flexiConfig?.flexibleBandEnd || '',
        minHoursPerDay: data.flexiConfig?.minHoursPerDay || 4
      },

      isActive: data.isActive ?? true,
      effectiveFrom: formatToDateStr(data.effectiveFrom),
      effectiveTo: formatToDateStr(data.effectiveTo)
    });
  }

  onSubmit() {
    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = { ...this.shiftForm.value };

    // Clean up empty arrays or nested objects if they aren't applicable
    if (payload.weeklyOffs?.length === 0) delete payload.weeklyOffs;
    if (payload.applicableDays?.length === 0) delete payload.applicableDays;
    
    // Clear out flexiConfig if it's not a flexible shift to prevent dirty database states
    if (payload.shiftType !== 'flexi') {
      delete payload.flexiConfig;
    }

    if (this.isEditMode()) {
      this.hrmsService.updateShift(this.shiftId!, payload).subscribe({
        next: () => {
          this.messageService.showSuccess('Shift updated successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.hrmsService.createShift(payload).subscribe({
        next: () => {
          this.messageService.showSuccess( 'Shift created successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/hrms/shifts/list']);
  }
}
