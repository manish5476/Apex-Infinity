    import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-theme-marketplace',
  standalone: true,
  imports: [CommonModule],
  providers: [MessageService],
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
              <div class="theme-preview" [style.background]="theme.gradient || theme.color">
                <!-- Visual representation of the theme -->
              </div>
              <div class="theme-info">
                <div class="meta">
                  <h3>{{ theme.name || 'Premium Theme' }}</h3>
                  <p class="desc">{{ theme.description || theme.category }}</p>
                </div>
                <button class="premium-btn ghost-btn" 
                        [class.applied]="activeThemeId() === theme.id"
                        (click)="applyTheme(theme)">
                  {{ activeThemeId() === theme.id ? 'Applied' : 'Apply Theme' }}
                </button>
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
      border: 1px solid var(--border-primary, var(--border-primary));
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg-secondary);
      transition: transform 0.2s, box-shadow 0.2s;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.08);
      }

      .theme-preview {
        height: 180px;
        background: var(--bg-tertiary, var(--border-primary));
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .theme-info {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;

        .meta {
          flex: 1;
          h3 { margin: 0; font-size: 16px; color: var(--text-primary); font-weight: 600; }
          .desc { margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary); opacity: 0.9; }
        }

        button {
          padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer;
          border: 1px solid var(--border-primary, var(--border-primary)); background: transparent; color: var(--text-primary);
          transition: all 0.2s;
          white-space: nowrap;
          
          &:hover { background: var(--bg-primary); }
          
          &.applied {
            background: color-mix(in srgb, var(--accent-primary, #4f46e5) 15%, transparent);
            color: var(--accent-primary, #4f46e5);
            border-color: transparent;
            font-weight: 600;
          }
        }
      }
    }
  `]
})
export class ThemeMarketplaceComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  private readonly messageService = inject(MessageService);
  
  readonly loading = signal(false);
  readonly themes = signal<any[]>([]);
  readonly activeThemeId = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    
    // 1. Fetch available themes from backend
    this.adminService.getAvailableThemes().subscribe({
      next: (res) => {
        // Fix: API returns data.themes array, not just data
        const list = res?.data?.themes?.length ? res.data.themes : [];
        this.themes.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    // 2. Fetch current layout to see what theme is active
    this.adminService.getLayout().subscribe({
      next: (res) => {
        const layout = res?.data;
        if (layout?.globalSettings?.colors?.primary) {
          // Temporarily match active theme by color (since we don't save themeId to schema yet)
          // We will update the StorefrontLayoutComponent to do the same!
          const activeColor = layout.globalSettings.colors.primary;
          const matched = this.themes().find(t => t.color === activeColor);
          if (matched) {
            this.activeThemeId.set(matched.id);
          }
        }
      }
    });
  }

  applyTheme(theme: any) {
    this.activeThemeId.set(theme.id);
    this.messageService.add({ severity: 'info', summary: 'Updating Theme', detail: 'Applying ' + theme.name + ' to your storefront...' });
    
    // Save to backend by pushing the color to globalSettings
    // This updates the storefront public view for everyone
    this.adminService.updateLayout({
      globalSettings: {
        colors: {
          primary: theme.color,
          secondary: 'var(--text-secondary)',
          accent: theme.color // map accent to the same color for now
        }
      }
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Theme Applied', detail: 'Storefront successfully updated.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to apply theme.' });
      }
    });
  }
}
