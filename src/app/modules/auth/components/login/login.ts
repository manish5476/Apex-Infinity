import { Component, OnInit, inject, signal, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

// Services
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';

// UI Components
import { PageComponent } from '@shared/ui/layout/page/page.component';
import { FloatingSplitLayoutComponent } from '@shared/ui/layout/floating-split-layout.component';
import { FieldComponent } from '@shared/ui/form/field.component';
import { ButtonComponent } from '@shared/ui/form/button.component';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // PrimeNG
    AutoCompleteModule,
    CheckboxModule,
    PasswordModule,
    ToastModule,
    ConfirmDialogModule,
    // UI Components
    PageComponent,
    FloatingSplitLayoutComponent,
    FieldComponent,
    ButtonComponent,
    StatusBadgeComponent,
  ],
  providers: [AppMessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  // --- Dependencies ---
  private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  // --- State Signals ---
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  focusedField = signal<string | null>(null);

  // --- Form ---
  loginForm!: FormGroup;
  returnUrl = '/create-dashboard';
  filteredEmails: string[] = [];

  // --- Constants ---
  emailDomains = ['gmail.com', 'outlook.com', 'proton.me', 'protonmail.me', 'yahoo.com', 'icloud.com', 'hotmail.com'];

  // --- Lifecycle ---
  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/create-dashboard';
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Form Initialization ---
  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, this.emailOrPhoneValidator()]],
      password: ['', Validators.required],
      uniqueShopId: ['', Validators.required],
      remember: [false]
    });
  }

  // --- Getters ---
  get f() { return this.loginForm.controls; }

  // --- Form Helpers ---
  getFieldError(fieldName: string): string | null {
    const control = this.loginForm.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        const labels: Record<string, string> = {
          email: 'Email or Phone',
          password: 'Password',
          uniqueShopId: 'Shop ID'
        };
        return `${labels[fieldName] || fieldName} is required.`;
      }
      if (control.errors?.['domainNotAllowed']) {
        return 'This email domain is not allowed. Please use a valid domain.';
      }
      if (control.errors?.['invalidIdentifier']) {
        return 'Please enter a valid email or phone number.';
      }
    }
    return null;
  }

  // --- Validators ---
  private emailOrPhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[0-9]{7,15}$/;

      if (emailRegex.test(value)) {
        const domain = value.split('@')[1]?.toLowerCase();
        if (domain && !this.emailDomains.includes(domain)) {
          return { domainNotAllowed: true };
        }
        return null;
      }

      return phoneRegex.test(value) ? null : { invalidIdentifier: true };
    };
  }

  // --- AutoComplete ---
  filterEmail(event: any): void {
    const query = event.query;
    if (query.includes('@')) {
      const [prefix, suffix] = query.split('@');
      this.filteredEmails = this.emailDomains
        .filter(d => d.startsWith(suffix.toLowerCase()))
        .map(d => `${prefix}@${d}`);
    } else {
      this.filteredEmails = [];
    }
  }

  // --- Focus Management ---
  onFocus(field: string): void {
    this.focusedField.set(field);
  }

  onBlur(): void {
    this.focusedField.set(null);
  }

  // --- Submit ---
  onSubmit(forceLogout: boolean = false): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.messageService.showWarn('Please fill out all fields correctly.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const loginData = {
      ...this.loginForm.value,
      forceLogout
    };

    this.authService
      .login(loginData, this.loginForm.value.remember, this.returnUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.messageService.showSuccess('Welcome back! Redirecting to your dashboard...');
          // Navigation handled by auth service
        },
        error: (err) => {
          this.isLoading.set(false);

          // Session concurrency limit
          if (err.status === 409 && err.error?.code === 'SESSION_CONCURRENCY_LIMIT') {
            this.confirmationService.confirm({
              key: 'loginLimitDialog',
              message: err.error.message || 'Maximum concurrent sessions reached. Would you like to logout from other devices?',
              header: 'Session Limit Reached',
              icon: 'pi pi-exclamation-triangle',
              acceptLabel: 'Yes, Logout Others',
              rejectLabel: 'Cancel',
              accept: () => {
                this.onSubmit(true);
              }
            });
            return;
          }

          const msg = err.error?.message || 'Invalid credentials. Please try again.';
          this.errorMessage.set(msg);
          this.messageService.showError(msg);
        }
      });
  }

  // --- Demo Login (Keyboard Shortcut) ---
  @HostListener('document:keydown.control.shift.l')
  demoLogin(): void {
    this.loginForm.patchValue({
      email: 'admin@apex.com',
      uniqueShopId: 'SHOP-1042',
      password: 'password123',
      remember: true
    });
    this.onSubmit();
  }
}