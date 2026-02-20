import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// Services
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-shift-group-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, CardModule, ButtonModule,
    InputTextModule, TextareaModule, SelectModule, MultiSelectModule,
    DatePickerModule, ToggleSwitchModule, ToastModule, SkeletonModule,
    DividerModule, InputNumberModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right"></p-toast>

    <div class="page-wrapper fade-in">
      
      <header class="dashboard-header slide-down mb-4">
        <div class="header-left">
          <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true" size="large" styleClass="back-btn" (onClick)="onCancel()" pTooltip="Back to List" tooltipPosition="bottom"></p-button>
          <div class="header-titles">
            <h1 class="page-title">{{ isEditMode() ? 'Edit Shift Group' : 'Create Shift Group' }}</h1>
            <p class="page-subtitle">{{ isEditMode() ? 'Modify existing rotation rules.' : 'Define a new rotating shift pattern.' }}</p>
          </div>
        </div>
      </header>

      @if (isLoading()) {
        <p-card styleClass="premium-card glass-card">
          <div class="flex-col gap-4 p-4">
            <p-skeleton width="30%" height="2rem"></p-skeleton>
            <div class="grid-2"><p-skeleton height="3rem"></p-skeleton><p-skeleton height="3rem"></p-skeleton></div>
            <p-skeleton width="100%" height="10rem"></p-skeleton>
          </div>
        </p-card>
      } @else {
        
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex-col gap-5 pb-6">
          
          <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.1s">
            <ng-template pTemplate="title"><div class="section-title"><i class="pi pi-info-circle text-primary"></i> General Information</div></ng-template>
            <div class="grid-2">
              <div class="input-group">
                <label class="info-label">Group Name <span class="text-error">*</span></label>
                <input pInputText formControlName="name" placeholder="e.g. Nursing Rotation A" class="w-full premium-input" />
              </div>
              <div class="input-group">
                <label class="info-label">System Code <span class="text-error">*</span></label>
                <input pInputText formControlName="code" placeholder="e.g. NURS-ROT-A" class="w-full premium-input uppercase-text" />
              </div>
              <div class="input-group span-2">
                <label class="info-label">Description</label>
                <textarea pInputTextarea formControlName="description" rows="2" placeholder="Describe the purpose of this shift group..." class="w-full premium-input"></textarea>
              </div>
              <div class="input-group">
                <label class="info-label">Organization <span class="text-error">*</span></label>
                <p-select formControlName="organizationId" [options]="organizations" optionLabel="name" optionValue="id" placeholder="Select Org" styleClass="w-full premium-select"></p-select>
              </div>
              <div class="input-group">
                <label class="info-label">Branch</label>
                <p-select formControlName="branchId" [options]="branches" optionLabel="name" optionValue="id" placeholder="Select Branch" styleClass="w-full premium-select" [showClear]="true"></p-select>
              </div>
              <div class="input-group">
                <label class="info-label">Effective From</label>
                <p-datepicker formControlName="effectiveFrom" [showIcon]="true" placeholder="Start Date" dateFormat="dd/mm/yy" styleClass="w-full premium-calendar"></p-datepicker>
              </div>
              <div class="input-group">
                <label class="info-label">Effective To</label>
                <p-datepicker formControlName="effectiveTo" [showIcon]="true" placeholder="End Date (Optional)" dateFormat="dd/mm/yy" styleClass="w-full premium-calendar" [showClear]="true"></p-datepicker>
              </div>
              <div class="input-group flex-row-center gap-3 mt-3 span-2 bg-surface p-3 border-radius-md">
                <label class="info-label m-0">Group Status (Active)</label>
                <p-toggleswitch formControlName="isActive"></p-toggleswitch>
              </div>
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.15s">
            <ng-template pTemplate="title">
              <div class="flex-between">
                <div class="section-title"><i class="pi pi-clock text-primary"></i> Shifts in Rotation</div>
                <p-button label="Add Shift" icon="pi pi-plus" size="small" [outlined]="true" (onClick)="addShift()"></p-button>
              </div>
            </ng-template>
            
            <p class="text-secondary text-sm mb-4">Add the individual shifts that make up this rotation group. Assign a sequence number to define their order.</p>

            <div formArrayName="shifts" class="flex-col gap-3">
              @for (shiftCtrl of shiftsArray.controls; track $index) {
                <div [formGroupName]="$index" class="array-row flex-align gap-3 p-3 bg-surface border-radius-md">
                  <div class="drag-handle text-tertiary"><i class="pi pi-bars"></i></div>
                  
                  <div class="input-group flex-1 m-0">
                    <p-select formControlName="shiftId" [options]="availableShifts" optionLabel="name" optionValue="id" placeholder="Select Shift" styleClass="w-full premium-select" appendTo="body"></p-select>
                  </div>
                  
                  <div class="input-group w-8rem m-0">
                    <p-inputNumber formControlName="sequence" placeholder="Seq" [showButtons]="true" [min]="1" styleClass="w-full premium-input"></p-inputNumber>
                  </div>

                  <div class="input-group w-6rem m-0 flex-align justify-center">
                    <input type="color" formControlName="color" class="color-picker-input" pTooltip="Shift Color UI Indicator" tooltipPosition="top" />
                  </div>

                  <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeShift($index)" pTooltip="Remove"></p-button>
                </div>
              }
              @if (shiftsArray.length === 0) {
                <div class="empty-array-state border-dashed p-4 text-center text-tertiary border-radius-md">
                  No shifts added. Click "Add Shift" to include shifts in this group.
                </div>
              }
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.2s">
            <ng-template pTemplate="title">
              <div class="flex-between">
                <div class="section-title"><i class="pi pi-sync text-primary"></i> Rotation Pattern</div>
                <p-button label="Add Pattern Rule" icon="pi pi-plus" size="small" [outlined]="true" (onClick)="addRotationPattern()"></p-button>
              </div>
            </ng-template>

            <div class="grid-1 mb-4">
              <div class="input-group w-full md:w-20rem">
                <label class="info-label">Rotation Frequency <span class="text-error">*</span></label>
                <p-select formControlName="rotationType" [options]="rotationTypes" placeholder="Select Type" styleClass="w-full premium-select"></p-select>
              </div>
            </div>

            <div formArrayName="rotationPattern" class="flex-col gap-3">
              @for (patternCtrl of rotationPatternArray.controls; track $index) {
                <div [formGroupName]="$index" class="array-row flex-align gap-3 p-3 bg-surface border-radius-md">
                  
                  <div class="input-group w-10rem m-0 flex-row-center gap-2">
                    <span class="text-secondary font-semibold whitespace-nowrap">Day Offset:</span>
                    <p-inputNumber formControlName="dayOffset" [min]="0" styleClass="w-full premium-input"></p-inputNumber>
                  </div>
                  
                  <div class="input-group flex-1 m-0">
                    <p-select formControlName="shiftId" [options]="availableShifts" optionLabel="name" optionValue="id" placeholder="Assign Shift for this day (Leave blank for Day Off)" [showClear]="true" styleClass="w-full premium-select" appendTo="body"></p-select>
                  </div>

                  <p-button icon="pi pi-trash" severity="danger" [text]="true" [rounded]="true" (onClick)="removeRotationPattern($index)"></p-button>
                </div>
              }
              @if (rotationPatternArray.length === 0) {
                <div class="empty-array-state border-dashed p-4 text-center text-tertiary border-radius-md">
                  No pattern defined. Add offsets mapping days to specific shifts.
                </div>
              }
            </div>
          </p-card>

          <p-card styleClass="premium-card glass-card form-section-card slide-down" styleClass="animation-delay: 0.25s">
            <ng-template pTemplate="title"><div class="section-title"><i class="pi pi-users text-primary"></i> Applicability</div></ng-template>
            <p class="text-secondary text-sm mb-4">Select which departments and designations this shift group is allowed to be assigned to.</p>
            
            <div class="grid-2">
              <div class="input-group">
                <label class="info-label">Applicable Departments</label>
                <p-multiSelect formControlName="applicableDepartments" [options]="departments" optionLabel="name" optionValue="id" placeholder="Select Departments" [filter]="true" styleClass="w-full premium-select" display="chip"></p-multiSelect>
              </div>
              <div class="input-group">
                <label class="info-label">Applicable Designations</label>
                <p-multiSelect formControlName="applicableDesignations" [options]="designations" optionLabel="name" optionValue="id" placeholder="Select Designations" [filter]="true" styleClass="w-full premium-select" display="chip"></p-multiSelect>
              </div>
            </div>
          </p-card>

          <div class="form-footer flex-align justify-end gap-3 mt-4 slide-down" style="animation-delay: 0.3s">
            <p-button label="Cancel" icon="pi pi-times" [text]="true" severity="secondary" (onClick)="onCancel()"></p-button>
            <p-button label="Save Shift Group" icon="pi pi-save" type="submit" [loading]="isSaving()" [disabled]="form.invalid" styleClass="p-button-primary shadow-md"></p-button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    /* --------------------------------------------------------------------------
       GLOBAL & VARIABLES
       -------------------------------------------------------------------------- */
    :host { display: block; width: 100%; min-height: 100vh; background-color: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
    .page-wrapper { padding: var(--spacing-2xl) var(--spacing-3xl); max-width: 1200px; margin: 0 auto; }

    /* Utility */
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-align { display: flex; align-items: center; }
    .flex-row-center { display: flex; align-items: center; }
    .justify-center { justify-content: center; }
    .justify-end { justify-content: flex-end; }
    .flex-1 { flex: 1; }
    
    .w-full { width: 100%; }
    .w-6rem { width: 6rem; }
    .w-8rem { width: 8rem; }
    .w-10rem { width: 10rem; }
    .whitespace-nowrap { white-space: nowrap; }
    .uppercase-text { text-transform: uppercase; }
    
    .grid-1 { display: grid; grid-template-columns: 1fr; gap: var(--spacing-xl); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .span-2 { grid-column: span 2; }
    
    .gap-2 { gap: var(--spacing-sm); }
    .gap-3 { gap: var(--spacing-md); }
    .gap-4 { gap: var(--spacing-lg); }
    .gap-5 { gap: var(--spacing-2xl); }
    
    .m-0 { margin: 0; }
    .mt-3 { margin-top: var(--spacing-md); }
    .mt-4 { margin-top: var(--spacing-xl); }
    .mb-4 { margin-bottom: var(--spacing-xl); }
    .p-3 { padding: var(--spacing-lg); }
    .p-4 { padding: var(--spacing-xl); }
    .pb-6 { padding-bottom: var(--spacing-4xl); }
    
    .bg-surface { background: var(--bg-secondary); }
    .border-radius-md { border-radius: var(--ui-border-radius-md); }
    .border-dashed { border: 1px dashed var(--border-secondary); }
    
    .text-sm { font-size: var(--font-size-sm); }
    .text-center { text-align: center; }
    .text-secondary { color: var(--text-secondary); }
    .text-tertiary { color: var(--text-tertiary); }
    .text-primary { color: var(--color-primary); }
    .text-error { color: var(--color-error); }
    .font-semibold { font-weight: var(--font-weight-semibold); }

    /* --------------------------------------------------------------------------
       HEADER
       -------------------------------------------------------------------------- */
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: var(--spacing-xl); }
    ::ng-deep .back-btn { color: var(--text-secondary) !important; background: var(--bg-secondary) !important; border: 1px solid var(--border-primary) !important; }
    ::ng-deep .back-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-bg) !important; border-color: var(--color-primary-border) !important; }
    .header-titles { display: flex; flex-direction: column; gap: 2px; }
    .page-title { font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); font-family: var(--font-heading); margin: 0; letter-spacing: -0.02em; }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }

    /* --------------------------------------------------------------------------
       FORM & CARDS
       -------------------------------------------------------------------------- */
    .glass-card { background: var(--component-bg, var(--bg-primary)); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-xl); box-shadow: var(--shadow-sm); }
    
    ::ng-deep .form-section-card .p-card-body { padding: var(--spacing-2xl); }
    ::ng-deep .form-section-card .p-card-content { padding: 0; }
    
    .section-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); display: flex; align-items: center; gap: var(--spacing-sm); margin: 0; }
    
    .input-group { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .info-label { font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.05em; }

    /* Overrides for Inputs */
    ::ng-deep .premium-input,
    ::ng-deep .premium-select .p-select,
    ::ng-deep .premium-select .p-multiselect,
    ::ng-deep .premium-calendar .p-datepicker .p-inputtext,
    ::ng-deep .premium-input .p-inputnumber-input {
      background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-md); transition: var(--transition-base); font-family: var(--font-body); color: var(--text-primary);
    }
    ::ng-deep .premium-input:not(:disabled):hover,
    ::ng-deep .premium-select .p-select:not(.p-disabled):hover,
    ::ng-deep .premium-select .p-multiselect:not(.p-disabled):hover,
    ::ng-deep .premium-calendar .p-datepicker .p-inputtext:not(.p-disabled):hover { border-color: var(--color-primary); }
    
    ::ng-deep .premium-input:focus,
    ::ng-deep .premium-select .p-select.p-focus,
    ::ng-deep .premium-select .p-multiselect.p-focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-bg) !important; }

    /* HTML5 Color Picker Customization */
    .color-picker-input {
      -webkit-appearance: none; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; padding: 0; overflow: hidden; box-shadow: 0 0 0 1px var(--border-primary); transition: var(--transition-base);
    }
    .color-picker-input::-webkit-color-swatch-wrapper { padding: 0; }
    .color-picker-input::-webkit-color-swatch { border: none; border-radius: 50%; }
    .color-picker-input:hover { box-shadow: 0 0 0 2px var(--color-primary); }

    .array-row { border: 1px solid var(--border-primary); transition: var(--transition-base); }
    .array-row:hover { border-color: var(--color-primary-border); box-shadow: var(--shadow-xs); }
    .drag-handle { cursor: grab; padding: 0 8px; }

    .form-footer { position: sticky; bottom: 0; background: var(--bg-primary); padding: var(--spacing-lg) 0; border-top: 1px solid var(--border-primary); z-index: 10; margin-top: var(--spacing-2xl); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .fade-in { animation: fadeIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .slide-down { animation: slideDown 0.5s cubic-bezier(0.2, 0.9, 0.2, 1); animation-fill-mode: both; }

    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      .span-2 { grid-column: span 1; }
      .array-row { flex-wrap: wrap; }
      .w-8rem, .w-6rem, .w-10rem { width: 100%; }
    }
  `]
})
export class ShiftGroupFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State
  form!: FormGroup;
  groupId: string | null = null;
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  // Mock Lookups (To be replaced with real API calls if available)
  organizations = [{ id: '698f1a7feff3e811b71a590f', name: 'Main Organization' }];
  branches = [{ id: '698f1a82eff3e811b71a5916', name: 'Head Office HQ' }];
  departments = [{ id: 'd1', name: 'Sales' }, { id: 'd2', name: 'IT Support' }, { id: 'd3', name: 'Nursing' }];
  designations = [{ id: 'des1', name: 'Manager' }, { id: 'des2', name: 'Staff' }];
  availableShifts = [
    { id: '698f1a7feff3e811b71a5910', name: 'Morning Shift (08:00 - 16:00)' },
    { id: 'sh2', name: 'Evening Shift (16:00 - 00:00)' },
    { id: 'sh3', name: 'Night Shift (00:00 - 08:00)' }
  ];
  rotationTypes = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
  ];

  ngOnInit() {
    this.initForm();
    this.groupId = this.route.snapshot.paramMap.get('id');
    
    if (this.groupId) {
      this.isEditMode.set(true);
      this.loadShiftGroup(this.groupId);
    } else {
      this.isLoading.set(false);
      // Pre-fill a default pattern for quick start
      this.addShift();
      this.addRotationPattern();
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(50)]],
      description: [''],
      organizationId: [null, Validators.required],
      branchId: [null],
      
      shifts: this.fb.array([]),
      
      rotationType: ['weekly', Validators.required],
      rotationPattern: this.fb.array([]),
      
      applicableDepartments: [[]],
      applicableDesignations: [[]],
      
      isActive: [true],
      effectiveFrom: [null],
      effectiveTo: [null]
    });
  }

  // --- FormArray Getters & Methods for 'shifts' ---
  get shiftsArray(): FormArray {
    return this.form.get('shifts') as FormArray;
  }

  addShift(shiftData?: any) {
    const shiftGroup = this.fb.group({
      shiftId: [shiftData?.shiftId || null, Validators.required],
      sequence: [shiftData?.sequence || (this.shiftsArray.length + 1), Validators.required],
      color: [shiftData?.color || '#3b82f6'] // Default blue
    });
    this.shiftsArray.push(shiftGroup);
  }

  removeShift(index: number) {
    this.shiftsArray.removeAt(index);
  }

  // --- FormArray Getters & Methods for 'rotationPattern' ---
  get rotationPatternArray(): FormArray {
    return this.form.get('rotationPattern') as FormArray;
  }

  addRotationPattern(patternData?: any) {
    const patternGroup = this.fb.group({
      dayOffset: [patternData?.dayOffset ?? this.rotationPatternArray.length, [Validators.required, Validators.min(0)]],
      shiftId: [patternData?.shiftId || null] // Null implies a day off
    });
    this.rotationPatternArray.push(patternGroup);
  }

  removeRotationPattern(index: number) {
    this.rotationPatternArray.removeAt(index);
  }

  // --- Data Loading & Saving ---
  private loadShiftGroup(id: string) {
    this.hrmsService.getShiftGroup(id).pipe(
      catchError(() => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load shift group.' });
        this.onCancel();
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe((res: any) => {
      const groupData = res?.data?.shiftGroup || res;
      if (groupData) {
        this.patchFormValues(groupData);
      }
    });
  }

  private patchFormValues(data: any) {
    // 1. Patch basic fields
    this.form.patchValue({
      name: data.name,
      code: data.code,
      description: data.description,
      organizationId: data.organizationId,
      branchId: data.branchId,
      rotationType: data.rotationType || 'weekly',
      applicableDepartments: data.applicableDepartments || [],
      applicableDesignations: data.applicableDesignations || [],
      isActive: data.isActive ?? true,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
    });

    // 2. Clear and Patch FormArrays
    this.shiftsArray.clear();
    if (data.shifts && Array.isArray(data.shifts)) {
      data.shifts.forEach((s: any) => this.addShift(s));
    }

    this.rotationPatternArray.clear();
    if (data.rotationPattern && Array.isArray(data.rotationPattern)) {
      data.rotationPattern.forEach((rp: any) => this.addRotationPattern(rp));
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      // Mark all as touched to show errors
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields correctly.' });
      return;
    }

    this.isSaving.set(true);
    const payload = this.form.value;

    const request$ = this.isEditMode() && this.groupId
      ? this.hrmsService.updateShiftGroup(this.groupId, payload)
      : this.hrmsService.createShiftGroup(payload);

    request$.pipe(
      catchError(err => {
        this.messageService.add({ severity: 'error', summary: 'Save Failed', detail: err?.error?.message || 'An error occurred while saving.' });
        return of(null);
      }),
      finalize(() => this.isSaving.set(false))
    ).subscribe(res => {
      if (res) {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shift group saved successfully.' });
        // Slight delay to allow toast to be seen before navigation
        setTimeout(() => this.onCancel(), 1000); 
      }
    });
  }

  onCancel() {
    this.router.navigate(['/shift-groups']);
  }
}