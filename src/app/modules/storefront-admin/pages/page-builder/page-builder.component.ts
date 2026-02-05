import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';

// --- UI Modules ---
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SplitterModule } from 'primeng/splitter'; // ✅ IMPORTED
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
    SplitterModule, // ✅ REGISTERED
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
  encapsulation: ViewEncapsulation.None
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
        const types = Array.isArray(res) ? res : res.sectionTypes;
        const patchedTypes = types.map((t: any) => {
          if ((t.type === 'product_slider' || t.type === 'product_grid') && t.allowedConfig.ruleType) {
            t.allowedConfig.ruleType.type = 'select';
            t.allowedConfig.ruleType.options = [
              { label: '🔥new_arrivals Best Sellers', value: 'best_sellers' },
              { label: '✨best_sellers New Arrivals', value: 'new_arrivals' },
              { label: '📈  Trending', value: 'trending' },
              { label: '🏷️  Clearance', value: 'clearance_sale' },
              { label: '🛠️category_based Custom', value: 'category_based' },
              { label: '🛠️price_range Custom', value: 'price_range' },
              { label: '🛠️low_stock Custom', value: 'low_stock' },
              { label: '🛠️custom_query Custom', value: 'custom_query' }
            ];
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
  const orgslug = raw ? JSON.parse(raw) : '';

  this.publicService.getStoreMetadata(orgslug).subscribe({
    next: (res: any) => {
      console.log(res, "master");

      this.mastersData.set({
        categories: res.enums.categories || [],
        brands: res.enums.brands || [],
        tags: res.enums.tags || []
      });
    }
  });
}


  loadPage(id: string) {
    this.adminService.getPageById(id).subscribe({
      next: (res) => {
        this.page.set(res.page);
        const validSections = (res.page.sections || [])
          .filter((s: any) => this.sectionRegistry[s.type])
          .map((s: any) => ({ ...s, id: s.id || crypto.randomUUID() }));
        this.sections.set(validSections);
      },
      error: () => alert('Failed to load page.')
    });
  }

  // --- Actions ---

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
    if (def.allowedConfig) {
      Object.keys(def.allowedConfig).forEach(key => {
        if (def.allowedConfig[key].default !== undefined) {
          config[key] = def.allowedConfig[key].default;
        }
      });
    }

    const newSection = {
      id: crypto.randomUUID(),
      type,
      config,
      position: this.sections().length,
      isActive: true,
      dataSource: def.dataSource?.includes('smart') ? 'smart' : (def.dataSource?.includes('dynamic') ? 'dynamic' : 'static')
    };

    this.sections.update(s => [...s, newSection]);
    this.selectSection(newSection);
    this.showAddMenu.set(false);
    
    // Slight delay to allow DOM to render before scrolling
    setTimeout(() => {
      const container = document.getElementById('preview-container');
      if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  selectSection(section: any) {
    if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
       // Optional: Reset to split view if fully expanded covers the preview
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
    if (!page || !page.id) return;
    const action = page.isPublished ? 'unpublish' : 'publish';
    if (!confirm(`Are you sure you want to ${action} this page?`)) return;
    this.isSaving.set(true);
    const request$ = page.isPublished ? this.adminService.unpublishPage(page.id): this.adminService.publishPage(page.id);
    request$.subscribe({
      next: (res: any) => {
        this.page.set(res.page); 
        this.isSaving.set(false);
        alert(`Page successfully ${action}ed!`);
      },
      error: (err) => {
        this.isSaving.set(false);
        alert(`Failed to ${action} page: ` + (err.error?.message || 'Unknown error'));
      }
    });
  }

  deletePage() {
    const page = this.page();
    if (!page || !page.id) return;

    if (!confirm('DANGER: This will permanently delete this page. This action cannot be undone.\n\nAre you sure?')) return;

    this.isSaving.set(true);
    this.adminService.deletePage(page.id).subscribe({
      next: () => {
        alert('Page deleted.');
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
    const pageId = this.page()?._id || this.page()?.id;
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

// import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
// import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// // --- UI Modules ---
// import { DialogModule } from 'primeng/dialog';
// import { TooltipModule } from 'primeng/tooltip';
// import { ConfigFormComponent } from '../config-form/config-form.component';

// // --- ALL Section Components ---
// import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
// import { BlogFeedComponent } from '../../../storefront-public/pages/blog-feed/blog-feed.component';
// import { CategoryGridComponent } from '../../../storefront-public/pages/category-grid/category-grid.component';
// import { ContactFormComponent } from '../../../storefront-public/pages/contact-form/contact-form.component';
// import { CountdownTimerComponent } from '../../../storefront-public/pages/countdown-timer/countdown-timer.component';
// import { FaqAccordionComponent } from '../../../storefront-public/pages/faq-accordion/faq-accordion.component';
// import { FeatureGridComponent } from '../../../storefront-public/pages/feature-grid/feature-grid.component';
// import { LogoCloudComponent } from '../../../storefront-public/pages/logo-cloud/logo-cloud.component';
// import { NewsletterSignupComponent } from '../../../storefront-public/pages/newsletter-signup/newsletter-signup.component';
// import { PricingTableComponent } from '../../../storefront-public/pages/pricing-table/pricing-table.component';
// import { ProductGridComponent } from '../../../storefront-public/pages/product-grid/product-grid.component';
// import { SplitContentComponent } from '../../../storefront-public/pages/split-content/split-content.component';
// import { StatsCounterComponent } from '../../../storefront-public/pages/stats-counter/stats-counter.component';
// import { TestimonialSliderComponent } from '../../../storefront-public/pages/testimonial-slider/testimonial-slider.component';
// import { TextContentComponent } from '../../../storefront-public/pages/text-content/text-content.component';
// import { VideoHeroComponent } from '../../../storefront-public/pages/video-hero/video-hero.component';
// import { ProductListComponent } from '../../../product/components/product-list/product-list';
// import { ProductListingComponent } from "../../../storefront-public/pages/product-listing/product-listing.component";
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';


// @Component({
//   selector: 'app-page-builder',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     DragDropModule,
//     DialogModule,
//     TooltipModule,
//     ConfigFormComponent,
//     // ✅ REGISTERED COMPONENTS
//     HeroBannerComponent,
//     ProductSliderComponent,
//     ProductGridComponent,
//     CategoryGridComponent,
//     FeatureGridComponent,
//     TextContentComponent,
//     ContactFormComponent,
//     VideoHeroComponent,
//     SplitContentComponent,
//     TestimonialSliderComponent,
//     LogoCloudComponent,
//     NewsletterSignupComponent,
//     StatsCounterComponent,
//     PricingTableComponent,
//     FaqAccordionComponent,
//     CountdownTimerComponent,
//     BlogFeedComponent,
//       ProductListingComponent
// ],
//   templateUrl: './page-builder.component.html',
//   styleUrls: ['./page-builder.component.scss'],
//   encapsulation: ViewEncapsulation.None
// })
// export class PageBuilderComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private adminService = inject(StorefrontAdminService);
//   private publicService = inject(StorefrontPublicService);

//   // Data Signals
//   page = signal<any>(null);
//   sections = signal<any[]>([]);
//   selectedSection = signal<any>(null);
//   mastersData = signal<any>({ categories: [], brands: [], tags: [] });
//   // View State Signals
//   viewMode = signal<'sidebar' | 'dialog'>('sidebar');
//   sidebarState = signal<'split' | 'full'>('split');
//   showAddMenu = signal(false);
//   isSaving = signal(false);

//   // Registry
//   sectionRegistry: any = {}; 
//   availableTypes: any[] = [];

//   ngOnInit() {
//     const pageId = this.route.snapshot.paramMap.get('id');
    
//     this.adminService.getSectionTypes().subscribe({
//       next: (res: any) => {
//         const types = Array.isArray(res) ? res : res.sectionTypes;
        
//         // Dynamic patching for specific types (e.g. dropdowns for ruleType)
//         const patchedTypes = types.map((t: any) => {
//           if ((t.type === 'product_slider' || t.type === 'product_grid') && t.allowedConfig.ruleType) {
//             t.allowedConfig.ruleType.type = 'select'; 
//             t.allowedConfig.ruleType.options = [
//               { label: '🔥 Best Sellers', value: 'best_sellers' },
//               { label: '✨ New Arrivals', value: 'new_arrivals' },
//               { label: '📈 Trending', value: 'trending' },
//               { label: '🏷️ Clearance', value: 'clearance_sale' },
//               { label: '🛠️ Custom', value: 'custom_query' }
//             ];
//           }
//           return t;
//         });

//         this.availableTypes = patchedTypes;
//         this.sectionRegistry = patchedTypes.reduce((acc: any, item: any) => {
//           acc[item.type] = item;
//           return acc;
//         }, {});

//         if (pageId) this.loadPage(pageId);
//       }
//     });
//     const orgSlug = 'shivam'; // Use your state service or route to get actual slug
//   }

  
//   loadStoreMetadata() {
//    let orgslug:any=''
//    orgslug= window.localStorage.getItem('orgSlug')?window.localStorage.getItem('orgSlug'):''
//   this.publicService.getStoreMetadata(orgslug).subscribe({
//       next: (res: any) => {
//         this.mastersData.set({
//           categories: res.enums.categories || [],
//           brands: res.enums.brands || [],
//           tags: res.enums.tags || []
//         });
//       }
//     });
//   }


//   loadPage(id: string) {
//     this.adminService.getPageById(id).subscribe({
//       next: (res) => {
//         this.page.set(res.page);
//         const validSections = (res.page.sections || [])
//           .filter((s: any) => this.sectionRegistry[s.type])
//           .map((s: any) => ({ ...s, id: s.id || crypto.randomUUID() }));
//         this.sections.set(validSections);
//       },
//       error: () => alert('Failed to load page.')
//     });
//   }

//   // --- Actions ---

//   toggleViewMode() {
//     this.viewMode.update(mode => mode === 'sidebar' ? 'dialog' : 'sidebar');
//   }

//   toggleSidebarState() {
//     this.sidebarState.update(state => state === 'split' ? 'full' : 'split');
//   }

//   addSection(type: string) {
//     const def = this.sectionRegistry[type];
//     if (!def) return;

//     const config: any = {};
//     if (def.allowedConfig) {
//       Object.keys(def.allowedConfig).forEach(key => {
//         if (def.allowedConfig[key].default !== undefined) {
//           config[key] = def.allowedConfig[key].default;
//         }
//       });
//     }

//     const newSection = {
//       id: crypto.randomUUID(),
//       type,
//       config,
//       position: this.sections().length,
//       isActive: true,
//       dataSource: def.dataSource?.includes('smart') ? 'smart' : (def.dataSource?.includes('dynamic') ? 'dynamic' : 'static')
//     };

//     this.sections.update(s => [...s, newSection]);
//     this.selectSection(newSection);
//     this.showAddMenu.set(false);
    
//     setTimeout(() => {
//       const container = document.getElementById('preview-container');
//       if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
//     }, 100);
//   }

//   selectSection(section: any) {
//     // If selecting new, ensure sidebar is ready
//     if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
//         // Optional: Reset to split view if fully expanded covers the preview
//         // this.sidebarState.set('split');
//     }
    
//     try {
//       this.selectedSection.set(JSON.parse(JSON.stringify(section)));
//     } catch (e) {
//       console.error('Selection Error', e);
//     }
//   }
// // ✅ ADDED: Publish/Unpublish Logic
//   togglePublish() {
//     const page = this.page();
//     if (!page || !page.id) return;

//     const action = page.isPublished ? 'unpublish' : 'publish';
//     if (!confirm(`Are you sure you want to ${action} this page?`)) return;

//     this.isSaving.set(true);

//     const request$ = page.isPublished 
//       ? this.adminService.unpublishPage(page.id)
//       : this.adminService.publishPage(page.id);

//     request$.subscribe({
//       next: (res: any) => {
//         this.page.set(res.page); // Update local state with new status
//         this.isSaving.set(false);
//         alert(`Page successfully ${action}ed!`);
//       },
//       error: (err) => {
//         this.isSaving.set(false);
//         alert(`Failed to ${action} page: ` + (err.error?.message || 'Unknown error'));
//       }
//     });
//   }

//   // ✅ ADDED: Delete Page Logic
//   deletePage() {
//     const page = this.page();
//     if (!page || !page.id) return;

//     if (!confirm('DANGER: This will permanently delete this page. This action cannot be undone.\n\nAre you sure?')) return;

//     this.isSaving.set(true);
//     this.adminService.deletePage(page.id).subscribe({
//       next: () => {
//         alert('Page deleted.');
//         // Navigate back to page list
//         // Assuming you have router injected
//         // this.router.navigate(['../../'], { relativeTo: this.route });
//         window.history.back(); 
//       },
//       error: (err) => {
//         this.isSaving.set(false);
//         alert('Failed to delete page: ' + (err.error?.message || 'Unknown error'));
//       }
//     });
//   }
//   onConfigChange(newConfig: any) {
//     const current = this.selectedSection();
//     if (!current) return;
//     const updated = { ...current, config: { ...current.config, ...newConfig } };
//     this.sections.update(list => list.map(s => s.id === updated.id ? updated : s));
//     this.selectedSection.set(updated);
//   }

//   deleteSection(id: string, event: Event) {
//     event.stopPropagation();
//     if(!confirm('Remove this section?')) return;
//     this.sections.update(list => list.filter(s => s.id !== id));
//     if (this.selectedSection()?.id === id) {
//       this.selectedSection.set(null);
//     }
//   }

//   drop(event: CdkDragDrop<any[]>) {
//     const list = [...this.sections()];
//     moveItemInArray(list, event.previousIndex, event.currentIndex);
//     const reordered = list.map((s, i) => ({ ...s, position: i }));
//     this.sections.set(reordered);
//   }

//   savePage() {
//     const pageId = this.page()?._id || this.page()?.id;
//     if (!pageId) return;
    
//     this.isSaving.set(true);
    
//     // Clean data before sending
//     const cleanPayload = {
//       sections: this.sections().map((s, i) => {
//         // Create a copy of config
//         const cleanConfig = { ...s.config };
        
//         // Remove empty strings/nulls so Backend defaults take over
//         Object.keys(cleanConfig).forEach(key => {
//           const val = cleanConfig[key];
//           if (val === '' || val === null) {
//             delete cleanConfig[key];
//           }
//         });

//         // Ensure numeric fields are numbers
//         if (s.type === 'product_grid' && cleanConfig.columns) {
//           cleanConfig.columns = Number(cleanConfig.columns);
//         }

//         // Ensure Date fields are strings (datetime-local usually binds as string anyway)
//         if (s.type === 'countdown_timer' && cleanConfig.targetDate) {
//            cleanConfig.targetDate = String(cleanConfig.targetDate);
//         }

//         return {
//           type: s.type,
//           config: cleanConfig,
//           position: i,
//           isActive: s.isActive,
//           dataSource: s.dataSource
//         };
//       })
//     };

//     this.adminService.updatePage(pageId, cleanPayload).subscribe({
//       next: () => {
//         this.isSaving.set(false);
//         // Optional: Add a Toast Success message here
//       },
//       error: (err) => { 
//         this.isSaving.set(false); 
//         console.error(err);
//         // Show the actual error message from backend
//         alert('Save Error: ' + (err.error?.message || 'Something went wrong')); 
//       }
//     });
//   }
// }





























// // import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, RouterModule } from '@angular/router';
// // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
// // import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
// // import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// // import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
// // import { ConfigFormComponent } from '../config-form/config-form.component';

// // // Modules for View Management
// // import { DialogModule } from 'primeng/dialog';
// // import { TooltipModule } from 'primeng/tooltip';

// // @Component({
// //   selector: 'app-page-builder',
// //   standalone: true,
// //   imports: [CommonModule,RouterModule,DragDropModule,DialogModule,TooltipModule,ConfigFormComponent,HeroBannerComponent,ProductSliderComponent],
// //   templateUrl: './page-builder.component.html',
// //   styleUrls: ['./page-builder.component.scss'],
// //   encapsulation: ViewEncapsulation.None
// // })
// // export class PageBuilderComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private adminService = inject(StorefrontAdminService);

// //   // Data Signals
// //   page = signal<any>(null);
// //   sections = signal<any[]>([]);
// //   selectedSection = signal<any>(null);
  
// //   // View State Signals
// //   viewMode = signal<'sidebar' | 'dialog'>('sidebar');
// //   sidebarState = signal<'split' | 'full'>('split');
// //   showAddMenu = signal(false);
// //   isSaving = signal(false);

// //   // Registry
// //   sectionRegistry: any = {}; 
// //   availableTypes: any[] = [];

// //   ngOnInit() {
// //     const pageId = this.route.snapshot.paramMap.get('id');
    
// //     this.adminService.getSectionTypes().subscribe({
// //       next: (res: any) => {
// //         const types = Array.isArray(res) ? res : res.sectionTypes;
        
// //         // Dynamic patching for specific types
// //         const patchedTypes = types.map((t: any) => {
// //           if ((t.type === 'product_slider' || t.type === 'product_grid') && t.allowedConfig.ruleType) {
// //             t.allowedConfig.ruleType.type = 'select'; 
// //             t.allowedConfig.ruleType.options = [
// //               { label: '🔥 Best Sellers', value: 'best_sellers' },
// //               { label: '✨ New Arrivals', value: 'new_arrivals' },
// //               { label: '📈 Trending', value: 'trending' },
// //               { label: '🏷️ Clearance', value: 'clearance_sale' },
// //               { label: '🛠️ Custom', value: 'custom_query' }
// //             ];
// //           }
// //           return t;
// //         });

// //         this.availableTypes = patchedTypes;
// //         this.sectionRegistry = patchedTypes.reduce((acc: any, item: any) => {
// //           acc[item.type] = item;
// //           return acc;
// //         }, {});

// //         if (pageId) this.loadPage(pageId);
// //       }
// //     });
// //   }

// //   loadPage(id: string) {
// //     this.adminService.getPageById(id).subscribe({
// //       next: (res) => {
// //         this.page.set(res.page);
// //         const validSections = (res.page.sections || [])
// //           .filter((s: any) => this.sectionRegistry[s.type])
// //           .map((s: any) => ({ ...s, id: s.id || crypto.randomUUID() }));
// //         this.sections.set(validSections);
// //       },
// //       error: () => alert('Failed to load page.')
// //     });
// //   }

// //   // --- Actions ---

// //   toggleViewMode() {
// //     this.viewMode.update(mode => mode === 'sidebar' ? 'dialog' : 'sidebar');
// //   }

// //   toggleSidebarState() {
// //     this.sidebarState.update(state => state === 'split' ? 'full' : 'split');
// //   }

// //   addSection(type: string) {
// //     const def = this.sectionRegistry[type];
// //     if (!def) return;

// //     const config: any = {};
// //     if (def.allowedConfig) {
// //       Object.keys(def.allowedConfig).forEach(key => {
// //         if (def.allowedConfig[key].default !== undefined) {
// //           config[key] = def.allowedConfig[key].default;
// //         }
// //       });
// //     }

// //     const newSection = {
// //       id: crypto.randomUUID(),
// //       type,
// //       config,
// //       position: this.sections().length,
// //       isActive: true,
// //       dataSource: def.dataSource?.includes('smart') ? 'smart' : (def.dataSource?.includes('dynamic') ? 'dynamic' : 'static')
// //     };

// //     this.sections.update(s => [...s, newSection]);
// //     this.selectSection(newSection);
// //     this.showAddMenu.set(false);
    
// //     setTimeout(() => {
// //       const container = document.getElementById('preview-container');
// //       if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
// //     }, 100);
// //   }

// //   selectSection(section: any) {
// //     // If selecting new, ensure sidebar is ready
// //     if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
// //         // Optional: Reset to split? 
// //         // this.sidebarState.set('split');
// //     }
    
// //     try {
// //       this.selectedSection.set(JSON.parse(JSON.stringify(section)));
// //     } catch (e) {
// //       console.error('Selection Error', e);
// //     }
// //   }

// //   onConfigChange(newConfig: any) {
// //     const current = this.selectedSection();
// //     if (!current) return;
// //     const updated = { ...current, config: { ...current.config, ...newConfig } };
// //     this.sections.update(list => list.map(s => s.id === updated.id ? updated : s));
// //     this.selectedSection.set(updated);
// //   }

// //   deleteSection(id: string, event: Event) {
// //     event.stopPropagation();
// //     if(!confirm('Remove this section?')) return;
// //     this.sections.update(list => list.filter(s => s.id !== id));
// //     if (this.selectedSection()?.id === id) {
// //       this.selectedSection.set(null);
// //     }
// //   }

// //   drop(event: CdkDragDrop<any[]>) {
// //     const list = [...this.sections()];
// //     moveItemInArray(list, event.previousIndex, event.currentIndex);
// //     const reordered = list.map((s, i) => ({ ...s, position: i }));
// //     this.sections.set(reordered);
// //   }
// // // In page-builder.component.ts
// // savePage() {
// //     const pageId = this.page()?._id || this.page()?.id;
// //     if (!pageId) return;
    
// //     this.isSaving.set(true);
    
// //     // ✅ FIX: Clean data before sending
// //     const cleanPayload = {
// //       sections: this.sections().map((s, i) => {
// //         // Create a copy of config
// //         const cleanConfig = { ...s.config };
        
// //         // Remove empty strings/nulls so Backend defaults take over
// //         Object.keys(cleanConfig).forEach(key => {
// //           const val = cleanConfig[key];
// //           if (val === '' || val === null) {
// //             delete cleanConfig[key];
// //           }
// //         });

// //         // Ensure Product Grid columns are Numbers (not strings)
// //         if (s.type === 'product_grid' && cleanConfig.columns) {
// //           cleanConfig.columns = Number(cleanConfig.columns);
// //         }

// //         return {
// //           type: s.type,
// //           config: cleanConfig,
// //           position: i,
// //           isActive: s.isActive,
// //           dataSource: s.dataSource
// //         };
// //       })
// //     };

// //     this.adminService.updatePage(pageId, cleanPayload).subscribe({
// //       next: () => {
// //         this.isSaving.set(false);
// //         // Optional: Add a Toast Success message here
// //       },
// //       error: (err) => { 
// //         this.isSaving.set(false); 
// //         console.error(err);
// //         // Show the actual error message from backend
// //         alert('Save Error: ' + (err.error?.message || 'Something went wrong')); 
// //       }
// //     });
// //   }
// // }
