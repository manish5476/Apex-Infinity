import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

// PrimeNG Modules (V18+)
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker'; // Added for DOB/DOJ

// Services
import { MasterListService } from '../../../core/services/master-list.service';
import { UserManagementService } from '../user-management.service';
import { ShiftService } from '../../attendance/services/shift.service';
import { AppMessageService } from '../../../core/services/message.service';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    InputTextModule, ButtonModule, SelectModule, 
    PasswordModule, ToastModule, ToggleSwitchModule, 
    InputNumberModule, DatePickerModule
  ],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss']
})
export class UserFormComponent implements OnInit {
  // --- Dependency Injection ---
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  private shiftService = inject(ShiftService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);
  public masterList = inject(MasterListService);

  // --- State Management ---
  userForm!: FormGroup;
  userId: string | null = null;
  isSubmitting = signal(false);
  editMode = signal(false);
  showPasswordFields = signal(false);
  formTitle = signal('New Employee');

  // --- Data Signals ---
  shifts = signal<{_id: string, name: string}[]>([]);
  roles = this.masterList.roles; 
  branches = this.masterList.branches;

  // Static Data for HRMS (To be replaced with API calls later)
  departments = signal([
    { _id: 'dept_01', name: 'Engineering & Tech' },
    { _id: 'dept_02', name: 'Human Resources' },
    { _id: 'dept_03', name: 'Sales & Marketing' },
    { _id: 'dept_04', name: 'Finance' }
  ]);

  designations = signal([
    { _id: 'desig_01', name: 'Software Engineer' },
    { _id: 'desig_02', name: 'Senior Developer' },
    { _id: 'desig_03', name: 'HR Manager' },
    { _id: 'desig_04', name: 'Accountant' }
  ]);

  userStatuses = signal([
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'inactive', label: 'Inactive' }
  ]);

  ngOnInit() {
    this.initForm();
    this.loadShifts();
    
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.editMode.set(true);
      this.formTitle.set('Update Profile');
      this.loadUserData(this.userId);
    } else {
      this.setupCreateMode();
    }
  }

  private initForm() {
    this.userForm = this.fb.group({
      // Identity & Contact
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      upiId: [''],
      
      // Access & System
      role: [null, [Validators.required]], 
      branchId: [null], 
      status: ['approved'],
      isActive: [true], 
      password: [''], 
      passwordConfirm: [''],

      // HRMS Profile
      employeeProfile: this.fb.group({
        employeeId: [''],
        departmentId: [null],
        designationId: [null],
        dateOfJoining: [null],
        dateOfBirth: [null]
      }),

      // Attendance
      attendanceConfig: this.fb.group({
        isAttendanceEnabled: [true],
        shiftId: [null], 
        machineUserId: [''], 
        allowWebPunch: [false],
        allowMobilePunch: [false],
        enforceGeoFence: [true],
        geoFenceRadius: [100]
      })
    }, { validators: this.passwordMatchValidator });

    // Dynamic Validation Logic
    const attendanceGroup = this.userForm.get('attendanceConfig') as FormGroup;
    attendanceGroup.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
      const shiftCtrl = attendanceGroup.get('shiftId');
      if (enabled) {
        shiftCtrl?.setValidators([Validators.required]);
      } else {
        shiftCtrl?.clearValidators();
        shiftCtrl?.setValue(null);
      }
      shiftCtrl?.updateValueAndValidity();
    });
  }

  private loadShifts() {
    this.shiftService.getAllShifts().subscribe({
      next: (res: any) => this.shifts.set(res.data || []),
      error: (err) => console.warn('Could not load shifts', err)
    });
  }

  private setupCreateMode() {
    this.showPasswordFields.set(true);
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
    this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('passwordConfirm')?.value;
    if (!password && !confirm) return null;
    return password === confirm ? null : { mismatch: true };
  }

  togglePasswordChange() {
    this.showPasswordFields.update(v => !v);
    const isShowing = this.showPasswordFields();
    const passCtrl = this.userForm.get('password');
    const confirmCtrl = this.userForm.get('passwordConfirm');

    if (isShowing) {
      passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
      confirmCtrl?.setValidators([Validators.required]);
    } else {
      passCtrl?.clearValidators();
      confirmCtrl?.clearValidators();
      passCtrl?.setValue('');
      confirmCtrl?.setValue('');
    }
    passCtrl?.updateValueAndValidity();
    confirmCtrl?.updateValueAndValidity();
  }

  private loadUserData(id: string) {
    this.loadingService.show();
    this.userService.getUser(id).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res: any) => {
        const user = res.data?.data || res.data?.user || res.data;

        if (user) {
          // Format dates for PrimeNG DatePicker if they exist
          if (user.employeeProfile?.dateOfBirth) {
            user.employeeProfile.dateOfBirth = new Date(user.employeeProfile.dateOfBirth);
          }
          if (user.employeeProfile?.dateOfJoining) {
            user.employeeProfile.dateOfJoining = new Date(user.employeeProfile.dateOfJoining);
          }

          this.userForm.patchValue({
            ...user,
            role: user.role?._id || user.role,
            branchId: user.branchId?._id || user.branchId,
            
            employeeProfile: {
              ...user.employeeProfile,
              departmentId: user.employeeProfile?.departmentId?._id || user.employeeProfile?.departmentId,
              designationId: user.employeeProfile?.designationId?._id || user.employeeProfile?.designationId
            },

            attendanceConfig: {
              ...user.attendanceConfig,
              shiftId: user.attendanceConfig?.shiftId?._id || user.attendanceConfig?.shiftId
            }
          });
        }
      },
      error: (err) => {
        console.error(err);
        this.messageService.showError('Error', 'User record not found.');
        this.onCancel();
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form', 'Please review required fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.userForm.getRawValue();

    if (this.editMode() && !this.showPasswordFields()) {
      delete formValue.password;
      delete formValue.passwordConfirm;
    }

    const request$ = this.editMode()
      ? this.userService.updateUser(this.userId!, formValue)
      : this.userService.createUser(formValue);

    request$.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: () => {
        this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
        setTimeout(() => this.onCancel(), 1000);
      },
      error: (err) => {
        this.messageService.showError('Error', err.error?.message || 'Failed to save user.');
      }
    });
  }

  onCancel() {
    this.router.navigate(['/user/list']);
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { finalize } from 'rxjs';

// // PrimeNG Modules (V18+)
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { PasswordModule } from 'primeng/password';
// import { ToastModule } from 'primeng/toast';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { InputNumberModule } from 'primeng/inputnumber';

// // Services
// import { MasterListService } from '../../../core/services/master-list.service';
// import { UserManagementService } from '../user-management.service';
// import { ShiftService } from '../../attendance/services/shift.service';
// import { AppMessageService } from '../../../core/services/message.service';
// import { LoadingService } from '../../../core/services/loading.service';

// @Component({
//   selector: 'app-user-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, RouterModule,
//     InputTextModule, ButtonModule, SelectModule, 
//     PasswordModule, ToastModule, ToggleSwitchModule, InputNumberModule
//   ],
//   templateUrl: './user-form.html',
//   styleUrls: ['./user-form.scss']
// })
// export class UserFormComponent implements OnInit {
//   // --- Dependency Injection ---
//   private fb = inject(FormBuilder);
//   private userService = inject(UserManagementService);
//   private shiftService = inject(ShiftService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);
//   public masterList = inject(MasterListService);

//   // --- State Management ---
//   userForm!: FormGroup;
//   userId: string | null = null;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   showPasswordFields = signal(false);
//   formTitle = signal('New Employee');

//   // --- Data Signals ---
//   shifts = signal<{_id: string, name: string}[]>([]);
//   roles = this.masterList.roles; 
//   branches = this.masterList.branches;

//   ngOnInit() {
//     this.initForm();
//     this.loadShifts();
    
//     this.userId = this.route.snapshot.paramMap.get('id');
//     if (this.userId) {
//       this.editMode.set(true);
//       this.formTitle.set('Update Profile');
//       this.loadUserData(this.userId);
//     } else {
//       this.setupCreateMode();
//     }
//   }

//   private initForm() {
//     this.userForm = this.fb.group({
//       name: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: [''],
//       role: [null, [Validators.required]], 
//       branchId: [null], 
//       isActive: [true], 
//       password: [''], 
//       passwordConfirm: [''],
//       attendanceConfig: this.fb.group({
//         isAttendanceEnabled: [true],
//         shiftId: [null], 
//         machineUserId: [''], 
//         allowWebPunch: [false],
//         allowMobilePunch: [false],
//         enforceGeoFence: [true],
//         geoFenceRadius: [100]
//       })
//     }, { validators: this.passwordMatchValidator });

//     // --- Dynamic Validation Logic ---
//     const attendanceGroup = this.userForm.get('attendanceConfig') as FormGroup;
//     attendanceGroup.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
//       const shiftCtrl = attendanceGroup.get('shiftId');
//       if (enabled) {
//         shiftCtrl?.setValidators([Validators.required]);
//       } else {
//         shiftCtrl?.clearValidators();
//         shiftCtrl?.setValue(null);
//       }
//       shiftCtrl?.updateValueAndValidity();
//     });
//   }

//   private loadShifts() {
//     this.shiftService.getAllShifts().subscribe({
//       next: (res: any) => this.shifts.set(res.data || []),
//       error: (err) => console.warn('Could not load shifts', err)
//     });
//   }

//   private setupCreateMode() {
//     this.showPasswordFields.set(true);
//     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
//     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
//     this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
//   }

//   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
//     const password = control.get('password')?.value;
//     const confirm = control.get('passwordConfirm')?.value;
//     if (!password && !confirm) return null;
//     return password === confirm ? null : { mismatch: true };
//   }

//   togglePasswordChange() {
//     this.showPasswordFields.update(v => !v);
//     const isShowing = this.showPasswordFields();
//     const passCtrl = this.userForm.get('password');
//     const confirmCtrl = this.userForm.get('passwordConfirm');

//     if (isShowing) {
//       passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
//       confirmCtrl?.setValidators([Validators.required]);
//     } else {
//       passCtrl?.clearValidators();
//       confirmCtrl?.clearValidators();
//       passCtrl?.setValue('');
//       confirmCtrl?.setValue('');
//     }
//     passCtrl?.updateValueAndValidity();
//     confirmCtrl?.updateValueAndValidity();
//   }

//   private loadUserData(id: string) {
//     // this.loadingService.show();
//     this.userService.getUser(id).pipe(
//       finalize(() => this.loadingService.hide())
//     ).subscribe({
//       next: (res: any) => {
//         // FIX: Access the nested 'data' property based on your JSON structure
//         const user = res.data?.data || res.data?.user || res.data;

//         if (user) {
//           console.log('User Data to Patch:', user); // Debug log to ensure you have the clean object

//           this.userForm.patchValue({
//             ...user,
//             // Extract _id from populated objects if they exist, otherwise use the value as is
//             role: user.role?._id || user.role,
//             branchId: user.branchId?._id || user.branchId,
            
//             // Handle the nested form group
//             attendanceConfig: {
//               ...user.attendanceConfig,
//               shiftId: user.attendanceConfig?.shiftId?._id || user.attendanceConfig?.shiftId
//             }
//           });

//           // Optional: If you are using OnPush change detection or if values don't appear immediately
//           // this.userForm.updateValueAndValidity();
//         }
//       },
//       error: (err) => {
//         console.error(err);
//         this.messageService.showError('Error', 'User record not found.');
//         this.onCancel();
//       }
//     });
//   }

//   onSubmit() {
//     if (this.userForm.invalid) {
//       this.userForm.markAllAsTouched();
//       this.messageService.showWarn('Invalid Form', 'Please review required fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = this.userForm.getRawValue();

//     if (this.editMode() && !this.showPasswordFields()) {
//       delete formValue.password;
//       delete formValue.passwordConfirm;
//     }

//     const request$ = this.editMode()
//       ? this.userService.updateUser(this.userId!, formValue)
//       : this.userService.createUser(formValue);

//     request$.pipe(
//       finalize(() => this.isSubmitting.set(false))
//     ).subscribe({
//       next: () => {
//         this.messageService.showSuccess('Success', `User ${this.editMode() ? 'updated' : 'created'} successfully.`);
//         setTimeout(() => this.onCancel(), 1000);
//       },
//       error: (err) => {
//         this.messageService.showError('Error', err.error?.message || 'Failed to save user.');
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/user/list']);
//   }
// }