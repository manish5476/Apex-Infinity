import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DeliveryService } from '../../services/delivery.service';

@Component({
  selector: 'app-delivery-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <h1>APEX Delivery</h1>
            <p>Login to manage your assigned orders for <span class="org-highlight">{{ orgSlug || 'your store' }}</span>.</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
            <!-- Phone Number Input -->
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <div class="input-container">
                <i class="pi pi-phone input-icon"></i>
                <input 
                  type="tel" 
                  id="phone"
                  name="phone" 
                  [(ngModel)]="credentials.phone" 
                  required 
                  class="premium-input" 
                  placeholder="e.g. 9876543210"
                  autocomplete="tel">
              </div>
            </div>

            <!-- Password Input -->
            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-container">
                <i class="pi pi-lock input-icon"></i>
                <input 
                  type="password" 
                  id="password"
                  name="password" 
                  [(ngModel)]="credentials.password" 
                  required 
                  class="premium-input" 
                  placeholder="Enter password">
              </div>
            </div>
            
            <!-- Error Message using semantic status tokens -->
            <div class="error-message" *ngIf="error">
              <i class="pi pi-exclamation-circle"></i>
              <span>{{ error }}</span>
            </div>
            
            <button type="submit" class="premium-btn primary-btn" [disabled]="loginForm.invalid || loading">
              <span class="btn-content" [class.is-hidden]="loading">
                Secure Login
                <i class="pi pi-arrow-right"></i>
              </span>
              <i class="pi pi-spin pi-spinner loader" *ngIf="loading"></i>
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
              <span>APEX Fleet Management</span>
            </div>
            <h3>Your route, optimized.</h3>
            <p>Access real-time order tracking, customer delivery details, and instant proof-of-delivery tools on the go.</p>
            
            <div class="stats-row">
              <div class="stat">
                <h4><i class="pi pi-map-marker"></i></h4>
                <span>Smart Routing</span>
              </div>
              <div class="stat">
                <h4><i class="pi pi-check-circle"></i></h4>
                <span>Instant POD</span>
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

    .org-highlight {
      color: var(--text-primary);
      font-weight: var(--font-weight-semibold);
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      padding: 2px 6px;
      background: var(--bg-secondary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
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
      margin-top: var(--spacing-sm);
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
      /* Delivery van background to suit the context */
      background-image: url('https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=2070&auto=format&fit=crop');
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
export class DeliveryLoginComponent implements OnInit {
  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials = { phone: '', password: '' };
  loading = false;
  error = '';
  orgSlug = '';

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
      this.error = 'Invalid organization scope.';
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.deliveryService.login(this.orgSlug, this.credentials.phone, this.credentials.password).subscribe({
      next: (res) => {
        localStorage.setItem(`delivery_token_${this.orgSlug}`, res.token);
        this.router.navigate(['/store', this.orgSlug, 'delivery', 'dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed. Please check your credentials and try again.';
      }
    });
  }
}
// import { Component, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute } from '@angular/router';
// import { DeliveryService } from '../../services/delivery.service';

// @Component({
//   selector: 'app-delivery-login',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   template: `
//     <div class="split-layout">
      
//       <div class="form-section">
        
//         <div class="glow-orb"></div>

//         <div class="form-wrapper">
//           <div class="brand">
//             <div class="icon-wrapper">
//               <i class="pi pi-box brand-icon"></i>
//             </div>
//             <h1>APEX Delivery</h1>
//             <p>Login to manage your assigned orders for <span class="org-highlight">{{ orgSlug || 'your store' }}</span>.</p>
//           </div>
          
//           <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
//             <div class="form-group">
//               <label for="phone">Phone Number</label>
//               <div class="input-container">
//                 <i class="pi pi-phone input-icon"></i>
//                 <input 
//                   type="tel" 
//                   id="phone"
//                   name="phone" 
//                   [(ngModel)]="credentials.phone" 
//                   required 
//                   class="premium-input" 
//                   placeholder="e.g. 9876543210"
//                   autocomplete="tel">
//               </div>
//             </div>
            
//             <div class="form-group">
//               <label for="password">Password</label>
//               <div class="input-container">
//                 <i class="pi pi-lock input-icon"></i>
//                 <input 
//                   type="password" 
//                   id="password"
//                   name="password" 
//                   [(ngModel)]="credentials.password" 
//                   required 
//                   class="premium-input" 
//                   placeholder="Enter password">
//               </div>
//             </div>
            
//             <div class="error-message" *ngIf="error">
//               <i class="pi pi-exclamation-circle"></i>
//               <span>{{ error }}</span>
//             </div>
            
//             <button type="submit" class="premium-btn primary-btn" [disabled]="loginForm.invalid || loading">
//               <span class="btn-content" [class.is-hidden]="loading">
//                 Secure Login
//                 <i class="pi pi-arrow-right"></i>
//               </span>
//               <i class="pi pi-spin pi-spinner loader" *ngIf="loading"></i>
//             </button>
//           </form>
//         </div>
//       </div>

//       <div class="hero-section">
//         <div class="hero-overlay"></div>
        
//         <div class="hero-content">
//           <div class="glass-feature-card">
//             <div class="feature-header">
//               <div class="status-dot"></div>
//               <span>APEX Fleet Management</span>
//             </div>
//             <h3>Your route, optimized.</h3>
//             <p>Access real-time order tracking, customer delivery details, and instant proof-of-delivery tools on the go.</p>
            
//             <div class="stats-row">
//               <div class="stat">
//                 <h4><i class="pi pi-map-marker"></i></h4>
//                 <span>Smart Routing</span>
//               </div>
//               <div class="stat">
//                 <h4><i class="pi pi-check-circle"></i></h4>
//                 <span>Instant POD</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//     </div>
//   `,
//   styles: [`
//     /* ── Base Layout ── */
//     :host {
//       display: block;
//       min-height: 100vh;
//       background-color: var(--bg-primary);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//     }

//     .split-layout {
//       display: flex;
//       min-height: 100vh;
//       width: 100%;
//     }

//     /* ── Form Section (Left) ── */
//     .form-section {
//       width: 100%;
//       max-width: 560px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-4xl);
//       position: relative;
//       z-index: 10;
//       background: var(--bg-primary);
//     }

//     .glow-orb {
//       position: absolute;
//       top: 20%;
//       left: 50%;
//       width: 400px;
//       height: 400px;
//       background: radial-gradient(circle, var(--color-primary-bg) 0%, transparent 70%);
//       transform: translate(-50%, -50%);
//       pointer-events: none;
//       z-index: -1;
//     }

//     .form-wrapper {
//       width: 100%;
//       max-width: 380px;
//       position: relative;
//       animation: fadeUp 0.6s cubic-bezier(0.2, 0.9, 0.2, 1);
//     }

//     /* ── Brand & Typography ── */
//     .brand {
//       margin-bottom: var(--spacing-3xl);
//     }

//     .icon-wrapper {
//       width: 56px;
//       height: 56px;
//       background: linear-gradient(var(--accent-gradient-angle), var(--color-primary-bg), transparent);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-lg);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       margin-bottom: var(--spacing-xl);
//       box-shadow: var(--elevation-1);
//     }

//     .brand-icon {
//       font-size: var(--font-size-2xl);
//       color: var(--accent-primary);
//     }

//     h1 {
//       font-family: var(--font-heading);
//       margin: 0 0 var(--spacing-xs) 0;
//       font-size: var(--font-size-4xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       letter-spacing: -0.02em;
//       line-height: var(--line-height-tight);
//     }

//     p {
//       margin: 0;
//       color: var(--text-secondary);
//       font-size: var(--font-size-md);
//       line-height: var(--line-height-relaxed);
//     }
    
//     .org-highlight {
//       color: var(--text-primary);
//       font-weight: var(--font-weight-semibold);
//       font-family: var(--font-mono);
//       font-size: var(--font-size-sm);
//       padding: 2px 6px;
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-sm);
//     }

//     /* ── Form Inputs ── */
//     .login-form {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xl);
//     }

//     .form-group {
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-xs);
//     }

//     label {
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//     }

//     .input-container {
//       position: relative;
//       display: flex;
//       align-items: center;
//     }

//     .input-icon {
//       position: absolute;
//       left: var(--spacing-xl);
//       color: var(--text-tertiary);
//       font-size: var(--font-size-lg);
//       transition: color var(--transition-base);
//     }

//     .premium-input {
//       width: 100%;
//       padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-lg) calc(var(--spacing-xl) * 2.5);
//       border-radius: var(--ui-border-radius);
//       background: var(--bg-secondary);
//       border: var(--ui-border-width) solid var(--border-primary);
//       color: var(--text-primary);
//       font-size: var(--font-size-md);
//       font-family: var(--font-body);
//       transition: var(--transition-base);
//     }

//     .premium-input::placeholder {
//       color: var(--text-tertiary);
//     }

//     .premium-input:focus {
//       outline: none;
//       background: var(--bg-primary);
//       border-color: var(--accent-primary);
//       box-shadow: 0 0 0 var(--focus-outline-width) var(--accent-focus);
//     }

//     .premium-input:focus + .input-icon,
//     .input-container:focus-within .input-icon {
//       color: var(--accent-primary);
//     }

//     /* ── Buttons ── */
//     .premium-btn {
//       width: 100%;
//       padding: var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       font-weight: var(--font-weight-semibold);
//       font-size: var(--font-size-md);
//       font-family: var(--font-body);
//       cursor: pointer;
//       transition: var(--transition-base);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       position: relative;
//       border: none;
//       margin-top: var(--spacing-sm);
//     }

//     .btn-content {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       transition: opacity var(--transition-fast);
//     }
    
//     .btn-content.is-hidden {
//       opacity: 0;
//     }

//     .loader {
//       position: absolute;
//       font-size: var(--font-size-lg);
//     }

//     .primary-btn {
//       background: linear-gradient(var(--accent-gradient-angle), var(--accent-primary), var(--accent-secondary));
//       color: var(--bg-primary);
//       box-shadow: var(--shadow-sm);
//     }

//     .primary-btn:hover:not([disabled]) {
//       background: var(--accent-hover);
//       transform: translateY(-1px);
//       box-shadow: var(--elevation-1);
//     }

//     .primary-btn[disabled] {
//       background: var(--bg-ternary);
//       color: var(--text-disabled);
//       cursor: not-allowed;
//       box-shadow: none;
//     }

//     /* ── Error Message ── */
//     .error-message {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       color: var(--color-error-dark);
//       font-size: var(--font-size-sm);
//       background: var(--color-error-bg);
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-radius: var(--ui-border-radius-sm);
//       border: var(--ui-border-width) solid var(--color-error-border);
//       animation: shake 0.4s ease-in-out;
//     }

//     /* ── Hero Section (Right) ── */
//     .hero-section {
//       flex: 1;
//       position: relative;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-4xl);
//       overflow: hidden;
//       /* Background image suited for local delivery/logistics drivers */
//       background-image: url('https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=2070&auto=format&fit=crop');
//       background-size: cover;
//       background-position: center;
//     }

//     .hero-overlay {
//       position: absolute;
//       inset: 0;
//       /* Smooth gradient blend that adapts to the active theme */
//       background: linear-gradient(90deg, 
//         var(--bg-primary) 0%, 
//         color-mix(in srgb, var(--bg-primary) 70%, transparent) 40%, 
//         color-mix(in srgb, var(--accent-primary) 20%, transparent) 100%
//       );
//     }

//     .hero-content {
//       position: relative;
//       z-index: 2;
//       width: 100%;
//       max-width: 480px;
//       margin-left: auto;
//       margin-right: var(--spacing-3xl);
//       animation: fadeLeft 0.8s ease-out 0.2s both;
//     }

//     /* ── Floating Glass Card ── */
//     .glass-feature-card {
//       background: color-mix(in srgb, var(--bg-secondary) 75%, transparent);
//       backdrop-filter: blur(24px);
//       -webkit-backdrop-filter: blur(24px);
//       border: var(--ui-border-width) solid var(--border-primary);
//       border-radius: var(--ui-border-radius-xl);
//       padding: var(--spacing-4xl);
//       box-shadow: var(--elevation-3);
//     }

//     .feature-header {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       margin-bottom: var(--spacing-lg);
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-semibold);
//       color: var(--accent-primary);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//     }

//     .status-dot {
//       width: 8px;
//       height: 8px;
//       background-color: var(--accent-primary);
//       border-radius: var(--ui-border-radius-pill);
//       box-shadow: 0 0 12px var(--color-primary-bg);
//       animation: pulse 2s infinite;
//     }

//     .glass-feature-card h3 {
//       font-family: var(--font-heading);
//       font-size: var(--font-size-3xl);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin: 0 0 var(--spacing-md) 0;
//       line-height: var(--line-height-tight);
//     }

//     .glass-feature-card p {
//       color: var(--text-secondary);
//       font-size: var(--font-size-md);
//       line-height: var(--line-height-relaxed);
//       margin-bottom: var(--spacing-3xl);
//     }

//     .stats-row {
//       display: flex;
//       gap: var(--spacing-3xl);
//       padding-top: var(--spacing-xl);
//       border-top: var(--ui-border-width) solid var(--border-primary);
//     }

//     .stat h4 {
//       font-family: var(--font-heading);
//       margin: 0 0 var(--spacing-xs) 0;
//       font-size: var(--font-size-2xl);
//       color: var(--text-primary);
//     }

//     .stat span {
//       font-size: var(--font-size-sm);
//       color: var(--text-tertiary);
//     }

//     /* ── Animations ── */
//     @keyframes fadeUp {
//       from { opacity: 0; transform: translateY(20px); }
//       to { opacity: 1; transform: translateY(0); }
//     }

//     @keyframes fadeLeft {
//       from { opacity: 0; transform: translateX(30px); }
//       to { opacity: 1; transform: translateX(0); }
//     }

//     @keyframes shake {
//       0%, 100% { transform: translateX(0); }
//       25% { transform: translateX(-4px); }
//       75% { transform: translateX(4px); }
//     }

//     @keyframes pulse {
//       0% { box-shadow: 0 0 0 0 var(--color-primary-bg); }
//       70% { box-shadow: 0 0 0 6px transparent; }
//       100% { box-shadow: 0 0 0 0 transparent; }
//     }

//     /* ── Responsive Mobile View ── */
//     @media (max-width: 992px) {
//       .hero-section {
//         display: none;
//       }
      
//       .form-section {
//         max-width: 100%;
//         padding: var(--spacing-2xl);
//       }
      
//       .form-wrapper {
//         background: color-mix(in srgb, var(--bg-secondary) 80%, transparent);
//         backdrop-filter: blur(24px);
//         -webkit-backdrop-filter: blur(24px);
//         border: var(--ui-border-width) solid var(--border-primary);
//         padding: var(--spacing-3xl) var(--spacing-2xl);
//         border-radius: var(--ui-border-radius-xl);
//         box-shadow: var(--elevation-2);
//       }
//     }
//   `]
// })
// export class DeliveryLoginComponent implements OnInit {
//   private deliveryService = inject(DeliveryService);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   credentials = { phone: '', password: '' };
//   loading = false;
//   error = '';
//   orgSlug = '';

//   ngOnInit() {
//     // Walk up the route tree to locate the orgSlug parameter
//     let currentRoute: import('@angular/router').ActivatedRouteSnapshot | null = this.route.snapshot;
//     while (currentRoute) {
//       if (currentRoute.paramMap.has('orgSlug')) {
//         this.orgSlug = currentRoute.paramMap.get('orgSlug') || '';
//         break;
//       }
//       currentRoute = currentRoute.parent;
//     }
//   }

//   onSubmit() {
//     if (!this.orgSlug) {
//       this.error = 'Invalid organization scope.';
//       return;
//     }

//     this.loading = true;
//     this.error = '';

//     this.deliveryService.login(this.orgSlug, this.credentials.phone, this.credentials.password).subscribe({
//       next: (res) => {
//         localStorage.setItem(`delivery_token_${this.orgSlug}`, res.token);
//         this.router.navigate(['/store', this.orgSlug, 'delivery', 'dashboard']);
//       },
//       error: (err) => {
//         this.loading = false;
//         this.error = err?.error?.message || 'Login failed. Please check your credentials and try again.';
//       }
//     });
//   }
// }