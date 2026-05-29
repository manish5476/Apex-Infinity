



import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StorefrontAuthFacade } from '../../../../storefront/core/facades/storefront-auth.facade';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="apx-reset-shell">
      <div class="apx-reset-card">
        <div class="apx-reset-header">
          <div class="apx-reset-icon">
            <i class="pi pi-lock"></i>
          </div>
          <h2 class="apx-reset-title">Set new password</h2>
          <p class="apx-reset-subtitle">Enter your new password below.</p>
        </div>

        @if (errorMsg()) {
          <div class="apx-reset-alert" role="alert">
            <i class="pi pi-exclamation-triangle"></i>
            <span>{{ errorMsg() }}</span>
          </div>
        }

        @if (successMsg()) {
          <div class="apx-reset-alert success" role="alert">
            <i class="pi pi-check-circle"></i>
            <span>{{ successMsg() }}</span>
          </div>
          <div class="p-6">
            <button class="apx-reset-cta" (click)="goToLogin()">
              Go to Login
            </button>
          </div>
        } @else {
          <form #resetForm="ngForm" (ngSubmit)="submitReset(resetForm)" class="apx-reset-form" novalidate>
            <label class="apx-field">
              <span class="apx-field__label">New Password</span>
              <div class="apx-field__input-wrap">
                <i class="pi pi-lock apx-field__icon"></i>
                <input id="sf-new-pw" name="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  placeholder="Minimum 8 characters"
                  ngModel required minlength="8" #newPw="ngModel"
                  [class.invalid]="newPw.invalid && newPw.touched" />
                <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
                  <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
                </button>
              </div>
              @if (newPw.invalid && newPw.touched) {
                <span class="apx-field__error">Minimum 8 characters required</span>
              }
            </label>

            <button type="submit" class="apx-reset-cta" [disabled]="resetForm.invalid || auth.loading()">
              @if (auth.loading()) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Resetting…</span>
              } @else {
                <i class="pi pi-check"></i>
                <span>Confirm New Password</span>
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .apx-reset-shell { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 2rem; background: var(--bg-secondary); }
    .apx-reset-card { width: 100%; max-width: 420px; background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: 1.5rem; box-shadow: var(--shadow-xl); overflow: hidden; }
    
    .apx-reset-header { display: flex; flex-direction: column; align-items: center; padding: 2.5rem 2rem 1.5rem; border-bottom: 1px solid var(--border-secondary); text-align: center; }
    .apx-reset-icon { width: 3.5rem; height: 3.5rem; display: grid; place-items: center; border-radius: 1rem; background: var(--bg-secondary); color: var(--accent-primary); font-size: 1.5rem; margin-bottom: 1rem; }
    
    .apx-reset-title { margin: 0 0 0.5rem; font-family: var(--font-heading); font-size: 1.5rem; line-height: 1.2; color: var(--text-primary); }
    .apx-reset-subtitle { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
    
    .apx-reset-form { display: grid; gap: 1.25rem; padding: 1.5rem 2rem 2.5rem; }
    
    .apx-reset-alert { display: flex; align-items: center; gap: 0.65rem; margin: 1.5rem 2rem 0; padding: 0.85rem 1rem; border-radius: 0.85rem; background: var(--bg-primary); border: 1px solid var(--border-secondary); color: var(--color-error); font-size: 0.875rem; font-weight: 700; }
    .apx-reset-alert.success { background: var(--color-success-bg, #ecfdf5); border-color: var(--color-success, #047857); color: var(--color-success, #047857); }
    
    .apx-field { display: grid; gap: 0.4rem; }
    .apx-field__label { font-size: 0.8125rem; font-weight: 850; color: var(--text-secondary); }
    .apx-field__input-wrap { position: relative; display: flex; align-items: center; }
    .apx-field__icon { position: absolute; left: 0.875rem; color: var(--text-secondary); font-size: 0.875rem; z-index: 1; }
    .apx-field__input-wrap input { width: 100%; height: 2.85rem; padding: 0 2.75rem 0 2.6rem; border: 1px solid var(--border-secondary); border-radius: 0.85rem; font-size: 0.9375rem; outline: none; background: var(--bg-primary); color: var(--text-primary); transition: border-color 0.2s, box-shadow 0.2s; }
    .apx-field__input-wrap input:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent); }
    .apx-field__input-wrap input.invalid { border-color: var(--color-error); }
    
    .apx-field__eye { position: absolute; right: 0.75rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; }
    .apx-field__error { font-size: 0.75rem; color: var(--color-error); font-weight: 600; }
    
    .apx-reset-cta { display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%; min-height: 3rem; border: 0; border-radius: 0.9rem; background: var(--accent-primary); color: var(--bg-primary); font-size: 1rem; font-weight: 900; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
    .apx-reset-cta:hover:not([disabled]) { opacity: 0.92; transform: translateY(-1px); }
    .apx-reset-cta[disabled] { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  readonly auth = inject(StorefrontAuthFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly token = signal<string>('');
  readonly orgSlug = signal<string>('');
  
  readonly showPassword = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  ngOnInit() {
    this.token.set(this.route.snapshot.queryParamMap.get('token') || '');
    
    let slug = this.route.parent?.snapshot.paramMap.get('orgSlug') || this.route.snapshot.paramMap.get('orgSlug');
    if (!slug) {
      const segments = this.router.url.split('/');
      const storeIndex = segments.indexOf('store');
      if (storeIndex !== -1 && segments.length > storeIndex + 1) slug = segments[storeIndex + 1];
    }
    
    this.orgSlug.set(slug || '');

    if (!this.token()) this.errorMsg.set('Invalid or missing reset token.');
  }

  submitReset(form: NgForm) {
    if (form.invalid || !this.token()) { form.form.markAllAsTouched(); return; }
    this.errorMsg.set(null);
    
    this.auth.resetPassword(this.orgSlug(), { token: this.token(), password: form.value.password }).subscribe({
      next: (success) => {
        if (success) {
          this.successMsg.set('Password reset successfully. You can now login.');
        } else {
          this.errorMsg.set(this.auth.error()?.message || 'Failed to reset password. The token may be expired.');
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/store', this.orgSlug(), 'login']);
  }
}
// import { CommonModule } from '@angular/common';
// import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
// import { FormsModule, NgForm } from '@angular/forms';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { StorefrontAuthFacade } from '../../../../storefront/core/facades/storefront-auth.facade';

// @Component({
//   selector: 'app-reset-password',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <div class="apx-reset-shell">
//       <div class="apx-reset-card">
//         <div class="apx-reset-header">
//           <div class="apx-reset-icon">
//             <i class="pi pi-lock"></i>
//           </div>
//           <h2 class="apx-reset-title">Set new password</h2>
//           <p class="apx-reset-subtitle">Enter your new password below.</p>
//         </div>

//         @if (errorMsg()) {
//           <div class="apx-reset-alert" role="alert">
//             <i class="pi pi-exclamation-triangle"></i>
//             <span>{{ errorMsg() }}</span>
//           </div>
//         }

//         @if (successMsg()) {
//           <div class="apx-reset-alert success" role="alert">
//             <i class="pi pi-check-circle"></i>
//             <span>{{ successMsg() }}</span>
//           </div>
//           <div style="padding: 1.5rem">
//             <button class="apx-reset-cta" (click)="goToLogin()">
//               Go to Login
//             </button>
//           </div>
//         } @else {
//           <form #resetForm="ngForm" (ngSubmit)="submitReset(resetForm)" class="apx-reset-form" novalidate>
//             <label class="apx-field">
//               <span class="apx-field__label">New Password</span>
//               <div class="apx-field__input-wrap">
//                 <i class="pi pi-lock apx-field__icon"></i>
//                 <input id="sf-new-pw" name="password"
//                   [type]="showPassword() ? 'text' : 'password'"
//                   placeholder="Minimum 8 characters"
//                   ngModel required minlength="8" #newPw="ngModel"
//                   [class.invalid]="newPw.invalid && newPw.touched" />
//                 <button type="button" class="apx-field__eye" (click)="showPassword.set(!showPassword())">
//                   <i class="pi" [class.pi-eye]="!showPassword()" [class.pi-eye-slash]="showPassword()"></i>
//                 </button>
//               </div>
//               @if (newPw.invalid && newPw.touched) {
//                 <span class="apx-field__error">Minimum 8 characters required</span>
//               }
//             </label>

//             <button type="submit" class="apx-reset-cta" [disabled]="resetForm.invalid || auth.loading()">
//               @if (auth.loading()) {
//                 <i class="pi pi-spin pi-spinner"></i>
//                 <span>Resetting…</span>
//               } @else {
//                 <i class="pi pi-check"></i>
//                 <span>Confirm New Password</span>
//               }
//             </button>
//           </form>
//         }
//       </div>
//     </div>
//   `,
//   styles: [`
//     .apx-reset-shell {
//       display: flex;
//       justify-content: center;
//       align-items: center;
//       min-height: 80vh;
//       padding: 2rem;
//       background: var(--bg-secondary, #f9fafb);
//     }
//     .apx-reset-card {
//       width: 100%;
//       max-width: 420px;
//       background: var(--bg-primary, var(--bg-primary));
//       border: 1px solid var(--border-secondary, #e5e7eb);
//       border-radius: 1.5rem;
//       box-shadow: 0 24px 64px -12px rgba(0,0,0,0.1);
//       overflow: hidden;
//     }
//     .apx-reset-header {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       padding: 2.5rem 2rem 1.5rem;
//       border-bottom: 1px solid var(--border-secondary, #e5e7eb);
//       text-align: center;
//     }
//     .apx-reset-icon {
//       width: 3.5rem;
//       height: 3.5rem;
//       display: grid;
//       place-items: center;
//       border-radius: 1rem;
//       background: var(--component-bg-hover, rgba(99,102,241,0.08));
//       color: var(--color-primary, #6366f1);
//       font-size: 1.5rem;
//       margin-bottom: 1rem;
//     }
//     .apx-reset-title {
//       margin: 0 0 0.5rem;
//       font-family: var(--apx-font-display, 'Georgia', serif);
//       font-size: 1.5rem;
//       line-height: 1.2;
//       color: var(--text-primary, #111827);
//     }
//     .apx-reset-subtitle {
//       margin: 0;
//       font-size: 0.875rem;
//       color: var(--text-secondary, #6b7280);
//     }
//     .apx-reset-form {
//       display: grid;
//       gap: 1.25rem;
//       padding: 1.5rem 2rem 2.5rem;
//     }
//     .apx-reset-alert {
//       display: flex;
//       align-items: center;
//       gap: 0.65rem;
//       margin: 1.5rem 2rem 0;
//       padding: 0.85rem 1rem;
//       border-radius: 0.85rem;
//       background: var(--bg-primary)7ed;
//       border: 1px solid #fed7aa;
//       color: #9a3412;
//       font-size: 0.875rem;
//       font-weight: 700;
//     }
//     .apx-reset-alert.success {
//       background: #ecfdf5;
//       border-color: #a7f3d0;
//       color: #047857;
//     }
    
//     /* Input styles */
//     .apx-field { display: grid; gap: 0.4rem; }
//     .apx-field__label { font-size: 0.8125rem; font-weight: 850; color: var(--text-secondary, #6b7280); }
//     .apx-field__input-wrap { position: relative; display: flex; align-items: center; }
//     .apx-field__icon { position: absolute; left: 0.875rem; color: var(--text-secondary, #9ca3af); font-size: 0.875rem; z-index: 1; }
//     .apx-field__input-wrap input { width: 100%; height: 2.85rem; padding: 0 2.75rem 0 2.6rem; border: 1px solid var(--border-secondary, #e5e7eb); border-radius: 0.85rem; font-size: 0.9375rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
//     .apx-field__input-wrap input:focus { border-color: var(--color-primary, #6366f1); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #6366f1) 15%, transparent); }
//     .apx-field__input-wrap input.invalid { border-color: #f97316; }
//     .apx-field__eye { position: absolute; right: 0.75rem; background: none; border: none; color: var(--text-secondary, #9ca3af); cursor: pointer; padding: 0.25rem; }
//     .apx-field__error { font-size: 0.75rem; color: #ea580c; font-weight: 600; }
    
//     /* CTA */
//     .apx-reset-cta { display: flex; align-items: center; justify-content: center; gap: 0.6rem; width: 100%; min-height: 3rem; border: 0; border-radius: 0.9rem; background: var(--apx-gradient-commerce, linear-gradient(135deg, #6366f1, #8b5cf6)); color: var(--bg-primary); font-size: 1rem; font-weight: 900; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
//     .apx-reset-cta:hover:not([disabled]) { opacity: 0.92; transform: translateY(-1px); }
//     .apx-reset-cta[disabled] { opacity: 0.5; cursor: not-allowed; }
//   `]
// })
// export class ResetPasswordComponent implements OnInit {
//   readonly auth = inject(StorefrontAuthFacade);
//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);

//   readonly token = signal<string>('');
//   readonly orgSlug = signal<string>('');
  
//   readonly showPassword = signal(false);
//   readonly errorMsg = signal<string | null>(null);
//   readonly successMsg = signal<string | null>(null);

//   ngOnInit() {
//     this.token.set(this.route.snapshot.queryParamMap.get('token') || '');
    
//     // First try parent params (if rendered as child of /:orgSlug)
//     let slug = this.route.parent?.snapshot.paramMap.get('orgSlug');
//     if (!slug) {
//       // Then try this route
//       slug = this.route.snapshot.paramMap.get('orgSlug');
//     }
    
//     if (!slug) {
//       // Fallback: extract from URL
//       const segments = this.router.url.split('/');
//       const storeIndex = segments.indexOf('store');
//       if (storeIndex !== -1 && segments.length > storeIndex + 1) {
//         slug = segments[storeIndex + 1];
//       }
//     }
    
//     this.orgSlug.set(slug || '');

//     if (!this.token()) {
//       this.errorMsg.set('Invalid or missing reset token.');
//     }
//   }

//   submitReset(form: NgForm) {
//     if (form.invalid || !this.token()) { form.form.markAllAsTouched(); return; }
//     this.errorMsg.set(null);
    
//     const newPassword = form.value.password;
    
//     this.auth.resetPassword(this.orgSlug(), { token: this.token(), password: newPassword }).subscribe({
//       next: (success) => {
//         if (success) {
//           this.successMsg.set('Password reset successfully. You can now login.');
//         } else {
//           this.errorMsg.set(this.auth.error()?.message || 'Failed to reset password. The token may be expired.');
//         }
//       }
//     });
//   }

//   goToLogin() {
//     this.router.navigate(['/store', this.orgSlug(), 'login']);
//   }
// }
