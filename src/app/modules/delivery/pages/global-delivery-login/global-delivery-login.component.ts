import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-global-delivery-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card glass-panel">
        <div class="brand">
          <i class="pi pi-box brand-icon"></i>
          <h1>Store Delivery Login</h1>
          <p>Enter your assigned Store ID to access your portal.</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label>Store ID (Organization ID)</label>
            <input type="text" name="storeId" [(ngModel)]="storeId" required class="premium-input" placeholder="e.g. apex-store-1">
          </div>
          
          <div class="error-message" *ngIf="error">{{ error }}</div>
          
          <button type="submit" class="premium-btn primary-btn full-width" [disabled]="loginForm.invalid || loading">
            <i class="pi pi-spin pi-spinner" *ngIf="loading"></i>
            <span *ngIf="!loading">Continue to Store Login</span>
          </button>
          
          <div class="back-link">
            <a href="javascript:void(0)" (click)="goBack()">Return to Main ERP Login</a>
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
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 20px;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
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
      margin-bottom: 30px;
      color: white;
    }
    
    .brand-icon {
      font-size: 3rem;
      color: #38bdf8;
      margin-bottom: 15px;
      display: inline-block;
    }
    
    h1 {
      margin: 0 0 10px 0;
      font-size: 1.8rem;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.95rem;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      color: #cbd5e1;
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
      border-color: #38bdf8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
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
      background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
      color: white;
      border: none;
    }
    
    .primary-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -10px rgba(37, 99, 235, 0.6);
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

    .back-link {
      margin-top: 25px;
      text-align: center;
    }

    .back-link a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .back-link a:hover {
      color: #38bdf8;
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
    
    // Redirect to the specific store's delivery login
    this.router.navigate(['/store', this.storeId.trim(), 'delivery', 'login']);
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
