import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy, 
  ViewEncapsulation,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { combineLatest, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

// ✅ PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

// ✅ Services
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    ButtonModule, 
    TooltipModule, 
    ToastModule,
    SkeletonModule,
    TagModule
  ],
  providers: [MessageService],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.4s ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ProductDetailComponent implements OnInit {
  // Dependencies
  private route = inject(ActivatedRoute);
  private publicService = inject(StorefrontPublicService);
  private stateService = inject(StorefrontStateService);
  private titleService = inject(Title);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef); // Modern version of your `destroy$` Subject

  // --- State Signals ---
  product = signal<any>(null);
  loading = signal(true);
  
  // Visuals
  selectedImage = signal<string>('');
  
  // Cart Logic
  quantity = signal(1);
  orgSlug = signal('');
  
  // Variants
  variants = signal<any[]>([]);
  selectedVariant = signal<any>(null);

  // UI State
  openAccordion = signal<string>('desc'); 

  // --- Computed ---
  discountPercentage = computed(() => {
    const p = this.product();
    if (!p || !p.price?.hasDiscount) return 0;
    const original = Number(p.price.original);
    const discounted = Number(p.price.discounted);
    return original ? Math.round(((original - discounted) / original) * 100) : 0;
  });

  ambientColor = computed(() => {
    return this.selectedVariant()?.ambient || 'rgba(0,0,0,0.1)';
  });

  ngOnInit() {
    this.setupRouteListener();
  }

  private setupRouteListener() {
    // 1. Safe access to Parent Params (Org)
    const parentParams$ = this.route.parent 
      ? this.route.parent.paramMap 
      : of(new Map<string, string>()); // Fallback if no parent

    // 2. Combine Parent (Org) and Child (Product Slug) params
    combineLatest([parentParams$, this.route.paramMap])
      .pipe(
        takeUntilDestroyed(this.destroyRef), // Auto-unsubscribe logic
        tap(() => this.loading.set(true)), // Show loader immediately on nav
        
        // 3. SwitchMap handles the API call (cancels old requests if user clicks fast)
        switchMap(([parentParams, childParams]) => {
            const org = parentParams.get('orgSlug') || '';
            const slug = childParams.get('productSlug') || '';
            
            this.orgSlug.set(org);

            if (org && slug) {
                return this.publicService.getProductBySlug(org, slug).pipe(
                    catchError(err => {
                        console.error('Error loading product:', err);
                        this.loading.set(false);
                        return of(null); // Keep stream alive on error
                    })
                );
            }
            return of(null);
        })
      )
      .subscribe((res: any) => {
        if (res) {
            this.handleProductLoad(res);
        } else {
            this.loading.set(false);
        }
      });
  }
  
  private handleProductLoad(res: any) {
    this.product.set(res.product);
    this.stateService.setState(res);

    // Image Setup
    if (res.product.images?.length) {
      this.selectedImage.set(res.product.images[0]);
    } else {
      this.selectedImage.set('assets/placeholder.png'); 
    }

    // Variant Setup (If API returns them, otherwise use defaults)
    if (res.product.variants?.length) {
        this.variants.set(res.product.variants);
    } else {
        // Fallback variants if none provided
        this.variants.set([
            { name: 'Standard', code: 'STD', colorCode: '#333333', ambient: 'rgba(0,0,0,0.1)' }
        ]);
    }
    this.selectedVariant.set(this.variants()[0]);

    // SEO
    const title = res.seo?.title || res.product.name;
    this.titleService.setTitle(title);
    
    this.loading.set(false);
  }

  // --- Actions ---

  changeImage(url: string) {
    this.selectedImage.set(url);
  }

  selectVariant(variant: any) {
    this.selectedVariant.set(variant);
  }

  updateQuantity(delta: number) {
    this.quantity.update(q => {
      const newVal = q + delta;
      return newVal < 1 ? 1 : newVal;
    });
  }

  toggleAccordion(section: string) {
    this.openAccordion.update(curr => curr === section ? '' : section);
  }

  addToCart() {
    const product = this.product();
    if (!product) return;
    
    this.messageService.add({ 
        key: 'pd', // Targets the specific toast in this template
        severity: 'success', 
        summary: 'Added to Bag', 
        detail: `${this.quantity()}x ${product.name}` 
    });
  }
}

// import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { Title } from '@angular/platform-browser';
// import { FormsModule } from '@angular/forms';
// import { combineLatest, of } from 'rxjs'; // 'of' needed for fallback
// import { switchMap, tap, catchError } from 'rxjs/operators';
// import { animate, style, transition, trigger } from '@angular/animations';

// // PrimeNG & UI
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';

// // Services
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service';

// // Define Interface for Type Safety
// interface ProductVariant {
//   name: string;
//   code: string;
//   colorCode: string;
//   ambient?: string;
// }

// @Component({
//   selector: 'app-product-detail',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     RouterModule, 
//     FormsModule, 
//     ButtonModule, 
//     TooltipModule, 
//     ToastModule
//   ],
//   providers: [MessageService], // Note: This creates a local toast instance
//   templateUrl: './product-detail.component.html',
//   styleUrls: ['./product-detail.component.scss'],
//   animations: [
//     trigger('fadeUp', [
//       transition(':enter', [
//         style({ opacity: 0, transform: 'translateY(30px)' }),
//         animate('0.8s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//       ])
//     ]),
//     trigger('fadeIn', [
//       transition(':enter', [
//         style({ opacity: 0 }),
//         animate('0.6s ease-out', style({ opacity: 1 }))
//       ])
//     ])
//   ]
// })
// export class ProductDetailComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private publicService = inject(StorefrontPublicService);
//   private stateService = inject(StorefrontStateService);
//   private titleService = inject(Title);
//   private messageService = inject(MessageService);
//   private destroyRef = inject(DestroyRef); // 1. Inject DestroyRef for cleanup

//   // --- State ---
//   product = signal<any>(null);
//   loading = signal(true);
  
//   // Visuals
//   selectedImage = signal<string>('');
  
//   // Cart Logic
//   quantity = signal(1);
//   orgSlug = signal('');
  
//   // 2. Default variants as fallback, but type them properly
//   variants = signal<ProductVariant[]>([
//     { name: 'Standard', code: 'STD', colorCode: '#333333', ambient: 'rgba(0,0,0,0.1)' }
//   ]);
//   selectedVariant = signal<ProductVariant | null>(null);

//   openAccordion = signal<string>('desc'); 

//   // --- Computed ---
//   discountPercentage = computed(() => {
//     const p = this.product();
//     if (!p || !p.price?.hasDiscount) return 0;
//     const original = Number(p.price.original);
//     const discounted = Number(p.price.discounted);
//     return original ? Math.round(((original - discounted) / original) * 100) : 0;
//   });

//   ambientColor = computed(() => {
//     return this.selectedVariant()?.ambient || 'rgba(0,0,0,0.1)';
//   });

//   ngOnInit() {
//     const parentParams$ = this.route.parent ? this.route.parent.paramMap : of(new Map());
//     combineLatest([parentParams$, this.route.paramMap])
//       .pipe(
//         takeUntilDestroyed(this.destroyRef), 
//         tap(() => this.loading.set(true)), 
//         switchMap(([parentParams, childParams]) => {
//             const org = parentParams.get('orgSlug') || childParams.get('orgSlug') || '';
//             const slug = childParams.get('productSlug') || '';
            
//             this.orgSlug.set(org);

//             if (org && slug) {
//                 // Return the http observable here to chain it cleanly
//                 return this.publicService.getProductBySlug(org, slug).pipe(
//                     catchError(err => {
//                         console.error('Error loading product:', err);
//                         this.loading.set(false);
//                         return of(null); // Return null to keep stream alive
//                     })
//                 );
//             }
//             this.loading.set(false);
//             return of(null);
//         })
//       )
//       .subscribe((res: any) => {
//         if (res) {
//             this.handleProductLoad(res);
//         }
//       });
//   }
  
//   // Refactored Logic for cleaner subscription
//   handleProductLoad(res: any) {
//     this.product.set(res.product);
//     this.stateService.setState(res);

//     // Image Handling
//     if (res.product.images?.length) {
//       this.selectedImage.set(res.product.images[0]);
//     } else {
//       this.selectedImage.set('assets/placeholder.png'); 
//     }

//     // 4. FIX: Use API variants if available, otherwise fallback
//     if (res.product.variants && res.product.variants.length > 0) {
//         this.variants.set(res.product.variants); // Update signal with REAL data
//     } 
//     // If no variants, maybe clear the list or keep default? 
//     // Here we ensure selectedVariant is valid
//     this.selectedVariant.set(this.variants()[0]);

//     const title = res.seo?.title || res.product.name;
//     this.titleService.setTitle(title);
//     this.loading.set(false);
//   }

//   // --- Actions ---
//   changeImage(url: string) {
//     this.selectedImage.set(url);
//   }

//   selectVariant(variant: ProductVariant) {
//     this.selectedVariant.set(variant);
//   }

//   updateQuantity(delta: number) {
//     this.quantity.update(q => Math.max(1, q + delta));
//   }

//   toggleAccordion(section: string) {
//     this.openAccordion.update(curr => curr === section ? '' : section);
//   }

//   addToCart() {
//     const product = this.product();
//     if (!product) return;
//     this.messageService.add({ 
//         severity: 'success', 
//         summary: 'Added to Bag', 
//         detail: `${this.quantity()}x ${product.name}` 
//     });
//   }
// }