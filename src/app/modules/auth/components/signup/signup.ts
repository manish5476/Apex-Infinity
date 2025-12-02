import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator'; // Your existing validator

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ToastModule,
    InputTextModule,
    ButtonModule,
    PasswordModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  providers: [MessageService, AppMessageService]
})
export class Signup implements OnInit {
  // --- Injections ---
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(AppMessageService);

  // --- State Signals ---
  isLoading = signal(false);

  // --- Forms ---
  signupForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm') // Your validator
    });
  }

  get form() {
    return this.signupForm.controls;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.messageService.showWarn('Invalid Form', 'Please fill in all fields correctly.');
      return;
    }

    //  // this.isLoading.set(true);
    const formData = this.signupForm.value;
    formData.uniqueShopId = formData.uniqueShopId.toUpperCase();

    // Call the employeeSignup method from your AuthService
    this.authService.employeeSignup(formData).subscribe({
      next: (response) => {
        // --- Success ---
        this.isLoading.set(false);
        // The service's `tap` operator handles the success message
        // and navigation to the login page.
      },
      error: (err) => {
        // --- Error ---
        this.isLoading.set(false);
        // Error message is handled by the authService's catchError
      }
    });
  }
}

// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-signup',
//   imports: [],
//   templateUrl: './signup.html',
//   styleUrl: './signup.scss',
// })
// export class Signup {

// }
