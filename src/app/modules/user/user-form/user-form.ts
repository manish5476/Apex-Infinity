import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';

// Custom Services & Components
import { UserManagementService } from '../user-management.service';
import { AppMessageService } from '../../../core/services/message.service';
import { LoadingService } from '../../../core/services/loading.service';
import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ 
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule, 
    InputTextModule, ButtonModule, SelectModule, PasswordModule, 
    ToastModule, ToggleButtonModule, InputNumberModule, DatePickerModule, 
    PanelModule, DividerModule, TabsModule, CardModule, MasterDropdownComponent 
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(AppMessageService);
  private loadingService = inject(LoadingService);

  // State
  userForm!: FormGroup;
  userId: string | null = null;
  isSubmitting = signal(false);
  editMode = signal(false);
  showPasswordFields = signal(false);

  // Static Data Signals mapped from Mongoose enums
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
    { value: 'probation', label: 'Probation' }, // Added from Mongoose
    { value: 'consultant', label: 'Consultant' }
  ]);

  ngOnInit() {
    this.initForm();
    
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
      // Identity - Required in Mongoose
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]], 
      upiId: [''],

      // Access
      role: [null, [Validators.required]], // Kept required for business logic
      branchId: [null],
      status: ['approved'],
      isActive: [true],
      maxConcurrentSessions: [1, [Validators.required, Validators.min(1)]],
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
           accountName: [''], // Added from Mongoose
           accountNumber: [''],
           ifscCode: [''],
           bankName: [''],
           panCard: [''],
           uanNumber: [''] // Added from Mongoose
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
        shiftGroupId: [null], // Added from Mongoose
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

  private setupCreateMode() {
    this.showPasswordFields.set(true);
    // Updated minLength to 8 based on Mongoose schema
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
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
      pass?.setValidators([Validators.required, Validators.minLength(8)]);
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
    
    this.userService.getUser(id)
      .pipe(finalize(() => this.loadingService.hide()))
      .subscribe({
        next: (res: any) => {
          const user = res.data?.data || res.data?.user || res.data;
          if (!user) return;

          const safeDate = (d: any) => d ? new Date(d) : null;
          if(user.employeeProfile) {
              user.employeeProfile.dateOfJoining = safeDate(user.employeeProfile.dateOfJoining);
              user.employeeProfile.dateOfBirth = safeDate(user.employeeProfile.dateOfBirth);
          }

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
                bankDetails: user.employeeProfile?.bankDetails || {},
                guarantorDetails: user.employeeProfile?.guarantorDetails || {}
            },
            attendanceConfig: {
                ...user.attendanceConfig,
                shiftId: extract(user.attendanceConfig?.shiftId),
                shiftGroupId: extract(user.attendanceConfig?.shiftGroupId),
                geoFenceId: extract(user.attendanceConfig?.geoFenceId)
            }
          });
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
          this.onCancel();
        }
      });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.messageService.showWarn('Validation Error: Please check the highlighted fields.');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.userForm.getRawValue();

    if (this.editMode() && !this.showPasswordFields()) {
       delete formValue.password;
       delete formValue.passwordConfirm;
    }

    const req$ = this.editMode() 
      ? this.userService.updateUser(this.userId!, formValue)
      : this.userService.createUser(formValue);

    req$
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          setTimeout(() => this.onCancel(), 500);
        },
        error: (err) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  onCancel() {
    this.router.navigate(['/user/list']);
  }
}

// // import { Component, OnInit, inject, signal } from '@angular/core';
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
// import { ToggleButtonModule } from 'primeng/togglebutton'; // 🟢 Updated Import
// import { InputNumberModule } from 'primeng/inputnumber';
// import { DatePickerModule } from 'primeng/datepicker';
// import { PanelModule } from 'primeng/panel';
// import { DividerModule } from 'primeng/divider';
// import { TabsModule } from 'primeng/tabs';
// import { CardModule } from 'primeng/card';

// // Custom Master Dropdown
// import { UserManagementService } from '../user-management.service';
// import { AppMessageService } from '../../../core/services/message.service';
// import { LoadingService } from '../../../core/services/loading.service';
// import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';

// @Component({
//   selector: 'app-user-form',
//   standalone: true,
//   imports: [ 
//     CommonModule, ReactiveFormsModule, FormsModule, RouterModule, 
//     InputTextModule, ButtonModule, SelectModule, PasswordModule, 
//     ToastModule, ToggleButtonModule, InputNumberModule, DatePickerModule, 
//     PanelModule, DividerModule, TabsModule, CardModule, MasterDropdownComponent 
//   ],
//   templateUrl: './user-form.html',
//   styleUrl: './user-form.scss'
// })
// export class UserFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private userService = inject(UserManagementService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private messageService = inject(AppMessageService);
//   private loadingService = inject(LoadingService);

//   // State
//   userForm!: FormGroup;
//   userId: string | null = null;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   showPasswordFields = signal(false);

//   // Static Data Signals
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
//       isActive: [true],
//       maxConcurrentSessions: [1, [Validators.required, Validators.min(1)]],
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
    
//     this.userService.getUser(id)
//       .pipe(finalize(() => this.loadingService.hide()))
//       .subscribe({
//         next: (res: any) => {
//           const user = res.data?.data || res.data?.user || res.data;
//           if (!user) return;

//           const safeDate = (d: any) => d ? new Date(d) : null;
//           if(user.employeeProfile) {
//               user.employeeProfile.dateOfJoining = safeDate(user.employeeProfile.dateOfJoining);
//               user.employeeProfile.dateOfBirth = safeDate(user.employeeProfile.dateOfBirth);
//           }

//           const extract = (val: any) => (val && typeof val === 'object' && val._id) ? val._id : val;

//           this.userForm.patchValue({
//             ...user,
//             role: extract(user.role),
//             branchId: extract(user.branchId),
//             employeeProfile: {
//                 ...user.employeeProfile,
//                 departmentId: extract(user.employeeProfile?.departmentId),
//                 designationId: extract(user.employeeProfile?.designationId),
//                 reportingManagerId: extract(user.employeeProfile?.reportingManagerId),
//                 bankDetails: user.employeeProfile?.bankDetails || {},
//                 guarantorDetails: user.employeeProfile?.guarantorDetails || {}
//             },
//             attendanceConfig: {
//                 ...user.attendanceConfig,
//                 shiftId: extract(user.attendanceConfig?.shiftId),
//                 geoFenceId: extract(user.attendanceConfig?.geoFenceId)
//             }
//           });
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err);
//           this.onCancel();
//         }
//       });
//   }

//   onSubmit() {
//     if (this.userForm.invalid) {
//       this.userForm.markAllAsTouched();
//       this.messageService.showWarn('Validation Error: Please check the highlighted fields.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = this.userForm.getRawValue();

//     if (this.editMode() && !this.showPasswordFields()) {
//        delete formValue.password;
//        delete formValue.passwordConfirm;
//     }

//     const req$ = this.editMode() 
//       ? this.userService.updateUser(this.userId!, formValue)
//       : this.userService.createUser(formValue);

//     req$
//       .pipe(finalize(() => this.isSubmitting.set(false)))
//       .subscribe({
//         next: () => {
//           setTimeout(() => this.onCancel(), 500);
//         },
//         error: (err) => {
//           this.messageService.handleHttpError(err);
//         }
//       });
//   }

//   onCancel() {
//     this.router.navigate(['/user/list']);
//   }
// }
// import { Component, OnInit, inject, signal } from '@angular/core';
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

// // // 🟢 Custom Master Dropdown

// // // Services (Replace paths with your actual imports)
// // import { UserManagementService } from '../user-management.service';
// // import { AppMessageService } from '../../../core/services/message.service';
// // import { LoadingService } from '../../../core/services/loading.service';
// // import { MasterDropdownComponent } from '../../shared/components/masterFilterDropdown/master-dropdown.component';

// // @Component({
// //   selector: 'app-user-form',
// //   standalone: true,
// //   imports: [ CommonModule,  ReactiveFormsModule,  FormsModule,  RouterModule, InputTextModule,  ButtonModule,  SelectModule,  PasswordModule,  ToastModule,  ToggleSwitchModule,  InputNumberModule,  DatePickerModule,  PanelModule, DividerModule,  TabsModule, CardModule,MasterDropdownComponent  ],
// // templateUrl:'./user-form.html',
// // styleUrl:'./user-form.scss'
// // })
// // export class UserFormComponent implements OnInit {
// //   private fb = inject(FormBuilder);
// //   private userService = inject(UserManagementService);
// //   private router = inject(Router);
// //   private route = inject(ActivatedRoute);
// //   private messageService = inject(AppMessageService);
// //   private loadingService = inject(LoadingService);

// //   // State
// //   userForm!: FormGroup;
// //   userId: string | null = null;
// //   isSubmitting = signal(false);
// //   editMode = signal(false);
// //   showPasswordFields = signal(false);

// //   // Static Data Signals
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
// //       maxConcurrentSessions: [1, [Validators.required, Validators.min(1)]],
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
// //         secondaryPhone: [''], 
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
    
// //     this.userService.getUser(id)
// //       .pipe(finalize(() => this.loadingService.hide()))
// //       .subscribe({
// //         next: (res: any) => {
// //           const user = res.data?.data || res.data?.user || res.data;
// //           if (!user) return;

// //           const safeDate = (d: any) => d ? new Date(d) : null;
// //           if(user.employeeProfile) {
// //               user.employeeProfile.dateOfJoining = safeDate(user.employeeProfile.dateOfJoining);
// //               user.employeeProfile.dateOfBirth = safeDate(user.employeeProfile.dateOfBirth);
// //           }

// //           // Extracts ID for the dropdown components if API returns a populated object
// //           const extract = (val: any) => (val && typeof val === 'object' && val._id) ? val._id : val;

// //           this.userForm.patchValue({
// //             ...user,
// //             role: extract(user.role),
// //             branchId: extract(user.branchId),
// //             employeeProfile: {
// //                 ...user.employeeProfile,
// //                 departmentId: extract(user.employeeProfile?.departmentId),
// //                 designationId: extract(user.employeeProfile?.designationId),
// //                 reportingManagerId: extract(user.employeeProfile?.reportingManagerId),
// //                 bankDetails: user.employeeProfile?.bankDetails || {},
// //                 guarantorDetails: user.employeeProfile?.guarantorDetails || {}
// //             },
// //             attendanceConfig: {
// //                 ...user.attendanceConfig,
// //                 shiftId: extract(user.attendanceConfig?.shiftId),
// //                 geoFenceId: extract(user.attendanceConfig?.geoFenceId)
// //             }
// //           });
// //         },
// //         error: (err) => {
// //           // Routed to your global HTTP error handler
// //           this.messageService.handleHttpError(err);
// //           this.onCancel();
// //         }
// //       });
// //   }

// //   onSubmit() {
// //     if (this.userForm.invalid) {
// //       this.userForm.markAllAsTouched();
// //       // Converted to single-string warning format
// //       this.messageService.showWarn('Validation Error: Please check the highlighted fields.');
// //       return;
// //     }

// //     this.isSubmitting.set(true);
// //     const formValue = this.userForm.getRawValue();

// //     // Safely strip password fields if they aren't being updated
// //     if (this.editMode() && !this.showPasswordFields()) {
// //        delete formValue.password;
// //        delete formValue.passwordConfirm;
// //     }

// //     const req$ = this.editMode() 
// //       ? this.userService.updateUser(this.userId!, formValue)
// //       : this.userService.createUser(formValue);

// //     req$
// //       .pipe(finalize(() => this.isSubmitting.set(false)))
// //       .subscribe({
// //         next: () => {
// //           setTimeout(() => this.onCancel(), 500);
// //         },
// //         error: (err) => {
// //           // Delegated to global HTTP error handler
// //           this.messageService.handleHttpError(err);
// //         }
// //       });
// //   }

// //   onCancel() {
// //     this.router.navigate(['/user/list']);
// //   }

// // }
