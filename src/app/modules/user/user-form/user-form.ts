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
    PasswordModule, ToastModule, ToggleSwitchModule, InputNumberModule
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
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: [null, [Validators.required]], 
      branchId: [null], 
      isActive: [true], 
      password: [''], 
      passwordConfirm: [''],
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

    // --- Dynamic Validation Logic ---
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
    // this.loadingService.show();
    this.userService.getUser(id).pipe(
      finalize(() => this.loadingService.hide())
    ).subscribe({
      next: (res: any) => {
        const user = res.data?.user || res.data || res;
        if (user) {
          // Flatten objects to IDs for PrimeNG Select
          this.userForm.patchValue({
            ...user,
            role: user.role?._id || user.role,
            branchId: user.branchId?._id || user.branchId,
            attendanceConfig: {
              ...user.attendanceConfig,
              shiftId: user.attendanceConfig?.shiftId?._id || user.attendanceConfig?.shiftId
            }
          });
        }
      },
      error: () => {
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
// import { MessageService } from 'primeng/api';

// // Services
// import { MasterListService } from '../../../core/services/master-list.service';
// import { UserManagementService } from '../user-management.service';
// import { ShiftService } from '../../attendance/services/shift.service';

// // PrimeNG Modules (V18+)
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select'; // Use DropdownModule if on v17
// import { PasswordModule } from 'primeng/password';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { ToggleSwitchModule } from 'primeng/toggleswitch'; // Use InputSwitchModule if on v17
// import { InputNumberModule } from 'primeng/inputnumber';

// @Component({
//   selector: 'app-user-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, RouterModule,
//     InputTextModule, ButtonModule, SelectModule, 
//     PasswordModule, DividerModule, ToastModule, ToggleSwitchModule, InputNumberModule
//   ],
//   providers: [MessageService],
//   templateUrl: './user-form.html',
//   styleUrl: './user-form.scss'
// })
// export class UserFormComponent implements OnInit {
//   // Dependency Injection
//   privatefb = inject(FormBuilder);
//   private userService = inject(UserManagementService);
//   public masterList = inject(MasterListService);
//   private shiftService = inject(ShiftService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private messageService = inject(MessageService);

//   // State Signals
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   showPasswordFields = signal(false);
//   shifts = signal<{_id: string, name: string}[]>([]); // Typed Signal

//   // Form & Data
//   userForm!: FormGroup;
//   userId: string | null = null;
  
//   // Master Data Signals
//   roles = this.masterList.roles; 
//   branches = this.masterList.branches;

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
//     this.userForm = this.privatefb.group({
//       // --- Identity ---
//       name: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: [''],
      
//       // --- Access ---
//       role: [null, [Validators.required]], 
//       branchId: [null], 
//       isActive: [true], 
      
//       // --- Security ---
//       password: [''], 
//       passwordConfirm: [''],

//       // --- Attendance Configuration ---
//       attendanceConfig: this.privatefb.group({
//         isAttendanceEnabled: [true],
//         shiftId: [null], 
//         machineUserId: [''], 
//         allowWebPunch: [false],
//         allowMobilePunch: [false],
//         enforceGeoFence: [true],
//         geoFenceRadius: [100]
//       })
//     }, { validators: this.passwordMatchValidator });

//     // Dynamic Validation Observer
//     const authConfig = this.userForm.get('attendanceConfig') as FormGroup;
//     authConfig.get('isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
//       const shiftControl = authConfig.get('shiftId');
//       if (enabled) {
//         shiftControl?.setValidators([Validators.required]);
//       } else {
//         shiftControl?.clearValidators();
//         shiftControl?.setValue(null); // Optional: Clear value if disabled
//       }
//       shiftControl?.updateValueAndValidity();
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
    
//     // Initial validation state for shift
//     this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
//   }

//   // Custom Validator must accept AbstractControl
//   private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
//     const password = control.get('password')?.value;
//     const confirm = control.get('passwordConfirm')?.value;
    
//     // If both empty (and not required), valid. 
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
//     this.userService.getUser(id).subscribe({
//       next: (res: any) => {
//         const user = res.data?.user || res.data || res; // Handle various API response structures
//         if (user) {
//           // Patch Top Level Fields
//           this.userForm.patchValue({
//             name: user.name,
//             email: user.email,
//             phone: user.phone,
//             isActive: user.isActive,
//             role: user.role?._id || user.role, 
//             branchId: user.branchId?._id || user.branchId
//           });

//           // Patch Attendance Config
//           if (user.attendanceConfig) {
//             this.userForm.get('attendanceConfig')?.patchValue({
//               isAttendanceEnabled: user.attendanceConfig.isAttendanceEnabled,
//               shiftId: user.attendanceConfig.shiftId?._id || user.attendanceConfig.shiftId,
//               machineUserId: user.attendanceConfig.machineUserId,
//               allowWebPunch: user.attendanceConfig.allowWebPunch,
//               allowMobilePunch: user.attendanceConfig.allowMobilePunch,
//               enforceGeoFence: user.attendanceConfig.enforceGeoFence,
//               geoFenceRadius: user.attendanceConfig.geoFenceRadius
//             });
//           }
//         }
//       },
//       error: () => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'User not found.' });
//         this.onCancel();
//       }
//     });
//   }

//   onSubmit() {
//     if (this.userForm.invalid) {
//       this.userForm.markAllAsTouched();
//       this.messageService.add({ severity: 'warn', summary: 'Form Invalid', detail: 'Please check the required fields.' });
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = { ...this.userForm.getRawValue() }; // getRawValue includes disabled fields if any

//     // Clean up password fields if not in change mode
//     if (this.editMode() && !this.showPasswordFields()) {
//       delete formValue.password;
//       delete formValue.passwordConfirm;
//     }

//     // Prepare API Call
//     const request$ = this.editMode()
//       ? this.userService.updateUser(this.userId!, formValue)
//       : this.userService.createUser(formValue);

//     request$.subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User saved successfully!' });
//         setTimeout(() => this.onCancel(), 1000);
//       },
//       error: (err) => {
//         this.isSubmitting.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed' });
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/user/list']);
//   }
// }

// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// // import { MessageService } from 'primeng/api';

// // // Services
// // import { MasterListService } from '../../../core/services/master-list.service';
// // import { UserManagementService } from '../user-management.service';
// // import { ShiftService } from '../../attendance/services/shift.service'; // Ensure this path is correct

// // // PrimeNG Modules
// // import { InputTextModule } from 'primeng/inputtext';
// // import { ButtonModule } from 'primeng/button';
// // import { SelectModule } from 'primeng/select';
// // import { PasswordModule } from 'primeng/password';
// // import { DividerModule } from 'primeng/divider';
// // import { ToastModule } from 'primeng/toast';
// // import { ToggleSwitchModule } from 'primeng/toggleswitch';
// // import { InputNumberModule } from 'primeng/inputnumber'; // Required for Radius input

// // @Component({
// //   selector: 'app-user-form',
// //   standalone: true,
// //   imports: [
// //     CommonModule, ReactiveFormsModule, RouterModule,
// //     InputTextModule, ButtonModule, SelectModule, 
// //     PasswordModule, DividerModule, ToastModule, ToggleSwitchModule, InputNumberModule
// //   ],
// //   providers: [MessageService],
// //   templateUrl: './user-form.html',
// //   styleUrl: './user-form.scss'
// // })
// // export class UserFormComponent implements OnInit {
// //   // Dependency Injection
// //   private fb = inject(FormBuilder);
// //   private userService = inject(UserManagementService);
// //   public masterList = inject(MasterListService);
// //   private shiftService = inject(ShiftService); // Inject Shift Service
// //   private router = inject(Router);
// //   private route = inject(ActivatedRoute);
// //   private messageService = inject(MessageService);

// //   // State Signals
// //   isSubmitting = signal(false);
// //   editMode = signal(false);
// //   showPasswordFields = signal(false);
// //   shifts = signal<any[]>([]); // Store shifts list

// //   // Form & Data
// //   userForm!: FormGroup;
// //   userId: string | null = null;
// //   roles = this.masterList.roles; 
// //   branches = this.masterList.branches;

// //   ngOnInit() {
// //     this.initForm();
// //     this.loadShifts(); // Fetch available shifts
    
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
// //       // --- Identity ---
// //       name: ['', [Validators.required, Validators.minLength(3)]],
// //       email: ['', [Validators.required, Validators.email]],
// //       phone: [''],
      
// //       // --- Access ---
// //       role: [null, [Validators.required]], 
// //       branchId: [null], 
// //       isActive: [true], 
      
// //       // --- Security ---
// //       password: [''], 
// //       passwordConfirm: [''],

// //       // --- 🟢 NEW: Attendance Configuration ---
// //       attendanceConfig: this.fb.group({
// //         isAttendanceEnabled: [true],
// //         shiftId: [null], // Validator added dynamically
// //         machineUserId: [''], 
// //         allowWebPunch: [false],
// //         allowMobilePunch: [false],
// //         enforceGeoFence: [true],
// //         geoFenceRadius: [100] // Default 100 meters
// //       })
// //     }, { validators: this.passwordMatchValidator });

// //     // Dynamic Validation: Shift is required ONLY if Attendance is Enabled
// //     this.userForm.get('attendanceConfig.isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
// //       const shiftControl = this.userForm.get('attendanceConfig.shiftId');
// //       if (enabled) {
// //         shiftControl?.setValidators([Validators.required]);
// //       } else {
// //         shiftControl?.clearValidators();
// //       }
// //       shiftControl?.updateValueAndValidity();
// //     });
// //   }

// //   private loadShifts() {
// //     this.shiftService.getAllShifts().subscribe({
// //       next: (res) => this.shifts.set(res.data || []),
// //       error: () => console.warn('Could not load shifts') // Non-blocking error
// //     });
// //   }

// //   private setupCreateMode() {
// //     this.showPasswordFields.set(true);
// //     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
// //     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
    
// //     // Set default validation for shift
// //     this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
// //   }

// //   private passwordMatchValidator(group: FormGroup) {
// //     const password = group.get('password')?.value;
// //     const confirm = group.get('passwordConfirm')?.value;
// //     if (!password && !confirm) return null;
// //     return password === confirm ? null : { mismatch: true };
// //   }

// //   togglePasswordChange() {
// //     const isShowing = this.showPasswordFields();
// //     this.showPasswordFields.set(!isShowing);
    
// //     const passCtrl = this.userForm.get('password');
// //     const confirmCtrl = this.userForm.get('passwordConfirm');

// //     if (!isShowing) {
// //       passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
// //       confirmCtrl?.setValidators([Validators.required]);
// //     } else {
// //       passCtrl?.clearValidators();
// //       confirmCtrl?.clearValidators();
// //       this.userForm.patchValue({ password: '', passwordConfirm: '' });
// //     }
// //     passCtrl?.updateValueAndValidity();
// //     confirmCtrl?.updateValueAndValidity();
// //   }

// //   private loadUserData(id: string) {
// //     this.userService.getUser(id).subscribe({
// //       next: (res) => {
// //         const user = res.data?.user || res.data?.data || res.data;
// //         if (user) {
// //           // Patch Top Level Fields
// //           this.userForm.patchValue({
// //             name: user.name,
// //             email: user.email,
// //             phone: user.phone,
// //             isActive: user.isActive,
// //             role: user.role?._id || user.role, 
// //             branchId: user.branchId?._id || user.branchId
// //           });

// //           // Patch Attendance Config
// //           if (user.attendanceConfig) {
// //             this.userForm.get('attendanceConfig')?.patchValue({
// //               isAttendanceEnabled: user.attendanceConfig.isAttendanceEnabled,
// //               shiftId: user.attendanceConfig.shiftId?._id || user.attendanceConfig.shiftId,
// //               machineUserId: user.attendanceConfig.machineUserId,
// //               allowWebPunch: user.attendanceConfig.allowWebPunch,
// //               allowMobilePunch: user.attendanceConfig.allowMobilePunch,
// //               enforceGeoFence: user.attendanceConfig.enforceGeoFence,
// //               geoFenceRadius: user.attendanceConfig.geoFenceRadius
// //             });
// //           }
// //         }
// //       },
// //       error: () => {
// //         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'User not found.' });
// //         this.onCancel();
// //       }
// //     });
// //   }

// //   onSubmit() {
// //     if (this.userForm.invalid) {
// //       this.userForm.markAllAsTouched();
// //       this.messageService.add({ severity: 'warn', summary: 'Invalid Form', detail: 'Please fill all required fields.' });
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const formValue = { ...this.userForm.value };

// //     // Clean up password fields if not changing
// //     if (this.editMode() && !this.showPasswordFields()) {
// //       delete formValue.password;
// //       delete formValue.passwordConfirm;
// //     }

// //     // Prepare API Call
// //     const request$ = this.editMode()
// //       ? this.userService.updateUser(this.userId!, formValue)
// //       : this.userService.createUser(formValue);

// //     request$.subscribe({
// //       next: () => {
// //         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User saved successfully!' });
// //         setTimeout(() => this.onCancel(), 1000);
// //       },
// //       error: (err) => {
// //         this.isSubmitting.set(false);
// //         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed' });
// //       }
// //     });
// //   }

// //   onCancel() {
// //     this.router.navigate(['/user/list']);
// //   }
// // }
