import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calculator-wrapper fade-in">
      <div class="grid-card calc-card">
        
        <div class="card-header">
          <div class="card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg></div>
          <div>
            <h2 class="card-title" style="font-size: 1.1rem;">Shift Hours Calculator</h2>
            <p class="page-subtitle" style="font-size: 0.7rem; margin-top: 2px;">Test timings to evaluate net work hours.</p>
          </div>
        </div>

        <div class="card-body">
          <form [formGroup]="calcForm" (ngSubmit)="calculateHours()" class="calc-form">
            
            <div class="form-row">
              <div class="form-field">
                <label>Start Time</label>
                <input type="time" formControlName="startTime" class="se-input">
              </div>
              
              <div class="form-field">
                <label>End Time</label>
                <input type="time" formControlName="endTime" class="se-input">
              </div>
            </div>

            <div class="form-field mt-3">
              <label>Unpaid Break Duration (Mins)</label>
              <input type="number" formControlName="breakMins" class="se-input" min="0" placeholder="e.g. 60">
            </div>

            <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="calcForm.invalid || isCalculating()">
              @if (isCalculating()) {
                <div class="spinner-sm"></div> Calculating...
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Calculate Hours
              }
            </button>
          </form>

          <div class="result-area" [class.show]="resultData()">
            @if (resultData(); as res) {
              <div class="divider"></div>
              
              <div class="result-grid">
                <div class="result-box primary-result">
                  <span class="res-label">Net Work Hours</span>
                  <span class="res-value big-val">{{ res.workHours }} <small>hrs</small></span>
                </div>

                <div class="result-box">
                  <span class="res-label">Gross Duration</span>
                  <span class="res-value">{{ res.totalHours }} <small>hrs</small></span>
                </div>

                <div class="result-box">
                  <span class="res-label">Break Deduction</span>
                  <span class="res-value color-warning">-{{ res.breakHours }} <small>hrs</small></span>
                </div>
              </div>

              @if (res.crossesMidnight) {
                <div class="midnight-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  <span>This shift crosses midnight into the next day.</span>
                </div>
              }
            }
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .calculator-wrapper { padding: var(--spacing-xl); display: flex; justify-content: center; font-family: var(--font-body); }
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-md); display: flex; flex-direction: column; }
    .calc-card { width: 100%; max-width: 450px; }
    
    .card-header { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-lg); border-bottom: 1px solid var(--border-primary); background: var(--component-surface-raised); border-radius: var(--ui-border-radius-lg) var(--ui-border-radius-lg) 0 0; }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; background: var(--bg-primary); padding: 8px; border-radius: 8px; border: 1px solid var(--border-primary); }
    .card-title { font-family: var(--font-heading); font-weight: var(--font-weight-bold); margin: 0; color: var(--text-primary); }
    .page-subtitle { color: var(--text-secondary); }
    
    .card-body { padding: var(--spacing-lg); }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }
    .se-input { background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.5rem; font-size: var(--font-size-md); color: var(--text-primary); height: 42px; box-sizing: border-box; outline: none; transition: all 0.2s; font-family: var(--font-mono, monospace); }
    .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
    
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .w-full { width: 100%; }
    
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; font-weight: var(--font-weight-bold); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; height: 42px; font-size: 0.875rem; }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }

    /* Results */
    .result-area { opacity: 0; max-height: 0; overflow: hidden; transition: all 0.4s ease; }
    .result-area.show { opacity: 1; max-height: 400px; margin-top: 16px; }
    .divider { height: 1px; background: var(--border-secondary); margin-bottom: 16px; }
    
    .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .result-box { background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 12px; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .primary-result { grid-column: span 2; background: color-mix(in srgb, var(--color-primary) 5%, transparent); border-color: color-mix(in srgb, var(--color-primary) 20%, transparent); }
    
    .res-label { font-size: 0.65rem; font-weight: var(--font-weight-bold); text-transform: uppercase; color: var(--text-secondary); margin-bottom: 4px; }
    .res-value { font-size: 1.25rem; font-family: var(--font-mono, monospace); font-weight: var(--font-weight-bold); color: var(--text-primary); }
    .big-val { font-size: 2.5rem; color: var(--color-primary); line-height: 1; }
    .color-warning { color: #d97706; }
    small { font-size: 0.5em; font-weight: normal; color: var(--text-tertiary); }

    .midnight-warning { margin-top: 12px; padding: 8px 12px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #4f46e5; font-weight: var(--font-weight-medium); }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease-out; }
  `]
})
export class ShiftCalculatorComponent {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);

  isCalculating = signal(false);
  resultData = signal<any | null>(null);

  calcForm: FormGroup = this.fb.group({
    startTime: ['09:00', Validators.required],
    endTime: ['18:00', Validators.required],
    breakMins: [60, [Validators.required, Validators.min(0)]]
  });

  calculateHours() {
    if (this.calcForm.invalid) return;

    this.isCalculating.set(true);
    this.resultData.set(null);

    const formVal = this.calcForm.value;

    // Based on service parameter: { startTime: string; endTime: string; breaks?: any[] }
    // Sending break duration as a mock "breaks" array block to fulfill the hours calculation
    const payload = {
      startTime: formVal.startTime,
      endTime: formVal.endTime,
      breaks: formVal.breakMins > 0 ? [
        { startTime: '13:00', endTime: this.addMins('13:00', formVal.breakMins) } // Dummy block just for duration logic
      ] : []
    };

    this.hrmsService.calculateShiftHours(payload).pipe(
      finalize(() => this.isCalculating.set(false))
    ).subscribe({
      next: (res: any) => {
        // Matches JSON: { data: { totalHours, breakHours, workHours, crossesMidnight } }
        const payloadData = res?.data || null;
        this.resultData.set(payloadData);
      },
      error: (err) => {
        this.messageService.handleHttpError(err)
      }
    });
  }

  // Helper just to mock a break end time for the payload
  private addMins(timeStr: string, minsToAdd: number): string {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m + minsToAdd, 0);
    const rh = String(date.getHours()).padStart(2, '0');
    const rm = String(date.getMinutes()).padStart(2, '0');
    return `${rh}:${rm}`;
  }
}
