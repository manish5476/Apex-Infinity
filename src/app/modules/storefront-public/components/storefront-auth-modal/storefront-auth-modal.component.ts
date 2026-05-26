// src/app/modules/storefront-public/components/storefront-auth-modal/storefront-auth-modal.component.ts
//
// Premium auth modal — fully theme-matched to the commerce-flow design language.
// Uses the same CSS variables, typography, and patterns as the address/checkout pages.
// Smooth slide transition between Login ↔ Register tabs via Angular animations.

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import {
  animate,
  style,
  transition,
  trigger,
  query,
  animateChild,
  group
} from '@angular/animations';
import { StorefrontAuthFacade } from '../../../../storefront/core/facades/storefront-auth.facade';

type AuthTab = 'login' | 'register' | 'forgot';

const slideLeft = [
  query(':enter', [style({ opacity: 0, transform: 'translateX(32px)' })], { optional: true }),
  query(':leave', [animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(-32px)' }))], { optional: true }),
  query(':enter', [animate('240ms 80ms cubic-bezier(0.2,0.8,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))], { optional: true }),
];

const slideRight = [
  query(':enter', [style({ opacity: 0, transform: 'translateX(-32px)' })], { optional: true }),
  query(':leave', [animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(32px)' }))], { optional: true }),
  query(':enter', [animate('240ms 80ms cubic-bezier(0.2,0.8,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))], { optional: true }),
];

@Component({
  selector: 'app-storefront-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tabSlide', [
      transition('login => register', slideLeft),
      transition('register => login', slideRight),
      transition('login => forgot', slideLeft),
      transition('forgot => login', slideRight),
    ])
  ],
  template: `
<p-dialog
  [visible]="visible()"
  (visibleChange)="visibleChange.emit($event)"
  [modal]="true"
  [dismissableMask]="true"
  [showHeader]="false"
  appendTo="body"
  styleClass="apx-auth-dialog"
  [style]="{ width: '100%', maxWidth: '480px', padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }">

  <div class="apx-auth-shell">

    <!-- ── Brand header ─────────────────────────────────────────── -->
    <div class="apx-auth-header">
      <div class="apx-auth-icon">
        <i class="pi" [class.pi-sign-in]="tab() === 'login'" [class.pi-user-plus]="tab() === 'register'"></i>
      </div>
      <div>
        <p class="apx-auth-kicker">Storefront commerce</p>
        <h2 class="apx-auth-title">{{ tab() === 'login' ? 'Welcome back' : tab() === 'forgot' ? 'Reset password' : 'Create account' }}</h2>
        <p class="apx-auth-subtitle">
          {{ tab() === 'login'
            ? 'Sign in to sync your cart and view order history.'
            : tab() === 'forgot'
              ? 'Enter your email and we will send you a reset link.'
              : 'Create a storefront account to track orders and save addresses.' }}
        </p>
      </div>
    </div>

    <!-- ── Tab pills ─────────────────────────────────────────────── -->
    <div class="apx-auth-tabs">
      <button class="apx-auth-tab" [class.active]="tab() === 'login'"
        (click)="switchTab('login')" type="button">
        <i class="pi pi-sign-in"></i>
        Sign In
      </button>
      <button class="apx-auth-tab" [class.active]="tab() === 'register'"
        (click)="switchTab('register')" type="button">
        <i class="pi pi-user-plus"></i>
        Create Account
      </button>
    </div>

    <!-- ── Error banner ───────────────────────────────────────────── -->
    @if (errorMsg()) {
      <div class="apx-auth-alert" role="alert">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ errorMsg() }}</span>
      </div>
    }

    <!-- ── Form container with slide animation ───────────────────── -->
    <div class="apx-auth-forms-host" [@tabSlide]="tab()">

      <!-- LOGIN -->
      @if (tab() === 'login') {
        <form #loginForm="ngForm" (ngSubmit)="submitLogin(loginForm)" class="apx-auth-form" novalidate>

          <label class="apx-field">
            <span class="apx-field__label">Email address</span>
            <div class="apx-field__input-wrap">
              <i class="pi pi-envelope apx-field__icon"></i>
              <input id="sf-login-email" name="email" type="email"
                placeholder="you@example.com"
                ngModel required email #loginEmail="ngModel"
                [class.invalid]="loginEmail.invalid && loginEmail.touched" />
            </div>
            @if (loginEmail.invalid && loginEmail.touched) {
              <span class="apx-field__error">Please enter a valid email address</span>
            }
          </label>

          <label class="apx-field">
            <div class="apx-field__label-row">
              <span class="apx-field__label">Password</span>
              <button type="button" class="apx-auth-link" style="font-size: 0.75rem" (click)="switchTab('forgot')">Forgot?</button>
            </div>
            <div class="apx-field__input-wrap">
              <i class="pi pi-lock apx-field__icon"></i>
              <input id="sf-login-password" name="password"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Your password"
                ngModel required minlength="6" #loginPw="ngModel"
                [class.invalid]="loginPw.invalid && loginPw.touched" />
              <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
                <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
              </button>
            </div>
            @if (loginPw.invalid && loginPw.touched) {
              <span class="apx-field__error">Minimum 6 characters required</span>
            }
          </label>

          <button type="submit" class="apx-auth-cta" [disabled]="loginForm.invalid || auth.loading()">
            @if (auth.loading()) {
              <i class="pi pi-spin pi-spinner"></i>
              <span>Signing in…</span>
            } @else {
              <i class="pi pi-sign-in"></i>
              <span>Sign In</span>
            }
          </button>

          <p class="apx-auth-switch">
            Don't have an account?
            <button type="button" class="apx-auth-link" (click)="switchTab('register')">
              Create one free →
            </button>
          </p>
        </form>
      }

      <!-- FORGOT PASSWORD -->
      @if (tab() === 'forgot') {
        <form #forgotForm="ngForm" (ngSubmit)="submitForgot(forgotForm)" class="apx-auth-form" novalidate>
          @if (forgotSuccess()) {
            <div class="apx-auth-alert" style="background: #ecfdf5; border-color: #a7f3d0; color: #047857;">
              <i class="pi pi-check-circle"></i>
              <span>If an account exists with that email, we've sent password reset instructions.</span>
            </div>
            <button type="button" class="apx-auth-cta" (click)="switchTab('login')" style="margin-top: 1rem">
              Back to Sign In
            </button>
          } @else {
            <label class="apx-field">
              <span class="apx-field__label">Email address</span>
              <div class="apx-field__input-wrap">
                <i class="pi pi-envelope apx-field__icon"></i>
                <input id="sf-forgot-email" name="email" type="email"
                  placeholder="you@example.com"
                  ngModel required email #forgotEmail="ngModel"
                  [class.invalid]="forgotEmail.invalid && forgotEmail.touched" />
              </div>
              @if (forgotEmail.invalid && forgotEmail.touched) {
                <span class="apx-field__error">Please enter a valid email address</span>
              }
            </label>

            <button type="submit" class="apx-auth-cta" [disabled]="forgotForm.invalid || auth.loading()">
              @if (auth.loading()) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Sending…</span>
              } @else {
                <i class="pi pi-envelope"></i>
                <span>Send Reset Link</span>
              }
            </button>
          }
          
          <p class="apx-auth-switch">
            Remember your password?
            <button type="button" class="apx-auth-link" (click)="switchTab('login')">
              Sign in →
            </button>
          </p>
        </form>
      }

      <!-- REGISTER -->
      @if (tab() === 'register') {
        <form #registerForm="ngForm" (ngSubmit)="submitRegister(registerForm)" class="apx-auth-form" novalidate>

          <div class="apx-form-grid">
            <label class="apx-field">
              <span class="apx-field__label">First name</span>
              <div class="apx-field__input-wrap">
                <i class="pi pi-user apx-field__icon"></i>
                <input id="sf-reg-fname" name="firstName" type="text" placeholder="First name" ngModel />
              </div>
            </label>
            <label class="apx-field">
              <span class="apx-field__label">Last name</span>
              <div class="apx-field__input-wrap">
                <i class="pi pi-user apx-field__icon"></i>
                <input id="sf-reg-lname" name="lastName" type="text" placeholder="Last name" ngModel />
              </div>
            </label>
          </div>

          <label class="apx-field">
            <span class="apx-field__label">Email address</span>
            <div class="apx-field__input-wrap">
              <i class="pi pi-envelope apx-field__icon"></i>
              <input id="sf-reg-email" name="email" type="email"
                placeholder="you@example.com"
                ngModel required email #regEmail="ngModel"
                [class.invalid]="regEmail.invalid && regEmail.touched" />
            </div>
            @if (regEmail.invalid && regEmail.touched) {
              <span class="apx-field__error">Please enter a valid email address</span>
            }
          </label>

          <label class="apx-field">
            <span class="apx-field__label">Phone <span class="apx-field__optional">(optional)</span></span>
            <div class="apx-field__input-wrap">
              <i class="pi pi-phone apx-field__icon"></i>
              <input id="sf-reg-phone" name="phone" type="tel" placeholder="+91 98765 43210" ngModel />
            </div>
          </label>

          <label class="apx-field">
            <span class="apx-field__label">Password</span>
            <div class="apx-field__input-wrap">
              <i class="pi pi-lock apx-field__icon"></i>
              <input id="sf-reg-password" name="password"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Minimum 6 characters"
                ngModel required minlength="6" #regPw="ngModel"
                [class.invalid]="regPw.invalid && regPw.touched" />
              <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
                <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
              </button>
            </div>
            @if (regPw.invalid && regPw.touched) {
              <span class="apx-field__error">Minimum 6 characters required</span>
            }
          </label>

          <button type="submit" class="apx-auth-cta" [disabled]="registerForm.invalid || auth.loading()">
            @if (auth.loading()) {
              <i class="pi pi-spin pi-spinner"></i>
              <span>Creating account…</span>
            } @else {
              <i class="pi pi-user-plus"></i>
              <span>Create Account</span>
            }
          </button>

          <p class="apx-auth-switch">
            Already have an account?
            <button type="button" class="apx-auth-link" (click)="switchTab('login')">
              Sign in →
            </button>
          </p>
        </form>
      }

    </div><!-- /apx-auth-forms-host -->

    <!-- ── Trust footer ───────────────────────────────────────────── -->
    <div class="apx-auth-trust">
      <i class="pi pi-lock"></i>
      <span>Secure connection · Your data is safe</span>
    </div>

  </div><!-- /apx-auth-shell -->
</p-dialog>
  `,
  styles: [`
    /* ─── Reset PrimeNG dialog chrome ──────────────────────────────────── */
    ::ng-deep .apx-auth-dialog .p-dialog-content {
      padding: 0 !important;
      background: transparent !important;
      border-radius: 1.5rem !important;
      overflow: hidden;
    }
    ::ng-deep .apx-auth-dialog {
      box-shadow: 0 24px 64px -12px rgba(0,0,0,0.35) !important;
      border-radius: 1.5rem !important;
      overflow: hidden;
    }

    /* ─── Shell ─────────────────────────────────────────────────────────── */
    .apx-auth-shell {
      background:
        radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--color-primary, #6366f1) 10%, transparent), transparent 24rem),
        var(--bg-secondary, #ffffff);
      border: 1px solid var(--border-secondary, #e5e7eb);
      border-radius: 1.5rem;
      overflow: hidden;
    }

    /* ─── Header block ───────────────────────────────────────────────────── */
    .apx-auth-header {
      display: flex;
      align-items: flex-start;
      gap: 1.1rem;
      padding: 2rem 2rem 1.25rem;
      border-bottom: 1px solid var(--border-secondary, #e5e7eb);
    }

    .apx-auth-icon {
      flex-shrink: 0;
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: var(--component-bg-hover, rgba(99,102,241,0.08));
      color: var(--color-primary, #6366f1);
      font-size: 1.2rem;
      transition: all 0.3s cubic-bezier(0.2,0.8,0.2,1);
    }

    .apx-auth-kicker {
      margin: 0 0 0.2rem;
      font-size: 0.7rem;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary, #6b7280);
    }

    .apx-auth-title {
      margin: 0 0 0.3rem;
      font-family: var(--apx-font-display, 'Georgia', serif);
      font-size: clamp(1.4rem, 3vw, 1.8rem);
      line-height: 1.1;
      color: var(--text-primary, #111827);
    }

    .apx-auth-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary, #6b7280);
      line-height: 1.55;
      max-width: 34ch;
    }

    /* ─── Tab pills ──────────────────────────────────────────────────────── */
    .apx-auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
      padding: 0.75rem;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-secondary, #e5e7eb);
    }

    .apx-auth-tab {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.7rem 1rem;
      border: 0;
      border-radius: 0.85rem;
      background: transparent;
      color: var(--text-secondary, #6b7280);
      font-size: 0.875rem;
      font-weight: 850;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.2,0.8,0.2,1);
    }

    .apx-auth-tab.active {
      background: var(--bg-secondary, #ffffff);
      color: var(--text-primary, #111827);
      box-shadow: 0 1px 4px rgba(0,0,0,0.1), 0 0 0 1px var(--border-secondary, #e5e7eb);
    }

    .apx-auth-tab:hover:not(.active) {
      background: var(--component-bg-hover, rgba(0,0,0,0.04));
      color: var(--text-primary, #111827);
    }

    /* ─── Error alert ────────────────────────────────────────────────────── */
    .apx-auth-alert {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin: 0.75rem 1.5rem 0;
      padding: 0.85rem 1rem;
      border-radius: 0.85rem;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      color: #9a3412;
      font-size: 0.875rem;
      font-weight: 700;
    }

    /* ─── Forms host ─────────────────────────────────────────────────────── */
    .apx-auth-forms-host {
      position: relative;
      overflow: hidden;
    }

    .apx-auth-form {
      display: grid;
      gap: 1rem;
      padding: 1.5rem;
    }

    .apx-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    /* ─── Field ──────────────────────────────────────────────────────────── */
    .apx-field {
      display: grid;
      gap: 0.4rem;
    }

    .apx-field__label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .apx-field__label {
      font-size: 0.8125rem;
      font-weight: 850;
      color: var(--text-secondary, #6b7280);
      text-transform: none;
      letter-spacing: 0;
    }

    .apx-field__optional {
      font-weight: 500;
      font-style: italic;
      font-size: 0.75rem;
      color: var(--text-secondary, #9ca3af);
    }

    .apx-field__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .apx-field__icon {
      position: absolute;
      left: 0.875rem;
      color: var(--text-secondary, #9ca3af);
      font-size: 0.875rem;
      pointer-events: none;
      z-index: 1;
      transition: color 0.2s;
    }

    .apx-field__input-wrap input {
      width: 100%;
      height: 2.85rem;
      padding: 0 2.75rem 0 2.6rem;
      border: 1px solid var(--border-secondary, #e5e7eb);
      border-radius: 0.85rem;
      background: var(--bg-primary);
      color: var(--text-primary, #111827);
      font-size: 0.9375rem;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      outline: none;
    }

    .apx-field__input-wrap input:focus {
      border-color: var(--color-primary, #6366f1);
      background: var(--bg-secondary, #ffffff);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #6366f1) 15%, transparent);
    }

    .apx-field__input-wrap input:focus + .apx-field__icon,
    .apx-field__input-wrap:focus-within .apx-field__icon {
      color: var(--color-primary, #6366f1);
    }

    .apx-field__input-wrap input.invalid {
      border-color: #f97316;
    }

    .apx-field__eye {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: var(--text-secondary, #9ca3af);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      border-radius: 0.5rem;
      transition: color 0.2s;
    }
    .apx-field__eye:hover { color: var(--text-primary, #111827); }

    .apx-field__error {
      font-size: 0.75rem;
      color: #ea580c;
      font-weight: 600;
    }

    /* ─── CTA button ─────────────────────────────────────────────────────── */
    .apx-auth-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      width: 100%;
      min-height: 3rem;
      margin-top: 0.25rem;
      border: 0;
      border-radius: 0.9rem;
      background: var(--apx-gradient-commerce, linear-gradient(135deg, #6366f1, #8b5cf6));
      color: #fff;
      font-size: 1rem;
      font-weight: 900;
      font-family: inherit;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary, #6366f1) 35%, transparent);
    }

    .apx-auth-cta:hover:not([disabled]) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .apx-auth-cta:active:not([disabled]) {
      transform: translateY(0);
    }

    .apx-auth-cta[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* ─── Switch link ────────────────────────────────────────────────────── */
    .apx-auth-switch {
      margin: 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-secondary, #6b7280);
    }

    .apx-auth-link {
      background: none;
      border: none;
      color: var(--color-primary, #6366f1);
      font-weight: 850;
      font-size: 0.875rem;
      font-family: inherit;
      cursor: pointer;
      padding: 0;
      transition: opacity 0.2s;
    }
    .apx-auth-link:hover { opacity: 0.75; }

    /* ─── Trust footer ───────────────────────────────────────────────────── */
    .apx-auth-trust {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.9rem;
      border-top: 1px solid var(--border-secondary, #e5e7eb);
      background: var(--bg-primary);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary, #9ca3af);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ─── Responsive ─────────────────────────────────────────────────────── */
    @media (max-width: 480px) {
      .apx-form-grid { grid-template-columns: 1fr; }
      .apx-auth-header { padding: 1.5rem 1.25rem 1rem; }
      .apx-auth-form { padding: 1.25rem; }
    }
  `]
})
export class StorefrontAuthModalComponent {
  readonly auth = inject(StorefrontAuthFacade);

  // ── Inputs / outputs ────────────────────────────────────────────────────────
  readonly visible   = input(false);
  readonly orgSlug   = input('');
  readonly visibleChange  = output<boolean>();
  /** Fires after successful login or register so the parent can continue its action. */
  readonly authenticated  = output<void>();

  // ── Local state ─────────────────────────────────────────────────────────────
  readonly tab          = signal<AuthTab>('login');
  readonly errorMsg     = signal<string | null>(null);
  readonly forgotSuccess = signal(false);
  readonly showPassword = signal(false);

  switchTab(t: AuthTab) {
    this.errorMsg.set(null);
    this.forgotSuccess.set(false);
    this.showPassword.set(false);
    this.tab.set(t);
  }

  submitLogin(form: NgForm) {
    if (form.invalid) { form.form.markAllAsTouched(); return; }
    this.errorMsg.set(null);
    const { email, password } = form.value;
    this.auth.login(this.orgSlug(), { email, password }).subscribe({
      next: customer => {
        if (customer) {
          this.visibleChange.emit(false);
          this.authenticated.emit();
        }
      },
      error: err => this.errorMsg.set(err?.error?.message ?? 'Login failed. Check your credentials and try again.')
    });
  }

  submitRegister(form: NgForm) {
    if (form.invalid) { form.form.markAllAsTouched(); return; }
    this.errorMsg.set(null);
    const { email, password, firstName, lastName, phone } = form.value;
    this.auth.register(this.orgSlug(), { email, password, firstName, lastName, phone }).subscribe({
      next: customer => {
        if (customer) {
          this.visibleChange.emit(false);
          this.authenticated.emit();
        }
      },
      error: err => this.errorMsg.set(err?.error?.message ?? 'Registration failed. Please try again.')
    });
  }

  submitForgot(form: NgForm) {
    if (form.invalid) { form.form.markAllAsTouched(); return; }
    this.errorMsg.set(null);
    this.auth.forgotPassword(this.orgSlug(), { email: form.value.email }).subscribe({
      next: success => {
        if (success) {
          this.forgotSuccess.set(true);
        } else {
          this.errorMsg.set('Failed to process request. Please try again.');
        }
      }
    });
  }
}

