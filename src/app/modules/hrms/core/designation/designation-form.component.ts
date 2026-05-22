import { Component, OnInit, ChangeDetectionStrategy, inject, signal, DestroyRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, catchError, map, finalize } from 'rxjs';

import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

// PrimeNG
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-designation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MultiSelectModule,
    CardModule,
    SelectModule,
    TextareaModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <header class="dashboard-header glass-header">
        <div class="header-left">
          <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
            <i class="pi pi-arrow-left"></i>
          </button>
          <div>
            <h1 class="page-title">{{ isEditMode() ? 'Edit Designation' : 'Create Designation' }}</h1>
            <p class="page-subtitle">Define job roles, hierarchy, and compensation bands.</p>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-status" [class.valid]="desigForm.valid">
            <div class="status-dot"></div>
            <span>{{ desigForm.valid ? 'Ready' : 'Draft' }}</span>
          </div>
          <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || desigForm.invalid" (click)="onSubmit()">
            @if (!isSubmitting()) {
              <i class="pi pi-save"></i>
              <span>{{ isEditMode() ? 'Update' : 'Save' }}</span>
            } @else {
              <i class="pi pi-spin pi-spinner"></i>
              <span>{{ isEditMode() ? 'Updating...' : 'Saving...' }}</span>
            }
          </button>
        </div>
      </header>

      <main class="dashboard-content" [class.loading-opacity]="isLoading()">
        <form [formGroup]="desigForm" class="bento-grid">
          
          <p-card styleClass="grid-card span-2 card-anim-1">
            <ng-template pTemplate="header">
              <div class="flex gap-sm card-header-custom">
                <i class="pi pi-id-card text-primary"></i>
                <h2>Role Details</h2>
              </div>
            </ng-template>
            
            <div class="inner-grid-2">
              <div class="form-field">
                <label for="title">Designation Title <span class="required">*</span></label>
                <div class="p-input-icon-left flex gap-sm w-full">
                  <i class="pi pi-briefcase text-tertiary"></i>
                  <input pInputText id="title" type="text" formControlName="title" class="w-full se-input" placeholder="e.g. Senior Developer">
                </div>
              </div>

              <div class="form-field">
                <label for="code">Job Code <span class="required">*</span></label>
                <div class="p-input-icon-left flex gap-sm w-full">
                  <i class="pi pi-tag text-tertiary"></i>
                  <input pInputText id="code" type="text" formControlName="code" class="w-full uppercase-input se-input" placeholder="e.g. DEV-002">
                </div>
              </div>

              <div class="form-field">
                <label for="jobFamily">Job Family</label>
                <div class="p-input-icon-left flex gap-sm w-full">
                  <i class="pi pi-users text-tertiary"></i>
                  <input pInputText id="jobFamily" type="text" formControlName="jobFamily" class="w-full se-input" placeholder="e.g. Technical, Managerial">
                </div>
              </div>

              <div class="form-field">
                <label for="experienceRequired">Experience Required (Years)</label>
                <p-inputNumber 
                  id="experienceRequired" 
                  formControlName="experienceRequired" 
                  styleClass="w-full" 
                  [min]="0" 
                  placeholder="e.g. 5">
                </p-inputNumber>
              </div>

              <div class="form-field span-2-inner">
                <label for="description">Role Description</label>
                <textarea 
                  pTextarea 
                  id="description" 
                  formControlName="description" 
                  rows="3" 
                  [autoResize]="true" 
                  class="w-full se-input" 
                  placeholder="Brief overview of the role...">
                </textarea>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card card-anim-2">
            <ng-template pTemplate="header">
              <div class="flex gap-sm card-header-custom">
                <i class="pi pi-sitemap text-primary"></i>
                <h2>Hierarchy & Path</h2>
              </div>
            </ng-template>
            
            <div class="flex-col gap-4 h-full">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="level">Level <span class="required">*</span></label>
                  <p-inputNumber 
                    id="level" 
                    formControlName="level" 
                    styleClass="w-full" 
                    [min]="1" 
                    placeholder="1">
                  </p-inputNumber>
                </div>
                
                <div class="form-field">
                  <label for="grade">Grade</label>
                  <p-select 
                    id="grade" 
                    formControlName="grade" 
                    [options]="gradeOptions" 
                    placeholder="Select Grade" 
                    styleClass="w-full" 
                    appendTo="body"
                    [filter]="true"
                    filterBy="label">
                  </p-select>
                </div>
              </div>

              <div class="form-field">
                <label for="nextDesignation">Career Path (Next Role)</label>
                <p-select 
                  id="nextDesignation" 
                  formControlName="nextDesignation" 
                  [options]="designationOptions()" 
                  optionLabel="title" 
                  optionValue="_id" 
                  placeholder="None" 
                  [showClear]="true" 
                  [filter]="true"
                  filterPlaceholder="Search roles..."
                  styleClass="w-full" 
                  appendTo="body">
                </p-select>
              </div>

              <div class="form-field mt-auto">
                <label for="promotionAfterYears">Promotion Eligibility (Years)</label>
                <p-inputNumber 
                  id="promotionAfterYears" 
                  formControlName="promotionAfterYears" 
                  styleClass="w-full" 
                  [min]="0" 
                  placeholder="e.g. 2">
                </p-inputNumber>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card span-2 card-anim-3">
            <ng-template pTemplate="header">
              <div class="card-header-custom flex gap-sm">
                <i class="pi pi-list-check text-primary"></i>
                <h2>Requirements (One per line)</h2>
              </div>
            </ng-template>
            
            <div class="inner-grid-2">
              <div class="form-field">
                <label for="responsibilitiesText">Key Responsibilities</label>
                <textarea 
                  pTextarea 
                  id="responsibilitiesText" 
                  formControlName="responsibilitiesText" 
                  rows="5" 
                  [autoResize]="true" 
                  class="w-full se-input" 
                  placeholder="Enter responsibilities, separated by new lines...">
                </textarea>
              </div>

              <div class="form-field">
                <label for="qualificationsText">Qualifications</label>
                <textarea 
                  pTextarea 
                  id="qualificationsText" 
                  formControlName="qualificationsText" 
                  rows="5" 
                  [autoResize]="true" 
                  class="w-full se-input" 
                  placeholder="Enter qualifications, separated by new lines...">
                </textarea>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card card-anim-4" formGroupName="salaryBand">
            <ng-template pTemplate="header">
              <div class="card-header-custom flex gap-sm">
                <i class="pi pi-wallet text-primary"></i>
                <h2>Salary Band</h2>
              </div>
            </ng-template>
            
            <div class="flex-col gap-4">
              <div class="form-field">
                <label for="minSalary">Minimum Range</label>
                <p-inputNumber 
                  id="minSalary" 
                  formControlName="min" 
                  styleClass="w-full" 
                  placeholder="0">
                </p-inputNumber>
              </div>

              <div class="form-field">
                <label for="maxSalary">Maximum Range</label>
                <p-inputNumber 
                  id="maxSalary" 
                  formControlName="max" 
                  styleClass="w-full" 
                  placeholder="0">
                </p-inputNumber>
              </div>

              <div class="form-field">
                <label for="currency">Currency</label>
                <p-select 
                  id="currency" 
                  formControlName="currency" 
                  [options]="currencyOptions" 
                  optionLabel="label"
                  optionValue="value"
                  styleClass="w-full" 
                  appendTo="body"
                  [filter]="true"
                  filterBy="label">
                </p-select>
              </div>
            </div>
          </p-card>

          <p-card styleClass="grid-card span-all card-anim-5">
            <ng-template pTemplate="header">
              <div class="card-header-custom flex gap-sm">
                <i class="pi pi-sliders-v text-primary"></i>
                <h2>Attributes & Reporting</h2>
              </div>
            </ng-template>
            
            <div class="bento-grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); padding: 0;">
              
              <div class="form-field">
                <label for="reportsTo">Reports To</label>
                <p-multiSelect 
                  id="reportsTo" 
                  formControlName="reportsTo" 
                  [options]="designationOptions()" 
                  optionLabel="title" 
                  optionValue="_id" 
                  placeholder="Select reporting lines..." 
                  [filter]="true"
                  filterPlaceholder="Search roles..."
                  styleClass="w-full" 
                  appendTo="body">
                </p-multiSelect>
              </div>

              <div class="flex-col" style="gap: var(--spacing-md); display: flex; justify-content: center;">
                <div formGroupName="metadata" style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
                  
                  <label class="status-toggle-wrapper flex-between cursor-pointer">
                    <div class="toggle-text"><span class="toggle-label font-bold text-xs uppercase text-tertiary">Managerial Role</span></div>
                    <p-toggleswitch formControlName="isManager"></p-toggleswitch>
                  </label>

                  <label class="status-toggle-wrapper flex-between cursor-pointer">
                    <div class="toggle-text"><span class="toggle-label font-bold text-xs uppercase text-tertiary">Executive Level</span></div>
                    <p-toggleswitch formControlName="isExecutive"></p-toggleswitch>
                  </label>

                  <label class="status-toggle-wrapper flex-between cursor-pointer">
                    <div class="toggle-text"><span class="toggle-label font-bold text-xs uppercase text-tertiary">Requires Appr.</span></div>
                    <p-toggleswitch formControlName="requiresApproval"></p-toggleswitch>
                  </label>

                </div>

                <label class="status-toggle-wrapper active-toggle flex-between cursor-pointer">
                  <div class="toggle-text"><span class="toggle-label font-bold text-sm text-primary">Designation is Active</span></div>
                  <p-toggleswitch formControlName="isActive"></p-toggleswitch>
                </label>
              </div>

            </div>
          </p-card>

        </form>
      </main>
    </div>
  `,
  styles: [`
    :host { 
      display: block; 
      width: 100%; 
      height: 100vh; 
      background-color: var(--bg-secondary); 
      font-family: var(--font-body); 
      color: var(--text-primary); 
      overflow: hidden; 
    }
    
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .w-full { width: 100%; }
    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .gap-sm { gap: var(--spacing-sm); }
    .gap-4 { gap: var(--spacing-lg); }
    .mt-auto { margin-top: auto; }
    
    /* Header */
    .dashboard-header { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: var(--spacing-lg) var(--spacing-2xl); 
      background: var(--bg-primary); 
      border-bottom: 1px solid var(--border-secondary); 
      z-index: 50; flex-shrink: 0; box-shadow: var(--shadow-xs); 
    }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-xl); }
    .icon-btn { 
      background: var(--bg-secondary); border: 1px solid var(--border-secondary); 
      color: var(--text-secondary); border-radius: var(--ui-border-radius-lg); 
      width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; 
      cursor: pointer; transition: all 0.2s ease; font-size: 18px; 
    }
    .page-title { font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin: 0 0 2px 0; line-height: 1.2; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
    
    /* Header Status */
    .header-status { 
      display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; 
      color: var(--text-secondary); padding: 6px 14px; background: var(--bg-secondary); 
      border-radius: 20px; border: 1px solid var(--border-secondary); margin-right: var(--spacing-md); 
      text-transform: uppercase; letter-spacing: 0.5px; 
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success); border-color: var(--color-success-border); background: var(--color-success-bg); }
    .header-status.valid .status-dot { background: var(--color-success); }
    
    /* Full-Width Grid Layout */
    .dashboard-content { 
      flex: 1; overflow-y: auto; 
      padding: var(--spacing-2xl) var(--spacing-3xl); 
      background: var(--bg-secondary); transition: opacity 0.3s; 
    }
    .bento-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
      gap: var(--spacing-2xl); 
      align-items: start; 
      width: 100%; /* Explicit full width */
    }
    .span-2 { grid-column: span 2; } 
    .span-2-inner { grid-column: span 2; }
    .span-all { grid-column: 1 / -1; }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
    .loading-opacity { opacity: 0.5; pointer-events: none; filter: grayscale(50%); }

    /* Form Inputs with Clear Visible Borders */
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
    .required { color: var(--color-error); font-weight: bold; margin-left: 2px; }
    .uppercase-input { text-transform: uppercase; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px; }
    
    .se-input {
      background: var(--bg-primary);
      border: 1px solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-sm);
    }
    .se-input:focus, .se-input:focus-within {
      border-color: var(--accent-primary) !important;
      box-shadow: 0 0 0 3px var(--accent-focus);
    }

    /* Toggles & Structural Chrome */
    .status-toggle-wrapper { 
      padding: var(--spacing-lg) var(--spacing-xl); 
      background: var(--bg-primary); 
      border: 1px solid var(--border-secondary); 
      border-radius: 12px; 
      flex: 1;
    }
    .active-toggle {
      border: 2px solid var(--color-primary);
      background: var(--color-primary-bg);
    }

    /* Card Layout Rules */
    ::ng-deep .grid-card.p-card { 
      height: 100%; border-radius: var(--ui-border-radius-lg); 
      box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); 
      background: var(--bg-primary); display: flex; flex-direction: column; 
      transition: all 0.2s ease; overflow: hidden; background-clip: padding-box; 
    }
    ::ng-deep .grid-card .p-card-body { padding: var(--spacing-xl) var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
    ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }
    
    .card-header-custom { 
      padding: var(--spacing-xl) var(--spacing-2xl); 
      background: var(--bg-secondary); 
      border-bottom: 1px solid var(--border-secondary); 
      display: flex; align-items: center; gap: 12px; 
      border-top-left-radius: calc(var(--ui-border-radius-lg) - 1px); 
      border-top-right-radius: calc(var(--ui-border-radius-lg) - 1px); 
    }
    .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
    .card-header-custom i { font-size: 18px; }

    /* Button Styling */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      height: 40px; padding: 0 20px; font-size: 13px; font-weight: 600;
      border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: none;
    }
    .btn-outline {
      background: var(--bg-primary); border: 1px solid var(--border-secondary);
      color: var(--text-primary);
    }
    .btn-outline:hover:not(:disabled) { background: var(--bg-secondary); border-color: var(--text-tertiary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease; }
    .card-anim-1 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s both; } 
    .card-anim-2 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; } 
    .card-anim-3 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; } 
    .card-anim-4 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
    .card-anim-5 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }

    /* Responsive Full Width Breakpoints */
    @media (min-width: 1600px) {
      .bento-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 1599px) and (min-width: 1024px) {
      .bento-grid { grid-template-columns: repeat(2, 1fr); }
      .span-2 { grid-column: span 2; }
    }
    @media (max-width: 1023px) { 
      .dashboard-content { padding: var(--spacing-lg); } 
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-lg); } 
      .header-right { width: 100%; justify-content: flex-end; } 
      .bento-grid { grid-template-columns: 1fr; } 
      .span-2, .span-2-inner { grid-column: span 1; } 
      .inner-grid-2 { grid-template-columns: 1fr; } 
    }
  `]
})
export class DesignationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  desigForm!: FormGroup;
  
  // Natively managed signals
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  desigId = signal<string | null>(null);

  designationOptions = signal<any[]>([]);
  
  // Static Options
  readonly gradeOptions = [
    { label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'C', value: 'C' },
    { label: 'D', value: 'D' }, { label: 'E', value: 'E' }, { label: 'F', value: 'F' }
  ];
  
  readonly currencyOptions = [
    { label: 'INR (₹)', value: 'INR' },
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'GBP (£)', value: 'GBP' }
  ];

  constructor() {
    this.initForm();
    this.setupRouteListener();
  }

  ngOnInit() {
    this.loadDependencies();
  }

  private initForm() {
    this.desigForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern(/^[A-Z0-9_-]+$/)]],
      description: ['', [Validators.maxLength(500)]],
      
      level: [1, [Validators.required, Validators.min(1)]],
      grade: ['C', [Validators.required]],
      
      nextDesignation: [null],
      promotionAfterYears: [null, [Validators.min(0)]],
      
      jobFamily: ['', [Validators.maxLength(100)]],
      experienceRequired: [null, [Validators.min(0)]],
      
      responsibilitiesText: [''], 
      qualificationsText: [''],

      salaryBand: this.fb.group({
        min: [null, [Validators.min(0)]],
        max: [null, [Validators.min(0)]],
        currency: ['INR']
      }, { validators: this.salaryBandRangeValidator }),

      reportsTo: [[]], 
      isActive: [true],

      metadata: this.fb.group({
        isManager: [false],
        isExecutive: [false],
        requiresApproval: [false]
      })
    });

    this.desigForm.get('code')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        const normalized = typeof val === 'string'
          ? val.trim().toUpperCase().replace(/\s+/g, '_')
          : val;
        if (val && normalized !== val) {
          this.desigForm.get('code')?.setValue(normalized, { emitEvent: false });
        }
      });
  }

  private salaryBandRangeValidator(control: AbstractControl): ValidationErrors | null {
    const min = control.get('min')?.value;
    const max = control.get('max')?.value;
    if (min === null || min === undefined || max === null || max === undefined) {
      return null;
    }
    return Number(min) > Number(max) ? { salaryBandRange: true } : null;
  }

  private loadDependencies() {
    this.hrmsService.getDesignations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const list = res?.data?.designations || res?.data?.data || [];
          this.designationOptions.set(list);
        }
      });
  }

  private setupRouteListener() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.isEditMode.set(true);
          this.desigId.set(id);
          this.loadDesignationDetails(id);
        }
      });
  }

  private loadDesignationDetails(id: string) {
    this.isLoading.set(true);
    this.desigForm.disable(); 
    
    this.hrmsService.getDesignation(id).pipe(
      map((res: any) => res?.data?.data || res?.data || res),
      catchError(err => {
        this.messageService.handleHttpError(err);
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.desigForm.enable();
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      if (data) {
        this.patchFormValues(data);
      }
    });
  }

  private patchFormValues(data: any) {
    const responsibilitiesTxt = data.responsibilities ? data.responsibilities.join('\n') : '';
    const qualificationsTxt = data.qualifications ? data.qualifications.join('\n') : '';

    this.desigForm.patchValue({
      title: data.title,
      code: data.code,
      description: data.description,
      
      level: data.level || 1,
      grade: data.grade || 'C',
      
      nextDesignation: data.nextDesignation?._id || data.nextDesignation || null,
      promotionAfterYears: data.promotionAfterYears,
      
      jobFamily: data.jobFamily,
      experienceRequired: data.experienceRequired,
      
      responsibilitiesText: responsibilitiesTxt,
      qualificationsText: qualificationsTxt,

      salaryBand: {
        min: data.salaryBand?.min ?? null,
        max: data.salaryBand?.max ?? null,
        currency: data.salaryBand?.currency || 'INR'
      },

      reportsTo: data.reportsTo?.map((r: any) => r._id || r) || [],
      isActive: data.isActive ?? true,

      metadata: {
        isManager: data.metadata?.isManager || false,
        isExecutive: data.metadata?.isExecutive || false,
        requiresApproval: data.metadata?.requiresApproval || false
      }
    });
  }

  onSubmit() {
    if (this.desigForm.invalid) {
      this.desigForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = { ...this.desigForm.value };

    const responsibilitiesArray = formValue.responsibilitiesText
      ? formValue.responsibilitiesText.split('\n').filter((item: string) => item.trim() !== '')
      : [];
      
    const qualificationsArray = formValue.qualificationsText
      ? formValue.qualificationsText.split('\n').filter((item: string) => item.trim() !== '')
      : [];

    const payload: any = {
      ...formValue,
      responsibilities: responsibilitiesArray,
      qualifications: qualificationsArray
    };

    delete payload.responsibilitiesText;
    delete payload.qualificationsText;
    if (!payload.nextDesignation) delete payload.nextDesignation;

    const request$ = this.isEditMode() && this.desigId()
      ? this.hrmsService.updateDesignation(this.desigId()!, payload)
      : this.hrmsService.createDesignation(payload);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        const msg = this.isEditMode() ? 'updated' : 'created';
        this.messageService.showSuccess(`Designation ${msg} successfully`);
        this.goBack();
      },
      error: (err: any) => {
        this.messageService.handleHttpError(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/hrms/designation/list']); 
  }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';

// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { of, catchError, map, Subject } from 'rxjs';

// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { SelectModule } from 'primeng/select';
// import { TextareaModule } from 'primeng/textarea';
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { MultiSelectModule } from 'primeng/multiselect';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-designation-form',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     MultiSelectModule,
//     CardModule,
//     SelectModule,
//     TextareaModule,
//     InputTextModule,
//     InputNumberModule,
//     ToggleSwitchModule
// ],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
      
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
//             <i class="pi pi-arrow-left"></i>
//           </button>
//           <div>
//             <h1 class="page-title">{{ isEditMode() ? 'Edit Designation' : 'Create Designation' }}</h1>
//             <p class="page-subtitle">Define job roles, hierarchy, and compensation bands.</p>
//           </div>
//         </div>
        
//         <div class="header-right">
//           <div class="header-status" [class.valid]="desigForm.valid">
//             <div class="status-dot"></div>
//             <span>{{ desigForm.valid ? 'Ready' : 'Draft' }}</span>
//           </div>
//           <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
//           <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || desigForm.invalid" (click)="onSubmit()">
//             @if (!isSubmitting()) {
//               <i class="pi pi-save"></i>
//               <span>{{ isEditMode() ? 'Update' : 'Save' }}</span>
//             } @else {
//               <i class="pi pi-spin pi-spinner"></i>
//               <span>{{ isEditMode() ? 'Updating...' : 'Saving...' }}</span>
//             }
//           </button>
//         </div>
//       </header>

//       <main class="dashboard-content" [class.loading-opacity]="isLoading()">
//         <form [formGroup]="desigForm" class="bento-grid">
          
//           <p-card styleClass="grid-card span-2 card-anim-1">
//             <ng-template pTemplate="header">
//               <div class=" flex gap-sm card-header-custom">
//                 <i class="pi pi-id-card text-primary"></i>
//                 <h2>Role Details</h2>
//               </div>
//             </ng-template>
            
//             <div class="inner-grid-2">
//               <div class="form-field">
//                 <label for="title">Designation Title <span class="required">*</span></label>
//                 <div class="p-input-icon-left flex gap-sm w-full">
//                   <i class="pi pi-briefcase text-tertiary"></i>
//                   <input pInputText id="title" type="text" formControlName="title" class="w-full" placeholder="e.g. Senior Developer">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="code">Job Code <span class="required">*</span></label>
//                 <div class="p-input-icon-left flex gap-sm w-full">
//                   <i class="pi pi-tag text-tertiary"></i>
//                   <input pInputText id="code" type="text" formControlName="code" class="w-full uppercase-input" placeholder="e.g. DEV-002">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="jobFamily">Job Family</label>
//                 <div class="p-input-icon-left flex gap-sm w-full">
//                   <i class="pi pi-users text-tertiary"></i>
//                   <input pInputText id="jobFamily" type="text" formControlName="jobFamily" class="w-full" placeholder="e.g. Technical, Managerial">
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="experienceRequired">Experience Required (Years)</label>
//                 <p-inputNumber 
//                   id="experienceRequired" 
//                   formControlName="experienceRequired" 
//                   styleClass="w-full" 
//                   [min]="0" 
//                   placeholder="e.g. 5">
//                 </p-inputNumber>
//               </div>

//               <div class="form-field span-2-inner">
//                 <label for="description">Role Description</label>
//                 <textarea 
//                   pTextarea 
//                   id="description" 
//                   formControlName="description" 
//                   rows="3" 
//                   [autoResize]="true" 
//                   class="w-full" 
//                   placeholder="Brief overview of the role...">
//                 </textarea>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card card-anim-2">
//             <ng-template pTemplate="header">
//               <div class=" flex gap-sm card-header-custom">
//                 <i class="pi pi-sitemap text-primary"></i>
//                 <h2>Hierarchy & Path</h2>
//               </div>
//             </ng-template>
            
//             <div class="flex-col gap-4 h-full">
//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="level">Level <span class="required">*</span></label>
//                   <p-inputNumber 
//                     id="level" 
//                     formControlName="level" 
//                     styleClass="w-full" 
//                     [min]="1" 
//                     placeholder="1">
//                   </p-inputNumber>
//                 </div>
                
//                 <div class="form-field">
//                   <label for="grade">Grade</label>
//                   <p-select 
//                     id="grade" 
//                     formControlName="grade" 
//                     [options]="gradeOptions" 
//                     placeholder="Select Grade" 
//                     styleClass="w-full" 
//                     appendTo="body"
//                     [filter]="true"
//                     filterBy="label">
//                   </p-select>

//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="nextDesignation">Career Path (Next Role)</label>
//                 <p-select 
//                   id="nextDesignation" 
//                   formControlName="nextDesignation" 
//                   [options]="designationOptions()" 
//                   optionLabel="title" 
//                   optionValue="_id" 
//                   placeholder="None" 
//                   [showClear]="true" 
//                   [filter]="true"
//                   filterPlaceholder="Search roles..."
//                   styleClass="w-full" 
//                   appendTo="body">
//                 </p-select>
//               </div>

//               <div class="form-field mt-auto">
//                 <label for="promotionAfterYears">Promotion Eligibility (Years)</label>
//                 <p-inputNumber 
//                   id="promotionAfterYears" 
//                   formControlName="promotionAfterYears" 
//                   styleClass="w-full" 
//                   [min]="0" 
//                   placeholder="e.g. 2">
//                 </p-inputNumber>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card span-2 card-anim-3">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom flex gap-sm">
//                 <i class="pi pi-list-check text-primary"></i>
//                 <h2>Requirements (One per line)</h2>
//               </div>
//             </ng-template>
            
//             <div class="inner-grid-2">
//               <div class="form-field">
//                 <label for="responsibilitiesText">Key Responsibilities</label>
//                 <textarea 
//                   pTextarea 
//                   id="responsibilitiesText" 
//                   formControlName="responsibilitiesText" 
//                   rows="5" 
//                   [autoResize]="true" 
//                   class="w-full" 
//                   placeholder="Enter responsibilities, separated by new lines...">
//                 </textarea>
//               </div>

//               <div class="form-field">
//                 <label for="qualificationsText">Qualifications</label>
//                 <textarea 
//                   pTextarea 
//                   id="qualificationsText" 
//                   formControlName="qualificationsText" 
//                   rows="5" 
//                   [autoResize]="true" 
//                   class="w-full" 
//                   placeholder="Enter qualifications, separated by new lines...">
//                 </textarea>
//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card card-anim-4" formGroupName="salaryBand">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom flex gap-sm">
//                 <i class="pi pi-wallet text-primary"></i>
//                 <h2>Salary Band</h2>
//               </div>
//             </ng-template>
            
//             <div class="flex-col gap-4">
//               <div class="form-field">
//                 <label for="minSalary">Minimum Range</label>
//                 <p-inputNumber 
//                   id="minSalary" 
//                   formControlName="min" 
//                   styleClass="w-full" 
//                   placeholder="0">
//                 </p-inputNumber>
//               </div>

//               <div class="form-field">
//                 <label for="maxSalary">Maximum Range</label>
//                 <p-inputNumber 
//                   id="maxSalary" 
//                   formControlName="max" 
//                   styleClass="w-full" 
//                   placeholder="0">
//                 </p-inputNumber>
//               </div>

//               <div class="form-field">
//                 <label for="currency">Currency</label>
//                 <p-select 
//                   id="currency" 
//                   formControlName="currency" 
//                   [options]="currencyOptions" 
//                   optionLabel="label"
//                   optionValue="value"
//                   styleClass="w-full" 
//                   appendTo="body"
//                   [filter]="true"
//                   filterBy="label">
//                 </p-select>

//               </div>
//             </div>
//           </p-card>

//           <p-card styleClass="grid-card span-2 card-anim-5" styleClass="grid-column: span 3;">
//             <ng-template pTemplate="header">
//               <div class="card-header-custom flex gap-sm">
//                 <i class="pi pi-sliders-v text-primary"></i>
//                 <h2>Attributes & Reporting</h2>
//               </div>
//             </ng-template>
            
//             <div class="bento-grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); padding: 0;">
              
//               <div class="form-field">
//                 <label for="reportsTo">Reports To</label>
//                                   <!-- [multiple]="true" -->

//                 <p-multiSelect 
//                   id="reportsTo" 
//                   formControlName="reportsTo" 
//                   [options]="designationOptions()" 
//                   optionLabel="title" 
//                   optionValue="_id" 
//                   placeholder="multiSelect reporting lines..." 
//                   [filter]="true"
//                   filterPlaceholder="Search roles..."
//                   styleClass="w-full" 
//                   appendTo="body">
//                 </p-multiSelect>
//               </div>

//               <div class="flex-col" style="gap: var(--spacing-md); display: flex; justify-content: center;">
//                 <div formGroupName="metadata" style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
                  
//                   <label class="status-toggle-wrapper flex-between cursor-pointer">
//                     <div class="toggle-text"><span class="toggle-label font-bold text-xs uppercase text-tertiary">Managerial Role</span></div>
//                     <p-toggleswitch formControlName="isManager"></p-toggleswitch>
//                   </label>

//                   <label class="status-toggle-wrapper flex-between cursor-pointer">
//                     <div class="toggle-text"><span class="toggle-label font-bold text-xs uppercase text-tertiary">Executive Level</span></div>
//                     <p-toggleswitch formControlName="isExecutive"></p-toggleswitch>
//                   </label>

//                   <label class="status-toggle-wrapper flex-between cursor-pointer">
//                     <div class="toggle-text"><span class="toggle-label font-bold text-xs uppercase text-tertiary">Requires Appr.</span></div>
//                     <p-toggleswitch formControlName="requiresApproval"></p-toggleswitch>
//                   </label>

//                 </div>

//                 <label class="status-toggle-wrapper flex-between cursor-pointer" style="border-color: var(--color-primary);">
//                   <div class="toggle-text"><span class="toggle-label font-bold text-sm text-primary">Designation is Active</span></div>
//                   <p-toggleswitch formControlName="isActive"></p-toggleswitch>
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
//        BASE THEME & LAYOUT (Stripped of global inputs since you have them)
//        ========================================================================== */
//     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-secondary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
//     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
//     .w-full { width: 100%; }
//     .flex-col { display: flex; flex-direction: column; }
//     .flex-align { display: flex; align-items: center; }
//     .gap-2 { gap: var(--spacing-sm); }
//     .gap-4 { gap: var(--spacing-lg); }
//     .mt-auto { margin-top: auto; }
    
//     /* Header */
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-2xl); background: var(--bg-primary); border-bottom: 1px solid var(--border-secondary); z-index: 50; flex-shrink: 0; box-shadow: var(--shadow-xs); }
//     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-xl); }
//     .icon-btn { background: var(--bg-secondary); border: 1px solid var(--border-secondary); color: var(--text-secondary); border-radius: var(--ui-border-radius-lg); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; font-size: 18px; }
//     .page-title { font-family: var(--font-heading); font-size: 24px; font-weight: 800; margin: 0 0 2px 0; line-height: 1.2; letter-spacing: -0.5px; }
//     .page-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }
    
//     /* Header Status */
//     .header-status { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--text-secondary); padding: 6px 14px; background: var(--bg-secondary); border-radius: 20px; border: 1px solid var(--border-secondary); margin-right: var(--spacing-md); text-transform: uppercase; letter-spacing: 0.5px; }
//     .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); }
//     .header-status.valid { color: var(--color-success); border-color: var(--color-success-border); background: var(--color-success-bg); }
//     .header-status.valid .status-dot { background: var(--color-success); }
    
//     /* Layout */
//     .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-2xl) var(--spacing-3xl); background: var(--bg-secondary); transition: opacity 0.3s; }
//     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-2xl); align-items: start; max-width: 1600px; margin: 0 auto; }
//     .span-2 { grid-column: span 2; } .span-2-inner { grid-column: span 2; }
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }
//     .loading-opacity { opacity: 0.5; pointer-events: none; filter: grayscale(50%); }

//     /* Form Fields */
//     .form-field { display: flex; flex-direction: column; gap: 6px; }
//     .form-field label { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
//     .required { color: var(--color-error); font-weight: bold; margin-left: 2px; }
//     .uppercase-input { text-transform: uppercase; font-family: var(--font-mono); font-weight: 600; letter-spacing: 0.5px; }

//     /* Premium Toggle Switch */
//     .status-toggle-wrapper { padding: var(--spacing-lg); background: var(--bg-secondary); border: 1px solid var(--border-secondary); border-radius: 12px; }
//     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: 14px; }
//     .toggle-input { display: none; }
//     .toggle-slider { position: relative; width: 44px; height: 24px; background-color: var(--border-secondary); border-radius: 24px; transition: all 0.3s ease; flex-shrink: 0; }
//     .toggle-slider::before { content: ""; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
//     .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
//     .toggle-input:checked + .toggle-slider::before { transform: translateX(20px); }
//     .toggle-label { font-size: 14px; color: var(--text-primary); font-weight: 500; }

//     /* Card Overrides */
//     // ::ng-deep .grid-card .p-card { height: 100%; border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); background: var(--bg-primary); display: flex; flex-direction: column; transition: all 0.2s ease; overflow: hidden; background-clip: padding-box; }
//     // ::ng-deep .grid-card .p-card-header { padding: 0; }
//     .card-header-custom { padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary); border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px; border-top-left-radius: calc(var(--ui-border-radius-lg) - 1px); border-top-right-radius: calc(var(--ui-border-radius-lg) - 1px); }
//     .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
//     .card-header-custom i { font-size: 18px; }
//     // ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
//     // ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

//     /* Animations */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.98) translateY(15px); } to { opacity: 1; transform: scale(1) translateY(0); } }
//     .fade-in { animation: fadeIn 0.4s ease; }
//     .card-anim-1 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s both; } 
//     .card-anim-2 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.1s both; } 
//     .card-anim-3 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.15s both; } 
//     .card-anim-4 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s both; }
//     .card-anim-5 { animation: popIn 0.4s cubic-bezier(0.2, 0.9, 0.2, 1) 0.25s both; }

//     @media (max-width: 1200px) { .bento-grid { grid-template-columns: repeat(2, 1fr); } .span-2 { grid-column: span 2; } }
//     @media (max-width: 768px) { .dashboard-content { padding: var(--spacing-lg); } .dashboard-header { flex-direction: column; align-items: flex-start; gap: var(--spacing-lg); } .header-right { width: 100%; justify-content: flex-end; } .bento-grid { grid-template-columns: 1fr; } .span-2, .span-2-inner { grid-column: span 1; } .inner-grid-2 { grid-template-columns: 1fr; } }
//   `]
// })
// export class DesignationFormComponent implements OnInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);

//   desigForm!: FormGroup;
  
//   isSubmitting = signal(false);
//   isLoading = signal(false);
//   isEditMode = signal(false);
//   desigId: string | null = null;

//   designationOptions = signal<any[]>([]);
  
//   // Static Options for Selects
//   gradeOptions = [
//     { label: 'A', value: 'A' }, { label: 'B', value: 'B' }, { label: 'C', value: 'C' },
//     { label: 'D', value: 'D' }, { label: 'E', value: 'E' }, { label: 'F', value: 'F' }
//   ];
  
//   currencyOptions = [
//     { label: 'INR (₹)', value: 'INR' },
//     { label: 'USD ($)', value: 'USD' },
//     { label: 'EUR (€)', value: 'EUR' },
//     { label: 'GBP (£)', value: 'GBP' }
//   ];

//   ngOnInit() {
//     this.initForm();
//     this.loadDependencies();
//     this.checkEditMode();
//   }

//   private initForm() {
//     this.desigForm = this.fb.group({
//       title: ['', [Validators.required, Validators.maxLength(100)]],
//       code: ['', [Validators.required, Validators.maxLength(20)]],
//       description: [''],
      
//       level: [1, [Validators.required, Validators.min(1)]],
//       grade: ['C', [Validators.required]],
      
//       nextDesignation: [null],
//       promotionAfterYears: [null, [Validators.min(0)]],
      
//       jobFamily: [''],
//       experienceRequired: [null, [Validators.min(0)]],
      
//       responsibilitiesText: [''], 
//       qualificationsText: [''],

//       salaryBand: this.fb.group({
//         min: [null],
//         max: [null],
//         currency: ['INR']
//       }),

//       reportsTo: [[]], 
//       isActive: [true],

//       metadata: this.fb.group({
//         isManager: [false],
//         isExecutive: [false],
//         requiresApproval: [false]
//       })
//     });

//     this.desigForm.get('code')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
//       if (val && val !== val.toUpperCase()) {
//         this.desigForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
//       }
//     });
//   }

//   private loadDependencies() {
//     this.hrmsService.getDesignations().pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         const list = res?.data?.designations || res?.data?.data || [];
//         this.designationOptions.set(list);
//       }
//     });
//   }

//   private checkEditMode() {
//     this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
//       const id = params.get('id');
//       if (id) {
//         this.isEditMode.set(true);
//         this.desigId = id;
//         this.loadDesignationDetails();
//       }
//     });
//   }

//   private loadDesignationDetails() {
//     this.isLoading.set(true);
//     this.desigForm.disable(); 
    
//     this.hrmsService.getDesignation(this.desigId!).pipe(
//       map((res: any) => res?.data?.data || res?.data || res),
//       catchError(err => {
//         this.isLoading.set(false);
//         this.desigForm.enable();
//         this.messageService.handleHttpError(err)
//         return of(null);
//       }), takeUntil(this.destroy$)
//     ).subscribe((data) => {
//       if (data) {
//         this.patchFormValues(data);
//       }
//       this.isLoading.set(false);
//       this.desigForm.enable();
//     });
//   }

//   private patchFormValues(data: any) {
//     const responsibilitiesTxt = data.responsibilities ? data.responsibilities.join('\n') : '';
//     const qualificationsTxt = data.qualifications ? data.qualifications.join('\n') : '';

//     this.desigForm.patchValue({
//       title: data.title,
//       code: data.code,
//       description: data.description,
      
//       level: data.level || 1,
//       grade: data.grade || 'C',
      
//       nextDesignation: data.nextDesignation?._id || data.nextDesignation || null,
//       promotionAfterYears: data.promotionAfterYears,
      
//       jobFamily: data.jobFamily,
//       experienceRequired: data.experienceRequired,
      
//       responsibilitiesText: responsibilitiesTxt,
//       qualificationsText: qualificationsTxt,

//       salaryBand: {
//         min: data.salaryBand?.min || null,
//         max: data.salaryBand?.max || null,
//         currency: data.salaryBand?.currency || 'INR'
//       },

//       reportsTo: data.reportsTo?.map((r: any) => r._id || r) || [],
//       isActive: data.isActive ?? true,

//       metadata: {
//         isManager: data.metadata?.isManager || false,
//         isExecutive: data.metadata?.isExecutive || false,
//         requiresApproval: data.metadata?.requiresApproval || false
//       }
//     });
//   }

//   onSubmit() {
//     if (this.desigForm.invalid) {
//       this.desigForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = { ...this.desigForm.value };

//     const responsibilitiesArray = formValue.responsibilitiesText
//       ? formValue.responsibilitiesText.split('\n').filter((item: string) => item.trim() !== '')
//       : [];
      
//     const qualificationsArray = formValue.qualificationsText
//       ? formValue.qualificationsText.split('\n').filter((item: string) => item.trim() !== '')
//       : [];

//     const payload: any = {
//       ...formValue,
//       responsibilities: responsibilitiesArray,
//       qualifications: qualificationsArray
//     };

//     delete payload.responsibilitiesText;
//     delete payload.qualificationsText;
//     if (!payload.nextDesignation) delete payload.nextDesignation;

//     if (this.isEditMode()) {
//       this.hrmsService.updateDesignation(this.desigId!, payload).pipe(takeUntil(this.destroy$)).subscribe({
//         next: () => {
//           this.messageService.showSuccess('Designation updated successfully');
//           this.isSubmitting.set(false);
//           this.goBack();
//         },
//         error: (err: any) => {
//           this.messageService.handleHttpError(err)
//           this.isSubmitting.set(false);
//         }
//       });
//     } else {
//       this.hrmsService.createDesignation(payload).pipe(takeUntil(this.destroy$)).subscribe({
//         next: () => {
//           this.messageService.showSuccess('Designation created successfully');
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
//     this.router.navigate(['/hrms/designation/list']); 
//   }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }
// }
// // import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { ActivatedRoute, Router } from '@angular/router';
// // import { of, catchError, map } from 'rxjs';
// // import { AppMessageService } from '../../../../core/services/message.service';
// // import { HRMSService } from '../../hrms.service';

// // @Component({
// //   selector: 'app-designation-form',
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
// //             <h1 class="page-title">{{ isEditMode() ? 'Edit Designation' : 'Create Designation' }}</h1>
// //             <p class="page-subtitle">Define job roles, hierarchy, and compensation bands.</p>
// //           </div>
// //         </div>
        
// //         <div class="header-right">
// //           <div class="header-status" [class.valid]="desigForm.valid">
// //             <div class="status-dot"></div>
// //             <span>{{ desigForm.valid ? 'Ready' : 'Draft' }}</span>
// //           </div>
// //           <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
// //           <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || isLoading() || desigForm.invalid" (click)="onSubmit()">
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
// //         <form [formGroup]="desigForm" class="bento-grid">
          
// //           <div class="grid-card span-2 card-anim-1">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
// //               <h2 class="card-title">Role Details</h2>
// //             </div>
// //             <div class="card-body">
// //               <div class="inner-grid-2">
// //                 <div class="form-field">
// //                   <label for="title">Designation Title <span class="required">*</span></label>
// //                   <input id="title" type="text" formControlName="title" class="se-input" placeholder="e.g. Senior Developer">
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="code">Job Code <span class="required">*</span></label>
// //                   <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. DEV-002">
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="jobFamily">Job Family</label>
// //                   <input id="jobFamily" type="text" formControlName="jobFamily" class="se-input" placeholder="e.g. Technical, Managerial">
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="experienceRequired">Experience Required (Years)</label>
// //                   <input id="experienceRequired" type="number" formControlName="experienceRequired" class="se-input" placeholder="e.g. 5">
// //                 </div>

// //                 <div class="form-field span-2-inner">
// //                   <label for="description">Role Description</label>
// //                   <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief overview of the role..."></textarea>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card card-anim-2">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg></div>
// //               <h2 class="card-title">Hierarchy & Path</h2>
// //             </div>
// //             <div class="card-body flex-col">
// //               <div class="inner-grid-2">
// //                 <div class="form-field">
// //                   <label for="level">Level <span class="required">*</span></label>
// //                   <input id="level" type="number" formControlName="level" class="se-input" min="1" placeholder="1">
// //                 </div>
// //                 <div class="form-field">
// //                   <label for="grade">Grade</label>
// //                   <div class="select-wrapper">
// //                     <select id="grade" formControlName="grade" class="se-input">
// //                       <option value="A">A</option><option value="B">B</option><option value="C">C</option>
// //                       <option value="D">D</option><option value="E">E</option><option value="F">F</option>
// //                     </select>
// //                   </div>
// //                 </div>
// //               </div>

// //               <div class="form-field">
// //                 <label for="nextDesignation">Career Path (Next Role)</label>
// //                 <div class="select-wrapper">
// //                   <select id="nextDesignation" formControlName="nextDesignation" class="se-input">
// //                     <option [ngValue]="null">None</option>
// //                     @for (desig of designationOptions(); track desig._id) {
// //                       <option [value]="desig._id">{{ desig.title }} ({{ desig.code }})</option>
// //                     }
// //                   </select>
// //                 </div>
// //               </div>

// //               <div class="form-field">
// //                 <label for="promotionAfterYears">Promotion Eligibility (Years)</label>
// //                 <input id="promotionAfterYears" type="number" formControlName="promotionAfterYears" class="se-input" placeholder="e.g. 2">
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card span-2 card-anim-3">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
// //               <h2 class="card-title">Requirements (One per line)</h2>
// //             </div>
// //             <div class="card-body">
// //               <div class="inner-grid-2">
// //                 <div class="form-field">
// //                   <label for="responsibilitiesText">Key Responsibilities</label>
// //                   <textarea id="responsibilitiesText" formControlName="responsibilitiesText" rows="4" class="se-input se-textarea" placeholder="Enter responsibilities, separated by new lines..."></textarea>
// //                 </div>

// //                 <div class="form-field">
// //                   <label for="qualificationsText">Qualifications</label>
// //                   <textarea id="qualificationsText" formControlName="qualificationsText" rows="4" class="se-input se-textarea" placeholder="Enter qualifications, separated by new lines..."></textarea>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card card-anim-4" formGroupName="salaryBand">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
// //               <h2 class="card-title">Salary Band</h2>
// //             </div>
// //             <div class="card-body flex-col">
// //               <div class="form-field">
// //                 <label for="minSalary">Minimum Range</label>
// //                 <input id="minSalary" type="number" formControlName="min" class="se-input" placeholder="0">
// //               </div>

// //               <div class="form-field">
// //                 <label for="maxSalary">Maximum Range</label>
// //                 <input id="maxSalary" type="number" formControlName="max" class="se-input" placeholder="0">
// //               </div>

// //               <div class="form-field">
// //                 <label for="currency">Currency</label>
// //                 <div class="select-wrapper">
// //                   <select id="currency" formControlName="currency" class="se-input">
// //                     <option value="INR">INR (₹)</option>
// //                     <option value="USD">USD ($)</option>
// //                     <option value="EUR">EUR (€)</option>
// //                     <option value="GBP">GBP (£)</option>
// //                   </select>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>

// //           <div class="grid-card span-2 card-anim-5" style="grid-column: span 3;">
// //             <div class="card-header">
// //               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
// //               <h2 class="card-title">Attributes & Reporting</h2>
// //             </div>
            
// //             <div class="card-body">
// //               <div class="bento-grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); padding: 0;">
                
// //                 <div class="form-field">
// //                   <label for="reportsTo">Reports To (Hold Ctrl/Cmd to select multiple)</label>
// //                   <select id="reportsTo" formControlName="reportsTo" multiple class="se-input" style="height: 120px; padding: 0.5rem;">
// //                     @for (desig of designationOptions(); track desig._id) {
// //                       <option [value]="desig._id" style="padding: 4px; margin-bottom: 2px;">{{ desig.title }}</option>
// //                     }
// //                   </select>
// //                 </div>

// //                 <div class="flex-col" style="gap: var(--spacing-md); display: flex; justify-content: center;">
// //                   <div formGroupName="metadata" style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
                    
// //                     <div class="status-toggle-wrapper">
// //                       <label class="toggle-container">
// //                         <input type="checkbox" formControlName="isManager" class="toggle-input">
// //                         <span class="toggle-slider"></span>
// //                         <div class="toggle-text"><span class="toggle-label">Managerial Role</span></div>
// //                       </label>
// //                     </div>

// //                     <div class="status-toggle-wrapper">
// //                       <label class="toggle-container">
// //                         <input type="checkbox" formControlName="isExecutive" class="toggle-input">
// //                         <span class="toggle-slider"></span>
// //                         <div class="toggle-text"><span class="toggle-label">Executive Level</span></div>
// //                       </label>
// //                     </div>

// //                     <div class="status-toggle-wrapper">
// //                       <label class="toggle-container">
// //                         <input type="checkbox" formControlName="requiresApproval" class="toggle-input">
// //                         <span class="toggle-slider"></span>
// //                         <div class="toggle-text"><span class="toggle-label">Requires Appr.</span></div>
// //                       </label>
// //                     </div>

// //                   </div>

// //                   <div class="status-toggle-wrapper" style="border-color: var(--color-primary);">
// //                     <label class="toggle-container">
// //                       <input type="checkbox" formControlName="isActive" class="toggle-input">
// //                       <span class="toggle-slider"></span>
// //                       <div class="toggle-text"><span class="toggle-label">Designation is Active</span></div>
// //                     </label>
// //                   </div>
// //                 </div>

// //               </div>
// //             </div>
// //           </div>

// //         </form>
// //       </main>
// //     </div>
// //   `,
// //   styles: [`
// //     /* KEEP ALL THE EXISTING STYLES FROM DEPARTMENT HERE */
// //     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
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
// //     .select-wrapper { position: relative; } select.se-input:not([multiple]) { appearance: none; padding-right: 2rem; cursor: pointer; }
// //     .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
// //     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
// //     .toggle-input { display: none; }
// //     .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
// //     .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
// //     .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
// //     .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
// //     .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
// //     .loading-opacity { opacity: 0.5; pointer-events: none; }
// //     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// //     @keyframes popIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
// //     .fade-in { animation: fadeIn 0.3s ease-out; }
// //     .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; } .card-anim-5 { animation: popIn 0.4s ease-out 0.25s both; }
// //   `]
// // })
// // export class DesignationFormComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private hrmsService = inject(HRMSService);
// //   private messageService = inject(AppMessageService);
// //   private route = inject(ActivatedRoute);
// //   private router = inject(Router);

// //   desigForm!: FormGroup;
  
// //   isSubmitting = signal(false);
// //   isLoading = signal(false);
// //   isEditMode = signal(false);
// //   desigId: string | null = null;

// //   designationOptions = signal<any[]>([]);

// //   ngOnInit() {
// //     this.initForm();
// //     this.loadDependencies();
// //     this.checkEditMode();
// //   }

// //   private initForm() {
// //     this.desigForm = this.fb.group({
// //       title: ['', [Validators.required, Validators.maxLength(100)]],
// //       code: ['', [Validators.required, Validators.maxLength(20)]],
// //       description: [''],
      
// //       level: [1, [Validators.required, Validators.min(1)]],
// //       grade: ['C', [Validators.required]],
      
// //       nextDesignation: [null],
// //       promotionAfterYears: [null, [Validators.min(0)]],
      
// //       jobFamily: [''],
// //       experienceRequired: [null, [Validators.min(0)]],
      
// //       // We use text fields in the form, and map to arrays on Submit/Patch
// //       responsibilitiesText: [''], 
// //       qualificationsText: [''],

// //       salaryBand: this.fb.group({
// //         min: [null],
// //         max: [null],
// //         currency: ['INR']
// //       }),

// //       reportsTo: [[]], // Standard multi-select array of IDs
// //       isActive: [true],

// //       metadata: this.fb.group({
// //         isManager: [false],
// //         isExecutive: [false],
// //         requiresApproval: [false]
// //       })
// //     });

// //     this.desigForm.get('code')?.valueChanges.subscribe(val => {
// //       if (val && val !== val.toUpperCase()) {
// //         this.desigForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
// //       }
// //     });
// //   }

// //   private loadDependencies() {
// //     // Fetches all designations to populate "Next Designation" and "Reports To" dropdowns
// //     this.hrmsService.getDesignations().subscribe({
// //       next: (res: any) => {
// //         // Just in case this API also returns res.data.data
// //         const list = res?.data?.designations || res?.data?.data || [];
// //         this.designationOptions.set(list);
// //       }
// //     });
// //   }

// //   private checkEditMode() {
// //     this.route.paramMap.subscribe(params => {
// //       const id = params.get('id');
// //       if (id) {
// //         this.isEditMode.set(true);
// //         this.desigId = id;
// //         this.loadDesignationDetails();
// //       }
// //     });
// //   }

// //   private loadDesignationDetails() {
// //     this.isLoading.set(true);
// //     this.desigForm.disable(); 
    
// //     this.hrmsService.getDesignation(this.desigId!).pipe(
// //       // --- THIS IS THE UPDATED MAPPING LOGIC based on the JSON provided ---
// //       map((res: any) => res?.data?.data || res?.data || res),
// //       catchError(err => {
// //         this.isLoading.set(false);
// //         this.desigForm.enable();
// //         this.messageService.handleHttpError(err)
// //         return of(null);
// //       })
// //     ).subscribe((data) => {
// //       if (data) {
// //         this.patchFormValues(data);
// //       }
// //       this.isLoading.set(false);
// //       this.desigForm.enable();
// //     });
// //   }

// //   private patchFormValues(data: any) {
// //     // Convert arrays back to multiline text for the textareas
// //     const responsibilitiesTxt = data.responsibilities ? data.responsibilities.join('\n') : '';
// //     const qualificationsTxt = data.qualifications ? data.qualifications.join('\n') : '';

// //     this.desigForm.patchValue({
// //       title: data.title,
// //       code: data.code,
// //       description: data.description,
      
// //       level: data.level || 1,
// //       grade: data.grade || 'C',
      
// //       nextDesignation: data.nextDesignation?._id || data.nextDesignation || null,
// //       promotionAfterYears: data.promotionAfterYears,
      
// //       jobFamily: data.jobFamily,
// //       experienceRequired: data.experienceRequired,
      
// //       responsibilitiesText: responsibilitiesTxt,
// //       qualificationsText: qualificationsTxt,

// //       salaryBand: {
// //         min: data.salaryBand?.min || null,
// //         max: data.salaryBand?.max || null,
// //         currency: data.salaryBand?.currency || 'INR'
// //       },

// //       reportsTo: data.reportsTo?.map((r: any) => r._id || r) || [],
// //       isActive: data.isActive ?? true,

// //       metadata: {
// //         isManager: data.metadata?.isManager || false,
// //         isExecutive: data.metadata?.isExecutive || false,
// //         requiresApproval: data.metadata?.requiresApproval || false
// //       }
// //     });
// //   }

// //   onSubmit() {
// //     if (this.desigForm.invalid) {
// //       this.desigForm.markAllAsTouched();
// //       return;
// //     }

// //     this.isSubmitting.set(true);
    
// //     // Extract raw form values
// //     const formValue = { ...this.desigForm.value };

// //     // Format multiline textareas back into Arrays for the Mongoose schema
// //     const responsibilitiesArray = formValue.responsibilitiesText
// //       ? formValue.responsibilitiesText.split('\n').filter((item: string) => item.trim() !== '')
// //       : [];
      
// //     const qualificationsArray = formValue.qualificationsText
// //       ? formValue.qualificationsText.split('\n').filter((item: string) => item.trim() !== '')
// //       : [];

// //     // Construct final payload
// //     const payload: any = {
// //       ...formValue,
// //       responsibilities: responsibilitiesArray,
// //       qualifications: qualificationsArray
// //     };

// //     // Clean up temporary form fields and empty references
// //     delete payload.responsibilitiesText;
// //     delete payload.qualificationsText;
    
// //     if (!payload.nextDesignation) delete payload.nextDesignation;

// //     // Call proper endpoint based on mode
// //     if (this.isEditMode()) {
// //       this.hrmsService.updateDesignation(this.desigId!, payload).subscribe({
// //         next: () => {
// //           this.messageService.showSuccess( 'Designation updated successfully');
// //           this.isSubmitting.set(false);
// //           this.goBack();
// //         },
// //         error: (err: any) => {
// //           this.messageService.handleHttpError(err)
// //           this.isSubmitting.set(false);
// //         }
// //       });
// //     } else {
// //       this.hrmsService.createDesignation(payload).subscribe({
// //         next: () => {
// //           this.messageService.showSuccess('Designation created successfully');
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
// //     this.router.navigate(['/hrms/designation/list']); 
// //   }
// // }
