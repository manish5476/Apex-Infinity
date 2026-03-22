import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    PasswordModule,
    CheckboxModule,
    AutoCompleteModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [AppMessageService]
})
export class LoginComponent implements OnInit {
  private masterListService = inject(MasterListService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  // Track which field is currently focused for animated label effects
  focusedField = signal<string | null>(null);

  filteredEmails: string[] = [];
  emailDomains = ['gmail.com', 'outlook.com', 'proton.me', 'protonmail.me', 'yahoo.com', 'icloud.com', 'hotmail.com'];

  loginForm!: FormGroup;
  returnUrl = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
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

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.messageService.showWarn('Please fill out all fields correctly.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        this.authService.handleLoginSuccess(res);
        this.masterListService.load();
        this.isLoading.set(false);
        this.messageService.showSuccess('Welcome back!');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Invalid credentials. Please try again.';
        this.errorMessage.set(msg);
        this.messageService.showError(msg);
      }
    });
  }
}

// import { ApiService } from './../../../../core/services/api';
// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { MessageService } from 'primeng/api';
// import { ToastModule } from 'primeng/toast';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { PasswordModule } from 'primeng/password';
// import { CheckboxModule } from 'primeng/checkbox';
// import { AutoCompleteModule } from 'primeng/autocomplete';
// import { AuthService } from '../../services/auth-service';
// import { AppMessageService } from '../../../../core/services/message.service';
// import { MasterListService } from '../../../../core/services/master-list.service';
// import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     ToastModule,
//     InputTextModule,
//     ButtonModule,
//     PasswordModule,
//     CheckboxModule,
//     AutoCompleteModule
//   ],
//   templateUrl: './login.html',
//   styleUrl: './login.scss',
//   providers: [AppMessageService]
// })
// export class Login implements OnInit {
//   private masterListService = inject(MasterListService);
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private authService = inject(AuthService);
//   private messageService = inject(AppMessageService);

//   isLoading = signal(false);
//   errorMessage = signal<string | null>(null);

//   filteredEmails: string[] = [];
//   emailDomains: string[] = ['gmail.com', 'outlook.com', 'proton.me', 'protonmail.me', 'yahoo.com', 'icloud.com', 'hotmail.com'];
//   loginForm!: FormGroup;
//   returnUrl: string = '/dashboard';

//   ngOnInit(): void {
//     this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
//     this.initForm();
//   }

//   private initForm(): void {
//     this.loginForm = this.fb.group({
//       // Labelled as 'email' in the form but accepts phone numbers too
//       email: [
//         '',
//         [
//           Validators.required,
//           this.emailOrPhoneValidator() // Custom validator for dual support
//         ]
//       ],
//       password: ['', Validators.required],
//       uniqueShopId: ['', Validators.required],
//       remember: [false]
//     });
//   }

//   get form() {
//     return this.loginForm.controls;
//   }

//   /**
//    * Custom validator that allows either a valid email
//    * OR a valid phone number (numeric, 7-15 digits).
//    */
//   private emailOrPhoneValidator(): ValidatorFn {
//     return (control: AbstractControl): ValidationErrors | null => {
//       const value = control.value;
//       if (!value) return null;

//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       const phoneRegex = /^\+?[0-9]{7,15}$/;

//       const isValidEmail = emailRegex.test(value);
//       const isValidPhone = phoneRegex.test(value);

//       if (isValidEmail) {
//         // If it's an email, we still check the domain whitelist
//         const domain = value.split('@')[1]?.toLowerCase();
//         if (domain && !this.emailDomains.includes(domain)) {
//           return { domainNotAllowed: true };
//         }
//         return null;
//       }

//       return isValidPhone ? null : { invalidIdentifier: true };
//     };
//   }

//   filterEmail(event: any) {
//     const query = event.query;
//     // Only show suggestions if the user starts typing an email format
//     if (query.includes('@')) {
//       const [prefix, suffix] = query.split('@');
//       this.filteredEmails = this.emailDomains
//         .filter(domain => domain.toLowerCase().startsWith(suffix.toLowerCase()))
//         .map(domain => `${prefix}@${domain}`);
//     } else {
//       this.filteredEmails = [];
//     }
//   }

//   onSubmit(): void {
//     if (this.loginForm.invalid) {
//       this.loginForm.markAllAsTouched();
//       this.messageService.showWarn('Please fill out all required fields correctly.');
//       return;
//     }

//     this.isLoading.set(true);
//     this.errorMessage.set(null);
//     this.authService.login(this.loginForm.value).subscribe({
//       next: (response: any) => {
//         this.authService.handleLoginSuccess(response);
//         this.masterListService.load();
//         this.isLoading.set(false);

//         // Added a nice welcome touch before navigating away
//         this.messageService.showSuccess('Login successful!');

//         this.router.navigateByUrl(this.returnUrl);
//       },
//       error: (err) => {
//         this.isLoading.set(false);
//         const message = err.error?.message || 'Login failed. Please check your credentials.';
//         this.errorMessage.set(message);
//         this.messageService.showError(message);
//       }
//     });
//   }
// }