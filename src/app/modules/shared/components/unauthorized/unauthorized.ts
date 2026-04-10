import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="unauthorized-page">
      <div class="glass-card">
        <div class="icon-circle">
          <i class="pi pi-lock lock-icon"></i>
        </div>
        
        <h1 class="title">Access Restricted</h1>
        <p class="subtitle">
          You don't have the required permissions to view this page or perform this action.
        </p>
        
        <div class="admin-message">
           <i class="pi pi-shield"></i>
           <span>Please contact your system administrator to request access.</span>
        </div>
        
        <div class="actions">
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="pi pi-arrow-left"></i> Go Back
          </button>
          <a routerLink="/dashboard" class="btn btn-primary">
            <i class="pi pi-home"></i> Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg-primary);
      padding: 24px;
      font-family: var(--font-body);
    }
    
    .glass-card {
      background: var(--glass-bg-c, rgba(15, 23, 42, 0.4));
      backdrop-filter: var(--glass-blur-c, blur(16px));
      -webkit-backdrop-filter: var(--glass-blur-c, blur(16px));
      border: 1px solid var(--glass-border-c, rgba(255, 255, 255, 0.1));
      box-shadow: var(--glass-shadow-c, 0 25px 50px -12px rgba(0, 0, 0, 0.5));
      border-radius: var(--radius-2xl, 1.5rem);
      padding: 48px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .icon-circle {
      width: 80px;
      height: 80px;
      background: var(--color-error-bg, rgba(239,68,68,0.2));
      border: 1px solid var(--color-error-border, rgba(239, 68, 68, 0.2));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 0 20px var(--color-error-bg, rgba(239, 68, 68, 0.15));
    }
    
    .lock-icon {
      font-size: 32px;
      color: var(--color-error, #ef4444);
    }
    
    .title {
      font-family: var(--font-heading);
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0 0 32px;
    }
    
    .admin-message {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: var(--color-info-bg, rgba(59, 130, 246, 0.1));
      border: 1px solid var(--color-info-border, rgba(59, 130, 246, 0.2));
      padding: 12px 20px;
      border-radius: var(--radius-lg, 12px);
      color: var(--color-info, #93c5fd);
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 32px;
      text-align: left;
    }
    
    .admin-message i { font-size: 18px; }
    
    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: var(--radius-lg, 12px);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: none;
    }
    
    .btn i { font-size: 14px; }
    
    .btn-secondary {
      background: var(--component-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--component-border, rgba(255, 255, 255, 0.1));
      color: var(--text-primary);
    }
    .btn-secondary:hover { background: var(--component-bg-hover, rgba(255, 255, 255, 0.1)); }
    
    .btn-primary {
      background: var(--accent-gradient);
      color: #fff;
    }
    .btn-primary:hover {
      box-shadow: 0 8px 16px var(--color-primary-bg, rgba(0, 0, 0, 0.2));
      transform: translateY(-1px);
    }
  `]
})
export class UnauthorizedComponent {
  private location = inject(Location);
  
  goBack() {
    this.location.back();
  }
}
