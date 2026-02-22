import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

// PrimeNG Modules (v18 Compatible)
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';

// Mock Services (Replace with your actual imports)
import { MasterListService } from '../../../core/services/master-list.service';
import { UserManagementService } from '../user-management.service';
import { AppMessageService } from '../../../core/services/message.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    RouterModule,
    InputTextModule, 
    ButtonModule, 
    SelectModule, 
    PasswordModule, 
    ToastModule, 
    ToggleSwitchModule, 
    InputNumberModule, 
    DatePickerModule, 
    PanelModule,
    DividerModule, 
    TabsModule,
    CardModule
  ],
  template: `
    <p-toast></p-toast>
    
    <!-- Full Screen Layout -->
    <div class="app-layout">
        
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="form-structure">
          
          <!-- HEADER (Fixed Top) -->
          <div class="form-header">
            <div class="header-content">
              <div class="title-section">
                <h1 class="page-title">{{ editMode() ? 'Edit Employee' : 'New Employee' }}</h1>
                <div class="meta-badges">
                    <span class="id-badge" *ngIf="userId">{{ userId }}</span>
                    <span class="status-badge" [ngClass]="userForm.get('status')?.value">
                        {{ userForm.get('status')?.value || 'New' }}
                    </span>
                </div>
              </div>
              <p class="page-subtitle">
                {{ editMode() ? 'Update user details, access control and permissions.' : 'Create a new employee record in the system.' }}
              </p>
            </div>

            <div class="header-actions">
              <button pButton label="Cancel" class="p-button-text p-button-secondary" type="button" (click)="onCancel()"></button>
              <button pButton type="submit" [label]="editMode() ? 'Save Changes' : 'Create User'" icon="pi pi-check" [loading]="isSubmitting()"></button>
            </div>
          </div>

          <!-- BODY (Scrollable) -->
          <div class="form-body custom-scrollbar">
            
            <div class="content-container">
            
                <!-- 1. IDENTITY & ACCESS -->
                <div class="section-panel">
                <div class="section-header">
                    <h3>Identity & Access</h3>
                    <p>Basic login details and system role</p>
                </div>
                
                <div class="form-grid">
                    <div class="field-group">
                    <label>Full Name <span class="req">*</span></label>
                    <input pInputText formControlName="name" placeholder="Ex: John Doe" class="full-width" />
                    </div>
                    
                    <div class="field-group">
                    <label>Email Address <span class="req">*</span></label>
                    <input pInputText formControlName="email" placeholder="john@company.com" class="full-width" />
                    </div>

                    <div class="field-group">
                    <label>Primary Phone <span class="req">*</span></label>
                    <input pInputText formControlName="phone" placeholder="+91 98765 43210" class="full-width" />
                    </div>

                    <div class="field-group">
                    <label>Role <span class="req">*</span></label>
                    <p-select [options]="roles()" formControlName="role" optionLabel="name" optionValue="_id" placeholder="Select Role" styleClass="full-width"></p-select>
                    </div>

                    <div class="field-group">
                    <label>Branch</label>
                    <p-select [options]="branches()" formControlName="branchId" optionLabel="name" optionValue="_id" placeholder="Global / HQ" [showClear]="true" styleClass="full-width"></p-select>
                    </div>

                    <div class="field-group">
                    <label>Account Status</label>
                    <p-select [options]="userStatuses()" formControlName="status" optionLabel="label" optionValue="value" styleClass="full-width"></p-select>
                    </div>

                    <!-- Highlighted Toggle for Login Access -->
                    <div class="control-item highlight">
                    <div class="control-info">
                        <span class="control-label">Login Access</span>
                        <span class="control-sub">Enable or disable system access</span>
                    </div>
                    <p-toggleswitch formControlName="isActive"></p-toggleswitch>
                    </div>
                </div>
                </div>

                <!-- 2. EMPLOYMENT DETAILS -->
                <div class="section-panel" formGroupName="employeeProfile">
                <div class="section-header">
                    <h3>Employment Profile</h3>
                    <p>Official work details and department</p>
                </div>

                <div class="form-grid">
                    <div class="field-group">
                    <label>Employee ID</label>
                    <input pInputText formControlName="employeeId" placeholder="EMP-001" class="full-width" />
                    </div>
                    
                    <div class="field-group">
                    <label>Type</label>
                    <p-select [options]="employmentTypes()" formControlName="employmentType" optionLabel="label" optionValue="value" styleClass="full-width"></p-select>
                    </div>

                    <div class="field-group">
                    <label>Department</label>
                    <p-select [options]="departments()" formControlName="departmentId" optionLabel="name" optionValue="_id" placeholder="Select Dept" styleClass="full-width"></p-select>
                    </div>

                    <div class="field-group">
                    <label>Designation</label>
                    <p-select [options]="designations()" formControlName="designationId" optionLabel="name" optionValue="_id" placeholder="Select Designation" styleClass="full-width"></p-select>
                    </div>

                    <div class="field-group">
                    <label>Reporting Manager</label>
                    <p-select [options]="managers()" formControlName="reportingManagerId" optionLabel="name" optionValue="_id" placeholder="Select Manager" [showClear]="true" styleClass="full-width"></p-select>
                    </div>

                    <div class="field-group">
                    <label>Work Location</label>
                    <input pInputText formControlName="workLocation" placeholder="Ex: Surat Main Office" class="full-width" />
                    </div>

                    <div class="field-group">
                    <label>Date of Joining</label>
                    <p-datepicker formControlName="dateOfJoining" [showIcon]="true" styleClass="full-width" appendTo="body"></p-datepicker>
                    </div>

                    <div class="field-group">
                    <label>Date of Birth</label>
                    <p-datepicker formControlName="dateOfBirth" [showIcon]="true" styleClass="full-width" appendTo="body"></p-datepicker>
                    </div>

                    <div class="field-group">
                    <label>Secondary Phone</label>
                    <input pInputText formControlName="secondaryPhone" placeholder="Optional" class="full-width" />
                    </div>
                </div>

                <div class="divider"></div>

                <!-- Nested Sub-Sections -->
                <div class="split-grid">
                    <!-- Bank Info -->
                    <div formGroupName="bankDetails" class="sub-panel">
                    <h4 class="sub-header"><i class="pi pi-wallet"></i> Bank & Statutory</h4>
                    <div class="form-grid-compact">
                        <div class="field-group">
                        <label>Bank Name</label>
                        <input pInputText formControlName="bankName" class="full-width" />
                        </div>
                        <div class="field-group">
                        <label>Account No.</label>
                        <input pInputText formControlName="accountNumber" type="password" class="full-width" />
                        </div>
                        <div class="field-group">
                        <label>IFSC Code</label>
                        <input pInputText formControlName="ifscCode" class="uppercase full-width" />
                        </div>
                        <div class="field-group">
                        <label>PAN Card</label>
                        <input pInputText formControlName="panCard" class="uppercase full-width" />
                        </div>
                    </div>
                    </div>

                    <!-- Guarantor Info -->
                    <div class="sub-panel">
                    <div formGroupName="guarantorDetails">
                        <h4 class="sub-header"><i class="pi pi-shield"></i> Emergency Contact</h4>
                        <div class="form-grid-compact">
                        <div class="field-group">
                            <label>Name</label>
                            <input pInputText formControlName="name" class="full-width" />
                        </div>
                        <div class="field-group">
                            <label>Relationship</label>
                            <input pInputText formControlName="relationship" placeholder="Father, Spouse..." class="full-width" />
                        </div>
                        <div class="field-group">
                            <label>Phone</label>
                            <input pInputText formControlName="phone" class="full-width" />
                        </div>
                        </div>
                    </div>
                    <!-- UPI ID is outside guarantor group -->
                    <div class="field-group mt-4">
                        <label>UPI ID (Reimbursement)</label>
                        <input pInputText [formControl]="$any(userForm.get('upiId'))" placeholder="user@upi" class="full-width" />
                    </div>
                    </div>
                </div>
                </div>

                <!-- 3. ATTENDANCE CONFIGURATION -->
                <div class="section-panel" formGroupName="attendanceConfig">
                <div class="section-header-row">
                    <div>
                    <h3>Attendance Settings</h3>
                    <p>Shift rules and punch permissions</p>
                    </div>
                    <div class="toggle-wrapper">
                    <span class="toggle-label">Enable Attendance</span>
                    <p-toggleswitch formControlName="isAttendanceEnabled"></p-toggleswitch>
                    </div>
                </div>

                <div *ngIf="userForm.get('attendanceConfig.isAttendanceEnabled')?.value" class="animate-content mt-6">
                    <div class="form-grid mb-6">
                    <div class="field-group">
                        <label>Assigned Shift <span class="req">*</span></label>
                        <p-select [options]="shifts()" formControlName="shiftId" optionLabel="name" optionValue="_id" placeholder="Select Shift" styleClass="full-width"></p-select>
                    </div>
                    <div class="field-group">
                        <label>Biometric ID</label>
                        <input pInputText formControlName="machineUserId" placeholder="Device ID" class="full-width" />
                    </div>
                    <div class="field-group">
                        <label>GeoFence Zone</label>
                        <p-select [options]="geoFences()" formControlName="geoFenceId" optionLabel="name" optionValue="_id" placeholder="Select Zone" [showClear]="true" styleClass="full-width"></p-select>
                    </div>
                    <div class="field-group">
                        <label>Radius (Meters)</label>
                        <p-inputnumber formControlName="geoFenceRadius" suffix=" m" [min]="10" styleClass="full-width"></p-inputnumber>
                    </div>
                    </div>

                    <!-- Toggle Grid -->
                    <div class="toggle-grid">
                    <div class="control-item">
                        <span class="control-label">Web Punch</span>
                        <p-toggleswitch formControlName="allowWebPunch"></p-toggleswitch>
                    </div>
                    <div class="control-item">
                        <span class="control-label">Mobile App Punch</span>
                        <p-toggleswitch formControlName="allowMobilePunch"></p-toggleswitch>
                    </div>
                    <div class="control-item">
                        <span class="control-label">Enforce GeoFence</span>
                        <p-toggleswitch formControlName="enforceGeoFence"></p-toggleswitch>
                    </div>
                    <div class="control-item">
                        <span class="control-label">Biometric Verified</span>
                        <p-toggleswitch formControlName="biometricVerified"></p-toggleswitch>
                    </div>
                    </div>
                </div>
                </div>

                <!-- 4. SECURITY -->
                <div class="section-panel">
                <div class="section-header-row">
                    <div>
                    <h3>Security</h3>
                    <p>Manage password and credentials</p>
                    </div>
                    <button *ngIf="editMode()" pButton [label]="showPasswordFields() ? 'Cancel' : 'Change Password'" [text]="true" size="small" (click)="togglePasswordChange()"></button>
                </div>

                <div *ngIf="showPasswordFields()" class="form-grid animate-content mt-6">
                    <div class="field-group">
                    <label>New Password <span class="req">*</span></label>
                    <p-password formControlName="password" [toggleMask]="true" styleClass="full-width" inputStyleClass="full-width"></p-password>
                    </div>
                    <div class="field-group">
                    <label>Confirm Password <span class="req">*</span></label>
                    <p-password formControlName="passwordConfirm" [toggleMask]="true" [feedback]="false" styleClass="full-width" inputStyleClass="full-width"></p-password>
                    </div>
                </div>
                </div>
            
            </div> <!-- End Content Container -->
          </div> <!-- End Body -->

        </form>
    </div>
  `,
  styles: [`
    :host { 
        /* --- 4. COMPONENT LAYOUT --- */
        display: block; 
        height: 100vh; 
        width: 100%; 
        overflow: hidden;
        background: var(--bg-secondary);
    }
    
    .app-layout {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .form-structure {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
    }

    /* --- HEADER --- */
    .form-header {
        flex-shrink: 0;
        height: 72px;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border-primary);
        padding: 0 var(--spacing-3xl);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .header-content { display: flex; flex-direction: column; }
    
    .title-section { display: flex; align-items: center; gap: var(--spacing-md); }
    
    .page-title { 
        font-family: var(--font-heading);
        font-size: var(--font-size-2xl);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .page-subtitle {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin: 0;
    }

    .meta-badges { display: flex; gap: var(--spacing-sm); align-items: center; }

    .id-badge {
        font-family: monospace;
        background: var(--bg-ternary);
        padding: 2px 6px;
        border-radius: var(--ui-border-radius);
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
    }

    .status-badge {
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 99px;
    }
    /* Status Colors */
    .status-badge.approved { background: #dcfce7; color: #166534; }
    .status-badge.pending { background: #fef9c3; color: #854d0e; }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }

    /* --- BODY --- */
    .form-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-3xl);
        background: var(--bg-secondary);
    }

    .content-container {
        max-width: 1200px; /* Readable line length on ultra-wide */
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-2xl);
        padding-bottom: var(--spacing-4xl);
    }

    /* --- PANELS --- */
    .section-panel {
        background: var(--bg-primary);
        border: 1px solid var(--border-primary);
        border-radius: var(--ui-border-radius-lg);
        padding: var(--spacing-2xl);
        box-shadow: var(--shadow-sm);
    }

    .section-header { margin-bottom: var(--spacing-xl); }
    .section-header-row { display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-xl); }

    .section-panel h3 {
        font-family: var(--font-heading);
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }
    
    .section-panel p {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin: var(--spacing-xs) 0 0 0;
    }

    /* --- FORM CONTROLS --- */
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--spacing-xl);
        align-items: start;
    }

    .field-group { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    
    label {
        font-size: var(--font-size-sm);
        font-weight: 500;
        color: var(--theme-text-label);
    }
    .req { color: var(--color-error); }

    .full-width { width: 100%; }
    .uppercase { text-transform: uppercase; }

    /* --- SUB PANELS (Bank/Guarantor) --- */
    .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-xl); }
    @media (max-width: 900px) { .split-grid { grid-template-columns: 1fr; } }

    .sub-panel {
        background: var(--bg-ternary);
        padding: var(--spacing-xl);
        border-radius: var(--ui-border-radius);
        border: 1px solid var(--border-secondary);
    }

    .sub-header {
        font-size: var(--font-size-md);
        font-weight: 600;
        color: var(--text-secondary);
        margin: 0 0 var(--spacing-lg) 0;
        display: flex; align-items: center; gap: var(--spacing-md);
    }

    .form-grid-compact {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-lg);
    }

    .divider {
        height: 1px;
        background: var(--border-secondary);
        margin: var(--spacing-2xl) 0;
    }

    /* --- TOGGLES & INTERACTION --- */
    .toggle-wrapper { display: flex; align-items: center; gap: var(--spacing-md); }
    .toggle-label { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); }

    .toggle-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: var(--spacing-lg);
    }

    .control-item {
        background: var(--bg-primary);
        border: 1px solid var(--border-primary);
        border-radius: var(--ui-border-radius);
        padding: var(--spacing-md) var(--spacing-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: var(--transition-base);
    }
    
    .control-item:hover { border-color: var(--accent-primary); }

    .control-item.highlight {
        background: var(--theme-accent-secondary);
        border-color: var(--theme-accent-secondary);
        margin-top: 24px; /* Align with grid if strictly needed */
    }

    .control-info { display: flex; flex-direction: column; }
    .control-label { font-size: var(--font-size-md); font-weight: 600; color: var(--text-primary); }
    .control-sub { font-size: var(--font-size-xs); color: var(--text-secondary); }

    /* --- ANIMATION --- */
    .animate-content { animation: fadeIn var(--transition-base) forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

    /* --- SCROLLBAR --- */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-secondary); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
  `]
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  public masterList = inject(MasterListService);

  // State
  userForm!: FormGroup;
  userId: string | null = null;
  isSubmitting = signal(false);
  editMode = signal(false);
  showPasswordFields = signal(false);

  // Data Signals
  shifts = signal<{_id: string, name: string}[]>([]);
  roles = this.masterList.roles; 
  branches = this.masterList.branches;

  // Mock Data (Replace with your actual API/MasterList)
  departments = signal([{ _id: 'dept_01', name: 'Engineering' }, { _id: 'dept_02', name: 'Human Resources' }, { _id: 'dept_03', name: 'Sales' }]);
  designations = signal([{ _id: 'desig_01', name: 'Senior Developer' }, { _id: 'desig_02', name: 'Project Manager' }]);
  managers = signal([{ _id: 'user_99', name: 'Alex Supervisor' }]);
  geoFences = signal([{ _id: 'geo_01', name: 'Headquarters Zone' }, { _id: 'geo_02', name: 'Factory Site B' }]);

  userStatuses = signal([
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ]);

  employmentTypes = signal([
    { value: 'permanent', label: 'Permanent' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
    { value: 'consultant', label: 'Consultant' }
  ]);

  ngOnInit() {
    this.initForm();
    this.loadShifts();
    
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.editMode.set(true);
      this.loadUserData(this.userId);
    } else {
      this.setupCreateMode();
    }
  }

  private initForm() {
    this.userForm = this.fb.group({
      // Identity
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      upiId: [''],

      // Access
      role: [null, [Validators.required]],
      branchId: [null],
      status: ['approved'],
      isActive: [true], // Default for toggle
      password: [''],
      passwordConfirm: [''],

      // Employee Profile
      employeeProfile: this.fb.group({
        employeeId: [''],
        departmentId: [null],
        designationId: [null],
        reportingManagerId: [null],
        employmentType: ['permanent'],
        workLocation: [''],
        dateOfJoining: [null],
        dateOfBirth: [null],
        secondaryPhone: [''], 
        bankDetails: this.fb.group({
           accountName: [''],
           accountNumber: [''],
           ifscCode: [''],
           bankName: [''],
           panCard: [''],
           uanNumber: ['']
        }),
        guarantorDetails: this.fb.group({
           name: [''],
           relationship: [''],
           phone: ['']
        })
      }),

      // Attendance
      attendanceConfig: this.fb.group({
        isAttendanceEnabled: [true],
        shiftId: [null],
        machineUserId: [''],
        allowWebPunch: [false],
        allowMobilePunch: [true],
        enforceGeoFence: [false],
        geoFenceId: [null],
        geoFenceRadius: [100],
        biometricVerified: [false]
      })
    }, { validators: this.passwordMatchValidator });

    // React to Attendance Toggle
    const attConfig = this.userForm.get('attendanceConfig') as FormGroup;
    attConfig.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
       const shiftCtrl = attConfig.get('shiftId');
       if (enabled) {
         shiftCtrl?.setValidators(Validators.required);
       } else {
         shiftCtrl?.clearValidators();
         shiftCtrl?.setValue(null);
       }
       shiftCtrl?.updateValueAndValidity();
    });
  }

  private loadShifts() {
    // Replace with actual service call
    // this.shiftService.getAllShifts().subscribe({
    //   next: (res: any) => this.shifts.set(res.data || []),
    //   error: () => console.warn('Failed to load shifts, using fallback')
    // });
  }

  private setupCreateMode() {
    this.showPasswordFields.set(true);
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('passwordConfirm')?.value;
    if (!password && !confirm) return null;
    return password === confirm ? null : { mismatch: true };
  }

  togglePasswordChange() {
    this.showPasswordFields.update(v => !v);
    const pass = this.userForm.get('password');
    const conf = this.userForm.get('passwordConfirm');
    
    if (this.showPasswordFields()) {
      pass?.setValidators([Validators.required, Validators.minLength(6)]);
      conf?.setValidators([Validators.required]);
    } else {
      pass?.clearValidators(); pass?.setValue('');
      conf?.clearValidators(); conf?.setValue('');
    }
    pass?.updateValueAndValidity();
    conf?.updateValueAndValidity();
  }

  private loadUserData(id: string) {
    this.loadingService.show();
    this.userService.getUser(id).pipe(finalize(() => this.loadingService.hide())).subscribe({
      next: (res: any) => {
        // Handle various API response structures
        const user = res.data?.data || res.data?.user || res.data;
        if (!user) return;

        // Date conversions
        const safeDate = (d: any) => d ? new Date(d) : null;
        if(user.employeeProfile) {
            user.employeeProfile.dateOfJoining = safeDate(user.employeeProfile.dateOfJoining);
            user.employeeProfile.dateOfBirth = safeDate(user.employeeProfile.dateOfBirth);
        }

        // Helper to extract ID if object is populated
        const extract = (val: any) => (val && typeof val === 'object' && val._id) ? val._id : val;

        this.userForm.patchValue({
          ...user,
          role: extract(user.role),
          branchId: extract(user.branchId),
          employeeProfile: {
             ...user.employeeProfile,
             departmentId: extract(user.employeeProfile?.departmentId),
             designationId: extract(user.employeeProfile?.designationId),
             reportingManagerId: extract(user.employeeProfile?.reportingManagerId),
             // Fallbacks for nested objects
             bankDetails: user.employeeProfile?.bankDetails || {},
             guarantorDetails: user.employeeProfile?.guarantorDetails || {}
          },
          attendanceConfig: {
             ...user.attendanceConfig,
             shiftId: extract(user.attendanceConfig?.shiftId),
             geoFenceId: extract(user.attendanceConfig?.geoFenceId)
          }
        });
      },
      error: () => {
        this.messageService.showError('Error', 'User not found.');
        this.onCancel();
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.userForm.getRawValue();

    // Remove password fields if not changing them in edit mode
    if (this.editMode() && !this.showPasswordFields()) {
       delete formValue.password;
       delete formValue.passwordConfirm;
    }

    const req$ = this.editMode() 
      ? this.userService.updateUser(this.userId!, formValue)
      : this.userService.createUser(formValue);

    req$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
        setTimeout(() => this.onCancel(), 500);
      },
      error: (err) => {
        this.messageService.showError('Failed', err.error?.message || 'Operation failed');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/user/list']);
  }
}
// import { Component, OnInit, inject, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { finalize } from 'rxjs';

// // PrimeNG Modules (v18 Compatible)
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { PasswordModule } from 'primeng/password';
// import { ToastModule } from 'primeng/toast';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { DatePickerModule } from 'primeng/datepicker';
// import { PanelModule } from 'primeng/panel';
// import { DividerModule } from 'primeng/divider';
// import { TabsModule } from 'primeng/tabs';
// import { CardModule } from 'primeng/card';

// // Mock Services (Replace with your actual imports)
// import { MasterListService } from '../../../core/services/master-list.service';
// import { UserManagementService } from '../user-management.service';
// import { ShiftService } from '../../attendance/services/shift.service';
// import { AppMessageService } from '../../../core/services/message.service';
// import { LoadingService } from '../../../core/services/loading.service';

// @Component({
//   selector: 'app-user-form',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule, 
//     FormsModule, 
//     RouterModule,
//     InputTextModule, 
//     ButtonModule, 
//     SelectModule, 
//     PasswordModule, 
//     ToastModule, 
//     ToggleSwitchModule, 
//     InputNumberModule, 
//     DatePickerModule, 
//     PanelModule,
//     DividerModule, 
//     TabsModule,
//     CardModule
//   ],
//   template: `
//     <p-toast></p-toast>
    
//     <div class="page-wrapper">
//       <div class="form-container animate-fadeIn">
        
//         <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="form-layout">
          
//           <!-- HEADER -->
//           <div class="form-header">
//             <div class="header-left">
//               <div class="title-group">
//                 <h1 class="page-title">{{ editMode() ? 'Edit Employee' : 'New Employee' }}</h1>
//                 <span class="id-badge" *ngIf="userId">{{ userId }}</span>
//               </div>
//               <p class="page-subtitle">
//                 {{ editMode() ? 'Update user details and access rights.' : 'Create a new employee record in the system.' }}
//               </p>
//             </div>

//             <div class="header-right">
//               <div class="status-indicator" [ngClass]="userForm.get('status')?.value">
//                 <i class="pi" [ngClass]="getStatusIcon(userForm.get('status')?.value)"></i>
//                 <span>{{ userForm.get('status')?.value | titlecase }}</span>
//               </div>
//             </div>
//           </div>

//           <!-- BODY -->
//           <div class="form-body custom-scrollbar">
            
//             <!-- 1. IDENTITY & ACCESS -->
//             <div class="section-card">
//               <div class="section-header">
//                 <h3>Identity & Access</h3>
//                 <p>Basic login details and system role</p>
//               </div>
              
//               <div class="form-grid">
//                 <div class="field-group">
//                   <label>Full Name <span class="text-red-500">*</span></label>
//                   <input pInputText formControlName="name" placeholder="Ex: John Doe" class="w-full" />
//                 </div>
                
//                 <div class="field-group">
//                   <label>Email Address <span class="text-red-500">*</span></label>
//                   <input pInputText formControlName="email" placeholder="john@company.com" class="w-full" />
//                 </div>

//                 <div class="field-group">
//                   <label>Primary Phone <span class="text-red-500">*</span></label>
//                   <input pInputText formControlName="phone" placeholder="+91 98765 43210" class="w-full" />
//                 </div>

//                 <div class="field-group">
//                   <label>Role <span class="text-red-500">*</span></label>
//                   <p-select [options]="roles()" formControlName="role" optionLabel="name" optionValue="_id" placeholder="Select Role" styleClass="w-full"></p-select>
//                 </div>

//                 <div class="field-group">
//                   <label>Branch</label>
//                   <p-select [options]="branches()" formControlName="branchId" optionLabel="name" optionValue="_id" placeholder="Global / HQ" [showClear]="true" styleClass="w-full"></p-select>
//                 </div>

//                 <div class="field-group">
//                   <label>Account Status</label>
//                   <p-select [options]="userStatuses()" formControlName="status" optionLabel="label" optionValue="value" styleClass="w-full"></p-select>
//                 </div>

//                 <!-- Highlighted Toggle for Login Access -->
//                 <div class="control-item highlight">
//                   <div class="control-info">
//                     <span class="control-label">Login Access</span>
//                     <span class="control-sub">Enable or disable system access</span>
//                   </div>
//                   <p-toggleswitch formControlName="isActive"></p-toggleswitch>
//                 </div>
//               </div>
//             </div>

//             <!-- 2. EMPLOYMENT DETAILS -->
//             <div class="section-card" formGroupName="employeeProfile">
//               <div class="section-header">
//                 <h3>Employment Profile</h3>
//                 <p>Official work details and department</p>
//               </div>

//               <div class="form-grid">
//                 <div class="field-group">
//                   <label>Employee ID</label>
//                   <input pInputText formControlName="employeeId" placeholder="EMP-001" class="w-full" />
//                 </div>
                
//                 <div class="field-group">
//                   <label>Type</label>
//                   <p-select [options]="employmentTypes()" formControlName="employmentType" optionLabel="label" optionValue="value" styleClass="w-full"></p-select>
//                 </div>

//                 <div class="field-group">
//                   <label>Department</label>
//                   <p-select [options]="departments()" formControlName="departmentId" optionLabel="name" optionValue="_id" placeholder="Select Dept" styleClass="w-full"></p-select>
//                 </div>

//                 <div class="field-group">
//                   <label>Designation</label>
//                   <p-select [options]="designations()" formControlName="designationId" optionLabel="name" optionValue="_id" placeholder="Select Designation" styleClass="w-full"></p-select>
//                 </div>

//                 <div class="field-group">
//                   <label>Reporting Manager</label>
//                   <p-select [options]="managers()" formControlName="reportingManagerId" optionLabel="name" optionValue="_id" placeholder="Select Manager" [showClear]="true" styleClass="w-full"></p-select>
//                 </div>

//                 <div class="field-group">
//                   <label>Work Location</label>
//                   <input pInputText formControlName="workLocation" placeholder="Ex: Surat Main Office" class="w-full" />
//                 </div>

//                 <div class="field-group">
//                   <label>Date of Joining</label>
//                   <p-datepicker formControlName="dateOfJoining" [showIcon]="true" styleClass="w-full" appendTo="body"></p-datepicker>
//                 </div>

//                 <div class="field-group">
//                   <label>Date of Birth</label>
//                   <p-datepicker formControlName="dateOfBirth" [showIcon]="true" styleClass="w-full" appendTo="body"></p-datepicker>
//                 </div>

//                 <div class="field-group">
//                   <label>Secondary Phone</label>
//                   <input pInputText formControlName="secondaryPhone" placeholder="Optional" class="w-full" />
//                 </div>
//               </div>

//               <p-divider></p-divider>

//               <!-- Nested Sub-Sections -->
//               <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <!-- Bank Info -->
//                 <div formGroupName="bankDetails" class="sub-panel">
//                   <h4 class="sub-header"><i class="pi pi-wallet"></i> Bank & Statutory</h4>
//                   <div class="form-grid-compact">
//                     <div class="field-group">
//                       <label>Bank Name</label>
//                       <input pInputText formControlName="bankName" class="w-full" />
//                     </div>
//                     <div class="field-group">
//                       <label>Account No.</label>
//                       <input pInputText formControlName="accountNumber" type="password" class="w-full" />
//                     </div>
//                     <div class="field-group">
//                       <label>IFSC Code</label>
//                       <input pInputText formControlName="ifscCode" class="uppercase w-full" />
//                     </div>
//                     <div class="field-group">
//                       <label>PAN Card</label>
//                       <input pInputText formControlName="panCard" class="uppercase w-full" />
//                     </div>
//                   </div>
//                 </div>

//                 <!-- Guarantor Info -->
//                 <div class="sub-panel">
//                   <div formGroupName="guarantorDetails">
//                     <h4 class="sub-header"><i class="pi pi-shield"></i> Emergency Contact</h4>
//                     <div class="form-grid-compact">
//                       <div class="field-group">
//                         <label>Name</label>
//                         <input pInputText formControlName="name" class="w-full" />
//                       </div>
//                       <div class="field-group">
//                         <label>Relationship</label>
//                         <input pInputText formControlName="relationship" placeholder="Father, Spouse..." class="w-full" />
//                       </div>
//                       <div class="field-group">
//                         <label>Phone</label>
//                         <input pInputText formControlName="phone" class="w-full" />
//                       </div>
//                     </div>
//                   </div>
//                   <!-- UPI ID is outside guarantor group -->
//                   <div class="mt-4 pt-4 border-t border-gray-100">
//                      <label class="text-xs font-semibold text-gray-500 mb-1 block">UPI ID (Reimbursement)</label>
//                      <input pInputText [formControl]="$any(userForm.get('upiId'))" placeholder="user@upi" class="w-full" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <!-- 3. ATTENDANCE CONFIGURATION -->
//             <div class="section-card" formGroupName="attendanceConfig">
//                <div class="section-header flex justify-between items-center">
//                 <div>
//                   <h3>Attendance Settings</h3>
//                   <p>Shift rules and punch permissions</p>
//                 </div>
//                 <div class="flex items-center gap-2">
//                    <span class="text-sm font-medium text-gray-600">Enable Attendance</span>
//                    <p-toggleswitch formControlName="isAttendanceEnabled"></p-toggleswitch>
//                 </div>
//               </div>

//               <div *ngIf="userForm.get('attendanceConfig.isAttendanceEnabled')?.value" class="animate-fadeIn mt-4">
//                 <div class="form-grid mb-6">
//                   <div class="field-group">
//                     <label>Assigned Shift <span class="text-red-500">*</span></label>
//                     <p-select [options]="shifts()" formControlName="shiftId" optionLabel="name" optionValue="_id" placeholder="Select Shift" styleClass="w-full"></p-select>
//                   </div>
//                   <div class="field-group">
//                     <label>Biometric ID</label>
//                     <input pInputText formControlName="machineUserId" placeholder="Device ID" class="w-full" />
//                   </div>
//                   <div class="field-group">
//                     <label>GeoFence Zone</label>
//                     <p-select [options]="geoFences()" formControlName="geoFenceId" optionLabel="name" optionValue="_id" placeholder="Select Zone" [showClear]="true" styleClass="w-full"></p-select>
//                   </div>
//                   <div class="field-group">
//                     <label>Radius (Meters)</label>
//                     <p-inputnumber formControlName="geoFenceRadius" suffix=" m" [min]="10" styleClass="w-full"></p-inputnumber>
//                   </div>
//                 </div>

//                 <!-- Toggle Grid -->
//                 <div class="toggle-grid">
//                   <div class="control-item">
//                     <span class="control-label">Web Punch</span>
//                     <p-toggleswitch formControlName="allowWebPunch"></p-toggleswitch>
//                   </div>
//                   <div class="control-item">
//                     <span class="control-label">Mobile App Punch</span>
//                     <p-toggleswitch formControlName="allowMobilePunch"></p-toggleswitch>
//                   </div>
//                   <div class="control-item">
//                     <span class="control-label">Enforce GeoFence</span>
//                     <p-toggleswitch formControlName="enforceGeoFence"></p-toggleswitch>
//                   </div>
//                   <div class="control-item">
//                     <span class="control-label">Biometric Verified</span>
//                     <p-toggleswitch formControlName="biometricVerified"></p-toggleswitch>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <!-- 4. SECURITY -->
//             <div class="section-card">
//               <div class="section-header flex justify-between">
//                 <div>
//                   <h3>Security</h3>
//                   <p>Manage password and credentials</p>
//                 </div>
//                 <button *ngIf="editMode()" pButton [label]="showPasswordFields() ? 'Cancel' : 'Change Password'" [text]="true" size="small" (click)="togglePasswordChange()"></button>
//               </div>

//               <div *ngIf="showPasswordFields()" class="form-grid animate-fadeIn mt-4">
//                 <div class="field-group">
//                   <label>New Password <span class="text-red-500">*</span></label>
//                   <p-password formControlName="password" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
//                 </div>
//                 <div class="field-group">
//                   <label>Confirm Password <span class="text-red-500">*</span></label>
//                   <p-password formControlName="passwordConfirm" [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full"></p-password>
//                 </div>
//               </div>
//             </div>

//           </div>

//           <!-- FOOTER -->
//           <div class="form-footer">
//             <button pButton label="Cancel" class="p-button-secondary p-button-outlined" type="button" (click)="onCancel()"></button>
//             <button pButton type="submit" [label]="editMode() ? 'Save Changes' : 'Create User'" icon="pi pi-check" [loading]="isSubmitting()"></button>
//           </div>

//         </form>
//       </div>
//     </div>
//   `,
//   styles: [`
//     /* Global Resets */
//     :host { display: block; height: 100%; width: 100%; font-family: 'Inter', sans-serif; }
    
//     /* Layout Containers */
//     .page-wrapper {
//       background-color: #f8f9fa;
//       height: 100%;
//       width: 100%;
//       padding: 1.5rem;
//       display: flex;
//       justify-content: center;
//     }
    
//     .form-container {
//       width: 100%;
//       max-width: 1000px;
//       height: 100%;
//       background: #fff;
//       border-radius: 12px;
//       box-shadow: 0 4px 20px rgba(0,0,0,0.05);
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//       border: 1px solid #eaecf0;
//     }
    
//     .form-layout { display: flex; flex-direction: column; height: 100%; }
    
//     /* Header */
//     .form-header {
//       padding: 1.5rem 2rem;
//       border-bottom: 1px solid #eaecf0;
//       background: #fff;
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       flex-shrink: 0;
//     }
    
//     .page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #101828; letter-spacing: -0.5px; }
//     .page-subtitle { margin: 0.25rem 0 0; font-size: 0.875rem; color: #667085; }
    
//     .title-group { display: flex; align-items: center; gap: 1rem; }
//     .id-badge { 
//       background: #f2f4f7; color: #344054; font-size: 0.75rem; 
//       padding: 2px 8px; border-radius: 6px; font-weight: 600; font-family: monospace;
//     }
    
//     /* Status Indicator */
//     .status-indicator {
//       display: flex; align-items: center; gap: 0.5rem;
//       padding: 0.5rem 1rem; border-radius: 99px;
//       font-size: 0.875rem; font-weight: 600;
//       background: #f2f4f7; color: #344054;
//     }
//     .status-indicator.approved { background: #ecfdf3; color: #027a48; }
//     .status-indicator.pending { background: #fffaeb; color: #b54708; }
//     .status-indicator.inactive { background: #fef3f2; color: #b42318; }
    
//     /* Body & Sections */
//     .form-body {
//       flex: 1;
//       overflow-y: auto;
//       padding: 2rem;
//       background: #fcfcfd;
//       display: flex; flex-direction: column; gap: 1.5rem;
//     }
    
//     .section-card {
//       background: #fff;
//       border: 1px solid #eaecf0;
//       border-radius: 8px;
//       padding: 1.5rem;
//       box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
//     }
    
//     .section-header h3 { font-size: 1.125rem; font-weight: 600; color: #101828; margin: 0; }
//     .section-header p { font-size: 0.875rem; color: #667085; margin: 0.25rem 0 0; }
    
//     /* Forms & Grids */
//     .form-grid {
//       display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;
//       margin-top: 1.5rem;
//     }
//     .form-grid-compact { display: grid; gap: 1rem; margin-top: 1rem; }
    
//     .field-group { display: flex; flex-direction: column; gap: 0.375rem; }
//     .field-group label { font-size: 0.875rem; font-weight: 500; color: #344054; }
    
//     /* Sub-panels */
//     .sub-panel { background: #f9fafb; border-radius: 8px; padding: 1.25rem; border: 1px solid #eaecf0; }
//     .sub-header { font-size: 0.95rem; font-weight: 600; color: #475467; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; }

//     /* Custom Toggle Controls */
//     .control-item {
//       display: flex; align-items: center; justify-content: space-between;
//       padding: 0.75rem 1rem;
//       background: #fff;
//       border: 1px solid #d0d5dd;
//       border-radius: 8px;
//       transition: all 0.2s;
//     }
//     .control-item:hover { border-color: #98a2b3; background: #f9fafb; }
//     .control-item.highlight { border-color: #d1e9ff; background: #eff8ff; margin-top: 25px; }
    
//     .toggle-grid {
//       display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;
//     }

//     /* Footer */
//     .form-footer {
//       padding: 1.5rem 2rem;
//       border-top: 1px solid #eaecf0;
//       background: #fff;
//       display: flex; justify-content: flex-end; gap: 1rem;
//       flex-shrink: 0;
//     }
    
//     /* Utilities */
//     .uppercase { text-transform: uppercase; }
//     .w-full { width: 100%; }
//     .custom-scrollbar::-webkit-scrollbar { width: 6px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    
//     .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
//     @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
//   `]
// })
// export class UserFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private userService = inject(UserManagementService);
//   private shiftService = inject(ShiftService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);
//   public masterList = inject(MasterListService);

//   // State
//   userForm!: FormGroup;
//   userId: string | null = null;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   showPasswordFields = signal(false);

//   // Data Signals
//   shifts = signal<{_id: string, name: string}[]>([]);
//   roles = this.masterList.roles; 
//   branches = this.masterList.branches;

//   // Mock Data (Replace with your actual API/MasterList)
//   departments = signal([{ _id: 'dept_01', name: 'Engineering' }, { _id: 'dept_02', name: 'Human Resources' }, { _id: 'dept_03', name: 'Sales' }]);
//   designations = signal([{ _id: 'desig_01', name: 'Senior Developer' }, { _id: 'desig_02', name: 'Project Manager' }]);
//   managers = signal([{ _id: 'user_99', name: 'Alex Supervisor' }]);
//   geoFences = signal([{ _id: 'geo_01', name: 'Headquarters Zone' }, { _id: 'geo_02', name: 'Factory Site B' }]);

//   userStatuses = signal([
//     { value: 'pending', label: 'Pending' },
//     { value: 'approved', label: 'Approved' },
//     { value: 'rejected', label: 'Rejected' },
//     { value: 'inactive', label: 'Inactive' },
//     { value: 'suspended', label: 'Suspended' }
//   ]);

//   employmentTypes = signal([
//     { value: 'permanent', label: 'Permanent' },
//     { value: 'contract', label: 'Contract' },
//     { value: 'intern', label: 'Intern' },
//     { value: 'consultant', label: 'Consultant' }
//   ]);

//   ngOnInit() {
//     this.initForm();
//     this.loadShifts();
    
//     this.userId = this.route.snapshot.paramMap.get('id');
//     if (this.userId) {
//       this.editMode.set(true);
//       this.loadUserData(this.userId);
//     } else {
//       this.setupCreateMode();
//     }
//   }

//   private initForm() {
//     this.userForm = this.fb.group({
//       // Identity
//       name: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: ['', [Validators.required]],
//       upiId: [''],

//       // Access
//       role: [null, [Validators.required]],
//       branchId: [null],
//       status: ['approved'],
//       isActive: [true], // Default for toggle
//       password: [''],
//       passwordConfirm: [''],

//       // Employee Profile
//       employeeProfile: this.fb.group({
//         employeeId: [''],
//         departmentId: [null],
//         designationId: [null],
//         reportingManagerId: [null],
//         employmentType: ['permanent'],
//         workLocation: [''],
//         dateOfJoining: [null],
//         dateOfBirth: [null],
//         secondaryPhone: [''], 
//         bankDetails: this.fb.group({
//            accountName: [''],
//            accountNumber: [''],
//            ifscCode: [''],
//            bankName: [''],
//            panCard: [''],
//            uanNumber: ['']
//         }),
//         guarantorDetails: this.fb.group({
//            name: [''],
//            relationship: [''],
//            phone: ['']
//         })
//       }),

//       // Attendance
//       attendanceConfig: this.fb.group({
//         isAttendanceEnabled: [true],
//         shiftId: [null],
//         machineUserId: [''],
//         allowWebPunch: [false],
//         allowMobilePunch: [true],
//         enforceGeoFence: [false],
//         geoFenceId: [null],
//         geoFenceRadius: [100],
//         biometricVerified: [false]
//       })
//     }, { validators: this.passwordMatchValidator });

//     // React to Attendance Toggle
//     const attConfig = this.userForm.get('attendanceConfig') as FormGroup;
//     attConfig.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
//        const shiftCtrl = attConfig.get('shiftId');
//        if (enabled) {
//          shiftCtrl?.setValidators(Validators.required);
//        } else {
//          shiftCtrl?.clearValidators();
//          shiftCtrl?.setValue(null);
//        }
//        shiftCtrl?.updateValueAndValidity();
//     });
//   }

//   private loadShifts() {
//     // Replace with actual service call
//     this.shiftService.getAllShifts().subscribe({
//       next: (res: any) => this.shifts.set(res.data || []),
//       error: () => console.warn('Failed to load shifts, using fallback')
//     });
//   }

//   private setupCreateMode() {
//     this.showPasswordFields.set(true);
//     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
//     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
//   }

//   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
//     const password = control.get('password')?.value;
//     const confirm = control.get('passwordConfirm')?.value;
//     if (!password && !confirm) return null;
//     return password === confirm ? null : { mismatch: true };
//   }

//   togglePasswordChange() {
//     this.showPasswordFields.update(v => !v);
//     const pass = this.userForm.get('password');
//     const conf = this.userForm.get('passwordConfirm');
    
//     if (this.showPasswordFields()) {
//       pass?.setValidators([Validators.required, Validators.minLength(6)]);
//       conf?.setValidators([Validators.required]);
//     } else {
//       pass?.clearValidators(); pass?.setValue('');
//       conf?.clearValidators(); conf?.setValue('');
//     }
//     pass?.updateValueAndValidity();
//     conf?.updateValueAndValidity();
//   }

//   private loadUserData(id: string) {
//     this.loadingService.show();
//     this.userService.getUser(id).pipe(finalize(() => this.loadingService.hide())).subscribe({
//       next: (res: any) => {
//         // Handle various API response structures
//         const user = res.data?.data || res.data?.user || res.data;
//         if (!user) return;

//         // Date conversions
//         const safeDate = (d: any) => d ? new Date(d) : null;
//         if(user.employeeProfile) {
//             user.employeeProfile.dateOfJoining = safeDate(user.employeeProfile.dateOfJoining);
//             user.employeeProfile.dateOfBirth = safeDate(user.employeeProfile.dateOfBirth);
//         }

//         // Helper to extract ID if object is populated
//         const extract = (val: any) => (val && typeof val === 'object' && val._id) ? val._id : val;

//         this.userForm.patchValue({
//           ...user,
//           role: extract(user.role),
//           branchId: extract(user.branchId),
//           employeeProfile: {
//              ...user.employeeProfile,
//              departmentId: extract(user.employeeProfile?.departmentId),
//              designationId: extract(user.employeeProfile?.designationId),
//              reportingManagerId: extract(user.employeeProfile?.reportingManagerId),
//              // Fallbacks for nested objects
//              bankDetails: user.employeeProfile?.bankDetails || {},
//              guarantorDetails: user.employeeProfile?.guarantorDetails || {}
//           },
//           attendanceConfig: {
//              ...user.attendanceConfig,
//              shiftId: extract(user.attendanceConfig?.shiftId),
//              geoFenceId: extract(user.attendanceConfig?.geoFenceId)
//           }
//         });
//       },
//       error: () => {
//         this.messageService.showError('Error', 'User not found.');
//         this.onCancel();
//       }
//     });
//   }

//   onSubmit() {
//     if (this.userForm.invalid) {
//       this.userForm.markAllAsTouched();
//       this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = this.userForm.getRawValue();

//     // Remove password fields if not changing them in edit mode
//     if (this.editMode() && !this.showPasswordFields()) {
//        delete formValue.password;
//        delete formValue.passwordConfirm;
//     }

//     const req$ = this.editMode() 
//       ? this.userService.updateUser(this.userId!, formValue)
//       : this.userService.createUser(formValue);

//     req$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         setTimeout(() => this.onCancel(), 500);
//       },
//       error: (err) => {
//         this.messageService.showError('Failed', err.error?.message || 'Operation failed');
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/user/list']);
//   }

//   getStatusIcon(status: string): string {
//     switch(status) {
//       case 'approved': return 'pi-check-circle';
//       case 'pending': return 'pi-clock';
//       case 'rejected': return 'pi-times-circle';
//       default: return 'pi-minus-circle';
//     }
//   }
// }

























// // import { Component, OnInit, inject, signal, effect } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// // import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// // import { finalize } from 'rxjs';

// // // PrimeNG Modules (v18 Compatible)
// // import { InputTextModule } from 'primeng/inputtext';
// // import { ButtonModule } from 'primeng/button';
// // import { SelectModule } from 'primeng/select';
// // import { PasswordModule } from 'primeng/password';
// // import { ToastModule } from 'primeng/toast';
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { PanelModule } from 'primeng/panel';
// // import { DividerModule } from 'primeng/divider';
// // import { TabsModule } from 'primeng/tabs';
// // import { CardModule } from 'primeng/card';

// // // Mock Services (Replace with your actual imports)
// // import { MasterListService } from '../../../core/services/master-list.service';
// // import { UserManagementService } from '../user-management.service';
// // import { ShiftService } from '../../attendance/services/shift.service';
// // import { AppMessageService } from '../../../core/services/message.service';
// // import { LoadingService } from '../../../core/services/loading.service';

// // @Component({
// //   selector: 'app-user-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule, 
// //     ReactiveFormsModule, 
// //     FormsModule, 
// //     RouterModule,
// //     InputTextModule, 
// //     ButtonModule, 
// //     SelectModule, 
// //     PasswordModule, 
// //     ToastModule, 
// //     ToggleSwitchModule, 
// //     InputNumberModule, 
// //     DatePickerModule, 
// //     PanelModule,
// //     DividerModule, 
// //     TabsModule,
// //     CardModule
// //   ],
// //   template: `
// //     <p-toast></p-toast>
    
// //     <div class="page-wrapper">
// //       <div class="form-container animate-fadeIn">
        
// //         <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="form-layout">
          
// //           <!-- HEADER -->
// //           <div class="form-header">
// //             <div class="header-left">
// //               <div class="title-group">
// //                 <h1 class="page-title">{{ editMode() ? 'Edit Employee' : 'New Employee' }}</h1>
// //                 <span class="id-badge" *ngIf="userId">{{ userId }}</span>
// //               </div>
// //               <p class="page-subtitle">
// //                 {{ editMode() ? 'Update user details and access rights.' : 'Create a new employee record in the system.' }}
// //               </p>
// //             </div>

// //             <div class="header-right">
// //               <div class="status-indicator" [ngClass]="userForm.get('status')?.value">
// //                 <i class="pi" [ngClass]="getStatusIcon(userForm.get('status')?.value)"></i>
// //                 <span>{{ userForm.get('status')?.value | titlecase }}</span>
// //               </div>
// //             </div>
// //           </div>

// //           <!-- BODY -->
// //           <div class="form-body custom-scrollbar">
            
// //             <!-- 1. IDENTITY & ACCESS -->
// //             <div class="section-card">
// //               <div class="section-header">
// //                 <h3>Identity & Access</h3>
// //                 <p>Basic login details and system role</p>
// //               </div>
              
// //               <div class="form-grid">
// //                 <div class="field-group">
// //                   <label>Full Name <span class="text-red-500">*</span></label>
// //                   <input pInputText formControlName="name" placeholder="Ex: John Doe" class="w-full" />
// //                 </div>
                
// //                 <div class="field-group">
// //                   <label>Email Address <span class="text-red-500">*</span></label>
// //                   <input pInputText formControlName="email" placeholder="john@company.com" class="w-full" />
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Primary Phone <span class="text-red-500">*</span></label>
// //                   <input pInputText formControlName="phone" placeholder="+91 98765 43210" class="w-full" />
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Role <span class="text-red-500">*</span></label>
// //                   <p-select [options]="roles()" formControlName="role" optionLabel="name" optionValue="_id" placeholder="Select Role" styleClass="w-full"></p-select>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Branch</label>
// //                   <p-select [options]="branches()" formControlName="branchId" optionLabel="name" optionValue="_id" placeholder="Global / HQ" [showClear]="true" styleClass="w-full"></p-select>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Account Status</label>
// //                   <p-select [options]="userStatuses()" formControlName="status" optionLabel="label" optionValue="value" styleClass="w-full"></p-select>
// //                 </div>

// //                 <!-- Highlighted Toggle for Login Access -->
// //                 <div class="control-item highlight">
// //                   <div class="control-info">
// //                     <span class="control-label">Login Access</span>
// //                     <span class="control-sub">Enable or disable system access</span>
// //                   </div>
// //                   <p-toggleswitch formControlName="isActive"></p-toggleswitch>
// //                 </div>
// //               </div>
// //             </div>

// //             <!-- 2. EMPLOYMENT DETAILS -->
// //             <div class="section-card" formGroupName="employeeProfile">
// //               <div class="section-header">
// //                 <h3>Employment Profile</h3>
// //                 <p>Official work details and department</p>
// //               </div>

// //               <div class="form-grid">
// //                 <div class="field-group">
// //                   <label>Employee ID</label>
// //                   <input pInputText formControlName="employeeId" placeholder="EMP-001" class="w-full" />
// //                 </div>
                
// //                 <div class="field-group">
// //                   <label>Type</label>
// //                   <p-select [options]="employmentTypes()" formControlName="employmentType" optionLabel="label" optionValue="value" styleClass="w-full"></p-select>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Department</label>
// //                   <p-select [options]="departments()" formControlName="departmentId" optionLabel="name" optionValue="_id" placeholder="Select Dept" styleClass="w-full"></p-select>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Designation</label>
// //                   <p-select [options]="designations()" formControlName="designationId" optionLabel="name" optionValue="_id" placeholder="Select Designation" styleClass="w-full"></p-select>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Reporting Manager</label>
// //                   <p-select [options]="managers()" formControlName="reportingManagerId" optionLabel="name" optionValue="_id" placeholder="Select Manager" [showClear]="true" styleClass="w-full"></p-select>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Work Location</label>
// //                   <input pInputText formControlName="workLocation" placeholder="Ex: Surat Main Office" class="w-full" />
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Date of Joining</label>
// //                   <p-datepicker formControlName="dateOfJoining" [showIcon]="true" styleClass="w-full" appendTo="body"></p-datepicker>
// //                 </div>

// //                 <div class="field-group">
// //                   <label>Date of Birth</label>
// //                   <p-datepicker formControlName="dateOfBirth" [showIcon]="true" styleClass="w-full" appendTo="body"></p-datepicker>
// //                 </div>
// //               </div>

// //               <p-divider></p-divider>

// //               <!-- Nested Sub-Sections -->
// //               <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //                 <!-- Bank Info -->
// //                 <div formGroupName="bankDetails" class="sub-panel">
// //                   <h4 class="sub-header"><i class="pi pi-wallet"></i> Bank & Statutory</h4>
// //                   <div class="form-grid-compact">
// //                     <div class="field-group">
// //                       <label>Bank Name</label>
// //                       <input pInputText formControlName="bankName" class="w-full" />
// //                     </div>
// //                     <div class="field-group">
// //                       <label>Account No.</label>
// //                       <input pInputText formControlName="accountNumber" type="password" class="w-full" />
// //                     </div>
// //                     <div class="field-group">
// //                       <label>IFSC Code</label>
// //                       <input pInputText formControlName="ifscCode" class="uppercase w-full" />
// //                     </div>
// //                     <div class="field-group">
// //                       <label>PAN Card</label>
// //                       <input pInputText formControlName="panCard" class="uppercase w-full" />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <!-- Guarantor Info -->
// //                 <div class="sub-panel">
// //                   <div formGroupName="guarantorDetails">
// //                     <h4 class="sub-header"><i class="pi pi-shield"></i> Emergency Contact</h4>
// //                     <div class="form-grid-compact">
// //                       <div class="field-group">
// //                         <label>Name</label>
// //                         <input pInputText formControlName="name" class="w-full" />
// //                       </div>
// //                       <div class="field-group">
// //                         <label>Relationship</label>
// //                         <input pInputText formControlName="relationship" placeholder="Father, Spouse..." class="w-full" />
// //                       </div>
// //                       <div class="field-group">
// //                         <label>Phone</label>
// //                         <input pInputText formControlName="phone" class="w-full" />
// //                       </div>
// //                     </div>
// //                   </div>
// //                   <!-- UPI ID is outside guarantor group -->
// //                   <div class="mt-4 pt-4 border-t border-gray-100">
// //                      <label class="text-xs font-semibold text-gray-500 mb-1 block">UPI ID (Reimbursement)</label>
// //                      <input pInputText [formControl]="$any(userForm.get('upiId'))" placeholder="user@upi" class="w-full" />
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             <!-- 3. ATTENDANCE CONFIGURATION -->
// //             <div class="section-card" formGroupName="attendanceConfig">
// //                <div class="section-header flex justify-between items-center">
// //                 <div>
// //                   <h3>Attendance Settings</h3>
// //                   <p>Shift rules and punch permissions</p>
// //                 </div>
// //                 <div class="flex items-center gap-2">
// //                    <span class="text-sm font-medium text-gray-600">Enable Attendance</span>
// //                    <p-toggleswitch formControlName="isAttendanceEnabled"></p-toggleswitch>
// //                 </div>
// //               </div>

// //               <div *ngIf="userForm.get('attendanceConfig.isAttendanceEnabled')?.value" class="animate-fadeIn mt-4">
// //                 <div class="form-grid mb-6">
// //                   <div class="field-group">
// //                     <label>Assigned Shift <span class="text-red-500">*</span></label>
// //                     <p-select [options]="shifts()" formControlName="shiftId" optionLabel="name" optionValue="_id" placeholder="Select Shift" styleClass="w-full"></p-select>
// //                   </div>
// //                   <div class="field-group">
// //                     <label>Biometric ID</label>
// //                     <input pInputText formControlName="machineUserId" placeholder="Device ID" class="w-full" />
// //                   </div>
// //                   <div class="field-group">
// //                     <label>GeoFence Zone</label>
// //                     <p-select [options]="geoFences()" formControlName="geoFenceId" optionLabel="name" optionValue="_id" placeholder="Select Zone" [showClear]="true" styleClass="w-full"></p-select>
// //                   </div>
// //                   <div class="field-group">
// //                     <label>Radius (Meters)</label>
// //                     <p-inputnumber formControlName="geoFenceRadius" suffix=" m" [min]="10" styleClass="w-full"></p-inputnumber>
// //                   </div>
// //                 </div>

// //                 <!-- Toggle Grid -->
// //                 <div class="toggle-grid">
// //                   <div class="control-item">
// //                     <span class="control-label">Web Punch</span>
// //                     <p-toggleswitch formControlName="allowWebPunch"></p-toggleswitch>
// //                   </div>
// //                   <div class="control-item">
// //                     <span class="control-label">Mobile App Punch</span>
// //                     <p-toggleswitch formControlName="allowMobilePunch"></p-toggleswitch>
// //                   </div>
// //                   <div class="control-item">
// //                     <span class="control-label">Enforce GeoFence</span>
// //                     <p-toggleswitch formControlName="enforceGeoFence"></p-toggleswitch>
// //                   </div>
// //                   <div class="control-item">
// //                     <span class="control-label">Biometric Verified</span>
// //                     <p-toggleswitch formControlName="biometricVerified"></p-toggleswitch>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>

// //             <!-- 4. SECURITY -->
// //             <div class="section-card">
// //               <div class="section-header flex justify-between">
// //                 <div>
// //                   <h3>Security</h3>
// //                   <p>Manage password and credentials</p>
// //                 </div>
// //                 <button *ngIf="editMode()" pButton [label]="showPasswordFields() ? 'Cancel' : 'Change Password'" [text]="true" size="small" (click)="togglePasswordChange()"></button>
// //               </div>

// //               <div *ngIf="showPasswordFields()" class="form-grid animate-fadeIn mt-4">
// //                 <div class="field-group">
// //                   <label>New Password <span class="text-red-500">*</span></label>
// //                   <p-password formControlName="password" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
// //                 </div>
// //                 <div class="field-group">
// //                   <label>Confirm Password <span class="text-red-500">*</span></label>
// //                   <p-password formControlName="passwordConfirm" [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full"></p-password>
// //                 </div>
// //               </div>
// //             </div>

// //           </div>

// //           <!-- FOOTER -->
// //           <div class="form-footer">
// //             <button pButton label="Cancel" class="p-button-secondary p-button-outlined" type="button" (click)="onCancel()"></button>
// //             <button pButton type="submit" [label]="editMode() ? 'Save Changes' : 'Create User'" icon="pi pi-check" [loading]="isSubmitting()"></button>
// //           </div>

// //         </form>
// //       </div>
// //     </div>
// //   `,
// //   styles: [`
// //     /* Global Resets */
// //     :host { display: block; height: 100%; width: 100%; font-family: 'Inter', sans-serif; }
    
// //     /* Layout Containers */
// //     .page-wrapper {
// //       background-color: #f8f9fa;
// //       height: 100%;
// //       width: 100%;
// //       padding: 1.5rem;
// //       display: flex;
// //       justify-content: center;
// //     }
    
// //     .form-container {
// //       width: 100%;
// //       max-width: 1000px;
// //       height: 100%;
// //       background: #fff;
// //       border-radius: 12px;
// //       box-shadow: 0 4px 20px rgba(0,0,0,0.05);
// //       display: flex;
// //       flex-direction: column;
// //       overflow: hidden;
// //       border: 1px solid #eaecf0;
// //     }
    
// //     .form-layout { display: flex; flex-direction: column; height: 100%; }
    
// //     /* Header */
// //     .form-header {
// //       padding: 1.5rem 2rem;
// //       border-bottom: 1px solid #eaecf0;
// //       background: #fff;
// //       display: flex;
// //       justify-content: space-between;
// //       align-items: flex-start;
// //       flex-shrink: 0;
// //     }
    
// //     .page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #101828; letter-spacing: -0.5px; }
// //     .page-subtitle { margin: 0.25rem 0 0; font-size: 0.875rem; color: #667085; }
    
// //     .title-group { display: flex; align-items: center; gap: 1rem; }
// //     .id-badge { 
// //       background: #f2f4f7; color: #344054; font-size: 0.75rem; 
// //       padding: 2px 8px; border-radius: 6px; font-weight: 600; font-family: monospace;
// //     }
    
// //     /* Status Indicator */
// //     .status-indicator {
// //       display: flex; align-items: center; gap: 0.5rem;
// //       padding: 0.5rem 1rem; border-radius: 99px;
// //       font-size: 0.875rem; font-weight: 600;
// //       background: #f2f4f7; color: #344054;
// //     }
// //     .status-indicator.approved { background: #ecfdf3; color: #027a48; }
// //     .status-indicator.pending { background: #fffaeb; color: #b54708; }
// //     .status-indicator.inactive { background: #fef3f2; color: #b42318; }
    
// //     /* Body & Sections */
// //     .form-body {
// //       flex: 1;
// //       overflow-y: auto;
// //       padding: 2rem;
// //       background: #fcfcfd;
// //       display: flex; flex-direction: column; gap: 1.5rem;
// //     }
    
// //     .section-card {
// //       background: #fff;
// //       border: 1px solid #eaecf0;
// //       border-radius: 8px;
// //       padding: 1.5rem;
// //       box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
// //     }
    
// //     .section-header h3 { font-size: 1.125rem; font-weight: 600; color: #101828; margin: 0; }
// //     .section-header p { font-size: 0.875rem; color: #667085; margin: 0.25rem 0 0; }
    
// //     /* Forms & Grids */
// //     .form-grid {
// //       display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;
// //       margin-top: 1.5rem;
// //     }
// //     .form-grid-compact { display: grid; gap: 1rem; margin-top: 1rem; }
    
// //     .field-group { display: flex; flex-direction: column; gap: 0.375rem; }
// //     .field-group label { font-size: 0.875rem; font-weight: 500; color: #344054; }
    
// //     /* Sub-panels */
// //     .sub-panel { background: #f9fafb; border-radius: 8px; padding: 1.25rem; border: 1px solid #eaecf0; }
// //     .sub-header { font-size: 0.95rem; font-weight: 600; color: #475467; margin: 0 0 0.5rem 0; display: flex; align-items: center; gap: 0.5rem; }

// //     /* Custom Toggle Controls */
// //     .control-item {
// //       display: flex; align-items: center; justify-content: space-between;
// //       padding: 0.75rem 1rem;
// //       background: #fff;
// //       border: 1px solid #d0d5dd;
// //       border-radius: 8px;
// //       transition: all 0.2s;
// //     }
// //     .control-item:hover { border-color: #98a2b3; background: #f9fafb; }
// //     .control-item.highlight { border-color: #d1e9ff; background: #eff8ff; margin-top: 25px; }
    
// //     .control-label { font-size: 0.9rem; font-weight: 500; color: #344054; }
// //     .control-sub { display: block; font-size: 0.75rem; color: #667085; font-weight: 400; }
    
// //     .toggle-grid {
// //       display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;
// //     }

// //     /* Footer */
// //     .form-footer {
// //       padding: 1.5rem 2rem;
// //       border-top: 1px solid #eaecf0;
// //       background: #fff;
// //       display: flex; justify-content: flex-end; gap: 1rem;
// //       flex-shrink: 0;
// //     }
    
// //     /* Utilities */
// //     .uppercase { text-transform: uppercase; }
// //     .w-full { width: 100%; }
// //     .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// //     .custom-scrollbar::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
    
// //     .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
// //     @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
// //   `]
// // })
// // export class UserFormComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private userService = inject(UserManagementService);
// //   private shiftService = inject(ShiftService);
// //   private router = inject(Router);
// //   private route = inject(ActivatedRoute);
// //   private messageService = inject(AppMessageService);
// //   private loadingService = inject(LoadingService);
// //   public masterList = inject(MasterListService);

// //   // State
// //   userForm!: FormGroup;
// //   userId: string | null = null;
// //   isSubmitting = signal(false);
// //   editMode = signal(false);
// //   showPasswordFields = signal(false);

// //   // Data Signals
// //   shifts = signal<{_id: string, name: string}[]>([]);
// //   roles = this.masterList.roles; 
// //   branches = this.masterList.branches;

// //   // Mock Data (Replace with your actual API/MasterList)
// //   departments = signal([{ _id: 'dept_01', name: 'Engineering' }, { _id: 'dept_02', name: 'Human Resources' }, { _id: 'dept_03', name: 'Sales' }]);
// //   designations = signal([{ _id: 'desig_01', name: 'Senior Developer' }, { _id: 'desig_02', name: 'Project Manager' }]);
// //   managers = signal([{ _id: 'user_99', name: 'Alex Supervisor' }]);
// //   geoFences = signal([{ _id: 'geo_01', name: 'Headquarters Zone' }, { _id: 'geo_02', name: 'Factory Site B' }]);

// //   userStatuses = signal([
// //     { value: 'pending', label: 'Pending' },
// //     { value: 'approved', label: 'Approved' },
// //     { value: 'rejected', label: 'Rejected' },
// //     { value: 'inactive', label: 'Inactive' },
// //     { value: 'suspended', label: 'Suspended' }
// //   ]);

// //   employmentTypes = signal([
// //     { value: 'permanent', label: 'Permanent' },
// //     { value: 'contract', label: 'Contract' },
// //     { value: 'intern', label: 'Intern' },
// //     { value: 'consultant', label: 'Consultant' }
// //   ]);

// //   ngOnInit() {
// //     this.initForm();
// //     this.loadShifts();
    
// //     this.userId = this.route.snapshot.paramMap.get('id');
// //     if (this.userId) {
// //       this.editMode.set(true);
// //       this.loadUserData(this.userId);
// //     } else {
// //       this.setupCreateMode();
// //     }
// //   }

// //   private initForm() {
// //     this.userForm = this.fb.group({
// //       // Identity
// //       name: ['', [Validators.required, Validators.minLength(3)]],
// //       email: ['', [Validators.required, Validators.email]],
// //       phone: ['', [Validators.required]],
// //       upiId: [''],

// //       // Access
// //       role: [null, [Validators.required]],
// //       branchId: [null],
// //       status: ['approved'],
// //       isActive: [true], // Default for toggle
// //       password: [''],
// //       passwordConfirm: [''],

// //       // Employee Profile
// //       employeeProfile: this.fb.group({
// //         employeeId: [''],
// //         departmentId: [null],
// //         designationId: [null],
// //         reportingManagerId: [null],
// //         employmentType: ['permanent'],
// //         workLocation: [''],
// //         dateOfJoining: [null],
// //         dateOfBirth: [null],
// //         bankDetails: this.fb.group({
// //            accountName: [''],
// //            accountNumber: [''],
// //            ifscCode: [''],
// //            bankName: [''],
// //            panCard: [''],
// //            uanNumber: ['']
// //         }),
// //         guarantorDetails: this.fb.group({
// //            name: [''],
// //            relationship: [''],
// //            phone: ['']
// //         })
// //       }),

// //       // Attendance
// //       attendanceConfig: this.fb.group({
// //         isAttendanceEnabled: [true],
// //         shiftId: [null],
// //         machineUserId: [''],
// //         allowWebPunch: [false],
// //         allowMobilePunch: [true],
// //         enforceGeoFence: [false],
// //         geoFenceId: [null],
// //         geoFenceRadius: [100],
// //         biometricVerified: [false]
// //       })
// //     }, { validators: this.passwordMatchValidator });

// //     // React to Attendance Toggle
// //     const attConfig = this.userForm.get('attendanceConfig') as FormGroup;
// //     attConfig.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
// //        const shiftCtrl = attConfig.get('shiftId');
// //        if (enabled) {
// //          shiftCtrl?.setValidators(Validators.required);
// //        } else {
// //          shiftCtrl?.clearValidators();
// //          shiftCtrl?.setValue(null);
// //        }
// //        shiftCtrl?.updateValueAndValidity();
// //     });
// //   }

// //   private loadShifts() {
// //     // Replace with actual service call
// //     this.shiftService.getAllShifts().subscribe({
// //       next: (res: any) => this.shifts.set(res.data || []),
// //       error: () => console.warn('Failed to load shifts, using fallback')
// //     });
// //   }

// //   private setupCreateMode() {
// //     this.showPasswordFields.set(true);
// //     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
// //     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
// //   }

// //   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
// //     const password = control.get('password')?.value;
// //     const confirm = control.get('passwordConfirm')?.value;
// //     if (!password && !confirm) return null;
// //     return password === confirm ? null : { mismatch: true };
// //   }

// //   togglePasswordChange() {
// //     this.showPasswordFields.update(v => !v);
// //     const pass = this.userForm.get('password');
// //     const conf = this.userForm.get('passwordConfirm');
    
// //     if (this.showPasswordFields()) {
// //       pass?.setValidators([Validators.required, Validators.minLength(6)]);
// //       conf?.setValidators([Validators.required]);
// //     } else {
// //       pass?.clearValidators(); pass?.setValue('');
// //       conf?.clearValidators(); conf?.setValue('');
// //     }
// //     pass?.updateValueAndValidity();
// //     conf?.updateValueAndValidity();
// //   }

// //   private loadUserData(id: string) {
// //     this.loadingService.show();
// //     this.userService.getUser(id).pipe(finalize(() => this.loadingService.hide())).subscribe({
// //       next: (res: any) => {
// //         // Handle various API response structures
// //         const user = res.data?.data || res.data?.user || res.data;
// //         if (!user) return;

// //         // Date conversions
// //         const safeDate = (d: any) => d ? new Date(d) : null;
// //         if(user.employeeProfile) {
// //             user.employeeProfile.dateOfJoining = safeDate(user.employeeProfile.dateOfJoining);
// //             user.employeeProfile.dateOfBirth = safeDate(user.employeeProfile.dateOfBirth);
// //         }

// //         // Helper to extract ID if object is populated
// //         const extract = (val: any) => (val && typeof val === 'object' && val._id) ? val._id : val;

// //         this.userForm.patchValue({
// //           ...user,
// //           role: extract(user.role),
// //           branchId: extract(user.branchId),
// //           employeeProfile: {
// //              ...user.employeeProfile,
// //              departmentId: extract(user.employeeProfile?.departmentId),
// //              designationId: extract(user.employeeProfile?.designationId),
// //              reportingManagerId: extract(user.employeeProfile?.reportingManagerId),
// //              // Fallbacks for nested objects
// //              bankDetails: user.employeeProfile?.bankDetails || {},
// //              guarantorDetails: user.employeeProfile?.guarantorDetails || {}
// //           },
// //           attendanceConfig: {
// //              ...user.attendanceConfig,
// //              shiftId: extract(user.attendanceConfig?.shiftId),
// //              geoFenceId: extract(user.attendanceConfig?.geoFenceId)
// //           }
// //         });
// //       },
// //       error: () => {
// //         this.messageService.showError('Error', 'User not found.');
// //         this.onCancel();
// //       }
// //     });
// //   }

// //   onSubmit() {
// //     if (this.userForm.invalid) {
// //       this.userForm.markAllAsTouched();
// //       this.messageService.showWarn('Validation Error', 'Please check the highlighted fields.');
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const formValue = this.userForm.getRawValue();

// //     // Remove password fields if not changing them in edit mode
// //     if (this.editMode() && !this.showPasswordFields()) {
// //        delete formValue.password;
// //        delete formValue.passwordConfirm;
// //     }

// //     const req$ = this.editMode() 
// //       ? this.userService.updateUser(this.userId!, formValue)
// //       : this.userService.createUser(formValue);

// //     req$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
// //       next: () => {
// //         this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
// //         setTimeout(() => this.onCancel(), 500);
// //       },
// //       error: (err) => {
// //         this.messageService.showError('Failed', err.error?.message || 'Operation failed');
// //       }
// //     });
// //   }

// //   onCancel() {
// //     this.router.navigate(['/user/list']);
// //   }

// //   getStatusIcon(status: string): string {
// //     switch(status) {
// //       case 'approved': return 'pi-check-circle';
// //       case 'pending': return 'pi-clock';
// //       case 'rejected': return 'pi-times-circle';
// //       default: return 'pi-minus-circle';
// //     }
// //   }
// // }

// // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// // // import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// // // import { finalize } from 'rxjs';

// // // // PrimeNG Modules
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { ButtonModule } from 'primeng/button';
// // // import { SelectModule } from 'primeng/select';
// // // import { PasswordModule } from 'primeng/password';
// // // import { ToastModule } from 'primeng/toast';
// // // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // // import { InputNumberModule } from 'primeng/inputnumber';
// // // import { DatePickerModule } from 'primeng/datepicker';
// // // import { PanelModule } from 'primeng/panel';
// // // import { DividerModule } from 'primeng/divider';
// // // import { TabsModule } from 'primeng/tabs';

// // // // Services (Mocked or Real)
// // // import { MasterListService } from '../../../core/services/master-list.service';
// // // import { UserManagementService } from '../user-management.service';
// // // import { ShiftService } from '../../attendance/services/shift.service';
// // // import { AppMessageService } from '../../../core/services/message.service';
// // // import { LoadingService } from '../../../core/services/loading.service';

// // // @Component({
// // //   selector: 'app-user-form',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule, ReactiveFormsModule, RouterModule,
// // //     InputTextModule, ButtonModule, SelectModule, 
// // //     PasswordModule, ToastModule, ToggleSwitchModule, 
// // //     InputNumberModule, DatePickerModule, PanelModule,
// // //     DividerModule, TabsModule
// // //   ],
// // //   template: `
// // //     <p-toast></p-toast>
    
// // //     <div class="customer-wrapper">
// // //       <section class="customer-container animate-fadeIn">
// // //         <div class="customer-form-panel">
    
// // //           <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="customer-form-layout">
    
// // //             <!-- HEADER -->
// // //             <div class="customer-form-header">
// // //               <div class="header-content">
// // //                 <h1 class="form-title">{{ editMode() ? 'Update Profile' : 'New Employee' }}</h1>
// // //                 <p class="form-subtitle">
// // //                   {{ editMode() ? 'System ID: ' + userId : 'Create a new user record.' }} 
// // //                   <span class="req">* required</span>
// // //                 </p>
// // //               </div>
// // //               <div class="header-actions">
// // //                  <span class="status-badge" [ngClass]="userForm.get('status')?.value">
// // //                     {{ userForm.get('status')?.value | titlecase }}
// // //                  </span>
// // //               </div>
// // //             </div>
    
// // //             <!-- BODY (Scrollable) -->
// // //             <div class="customer-form-body custom-scrollbar">
              
// // //               <!-- SECTION 1: Identity & Access -->
// // //               <section class="form-section">
// // //                 <h4 class="section-title">Identity & Access</h4>
// // //                 <div class="form-grid">
// // //                   <div class="form-group">
// // //                     <label>Full Name <span class="req">*</span></label>
// // //                     <input pInputText formControlName="name" placeholder="John Doe" />
// // //                   </div>
                  
// // //                   <div class="form-group">
// // //                     <label>Email Address <span class="req">*</span></label>
// // //                     <input pInputText formControlName="email" placeholder="john@company.com" />
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Primary Phone <span class="req">*</span></label>
// // //                     <input pInputText formControlName="phone" placeholder="+91..." />
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Role <span class="req">*</span></label>
// // //                     <p-select [options]="roles()" formControlName="role" optionLabel="name" optionValue="_id" placeholder="Select Role" styleClass="w-full"></p-select>
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Branch</label>
// // //                     <p-select [options]="branches()" formControlName="branchId" optionLabel="name" optionValue="_id" placeholder="Global / HQ" [showClear]="true" styleClass="w-full"></p-select>
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Account Status</label>
// // //                     <p-select [options]="userStatuses()" formControlName="status" optionLabel="label" optionValue="value" styleClass="w-full"></p-select>
// // //                   </div>

// // //                   <div class="status-toggle-box">
// // //                     <span class="label">Login Allowed (Is Active)</span>
// // //                     <p-toggleswitch formControlName="isActive"></p-toggleswitch>
// // //                   </div>
// // //                 </div>
// // //               </section>
    
// // //               <!-- SECTION 2: Employee Profile (Nested Group) -->
// // //               <section class="form-section" formGroupName="employeeProfile">
// // //                 <h4 class="section-title">Employment Details</h4>
                
// // //                 <!-- Basic Employment -->
// // //                 <div class="form-grid mb-6">
// // //                   <div class="form-group">
// // //                     <label>Employee ID</label>
// // //                     <input pInputText formControlName="employeeId" placeholder="EMP-001" />
// // //                   </div>
                  
// // //                   <div class="form-group">
// // //                     <label>Employment Type</label>
// // //                     <p-select [options]="employmentTypes()" formControlName="employmentType" optionLabel="label" optionValue="value" styleClass="w-full"></p-select>
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Department</label>
// // //                     <p-select [options]="departments()" formControlName="departmentId" optionLabel="name" optionValue="_id" placeholder="Select Dept" styleClass="w-full"></p-select>
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Designation</label>
// // //                     <p-select [options]="designations()" formControlName="designationId" optionLabel="name" optionValue="_id" placeholder="Select Designation" styleClass="w-full"></p-select>
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                      <label>Reporting Manager</label>
// // //                      <p-select [options]="managers()" formControlName="reportingManagerId" optionLabel="name" optionValue="_id" placeholder="Select Manager" [showClear]="true" styleClass="w-full"></p-select>
// // //                   </div>

// // //                   <div class="form-group">
// // //                      <label>Work Location</label>
// // //                      <input pInputText formControlName="workLocation" placeholder="e.g. Surat Office" />
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Date of Joining</label>
// // //                     <p-datepicker formControlName="dateOfJoining" [showIcon]="true" styleClass="w-full"></p-datepicker>
// // //                   </div>
    
// // //                   <div class="form-group">
// // //                     <label>Date of Birth</label>
// // //                     <p-datepicker formControlName="dateOfBirth" [showIcon]="true" styleClass="w-full"></p-datepicker>
// // //                   </div>
                  
// // //                   <div class="form-group">
// // //                     <label>Secondary Phone</label>
// // //                     <input pInputText formControlName="secondaryPhone" placeholder="Emergency Contact" />
// // //                   </div>
// // //                 </div>
    
// // //                 <div class="divider"></div>
    
// // //                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
// // //                     <!-- Bank Details -->
// // //                     <div formGroupName="bankDetails" class="sub-section">
// // //                         <h5 class="sub-title"><i class="pi pi-wallet mr-2"></i>Bank & Statutory</h5>
// // //                         <div class="form-grid-compact">
// // //                             <div class="form-group">
// // //                                 <label>Bank Name</label>
// // //                                 <input pInputText formControlName="bankName" />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>Account Holder</label>
// // //                                 <input pInputText formControlName="accountName" />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>Account Number</label>
// // //                                 <input pInputText formControlName="accountNumber" type="password"  />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>IFSC Code</label>
// // //                                 <input pInputText formControlName="ifscCode" class="uppercase" />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>PAN Card</label>
// // //                                 <input pInputText formControlName="panCard" class="uppercase" />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>UAN Number</label>
// // //                                 <input pInputText formControlName="uanNumber" />
// // //                             </div>
// // //                         </div>
// // //                     </div>

// // //                     <!-- Guarantor Details -->
// // //                     <div formGroupName="guarantorDetails" class="sub-section">
// // //                         <h5 class="sub-title"><i class="pi pi-shield mr-2"></i>Guarantor / Reference</h5>
// // //                         <div class="form-grid-compact">
// // //                             <div class="form-group">
// // //                                 <label>Guarantor Name</label>
// // //                                 <input pInputText formControlName="name" />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>Relationship</label>
// // //                                 <input pInputText formControlName="relationship" placeholder="e.g. Father, Spouse" />
// // //                             </div>
// // //                             <div class="form-group">
// // //                                 <label>Contact Number</label>
// // //                                 <input pInputText formControlName="phone" />
// // //                             </div>
// // //                         </div>
                        
// // //                         <div class="upi-box mt-4">
// // //                            <label class="block text-sm font-medium mb-1">UPI ID (For Expense Reimbursement)</label>
// // //                            <!-- Note: upiId is at root level of schema, so we step out of guarantor group -->
// // //                            <input pInputText [formControl]="$any(userForm.get('upiId'))" placeholder="user@bank" class="w-full" />
// // //                         </div>
// // //                     </div>
// // //                 </div>
// // //               </section>
    
// // //               <!-- SECTION 3: Attendance Config -->
// // //               <section class="form-section" formGroupName="attendanceConfig">
// // //                 <div class="section-header">
// // //                   <h4 class="section-title">Attendance Settings</h4>
// // //                   <p-toggleswitch formControlName="isAttendanceEnabled"></p-toggleswitch>
// // //                 </div>
    
// // //                 @if (userForm.get('attendanceConfig.isAttendanceEnabled')?.value) {
// // //                 <div class="attendance-panel animate-fadeIn">
// // //                   <div class="form-grid">
// // //                     <div class="form-group">
// // //                       <label>Shift Assignment</label>
// // //                       <p-select [options]="shifts()" formControlName="shiftId" optionLabel="name" optionValue="_id" placeholder="Select Shift" styleClass="w-full"></p-select>
// // //                     </div>
// // //                     <div class="form-group">
// // //                       <label>Biometric Machine ID</label>
// // //                       <input pInputText formControlName="machineUserId" placeholder="ID on Device" />
// // //                     </div>
                    
// // //                     <div class="form-group">
// // //                        <label>GeoFence Zone</label>
// // //                        <p-select [options]="geoFences()" formControlName="geoFenceId" optionLabel="name" optionValue="_id" placeholder="Select Zone" [showClear]="true" styleClass="w-full"></p-select>
// // //                     </div>
                    
// // //                     <div class="form-group">
// // //                        <label>Fence Radius (Meters)</label>
// // //                        <p-inputnumber formControlName="geoFenceRadius" suffix=" m" [min]="10"></p-inputnumber>
// // //                     </div>

// // //                     <!-- Toggles -->
// // //                     <div class="control-box">
// // //                       <span class="label">Web Punch</span>
// // //                       <p-toggleswitch formControlName="allowWebPunch"></p-toggleswitch>
// // //                     </div>
// // //                     <div class="control-box">
// // //                       <span class="label">App Punch</span>
// // //                       <p-toggleswitch formControlName="allowMobilePunch"></p-toggleswitch>
// // //                     </div>
// // //                     <div class="control-box">
// // //                       <span class="label">Enforce GeoFence</span>
// // //                       <p-toggleswitch formControlName="enforceGeoFence"></p-toggleswitch>
// // //                     </div>
// // //                      <div class="control-box">
// // //                       <span class="label">Biometric Verified</span>
// // //                       <p-toggleswitch formControlName="biometricVerified"></p-toggleswitch>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //                 }
// // //               </section>
    
// // //               <!-- SECTION 4: Security -->
// // //               <section class="form-section">
// // //                 <div class="flex justify-between items-center mb-4">
// // //                   <h4 class="section-title">Security & Credentials</h4>
// // //                   @if (editMode()) {
// // //                     <p-button [label]="showPasswordFields() ? 'Cancel' : 'Change Password'" [text]="true" size="small" (onClick)="togglePasswordChange()"></p-button>
// // //                   }
// // //                 </div>
    
// // //                 @if (showPasswordFields()) {
// // //                 <div class="form-grid animate-fadeIn">
// // //                   <div class="form-group">
// // //                     <label>New Password <span class="req">*</span></label>
// // //                     <p-password formControlName="password" [toggleMask]="true" styleClass="w-full" inputStyleClass="w-full"></p-password>
// // //                   </div>
// // //                   <div class="form-group">
// // //                     <label>Confirm Password <span class="req">*</span></label>
// // //                     <p-password formControlName="passwordConfirm" [toggleMask]="true" [feedback]="false" styleClass="w-full" inputStyleClass="w-full"></p-password>
// // //                   </div>
// // //                 </div>
// // //                 }
// // //               </section>
    
// // //             </div>
    
// // //             <!-- FOOTER -->
// // //             <div class="customer-form-footer">
// // //               <p-button label="Cancel" severity="secondary" [outlined]="true" (onClick)="onCancel()"></p-button>
// // //               <p-button type="submit" [label]="editMode() ? 'Save Changes' : 'Create User'" icon="pi pi-check" [loading]="isSubmitting()"></p-button>
// // //             </div>
    
// // //           </form>
// // //         </div>
// // //       </section>
// // //     </div>
// // //   `,
// // //   styles: [`
// // //     :host { 
// // //         display: block; 
// // //         width: 100%; 
// // //         height: 100%;
// // //         /* Font inherit from global if needed, otherwise: */
// // //         font-family: var(--font-body);
// // //         color: var(--text-primary);
// // //     }
    
// // //     .customer-wrapper {
// // //       width: 100%; height: 100%;
// // //       overflow: hidden;
// // //       display: flex; flex-direction: column;
// // //       background: var(--bg-primary); /* Theme Background */
// // //       padding: var(--spacing-xl);
// // //     }

// // //     .customer-container { 
// // //         width: 100%; 
// // //         height: 100%; 
// // //         display: flex; 
// // //         flex-direction: column; 
// // //     }

// // //     .customer-form-panel {
// // //       display: flex; flex-direction: column; width: 100%; height: 100%;
// // //       background: var(--bg-secondary); /* Theme Card BG */
// // //       border-radius: var(--ui-border-radius-lg);
// // //       box-shadow: var(--shadow-md);
// // //       border: 1px solid var(--border-primary);
// // //       overflow: hidden;
// // //     }

// // //     .customer-form-layout { display: flex; flex-direction: column; height: 100%; }

// // //     /* --- Header --- */
// // //     .customer-form-header {
// // //       padding: var(--spacing-lg) var(--spacing-2xl);
// // //       background: var(--bg-secondary);
// // //       border-bottom: 1px solid var(--border-primary);
// // //       flex-shrink: 0;
// // //       display: flex; justify-content: space-between; align-items: flex-start;
// // //     }
    
// // //     .form-title { 
// // //         font-family: var(--font-heading);
// // //         font-size: var(--font-size-3xl); 
// // //         font-weight: var(--font-weight-bold); 
// // //         color: var(--text-primary); 
// // //         margin: 0; 
// // //         letter-spacing: -0.5px;
// // //     }
    
// // //     .form-subtitle { 
// // //         font-size: var(--font-size-sm); 
// // //         color: var(--text-secondary); 
// // //         margin-top: var(--spacing-xs); 
// // //     }
    
// // //     .req { 
// // //         color: var(--color-error); 
// // //         font-size: var(--font-size-xs); 
// // //         font-weight: var(--font-weight-semibold); 
// // //         margin-left: 4px; 
// // //     }
    
// // //     /* --- Badges --- */
// // //     .status-badge {
// // //         padding: 4px 12px; 
// // //         border-radius: var(--ui-border-radius-xl); 
// // //         font-size: var(--font-size-xs); 
// // //         font-weight: var(--font-weight-semibold);
// // //         text-transform: uppercase; 
// // //         letter-spacing: 0.5px;
// // //         border: 1px solid transparent;
// // //     }
    
// // //     .status-badge.approved { 
// // //         background: var(--color-success-bg); 
// // //         color: var(--color-success-dark); 
// // //         border-color: var(--color-success-border);
// // //     }
// // //     .status-badge.pending { 
// // //         background: var(--color-warning-bg); 
// // //         color: var(--color-warning-dark); 
// // //         border-color: var(--color-warning-border);
// // //     }
// // //     .status-badge.suspended, .status-badge.inactive, .status-badge.rejected { 
// // //         background: var(--color-error-bg); 
// // //         color: var(--color-error-dark); 
// // //         border-color: var(--color-error-border);
// // //     }

// // //     /* --- Footer --- */
// // //     .customer-form-footer {
// // //       background: var(--bg-secondary);
// // //       border-top: 1px solid var(--border-primary);
// // //       padding: var(--spacing-lg) var(--spacing-2xl);
// // //       display: flex; justify-content: flex-end; gap: var(--spacing-md);
// // //       flex-shrink: 0;
// // //     }

// // //     /* --- Body --- */
// // //     .customer-form-body {
// // //       flex: 1; overflow-y: auto;
// // //       padding: var(--spacing-2xl);
// // //       /* Inset look: Using bg-ternary to make panels pop, or bg-primary if we want seamless.
// // //          Using bg-primary here to contrast with the bg-secondary panel wrapper. */
// // //       background: var(--bg-ternary); 
// // //       display: flex; flex-direction: column; gap: var(--spacing-xl);
// // //     }

// // //     /* --- Sections --- */
// // //     .form-section {
// // //       background: var(--bg-secondary);
// // //       border-radius: var(--ui-border-radius-lg);
// // //       border: 1px solid var(--border-primary);
// // //       padding: var(--spacing-xl);
// // //       box-shadow: var(--shadow-sm);
// // //     }
    
// // //     .section-title {
// // //       font-family: var(--font-heading);
// // //       font-size: var(--font-size-lg); 
// // //       font-weight: var(--font-weight-semibold); 
// // //       color: var(--text-primary);
// // //       margin: 0 0 var(--spacing-lg) 0; 
// // //       padding-bottom: var(--spacing-sm);
// // //       border-bottom: 2px solid var(--accent-primary);
// // //       display: inline-block;
// // //     }
    
// // //     /* --- Sub-sections (Bank/Guarantor) --- */
// // //     .sub-section {
// // //         background: var(--bg-ternary); /* Highlighted area */
// // //         padding: var(--spacing-lg);
// // //         border-radius: var(--ui-border-radius);
// // //         border: 1px solid var(--border-secondary);
// // //     }
// // //     .sub-title {
// // //         font-size: var(--font-size-md); 
// // //         font-weight: var(--font-weight-semibold); 
// // //         color: var(--text-secondary);
// // //         margin: 0 0 var(--spacing-lg) 0; 
// // //         display: flex; align-items: center;
// // //     }

// // //     /* --- Layout Utilities --- */
// // //     .divider { 
// // //         height: 1px; 
// // //         background: var(--border-secondary); 
// // //         width: 100%; 
// // //         margin: var(--spacing-md) 0;
// // //     }

// // //     .form-grid { 
// // //         display: grid; 
// // //         grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
// // //         gap: var(--spacing-xl); 
// // //         align-items: start; 
// // //     }
    
// // //     .form-grid-compact { 
// // //         display: grid; 
// // //         grid-template-columns: 1fr; 
// // //         gap: var(--spacing-lg); 
// // //     }

// // //     /* --- Controls --- */
// // //     .form-group { 
// // //         display: flex; flex-direction: column; gap: 6px; 
// // //     }
    
// // //     .form-group label { 
// // //         font-size: var(--font-size-xs); 
// // //         color: var(--text-secondary); 
// // //         font-weight: var(--font-weight-bold); 
// // //         text-transform: uppercase; 
// // //         letter-spacing: 0.5px;
// // //     }
    
// // //     /* Input Container Styling Overrides (If PrimeNG allows) */
// // //     :host ::ng-deep .p-inputtext {
// // //         font-size: var(--font-size-md);
// // //         padding: var(--spacing-md) var(--spacing-lg);
// // //     }

// // //     .status-toggle-box, .control-box {
// // //       display: flex; align-items: center; justify-content: space-between;
// // //       padding: 0 var(--spacing-lg); 
// // //       height: 46px; /* Keep consistent height */
// // //       background: var(--bg-ternary);
// // //       border: 1px solid var(--border-secondary);
// // //       border-radius: var(--ui-border-radius);
// // //     }
    
// // //     .control-box .label { 
// // //         font-size: var(--font-size-md); 
// // //         font-weight: var(--font-weight-medium); 
// // //         color: var(--text-primary); 
// // //     }
    
// // //     .upi-box {
// // //         margin-top: var(--spacing-lg);
// // //     }
// // //     .upi-box label {
// // //         font-size: var(--font-size-sm);
// // //         color: var(--text-secondary);
// // //         font-weight: var(--font-weight-medium);
// // //         margin-bottom: var(--spacing-xs);
// // //         display: block;
// // //     }
    
// // //     .uppercase { text-transform: uppercase; }
    
// // //     /* Animation */
// // //     .animate-fadeIn { animation: fadeIn var(--transition-base) forwards; }
// // //     @keyframes fadeIn { 
// // //         from { opacity: 0; transform: translateY(5px); } 
// // //         to { opacity: 1; transform: translateY(0); } 
// // //     }
// // //   `]
// // // })
// // // export class UserFormComponent implements OnInit {
// // //   private fb = inject(FormBuilder);
// // //   private userService = inject(UserManagementService);
// // //   private shiftService = inject(ShiftService);
// // //   private router = inject(Router);
// // //   private route = inject(ActivatedRoute);
// // //   private messageService = inject(AppMessageService);
// // //   private loadingService = inject(LoadingService);
// // //   public masterList = inject(MasterListService);

// // //   // --- State ---
// // //   userForm!: FormGroup;
// // //   userId: string | null = null;
// // //   isSubmitting = signal(false);
// // //   editMode = signal(false);
// // //   showPasswordFields = signal(false);

// // //   // --- Signals for Dropdowns ---
// // //   shifts = signal<{_id: string, name: string}[]>([]);
// // //   roles = this.masterList.roles; 
// // //   branches = this.masterList.branches;
  
// // //   // Mock Data (Replace with API calls)
// // //   departments = signal([{ _id: 'dept_01', name: 'Engineering' }, { _id: 'dept_02', name: 'HR' }]);
// // //   designations = signal([{ _id: 'desig_01', name: 'Developer' }, { _id: 'desig_02', name: 'Manager' }]);
// // //   managers = signal([{ _id: 'user_99', name: 'Alex Supervisor' }, { _id: 'user_98', name: 'Sarah Lead' }]);
// // //   geoFences = signal([{ _id: 'geo_01', name: 'Main Office Zone' }, { _id: 'geo_02', name: 'Warehouse A' }]);

// // //   userStatuses = signal([
// // //     { value: 'pending', label: 'Pending' },
// // //     { value: 'approved', label: 'Approved' },
// // //     { value: 'rejected', label: 'Rejected' },
// // //     { value: 'inactive', label: 'Inactive' },
// // //     { value: 'suspended', label: 'Suspended' }
// // //   ]);

// // //   employmentTypes = signal([
// // //     { value: 'permanent', label: 'Permanent' },
// // //     { value: 'contract', label: 'Contract' },
// // //     { value: 'intern', label: 'Intern' },
// // //     { value: 'probation', label: 'Probation' },
// // //     { value: 'consultant', label: 'Consultant' }
// // //   ]);

// // //   ngOnInit() {
// // //     this.initForm();
// // //     this.loadShifts();
    
// // //     this.userId = this.route.snapshot.paramMap.get('id');
// // //     if (this.userId) {
// // //       this.editMode.set(true);
// // //       this.loadUserData(this.userId);
// // //     } else {
// // //       this.setupCreateMode();
// // //     }
// // //   }

// // //   private initForm() {
// // //     this.userForm = this.fb.group({
// // //       // 1. Identity
// // //       name: ['', [Validators.required, Validators.minLength(3)]],
// // //       email: ['', [Validators.required, Validators.email]],
// // //       phone: ['', [Validators.required]], 
// // //       upiId: [''], // Root level in schema

// // //       // 2. Access
// // //       role: [null, [Validators.required]], 
// // //       branchId: [null], 
// // //       status: ['approved'],
// // //       isActive: [true],
// // //       password: [''], 
// // //       passwordConfirm: [''],

// // //       // 3. Nested Employee Profile
// // //       employeeProfile: this.fb.group({
// // //         employeeId: [''],
// // //         departmentId: [null],
// // //         designationId: [null],
// // //         reportingManagerId: [null], // New
// // //         employmentType: ['permanent'], // New
// // //         workLocation: ['Office'], // New
// // //         dateOfJoining: [null],
// // //         dateOfBirth: [null],
// // //         secondaryPhone: [''], // New
        
// // //         // Deeply Nested Groups
// // //         guarantorDetails: this.fb.group({
// // //             name: [''],
// // //             relationship: [''],
// // //             phone: ['']
// // //         }),
// // //         bankDetails: this.fb.group({
// // //             accountName: [''],
// // //             accountNumber: [''],
// // //             ifscCode: [''],
// // //             bankName: [''],
// // //             panCard: [''],
// // //             uanNumber: ['']
// // //         })
// // //       }),

// // //       // 4. Attendance
// // //       attendanceConfig: this.fb.group({
// // //         isAttendanceEnabled: [true],
// // //         shiftId: [null], 
// // //         machineUserId: [''], 
// // //         allowWebPunch: [false],
// // //         allowMobilePunch: [true],
// // //         enforceGeoFence: [false],
// // //         geoFenceId: [null], // New
// // //         geoFenceRadius: [100],
// // //         biometricVerified: [false] // New
// // //       })
// // //     }, { validators: this.passwordMatchValidator });

// // //     // Dynamic Validators
// // //     const attGroup = this.userForm.get('attendanceConfig') as FormGroup;
// // //     attGroup.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
// // //        const shiftCtrl = attGroup.get('shiftId');
// // //        if(enabled) shiftCtrl?.setValidators(Validators.required);
// // //        else { shiftCtrl?.clearValidators(); shiftCtrl?.setValue(null); }
// // //        shiftCtrl?.updateValueAndValidity();
// // //     });
// // //   }

// // //   private loadShifts() {
// // //     this.shiftService.getAllShifts().subscribe({
// // //       next: (res: any) => this.shifts.set(res.data || []),
// // //       error: (err) => console.warn('Shift load failed', err)
// // //     });
// // //   }

// // //   private setupCreateMode() {
// // //     this.showPasswordFields.set(true);
// // //     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
// // //     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
// // //   }

// // //   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
// // //     const password = control.get('password')?.value;
// // //     const confirm = control.get('passwordConfirm')?.value;
// // //     if (!password && !confirm) return null;
// // //     return password === confirm ? null : { mismatch: true };
// // //   }

// // //   togglePasswordChange() {
// // //     this.showPasswordFields.update(v => !v);
// // //     const passCtrl = this.userForm.get('password');
// // //     const confirmCtrl = this.userForm.get('passwordConfirm');
    
// // //     if (this.showPasswordFields()) {
// // //         passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
// // //         confirmCtrl?.setValidators([Validators.required]);
// // //     } else {
// // //         passCtrl?.clearValidators(); passCtrl?.setValue('');
// // //         confirmCtrl?.clearValidators(); confirmCtrl?.setValue('');
// // //     }
// // //     passCtrl?.updateValueAndValidity();
// // //     confirmCtrl?.updateValueAndValidity();
// // //   }

// // //   private loadUserData(id: string) {
// // //     this.loadingService.show();
// // //     this.userService.getUser(id).pipe(finalize(() => this.loadingService.hide())).subscribe({
// // //       next: (res: any) => {
// // //         const user = res.data?.data || res.data?.user || res.data;
// // //         if (!user) return;

// // //         // 1. Date Conversion
// // //         if (user.employeeProfile?.dateOfBirth) user.employeeProfile.dateOfBirth = new Date(user.employeeProfile.dateOfBirth);
// // //         if (user.employeeProfile?.dateOfJoining) user.employeeProfile.dateOfJoining = new Date(user.employeeProfile.dateOfJoining);

// // //         // 2. ID Extraction (Handle populated fields vs ID strings)
// // //         const extractId = (obj: any) => obj && typeof obj === 'object' ? obj._id : obj;

// // //         // 3. Patch Form
// // //         this.userForm.patchValue({
// // //            ...user,
// // //            role: extractId(user.role),
// // //            branchId: extractId(user.branchId),
           
// // //            employeeProfile: {
// // //              ...user.employeeProfile,
// // //              departmentId: extractId(user.employeeProfile?.departmentId),
// // //              designationId: extractId(user.employeeProfile?.designationId),
// // //              reportingManagerId: extractId(user.employeeProfile?.reportingManagerId),
// // //              // Ensure nested groups are patched if they exist in DB
// // //              bankDetails: user.employeeProfile?.bankDetails || {},
// // //              guarantorDetails: user.employeeProfile?.guarantorDetails || {}
// // //            },
           
// // //            attendanceConfig: {
// // //              ...user.attendanceConfig,
// // //              shiftId: extractId(user.attendanceConfig?.shiftId),
// // //              geoFenceId: extractId(user.attendanceConfig?.geoFenceId)
// // //            }
// // //         });
// // //       },
// // //       error: (err) => {
// // //         this.messageService.showError('Error', 'User not found');
// // //         this.onCancel();
// // //       }
// // //     });
// // //   }

// // //   onSubmit() {
// // //     if (this.userForm.invalid) {
// // //       this.userForm.markAllAsTouched();
// // //       this.messageService.showWarn('Invalid Form', 'Please check required fields highlighted in red.');
// // //       return;
// // //     }

// // //     this.isSubmitting.set(true);
// // //     const formValue = this.userForm.getRawValue();

// // //     // Clean up password for Edit Mode
// // //     if (this.editMode() && !this.showPasswordFields()) {
// // //        delete formValue.password;
// // //        delete formValue.passwordConfirm;
// // //     }

// // //     const request$ = this.editMode() 
// // //         ? this.userService.updateUser(this.userId!, formValue) 
// // //         : this.userService.createUser(formValue);

// // //     request$.pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
// // //       next: () => {
// // //         this.messageService.showSuccess('Saved', 'User record updated successfully');
// // //         setTimeout(() => this.onCancel(), 800);
// // //       },
// // //       error: (err) => this.messageService.showError('Failed', err.error?.message || 'Could not save user')
// // //     });
// // //   }

// // //   onCancel() {
// // //     this.router.navigate(['/user/list']);
// // //   }
// // // }
// // // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// // // // import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// // // // import { finalize } from 'rxjs';

// // // // // PrimeNG Modules (V18+)
// // // // import { InputTextModule } from 'primeng/inputtext';
// // // // import { ButtonModule } from 'primeng/button';
// // // // import { SelectModule } from 'primeng/select';
// // // // import { PasswordModule } from 'primeng/password';
// // // // import { ToastModule } from 'primeng/toast';
// // // // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // // // import { InputNumberModule } from 'primeng/inputnumber';
// // // // import { DatePickerModule } from 'primeng/datepicker'; // Added for DOB/DOJ

// // // // // Services
// // // // import { MasterListService } from '../../../core/services/master-list.service';
// // // // import { UserManagementService } from '../user-management.service';
// // // // import { ShiftService } from '../../attendance/services/shift.service';
// // // // import { AppMessageService } from '../../../core/services/message.service';
// // // // import { LoadingService } from '../../../core/services/loading.service';

// // // // @Component({
// // // //   selector: 'app-user-form',
// // // //   standalone: true,
// // // //   imports: [
// // // //     CommonModule, ReactiveFormsModule, RouterModule,
// // // //     InputTextModule, ButtonModule, SelectModule, 
// // // //     PasswordModule, ToastModule, ToggleSwitchModule, 
// // // //     InputNumberModule, DatePickerModule
// // // //   ],
// // // //   templateUrl: './user-form.html',
// // // //   styleUrls: ['./user-form.scss']
// // // // })
// // // // export class UserFormComponent implements OnInit {
// // // //   // --- Dependency Injection ---
// // // //   private fb = inject(FormBuilder);
// // // //   private userService = inject(UserManagementService);
// // // //   private shiftService = inject(ShiftService);
// // // //   private router = inject(Router);
// // // //   private route = inject(ActivatedRoute);
// // // //   private messageService = inject(AppMessageService);
// // // //   private loadingService = inject(LoadingService);
// // // //   public masterList = inject(MasterListService);

// // // //   // --- State Management ---
// // // //   userForm!: FormGroup;
// // // //   userId: string | null = null;
// // // //   isSubmitting = signal(false);
// // // //   editMode = signal(false);
// // // //   showPasswordFields = signal(false);
// // // //   formTitle = signal('New Employee');

// // // //   // --- Data Signals ---
// // // //   shifts = signal<{_id: string, name: string}[]>([]);
// // // //   roles = this.masterList.roles; 
// // // //   branches = this.masterList.branches;

// // // //   // Static Data for HRMS (To be replaced with API calls later)
// // // //   departments = signal([
// // // //     { _id: 'dept_01', name: 'Engineering & Tech' },
// // // //     { _id: 'dept_02', name: 'Human Resources' },
// // // //     { _id: 'dept_03', name: 'Sales & Marketing' },
// // // //     { _id: 'dept_04', name: 'Finance' }
// // // //   ]);

// // // //   designations = signal([
// // // //     { _id: 'desig_01', name: 'Software Engineer' },
// // // //     { _id: 'desig_02', name: 'Senior Developer' },
// // // //     { _id: 'desig_03', name: 'HR Manager' },
// // // //     { _id: 'desig_04', name: 'Accountant' }
// // // //   ]);

// // // //   userStatuses = signal([
// // // //     { value: 'pending', label: 'Pending' },
// // // //     { value: 'approved', label: 'Approved' },
// // // //     { value: 'inactive', label: 'Inactive' }
// // // //   ]);

// // // //   ngOnInit() {
// // // //     this.initForm();
// // // //     this.loadShifts();
    
// // // //     this.userId = this.route.snapshot.paramMap.get('id');
// // // //     if (this.userId) {
// // // //       this.editMode.set(true);
// // // //       this.formTitle.set('Update Profile');
// // // //       this.loadUserData(this.userId);
// // // //     } else {
// // // //       this.setupCreateMode();
// // // //     }
// // // //   }

// // // //   private initForm() {
// // // //     this.userForm = this.fb.group({
// // // //       // Identity & Contact
// // // //       name: ['', [Validators.required, Validators.minLength(3)]],
// // // //       email: ['', [Validators.required, Validators.email]],
// // // //       phone: [''],
// // // //       upiId: [''],
      
// // // //       // Access & System
// // // //       role: [null, [Validators.required]], 
// // // //       branchId: [null], 
// // // //       status: ['approved'],
// // // //       isActive: [true], 
// // // //       password: [''], 
// // // //       passwordConfirm: [''],

// // // //       // HRMS Profile
// // // //       employeeProfile: this.fb.group({
// // // //         employeeId: [''],
// // // //         departmentId: [null],
// // // //         designationId: [null],
// // // //         dateOfJoining: [null],
// // // //         dateOfBirth: [null]
// // // //       }),

// // // //       // Attendance
// // // //       attendanceConfig: this.fb.group({
// // // //         isAttendanceEnabled: [true],
// // // //         shiftId: [null], 
// // // //         machineUserId: [''], 
// // // //         allowWebPunch: [false],
// // // //         allowMobilePunch: [false],
// // // //         enforceGeoFence: [true],
// // // //         geoFenceRadius: [100]
// // // //       })
// // // //     }, { validators: this.passwordMatchValidator });

// // // //     // Dynamic Validation Logic
// // // //     const attendanceGroup = this.userForm.get('attendanceConfig') as FormGroup;
// // // //     attendanceGroup.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
// // // //       const shiftCtrl = attendanceGroup.get('shiftId');
// // // //       if (enabled) {
// // // //         shiftCtrl?.setValidators([Validators.required]);
// // // //       } else {
// // // //         shiftCtrl?.clearValidators();
// // // //         shiftCtrl?.setValue(null);
// // // //       }
// // // //       shiftCtrl?.updateValueAndValidity();
// // // //     });
// // // //   }

// // // //   private loadShifts() {
// // // //     this.shiftService.getAllShifts().subscribe({
// // // //       next: (res: any) => this.shifts.set(res.data || []),
// // // //       error: (err) => console.warn('Could not load shifts', err)
// // // //     });
// // // //   }

// // // //   private setupCreateMode() {
// // // //     this.showPasswordFields.set(true);
// // // //     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
// // // //     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
// // // //     this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
// // // //   }

// // // //   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
// // // //     const password = control.get('password')?.value;
// // // //     const confirm = control.get('passwordConfirm')?.value;
// // // //     if (!password && !confirm) return null;
// // // //     return password === confirm ? null : { mismatch: true };
// // // //   }

// // // //   togglePasswordChange() {
// // // //     this.showPasswordFields.update(v => !v);
// // // //     const isShowing = this.showPasswordFields();
// // // //     const passCtrl = this.userForm.get('password');
// // // //     const confirmCtrl = this.userForm.get('passwordConfirm');

// // // //     if (isShowing) {
// // // //       passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
// // // //       confirmCtrl?.setValidators([Validators.required]);
// // // //     } else {
// // // //       passCtrl?.clearValidators();
// // // //       confirmCtrl?.clearValidators();
// // // //       passCtrl?.setValue('');
// // // //       confirmCtrl?.setValue('');
// // // //     }
// // // //     passCtrl?.updateValueAndValidity();
// // // //     confirmCtrl?.updateValueAndValidity();
// // // //   }

// // // //   private loadUserData(id: string) {
// // // //     this.loadingService.show();
// // // //     this.userService.getUser(id).pipe(
// // // //       finalize(() => this.loadingService.hide())
// // // //     ).subscribe({
// // // //       next: (res: any) => {
// // // //         const user = res.data?.data || res.data?.user || res.data;

// // // //         if (user) {
// // // //           // Format dates for PrimeNG DatePicker if they exist
// // // //           if (user.employeeProfile?.dateOfBirth) {
// // // //             user.employeeProfile.dateOfBirth = new Date(user.employeeProfile.dateOfBirth);
// // // //           }
// // // //           if (user.employeeProfile?.dateOfJoining) {
// // // //             user.employeeProfile.dateOfJoining = new Date(user.employeeProfile.dateOfJoining);
// // // //           }

// // // //           this.userForm.patchValue({
// // // //             ...user,
// // // //             role: user.role?._id || user.role,
// // // //             branchId: user.branchId?._id || user.branchId,
            
// // // //             employeeProfile: {
// // // //               ...user.employeeProfile,
// // // //               departmentId: user.employeeProfile?.departmentId?._id || user.employeeProfile?.departmentId,
// // // //               designationId: user.employeeProfile?.designationId?._id || user.employeeProfile?.designationId
// // // //             },

// // // //             attendanceConfig: {
// // // //               ...user.attendanceConfig,
// // // //               shiftId: user.attendanceConfig?.shiftId?._id || user.attendanceConfig?.shiftId
// // // //             }
// // // //           });
// // // //         }
// // // //       },
// // // //       error: (err) => {
// // // //         console.error(err);
// // // //         this.messageService.showError('Error', 'User record not found.');
// // // //         this.onCancel();
// // // //       }
// // // //     });
// // // //   }

// // // //   onSubmit() {
// // // //     if (this.userForm.invalid) {
// // // //       this.userForm.markAllAsTouched();
// // // //       this.messageService.showWarn('Invalid Form', 'Please review required fields.');
// // // //       return;
// // // //     }

// // // //     this.isSubmitting.set(true);
// // // //     const formValue = this.userForm.getRawValue();

// // // //     if (this.editMode() && !this.showPasswordFields()) {
// // // //       delete formValue.password;
// // // //       delete formValue.passwordConfirm;
// // // //     }

// // // //     const request$ = this.editMode()
// // // //       ? this.userService.updateUser(this.userId!, formValue)
// // // //       : this.userService.createUser(formValue);

// // // //     request$.pipe(
// // // //       finalize(() => this.isSubmitting.set(false))
// // // //     ).subscribe({
// // // //       next: () => {
// // // //         this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
// // // //         setTimeout(() => this.onCancel(), 1000);
// // // //       },
// // // //       error: (err) => {
// // // //         this.messageService.showError('Error', err.error?.message || 'Failed to save user.');
// // // //       }
// // // //     });
// // // //   }

// // // //   onCancel() {
// // // //     this.router.navigate(['/user/list']);
// // // //   }
// // // // }

// // // // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // // // import { CommonModule } from '@angular/common';
// // // // // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// // // // // import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// // // // // import { finalize } from 'rxjs';

// // // // // // PrimeNG Modules (V18+)
// // // // // import { InputTextModule } from 'primeng/inputtext';
// // // // // import { ButtonModule } from 'primeng/button';
// // // // // import { SelectModule } from 'primeng/select';
// // // // // import { PasswordModule } from 'primeng/password';
// // // // // import { ToastModule } from 'primeng/toast';
// // // // // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // // // // import { InputNumberModule } from 'primeng/inputnumber';

// // // // // // Services
// // // // // import { MasterListService } from '../../../core/services/master-list.service';
// // // // // import { UserManagementService } from '../user-management.service';
// // // // // import { ShiftService } from '../../attendance/services/shift.service';
// // // // // import { AppMessageService } from '../../../core/services/message.service';
// // // // // import { LoadingService } from '../../../core/services/loading.service';

// // // // // @Component({
// // // // //   selector: 'app-user-form',
// // // // //   standalone: true,
// // // // //   imports: [
// // // // //     CommonModule, ReactiveFormsModule, RouterModule,
// // // // //     InputTextModule, ButtonModule, SelectModule, 
// // // // //     PasswordModule, ToastModule, ToggleSwitchModule, InputNumberModule
// // // // //   ],
// // // // //   templateUrl: './user-form.html',
// // // // //   styleUrls: ['./user-form.scss']
// // // // // })
// // // // // export class UserFormComponent implements OnInit {
// // // // //   // --- Dependency Injection ---
// // // // //   private fb = inject(FormBuilder);
// // // // //   private userService = inject(UserManagementService);
// // // // //   private shiftService = inject(ShiftService);
// // // // //   private router = inject(Router);
// // // // //   private route = inject(ActivatedRoute);
// // // // //   private messageService = inject(AppMessageService);
// // // // //   private loadingService = inject(LoadingService);
// // // // //   public masterList = inject(MasterListService);

// // // // //   // --- State Management ---
// // // // //   userForm!: FormGroup;
// // // // //   userId: string | null = null;
// // // // //   isSubmitting = signal(false);
// // // // //   editMode = signal(false);
// // // // //   showPasswordFields = signal(false);
// // // // //   formTitle = signal('New Employee');

// // // // //   // --- Data Signals ---
// // // // //   shifts = signal<{_id: string, name: string}[]>([]);
// // // // //   roles = this.masterList.roles; 
// // // // //   branches = this.masterList.branches;

// // // // //   ngOnInit() {
// // // // //     this.initForm();
// // // // //     this.loadShifts();
    
// // // // //     this.userId = this.route.snapshot.paramMap.get('id');
// // // // //     if (this.userId) {
// // // // //       this.editMode.set(true);
// // // // //       this.formTitle.set('Update Profile');
// // // // //       this.loadUserData(this.userId);
// // // // //     } else {
// // // // //       this.setupCreateMode();
// // // // //     }
// // // // //   }

// // // // //   private initForm() {
// // // // //     this.userForm = this.fb.group({
// // // // //       name: ['', [Validators.required, Validators.minLength(3)]],
// // // // //       email: ['', [Validators.required, Validators.email]],
// // // // //       phone: [''],
// // // // //       role: [null, [Validators.required]], 
// // // // //       branchId: [null], 
// // // // //       isActive: [true], 
// // // // //       password: [''], 
// // // // //       passwordConfirm: [''],
// // // // //       attendanceConfig: this.fb.group({
// // // // //         isAttendanceEnabled: [true],
// // // // //         shiftId: [null], 
// // // // //         machineUserId: [''], 
// // // // //         allowWebPunch: [false],
// // // // //         allowMobilePunch: [false],
// // // // //         enforceGeoFence: [true],
// // // // //         geoFenceRadius: [100]
// // // // //       })
// // // // //     }, { validators: this.passwordMatchValidator });

// // // // //     // --- Dynamic Validation Logic ---
// // // // //     const attendanceGroup = this.userForm.get('attendanceConfig') as FormGroup;
// // // // //     attendanceGroup.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
// // // // //       const shiftCtrl = attendanceGroup.get('shiftId');
// // // // //       if (enabled) {
// // // // //         shiftCtrl?.setValidators([Validators.required]);
// // // // //       } else {
// // // // //         shiftCtrl?.clearValidators();
// // // // //         shiftCtrl?.setValue(null);
// // // // //       }
// // // // //       shiftCtrl?.updateValueAndValidity();
// // // // //     });
// // // // //   }

// // // // //   private loadShifts() {
// // // // //     this.shiftService.getAllShifts().subscribe({
// // // // //       next: (res: any) => this.shifts.set(res.data || []),
// // // // //       error: (err) => console.warn('Could not load shifts', err)
// // // // //     });
// // // // //   }

// // // // //   private setupCreateMode() {
// // // // //     this.showPasswordFields.set(true);
// // // // //     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
// // // // //     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
// // // // //     this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
// // // // //   }

// // // // //   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
// // // // //     const password = control.get('password')?.value;
// // // // //     const confirm = control.get('passwordConfirm')?.value;
// // // // //     if (!password && !confirm) return null;
// // // // //     return password === confirm ? null : { mismatch: true };
// // // // //   }

// // // // //   togglePasswordChange() {
// // // // //     this.showPasswordFields.update(v => !v);
// // // // //     const isShowing = this.showPasswordFields();
// // // // //     const passCtrl = this.userForm.get('password');
// // // // //     const confirmCtrl = this.userForm.get('passwordConfirm');

// // // // //     if (isShowing) {
// // // // //       passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
// // // // //       confirmCtrl?.setValidators([Validators.required]);
// // // // //     } else {
// // // // //       passCtrl?.clearValidators();
// // // // //       confirmCtrl?.clearValidators();
// // // // //       passCtrl?.setValue('');
// // // // //       confirmCtrl?.setValue('');
// // // // //     }
// // // // //     passCtrl?.updateValueAndValidity();
// // // // //     confirmCtrl?.updateValueAndValidity();
// // // // //   }

// // // // //   private loadUserData(id: string) {
// // // // //     // this.loadingService.show();
// // // // //     this.userService.getUser(id).pipe(
// // // // //       finalize(() => this.loadingService.hide())
// // // // //     ).subscribe({
// // // // //       next: (res: any) => {
// // // // //         // FIX: Access the nested 'data' property based on your JSON structure
// // // // //         const user = res.data?.data || res.data?.user || res.data;

// // // // //         if (user) {
// // // // //           console.log('User Data to Patch:', user); // Debug log to ensure you have the clean object

// // // // //           this.userForm.patchValue({
// // // // //             ...user,
// // // // //             // Extract _id from populated objects if they exist, otherwise use the value as is
// // // // //             role: user.role?._id || user.role,
// // // // //             branchId: user.branchId?._id || user.branchId,
            
// // // // //             // Handle the nested form group
// // // // //             attendanceConfig: {
// // // // //               ...user.attendanceConfig,
// // // // //               shiftId: user.attendanceConfig?.shiftId?._id || user.attendanceConfig?.shiftId
// // // // //             }
// // // // //           });

// // // // //           // Optional: If you are using OnPush change detection or if values don't appear immediately
// // // // //           // this.userForm.updateValueAndValidity();
// // // // //         }
// // // // //       },
// // // // //       error: (err) => {
// // // // //         console.error(err);
// // // // //         this.messageService.showError('Error', 'User record not found.');
// // // // //         this.onCancel();
// // // // //       }
// // // // //     });
// // // // //   }

// // // // //   onSubmit() {
// // // // //     if (this.userForm.invalid) {
// // // // //       this.userForm.markAllAsTouched();
// // // // //       this.messageService.showWarn('Invalid Form', 'Please review required fields.');
// // // // //       return;
// // // // //     }

// // // // //     this.isSubmitting.set(true);
// // // // //     const formValue = this.userForm.getRawValue();

// // // // //     if (this.editMode() && !this.showPasswordFields()) {
// // // // //       delete formValue.password;
// // // // //       delete formValue.passwordConfirm;
// // // // //     }

// // // // //     const request$ = this.editMode()
// // // // //       ? this.userService.updateUser(this.userId!, formValue)
// // // // //       : this.userService.createUser(formValue);

// // // // //     request$.pipe(
// // // // //       finalize(() => this.isSubmitting.set(false))
// // // // //     ).subscribe({
// // // // //       next: () => {
// // // // //         this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
// // // // //         setTimeout(() => this.onCancel(), 1000);
// // // // //       },
// // // // //       error: (err) => {
// // // // //         this.messageService.showError('Error', err.error?.message || 'Failed to save user.');
// // // // //       }
// // // // //     });
// // // // //   }

// // // // //   onCancel() {
// // // // //     this.router.navigate(['/user/list']);
// // // // //   }
// // // // // }