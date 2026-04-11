import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, OnDestroy, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map, Subject } from 'rxjs';
import { takeUntil } from "rxjs/operators";

// PrimeNG
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MasterListService } from '@core/services/master-list.service';
import { AppMessageService } from '@core/services/message.service';
import { HRMSService } from '../../../hrms.service';


/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [ReactiveFormsModule, SelectModule, DatePickerModule, ToggleSwitchModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-fullscreen-wrapper fade-in">
      
      <!-- ════════ HEADER ════════ -->
      <header class="dashboard-header">
        <div class="header-left">
          <button class="btn-ghost icon-only" type="button" (click)="goBack()" title="Go Back">
            <i class="pi pi-arrow-left"></i>
          </button>
          <div class="title-section">
            <div class="icon-box"><i class="pi pi-building"></i></div>
            <div class="text-content">
              <h1 class="page-title">{{ isEditMode() ? 'Edit Department' : 'Create Department' }}</h1>
              <p class="page-subtitle">Configure organization hierarchy, leadership, and metrics.</p>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-status" [class.valid]="deptForm.valid">
            <div class="status-dot"></div>
            <span>{{ deptForm.valid ? 'Ready to Save' : 'Draft Mode' }}</span>
          </div>
          <button type="button" class="btn-outline" (click)="goBack()" [disabled]="isSubmitting() || isLoading()">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="isSubmitting() || isLoading() || deptForm.invalid" (click)="onSubmit()">
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

      <!-- ════════ FORM CONTENT ════════ -->
      <main class="dashboard-content" [class.loading-opacity]="isLoading()">
        <form [formGroup]="deptForm" class="bento-grid">
          
          <!-- ── 1. CORE IDENTITY ── -->
          <div class="premium-card span-2 card-anim-1">
            <div class="card-header">
              <div class="card-header-custom">
                <div class="header-icon"><i class="pi pi-id-card"></i></div>
                <h2>Core Identity</h2>
              </div>
            </div>
            
            <div class="card-body">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="name">Department Name <span class="required">*</span></label>
                  <div class="input-icon-wrapper">
                    <i class="pi pi-briefcase input-icon"></i>
                    <input id="name" type="text" formControlName="name" class="premium-input with-icon" placeholder="e.g. Engineering">
                  </div>
                </div>

                <div class="form-field">
                  <label for="code">Department Code <span class="required">*</span></label>
                  <div class="input-icon-wrapper">
                    <i class="pi pi-tag input-icon"></i>
                    <input id="code" type="text" formControlName="code" class="premium-input with-icon uppercase-input" placeholder="e.g. ENG">
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
                  <textarea id="description" formControlName="description" rows="3" class="premium-input premium-textarea" placeholder="Provide a brief overview of this department's function and scope..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- ── 2. LEADERSHIP ── -->
          <div class="premium-card card-anim-2">
            <div class="card-header">
              <div class="card-header-custom">
                <div class="header-icon"><i class="pi pi-sitemap"></i></div>
                <h2>Leadership</h2>
              </div>
            </div>
            
            <div class="card-body flex-col gap-4">
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
          </div>

          <!-- ── 3. OPERATIONS & BUDGET ── -->
          <div class="premium-card card-anim-3">
            <div class="card-header">
              <div class="card-header-custom">
                <div class="header-icon"><i class="pi pi-chart-pie"></i></div>
                <h2>Operations & Budget</h2>
              </div>
            </div>
            
            <div class="card-body flex-col gap-4">
              <div class="form-field">
                <label for="costCenter">Cost Center ID</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-wallet input-icon"></i>
                  <input id="costCenter" type="text" formControlName="costCenter" class="premium-input with-icon uppercase-input" placeholder="e.g. CC-101">
                </div>
              </div>

              <div class="form-field">
                <label for="budgetCode">Budget Code</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-book input-icon"></i>
                  <input id="budgetCode" type="text" formControlName="budgetCode" class="premium-input with-icon uppercase-input" placeholder="e.g. BC-2024">
                </div>
              </div>

              <div class="form-field">
                <label for="maxStrength">Max Headcount Capacity</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-users input-icon"></i>
                  <input id="maxStrength" type="number" formControlName="maxStrength" class="premium-input with-icon" placeholder="0">
                </div>
              </div>
            </div>
          </div>

          <!-- ── 4. CONTACT INFO ── -->
          <div class="premium-card card-anim-4">
            <div class="card-header">
              <div class="card-header-custom">
                <div class="header-icon"><i class="pi pi-address-book"></i></div>
                <h2>Contact Information</h2>
              </div>
            </div>
            
            <div class="card-body flex-col gap-4">
              <div class="form-field">
                <label for="contactEmail">Department Email</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-envelope input-icon"></i>
                  <input id="contactEmail" type="email" formControlName="contactEmail" class="premium-input with-icon" placeholder="dept@company.com">
                </div>
              </div>

              <div class="form-field">
                <label for="contactPhone">Contact Phone</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-phone input-icon"></i>
                  <input id="contactPhone" type="text" formControlName="contactPhone" class="premium-input with-icon" placeholder="+1 (555) 000-0000">
                </div>
              </div>

              <div class="form-field">
                <label for="location">Physical Location</label>
                <div class="input-icon-wrapper">
                  <i class="pi pi-map-marker input-icon"></i>
                  <input id="location" type="text" formControlName="location" class="premium-input with-icon" placeholder="e.g. Floor 3, Wing B">
                </div>
              </div>
            </div>
          </div>

          <!-- ── 5. METADATA & STATUS ── -->
          <div class="premium-card card-anim-5" formGroupName="metadata">
            <div class="card-header">
              <div class="card-header-custom">
                <div class="header-icon"><i class="pi pi-sliders-v"></i></div>
                <h2>System Metadata</h2>
              </div>
            </div>
            
            <div class="card-body flex-col gap-4">
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
                  <input id="division" type="text" formControlName="division" class="premium-input" placeholder="e.g. Tech">
                </div>

                <div class="form-field">
                  <label for="region">Region</label>
                  <input id="region" type="text" formControlName="region" class="premium-input" placeholder="e.g. APAC">
                </div>
              </div>

              <!-- Move out of metadata group context for the root form control -->
              <div class="mt-auto pt-4 border-t" [formGroup]="deptForm">
                <label class="status-toggle-wrapper flex-between cursor-pointer">
                  <div class="toggle-text">
                    <span class="toggle-label font-bold">Active Department</span>
                    <span class="toggle-desc">Enable this department in the system</span>
                  </div>
                  <p-toggleswitch formControlName="isActive"></p-toggleswitch>
                </label>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════
       BASE THEME & FULL-WIDTH LAYOUT
    ══════════════════════════════════════════════════════ */
    :host { 
      display: block; width: 100%; height: 100vh; 
      background-color: var(--bg-secondary); 
      font-family: var(--font-body); color: var(--text-primary); 
      overflow: hidden; 
    }
    
    .app-fullscreen-wrapper { 
      display: flex; flex-direction: column; height: 100%; width: 100%; 
    }
    
    /* Utilities */
    .flex-col { display: flex; flex-direction: column; }
    .flex-align { display: flex; align-items: center; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .gap-2 { gap: var(--spacing-sm); }
    .gap-4 { gap: var(--spacing-lg); }
    .mt-auto { margin-top: auto; }
    .pt-4 { padding-top: var(--spacing-lg); }
    .border-t { border-top: 1px solid var(--border-secondary); }
    .font-bold { font-weight: var(--font-weight-bold); }
    .w-full { width: 100%; }
    .cursor-pointer { cursor: pointer; }

    /* --------------------------------------------------------------------------
       HEADER
       -------------------------------------------------------------------------- */
    .dashboard-header { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: var(--spacing-lg) var(--spacing-2xl); 
      background: var(--bg-primary); border-bottom: 1px solid var(--border-secondary); 
      z-index: 50; flex-shrink: 0; box-shadow: var(--shadow-sm);
    }
    
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-xl); }
    
    .title-section { display: flex; align-items: center; gap: var(--spacing-lg); }
    
    .icon-box {
      width: 48px; height: 48px; border-radius: var(--ui-border-radius);
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent); 
      border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; color: var(--accent-primary); 
    }

    .page-title { 
      font-family: var(--font-heading); font-size: var(--font-size-2xl); 
      font-weight: var(--font-weight-bold); margin: 0 0 2px 0; 
      line-height: 1.2; letter-spacing: -0.02em; color: var(--text-primary);
    }
    .page-subtitle { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }
    
    /* Validation Status Badge */
    .header-status { 
      display: flex; align-items: center; gap: 8px; 
      font-size: 11px; font-weight: var(--font-weight-bold); color: var(--text-secondary); 
      padding: 6px 14px; background: var(--bg-secondary); 
      border-radius: var(--ui-border-radius-pill); border: 1px solid var(--border-secondary); 
      margin-right: var(--spacing-md); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success-dark, var(--color-success)); border-color: var(--color-success-border); background: var(--color-success-bg); }
    .header-status.valid .status-dot { background: var(--color-success); box-shadow: 0 0 6px var(--color-success-bg); }
    
    /* Buttons */
    button {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-sm);
      height: 40px; padding: 0 var(--spacing-xl); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);
      border-radius: var(--ui-border-radius-sm); cursor: pointer; transition: var(--transition-base); border: none;
      font-family: var(--font-body); outline: none;
    }
    
    button i { font-size: 14px; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid transparent; }
    .btn-ghost:hover { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-secondary); }
    .btn-ghost.icon-only { width: 44px; height: 44px; padding: 0; border-radius: var(--ui-border-radius); border: 1px solid var(--border-secondary); background: var(--bg-primary); }
    .btn-ghost.icon-only:hover { transform: scale(1.05); }

    .btn-outline { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-primary); }
    .btn-outline:not(:disabled):hover { background: var(--bg-secondary); border-color: var(--border-secondary); }
    
    .btn-primary { background: var(--accent-primary); color: #ffffff; box-shadow: 0 2px 4px color-mix(in srgb, var(--accent-primary) 20%, transparent); }
    .btn-primary:not(:disabled):hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 4px 6px color-mix(in srgb, var(--accent-primary) 30%, transparent); }

    /* --------------------------------------------------------------------------
       MAIN CONTENT & BENTO GRID
       -------------------------------------------------------------------------- */
    .dashboard-content { 
      flex: 1; overflow-y: auto; padding: var(--spacing-2xl); 
      background: var(--bg-secondary); transition: opacity 0.3s; 
    }
    .loading-opacity { opacity: 0.5; pointer-events: none; filter: grayscale(50%); }
    
    .bento-grid { 
      display: grid; grid-template-columns: repeat(3, 1fr); 
      gap: var(--spacing-2xl); align-items: start; width: 100%; 
    }
    .span-2 { grid-column: span 2; } 
    .span-2-inner { grid-column: span 2; }
    
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-xl); }

    /* --------------------------------------------------------------------------
       PREMIUM CARDS
       -------------------------------------------------------------------------- */
    .premium-card {
      height: 100%; background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl); 
      box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column;
      overflow: hidden; 
      transition: var(--transition-base);
    }
    .premium-card:hover {
      box-shadow: var(--shadow-md); border-color: var(--border-secondary); transform: translateY(-2px);
    }

    .card-header {
      padding: var(--spacing-xl) var(--spacing-2xl);
      border-bottom: 1px solid var(--border-secondary);
      background: var(--bg-secondary);
    }
    
    .card-header-custom {
      display: flex; align-items: center; gap: 12px;
    }
    
    .header-icon {
      width: 28px; height: 28px; border-radius: var(--ui-border-radius-sm);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      color: var(--accent-primary); display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }

    .card-header-custom h2 { 
      margin: 0; font-family: var(--font-heading); font-size: var(--font-size-lg); 
      font-weight: var(--font-weight-bold); color: var(--text-primary); 
    }

    .card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }

    /* --------------------------------------------------------------------------
       FORM FIELDS & INPUTS
       -------------------------------------------------------------------------- */
    .form-field { display: flex; flex-direction: column; gap: 8px; }
    .form-field label { 
      font-size: 11px; font-weight: var(--font-weight-bold); color: var(--text-tertiary); 
      text-transform: uppercase; letter-spacing: 0.05em; 
    }
    .required { color: var(--color-error); font-weight: bold; margin-left: 2px; }

    .input-icon-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 16px; color: var(--text-tertiary); font-size: 14px; z-index: 1; }
    
    .premium-input { 
      width: 100%; height: 44px; background: var(--bg-primary); 
      border: var(--ui-border-width) solid var(--border-secondary); 
      border-radius: var(--ui-border-radius-sm); padding: 0 16px; 
      font-size: var(--font-size-sm); font-family: var(--font-body); 
      color: var(--text-primary); box-sizing: border-box; font-weight: var(--font-weight-medium);
      transition: var(--transition-fast); outline: none;
    }
    .premium-input.with-icon { padding-left: 44px; }
    .premium-input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 var(--focus-ring-width) color-mix(in srgb, var(--accent-primary) 15%, transparent); }
    .premium-input::placeholder { color: var(--text-tertiary); font-weight: var(--font-weight-normal); }
    
    .uppercase-input { text-transform: uppercase; font-family: var(--font-mono); font-weight: var(--font-weight-bold); letter-spacing: 0.05em; }
    .premium-textarea { height: auto; min-height: 100px; resize: vertical; padding-top: 12px; line-height: var(--line-height-relaxed); }

    /* --------------------------------------------------------------------------
       PRIME-NG SELECT & DATEPICKER OVERRIDES
       -------------------------------------------------------------------------- */
    ::ng-deep .prime-override.p-select, 
    ::ng-deep .prime-override .p-inputtext {
      width: 100%; height: 44px; background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius-sm);
      font-family: var(--font-body); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
      color: var(--text-primary); display: flex; align-items: center;
      transition: var(--transition-fast); box-shadow: none;
    }
    ::ng-deep .prime-override.p-select:not(.p-disabled):hover,
    ::ng-deep .prime-override .p-inputtext:not(:disabled):hover {
      border-color: var(--border-primary);
    }
    ::ng-deep .prime-override.p-select.p-focus,
    ::ng-deep .prime-override .p-inputtext:focus,
    ::ng-deep .prime-override.p-datepicker-input-icon-container {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) color-mix(in srgb, var(--accent-primary) 15%, transparent);
    }
    ::ng-deep .prime-override.p-select .p-select-label { padding: 0 16px; }

    /* --------------------------------------------------------------------------
       TOGGLE SWITCH
       -------------------------------------------------------------------------- */
    .status-toggle-wrapper { 
      padding: var(--spacing-lg) var(--spacing-xl); background: var(--bg-secondary); 
      border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius-lg); 
      transition: var(--transition-fast);
    }
    .status-toggle-wrapper:hover { border-color: var(--border-primary); }
    .toggle-text { display: flex; flex-direction: column; gap: 4px; }
    .toggle-label { font-size: var(--font-size-sm); color: var(--text-primary); }
    .toggle-desc { font-size: var(--font-size-xs); color: var(--text-secondary); }

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
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, OnDestroy } from '@angular/core';

// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { of, catchError, map, Subject } from 'rxjs';

// import { MasterListService } from '../../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../../core/services/message.service';
// import { HRMSService } from '../../../hrms.service';

// // PrimeNG
// import { CardModule } from 'primeng/card';
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-department-form',
//   standalone: true,
//   imports: [ReactiveFormsModule, CardModule, SelectModule, DatePickerModule, ToggleSwitchModule],
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
//             @if (!isSubmitting()) {
//               <i class="pi pi-save"></i>
//               <span>{{ isEditMode() ? 'Update Department' : 'Save Department' }}</span>
//             } @else {
//               <i class="pi pi-spin pi-spinner"></i>
//               <span>{{ isEditMode() ? 'Updating...' : 'Saving...' }}</span>
//             }
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
//                 <p-select 
//                   id="parentDepartment" 
//                   formControlName="parentDepartment" 
//                   [options]="formattedDeptOptions()" 
//                   optionLabel="displayName" 
//                   optionValue="_id" 
//                   placeholder="None (Root Level)" 
//                   [showClear]="true" 
//                   [filter]="true"
//                   filterPlaceholder="Search departments..."
//                   styleClass="w-full prime-override" 
//                   appendTo="body">
//                 </p-select>
//               </div>

//               <div class="form-field">
//                 <label for="branchId">Branch Assignment</label>
//                 <p-select 
//                   id="branchId" 
//                   formControlName="branchId" 
//                   [options]="branchOptions()" 
//                   optionLabel="name" 
//                   optionValue="_id" 
//                   placeholder="Select Branch Location" 
//                   [showClear]="true" 
//                   styleClass="w-full prime-override" 
//                   appendTo="body"
//                   [filter]="true"
//                   filterBy="name">
//                 </p-select>

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
//                 <p-select 
//                   id="headOfDepartment" 
//                   formControlName="headOfDepartment" 
//                   [options]="userOptions()" 
//                   optionLabel="name" 
//                   optionValue="_id" 
//                   placeholder="Unassigned" 
//                   [showClear]="true" 
//                   [filter]="true"
//                   filterPlaceholder="Search employees..."
//                   styleClass="w-full prime-override" 
//                   appendTo="body">
//                 </p-select>
//               </div>

//               <div class="form-field">
//                 <label for="assistantHOD">Assistant HOD</label>
//                 <p-select 
//                   id="assistantHOD" 
//                   formControlName="assistantHOD" 
//                   [options]="userOptions()" 
//                   optionLabel="name" 
//                   optionValue="_id" 
//                   placeholder="Unassigned" 
//                   [showClear]="true" 
//                   [filter]="true"
//                   filterPlaceholder="Search employees..."
//                   styleClass="w-full prime-override" 
//                   appendTo="body">
//                 </p-select>
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
//                 <p-datepicker 
//                   id="establishedDate" 
//                   formControlName="establishedDate" 
//                   [showIcon]="false" 
//                   iconDisplay="input" 
//                   placeholder="Select Date" 
//                   dateFormat="yy-mm-dd"
//                   styleClass="w-full prime-override" 
//                   appendTo="body">
//                 </p-datepicker>
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

//               <label class="status-toggle-wrapper flex-between cursor-pointer mt-auto">
//                 <div class="toggle-text">
//                   <span class="toggle-label font-bold">Active Department</span>
//                 </div>
//                 <p-toggleswitch formControlName="isActive"></p-toggleswitch>
//               </label>
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
//     .w-full { width: 100%; }

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
//        P-CARD OVERRIDES (Premium Glass Look + Anti-aliasing Fix)
//        -------------------------------------------------------------------------- */
//     ::ng-deep .grid-card .p-card {
//       height: 100%; border-radius: var(--ui-border-radius-lg); 
//       box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); 
//       background: var(--bg-primary); display: flex; flex-direction: column; 
//       transition: all 0.2s ease; overflow: hidden;
//       background-clip: padding-box; /* Fix for WebKit Corner Bleed */
//     }
//     ::ng-deep .grid-card .p-card:hover {
//       box-shadow: var(--shadow-md); border-color: var(--color-primary-light, var(--border-primary)); 
//     }
    
//     ::ng-deep .grid-card .p-card-header { padding: 0; }
//     .card-header-custom {
//       padding: var(--spacing-xl) var(--spacing-2xl); background: var(--bg-secondary);
//       border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; gap: 12px;
//       /* Subtract 1px from the border-radius to perfectly hug the parent's inner bound */
//       border-top-left-radius: calc(var(--ui-border-radius-lg) - 1px); 
//       border-top-right-radius: calc(var(--ui-border-radius-lg) - 1px);
//     }
//     .card-header-custom h2 { margin: 0; font-size: 16px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.3px; }
//     .card-header-custom i { font-size: 18px; }

//     ::ng-deep .grid-card .p-card-body { padding: var(--spacing-2xl); flex: 1; display: flex; flex-direction: column; }
//     ::ng-deep .grid-card .p-card-content { padding: 0; flex: 1; display: flex; flex-direction: column; }

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
//     .input-icon { position: absolute; left: 14px; color: var(--text-tertiary); font-size: 14px; z-index: 1; }
    
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

//     /* --------------------------------------------------------------------------
//        PRIME-NG SELECT & DATEPICKER OVERRIDES
//        -------------------------------------------------------------------------- */
//     // ::ng-deep .prime-override.p-select, 
//     // ::ng-deep .prime-override .p-inputtext {
//     //   width: 100%; height: 42px; background: var(--bg-primary);
//     //   border: 1px solid var(--border-secondary); border-radius: 8px;
//     //   font-family: var(--font-body); font-size: 14px; font-weight: 500;
//     //   color: var(--text-primary); display: flex; align-items: center;
//     //   transition: all 0.2s ease; box-shadow: none;
//     // }
//     // ::ng-deep .prime-override.p-select:not(.p-disabled):hover,
//     // ::ng-deep .prime-override .p-inputtext:not(:disabled):hover {
//     //   border-color: var(--text-tertiary);
//     // }
//     // ::ng-deep .prime-override.p-select.p-focus,
//     // ::ng-deep .prime-override .p-inputtext:focus,
//     // ::ng-deep .prime-override.p-datepicker-input-icon-container {
//     //   border-color: var(--color-primary);
//     //   box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
//     // }
//     /* Internal spacing for Select label */
//     // ::ng-deep .prime-override.p-select .p-select-label { padding: 0 16px; }

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
// export class DepartmentFormComponent implements OnInit, OnDestroy {
//   private readonly destroy$ = new Subject<void>();
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

//   // Computed Signal to correctly format the Parent Department label string
//   formattedDeptOptions = computed(() => {
//     return this.departmentOptions().map(d => ({
//       ...d,
//       displayName: `${d.name} (${d.code})`
//     }));
//   });

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

//     this.deptForm.get('code')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
//       if (val && val !== val.toUpperCase()) {
//         this.deptForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
//       }
//     });
//   }

//   private loadDependencies() {
//     this.hrmsService.getDepartments().pipe(takeUntil(this.destroy$)).subscribe({
//       next: (res: any) => {
//         if (res.data && res.data.departments) {
//           this.departmentOptions.set(res.data.departments);
//         }
//       }
//     });
//   }

//   private checkEditMode() {
//     this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
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
//       }), takeUntil(this.destroy$)
//     ).subscribe((data) => {
//       if (data) {
//         this.patchFormValues(data);
//       }
//       this.isLoading.set(false);
//       this.deptForm.enable();
//     });
//   }

//   private patchFormValues(data: any) {
//     // PrimeNG Datepicker prefers actual Date objects rather than strings
//     const establishedDateObj = data.metadata?.establishedDate
//       ? new Date(data.metadata.establishedDate)
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
//         establishedDate: establishedDateObj,
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

//     // Format the Datepicker Date object back into an ISO string for the backend
//     if (payload.metadata?.establishedDate instanceof Date) {
//       payload.metadata.establishedDate = payload.metadata.establishedDate.toISOString().split('T')[0];
//     }

//     // Clean up empty payload data
//     if (!payload.parentDepartment) delete payload.parentDepartment;
//     if (!payload.branchId) delete payload.branchId;
//     if (!payload.headOfDepartment) delete payload.headOfDepartment;
//     if (!payload.assistantHOD) delete payload.assistantHOD;

//     if (this.isEditMode()) {
//       this.hrmsService.updateDepartment(this.deptId!, payload).pipe(takeUntil(this.destroy$)).subscribe({
//         next: (res: any) => {
//           this.messageService.showSuccess('Department updated successfully');
//           this.isSubmitting.set(false);
//           this.goBack();
//         },
//         error: (err: any) => {
//           this.messageService.handleHttpError(err)
//           this.isSubmitting.set(false);
//         }
//       });
//     } else {
//       this.hrmsService.createDepartment(payload).pipe(takeUntil(this.destroy$)).subscribe({
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

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }
