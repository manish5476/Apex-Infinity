import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map, Subject } from 'rxjs';

import { MasterListService } from '../../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [ReactiveFormsModule, CardModule, SelectModule, DatePickerModule, ToggleSwitchModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <i class="pi pi-arrow-left"></i>
          </button>
          <div>
            <h1 class="page-title">{{ isEditMode() ? 'Edit Department' : 'Create Department' }}</h1>
            <p class="page-subtitle">Configure organization hierarchy and metrics.</p>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-status" [class.valid]="deptForm.valid">
            <div class="status-dot"></div>
            <span>{{ deptForm.valid ? 'Ready' : 'Draft' }}</span>
          </div>
          <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || deptForm.invalid" (click)="onSubmit()">
            @if (!isSubmitting()) {
              <i class="pi pi-save"></i>
              <span>{{ isEditMode() ? 'Update Department' : 'Save Department' }}</span>
            } @else {
              <i class="pi pi-spin pi-spinner"></i>
              <span>{{ isEditMode() ? 'Updating...' : 'Saving...' }}</span>
            }
          </button>
        </div>
      </header>

      <main class="dashboard-content" [class.loading-opacity]="isLoading()">
        <form [formGroup]="deptForm" class="bento-grid">
          
          <p-card styleClass="grid-card span-2 card-anim-1">
            <ng-template pTemplate="header">
              <div class="card-header-custom">
                <i class="pi pi-building text-primary"></i>
                <h2>Core Identity</h2>
              </div>
            </ng-template>
            
            <div class="inner-grid-2">
              <div class="form-field">
                <label for="name">Department Name <span class="required">*</span></label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-id-card input-icon"></i>
                  <input id="name" type="text" formControlName="name" class="se-input with-icon" placeholder="e.g. Engineering">
                </div>
              </div>

              <div class="form-field">
                <label for="code">Department Code <span class="required">*</span></label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-tag input-icon"></i>
                  <input id="code" type="text" formControlName="code" class="se-input with-icon uppercase-input" placeholder="e.g. ENG">
                </div>
              </div>

              <div class="form-field">
                <label for="parentDepartment">Parent Department</label>
                <p-select 
                  id="parentDepartment" 
                  formControlName="parentDepartment" 
                  [options]="formattedDeptOptions()" 
                  optionLabel="displayName" 
                  optionValue="_id" 
                  placeholder="None (Root Level)" 
                  [showClear]="true" 
                  [filter]="true"
                  filterPlaceholder="Search departments..."
                  styleClass="w-full prime-override" 
                  appendTo="body">
                </p-select>
              </div>

              <div class="form-field">
                <label for="branchId">Branch Assignment</label>
                <p-select 
                  id="branchId" 
                  formControlName="branchId" 
                  [options]="branchOptions()" 
                  optionLabel="name" 
                  optionValue="_id" 
                  placeholder="Select Branch Location" 
                  [showClear]="true" 
                  styleClass="w-full prime-override" 
                  appendTo="body"
                  [filter]="true"
                  filterBy="name">
                </p-select>

              </div>

              <div class="form-field span-2-inner">
                <label for="description">Department Description</label>
                <textarea id="description" formControlName="description" rows="3" class="se-input se-textarea" placeholder="Provide a brief overview of this department's function..."></textarea>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card card-anim-2">
            <ng-template pTemplate="header">
              <div class="card-header-custom">
                <i class="pi pi-sitemap text-primary"></i>
                <h2>Leadership</h2>
              </div>
            </ng-template>
            
            <div class="flex-col gap-4">
              <div class="form-field">
                <label for="headOfDepartment">Head of Department (HOD)</label>
                <p-select 
                  id="headOfDepartment" 
                  formControlName="headOfDepartment" 
                  [options]="userOptions()" 
                  optionLabel="name" 
                  optionValue="_id" 
                  placeholder="Unassigned" 
                  [showClear]="true" 
                  [filter]="true"
                  filterPlaceholder="Search employees..."
                  styleClass="w-full prime-override" 
                  appendTo="body">
                </p-select>
              </div>

              <div class="form-field">
                <label for="assistantHOD">Assistant HOD</label>
                <p-select 
                  id="assistantHOD" 
                  formControlName="assistantHOD" 
                  [options]="userOptions()" 
                  optionLabel="name" 
                  optionValue="_id" 
                  placeholder="Unassigned" 
                  [showClear]="true" 
                  [filter]="true"
                  filterPlaceholder="Search employees..."
                  styleClass="w-full prime-override" 
                  appendTo="body">
                </p-select>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card card-anim-3">
            <ng-template pTemplate="header">
              <div class="card-header-custom">
                <i class="pi pi-chart-pie text-primary"></i>
                <h2>Operations & Budget</h2>
              </div>
            </ng-template>
            
            <div class="flex-col gap-4">
              <div class="form-field">
                <label for="costCenter">Cost Center ID</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-wallet input-icon"></i>
                  <input id="costCenter" type="text" formControlName="costCenter" class="se-input with-icon uppercase-input" placeholder="e.g. CC-101">
                </div>
              </div>

              <div class="form-field">
                <label for="budgetCode">Budget Code</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-book input-icon"></i>
                  <input id="budgetCode" type="text" formControlName="budgetCode" class="se-input with-icon uppercase-input" placeholder="e.g. BC-2024">
                </div>
              </div>

              <div class="form-field">
                <label for="maxStrength">Max Headcount Capacity</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-users input-icon"></i>
                  <input id="maxStrength" type="number" formControlName="maxStrength" class="se-input with-icon" placeholder="0">
                </div>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card card-anim-4">
            <ng-template pTemplate="header">
              <div class="card-header-custom">
                <i class="pi pi-address-book text-primary"></i>
                <h2>Contact Information</h2>
              </div>
            </ng-template>
            
            <div class="flex-col gap-4">
              <div class="form-field">
                <label for="contactEmail">Department Email</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-envelope input-icon"></i>
                  <input id="contactEmail" type="email" formControlName="contactEmail" class="se-input with-icon" placeholder="dept@company.com">
                </div>
              </div>

              <div class="form-field">
                <label for="contactPhone">Contact Phone</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-phone input-icon"></i>
                  <input id="contactPhone" type="text" formControlName="contactPhone" class="se-input with-icon" placeholder="+1 (555) 000-0000">
                </div>
              </div>

              <div class="form-field">
                <label for="location">Physical Location</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-map-marker input-icon"></i>
                  <input id="location" type="text" formControlName="location" class="se-input with-icon" placeholder="e.g. Floor 3, Wing B">
                </div>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card card-anim-5" formGroupName="metadata">
            <ng-template pTemplate="header">
              <div class="card-header-custom">
                <i class="pi pi-sliders-v text-primary"></i>
                <h2>System Metadata</h2>
              </div>
            </ng-template>
            
            <div class="flex-col gap-4">
              <div class="form-field">
                <label for="establishedDate">Date Established</label>
                <p-datepicker 
                  id="establishedDate" 
                  formControlName="establishedDate" 
                  [showIcon]="false" 
                  iconDisplay="input" 
                  placeholder="Select Date" 
                  dateFormat="yy-mm-dd"
                  styleClass="w-full prime-override" 
                  appendTo="body">
                </p-datepicker>
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="division">Division</label>
                  <input id="division" type="text" formControlName="division" class="se-input" placeholder="e.g. Tech">
                </div>

                <div class="form-field">
                  <label for="region">Region</label>
                  <input id="region" type="text" formControlName="region" class="se-input" placeholder="e.g. APAC">
                </div>
              </div>

              <label class="status-toggle-wrapper flex-between cursor-pointer mt-auto">
                <div class="toggle-text">
                  <span class="toggle-label font-bold">Active Department</span>
                </div>
                <p-toggleswitch formControlName="isActive"></p-toggleswitch>
              </label>
            </div>
          </p-card>

        </form>
      </main>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       BASE THEME & LAYOUT
       ========================================================================== */
    :host { 
      display: block; width: 100%; height: 100vh; 
      background-color: var(--bg-secondary); 
      font-family: var(--font-body); color: var(--text-primary); 
      overflow: hidden; 
    }
    
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
    /* Utilities */
    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-4 { gap: var(--spacing-lg); }
    .mt-auto { margin-top: auto; }
    .font-bold { font-weight: 700; }
    .text-primary { color: var(--color-primary); }
    .w-full { width: 100%; }

    /* --------------------------------------------------------------------------
       HEADER
       -------------------------------------------------------------------------- */
    .dashboard-header { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: var(--spacing-lg) var(--spacing-2xl); 
      background: var(--bg-primary); border-bottom: 1px solid var(--border-secondary); 
      z-index: 50; flex-shrink: 0; box-shadow: var(--shadow-xs);
    }
    
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-xl); }
    
    .icon-btn { 
      background: var(--bg-secondary); border: 1px solid var(--border-secondary); 
      color: var(--text-secondary); border-radius: var(--ui-border-radius-lg); 
      width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; 
      cursor: pointer; transition: all 0.2s ease; font-size: 18px;
    }
    .icon-btn:hover { background: var(--bg-primary); color: var(--text-primary); border-color: var(--color-primary); }
    
    .page-title { font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin: 0 0 2px 0; line-height: 1.2; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
    
    /* Validation Status Badge */
    .header-status { 
      display: flex; align-items: center; gap: 8px; 
      font-size: 12px; font-weight: 700; color: var(--text-secondary); 
      padding: 6px 14px; background: var(--bg-secondary); 
      border-radius: 20px; border: 1px solid var(--border-secondary); 
      margin-right: var(--spacing-md); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success); border-color: var(--color-success-border); background: var(--color-success-bg); }
    .header-status.valid .status-dot { background: var(--color-success); }
    
    /* Buttons */
    .btn { 
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; 
      height: 40px; padding: 0 20px; font-size: 14px; font-weight: 600; 
      border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: none; 
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-primary); }
    .btn-outline:not(:disabled):hover { background: var(--bg-secondary); border-color: var(--text-tertiary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

    /* --------------------------------------------------------------------------
       MAIN CONTENT & BENTO GRID
       -------------------------------------------------------------------------- */
    .dashboard-content { 
      flex: 1; overflow-y: auto; padding: var(--spacing-2xl) var(--spacing-3xl); 
      background: var(--bg-secondary); transition: opacity 0.3s; 
    }
    .loading-opacity { opacity: 0.5; pointer-events: none; filter: grayscale(50%); }
    
    .bento-grid { 
      display: grid; grid-template-columns: repeat(3, 1fr); 
      gap: var(--spacing-2xl); align-items: start; max-width: 1600px; margin: 0 auto; 
    }
    .span-2 { grid-column: span 2; } 
    .span-2-inner { grid-column: span 2; }
    
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }

    /* --------------------------------------------------------------------------
       P-CARD OVERRIDES (Premium Glass Look + Anti-aliasing Fix)
       -------------------------------------------------------------------------- */
    ::ng-deep .grid-card .p-card {
      height: 100%; border-radius: var(--ui-border-radius-lg); 
      box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); 
      background: var(--bg-primary); display: flex; flex-direction: column; 
      transition: all 0.2s ease; overflow: hidden;
      background-clip: padding-box; /* Fix for WebKit Corner Bleed */
    }
    ::ng-deep .grid-card .p-card:hover {
      box-shadow: var(--shadow-md); border-color: var(--color-primary-light, var(--border-primary)); 
    }
    
    ::ng-deep .grid-card .p-card-header { padding: 0; }
    .card-header-custom {
      padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px;
      /* Subtract 1px from the border-radius to perfectly hug the parent's inner bound */
      border-top-left-radius: calc(var(--ui-border-radius-lg) - 1px); 
      border-top-right-radius: calc(var(--ui-border-radius-lg) - 1px);
    }
    .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
    .card-header-custom i { font-size: 18px; }

    ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
    ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

    /* --------------------------------------------------------------------------
       FORM FIELDS & INPUTS
       -------------------------------------------------------------------------- */
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { 
      font-size: 11px; font-weight: 700; color: var(--text-tertiary); 
      text-transform: uppercase; letter-spacing: 0.5px; 
    }
    .required { color: var(--color-error); font-weight: bold; margin-left: 2px; }

    .input-icon-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 14px; color: var(--text-tertiary); font-size: 14px; z-index: 1; }
    
    .se-input { 
      width: 100%; background: var(--bg-primary); border: 1px solid var(--border-secondary); 
      border-radius: 8px; padding: 0 16px; font-size: 14px; font-family: var(--font-body); 
      color: var(--text-primary); box-sizing: border-box; height: 42px; font-weight: 500;
      transition: all 0.2s ease; outline: none;
    }
    .se-input.with-icon { padding-left: 40px; }
    .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    .se-input::placeholder { color: var(--text-tertiary); font-weight: 400; }
    
    .uppercase-input { text-transform: uppercase; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px; }
    .se-textarea { height: auto; min-height: 80px; resize: vertical; padding-top: 12px; line-height: 1.5; }

    /* --------------------------------------------------------------------------
       PRIME-NG SELECT & DATEPICKER OVERRIDES
       -------------------------------------------------------------------------- */
    // ::ng-deep .prime-override.p-select, 
    // ::ng-deep .prime-override .p-inputtext {
    //   width: 100%; height: 42px; background: var(--bg-primary);
    //   border: 1px solid var(--border-secondary); border-radius: 8px;
    //   font-family: var(--font-body); font-size: 14px; font-weight: 500;
    //   color: var(--text-primary); display: flex; align-items: center;
    //   transition: all 0.2s ease; box-shadow: none;
    // }
    // ::ng-deep .prime-override.p-select:not(.p-disabled):hover,
    // ::ng-deep .prime-override .p-inputtext:not(:disabled):hover {
    //   border-color: var(--text-tertiary);
    // }
    // ::ng-deep .prime-override.p-select.p-focus,
    // ::ng-deep .prime-override .p-inputtext:focus,
    // ::ng-deep .prime-override.p-datepicker-input-icon-container {
    //   border-color: var(--color-primary);
    //   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    // }
    /* Internal spacing for Select label */
    // ::ng-deep .prime-override.p-select .p-select-label { padding: 0 16px; }

    /* --------------------------------------------------------------------------
       TOGGLE SWITCH
       -------------------------------------------------------------------------- */
    .status-toggle-wrapper { 
      padding: var(--spacing-lg); background: var(--bg-secondary); 
      border: 1px solid var(--border-secondary); border-radius: 12px; 
    }
    .toggle-container { display: flex; align-items: center; cursor: pointer; gap: 14px; }
    .toggle-input { display: none; }
    .toggle-slider { 
      position: relative; width: 44px; height: 24px; background-color: var(--border-secondary); 
      border-radius: 24px; transition: all 0.3s ease; flex-shrink: 0; 
    }
    .toggle-slider::before { 
      content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; 
      background-color: #ffffff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); 
      box-shadow: var(--shadow-sm); 
    }
    .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(20px); }
    .toggle-label { font-size: 14px; color: var(--text-primary); }

    /* --------------------------------------------------------------------------
       ANIMATIONS
       -------------------------------------------------------------------------- */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .card-anim-1 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s both; } 
    .card-anim-2 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; } 
    .card-anim-3 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; } 
    .card-anim-4 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
    .card-anim-5 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }

    /* Responsive */
    @media (max-width: 1200px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2 { grid-column: span 2; }
    }
    @media (max-width: 768px) {
      .dashboard-content { padding: var(--spacing-lg); }
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-lg); }
      .header-right { width: 100%; justify-content: flex-end; }
      .bento-grid { grid-template-columns: 1fr; }
      .span-2, .span-2-inner { grid-column: span 1; }
      .inner-grid-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class DepartmentFormComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  deptForm!: FormGroup;
  
  // State management signals
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  deptId: string | null = null;

  departmentOptions = signal<any[]>([]);
  userOptions = this.masterList.users;
  branchOptions = this.masterList.branches;

  // Computed Signal to correctly format the Parent Department label string
  formattedDeptOptions = computed(() => {
    return this.departmentOptions().map(d => ({
      ...d,
      displayName: `${d.name} (${d.code})`
    }));
  });

  ngOnInit() {
    this.initForm();
    this.loadDependencies();
    this.checkEditMode();
  }

  private initForm() {
    this.deptForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      description: [''],

      parentDepartment: [null],
      branchId: [null],
      headOfDepartment: [null],
      assistantHOD: [null],

      costCenter: [''],
      budgetCode: [''],
      maxStrength: [null, Validators.min(0)],

      contactEmail: ['', [Validators.email]],
      contactPhone: [''],
      location: [''],

      isActive: [true],

      metadata: this.fb.group({
        establishedDate: [null],
        division: [''],
        region: ['']
      })
    });

    this.deptForm.get('code')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.deptForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private loadDependencies() {
    this.hrmsService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        if (res.data && res.data.departments) {
          this.departmentOptions.set(res.data.departments);
        }
      }
    });
  }

  private checkEditMode() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.deptId = id;
        this.loadDepartmentDetails();
      }
    });
  }

  private loadDepartmentDetails() {
    this.isLoading.set(true);
    this.deptForm.disable(); 
    
    this.hrmsService.getDepartment(this.deptId!).pipe(
      map((res: any) => res?.data?.data || res),
      catchError(err => {
        this.isLoading.set(false);
        this.deptForm.enable();
        this.messageService.handleHttpError(err)
        return of(null);
      }), takeUntil(this.destroy$)
    ).subscribe((data) => {
      if (data) {
        this.patchFormValues(data);
      }
      this.isLoading.set(false);
      this.deptForm.enable();
    });
  }

  private patchFormValues(data: any) {
    // PrimeNG Datepicker prefers actual Date objects rather than strings
    const establishedDateObj = data.metadata?.establishedDate 
      ? new Date(data.metadata.establishedDate) 
      : null;

    this.deptForm.patchValue({
      name: data.name,
      code: data.code,
      description: data.description,
      
      parentDepartment: data.parentDepartment?._id || data.parentDepartment,
      branchId: data.branchId?._id || data.branchId,
      headOfDepartment: data.headOfDepartment?._id || data.headOfDepartment,
      assistantHOD: data.assistantHOD?._id || data.assistantHOD,

      costCenter: data.costCenter,
      budgetCode: data.budgetCode,
      maxStrength: data.maxStrength,

      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      location: data.location,

      isActive: data.isActive ?? true,

      metadata: {
        establishedDate: establishedDateObj,
        division: data.metadata?.division || '',
        region: data.metadata?.region || ''
      }
    });
  }

  onSubmit() {
    if (this.deptForm.invalid) {
      this.deptForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload = { ...this.deptForm.value };

    // Format the Datepicker Date object back into an ISO string for the backend
    if (payload.metadata?.establishedDate instanceof Date) {
      payload.metadata.establishedDate = payload.metadata.establishedDate.toISOString().split('T')[0];
    }

    // Clean up empty payload data
    if (!payload.parentDepartment) delete payload.parentDepartment;
    if (!payload.branchId) delete payload.branchId;
    if (!payload.headOfDepartment) delete payload.headOfDepartment;
    if (!payload.assistantHOD) delete payload.assistantHOD;

    if (this.isEditMode()) {
      this.hrmsService.updateDepartment(this.deptId!, payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess( 'Department updated successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err)
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.hrmsService.createDepartment(payload).pipe(takeUntil(this.destroy$)).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Department created successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err)
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/hrms/department/list']); 
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { of, catchError, map } from 'rxjs';

// import { MasterListService } from '../../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../../core/services/message.service';
// import { HRMSService } from '../../../hrms.service';

// // PrimeNG
// import { CardModule } from 'primeng/card';

// @Component({
//   selector: 'app-department-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, CardModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
      
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
//             <i class="pi pi-arrow-left"></i>
//           </button>
//           <div>
//             <h1 class="page-title">{{ isEditMode() ? 'Edit Department' : 'Create Department' }}</h1>
//             <p class="page-subtitle">Configure organization hierarchy and metrics.</p>
//           </div>
//         </div>
        
//         <div class="header-right">
//           <div class="header-status" [class.valid]="deptForm.valid">
//             <div class="status-dot"></div>
//             <span>{{ deptForm.valid ? 'Ready' : 'Draft' }}</span>
//           </div>
//           <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
//           <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || deptForm.invalid" (click)="onSubmit()">
//             <ng-container *ngIf="!isSubmitting(); else loadingState">
//               <i class="pi pi-save"></i>
//               <span>{{ isEditMode() ? 'Update Department' : 'Save Department' }}</span>
//             </ng-container>
//             <ng-template #loadingState>
//               <i class="pi pi-spin pi-spinner"></i>
//               <span>{{ isEditMode() ? 'Updating...' : 'Saving...' }}</span>
//             </ng-template>
//           </button>
//         </div>
//       </header>

//       <main class="dashboard-content" [class.loading-opacity]="isLoading()">
//         <form [formGroup]="deptForm" class="bento-grid">
          
//           <p-card styleClass="grid-card span-2 card-anim-1">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom">
//                 <i class="pi pi-building text-primary"></i>
//                 <h2>Core Identity</h2>
//               </div>
//             </ng-template>
            
//             <div class="inner-grid-2">
//               <div class="form-field">
//                 <label for="name">Department Name <span class="required">*</span></label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-id-card input-icon"></i>
//                   <input id="name" type="text" formControlName="name" class="se-input with-icon" placeholder="e.g. Engineering">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="code">Department Code <span class="required">*</span></label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-tag input-icon"></i>
//                   <input id="code" type="text" formControlName="code" class="se-input with-icon uppercase-input" placeholder="e.g. ENG">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="parentDepartment">Parent Department</label>
//                 <div class="select-wrapper">
//                   <select id="parentDepartment" formControlName="parentDepartment" class="se-input">
//                     <option [ngValue]="null">None (Root Level)</option>
//                     @for (dept of departmentOptions(); track dept._id) {
//                       <option [value]="dept._id">{{ dept.name }} ({{ dept.code }})</option>
//                     }
//                   </select>
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="branchId">Branch Assignment</label>
//                 <div class="select-wrapper">
//                   <select id="branchId" formControlName="branchId" class="se-input">
//                     <option [ngValue]="null">Select Branch Location</option>
//                     @for (branch of branchOptions(); track branch._id) {
//                       <option [value]="branch._id">{{ branch.name }}</option>
//                     }
//                   </select>
//                 </div>
//               </div>

//               <div class="form-field span-2-inner">
//                 <label for="description">Department Description</label>
//                 <textarea id="description" formControlName="description" rows="3" class="se-input se-textarea" placeholder="Provide a brief overview of this department's function..."></textarea>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card card-anim-2">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom">
//                 <i class="pi pi-sitemap text-primary"></i>
//                 <h2>Leadership</h2>
//               </div>
//             </ng-template>
            
//             <div class="flex-col gap-4">
//               <div class="form-field">
//                 <label for="headOfDepartment">Head of Department (HOD)</label>
//                 <div class="select-wrapper">
//                   <select id="headOfDepartment" formControlName="headOfDepartment" class="se-input">
//                     <option [ngValue]="null">Unassigned</option>
//                     @for (user of userOptions(); track user._id) {
//                       <option [value]="user._id">{{ user.name }}</option>
//                     }
//                   </select>
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="assistantHOD">Assistant HOD</label>
//                 <div class="select-wrapper">
//                   <select id="assistantHOD" formControlName="assistantHOD" class="se-input">
//                     <option [ngValue]="null">Unassigned</option>
//                     @for (user of userOptions(); track user._id) {
//                       <option [value]="user._id">{{ user.name }}</option>
//                     }
//                   </select>
//                 </div>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card card-anim-3">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom">
//                 <i class="pi pi-chart-pie text-primary"></i>
//                 <h2>Operations & Budget</h2>
//               </div>
//             </ng-template>
            
//             <div class="flex-col gap-4">
//               <div class="form-field">
//                 <label for="costCenter">Cost Center ID</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-wallet input-icon"></i>
//                   <input id="costCenter" type="text" formControlName="costCenter" class="se-input with-icon uppercase-input" placeholder="e.g. CC-101">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="budgetCode">Budget Code</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-book input-icon"></i>
//                   <input id="budgetCode" type="text" formControlName="budgetCode" class="se-input with-icon uppercase-input" placeholder="e.g. BC-2024">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="maxStrength">Max Headcount Capacity</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-users input-icon"></i>
//                   <input id="maxStrength" type="number" formControlName="maxStrength" class="se-input with-icon" placeholder="0">
//                 </div>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card card-anim-4">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom">
//                 <i class="pi pi-address-book text-primary"></i>
//                 <h2>Contact Information</h2>
//               </div>
//             </ng-template>
            
//             <div class="flex-col gap-4">
//               <div class="form-field">
//                 <label for="contactEmail">Department Email</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-envelope input-icon"></i>
//                   <input id="contactEmail" type="email" formControlName="contactEmail" class="se-input with-icon" placeholder="dept@company.com">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="contactPhone">Contact Phone</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-phone input-icon"></i>
//                   <input id="contactPhone" type="text" formControlName="contactPhone" class="se-input with-icon" placeholder="+1 (555) 000-0000">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="location">Physical Location</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-map-marker input-icon"></i>
//                   <input id="location" type="text" formControlName="location" class="se-input with-icon" placeholder="e.g. Floor 3, Wing B">
//                 </div>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card card-anim-5" formGroupName="metadata">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom">
//                 <i class="pi pi-sliders-v text-primary"></i>
//                 <h2>System Metadata</h2>
//               </div>
//             </ng-template>
            
//             <div class="flex-col gap-4">
//               <div class="form-field">
//                 <label for="establishedDate">Date Established</label>
//                 <div class="input-icon-wrapper">
//                   <i class="pi pi-calendar input-icon"></i>
//                   <input id="establishedDate" type="date" formControlName="establishedDate" class="se-input with-icon">
//                 </div>
//               </div>

//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="division">Division</label>
//                   <input id="division" type="text" formControlName="division" class="se-input" placeholder="e.g. Tech">
//                 </div>

//                 <div class="form-field">
//                   <label for="region">Region</label>
//                   <input id="region" type="text" formControlName="region" class="se-input" placeholder="e.g. APAC">
//                 </div>
//               </div>

//               <div class="status-toggle-wrapper mt-auto" [formGroup]="deptForm">
//                 <label class="toggle-container">
//                   <input type="checkbox" formControlName="isActive" class="toggle-input">
//                   <span class="toggle-slider"></span>
//                   <div class="toggle-text">
//                     <span class="toggle-label font-bold">Active Department</span>
//                   </div>
//                 </label>
//               </div>
//             </div>
//           </p-card>

//         </form>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        BASE THEME & LAYOUT
//        ========================================================================== */
//     :host { 
//       display: block; width: 100%; height: 100vh; 
//       background-color: var(--bg-secondary); 
//       font-family: var(--font-body); color: var(--text-primary); 
//       overflow: hidden; 
//     }
    
//     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    
//     /* Utilities */
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-align { display: flex; align-items: center; }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-4 { gap: var(--spacing-lg); }
//     .mt-auto { margin-top: auto; }
//     .font-bold { font-weight: 700; }
//     .text-primary { color: var(--color-primary); }

//     /* --------------------------------------------------------------------------
//        HEADER
//        -------------------------------------------------------------------------- */
//     .dashboard-header { 
//       display: flex; justify-content: space-between; align-items: center; 
//       padding: var(--spacing-lg) var(--spacing-2xl); 
//       background: var(--bg-primary); border-bottom: 1px solid var(--border-secondary); 
//       z-index: 50; flex-shrink: 0; box-shadow: var(--shadow-xs);
//     }
    
//     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-xl); }
    
//     .icon-btn { 
//       background: var(--bg-secondary); border: 1px solid var(--border-secondary); 
//       color: var(--text-secondary); border-radius: var(--ui-border-radius-lg); 
//       width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; 
//       cursor: pointer; transition: all 0.2s ease; font-size: 18px;
//     }
//     .icon-btn:hover { background: var(--bg-primary); color: var(--text-primary); border-color: var(--color-primary); }
    
//     .page-title { font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin: 0 0 2px 0; line-height: 1.2; letter-spacing: -0.5px; }
//     .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
    
//     /* Validation Status Badge */
//     .header-status { 
//       display: flex; align-items: center; gap: 8px; 
//       font-size: 12px; font-weight: 700; color: var(--text-secondary); 
//       padding: 6px 14px; background: var(--bg-secondary); 
//       border-radius: 20px; border: 1px solid var(--border-secondary); 
//       margin-right: var(--spacing-md); text-transform: uppercase; letter-spacing: 0.5px;
//     }
//     .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); }
//     .header-status.valid { color: var(--color-success); border-color: var(--color-success-border); background: var(--color-success-bg); }
//     .header-status.valid .status-dot { background: var(--color-success); }
    
//     /* Buttons */
//     .btn { 
//       display: inline-flex; align-items: center; justify-content: center; gap: 8px; 
//       height: 40px; padding: 0 20px; font-size: 14px; font-weight: 600; 
//       border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: none; 
//     }
//     .btn:disabled { opacity: 0.6; cursor: not-allowed; }
//     .btn-outline { background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--text-primary); }
//     .btn-outline:not(:disabled):hover { background: var(--bg-secondary); border-color: var(--text-tertiary); }
//     .btn-primary { background: var(--color-primary); color: #ffffff; }
//     .btn-primary:not(:disabled):hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }

//     /* --------------------------------------------------------------------------
//        MAIN CONTENT & BENTO GRID
//        -------------------------------------------------------------------------- */
//     .dashboard-content { 
//       flex: 1; overflow-y: auto; padding: var(--spacing-2xl) var(--spacing-3xl); 
//       background: var(--bg-secondary); transition: opacity 0.3s; 
//     }
//     .loading-opacity { opacity: 0.5; pointer-events: none; filter: grayscale(50%); }
    
//     .bento-grid { 
//       display: grid; grid-template-columns: repeat(3, 1fr); 
//       gap: var(--spacing-2xl); align-items: start; max-width: 1600px; margin: 0 auto; 
//     }
//     .span-2 { grid-column: span 2; } 
//     .span-2-inner { grid-column: span 2; }
    
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }

//     /* --------------------------------------------------------------------------
//        P-CARD OVERRIDES (Premium Glass Look)
//        -------------------------------------------------------------------------- */
//     // ::ng-deep .grid-card .p-card {
//     //   height: 100%; border-radius: var(--ui-border-radius-lg); 
//     //   box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); 
//     //   background: var(--bg-primary); display: flex; flex-direction: column; 
//     //   transition: all 0.2s ease; overflow: hidden;
//     // }
//     // ::ng-deep .grid-card .p-card:hover {
//     //   box-shadow: var(--shadow-md); border-color: var(--color-primary-light, var(--border-primary)); 
//     // }
    
//     // ::ng-deep .grid-card .p-card-header { padding: 0; }
//     // .card-header-custom {
//     //   padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary);
//     //   border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px;
//     //   border-top-left-radius: var(--ui-border-radius-lg); border-top-right-radius: var(--ui-border-radius-lg);
//     // }
//     .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
//     .card-header-custom i { font-size: 18px; }

//     // ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
//     // ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

//     /* --------------------------------------------------------------------------
//        FORM FIELDS & INPUTS
//        -------------------------------------------------------------------------- */
//     .form-field { display: flex; flex-direction: column; gap: 6px; }
//     .form-field label { 
//       font-size: 11px; font-weight: 700; color: var(--text-tertiary); 
//       text-transform: uppercase; letter-spacing: 0.5px; 
//     }
//     .required { color: var(--color-error); font-weight: bold; margin-left: 2px; }

//     .input-icon-wrapper { position: relative; display: flex; align-items: center; }
//     .input-icon { position: absolute; left: 14px; color: var(--text-tertiary); font-size: 14px; }
    
//     .se-input { 
//       width: 100%; background: var(--bg-primary); border: 1px solid var(--border-secondary); 
//       border-radius: 8px; padding: 0 16px; font-size: 14px; font-family: var(--font-body); 
//       color: var(--text-primary); box-sizing: border-box; height: 42px; font-weight: 500;
//       transition: all 0.2s ease; outline: none;
//     }
//     .se-input.with-icon { padding-left: 40px; }
//     .se-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
//     .se-input::placeholder { color: var(--text-tertiary); font-weight: 400; }
    
//     .uppercase-input { text-transform: uppercase; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px; }
//     .se-textarea { height: auto; min-height: 80px; resize: vertical; padding-top: 12px; line-height: 1.5; }
    
//     .select-wrapper { position: relative; } 
//     select.se-input { appearance: none; padding-right: 36px; cursor: pointer; }
//     .select-wrapper::after {
//       content: "\\e933"; font-family: 'primeicons'; position: absolute; 
//       right: 14px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); 
//       pointer-events: none; font-size: 12px;
//     }

//     /* --------------------------------------------------------------------------
//        TOGGLE SWITCH
//        -------------------------------------------------------------------------- */
//     .status-toggle-wrapper { 
//       padding: var(--spacing-lg); background: var(--bg-secondary); 
//       border: 1px solid var(--border-secondary); border-radius: 12px; 
//     }
//     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: 14px; }
//     .toggle-input { display: none; }
//     .toggle-slider { 
//       position: relative; width: 44px; height: 24px; background-color: var(--border-secondary); 
//       border-radius: 24px; transition: all 0.3s ease; flex-shrink: 0; 
//     }
//     .toggle-slider::before { 
//       content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; 
//       background-color: #ffffff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); 
//       box-shadow: var(--shadow-sm); 
//     }
//     .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
//     .toggle-input:checked + .toggle-slider::before { transform: translateX(20px); }
//     .toggle-label { font-size: 14px; color: var(--text-primary); }

//     /* --------------------------------------------------------------------------
//        ANIMATIONS
//        -------------------------------------------------------------------------- */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
//     .fade-in { animation: fadeIn 0.4s ease; }
//     .card-anim-1 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s both; } 
//     .card-anim-2 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; } 
//     .card-anim-3 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; } 
//     .card-anim-4 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
//     .card-anim-5 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }

//     /* Responsive */
//     @media (max-width: 1200px) {
//       .bento-grid { grid-template-columns: repeat(2, 1fr); }
//       .span-2 { grid-column: span 2; }
//     }
//     @media (max-width: 768px) {
//       .dashboard-content { padding: var(--spacing-lg); }
//       .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-lg); }
//       .header-right { width: 100%; justify-content: flex-end; }
//       .bento-grid { grid-template-columns: 1fr; }
//       .span-2, .span-2-inner { grid-column: span 1; }
//       .inner-grid-2 { grid-template-columns: 1fr; }
//     }
//   `]
// })
// export class DepartmentFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);
  
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);

//   deptForm!: FormGroup;
  
//   // State management signals
//   isSubmitting = signal(false);
//   isLoading = signal(false);
//   isEditMode = signal(false);
//   deptId: string | null = null;

//   departmentOptions = signal<any[]>([]);
//   userOptions = this.masterList.users;
//   branchOptions = this.masterList.branches;

//   ngOnInit() {
//     this.initForm();
//     this.loadDependencies();
//     this.checkEditMode();
//   }

//   private initForm() {
//     this.deptForm = this.fb.group({
//       name: ['', [Validators.required, Validators.maxLength(100)]],
//       code: ['', [Validators.required, Validators.maxLength(20)]],
//       description: [''],

//       parentDepartment: [null],
//       branchId: [null],
//       headOfDepartment: [null],
//       assistantHOD: [null],

//       costCenter: [''],
//       budgetCode: [''],
//       maxStrength: [null, Validators.min(0)],

//       contactEmail: ['', [Validators.email]],
//       contactPhone: [''],
//       location: [''],

//       isActive: [true],

//       metadata: this.fb.group({
//         establishedDate: [null],
//         division: [''],
//         region: ['']
//       })
//     });

//     this.deptForm.get('code')?.valueChanges.subscribe(val => {
//       if (val && val !== val.toUpperCase()) {
//         this.deptForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
//       }
//     });
//   }

//   private loadDependencies() {
//     this.hrmsService.getDepartments().subscribe({
//       next: (res: any) => {
//         if (res.data && res.data.departments) {
//           this.departmentOptions.set(res.data.departments);
//         }
//       }
//     });
//   }

//   private checkEditMode() {
//     this.route.paramMap.subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         this.isEditMode.set(true);
//         this.deptId = id;
//         this.loadDepartmentDetails();
//       }
//     });
//   }

//   private loadDepartmentDetails() {
//     this.isLoading.set(true);
//     this.deptForm.disable(); 
    
//     this.hrmsService.getDepartment(this.deptId!).pipe(
//       map((res: any) => res?.data?.data || res),
//       catchError(err => {
//         this.isLoading.set(false);
//         this.deptForm.enable();
//         this.messageService.handleHttpError(err)
//         return of(null);
//       })
//     ).subscribe((data) => {
//       if (data) {
//         this.patchFormValues(data);
//       }
//       this.isLoading.set(false);
//       this.deptForm.enable();
//     });
//   }

//   private patchFormValues(data: any) {
//     const establishedDateStr = data.metadata?.establishedDate 
//       ? new Date(data.metadata.establishedDate).toISOString().split('T')[0] 
//       : null;

//     this.deptForm.patchValue({
//       name: data.name,
//       code: data.code,
//       description: data.description,
      
//       parentDepartment: data.parentDepartment?._id || data.parentDepartment,
//       branchId: data.branchId?._id || data.branchId,
//       headOfDepartment: data.headOfDepartment?._id || data.headOfDepartment,
//       assistantHOD: data.assistantHOD?._id || data.assistantHOD,

//       costCenter: data.costCenter,
//       budgetCode: data.budgetCode,
//       maxStrength: data.maxStrength,

//       contactEmail: data.contactEmail,
//       contactPhone: data.contactPhone,
//       location: data.location,

//       isActive: data.isActive ?? true,

//       metadata: {
//         establishedDate: establishedDateStr,
//         division: data.metadata?.division || '',
//         region: data.metadata?.region || ''
//       }
//     });
//   }

//   onSubmit() {
//     if (this.deptForm.invalid) {
//       this.deptForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const payload = { ...this.deptForm.value };

//     // Clean up empty payload data
//     if (!payload.parentDepartment) delete payload.parentDepartment;
//     if (!payload.branchId) delete payload.branchId;
//     if (!payload.headOfDepartment) delete payload.headOfDepartment;
//     if (!payload.assistantHOD) delete payload.assistantHOD;

//     if (this.isEditMode()) {
//       this.hrmsService.updateDepartment(this.deptId!, payload).subscribe({
//         next: (res: any) => {
//           this.messageService.showSuccess( 'Department updated successfully');
//           this.isSubmitting.set(false);
//           this.goBack();
//         },
//         error: (err: any) => {
//           this.messageService.handleHttpError(err)
//           this.isSubmitting.set(false);
//         }
//       });
//     } else {
//       this.hrmsService.createDepartment(payload).subscribe({
//         next: (res: any) => {
//           this.messageService.showSuccess('Department created successfully');
//           this.isSubmitting.set(false);
//           this.goBack();
//         },
//         error: (err: any) => {
//           this.messageService.handleHttpError(err)
//           this.isSubmitting.set(false);
//         }
//       });
//     }
//   }

//   goBack() {
//     this.router.navigate(['/hrms/department/list']); 
//   }
// }




// // import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { ActivatedRoute, Router } from '@angular/router';
// // import { of, delay, catchError, map } from 'rxjs';

// // import { MasterListService } from '../../../../../core/services/master-list.service';
// // import { AppMessageService } from '../../../../../core/services/message.service';
// // import { HRMSService } from '../../../hrms.service';

// // @Component({
// //   selector: 'app-department-form',
// //   standalone: true,
// //   imports: [CommonModule, ReactiveFormsModule],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// //     <div class="app-fullscreen-wrapper fade-in">
      
// //       <header class="dashboard-header glass-header">
// //         <div class="header-left">
// //           <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
// //             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
// //           </button>
// //           <div>
// //             <h1 class="page-title">{{ isEditMode() ? 'Edit Department' : 'Create Department' }}</h1>
// //             <p class="page-subtitle">Configure organization hierarchy and metrics.</p>
// //           </div>
// //         </div>
        
// //         <div class="header-right">
// //           <div class="header-status" [class.valid]="deptForm.valid">
// //             <div class="status-dot"></div>
// //             <span>{{ deptForm.valid ? 'Ready' : 'Draft' }}</span>
// //           </div>
// //           <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
// //           <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || deptForm.invalid" (click)="onSubmit()">
// //             <ng-container *ngIf="!isSubmitting(); else loadingState">
// //               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
// //               <span>{{ isEditMode() ? 'Update' : 'Save' }}</span>
// //             </ng-container>
// //             <ng-template #loadingState>
// //               <div class="spinner"></div>
// //               <span>{{ isEditMode() ? 'Updating' : 'Saving' }}</span>
// //             </ng-template>
// //           </button>
// //         </div>
// //       </header>

// //       <main class="dashboard-content" [class.loading-opacity]="isLoading()">
// //         <form [formGroup]="deptForm" class="bento-grid">
          
// //           <div class="grid-card span-2 card-anim-1">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
// //               <h2 class="card-title">Core Identity</h2>
// //             </div>
            
// //             <div class="card-body">
// //               <div class="inner-grid-2">
// //                 <div class="form-field">
// //                   <label for="name">Department Name <span class="required">*</span></label>
// //                   <input id="name" type="text" formControlName="name" class="se-input" placeholder="e.g. Engineering">
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="code">Department Code <span class="required">*</span></label>
// //                   <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. ENG">
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="parentDepartment">Parent Department</label>
// //                   <div class="select-wrapper">
// //                     <select id="parentDepartment" formControlName="parentDepartment" class="se-input">
// //                       <option [ngValue]="null">None (Root)</option>
// //                       @for (dept of departmentOptions(); track dept._id) {
// //                         <option [value]="dept._id">{{ dept.name }} ({{ dept.code }})</option>
// //                       }
// //                     </select>
// //                   </div>
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="branchId">Branch Assignment</label>
// //                   <div class="select-wrapper">
// //                     <select id="branchId" formControlName="branchId" class="se-input">
// //                       <option [ngValue]="null">Select Branch</option>
// //                       @for (branch of branchOptions(); track branch._id) {
// //                         <option [value]="branch._id">{{ branch.name }}</option>
// //                       }
// //                     </select>
// //                   </div>
// //                 </div>

// //                 <div class="form-field span-2-inner">
// //                   <label for="description">Description</label>
// //                   <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief overview of function..."></textarea>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card card-anim-2">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
// //               <h2 class="card-title">Leadership</h2>
// //             </div>
            
// //             <div class="card-body flex-col">
// //               <div class="form-field">
// //                 <label for="headOfDepartment">Head of Department (HOD)</label>
// //                 <div class="select-wrapper">
// //                   <select id="headOfDepartment" formControlName="headOfDepartment" class="se-input">
// //                     <option [ngValue]="null">Unassigned</option>
// //                     @for (user of userOptions(); track user._id) {
// //                       <option [value]="user._id">{{ user.name }}</option>
// //                     }
// //                   </select>
// //                 </div>
// //               </div>

// //               <div class="form-field">
// //                 <label for="assistantHOD">Assistant HOD</label>
// //                 <div class="select-wrapper">
// //                   <select id="assistantHOD" formControlName="assistantHOD" class="se-input">
// //                     <option [ngValue]="null">Unassigned</option>
// //                     @for (user of userOptions(); track user._id) {
// //                       <option [value]="user._id">{{ user.name }}</option>
// //                     }
// //                   </select>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card card-anim-3">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>
// //               <h2 class="card-title">Operations & Budget</h2>
// //             </div>
            
// //             <div class="card-body flex-col">
// //               <div class="form-field">
// //                 <label for="costCenter">Cost Center ID</label>
// //                 <input id="costCenter" type="text" formControlName="costCenter" class="se-input uppercase-input" placeholder="e.g. CC-101">
// //               </div>

// //               <div class="form-field">
// //                 <label for="budgetCode">Budget Code</label>
// //                 <input id="budgetCode" type="text" formControlName="budgetCode" class="se-input uppercase-input" placeholder="e.g. BC-2024">
// //               </div>

// //               <div class="form-field">
// //                 <label for="maxStrength">Max Headcount</label>
// //                 <input id="maxStrength" type="number" formControlName="maxStrength" class="se-input" placeholder="0">
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card card-anim-4">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
// //               <h2 class="card-title">Contact Information</h2>
// //             </div>
            
// //             <div class="card-body flex-col">
// //               <div class="form-field">
// //                 <label for="contactEmail">Department Email</label>
// //                 <input id="contactEmail" type="email" formControlName="contactEmail" class="se-input" placeholder="dept@company.com">
// //               </div>

// //               <div class="form-field">
// //                 <label for="contactPhone">Contact Phone</label>
// //                 <input id="contactPhone" type="text" formControlName="contactPhone" class="se-input" placeholder="+1 (555) 000-0000">
// //               </div>

// //               <div class="form-field">
// //                 <label for="location">Physical Location</label>
// //                 <input id="location" type="text" formControlName="location" class="se-input" placeholder="e.g. Floor 3, Wing B">
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card card-anim-5" formGroupName="metadata">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
// //               <h2 class="card-title">Metadata & Status</h2>
// //             </div>
            
// //             <div class="card-body flex-col">
// //               <div class="form-field">
// //                 <label for="establishedDate">Date Established</label>
// //                 <input id="establishedDate" type="date" formControlName="establishedDate" class="se-input">
// //               </div>

// //               <div class="inner-grid-2">
// //                 <div class="form-field">
// //                   <label for="division">Division</label>
// //                   <input id="division" type="text" formControlName="division" class="se-input" placeholder="Tech">
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="region">Region</label>
// //                   <input id="region" type="text" formControlName="region" class="se-input" placeholder="APAC">
// //                 </div>
// //               </div>

// //               <div class="status-toggle-wrapper" [formGroup]="deptForm">
// //                 <label class="toggle-container">
// //                   <input type="checkbox" formControlName="isActive" class="toggle-input">
// //                   <span class="toggle-slider"></span>
// //                   <div class="toggle-text">
// //                     <span class="toggle-label">Active Department</span>
// //                   </div>
// //                 </label>
// //               </div>
// //             </div>
// //           </div>

// //         </form>
// //       </main>
// //     </div>
// //   `,
// //   styles: [`
// //     /* KEEP YOUR EXISTING STYLES HERE */
// //     :host {
// //       display: block;
// //       width: 100%;
// //       height: 100vh;
// //       background-color: var(--bg-primary);
// //       font-family: var(--font-body);
// //       color: var(--text-primary);
// //       overflow: hidden;
// //     }
// //     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
// //     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
// //     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
// //     .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
// //     .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
// //     .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
// //     .header-status { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--text-secondary); padding: 6px 12px; background: var(--component-surface-raised); border-radius: 999px; border: 1px solid var(--border-primary); margin-right: var(--spacing-md); }
// //     .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); }
// //     .header-status.valid { color: var(--color-success); border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 5%, transparent); }
// //     .header-status.valid .status-dot { background: var(--color-success); }
// //     .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
// //     .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
// //     .btn-primary { background: var(--color-primary); color: #ffffff; }
// //     .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); transition: opacity 0.3s; }
// //     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
// //     .span-2 { grid-column: span 2; } .span-2-inner { grid-column: span 2; }
// //     .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); }
// //     .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); }
// //     .card-icon { color: var(--color-primary); display: flex; align-items: center; }
// //     .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
// //     .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
// //     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
// //     .form-field { display: flex; flex-direction: column; gap: 4px; }
// //     .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.03em; }
// //     .required { color: var(--color-error); }
// //     .se-input { width: 100%; background: var(--component-bg); border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--text-primary); box-sizing: border-box; height: 36px; }
// //     .uppercase-input { text-transform: uppercase; }
// //     .se-textarea { height: auto; min-height: 60px; resize: vertical; }
// //     .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
// //     .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
// //     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
// //     .toggle-input { display: none; }
// //     .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
// //     .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
// //     .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
// //     .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
// //     .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
// //     .loading-opacity { opacity: 0.5; pointer-events: none; }
// //   `]
// // })
// // export class DepartmentFormComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);
// //   private masterList = inject(MasterListService);
  
// //   // Real Angular Router and ActivatedRoute injected here
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);

// //   deptForm!: FormGroup;
  
// //   // State management signals
// //   isSubmitting = signal(false);
// //   isLoading = signal(false);
// //   isEditMode = signal(false);
// //   deptId: string | null = null;

// //   departmentOptions = signal<any[]>([]);
// //   userOptions = this.masterList.users;
// //   branchOptions = this.masterList.branches;

// //   ngOnInit() {
// //     this.initForm();
// //     this.loadDependencies();
// //     this.checkEditMode();
// //   }

// //   private initForm() {
// //     this.deptForm = this.fb.group({
// //       name: ['', [Validators.required, Validators.maxLength(100)]],
// //       code: ['', [Validators.required, Validators.maxLength(20)]],
// //       description: [''],

// //       parentDepartment: [null],
// //       branchId: [null],
// //       headOfDepartment: [null],
// //       assistantHOD: [null],

// //       costCenter: [''],
// //       budgetCode: [''],
// //       maxStrength: [null, Validators.min(0)],

// //       contactEmail: ['', [Validators.email]],
// //       contactPhone: [''],
// //       location: [''],

// //       isActive: [true],

// //       metadata: this.fb.group({
// //         establishedDate: [null],
// //         division: [''],
// //         region: ['']
// //       })
// //     });

// //     this.deptForm.get('code')?.valueChanges.subscribe(val => {
// //       if (val && val !== val.toUpperCase()) {
// //         this.deptForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
// //       }
// //     });
// //   }

// //   private loadDependencies() {
// //     this.hrmsService.getDepartments().subscribe({
// //       next: (res: any) => {
// //         if (res.data && res.data.departments) {
// //           this.departmentOptions.set(res.data.departments);
// //         }
// //       }
// //     });
// //   }

// //   private checkEditMode() {
// //     // Listen to route parameters for an :id
// //     this.route.paramMap.subscribe(params => {
// //       const id = params.get('id');
// //       if (id) {
// //         this.isEditMode.set(true);
// //         this.deptId = id;
// //         this.loadDepartmentDetails();
// //       }
// //     });
// //   }

// //   private loadDepartmentDetails() {
// //     this.isLoading.set(true);
// //     this.deptForm.disable(); // Optional: disable form while fetching data
    
// //     // Uses the mapping logic you provided
// //     this.hrmsService.getDepartment(this.deptId!).pipe(
// //       map((res: any) => res?.data?.data || res),
// //       catchError(err => {
// //         this.isLoading.set(false);
// //         this.deptForm.enable();
// //         this.messageService.handleHttpError(err)
// //         return of(null);
// //       })
// //     ).subscribe((data) => {
// //       if (data) {
// //         this.patchFormValues(data);
// //       }
// //       this.isLoading.set(false);
// //       this.deptForm.enable();
// //     });
// //   }

// //   private patchFormValues(data: any) {
// //     // Ensure nested objects and date formatting are handled safely
// //     const establishedDateStr = data.metadata?.establishedDate 
// //       ? new Date(data.metadata.establishedDate).toISOString().split('T')[0] 
// //       : null;

// //     this.deptForm.patchValue({
// //       name: data.name,
// //       code: data.code,
// //       description: data.description,
      
// //       // Checking if the backend returns populated objects vs raw IDs
// //       parentDepartment: data.parentDepartment?._id || data.parentDepartment,
// //       branchId: data.branchId?._id || data.branchId,
// //       headOfDepartment: data.headOfDepartment?._id || data.headOfDepartment,
// //       assistantHOD: data.assistantHOD?._id || data.assistantHOD,

// //       costCenter: data.costCenter,
// //       budgetCode: data.budgetCode,
// //       maxStrength: data.maxStrength,

// //       contactEmail: data.contactEmail,
// //       contactPhone: data.contactPhone,
// //       location: data.location,

// //       isActive: data.isActive ?? true,

// //       metadata: {
// //         establishedDate: establishedDateStr,
// //         division: data.metadata?.division || '',
// //         region: data.metadata?.region || ''
// //       }
// //     });
// //   }

// //   onSubmit() {
// //     if (this.deptForm.invalid) {
// //       this.deptForm.markAllAsTouched();
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const payload = { ...this.deptForm.value };

// //     // Clean up empty payload data
// //     if (!payload.parentDepartment) delete payload.parentDepartment;
// //     if (!payload.branchId) delete payload.branchId;
// //     if (!payload.headOfDepartment) delete payload.headOfDepartment;
// //     if (!payload.assistantHOD) delete payload.assistantHOD;

// //     // Call UPDATE if Edit Mode, otherwise CREATE
// //     if (this.isEditMode()) {
// //       // Assumes updateDepartment takes id and payload
// //       this.hrmsService.updateDepartment(this.deptId!, payload).subscribe({
// //         next: (res: any) => {
// //           this.messageService.showSuccess( 'Department updated successfully');
// //           this.isSubmitting.set(false);
// //           this.goBack();
// //         },
// //         error: (err: any) => {
// //           this.messageService.handleHttpError(err)
// //           this.isSubmitting.set(false);
// //         }
// //       });
// //     } else {
// //       this.hrmsService.createDepartment(payload).subscribe({
// //         next: (res: any) => {
// //           this.messageService.showSuccess('Department created successfully');
// //           this.isSubmitting.set(false);
// //           this.goBack();
// //         },
// //         error: (err: any) => {
// //           this.messageService.handleHttpError(err)
// //           this.isSubmitting.set(false);
// //         }
// //       });
// //     }
// //   }

// //   goBack() {
// //     this.router.navigate(['/department/list']); // Matches the base path you defined in HRMS_ROUTES
// //   }
// // }
