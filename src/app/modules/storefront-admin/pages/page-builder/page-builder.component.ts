import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';

// --- UI Modules ---
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SplitterModule } from 'primeng/splitter';
import { ConfigFormComponent } from '../config-form/config-form.component';

// --- ALL Section Components ---
import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
import { BlogFeedComponent } from '../../../storefront-public/pages/blog-feed/blog-feed.component';
import { CategoryGridComponent } from '../../../storefront-public/pages/category-grid/category-grid.component';
import { ContactFormComponent } from '../../../storefront-public/pages/contact-form/contact-form.component';
import { CountdownTimerComponent } from '../../../storefront-public/pages/countdown-timer/countdown-timer.component';
import { FaqAccordionComponent } from '../../../storefront-public/pages/faq-accordion/faq-accordion.component';
import { FeatureGridComponent } from '../../../storefront-public/pages/feature-grid/feature-grid.component';
import { LogoCloudComponent } from '../../../storefront-public/pages/logo-cloud/logo-cloud.component';
import { NewsletterSignupComponent } from '../../../storefront-public/pages/newsletter-signup/newsletter-signup.component';
import { PricingTableComponent } from '../../../storefront-public/pages/pricing-table/pricing-table.component';
import { ProductGridComponent } from '../../../storefront-public/pages/product-grid/product-grid.component';
import { SplitContentComponent } from '../../../storefront-public/pages/split-content/split-content.component';
import { StatsCounterComponent } from '../../../storefront-public/pages/stats-counter/stats-counter.component';
import { TestimonialSliderComponent } from '../../../storefront-public/pages/testimonial-slider/testimonial-slider.component';
import { TextContentComponent } from '../../../storefront-public/pages/text-content/text-content.component';
import { VideoHeroComponent } from '../../../storefront-public/pages/video-hero/video-hero.component';
import { ProductListingComponent } from "../../../storefront-public/pages/product-listing/product-listing.component";

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DragDropModule,
    DialogModule,
    TooltipModule,
    SplitterModule,
    ConfigFormComponent,
    // Components
    HeroBannerComponent,
    ProductSliderComponent,
    ProductGridComponent,
    CategoryGridComponent,
    FeatureGridComponent,
    TextContentComponent,
    ContactFormComponent,
    VideoHeroComponent,
    SplitContentComponent,
    TestimonialSliderComponent,
    LogoCloudComponent,
    NewsletterSignupComponent,
    StatsCounterComponent,
    PricingTableComponent,
    FaqAccordionComponent,
    CountdownTimerComponent,
    BlogFeedComponent,
    ProductListingComponent
  ],
  templateUrl: './page-builder.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls:['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);
  private publicService = inject(StorefrontPublicService);

  // Data Signals
  page = signal<any>(null);
  sections = signal<any[]>([]);
  selectedSection = signal<any>(null);
  mastersData = signal<any>({ categories: [], brands: [], tags: [] });
  
  // View State Signals
  viewMode = signal<'sidebar' | 'dialog'>('sidebar');
  sidebarState = signal<'split' | 'full'>('split');
  showAddMenu = signal(false);
  isSaving = signal(false);

  // Registry
  sectionRegistry: any = {};
  availableTypes: any[] = [];

  ngOnInit() {
    const pageId = this.route.snapshot.paramMap.get('id');
    
    this.adminService.getSectionTypes().subscribe({
      next: (res: any) => {
        const types = res.data || (Array.isArray(res) ? res : []);
        const patchedTypes = types.map((t: any) => {
          if ((t.type === 'product_slider' || t.type === 'product_grid') && t.schema?.ruleType) {
          }
          return t;
        });
    
        this.availableTypes = patchedTypes;
        this.sectionRegistry = patchedTypes.reduce((acc: any, item: any) => {
          acc[item.type] = item;
          return acc;
        }, {});

        if (pageId) this.loadPage(pageId);
      }
    });
    this.loadStoreMetadata();
  }

  loadStoreMetadata() {
    const raw = window.localStorage.getItem('orgSlug');
    let orgslug = '';
    try {
        orgslug = raw ? JSON.parse(raw) : '';
    } catch(e) { orgslug = raw || ''; }

    if(!orgslug) return;

    this.publicService.getStoreMetadata(orgslug).subscribe({
      next: (res: any) => {
        const enums = res.enums || {};
        this.mastersData.set({
          categories: enums.categories || [],
          brands: enums.brands || [],
          tags: enums.tags || [],
          products: [] 
        });
      }
    });
  }

  loadPage(id: string) {
    this.adminService.getPageById(id).subscribe({
      next: (res) => {
        this.page.set(res.data);
        const validSections = (res.data.sections || [])
          .filter((s: any) => this.sectionRegistry[s.type])
          .map((s: any) => ({ ...s, id: s.id || crypto.randomUUID() }));
        this.sections.set(validSections);
      },
      error: () => alert('Failed to load page.')
    });
  }

  toggleViewMode() {
    this.viewMode.update(mode => mode === 'sidebar' ? 'dialog' : 'sidebar');
  }

  toggleSidebarState() {
    this.sidebarState.update(state => state === 'split' ? 'full' : 'split');
  }

  addSection(type: string) {
    const def = this.sectionRegistry[type];
    if (!def) return;

    const config: any = {};
    if (def.schema) {
      Object.keys(def.schema).forEach(key => {
        if (def.schema[key].default !== undefined) {
          config[key] = def.schema[key].default;
        }
      });
    }

    const newSection = {
      id: crypto.randomUUID(),
      type,
      config,
      position: this.sections().length,
      isActive: true,
      dataSource: def.schema?.ruleType ? 'smart' : 'static'
    };

    this.sections.update(s => [...s, newSection]);
    this.selectSection(newSection);
    this.showAddMenu.set(false);
    
    setTimeout(() => {
      const container = document.getElementById('preview-container');
      if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  selectSection(section: any) {
    if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
       this.sidebarState.set('split');
    }
    try {
      this.selectedSection.set(JSON.parse(JSON.stringify(section)));
    } catch (e) {
      console.error('Selection Error', e);
    }
  }

  togglePublish() {
    const page = this.page();
    if (!page || !page._id) return;
    const action = page.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} this page?`)) return;
    this.isSaving.set(true);
    const request$ = page.isPublished ? this.adminService.unpublishPage(page._id): this.adminService.publishPage(page._id);
    request$.subscribe({
      next: (res: any) => {
        this.page.set(res.data); 
        this.isSaving.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(`Failed to ${action} page: ` + (err.error?.message || 'Unknown error'));
      }
    });
  }

  deletePage() {
    const page = this.page();
    if (!page || !page._id) return;
    if (!confirm('DANGER: This will permanently delete this page. This action cannot be undone.\n\nAre you sure?')) return;
    this.isSaving.set(true);
    this.adminService.deletePage(page._id).subscribe({
      next: () => {
        window.history.back(); 
      },
      error: (err) => {
        this.isSaving.set(false);
        alert('Failed to delete page: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  onConfigChange(newConfig: any) {
    const current = this.selectedSection();
    if (!current) return;
    const updated = { ...current, config: { ...current.config, ...newConfig } };
    this.sections.update(list => list.map(s => s.id === updated.id ? updated : s));
    this.selectedSection.set(updated);
  }

  deleteSection(id: string, event: Event) {
    event.stopPropagation();
    if(!confirm('Remove this section?')) return;
    this.sections.update(list => list.filter(s => s.id !== id));
    if (this.selectedSection()?.id === id) {
      this.selectedSection.set(null);
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    const list = [...this.sections()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    const reordered = list.map((s, i) => ({ ...s, position: i }));
    this.sections.set(reordered);
  }

  savePage() {
    const pageId = this.page()?._id;
    if (!pageId) return;
    
    this.isSaving.set(true);
    
    const cleanPayload = {
      sections: this.sections().map((s, i) => {
        const cleanConfig = { ...s.config };
        Object.keys(cleanConfig).forEach(key => {
          const val = cleanConfig[key];
          if (val === '' || val === null) {
            delete cleanConfig[key];
          }
        });

        if (s.type === 'product_grid' && cleanConfig.columns) {
          cleanConfig.columns = Number(cleanConfig.columns);
        }
        if (s.type === 'countdown_timer' && cleanConfig.targetDate) {
           cleanConfig.targetDate = String(cleanConfig.targetDate);
        }

        return {
          type: s.type,
          config: cleanConfig,
          position: i,
          isActive: s.isActive,
          dataSource: s.dataSource
        };
      })
    };

    this.adminService.updatePage(pageId, cleanPayload).subscribe({
      next: () => {
        this.isSaving.set(false);
      },
      error: (err) => { 
        this.isSaving.set(false); 
        console.error(err);
        alert('Save Error: ' + (err.error?.message || 'Something went wrong')); 
      }
    });
  }
}


//  [`
//     /* =========================================
//        PAGE BUILDER THEME ENGINE
//        ========================================= */
//     :host {
//       display: flex;
//       flex-direction: column;
//       height: 100vh;
//       background-color: var(--bg-ternary);
//       font-family: var(--font-body);
//       color: var(--text-primary);
//       overflow: hidden;
//     }

//     /* --- COMMON UTILS --- */
//     .icon-btn {
//       width: 2rem;
//       height: 2rem;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       border-radius: var(--ui-border-radius);
//       color: var(--text-secondary);
//       transition: var(--transition-fast);
//       cursor: pointer;
//       border: none;
//       background: transparent;

//       &:hover {
//         background-color: var(--bg-hover);
//         color: var(--text-primary);
//       }
      
//       &.danger:hover {
//         background-color: var(--color-error-bg);
//         color: var(--color-error);
//       }
//     }

//     /* =========================================
//        1. HEADER
//        ========================================= */
//     .builder-header {
//       height: 4rem;
//       background-color: var(--bg-primary);
//       border-bottom: 1px solid var(--border-secondary);
//       display: flex;
//       align-items: center;
//       justify-content: space-between;
//       padding: 0 var(--spacing-xl);
//       z-index: var(--z-sticky);
//       box-shadow: var(--shadow-sm);
//     }

//     .header-title {
//       font-family: var(--font-heading);
//       font-weight: var(--font-weight-bold);
//       font-size: var(--font-size-md);
//       color: var(--text-primary);
//     }

//     .status-badge {
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.05em;
//       padding: 2px 8px;
//       border-radius: 100px;
      
//       &.published { background: var(--color-success-bg); color: var(--color-success-dark); }
//       &.draft { background: var(--color-warning-bg); color: var(--color-warning-dark); }
//     }

//     .btn-primary {
//       background: var(--text-primary); /* Inverted for primary action */
//       color: var(--bg-primary);
//       padding: var(--spacing-sm) var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-semibold);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       transition: var(--transition-base);
      
//       &:hover {
//         background: var(--text-secondary);
//         transform: translateY(-1px);
//       }
//       &:disabled { opacity: 0.5; cursor: not-allowed; }
//     }

//     .btn-secondary {
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       color: var(--text-secondary);
//       padding: var(--spacing-sm) var(--spacing-lg);
//       border-radius: var(--ui-border-radius);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-sm);
//       transition: var(--transition-base);

//       &:hover {
//         background: var(--bg-secondary);
//         color: var(--text-primary);
//         border-color: var(--border-primary);
//       }
//     }

//     /* =========================================
//        2. SIDEBAR LAYERS
//        ========================================= */
//     .sidebar-panel {
//       background: var(--bg-primary);
//       height: 100%;
//       display: flex;
//       flex-direction: column;
//     }

//     .sidebar-header {
//       padding: var(--spacing-md) var(--spacing-lg);
//       border-bottom: 1px solid var(--border-secondary);
//       background: var(--bg-secondary);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       color: var(--text-tertiary);
//     }

//     /* LAYER CARD DESIGN */
//     .layer-card {
//       display: flex;
//       align-items: center;
//       gap: var(--spacing-md);
//       padding: var(--spacing-sm) var(--spacing-md);
//       margin-bottom: var(--spacing-xs);
//       background: var(--bg-primary);
//       border: 1px solid transparent;
//       border-radius: var(--ui-border-radius);
//       cursor: pointer;
//       transition: var(--transition-fast);
//       user-select: none;

//       &:hover {
//         background: var(--bg-hover);
//       }

//       &.active {
//         background: var(--accent-focus);
//         border-color: var(--accent-secondary);
        
//         .layer-title { color: var(--accent-primary); }
//         .drag-handle { color: var(--accent-primary); }
//       }
//     }

//     .drag-handle {
//       color: var(--text-tertiary);
//       cursor: grab;
//       padding: var(--spacing-xs);
//       border-radius: var(--ui-border-radius-sm);
      
//       &:hover { color: var(--text-primary); background: var(--bg-ternary); }
//       &:active { cursor: grabbing; }
//     }

//     .layer-info {
//       flex: 1;
//       overflow: hidden;
//       display: flex;
//       flex-direction: column;
//     }

//     .layer-title {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       color: var(--text-secondary);
//       white-space: nowrap;
//       overflow: hidden;
//       text-overflow: ellipsis;
//     }

//     .layer-subtitle {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//     }

//     .btn-add-section {
//       width: 100%;
//       margin-top: var(--spacing-md);
//       padding: var(--spacing-md);
//       background: transparent;
//       border: 1px dashed var(--border-secondary);
//       border-radius: var(--ui-border-radius);
//       color: var(--text-secondary);
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-medium);
//       transition: var(--transition-base);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: var(--spacing-sm);

//       &:hover {
//         border-color: var(--accent-primary);
//         color: var(--accent-primary);
//         background: var(--accent-focus);
//       }
//     }

//     /* =========================================
//        3. PREVIEW CANVAS
//        ========================================= */
//     .preview-canvas {
//       background-color: var(--bg-ternary);
//       background-image: radial-gradient(var(--border-secondary) 1px, transparent 1px);
//       background-size: 20px 20px;
//       height: 100%;
//       overflow-y: auto;
//       padding: var(--spacing-4xl);
//       position: relative;
//     }

//     .canvas-frame {
//       max-width: 1200px;
//       margin: 0 auto;
//       background: white; /* Always white for preview accuracy */
//       min-height: 800px;
//       box-shadow: var(--shadow-2xl);
//       transition: transform 0.3s ease, margin 0.3s ease;
      
//       /* Header simulation */
//       .fake-browser-header {
//         height: 2.5rem;
//         background: #f1f5f9;
//         border-bottom: 1px solid #e2e8f0;
//         display: flex;
//         align-items: center;
//         padding: 0 1rem;
//         gap: 0.5rem;
        
//         .dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; background: #cbd5e1; }
//       }
//     }

//     /* Section Wrapper on Canvas */
//     .canvas-section-wrapper {
//       position: relative;
//       border: 2px solid transparent;
//       transition: var(--transition-fast);

//       &:hover {
//         border-color: var(--accent-secondary); /* Hover hint */
        
//         .section-actions { opacity: 1; transform: translateY(0); }
//       }

//       &.selected {
//         border-color: var(--accent-primary);
//         z-index: 10;
//         box-shadow: 0 0 0 4px var(--accent-focus);
        
//         .section-label { opacity: 1; }
//       }
//     }

//     .section-label {
//       position: absolute;
//       top: 0; right: 0;
//       transform: translateY(-100%);
//       background: var(--accent-primary);
//       color: white;
//       font-size: var(--font-size-xs);
//       font-weight: var(--font-weight-bold);
//       padding: 2px 8px;
//       border-radius: 4px 4px 0 0;
//       opacity: 0;
//       transition: var(--transition-fast);
//       pointer-events: none;
//     }

//     /* =========================================
//        4. COMPONENT LIBRARY MODAL
//        ========================================= */
//     .library-modal-backdrop {
//       position: absolute;
//       inset: 0;
//       background: rgba(0, 0, 0, 0.4);
//       backdrop-filter: blur(4px);
//       z-index: var(--z-modal);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: var(--spacing-xl);
//     }

//     .library-modal {
//       background: var(--bg-primary);
//       width: 100%;
//       max-width: 800px;
//       max-height: 85vh;
//       border-radius: var(--ui-border-radius-xl);
//       box-shadow: var(--shadow-2xl);
//       display: flex;
//       flex-direction: column;
//       overflow: hidden;
//       animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
//     }

//     @keyframes slideUpFade {
//       from { opacity: 0; transform: translateY(20px); }
//       to { opacity: 1; transform: translateY(0); }
//     }

//     .library-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
//       gap: var(--spacing-lg);
//       padding: var(--spacing-xl);
//       overflow-y: auto;
//       background: var(--bg-secondary);
//     }

//     .component-card {
//       background: var(--bg-primary);
//       border: 1px solid var(--border-secondary);
//       border-radius: var(--ui-border-radius-lg);
//       padding: var(--spacing-lg);
//       display: flex;
//       flex-direction: column;
//       gap: var(--spacing-md);
//       transition: var(--transition-base);
//       cursor: pointer;
//       text-align: left;

//       &:hover {
//         border-color: var(--accent-primary);
//         transform: translateY(-4px);
//         box-shadow: var(--shadow-lg);
        
//         .comp-icon { 
//           background: var(--accent-primary); 
//           color: white;
//         }
//         .comp-title { color: var(--accent-primary); }
//       }
//     }

//     .comp-icon {
//       width: 40px; 
//       height: 40px;
//       border-radius: var(--ui-border-radius);
//       background: var(--bg-secondary);
//       color: var(--text-secondary);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: var(--transition-colors);
//       font-size: 1.5rem;
//     }

//     .comp-title {
//       font-size: var(--font-size-sm);
//       font-weight: var(--font-weight-bold);
//       color: var(--text-primary);
//       margin-bottom: var(--spacing-xs);
//     }

//     .comp-desc {
//       font-size: var(--font-size-xs);
//       color: var(--text-tertiary);
//       line-height: var(--line-height-relaxed);
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//     }

//     /* Scrollbars */
//     ::-webkit-scrollbar { width: 6px; height: 6px; }
//     ::-webkit-scrollbar-track { background: transparent; }
//     ::-webkit-scrollbar-thumb { background: var(--scroll-thumb-c); border-radius: 3px; }
//     ::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }
//   `]