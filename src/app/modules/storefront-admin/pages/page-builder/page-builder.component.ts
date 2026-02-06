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

// --- ALL Section Components (Keep your existing imports here) ---
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
import { MasterListService } from '../../../../core/services/master-list.service';

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
  styleUrls: ['./page-builder.component.scss'],
  encapsulation: ViewEncapsulation.None // Required for PrimeNG styling overrides
})
export class PageBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);
  private publicService = inject(StorefrontPublicService);
  private masterListService = inject(MasterListService);

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
        // Patching specific logic for ruleTypes if needed
        const patchedTypes = types.map((t: any) => t);
    
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
          masterData: this.masterListService.masterData(),
          products: this.masterListService.products(),
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

  // --- UI Actions ---

  toggleViewMode() {
    // Switch between sidebar split view and dialog view
    this.viewMode.update(mode => mode === 'sidebar' ? 'dialog' : 'sidebar');
  }

  toggleSidebarState() {
    this.sidebarState.update(state => state === 'split' ? 'full' : 'split');
  }

  onDialogHide() {
    this.viewMode.set('sidebar');
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
    
    // Auto scroll to bottom
    setTimeout(() => {
      const container = document.getElementById('preview-container');
      if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  selectSection(section: any) {
    // If in full sidebar mode, switch to split to show config
    if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
       this.sidebarState.set('split');
    }
    
    // Create deep copy to prevent direct mutation issues before save/update
    try {
      this.selectedSection.set(JSON.parse(JSON.stringify(section)));
    } catch (e) {
      console.error('Selection Error', e);
    }
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

  onConfigChange(newConfig: any) {
    const current = this.selectedSection();
    if (!current) return;
    
    // Update the selected section signal immediately for UI responsiveness
    const updated = { ...current, config: { ...current.config, ...newConfig } };
    this.selectedSection.set(updated);

    // Update the master list
    this.sections.update(list => list.map(s => s.id === updated.id ? updated : s));
  }

  // --- API Actions ---

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

  savePage() {
    const pageId = this.page()?._id;
    if (!pageId) return;
    
    this.isSaving.set(true);
    
    const cleanPayload = {
      sections: this.sections().map((s, i) => {
        const cleanConfig = { ...s.config };
        // Basic cleanup
        Object.keys(cleanConfig).forEach(key => {
          const val = cleanConfig[key];
          if (val === '' || val === null) {
            delete cleanConfig[key];
          }
        });

        // Type conversion if necessary based on your schema requirements
        if (s.type === 'product_grid' && cleanConfig.columns) cleanConfig.columns = Number(cleanConfig.columns);
        if (s.type === 'countdown_timer' && cleanConfig.targetDate) cleanConfig.targetDate = String(cleanConfig.targetDate);

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
