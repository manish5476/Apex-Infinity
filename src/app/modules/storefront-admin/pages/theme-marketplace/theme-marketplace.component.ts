import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';

@Component({
  selector: 'app-theme-marketplace',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="themes-layout">
      <header class="page-header">
        <div class="header-content">
          <h1>Theme Marketplace</h1>
          <p class="subtitle">Discover and apply premium templates to your storefront.</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading themes...</p>
        </div>
      } @else {
        <div class="themes-grid">
          @for (theme of themes(); track theme.id) {
            <div class="theme-card">
              <div class="theme-preview">
                <i class="pi pi-image placeholder-icon"></i>
              </div>
              <div class="theme-info">
                <h3>{{ theme.name || 'Premium Theme' }}</h3>
                <button class="premium-btn ghost-btn">Apply Theme</button>
              </div>
            </div>
          }
        </div>
      }
    </main>
  `,
  styles: [`
    .themes-layout {
      padding: 24px;
      background: var(--bg-primary);
      height: 100%;
    }
    .page-header {
      margin-bottom: 32px;
      h1 { font-size: 28px; margin: 0 0 8px 0; color: var(--text-primary); font-family: var(--font-heading); }
      .subtitle { color: var(--text-secondary); margin: 0; }
    }
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 64px; color: var(--text-secondary);
      i { font-size: 32px; margin-bottom: 16px; }
    }
    .themes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }
    .theme-card {
      border: 1px solid var(--border-primary);
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg-secondary);
      .theme-preview {
        height: 200px;
        background: var(--bg-tertiary, #e2e8f0);
        display: flex;
        align-items: center;
        justify-content: center;
        .placeholder-icon { font-size: 48px; color: var(--text-tertiary); }
      }
      .theme-info {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
        button {
          padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;
          border: 1px solid var(--border-primary); background: transparent; color: var(--text-primary);
          &:hover { background: var(--bg-primary); }
        }
      }
    }
  `]
})
export class ThemeMarketplaceComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  readonly loading = signal(false);
  readonly themes = signal<any[]>([]);

  ngOnInit() {
    this.loading.set(true);
    this.adminService.getAvailableThemes().subscribe({
      next: (res) => {
        // Fallback dummy themes if the API returns empty list
        const list = res?.data?.length ? res.data : [
          { id: 1, name: 'Ink & Gold Premium' },
          { id: 2, name: 'Swiss Precision UI' },
          { id: 3, name: 'Modern Minimalist' }
        ];
        this.themes.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
