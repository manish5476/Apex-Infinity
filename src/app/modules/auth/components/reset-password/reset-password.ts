import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
  providers: [AppMessageService],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);
  isLoading = signal(false);
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
    this.authService.resetPassword(this.token, this.resetForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.resetForm.reset();
        this.messageService.showSuccess('Password reset successfully! You can now log in.');
      },
      error: (err) => {
        this.isLoading.set(false);

        // Replaced the manual error handling with your centralized handler
        this.messageService.handleHttpError(err);
      }
    });
  }
}
