import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth-service';
import { AppMessageService } from '../../../../core/services/message.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, InputTextModule, ButtonModule, RouterLink],
  providers: [AppMessageService],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(AppMessageService);

  isLoading = signal(false);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotForm.invalid) {
      // Added user feedback instead of silently returning
      this.messageService.showWarn('Please enter a valid email address.');
      return;
    }

    this.isLoading.set(true);

    this.authService.forgotPassword(this.forgotForm.value.email!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.messageService.showSuccess('Check your inbox for reset instructions.');
        this.forgotForm.reset();
      },
      error: (err) => {
        this.isLoading.set(false);

        // Let the global error handler do the heavy lifting for you!
        this.messageService.handleHttpError(err);
      }
    });
  }
}
