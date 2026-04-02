import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
  providers: [AppMessageService],
  templateUrl: './update-password.html',
  styleUrl: './update-password.scss'
})
export class UpdatePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  updateForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPasswordConfirm: ['', [Validators.required]] // RENAMED from passwordConfirm
  });

  onSubmit() {
    if (this.updateForm.invalid) {
      this.messageService.showWarn('Please fill out the form correctly.');
      return;
    }
    if (this.updateForm.value.newPassword !== this.updateForm.value.newPasswordConfirm) {
      this.messageService.showWarn('New passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.authService.updateUserPassword(this.updateForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.updateForm.reset();

        const msg = 'Password updated successfully!';
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
}