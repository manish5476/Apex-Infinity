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
import { passwordMatchValidator } from '../../../../core/validators/password-match.validator';

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
      phone: ['', [Validators.required]],
      uniqueShopId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required]],
    }, {
      validators: passwordMatchValidator('password', 'passwordConfirm')
    });
  }

  get form() {
    return this.signupForm.controls;
  }

 onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      // Works perfectly with the new 1-parameter signature
      this.messageService.showWarn('Please fill out all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formData = { ...this.signupForm.value };
    
    if (formData.uniqueShopId) {
      formData.uniqueShopId = formData.uniqueShopId.toUpperCase();
    }

    this.authService.employeeSignup(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.messageService.showSuccess('Account created successfully!');
        
        // Optional: this.signupForm.reset();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.handleHttpError(err);
      }
    });
  }
}
