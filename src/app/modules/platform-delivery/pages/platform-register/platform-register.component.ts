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
    <div class="login-container">
      <div class="login-card glass-panel">
        <div class="brand">
          <i class="pi pi-globe brand-icon"></i>
          <h1>Become a Partner</h1>
          <p>Join the Apex Global Delivery Network.</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #regForm="ngForm">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" name="name" [(ngModel)]="form.name" required class="premium-input" placeholder="e.g. John Doe">
          </div>

          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" name="phone" [(ngModel)]="form.phone" required class="premium-input" placeholder="e.g. 9876543210">
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" [(ngModel)]="form.password" required class="premium-input" placeholder="Enter password">
          </div>

          <div style="display: flex; gap: 10px;">
             <div class="form-group" style="flex: 1;">
                <label>City</label>
                <input type="text" name="city" [(ngModel)]="form.city" required class="premium-input" placeholder="City">
             </div>
             <div class="form-group" style="flex: 1;">
                <label>State</label>
                <input type="text" name="state" [(ngModel)]="form.state" required class="premium-input" placeholder="State">
             </div>
          </div>

          <div class="form-group">
            <label>Zip/Postal Code</label>
            <input type="text" name="zipCode" [(ngModel)]="form.zipCode" required class="premium-input" placeholder="e.g. 110001">
          </div>
          
          <div class="error-message" *ngIf="error">{{ error }}</div>
          
          <button type="submit" class="premium-btn primary-btn full-width" [disabled]="regForm.invalid || loading">
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">Register</span>
          </button>

          <div class="links">
             <a routerLink="/apex-delivery/login">Already a partner? Login here</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4c1d95 0%, #0f172a 100%);
      padding: 20px;
    }
    
    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 40px 30px;
      border-radius: 20px;
    }
    
    .glass-panel {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .brand {
      text-align: center;
      margin-bottom: 25px;
      color: white;
    }
    
    .brand-icon {
      font-size: 3rem;
      color: #a78bfa;
      margin-bottom: 10px;
      display: inline-block;
    }
    
    h1 {
      margin: 0 0 10px 0;
      font-size: 1.8rem;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #cbd5e1;
      font-size: 0.95rem;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      color: #e2e8f0;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .premium-input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    
    .premium-input:focus {
      outline: none;
      border-color: #a78bfa;
      box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2);
    }
    
    .premium-btn {
      padding: 14px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 10px;
    }
    
    .primary-btn {
      background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);
      color: white;
      border: none;
    }
    
    .primary-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -10px rgba(124, 58, 237, 0.6);
    }
    
    .primary-btn[disabled] {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .full-width {
      width: 100%;
    }
    
    .error-message {
      color: #ef4444;
      font-size: 0.85rem;
      margin-bottom: 15px;
      text-align: center;
      background: rgba(239, 68, 68, 0.1);
      padding: 10px;
      border-radius: 8px;
    }

    .links {
        margin-top: 20px;
        text-align: center;
    }
    .links a {
        color: #a78bfa;
        text-decoration: none;
        font-size: 0.9rem;
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
}
