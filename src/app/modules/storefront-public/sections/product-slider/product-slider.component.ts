import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
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
export class ProductSliderComponent implements OnInit, AfterViewInit {
  @Input() config: any = {};
  @Input() products: PublicProduct[] = [];
  
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  orgSlug = signal<string>('');
  
  // Scroll State
  canScrollLeft = false;
  canScrollRight = true;
  autoSlideInterval: any;

  // Compute Card Width based on Config
  // This calculates CSS flex-basis: calc(100% / itemsPerView - gap)
  cardFlexBasis = computed(() => {
    const items = this.config.itemsPerView || 4; // Default to 4
    return `calc((100% - ${(items - 1) * 24}px) / ${items})`;
  });

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      this.orgSlug.set(params.get('orgSlug') || '');
    });
  }

  ngAfterViewInit() {
    this.checkScrollButtons();
    
    // Start auto-slide only after view is ready
    if (this.config?.autoSlide) {
      this.startAutoSlide();
    }
  }

  ngOnDestroy() {
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
  }

  scroll(direction: 'left' | 'right') {
    const container = this.sliderContainer.nativeElement;
    // Scroll by approx one screen width or item width depending on device
    const scrollAmount = container.clientWidth * 0.8; 
    
    container.scrollBy({ 
      left: direction === 'left' ? -scrollAmount : scrollAmount, 
      behavior: 'smooth' 
    });
    
    setTimeout(() => this.checkScrollButtons(), 500);
  }

  checkScrollButtons() {
    const el = this.sliderContainer?.nativeElement;
    if (el) {
      // Allow 5px tolerance for float rounding
      this.canScrollLeft = el.scrollLeft > 5;
      this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 5);
    }
  }

  startAutoSlide() {
    const delay = this.config.autoSlideDelay || 3000;
    this.autoSlideInterval = setInterval(() => {
      if (this.canScrollRight) {
        this.scroll('right');
      } else {
        // Smooth snap back to start
        this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        setTimeout(() => this.checkScrollButtons(), 500);
      }
    }, delay);
  }

  // Stop auto-slide when user interacts
  pauseAutoSlide() {
    if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
  }

  handleAddToCart(product: PublicProduct) {
    console.log('Adding to cart:', product.name);
    // TODO: Connect to CartService
  }
}

// import { Component, Input, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { PublicProduct } from '../../../../core/models/storefront.model';
// import { ButtonModule } from 'primeng/button';
// import { SkeletonModule } from 'primeng/skeleton';
// import { ProductCardComponent } from '../../components/product-card/product-card';

// @Component({
//   selector: 'app-product-slider',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ProductCardComponent, ButtonModule, SkeletonModule],
//   templateUrl: './product-slider.component.html',
//   styleUrls: ['./product-slider.component.scss']
// })
// export class ProductSliderComponent implements OnInit {
//   @Input() config: any = {};
//   @Input() products: PublicProduct[] = [];
  
//   @ViewChild('sliderContainer') sliderContainer!: ElementRef;

//   private route = inject(ActivatedRoute);
//   orgSlug = signal<string>('');
  
//   // State
//   scrollPosition = 0;
//   maxScroll = 0;
//   canScrollLeft = false;
//   canScrollRight = true;

//   ngOnInit(): void {
//     // 1. Get OrgSlug from Route (or Parent)
//     this.route.parent?.paramMap.subscribe(params => {
//       this.orgSlug.set(params.get('orgSlug') || '');
//     });
    
//     // 2. Initialize Auto-Slide if configured
//     if (this.config?.autoSlide) {
//       this.startAutoSlide();
//     }
//   }
// getItemWidth(): string {
//   // If config has specific itemsPerView, we can calculate percentage
//   // But strictly speaking, fixed width + flex is safer for responsive
//   // This is handled by CSS media queries mostly, but you can override here if needed.
//   return 'auto'; // Let CSS handle it
// }
//   ngAfterViewInit() {
//     this.checkScrollButtons();
//   }

//   scroll(direction: 'left' | 'right') {
//     const container = this.sliderContainer.nativeElement;
//     const cardWidth = 300; // Approx card width + gap
//     const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
//     container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    
//     // Update button states after scroll animation
//     setTimeout(() => this.checkScrollButtons(), 400);
//   }

//   checkScrollButtons() {
//     const el = this.sliderContainer?.nativeElement;
//     if (el) {
//       this.canScrollLeft = el.scrollLeft > 0;
//       this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 10);
//     }
//   }

//   startAutoSlide() {
//     const delay = this.config.autoSlideDelay || 3000;
//     setInterval(() => {
//       if (this.canScrollRight) {
//         this.scroll('right');
//       } else {
//         // Loop back to start
//         this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
//         setTimeout(() => this.checkScrollButtons(), 400);
//       }
//     }, delay);
//   }

//   handleAddToCart(product: PublicProduct) {
//     console.log('Adding to cart:', product.name);
//     // Emit event or call cart service
//   }
// }
