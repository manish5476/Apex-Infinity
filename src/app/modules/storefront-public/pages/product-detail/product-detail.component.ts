import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';

// PrimeNG & UI
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
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
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.6s ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicService = inject(StorefrontPublicService);
  private stateService = inject(StorefrontStateService);
  private titleService = inject(Title);
  private messageService = inject(MessageService);

  // --- State ---
  product = signal<any>(null);
  loading = signal(true);
  
  // Visuals
  selectedImage = signal<string>('');
  
  // Cart Logic
  quantity = signal(1);
  orgSlug = signal('');
  
  // Variants with Ambient Colors
  variants = signal([
    { name: 'Jet Black', code: 'BLK', colorCode: '#111111', ambient: 'rgba(0,0,0,0.2)' },
    { name: 'Silver Grey', code: 'SLV', colorCode: '#d1d5db', ambient: 'rgba(209, 213, 219, 0.4)' },
    { name: 'Midnight Blue', code: 'BLU', colorCode: '#1e3a8a', ambient: 'rgba(30, 58, 138, 0.3)' },
    { name: 'Rose Gold', code: 'RGD', colorCode: '#e1ad01', ambient: 'rgba(225, 173, 1, 0.25)' }
  ]);
  selectedVariant = signal<any>(null);

  // UI State
  openAccordion = signal<string>('desc'); 

  // --- Computed ---
  discountPercentage = computed(() => {
    const p = this.product();
    if (!p || !p.price?.hasDiscount) return 0;
    const original = Number(p.price.original);
    const discounted = Number(p.price.discounted);
    if (!original) return 0;
    return Math.round(((original - discounted) / original) * 100);
  });

  // Dynamic Ambient Glow based on selection
  ambientColor = computed(() => {
    return this.selectedVariant()?.ambient || 'rgba(0,0,0,0.1)';
  });

  ngOnInit() {
    if (this.route.parent) {
      combineLatest([
        this.route.parent.paramMap,
        this.route.paramMap
      ]).subscribe(([parentParams, childParams]) => {
        const org = parentParams.get('orgSlug') || '';
        const slug = childParams.get('productSlug') || '';
        this.orgSlug.set(org);

        if (org && slug) this.loadProduct(org, slug);
        else this.loading.set(false);
      });
    }
  }
  
  loadProduct(orgSlug: string, slug: string) {
    this.loading.set(true);
    this.publicService.getProductBySlug(orgSlug, slug).subscribe({
      next: (res: any) => {
        this.product.set(res.product);
        this.stateService.setState(res);

        if (res.product.images?.length) {
          this.selectedImage.set(res.product.images[0]);
        } else {
          this.selectedImage.set('assets/placeholder.png'); 
        }

        this.selectedVariant.set(this.variants()[0]);

        const title = res.seo?.title || res.product.name;
        this.titleService.setTitle(title);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.loading.set(false);
      }
    });
  }

  // --- Actions ---
  changeImage(url: string) {
    this.selectedImage.set(url);
  }

  selectVariant(variant: any) {
    this.selectedVariant.set(variant);
    // Optional: If variants define specific images, switch here
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
        severity: 'success', 
        summary: 'Added to Bag', 
        detail: `${this.quantity()}x ${product.name}` 
    });
  }
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { Title } from '@angular/platform-browser';
// import { FormsModule } from '@angular/forms';
// import { combineLatest } from 'rxjs'; // ✅ Required for joining Parent/Child params

// // PrimeNG Imports
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';

// // Services
// import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
// import { StorefrontStateService } from '../../../../core/services/storefront-state.service'; // ✅ Added

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
//   providers: [MessageService],
//   templateUrl: './product-detail.component.html',
//   styleUrls: ['./product-detail.component.scss']
// })
// export class ProductDetailComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private publicService = inject(StorefrontPublicService);
//   private stateService = inject(StorefrontStateService); // ✅ Inject State Service
//   private titleService = inject(Title);
//   private messageService = inject(MessageService);

//   // --- State ---
//   product = signal<any>(null);
//   loading = signal(true);
  
//   // Visuals
//   selectedImage = signal<string>('');
  
//   // Cart Logic
//   quantity = signal(1);
//   orgSlug = signal('');
  
//   // Mock Variants (Colors)
//   variants = signal([
//     { name: 'Jet Black', code: 'BLK', colorCode: '#111111' },
//     { name: 'Silver Grey', code: 'SLV', colorCode: '#C0C0C0' },
//     { name: 'Midnight Blue', code: 'BLU', colorCode: '#1e3a8a' },
//     { name: 'Rose Gold', code: 'RGD', colorCode: '#e1ad01' }
//   ]);
//   selectedVariant = signal<any>(null);

//   // UI State
//   openAccordion = signal<string>('desc'); 

//   // --- Computed ---
//   discountPercentage = computed(() => {
//     const p = this.product();
//     if (!p || !p.price?.hasDiscount) return 0;
//     const original = Number(p.price.original);
//     const discounted = Number(p.price.discounted);
//     if (!original) return 0;
//     return Math.round(((original - discounted) / original) * 100);
//   });

//   ngOnInit() {
//     // ✅ FIX: Use combineLatest to get Parent Params (orgSlug) AND Child Params (productSlug)
//     if (this.route.parent) {
//       combineLatest([
//         this.route.parent.paramMap, // Contains 'orgSlug'
//         this.route.paramMap         // Contains 'productSlug'
//       ]).subscribe(([parentParams, childParams]) => {
        
//         const org = parentParams.get('orgSlug') || '';
//         const slug = childParams.get('productSlug') || '';
        
//         this.orgSlug.set(org);

//         if (org && slug) {
//           this.loadProduct(org, slug);
//         } else {
//           console.error("Missing URL Parameters", { org, slug });
//           this.loading.set(false);
//         }
//       });
//     }
//   }
  
//   loadProduct(orgSlug: string, slug: string) {
//     this.loading.set(true);
    
//     this.publicService.getProductBySlug(orgSlug, slug).subscribe({
//       next: (res: any) => {
//         // 1. Update Product State
//         this.product.set(res.product);
        
//         // 2. ✅ Update Global Layout (Header/Footer)
//         this.stateService.setState(res);

//         // 3. Set Default Image
//         if (res.product.images?.length) {
//           this.selectedImage.set(res.product.images[0]);
//         } else {
//           this.selectedImage.set('assets/placeholder.png'); // Ensure you have a placeholder
//         }

//         // 4. Set Defaults
//         this.selectedVariant.set(this.variants()[0]);

//         // 5. SEO & Title
//         if (res.seo) {
//           this.titleService.setTitle(res.seo.title || res.product.name);
//         } else {
//           this.titleService.setTitle(res.product.name);
//         }

//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error('Error loading product:', err);
//         this.loading.set(false);
//       }
//     });
//   }

//   // --- Actions ---

//   changeImage(url: string) {
//     this.selectedImage.set(url);
//   }

//   selectVariant(variant: any) {
//     this.selectedVariant.set(variant);
//   }

//   updateQuantity(delta: number) {
//     this.quantity.update(q => {
//       const newVal = q + delta;
//       return newVal < 1 ? 1 : newVal;
//     });
//   }

//   toggleAccordion(section: string) {
//     this.openAccordion.update(curr => curr === section ? '' : section);
//   }

//   addToCart() {
//     const product = this.product();
//     if (!product) return;

//     this.messageService.add({ 
//         severity: 'success', 
//         summary: 'Added to Cart', 
//         detail: `${this.quantity()} x ${product.name} (${this.selectedVariant()?.name})` 
//     });
//   }
// }
