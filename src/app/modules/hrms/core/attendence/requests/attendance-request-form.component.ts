import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AppMessageService } from '@core/services/message.service';
import { SelectModule } from 'primeng/select';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { HRMSService } from '../../../hrms.service';
import { UserManagementService } from '../../../../user/user-management.service';

@Component({
  selector: 'app-attendance-request-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, SelectModule, DatePickerModule,
    InputTextModule, TextareaModule, ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="fade-in flex-col overflow-auto pt-2">
      <main class="apex-content flex-1 p-0 sm:p-2 flex-center slide-down">
        <div class="apex-card p-5 sm:p-7 w-full max-w-3xl">
          <form [formGroup]="requestForm" (ngSubmit)="onSubmit()" class="flex-col gap-5">
            
            <div class="grid-2 gap-5">
              
              <div class="field">
                <label class="apex-label block mb-2">Request Type <span class="text-danger">*</span></label>
                <p-select 
                  [options]="requestTypes" 
                  formControlName="type" 
                  placeholder="Select Request Type" 
                  styleClass="w-full apex-input"
                  (onChange)="onTypeChange()">
                </p-select>
                @if (submitted && requestForm.get('type')?.errors?.['required']) {
                  <small class="p-error block mt-1">Type is required.</small>
                }
              </div>

              <div class="field">
                <label class="apex-label block mb-2">Assigned Approver <span class="text-danger">*</span></label>
                <p-select 
                  [options]="approvers" 
                  optionLabel="name"
                  optionValue="_id"
                  formControlName="assignedApprover" 
                  placeholder="Select Approver" 
                  styleClass="w-full apex-input"
                  [filter]="true" filterBy="name">
                </p-select>
                @if (submitted && requestForm.get('assignedApprover')?.errors?.['required']) {
                  <small class="p-error block mt-1">Approver is required.</small>
                }
              </div>

              <div class="field">
                <label class="apex-label block mb-2">Target Date <span class="text-danger">*</span></label>
                <p-datepicker 
                  formControlName="targetDate" 
                  [showIcon]="true" 
                  dateFormat="dd M yy" 
                  placeholder="Select Date" 
                  styleClass="w-full apex-input">
                </p-datepicker>
                @if (submitted && requestForm.get('targetDate')?.errors?.['required']) {
                  <small class="p-error block mt-1">Date is required.</small>
                }
              </div>

            </div>

            @if (requestForm.get('type')?.value === 'missed_punch') {
              <div class="grid-2 gap-5 p-4 bg-primary-light border-radius-lg border border-primary fade-in">
                <div class="field m-0">
                  <label class="apex-label block mb-2 text-primary-color">Proposed In Time</label>
                  <p-datepicker 
                    formControlName="inTime" 
                    [timeOnly]="true" 
                    hourFormat="24"
                    placeholder="HH:MM" 
                    styleClass="w-full apex-input">
                  </p-datepicker>
                </div>
                <div class="field m-0">
                  <label class="apex-label block mb-2 text-primary-color">Proposed Out Time</label>
                  <p-datepicker 
                    formControlName="outTime" 
                    [timeOnly]="true" 
                    hourFormat="24"
                    placeholder="HH:MM" 
                    styleClass="w-full apex-input">
                  </p-datepicker>
                </div>
              </div>
            }

            <div class="field">
              <label class="apex-label block mb-2">Reason for Request <span class="text-danger">*</span></label>
              <textarea 
                pTextarea 
                formControlName="reason" 
                rows="4" 
                class="w-full apex-input" 
                placeholder="Please explain why you need this regularization...">
              </textarea>
              @if (submitted && requestForm.get('reason')?.errors?.['required']) {
                <small class="p-error block mt-1">Reason is required.</small>
              }
            </div>

            <div class="flex-align justify-end gap-3 pt-4 border-top mt-2">
              <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text p-button-secondary" (onClick)="goBack()"></p-button>
              <p-button label="Submit Request" icon="pi pi-check" styleClass="apex-btn apex-btn--primary" type="submit" [loading]="isSubmitting"></p-button>
            </div>

          </form>
        </div>
      </main>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; background: var(--bg-secondary); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-center { display: flex; align-items: flex-start; justify-content: center; }
    .flex-shrink-0 { flex-shrink: 0; }
    .flex-1 { flex: 1; }
    .justify-end { justify-content: flex-end; }
    
    .w-full { width: 100%; }
    .max-w-3xl { max-width: 800px; }
    .h-screen { height: 100vh; }
    
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .gap-5 { gap: var(--spacing-xl); }
    
    .m-0 { margin: 0; }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    
    .p-4 { padding: var(--spacing-xl); }
    .p-5 { padding: var(--spacing-2xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .border-top { border-top: 1px solid var(--border-primary); }
    .border { border: 1px solid var(--border-primary); }
    .border-radius-lg { border-radius: var(--ui-border-radius-lg); }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-danger { color: var(--color-danger); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .block { display: block; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }
    
    @media (min-width: 640px) {
      .sm\\:p-5 { padding: var(--spacing-2xl); }
      .sm\\:p-7 { padding: var(--spacing-4xl); }
    }
  `]
})
export class AttendanceRequestFormComponent {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  private ref = inject(DynamicDialogRef, { optional: true });

  requestForm: FormGroup;
  submitted = false;
  isSubmitting = false;
  approvers: any[] = [];

  requestTypes = [
    { label: 'Missed Punch', value: 'missed_punch' },
    { label: 'Regularization', value: 'regularization' },
    { label: 'Attendance Correction', value: 'correction' },
    { label: 'Other', value: 'other' }
  ];

  constructor() {
    this.requestForm = this.fb.group({
      type: ['', Validators.required],
      targetDate: [null, Validators.required],
      assignedApprover: [null, Validators.required],
      reason: ['', Validators.required],
      inTime: [null],
      outTime: [null]
    });
  }

  ngOnInit() {
    this.fetchApprovers();
  }

  fetchApprovers() {
    this.userService.getAllUsers({ limit: 1000 }).subscribe({
      next: (res: any) => {
        // You can filter by role here if needed, but for now we list all users
        this.approvers = res.data?.users || [];
      },
      error: () => this.messageService.showError('Failed to load approvers.')
    });
  }

  onTypeChange() {
    // If not missed punch, clear times
    if (this.requestForm.get('type')?.value !== 'missed_punch') {
      this.requestForm.patchValue({ inTime: null, outTime: null });
    }
  }

  goBack() {
    if (this.ref) {
      this.ref.close();
    } else {
      window.history.back();
    }
  }

  onSubmit() {
    this.submitted = true;
    if (this.requestForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.requestForm.value;

    const payload: any = {
      type: formVal.type,
      targetDate: formVal.targetDate.toISOString(),
      assignedApprover: formVal.assignedApprover,
      correction: {
        reason: formVal.reason
      }
    };

    if (formVal.type === 'missed_punch') {
      if (formVal.inTime) {
        // format to HH:mm
        payload.correction.inTime = this.formatTime(formVal.inTime);
      }
      if (formVal.outTime) {
        payload.correction.outTime = this.formatTime(formVal.outTime);
      }
    }

    this.hrmsService.createAttendanceRequest(payload).subscribe({
      next: (res: any) => {
        if (this.ref) {
          this.ref.close(res);
        } else {
          this.messageService.showSuccess('Request submitted successfully.');
          window.history.back();
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.messageService.showError(err.error?.message || 'Failed to submit request.');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  private formatTime(date: Date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}