import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';

// Inline Validator to guarantee it works perfectly
export function passwordMatchValidator(controlName: string, matchingControlName: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);
    if (!control || !matchingControl) return null;
    if (matchingControl.errors && !matchingControl.errors['passwordMismatch']) return null;
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      matchingControl.setErrors(null);
      return null;
    }
  };
}

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

  signupForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      // FIXED: Regex now allows spaces and hyphens for phone numbers
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-]{7,20}$/)]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
      // FIXED: requiredTrue ensures the checkbox must be checked
      terms: [false, [Validators.requiredTrue]],
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    });
  }

  get f() { return this.signupForm.controls; }

  onFocus(field: string): void { this.focusedField.set(field); }
  onBlur(): void { this.focusedField.set(null); }

  get passwordStrength(): number {
    const val: string = this.f['password'].value || '';
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^a-zA-Z0-9]/.test(val)) score++;
    return score;
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
      this.messageService.showWarn('Please fill out all required fields correctly.');
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
      error: (err: any) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Failed to create account. Please try again.';
        this.errorMessage.set(msg);
        this.messageService.handleHttpError(err);
      }
    });
  }
}
