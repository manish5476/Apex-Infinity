import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="layout-settings">
      <header class="page-header">
        <div class="header-content">
          <h1>Master Layout Settings</h1>
          <p class="subtitle">Configure your global header, footer, and brand settings.</p>
        </div>
        <div class="actions">
          <button class="premium-btn" (click)="saveLayout()" [disabled]="saving()">
            <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
            {{ saving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading layout...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
        </div>
      } @else {
        <div class="settings-grid">
          
          <!-- Global Settings -->
          <section class="config-card">
            <div class="card-header">
              <h2>Brand Settings</h2>
              <i class="pi pi-palette"></i>
            </div>
            <div class="card-body row-layout">
              <div class="form-group">
                <label>Primary Color</label>
                <div style="display: flex; gap: 8px;">
                  <input type="color" [(ngModel)]="colors.primary" style="height: 42px; width: 42px; padding: 0; border: none; cursor: pointer;" />
                  <input type="text" [(ngModel)]="colors.primary" class="premium-input" style="flex: 1" />
                </div>
              </div>
              <div class="form-group">
                <label>Currency</label>
                <input type="text" [(ngModel)]="commerce.currency" class="premium-input" placeholder="e.g. INR, USD" />
              </div>
            </div>
          </section>

          <!-- Header Config -->
          <section class="config-card">
            <div class="card-header">
              <h2>Header Navigation (Menu)</h2>
              <i class="pi pi-compass"></i>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Navigation Links</label>
                <p class="hint">These links appear at the top of your store. Use URLs like <code>/products</code> or <code>/about</code></p>
                <div class="link-builder">
                  <div class="link-row" *ngFor="let link of headerLinks; let i = index">
                    <i class="pi pi-bars drag-handle"></i>
                    <input type="text" [(ngModel)]="link.label" placeholder="Link Label (e.g. Home)" class="premium-input" />
                    <input type="text" [(ngModel)]="link.url" placeholder="URL (e.g. /)" class="premium-input" />
                    <button class="icon-btn" (click)="removeHeaderLink(i)"><i class="pi pi-trash"></i></button>
                  </div>
                  <button class="premium-btn ghost-btn" (click)="addHeaderLink()"><i class="pi pi-plus"></i> Add Header Link</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Footer Config -->
          <section class="config-card">
            <div class="card-header">
              <h2>Footer Settings</h2>
              <i class="pi pi-align-bottom"></i>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Copyright Text</label>
                <input type="text" [(ngModel)]="footerCopyright" placeholder="© 2026 Your Company" class="premium-input" />
              </div>
              
              <hr class="divider" />
              
              <div class="form-group">
                <label>Footer Links (Quick Links)</label>
                <div class="link-builder">
                  <div class="link-row" *ngFor="let link of footerLinks; let i = index">
                    <i class="pi pi-bars drag-handle"></i>
                    <input type="text" [(ngModel)]="link.label" placeholder="Link Label" class="premium-input" />
                    <input type="text" [(ngModel)]="link.url" placeholder="URL" class="premium-input" />
                    <button class="icon-btn" (click)="removeFooterLink(i)"><i class="pi pi-trash"></i></button>
                  </div>
                  <button class="premium-btn ghost-btn" (click)="addFooterLink()"><i class="pi pi-plus"></i> Add Footer Link</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      }
    </main>
  `,
  styles: [`
    .layout-settings {
      padding: 24px; background: var(--bg-primary); height: 100%; overflow-y: auto;
    }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;
      h1 { font-size: 28px; margin: 0 0 8px 0; color: var(--text-primary); font-family: var(--font-heading); }
      .subtitle { color: var(--text-secondary); margin: 0; }
    }
    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 64px; color: var(--text-secondary);
      i { font-size: 32px; margin-bottom: 16px; }
    }
    .error-state { color: var(--theme-danger, #ef4444); }
    
    .settings-grid {
      display: flex; flex-direction: column; gap: 24px; max-width: 800px; padding-bottom: 60px;
    }
    .config-card {
      border: 1px solid var(--border-primary); border-radius: 12px; background: var(--bg-secondary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      .card-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px 20px; border-bottom: 1px solid var(--border-primary);
        background: var(--bg-tertiary); border-radius: 12px 12px 0 0;
        h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
        i { color: var(--text-tertiary); }
      }
      .card-body {
        padding: 24px 20px; display: flex; flex-direction: column; gap: 24px;
        &.row-layout { flex-direction: row; gap: 32px; }
      }
    }
    
    .form-group {
      display: flex; flex-direction: column; gap: 8px; flex: 1;
      label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
      .hint { font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; }
      .premium-input {
        padding: 10px 14px; border: 1px solid var(--border-primary); border-radius: 8px;
        background: var(--bg-primary); color: var(--text-primary); outline: none;
        transition: border-color 0.2s;
        &:focus { border-color: var(--theme-primary, #3b82f6); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
      }
    }
    
    .divider { border: 0; border-top: 1px dashed var(--border-primary); margin: 8px 0; }
    
    .link-builder {
      display: flex; flex-direction: column; gap: 12px;
      .link-row {
        display: flex; gap: 12px; align-items: center;
        padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 8px;
        .drag-handle { color: var(--text-tertiary); cursor: grab; padding: 0 4px; }
        input { flex: 1; }
        .icon-btn {
          background: transparent; border: none; border-radius: 8px;
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
          &:hover { color: var(--theme-danger, #ef4444); background: rgba(239, 68, 68, 0.1); }
        }
      }
    }
    
    .premium-btn {
      padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;
      background: var(--theme-primary, #3b82f6); color: white; display: inline-flex; align-items: center; gap: 8px;
      transition: opacity 0.2s, transform 0.1s;
      &:hover { opacity: 0.9; }
      &:active { transform: scale(0.98); }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
      &.ghost-btn {
        background: transparent; border: 1px dashed var(--border-primary); color: var(--text-primary);
        justify-content: center; padding: 12px;
        &:hover { border-color: var(--theme-primary, #3b82f6); color: var(--theme-primary, #3b82f6); background: rgba(59, 130, 246, 0.05); }
      }
    }
  `]
})
export class StorefrontLayoutComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Raw layout reference
  private rawLayout: any = null;

  // Editable State
  headerLinks: Array<{label: string, url: string}> = [];
  footerLinks: Array<{label: string, url: string}> = [];
  footerCopyright = '';
  colors = { primary: '#2563eb', secondary: '#475569', accent: '#f59e0b' };
  commerce = { currency: 'INR' };

  ngOnInit() {
    this.fetchLayout();
  }

  fetchLayout() {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.getLayout().subscribe({
      next: (res) => {
        // Backend returns layout in res.data or direct res
        const layout = res?.data ?? res;
        this.rawLayout = layout;
        
        // Parse Header Links safely
        try {
          const navConfig = layout.header?.[0]?.config;
          if (navConfig && navConfig.links) {
            this.headerLinks = JSON.parse(JSON.stringify(navConfig.links));
          }
        } catch(e) {}

        // Parse Footer safely
        try {
          const footConfig = layout.footer?.[0]?.config;
          if (footConfig) {
            this.footerCopyright = footConfig.copyright || '';
            if (footConfig.columns && footConfig.columns[0]?.links) {
              this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
            }
          }
        } catch(e) {}

        // Parse Globals safely
        try {
          if (layout.globalSettings?.colors) {
            this.colors = { ...this.colors, ...layout.globalSettings.colors };
          }
          if (layout.globalSettings?.commerce) {
            this.commerce = { ...this.commerce, ...layout.globalSettings.commerce };
          }
        } catch(e) {}

        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load layout configuration.');
        this.loading.set(false);
      }
    });
  }

  addHeaderLink() {
    this.headerLinks.push({ label: 'New Link', url: '/' });
  }

  removeHeaderLink(index: number) {
    this.headerLinks.splice(index, 1);
  }

  addFooterLink() {
    this.footerLinks.push({ label: 'New Link', url: '/' });
  }

  removeFooterLink(index: number) {
    this.footerLinks.splice(index, 1);
  }

  saveLayout() {
    if (!this.rawLayout) return;

    this.saving.set(true);

    // Deep clone to avoid mutating raw before success
    const payload = JSON.parse(JSON.stringify(this.rawLayout));

    // Inject updated header
    if (!payload.header) payload.header = [{}];
    if (!payload.header[0].config) payload.header[0].config = {};
    payload.header[0].config.links = this.headerLinks;

    // Inject updated footer
    if (!payload.footer) payload.footer = [{}];
    if (!payload.footer[0].config) payload.footer[0].config = {};
    payload.footer[0].config.copyright = this.footerCopyright;
    if (!payload.footer[0].config.columns) payload.footer[0].config.columns = [{ title: 'Quick Links', links: [] }];
    payload.footer[0].config.columns[0].links = this.footerLinks;

    // Inject global settings
    if (!payload.globalSettings) payload.globalSettings = {};
    payload.globalSettings.colors = { ...(payload.globalSettings.colors || {}), ...this.colors };
    payload.globalSettings.commerce = { ...(payload.globalSettings.commerce || {}), ...this.commerce };

    this.adminService.updateLayout(payload).subscribe({
      next: () => {
        this.saving.set(false);
        // Optionally show a toast here
        alert('Layout updated successfully! The storefront will now reflect these changes.');
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        alert('Error saving layout.');
      }
    });
  }
}
