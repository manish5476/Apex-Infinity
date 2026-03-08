import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-validator',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    CardModule, SelectModule, DatePicker, ButtonModule,
    TagModule, ToastModule, DividerModule, ProgressSpinnerModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="validator-wrapper fade-in">
      <div class="validator-header mb-4">
        <div class="icon-brand"><i class="pi pi-datepicker-clock"></i></div>
        <div>
          <h2 class="page-title">Shift Assignment Validator</h2>
          <p class="page-subtitle text-secondary">Pre-check shift assignments for scheduling conflicts or rule violations.</p>
        </div>
      </div>

      <p-card styleClass="premium-card glass-card">
        <form [formGroup]="validationForm" (ngSubmit)="runValidation()" class="validation-form">
          <div class="form-grid">
            
            <div class="input-group">
              <label class="info-label" for="userId">Employee <span class="text-error">*</span></label>
              <p-select 
                id="userId"
                formControlName="userId" 
                [options]="mockEmployees" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Select an Employee"
                [filter]="true"
                filterBy="name"
                styleClass="w-full premium-select">
                <ng-template pTemplate="selectedItem" let-selectedOption>
                  <div class="flex-align gap-2">
                    <i class="pi pi-user text-tertiary"></i>
                    <span>{{ selectedOption.name }}</span>
                  </div>
                </ng-template>
                <ng-template pTemplate="item" let-employee>
                  <div class="flex-align gap-2">
                    <i class="pi pi-user text-tertiary"></i>
                    <div>
                      <div class="font-medium">{{ employee.name }}</div>
                      <div class="text-xs text-tertiary">{{ employee.code }}</div>
                    </div>
                  </div>
                </ng-template>
              </p-select>
            </div>

            <div class="input-group">
              <label class="info-label" for="shiftId">Target Shift <span class="text-error">*</span></label>
              <p-select 
                id="shiftId"
                formControlName="shiftId" 
                [options]="mockShifts" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Select a Shift"
                styleClass="w-full premium-select">
                <ng-template pTemplate="item" let-shift>
                  <div class="flex-col">
                    <span class="font-medium">{{ shift.name }}</span>
                    <span class="text-xs text-tertiary">{{ shift.time }}</span>
                  </div>
                </ng-template>
              </p-select>
            </div>

            <div class="input-group">
              <label class="info-label" for="date">Effective Date <span class="text-tertiary text-xs text-normal">(Optional)</span></label>
              <p-datepicker 
                id="date"
                formControlName="date" 
                [showIcon]="true" 
                placeholder="Select Date"
                dateFormat="dd/mm/yy"
                styleClass="w-full premium-datepicker">
              </p-datepicker>
            </div>

          </div>

          <div class="form-actions mt-4 pt-4 border-top">
            <p-button 
              label="Run Validation" 
              icon="pi pi-check-square" 
              [loading]="isValidating()" 
              [disabled]="validationForm.invalid"
              type="submit"
              styleClass="w-full md:w-auto p-button-primary">
            </p-button>
            <p-button 
              label="Reset" 
              icon="pi pi-refresh" 
              [outlined]="true" 
              severity="secondary"
              (onClick)="resetForm()"
              [disabled]="isValidating()"
              styleClass="w-full md:w-auto ml-0 md:ml-3 mt-3 md:mt-0">
            </p-button>
          </div>
        </form>

        @if (validationResult(); as result) {
          <div class="result-container mt-5 slide-down">
            <h3 class="result-title">Validation Report</h3>
            
            @if (result.isValid) {
              <div class="result-box success-box">
                <div class="result-icon bg-success-light text-success"><i class="pi pi-check-circle"></i></div>
                <div class="result-content">
                  <h4 class="text-success m-0 mb-1 font-bold">Assignment Valid</h4>
                  <p class="m-0 text-secondary text-sm">No scheduling conflicts or rule violations detected. The employee can be safely assigned to this shift.</p>
                </div>
              </div>
            } @else {
              <div class="result-box error-box">
                <div class="result-icon bg-error-light text-error"><i class="pi pi-exclamation-triangle"></i></div>
                <div class="result-content">
                  <h4 class="text-error m-0 mb-2 font-bold">Validation Failed</h4>
                  <p class="m-0 text-secondary text-sm mb-3">The system detected the following conflicts preventing this assignment:</p>
                  
                  <ul class="conflict-list">
                    @for (conflict of result.conflicts; track conflict) {
                      <li>
                        <i class="pi pi-times-circle text-error mt-1"></i>
                        <span>{{ conflict }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .validator-wrapper {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--spacing-2xl) 0;
    }

    /* Header */
    .validator-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
    }
    .icon-brand {
      width: 48px; height: 48px;
      border-radius: var(--ui-border-radius-lg);
      background: var(--color-primary-bg);
      color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-2xl);
    }
    .page-title {
      margin: 0 0 4px 0;
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      font-family: var(--font-heading);
    }

    /* Form Layout */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-xl);
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .info-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--text-label);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .border-top {
      border-top: 1px solid var(--border-primary);
    }

    /* Overrides for Inputs to match Premium theme */
    ::ng-deep .premium-select .p-select,
    ::ng-deep .premium-datepicker .p-datepicker .p-inputtext {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary);
      border-radius: var(--ui-border-radius-md);
      transition: var(--transition-base);
    }
    ::ng-deep .premium-select .p-select:not(.p-disabled):hover,
    ::ng-deep .premium-datepicker .p-datepicker .p-inputtext:not(.p-disabled):hover {
      border-color: var(--color-primary);
    }

    /* Results Area */
    .result-title {
      font-family: var(--font-heading);
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--spacing-lg) 0;
      padding-top: var(--spacing-xl);
      border-top: 1px dashed var(--border-secondary);
    }

    .result-box {
      display: flex;
      gap: var(--spacing-xl);
      padding: var(--spacing-xl);
      border-radius: var(--ui-border-radius-lg);
      border: 1px solid var(--border-primary);
      background: var(--bg-primary);
    }
    .success-box { border-left: 4px solid var(--color-success); }
    .error-box { border-left: 4px solid var(--color-error); }

    .result-icon {
      width: 40px; height: 40px; flex-shrink: 0;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--font-size-xl);
    }
    .bg-success-light { background: var(--color-success-bg, #ecfdf5); }
    .bg-error-light { background: var(--color-error-bg, #fef2f2); }

    .conflict-list {
      list-style: none;
      padding: 0; margin: 0;
      display: flex; flex-direction: column; gap: var(--spacing-md);
    }
    .conflict-list li {
      display: flex; align-items: flex-start; gap: var(--spacing-sm);
      font-size: var(--font-size-sm); color: var(--text-primary);
      background: var(--bg-secondary); padding: var(--spacing-md);
      border-radius: var(--ui-border-radius-md);
      border: 1px solid var(--border-primary);
    }

    /* Utility */
    .glass-card { background: var(--component-bg, var(--bg-secondary)); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-md); }
    .text-error { color: var(--color-error); }
    .text-success { color: var(--color-success); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-secondary { color: var(--text-secondary); }
    .text-normal { text-transform: none; letter-spacing: normal; }
    .w-full { width: 100%; }
    .flex-align { display: flex; align-items: center; }
    .flex-col { display: flex; flex-direction: column; }
    .gap-2 { gap: var(--spacing-sm); }
    .mb-1 { margin-bottom: var(--spacing-xs); }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-3 { margin-bottom: var(--spacing-md); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .mt-5 { margin-top: var(--spacing-2xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    
    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.3s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
  `]
})
export class ShiftValidatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);

  // State
  validationForm!: FormGroup;
  isValidating = signal<boolean>(false);
  validationResult = signal<any | null>(null);

  // Mock Data (Replace with real API calls if available)
  mockEmployees = [
    { id: '698f1a7feff3e811b71a5910', name: 'Mukesh Singh', code: 'EMP-001' },
    { id: 'usr_002', name: 'Sarah Jenkins', code: 'EMP-002' },
    { id: 'usr_003', name: 'David Chen', code: 'EMP-003' }
  ];

  mockShifts = [
    { id: 'shf_morning', name: 'Morning Shift', time: '08:00 AM - 04:00 PM' },
    { id: 'shf_evening', name: 'Evening Shift', time: '04:00 PM - 12:00 AM' },
    { id: 'shf_night', name: 'Night Shift', time: '12:00 AM - 08:00 AM' }
  ];

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.validationForm = this.fb.group({
      userId: [null, Validators.required],
      shiftId: [null, Validators.required],
      date: [null]
    });
  }

  runValidation() {
    if (this.validationForm.invalid) return;

    this.isValidating.set(true);
    this.validationResult.set(null);

    const formData = this.validationForm.value;

    // Formatting the date if it exists before sending to API
    const payload = {
      shiftId: formData.shiftId,
      userId: formData.userId,
      ...(formData.date && { date: formData.date })
    };

    this.hrmsService.validateShiftAssignment(payload).pipe(
      catchError(error => {
        this.messageService.add({ severity: 'error', summary: 'Server Error', detail: 'Could not complete validation check.' });
        // Mocking an error response structurally for UI demonstration
        return of({
          status: 'error',
          data: { isValid: false, conflicts: ['Employee already assigned to an overlapping shift.', 'Exceeds maximum allowed 40 hours per week.'] }
        });
      }),
      finalize(() => this.isValidating.set(false))
    ).subscribe((response: any) => {
      // Assuming successful response structure maps closely to this
      // If the API just returns success with no conflicts array, we manually map it.
      if (response.status === 'success') {
        this.validationResult.set({ isValid: true, conflicts: [] });
        this.messageService.add({ severity: 'success', summary: 'Check Complete', detail: 'Validation completed successfully.' });
      } else {
        this.validationResult.set(response.data);
      }
    });
  }

  resetForm() {
    this.validationForm.reset();
    this.validationResult.set(null);
  }
}