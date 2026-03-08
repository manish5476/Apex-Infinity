import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, catchError, map } from 'rxjs';
import { AppMessageService } from '../../../../core/services/message.service';
import { HRMSService } from '../../hrms.service';

@Component({
  selector: 'app-designation-form',
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
        <form [formGroup]="desigForm" class="bento-grid">
          
          <div class="grid-card span-2 card-anim-1">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
              <h2 class="card-title">Role Details</h2>
            </div>
            <div class="card-body">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="title">Designation Title <span class="required">*</span></label>
                  <input id="title" type="text" formControlName="title" class="se-input" placeholder="e.g. Senior Developer">
                </div>

                <div class="form-field">
                  <label for="code">Job Code <span class="required">*</span></label>
                  <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. DEV-002">
                </div>

                <div class="form-field">
                  <label for="jobFamily">Job Family</label>
                  <input id="jobFamily" type="text" formControlName="jobFamily" class="se-input" placeholder="e.g. Technical, Managerial">
                </div>

                <div class="form-field">
                  <label for="experienceRequired">Experience Required (Years)</label>
                  <input id="experienceRequired" type="number" formControlName="experienceRequired" class="se-input" placeholder="e.g. 5">
                </div>

                <div class="form-field span-2-inner">
                  <label for="description">Role Description</label>
                  <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief overview of the role..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-2">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg></div>
              <h2 class="card-title">Hierarchy & Path</h2>
            </div>
            <div class="card-body flex-col">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="level">Level <span class="required">*</span></label>
                  <input id="level" type="number" formControlName="level" class="se-input" min="1" placeholder="1">
                </div>
                <div class="form-field">
                  <label for="grade">Grade</label>
                  <div class="select-wrapper">
                    <select id="grade" formControlName="grade" class="se-input">
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                      <option value="D">D</option><option value="E">E</option><option value="F">F</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-field">
                <label for="nextDesignation">Career Path (Next Role)</label>
                <div class="select-wrapper">
                  <select id="nextDesignation" formControlName="nextDesignation" class="se-input">
                    <option [ngValue]="null">None</option>
                    @for (desig of designationOptions(); track desig._id) {
                      <option [value]="desig._id">{{ desig.title }} ({{ desig.code }})</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-field">
                <label for="promotionAfterYears">Promotion Eligibility (Years)</label>
                <input id="promotionAfterYears" type="number" formControlName="promotionAfterYears" class="se-input" placeholder="e.g. 2">
              </div>
            </div>
          </div>

          <div class="grid-card span-2 card-anim-3">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
              <h2 class="card-title">Requirements (One per line)</h2>
            </div>
            <div class="card-body">
              <div class="inner-grid-2">
                <div class="form-field">
                  <label for="responsibilitiesText">Key Responsibilities</label>
                  <textarea id="responsibilitiesText" formControlName="responsibilitiesText" rows="4" class="se-input se-textarea" placeholder="Enter responsibilities, separated by new lines..."></textarea>
                </div>

                <div class="form-field">
                  <label for="qualificationsText">Qualifications</label>
                  <textarea id="qualificationsText" formControlName="qualificationsText" rows="4" class="se-input se-textarea" placeholder="Enter qualifications, separated by new lines..."></textarea>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card card-anim-4" formGroupName="salaryBand">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
              <h2 class="card-title">Salary Band</h2>
            </div>
            <div class="card-body flex-col">
              <div class="form-field">
                <label for="minSalary">Minimum Range</label>
                <input id="minSalary" type="number" formControlName="min" class="se-input" placeholder="0">
              </div>

              <div class="form-field">
                <label for="maxSalary">Maximum Range</label>
                <input id="maxSalary" type="number" formControlName="max" class="se-input" placeholder="0">
              </div>

              <div class="form-field">
                <label for="currency">Currency</label>
                <div class="select-wrapper">
                  <select id="currency" formControlName="currency" class="se-input">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-card span-2 card-anim-5" style="grid-column: span 3;">
            <div class="card-header">
              <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
              <h2 class="card-title">Attributes & Reporting</h2>
            </div>
            
            <div class="card-body">
              <div class="bento-grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); padding: 0;">
                
                <div class="form-field">
                  <label for="reportsTo">Reports To (Hold Ctrl/Cmd to select multiple)</label>
                  <select id="reportsTo" formControlName="reportsTo" multiple class="se-input" style="height: 120px; padding: 0.5rem;">
                    @for (desig of designationOptions(); track desig._id) {
                      <option [value]="desig._id" style="padding: 4px; margin-bottom: 2px;">{{ desig.title }}</option>
                    }
                  </select>
                </div>

                <div class="flex-col" style="gap: var(--spacing-md); display: flex; justify-content: center;">
                  <div formGroupName="metadata" style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
                    
                    <div class="status-toggle-wrapper">
                      <label class="toggle-container">
                        <input type="checkbox" formControlName="isManager" class="toggle-input">
                        <span class="toggle-slider"></span>
                        <div class="toggle-text"><span class="toggle-label">Managerial Role</span></div>
                      </label>
                    </div>

                    <div class="status-toggle-wrapper">
                      <label class="toggle-container">
                        <input type="checkbox" formControlName="isExecutive" class="toggle-input">
                        <span class="toggle-slider"></span>
                        <div class="toggle-text"><span class="toggle-label">Executive Level</span></div>
                      </label>
                    </div>

                    <div class="status-toggle-wrapper">
                      <label class="toggle-container">
                        <input type="checkbox" formControlName="requiresApproval" class="toggle-input">
                        <span class="toggle-slider"></span>
                        <div class="toggle-text"><span class="toggle-label">Requires Appr.</span></div>
                      </label>
                    </div>

                  </div>

                  <div class="status-toggle-wrapper" style="border-color: var(--color-primary);">
                    <label class="toggle-container">
                      <input type="checkbox" formControlName="isActive" class="toggle-input">
                      <span class="toggle-slider"></span>
                      <div class="toggle-text"><span class="toggle-label">Designation is Active</span></div>
                    </label>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </form>
      </main>
    </div>
  `,
  styles: [`
    /* KEEP ALL THE EXISTING STYLES FROM DEPARTMENT HERE */
    :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
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
    .select-wrapper { position: relative; } select.se-input:not([multiple]) { appearance: none; padding-right: 2rem; cursor: pointer; }
    .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
    .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
    .toggle-input { display: none; }
    .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
    .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
    .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
    .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
    .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
    .loading-opacity { opacity: 0.5; pointer-events: none; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out; }
    .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; } .card-anim-5 { animation: popIn 0.4s ease-out 0.25s both; }
  `]
})
export class DesignationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hrmsService = inject(HRMSService);
  private messageService = inject(AppMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  desigForm!: FormGroup;
  
  isSubmitting = signal(false);
  isLoading = signal(false);
  isEditMode = signal(false);
  desigId: string | null = null;

  designationOptions = signal<any[]>([]);

  ngOnInit() {
    this.initForm();
    this.loadDependencies();
    this.checkEditMode();
  }

  private initForm() {
    this.desigForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      description: [''],
      
      level: [1, [Validators.required, Validators.min(1)]],
      grade: ['C', [Validators.required]],
      
      nextDesignation: [null],
      promotionAfterYears: [null, [Validators.min(0)]],
      
      jobFamily: [''],
      experienceRequired: [null, [Validators.min(0)]],
      
      // We use text fields in the form, and map to arrays on Submit/Patch
      responsibilitiesText: [''], 
      qualificationsText: [''],

      salaryBand: this.fb.group({
        min: [null],
        max: [null],
        currency: ['INR']
      }),

      reportsTo: [[]], // Standard multi-select array of IDs
      isActive: [true],

      metadata: this.fb.group({
        isManager: [false],
        isExecutive: [false],
        requiresApproval: [false]
      })
    });

    this.desigForm.get('code')?.valueChanges.subscribe(val => {
      if (val && val !== val.toUpperCase()) {
        this.desigForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
      }
    });
  }

  private loadDependencies() {
    // Fetches all designations to populate "Next Designation" and "Reports To" dropdowns
    this.hrmsService.getDesignations().subscribe({
      next: (res: any) => {
        // Just in case this API also returns res.data.data
        const list = res?.data?.designations || res?.data?.data || [];
        this.designationOptions.set(list);
      }
    });
  }

  private checkEditMode() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.desigId = id;
        this.loadDesignationDetails();
      }
    });
  }

  private loadDesignationDetails() {
    this.isLoading.set(true);
    this.desigForm.disable(); 
    
    this.hrmsService.getDesignation(this.desigId!).pipe(
      // --- THIS IS THE UPDATED MAPPING LOGIC based on the JSON provided ---
      map((res: any) => res?.data?.data || res?.data || res),
      catchError(err => {
        this.isLoading.set(false);
        this.desigForm.enable();
        this.messageService.handleHttpError(err)
        return of(null);
      })
    ).subscribe((data) => {
      if (data) {
        this.patchFormValues(data);
      }
      this.isLoading.set(false);
      this.desigForm.enable();
    });
  }

  private patchFormValues(data: any) {
    // Convert arrays back to multiline text for the textareas
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
        min: data.salaryBand?.min || null,
        max: data.salaryBand?.max || null,
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
    
    // Extract raw form values
    const formValue = { ...this.desigForm.value };

    // Format multiline textareas back into Arrays for the Mongoose schema
    const responsibilitiesArray = formValue.responsibilitiesText
      ? formValue.responsibilitiesText.split('\n').filter((item: string) => item.trim() !== '')
      : [];
      
    const qualificationsArray = formValue.qualificationsText
      ? formValue.qualificationsText.split('\n').filter((item: string) => item.trim() !== '')
      : [];

    // Construct final payload
    const payload: any = {
      ...formValue,
      responsibilities: responsibilitiesArray,
      qualifications: qualificationsArray
    };

    // Clean up temporary form fields and empty references
    delete payload.responsibilitiesText;
    delete payload.qualificationsText;
    
    if (!payload.nextDesignation) delete payload.nextDesignation;

    // Call proper endpoint based on mode
    if (this.isEditMode()) {
      this.hrmsService.updateDesignation(this.desigId!, payload).subscribe({
        next: () => {
          this.messageService.showSuccess( 'Designation updated successfully');
          this.isSubmitting.set(false);
          this.goBack();
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err)
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.hrmsService.createDesignation(payload).subscribe({
        next: () => {
          this.messageService.showSuccess('Designation created successfully');
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
    this.router.navigate(['/hrms/designation/list']); 
  }
}
// import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { of, catchError, map } from 'rxjs';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { HRMSService } from '../../hrms.service';
// @Component({
//   selector: 'app-designation-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="app-fullscreen-wrapper fade-in">
      
//       <header class="dashboard-header glass-header">
//         <div class="header-left">
//           <button class="icon-btn back-btn" type="button" (click)="goBack()" title="Go Back">
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
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
//             <ng-container *ngIf="!isSubmitting(); else loadingState">
//               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
//               <span>{{ isEditMode() ? 'Update' : 'Save' }}</span>
//             </ng-container>
//             <ng-template #loadingState>
//               <div class="spinner"></div>
//               <span>{{ isEditMode() ? 'Updating' : 'Saving' }}</span>
//             </ng-template>
//           </button>
//         </div>
//       </header>

//       <main class="dashboard-content" [class.loading-opacity]="isLoading()">
//         <form [formGroup]="desigForm" class="bento-grid">
          
//           <div class="grid-card span-2 card-anim-1">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
//               <h2 class="card-title">Role Details</h2>
//             </div>
//             <div class="card-body">
//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="title">Designation Title <span class="required">*</span></label>
//                   <input id="title" type="text" formControlName="title" class="se-input" placeholder="e.g. Senior Developer">
//                 </div>

//                 <div class="form-field">
//                   <label for="code">Job Code <span class="required">*</span></label>
//                   <input id="code" type="text" formControlName="code" class="se-input uppercase-input" placeholder="e.g. DEV-002">
//                 </div>

//                 <div class="form-field">
//                   <label for="jobFamily">Job Family</label>
//                   <input id="jobFamily" type="text" formControlName="jobFamily" class="se-input" placeholder="e.g. Technical, Managerial">
//                 </div>

//                 <div class="form-field">
//                   <label for="experienceRequired">Experience Required (Years)</label>
//                   <input id="experienceRequired" type="number" formControlName="experienceRequired" class="se-input" placeholder="e.g. 5">
//                 </div>

//                 <div class="form-field span-2-inner">
//                   <label for="description">Role Description</label>
//                   <textarea id="description" formControlName="description" rows="2" class="se-input se-textarea" placeholder="Brief overview of the role..."></textarea>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="grid-card card-anim-2">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg></div>
//               <h2 class="card-title">Hierarchy & Path</h2>
//             </div>
//             <div class="card-body flex-col">
//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="level">Level <span class="required">*</span></label>
//                   <input id="level" type="number" formControlName="level" class="se-input" min="1" placeholder="1">
//                 </div>
//                 <div class="form-field">
//                   <label for="grade">Grade</label>
//                   <div class="select-wrapper">
//                     <select id="grade" formControlName="grade" class="se-input">
//                       <option value="A">A</option><option value="B">B</option><option value="C">C</option>
//                       <option value="D">D</option><option value="E">E</option><option value="F">F</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="nextDesignation">Career Path (Next Role)</label>
//                 <div class="select-wrapper">
//                   <select id="nextDesignation" formControlName="nextDesignation" class="se-input">
//                     <option [ngValue]="null">None</option>
//                     @for (desig of designationOptions(); track desig._id) {
//                       <option [value]="desig._id">{{ desig.title }} ({{ desig.code }})</option>
//                     }
//                   </select>
//                 </div>
//               </div>

//               <div class="form-field">
//                 <label for="promotionAfterYears">Promotion Eligibility (Years)</label>
//                 <input id="promotionAfterYears" type="number" formControlName="promotionAfterYears" class="se-input" placeholder="e.g. 2">
//               </div>
//             </div>
//           </div>

//           <div class="grid-card span-2 card-anim-3">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div>
//               <h2 class="card-title">Requirements (One per line)</h2>
//             </div>
//             <div class="card-body">
//               <div class="inner-grid-2">
//                 <div class="form-field">
//                   <label for="responsibilitiesText">Key Responsibilities</label>
//                   <textarea id="responsibilitiesText" formControlName="responsibilitiesText" rows="4" class="se-input se-textarea" placeholder="Enter responsibilities, separated by new lines..."></textarea>
//                 </div>

//                 <div class="form-field">
//                   <label for="qualificationsText">Qualifications</label>
//                   <textarea id="qualificationsText" formControlName="qualificationsText" rows="4" class="se-input se-textarea" placeholder="Enter qualifications, separated by new lines..."></textarea>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="grid-card card-anim-4" formGroupName="salaryBand">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
//               <h2 class="card-title">Salary Band</h2>
//             </div>
//             <div class="card-body flex-col">
//               <div class="form-field">
//                 <label for="minSalary">Minimum Range</label>
//                 <input id="minSalary" type="number" formControlName="min" class="se-input" placeholder="0">
//               </div>

//               <div class="form-field">
//                 <label for="maxSalary">Maximum Range</label>
//                 <input id="maxSalary" type="number" formControlName="max" class="se-input" placeholder="0">
//               </div>

//               <div class="form-field">
//                 <label for="currency">Currency</label>
//                 <div class="select-wrapper">
//                   <select id="currency" formControlName="currency" class="se-input">
//                     <option value="INR">INR (₹)</option>
//                     <option value="USD">USD ($)</option>
//                     <option value="EUR">EUR (€)</option>
//                     <option value="GBP">GBP (£)</option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div class="grid-card span-2 card-anim-5" style="grid-column: span 3;">
//             <div class="card-header">
//               <div class="card-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg></div>
//               <h2 class="card-title">Attributes & Reporting</h2>
//             </div>
            
//             <div class="card-body">
//               <div class="bento-grid" style="grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); padding: 0;">
                
//                 <div class="form-field">
//                   <label for="reportsTo">Reports To (Hold Ctrl/Cmd to select multiple)</label>
//                   <select id="reportsTo" formControlName="reportsTo" multiple class="se-input" style="height: 120px; padding: 0.5rem;">
//                     @for (desig of designationOptions(); track desig._id) {
//                       <option [value]="desig._id" style="padding: 4px; margin-bottom: 2px;">{{ desig.title }}</option>
//                     }
//                   </select>
//                 </div>

//                 <div class="flex-col" style="gap: var(--spacing-md); display: flex; justify-content: center;">
//                   <div formGroupName="metadata" style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
                    
//                     <div class="status-toggle-wrapper">
//                       <label class="toggle-container">
//                         <input type="checkbox" formControlName="isManager" class="toggle-input">
//                         <span class="toggle-slider"></span>
//                         <div class="toggle-text"><span class="toggle-label">Managerial Role</span></div>
//                       </label>
//                     </div>

//                     <div class="status-toggle-wrapper">
//                       <label class="toggle-container">
//                         <input type="checkbox" formControlName="isExecutive" class="toggle-input">
//                         <span class="toggle-slider"></span>
//                         <div class="toggle-text"><span class="toggle-label">Executive Level</span></div>
//                       </label>
//                     </div>

//                     <div class="status-toggle-wrapper">
//                       <label class="toggle-container">
//                         <input type="checkbox" formControlName="requiresApproval" class="toggle-input">
//                         <span class="toggle-slider"></span>
//                         <div class="toggle-text"><span class="toggle-label">Requires Appr.</span></div>
//                       </label>
//                     </div>

//                   </div>

//                   <div class="status-toggle-wrapper" style="border-color: var(--color-primary);">
//                     <label class="toggle-container">
//                       <input type="checkbox" formControlName="isActive" class="toggle-input">
//                       <span class="toggle-slider"></span>
//                       <div class="toggle-text"><span class="toggle-label">Designation is Active</span></div>
//                     </label>
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </div>

//         </form>
//       </main>
//     </div>
//   `,
//   styles: [`
//     /* KEEP ALL THE EXISTING STYLES FROM DEPARTMENT HERE */
//     :host { display: block; width: 100%; height: 100vh; background-color: var(--bg-primary); font-family: var(--font-body); color: var(--text-primary); overflow: hidden; }
//     .app-fullscreen-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; }
//     .dashboard-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-lg) var(--spacing-xl); background: var(--glass-bg-c); backdrop-filter: var(--glass-blur-c); border-bottom: var(--ui-border-width) solid var(--border-primary); z-index: 50; flex-shrink: 0; }
//     .header-left, .header-right { display: flex; align-items: center; gap: var(--spacing-md); }
//     .icon-btn { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); color: var(--text-secondary); border-radius: var(--ui-border-radius); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition-base); }
//     .page-title { font-family: var(--font-heading); font-size: var(--font-size-xl); font-weight: var(--font-weight-semibold); margin: 0 0 2px 0; line-height: 1.2; }
//     .page-subtitle { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0; }
//     .header-status { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--text-secondary); padding: 6px 12px; background: var(--component-surface-raised); border-radius: 999px; border: 1px solid var(--border-primary); margin-right: var(--spacing-md); }
//     .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-tertiary); }
//     .header-status.valid { color: var(--color-success); border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 5%, transparent); }
//     .header-status.valid .status-dot { background: var(--color-success); }
//     .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 0.5rem 1rem; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); border-radius: var(--ui-border-radius); cursor: pointer; transition: var(--transition-fast); border: var(--ui-border-width) solid transparent; }
//     .btn-outline { background: var(--component-bg); border-color: var(--border-secondary); color: var(--text-primary); }
//     .btn-primary { background: var(--color-primary); color: #ffffff; }
//     .dashboard-content { flex: 1; overflow-y: auto; padding: var(--spacing-xl); background: var(--bg-primary); transition: opacity 0.3s; }
//     .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xl); align-items: start; max-width: 1600px; margin: 0 auto; }
//     .span-2 { grid-column: span 2; } .span-2-inner { grid-column: span 2; }
//     .grid-card { background: var(--component-bg); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius-lg); box-shadow: var(--shadow-sm); padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-md); }
//     .card-header { display: flex; align-items: center; gap: var(--spacing-sm); padding-bottom: var(--spacing-sm); border-bottom: 1px solid var(--border-primary); }
//     .card-icon { color: var(--color-primary); display: flex; align-items: center; }
//     .card-title { font-family: var(--font-heading); font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; color: var(--text-primary); }
//     .card-body.flex-col { display: flex; flex-direction: column; gap: var(--spacing-md); }
//     .inner-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
//     .form-field { display: flex; flex-direction: column; gap: 4px; }
//     .form-field label { font-size: 0.6875rem; font-weight: var(--font-weight-semibold); color: var(--text-label); text-transform: uppercase; letter-spacing: 0.03em; }
//     .required { color: var(--color-error); }
//     .se-input { width: 100%; background: var(--component-bg); border: var(--ui-border-width) solid var(--border-secondary); border-radius: var(--ui-border-radius); padding: 0.4rem 0.6rem; font-size: var(--font-size-sm); font-family: var(--font-body); color: var(--text-primary); box-sizing: border-box; height: 36px; }
//     .uppercase-input { text-transform: uppercase; }
//     .se-textarea { height: auto; min-height: 60px; resize: vertical; }
//     .select-wrapper { position: relative; } select.se-input:not([multiple]) { appearance: none; padding-right: 2rem; cursor: pointer; }
//     .status-toggle-wrapper { margin-top: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); background: var(--component-surface-raised); border: var(--ui-border-width) solid var(--border-primary); border-radius: var(--ui-border-radius); }
//     .toggle-container { display: flex; align-items: center; cursor: pointer; gap: var(--spacing-md); }
//     .toggle-input { display: none; }
//     .toggle-slider { position: relative; width: 36px; height: 20px; background-color: var(--border-secondary); border-radius: 20px; transition: var(--transition-base); flex-shrink: 0; }
//     .toggle-slider::before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #ffffff; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1); box-shadow: var(--shadow-sm); }
//     .toggle-input:checked + .toggle-slider { background-color: var(--color-success); }
//     .toggle-input:checked + .toggle-slider::before { transform: translateX(16px); }
//     .toggle-label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--text-primary); }
//     .loading-opacity { opacity: 0.5; pointer-events: none; }
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     @keyframes popIn { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
//     .fade-in { animation: fadeIn 0.3s ease-out; }
//     .card-anim-1 { animation: popIn 0.4s ease-out 0.05s both; } .card-anim-2 { animation: popIn 0.4s ease-out 0.1s both; } .card-anim-3 { animation: popIn 0.4s ease-out 0.15s both; } .card-anim-4 { animation: popIn 0.4s ease-out 0.2s both; } .card-anim-5 { animation: popIn 0.4s ease-out 0.25s both; }
//   `]
// })
// export class DesignationFormComponent implements OnInit {
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
      
//       // We use text fields in the form, and map to arrays on Submit/Patch
//       responsibilitiesText: [''], 
//       qualificationsText: [''],

//       salaryBand: this.fb.group({
//         min: [null],
//         max: [null],
//         currency: ['INR']
//       }),

//       reportsTo: [[]], // Standard multi-select array of IDs
//       isActive: [true],

//       metadata: this.fb.group({
//         isManager: [false],
//         isExecutive: [false],
//         requiresApproval: [false]
//       })
//     });

//     this.desigForm.get('code')?.valueChanges.subscribe(val => {
//       if (val && val !== val.toUpperCase()) {
//         this.desigForm.get('code')?.setValue(val.toUpperCase(), { emitEvent: false });
//       }
//     });
//   }

//   private loadDependencies() {
//     // Fetches all designations to populate "Next Designation" and "Reports To" dropdowns
//     this.hrmsService.getDesignations().subscribe({
//       next: (res: any) => {
//         if (res.data && res.data.designations) {
//           this.designationOptions.set(res.data.designations);
//         }
//       }
//     });
//   }

//   private checkEditMode() {
//     this.route.paramMap.subscribe(params => {
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
//       map((res: any) => res?.data?.designation || res),
//       catchError(err => {
//         this.isLoading.set(false);
//         this.desigForm.enable();
//         this.messageService.showError('Error', 'Failed to load designation details.');
//         return of(null);
//       })
//     ).subscribe((data) => {
//       if (data) {
//         this.patchFormValues(data);
//       }
//       this.isLoading.set(false);
//       this.desigForm.enable();
//     });
//   }

//   private patchFormValues(data: any) {
//     // Convert arrays back to multiline text for the textareas
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
    
//     // Extract raw form values
//     const formValue = { ...this.desigForm.value };

//     // Format multiline textareas back into Arrays for the Mongoose schema
//     const responsibilitiesArray = formValue.responsibilitiesText
//       ? formValue.responsibilitiesText.split('\n').filter((item: string) => item.trim() !== '')
//       : [];
      
//     const qualificationsArray = formValue.qualificationsText
//       ? formValue.qualificationsText.split('\n').filter((item: string) => item.trim() !== '')
//       : [];

//     // Construct final payload
//     const payload: any = {
//       ...formValue,
//       responsibilities: responsibilitiesArray,
//       qualifications: qualificationsArray
//     };

//     // Clean up temporary form fields and empty references
//     delete payload.responsibilitiesText;
//     delete payload.qualificationsText;
    
//     if (!payload.nextDesignation) delete payload.nextDesignation;

//     // Call proper endpoint based on mode
//     if (this.isEditMode()) {
//       this.hrmsService.updateDesignation(this.desigId!, payload).subscribe({
//         next: () => {
//           this.messageService.showSuccess('Success', 'Designation updated successfully');
//           this.isSubmitting.set(false);
//           this.goBack();
//         },
//         error: (err: any) => {
//           this.messageService.showError('Error', err.message || 'Failed to update designation');
//           this.isSubmitting.set(false);
//         }
//       });
//     } else {
//       this.hrmsService.createDesignation(payload).subscribe({
//         next: () => {
//           this.messageService.showSuccess('Success', 'Designation created successfully');
//           this.isSubmitting.set(false);
//           this.goBack();
//         },
//         error: (err: any) => {
//           this.messageService.showError('Error', err.message || 'Failed to create designation');
//           this.isSubmitting.set(false);
//         }
//       });
//     }
//   }

//   goBack() {
//     this.router.navigate(['/hrms/designation/list']); 
//   }
// }
