import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-forgot-password',
  standalone: true,
  imports: [FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
<div class="auth-root">
  <aside class="brand-panel">
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="orb orb-1" aria-hidden="true"></div>
    <div class="orb orb-2" aria-hidden="true"></div>

    <div class="brand-inner">
      <div class="wordmark">
        <div class="logo-glyph">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 28 L16 4 L28 28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.5 20 L23.5 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          </svg>
        </div>
        <span class="wordmark-text">Apex</span>
      </div>

      <div class="hero-copy">
        <p class="overline-text">Secure Recovery</p>
        <h1 class="hero-headline">
          Get back<br>
          on the<br>
          <em>road.</em>
        </h1>
        <p class="hero-body">
          If you don't have an email address associated with your account, please contact your store admin directly to reset your password.
        </p>
      </div>

      <footer class="brand-footer">
        <span>© 2026 Apex Inc.</span>
      </footer>
    </div>
  </aside>

  <main class="form-panel" id="main-content">
    <div class="form-inner">
      <div class="form-header">
        <h2 class="form-title">Forgot Password</h2>
        <p class="form-subtitle">Enter your phone or email to receive a password reset link for <span style="font-weight: 600; color: var(--text-primary);">{{ orgSlug || 'your store' }}</span>.</p>
      </div>

      @if (!successMessage) {
        @if (error) {
          <div class="error-banner" role="alert">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ error }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #forgotForm="ngForm" class="auth-form" novalidate>
          <div class="field-group">
            <label class="field-label" for="phoneOrEmail">Phone Number or Email</label>
            <input type="text" id="phoneOrEmail" name="phoneOrEmail" [(ngModel)]="phoneOrEmail" required class="apex-input" placeholder="e.g. agent@example.com or 9876543210" autocomplete="off">
          </div>

          <button type="submit" class="submit-btn" [class.loading]="loading" [disabled]="forgotForm.invalid || loading">
            @if (loading) {
              <span class="spinner" aria-hidden="true"></span>
              <span>Sending…</span>
            } @else {
              <span>Send Reset Link</span>
              <svg class="btn-arrow" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            }
          </button>

          <button type="button" class="submit-btn" (click)="goToLogin()" style="margin-top: 1rem; background: transparent; color: var(--text-primary); border: 1px solid var(--border);">
            Back to Login
          </button>
        </form>
      }

      @if (successMessage) {
        <div style="text-align: center; padding: 2rem 0;">
          <svg style="width: 48px; height: 48px; color: var(--text-primary); margin-bottom: 1rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 style="font-family: 'DM Serif Display', serif; font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">Link Sent!</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">{{ successMessage }}</p>
          <button type="button" class="submit-btn" (click)="goToLogin()" style="background: transparent; color: var(--text-primary); border: 1px solid var(--border);">
            Back to Login
          </button>
        </div>
      }
    </div>
  </main>
</div>
  `,
  styleUrl: '../../../../modules/auth/_auth.shared.scss'
})
export class DeliveryForgotPasswordComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  phoneOrEmail = '';
  orgSlug = '';
  loading = false;
  error = '';
  successMessage = '';

  ngOnInit() {
    let currentRoute: import('@angular/router').ActivatedRouteSnapshot | null = this.route.snapshot;
    while (currentRoute) {
      if (currentRoute.paramMap.has('orgSlug')) {
        this.orgSlug = currentRoute.paramMap.get('orgSlug') || '';
        break;
      }
      currentRoute = currentRoute.parent;
    }
  }

  onSubmit() {
    if (!this.orgSlug) {
      this.error = 'Invalid organization scope. Please use your specific store login link.';
      return;
    }

    if (!this.phoneOrEmail) {
      this.error = 'Please enter your phone number or email';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.deliveryService.forgotPassword(this.orgSlug, this.phoneOrEmail)
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.successMessage = res.message || 'Password reset link sent! Check your email or SMS.';
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Failed to process request';
        }
      });
  }

  goToLogin() {
    if (this.orgSlug) {
      this.router.navigate(['/store', this.orgSlug, 'delivery', 'login']);
    } else {
      this.router.navigate(['/delivery-agent/login']);
    }
  }
}
