import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
  providers: [AppMessageService],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  token = '';

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    passwordConfirm: ['', [Validators.required]]
  });

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) {
      this.messageService.showWarn('Please ensure the form is valid and the reset link is correct.');
      return;
    }
    if (this.resetForm.value.password !== this.resetForm.value.passwordConfirm) {
      this.messageService.showWarn('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authService.resetPassword(this.token, this.resetForm.value).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetForm.reset();
        const msg = 'Password reset successfully! You can now log in.';
        this.successMessage.set(msg);
        this.messageService.showSuccess(msg);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || 'Something went wrong. Please try again.';
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
