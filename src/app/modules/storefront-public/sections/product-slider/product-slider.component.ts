import { Component, Input, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PublicProduct } from '../../../../core/models/storefront.model';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ProductCardComponent } from '../../components/product-card/product-card';

@Component({
  selector: 'app-product-slider',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, ButtonModule, SkeletonModule],
  templateUrl: './product-slider.component.html',
  styleUrls: ['./product-slider.component.scss']
})
export class ProductSliderComponent implements OnInit {
  @Input() config: any = {};
  @Input() products: PublicProduct[] = [];
  
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  orgSlug = signal<string>('');
  
  // State
  scrollPosition = 0;
  maxScroll = 0;
  canScrollLeft = false;
  canScrollRight = true;

  ngOnInit(): void {
    // 1. Get OrgSlug from Route (or Parent)
    this.route.parent?.paramMap.subscribe(params => {
      this.orgSlug.set(params.get('orgSlug') || '');
    });
    
    // 2. Initialize Auto-Slide if configured
    if (this.config?.autoSlide) {
      this.startAutoSlide();
    }
  }
getItemWidth(): string {
  // If config has specific itemsPerView, we can calculate percentage
  // But strictly speaking, fixed width + flex is safer for responsive
  // This is handled by CSS media queries mostly, but you can override here if needed.
  return 'auto'; // Let CSS handle it
}
  ngAfterViewInit() {
    this.checkScrollButtons();
  }

  scroll(direction: 'left' | 'right') {
    const container = this.sliderContainer.nativeElement;
    const cardWidth = 300; // Approx card width + gap
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    
    // Update button states after scroll animation
    setTimeout(() => this.checkScrollButtons(), 400);
  }

  checkScrollButtons() {
    const el = this.sliderContainer?.nativeElement;
    if (el) {
      this.canScrollLeft = el.scrollLeft > 0;
      this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 10);
    }
  }

  startAutoSlide() {
    const delay = this.config.autoSlideDelay || 3000;
    setInterval(() => {
      if (this.canScrollRight) {
        this.scroll('right');
      } else {
        // Loop back to start
        this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        setTimeout(() => this.checkScrollButtons(), 400);
      }
    }, delay);
  }

  handleAddToCart(product: PublicProduct) {
    console.log('Adding to cart:', product.name);
    // Emit event or call cart service
  }
}

// import { Component, inject, Input, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ProductCardComponent } from '../../components/product-card/product-card';
// import { PublicProduct } from '../../../../core/models/storefront.model';
// import { ActivatedRoute, Router } from '@angular/router';


// @Component({
//   selector: 'app-product-slider',
//   standalone: true,
//   imports: [CommonModule, ProductCardComponent],
//   template: `
//     <div class="py-16 container mx-auto px-4">
//       <div class="flex justify-between items-end mb-8">
//         <div>
//           <h2 class="text-3xl font-bold text-gray-900 mb-2">{{ config.title }}</h2>
//           @if (config.subtitle) {
//             <p class="text-gray-500">{{ config.subtitle }}</p>
//           }
//         </div>
        
//         @if (config.navigation) {
//           <div class="flex gap-2">
//             <button class="p-2 rounded-full border hover:bg-gray-50"><i class="fas fa-chevron-left"></i></button>
//             <button class="p-2 rounded-full border hover:bg-gray-50"><i class="fas fa-chevron-right"></i></button>
//           </div>
//         }
//       </div>

//       <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//         @for (product of products; track product.id) {
//           <app-product-card 
//             [product]="product" 
//             (addToCart)="handleAddToCart($event)" [orgSlug]="this.orgSlug ">
//           </app-product-card>
//         }
//       </div>

//       @if (!products || products.length === 0) {
//         <div class="text-center py-10 bg-gray-50 rounded-lg">
//           <p class="text-gray-500">No products found for this section.</p>
//         </div>
//       }
//     </div>
//   `
// })
// export class ProductSliderComponent {
//   @Input() config: any;
//   @Input() products: PublicProduct[] = [];
//   orgSlug: any;
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   ngOnInit(): void {
//     //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
//     //Add 'implements OnInit' to the class.
//     this.route.paramMap.subscribe((params: any) => {
//       this.orgSlug = params.get('orgSlug') || '';
//     });
//   }

//   handleAddToCart(product: PublicProduct) {
//     console.log('Adding to cart:', product.name);
//     // Inject CartService here later
//   }
// }