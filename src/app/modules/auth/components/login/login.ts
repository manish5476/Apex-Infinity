import { ApiService } from './../../../../core/services/api';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete'; // Added
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { MasterListService } from '../../../../core/services/master-list.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    CheckboxModule,
    AutoCompleteModule // Added
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [MessageService, AppMessageService]
})
export class Login implements OnInit {
  // --- Injections ---
  private masterListService = inject(MasterListService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);
  private ApiService = inject(ApiService);
  isLoading = signal(false);
  filteredEmails: string[] = [];
  emailDomains: string[] = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com'];
  loginForm!: FormGroup;
  ngOnInit(): void {
    this.initForm();
  }

private initForm(): void {
  this.loginForm = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        this.allowedEmailDomains(this.emailDomains) 
      ]
    ],
    password: ['', Validators.required],
    uniqueShopId: ['', Validators.required],
    remember: [false]
  });
}

  get form() {
    return this.loginForm.controls;
  }

  // --- Email Suggestion Logic ---
  filterEmail(event: any) {
    const query = event.query;
    if (query.includes('@')) {
      const [prefix, suffix] = query.split('@');
      // Filter domains based on what user types after @
      this.filteredEmails = this.emailDomains
        .filter(domain => domain.toLowerCase().startsWith(suffix.toLowerCase()))
        .map(domain => `${prefix}@${domain}`);
    } else {
      this.filteredEmails = [];
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form', 'Please enter a valid email and password.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        this.authService.handleLoginSuccess(response);
        this.masterListService.load();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
      }
    });
  }


  
 allowedEmailDomains(domains: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || !value.includes('@')) return null;

    const domain = value.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    return domains.includes(domain)
      ? null
      : { domainNotAllowed: true };
  };
}
}