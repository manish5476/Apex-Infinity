import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

// Services
import { MasterListService } from '../../../core/services/master-list.service';
import { UserManagementService } from '../user-management.service';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    InputTextModule, ButtonModule, SelectModule, 
    PasswordModule, DividerModule, ToastModule, ToggleSwitchModule
  ],
  providers: [MessageService],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss'
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserManagementService);
  public masterList = inject(MasterListService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  userForm!: FormGroup;
  isSubmitting = signal(false);
  editMode = signal(false);
  userId: string | null = null;
  showPasswordFields = signal(false); // Signal to toggle password section

  roles = this.masterList.roles; 
  branches = this.masterList.branches;

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
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: [null, [Validators.required]], 
      branchId: [null], 
      isActive: [true], 
      password: [''], 
      passwordConfirm: ['']
    }, { validators: this.passwordMatchValidator });
  }

  private setupCreateMode() {
    this.showPasswordFields.set(true);
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
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
          this.userForm.patchValue({
            name: user.name,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            role: user.role?._id || user.role, 
            branchId: user.branchId?._id || user.branchId
          });
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
      return;
    }

    this.isSubmitting.set(true);
    const formValue = { ...this.userForm.value };

    if (this.editMode() && !this.showPasswordFields()) {
      delete formValue.password;
      delete formValue.passwordConfirm;
    }

    const request$ = this.editMode()
      ? this.userService.updateUser(this.userId!, formValue)
      : this.userService.createUser(formValue);

    request$.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User saved!' });
        setTimeout(() => this.onCancel(), 1000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message });
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


// // PrimeNG Modules
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { SelectModule } from 'primeng/select';
// import { PasswordModule } from 'primeng/password';
// import { DividerModule } from 'primeng/divider';
// import { ToastModule } from 'primeng/toast';
// import { ToggleSwitchModule } from 'primeng/toggleswitch';
// import { MasterListService } from '../../../core/services/master-list.service';
// import { UserManagementService } from '../user-management.service';

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
//   // --- Services ---
//   private fb = inject(FormBuilder);
//   private userService = inject(UserManagementService);
//   public masterList = inject(MasterListService); // Public for template signals
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);
//   private messageService = inject(MessageService);

//   // --- State ---
//   userForm!: FormGroup;
//   isSubmitting = signal(false);
//   editMode = signal(false);
//   userId: string | null = null;

//   // Dropdown Signals (Safe Access)
//   roles = this.masterList.roles; 
//   branches = this.masterList.branches;

//   ngOnInit() {
//     this.initForm();
    
//     // Check for Edit Mode
//     this.userId = this.route.snapshot.paramMap.get('id');
//     if (this.userId) {
//       this.editMode.set(true);
//       this.loadUserData(this.userId);
//     }
//   }

//   private initForm() {
//     this.userForm = this.fb.group({
//       // --- Identity ---
//       name: ['', [Validators.required, Validators.minLength(3)]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: [''],
      
//       // --- Access Control (ObjectIds) ---
//       role: [null, [Validators.required]], 
//       branchId: [null], 
      
//       // --- Status & Preferences ---
//       isActive: [true], 
      
//       // --- Security (Conditional Validators added later) ---
//       password: [''], 
//       passwordConfirm: ['']
//     }, { validators: this.passwordMatchValidator });

//     // Enforce password requirements only in Create Mode
//     if (!this.userId) {
//       this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
//       this.userForm.get('passwordConfirm')?.setValidators([Validators.required]);
//     }
//   }

//   // Custom Validator
//   private passwordMatchValidator(group: FormGroup) {
//     const password = group.get('password')?.value;
//     const confirm = group.get('passwordConfirm')?.value;
//     return password === confirm ? null : { mismatch: true };
//   }

//   // --- Load Data for Edit ---
//   private loadUserData(id: string) {
//     this.userService.getUser(id).subscribe({
//       next: (res) => {
//         // Handle nested data structure: res.data.user OR res.data.data
//         const user = res.data?.user || res.data?.data || res.data;
        
//         if (user) {
//           this.userForm.patchValue({
//             name: user.name,
//             email: user.email,
//             phone: user.phone,
//             isActive: user.isActive,
//             // Handle populated objects vs raw IDs
//             role: user.role?._id || user.role, 
//             branchId: user.branchId?._id || user.branchId
//           });
          
//           // Remove password validators in Edit Mode (unless user wants to change it)
//           this.userForm.get('password')?.clearValidators();
//           this.userForm.get('passwordConfirm')?.clearValidators();
//           this.userForm.get('password')?.updateValueAndValidity();
//           this.userForm.get('passwordConfirm')?.updateValueAndValidity();
//         }
//       },
//       error: (err) => {
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load user data.' });
//         this.onCancel();
//       }
//     });
//   }

//   // --- Submit ---
//   onSubmit() {
//     if (this.userForm.invalid) {
//       this.userForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const formValue = this.userForm.value;

//     // Clean payload: Remove password if empty in Edit mode
//     if (this.editMode() && !formValue.password) {
//       delete formValue.password;
//       delete formValue.passwordConfirm;
//     }

//     const request$ = this.editMode()
//       ? this.userService.updateUser(this.userId!, formValue)
//       : this.userService.createUser(formValue);

//     request$.subscribe({
//       next: () => {
//         this.messageService.add({ 
//           severity: 'success', 
//           summary: 'Success', 
//           detail: `User ${this.editMode() ? 'updated' : 'created'} successfully!` 
//         });
//         setTimeout(() => this.onCancel(), 1000);
//       },
//       error: (err) => {
//         this.isSubmitting.set(false);
//         this.messageService.add({ 
//           severity: 'error', 
//           summary: 'Error', 
//           detail: err.error?.message || 'Operation failed.' 
//         });
//       }
//     });
//   }

//   onCancel() {
//     this.router.navigate(['/user/list']);
//   }
// }