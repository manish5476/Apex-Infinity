import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, delay, catchError, map } from 'rxjs';

import { MasterListService } from '../../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../../core/services/message.service';
import { HRMSService } from '../../../hrms.service';

@Component({
  selector: 'app-department-form',
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
        <form [formGroup]="deptForm" class="bento-grid">
          
          <div class="grid-card span-2 card-anim-1">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
              <h2 class="card-title">Core Identity</h2>
            </div>
            
            <div class="card-body">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="name">Department Name <span class="required">*</span></label>
                  <input id="name" type="text" formControlName="name" class="se-input" placeholder="e.g. Engineering">
                </div>

                <div class="form-field">
                  <label for="code">Department Code <span class="required">*</span></label>
                  <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. ENG">
                </div>

                <div class="form-field">
                  <label for="parentDepartment">Parent Department</label>
                  <div class="select-wrapper">
                    <select id="parentDepartment" formControlName="parentDepartment" class="se-input">
                      <option [ngValue]="null">None (Root)</option>
                      @for (dept of departmentOptions(); track dept._id) {
                        <option [value]="dept._id">{{ dept.name }} ({{ dept.code }})</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-field">
                  <label for="branchId">Branch Assignment</label>
                  <div class="select-wrapper">
                    <select id="branchId" formControlName="branchId" class="se-input">
                      <option [ngValue]="null">Select Branch</option>
                      @for (branch of branchOptions(); track branch._id) {
                        <option [value]="branch._id">{{ branch.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-field span-2-inner">
                  <label for="description">Description</label>
                  <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief overview of function..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-2">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
              <h2 class="card-title">Leadership</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="form-field">
                <label for="headOfDepartment">Head of Department (HOD)</label>
                <div class="select-wrapper">
                  <select id="headOfDepartment" formControlName="headOfDepartment" class="se-input">
                    <option [ngValue]="null">Unassigned</option>
                    @for (user of userOptions(); track user._id) {
                      <option [value]="user._id">{{ user.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-field">
                <label for="assistantHOD">Assistant HOD</label>
                <div class="select-wrapper">
                  <select id="assistantHOD" formControlName="assistantHOD" class="se-input">
                    <option [ngValue]="null">Unassigned</option>
                    @for (user of userOptions(); track user._id) {
                      <option [value]="user._id">{{ user.name }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-3">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>
              <h2 class="card-title">Operations & Budget</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="form-field">
                <label for="costCenter">Cost Center ID</label>
                <input id="costCenter" type="text" formControlName="costCenter" class="se-input uppercase-input" placeholder="e.g. CC-101">
              </div>

              <div class="form-field">
                <label for="budgetCode">Budget Code</label>
                <input id="budgetCode" type="text" formControlName="budgetCode" class="se-input uppercase-input" placeholder="e.g. BC-2024">
              </div>

              <div class="form-field">
                <label for="maxStrength">Max Headcount</label>
                <input id="maxStrength" type="number" formControlName="maxStrength" class="se-input" placeholder="0">
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-4">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
              <h2 class="card-title">Contact Information</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="form-field">
                <label for="contactEmail">Department Email</label>
                <input id="contactEmail" type="email" formControlName="contactEmail" class="se-input" placeholder="dept@company.com">
              </div>

              <div class="form-field">
                <label for="contactPhone">Contact Phone</label>
                <input id="contactPhone" type="text" formControlName="contactPhone" class="se-input" placeholder="+1 (555) 000-0000">
              </div>

              <div class="form-field">
                <label for="location">Physical Location</label>
                <input id="location" type="text" formControlName="location" class="se-input" placeholder="e.g. Floor 3, Wing B">
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-5" formGroupName="metadata">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
              <h2 class="card-title">Metadata & Status</h2>
            </div>
            
            <div class="card-body flex-col">
              <div class="form-field">
                <label for="establishedDate">Date Established</label>
                <input id="establishedDate" type="date" formControlName="establishedDate" class="se-input">
              </div>

              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="division">Division</label>
                  <input id="division" type="text" formControlName="division" class="se-input" placeholder="Tech">
                </div>

                <div class="form-field">
                  <label for="region">Region</label>
                  <input id="region" type="text" formControlName="region" class="se-input" placeholder="APAC">
                </div>
              </div>

              <div class="status-toggle-wrapper" [formGroup]="deptForm">
                <label class="toggle-container">
                  <input type="checkbox" formControlName="isActive" class="toggle-input">
                  <span class="toggle-slider"></span>
                  <div class="toggle-text">
                    <span class="toggle-label">Active Department</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  `,
  styles: [`
    /* KEEP YOUR EXISTING STYLES HERE */
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      background-color: var(--bg-primary);
      font-family: var(--font-body);
      color: var(--text-primary);
      overflow: hidden;
    }
    .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
    .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
    .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
    .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
    .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
    .header-status { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--text-secondary); padding: 6px 12px; background: var(--component-surface-raised); border-radius: 999px; border: 1px solid var(--border-primary); margin-right: var(--spacing-md); }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); }
    .header-status.valid { color: var(--color-success); border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 5%, transparent); }
    .header-status.valid .status-dot { background: var(--color-success); }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
    .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
    .btn-primary { background: var(--color-primary); color: #ffffff; }
    .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); transition: opacity 0.3s; }
    .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
    .span-2 { grid-column: span 2; } .span-2-inner { grid-column: span 2; }
    .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); }
    .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); }
    .card-icon { color: var(--color-primary); display: flex; align-items: center; }
    .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
    .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
    .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.03em; }
    .required { color: var(--color-error); }
    .se-input { width: 100%; background: var(--component-bg); border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--text-primary); box-sizing: border-box; height: 36px; }
    .uppercase-input { text-transform: uppercase; }
    .se-textarea { height: auto; min-height: 60px; resize: vertical; }
    .select-wrapper { position: relative; } select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
    .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
    .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
    .toggle-input { display: none; }
    .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
    .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
    .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
    .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
    .loading-opacity { opacity: 0.5; pointer-events: none; }
  `]
})
export class DepartmentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private masterList = inject(MasterListService);
  
  // Real Angular Router and ActivatedRoute injected here
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

    this.deptForm.get('code')?.valueChanges.subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.deptForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private loadDependencies() {
    this.hrmsService.getDepartments().subscribe({
      next: (res: any) => {
        if (res.data && res.data.departments) {
          this.departmentOptions.set(res.data.departments);
        }
      }
    });
  }

  private checkEditMode() {
    // Listen to route parameters for an :id
    this.route.paramMap.subscribe(params => {
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
    this.deptForm.disable(); // Optional: disable form while fetching data
    
    // Uses the mapping logic you provided
    this.hrmsService.getDepartment(this.deptId!).pipe(
      map((res: any) => res?.data?.data || res),
      catchError(err => {
        this.isLoading.set(false);
        this.deptForm.enable();
        // Assuming your message service has showError method 
        this.messageService.showError('Error', 'Failed to load department details.');
        return of(null);
      })
    ).subscribe((data) => {
      if (data) {
        this.patchFormValues(data);
      }
      this.isLoading.set(false);
      this.deptForm.enable();
    });
  }

  private patchFormValues(data: any) {
    // Ensure nested objects and date formatting are handled safely
    const establishedDateStr = data.metadata?.establishedDate 
      ? new Date(data.metadata.establishedDate).toISOString().split('T')[0] 
      : null;

    this.deptForm.patchValue({
      name: data.name,
      code: data.code,
      description: data.description,
      
      // Checking if the backend returns populated objects vs raw IDs
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
        establishedDate: establishedDateStr,
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

    // Clean up empty payload data
    if (!payload.parentDepartment) delete payload.parentDepartment;
    if (!payload.branchId) delete payload.branchId;
    if (!payload.headOfDepartment) delete payload.headOfDepartment;
    if (!payload.assistantHOD) delete payload.assistantHOD;

    // Call UPDATE if Edit Mode, otherwise CREATE
    if (this.isEditMode()) {
      // Assumes updateDepartment takes id and payload
      this.hrmsService.updateDepartment(this.deptId!, payload).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Success', 'Department updated successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.showError('Error', err.message || 'Failed to update department');
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.hrmsService.createDepartment(payload).subscribe({
        next: (res: any) => {
          this.messageService.showSuccess('Success', 'Department created successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.showError('Error', err.message || 'Failed to create department');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/department/list']); // Matches the base path you defined in HRMS_ROUTES
  }
}


// import { Component, OnInit, ChangeDetectionStrategy, inject, signal, Injectable } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { of, delay } from 'rxjs';
// import { MasterListService } from '../../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../../core/services/message.service';
// import { HRMSService } from '../../../hrms.service';
// @Component({
//   selector: 'app-department-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
      
//       <!-- Compact Header -->
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
//           </button>
//           <div>
//             <h1 class="page-title">Create Department</h1>
//             <p class="page-subtitle">Configure organization hierarchy and metrics.</p>
//           </div>
//         </div>
        
//         <div class="header-right">
//           <!-- Status Indicator -->
//           <div class="header-status" [class.valid]="deptForm.valid">
//             <div class="status-dot"></div>
//             <span>{{ deptForm.valid ? 'Ready' : 'Draft' }}</span>
//           </div>
//           <button type="button" class="btn btn-outline" (click)="goBack()" [disabled]="isSubmitting()">Cancel</button>
//           <button type="button" class="btn btn-primary" [disabled]="isSubmitting() || deptForm.invalid" (click)="onSubmit()">
//             <ng-container *ngIf="!isSubmitting(); else loadingState">
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
//               <span>Save</span>
//             </ng-container>
//             <ng-template #loadingState>
//               <div class="spinner"></div>
//               <span>Saving</span>
//             </ng-template>
//           </button>
//         </div>
//       </header>

//       <!-- Main Form Area (Grid Layout) -->
//       <main class="dashboard-content">
//         <form [formGroup]="deptForm" class="bento-grid">
          
//           <!-- Card 1: Core Identity (Spans 2 Columns) -->
//           <div class="grid-card span-2 card-anim-1">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>
//               <h2 class="card-title">Core Identity</h2>
//             </div>
            
//             <div class="card-body">
//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="name">Department Name <span class="required">*</span></label>
//                   <input id="name" type="text" formControlName="name" class="se-input" placeholder="e.g. Engineering">
//                 </div>

//                 <div class="form-field">
//                   <label for="code">Department Code <span class="required">*</span></label>
//                   <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. ENG">
//                 </div>

//                 <div class="form-field">
//                   <label for="parentDepartment">Parent Department</label>
//                   <div class="select-wrapper">
//                     <select id="parentDepartment" formControlName="parentDepartment" class="se-input">
//                       <option [ngValue]="null">None (Root)</option>
//                       @for (dept of departmentOptions(); track dept._id) {
//                         <option [value]="dept._id">{{ dept.name }} ({{ dept.code }})</option>
//                       }
//                     </select>
//                   </div>
//                 </div>

//                 <div class="form-field">
//                   <label for="branchId">Branch Assignment</label>
//                   <div class="select-wrapper">
//                     <select id="branchId" formControlName="branchId" class="se-input">
//                       <option [ngValue]="null">Select Branch</option>
//                       @for (branch of branchOptions(); track branch._id) {
//                         <option [value]="branch._id">{{ branch.name }}</option>
//                       }
//                     </select>
//                   </div>
//                 </div>

//                 <div class="form-field span-2-inner">
//                   <label for="description">Description</label>
//                   <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief overview of function..."></textarea>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <!-- Card 2: Leadership (1 Column) -->
//           <div class="grid-card card-anim-2">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></div>
//               <h2 class="card-title">Leadership</h2>
//             </div>
            
//             <div class="card-body flex-col">
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
//           </div>

//           <!-- Card 3: Operations (1 Column) -->
//           <div class="grid-card card-anim-3">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg></div>
//               <h2 class="card-title">Operations & Budget</h2>
//             </div>
            
//             <div class="card-body flex-col">
//               <div class="form-field">
//                 <label for="costCenter">Cost Center ID</label>
//                 <input id="costCenter" type="text" formControlName="costCenter" class="se-input uppercase-input" placeholder="e.g. CC-101">
//               </div>

//               <div class="form-field">
//                 <label for="budgetCode">Budget Code</label>
//                 <input id="budgetCode" type="text" formControlName="budgetCode" class="se-input uppercase-input" placeholder="e.g. BC-2024">
//               </div>

//               <div class="form-field">
//                 <label for="maxStrength">Max Headcount</label>
//                 <input id="maxStrength" type="number" formControlName="maxStrength" class="se-input" placeholder="0">
//               </div>
//             </div>
//           </div>

//           <!-- Card 4: Contact & Settings (1 Column) -->
//           <div class="grid-card card-anim-4">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
//               <h2 class="card-title">Contact Information</h2>
//             </div>
            
//             <div class="card-body flex-col">
//               <div class="form-field">
//                 <label for="contactEmail">Department Email</label>
//                 <input id="contactEmail" type="email" formControlName="contactEmail" class="se-input" placeholder="dept@company.com">
//               </div>

//               <div class="form-field">
//                 <label for="contactPhone">Contact Phone</label>
//                 <input id="contactPhone" type="text" formControlName="contactPhone" class="se-input" placeholder="+1 (555) 000-0000">
//               </div>

//               <div class="form-field">
//                 <label for="location">Physical Location</label>
//                 <input id="location" type="text" formControlName="location" class="se-input" placeholder="e.g. Floor 3, Wing B">
//               </div>
//             </div>
//           </div>

//           <!-- Card 5: Metadata & Status (1 Column) -->
//           <div class="grid-card card-anim-5" formGroupName="metadata">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
//               <h2 class="card-title">Metadata & Status</h2>
//             </div>
            
//             <div class="card-body flex-col">
//               <div class="form-field">
//                 <label for="establishedDate">Date Established</label>
//                 <input id="establishedDate" type="date" formControlName="establishedDate" class="se-input">
//               </div>

//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="division">Division</label>
//                   <input id="division" type="text" formControlName="division" class="se-input" placeholder="Tech">
//                 </div>

//                 <div class="form-field">
//                   <label for="region">Region</label>
//                   <input id="region" type="text" formControlName="region" class="se-input" placeholder="APAC">
//                 </div>
//               </div>

//               <div class="status-toggle-wrapper" [formGroup]="deptForm">
//                 <label class="toggle-container">
//                   <input type="checkbox" formControlName="isActive" class="toggle-input">
//                   <span class="toggle-slider"></span>
//                   <div class="toggle-text">
//                     <span class="toggle-label">Active Department</span>
//                   </div>
//                 </label>
//               </div>
//             </div>
//           </div>

//         </form>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* ==========================================================================
//        THEME FALLBACKS & BASE
//        ========================================================================== */
//     :host {
   
//       display: block;
//       width: 100%;
//       height: 100vh; /* Locks height to viewport */
//       background-color: var(--bg-primary);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//       overflow: hidden;
//     }

//     /* Fullscreen Wrapper to prevent overall page scroll */
//     .app-fullscreen-wrapper {
//       display: flex;
//       flex-direction: column;
//       height: 100%;
//       width: 100%;
//     }

//     /* Compact Glass Header */
//     .dashboard-header {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: var(--spacing-lg) var(--spacing-xl);
//       background: var(--glass-bg-c);
//       backdrop-filter: var(--glass-blur-c);
//       -webkit-backdrop-filter: var(--glass-blur-c);
//       border-bottom: var(--ui-border-width) solid var(--border-primary);
//       z-index: 50;
//       flex-shrink: 0;
//     }

//     .header-left, .header-right {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//     }

//     .icon-btn {
//       background: var(--component-bg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       color: var(--text-secondary);
//       border-radius: var(--ui-border-radius);
//       width: 38px;
//       height: 38px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       cursor: pointer;
//       transition: var(--transition-base);
//     }

//     .icon-btn:hover {
//       background: var(--component-surface-raised);
//       color: var(--text-primary);
//       border-color: var(--border-secondary);
//     }

//     .page-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-xl);
//       font-weight: var(--font-weight-semibold);
//       margin: 0 0 2px 0;
//       line-height: 1.2;
//     }

//     .page-subtitle {
//       font-size: var(--font-size-xs);
//       color: var(--text-secondary);
//       margin: 0;
//     }

//     /* Status Indicator */
//     .header-status {
//       display: flex;
//       align-items: center;
//       gap: 6px;
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-medium);
//       color: var(--text-secondary);
//       padding: 6px 12px;
//       background: var(--component-surface-raised);
//       border-radius: 999px;
//       border: 1px solid var(--border-primary);
//       margin-right: var(--spacing-md);
//     }

//     .status-dot {
//       width: 6px;
//       height: 6px;
//       border-radius: 50%;
//       background: var(--text-tertiary);
//     }

//     .header-status.valid {
//       color: var(--color-success);
//       border-color: var(--color-success);
//       background: color-mix(in srgb, var(--color-success) 5%, transparent);
//     }
//     .header-status.valid .status-dot { background: var(--color-success); }

//     /* Buttons */
//     .btn {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       gap: 6px;
//       padding: 0.5rem 1rem;
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       border-radius: var(--ui-border-radius);
//       cursor: pointer;
//       transition: var(--transition-fast);
//       border: var(--ui-border-width) solid transparent;
//     }

//     .btn:focus-visible { box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color); outline: none; }
//     .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
//     .btn-outline:hover:not(:disabled) { background: var(--component-surface-raised); border-color: var(--border-primary); }
//     .btn-primary { background: var(--color-primary); color: #ffffff; }
//     .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark); }
//     .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

//     /* Main Dashboard Scroll Area */
//     .dashboard-content {
//       flex: 1;
//       overflow-y: auto;
//       padding: var(--spacing-xl);
//       background: var(--bg-primary);
//     }

//     /* BENTO GRID LAYOUT: The magic happens here */
//     .bento-grid {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: var(--spacing-xl);
//       align-items: start;
//       max-width: 1600px; /* Adapts beautifully to ultra-wide */
//       margin: 0 auto;
//     }

//     .span-2 { grid-column: span 2; }
//     .span-2-inner { grid-column: span 2; }

//     /* Compact Cards */
//     .grid-card {
//       background: var(--component-bg);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       box-shadow: var(--shadow-sm);
//       padding: var(--spacing-lg);
//       transition: var(--transition-base);
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .grid-card:hover {
//       border-color: var(--border-secondary);
//       box-shadow: var(--shadow-md);
//     }

//     .card-header {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       padding-bottom: var(--spacing-sm);
//       border-bottom: 1px solid var(--border-primary);
//     }

//     .card-icon {
//       color: var(--color-primary);
//       display: flex;
//       align-items: center;
//     }

//     .card-title {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-md);
//       font-weight: var(--font-weight-semibold);
//       margin: 0;
//       color: var(--text-primary);
//     }

//     .card-body.flex-col {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//     }

//     .inner-grid-2 {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: var(--spacing-md);
//     }

//     /* Form Fields - Compressed for density */
//     .form-field {
//       display: flex;
//       flex-direction: column;
//       gap: 4px;
//     }

//     .form-field label {
//       font-size: 0.6875rem; /* Very compact label */
//       font-weight: var(--font-weight-semibold);
//       color: var(--text-label);
//       text-transform: uppercase;
//       letter-spacing: 0.03em;
//     }

//     .required { color: var(--color-error); }

//     /* Inputs - Reduced height */
//     .se-input {
//       width: 100%;
//       background: var(--component-bg);
//       border: var(--ui-border-width) solid var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       padding: 0.4rem 0.6rem;
//       font-size: var(--font-size-sm);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//       transition: var(--transition-base);
//       box-sizing: border-box;
//       height: 36px; /* Strict compact height */
//     }

//     .se-input::placeholder { color: var(--text-tertiary); }
//     .se-input:hover:not(:focus) { border-color: var(--text-tertiary); }
//     .se-input:focus { border-color: var(--component-border-focus); box-shadow: 0 0 0 var(--focus-ring-width) var(--focus-ring-color); outline: none; }
//     .uppercase-input { text-transform: uppercase; }
    
//     .se-textarea {
//       height: auto;
//       min-height: 60px;
//       resize: vertical;
//     }

//     /* Selects */
//     .select-wrapper { position: relative; }
//     select.se-input { appearance: none; padding-right: 2rem; cursor: pointer; }
//     .select-wrapper::after {
//       content: "";
//       position: absolute;
//       right: 0.75rem;
//       top: 50%;
//       transform: translateY(-50%);
//       width: 8px; height: 5px;
//       background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
//       background-repeat: no-repeat;
//       pointer-events: none;
//     }

//     /* Compact Toggle */
//     .status-toggle-wrapper {
//       margin-top: var(--spacing-xs);
//       padding: var(--spacing-sm) var(--spacing-md);
//       background: var(--component-surface-raised);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius);
//     }
//     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
//     .toggle-input { display: none; }
//     .toggle-slider {
//       position: relative; width: 36px; height: 20px;
//       background-color: var(--border-secondary); border-radius: 20px;
//       transition: var(--transition-base); flex-shrink: 0;
//     }
//     .toggle-slider::before {
//       content: ""; position: absolute; height: 14px; width: 14px;
//       left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%;
//       transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm);
//     }
//     .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
//     .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
//     .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }

//     /* Animations */
//     @keyframes spin { to { transform: rotate(360deg); } }
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
//     .fade-in { animation: fadeIn 0.3s ease-out; }
//     .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; }
//     .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; }
//     .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; }
//     .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; }
//     .card-anim-5 { animation: popIn 0.4s ease-out 0.25s both; }

//     /* ==========================================================================
//        RESPONSIVE GRID LOGIC
//        ========================================================================== */
//     @media (max-width: 1200px) {
//       .bento-grid {
//         grid-template-columns: repeat(2, 1fr); /* Drops to 2 columns on laptops */
//       }
//       .span-2 { grid-column: span 2; }
//     }
    
//     @media (max-width: 768px) {
//       .dashboard-header { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
//       .header-right { justify-content: space-between; }
//       .bento-grid { grid-template-columns: 1fr; } /* Drops to 1 column on tablets/mobile */
//       .span-2, .span-2-inner { grid-column: span 1; }
//       .inner-grid-2 { grid-template-columns: 1fr; }
//       .dashboard-content { padding: var(--spacing-md); }
//     }
//   `]
// })
// export class DepartmentFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private hrmsService = inject(HRMSService);
//   private messageService = inject(AppMessageService);
//   private masterList = inject(MasterListService);
//   private router = { navigate: (path: any[]) => console.log('Navigating to:', path) };

//   deptForm!: FormGroup;
//   isSubmitting = signal(false);

//   departmentOptions = signal<any[]>([]);
//   userOptions = this.masterList.users;
//   branchOptions = this.masterList.branches;

//   ngOnInit() {
//     this.initForm();
//     this.loadDependencies();
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

//   onSubmit() {
//     if (this.deptForm.invalid) {
//       this.deptForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);

//     const payload = { ...this.deptForm.value };

//     if (!payload.parentDepartment) delete payload.parentDepartment;
//     if (!payload.branchId) delete payload.branchId;
//     if (!payload.headOfDepartment) delete payload.headOfDepartment;
//     if (!payload.assistantHOD) delete payload.assistantHOD;

//     this.hrmsService.createDepartment(payload).subscribe({
//       next: (res: any) => {
//         this.messageService.showSuccess('Success', 'Department created successfully');
//         this.isSubmitting.set(false);
//         this.goBack();
//       },
//       error: (err: any) => {
//         this.messageService.showError('Error', err.message || 'Failed to create department');
//         this.isSubmitting.set(false);
//       }
//     });
//   }

//  goBack() {
//   console.log('Navigating back to department list...');
//   this.router.navigate(['/hrms/department/list']);
// }

// }
