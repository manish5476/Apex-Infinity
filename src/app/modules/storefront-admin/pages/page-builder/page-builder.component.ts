import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
import { ConfigFormComponent } from '../config-form/config-form.component';

// Modules for View Management
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DragDropModule,
    DialogModule,
    TooltipModule,
    ConfigFormComponent,
    HeroBannerComponent,
    ProductSliderComponent
  ],
  templateUrl: './page-builder.component.html',
  styleUrls: ['./page-builder.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PageBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);

  // Data Signals
  page = signal<any>(null);
  sections = signal<any[]>([]);
  selectedSection = signal<any>(null);
  
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
        
        // Dynamic patching for specific types
        const patchedTypes = types.map((t: any) => {
          if ((t.type === 'product_slider' || t.type === 'product_grid') && t.allowedConfig.ruleType) {
            t.allowedConfig.ruleType.type = 'select'; 
            t.allowedConfig.ruleType.options = [
              { label: '🔥 Best Sellers', value: 'best_sellers' },
              { label: '✨ New Arrivals', value: 'new_arrivals' },
              { label: '📈 Trending', value: 'trending' },
              { label: '🏷️ Clearance', value: 'clearance_sale' },
              { label: '🛠️ Custom', value: 'custom_query' }
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
    
    setTimeout(() => {
      const container = document.getElementById('preview-container');
      if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  selectSection(section: any) {
    // If selecting new, ensure sidebar is ready
    if (this.viewMode() === 'sidebar' && this.sidebarState() === 'full') {
        // Optional: Reset to split? 
        // this.sidebarState.set('split');
    }
    
    try {
      this.selectedSection.set(JSON.parse(JSON.stringify(section)));
    } catch (e) {
      console.error('Selection Error', e);
    }
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
    const payload = {
      sections: this.sections().map((s, i) => ({
        type: s.type,
        config: s.config,
        position: i,
        isActive: s.isActive,
        dataSource: s.dataSource
      }))
    };
    this.adminService.updatePage(pageId, payload).subscribe({
      next: () => this.isSaving.set(false),
      error: () => { this.isSaving.set(false); alert('Save failed'); }
    });
  }
}
// import { Component, OnInit, inject, signal, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
// import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
// import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
// import { ConfigFormComponent } from '../config-form/config-form.component';

// @Component({
//   selector: 'app-page-builder',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     DragDropModule,
//     ConfigFormComponent,
//     HeroBannerComponent,
//     ProductSliderComponent
//   ],
//   templateUrl: './page-builder.component.html',
//   styleUrls: ['./page-builder.component.scss'], // Make sure to use the file above
//   encapsulation: ViewEncapsulation.None // To apply styles to drag preview if needed
// })
// export class PageBuilderComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private adminService = inject(StorefrontAdminService);

//   // Signals
//   page = signal<any>(null);
//   sections = signal<any[]>([]);
//   selectedSection = signal<any>(null);
  
//   // State
//   sectionRegistry: any = {}; 
//   availableTypes: any[] = [];
//   showAddMenu = signal(false);
//   isSaving = signal(false);

//   ngOnInit() {
//     const pageId = this.route.snapshot.paramMap.get('id');
    
//     this.adminService.getSectionTypes().subscribe({
//       next: (res: any) => {
//         const types = Array.isArray(res) ? res : res.sectionTypes;
        
//         // Dynamic patching for dropdowns (as previously established)
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
//       },
//       error: (err) => console.error('Failed to load types', err)
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
//       dataSource: def.dataSource?.includes('smart') 
//         ? 'smart' 
//         : (def.dataSource?.includes('dynamic') ? 'dynamic' : 'static')
//     };

//     this.sections.update(s => [...s, newSection]);
//     this.selectSection(newSection);
//     this.showAddMenu.set(false);
    
//     // Auto-scroll logic
//     setTimeout(() => {
//       const container = document.getElementById('preview-container');
//       if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
//     }, 100);
//   }

//   selectSection(section: any) {
//     if (this.selectedSection()?.id === section.id) {
//        // Toggle off if clicking same one? Optional.
//        // this.selectedSection.set(null); 
//        return;
//     }
//     try {
//       this.selectedSection.set(JSON.parse(JSON.stringify(section)));
//     } catch (e) {
//       console.error('Selection Error', e);
//     }
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
//     const payload = {
//       sections: this.sections().map((s, i) => ({
//         type: s.type,
//         config: s.config,
//         position: i,
//         isActive: s.isActive,
//         dataSource: s.dataSource
//       }))
//     };

//     this.adminService.updatePage(pageId, payload).subscribe({
//       next: () => this.isSaving.set(false),
//       error: () => {
//         this.isSaving.set(false);
//         alert('Save failed');
//       }
//     });
//   }
// }

// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, RouterModule } from '@angular/router';
// // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
// // import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';
// // import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// // import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
// // import { ConfigFormComponent } from '../config-form/config-form.component';

// // @Component({
// //   selector: 'app-page-builder',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     DragDropModule,
// //     ConfigFormComponent,
// //     HeroBannerComponent,
// //     ProductSliderComponent
// //   ],
// //   templateUrl: './page-builder.component.html',
// //   styles: [`
// //     :host { display: block; height: 100vh; overflow: hidden; }
// //     .custom-scrollbar::-webkit-scrollbar { width: 6px; }
// //     .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
// //     .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
// //     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
// //   `]
// // })
// // export class PageBuilderComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private adminService = inject(StorefrontAdminService);

// //   // --- Signals ---
// //   page = signal<any>(null);
// //   sections = signal<any[]>([]);
// //   selectedSection = signal<any>(null);
  
// //   // Registry & UI State
// //   sectionRegistry: any = {}; 
// //   availableTypes: any[] = [];
// //   showAddMenu = signal(false);
// //   isSaving = signal(false);

// //   ngOnInit() {
// //     const pageId = this.route.snapshot.paramMap.get('id');
    
// //     // 1. Fetch & Patch Section Definitions
// //     this.adminService.getSectionTypes().subscribe({
// //       next: (res: any) => {
// //         const types = Array.isArray(res) ? res : res.sectionTypes;
        
// //         // 🔥 CRITICAL FIX: Manually patch the schema to force Dropdowns
// //         // This ensures 'ruleType' shows a Select menu, not a Text Input
// //         const patchedTypes = types.map((t: any) => {
// //           if (t.type === 'product_slider' || t.type === 'product_grid') {
// //             if (t.allowedConfig.ruleType) {
// //               // We define specific options for the dropdown here
// //               t.allowedConfig.ruleType.type = 'select'; 
// //               t.allowedConfig.ruleType.options = [
// //                 { label: '🔥 Best Sellers', value: 'best_sellers' },
// //                 { label: '✨ New Arrivals', value: 'new_arrivals' },
// //                 { label: '📈 Trending', value: 'trending' },
// //                 { label: '🏷️ Clearance', value: 'clearance_sale' },
// //                 { label: '🛠️ Custom', value: 'custom_query' }
// //               ];
// //             }
// //           }
// //           return t;
// //         });

// //         this.availableTypes = patchedTypes;
        
// //         // Build Registry Map
// //         this.sectionRegistry = patchedTypes.reduce((acc: any, item: any) => {
// //           acc[item.type] = item;
// //           return acc;
// //         }, {});

// //         // 2. Load Page Data
// //         if (pageId) this.loadPage(pageId);
// //       },
// //       error: (err) => console.error('Failed to load types', err)
// //     });
// //   }

// //   loadPage(id: string) {
// //     this.adminService.getPageById(id).subscribe({
// //       next: (res) => {
// //         this.page.set(res.page);
        
// //         // Sanitize sections to prevent crashes
// //         const validSections = (res.page.sections || [])
// //           .filter((s: any) => this.sectionRegistry[s.type]) // Remove unknown types
// //           .map((s: any) => ({
// //             ...s,
// //             id: s.id || crypto.randomUUID() // Ensure ID exists
// //           }));
          
// //         this.sections.set(validSections);
// //       },
// //       error: () => alert('Failed to load page.')
// //     });
// //   }

// //   // --- Actions ---

// //   addSection(type: string) {
// //     const def = this.sectionRegistry[type];
// //     if (!def) return;

// //     // Generate Config with Defaults
// //     const config: any = {};
// //     if (def.allowedConfig) {
// //       Object.keys(def.allowedConfig).forEach(key => {
// //         if (def.allowedConfig[key].default !== undefined) {
// //           config[key] = def.allowedConfig[key].default;
// //         }
// //       });
// //     }

// //     // const newSection = {
// //     //   id: crypto.randomUUID(),
// //     //   type,
// //     //   config,
// //     //   position: this.sections().length,
// //     //   isActive: true,
// //     //   dataSource: def.dataSource?.includes('smart') ? 'smart' : 'static'
// //     // };
// // const newSection = {
// //       id: crypto.randomUUID(),
// //       type,
// //       config,
// //       position: this.sections().length,
// //       isActive: true,
      
// //       // 👇👇👇 UPDATE THIS SECTION 👇👇👇
// //       dataSource: def.dataSource?.includes('smart') 
// //         ? 'smart' 
// //         : (def.dataSource?.includes('dynamic') ? 'dynamic' : 'static')
// //       // 👆👆👆 END UPDATE 👆👆👆
// //     };
// //     this.sections.update(s => [...s, newSection]);
// //     this.selectSection(newSection);
// //     this.showAddMenu.set(false);
    
// //     // Smooth Scroll to bottom
// //     setTimeout(() => {
// //       const container = document.getElementById('preview-container');
// //       if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
// //     }, 100);
// //   }

// //   selectSection(section: any) {
// //     // Deep clone to safely edit in form
// //     try {
// //       this.selectedSection.set(JSON.parse(JSON.stringify(section)));
// //     } catch (e) {
// //       console.error('Selection Error', e);
// //     }
// //   }

// //   onConfigChange(newConfig: any) {
// //     const current = this.selectedSection();
// //     if (!current) return;

// //     // Merge changes
// //     const updated = { 
// //       ...current, 
// //       config: { ...current.config, ...newConfig } 
// //     };
    
// //     // Update List (Re-renders Preview)
// //     this.sections.update(list => 
// //       list.map(s => s.id === updated.id ? updated : s)
// //     );
    
// //     // Update Selection (Keeps form in sync)
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

// //   savePage() {
// //     const pageId = this.page()?._id || this.page()?.id;
// //     if (!pageId) return;

// //     this.isSaving.set(true);
    
// //     const payload = {
// //       sections: this.sections().map((s, i) => ({
// //         type: s.type,
// //         config: s.config,
// //         position: i,
// //         isActive: s.isActive,
// //         dataSource: s.dataSource
// //       }))
// //     };

// //     this.adminService.updatePage(pageId, payload).subscribe({
// //       next: () => this.isSaving.set(false),
// //       error: () => {
// //         this.isSaving.set(false);
// //         alert('Save failed');
// //       }
// //     });
// //   }
// // }
