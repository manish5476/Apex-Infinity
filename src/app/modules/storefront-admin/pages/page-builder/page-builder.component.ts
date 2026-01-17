import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// Preview Components
import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
import { ConfigFormComponent } from '../config-form/config-form.component';

// The New Professional Form
// import { ConfigFormComponent } from './config-form/config-form.component';

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DragDropModule,
    ConfigFormComponent,
    HeroBannerComponent,
    ProductSliderComponent
  ],
  templateUrl: './page-builder.component.html',
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `]
})
export class PageBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);

  // --- Signals ---
  page = signal<any>(null);
  sections = signal<any[]>([]);
  selectedSection = signal<any>(null);
  
  // Registry & UI State
  sectionRegistry: any = {}; 
  availableTypes: any[] = [];
  showAddMenu = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    const pageId = this.route.snapshot.paramMap.get('id');
    
    // 1. Fetch & Patch Section Definitions
    this.adminService.getSectionTypes().subscribe({
      next: (res: any) => {
        const types = Array.isArray(res) ? res : res.sectionTypes;
        
        // 🔥 CRITICAL FIX: Manually patch the schema to force Dropdowns
        // This ensures 'ruleType' shows a Select menu, not a Text Input
        const patchedTypes = types.map((t: any) => {
          if (t.type === 'product_slider' || t.type === 'product_grid') {
            if (t.allowedConfig.ruleType) {
              // We define specific options for the dropdown here
              t.allowedConfig.ruleType.type = 'select'; 
              t.allowedConfig.ruleType.options = [
                { label: '🔥 Best Sellers', value: 'best_sellers' },
                { label: '✨ New Arrivals', value: 'new_arrivals' },
                { label: '📈 Trending', value: 'trending' },
                { label: '🏷️ Clearance', value: 'clearance_sale' },
                { label: '🛠️ Custom', value: 'custom_query' }
              ];
            }
          }
          return t;
        });

        this.availableTypes = patchedTypes;
        
        // Build Registry Map
        this.sectionRegistry = patchedTypes.reduce((acc: any, item: any) => {
          acc[item.type] = item;
          return acc;
        }, {});

        // 2. Load Page Data
        if (pageId) this.loadPage(pageId);
      },
      error: (err) => console.error('Failed to load types', err)
    });
  }

  loadPage(id: string) {
    this.adminService.getPageById(id).subscribe({
      next: (res) => {
        this.page.set(res.page);
        
        // Sanitize sections to prevent crashes
        const validSections = (res.page.sections || [])
          .filter((s: any) => this.sectionRegistry[s.type]) // Remove unknown types
          .map((s: any) => ({
            ...s,
            id: s.id || crypto.randomUUID() // Ensure ID exists
          }));
          
        this.sections.set(validSections);
      },
      error: () => alert('Failed to load page.')
    });
  }

  // --- Actions ---

  addSection(type: string) {
    const def = this.sectionRegistry[type];
    if (!def) return;

    // Generate Config with Defaults
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
      dataSource: def.dataSource?.includes('smart') ? 'smart' : 'static'
    };

    this.sections.update(s => [...s, newSection]);
    this.selectSection(newSection);
    this.showAddMenu.set(false);
    
    // Smooth Scroll to bottom
    setTimeout(() => {
      const container = document.getElementById('preview-container');
      if(container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 100);
  }

  selectSection(section: any) {
    // Deep clone to safely edit in form
    try {
      this.selectedSection.set(JSON.parse(JSON.stringify(section)));
    } catch (e) {
      console.error('Selection Error', e);
    }
  }

  onConfigChange(newConfig: any) {
    const current = this.selectedSection();
    if (!current) return;

    // Merge changes
    const updated = { 
      ...current, 
      config: { ...current.config, ...newConfig } 
    };
    
    // Update List (Re-renders Preview)
    this.sections.update(list => 
      list.map(s => s.id === updated.id ? updated : s)
    );
    
    // Update Selection (Keeps form in sync)
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
      error: () => {
        this.isSaving.set(false);
        alert('Save failed');
      }
    });
  }
}

// import { Component, OnInit, inject, signal, effect } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// // Import Preview Components
// import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
// import { ConfigFormComponent } from '../config-form/config-form.component';
// // Assuming this is your dynamic form component
// // import { ConfigFormComponent } from '../../config-form/config-form.component'; 

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
//   styles: [`
//     .custom-scrollbar::-webkit-scrollbar { width: 6px; }
//     .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
//     .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
//     .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
//   `]
// })
// export class PageBuilderComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private adminService = inject(StorefrontAdminService);

//   // --- Signals ---
//   page = signal<any>(null);
//   sections = signal<any[]>([]);
//   selectedSection = signal<any>(null);
  
//   // Registry Data
//   sectionRegistry: any = {}; 
//   availableTypes: any[] = [];
  
//   // UI State
//   showAddMenu = signal(false);
//   isSaving = signal(false);

//   ngOnInit() {
//     const pageId = this.route.snapshot.paramMap.get('id');
    
//     // 1. Fetch Section Definitions
//     this.adminService.getSectionTypes().subscribe({
//       next: (res: any) => {
//         const types = Array.isArray(res) ? res : res.sectionTypes;
        
//         // --- FIX: Patch Registry to Force Dropdowns ---
//         // We modify the schema received from backend to add 'enum' options
//         // This ensures your config-form renders a Select box instead of Input
//         const patchedTypes = types.map((t: any) => {
//           if (t.type === 'product_slider' || t.type === 'product_grid') {
//             if (t.allowedConfig.ruleType) {
//               t.allowedConfig.ruleType = {
//                 ...t.allowedConfig.ruleType,
//                 type: 'select', // Explicitly hint UI to use select
//                 options: [ // The dropdown values
//                   { label: 'Best Sellers', value: 'best_sellers' },
//                   { label: 'New Arrivals', value: 'new_arrivals' },
//                   { label: 'Trending', value: 'trending' },
//                   { label: 'On Sale', value: 'clearance_sale' },
//                   { label: 'Featured', value: 'custom_query' }
//                 ]
//               };
//             }
//           }
//           return t;
//         });

//         this.availableTypes = patchedTypes;
        
//         // Convert array to map for fast lookup
//         this.sectionRegistry = patchedTypes.reduce((acc: any, item: any) => {
//           acc[item.type] = item;
//           return acc;
//         }, {});

//         // 2. Load Page Data (only after registry is ready)
//         if (pageId) this.loadPage(pageId);
//       },
//       error: (err) => console.error('Failed to load section types', err)
//     });
//   }

//   loadPage(id: string) {
//     this.adminService.getPageById(id).subscribe({
//       next: (res) => {
//         this.page.set(res.page);
        
//         // Ensure sections have unique IDs for tracking
//         // We filter out any sections that might have an invalid type to prevent crashes
//         const cleanSections = (res.page.sections || [])
//           .filter((s: any) => this.sectionRegistry[s.type]) // Only keep known types
//           .map((s: any) => ({
//             ...s,
//             id: s.id || crypto.randomUUID()
//           }));
          
//         this.sections.set(cleanSections);
//       },
//       error: (err) => alert('Could not load page data')
//     });
//   }

//   // --- Section Management ---

//   addSection(type: string) {
//     try {
//       const def = this.sectionRegistry[type];
//       if (!def) return;

//       // Generate default config safely
//       const config: any = {};
//       if (def.allowedConfig) {
//         Object.keys(def.allowedConfig).forEach(key => {
//           if (def.allowedConfig[key].default !== undefined) {
//             config[key] = def.allowedConfig[key].default;
//           }
//         });
//       }

//       const newSection = {
//         id: crypto.randomUUID(),
//         type,
//         config,
//         position: this.sections().length,
//         isActive: true,
//         dataSource: def.dataSource?.includes('smart') ? 'smart' : 'static'
//       };

//       this.sections.update(s => [...s, newSection]);
//       this.selectSection(newSection);
//       this.showAddMenu.set(false);
      
//       // Scroll to bottom of preview
//       setTimeout(() => {
//         const previewEl = document.getElementById('preview-container');
//         if(previewEl) previewEl.scrollTop = previewEl.scrollHeight;
//       }, 100);
//     } catch (e) {
//       console.error('Error adding section', e);
//     }
//   }

//   selectSection(section: any) {
//     // Create a deep copy to prevent reference issues during editing
//     // This prevents the form from crashing if it tries to mutate read-only props
//     try {
//       this.selectedSection.set(JSON.parse(JSON.stringify(section)));
//     } catch (e) {
//       console.error('Error selecting section', e);
//     }
//   }

//   onConfigChange(newConfig: any) {
//     const current = this.selectedSection();
//     if (!current) return;

//     const updated = { 
//       ...current, 
//       config: { ...current.config, ...newConfig } 
//     };
    
//     // 1. Update the list (for preview)
//     this.sections.update(list => 
//       list.map(s => s.id === updated.id ? updated : s)
//     );
    
//     // 2. Update selected (to keep form in sync)
//     this.selectedSection.set(updated);
//   }

//   deleteSection(id: string, event: Event) {
//     event.stopPropagation();
//     if(!confirm('Delete this section?')) return;

//     this.sections.update(list => list.filter(s => s.id !== id));
//     if (this.selectedSection()?.id === id) {
//       this.selectedSection.set(null);
//     }
//   }

//   // --- Drag & Drop ---

//   drop(event: CdkDragDrop<any[]>) {
//     const list = [...this.sections()];
//     moveItemInArray(list, event.previousIndex, event.currentIndex);
    
//     // Re-assign positions
//     const reordered = list.map((s, i) => ({ ...s, position: i }));
//     this.sections.set(reordered);
//   }

//   // --- Persistence ---

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
//       next: () => {
//         this.isSaving.set(false);
//       },
//       error: (err) => {
//         console.error(err);
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

// // // Import your actual Public Components for Preview
// // import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// // import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';
// // import { ConfigFormComponent } from '../../../../admin/pages/page-builder/config-form/config-form.component';

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
// //   styleUrls: ['./page-builder.component.scss'] // We'll put styles in component metadata or separate file
// // })
// // export class PageBuilderComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private adminService = inject(StorefrontAdminService);

// //   // --- Signals ---
// //   page = signal<any>(null);
// //   sections = signal<any[]>([]);
// //   selectedSection = signal<any>(null);
  
// //   // Registry Data
// //   sectionRegistry: any = {}; 
// //   availableTypes: any[] = [];
  
// //   // UI State
// //   showAddMenu = signal(false);
// //   isSaving = signal(false);
// // ngOnInit() {
// //     const pageId = this.route.snapshot.paramMap.get('id');
    
// //     // 1. Fetch Section Definitions
// //     this.adminService.getSectionTypes().subscribe((res: any) => {
// //       // ✅ FIX: Check if 'res' is the array itself or an object containing it
// //       const types = Array.isArray(res) ? res : res.sectionTypes;
// //       this.availableTypes = types; 
// //       // Convert array to map for fast lookup
// //       this.sectionRegistry = types.reduce((acc: any, item: any) => {
// //         acc[item.type] = item;
// //         return acc;
// //       }, {});

// //       // 2. Load Page Data (only after registry is ready)
// //       if (pageId) this.loadPage(pageId);
// //     });
// //   }
// //   loadPage(id: string) {
// //     this.adminService.getPageById(id).subscribe(res => {
// //       this.page.set(res.page);
// //       // Ensure sections have unique IDs for tracking
// //       const cleanSections = (res.page.sections || []).map((s: any) => ({
// //         ...s,
// //         id: s.id || crypto.randomUUID()
// //       }));
// //       this.sections.set(cleanSections);
// //     });
// //   }

// //   // --- Section Management ---

// //   addSection(type: string) {
// //     const def = this.sectionRegistry[type];
// //     if (!def) return;

// //     // Generate default config
// //     const config: any = {};
// //     Object.keys(def.allowedConfig).forEach(key => {
// //       if (def.allowedConfig[key].default !== undefined) {
// //         config[key] = def.allowedConfig[key].default;
// //       }
// //     });

// //     const newSection = {
// //       id: crypto.randomUUID(),
// //       type,
// //       config,
// //       position: this.sections().length,
// //       isActive: true,
// //       dataSource: def.dataSource.includes('smart') ? 'smart' : 'static'
// //     };

// //     this.sections.update(s => [...s, newSection]);
// //     this.selectSection(newSection);
// //     this.showAddMenu.set(false);
    
// //     // Scroll to bottom of preview (optional UX enhancement)
// //     setTimeout(() => {
// //         const previewEl = document.getElementById('preview-container');
// //         if(previewEl) previewEl.scrollTop = previewEl.scrollHeight;
// //     }, 100);
// //   }

// //   selectSection(section: any) {
// //     // Create a deep copy to prevent reference issues during editing
// //     this.selectedSection.set(JSON.parse(JSON.stringify(section)));
// //   }

// //   onConfigChange(newConfig: any) {
// //     const current = this.selectedSection();
// //     if (!current) return;

// //     const updated = { 
// //       ...current, 
// //       config: { ...current.config, ...newConfig } 
// //     };
    
// //     // 1. Update the list (for preview)
// //     this.sections.update(list => 
// //       list.map(s => s.id === updated.id ? updated : s)
// //     );
    
// //     // 2. Update selected (to keep form in sync without rebuilding)
// //     // Note: ConfigForm handles debouncing
// //     this.selectedSection.set(updated);
// //   }

// //   deleteSection(id: string, event: Event) {
// //     event.stopPropagation();
// //     if(!confirm('Delete this section?')) return;

// //     this.sections.update(list => list.filter(s => s.id !== id));
// //     if (this.selectedSection()?.id === id) {
// //       this.selectedSection.set(null);
// //     }
// //   }

// //   // --- Drag & Drop ---

// //   drop(event: CdkDragDrop<any[]>) {
// //     const list = [...this.sections()];
// //     moveItemInArray(list, event.previousIndex, event.currentIndex);
    
// //     // Re-assign positions
// //     const reordered = list.map((s, i) => ({ ...s, position: i }));
// //     this.sections.set(reordered);
// //   }

// //   // --- Persistence ---

// //   savePage() {
// //     const pageId = this.page()._id || this.page().id;
// //     if (!pageId) return;

// //     this.isSaving.set(true);
    
// //     const payload = {
// //       sections: this.sections().map((s, i) => ({
// //         type: s.type,
// //         config: s.config,
// //         position: i,
// //         isActive: s.isActive,
// //         dataSource: s.dataSource
// //         // Don't send temporary UUID 'id', backend generates new ones or updates existing
// //       }))
// //     };

// //     this.adminService.updatePage(pageId, payload).subscribe({
// //       next: () => {
// //         this.isSaving.set(false);
// //         // alert('Saved!'); // Or use Toast service
// //       },
// //       error: (err) => {
// //         console.error(err);
// //         this.isSaving.set(false);
// //         alert('Save failed');
// //       }
// //     });
// //   }
// // }

// // // import { Component, OnInit, inject, signal } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { ActivatedRoute, RouterModule } from '@angular/router';
// // // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // // // Public preview components
// // // import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// // // import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';

// // // import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// // // /* -------------------------------------------------------------------------- */
// // // /* TYPES                                   */
// // // /* -------------------------------------------------------------------------- */

// // // type SectionType =
// // //   | 'hero_banner'
// // //   | 'product_slider'
// // //   | 'feature_grid'
// // //   | 'text_content'
// // //   | 'product_grid'
// // //   | 'category_grid'
// // //   | 'map_locations';

// // // interface Page {
// // //   _id?: string; // Make optional
// // //   id?: string;  // Add standard id
// // //   name: string;
// // //   isPublished: boolean;
// // //   sections: Section[];
// // //   theme?: {
// // //     primaryColor?: string;
// // //     secondaryColor?: string;
// // //     fontFamily?: string;
// // //   };
// // // }

// // // interface Section {
// // //   id: string;
// // //   type: SectionType;
// // //   config: Record<string, any>;
// // //   position: number;
// // //   isActive: boolean;
// // //   dataSource: 'static' | 'smart' | 'manual' | 'category' | 'dynamic';
// // // }

// // // /* -------------------------------------------------------------------------- */

// // // @Component({
// // //   selector: 'app-page-builder',
// // //   standalone: true,
// // //   imports: [
// // //     CommonModule,
// // //     RouterModule,
// // //     DragDropModule,
// // //     HeroBannerComponent,
// // //     ProductSliderComponent
// // //   ],
// // //   templateUrl: './page-builder.component.html'
// // // })
// // // export class PageBuilderComponent implements OnInit {
// // //   private route = inject(ActivatedRoute);
// // //   private adminService = inject(StorefrontAdminService);

// // //   /* -------------------------------- Signals -------------------------------- */

// // //   page = signal<Page | null>(null);
// // //   sections = signal<Section[]>([]);
// // //   selectedSection = signal<Section | null>(null);
// // //   activeTab = signal<'sections' | 'add'>('sections');

// // //   // Helper to get the ID safely
// // //   private getPageId(): string | undefined {
// // //     const p = this.page();
// // //     // Return _id if it exists, otherwise id, otherwise undefined
// // //     return p?._id || p?.id;
// // //   }
// // //   /* --------------------------- Available Sections --------------------------- */

// // // /* --------------------------- Available Sections --------------------------- */

// // //   readonly availableTypes = [
// // //     { id: 'hero_banner', label: 'Hero Banner', icon: 'image' },      // pi-image
// // //     { id: 'product_slider', label: 'Product Slider', icon: 'images' }, // pi-images
// // //     { id: 'feature_grid', label: 'Feature Grid', icon: 'th-large' }, // pi-th-large
// // //     { id: 'text_content', label: 'Rich Text', icon: 'align-left' }   // pi-align-left
// // //   ] as const;
// // //   /* -------------------------------------------------------------------------- */
// // //   /* LIFECYCLE                                 */
// // //   /* -------------------------------------------------------------------------- */

// // //   ngOnInit(): void {
// // //     const pageId = this.route.snapshot.paramMap.get('id');
// // //     if (pageId) this.loadPage(pageId);
// // //   }

// // //   /* -------------------------------------------------------------------------- */
// // //   /* DATA                                    */
// // //   /* -------------------------------------------------------------------------- */

// // //   private loadPage(id: string): void {
// // //     this.adminService.getPageById(id).subscribe(res => {
// // //       this.page.set(res.page);
// // //       this.sections.set(
// // //         [...(res.page.sections ?? [])].sort((a, b) => a.position - b.position)
// // //       );
// // //     });
// // //   }

// // //   /* -------------------------------------------------------------------------- */
// // //   /* SECTIONS                                  */
// // //   /* -------------------------------------------------------------------------- */

// // //   addSection(type: SectionType): void {
// // //     // 1. Determine valid data source based on backend rules
// // //     let defaultSource: Section['dataSource'] = 'static';

// // //     switch (type) {
// // //       case 'product_slider':
// // //       case 'product_grid':
// // //         // Sliders and Grids require 'smart' source by default
// // //         defaultSource = 'smart'; 
// // //         break;
      
// // //       case 'category_grid':
// // //       case 'map_locations':
// // //         // These fetch data dynamically
// // //         defaultSource = 'dynamic';
// // //         break;
      
// // //       case 'feature_grid':
// // //       case 'hero_banner':
// // //       case 'text_content':
// // //       default:
// // //         defaultSource = 'static';
// // //         break;
// // //     }

// // //     const newSection: Section = {
// // //       id: crypto.randomUUID(),
// // //       type,
// // //       position: this.sections().length,
// // //       isActive: true,
// // //       dataSource: defaultSource, // ✅ Correctly assigned
// // //       config: this.getDefaultConfig(type)
// // //     };

// // //     this.sections.update(prev => [...prev, newSection]);
// // //     this.selectedSection.set(newSection);
// // //     this.activeTab.set('sections');
// // //   }

// // //   deleteSection(id: string, event?: Event): void {
// // //     event?.stopPropagation(); // Prevent clicking the section itself

// // //     this.sections.update(prev => prev.filter(s => s.id !== id));

// // //     if (this.selectedSection()?.id === id) {
// // //       this.selectedSection.set(null);
// // //     }
// // //   }

// // //   selectSection(section: Section): void {
// // //     this.selectedSection.set(section);
// // //   }

// // //   updateConfig(key: string, value: any): void {
// // //     const current = this.selectedSection();
// // //     if (!current) return;

// // //     const updated: Section = {
// // //       ...current,
// // //       config: { ...current.config, [key]: value }
// // //     };

// // //     this.selectedSection.set(updated);

// // //     this.sections.update(prev =>
// // //       prev.map(s => (s.id === updated.id ? updated : s))
// // //     );
// // //   }

// // //   /* -------------------------------------------------------------------------- */
// // //   /* SORTING                                  */
// // //   /* -------------------------------------------------------------------------- */

// // //   drop(event: CdkDragDrop<Section[]>): void {
// // //     const updated = [...this.sections()];
// // //     moveItemInArray(updated, event.previousIndex, event.currentIndex);

// // //     this.sections.set(
// // //       updated.map((s, i) => ({ ...s, position: i }))
// // //     );
// // //   }

// // //   moveUp(section: Section, e: Event): void {
// // //     e.stopPropagation();
// // //     this.swap(section, -1);
// // //   }

// // //   moveDown(section: Section, e: Event): void {
// // //     e.stopPropagation();
// // //     this.swap(section, +1);
// // //   }

// // //   private swap(section: Section, offset: number): void {
// // //     const list = [...this.sections()];
// // //     const index = list.findIndex(s => s.id === section.id);
// // //     const target = index + offset;

// // //     if (target < 0 || target >= list.length) return;

// // //     [list[index], list[target]] = [list[target], list[index]];

// // //     this.sections.set(
// // //       list.map((s, i) => ({ ...s, position: i }))
// // //     );
// // //   }

// // //   /* -------------------------------------------------------------------------- */
// // //   /* SAVE / PUBLISH                              */
// // //   /* -------------------------------------------------------------------------- */

// // //   // savePage(): void {
// // //   //   const page = this.page();
// // //   //   if (!page) return;

// // //   //   this.adminService.updatePage(page._id, {
// // //   //     sections: this.sections().map((s, i) => ({ ...s, position: i }))
// // //   //   }).subscribe({
// // //   //     next: () => alert('✅ Page saved successfully'),
// // //   //     error: (err) => alert('❌ Failed to save page: ' + (err.error?.message || 'Unknown error'))
// // //   //   });
// // //   // }

// // //   // togglePublish(): void {
// // //   //   const page = this.page();
// // //   //   if (!page) return;

// // //   //   // 1. Unpublish Logic
// // //   //   if (page.isPublished) {
// // //   //     if(!confirm('This will hide the page from the public. Continue?')) return;
      
// // //   //     this.adminService.unpublishPage(page._id).subscribe({
// // //   //       next: (res) => {
// // //   //         this.page.set(res.page);
// // //   //         alert('Page is now unpublished (Draft)');
// // //   //       },
// // //   //       error: (err) => alert('❌ Error: ' + err.error?.message)
// // //   //     });
// // //   //     return;
// // //   //   }

// // //   //   // 2. Publish Logic (Auto-Save First)
// // //   //   const updateData = {
// // //   //     sections: this.sections().map((s, i) => ({ ...s, position: i }))
// // //   //   };

// // //   //   // Chain: Save -> Then Publish
// // //   //   this.adminService.updatePage(page._id, updateData).subscribe({
// // //   //     next: () => {
// // //   //       this.adminService.publishPage(page._id).subscribe({
// // //   //         next: (res) => {
// // //   //           this.page.set(res.page);
// // //   //           alert('🚀 Changes saved and Page published live!');
// // //   //         },
// // //   //         error: (err) => alert('Saved, but failed to publish: ' + (err.error?.message || 'Unknown error'))
// // //   //       });
// // //   //     },
// // //   //     error: (err) => alert('❌ Failed to save changes. Publish cancelled.')
// // //   //   });
// // //   // }
// // // /* -------------------------------------------------------------------------- */
// // //   /* SAVE / PUBLISH                              */
// // //   /* -------------------------------------------------------------------------- */

// // //   savePage(): void {
// // //     const pageId = this.getPageId();
    
// // //     if (!pageId) {
// // //       alert('❌ Error: Page ID is missing. Cannot save.');
// // //       console.error('Page object is invalid:', this.page());
// // //       return;
// // //     }

// // //     const updateData = {
// // //       sections: this.sections().map((s, i) => ({ ...s, position: i }))
// // //     };

// // //     this.adminService.updatePage(pageId, updateData).subscribe({
// // //       next: () => alert('✅ Page saved successfully'),
// // //       error: (err) => {
// // //         console.error(err);
// // //         alert('❌ Failed to save: ' + (err.error?.message || 'Unknown error'));
// // //       }
// // //     });
// // //   }

// // //   togglePublish(): void {
// // //     const page = this.page();
// // //     const pageId = this.getPageId();

// // //     if (!page || !pageId) {
// // //       alert('❌ Error: Page data missing.');
// // //       return;
// // //     }

// // //     // 1. Unpublish Logic
// // //     if (page.isPublished) {
// // //       if(!confirm('This will hide the page from the public. Continue?')) return;
      
// // //       this.adminService.unpublishPage(pageId).subscribe({
// // //         next: (res) => {
// // //           this.page.set(res.page);
// // //           alert('Page is now unpublished (Draft)');
// // //         },
// // //         error: (err) => alert('❌ Error: ' + err.error?.message)
// // //       });
// // //       return;
// // //     }

// // //     // 2. Publish Logic (Auto-Save First)
// // //     const updateData = {
// // //       sections: this.sections().map((s, i) => ({ ...s, position: i }))
// // //     };

// // //     this.adminService.updatePage(pageId, updateData).subscribe({
// // //       next: () => {
// // //         this.adminService.publishPage(pageId).subscribe({
// // //           next: (res) => {
// // //             this.page.set(res.page);
// // //             alert('🚀 Changes saved and Page published live!');
// // //           },
// // //           error: (err) => alert('Saved, but failed to publish: ' + (err.error?.message || 'Unknown error'))
// // //         });
// // //       },
// // //       error: (err) => alert('❌ Failed to save changes. Publish cancelled.')
// // //     });
// // //   }
// // //   /* -------------------------------------------------------------------------- */
// // //   /* HELPERS                                  */
// // //   /* -------------------------------------------------------------------------- */

// // //   private getDefaultConfig(type: SectionType): Record<string, any> {
// // //     switch (type) {
// // //       case 'hero_banner':
// // //         return {
// // //           title: 'Hero Title',
// // //           subtitle: 'Hero subtitle',
// // //           backgroundImage: 'https://via.placeholder.com/1920x600'
// // //         };

// // //       case 'product_slider':
// // //         return {
// // //           title: 'Featured Products',
// // //           subtitle: '',
// // //           ruleType: 'new_arrivals', // Default collection
// // //           limit: 8,
// // //           itemsPerView: 4
// // //         };

// // //       case 'feature_grid':
// // //         return {
// // //           title: 'Why Choose Us',
// // //           features: []
// // //         };

// // //       case 'text_content':
// // //         return {
// // //           title: 'Text Section',
// // //           content: ''
// // //         };

// // //       default:
// // //         return {};
// // //     }
// // //   }
// // // }
