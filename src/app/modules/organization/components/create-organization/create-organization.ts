import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

// Services
import { AuthService } from '../../../auth/services/auth-service';
import { OrganizationService } from '../../organization.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    DividerModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss'
})
export class CreateOrganizationComponent implements OnInit {
  // --- Dependencies ---
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(AppMessageService); 
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);
  private masterList = inject(MasterListService);

  // --- State ---
  isLoading = signal(false);
  organizationForm!: FormGroup;
  passwordVisible = signal(false);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
  this.organizationForm = this.fb.group({
    organizationName: ['', [Validators.required, Validators.minLength(3)]],
    // FIX 1: Add lowercase 'a-z' to the pattern
    uniqueShopId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/), Validators.minLength(3)]],
    primaryEmail: ['', [Validators.required, Validators.email]],
    primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
    // FIX 2:  the 'i' flag at the end of the regex to make it case-insensitive
    gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i)]],
    mainBranchName: ['Head Office', [Validators.required]],
    mainBranchAddress: this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
    }),
    ownerName: ['', [Validators.required]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    // NOTE: Keep in mind this requires exactly 8 or more characters!
    ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
  });
}

  // private initForm(): void {
  //   this.organizationForm = this.fb.group({
  //     organizationName: ['', [Validators.required, Validators.minLength(3)]],
  //     uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/), Validators.minLength(3)]],
  //     primaryEmail: ['', [Validators.required, Validators.email]],
  //     primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
  //     gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
  //     mainBranchName: ['Head Office', [Validators.required]],
  //     mainBranchAddress: this.fb.group({
  //       street: ['', Validators.required],
  //       city: ['', Validators.required],
  //       state: ['', Validators.required],
  //       zipCode: ['', Validators.required],
  //     }),
  //     ownerName: ['', [Validators.required]],
  //     ownerEmail: ['', [Validators.required, Validators.email]],
  //     ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
  //   });
  // }

  get f() { return this.organizationForm.controls; }
  get branch() { return (this.organizationForm.get('mainBranchAddress') as FormGroup).controls; }

  generateShopId() {
    const name = this.organizationForm.get('organizationName')?.value;
    const currentId = this.organizationForm.get('uniqueShopId')?.value;
    if (name && !currentId) {
      const generated = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
      this.organizationForm.patchValue({ uniqueShopId: generated });
    }
  }

  onSubmit(): void {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form: Please check all required fields highlighted in red.');
      return;
    }

    this.isLoading.set(true); 
    const payload = this.organizationForm.value;
    payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
    if (payload.gstNumber) payload.gstNumber = payload.gstNumber.toUpperCase();

    this.organizationService.createNewOrganization(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.showSuccess('Organization setup complete. Logging you in...');
          if (response.token) {
            this.authService.handleLoginSuccess(response);
            this.masterList.load();
            setTimeout(() => this.router.navigate(['/dashboard']), 1000);
          } else {
            this.router.navigate(['/auth/login']);
          }
        },
        error: (err: any) => {
          this.messageService.handleHttpError(err);
        }
      });
  }

  togglePassword() {
    this.passwordVisible.update(v => !v);
  }
}



// export class CreateOrganizationComponent implements OnInit {
//   // --- Dependencies ---
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//     private messageService = inject(AppMessageService); 
//   private organizationService = inject(OrganizationService);
//   private authService = inject(AuthService);
//   private masterList = inject(MasterListService);

//   // --- State ---
//   isLoading = signal(false);
//   organizationForm!: FormGroup;
//   passwordVisible = signal(false);

//   ngOnInit(): void {
//     this.initForm();
//   }

//   private initForm(): void {
//     this.organizationForm = this.fb.group({
//       organizationName: ['', [Validators.required, Validators.minLength(3)]],
//       uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/), Validators.minLength(3)]],
//       primaryEmail: ['', [Validators.required, Validators.email]],
//       primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
//       gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
//       mainBranchName: ['Head Office', [Validators.required]],
//       mainBranchAddress: this.fb.group({
//         street: ['', Validators.required],
//         city: ['', Validators.required],
//         state: ['', Validators.required],
//         zipCode: ['', Validators.required],
//       }),

//       // 3. Super Admin (Owner) Credentials
//       ownerName: ['', [Validators.required]],
//       ownerEmail: ['', [Validators.required, Validators.email]],
//       ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
//     });
//   }
//   get f() { return this.organizationForm.controls; }
//   get branch() { return (this.organizationForm.get('mainBranchAddress') as FormGroup).controls; }
//   generateShopId() {
//     const name = this.organizationForm.get('organizationName')?.value;
//     const currentId = this.organizationForm.get('uniqueShopId')?.value;
//     if (name && !currentId) {
//       const generated = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
//       this.organizationForm.patchValue({ uniqueShopId: generated });
//     }
//   }

//   onSubmit(): void {
//     if (this.organizationForm.invalid) {
//       this.organizationForm.markAllAsTouched();
//       this.messageService.showWarn('Invalid Form: Please check all required fields highlighted in red.');
//       return;
//     }

//     this.isLoading.set(true); 
//     const payload = this.organizationForm.value;
//     payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
//     if (payload.gstNumber) payload.gstNumber = payload.gstNumber.toUpperCase();
//     this.organizationService.createNewOrganization(payload)
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (response: any) => {
//           this.messageService.showSuccess('Organization setup complete. Logging you in...');
//           if (response.token) {
//             this.authService.handleLoginSuccess(response);
//             this.masterList.load();
//             setTimeout(() => this.router.navigate(['/dashboard']), 1000);
//           } else {
//             this.router.navigate(['/auth/login']);
//           }
//         },
//         error: (err: any) => {
//           this.messageService.handleHttpError(err);
//         }
//       });
//   }

//   togglePassword() {
//     this.passwordVisible.update(v => !v);
//   }
// }

// export class CreateOrganizationComponent implements OnInit {
//   // --- Dependencies ---
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//   private messageService = inject(MessageService);
//   private organizationService = inject(OrganizationService);
//   private authService = inject(AuthService);
//   private masterList = inject(MasterListService);

//   // --- State ---
//   isLoading = signal(false);
//   organizationForm!: FormGroup;

//   ngOnInit(): void {
//     this.initForm();
//   }

//   private initForm(): void {
//     this.organizationForm = this.fb.group({
//       // 1. Organization Details
//       organizationName: ['', [Validators.required, Validators.minLength(3)]],
//       uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/), Validators.minLength(3)]],
//       primaryEmail: ['', [Validators.required, Validators.email]],
//       primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
//       gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]], // Basic GST regex

//       // 2. Main Branch Details
//       mainBranchName: ['Head Office', [Validators.required]],
//       mainBranchAddress: this.fb.group({
//         street: ['', Validators.required],
//         city: ['', Validators.required],
//         state: ['', Validators.required],
//         zipCode: ['', Validators.required],
//       }),

//       // 3. Super Admin (Owner) Credentials
//       ownerName: ['', [Validators.required]],
//       ownerEmail: ['', [Validators.required, Validators.email]],
//       ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
//     });
//   }

//   // Helper for template
//   get f() { return this.organizationForm.controls; }
//   get branch() { return (this.organizationForm.get('mainBranchAddress') as FormGroup).controls; }

//   // Auto-generate Shop ID from Name if empty
//   generateShopId() {
//     const name = this.organizationForm.get('organizationName')?.value;
//     const currentId = this.organizationForm.get('uniqueShopId')?.value;
    
//     if (name && !currentId) {
//       const generated = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
//       this.organizationForm.patchValue({ uniqueShopId: generated });
//     }
//   }

//   onSubmit(): void {
//     if (this.organizationForm.invalid) {
//       this.organizationForm.markAllAsTouched();
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Invalid Form',
//         detail: 'Please check all required fields highlighted in red.'
//       });
//       return;
//     }

//      // this.isLoading.set(true);
//     const payload = this.organizationForm.value;

//     // Ensure uppercase consistency
//     payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
//     if (payload.gstNumber) payload.gstNumber = payload.gstNumber.toUpperCase();

//     this.organizationService.createNewOrganization(payload)
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe({
//         next: (response: any) => {
//           this.messageService.add({
//             severity: 'success',
//             summary: 'Organization Created',
//             detail: 'Setup complete. Logging you in...'
//           });

//           // Handle auto-login if token returned
//           if (response.token) {
//             this.authService.handleLoginSuccess(response);
//             this.masterList.load();
//             setTimeout(() => this.router.navigate(['/dashboard']), 1000);
//           } else {
//             this.router.navigate(['/auth/login']);
//           }
//         },
//         error: (err: any) => {
//           this.messageService.add({
//             severity: 'error',
//             summary: 'Setup Failed',
//             detail: err.error?.message || 'Could not create organization.'
//           });
//         }
//       });
//   }

    
//   // Simple toast state
//   toastMessage = signal('');
//   toastTitle = signal('');
//   toastType = signal<'success' | 'error'>('success');
//   passwordVisible = signal(false);


//   showToast(type: 'success' | 'error', title: string, message: string) {
//       this.toastType.set(type);
//       this.toastTitle.set(title);
//       this.toastMessage.set(message);
      
//       // Auto hide after 3 seconds
//       setTimeout(() => {
//           this.clearToast();
//       }, 3000);
//   }
//     clearToast() {
//       this.toastMessage.set('');
//   }

//    togglePassword() {
//       this.passwordVisible.update(v => !v);
//   }
// }