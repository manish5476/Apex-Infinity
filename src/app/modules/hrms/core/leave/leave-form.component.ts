import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';
import { UserManagementService } from '../../../user/user-management.service';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    FileUploadModule,
    ToastModule,
    SkeletonModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

      @if (isLoading()) {
        <p-card styleClass="premium-card glass-card"><p-skeleton width="100%" height="400px"></p-skeleton></p-card>
      } @else {
        <form [formGroup]="leaveForm" (ngSubmit)="onSubmit()" class="flex-col gap-5 pb-6 pt-2">
          
          <div class="grid-layout">
            <div class="flex-col gap-5">
              <p-card styleClass="premium-card glass-card slide-down" [style]="{'animation-delay': '0.1s'}">
                <h3 class="section-title mb-4"><i class="pi pi-calendar text-primary"></i> Leave Details</h3>
                
                <div class="input-group mb-4">
                  <label class="info-label">Leave Type <span class="text-error">*</span></label>
                  <p-select formControlName="leaveType" [options]="leaveTypes" optionLabel="label" optionValue="value" placeholder="Select Leave Type" styleClass="w-full premium-dropdown" [filter]="true" filterBy="label"></p-select>

                </div>

                <div class="grid-2 gap-4 mb-4">
                  <div class="input-group">
                    <label class="info-label">Assigned Approver <span class="text-error">*</span></label>
                    <p-select formControlName="assignedApprover" [options]="approvers" optionLabel="name" optionValue="_id" placeholder="Select Approver" styleClass="w-full premium-dropdown" [filter]="true" filterBy="name"></p-select>
                  </div>
                </div>

                <div class="grid-2 gap-4 mb-4">
                  <div class="input-group">
                    <label class="info-label">Start Date <span class="text-error">*</span></label>
                    <p-datepicker formControlName="startDate" [showIcon]="true" dateFormat="dd/mm/yy" styleClass="w-full premium-calendar" (onSelect)="calculateDays()"></p-datepicker>
                  </div>
                  <div class="input-group">
                    <label class="info-label">End Date <span class="text-error">*</span></label>
                    <p-datepicker formControlName="endDate" [showIcon]="true" dateFormat="dd/mm/yy" styleClass="w-full premium-calendar" (onSelect)="calculateDays()"></p-datepicker>
                  </div>
                </div>

                <div class="grid-2 gap-4 mb-4">
                  <div class="input-group">
                    <label class="info-label">Start Session</label>
                    <p-select formControlName="startSession" [options]="sessions" optionLabel="label" optionValue="value" styleClass="w-full premium-dropdown" (onChange)="calculateDays()" [filter]="true" filterBy="label"></p-select>

                  </div>
                  <div class="input-group">
                    <label class="info-label">End Session</label>
                    <p-select formControlName="endSession" [options]="sessions" optionLabel="label" optionValue="value" styleClass="w-full premium-dropdown" (onChange)="calculateDays()" [filter]="true" filterBy="label"></p-select>

                  </div>
                </div>

                <div class="bg-primary-light p-3 border-radius-md flex-between">
                  <span class="font-bold text-primary-color">Total Requested Days:</span>
                  <span class="font-bold text-xl text-primary">{{ leaveForm.get('daysCount')?.value || 0 }}</span>
                </div>
              </p-card>

              <p-card styleClass="premium-card glass-card slide-down" [style]="{'animation-delay': '0.2s'}">
                <h3 class="section-title mb-4"><i class="pi pi-align-left text-primary"></i> Reason & Notes</h3>
                
                <div class="input-group mb-4">
                  <label class="info-label">Reason for Leave <span class="text-error">*</span></label>
                  <textarea pInputTextarea formControlName="reason" rows="3" class="w-full premium-input" placeholder="Briefly explain your reason for leave..."></textarea>
                </div>
                
                <div class="input-group">
                  <label class="info-label">Supporting Documents</label>
                  <p-fileUpload mode="basic" chooseLabel="Upload Medical/Other Docs" [auto]="true" styleClass="p-button-outlined w-full"></p-fileUpload>
                </div>
              </p-card>
            </div>

            <div class="flex-col gap-5">
              <p-card styleClass="premium-card glass-card slide-down" [style]="{'animation-delay': '0.15s'}">
                <h3 class="section-title mb-4"><i class="pi pi-users text-primary"></i> Work Handover</h3>
                
                <div class="input-group mb-4">
                  <label class="info-label">Handover To</label>
                  <p-select formControlName="handoverTo" [options]="colleagues" optionLabel="name" optionValue="id" placeholder="Select Colleague" [showClear]="true" styleClass="w-full premium-dropdown" [filter]="true" filterBy="name"></p-select>

                </div>
                <div class="input-group">
                  <label class="info-label">Handover Notes / Tasks</label>
                  <textarea pInputTextarea formControlName="handoverNotes" rows="3" class="w-full premium-input" placeholder="List tasks or instructions..."></textarea>
                </div>
              </p-card>

              <p-card styleClass="premium-card glass-card slide-down" [style]="{'animation-delay': '0.25s'}">
                <h3 class="section-title mb-4"><i class="pi pi-phone text-primary"></i> Emergency Contact</h3>
                <div formGroupName="emergencyContact" class="flex-col gap-4">
                  <div class="input-group">
                    <label class="info-label">Contact Name</label>
                    <input pInputText formControlName="name" class="w-full premium-input" />
                  </div>
                  <div class="grid-2 gap-4">
                    <div class="input-group">
                      <label class="info-label">Relationship</label>
                      <input pInputText formControlName="relationship" class="w-full premium-input" />
                    </div>
                    <div class="input-group">
                      <label class="info-label">Phone Number</label>
                      <input pInputText formControlName="phone" class="w-full premium-input" />
                    </div>
                  </div>
                </div>
              </p-card>
            </div>
          </div>

          <div class="form-footer flex-align justify-end gap-3 mt-4 slide-down" style="animation-delay: 0.3s">
            <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
            <p-button label="Submit Request" icon="pi pi-send" type="submit" [loading]="isSaving()" [disabled]="leaveForm.invalid" styleClass="p-button-primary shadow-md"></p-button>
          </div>
        </form>
      }
    
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-2xl); align-items: start; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    
    .gap-4 { gap: var(--spacing-lg); }
    .gap-5 { gap: var(--spacing-2xl); }
    
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .pb-6 { padding-bottom: var(--spacing-4xl); }
    
    .w-full { width: 100%; }
    .text-error { color: var(--color-error); }
    .text-primary { color: var(--color-primary); }
    .text-xl { font-size: var(--font-size-xl); }
    .font-bold { font-weight: var(--font-weight-bold); }
    
    .bg-primary-light { background: var(--color-primary-bg, #eff6ff); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    
    /* Typography */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0 0 4px 0; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }
    .section-title { font-family: var(--font-heading); font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); margin: 0; display: flex; align-items: center; gap: var(--spacing-sm); }
    
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

    /* Premium Components */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm); }
    ::ng-deep .premium-card .p-card-body { padding: var(--spacing-xl); }
    ::ng-deep .premium-card .p-card-content { padding: 0; }

    ::ng-deep .premium-input, ::ng-deep .premium-dropdown .p-select, ::ng-deep .premium-calendar .p-datepicker .p-inputtext { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); }
    ::ng-deep .premium-input:focus, ::ng-deep .premium-dropdown .p-select.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    .form-footer { position: sticky; bottom: 0; background: var(--bg-primary); padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-primary); z-index: 10; margin-top: var(--spacing-2xl); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
  `]
})
export class LeaveFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private userService = inject(UserManagementService);
  private messageService = inject(AppMessageService);
  private ref = inject(DynamicDialogRef, { optional: true });
  private config = inject(DynamicDialogConfig, { optional: true });
  private readonly objectIdPattern = /^[a-f\d]{24}$/i;

  leaveForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  isEditMode = signal(false);
  leaveId: string | null = null;
  approvers: any[] = [];

  leaveTypes = [
    { label: 'Casual Leave (CL)', value: 'casual' },
    { label: 'Sick Leave (SL)', value: 'sick' },
    { label: 'Earned Leave (EL)', value: 'earned' },
    { label: 'Unpaid Leave (LWP)', value: 'unpaid' }
  ];

  sessions = [
    { label: 'Full Day', value: 'full' },
    { label: 'First Half', value: 'first_half' },
    { label: 'Second Half', value: 'second_half' }
  ];

  colleagues = [
  ]; // TODO: Replace with API call

  ngOnInit() {
    this.initForm();
    this.fetchApprovers();
    this.leaveId = this.config?.data?.id || null;

    if (this.leaveId) {
      this.isEditMode.set(true);
      this.loadRequest(this.leaveId);
    } else {
      this.isLoading.set(false);
    }
  }

  fetchApprovers() {
    this.userService.getAllUsers({ limit: 1000 }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.approvers = res.data?.users || [];
      },
      error: () => this.messageService.showError('Failed to load approvers.')
    });
  }

  private initForm() {
    this.leaveForm = this.fb.group({
      leaveType: [null, Validators.required],
      assignedApprover: [null, Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      startSession: ['full'],
      endSession: ['full'],
      daysCount: [0, [Validators.required, Validators.min(0.5)]],
      reason: ['', Validators.required],
      handoverTo: [null],
      handoverNotes: [''],
      emergencyContact: this.fb.group({
        name: [''],
        relationship: [''],
        phone: ['']
      })
    });
  }

  private loadRequest(id: string) {
    this.hrmsService.getLeaveRequest(id).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        this.onCancel();
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      const data = res?.data?.leaveRequest;
      if (data) {
        this.leaveForm.patchValue({
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate)
        });
      }
    });
  }

  calculateDays() {
    const start = this.leaveForm.get('startDate')?.value;
    const end = this.leaveForm.get('endDate')?.value;
    const sSession = this.leaveForm.get('startSession')?.value;
    const eSession = this.leaveForm.get('endSession')?.value;

    if (!start || !end) return;

    // Basic Mock Calculation - Replace with actual working day calculation (excluding weekends/holidays)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (start.getTime() === end.getTime()) {
      diffDays = (sSession !== 'full') ? 0.5 : 1;
    } else {
      if (sSession !== 'full') diffDays -= 0.5;
      if (eSession !== 'full') diffDays -= 0.5;
    }

    this.leaveForm.patchValue({ daysCount: Math.max(0, diffDays) });
  }

  onSubmit() {
    if (this.leaveForm.invalid) {
      this.leaveForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const raw = this.leaveForm.getRawValue();
    const handoverTo = typeof raw.handoverTo === 'string' && this.objectIdPattern.test(raw.handoverTo)
      ? raw.handoverTo
      : undefined;
    const emergencyContact = raw.emergencyContact && Object.values(raw.emergencyContact).some(v => !!v)
      ? raw.emergencyContact
      : undefined;

    const payload: any = {
      leaveType: raw.leaveType,
      assignedApprover: raw.assignedApprover,
      startDate: raw.startDate,
      endDate: raw.endDate,
      startSession: raw.startSession,
      endSession: raw.endSession,
      daysCount: raw.daysCount,
      reason: raw.reason,
      handoverNotes: raw.handoverNotes || undefined,
      handoverTo,
      emergencyContact
    };

    const req$ = this.isEditMode() && this.leaveId
      ? this.hrmsService.updateLeaveRequest(this.leaveId, payload)
      : this.hrmsService.createLeaveRequest(payload);

    req$.pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: res => {
        if (res) {
          if (this.ref) {
            this.ref.close(res);
          }
        }
      },
      complete: () => this.isSaving.set(false)
    });
  }

  onCancel() {
    if (this.ref) {
      this.ref.close();
    } else {
      window.history.back();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
