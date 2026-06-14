import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-storefront-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-layout">
      <div class="placeholder-container">
        <div class="elevation-card placeholder-card">
          <div class="icon-wrapper">
            <i [class]="icon"></i>
          </div>
          <h1>{{ title }}</h1>
          <p class="subtitle">This feature is currently in development.</p>
          <p class="description">
            We are actively working on building the <strong>{{ title }}</strong> module to give you the best experience. 
            Stay tuned for future updates!
          </p>
          <div class="actions">
            <button class="theme-btn-primary" routerLink="/storefront/overview">
              <i class="pi pi-home"></i> Return to Command Center
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout {
      padding: 2rem;
      min-height: calc(100vh - 60px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-main, #f8f9fa);
    }

    .placeholder-container {
      width: 100%;
      max-width: 600px;
    }

    .placeholder-card {
      padding: 4rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      background: var(--bg-surface, #ffffff);
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.04);
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--accent-primary-light, #eef2ff);
      color: var(--accent-primary, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      
      i {
        font-size: 2.5rem;
      }
    }

    h1 {
      margin: 0;
      color: var(--text-primary, #111827);
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .subtitle {
      color: var(--accent-primary, #4f46e5);
      font-weight: 600;
      font-size: 1.1rem;
      margin: 0;
    }

    .description {
      color: var(--text-secondary, #6b7280);
      font-size: 1rem;
      line-height: 1.6;
      max-width: 400px;
      margin: 0;
    }

    .actions {
      margin-top: 2rem;
      
      .theme-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.875rem 1.5rem;
        background: var(--accent-primary, #4f46e5);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;

        &:hover {
          background: var(--accent-primary-dark, #4338ca);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }

        i {
          font-size: 1.1rem;
        }
      }
    }
  `]
})
export class StorefrontPlaceholderComponent {
  private route = inject(ActivatedRoute);
  
  title = 'Coming Soon';
  icon = 'pi pi-cog';

  constructor() {
    this.route.data.subscribe(data => {
      if (data['title']) this.title = data['title'];
      if (data['icon']) this.icon = data['icon'];
    });
  }
}
