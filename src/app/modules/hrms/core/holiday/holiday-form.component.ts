import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { HRMSService } from '../../hrms.service';
import { AppMessageService } from '@core/services/message.service';

@Component({
  selector: 'app-holiday-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CardModule, ButtonModule,
    InputTextModule, SelectModule, DatePickerModule,
    ToggleSwitchModule, MultiSelectModule, SkeletonModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper fade-in">
      <header class="dashboard-header slide-down mb-5">
        <div class="header-left">
          <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onCancel()"></p-button>
          <div class="header-titles">
            <h1 class="page-title m-0">{{ isEditMode() ? 'Edit Holiday Details' : 'Create Holiday' }}</h1>
            <p class="page-subtitle mt-1">Configure dates, types, and strict applicability rules for the organization.</p>
          </div>
        </div>
      </header>

      @if (isLoading()) {
        <p-card styleClass="premium-card glass-card"><p-skeleton width="100%" height="400px"></p-skeleton></p-card>
      } @else {
        <form [formGroup]="holidayForm" (ngSubmit)="onSubmit()" class="flex-col gap-5 pb-6">
          
          <div class="grid-layout">
            
            <div class="flex-col gap-4">
              <p-card styleClass="premium-card glass-card slide-down" styleclass="animation-delay: 0.1s">
                <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3"><i class="pi pi-datepicker-plus text-primary mr-2"></i> Standard Definition</h3>
                
                <div class="flex-col gap-4">
                  <div class="input-group">
                    <label class="info-label">Holiday / Observance Name <span class="text-error">*</span></label>
                    <input pInputText formControlName="name" placeholder="e.g. Diwali, Thanksgiving" class="w-full premium-input" />
                  </div>
                  
                  <div class="grid-2 gap-4">
                    <div class="input-group">
                      <label class="info-label">Date <span class="text-error">*</span></label>
                      <p-datepicker formControlName="date" [showIcon]="true" dateFormat="dd M yy" appendTo="body" styleClass="w-full premium-datepicker"></p-datepicker>
                    </div>
                    <div class="input-group">
                      <label class="info-label">Holiday Category <span class="text-error">*</span></label>
                      <p-select formControlName="holidayType" [options]="holidayTypes" appendTo="body" styleClass="w-full premium-select" [filter]="true" filterBy="label"></p-select>

                    </div>
                  </div>

                  <div class="input-group">
                    <label class="info-label">Policy / Information</label>
                    <textarea pInputTextarea formControlName="description" rows="3" class="w-full premium-input" placeholder="Notes for employees..."></textarea>
                  </div>
                </div>
              </p-card>

              <p-card styleClass="premium-card glass-card slide-down" styleclass="animation-delay: 0.15s">
                <div class="grid-2 gap-4">
                  <label class="bg-warning-light p-3 border-radius-md manish-border-1 border-warning flex-between cursor-pointer">
                    <div class="flex-col">
                      <span class="font-bold text-sm text-warning">Restricted / Optional</span>
                      <span class="text-xs text-tertiary">Employees must opt-in.</span>
                    </div>
                    <p-toggleswitch formControlName="isOptional"></p-toggleswitch>
                  </label>
                  <label class="bg-surface p-3 border-radius-md manish-border-1 surface-border flex-between cursor-pointer">
                    <div class="flex-col">
                      <span class="font-bold text-sm text-primary-color">Active Status</span>
                      <span class="text-xs text-tertiary">Enable for calculations.</span>
                    </div>
                    <p-toggleswitch formControlName="isActive"></p-toggleswitch>
                  </label>
                </div>
              </p-card>
            </div>

            <p-card styleClass="premium-card glass-card slide-down h-full" styleclas="animation-delay: 0.2s">
              <h3 class="font-heading text-lg m-0 mb-4 border-bottom pb-3"><i class="pi pi-sitemap text-primary mr-2"></i> Applicability Matrix</h3>
              
              <div class="flex-col gap-5">
                <div class="input-group">
                  <label class="info-label">Branch Override</label>
                  <p-select formControlName="branchId" [options]="branches" [showClear]="true" placeholder="All Branches (Global)" appendTo="body" styleClass="w-full premium-select" [filter]="true" filterBy="label"></p-select>

                  <span class="text-xs text-secondary mt-1">If set, this holiday is ONLY observed at this specific location.</span>
                </div>

                <div formGroupName="applicableTo" class="flex-col gap-4 mt-2 border-top pt-4">
                  <label class="flex-between mb-2 cursor-pointer">
                    <span class="font-bold text-sm text-primary-color">Applies to All Employees</span>
                    <p-toggleswitch formControlName="allEmployees"></p-toggleswitch>
                  </label>

                  @if (!holidayForm.get('applicableTo.allEmployees')?.value) {
                    <div class="input-group slide-down">
                      <label class="info-label">Restrict to Departments</label>
                      <p-multiSelect formControlName="departments" [options]="departments" placeholder="Select Departments" display="chip" styleClass="w-full premium-select"></p-multiSelect>
                    </div>
                    <div class="input-group slide-down" style="animation-delay: 0.1s">
                      <label class="info-label">Restrict by Employment Type</label>
                      <p-multiSelect formControlName="employmentTypes" [options]="empTypes" placeholder="Select Types" display="chip" styleClass="w-full premium-select"></p-multiSelect>
                    </div>
                  }
                </div>
              </div>
            </p-card>

          </div>

          <div class="form-footer flex-align justify-end gap-3 mt-4 slide-down" style="animation-delay: 0.3s">
            <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
            <p-button [label]="isEditMode() ? 'Save Changes' : 'Create Holiday'" icon="pi pi-check" type="submit" [loading]="isSaving()" [disabled]="holidayForm.invalid" styleClass="p-button-primary shadow-md"></p-button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    /* Core Layout Styles matching the rest of the application */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }
    
    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-2xl); align-items: start; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); }
    
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .justify-end { justify-content: flex-end; }
    
    .w-full { width: 100%; }
    .h-full { height: 100%; }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .gap-5 { gap: var(--spacing-2xl); }
    
    .m-0 { margin: 0; }
    .mb-2 { margin-bottom: var(--spacing-sm); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .mb-5 { margin-bottom: var(--spacing-2xl); }
    .mt-1 { margin-top: var(--spacing-xs); }
    .mt-2 { margin-top: var(--spacing-sm); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .mr-2 { margin-right: var(--spacing-sm); }
    
    .p-3 { padding: var(--spacing-lg); }
    .pb-3 { padding-bottom: var(--spacing-md); }
    .pb-6 { padding-bottom: var(--spacing-4xl); }
    .pt-4 { padding-top: var(--spacing-xl); }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-xs { font-size: var(--font-size-xs); }
    .text-lg { font-size: var(--font-size-lg); }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary-color { color: var(--text-primary); }
    .text-error { color: var(--color-error); }
    .text-warning { color: var(--color-warning); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .font-heading { font-family: var(--font-heading); }

    .bg-surface { background: var(--bg-secondary); }
    .bg-warning-light { background: #fff7ed; }
    .border-warning { border-color: var(--color-warning); }
    
    .border-bottom { border-bottom: 1px solid var(--border-primary); }
    .border-top { border-top: 1px solid var(--border-primary); }
    .manish-border-1 { border: 1px solid; }
    .surface-border { border-color: var(--border-primary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }

    /* Header */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); }

    /* Cards & Inputs */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm); }
    ::ng-deep .premium-card .p-card-body { padding: var(--spacing-2xl); height: 100%; }
    ::ng-deep .premium-card .p-card-content { padding: 0; }
    
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: 10px; font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

    ::ng-deep .premium-input, ::ng-deep .premium-select .p-select, ::ng-deep .premium-datepicker .p-inputtext, ::ng-deep .premium-select.p-multiselect { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); }
    ::ng-deep .premium-input:focus, ::ng-deep .premium-select .p-select.p-focus, ::ng-deep .premium-select.p-multiselect.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    .form-footer { position: sticky; bottom: 0; background: var(--bg-primary); padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-primary); z-index: 10; margin-top: var(--spacing-xl); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 900px) { .grid-layout { grid-template-columns: 1fr; } }
  `]
})
export class HolidayFormComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  holidayForm!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  isEditMode = signal(false);
  holidayId: string | null = null;

  holidayTypes = [
    { label: 'National Public Holiday', value: 'national' },
    { label: 'State / Regional', value: 'state' },
    { label: 'Festival', value: 'festival' },
    { label: 'Company Observance', value: 'company' },
    { label: 'Restricted / Floating', value: 'restricted' }
  ];

  empTypes = [
    { label: 'Permanent Full-Time', value: 'permanent' },
    { label: 'Contractor', value: 'contract' },
    { label: 'Intern', value: 'intern' }
  ];

  // Mocks: Should fetch from APIs
  branches = [{ label: 'Global HQ (Delhi)', value: 'br_del' }, { label: 'Mumbai Site', value: 'br_mum' }];
  departments = [{ label: 'Engineering', value: 'dept_eng' }, { label: 'Sales', value: 'dept_sal' }];

  ngOnInit() {
    this.initForm();
    this.holidayId = this.route.snapshot.paramMap.get('id');

    if (this.holidayId) {
      this.isEditMode.set(true);
      this.loadHoliday(this.holidayId);
    } else {
      this.isLoading.set(false);
    }
  }

  private initForm() {
    this.holidayForm = this.fb.group({
      organizationId: ['698f1a7feff3e811b71a590f', Validators.required],
      name: ['', Validators.required],
      date: [null, Validators.required],
      holidayType: ['company', Validators.required],
      description: [''],
      branchId: [null],
      isOptional: [false],
      isActive: [true],

      applicableTo: this.fb.group({
        allEmployees: [true],
        departments: [[]],
        employmentTypes: [[]]
      })
    });
  }

  private loadHoliday(id: string) {
    this.hrmsService.getHoliday(id).pipe(
      catchError((err) => {
        this.messageService.handleHttpError(err)
        this.onCancel();
        return of(null);
      }),
      finalize(() => this.isLoading.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      const data = res?.data?.holiday;
      if (data) {
        this.holidayForm.patchValue({
          ...data,
          date: new Date(data.date) // Convert string back to Date object for PrimeNG datepicker
        });
      }
    });
  }

  onSubmit() {
    if (this.holidayForm.invalid) {
      this.holidayForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const payload = this.holidayForm.value;

    const req$ = this.isEditMode() && this.holidayId
      ? this.hrmsService.updateHoliday(this.holidayId, payload)
      : this.hrmsService.createHoliday(payload);

    req$.pipe(
      catchError(err => {
        this.messageService.handleHttpError(err)
        return of(null);
      }),
      finalize(() => this.isSaving.set(false)), takeUntil(this.destroy$)
    ).subscribe((res: any) => {
      if (res) {
        this.messageService.showSuccess(res.message)
        setTimeout(() => this.onCancel(), 1000);
      }
    });
  }

  onCancel() {
    this.router.navigate(['/holidays']); // Adjust to match your routes
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}