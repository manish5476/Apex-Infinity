import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { RouterModule } from '@angular/router';
import {
  animate,
  style,
  transition,
  trigger,
  query
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
  imports: [FormsModule, DialogModule, RouterModule],
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
  styleClass="apx-premium-dialog"
  [style]="{ width: '100%', maxWidth: '960px', padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }">

  <div class="apx-split-shell">
    
    <div class="apx-auth-content">
      
      <div class="apx-auth-header">
        <div class="apx-emoji-icon">🏠</div>
        <h2 class="apx-auth-title">
          {{ tab() === 'login' ? 'Welcome home' : tab() === 'forgot' ? 'Reset password' : 'Create account' }}
        </h2>
        <p class="apx-auth-subtitle">Please enter your details.</p>
      </div>

      @if(tab() !== 'forgot') {
        <div class="apx-auth-tabs">
          <button class="apx-auth-tab" [class.active]="tab() === 'login'" (click)="switchTab('login')" type="button">Login</button>
          <button class="apx-auth-tab" [class.active]="tab() === 'register'" (click)="switchTab('register')" type="button">Register</button>
        </div>
      }

      @if (errorMsg()) {
        <div class="apx-auth-alert" role="alert">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ errorMsg() }}</span>
        </div>
      }

      <div class="apx-auth-forms-host" [@tabSlide]="tab()">

        @if (tab() === 'login') {
          <form #loginForm="ngForm" (ngSubmit)="submitLogin(loginForm)" class="apx-auth-form" novalidate>
            <label class="apx-field">
              <div class="apx-field__input-wrap">
                <input id="sf-login-email" name="email" type="email" placeholder="Email" ngModel required email #loginEmail="ngModel" [class.invalid]="loginEmail.invalid && loginEmail.touched" />
                <i class="pi pi-envelope apx-field__icon-right"></i>
              </div>
            </label>

            <label class="apx-field">
              <div class="apx-field__input-wrap">
                <input id="sf-login-password" name="password" [type]="showPassword() ? 'text' : 'password'" placeholder="Password" ngModel required minlength="6" #loginPw="ngModel" [class.invalid]="loginPw.invalid && loginPw.touched" />
                <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
                  <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
                </button>
              </div>
            </label>

            <div class="apx-form-actions">
              <label class="apx-checkbox">
                <input type="checkbox" name="remember" ngModel>
                <span>Remember for 30 days</span>
              </label>
              <button type="button" class="apx-auth-link" (click)="switchTab('forgot')">Forgot password?</button>
            </div>

            <button type="submit" class="apx-auth-cta" [disabled]="loginForm.invalid || auth.loading()">
              @if (auth.loading()) { <i class="pi pi-spin pi-spinner"></i> }
              <span>Login</span>
            </button>
          </form>
        }

        @if (tab() === 'register') {
          <form #registerForm="ngForm" (ngSubmit)="submitRegister(registerForm)" class="apx-auth-form" novalidate>
            <div class="apx-form-grid">
              <label class="apx-field">
                <div class="apx-field__input-wrap">
                  <input name="firstName" type="text" placeholder="First name" ngModel required />
                </div>
              </label>
              <label class="apx-field">
                <div class="apx-field__input-wrap">
                  <input name="lastName" type="text" placeholder="Last name" ngModel required />
                </div>
              </label>
            </div>

            <label class="apx-field">
              <div class="apx-field__input-wrap">
                <input name="email" type="email" placeholder="Email" ngModel required email />
                <i class="pi pi-envelope apx-field__icon-right"></i>
              </div>
            </label>

            <label class="apx-field">
              <div class="apx-field__input-wrap">
                <input name="password" [type]="showPassword() ? 'text' : 'password'" placeholder="Password" ngModel required minlength="6" />
                <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
                  <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
                </button>
              </div>
            </label>

            <button type="submit" class="apx-auth-cta" [disabled]="registerForm.invalid || auth.loading()">
              @if (auth.loading()) { <i class="pi pi-spin pi-spinner"></i> }
              <span>Create Account</span>
            </button>
          </form>
        }

        @if (tab() === 'forgot') {
          <form #forgotForm="ngForm" (ngSubmit)="submitForgot(forgotForm)" class="apx-auth-form" novalidate>
            @if (forgotSuccess()) {
              <div class="apx-auth-alert success">
                <i class="pi pi-check-circle"></i>
                <span>We've sent password reset instructions to your email.</span>
              </div>
              <button type="button" class="apx-auth-cta" (click)="switchTab('login')">Back to Login</button>
            } @else {
              <label class="apx-field">
                <div class="apx-field__input-wrap">
                  <input name="email" type="email" placeholder="Email" ngModel required email />
                  <i class="pi pi-envelope apx-field__icon-right"></i>
                </div>
              </label>
              <button type="submit" class="apx-auth-cta" [disabled]="forgotForm.invalid || auth.loading()">
                @if (auth.loading()) { <i class="pi pi-spin pi-spinner"></i> }
                <span>Send Reset Link</span>
              </button>
              <div class="apx-form-actions" style="justify-content: center; margin-top: 1rem;">
                <button type="button" class="apx-auth-link" (click)="switchTab('login')">Back to Login</button>
              </div>
            }
          </form>
        }
      </div>

      @if(tab() !== 'forgot') {
        <div class="apx-social-divider">
          <span>or</span>
        </div>
        <div class="apx-social-logins">
          <button type="button" class="social-btn"><i class="pi pi-apple"></i></button>
          <button type="button" class="social-btn"><i class="pi pi-google"></i></button>
          <button type="button" class="social-btn"><i class="pi pi-facebook"></i></button>
        </div>
      }
    </div>

    <div class="apx-auth-graphic">
      <div class="fluid-shape shape-1"></div>
      <div class="fluid-shape shape-2"></div>
    </div>

  </div>
</p-dialog>
  `,
  styles: [`
    /* ─── PrimeNG Overrides ────────────────────────────────────────────── */
    ::ng-deep .apx-premium-dialog .p-dialog-content {
      padding: 0 !important;
      background: transparent !important;
      border-radius: 2rem !important;
      overflow: hidden;
    }
    ::ng-deep .apx-premium-dialog {
      border-radius: 2rem !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
    }

    /* ─── Shell Layout ─────────────────────────────────────────────────── */
    .apx-split-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #ffffff;
      min-height: 600px;
      border-radius: 2rem;
      overflow: hidden;
    }

    /* ─── Left Side: Content ───────────────────────────────────────────── */
    .apx-auth-content {
      padding: 3rem 4rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: #ffffff;
    }

    .apx-auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .apx-emoji-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .apx-auth-title {
      font-size: 2rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .apx-auth-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }

    /* Tabs */
    .apx-auth-tabs {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .apx-auth-tab {
      background: transparent;
      border: none;
      font-size: 0.875rem;
      font-weight: 600;
      color: #9ca3af;
      cursor: pointer;
      padding: 0.5rem 1rem;
      position: relative;
      transition: color 0.3s;
    }

    .apx-auth-tab.active {
      color: #111827;
    }

    .apx-auth-tab.active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 3px;
      border-radius: 2px;
      background: #1e3a8a;
    }

    /* Form & Fields */
    .apx-auth-forms-host {
      position: relative;
      overflow: hidden;
      width: 100%;
    }

    .apx-auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .apx-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .apx-field__input-wrap {
      position: relative;
      width: 100%;
    }

    .apx-field__input-wrap input {
      width: 100%;
      height: 3.25rem;
      padding: 0 3rem 0 1.25rem;
      border: 1px solid #e5e7eb;
      border-radius: 2rem; /* Pill shape */
      font-size: 0.9375rem;
      color: #111827;
      background: #ffffff;
      outline: none;
      transition: all 0.2s;
    }

    .apx-field__input-wrap input::placeholder {
      color: #9ca3af;
    }

    .apx-field__input-wrap input:focus {
      border-color: #1e3a8a;
      box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.1);
    }

    .apx-field__icon-right, .apx-field__eye {
      position: absolute;
      right: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      background: none;
      border: none;
      font-size: 1rem;
      display: flex;
      padding: 0;
      cursor: pointer;
    }

    /* Secondary Form Actions (Remember me & Forgot Pw) */
    .apx-form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0.5rem;
    }

    .apx-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #4b5563;
      cursor: pointer;
    }

    .apx-checkbox input {
      width: 1rem;
      height: 1rem;
      border-radius: 0.25rem;
      border: 1px solid #d1d5db;
      cursor: pointer;
    }

    .apx-auth-link {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }
    .apx-auth-link:hover { color: #111827; }

    /* CTA Button */
    .apx-auth-cta {
      width: 100%;
      height: 3.25rem;
      background: #1e3a8a; /* Deep blue from reference */
      color: white;
      border: none;
      border-radius: 2rem; /* Pill shape */
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
      margin-top: 0.5rem;
    }

    .apx-auth-cta:hover:not([disabled]) {
      background: #172554;
      transform: translateY(-1px);
    }
    .apx-auth-cta[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }

    /* Social Dividers & Buttons */
    .apx-social-divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 2rem 0 1.5rem;
      color: #9ca3af;
      font-size: 0.875rem;
    }
    .apx-social-divider::before, .apx-social-divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #f3f4f6;
    }
    .apx-social-divider span {
      padding: 0 1rem;
    }

    .apx-social-logins {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .social-btn {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      background: white;
      color: #374151;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .social-btn:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }

    /* ─── Right Side: Graphic ──────────────────────────────────────────── */
    .apx-auth-graphic {
      margin: 1rem 1rem 1rem 0;
      border-radius: 2rem;
      background: linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #3b82f6 100%);
      position: relative;
      overflow: hidden;
    }

    /* Mimicking the 3D abstract shapes with CSS */
    .fluid-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(40px);
    }
    
    .shape-1 {
      width: 400px;
      height: 400px;
      background: rgba(139, 92, 246, 0.4); /* Purple glow */
      top: -100px;
      left: -100px;
    }

    .shape-2 {
      width: 500px;
      height: 500px;
      background: rgba(30, 58, 138, 0.6); /* Deep blue glow */
      bottom: -200px;
      right: -100px;
    }

    /* Error Banners */
    .apx-auth-alert {
      padding: 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1rem;
      background: #fef2f2;
      color: #991b1b;
    }
    .apx-auth-alert.success {
      background: #f0fdf4;
      color: #166534;
    }

    /* ─── Responsive Adjustments ───────────────────────────────────────── */
    @media (max-width: 768px) {
      .apx-split-shell {
        grid-template-columns: 1fr;
        min-height: auto;
      }
      .apx-auth-graphic {
        display: none; /* Hide graphic on mobile */
      }
      .apx-auth-content {
        padding: 2.5rem 1.5rem;
      }
    }
  `]
})
export class StorefrontAuthModalComponent {
  readonly auth = inject(StorefrontAuthFacade);

  readonly visible = input(false);
  readonly orgSlug = input('');
  readonly visibleChange = output<boolean>();
  readonly authenticated = output<void>();

  readonly tab = signal<AuthTab>('login');
  readonly errorMsg = signal<string | null>(null);
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
    const { email, password, firstName, lastName } = form.value;
    this.auth.register(this.orgSlug(), { email, password, firstName, lastName }).subscribe({
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
// // src/app/modules/storefront-public/components/storefront-auth-modal/storefront-auth-modal.component.ts
// //
// // Premium auth modal — fully theme-matched to the commerce-flow design language.
// // Uses the same CSS variables, typography, and patterns as the address/checkout pages.
// // Smooth slide transition between Login ↔ Register tabs via Angular animations.

// import {
//   ChangeDetectionStrategy,
//   Component,
//   inject,
//   input,
//   output,
//   signal
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule, NgForm } from '@angular/forms';
// import { DialogModule } from 'primeng/dialog';
// import { RouterModule } from '@angular/router';
// import {
//   animate,
//   style,
//   transition,
//   trigger,
//   query,
//   animateChild,
//   group
// } from '@angular/animations';
// import { StorefrontAuthFacade } from '../../../../storefront/core/facades/storefront-auth.facade';

// type AuthTab = 'login' | 'register' | 'forgot';

// const slideLeft = [
//   query(':enter', [style({ opacity: 0, transform: 'translateX(32px)' })], { optional: true }),
//   query(':leave', [animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(-32px)' }))], { optional: true }),
//   query(':enter', [animate('240ms 80ms cubic-bezier(0.2,0.8,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))], { optional: true }),
// ];

// const slideRight = [
//   query(':enter', [style({ opacity: 0, transform: 'translateX(-32px)' })], { optional: true }),
//   query(':leave', [animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(32px)' }))], { optional: true }),
//   query(':enter', [animate('240ms 80ms cubic-bezier(0.2,0.8,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))], { optional: true }),
// ];

// @Component({
//   selector: 'app-storefront-auth-modal',
//   standalone: true,
//   imports: [CommonModule, FormsModule, DialogModule, RouterModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   animations: [
//     trigger('tabSlide', [
//       transition('login => register', slideLeft),
//       transition('register => login', slideRight),
//       transition('login => forgot', slideLeft),
//       transition('forgot => login', slideRight),
//     ])
//   ],
//   template: `
// <p-dialog
//   [visible]="visible()"
//   (visibleChange)="visibleChange.emit($event)"
//   [modal]="true"
//   [dismissableMask]="true"
//   [showHeader]="false"
//   appendTo="body"
//   styleClass="apx-auth-dialog"
//   [style]="{ width: '100%', maxWidth: '480px', padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }">

//   <div class="apx-auth-shell">

//     <!-- ── Brand header ─────────────────────────────────────────── -->
//     <div class="apx-auth-header">
//       <div class="apx-auth-icon">
//         <i class="pi" [class.pi-sign-in]="tab() === 'login'" [class.pi-user-plus]="tab() === 'register'"></i>
//       </div>
//       <div>
//         <p class="apx-auth-kicker">Storefront commerce</p>
//         <h2 class="apx-auth-title">{{ tab() === 'login' ? 'Welcome back' : tab() === 'forgot' ? 'Reset password' : 'Create account' }}</h2>
//         <p class="apx-auth-subtitle">
//           {{ tab() === 'login'
//             ? 'Sign in to sync your cart and view order history.'
//             : tab() === 'forgot'
//               ? 'Enter your email and we will send you a reset link.'
//               : 'Create a storefront account to track orders and save addresses.' }}
//         </p>
//       </div>
//     </div>

//     <!-- ── Tab pills ─────────────────────────────────────────────── -->
//     <div class="apx-auth-tabs">
//       <button class="apx-auth-tab" [class.active]="tab() === 'login'"
//         (click)="switchTab('login')" type="button">
//         <i class="pi pi-sign-in"></i>
//         Sign In
//       </button>
//       <button class="apx-auth-tab" [class.active]="tab() === 'register'"
//         (click)="switchTab('register')" type="button">
//         <i class="pi pi-user-plus"></i>
//         Create Account
//       </button>
//     </div>

//     <!-- ── Error banner ───────────────────────────────────────────── -->
//     @if (errorMsg()) {
//       <div class="apx-auth-alert" role="alert">
//         <i class="pi pi-exclamation-triangle"></i>
//         <span>{{ errorMsg() }}</span>
//       </div>
//     }

//     <!-- ── Form container with slide animation ───────────────────── -->
//     <div class="apx-auth-forms-host" [@tabSlide]="tab()">

//       <!-- LOGIN -->
//       @if (tab() === 'login') {
//         <form #loginForm="ngForm" (ngSubmit)="submitLogin(loginForm)" class="apx-auth-form" novalidate>

//           <label class="apx-field">
//             <span class="apx-field__label">Email address</span>
//             <div class="apx-field__input-wrap">
//               <i class="pi pi-envelope apx-field__icon"></i>
//               <input id="sf-login-email" name="email" type="email"
//                 placeholder="you@example.com"
//                 ngModel required email #loginEmail="ngModel"
//                 [class.invalid]="loginEmail.invalid && loginEmail.touched" />
//             </div>
//             @if (loginEmail.invalid && loginEmail.touched) {
//               <span class="apx-field__error">Please enter a valid email address</span>
//             }
//           </label>

//           <label class="apx-field">
//             <div class="apx-field__label-row">
//               <span class="apx-field__label">Password</span>
//               <button type="button" class="apx-auth-link" style="font-size: 0.75rem" (click)="switchTab('forgot')">Forgot?</button>
//             </div>
//             <div class="apx-field__input-wrap">
//               <i class="pi pi-lock apx-field__icon"></i>
//               <input id="sf-login-password" name="password"
//                 [type]="showPassword() ? 'text' : 'password'"
//                 placeholder="Your password"
//                 ngModel required minlength="6" #loginPw="ngModel"
//                 [class.invalid]="loginPw.invalid && loginPw.touched" />
//               <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
//                 <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
//               </button>
//             </div>
//             @if (loginPw.invalid && loginPw.touched) {
//               <span class="apx-field__error">Minimum 6 characters required</span>
//             }
//           </label>

//           <button type="submit" class="apx-auth-cta" [disabled]="loginForm.invalid || auth.loading()">
//             @if (auth.loading()) {
//               <i class="pi pi-spin pi-spinner"></i>
//               <span>Signing in…</span>
//             } @else {
//               <i class="pi pi-sign-in"></i>
//               <span>Sign In</span>
//             }
//           </button>

//           <p class="apx-auth-switch">
//             Don't have an account?
//             <button type="button" class="apx-auth-link" (click)="switchTab('register')">
//               Create one free →
//             </button>
//           </p>
//         </form>
//       }

//       <!-- FORGOT PASSWORD -->
//       @if (tab() === 'forgot') {
//         <form #forgotForm="ngForm" (ngSubmit)="submitForgot(forgotForm)" class="apx-auth-form" novalidate>
//           @if (forgotSuccess()) {
//             <div class="apx-auth-alert" style="background: #ecfdf5; border-color: #a7f3d0; color: #047857;">
//               <i class="pi pi-check-circle"></i>
//               <span>If an account exists with that email, we've sent password reset instructions.</span>
//             </div>
//             <button type="button" class="apx-auth-cta" (click)="switchTab('login')" style="margin-top: 1rem">
//               Back to Sign In
//             </button>
//           } @else {
//             <label class="apx-field">
//               <span class="apx-field__label">Email address</span>
//               <div class="apx-field__input-wrap">
//                 <i class="pi pi-envelope apx-field__icon"></i>
//                 <input id="sf-forgot-email" name="email" type="email"
//                   placeholder="you@example.com"
//                   ngModel required email #forgotEmail="ngModel"
//                   [class.invalid]="forgotEmail.invalid && forgotEmail.touched" />
//               </div>
//               @if (forgotEmail.invalid && forgotEmail.touched) {
//                 <span class="apx-field__error">Please enter a valid email address</span>
//               }
//             </label>

//             <button type="submit" class="apx-auth-cta" [disabled]="forgotForm.invalid || auth.loading()">
//               @if (auth.loading()) {
//                 <i class="pi pi-spin pi-spinner"></i>
//                 <span>Sending…</span>
//               } @else {
//                 <i class="pi pi-envelope"></i>
//                 <span>Send Reset Link</span>
//               }
//             </button>
//           }
          
//           <p class="apx-auth-switch">
//             Remember your password?
//             <button type="button" class="apx-auth-link" (click)="switchTab('login')">
//               Sign in →
//             </button>
//           </p>
//         </form>
//       }

//       <!-- REGISTER -->
//       @if (tab() === 'register') {
//         <form #registerForm="ngForm" (ngSubmit)="submitRegister(registerForm)" class="apx-auth-form" novalidate>

//           <div class="apx-form-grid">
//             <label class="apx-field">
//               <span class="apx-field__label">First name</span>
//               <div class="apx-field__input-wrap">
//                 <i class="pi pi-user apx-field__icon"></i>
//                 <input id="sf-reg-fname" name="firstName" type="text" placeholder="First name" ngModel />
//               </div>
//             </label>
//             <label class="apx-field">
//               <span class="apx-field__label">Last name</span>
//               <div class="apx-field__input-wrap">
//                 <i class="pi pi-user apx-field__icon"></i>
//                 <input id="sf-reg-lname" name="lastName" type="text" placeholder="Last name" ngModel />
//               </div>
//             </label>
//           </div>

//           <label class="apx-field">
//             <span class="apx-field__label">Email address</span>
//             <div class="apx-field__input-wrap">
//               <i class="pi pi-envelope apx-field__icon"></i>
//               <input id="sf-reg-email" name="email" type="email"
//                 placeholder="you@example.com"
//                 ngModel required email #regEmail="ngModel"
//                 [class.invalid]="regEmail.invalid && regEmail.touched" />
//             </div>
//             @if (regEmail.invalid && regEmail.touched) {
//               <span class="apx-field__error">Please enter a valid email address</span>
//             }
//           </label>

//           <label class="apx-field">
//             <span class="apx-field__label">Phone <span class="apx-field__optional">(optional)</span></span>
//             <div class="apx-field__input-wrap">
//               <i class="pi pi-phone apx-field__icon"></i>
//               <input id="sf-reg-phone" name="phone" type="tel" placeholder="+91 98765 43210" ngModel />
//             </div>
//           </label>

//           <label class="apx-field">
//             <span class="apx-field__label">Password</span>
//             <div class="apx-field__input-wrap">
//               <i class="pi pi-lock apx-field__icon"></i>
//               <input id="sf-reg-password" name="password"
//                 [type]="showPassword() ? 'text' : 'password'"
//                 placeholder="Minimum 6 characters"
//                 ngModel required minlength="6" #regPw="ngModel"
//                 [class.invalid]="regPw.invalid && regPw.touched" />
//               <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
//                 <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
//               </button>
//             </div>
//             @if (regPw.invalid && regPw.touched) {
//               <span class="apx-field__error">Minimum 6 characters required</span>
//             }
//           </label>

//           <button type="submit" class="apx-auth-cta" [disabled]="registerForm.invalid || auth.loading()">
//             @if (auth.loading()) {
//               <i class="pi pi-spin pi-spinner"></i>
//               <span>Creating account…</span>
//             } @else {
//               <i class="pi pi-user-plus"></i>
//               <span>Create Account</span>
//             }
//           </button>

//           <p class="apx-auth-switch">
//             Already have an account?
//             <button type="button" class="apx-auth-link" (click)="switchTab('login')">
//               Sign in →
//             </button>
//           </p>
//         </form>
//       }

//     </div><!-- /apx-auth-forms-host -->

//     <!-- ── Delivery Partner Redirect ────────────────────────────────── -->
//     <div class="apx-delivery-redirect">
//       <p>Delivery Partner?</p>
//       <div class="apx-delivery-links">
//         <a [routerLink]="['/store', orgSlug(), 'delivery', 'login']">In-house Login</a>
//         <span class="apx-divider">|</span>
//         <a routerLink="/apex-delivery/login">Apex Network Login</a>
//       </div>
//     </div>

//     <!-- ── Trust footer ───────────────────────────────────────────── -->
//     <div class="apx-auth-trust">
//       <i class="pi pi-lock"></i>
//       <span>Secure connection · Your data is safe</span>
//     </div>

//   </div><!-- /apx-auth-shell -->
// </p-dialog>
//   `,
//   styles: [`
//     /* ─── Reset PrimeNG dialog chrome ──────────────────────────────────── */
//     ::ng-deep .apx-auth-dialog .p-dialog-content {
//       padding: 0 !important;
//       background: transparent !important;
//       border-radius: 1.5rem !important;
//       overflow: hidden;
//     }
//     ::ng-deep .apx-auth-dialog {
//       box-shadow: 0 24px 64px -12px rgba(0,0,0,0.35) !important;
//       border-radius: 1.5rem !important;
//       overflow: hidden;
//     }

//     /* ─── Shell ─────────────────────────────────────────────────────────── */
//     .apx-auth-shell {
//       background:
//         radial-gradient(circle at 90% 0%, color-mix(in srgb, var(--color-primary, #6366f1) 10%, transparent), transparent 24rem),
//         var(--bg-secondary, var(--bg-primary));
//       border: 1px solid var(--border-secondary, #e5e7eb);
//       border-radius: 1.5rem;
//       overflow: hidden;
//     }

//     /* ─── Header block ───────────────────────────────────────────────────── */
//     .apx-auth-header {
//       display: flex;
//       align-items: flex-start;
//       gap: 1.1rem;
//       padding: 2rem 2rem 1.25rem;
//       border-bottom: 1px solid var(--border-secondary, #e5e7eb);
//     }

//     .apx-auth-icon {
//       flex-shrink: 0;
//       width: 3rem;
//       height: 3rem;
//       display: grid;
//       place-items: center;
//       border-radius: 1rem;
//       background: var(--component-bg-hover, rgba(99,102,241,0.08));
//       color: var(--color-primary, #6366f1);
//       font-size: 1.2rem;
//       transition: all 0.3s cubic-bezier(0.2,0.8,0.2,1);
//     }

//     .apx-auth-kicker {
//       margin: 0 0 0.2rem;
//       font-size: 0.7rem;
//       font-weight: 850;
//       text-transform: uppercase;
//       letter-spacing: 0.08em;
//       color: var(--text-secondary, #6b7280);
//     }

//     .apx-auth-title {
//       margin: 0 0 0.3rem;
//       font-family: var(--apx-font-display, 'Georgia', serif);
//       font-size: clamp(1.4rem, 3vw, 1.8rem);
//       line-height: 1.1;
//       color: var(--text-primary, #111827);
//     }

//     .apx-auth-subtitle {
//       margin: 0;
//       font-size: 0.875rem;
//       color: var(--text-secondary, #6b7280);
//       line-height: 1.55;
//       max-width: 34ch;
//     }

//     /* ─── Tab pills ──────────────────────────────────────────────────────── */
//     .apx-auth-tabs {
//       display: grid;
//       grid-template-columns: 1fr 1fr;
//       gap: 0.35rem;
//       padding: 0.75rem;
//       background: var(--bg-primary);
//       border-bottom: 1px solid var(--border-secondary, #e5e7eb);
//     }

//     .apx-auth-tab {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: 0.5rem;
//       padding: 0.7rem 1rem;
//       border: 0;
//       border-radius: 0.85rem;
//       background: transparent;
//       color: var(--text-secondary, #6b7280);
//       font-size: 0.875rem;
//       font-weight: 850;
//       font-family: inherit;
//       cursor: pointer;
//       transition: all 0.2s cubic-bezier(0.2,0.8,0.2,1);
//     }

//     .apx-auth-tab.active {
//       background: var(--bg-secondary, var(--bg-primary));
//       color: var(--text-primary, #111827);
//       box-shadow: 0 1px 4px rgba(0,0,0,0.1), 0 0 0 1px var(--border-secondary, #e5e7eb);
//     }

//     .apx-auth-tab:hover:not(.active) {
//       background: var(--component-bg-hover, rgba(0,0,0,0.04));
//       color: var(--text-primary, #111827);
//     }

//     /* ─── Error alert ────────────────────────────────────────────────────── */
//     .apx-auth-alert {
//       display: flex;
//       align-items: center;
//       gap: 0.65rem;
//       margin: 0.75rem 1.5rem 0;
//       padding: 0.85rem 1rem;
//       border-radius: 0.85rem;
//       background: var(--bg-primary)7ed;
//       border: 1px solid #fed7aa;
//       color: #9a3412;
//       font-size: 0.875rem;
//       font-weight: 700;
//     }

//     /* ─── Forms host ─────────────────────────────────────────────────────── */
//     .apx-auth-forms-host {
//       position: relative;
//       overflow: hidden;
//     }

//     .apx-auth-form {
//       display: grid;
//       gap: 1rem;
//       padding: 1.5rem;
//     }

//     .apx-form-grid {
//       display: grid;
//       grid-template-columns: 1fr 1fr;
//       gap: 0.75rem;
//     }

//     /* ─── Field ──────────────────────────────────────────────────────────── */
//     .apx-field {
//       display: grid;
//       gap: 0.4rem;
//     }

//     .apx-field__label-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .apx-field__label {
//       font-size: 0.8125rem;
//       font-weight: 850;
//       color: var(--text-secondary, #6b7280);
//       text-transform: none;
//       letter-spacing: 0;
//     }

//     .apx-field__optional {
//       font-weight: 500;
//       font-style: italic;
//       font-size: 0.75rem;
//       color: var(--text-secondary, #9ca3af);
//     }

//     .apx-field__input-wrap {
//       position: relative;
//       display: flex;
//       align-items: center;
//     }

//     .apx-field__icon {
//       position: absolute;
//       left: 0.875rem;
//       color: var(--text-secondary, #9ca3af);
//       font-size: 0.875rem;
//       pointer-events: none;
//       z-index: 1;
//       transition: color 0.2s;
//     }

//     .apx-field__input-wrap input {
//       width: 100%;
//       height: 2.85rem;
//       padding: 0 2.75rem 0 2.6rem;
//       border: 1px solid var(--border-secondary, #e5e7eb);
//       border-radius: 0.85rem;
//       background: var(--bg-primary);
//       color: var(--text-primary, #111827);
//       font-size: 0.9375rem;
//       font-family: inherit;
//       transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
//       outline: none;
//     }

//     .apx-field__input-wrap input:focus {
//       border-color: var(--color-primary, #6366f1);
//       background: var(--bg-secondary, var(--bg-primary));
//       box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #6366f1) 15%, transparent);
//     }

//     .apx-field__input-wrap input:focus + .apx-field__icon,
//     .apx-field__input-wrap:focus-within .apx-field__icon {
//       color: var(--color-primary, #6366f1);
//     }

//     .apx-field__input-wrap input.invalid {
//       border-color: #f97316;
//     }

//     .apx-field__eye {
//       position: absolute;
//       right: 0.75rem;
//       background: none;
//       border: none;
//       color: var(--text-secondary, #9ca3af);
//       cursor: pointer;
//       padding: 0.25rem;
//       display: flex;
//       align-items: center;
//       border-radius: 0.5rem;
//       transition: color 0.2s;
//     }
//     .apx-field__eye:hover { color: var(--text-primary, #111827); }

//     .apx-field__error {
//       font-size: 0.75rem;
//       color: #ea580c;
//       font-weight: 600;
//     }

//     /* ─── CTA button ─────────────────────────────────────────────────────── */
//     .apx-auth-cta {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: 0.6rem;
//       width: 100%;
//       min-height: 3rem;
//       margin-top: 0.25rem;
//       border: 0;
//       border-radius: 0.9rem;
//       background: var(--apx-gradient-commerce, linear-gradient(135deg, #6366f1, #8b5cf6));
//       color: var(--bg-primary);
//       font-size: 1rem;
//       font-weight: 900;
//       font-family: inherit;
//       cursor: pointer;
//       transition: opacity 0.2s, transform 0.15s;
//       box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary, #6366f1) 35%, transparent);
//     }

//     .apx-auth-cta:hover:not([disabled]) {
//       opacity: 0.92;
//       transform: translateY(-1px);
//     }

//     .apx-auth-cta:active:not([disabled]) {
//       transform: translateY(0);
//     }

//     .apx-auth-cta[disabled] {
//       opacity: 0.5;
//       cursor: not-allowed;
//       transform: none;
//       box-shadow: none;
//     }

//     /* ─── Switch link ────────────────────────────────────────────────────── */
//     .apx-auth-switch {
//       margin: 0;
//       text-align: center;
//       font-size: 0.875rem;
//       color: var(--text-secondary, #6b7280);
//     }

//     .apx-auth-link {
//       background: none;
//       border: none;
//       color: var(--color-primary, #6366f1);
//       font-weight: 850;
//       font-size: 0.875rem;
//       font-family: inherit;
//       cursor: pointer;
//       padding: 0;
//       transition: opacity 0.2s;
//     }
//     .apx-auth-link:hover { opacity: 0.75; }

//     /* ─── Trust footer ───────────────────────────────────────────────────── */
//     .apx-auth-trust {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: 0.5rem;
//       padding: 0.9rem;
//       border-top: 1px solid var(--border-secondary, #e5e7eb);
//       background: var(--bg-primary);
//       font-size: 0.75rem;
//       font-weight: 700;
//       color: var(--text-secondary, #9ca3af);
//       text-transform: uppercase;
//       letter-spacing: 0.06em;
//     }

//     /* ─── Delivery Redirect ──────────────────────────────────────────────── */
//     .apx-delivery-redirect {
//       text-align: center;
//       padding: 1.25rem;
//       border-top: 1px solid var(--border-secondary, #e5e7eb);
//       background: var(--bg-secondary, var(--bg-primary));
//     }
    
//     .apx-delivery-redirect p {
//       margin: 0 0 0.5rem;
//       font-size: 0.75rem;
//       font-weight: 700;
//       color: var(--text-secondary, #6b7280);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }
    
//     .apx-delivery-links {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: 0.75rem;
//       font-size: 0.8125rem;
//     }
    
//     .apx-delivery-links a {
//       color: var(--color-primary, #6366f1);
//       text-decoration: none;
//       font-weight: 600;
//       transition: opacity 0.2s;
//     }
    
//     .apx-delivery-links a:hover {
//       opacity: 0.8;
//       text-decoration: underline;
//     }
    
//     .apx-divider {
//       color: var(--border-secondary, #e5e7eb);
//     }

//     /* ─── Responsive ─────────────────────────────────────────────────────── */
//     @media (max-width: 480px) {
//       .apx-form-grid { grid-template-columns: 1fr; }
//       .apx-auth-header { padding: 1.5rem 1.25rem 1rem; }
//       .apx-auth-form { padding: 1.25rem; }
//     }
//   `]
// })
// export class StorefrontAuthModalComponent {
//   readonly auth = inject(StorefrontAuthFacade);

//   // ── Inputs / outputs ────────────────────────────────────────────────────────
//   readonly visible   = input(false);
//   readonly orgSlug   = input('');
//   readonly visibleChange  = output<boolean>();
//   /** Fires after successful login or register so the parent can continue its action. */
//   readonly authenticated  = output<void>();

//   // ── Local state ─────────────────────────────────────────────────────────────
//   readonly tab          = signal<AuthTab>('login');
//   readonly errorMsg     = signal<string | null>(null);
//   readonly forgotSuccess = signal(false);
//   readonly showPassword = signal(false);

//   switchTab(t: AuthTab) {
//     this.errorMsg.set(null);
//     this.forgotSuccess.set(false);
//     this.showPassword.set(false);
//     this.tab.set(t);
//   }

//   submitLogin(form: NgForm) {
//     if (form.invalid) { form.form.markAllAsTouched(); return; }
//     this.errorMsg.set(null);
//     const { email, password } = form.value;
//     this.auth.login(this.orgSlug(), { email, password }).subscribe({
//       next: customer => {
//         if (customer) {
//           this.visibleChange.emit(false);
//           this.authenticated.emit();
//         }
//       },
//       error: err => this.errorMsg.set(err?.error?.message ?? 'Login failed. Check your credentials and try again.')
//     });
//   }

//   submitRegister(form: NgForm) {
//     if (form.invalid) { form.form.markAllAsTouched(); return; }
//     this.errorMsg.set(null);
//     const { email, password, firstName, lastName, phone } = form.value;
//     this.auth.register(this.orgSlug(), { email, password, firstName, lastName, phone }).subscribe({
//       next: customer => {
//         if (customer) {
//           this.visibleChange.emit(false);
//           this.authenticated.emit();
//         }
//       },
//       error: err => this.errorMsg.set(err?.error?.message ?? 'Registration failed. Please try again.')
//     });
//   }

//   submitForgot(form: NgForm) {
//     if (form.invalid) { form.form.markAllAsTouched(); return; }
//     this.errorMsg.set(null);
//     this.auth.forgotPassword(this.orgSlug(), { email: form.value.email }).subscribe({
//       next: success => {
//         if (success) {
//           this.forgotSuccess.set(true);
//         } else {
//           this.errorMsg.set('Failed to process request. Please try again.');
//         }
//       }
//     });
//   }
// }

