import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="layout-settings">
      <header class="page-header">
        <div class="header-content">
          <h1>Master Layout Settings</h1>
          <p class="subtitle">Configure your global header, footer, and brand settings.</p>
        </div>
        <div class="actions">
          <button class="premium-btn">Save Changes</button>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Loading layout...</p>
        </div>
      } @else {
        <div class="settings-grid">
          <!-- Header Config -->
          <section class="config-card">
            <div class="card-header">
              <h2>Header Settings</h2>
              <i class="pi pi-compass"></i>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Brand Logo URL</label>
                <input type="text" placeholder="https://..." class="premium-input" />
              </div>
              <div class="form-group">
                <label>Navigation Links</label>
                <div class="link-builder">
                  <div class="link-row" *ngFor="let link of [1,2,3]">
                    <input type="text" placeholder="Link Label" class="premium-input" />
                    <input type="text" placeholder="/path" class="premium-input" />
                    <button class="icon-btn"><i class="pi pi-trash"></i></button>
                  </div>
                  <button class="premium-btn ghost-btn"><i class="pi pi-plus"></i> Add Link</button>
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
                <input type="text" placeholder="© 2026 Your Company" class="premium-input" />
              </div>
            </div>
          </section>
        </div>
      }
    </main>
  `,
  styles: [`
    .layout-settings {
      padding: 24px;
      background: var(--bg-primary);
      height: 100%;
      overflow-y: auto;
    }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;
      h1 { font-size: 28px; margin: 0 0 8px 0; color: var(--text-primary); font-family: var(--font-heading); }
      .subtitle { color: var(--text-secondary); margin: 0; }
    }
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 64px; color: var(--text-secondary);
      i { font-size: 32px; margin-bottom: 16px; }
    }
    .settings-grid {
      display: flex; flex-direction: column; gap: 24px; max-width: 800px;
    }
    .config-card {
      border: 1px solid var(--border-primary); border-radius: 12px; background: var(--bg-secondary);
      .card-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px 20px; border-bottom: 1px solid var(--border-primary);
        h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
        i { color: var(--text-tertiary); }
      }
      .card-body {
        padding: 20px; display: flex; flex-direction: column; gap: 20px;
      }
    }
    .form-group {
      display: flex; flex-direction: column; gap: 8px;
      label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
      .premium-input {
        padding: 10px 12px; border: 1px solid var(--border-primary); border-radius: 8px;
        background: var(--bg-primary); color: var(--text-primary); outline: none;
        &:focus { border-color: var(--theme-primary, #3b82f6); }
      }
    }
    .link-builder {
      display: flex; flex-direction: column; gap: 12px;
      .link-row {
        display: flex; gap: 12px;
        input { flex: 1; }
        .icon-btn {
          background: transparent; border: 1px solid var(--border-primary); border-radius: 8px;
          padding: 0 12px; color: var(--text-secondary); cursor: pointer;
          &:hover { color: var(--theme-danger, #ef4444); background: var(--bg-primary); }
        }
      }
    }
    .premium-btn {
      padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;
      background: var(--theme-primary, #3b82f6); color: white; display: inline-flex; align-items: center; gap: 8px;
      &.ghost-btn {
        background: transparent; border: 1px dashed var(--border-primary); color: var(--text-secondary);
        justify-content: center;
        &:hover { border-color: var(--text-secondary); }
      }
    }
  `]
})
export class StorefrontLayoutComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  readonly loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.adminService.getLayout().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }
}
