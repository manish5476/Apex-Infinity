import { Component, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-reset-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="split-layout">
    
      <!-- ── Left: Form Section ────────────────────────────────────────── -->
      <div class="form-section">
    
        <div class="glow-orb"></div>
    
        <div class="form-wrapper">
          <div class="brand">
            <div class="icon-wrapper">
              <i class="pi pi-lock brand-icon"></i>
            </div>
            <h1>Set New Password</h1>
            <p>Enter your new password to regain access to your delivery dashboard.</p>
          </div>
    
          @if (!successMessage) {
            <form (ngSubmit)="onSubmit()" #resetForm="ngForm" class="login-form">
              <div class="form-group">
                <label for="password">New Password</label>
                <div class="input-container">
                  <i class="pi pi-lock input-icon"></i>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    [(ngModel)]="password"
                    required
                    minlength="8"
                    class="premium-input"
                    placeholder="At least 8 characters">
                </div>
              </div>
              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <div class="input-container">
                  <i class="pi pi-lock input-icon"></i>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    [(ngModel)]="confirmPassword"
                    required
                    class="premium-input"
                    placeholder="Confirm new password">
                </div>
              </div>
              @if (error) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ error }}</span>
                </div>
              }
              <button type="submit" class="premium-btn primary-btn" [disabled]="resetForm.invalid || loading">
                <span class="btn-content" [class.is-hidden]="loading">
                  Reset Password
                  <i class="pi pi-check"></i>
                </span>
                @if (loading) {
                  <i class="pi pi-spin pi-spinner loader"></i>
                }
              </button>
            </form>
          }
    
          @if (successMessage) {
            <div class="success-message-box">
              <i class="pi pi-check-circle" style="font-size: 3rem; color: var(--accent-primary); margin-bottom: 1rem;"></i>
              <h3>Password Reset!</h3>
              <p>{{ successMessage }}</p>
              <button type="button" class="premium-btn primary-btn" style="margin-top: 1rem;" (click)="goToLogin()">
                Continue to Login
              </button>
            </div>
          }
        </div>
      </div>
    
      <!-- ── Right: Image/Showcase Section ─────────────────────────────── -->
      <div class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="glass-feature-card">
            <div class="feature-header">
              <div class="status-dot"></div>
              <span>Secure Access</span>
            </div>
            <h3>Keep your account safe.</h3>
            <p>Make sure to use a strong password that you don't use on other websites.</p>
          </div>
        </div>
      </div>
    </div>
    `,
  styles: [`
    /* Copying the same styles as delivery-login for consistency */
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--bg-primary);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    .split-layout {
      display: flex;
      min-height: 100vh;
      width: 100%;
    }

    .form-section {
      width: 100%;
      max-width: 560px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4xl);
      position: relative;
      z-index: 10;
      background: var(--bg-primary);
    }

    .glow-orb {
      position: absolute;
      top: 20%;
      left: 50%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, var(--color-primary-bg) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: -1;
    }

    .form-wrapper {
      width: 100%;
      max-width: 380px;
      position: relative;
      animation: fadeUp 0.6s cubic-bezier(0.2, 0.9, 0.2, 1);
    }

    .brand {
      margin-bottom: var(--spacing-3xl);
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      background: linear-gradient(var(--accent-gradient-angle), var(--color-primary-bg), transparent);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-xl);
      box-shadow: var(--elevation-1);
    }

    .brand-icon {
      font-size: var(--font-size-2xl);
      color: var(--accent-primary);
    }

    h1 {
      font-family: var(--font-heading);
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      letter-spacing: -0.02em;
      line-height: var(--line-height-tight);
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: var(--font-size-md);
      line-height: var(--line-height-relaxed);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: var(--spacing-xl);
      color: var(--text-tertiary);
      font-size: var(--font-size-lg);
      transition: color var(--transition-base);
    }

    .premium-input {
      width: 100%;
      padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-lg) calc(var(--spacing-xl) * 2.5);
      border-radius: var(--ui-border-radius);
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      color: var(--text-primary);
      font-size: var(--font-size-md);
      font-family: var(--font-body);
      transition: var(--transition-base);
    }

    .premium-input:focus {
      outline: none;
      background: var(--bg-primary);
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-outline-width) var(--accent-focus);
    }

    .premium-input:focus + .input-icon {
      color: var(--accent-primary);
    }

    .premium-btn {
      width: 100%;
      padding: var(--spacing-lg);
      border-radius: var(--ui-border-radius);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-md);
      font-family: var(--font-body);
      cursor: pointer;
      transition: var(--transition-base);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border: none;
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      transition: opacity var(--transition-fast);
    }
    
    .btn-content.is-hidden {
      opacity: 0;
    }

    .loader {
      position: absolute;
      font-size: var(--font-size-lg);
    }

    .primary-btn {
      background: linear-gradient(var(--accent-gradient-angle), var(--accent-primary), var(--accent-secondary));
      color: var(--bg-primary); 
      margin-top: var(--spacing-sm);
      box-shadow: var(--shadow-sm);
    }

    .primary-btn:hover:not([disabled]) {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: var(--elevation-1);
    }

    .primary-btn[disabled] {
      background: var(--bg-ternary);
      color: var(--text-disabled);
      cursor: not-allowed;
      box-shadow: none;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-error-dark);
      font-size: var(--font-size-sm);
      background: var(--color-error-bg);
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--ui-border-radius-sm);
      border: var(--ui-border-width) solid var(--color-error-border);
      animation: shake 0.4s ease-in-out;
    }

    .success-message-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
      padding: var(--spacing-3xl) var(--spacing-xl);
      border-radius: var(--ui-border-radius-xl);
      border: var(--ui-border-width) solid color-mix(in srgb, var(--accent-primary) 30%, transparent);
      animation: fadeUp 0.6s ease-out;
    }

    .hero-section {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-4xl);
      overflow: hidden;
      background-image: url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, 
        var(--bg-primary) 0%, 
        color-mix(in srgb, var(--bg-primary) 70%, transparent) 40%, 
        color-mix(in srgb, var(--accent-primary) 20%, transparent) 100%
      );
    }

    .hero-content {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 480px;
      margin-left: auto;
      margin-right: var(--spacing-3xl);
      animation: fadeLeft 0.8s ease-out 0.2s both;
    }

    .glass-feature-card {
      background: color-mix(in srgb, var(--bg-secondary) 75%, transparent);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-xl);
      padding: var(--spacing-4xl);
      box-shadow: var(--elevation-3);
    }

    .feature-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--accent-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      box-shadow: 0 0 12px var(--color-primary-bg);
      animation: pulse 2s infinite;
    }

    .glass-feature-card h3 {
      font-family: var(--font-heading);
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-md) 0;
      line-height: var(--line-height-tight);
    }

    .glass-feature-card p {
      color: var(--text-secondary);
      font-size: var(--font-size-md);
      line-height: var(--line-height-relaxed);
      margin-bottom: 0;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeLeft {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 var(--color-primary-bg); }
      70% { box-shadow: 0 0 0 6px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }

    @media (max-width: 992px) {
      .hero-section {
        display: none;
      }
      
      .form-section {
        max-width: 100%;
        padding: var(--spacing-2xl);
      }
      
      .form-wrapper {
        background: color-mix(in srgb, var(--bg-secondary) 80%, transparent);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: var(--ui-border-width) solid var(--border-primary);
        padding: var(--spacing-3xl) var(--spacing-2xl);
        border-radius: var(--ui-border-radius-xl);
        box-shadow: var(--elevation-2);
      }
    }
  `]
})
export class DeliveryResetPasswordComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  password = '';
  confirmPassword = '';
  token = '';
  loading = false;
  error = '';
  successMessage = '';
  orgSlug = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    // Find orgSlug
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
    if (!this.token) {
      this.error = 'Reset token is missing from the URL.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters long.';
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.deliveryService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Password reset successfully.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to reset password. The token may be expired or invalid.';
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
