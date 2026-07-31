import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';

// Services
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

// UI Components (Shared)
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { FloatingSplitLayoutComponent } from '@shared/ui/layout/floating-split-layout.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { ButtonComponent } from '@shared/ui/form/button.component';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';
import { ConfirmDialog } from "primeng/confirmdialog";

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // PrimeNG
    ToastModule,
    PasswordModule,
    CheckboxModule,
    // UI Components
    PageComponent,
    FloatingSplitLayoutComponent,
    FieldComponent,
    ButtonComponent,
    StatusBadgeComponent],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss'],
  providers: [AppMessageService]
})
export class Signup implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  focusedField = signal<string | null>(null);
  currentStep = signal(1);
  totalSteps = 2;

  signupForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/)]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
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
    return score; // 0–4
  }

  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength];
  }

  get strengthClass(): string {
    return ['', 'weak', 'fair', 'good', 'strong'][this.passwordStrength];
  }

  getFieldError(fieldName: string): string | null {
    const control = this.signupForm.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        const labels: Record<string, string> = {
          name: 'Full Name',
          email: 'Email',
          phone: 'Phone',
          uniqueShopId: 'Shop ID',
          password: 'Password',
          passwordConfirm: 'Confirm Password'
        };
        return `${labels[fieldName] || fieldName} is required.`;
      }
      if (control.errors?.['email']) return 'Enter a valid email address.';
      if (control.errors?.['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required.`;
      if (control.errors?.['pattern']) return 'Invalid format.';
    }
    return null;
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

    const { terms, ...payload } = this.signupForm.value;
    if (payload.uniqueShopId) {
      payload.uniqueShopId = payload.uniqueShopId.toUpperCase();
    }

    this.authService.employeeSignup(payload).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading.set(false);
        const msg = 'Account created! Welcome to Apex.';
        this.successMessage.set(msg);
        this.messageService.showSuccess(msg);
        this.router.navigateByUrl('/create-dashboard');
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Failed to create account. Please try again.';
        this.errorMessage.set(msg);
        this.messageService.handleHttpError(err);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}