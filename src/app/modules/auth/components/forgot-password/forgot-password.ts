import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ToastModule, InputTextModule, ButtonModule, RouterLink],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    
    <div class="immersive-auth">
      <div class="bg-visual" [style.background-image]="'url(https://images.pexels.com/photos/33784246/pexels-photo-33784246.jpeg)'">
        <div class="bg-overlay"></div>
      </div>

      <div class="layout-grid">
        
        <div class="hero-panel">
          
          <div class="brand-header">
            <div class="logo-mark">
              <i class="pi pi-infinity"></i>
            </div>
            <span class="brand-name">Apex Infinity</span>
          </div>

          <div class="hero-content">
            <h1 class="display-title">
              Account <br>
              <span class="text-gradient">Recovery.</span>
            </h1>
            <p class="hero-desc">
              Don't worry, it happens. We'll verify your identity and get you back into your workspace securely in just a few clicks.
            </p>
          </div>

          <div class="hero-footer">
            <span>© 2026 Apex Inc.</span>
            <div class="footer-links">
              <a href="#">Support</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>

        <div class="form-panel glass-sidebar">
          <div class="form-content-wrapper">
            
            <div class="auth-header">
              <div class="icon-badge">
                <i class="pi pi-key"></i>
              </div>
              <h2 class="auth-title">Forgot Password?</h2>
              <p class="auth-subtitle">Enter your registered email and we'll send you a recovery link.</p>
            </div>

            <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form">
              
              <div class="form-group">
                <label class="input-label">Email Address <span class="req">*</span></label>
                <div class="input-wrapper">
                  <i class="field-icon pi pi-envelope"></i>
                  <input pInputText formControlName="email" placeholder="you@company.com" class="w-full glass-input-field" />
                </div>
              </div>

              <button pButton label="Send Reset Link" icon="pi pi-send" iconPos="right" 
                class="submit-btn" type="submit" [loading]="isLoading()" [disabled]="forgotForm.invalid">
              </button>

              <div class="auth-footer-text">
                <a routerLink="/auth/login" class="back-link">
                  <i class="pi pi-arrow-left"></i> Back to Login
                </a>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* --- Root Container --- */
    .immersive-auth {
      position: relative;
      width: 100vw; height: 100vh;
      overflow: hidden;
      background-color: var(--bg-primary); /* Theme Token */
      color: var(--text-primary);
    }

    /* --- 1. Background Visuals --- */
    .bg-visual {
      position: absolute; inset: 0;
      background-size: cover; background-position: center; z-index: 0;
      
      .bg-overlay {
        position: absolute; inset: 0;
        /* Using color-mix to derive overlay from theme tokens if supported, or standard dark overlay */
        background: linear-gradient(90deg, 
          color-mix(in srgb, var(--bg-primary) 90%, black) 0%, 
          color-mix(in srgb, var(--accent-primary) 20%, transparent 80%) 50%, 
          color-mix(in srgb, var(--bg-primary) 95%, black) 100%
        );
      }
    }

    /* --- 2. Layout Grid --- */
    .layout-grid {
      position: relative; z-index: 1;
      display: grid; grid-template-columns: 1fr 500px; /* Fixed width for form */
      height: 100%; width: 100%;

      @media (max-width: 1024px) { grid-template-columns: 1fr 450px; }
      @media (max-width: 850px) { grid-template-columns: 1fr; }
    }

    /* --- 3. Left Panel (Hero) --- */
    .hero-panel {
      padding: var(--spacing-5xl); 
      display: flex; flex-direction: column; justify-content: space-between;
      
      /* Branding */
      .brand-header {
        display: flex; align-items: center; gap: var(--spacing-md);
        
        .logo-mark {
          width: 40px; height: 40px; 
          background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)));
          border-radius: var(--ui-border-radius-lg); 
          display: flex; align-items: center; justify-content: center;
          color: #ffffff; font-size: 1.25rem; 
          box-shadow: var(--shadow-lg);
        }
        .brand-name { 
          font-family: var(--font-heading); 
          font-size: var(--font-size-2xl); 
          font-weight: var(--font-weight-bold); 
          color: var(--text-primary); 
        }
      }

      /* Hero Typography */
      .hero-content {
        .display-title {
          font-family: var(--font-heading);
          font-size: var(--font-size-5xl); 
          line-height: var(--line-height-tight); 
          font-weight: 800; 
          color: var(--text-primary); 
          margin-bottom: var(--spacing-xl);
          
          .text-gradient {
            background: var(--accent-gradient, linear-gradient(to right, var(--accent-primary), var(--accent-secondary)));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          }
        }
        .hero-desc { 
          font-size: var(--font-size-xl); 
          color: var(--text-secondary); 
          line-height: var(--line-height-relaxed); 
          max-width: 500px; 
        }
      }

      /* Footer */
      .hero-footer {
        display: flex; gap: var(--spacing-xl); 
        color: var(--text-tertiary); 
        font-size: var(--font-size-sm);
        
        .footer-links a { 
          color: inherit; text-decoration: none; margin-left: var(--spacing-lg); 
          transition: var(--transition-colors);
          &:hover { color: var(--text-primary); } 
        }
      }
    }

    /* --- 4. Right Panel (Form) --- */
    .form-panel {
      height: 100%;
      /* Glassmorphism Tokens */
      background: var(--glass-bg-c, rgba(10, 10, 15, 0.6));
      backdrop-filter: blur(var(--glass-blur-c, 50px)); 
      -webkit-backdrop-filter: blur(var(--glass-blur-c, 50px));
      border-left: 1px solid var(--glass-border-c, rgba(255, 255, 255, 0.08));
      
      display: flex; align-items: center; justify-content: center;
      padding: var(--spacing-3xl);
    }

    .form-content-wrapper {
      width: 100%; max-width: 400px;
      animation: slideIn 0.6s ease-out;
    }

    .auth-header {
      margin-bottom: var(--spacing-4xl); 
      text-align: center;
      
      .icon-badge {
        width: 64px; height: 64px; 
        background: rgba(255,255,255,0.05); 
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center; 
        margin: 0 auto var(--spacing-lg);
        border: 1px solid rgba(255,255,255,0.1); 
        color: var(--accent-primary); 
        font-size: var(--font-size-3xl);
      }
      .auth-title { 
        font-family: var(--font-heading);
        font-size: var(--font-size-3xl); 
        font-weight: var(--font-weight-bold); 
        color: var(--text-primary); 
        margin-bottom: var(--spacing-xs); 
      }
      .auth-subtitle { 
        color: var(--text-secondary); 
        font-size: var(--font-size-md); 
      }
    }

    /* --- Inputs --- */
    .form-group {
      margin-bottom: var(--spacing-xl);
      
      .input-label { 
        display: block; 
        font-size: var(--font-size-sm); 
        font-weight: var(--font-weight-medium); 
        color: var(--text-secondary); 
        margin-bottom: var(--spacing-xs); 
      }
      .req { color: var(--accent-primary); }
      
      .input-wrapper {
        position: relative;
        .field-icon {
          position: absolute; left: var(--spacing-md); top: 50%; transform: translateY(-50%);
          z-index: 2; 
          color: var(--text-tertiary); 
          font-size: var(--font-size-lg);
        }
      }
    }

    /* --- Submit Button Override --- */
    .submit-btn {
      width: 100%; 
      height: 3.125rem; /* 50px */
      border-radius: var(--ui-border-radius-lg) !important;
      background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))) !important;
      border: none !important; 
      font-weight: var(--font-weight-semibold) !important; 
      font-size: var(--font-size-md) !important;
      box-shadow: var(--shadow-lg);
      transition: var(--transition-transform) !important;
      
      &:enabled:hover { 
        transform: translateY(-2px); 
        box-shadow: var(--shadow-xl); 
      }
    }

    /* --- Footer Link --- */
    .auth-footer-text {
      margin-top: var(--spacing-3xl); text-align: center;
      .back-link {
        color: var(--text-secondary); 
        text-decoration: none; 
        font-size: var(--font-size-md); 
        font-weight: var(--font-weight-medium);
        display: inline-flex; align-items: center; gap: var(--spacing-xs); 
        transition: var(--transition-colors);
        
        &:hover { color: var(--text-primary); }
        i { font-size: var(--font-size-sm); }
      }
    }

    /* --- Responsive --- */
    @media (max-width: 850px) {
      .hero-panel { display: none; }
      .form-panel { width: 100%; border-left: none; background: var(--bg-primary); }
      .bg-visual { display: none; } 
    }

    @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* --- PRIMENG GLASS OVERRIDES (Essential for Transparency) --- */
    ::ng-deep .glass-input-field {
      /* Dynamic Glass Tokens or Fallbacks */
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      color: var(--text-primary) !important;
      border-radius: var(--ui-border-radius-lg) !important;
      padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-5xl) !important; /* Left padding for icon */
      font-size: var(--font-size-md) !important;
      height: 3rem !important;
      transition: var(--transition-base) !important;
      
      &::placeholder { color: var(--text-tertiary) !important; }
      
      &:enabled:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.25) !important;
      }
      
      &:enabled:focus {
        background: rgba(255, 255, 255, 0.1) !important;
        border-color: var(--accent-primary) !important;
        box-shadow: 0 0 0 2px var(--focus-ring-color, rgba(129, 140, 248, 0.25)) !important;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  
  isLoading = signal(false);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.forgotForm.invalid) return;
    
    this.isLoading.set(true);
    
    this.authService.forgotPassword(this.forgotForm.value.email!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Email Sent', detail: 'Check your inbox for reset instructions.' });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to send email.' });
      }
    });
  }
}

// import { Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { RouterLink } from '@angular/router';
// import { ToastModule } from 'primeng/toast';
// import { InputTextModule } from 'primeng/inputtext';
// import { ButtonModule } from 'primeng/button';
// import { MessageService } from 'primeng/api';
// import { AuthService } from '../../services/auth-service';

// @Component({
//   selector: 'app-forgot-password',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, ToastModule, InputTextModule, ButtonModule, RouterLink],
//   providers: [MessageService],
//   template: `
//     <p-toast></p-toast>
//     <div class="auth-wrapper">
//       <section class="auth-container">
//         <!-- LEFT: Banner -->
//         <div class="auth-banner">
//           <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1374&auto=format&fit=crop" alt="Security" />
//           <div class="auth-overlay"></div>
//           <div class="auth-banner-text">
//             <h2>Secure Access</h2>
//             <p>We'll help you get back into your account in no time.</p>
//           </div>
//         </div>

//         <!-- RIGHT: Form -->
//         <div class="auth-form-panel">
//           <div class="auth-content">
//             <div class="auth-header">
//               <div class="icon-box"><i class="pi pi-lock"></i></div>
//               <h1 class="auth-title">Forgot Password?</h1>
//               <p class="auth-subtitle">Enter your email address and we'll send you a link to reset your password.</p>
//             </div>

//             <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="auth-form">
//               <div class="form-group">
//                 <label>Email Address <span class="req">*</span></label>
//                 <input pInputText formControlName="email" placeholder="you@company.com" />
//               </div>

//               <div class="auth-footer">
//                 <button pButton label="Send Reset Link" icon="pi pi-envelope" iconPos="right" 
//                         type="submit" class="submit-btn" [loading]="isLoading()" [disabled]="forgotForm.invalid"></button>
//                 <p class="auth-footer-text">
//                   Remember your password? <a routerLink="/auth/login" class="auth-link">Log in</a>
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
    
//     /* Banner */
//     .auth-banner { width: 45%; position: relative; background: #000; }
//     .auth-banner img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
//     .auth-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7)); }
//     .auth-banner-text { position: absolute; bottom: 3rem; left: 3rem; color: #fff; z-index: 2; }
//     .auth-banner-text h2 { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
    
//     /* Form */
//     .auth-form-panel { flex: 1; display: flex; justify-content: center; align-items: center; padding: 3rem; }
//     .auth-content { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 2rem; }
//     .auth-header { text-align: center; display: flex; flex-direction: column; align-items: center; }
//     .icon-box { width: 56px; height: 56px; background: var(--component-bg-active); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; color: var(--accent-primary); font-size: 1.5rem; }
//     .auth-title { font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
//     .auth-subtitle { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
    
//     .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
//     .form-group { display: flex; flex-direction: column; gap: 6px; }
//     .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
//     .form-group input { width: 100%; height: 46px; border-radius: 6px; border: 1px solid var(--border-secondary); background: var(--bg-ternary); color: var(--text-primary); padding: 0 1rem; }
//     .form-group input:focus { border-color: var(--accent-primary); outline: none; }
    
//     .auth-footer { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
//     .auth-footer-text { text-align: center; font-size: 0.9rem; color: var(--text-secondary); }
//     .auth-link { color: var(--accent-primary); font-weight: 600; cursor: pointer; margin-left: 4px; }

//     @media (max-width: 1024px) { .auth-container { flex-direction: column; height: auto; min-height: 100vh; } .auth-banner { width: 100%; height: 200px; } .auth-banner-text { display: none; } }
//   `]
// })
// export class ForgotPasswordComponent {
//   private fb = inject(FormBuilder);
//   private authService = inject(AuthService);
//   private messageService = inject(MessageService);
//   isLoading = signal(false);

//   forgotForm = this.fb.group({
//     email: ['', [Validators.required, Validators.email]]
//   });

//   onSubmit() {
//     if (this.forgotForm.invalid) return;
//     //  // this.isLoading.set(true);
    
//     this.authService.forgotPassword(this.forgotForm.value.email!).subscribe({
//       next: () => this.isLoading.set(false),
//       error: (err) => {
//         this.isLoading.set(false);
//         this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to send email.' });
//       }
//     });
//   }
// }