import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-global-delivery-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="split-layout">
    
      <!-- ── Left: Form Section ────────────────────────────────────────── -->
      <div class="form-section">
    
        <!-- Subtle background glow powered by theme accent -->
        <div class="glow-orb"></div>
    
        <div class="form-wrapper">
          <div class="brand">
            <div class="icon-wrapper">
              <i class="pi pi-box brand-icon"></i>
            </div>
            <h1>Store Delivery Portal</h1>
            <p>Enter your assigned Store ID to manage dispatch, tracking, and local logistics.</p>
          </div>
    
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
            <div class="form-group">
              <label for="storeId">Organization ID</label>
              <div class="input-container">
                <i class="pi pi-building input-icon"></i>
                <input
                  type="text"
                  id="storeId"
                  name="storeId"
                  [(ngModel)]="storeId"
                  required
                  class="premium-input"
                  placeholder="e.g. apex-store-1"
                  autocomplete="off"
                  spellcheck="false">
                </div>
              </div>
    
              <!-- Error Message using semantic status tokens -->
              @if (error) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ error }}</span>
                </div>
              }
    
              <button type="submit" class="premium-btn primary-btn" [disabled]="loginForm.invalid || loading">
                <span class="btn-content" [class.is-hidden]="loading">
                  Continue to Login
                  <i class="pi pi-arrow-right"></i>
                </span>
                @if (loading) {
                  <i class="pi pi-spin pi-spinner loader"></i>
                }
              </button>
    
              <div class="divider">
                <span>or</span>
              </div>
    
              <button type="button" class="premium-btn secondary-btn" (click)="goBack()">
                <i class="pi pi-arrow-left"></i>
                Return to Main ERP
              </button>
            </form>
          </div>
        </div>
    
        <!-- ── Right: Image/Showcase Section ─────────────────────────────── -->
        <div class="hero-section">
          <div class="hero-overlay"></div>
    
          <!-- Floating Glass Card for Premium Feel -->
          <div class="hero-content">
            <div class="glass-feature-card">
              <div class="feature-header">
                <div class="status-dot"></div>
                <span>Global Logistics Network</span>
              </div>
              <h3>Real-time fleet & dispatch management.</h3>
              <p>Seamlessly connect your local store operations with the global Apex delivery infrastructure.</p>
    
              <div class="stats-row">
                <div class="stat">
                  <h4>99.9%</h4>
                  <span>Uptime</span>
                </div>
                <div class="stat">
                  <h4><i class="pi pi-bolt"></i></h4>
                  <span>Live Sync</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    
      </div>
    `,
  styles: [`
    /* ── Base Layout ── */
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

    /* ── Form Section (Left) ── */
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

    /* Dynamically tinted glow based on theme accent */
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

    /* ── Brand & Typography ── */
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

    /* ── Form Inputs ── */
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

    .premium-input::placeholder {
      color: var(--text-tertiary);
    }

    .premium-input:focus {
      outline: none;
      background: var(--bg-primary);
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-outline-width) var(--accent-focus);
    }

    .premium-input:focus + .input-icon,
    .input-container:focus-within .input-icon {
      color: var(--accent-primary);
    }

    /* ── Buttons ── */
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
      color: var(--bg-primary); /* Ensures contrast against accent color */
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

    .secondary-btn {
      background: transparent;
      color: var(--text-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      gap: var(--spacing-sm);
    }

    .secondary-btn:hover {
      background: var(--component-bg-hover);
      color: var(--text-primary);
    }

    /* ── Divider ── */
    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: var(--spacing-sm) 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: var(--ui-border-width) solid var(--border-primary);
    }

    .divider span {
      padding: 0 var(--spacing-lg);
      color: var(--text-tertiary);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ── Error Message ── */
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

    /* ── Hero Section (Right) ── */
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
      /* Blends perfectly with any theme using color-mix */
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

    /* ── Floating Glass Card ── */
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
      margin-bottom: var(--spacing-3xl);
    }

    .stats-row {
      display: flex;
      gap: var(--spacing-3xl);
      padding-top: var(--spacing-xl);
      border-top: var(--ui-border-width) solid var(--border-primary);
    }

    .stat h4 {
      font-family: var(--font-heading);
      margin: 0 0 var(--spacing-xs) 0;
      font-size: var(--font-size-2xl);
      color: var(--text-primary);
    }

    .stat span {
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
    }

    /* ── Animations ── */
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

    /* ── Responsive Mobile View ── */
    @media (max-width: 992px) {
      .hero-section {
        display: none;
      }
      
      .form-section {
        max-width: 100%;
        padding: var(--spacing-2xl);
        
        /* Mobile background fallback if you want to keep the image visible behind the form */
        /* background-image: url('...'); background-size: cover; */
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
export class GlobalDeliveryLoginComponent {
  private router = inject(Router);

  storeId = '';
  loading = false;
  error = '';

  onSubmit() {
    if (!this.storeId.trim()) {
      this.error = 'Store ID is required.';
      return;
    }

    this.loading = true;
    this.error = '';

    setTimeout(() => {
      this.router.navigate(['/store', this.storeId.trim(), 'delivery', 'login']);
    }, 400);
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}