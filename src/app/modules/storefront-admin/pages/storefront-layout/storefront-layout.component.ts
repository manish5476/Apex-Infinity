
import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
import { OrganizationService } from '../../../../modules/organization/organization.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface PageReference {
  _id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  pageType: string;
}

interface StorefrontTheme {
  id: string;
  name: string;
  description?: string;
  color: string;
  gradient?: string;
}

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="layout-settings">
      <header class="page-header">
        <div class="header-content">
          <h1>Master Layout & Branding</h1>
          <p class="subtitle">Configure your global themes, header, footer, and active routing pipelines.</p>
        </div>
        <div class="actions">
          <button class="premium-btn primary-btn" (click)="saveLayout()" [disabled]="saving() || loading()">
            <i class="pi" [class.pi-spin]="saving()" [class.pi-spinner]="saving()" [class.pi-check]="!saving()"></i>
            {{ saving() ? 'Syncing...' : 'Save Configuration' }}
          </button>
        </div>
      </header>
    
      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Assembling core layout schema & themes...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i class="pi pi-exclamation-triangle"></i>
          <p>{{ error() }}</p>
          <button class="premium-btn ghost-btn" (click)="fetchCoreData()">Retry</button>
        </div>
      } @else {
    
        <div class="settings-grid">
    
          <section class="config-card bento-block span-4">
            <div class="card-header">
              <h2><i class="pi pi-palette"></i> Brand Settings</h2>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label>Primary Theme Color</label>
                <div class="color-picker-wrapper">
                  <input type="color" [(ngModel)]="colors.primary" class="color-wheel" />
                  <input type="text" [(ngModel)]="colors.primary" class="premium-input hex-input" />
                </div>
                <p class="hint" style="margin-top: 8px;">Used for primary buttons, active links, and accents.</p>
              </div>
    
              <hr class="divider" style="margin: 20px 0;" />
              <div class="form-group">
                <label>Storefront Currency</label>
                <input type="text" [(ngModel)]="commerce.currency" class="premium-input uppercase-input" placeholder="e.g. INR" />
              </div>
    
              <hr class="divider" style="margin: 20px 0;" />
    
              <div class="form-group">
                <label>Fulfillment Strategy</label>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                  <label class="switch">
                    <input type="checkbox" [(ngModel)]="platformDeliveryEnabled">
                    <span class="slider round"></span>
                  </label>
                  <span>Use Apex Global Delivery Network (Platform Fulfilled)</span>
                </div>
                <p class="hint" style="margin-top: 8px;">If enabled, your orders can be fulfilled by global Apex Delivery Partners.</p>
              </div>
            </div>
          </section>
    
          <section class="config-card bento-block span-8">
            <div class="card-header">
              <h2><i class="pi pi-sparkles"></i> Theme Marketplace</h2>
              <span class="badge">{{ themes().length }} Templates</span>
            </div>
            <div class="card-body marketplace-body">
              <p class="hint" style="margin-bottom: 20px;">Select a curated template to instantly update your global branding palette.</p>
    
              @if (themes().length === 0) {
                <div class="empty-hint">No premium themes available from the registry.</div>
              } @else {
                <div class="themes-grid">
                  @for (theme of themes(); track theme.id) {
                    <div class="theme-card"
                      [class.active]="colors.primary === theme.color"
                      (click)="applyThemeLocally(theme)">
                      <div class="theme-preview" [style.background]="theme.gradient || theme.color">
                        @if (colors.primary === theme.color) {
                          <div class="active-indicator"><i class="pi pi-check-circle"></i></div>
                        }
                      </div>
                      <div class="theme-info">
                        <span class="t-name">{{ theme.name || 'Premium Theme' }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </section>
    
          <section class="config-card bento-block span-8">
            <div class="card-header">
              <h2><i class="pi pi-compass"></i> Header Navigation Bar</h2>
            </div>
            <div class="card-body">
              <p class="hint" style="margin-bottom: 20px;">Map external URLs or search to link existing storefront pages.</p>
    
              <div class="link-builder">
                @for (link of headerLinks; track link; let i = $index) {
                  <div class="link-row">
                    <i class="pi pi-bars drag-handle"></i>
                    <div class="input-group">
                      <input type="text" [(ngModel)]="link.label" placeholder="Display Label (e.g. Shop All)" class="premium-input" />
                    </div>
                    <div class="input-group suggestion-container">
                      <input
                        type="text"
                        [(ngModel)]="link.url"
                        (focus)="activeSuggestionIndex.set('header-' + i)"
                        (input)="filterPages(link.url)"
                        placeholder="URL Routing (e.g. /products)"
                        class="premium-input mono-input" />
                        @if (activeSuggestionIndex() === 'header-' + i && filteredPages().length > 0) {
                          <div class="suggestions-dropdown">
                            <div class="suggestion-header">Storefront Pages</div>
                            @for (p of filteredPages(); track p._id) {
                              <div class="suggestion-item" (click)="selectSuggestion(p, link)">
                                <div class="s-main"><i class="pi pi-file"></i> {{ p.name }}</div>
                                <span class="s-slug">/{{ p.slug }}</span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                      <button class="icon-btn danger" (click)="removeHeaderLink(i)"><i class="pi pi-trash"></i></button>
                    </div>
                  }
    
                  <button class="premium-btn ghost-btn dashed-btn" (click)="addHeaderLink()">
                    <i class="pi pi-plus"></i> Add Nav Link
                  </button>
                </div>
              </div>
            </section>
    
            <section class="config-card bento-block span-4 page-manager-block">
              <div class="card-header">
                <h2><i class="pi pi-sitemap"></i> Live Pages</h2>
                <span class="badge">{{ pages().length }} Nodes</span>
              </div>
              <div class="card-body scrollable-body">
                @if (pages().length === 0) {
                  <p class="empty-hint" style="text-align: center; margin: 24px 0;">No pages initialized in CMS.</p>
                } @else {
                  <div class="page-list-compact">
                    @for (page of pages(); track page._id) {
                      <div class="compact-page-row">
                        <div class="page-ident">
                          <span class="p-name">{{ page.name }}</span>
                          <span class="p-slug">/{{ page.slug }}</span>
                        </div>
                        <button
                          class="icon-action-btn"
                          [class.active]="page.isPublished"
                          (click)="togglePagePublishState(page)"
                          [title]="page.isPublished ? 'Unpublish Node' : 'Publish Node'">
                          <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </section>
    
            <section class="config-card bento-block span-12">
              <div class="card-header">
                <h2><i class="pi pi-align-bottom"></i> Footer Configuration</h2>
              </div>
              <div class="card-body footer-grid-layout">
    
                <div class="form-group footer-left-col">
                  <label>Copyright Declaration</label>
                  <input type="text" [(ngModel)]="footerCopyright" placeholder="© 2026 Your Store Name" class="premium-input" />
                  <p class="hint" style="margin-top: 8px;">Displayed at the absolute bottom of the storefront.</p>
                </div>
    
                <div class="form-group footer-right-col">
                  <label>Footer Matrix (Quick Links)</label>
                  <div class="link-builder">
                    @for (link of footerLinks; track link; let i = $index) {
                      <div class="link-row">
                        <i class="pi pi-bars drag-handle"></i>
                        <div class="input-group">
                          <input type="text" [(ngModel)]="link.label" placeholder="Display Label" class="premium-input" />
                        </div>
                        <div class="input-group suggestion-container">
                          <input
                            type="text"
                            [(ngModel)]="link.url"
                            (focus)="activeSuggestionIndex.set('footer-' + i)"
                            (input)="filterPages(link.url)"
                            placeholder="URL Routing"
                            class="premium-input mono-input" />
                            @if (activeSuggestionIndex() === 'footer-' + i && filteredPages().length > 0) {
                              <div class="suggestions-dropdown">
                                <div class="suggestion-header">Storefront Pages</div>
                                @for (p of filteredPages(); track p._id) {
                                  <div class="suggestion-item" (click)="selectSuggestion(p, link)">
                                    <div class="s-main"><i class="pi pi-file"></i> {{ p.name }}</div>
                                    <span class="s-slug">/{{ p.slug }}</span>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                          <button class="icon-btn danger" (click)="removeFooterLink(i)"><i class="pi pi-trash"></i></button>
                        </div>
                      }
    
                      <button class="premium-btn ghost-btn dashed-btn" (click)="addFooterLink()">
                        <i class="pi pi-plus"></i> Add Footer Link
                      </button>
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
      padding: 32px; 
      background: var(--bg-secondary); 
      height: 100%; 
      overflow-y: auto; 
      font-family: 'Inter', sans-serif;
    }
    
    /* Header Area */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
      max-width: 1600px; margin-left: auto; margin-right: auto;
      
      .header-content {
        h1 { font-size: 26px; font-weight: 700; margin: 0 0 6px 0; color: var(--text-primary); letter-spacing: -0.02em; }
        .subtitle { color: var(--text-secondary); margin: 0; font-size: 14px; }
      }
    }

    /* Loading & Error States */
    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 24px; color: var(--text-secondary); gap: 16px;
      i { font-size: 32px; }
      p { margin: 0; font-size: 15px; font-weight: 500; }
    }
    .error-state { color: var(--color-error); background: var(--bg-primary); border-radius: 14px; border: 1px solid var(--color-error-bg); max-width: 600px; margin: 0 auto; }
    
    /* ========================================================
       12-COLUMN CSS GRID SYSTEM (The Key to Perfect Alignment)
       ======================================================== */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 24px;
      width: 100%;
      max-width: 1600px; /* Full width utilization */
      margin: 0 auto;
      padding-bottom: 80px;
    }

    .span-4 { grid-column: span 4; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }

    /* Responsive Grid Breakpoints */
    @media (max-width: 1200px) {
      .span-4 { grid-column: span 5; }
      .span-8 { grid-column: span 7; }
    }
    @media (max-width: 992px) {
      .span-4, .span-8, .span-12 { grid-column: span 12; } /* Stack vertically on smaller screens */
    }

    /* Bento Block Design */
    .bento-block {
      background: var(--bg-primary); 
      border: 1px solid var(--border-primary); 
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
      display: flex; 
      flex-direction: column;
      overflow: hidden;
    }

    .config-card {
      .card-header {
        display: flex; justify-content: space-between; align-items: center; padding: 20px 24px;
        border-bottom: 1px solid var(--bg-secondary); background: var(--bg-primary);
        h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 10px; i { color: var(--text-secondary); font-size: 16px; } }
        .badge { background: var(--bg-secondary); color: var(--text-secondary); font-size: 11px; padding: 4px 10px; border-radius: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;}
      }
      .card-body { padding: 24px; display: flex; flex-direction: column; flex: 1; }
      
      /* Allows inner scroll without breaking the grid row height */
      .marketplace-body { max-height: 400px; overflow-y: auto; }
      .scrollable-body { max-height: 400px; overflow-y: auto; padding-right: 16px; }
    }

    /* --- Theme Marketplace Grid (Nested inside span-8) --- */
    .themes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      padding-bottom: 8px; /* Room for shadow on hover */
    }
    
    .theme-card {
      display: flex; flex-direction: column;
      border-radius: 12px; overflow: hidden; border: 2px solid transparent;
      background: var(--bg-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px var(--border-primary);
      cursor: pointer; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      
      .theme-preview {
        height: 100px; width: 100%; position: relative;
        border-bottom: 1px solid var(--bg-secondary);
        .active-indicator {
          position: absolute; top: 10px; right: 10px; background: var(--bg-primary); color: var(--color-success);
          border-radius: 50%; width: 22px; height: 22px; display: grid; place-items: center;
          font-size: 13px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
      }
      .theme-info {
        padding: 14px; font-size: 13px; font-weight: 600; color: var(--text-primary); text-align: center;
      }
      
      &:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.1), 0 0 0 1px var(--text-secondary); }
      &.active {
        border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        .theme-info { color: var(--accent-primary); background: var(--color-info-bg); }
      }
    }
    
    /* --- General Form & Inputs --- */
    .form-group {
      display: flex; flex-direction: column; gap: 8px;
      label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
      .hint { font-size: 12px; color: var(--text-secondary); margin: 0; }
    }
    
    .premium-input {
      padding: 12px 14px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-secondary);
      color: var(--text-primary); outline: none; font-size: 14px; font-family: inherit; transition: all 0.2s; width: 100%; box-sizing: border-box;
      &::placeholder { color: var(--text-secondary); }
      &:focus { border-color: var(--accent-primary); background: var(--bg-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
      &.uppercase-input { text-transform: uppercase; }
      &.mono-input { font-family: monospace; }
    }

    .color-picker-wrapper {
      display: flex; gap: 12px; align-items: center;
      .color-wheel { height: 44px; width: 48px; padding: 0; border: 1px solid var(--border-primary); border-radius: 8px; cursor: pointer; background: var(--bg-primary); }
      .hex-input { flex: 1; font-family: monospace; text-transform: uppercase; }
    }
    
    .divider { border: 0; border-top: 1px dashed var(--border-primary); }
    
    /* --- Link Builder & Suggestions --- */
    .link-builder {
      display: flex; flex-direction: column; gap: 16px;
      .link-row {
        display: flex; gap: 12px; align-items: center; padding: 14px; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        .drag-handle { color: var(--text-secondary); cursor: grab; padding: 0 4px; font-size: 16px; }
        .input-group { flex: 1; position: relative; }
      }
    }

    .suggestion-container { position: relative; }
    .suggestions-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1); z-index: 100; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column;
      
      .suggestion-header { padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); background: var(--bg-secondary); border-bottom: 1px solid var(--bg-secondary); }
      .suggestion-item {
        padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--bg-secondary);
        &:last-child { border-bottom: none; }
        &:hover { background: var(--bg-secondary); }
        .s-main { font-size: 13px; font-weight: 500; color: var(--text-primary); display: flex; align-items: center; gap: 8px; i { color: var(--accent-primary); } }
        .s-slug { font-size: 12px; font-family: monospace; color: var(--text-secondary); }
      }
    }
    
    /* --- Inline Page Manager --- */
    .page-list-compact {
      display: flex; flex-direction: column; gap: 10px;
      .compact-page-row {
        display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-secondary); border: 1px solid var(--bg-secondary); border-radius: 10px;
        transition: border-color 0.2s;
        &:hover { border-color: var(--border-primary); }
        .page-ident { display: flex; flex-direction: column; gap: 4px; .p-name { font-size: 14px; font-weight: 600; color: var(--text-primary); } .p-slug { font-size: 12px; font-family: monospace; color: var(--text-secondary); } }
      }
    }

    /* --- Footer Specific Split --- */
    .footer-grid-layout {
      display: flex; gap: 40px; flex-wrap: wrap; align-items: flex-start;
      .footer-left-col { flex: 1; min-width: 320px; }
      .footer-right-col { flex: 2; min-width: 400px; }
    }

    /* --- Buttons --- */
    .premium-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; font-size: 14px; padding: 12px 20px;
      border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.primary-btn { background: var(--text-primary); color: var(--bg-primary); &:hover:not([disabled]) { background: var(--text-primary); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1); transform: translateY(-1px); } }
      &.ghost-btn { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-secondary); &:hover:not([disabled]) { background: var(--bg-secondary); color: var(--text-primary); } }
      &.dashed-btn { border-style: dashed; border-color: var(--text-secondary); width: 100%; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--color-info-bg); } }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .icon-btn {
      width: 40px; height: 40px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; font-size: 16px; flex-shrink: 0;
      &:hover { background: var(--bg-secondary); color: var(--text-primary); }
      &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
    }

    .icon-action-btn {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border-primary);
      background: var(--bg-primary); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease; font-size: 14px;
      &:hover { background: var(--bg-secondary); color: var(--text-primary); }
      &.active { background: var(--color-success-bg); color: var(--color-success); border-color: #bbf7d0; }
    }
  `]
})
export class StorefrontLayoutComponent implements OnInit {
  private readonly adminService = inject(StorefrontAdminService);
  private readonly orgService = inject(OrganizationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Raw API state
  private rawLayout: any = null;
  readonly pages = signal<PageReference[]>([]);
  readonly themes = signal<StorefrontTheme[]>([]);

  // Platform Delivery
  platformDeliveryEnabled = false;

  // UI Suggestion State
  readonly activeSuggestionIndex = signal<string | null>(null);
  readonly filteredPages = signal<PageReference[]>([]);

  // Editable Layout State
  headerLinks: Array<{ label: string, url: string }> = [];
  footerLinks: Array<{ label: string, url: string }> = [];
  footerCopyright = '';
  colors = { primary: 'var(--accent-primary)', secondary: 'var(--text-secondary)', accent: 'var(--color-warning)' };
  commerce = { currency: 'INR' };

  ngOnInit() {
    this.fetchCoreData();
  }

  // Close suggestions when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.suggestion-container')) {
      this.activeSuggestionIndex.set(null);
    }
  }

  fetchCoreData() {
    this.loading.set(true);
    this.error.set(null);

    // Fetch Layout Config, Pages, and Themes simultaneously
    forkJoin({
      layoutRes: this.adminService.getLayout(),
      pagesRes: this.adminService.getPages(),
      themesRes: this.adminService.getAvailableThemes().pipe(
        catchError(() => of({ data: { themes: [] } })) // Soft fail themes if unavailable
      ),
      orgRes: this.orgService.getMyOrganization().pipe(
        catchError(() => of({ data: null }))
      )
    }).subscribe({
      next: ({ layoutRes, pagesRes, themesRes, orgRes }) => {

        // 1. Map Themes
        const themeList = (themesRes as any)?.data?.themes || [];
        this.themes.set(themeList);

        // 2. Map Pages
        const pageData = (pagesRes as any)?.data ?? [];
        this.pages.set(pageData);
        this.filteredPages.set(pageData);

        // 3. Map Layout Configuration
        const layout = (layoutRes as any)?.data ?? layoutRes;
        this.rawLayout = layout;

        try {
          const navConfig = layout.header?.[0]?.config;
          if (navConfig && navConfig.links) {
            this.headerLinks = JSON.parse(JSON.stringify(navConfig.links));
          }
        } catch (e) { }

        try {
          const footConfig = layout.footer?.[0]?.config;
          if (footConfig) {
            this.footerCopyright = footConfig.copyright || '';
            if (footConfig.columns && footConfig.columns[0]?.links) {
              this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
            }
          }
        } catch (e) { }

        try {
          if (layout.globalSettings?.colors) {
            this.colors = { ...this.colors, ...layout.globalSettings.colors };
          }
          if (layout.globalSettings?.commerce) {
            this.commerce = { ...this.commerce, ...layout.globalSettings.commerce };
          }
        } catch (e) { }

        const org = (orgRes as any)?.data;
        if (org && org.platformDelivery) {
          this.platformDeliveryEnabled = org.platformDelivery.enabled || false;
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Data sync failed:', err);
        this.error.set('Failed to initialize storefront configuration parameters.');
        this.loading.set(false);
      }
    });
  }

  // -------------------------------------------------------------
  // Theme Marketplace Handlers
  // -------------------------------------------------------------

  applyThemeLocally(theme: StorefrontTheme) {
    this.colors.primary = theme.color;
    // Map secondary/accent to logical derivatives if needed. 
    this.colors.accent = theme.color;
  }

  // -------------------------------------------------------------
  // Suggestion & Link Handlers
  // -------------------------------------------------------------

  filterPages(searchTerm: string) {
    const term = searchTerm.toLowerCase().replace('/', '');
    if (!term) {
      this.filteredPages.set(this.pages());
      return;
    }
    const filtered = this.pages().filter(p =>
      p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
    );
    this.filteredPages.set(filtered);
  }

  selectSuggestion(page: PageReference, linkObj: any) {
    if (!linkObj.label || linkObj.label === 'New Link' || linkObj.label === 'Display Label') {
      linkObj.label = page.name;
    }
    linkObj.url = '/' + page.slug;
    this.activeSuggestionIndex.set(null);
  }

  addHeaderLink() { this.headerLinks.push({ label: '', url: '/' }); }
  removeHeaderLink(index: number) { this.headerLinks.splice(index, 1); }

  addFooterLink() { this.footerLinks.push({ label: '', url: '/' }); }
  removeFooterLink(index: number) { this.footerLinks.splice(index, 1); }

  // -------------------------------------------------------------
  // Inline Page Manager
  // -------------------------------------------------------------

  togglePagePublishState(page: PageReference) {
    const request$ = page.isPublished
      ? this.adminService.unpublishPage(page._id)
      : this.adminService.publishPage(page._id);

    request$.subscribe({
      next: () => {
        this.pages.update(list =>
          list.map(p => p._id === page._id ? { ...p, isPublished: !page.isPublished } : p)
        );
      },
      error: (err) => {
        console.error(err);
        alert('Failed to sync page status block.');
      }
    });
  }

  // -------------------------------------------------------------
  // Save Operations
  // -------------------------------------------------------------

  saveLayout() {
    if (!this.rawLayout) return;
    this.saving.set(true);

    const payload = JSON.parse(JSON.stringify(this.rawLayout));

    // Compile Header
    if (!payload.header) payload.header = [{}];
    if (!payload.header[0].config) payload.header[0].config = {};
    payload.header[0].config.links = this.headerLinks;

    // Compile Footer
    if (!payload.footer) payload.footer = [{}];
    if (!payload.footer[0].config) payload.footer[0].config = {};
    payload.footer[0].config.copyright = this.footerCopyright;
    if (!payload.footer[0].config.columns) payload.footer[0].config.columns = [{ title: 'Quick Links', links: [] }];
    payload.footer[0].config.columns[0].links = this.footerLinks;

    // Compile Globals (Themes & Commerce)
    if (!payload.globalSettings) payload.globalSettings = {};
    payload.globalSettings.colors = { ...(payload.globalSettings.colors || {}), ...this.colors };
    payload.globalSettings.commerce = { ...(payload.globalSettings.commerce || {}), ...this.commerce };

    forkJoin([
      this.adminService.updateLayout(payload),
      this.orgService.updateMyOrganization({
        platformDelivery: { enabled: this.platformDeliveryEnabled }
      } as any)
    ]).subscribe({
      next: () => {
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.saving.set(false);
        alert('Failed to save layout configuration.');
      }
    });
  }
}
