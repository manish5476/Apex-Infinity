import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PlatformDeliveryService } from '../../services/platform-delivery.service';

@Component({
  selector: 'app-platform-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-wrapper">
      <div class="auth-card">
        
        <div class="illustration-panel">
          <div class="illustration-content">
            <h2>Join Apex Global</h2>
            <p>Become a partner and scale your logistics network across the globe.</p>
          </div>
        </div>

        <div class="form-panel scrollable-panel">
          <div class="form-header">
            <h1>Sign up</h1>
            <p>Small step for your knowledge, giant leap for your network.</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" #regForm="ngForm" class="auth-form">
            <div class="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name" 
                [(ngModel)]="form.name" 
                required 
                class="premium-input" 
                placeholder="e.g. John Doe">
            </div>

            <div class="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                [(ngModel)]="form.phone" 
                required 
                class="premium-input" 
                placeholder="e.g. 9876543210">
            </div>
            
            <div class="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password" 
                [(ngModel)]="form.password" 
                required 
                class="premium-input" 
                placeholder="Create a strong password">
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label>City</label>
                <input 
                  type="text" 
                  name="city" 
                  [(ngModel)]="form.city" 
                  required 
                  class="premium-input" 
                  placeholder="City">
              </div>
              <div class="form-group half-width">
                <label>State</label>
                <input 
                  type="text" 
                  name="state" 
                  [(ngModel)]="form.state" 
                  required 
                  class="premium-input" 
                  placeholder="State">
              </div>
            </div>

            <div class="form-group">
              <label>Zip/Postal Code</label>
              <input 
                type="text" 
                name="zipCode" 
                [(ngModel)]="form.zipCode" 
                required 
                class="premium-input" 
                placeholder="e.g. 110001">
            </div>
            
            <div class="error-message" *ngIf="error">
              <i class="pi pi-exclamation-circle"></i> {{ error }}
            </div>
            
            <button type="submit" class="premium-btn primary-btn full-width" [disabled]="regForm.invalid || loading">
              <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
              <span *ngIf="!loading">Sign up</span>
            </button>

            <div class="divider">
              <span>Or sign up with</span>
            </div>

            <div class="social-auth">
              <button type="button" class="social-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google">
              </button>
              <button type="button" class="social-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft">
              </button>
            </div>

            <div class="links">
              <span>Already a partner?</span>
              <a routerLink="/apex-delivery/login">Log in</a>
            </div>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-secondary, #f4f7fb);
      padding: var(--spacing-2xl, 1.5rem);
      font-family: var(--font-body, 'Inter', sans-serif);
    }
    
    .auth-card {
      display: flex;
      width: 100%;
      max-width: 1000px;
      min-height: 650px;
      max-height: 90vh;
      background-color: var(--bg-primary, #ffffff);
      border-radius: var(--ui-border-radius-xl, 24px);
      box-shadow: var(--elevation-3, 0 16px 48px rgba(0,0,0,0.1));
      overflow: hidden;
    }
    
    /* Left Panel: Image */
    .illustration-panel {
      flex: 1;
      display: none;
      /* Space/Global themed abstract background for registration */
      background: linear-gradient(var(--accent-gradient-angle, 135deg), rgba(220, 38, 38, 0.4), rgba(76, 29, 149, 0.8)), 
                  url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop') center/cover no-repeat;
      position: relative;
      color: #ffffff;
      padding: var(--spacing-4xl, 2.75rem);
      flex-direction: column;
      justify-content: flex-end;
    }

    @media (min-width: 768px) {
      .illustration-panel {
        display: flex;
      }
    }

    .illustration-content h2 {
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
      font-size: var(--font-size-4xl, 1.75rem);
      margin-bottom: var(--spacing-sm, 0.375rem);
      font-weight: var(--font-weight-bold, 700);
    }

    .illustration-content p {
      font-size: var(--font-size-md, 0.875rem);
      line-height: var(--line-height-relaxed, 1.5);
      opacity: 0.9;
    }
    
    /* Right Panel: Form */
    .form-panel {
      flex: 1;
      padding: var(--spacing-4xl, 2.75rem) var(--spacing-3xl, 2rem);
      display: flex;
      flex-direction: column;
      background-color: var(--bg-primary, #ffffff);
    }

    /* Allows scrolling inside the form panel if screen is too short */
    .scrollable-panel {
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--scroll-thumb, #cbd5e1) var(--scroll-track, transparent);
    }
    
    .scrollable-panel::-webkit-scrollbar {
      width: 6px;
    }
    .scrollable-panel::-webkit-scrollbar-track {
      background: var(--scroll-track, transparent);
    }
    .scrollable-panel::-webkit-scrollbar-thumb {
      background-color: var(--scroll-thumb, #cbd5e1);
      border-radius: var(--ui-border-radius-pill, 9999px);
    }
    
    .form-header {
      text-align: center;
      margin-bottom: var(--spacing-3xl, 2rem);
      margin-top: auto;
    }
    
    .form-header h1 {
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
      font-size: var(--font-size-3xl, 1.375rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--text-primary, #1e293b);
      margin: 0 0 var(--spacing-xs, 0.25rem) 0;
    }
    
    .form-header p {
      color: var(--text-secondary, #64748b);
      font-size: var(--font-size-sm, 0.75rem);
      margin: 0;
    }
    
    .auth-form {
      max-width: 380px;
      margin: 0 auto;
      width: 100%;
      margin-bottom: auto;
    }
    
    .form-row {
      display: flex;
      gap: var(--spacing-lg, 0.75rem);
    }

    .half-width {
      flex: 1;
    }
    
    .form-group {
      margin-bottom: var(--spacing-xl, 1rem);
    }
    
    label {
      display: block;
      margin-bottom: var(--spacing-xs, 0.25rem);
      color: var(--text-primary, #334155);
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: var(--font-weight-semibold, 600);
    }
    
    .premium-input {
      width: 100%;
      padding: 12px 16px;
      border-radius: var(--ui-border-radius, 10px);
      background-color: var(--bg-secondary, #f8fafc);
      border: var(--ui-border-width, 1px) solid var(--border-primary, #e2e8f0);
      color: var(--text-primary, #0f172a);
      font-size: var(--font-size-md, 0.875rem);
      font-family: var(--font-body);
      transition: var(--transition-base, all 0.22s ease);
      box-sizing: border-box;
    }
    
    .premium-input:focus {
      outline: none;
      border-color: var(--accent-primary, #6366f1);
      background-color: var(--bg-primary, #ffffff);
      box-shadow: 0 0 0 var(--focus-ring-width, 2px) var(--accent-focus, rgba(99, 102, 241, 0.2));
    }
    
    .premium-btn {
      padding: 12px var(--spacing-xl, 1rem);
      border-radius: var(--ui-border-radius-pill, 9999px);
      font-family: var(--font-body);
      font-weight: var(--font-weight-semibold, 600);
      font-size: var(--font-size-md, 0.875rem);
      cursor: pointer;
      transition: var(--transition-base, all 0.22s ease);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: var(--spacing-md, 0.5rem);
    }
    
    .primary-btn {
      background: var(--accent-primary, #0f172a);
      color: #ffffff;
      border: none;
      box-shadow: var(--shadow-md, 0 4px 6px rgba(0,0,0,0.1));
    }
    
    .primary-btn:hover:not([disabled]) {
      background: var(--accent-hover, #1e293b);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1));
    }
    
    .primary-btn[disabled] {
      background: var(--color-disabled, #cbd5e1);
      color: var(--color-disabled-text, #94a3b8);
      cursor: not-allowed;
      box-shadow: none;
    }
    
    .full-width {
      width: 100%;
    }
    
    .error-message {
      color: var(--color-error, #ef4444);
      font-size: var(--font-size-sm, 0.75rem);
      margin-bottom: var(--spacing-xl, 1rem);
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--color-error-bg, rgba(239, 68, 68, 0.1));
      padding: var(--spacing-md, 0.5rem) var(--spacing-lg, 0.75rem);
      border-radius: var(--ui-border-radius-sm, 6px);
      border-left: 3px solid var(--color-error, #ef4444);
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: var(--spacing-xl, 1rem) 0;
      color: var(--text-tertiary, #94a3b8);
      font-size: var(--font-size-xs, 0.65rem);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: var(--ui-border-width, 1px) solid var(--border-secondary, #e2e8f0);
    }

    .divider span {
      padding: 0 var(--spacing-lg, 0.75rem);
    }

    .social-auth {
      display: flex;
      gap: var(--spacing-md, 0.5rem);
      justify-content: center;
      margin-bottom: var(--spacing-2xl, 1.5rem);
    }

    .social-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary, #ffffff);
      border: var(--ui-border-width, 1px) solid var(--border-secondary, #e2e8f0);
      border-radius: var(--ui-border-radius, 10px);
      padding: 10px;
      cursor: pointer;
      transition: var(--transition-fast, all 0.12s);
    }

    .social-btn img {
      height: 20px;
      width: 20px;
    }

    .social-btn:hover {
      background: var(--bg-secondary, #f8fafc);
      border-color: var(--border-primary, #cbd5e1);
    }

    .links {
      text-align: center;
      font-size: var(--font-size-sm, 0.75rem);
      color: var(--text-secondary, #64748b);
    }
    
    .links a {
      color: var(--accent-primary, #0f172a);
      text-decoration: none;
      font-weight: var(--font-weight-semibold, 600);
      margin-left: 4px;
      transition: var(--transition-fast, all 0.12s);
    }
    
    .links a:hover {
      text-decoration: underline;
    }
  `]
})
export class PlatformRegisterComponent {
  private platformService = inject(PlatformDeliveryService);
  private router = inject(Router);

  form = { name: '', phone: '', password: '', city: '', state: '', zipCode: '' };
  loading = false;
  error = '';

  onSubmit() {
    this.loading = true;
    this.error = '';
    
    this.platformService.register(this.form).subscribe({
      next: (res) => {
        this.platformService.setToken(res.token);
        this.router.navigate(['/apex-delivery/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';
// import { PlatformDeliveryService } from '../../services/platform-delivery.service';

// @Component({
//   selector: 'app-platform-register',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   template: `
//     <div class="login-container">
//       <div class="login-card glass-panel">
//         <div class="brand">
//           <i class="pi pi-globe brand-icon"></i>
//           <h1>Become a Partner</h1>
//           <p>Join the Apex Global Delivery Network.</p>
//         </div>
        
//         <form (ngSubmit)="onSubmit()" #regForm="ngForm">
//           <div class="form-group">
//             <label>Full Name</label>
//             <input type="text" name="name" [(ngModel)]="form.name" required class="premium-input" placeholder="e.g. John Doe">
//           </div>

//           <div class="form-group">
//             <label>Phone Number</label>
//             <input type="text" name="phone" [(ngModel)]="form.phone" required class="premium-input" placeholder="e.g. 9876543210">
//           </div>
          
//           <div class="form-group">
//             <label>Password</label>
//             <input type="password" name="password" [(ngModel)]="form.password" required class="premium-input" placeholder="Enter password">
//           </div>

//           <div style="display: flex; gap: 10px;">
//              <div class="form-group" style="flex: 1;">
//                 <label>City</label>
//                 <input type="text" name="city" [(ngModel)]="form.city" required class="premium-input" placeholder="City">
//              </div>
//              <div class="form-group" style="flex: 1;">
//                 <label>State</label>
//                 <input type="text" name="state" [(ngModel)]="form.state" required class="premium-input" placeholder="State">
//              </div>
//           </div>

//           <div class="form-group">
//             <label>Zip/Postal Code</label>
//             <input type="text" name="zipCode" [(ngModel)]="form.zipCode" required class="premium-input" placeholder="e.g. 110001">
//           </div>
          
//           <div class="error-message" *ngIf="error">{{ error }}</div>
          
//           <button type="submit" class="premium-btn primary-btn full-width" [disabled]="regForm.invalid || loading">
//             <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
//             <span *ngIf="!loading">Register</span>
//           </button>

//           <div class="links">
//              <a routerLink="/apex-delivery/login">Already a partner? Login here</a>
//           </div>
//         </form>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .login-container {
//       min-height: 100vh;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: linear-gradient(135deg, #4c1d95 0%, #0f172a 100%);
//       padding: 20px;
//     }
    
//     .login-card {
//       width: 100%;
//       max-width: 450px;
//       padding: 40px 30px;
//       border-radius: 20px;
//     }
    
//     .glass-panel {
//       background: rgba(255, 255, 255, 0.05);
//       backdrop-filter: blur(16px);
//       -webkit-backdrop-filter: blur(16px);
//       border: 1px solid rgba(255, 255, 255, 0.1);
//       box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
//     }
    
//     .brand {
//       text-align: center;
//       margin-bottom: 25px;
//       color: white;
//     }
    
//     .brand-icon {
//       font-size: 3rem;
//       color: #a78bfa;
//       margin-bottom: 10px;
//       display: inline-block;
//     }
    
//     h1 {
//       margin: 0 0 10px 0;
//       font-size: 1.8rem;
//       font-weight: 600;
//     }
    
//     p {
//       margin: 0;
//       color: #cbd5e1;
//       font-size: 0.95rem;
//     }
    
//     .form-group {
//       margin-bottom: 15px;
//     }
    
//     label {
//       display: block;
//       margin-bottom: 8px;
//       color: #e2e8f0;
//       font-size: 0.9rem;
//       font-weight: 500;
//     }
    
//     .premium-input {
//       width: 100%;
//       padding: 12px 16px;
//       border-radius: 10px;
//       background: rgba(15, 23, 42, 0.6);
//       border: 1px solid rgba(255, 255, 255, 0.1);
//       color: white;
//       font-size: 1rem;
//       transition: all 0.3s ease;
//     }
    
//     .premium-input:focus {
//       outline: none;
//       border-color: #a78bfa;
//       box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
//     }
    
//     .premium-btn {
//       padding: 14px;
//       border-radius: 10px;
//       font-weight: 600;
//       font-size: 1rem;
//       cursor: pointer;
//       transition: all 0.2s ease;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: 10px;
//       margin-top: 10px;
//     }
    
//     .primary-btn {
//       background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);
//       color: white;
//       border: none;
//     }
    
//     .primary-btn:hover:not([disabled]) {
//       transform: translateY(-2px);
//       box-shadow: 0 10px 20px -10px rgba(124, 58, 237, 0.6);
//     }
    
//     .primary-btn[disabled] {
//       opacity: 0.7;
//       cursor: not-allowed;
//     }
    
//     .full-width {
//       width: 100%;
//     }
    
//     .error-message {
//       color: #ef4444;
//       font-size: 0.85rem;
//       margin-bottom: 15px;
//       text-align: center;
//       background: rgba(239, 68, 68, 0.1);
//       padding: 10px;
//       border-radius: 8px;
//     }

//     .links {
//         margin-top: 20px;
//         text-align: center;
//     }
//     .links a {
//         color: #a78bfa;
//         text-decoration: none;
//         font-size: 0.9rem;
//     }
//     .links a:hover {
//         text-decoration: underline;
//     }
//   `]
// })
// export class PlatformRegisterComponent {
//   private platformService = inject(PlatformDeliveryService);
//   private router = inject(Router);

//   form = { name: '', phone: '', password: '', city: '', state: '', zipCode: '' };
//   loading = false;
//   error = '';

//   onSubmit() {
//     this.loading = true;
//     this.error = '';
    
//     this.platformService.register(this.form).subscribe({
//       next: (res) => {
//         this.platformService.setToken(res.token);
//         this.router.navigate(['/apex-delivery/dashboard']);
//       },
//       error: (err) => {
//         this.loading = false;
//         this.error = err?.error?.message || 'Registration failed. Please try again.';
//       }
//     });
//   }
// }
