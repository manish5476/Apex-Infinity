import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    PasswordModule,
    CheckboxModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  providers: [AppMessageService]
})
export class Signup implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  focusedField = signal<string | null>(null);
  // Track current step for the multi-step progress indicator
  currentStep = signal(1);
  totalSteps = 2;

  signupForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.signupForm = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      uniqueShopId:    ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      password:        ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
      terms:           [false, [Validators.requiredTrue]],
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    });
  }

  get f() { return this.signupForm.controls; }

  onFocus(field: string): void  { this.focusedField.set(field); }
  onBlur():  void               { this.focusedField.set(null); }

  // Password strength helpers for the inline strength bar
  get passwordStrength(): number {
    const val: string = this.f['password'].value || '';
    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    return score; // 0–4
  }

  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength];
  }

  get strengthClass(): string {
    return ['', 'weak', 'fair', 'good', 'strong'][this.passwordStrength];
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.messageService.showWarn('Please fill out all fields correctly.');
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const { passwordConfirm, terms, ...payload } = this.signupForm.value;
    if (payload.uniqueShopId) {
      payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
    }

    this.authService.employeeSignup(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        const msg = 'Account created! Welcome to Apex.';
        this.successMessage.set(msg);
        this.messageService.showSuccess(msg);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Failed to create account. Please try again.';
        this.errorMessage.set(msg);
        this.messageService.handleHttpError(err);
      }
    });
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { MessageService } from 'primeng/api';
// import { ToastModule } from 'primeng/toast';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { PasswordModule } from 'primeng/password';
// import { AuthService } from '../../services/auth-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

// @Component({
//   selector: 'app-signup',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     ToastModule,
//     InputTextModule,
//     ButtonModule,
//     PasswordModule
//   ],
//   templateUrl: './signup.html',
//   styleUrl: './signup.scss',
//   providers: [MessageService, AppMessageService]
// })
// export class Signup implements OnInit {
//   // --- Injections ---
//   private fb = inject(FormBuilder);
//   private authService = inject(AuthService);
//   private router = inject(Router);
//   private messageService = inject(AppMessageService);

//   // --- State Signals ---
//   isLoading = signal(false);

//   // --- Forms ---
//   signupForm!: FormGroup;

//   ngOnInit(): void {
//     this.initForm();
//   }

//   private initForm(): void {
//     this.signupForm = this.fb.group({
//       name: ['', [Validators.required]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: ['', [Validators.required]],
//       uniqueShopId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
//       password: ['', [Validators.required, Validators.minLength(8)]],
//       passwordConfirm: ['', [Validators.required]],
//     }, {
//       validators: passwordMatchValidator('password', 'passwordConfirm')
//     });
//   }

//   get form() {
//     return this.signupForm.controls;
//   }

//  onSubmit(): void {
//     if (this.signupForm.invalid) {
//       this.signupForm.markAllAsTouched();
//       // Works perfectly with the new 1-parameter signature
//       this.messageService.showWarn('Please fill out all required fields correctly.');
//       return;
//     }

//     this.isLoading.set(true);
//     const formData = { ...this.signupForm.value };
    
//     if (formData.uniqueShopId) {
//       formData.uniqueShopId = formData.uniqueShopId.toUpperCase();
//     }

//     this.authService.employeeSignup(formData).subscribe({
//       next: (response) => {
//         this.isLoading.set(false);
//         this.messageService.showSuccess('Account created successfully!');
        
//         // Optional: this.signupForm.reset();
//       },
//       error: (err) => {
//         this.isLoading.set(false);
//         this.messageService.handleHttpError(err);
//       }
//     });
//   }
// }
