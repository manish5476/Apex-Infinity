import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    PasswordModule,
    CheckboxModule,
    AutoCompleteModule,
    ConfirmDialogModule
],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [AppMessageService]
})
export class LoginComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);
  private confirmationService = inject(ConfirmationService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  // Track which field is currently focused for animated label effects
  focusedField = signal<string | null>(null);

  filteredEmails: string[] = [];
  emailDomains = ['gmail.com', 'outlook.com', 'proton.me', 'protonmail.me', 'yahoo.com', 'icloud.com', 'hotmail.com'];

  loginForm!: FormGroup;
  returnUrl = '/create-dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/create-dashboard';
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, this.emailOrPhoneValidator()]],
      password: ['', Validators.required],
      uniqueShopId: ['', Validators.required],
      remember: [false]
    });
  }

  get f() { return this.loginForm.controls; }

  private emailOrPhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (emailRegex.test(value)) {
        const domain = value.split('@')[1]?.toLowerCase();
        if (domain && !this.emailDomains.includes(domain)) return { domainNotAllowed: true };
        return null;
      }
      return phoneRegex.test(value) ? null : { invalidIdentifier: true };
    };
  }

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

  onFocus(field: string): void { this.focusedField.set(field); }
  onBlur(): void { this.focusedField.set(null); }

  onSubmit(forceLogout: boolean = false): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.messageService.showWarn('Please fill out all fields correctly.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const loginData = { ...this.loginForm.value, forceLogout };

    this.authService.login(loginData, this.loginForm.value.remember, this.returnUrl).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        // MasterListService decommissioned - pre-caching no longer required as data is fetched lazily by universal dropdowns
        // this.masterListService.load(); 
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
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
      }
    });
  }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}