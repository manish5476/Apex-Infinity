import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// Public preview components
import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';

import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

/* -------------------------------------------------------------------------- */
/* TYPES                                   */
/* -------------------------------------------------------------------------- */

type SectionType =
  | 'hero_banner'
  | 'product_slider'
  | 'feature_grid'
  | 'text_content'
  | 'product_grid'
  | 'category_grid'
  | 'map_locations';

interface Page {
  _id?: string; // Make optional
  id?: string;  // Add standard id
  name: string;
  isPublished: boolean;
  sections: Section[];
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

interface Section {
  id: string;
  type: SectionType;
  config: Record<string, any>;
  position: number;
  isActive: boolean;
  dataSource: 'static' | 'smart' | 'manual' | 'category' | 'dynamic';
}

/* -------------------------------------------------------------------------- */

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DragDropModule,
    HeroBannerComponent,
    ProductSliderComponent
  ],
  templateUrl: './page-builder.component.html'
})
export class PageBuilderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(StorefrontAdminService);

  /* -------------------------------- Signals -------------------------------- */

  page = signal<Page | null>(null);
  sections = signal<Section[]>([]);
  selectedSection = signal<Section | null>(null);
  activeTab = signal<'sections' | 'add'>('sections');

  // Helper to get the ID safely
  private getPageId(): string | undefined {
    const p = this.page();
    // Return _id if it exists, otherwise id, otherwise undefined
    return p?._id || p?.id;
  }
  /* --------------------------- Available Sections --------------------------- */

/* --------------------------- Available Sections --------------------------- */

  readonly availableTypes = [
    { id: 'hero_banner', label: 'Hero Banner', icon: 'image' },      // pi-image
    { id: 'product_slider', label: 'Product Slider', icon: 'images' }, // pi-images
    { id: 'feature_grid', label: 'Feature Grid', icon: 'th-large' }, // pi-th-large
    { id: 'text_content', label: 'Rich Text', icon: 'align-left' }   // pi-align-left
  ] as const;
  /* -------------------------------------------------------------------------- */
  /* LIFECYCLE                                 */
  /* -------------------------------------------------------------------------- */

  ngOnInit(): void {
    const pageId = this.route.snapshot.paramMap.get('id');
    if (pageId) this.loadPage(pageId);
  }

  /* -------------------------------------------------------------------------- */
  /* DATA                                    */
  /* -------------------------------------------------------------------------- */

  private loadPage(id: string): void {
    this.adminService.getPageById(id).subscribe(res => {
      this.page.set(res.page);
      this.sections.set(
        [...(res.page.sections ?? [])].sort((a, b) => a.position - b.position)
      );
    });
  }

  /* -------------------------------------------------------------------------- */
  /* SECTIONS                                  */
  /* -------------------------------------------------------------------------- */

  addSection(type: SectionType): void {
    // 1. Determine valid data source based on backend rules
    let defaultSource: Section['dataSource'] = 'static';

    switch (type) {
      case 'product_slider':
      case 'product_grid':
        // Sliders and Grids require 'smart' source by default
        defaultSource = 'smart'; 
        break;
      
      case 'category_grid':
      case 'map_locations':
        // These fetch data dynamically
        defaultSource = 'dynamic';
        break;
      
      case 'feature_grid':
      case 'hero_banner':
      case 'text_content':
      default:
        defaultSource = 'static';
        break;
    }

    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      position: this.sections().length,
      isActive: true,
      dataSource: defaultSource, // ✅ Correctly assigned
      config: this.getDefaultConfig(type)
    };

    this.sections.update(prev => [...prev, newSection]);
    this.selectedSection.set(newSection);
    this.activeTab.set('sections');
  }

  deleteSection(id: string, event?: Event): void {
    event?.stopPropagation(); // Prevent clicking the section itself

    this.sections.update(prev => prev.filter(s => s.id !== id));

    if (this.selectedSection()?.id === id) {
      this.selectedSection.set(null);
    }
  }

  selectSection(section: Section): void {
    this.selectedSection.set(section);
  }

  updateConfig(key: string, value: any): void {
    const current = this.selectedSection();
    if (!current) return;

    const updated: Section = {
      ...current,
      config: { ...current.config, [key]: value }
    };

    this.selectedSection.set(updated);

    this.sections.update(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
  }

  /* -------------------------------------------------------------------------- */
  /* SORTING                                  */
  /* -------------------------------------------------------------------------- */

  drop(event: CdkDragDrop<Section[]>): void {
    const updated = [...this.sections()];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);

    this.sections.set(
      updated.map((s, i) => ({ ...s, position: i }))
    );
  }

  moveUp(section: Section, e: Event): void {
    e.stopPropagation();
    this.swap(section, -1);
  }

  moveDown(section: Section, e: Event): void {
    e.stopPropagation();
    this.swap(section, +1);
  }

  private swap(section: Section, offset: number): void {
    const list = [...this.sections()];
    const index = list.findIndex(s => s.id === section.id);
    const target = index + offset;

    if (target < 0 || target >= list.length) return;

    [list[index], list[target]] = [list[target], list[index]];

    this.sections.set(
      list.map((s, i) => ({ ...s, position: i }))
    );
  }

  /* -------------------------------------------------------------------------- */
  /* SAVE / PUBLISH                              */
  /* -------------------------------------------------------------------------- */

  // savePage(): void {
  //   const page = this.page();
  //   if (!page) return;

  //   this.adminService.updatePage(page._id, {
  //     sections: this.sections().map((s, i) => ({ ...s, position: i }))
  //   }).subscribe({
  //     next: () => alert('✅ Page saved successfully'),
  //     error: (err) => alert('❌ Failed to save page: ' + (err.error?.message || 'Unknown error'))
  //   });
  // }

  // togglePublish(): void {
  //   const page = this.page();
  //   if (!page) return;

  //   // 1. Unpublish Logic
  //   if (page.isPublished) {
  //     if(!confirm('This will hide the page from the public. Continue?')) return;
      
  //     this.adminService.unpublishPage(page._id).subscribe({
  //       next: (res) => {
  //         this.page.set(res.page);
  //         alert('Page is now unpublished (Draft)');
  //       },
  //       error: (err) => alert('❌ Error: ' + err.error?.message)
  //     });
  //     return;
  //   }

  //   // 2. Publish Logic (Auto-Save First)
  //   const updateData = {
  //     sections: this.sections().map((s, i) => ({ ...s, position: i }))
  //   };

  //   // Chain: Save -> Then Publish
  //   this.adminService.updatePage(page._id, updateData).subscribe({
  //     next: () => {
  //       this.adminService.publishPage(page._id).subscribe({
  //         next: (res) => {
  //           this.page.set(res.page);
  //           alert('🚀 Changes saved and Page published live!');
  //         },
  //         error: (err) => alert('Saved, but failed to publish: ' + (err.error?.message || 'Unknown error'))
  //       });
  //     },
  //     error: (err) => alert('❌ Failed to save changes. Publish cancelled.')
  //   });
  // }
/* -------------------------------------------------------------------------- */
  /* SAVE / PUBLISH                              */
  /* -------------------------------------------------------------------------- */

  savePage(): void {
    const pageId = this.getPageId();
    
    if (!pageId) {
      alert('❌ Error: Page ID is missing. Cannot save.');
      console.error('Page object is invalid:', this.page());
      return;
    }

    const updateData = {
      sections: this.sections().map((s, i) => ({ ...s, position: i }))
    };

    this.adminService.updatePage(pageId, updateData).subscribe({
      next: () => alert('✅ Page saved successfully'),
      error: (err) => {
        console.error(err);
        alert('❌ Failed to save: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }

  togglePublish(): void {
    const page = this.page();
    const pageId = this.getPageId();

    if (!page || !pageId) {
      alert('❌ Error: Page data missing.');
      return;
    }

    // 1. Unpublish Logic
    if (page.isPublished) {
      if(!confirm('This will hide the page from the public. Continue?')) return;
      
      this.adminService.unpublishPage(pageId).subscribe({
        next: (res) => {
          this.page.set(res.page);
          alert('Page is now unpublished (Draft)');
        },
        error: (err) => alert('❌ Error: ' + err.error?.message)
      });
      return;
    }

    // 2. Publish Logic (Auto-Save First)
    const updateData = {
      sections: this.sections().map((s, i) => ({ ...s, position: i }))
    };

    this.adminService.updatePage(pageId, updateData).subscribe({
      next: () => {
        this.adminService.publishPage(pageId).subscribe({
          next: (res) => {
            this.page.set(res.page);
            alert('🚀 Changes saved and Page published live!');
          },
          error: (err) => alert('Saved, but failed to publish: ' + (err.error?.message || 'Unknown error'))
        });
      },
      error: (err) => alert('❌ Failed to save changes. Publish cancelled.')
    });
  }
  /* -------------------------------------------------------------------------- */
  /* HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  private getDefaultConfig(type: SectionType): Record<string, any> {
    switch (type) {
      case 'hero_banner':
        return {
          title: 'Hero Title',
          subtitle: 'Hero subtitle',
          backgroundImage: 'https://via.placeholder.com/1920x600'
        };

      case 'product_slider':
        return {
          title: 'Featured Products',
          subtitle: '',
          ruleType: 'new_arrivals', // Default collection
          limit: 8,
          itemsPerView: 4
        };

      case 'feature_grid':
        return {
          title: 'Why Choose Us',
          features: []
        };

      case 'text_content':
        return {
          title: 'Text Section',
          content: ''
        };

      default:
        return {};
    }
  }
}

// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // Public preview components
// import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';

// import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// /* -------------------------------------------------------------------------- */
// /* TYPES                                    */
// /* -------------------------------------------------------------------------- */

// type SectionType =
//   | 'hero_banner'
//   | 'product_slider'
//   | 'feature_grid'
//   | 'text_content'
//   | 'product_grid'
//   | 'category_grid'
//   | 'map_locations'

// interface Page {
//   _id: string;
//   name: string;
//   isPublished: boolean;
//   sections: Section[];
//   theme?: {
//     primaryColor?: string;
//     secondaryColor?: string;
//     fontFamily?: string;
//   };
// }

// // src/app/modules/storefront-admin/pages/page-builder/page-builder.component.ts

// interface Section {
//   id: string;
//   type: SectionType;
//   config: Record<string, any>;
//   position: number;
//   isActive: boolean;
//   // UPDATE THIS LINE to match backend:
//   dataSource: 'static' | 'smart' | 'manual' | 'category' | 'dynamic';
// }

// /* -------------------------------------------------------------------------- */

// @Component({
//   selector: 'app-page-builder',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     DragDropModule,
//     HeroBannerComponent,
//     ProductSliderComponent
//   ],
//   templateUrl: './page-builder.component.html'
// })
// export class PageBuilderComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private adminService = inject(StorefrontAdminService);

//   /* -------------------------------- Signals -------------------------------- */

//   page = signal<Page | null>(null);
//   sections = signal<Section[]>([]);
//   selectedSection = signal<Section | null>(null);
//   activeTab = signal<'sections' | 'add'>('sections');

//   /* --------------------------- Available Sections --------------------------- */

//   readonly availableTypes = [
//     { id: 'hero_banner', label: 'Hero Banner', icon: 'image' },
//     { id: 'product_slider', label: 'Product Slider', icon: 'layer-group' },
//     { id: 'feature_grid', label: 'Feature Grid', icon: 'th-large' },
//     { id: 'text_content', label: 'Rich Text', icon: 'paragraph' }
//   ] as const;

//   /* -------------------------------------------------------------------------- */
//   /* LIFECYCLE                                 */
//   /* -------------------------------------------------------------------------- */

//   ngOnInit(): void {
//     const pageId = this.route.snapshot.paramMap.get('id');
//     if (pageId) this.loadPage(pageId);
//   }

//   /* -------------------------------------------------------------------------- */
//   /* DATA                                    */
//   /* -------------------------------------------------------------------------- */

//   private loadPage(id: string): void {
//     this.adminService.getPageById(id).subscribe(res => {
//       this.page.set(res.page);
//       this.sections.set(
//         [...(res.page.sections ?? [])].sort((a, b) => a.position - b.position)
//       );
//     });
//   }

//   /* -------------------------------------------------------------------------- */
//   /* SECTIONS                                  */
//   /* -------------------------------------------------------------------------- */

//   // addSection(type: SectionType): void {
//   //   // Determine valid data source based on backend rules
//   //   let defaultSource: Section['dataSource'] = 'static';

//   //   switch (type) {
//   //     case 'product_slider':
//   //       defaultSource = 'smart'; // Sliders need smart rules
//   //       break;
//   //     case 'product_grid':
//   //       defaultSource = 'smart';
//   //       break;
//   //     case 'text_content':
//   //     case 'feature_grid':
//   //     case 'hero_banner':
//   //     default:
//   //       defaultSource = 'static';
//   //       break;
//   //   }

//   //   const newSection: Section = {
//   //     id: crypto.randomUUID(),
//   //     type,
//   //     position: this.sections().length,
//   //     isActive: true,
//   //     dataSource: defaultSource,
//   //     config: this.getDefaultConfig(type)
//   //   };

//   //   this.sections.update(prev => [...prev, newSection]);
//   //   this.selectedSection.set(newSection);
//   //   this.activeTab.set('sections');
//   // }
// // src/app/modules/storefront-admin/pages/page-builder/page-builder.component.ts

//   // addSection(type: SectionType): void {
//   //   // 1. Determine valid data source based on backend rules
//   //   let defaultSource: Section['dataSource'] = 'static';

//   //   switch (type) {
//   //     case 'product_slider':
//   //       // Backend requires 'smart', 'manual', or 'category'. We default to 'smart'.
//   //       defaultSource = 'smart'; 
//   //       break;
        
//   //     case 'feature_grid':
//   //     case 'hero_banner':
//   //     case 'text_content':
//   //       defaultSource = 'static';
//   //       break;
        
//   //     default:
//   //       defaultSource = 'static';
//   //   }

//   //   const newSection: Section = {
//   //     id: crypto.randomUUID(),
//   //     type,
//   //     position: this.sections().length,
//   //     isActive: true,
//   //     dataSource: defaultSource, // ✅ Use the correct source here
//   //     config: this.getDefaultConfig(type)
//   //   };

//   //   this.sections.update(prev => [...prev, newSection]);
//   //   this.selectedSection.set(newSection);
//   //   this.activeTab.set('sections');
//   // }
// addSection(type: SectionType): void {
//     // 1. Determine valid data source based on backend rules
//     let defaultSource: 'static' | 'smart' | 'manual' | 'category' | 'dynamic' = 'static';

//     switch (type) {
//       case 'product_slider':
//       case 'product_grid':
//         defaultSource = 'smart'; // ✅ Sliders default to smart rules
//         break;
//       case 'category_grid':
//       case 'map_locations':
//         defaultSource = 'dynamic';
//         break;
//       default:
//         defaultSource = 'static';
//     }

//     const newSection: Section = {
//       id: crypto.randomUUID(),
//       type,
//       position: this.sections().length,
//       isActive: true,
//       dataSource: defaultSource, // ✅ Use the correct source
//       config: this.getDefaultConfig(type)
//     };

//     this.sections.update(prev => [...prev, newSection]);
//     this.selectedSection.set(newSection);
//     this.activeTab.set('sections');
//   }

//   deleteSection(id: string, event?: Event): void {
//     event?.stopPropagation();
//     this.sections.update(prev => prev.filter(s => s.id !== id));
//     if (this.selectedSection()?.id === id) {
//       this.selectedSection.set(null);
//     }
//   }

//   selectSection(section: Section): void {
//     this.selectedSection.set(section);
//   }

//   updateConfig(key: string, value: any): void {
//     const current = this.selectedSection();
//     if (!current) return;

//     const updated: Section = {
//       ...current,
//       config: { ...current.config, [key]: value }
//     };

//     this.selectedSection.set(updated);

//     this.sections.update(prev =>
//       prev.map(s => (s.id === updated.id ? updated : s))
//     );
//   }

//   /* -------------------------------------------------------------------------- */
//   /* SORTING                                  */
//   /* -------------------------------------------------------------------------- */

//   drop(event: CdkDragDrop<Section[]>): void {
//     const updated = [...this.sections()];
//     moveItemInArray(updated, event.previousIndex, event.currentIndex);
//     this.sections.set(
//       updated.map((s, i) => ({ ...s, position: i }))
//     );
//   }

//   moveUp(section: Section, e: Event): void {
//     e.stopPropagation();
//     this.swap(section, -1);
//   }

//   moveDown(section: Section, e: Event): void {
//     e.stopPropagation();
//     this.swap(section, +1);
//   }

//   private swap(section: Section, offset: number): void {
//     const list = [...this.sections()];
//     const index = list.findIndex(s => s.id === section.id);
//     const target = index + offset;
//     if (target < 0 || target >= list.length) return;
//     [list[index], list[target]] = [list[target], list[index]];
//     this.sections.set(
//       list.map((s, i) => ({ ...s, position: i }))
//     );
//   }

//   /* -------------------------------------------------------------------------- */
//   /* SAVE / PUBLISH                              */
//   /* -------------------------------------------------------------------------- */

//   savePage(): void {
//     const page = this.page();
//     if (!page) return;

//     this.adminService.updatePage(page._id, {
//       sections: this.sections().map((s, i) => ({ ...s, position: i }))
//     }).subscribe({
//       next: () => alert('✅ Page saved successfully'),
//       error: (err) => alert('❌ Failed to save page: ' + (err.error?.message || 'Unknown error'))
//     });
//   }

//   togglePublish(): void {
//     const page = this.page();
//     if (!page) return;

//     if (page.isPublished) {
//       if(!confirm('This will hide the page from the public. Continue?')) return;
//       this.adminService.unpublishPage(page._id).subscribe(res => {
//         this.page.set(res.page);
//         alert('Page is now unpublished (Draft)');
//       });
//       return;
//     }

//     // Save first, then publish
//     const updateData = {
//       sections: this.sections().map((s, i) => ({ ...s, position: i }))
//     };

//     this.adminService.updatePage(page._id, updateData).subscribe({
//       next: () => {
//         this.adminService.publishPage(page._id).subscribe({
//           next: (res) => {
//             this.page.set(res.page);
//             alert('🚀 Changes saved and Page published live!');
//           },
//           error: (err) => alert('Saved, but failed to publish: ' + (err.error?.message || 'Unknown error'))
//         });
//       },
//       error: (err) => alert('❌ Failed to save changes. Publish cancelled.')
//     });
//   }

//   /* -------------------------------------------------------------------------- */
//   /* HELPERS                                  */
//   /* -------------------------------------------------------------------------- */

//   private getDefaultConfig(type: SectionType): Record<string, any> {
//     switch (type) {
//       case 'hero_banner':
//         return {
//           title: 'Hero Title',
//           subtitle: 'Hero subtitle',
//           backgroundImage: 'https://via.placeholder.com/1920x600'
//         };

//       case 'product_slider':
//         return {
//           title: 'Featured Products',
//           subtitle: '',
//           ruleType: 'new_arrivals', // Default collection
//           limit: 8,
//           itemsPerView: 4
//         };

//       case 'feature_grid':
//         return {
//           title: 'Why Choose Us',
//           features: []
//         };

//       case 'text_content':
//         return {
//           title: 'Text Section',
//           content: ''
//         };

//       default:
//         return {};
//     }
//   }
// }

// // import { Component, OnInit, inject, signal } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { ActivatedRoute, RouterModule } from '@angular/router';
// // import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// // // Public preview components (ensure these paths are correct in your project)
// // import { HeroBannerComponent } from '../../../storefront-public/sections/hero-banner/hero-banner.component';
// // import { ProductSliderComponent } from '../../../storefront-public/sections/product-slider/product-slider.component';

// // import { StorefrontAdminService } from '../../../../core/services/storefront-admin.service';

// // /* -------------------------------------------------------------------------- */
// // /* TYPES                                    */
// // /* -------------------------------------------------------------------------- */

// // type SectionType =
// //   | 'hero_banner'
// //   | 'product_slider'
// //   | 'feature_grid'
// //   | 'text_content';

// // interface Page {
// //   _id: string;
// //   name: string;
// //   isPublished: boolean;
// //   sections: Section[];
// //   theme?: { // Added theme interface for type safety in template
// //     primaryColor?: string;
// //     secondaryColor?: string;
// //     fontFamily?: string;
// //   };
// // }

// // // Update the interface to match backend options
// // interface Section {
// //   id: string;
// //   type: SectionType;
// //   config: Record<string, any>;
// //   position: number;
// //   isActive: boolean;
// //   // UPDATE THIS LINE:
// //   dataSource: 'static' | 'smart' | 'manual' | 'category' | 'dynamic'; 
// // }


// // /* -------------------------------------------------------------------------- */

// // @Component({
// //   selector: 'app-page-builder',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     DragDropModule,
// //     HeroBannerComponent,
// //     ProductSliderComponent
// //   ],
// //   templateUrl: './page-builder.component.html'
// // })
// // export class PageBuilderComponent implements OnInit {
// //   private route = inject(ActivatedRoute);
// //   private adminService = inject(StorefrontAdminService);

// //   /* -------------------------------- Signals -------------------------------- */

// //   page = signal<Page | null>(null);
// //   sections = signal<Section[]>([]);
// //   selectedSection = signal<Section | null>(null);
// //   activeTab = signal<'sections' | 'add'>('sections');

// //   /* --------------------------- Available Sections --------------------------- */

// //   readonly availableTypes = [
// //     { id: 'hero_banner', label: 'Hero Banner', icon: 'image' },
// //     { id: 'product_slider', label: 'Product Slider', icon: 'layer-group' },
// //     { id: 'feature_grid', label: 'Feature Grid', icon: 'th-large' },
// //     { id: 'text_content', label: 'Rich Text', icon: 'paragraph' }
// //   ] as const;

// //   /* -------------------------------------------------------------------------- */
// //   /* LIFECYCLE                                 */
// //   /* -------------------------------------------------------------------------- */

// //   ngOnInit(): void {
// //     const pageId = this.route.snapshot.paramMap.get('id');
// //     if (pageId) this.loadPage(pageId);
// //   }

// //   /* -------------------------------------------------------------------------- */
// //   /* DATA                                    */
// //   /* -------------------------------------------------------------------------- */

// //   private loadPage(id: string): void {
// //     this.adminService.getPageById(id).subscribe(res => {
// //       this.page.set(res.page);
// //       this.sections.set(
// //         [...(res.page.sections ?? [])].sort((a, b) => a.position - b.position)
// //       );
// //     });
// //   }

// //   /* -------------------------------------------------------------------------- */
// //   /* SECTIONS                                  */
// //   /* -------------------------------------------------------------------------- */
// // // ... existing imports

// // /* -------------------------------------------------------------------------- */
// // /* TYPES                                    */
// // /* -------------------------------------------------------------------------- */


// // // ... Component class ...

// //   /* -------------------------------------------------------------------------- */
// //   /* SECTIONS                                  */
// //   /* -------------------------------------------------------------------------- */

// //   addSection(type: SectionType): void {
// //     // 1. Determine the correct default dataSource
// //     let defaultSource: Section['dataSource'] = 'static';

// //     switch (type) {
// //       case 'product_slider':
// //         // Product slider requires 'smart', 'manual', or 'category'. 
// //         // We default to 'smart' (e.g., New Arrivals).
// //         defaultSource = 'smart'; 
// //         break;
// //       case 'hero_banner':
// //       case 'feature_grid':
// //       case 'text_content':
// //       default:
// //         defaultSource = 'static';
// //         break;
// //     }

// //     const newSection: Section = {
// //       id: crypto.randomUUID(),
// //       type,
// //       position: this.sections().length,
// //       isActive: true,
// //       dataSource: defaultSource, // Use the dynamic source
// //       config: this.getDefaultConfig(type)
// //     };

// //     // If it's a product slider, we might need a default smartRuleId in the future
// //     // For now, the backend will likely require either smartRuleId or handle a null one gracefully
// //     // depending on your validation logic.

// //     this.sections.update(prev => [...prev, newSection]);
// //     this.selectedSection.set(newSection);
// //     this.activeTab.set('sections');
// //   }
// //   // addSection(type: SectionType): void {
// //   //   const newSection: Section = {
// //   //     id: crypto.randomUUID(),
// //   //     type,
// //   //     position: this.sections().length,
// //   //     isActive: true,
// //   //     dataSource: 'static',
// //   //     config: this.getDefaultConfig(type)
// //   //   };

// //   //   this.sections.update(prev => [...prev, newSection]);
// //   //   this.selectedSection.set(newSection);
// //   //   this.activeTab.set('sections');
// //   // }

// //   deleteSection(id: string, event?: Event): void {
// //     event?.stopPropagation();

// //     this.sections.update(prev => prev.filter(s => s.id !== id));

// //     if (this.selectedSection()?.id === id) {
// //       this.selectedSection.set(null);
// //     }
// //   }

// //   selectSection(section: Section): void {
// //     this.selectedSection.set(section);
// //   }

// //   updateConfig(key: string, value: any): void {
// //     const current = this.selectedSection();
// //     if (!current) return;

// //     const updated: Section = {
// //       ...current,
// //       config: { ...current.config, [key]: value }
// //     };

// //     this.selectedSection.set(updated);

// //     this.sections.update(prev =>
// //       prev.map(s => (s.id === updated.id ? updated : s))
// //     );
// //   }

// //   /* -------------------------------------------------------------------------- */
// //   /* SORTING                                  */
// //   /* -------------------------------------------------------------------------- */

// //   drop(event: CdkDragDrop<Section[]>): void {
// //     const updated = [...this.sections()];
// //     moveItemInArray(updated, event.previousIndex, event.currentIndex);

// //     this.sections.set(
// //       updated.map((s, i) => ({ ...s, position: i }))
// //     );
// //   }

// //   moveUp(section: Section, e: Event): void {
// //     e.stopPropagation();
// //     this.swap(section, -1);
// //   }

// //   moveDown(section: Section, e: Event): void {
// //     e.stopPropagation();
// //     this.swap(section, +1);
// //   }

// //   private swap(section: Section, offset: number): void {
// //     const list = [...this.sections()];
// //     const index = list.findIndex(s => s.id === section.id);
// //     const target = index + offset;

// //     if (target < 0 || target >= list.length) return;

// //     [list[index], list[target]] = [list[target], list[index]];

// //     this.sections.set(
// //       list.map((s, i) => ({ ...s, position: i }))
// //     );
// //   }

// //   /* -------------------------------------------------------------------------- */
// //   /* SAVE / PUBLISH                              */
// //   /* -------------------------------------------------------------------------- */

// //   savePage(): void {
// //     const page = this.page();
// //     if (!page) return;

// //     this.adminService.updatePage(page._id, {
// //       sections: this.sections().map((s, i) => ({ ...s, position: i }))
// //     }).subscribe({
// //       next: () => alert('✅ Page saved successfully'),
// //       error: (err) => alert('❌ Failed to save page: ' + (err.error?.message || 'Unknown error'))
// //     });
// //   }

// //   togglePublish(): void {
// //     const page = this.page();
// //     if (!page) return;

// //     // 1. If Unpublishing, we just update the status (no need to save UI)
// //     if (page.isPublished) {
// //       if(!confirm('This will hide the page from the public. Continue?')) return;

// //       this.adminService.unpublishPage(page._id).subscribe(res => {
// //         this.page.set(res.page);
// //         alert('Page is now unpublished (Draft)');
// //       });
// //       return;
// //     }

// //     // 2. If Publishing, we MUST save first!
// //     const updateData = {
// //       sections: this.sections().map((s, i) => ({ ...s, position: i }))
// //     };

// //     // Chain the requests: Update -> Then Publish
// //     this.adminService.updatePage(page._id, updateData).subscribe({
// //       next: () => {
// //         // Save successful, now trigger publish
// //         this.adminService.publishPage(page._id).subscribe({
// //           next: (res) => {
// //             this.page.set(res.page);
// //             alert('🚀 Changes saved and Page published live!');
// //           },
// //           error: (err) => alert('Saved, but failed to publish: ' + (err.error?.message || 'Unknown error'))
// //         });
// //       },
// //       error: (err) => alert('❌ Failed to save changes. Publish cancelled.')
// //     });
// //   }

// //   /* -------------------------------------------------------------------------- */
// //   /* HELPERS                                  */
// //   /* -------------------------------------------------------------------------- */

// //   private getDefaultConfig(type: SectionType): Record<string, any> {
// //     switch (type) {
// //       case 'hero_banner':
// //         return {
// //           title: 'Hero Title',
// //           subtitle: 'Hero subtitle',
// //           backgroundImage: ''
// //         };

// //       case 'product_slider':
// //         return {
// //           title: 'Featured Products',
// //           subtitle: ''
// //         };

// //       case 'feature_grid':
// //         return {
// //           title: 'Why Choose Us',
// //           features: []
// //         };

// //       case 'text_content':
// //         return {
// //           title: 'Text Section',
// //           content: ''
// //         };

// //       default:
// //         return {};
// //     }
// //   }
// // }
