import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorefrontAdminService } from '@core/services/storefront-admin.service';
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
  imports: [CommonModule, FormsModule],
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
                <div class="link-row" *ngFor="let link of headerLinks; let i = index">
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
                  <div class="link-row" *ngFor="let link of footerLinks; let i = index">
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
  
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Raw API state
  private rawLayout: any = null;
  readonly pages = signal<PageReference[]>([]);
  readonly themes = signal<StorefrontTheme[]>([]);
  
  // UI Suggestion State
  readonly activeSuggestionIndex = signal<string | null>(null);
  readonly filteredPages = signal<PageReference[]>([]);

  // Editable Layout State
  headerLinks: Array<{label: string, url: string}> = [];
  footerLinks: Array<{label: string, url: string}> = [];
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
      )
    }).subscribe({
      next: ({ layoutRes, pagesRes, themesRes }) => {
        
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
        } catch(e) {}

        try {
          const footConfig = layout.footer?.[0]?.config;
          if (footConfig) {
            this.footerCopyright = footConfig.copyright || '';
            if (footConfig.columns && footConfig.columns[0]?.links) {
              this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
            }
          }
        } catch(e) {}

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

    this.adminService.updateLayout(payload).subscribe({
      next: () => {
        this.saving.set(false);
      },
      error: (err) => {
        console.error(err);
        this.saving.set(false);
        alert('Error saving layout configuration to matrix.');
      }
    });
  }
}// import { CommonModule } from '@angular/common';
// import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { StorefrontAdminService } from '@core/services/storefront-admin.service';
// import { forkJoin, of } from 'rxjs';
// import { catchError } from 'rxjs/operators';

// interface PageReference {
//   _id: string;
//   name: string;
//   slug: string;
//   isPublished: boolean;
//   pageType: string;
// }

// interface StorefrontTheme {
//   id: string;
//   name: string;
//   description?: string;
//   color: string;
//   gradient?: string;
// }

// @Component({
//   selector: 'app-storefront-layout',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   template: `
//     <main class="layout-settings">
//       <header class="page-header">
//         <div class="header-content">
//           <h1>Master Layout & Branding</h1>
//           <p class="subtitle">Configure your global themes, header, footer, and active routing pipelines.</p>
//         </div>
//         <div class="actions">
//           <button class="premium-btn primary-btn" (click)="saveLayout()" [disabled]="saving() || loading()">
//             <i class="pi" [class.pi-spin]="saving()" [class.pi-spinner]="saving()" [class.pi-check]="!saving()"></i>
//             {{ saving() ? 'Syncing...' : 'Save Configuration' }}
//           </button>
//         </div>
//       </header>

//       @if (loading()) {
//         <div class="loading-state">
//           <i class="pi pi-spin pi-spinner"></i>
//           <p>Assembling core layout schema & themes...</p>
//         </div>
//       } @else if (error()) {
//         <div class="error-state">
//           <i class="pi pi-exclamation-triangle"></i>
//           <p>{{ error() }}</p>
//           <button class="premium-btn ghost-btn" (click)="fetchCoreData()">Retry</button>
//         </div>
//       } @else {
//         <div class="settings-grid">
          
//           <div class="bento-row">
            
//             <section class="config-card bento-block col-2">
//               <div class="card-header">
//                 <h2><i class="pi pi-sparkles"></i> Theme Marketplace</h2>
//                 <span class="badge">{{ themes().length }} Templates</span>
//               </div>
//               <div class="card-body">
//                 <p class="hint" style="margin-bottom: 16px;">Select a curated template to instantly update your global branding palette.</p>
                
//                 @if (themes().length === 0) {
//                   <div class="empty-hint">No premium themes available from the registry.</div>
//                 } @else {
//                   <div class="themes-grid">
//                     @for (theme of themes(); track theme.id) {
//                       <div class="theme-card" 
//                            [class.active]="colors.primary === theme.color" 
//                            (click)="applyThemeLocally(theme)">
//                         <div class="theme-preview" [style.background]="theme.gradient || theme.color">
//                           @if (colors.primary === theme.color) {
//                             <div class="active-indicator"><i class="pi pi-check-circle"></i></div>
//                           }
//                         </div>
//                         <div class="theme-info">
//                           <span class="t-name">{{ theme.name || 'Premium Theme' }}</span>
//                         </div>
//                       </div>
//                     }
//                   </div>
//                 }
//               </div>
//             </section>

//             <section class="config-card bento-block col-1">
//               <div class="card-header">
//                 <h2><i class="pi pi-palette"></i> Brand Settings</h2>
//               </div>
//               <div class="card-body">
//                 <div class="form-group">
//                   <label>Primary Theme Color</label>
//                   <div class="color-picker-wrapper">
//                     <input type="color" [(ngModel)]="colors.primary" class="color-wheel" />
//                     <input type="text" [(ngModel)]="colors.primary" class="premium-input hex-input" />
//                   </div>
//                   <p class="hint" style="margin-top: 8px;">Used for primary buttons, active links, and accents.</p>
//                 </div>
                
//                 <hr class="divider" style="margin: 16px 0;" />
                
//                 <div class="form-group">
//                   <label>Storefront Currency</label>
//                   <input type="text" [(ngModel)]="commerce.currency" class="premium-input uppercase-input" placeholder="e.g. INR" />
//                 </div>
//               </div>
//             </section>
//           </div>

//           <div class="bento-row">
            
//             <section class="config-card bento-block col-2">
//               <div class="card-header">
//                 <h2><i class="pi pi-compass"></i> Header Navigation Bar</h2>
//               </div>
//               <div class="card-body">
//                 <p class="hint" style="margin-bottom: 16px;">Map external URLs or search to link existing storefront pages.</p>
                
//                 <div class="link-builder">
//                   <div class="link-row" *ngFor="let link of headerLinks; let i = index">
//                     <i class="pi pi-bars drag-handle"></i>
                    
//                     <div class="input-group">
//                       <input type="text" [(ngModel)]="link.label" placeholder="Display Label (e.g. Shop All)" class="premium-input" />
//                     </div>
                    
//                     <div class="input-group suggestion-container">
//                       <input 
//                         type="text" 
//                         [(ngModel)]="link.url" 
//                         (focus)="activeSuggestionIndex.set('header-' + i)"
//                         (input)="filterPages(link.url)"
//                         placeholder="URL Routing (e.g. /products)" 
//                         class="premium-input mono-input" />
                      
//                       @if (activeSuggestionIndex() === 'header-' + i && filteredPages().length > 0) {
//                         <div class="suggestions-dropdown">
//                           <div class="suggestion-header">Storefront Pages</div>
//                           @for (p of filteredPages(); track p._id) {
//                             <div class="suggestion-item" (click)="selectSuggestion(p, link)">
//                               <div class="s-main"><i class="pi pi-file"></i> {{ p.name }}</div>
//                               <span class="s-slug">/{{ p.slug }}</span>
//                             </div>
//                           }
//                         </div>
//                       }
//                     </div>
                    
//                     <button class="icon-btn danger" (click)="removeHeaderLink(i)"><i class="pi pi-trash"></i></button>
//                   </div>
                  
//                   <button class="premium-btn ghost-btn dashed-btn" (click)="addHeaderLink()">
//                     <i class="pi pi-plus"></i> Add Nav Link
//                   </button>
//                 </div>
//               </div>
//             </section>

//             <section class="config-card bento-block col-1 page-manager-block">
//               <div class="card-header">
//                 <h2><i class="pi pi-sitemap"></i> Live Pages</h2>
//                 <span class="badge">{{ pages().length }} Nodes</span>
//               </div>
//               <div class="card-body scrollable-body">
//                 @if (pages().length === 0) {
//                   <p class="empty-hint" style="text-align: center; margin: 24px 0;">No pages initialized in CMS.</p>
//                 } @else {
//                   <div class="page-list-compact">
//                     @for (page of pages(); track page._id) {
//                       <div class="compact-page-row">
//                         <div class="page-ident">
//                           <span class="p-name">{{ page.name }}</span>
//                           <span class="p-slug">/{{ page.slug }}</span>
//                         </div>
//                         <button 
//                           class="icon-action-btn" 
//                           [class.active]="page.isPublished"
//                           (click)="togglePagePublishState(page)"
//                           [title]="page.isPublished ? 'Unpublish Node' : 'Publish Node'">
//                           <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
//                         </button>
//                       </div>
//                     }
//                   </div>
//                 }
//               </div>
//             </section>
//           </div>

//           <div class="bento-row">
//             <section class="config-card bento-block" style="width: 100%;">
//               <div class="card-header">
//                 <h2><i class="pi pi-align-bottom"></i> Footer Configuration</h2>
//               </div>
//               <div class="card-body" style="display: flex; gap: 40px; flex-wrap: wrap;">
                
//                 <div class="form-group" style="flex: 1; min-width: 300px;">
//                   <label>Copyright Declaration</label>
//                   <input type="text" [(ngModel)]="footerCopyright" placeholder="© 2026 Your Store Name" class="premium-input" />
//                   <p class="hint" style="margin-top: 8px;">Displayed at the absolute bottom of the storefront.</p>
//                 </div>
                
//                 <div class="form-group" style="flex: 2; min-width: 400px;">
//                   <label>Footer Matrix (Quick Links)</label>
//                   <div class="link-builder">
//                     <div class="link-row" *ngFor="let link of footerLinks; let i = index">
//                       <i class="pi pi-bars drag-handle"></i>
                      
//                       <div class="input-group">
//                         <input type="text" [(ngModel)]="link.label" placeholder="Display Label" class="premium-input" />
//                       </div>

//                       <div class="input-group suggestion-container">
//                         <input 
//                           type="text" 
//                           [(ngModel)]="link.url" 
//                           (focus)="activeSuggestionIndex.set('footer-' + i)"
//                           (input)="filterPages(link.url)"
//                           placeholder="URL Routing" 
//                           class="premium-input mono-input" />
                        
//                         @if (activeSuggestionIndex() === 'footer-' + i && filteredPages().length > 0) {
//                           <div class="suggestions-dropdown">
//                             <div class="suggestion-header">Storefront Pages</div>
//                             @for (p of filteredPages(); track p._id) {
//                               <div class="suggestion-item" (click)="selectSuggestion(p, link)">
//                                 <div class="s-main"><i class="pi pi-file"></i> {{ p.name }}</div>
//                                 <span class="s-slug">/{{ p.slug }}</span>
//                               </div>
//                             }
//                           </div>
//                         }
//                       </div>

//                       <button class="icon-btn danger" (click)="removeFooterLink(i)"><i class="pi pi-trash"></i></button>
//                     </div>
                    
//                     <button class="premium-btn ghost-btn dashed-btn" (click)="addFooterLink()">
//                       <i class="pi pi-plus"></i> Add Footer Link
//                     </button>
//                   </div>
//                 </div>
                
//               </div>
//             </section>
//           </div>

//         </div>
//       }
//     </main>
//   `,
//   styles: [`
//     .layout-settings {
//       padding: 24px; background: var(--bg-secondary); height: 100%; overflow-y: auto; font-family: 'Inter', sans-serif;
//     }
    
//     .page-header {
//       display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
//       h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary); letter-spacing: -0.02em; }
//       .subtitle { color: var(--text-secondary); margin: 0; font-size: 13px; }
//     }

//     .loading-state, .error-state {
//       display: flex; flex-direction: column; align-items: center; justify-content: center;
//       padding: 80px 24px; color: var(--text-secondary); gap: 16px;
//       i { font-size: 28px; }
//       p { margin: 0; font-size: 14px; font-weight: 500; }
//     }
//     .error-state { color: var(--color-error); background: var(--bg-primary); border-radius: 14px; border: 1px solid var(--color-error-bg); }
    
//     .settings-grid {
//       display: flex; flex-direction: column; gap: 24px; max-width: 1200px; padding-bottom: 60px;
//     }

//     /* Bento Box Flex Grid */
//     .bento-row {
//       display: flex; gap: 24px; flex-wrap: wrap;
//       .col-1 { flex: 1; min-width: 320px; }
//       .col-2 { flex: 2; min-width: 500px; }
//       @media (max-width: 1024px) {
//         flex-direction: column;
//         .col-1, .col-2 { min-width: 100%; }
//       }
//     }

//     .bento-block {
//       background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 16px;
//       box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01), 0 8px 16px -10px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column;
//     }

//     .config-card {
//       .card-header {
//         display: flex; justify-content: space-between; align-items: center; padding: 16px 24px;
//         border-bottom: 1px solid var(--bg-secondary);
//         h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; i { color: var(--text-secondary); } }
//         .badge { background: var(--bg-secondary); color: var(--text-secondary); font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
//       }
//       .card-body { padding: 24px; display: flex; flex-direction: column; }
//       .scrollable-body { max-height: 380px; overflow-y: auto; padding-right: 12px; }
//     }

//     /* --- Themes Grid Customization --- */
//     .themes-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
//       gap: 16px;
//     }
    
//     .theme-card {
//       display: flex; flex-direction: column;
//       border-radius: 12px; overflow: hidden; border: 2px solid transparent;
//       background: var(--bg-primary); box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px var(--border-primary);
//       cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      
//       .theme-preview {
//         height: 90px; width: 100%; position: relative;
//         .active-indicator {
//           position: absolute; top: 8px; right: 8px; background: var(--bg-primary); color: var(--color-success);
//           border-radius: 50%; width: 20px; height: 20px; display: grid; place-items: center;
//           font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//         }
//       }
//       .theme-info {
//         padding: 12px; font-size: 13px; font-weight: 600; color: var(--text-primary); text-align: center;
//       }
      
//       &:hover { transform: translateY(-4px); box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.1), 0 0 0 1px var(--text-secondary); }
//       &.active {
//         border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
//         .theme-info { color: var(--accent-primary); background: var(--color-info-bg); }
//       }
//     }
    
//     /* General Form & Inputs */
//     .form-group {
//       display: flex; flex-direction: column; gap: 6px;
//       label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
//       .hint { font-size: 12px; color: var(--text-secondary); margin: 0; }
//     }
    
//     .premium-input {
//       padding: 10px 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-secondary);
//       color: var(--text-primary); outline: none; font-size: 13px; font-family: inherit; transition: all 0.2s; width: 100%; box-sizing: border-box;
//       &::placeholder { color: var(--text-secondary); }
//       &:focus { border-color: var(--accent-primary); background: var(--bg-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
//       &.uppercase-input { text-transform: uppercase; }
//       &.mono-input { font-family: monospace; }
//     }

//     .color-picker-wrapper {
//       display: flex; gap: 12px; align-items: center;
//       .color-wheel { height: 40px; width: 44px; padding: 0; border: 1px solid var(--border-primary); border-radius: 8px; cursor: pointer; background: var(--bg-primary); }
//       .hex-input { flex: 1; font-family: monospace; text-transform: uppercase; }
//     }
    
//     .divider { border: 0; border-top: 1px dashed var(--border-primary); margin: 4px 0; }
    
//     /* Link Builder & Suggestions */
//     .link-builder {
//       display: flex; flex-direction: column; gap: 12px;
//       .link-row {
//         display: flex; gap: 12px; align-items: center; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px;
//         .drag-handle { color: var(--text-secondary); cursor: grab; padding: 0 4px; font-size: 14px; }
//         .input-group { flex: 1; position: relative; }
//       }
//     }

//     .suggestion-container { position: relative; }
//     .suggestions-dropdown {
//       position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 8px;
//       box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1); z-index: 100; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column;
      
//       .suggestion-header { padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); background: var(--bg-secondary); border-bottom: 1px solid var(--bg-secondary); }
//       .suggestion-item {
//         padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--bg-secondary);
//         &:last-child { border-bottom: none; }
//         &:hover { background: var(--bg-secondary); }
//         .s-main { font-size: 12px; font-weight: 500; color: var(--text-primary); display: flex; align-items: center; gap: 8px; i { color: var(--accent-primary); } }
//         .s-slug { font-size: 11px; font-family: monospace; color: var(--text-secondary); }
//       }
//     }
    
//     /* Inline Page Manager */
//     .page-list-compact {
//       display: flex; flex-direction: column; gap: 8px;
//       .compact-page-row {
//         display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--bg-secondary); border-radius: 8px;
//         .page-ident { display: flex; flex-direction: column; gap: 2px; .p-name { font-size: 13px; font-weight: 600; color: var(--text-primary); } .p-slug { font-size: 11px; font-family: monospace; color: var(--text-secondary); } }
//       }
//     }

//     /* Buttons */
//     .premium-btn {
//       display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; font-size: 13px; padding: 10px 16px;
//       border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      
//       &.primary-btn { background: var(--text-primary); color: var(--bg-primary); &:hover:not([disabled]) { background: var(--text-primary); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1); } }
//       &.ghost-btn { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-secondary); &:hover:not([disabled]) { background: var(--bg-secondary); color: var(--text-primary); } }
//       &.dashed-btn { border-style: dashed; border-color: var(--text-secondary); width: 100%; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--color-info-bg); } }
//       &:disabled { opacity: 0.6; cursor: not-allowed; }
//     }

//     .icon-btn {
//       width: 36px; height: 36px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text-secondary);
//       display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; font-size: 14px; flex-shrink: 0;
//       &:hover { background: var(--bg-secondary); color: var(--text-primary); }
//       &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
//     }

//     .icon-action-btn {
//       width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border-primary);
//       background: var(--bg-primary); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;
//       &:hover { background: var(--bg-secondary); color: var(--text-primary); }
//       &.active { background: var(--color-success-bg); color: var(--color-success); border-color: #bbf7d0; }
//     }
//   `]
// })
// export class StorefrontLayoutComponent implements OnInit {
//   private readonly adminService = inject(StorefrontAdminService);
  
//   readonly loading = signal(true);
//   readonly saving = signal(false);
//   readonly error = signal<string | null>(null);

//   // Raw API state
//   private rawLayout: any = null;
//   readonly pages = signal<PageReference[]>([]);
//   readonly themes = signal<StorefrontTheme[]>([]);
  
//   // UI Suggestion State
//   readonly activeSuggestionIndex = signal<string | null>(null);
//   readonly filteredPages = signal<PageReference[]>([]);

//   // Editable Layout State
//   headerLinks: Array<{label: string, url: string}> = [];
//   footerLinks: Array<{label: string, url: string}> = [];
//   footerCopyright = '';
//   colors = { primary: 'var(--accent-primary)', secondary: 'var(--text-secondary)', accent: 'var(--color-warning)' };
//   commerce = { currency: 'INR' };

//   ngOnInit() {
//     this.fetchCoreData();
//   }

//   // Close suggestions when clicking outside
//   @HostListener('document:click', ['$event'])
//   onClickOutside(event: Event) {
//     const target = event.target as HTMLElement;
//     if (!target.closest('.suggestion-container')) {
//       this.activeSuggestionIndex.set(null);
//     }
//   }

//   fetchCoreData() {
//     this.loading.set(true);
//     this.error.set(null);
    
//     // Fetch Layout Config, Pages, and Themes simultaneously
//     forkJoin({
//       layoutRes: this.adminService.getLayout(),
//       pagesRes: this.adminService.getPages(),
//       themesRes: this.adminService.getAvailableThemes().pipe(
//         catchError(() => of({ data: { themes: [] } })) // Soft fail themes if unavailable
//       )
//     }).subscribe({
//       next: ({ layoutRes, pagesRes, themesRes }) => {
        
//         // 1. Map Themes
//         const themeList = (themesRes as any)?.data?.themes || [];
//         this.themes.set(themeList);

//         // 2. Map Pages
//         const pageData = (pagesRes as any)?.data ?? [];
//         this.pages.set(pageData);
//         this.filteredPages.set(pageData);

//         // 3. Map Layout Configuration
//         const layout = (layoutRes as any)?.data ?? layoutRes;
//         this.rawLayout = layout;
        
//         try {
//           const navConfig = layout.header?.[0]?.config;
//           if (navConfig && navConfig.links) {
//             this.headerLinks = JSON.parse(JSON.stringify(navConfig.links));
//           }
//         } catch(e) {}

//         try {
//           const footConfig = layout.footer?.[0]?.config;
//           if (footConfig) {
//             this.footerCopyright = footConfig.copyright || '';
//             if (footConfig.columns && footConfig.columns[0]?.links) {
//               this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
//             }
//           }
//         } catch(e) {}

//         try {
//           if (layout.globalSettings?.colors) {
//             this.colors = { ...this.colors, ...layout.globalSettings.colors };
//           }
//           if (layout.globalSettings?.commerce) {
//             this.commerce = { ...this.commerce, ...layout.globalSettings.commerce };
//           }
//         } catch(e) {}

//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error('Data sync failed:', err);
//         this.error.set('Failed to initialize storefront configuration parameters.');
//         this.loading.set(false);
//       }
//     });
//   }

//   // -------------------------------------------------------------
//   // Theme Marketplace Handlers
//   // -------------------------------------------------------------

//   applyThemeLocally(theme: StorefrontTheme) {
//     this.colors.primary = theme.color;
//     // Map secondary/accent to logical derivatives if needed. 
//     // Kept simple here to match your original theme logic.
//     this.colors.accent = theme.color; 
//   }

//   // -------------------------------------------------------------
//   // Suggestion & Link Handlers
//   // -------------------------------------------------------------

//   filterPages(searchTerm: string) {
//     const term = searchTerm.toLowerCase().replace('/', '');
//     if (!term) {
//       this.filteredPages.set(this.pages());
//       return;
//     }
//     const filtered = this.pages().filter(p => 
//       p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
//     );
//     this.filteredPages.set(filtered);
//   }

//   selectSuggestion(page: PageReference, linkObj: any) {
//     if (!linkObj.label || linkObj.label === 'New Link' || linkObj.label === 'Display Label') {
//       linkObj.label = page.name;
//     }
//     linkObj.url = '/' + page.slug;
//     this.activeSuggestionIndex.set(null);
//   }

//   addHeaderLink() { this.headerLinks.push({ label: '', url: '/' }); }
//   removeHeaderLink(index: number) { this.headerLinks.splice(index, 1); }
  
//   addFooterLink() { this.footerLinks.push({ label: '', url: '/' }); }
//   removeFooterLink(index: number) { this.footerLinks.splice(index, 1); }

//   // -------------------------------------------------------------
//   // Inline Page Manager
//   // -------------------------------------------------------------

//   togglePagePublishState(page: PageReference) {
//     const request$ = page.isPublished
//       ? this.adminService.unpublishPage(page._id)
//       : this.adminService.publishPage(page._id);

//     request$.subscribe({
//       next: () => {
//         this.pages.update(list =>
//           list.map(p => p._id === page._id ? { ...p, isPublished: !page.isPublished } : p)
//         );
//       },
//       error: (err) => {
//         console.error(err);
//         alert('Failed to sync page status block.');
//       }
//     });
//   }

//   // -------------------------------------------------------------
//   // Save Operations
//   // -------------------------------------------------------------

//   saveLayout() {
//     if (!this.rawLayout) return;
//     this.saving.set(true);

//     const payload = JSON.parse(JSON.stringify(this.rawLayout));

//     // Compile Header
//     if (!payload.header) payload.header = [{}];
//     if (!payload.header[0].config) payload.header[0].config = {};
//     payload.header[0].config.links = this.headerLinks;

//     // Compile Footer
//     if (!payload.footer) payload.footer = [{}];
//     if (!payload.footer[0].config) payload.footer[0].config = {};
//     payload.footer[0].config.copyright = this.footerCopyright;
//     if (!payload.footer[0].config.columns) payload.footer[0].config.columns = [{ title: 'Quick Links', links: [] }];
//     payload.footer[0].config.columns[0].links = this.footerLinks;

//     // Compile Globals (Themes & Commerce)
//     if (!payload.globalSettings) payload.globalSettings = {};
//     payload.globalSettings.colors = { ...(payload.globalSettings.colors || {}), ...this.colors };
//     payload.globalSettings.commerce = { ...(payload.globalSettings.commerce || {}), ...this.commerce };

//     this.adminService.updateLayout(payload).subscribe({
//       next: () => {
//         this.saving.set(false);
//       },
//       error: (err) => {
//         console.error(err);
//         this.saving.set(false);
//         alert('Error saving layout configuration to matrix.');
//       }
//     });
//   }
// }// import { CommonModule } from '@angular/common';
// // import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
// // import { FormsModule } from '@angular/forms';
// // import { StorefrontAdminService } from '@core/services/storefront-admin.service';
// // import { forkJoin } from 'rxjs';

// // interface PageReference {
// //   _id: string;
// //   name: string;
// //   slug: string;
// //   isPublished: boolean;
// //   pageType: string;
// // }

// // @Component({
// //   selector: 'app-storefront-layout',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule],
// //   template: `
// //     <main class="layout-settings">
// //       <header class="page-header">
// //         <div class="header-content">
// //           <h1>Master Layout Settings</h1>
// //           <p class="subtitle">Configure your global header, footer, brand settings, and manage routing links.</p>
// //         </div>
// //         <div class="actions">
// //           <button class="premium-btn primary-btn" (click)="saveLayout()" [disabled]="saving() || loading()">
// //             <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
// //             <i class="pi pi-check" *ngIf="!saving()"></i>
// //             {{ saving() ? 'Syncing...' : 'Save Configuration' }}
// //           </button>
// //         </div>
// //       </header>

// //       @if (loading()) {
// //         <div class="loading-state">
// //           <i class="pi pi-spin pi-spinner"></i>
// //           <p>Assembling core layout schema...</p>
// //         </div>
// //       } @else if (error()) {
// //         <div class="error-state">
// //           <i class="pi pi-exclamation-triangle"></i>
// //           <p>{{ error() }}</p>
// //           <button class="premium-btn ghost-btn" (click)="fetchCoreData()">Retry</button>
// //         </div>
// //       } @else {
// //         <div class="settings-grid">
          
// //           <div class="bento-row two-col">
            
// //             <section class="config-card bento-block">
// //               <div class="card-header">
// //                 <h2><i class="pi pi-palette"></i> Brand Settings</h2>
// //               </div>
// //               <div class="card-body">
// //                 <div class="form-row">
// //                   <div class="form-group">
// //                     <label>Primary Theme Color</label>
// //                     <div class="color-picker-wrapper">
// //                       <input type="color" [(ngModel)]="colors.primary" class="color-wheel" />
// //                       <input type="text" [(ngModel)]="colors.primary" class="premium-input hex-input" />
// //                     </div>
// //                   </div>
// //                   <div class="form-group">
// //                     <label>Storefront Currency</label>
// //                     <input type="text" [(ngModel)]="commerce.currency" class="premium-input uppercase-input" placeholder="e.g. INR" />
// //                   </div>
// //                 </div>
// //               </div>
// //             </section>

// //             <section class="config-card bento-block page-manager-block">
// //               <div class="card-header">
// //                 <h2><i class="pi pi-file"></i> Page Routing Status</h2>
// //                 <span class="badge">{{ pages().length }} Pages Found</span>
// //               </div>
// //               <div class="card-body scrollable-body">
// //                 @if (pages().length === 0) {
// //                   <p class="empty-hint">No pages found. Create pages in the Page Builder first.</p>
// //                 } @else {
// //                   <div class="page-list-compact">
// //                     @for (page of pages(); track page._id) {
// //                       <div class="compact-page-row">
// //                         <div class="page-ident">
// //                           <span class="p-name">{{ page.name }}</span>
// //                           <span class="p-slug">/{{ page.slug }}</span>
// //                         </div>
// //                         <button 
// //                           class="icon-action-btn" 
// //                           [class.active]="page.isPublished"
// //                           (click)="togglePagePublishState(page)"
// //                           [title]="page.isPublished ? 'Unpublish' : 'Publish'">
// //                           <i class="pi" [class]="page.isPublished ? 'pi-eye' : 'pi-eye-slash'"></i>
// //                         </button>
// //                       </div>
// //                     }
// //                   </div>
// //                 }
// //               </div>
// //             </section>
// //           </div>

// //           <section class="config-card bento-block">
// //             <div class="card-header">
// //               <h2><i class="pi pi-compass"></i> Header Navigation Bar</h2>
// //             </div>
// //             <div class="card-body">
// //               <p class="hint">Map external URLs or select existing storefront pages.</p>
              
// //               <div class="link-builder">
// //                 <div class="link-row" *ngFor="let link of headerLinks; let i = index">
// //                   <i class="pi pi-bars drag-handle"></i>
                  
// //                   <div class="input-group">
// //                     <input type="text" [(ngModel)]="link.label" placeholder="Display Label (e.g. Shop All)" class="premium-input" />
// //                   </div>
                  
// //                   <div class="input-group suggestion-container">
// //                     <input 
// //                       type="text" 
// //                       [(ngModel)]="link.url" 
// //                       (focus)="activeSuggestionIndex.set('header-' + i)"
// //                       (input)="filterPages(link.url)"
// //                       placeholder="URL Routing (e.g. /products)" 
// //                       class="premium-input mono-input" />
                    
// //                     @if (activeSuggestionIndex() === 'header-' + i && filteredPages().length > 0) {
// //                       <div class="suggestions-dropdown">
// //                         <div class="suggestion-header">Storefront Pages</div>
// //                         @for (p of filteredPages(); track p._id) {
// //                           <div class="suggestion-item" (click)="selectSuggestion(p, link, 'header-' + i)">
// //                             <div class="s-main">
// //                               <i class="pi pi-file"></i> {{ p.name }}
// //                             </div>
// //                             <span class="s-slug">/{{ p.slug }}</span>
// //                           </div>
// //                         }
// //                       </div>
// //                     }
// //                   </div>
                  
// //                   <button class="icon-btn danger" (click)="removeHeaderLink(i)"><i class="pi pi-trash"></i></button>
// //                 </div>
                
// //                 <button class="premium-btn ghost-btn dashed-btn" (click)="addHeaderLink()">
// //                   <i class="pi pi-plus"></i> Add Nav Link
// //                 </button>
// //               </div>
// //             </div>
// //           </section>

// //           <section class="config-card bento-block">
// //             <div class="card-header">
// //               <h2><i class="pi pi-align-bottom"></i> Footer Configuration</h2>
// //             </div>
// //             <div class="card-body">
// //               <div class="form-group">
// //                 <label>Copyright Declaration</label>
// //                 <input type="text" [(ngModel)]="footerCopyright" placeholder="© 2026 Your Store Name" class="premium-input" />
// //               </div>
              
// //               <hr class="divider" />
              
// //               <div class="form-group">
// //                 <label>Footer Matrix (Quick Links)</label>
// //                 <div class="link-builder">
// //                   <div class="link-row" *ngFor="let link of footerLinks; let i = index">
// //                     <i class="pi pi-bars drag-handle"></i>
                    
// //                     <div class="input-group">
// //                       <input type="text" [(ngModel)]="link.label" placeholder="Display Label" class="premium-input" />
// //                     </div>

// //                     <div class="input-group suggestion-container">
// //                       <input 
// //                         type="text" 
// //                         [(ngModel)]="link.url" 
// //                         (focus)="activeSuggestionIndex.set('footer-' + i)"
// //                         (input)="filterPages(link.url)"
// //                         placeholder="URL Routing" 
// //                         class="premium-input mono-input" />
                      
// //                       @if (activeSuggestionIndex() === 'footer-' + i && filteredPages().length > 0) {
// //                         <div class="suggestions-dropdown">
// //                           <div class="suggestion-header">Storefront Pages</div>
// //                           @for (p of filteredPages(); track p._id) {
// //                             <div class="suggestion-item" (click)="selectSuggestion(p, link, 'footer-' + i)">
// //                               <div class="s-main">
// //                                 <i class="pi pi-file"></i> {{ p.name }}
// //                               </div>
// //                               <span class="s-slug">/{{ p.slug }}</span>
// //                             </div>
// //                           }
// //                         </div>
// //                       }
// //                     </div>

// //                     <button class="icon-btn danger" (click)="removeFooterLink(i)"><i class="pi pi-trash"></i></button>
// //                   </div>
                  
// //                   <button class="premium-btn ghost-btn dashed-btn" (click)="addFooterLink()">
// //                     <i class="pi pi-plus"></i> Add Footer Link
// //                   </button>
// //                 </div>
// //               </div>
// //             </div>
// //           </section>

// //         </div>
// //       }
// //     </main>
// //   `,
// //   styles: [`
// //     .layout-settings {
// //       padding: 24px; background: var(--bg-secondary); height: 100%; overflow-y: auto; font-family: 'Inter', sans-serif;
// //     }
    
// //     .page-header {
// //       display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; gap: 16px; flex-wrap: wrap;
// //       h1 { font-size: 24px; font-weight: 600; margin: 0 0 4px 0; color: var(--text-primary); letter-spacing: -0.02em; }
// //       .subtitle { color: var(--text-secondary); margin: 0; font-size: 13px; }
// //     }

// //     .loading-state, .error-state {
// //       display: flex; flex-direction: column; align-items: center; justify-content: center;
// //       padding: 80px 24px; color: var(--text-secondary); gap: 16px;
// //       i { font-size: 28px; }
// //       p { margin: 0; font-size: 14px; font-weight: 500; }
// //     }
// //     .error-state { color: var(--color-error); background: var(--bg-primary); border-radius: 14px; border: 1px solid var(--color-error-bg); }
    
// //     .settings-grid {
// //       display: flex; flex-direction: column; gap: 24px; max-width: 900px; padding-bottom: 60px;
// //     }

// //     .bento-row {
// //       display: grid; gap: 24px;
// //       &.two-col { grid-template-columns: 1fr 1fr; @media (max-width: 800px) { grid-template-columns: 1fr; } }
// //     }

// //     .bento-block {
// //       background: var(--bg-primary); border: 1px solid rgba(226, 232, 240, 0.9); border-radius: 16px;
// //       box-shadow: 0 1px 2px rgba(0, 0, 0, 0.01), 0 8px 16px -10px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column;
// //     }

// //     .config-card {
// //       .card-header {
// //         display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
// //         border-bottom: 1px solid var(--bg-secondary);
// //         h2 { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; i { color: var(--text-secondary); } }
// //         .badge { background: var(--bg-secondary); color: var(--text-secondary); font-size: 11px; padding: 2px 8px; border-radius: 6px; font-weight: 600; }
// //       }
// //       .card-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
      
// //       .scrollable-body { max-height: 240px; overflow-y: auto; }
// //     }
    
// //     .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; @media (max-width: 500px) { grid-template-columns: 1fr; } }
// //     .form-group {
// //       display: flex; flex-direction: column; gap: 6px;
// //       label { font-size: 12px; font-weight: 600; color: var(--text-primary); }
// //       .hint { font-size: 12px; color: var(--text-secondary); margin: 0 0 4px 0; }
// //     }
    
// //     /* Inputs */
// //     .premium-input {
// //       padding: 10px 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-secondary);
// //       color: var(--text-primary); outline: none; font-size: 13px; font-family: inherit; transition: all 0.2s; width: 100%; box-sizing: border-box;
// //       &::placeholder { color: var(--text-secondary); }
// //       &:focus { border-color: var(--accent-primary); background: var(--bg-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
// //       &.uppercase-input { text-transform: uppercase; }
// //       &.mono-input { font-family: monospace; }
// //     }

// //     .color-picker-wrapper {
// //       display: flex; gap: 8px; align-items: center;
// //       .color-wheel { height: 40px; width: 44px; padding: 0; border: 1px solid var(--border-primary); border-radius: 8px; cursor: pointer; background: var(--bg-primary); }
// //       .hex-input { flex: 1; font-family: monospace; text-transform: uppercase; }
// //     }
    
// //     .divider { border: 0; border-top: 1px dashed var(--border-primary); margin: 4px 0; }
    
// //     /* Link Builder & Suggestions */
// //     .link-builder {
// //       display: flex; flex-direction: column; gap: 12px;
// //       .link-row {
// //         display: flex; gap: 12px; align-items: center; padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 12px;
// //         .drag-handle { color: var(--text-secondary); cursor: grab; padding: 0 4px; font-size: 14px; }
// //         .input-group { flex: 1; position: relative; }
// //       }
// //     }

// //     .suggestion-container { position: relative; }
// //     .suggestions-dropdown {
// //       position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 8px;
// //       box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1); z-index: 100; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column;
      
// //       .suggestion-header { padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); background: var(--bg-secondary); border-bottom: 1px solid var(--bg-secondary); }
// //       .suggestion-item {
// //         padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid var(--bg-secondary);
// //         &:last-child { border-bottom: none; }
// //         &:hover { background: var(--bg-secondary); }
// //         .s-main { font-size: 12px; font-weight: 500; color: var(--text-primary); display: flex; align-items: center; gap: 8px; i { color: var(--accent-primary); } }
// //         .s-slug { font-size: 11px; font-family: monospace; color: var(--text-secondary); }
// //       }
// //     }
    
// //     /* Inline Page Manager */
// //     .page-list-compact {
// //       display: flex; flex-direction: column; gap: 8px;
// //       .compact-page-row {
// //         display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-secondary); border: 1px solid var(--bg-secondary); border-radius: 8px;
// //         .page-ident { display: flex; flex-direction: column; gap: 2px; .p-name { font-size: 13px; font-weight: 600; color: var(--text-primary); } .p-slug { font-size: 11px; font-family: monospace; color: var(--text-secondary); } }
// //       }
// //     }

// //     /* Buttons */
// //     .premium-btn {
// //       display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; font-size: 13px; padding: 10px 16px;
// //       border-radius: 8px; border: 1px solid transparent; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      
// //       &.primary-btn { background: var(--text-primary); color: var(--bg-primary); &:hover:not([disabled]) { background: var(--text-primary); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1); } }
// //       &.ghost-btn { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-secondary); &:hover:not([disabled]) { background: var(--bg-secondary); color: var(--text-primary); } }
// //       &.dashed-btn { border-style: dashed; border-color: var(--text-secondary); width: 100%; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--color-info-bg); } }
// //       &:disabled { opacity: 0.6; cursor: not-allowed; }
// //     }

// //     .icon-btn {
// //       width: 36px; height: 36px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text-secondary);
// //       display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; font-size: 14px; flex-shrink: 0;
// //       &:hover { background: var(--bg-secondary); color: var(--text-primary); }
// //       &.danger:hover { background: var(--color-error-bg); color: var(--color-error); }
// //     }

// //     .icon-action-btn {
// //       width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid var(--border-primary);
// //       background: var(--bg-primary); color: var(--text-secondary); cursor: pointer; transition: all 0.15s ease;
// //       &:hover { background: var(--bg-secondary); color: var(--text-primary); }
// //       &.active { background: var(--color-success-bg); color: var(--color-success); border-color: #bbf7d0; }
// //     }
// //   `]
// // })
// // export class StorefrontLayoutComponent implements OnInit {
// //   private readonly adminService = inject(StorefrontAdminService);
  
// //   readonly loading = signal(true);
// //   readonly saving = signal(false);
// //   readonly error = signal<string | null>(null);

// //   // Raw API state
// //   private rawLayout: any = null;
// //   readonly pages = signal<PageReference[]>([]);
  
// //   // UI Suggestion State
// //   readonly activeSuggestionIndex = signal<string | null>(null);
// //   readonly filteredPages = signal<PageReference[]>([]);

// //   // Editable Layout State
// //   headerLinks: Array<{label: string, url: string}> = [];
// //   footerLinks: Array<{label: string, url: string}> = [];
// //   footerCopyright = '';
// //   colors = { primary: 'var(--accent-primary)', secondary: 'var(--text-secondary)', accent: 'var(--color-warning)' };
// //   commerce = { currency: 'INR' };

// //   ngOnInit() {
// //     this.fetchCoreData();
// //   }

// //   // Close suggestions when clicking outside
// //   @HostListener('document:click', ['$event'])
// //   onClickOutside(event: Event) {
// //     const target = event.target as HTMLElement;
// //     if (!target.closest('.suggestion-container')) {
// //       this.activeSuggestionIndex.set(null);
// //     }
// //   }

// //   fetchCoreData() {
// //     this.loading.set(true);
// //     this.error.set(null);
    
// //     // Fetch both Layout Config and Pages list simultaneously
// //     forkJoin({
// //       layoutRes: this.adminService.getLayout(),
// //       pagesRes: this.adminService.getPages()
// //     }).subscribe({
// //       next: ({ layoutRes, pagesRes }) => {
// //         // Handle Pages mapping
// //         const pageData = (pagesRes as any)?.data ?? [];
// //         this.pages.set(pageData);
// //         this.filteredPages.set(pageData); // initialize filter

// //         // Handle Layout mapping
// //         const layout = (layoutRes as any)?.data ?? layoutRes;
// //         this.rawLayout = layout;
        
// //         try {
// //           const navConfig = layout.header?.[0]?.config;
// //           if (navConfig && navConfig.links) {
// //             this.headerLinks = JSON.parse(JSON.stringify(navConfig.links));
// //           }
// //         } catch(e) {}

// //         try {
// //           const footConfig = layout.footer?.[0]?.config;
// //           if (footConfig) {
// //             this.footerCopyright = footConfig.copyright || '';
// //             if (footConfig.columns && footConfig.columns[0]?.links) {
// //               this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
// //             }
// //           }
// //         } catch(e) {}

// //         try {
// //           if (layout.globalSettings?.colors) {
// //             this.colors = { ...this.colors, ...layout.globalSettings.colors };
// //           }
// //           if (layout.globalSettings?.commerce) {
// //             this.commerce = { ...this.commerce, ...layout.globalSettings.commerce };
// //           }
// //         } catch(e) {}

// //         this.loading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Data sync failed:', err);
// //         this.error.set('Failed to initialize storefront configuration parameters.');
// //         this.loading.set(false);
// //       }
// //     });
// //   }

// //   // -------------------------------------------------------------
// //   // Suggestion & Link Handlers
// //   // -------------------------------------------------------------

// //   filterPages(searchTerm: string) {
// //     const term = searchTerm.toLowerCase().replace('/', '');
// //     if (!term) {
// //       this.filteredPages.set(this.pages());
// //       return;
// //     }
// //     const filtered = this.pages().filter(p => 
// //       p.name.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
// //     );
// //     this.filteredPages.set(filtered);
// //   }

// //   selectSuggestion(page: PageReference, linkObj: any, indexId: string) {
// //     // If user hasn't typed a custom label yet, auto-fill it with the page name
// //     if (!linkObj.label || linkObj.label === 'New Link' || linkObj.label === 'Display Label') {
// //       linkObj.label = page.name;
// //     }
// //     linkObj.url = '/' + page.slug;
// //     this.activeSuggestionIndex.set(null); // Close dropdown
// //   }

// //   addHeaderLink() { this.headerLinks.push({ label: 'New Link', url: '/' }); }
// //   removeHeaderLink(index: number) { this.headerLinks.splice(index, 1); }
  
// //   addFooterLink() { this.footerLinks.push({ label: 'New Link', url: '/' }); }
// //   removeFooterLink(index: number) { this.footerLinks.splice(index, 1); }

// //   // -------------------------------------------------------------
// //   // Inline Page Manager
// //   // -------------------------------------------------------------

// //   togglePagePublishState(page: PageReference) {
// //     const request$ = page.isPublished
// //       ? this.adminService.unpublishPage(page._id)
// //       : this.adminService.publishPage(page._id);

// //     request$.subscribe({
// //       next: () => {
// //         this.pages.update(list =>
// //           list.map(p => p._id === page._id ? { ...p, isPublished: !page.isPublished } : p)
// //         );
// //       },
// //       error: (err) => {
// //         console.error(err);
// //         alert('Failed to sync page status block.');
// //       }
// //     });
// //   }

// //   // -------------------------------------------------------------
// //   // Save Operations
// //   // -------------------------------------------------------------

// //   saveLayout() {
// //     if (!this.rawLayout) return;
// //     this.saving.set(true);

// //     const payload = JSON.parse(JSON.stringify(this.rawLayout));

// //     if (!payload.header) payload.header = [{}];
// //     if (!payload.header[0].config) payload.header[0].config = {};
// //     payload.header[0].config.links = this.headerLinks;

// //     if (!payload.footer) payload.footer = [{}];
// //     if (!payload.footer[0].config) payload.footer[0].config = {};
// //     payload.footer[0].config.copyright = this.footerCopyright;
// //     if (!payload.footer[0].config.columns) payload.footer[0].config.columns = [{ title: 'Quick Links', links: [] }];
// //     payload.footer[0].config.columns[0].links = this.footerLinks;

// //     if (!payload.globalSettings) payload.globalSettings = {};
// //     payload.globalSettings.colors = { ...(payload.globalSettings.colors || {}), ...this.colors };
// //     payload.globalSettings.commerce = { ...(payload.globalSettings.commerce || {}), ...this.commerce };

// //     this.adminService.updateLayout(payload).subscribe({
// //       next: () => {
// //         this.saving.set(false);
// //       },
// //       error: (err) => {
// //         console.error(err);
// //         this.saving.set(false);
// //         alert('Error saving layout configuration to matrix.');
// //       }
// //     });
// //   }
// // }// import { CommonModule } from '@angular/common';
// // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // import { FormsModule } from '@angular/forms';
// // // import { StorefrontAdminService } from '@core/services/storefront-admin.service';

// // // @Component({
// // //   selector: 'app-storefront-layout',
// // //   standalone: true,
// // //   imports: [CommonModule, FormsModule],
// // //   template: `
// // //     <main class="layout-settings">
// // //       <header class="page-header">
// // //         <div class="header-content">
// // //           <h1>Master Layout Settings</h1>
// // //           <p class="subtitle">Configure your global header, footer, and brand settings.</p>
// // //         </div>
// // //         <div class="actions">
// // //           <button class="premium-btn" (click)="saveLayout()" [disabled]="saving()">
// // //             <i class="pi pi-spin pi-spinner" *ngIf="saving()"></i>
// // //             {{ saving() ? 'Saving...' : 'Save Changes' }}
// // //           </button>
// // //         </div>
// // //       </header>

// // //       @if (loading()) {
// // //         <div class="loading-state">
// // //           <i class="pi pi-spin pi-spinner"></i>
// // //           <p>Loading layout...</p>
// // //         </div>
// // //       } @else if (error()) {
// // //         <div class="error-state">
// // //           <p>{{ error() }}</p>
// // //         </div>
// // //       } @else {
// // //         <div class="settings-grid">
          
// // //           <!-- Global Settings -->
// // //           <section class="config-card">
// // //             <div class="card-header">
// // //               <h2>Brand Settings</h2>
// // //               <i class="pi pi-palette"></i>
// // //             </div>
// // //             <div class="card-body row-layout">
// // //               <div class="form-group">
// // //                 <label>Primary Color</label>
// // //                 <div style="display: flex; gap: 8px;">
// // //                   <input type="color" [(ngModel)]="colors.primary" style="height: 42px; width: 42px; padding: 0; border: none; cursor: pointer;" />
// // //                   <input type="text" [(ngModel)]="colors.primary" class="premium-input" style="flex: 1" />
// // //                 </div>
// // //               </div>
// // //               <div class="form-group">
// // //                 <label>Currency</label>
// // //                 <input type="text" [(ngModel)]="commerce.currency" class="premium-input" placeholder="e.g. INR, USD" />
// // //               </div>
// // //             </div>
// // //           </section>

// // //           <!-- Header Config -->
// // //           <section class="config-card">
// // //             <div class="card-header">
// // //               <h2>Header Navigation (Menu)</h2>
// // //               <i class="pi pi-compass"></i>
// // //             </div>
// // //             <div class="card-body">
// // //               <div class="form-group">
// // //                 <label>Navigation Links</label>
// // //                 <p class="hint">These links appear at the top of your store. Use URLs like <code>/products</code> or <code>/about</code></p>
// // //                 <div class="link-builder">
// // //                   <div class="link-row" *ngFor="let link of headerLinks; let i = index">
// // //                     <i class="pi pi-bars drag-handle"></i>
// // //                     <input type="text" [(ngModel)]="link.label" placeholder="Link Label (e.g. Home)" class="premium-input" />
// // //                     <input type="text" [(ngModel)]="link.url" placeholder="URL (e.g. /)" class="premium-input" />
// // //                     <button class="icon-btn" (click)="removeHeaderLink(i)"><i class="pi pi-trash"></i></button>
// // //                   </div>
// // //                   <button class="premium-btn ghost-btn" (click)="addHeaderLink()"><i class="pi pi-plus"></i> Add Header Link</button>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </section>

// // //           <!-- Footer Config -->
// // //           <section class="config-card">
// // //             <div class="card-header">
// // //               <h2>Footer Settings</h2>
// // //               <i class="pi pi-align-bottom"></i>
// // //             </div>
// // //             <div class="card-body">
// // //               <div class="form-group">
// // //                 <label>Copyright Text</label>
// // //                 <input type="text" [(ngModel)]="footerCopyright" placeholder="© 2026 Your Company" class="premium-input" />
// // //               </div>
              
// // //               <hr class="divider" />
              
// // //               <div class="form-group">
// // //                 <label>Footer Links (Quick Links)</label>
// // //                 <div class="link-builder">
// // //                   <div class="link-row" *ngFor="let link of footerLinks; let i = index">
// // //                     <i class="pi pi-bars drag-handle"></i>
// // //                     <input type="text" [(ngModel)]="link.label" placeholder="Link Label" class="premium-input" />
// // //                     <input type="text" [(ngModel)]="link.url" placeholder="URL" class="premium-input" />
// // //                     <button class="icon-btn" (click)="removeFooterLink(i)"><i class="pi pi-trash"></i></button>
// // //                   </div>
// // //                   <button class="premium-btn ghost-btn" (click)="addFooterLink()"><i class="pi pi-plus"></i> Add Footer Link</button>
// // //                 </div>
// // //               </div>
// // //             </div>
// // //           </section>
// // //         </div>
// // //       }
// // //     </main>
// // //   `,
// // //   styles: [`
// // //     .layout-settings {
// // //       padding: 24px; background: var(--bg-primary); height: 100%; overflow-y: auto;
// // //     }
// // //     .page-header {
// // //       display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;
// // //       h1 { font-size: 28px; margin: 0 0 8px 0; color: var(--text-primary); font-family: var(--font-heading); }
// // //       .subtitle { color: var(--text-secondary); margin: 0; }
// // //     }
// // //     .loading-state, .error-state {
// // //       display: flex; flex-direction: column; align-items: center; justify-content: center;
// // //       padding: 64px; color: var(--text-secondary);
// // //       i { font-size: 32px; margin-bottom: 16px; }
// // //     }
// // //     .error-state { color: var(--theme-danger, var(--color-error)); }
    
// // //     .settings-grid {
// // //       display: flex; flex-direction: column; gap: 24px; max-width: 800px; padding-bottom: 60px;
// // //     }
// // //     .config-card {
// // //       border: 1px solid var(--border-primary); border-radius: 12px; background: var(--bg-secondary);
// // //       box-shadow: 0 2px 8px rgba(0,0,0,0.02);
// // //       .card-header {
// // //         display: flex; justify-content: space-between; align-items: center;
// // //         padding: 16px 20px; border-bottom: 1px solid var(--border-primary);
// // //         background: var(--bg-tertiary); border-radius: 12px 12px 0 0;
// // //         h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary); }
// // //         i { color: var(--text-tertiary); }
// // //       }
// // //       .card-body {
// // //         padding: 24px 20px; display: flex; flex-direction: column; gap: 24px;
// // //         &.row-layout { flex-direction: row; gap: 32px; }
// // //       }
// // //     }
    
// // //     .form-group {
// // //       display: flex; flex-direction: column; gap: 8px; flex: 1;
// // //       label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
// // //       .hint { font-size: 13px; color: var(--text-secondary); margin: 0 0 8px 0; }
// // //       .premium-input {
// // //         padding: 10px 14px; border: 1px solid var(--border-primary); border-radius: 8px;
// // //         background: var(--bg-primary); color: var(--text-primary); outline: none;
// // //         transition: border-color 0.2s;
// // //         &:focus { border-color: var(--theme-primary, var(--accent-primary)); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
// // //       }
// // //     }
    
// // //     .divider { border: 0; border-top: 1px dashed var(--border-primary); margin: 8px 0; }
    
// // //     .link-builder {
// // //       display: flex; flex-direction: column; gap: 12px;
// // //       .link-row {
// // //         display: flex; gap: 12px; align-items: center;
// // //         padding: 12px; background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 8px;
// // //         .drag-handle { color: var(--text-tertiary); cursor: grab; padding: 0 4px; }
// // //         input { flex: 1; }
// // //         .icon-btn {
// // //           background: transparent; border: none; border-radius: 8px;
// // //           width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
// // //           color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
// // //           &:hover { color: var(--theme-danger, var(--color-error)); background: rgba(239, 68, 68, 0.1); }
// // //         }
// // //       }
// // //     }
    
// // //     .premium-btn {
// // //       padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;
// // //       background: var(--theme-primary, var(--accent-primary)); color: white; display: inline-flex; align-items: center; gap: 8px;
// // //       transition: opacity 0.2s, transform 0.1s;
// // //       &:hover { opacity: 0.9; }
// // //       &:active { transform: scale(0.98); }
// // //       &:disabled { opacity: 0.7; cursor: not-allowed; }
// // //       &.ghost-btn {
// // //         background: transparent; border: 1px dashed var(--border-primary); color: var(--text-primary);
// // //         justify-content: center; padding: 12px;
// // //         &:hover { border-color: var(--theme-primary, var(--accent-primary)); color: var(--theme-primary, var(--accent-primary)); background: rgba(59, 130, 246, 0.05); }
// // //       }
// // //     }
// // //   `]
// // // })
// // // export class StorefrontLayoutComponent implements OnInit {
// // //   private readonly adminService = inject(StorefrontAdminService);
  
// // //   readonly loading = signal(true);
// // //   readonly saving = signal(false);
// // //   readonly error = signal<string | null>(null);

// // //   // Raw layout reference
// // //   private rawLayout: any = null;

// // //   // Editable State
// // //   headerLinks: Array<{label: string, url: string}> = [];
// // //   footerLinks: Array<{label: string, url: string}> = [];
// // //   footerCopyright = '';
// // //   colors = { primary: 'var(--accent-primary)', secondary: 'var(--text-secondary)', accent: 'var(--color-warning)' };
// // //   commerce = { currency: 'INR' };

// // //   ngOnInit() {
// // //     this.fetchLayout();
// // //   }

// // //   fetchLayout() {
// // //     this.loading.set(true);
// // //     this.error.set(null);
// // //     this.adminService.getLayout().subscribe({
// // //       next: (res) => {
// // //         // Backend returns layout in res.data or direct res
// // //         const layout = res?.data ?? res;
// // //         this.rawLayout = layout;
        
// // //         // Parse Header Links safely
// // //         try {
// // //           const navConfig = layout.header?.[0]?.config;
// // //           if (navConfig && navConfig.links) {
// // //             this.headerLinks = JSON.parse(JSON.stringify(navConfig.links));
// // //           }
// // //         } catch(e) {}

// // //         // Parse Footer safely
// // //         try {
// // //           const footConfig = layout.footer?.[0]?.config;
// // //           if (footConfig) {
// // //             this.footerCopyright = footConfig.copyright || '';
// // //             if (footConfig.columns && footConfig.columns[0]?.links) {
// // //               this.footerLinks = JSON.parse(JSON.stringify(footConfig.columns[0].links));
// // //             }
// // //           }
// // //         } catch(e) {}

// // //         // Parse Globals safely
// // //         try {
// // //           if (layout.globalSettings?.colors) {
// // //             this.colors = { ...this.colors, ...layout.globalSettings.colors };
// // //           }
// // //           if (layout.globalSettings?.commerce) {
// // //             this.commerce = { ...this.commerce, ...layout.globalSettings.commerce };
// // //           }
// // //         } catch(e) {}

// // //         this.loading.set(false);
// // //       },
// // //       error: (err) => {
// // //         console.error(err);
// // //         this.error.set('Failed to load layout configuration.');
// // //         this.loading.set(false);
// // //       }
// // //     });
// // //   }

// // //   addHeaderLink() {
// // //     this.headerLinks.push({ label: 'New Link', url: '/' });
// // //   }

// // //   removeHeaderLink(index: number) {
// // //     this.headerLinks.splice(index, 1);
// // //   }

// // //   addFooterLink() {
// // //     this.footerLinks.push({ label: 'New Link', url: '/' });
// // //   }

// // //   removeFooterLink(index: number) {
// // //     this.footerLinks.splice(index, 1);
// // //   }

// // //   saveLayout() {
// // //     if (!this.rawLayout) return;

// // //     this.saving.set(true);

// // //     // Deep clone to avoid mutating raw before success
// // //     const payload = JSON.parse(JSON.stringify(this.rawLayout));

// // //     // Inject updated header
// // //     if (!payload.header) payload.header = [{}];
// // //     if (!payload.header[0].config) payload.header[0].config = {};
// // //     payload.header[0].config.links = this.headerLinks;

// // //     // Inject updated footer
// // //     if (!payload.footer) payload.footer = [{}];
// // //     if (!payload.footer[0].config) payload.footer[0].config = {};
// // //     payload.footer[0].config.copyright = this.footerCopyright;
// // //     if (!payload.footer[0].config.columns) payload.footer[0].config.columns = [{ title: 'Quick Links', links: [] }];
// // //     payload.footer[0].config.columns[0].links = this.footerLinks;

// // //     // Inject global settings
// // //     if (!payload.globalSettings) payload.globalSettings = {};
// // //     payload.globalSettings.colors = { ...(payload.globalSettings.colors || {}), ...this.colors };
// // //     payload.globalSettings.commerce = { ...(payload.globalSettings.commerce || {}), ...this.commerce };

// // //     this.adminService.updateLayout(payload).subscribe({
// // //       next: () => {
// // //         this.saving.set(false);
// // //         // Optionally show a toast here
// // //         alert('Layout updated successfully! The storefront will now reflect these changes.');
// // //       },
// // //       error: (err) => {
// // //         console.error(err);
// // //         this.saving.set(false);
// // //         alert('Error saving layout.');
// // //       }
// // //     });
// // //   }
// // // }
