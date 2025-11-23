import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="auth-wrapper">
      <section class="auth-container">
        <div class="auth-banner">
          <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1470&auto=format&fit=crop" alt="Reset" />
          <div class="auth-overlay"></div>
          <div class="auth-banner-text">
            <h2>Fresh Start</h2>
            <p>Create a new secure password for your account.</p>
          </div>
        </div>

        <div class="auth-form-panel">
          <div class="auth-content">
            <div class="auth-header">
              <div class="icon-box"><i class="pi pi-key"></i></div>
              <h1 class="auth-title">Reset Password</h1>
              <p class="auth-subtitle">Please enter your new password below.</p>
            </div>

            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
              <div class="form-group">
                <label>New Password <span class="req">*</span></label>
                <p-password formControlName="password" [toggleMask]="true" placeholder="Min 8 chars" 
                            styleClass="w-full" inputStyleClass="w-full" [feedback]="true"></p-password>
              </div>

              <div class="form-group">
                <label>Confirm Password <span class="req">*</span></label>
                <p-password formControlName="passwordConfirm" [toggleMask]="true" placeholder="Re-enter password" 
                            styleClass="w-full" inputStyleClass="w-full" [feedback]="false"></p-password>
              </div>

              <div class="auth-footer">
                <button pButton label="Reset Password" icon="pi pi-check-circle" iconPos="right" 
                        type="submit" class="submit-btn" [loading]="isLoading()" [disabled]="resetForm.invalid"></button>
                <p class="auth-footer-text">
                  <a routerLink="/auth/login" class="auth-link">Back to Login</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; }
    .auth-wrapper { display: flex; justify-content: center; align-items: center; height: 100%; background: var(--bg-ternary); padding: 1rem; }
    .auth-container { display: flex; width: 100%; max-width: 1200px; height: 80vh; min-height: 600px; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 20px; box-shadow: var(--shadow-2xl); overflow: hidden; }
    .auth-banner { width: 45%; position: relative; background: #000; }
    .auth-banner img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
    .auth-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7)); }
    .auth-banner-text { position: absolute; bottom: 3rem; left: 3rem; color: #fff; z-index: 2; }
    .auth-banner-text h2 { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
    .auth-form-panel { flex: 1; display: flex; justify-content: center; align-items: center; padding: 3rem; }
    .auth-content { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 2rem; }
    .auth-header { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .icon-box { width: 56px; height: 56px; background: var(--component-bg-active); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; color: var(--accent-primary); font-size: 1.5rem; }
    .auth-title { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
    .auth-subtitle { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
    .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
    .auth-footer { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    ::ng-deep .submit-btn { width: 100%; height: 50px; border-radius: 99px; font-weight: 600; background: var(--accent-gradient); border: none; }
    .auth-footer-text { text-align: center; font-size: 0.9rem; color: var(--text-secondary); }
    .auth-link { color: var(--accent-primary); font-weight: 600; cursor: pointer; margin-left: 4px; }
    @media (max-width: 1024px) { .auth-container { flex-direction: column; height: auto; min-height: 100vh; } .auth-banner { width: 100%; height: 200px; } .auth-banner-text { display: none; } }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  
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
    if (this.resetForm.invalid || !this.token) return;
    
    if (this.resetForm.value.password !== this.resetForm.value.passwordConfirm) {
      this.messageService.add({ severity: 'warn', summary: 'Mismatch', detail: 'Passwords do not match.' });
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword(this.token, this.resetForm.value).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Reset failed.' });
      }
    });
  }
}

// import { Component, inject, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { ActivatedRoute, RouterLink } from '@angular/router';
// import { ToastModule } from 'primeng/toast';
// import { PasswordModule } from 'primeng/password';
// import { ButtonModule } from 'primeng/button';
// import { MessageService } from 'primeng/api';
// import { AuthService } from '../../services/auth-service';

// @Component({
//   selector: 'app-reset-password',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
//   providers: [MessageService],
//   template: `
//     <p-toast></p-toast>
//     <div class="auth-wrapper">
//       <section class="auth-container">
//         <div class="auth-banner">
//           <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1470&auto=format&fit=crop" alt="Reset" />
//           <div class="auth-overlay"></div>
//           <div class="auth-banner-text">
//             <h2>Fresh Start</h2>
//             <p>Create a new secure password for your account.</p>
//           </div>
//         </div>

//         <div class="auth-form-panel">
//           <div class="auth-content">
//             <div class="auth-header">
//               <div class="icon-box"><i class="pi pi-key"></i></div>
//               <h1 class="auth-title">Reset Password</h1>
//               <p class="auth-subtitle">Please enter your new password below.</p>
//             </div>

//             <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
//               <div class="form-group">
//                 <label>New Password <span class="req">*</span></label>
//                 <p-password formControlName="password" [toggleMask]="true" placeholder="Min 8 chars" 
//                             styleClass="w-full" inputStyleClass="w-full" [feedback]="true"></p-password>
//               </div>

//               <div class="form-group">
//                 <label>Confirm Password <span class="req">*</span></label>
//                 <p-password formControlName="passwordConfirm" [toggleMask]="true" placeholder="Re-enter password" 
//                             styleClass="w-full" inputStyleClass="w-full" [feedback]="false"></p-password>
//               </div>

//               <div class="auth-footer">
//                 <button pButton label="Reset Password" icon="pi pi-check-circle" iconPos="right" 
//                         type="submit" class="submit-btn" [loading]="isLoading()" [disabled]="resetForm.invalid"></button>
//                 <p class="auth-footer-text">
//                   <a routerLink="/auth/login" class="auth-link">Back to Login</a>
//                 </p>
//               </div>
//             </form>
//           </div>
//         </div>
//       </section>
//     </div>
//   `,
//   styles: [`
//     :host { display: block; width: 100%; height: 100vh; }
//     .auth-wrapper { display: flex; justify-content: center; align-items: center; height: 100%; background: var(--bg-ternary); padding: 1rem; }
//     .auth-container { display: flex; width: 100%; max-width: 1200px; height: 80vh; min-height: 600px; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 20px; box-shadow: var(--shadow-2xl); overflow: hidden; }
//     .auth-banner { width: 45%; position: relative; background: #000; }
//     .auth-banner img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
//     .auth-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7)); }
//     .auth-banner-text { position: absolute; bottom: 3rem; left: 3rem; color: #fff; z-index: 2; }
//     .auth-banner-text h2 { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
//     .auth-form-panel { flex: 1; display: flex; justify-content: center; align-items: center; padding: 3rem; }
//     .auth-content { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 2rem; }
//     .auth-header { text-align: center; display: flex; flex-direction: column; align-items: center; }
//     .icon-box { width: 56px; height: 56px; background: var(--component-bg-active); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; color: var(--accent-primary); font-size: 1.5rem; }
//     .auth-title { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
//     .auth-subtitle { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
//     .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
//     .form-group { display: flex; flex-direction: column; gap: 6px; }
//     .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
//     .auth-footer { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
//     ::ng-deep .submit-btn { width: 100%; height: 50px; border-radius: 99px; font-weight: 600; background: var(--accent-gradient); border: none; }
//     .auth-footer-text { text-align: center; font-size: 0.9rem; color: var(--text-secondary); }
//     .auth-link { color: var(--accent-primary); font-weight: 600; cursor: pointer; margin-left: 4px; }
//     @media (max-width: 1024px) { .auth-container { flex-direction: column; height: auto; min-height: 100vh; } .auth-banner { width: 100%; height: 200px; } .auth-banner-text { display: none; } }
//   `]
// })
// export class ResetPasswordComponent implements OnInit {
//   private fb = inject(FormBuilder);
//   private route = inject(ActivatedRoute);
//   private authService = inject(AuthService);
//   private messageService = inject(MessageService);
  
//   isLoading = signal(false);
//   token = '';

//   resetForm = this.fb.group({
//     password: ['', [Validators.required, Validators.minLength(8)]],
//     passwordConfirm: ['', [Validators.required]]
//   });

//   ngOnInit() {
//     this.token = this.route.snapshot.paramMap.get('token') || '';
//   }

//   onSubmit() {
//     if (this.resetForm.invalid || !this.token) return;
    
//     if (this.resetForm.value.password !== this.resetForm.value.passwordConfirm) {
//       this.messageService.add({ severity: 'warn', summary: 'Mismatch', detail: 'Passwords do not match.' });
//       return;
//     }

//     this.isLoading.set(true);
//     this.authService.resetPassword(this.token, this.resetForm.value).subscribe({
//       next: () => this.isLoading.set(false),
//       error: (err) => {
//         this.isLoading.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Reset failed.' });
//       }
//     });
//   }
// }

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-reset-password',
// //   imports: [],
// //   templateUrl: './reset-password.html',
// //   styleUrl: './reset-password.scss',
// // })
// // export class ResetPassword {

// // }
