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
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';

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
    CheckboxModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  providers: [MessageService, AppMessageService] // Local providers
})
export class Login implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(AppMessageService); // Use your custom service

  // --- State Signals ---
  isLoading = signal(false);

  // --- Forms ---
  loginForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false]
    });
  }

  get form() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form', 'Please enter a valid email and password.');
      return;
    }

    this.isLoading.set(true);

    // Call the login method from your finalized AuthService
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        // --- Success ---
        // The service's `tap` operator already called handleLoginSuccess,
        // which saves the token and navigates to the dashboard.
        this.isLoading.set(false);
      },
      error: (err) => {
        // --- Error ---
        this.isLoading.set(false);
        // The error message is already handled by the AuthService/ApiService.
        // We just need to stop the loading spinner.
      }
    });
  }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-login',
//   imports: [],
//   templateUrl: './login.html',
//   styleUrl: './login.scss',
// })
// export class Login {

// }
