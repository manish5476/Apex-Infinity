import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="auth-wrapper">
      <section class="auth-container">
        <div class="auth-banner">
          <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1470&auto=format&fit=crop" alt="Update" />
          <div class="auth-overlay"></div>
          <div class="auth-banner-text">
            <h2>Security Check</h2>
            <p>Keep your account safe by updating your password regularly.</p>
          </div>
        </div>

        <div class="auth-form-panel">
          <div class="auth-content">
            <div class="auth-header">
              <div class="icon-box"><i class="pi pi-shield"></i></div>
              <h1 class="auth-title">Update Password</h1>
              <p class="auth-subtitle">Enter your current password and a new one.</p>
            </div>

            <form [formGroup]="updateForm" (ngSubmit)="onSubmit()" class="auth-form">
              <div class="form-group">
                <label>Current Password <span class="req">*</span></label>
                <p-password formControlName="currentPassword" [toggleMask]="true" placeholder="Enter current password" 
                            styleClass="w-full" inputStyleClass="w-full" [feedback]="false"></p-password>
              </div>

              <div class="form-group">
                <label>New Password <span class="req">*</span></label>
                <p-password formControlName="newPassword" [toggleMask]="true" placeholder="Min 8 chars" 
                            styleClass="w-full" inputStyleClass="w-full" [feedback]="true"></p-password>
              </div>

              <div class="form-group">
                <label>Confirm New Password <span class="req">*</span></label>
                <!-- Changed formControlName to match backend expectation -->
                <p-password formControlName="newPasswordConfirm" [toggleMask]="true" placeholder="Re-enter new password" 
                            styleClass="w-full" inputStyleClass="w-full" [feedback]="false"></p-password>
              </div>

              <div class="auth-footer">
                <button pButton label="Update Password" icon="pi pi-save" iconPos="right" 
                        type="submit" class="submit-btn" [loading]="isLoading()" [disabled]="updateForm.invalid"></button>
                <p class="auth-footer-text">
                  <a routerLink="/" class="auth-link">Cancel</a>
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
export class UpdatePasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  isLoading = signal(false);

  updateForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPasswordConfirm: ['', [Validators.required]] // RENAMED from passwordConfirm
  });

  onSubmit() {
    if (this.updateForm.invalid) return;
    
    // Updated check to use new field name
    if (this.updateForm.value.newPassword !== this.updateForm.value.newPasswordConfirm) {
      this.messageService.add({ severity: 'warn', summary: 'Mismatch', detail: 'New passwords do not match.' });
      return;
    }

     // this.isLoading.set(true);
    this.authService.updateUserPassword(this.updateForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.updateForm.reset();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed.' });
      }
    });
  }
}

// import { Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { RouterLink } from '@angular/router';
// import { ToastModule } from 'primeng/toast';
// import { PasswordModule } from 'primeng/password';
// import { ButtonModule } from 'primeng/button';
// import { MessageService } from 'primeng/api';
// import { AuthService } from '../../services/auth-service';

// @Component({
//   selector: 'app-update-password',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, ToastModule, PasswordModule, ButtonModule, RouterLink],
//   providers: [MessageService],
//   template: `
//     <p-toast></p-toast>
//     <div class="auth-wrapper">
//       <section class="auth-container">
//         <div class="auth-banner">
//           <img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1470&auto=format&fit=crop" alt="Update" />
//           <div class="auth-overlay"></div>
//           <div class="auth-banner-text">
//             <h2>Security Check</h2>
//             <p>Keep your account safe by updating your password regularly.</p>
//           </div>
//         </div>

//         <div class="auth-form-panel">
//           <div class="auth-content">
//             <div class="auth-header">
//               <div class="icon-box"><i class="pi pi-shield"></i></div>
//               <h1 class="auth-title">Update Password</h1>
//               <p class="auth-subtitle">Enter your current password and a new one.</p>
//             </div>

//             <form [formGroup]="updateForm" (ngSubmit)="onSubmit()" class="auth-form">
//               <div class="form-group">
//                 <label>Current Password <span class="req">*</span></label>
//                 <p-password formControlName="currentPassword" [toggleMask]="true" placeholder="Enter current password" 
//                             styleClass="w-full" inputStyleClass="w-full" [feedback]="false"></p-password>
//               </div>

//               <div class="form-group">
//                 <label>New Password <span class="req">*</span></label>
//                 <p-password formControlName="newPassword" [toggleMask]="true" placeholder="Min 8 chars" 
//                             styleClass="w-full" inputStyleClass="w-full" [feedback]="true"></p-password>
//               </div>

//               <div class="form-group">
//                 <label>Confirm New Password <span class="req">*</span></label>
//                 <p-password formControlName="passwordConfirm" [toggleMask]="true" placeholder="Re-enter new password" 
//                             styleClass="w-full" inputStyleClass="w-full" [feedback]="false"></p-password>
//               </div>

//               <div class="auth-footer">
//                 <button pButton label="Update Password" icon="pi pi-save" iconPos="right" 
//                         type="submit" class="submit-btn" [loading]="isLoading()" [disabled]="updateForm.invalid"></button>
//                 <p class="auth-footer-text">
//                   <a routerLink="/" class="auth-link">Cancel</a>
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
// export class UpdatePasswordComponent {
//   private fb = inject(FormBuilder);
//   private authService = inject(AuthService);
//   private messageService = inject(MessageService);
//   isLoading = signal(false);

//   updateForm = this.fb.group({
//     currentPassword: ['', [Validators.required]],
//     newPassword: ['', [Validators.required, Validators.minLength(8)]],
//     passwordConfirm: ['', [Validators.required]]
//   });

//   onSubmit() {
//     if (this.updateForm.invalid) return;
    
//     if (this.updateForm.value.newPassword !== this.updateForm.value.passwordConfirm) {
//       this.messageService.add({ severity: 'warn', summary: 'Mismatch', detail: 'New passwords do not match.' });
//       return;
//     }

//      // this.isLoading.set(true);
//     this.authService.updateUserPassword(this.updateForm.value).subscribe({
//       next: () => {
//         this.isLoading.set(false);
//         // Ideally redirect or clear form
//         this.updateForm.reset();
//       },
//       error: (err) => {
//         this.isLoading.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Update failed.' });
//       }
//     });
//   }
// }

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-update-password',
// //   imports: [],
// //   templateUrl: './update-password.html',
// //   styleUrl: './update-password.scss',
// // })
// // export class UpdatePassword {

// // }
