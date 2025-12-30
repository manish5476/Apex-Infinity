import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

// Services
import { MasterListService } from '../../../core/services/master-list.service';
import { UserManagementService } from '../user-management.service';
import { ShiftService } from '../../attendance/services/shift.service'; // Ensure this path is correct

// PrimeNG Modules
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber'; // Required for Radius input

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    InputTextModule, ButtonModule, SelectModule, 
    PasswordModule, DividerModule, ToastModule, ToggleSwitchModule, InputNumberModule
  ],
  providers: [MessageService],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserFormComponent implements OnInit {
  // Dependency Injection
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  public masterList = inject(MasterListService);
  private shiftService = inject(ShiftService); // Inject Shift Service
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  // State Signals
  isSubmitting = signal(false);
  editMode = signal(false);
  showPasswordFields = signal(false);
  shifts = signal<any[]>([]); // Store shifts list

  // Form & Data
  userForm!: FormGroup;
  userId: string | null = null;
  roles = this.masterList.roles; 
  branches = this.masterList.branches;

  ngOnInit() {
    this.initForm();
    this.loadShifts(); // Fetch available shifts
    
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
      // --- Identity ---
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      
      // --- Access ---
      role: [null, [Validators.required]], 
      branchId: [null], 
      isActive: [true], 
      
      // --- Security ---
      password: [''], 
      passwordConfirm: [''],

      // --- 🟢 NEW: Attendance Configuration ---
      attendanceConfig: this.fb.group({
        isAttendanceEnabled: [true],
        shiftId: [null], // Validator added dynamically
        machineUserId: [''], 
        allowWebPunch: [false],
        allowMobilePunch: [false],
        enforceGeoFence: [true],
        geoFenceRadius: [100] // Default 100 meters
      })
    }, { validators: this.passwordMatchValidator });

    // Dynamic Validation: Shift is required ONLY if Attendance is Enabled
    this.userForm.get('attendanceConfig.isAttendanceEnabled')?.valueChanges.subscribe(enabled => {
      const shiftControl = this.userForm.get('attendanceConfig.shiftId');
      if (enabled) {
        shiftControl?.setValidators([Validators.required]);
      } else {
        shiftControl?.clearValidators();
      }
      shiftControl?.updateValueAndValidity();
    });
  }

  private loadShifts() {
    this.shiftService.getAllShifts().subscribe({
      next: (res) => this.shifts.set(res.data || []),
      error: () => console.warn('Could not load shifts') // Non-blocking error
    });
  }

  private setupCreateMode() {
    this.showPasswordFields.set(true);
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
    
    // Set default validation for shift
    this.userForm.get('attendanceConfig.shiftId')?.setValidators([Validators.required]);
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('passwordConfirm')?.value;
    if (!password && !confirm) return null;
    return password === confirm ? null : { mismatch: true };
  }

  togglePasswordChange() {
    const isShowing = this.showPasswordFields();
    this.showPasswordFields.set(!isShowing);
    
    const passCtrl = this.userForm.get('password');
    const confirmCtrl = this.userForm.get('passwordConfirm');

    if (!isShowing) {
      passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
      confirmCtrl?.setValidators([Validators.required]);
    } else {
      passCtrl?.clearValidators();
      confirmCtrl?.clearValidators();
      this.userForm.patchValue({ password: '', passwordConfirm: '' });
    }
    passCtrl?.updateValueAndValidity();
    confirmCtrl?.updateValueAndValidity();
  }

  private loadUserData(id: string) {
    this.userService.getUser(id).subscribe({
      next: (res) => {
        const user = res.data?.user || res.data?.data || res.data;
        if (user) {
          // Patch Top Level Fields
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            role: user.role?._id || user.role, 
            branchId: user.branchId?._id || user.branchId
          });

          // Patch Attendance Config
          if (user.attendanceConfig) {
            this.userForm.get('attendanceConfig')?.patchValue({
              isAttendanceEnabled: user.attendanceConfig.isAttendanceEnabled,
              shiftId: user.attendanceConfig.shiftId?._id || user.attendanceConfig.shiftId,
              machineUserId: user.attendanceConfig.machineUserId,
              allowWebPunch: user.attendanceConfig.allowWebPunch,
              allowMobilePunch: user.attendanceConfig.allowMobilePunch,
              enforceGeoFence: user.attendanceConfig.enforceGeoFence,
              geoFenceRadius: user.attendanceConfig.geoFenceRadius
            });
          }
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'User not found.' });
        this.onCancel();
      }
    });
  }

  onSubmit() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Invalid Form', detail: 'Please fill all required fields.' });
      return;
    }

    this.isSubmitting.set(true);
    const formValue = { ...this.userForm.value };

    // Clean up password fields if not changing
    if (this.editMode() && !this.showPasswordFields()) {
      delete formValue.password;
      delete formValue.passwordConfirm;
    }

    // Prepare API Call
    const request$ = this.editMode()
      ? this.userService.updateUser(this.userId!, formValue)
      : this.userService.createUser(formValue);

    request$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User saved successfully!' });
        setTimeout(() => this.onCancel(), 1000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Save failed' });
      }
    });
  }

  onCancel() {
    this.router.navigate(['/user/list']);
  }
}







// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { MessageService } from 'primeng/api';

// // Services
// import { MasterListService } from '../../../core/services/master-list.service';
// import { UserManagementService } from '../user-management.service';

// // PrimeNG
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { PasswordModule } from 'primeng/password';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';

// @Component({
//   selector: 'app-user-form',
//   standalone: true,
//   imports: [
//     CommonModule, ReactiveFormsModule, RouterModule,
//     InputTextModule, ButtonModule, SelectModule, 
//     PasswordModule, DividerModule, ToastModule, ToggleSwitchModule
//   ],
//   providers: [MessageService],
//   templateUrl: './user-form.html',
//   styleUrl: './user-form.scss'
// })
// export class UserFormComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private userService = inject(UserManagementService);
//   public masterList = inject(MasterListService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private messageService = inject(MessageService);

//   userForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   userId: string | null = null;
//   showPasswordFields = signal(false); // Signal to toggle password section

//   roles = this.masterList.roles; 
//   branches = this.masterList.branches;

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
//       name: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: [''],
//       role: [null, [Validators.required]], 
//       branchId: [null], 
//       isActive: [true], 
//       password: [''], 
//       passwordConfirm: ['']
//     }, { validators: this.passwordMatchValidator });
//   }

//   private setupCreateMode() {
//     this.showPasswordFields.set(true);
//     this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
//     this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
//   }

//   private passwordMatchValidator(group: FormGroup) {
//     const password = group.get('password')?.value;
//     const confirm = group.get('passwordConfirm')?.value;
//     if (!password && !confirm) return null;
//     return password === confirm ? null : { mismatch: true };
//   }

//   togglePasswordChange() {
//     const isShowing = this.showPasswordFields();
//     this.showPasswordFields.set(!isShowing);
    
//     const passCtrl = this.userForm.get('password');
//     const confirmCtrl = this.userForm.get('passwordConfirm');

//     if (!isShowing) {
//       passCtrl?.setValidators([Validators.required, Validators.minLength(8)]);
//       confirmCtrl?.setValidators([Validators.required]);
//     } else {
//       passCtrl?.clearValidators();
//       confirmCtrl?.clearValidators();
//       this.userForm.patchValue({ password: '', passwordConfirm: '' });
//     }
//     passCtrl?.updateValueAndValidity();
//     confirmCtrl?.updateValueAndValidity();
//   }

//   private loadUserData(id: string) {
//     this.userService.getUser(id).subscribe({
//       next: (res) => {
//         const user = res.data?.user || res.data?.data || res.data;
//         if (user) {
//           this.userForm.patchValue({
//             name: user.name,
//             email: user.email,
//             phone: user.phone,
//             isActive: user.isActive,
//             role: user.role?._id || user.role, 
//             branchId: user.branchId?._id || user.branchId
//           });
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
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = { ...this.userForm.value };

//     if (this.editMode() && !this.showPasswordFields()) {
//       delete formValue.password;
//       delete formValue.passwordConfirm;
//     }

//     const request$ = this.editMode()
//       ? this.userService.updateUser(this.userId!, formValue)
//       : this.userService.createUser(formValue);

//     request$.subscribe({
//       next: () => {
//         this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User saved!' });
//         setTimeout(() => this.onCancel(), 1000);
//       },
//       error: (err) => {
//         this.isSubmitting.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message });
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/user/list']);
//   }
// }
