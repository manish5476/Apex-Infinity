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
  private messageService = inject(MessageService);
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);
  private masterList = inject(MasterListService);

  // --- State ---
  isLoading = signal(false);
  organizationForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.organizationForm = this.fb.group({
      // 1. Organization Details
      organizationName: ['', [Validators.required, Validators.minLength(3)]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/), Validators.minLength(3)]],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]], // Basic GST regex

      // 2. Main Branch Details
      mainBranchName: ['Head Office', [Validators.required]],
      mainBranchAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
      }),

      // 3. Super Admin (Owner) Credentials
      ownerName: ['', [Validators.required]],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Helper for template
  get f() { return this.organizationForm.controls; }
  get branch() { return (this.organizationForm.get('mainBranchAddress') as FormGroup).controls; }

  // Auto-generate Shop ID from Name if empty
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Form',
        detail: 'Please check all required fields highlighted in red.'
      });
      return;
    }

    this.isLoading.set(true);
    const payload = this.organizationForm.value;

    // Ensure uppercase consistency
    payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
    if (payload.gstNumber) payload.gstNumber = payload.gstNumber.toUpperCase();

    this.organizationService.createNewOrganization(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Organization Created',
            detail: 'Setup complete. Logging you in...'
          });

          // Handle auto-login if token returned
          if (response.token) {
            this.authService.handleLoginSuccess(response);
            this.masterList.load(); // Refresh master data
            setTimeout(() => this.router.navigate(['/admin/dashboard']), 1000);
          } else {
            this.router.navigate(['/auth/login']);
          }
        },
        error: (err: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Setup Failed',
            detail: err.error?.message || 'Could not create organization.'
          });
        }
      });
  }
}

// import { Component, Inject, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterLink } from '@angular/router';
// import { MessageService } from 'primeng/api';
// import { ToastModule } from 'primeng/toast';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { PasswordModule } from 'primeng/password';
// import { AuthService, LoginResponse } from '../../../auth/services/auth-service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { OrganizationService } from '../../organization.service';

// @Component({
//   selector: 'app-create-organization',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     ToastModule,
//     InputTextModule,
//     ButtonModule,
//     PasswordModule,
//     RouterLink
//   ],
//   templateUrl: './create-organization.html', // Ensure filename matches
//   styleUrl: './create-organization.scss',     // Ensure filename matches
//   providers: [MessageService]
// })
// export class CreateOrganization implements OnInit {
//   // --- Injections ---
//   private fb = inject(FormBuilder);
//   private OrganizationService = inject(OrganizationService);
//   private router = inject(Router);
//   private messageService = inject(MessageService);
//   private authService = inject(AuthService);
//   private masterList = inject(MasterListService);

//   // --- State ---
//   isLoading = signal(false);
//   organizationForm!: FormGroup;
//   isBrowser: boolean;

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {
//     this.isBrowser = isPlatformBrowser(this.platformId);
//   }

//   ngOnInit(): void {
//     this.initForm();
//   }

//   private initForm(): void {
//     this.organizationForm = this.fb.group({
//       // Org
//       organizationName: ['', [Validators.required]],
//       uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
//       primaryEmail: ['', [Validators.required, Validators.email]],
//       primaryPhone: ['', [Validators.required]],
//       gstNumber: [''],
      
//       // Owner
//       ownerName: ['', [Validators.required]],
//       ownerEmail: ['', [Validators.required, Validators.email]],
//       ownerPassword: ['', [Validators.required, Validators.minLength(8)]],

//       // Branch
//       mainBranchName: ['Main Branch', [Validators.required]],
//       mainBranchAddress: this.fb.group({
//         street: ['', Validators.required],
//         city: ['', Validators.required],
//         state: ['', Validators.required],
//         zipCode: ['', Validators.required],
//       })
//     });
//   }

//   get form() { return this.organizationForm.controls; }

//   onSubmit(): void {
//     if (this.organizationForm.invalid) {
//       this.organizationForm.markAllAsTouched();
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Invalid Form',
//         detail: 'Please fill in all required fields.'
//       });
//       return;
//     }

//     this.isLoading.set(true);
//     const formData = this.organizationForm.value;

//     // Format Data
//     formData.uniqueShopId = formData.uniqueShopId.toUpperCase();
//     if (formData.gstNumber) formData.gstNumber = formData.gstNumber.toUpperCase();

//     this.OrganizationService.createNewOrganization(formData).subscribe({
//       next: (response: LoginResponse) => {
//         this.isLoading.set(false);
//         this.messageService.add({
//           severity: 'success',
//           summary: 'Success',
//           detail: `Organization created! Welcome, ${response?.data.owner || 'User'}.`
//         });
        
//         // Refresh app state
//         this.masterList.load(); 
//         this.authService.handleLoginSuccess(response);
//       },
//       error: (err: any) => {
//         this.isLoading.set(false);
//         this.messageService.add({
//           severity: 'error',
//           summary: 'Creation Failed',
//           detail: err.error?.message || 'Server error occurred.'
//         });
//       }
//     });
//   }
// }

