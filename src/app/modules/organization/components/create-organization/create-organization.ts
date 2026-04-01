import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
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
    PasswordModule,
    StepperModule,
    ButtonModule
  ],
  providers: [AppMessageService],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss'
})
export class CreateOrganizationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(AppMessageService);
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);
  private masterList = inject(MasterListService);

  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  passwordVisible = signal(false);
  focusedField = signal<string | null>(null);

  organizationForm!: FormGroup;

  // Multi-step: 3 sections, track which is active for progress indicator
  activeSection: any = signal(0);
  readonly sections = ['Organization', 'Location', 'Admin'];

  ngOnInit(): void { this.initForm(); }

  private initForm(): void {
    this.organizationForm = this.fb.group({
      organizationName: ['', [Validators.required, Validators.minLength(3)]],
      uniqueShopId: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      primaryEmail: ['', [Validators.required, Validators.email]],
      primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
      gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i)]],
      mainBranchName: ['Head Office', [Validators.required]],
      mainBranchAddress: this.fb.group({
        street: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        zipCode: ['', Validators.required],
      }),
      ownerName: ['', Validators.required],
      ownerEmail: ['', [Validators.required, Validators.email]],
      ownerPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get f() { return this.organizationForm.controls; }
  get branch() { return (this.organizationForm.get('mainBranchAddress') as FormGroup).controls; }

  onFocus(field: string) { this.focusedField.set(field); this.highlightSection(field); }
  onBlur() { this.focusedField.set(null); }

  private highlightSection(field: string) {
    const section1 = ['organizationName', 'uniqueShopId', 'primaryEmail', 'primaryPhone', 'gstNumber'];
    const section2 = ['mainBranchName', 'street', 'city', 'state', 'zipCode'];
    if (section1.includes(field)) this.activeSection.set(0);
    else if (section2.includes(field)) this.activeSection.set(1);
    else this.activeSection.set(2);
  }

  generateShopId(): void {
    const name = this.f['organizationName'].value;
    const currentId = this.f['uniqueShopId'].value;
    if (name && !currentId) {
      const generated = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
      this.organizationForm.patchValue({ uniqueShopId: generated });
    }
  }

  togglePassword(): void { this.passwordVisible.update(v => !v); }

  // Password strength (reused from signup pattern)
  get passwordStrength(): number {
    const val: string = this.f['ownerPassword'].value || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    return score;
  }
  get strengthLabel() { return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength]; }
  get strengthClass() { return ['', 'weak', 'fair', 'good', 'strong'][this.passwordStrength]; }

  onSubmit(): void {
    if (this.organizationForm.invalid) {
      this.organizationForm.markAllAsTouched();
      this.messageService.showWarn('Please check all required fields.');
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload = { ...this.organizationForm.value };
    payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
    if (payload.gstNumber) payload.gstNumber = payload.gstNumber.toUpperCase();

    this.orgService.createNewOrganization(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: any) => {
          const msg = 'Organization created! Logging you in…';
          this.successMessage.set(msg);
          this.messageService.showSuccess(msg);
          if (res.token) {
            this.authService.handleLoginSuccess(res);
            this.masterList.load();
            setTimeout(() => this.router.navigate(['/dashboard']), 1000);
          } else {
            this.router.navigate(['/auth/login']);
          }
        },
        error: (err: any) => {
          const msg = err.error?.message || 'Failed to create organization. Please try again.';
          this.errorMessage.set(msg);
          this.messageService.handleHttpError(err);
        },
      });
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { finalize } from 'rxjs/operators';

// // PrimeNG
// import { ToastModule } from 'primeng/toast';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { PasswordModule } from 'primeng/password';
// import { MessageService } from 'primeng/api';
// import { DividerModule } from 'primeng/divider';
// import { TooltipModule } from 'primeng/tooltip';

// // Services
// import { AuthService } from '../../../auth/services/auth-service';
// import { OrganizationService } from '../../organization.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AppMessageService } from '../../../../core/services/message.service';

// @Component({
//   selector: 'app-create-organization',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     ToastModule,
//     InputTextModule,
//     ButtonModule,
//     PasswordModule,
//     DividerModule,
//     TooltipModule
//   ],
//   providers: [MessageService],
//   templateUrl: './create-organization.html',
//   styleUrl: './create-organization.scss'
// })
// export class CreateOrganizationComponent implements OnInit {
//   // --- Dependencies ---
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//   private messageService = inject(AppMessageService);
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
//   this.organizationForm = this.fb.group({
//     organizationName: ['', [Validators.required, Validators.minLength(3)]],
//     // FIX 1: Add lowercase 'a-z' to the pattern
//     uniqueShopId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/), Validators.minLength(3)]],
//     primaryEmail: ['', [Validators.required, Validators.email]],
//     primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
//     // FIX 2:  the 'i' flag at the end of the regex to make it case-insensitive
//     gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i)]],
//     mainBranchName: ['Head Office', [Validators.required]],
//     mainBranchAddress: this.fb.group({
//       street: ['', Validators.required],
//       city: ['', Validators.required],
//       state: ['', Validators.required],
//       zipCode: ['', Validators.required],
//     }),
//     ownerName: ['', [Validators.required]],
//     ownerEmail: ['', [Validators.required, Validators.email]],
//     // NOTE: Keep in mind this requires exactly 8 or more characters!
//     ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
//   });
// }

//   // private initForm(): void {
//   //   this.organizationForm = this.fb.group({
//   //     organizationName: ['', [Validators.required, Validators.minLength(3)]],
//   //     uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/), Validators.minLength(3)]],
//   //     primaryEmail: ['', [Validators.required, Validators.email]],
//   //     primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]+$/)]],
//   //     gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
//   //     mainBranchName: ['Head Office', [Validators.required]],
//   //     mainBranchAddress: this.fb.group({
//   //       street: ['', Validators.required],
//   //       city: ['', Validators.required],
//   //       state: ['', Validators.required],
//   //       zipCode: ['', Validators.required],
//   //     }),
//   //     ownerName: ['', [Validators.required]],
//   //     ownerEmail: ['', [Validators.required, Validators.email]],
//   //     ownerPassword: ['', [Validators.required, Validators.minLength(8)]]
//   //   });
//   // }

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