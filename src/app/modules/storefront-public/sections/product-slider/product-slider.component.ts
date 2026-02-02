import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductCardComponent } from '../../components/product-card/product-card'; // Path check needed

@Component({
  selector: 'app-product-slider',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './product-slider.component.html',
  styleUrls: ['./product-slider.component.scss']
})
export class ProductSliderComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config: any = {};
  @Input() products: any[] = [];
  
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  orgSlug = signal<string>('');
  
  // Scroll State
  canScrollLeft = false;
  canScrollRight = true;
  autoSlideInterval: any;

  // Layout Mappers
  paddingMap: any = {
    'none': '0',
    'sm': 'var(--spacing-3xl)', 
    'md': 'var(--spacing-5xl)', 
    'lg': 'var(--spacing-7xl)'
  };

  // Compute Card Flex Basis for Desktop
  cardFlexBasis = computed(() => {
    // Default to 4 items on desktop if not specified
    const items = this.config.itemsPerView || 4;
    // Calculate percentage width accounting for the gap (var(--spacing-lg) approx 24px)
    // Formula: calc((100% - (items - 1) * gap) / items)
    return `calc((100% - ${(items - 1) * 24}px) / ${items})`;
  });

  ngOnInit(): void {
    // Attempt to get slug from parent route
    this.route.parent?.paramMap.subscribe(params => {
      this.orgSlug.set(params.get('orgSlug') || '');
    });
  }

  ngAfterViewInit() {
    // Allow DOM to settle before checking scroll
    setTimeout(() => this.checkScrollButtons(), 200);
    
    if (this.config?.autoSlide) {
      this.startAutoSlide();
    }
  }

  ngOnDestroy() {
    this.pauseAutoSlide();
  }

  scroll(direction: 'left' | 'right') {
    const container = this.sliderContainer.nativeElement;
    // Scroll by ~80% of view width for a natural page turn feel
    const scrollAmount = container.clientWidth * 0.8; 
    
    container.scrollBy({ 
      left: direction === 'left' ? -scrollAmount : scrollAmount, 
      behavior: 'smooth' 
    });
    
    // Check buttons after animation
    setTimeout(() => this.checkScrollButtons(), 500);
  }

  checkScrollButtons() {
    const el = this.sliderContainer?.nativeElement;
    if (el) {
      // Tolerance of 10px handles sub-pixel rendering issues
      this.canScrollLeft = el.scrollLeft > 10;
      this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 10);
    }
  }

  startAutoSlide() {
    const delay = this.config.autoSlideDelay || 4000;
    this.autoSlideInterval = setInterval(() => {
      if (this.canScrollRight) {
        this.scroll('right');
      } else {
        // Smoothly snap back to start
        this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        setTimeout(() => this.checkScrollButtons(), 500);
      }
    }, delay);
  }

  pauseAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  handleAddToCart(product: any) {
    console.log('Add to cart clicked:', product.name);
    // Future integration with CartService
  }
}

// import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, inject, signal, computed } from '@angular/core';
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
// export class ProductSliderComponent implements OnInit, AfterViewInit {
//   @Input() config: any = {};
//   @Input() products: any[] = [];
  
//   @ViewChild('sliderContainer') sliderContainer!: ElementRef;

//   private route = inject(ActivatedRoute);
//   orgSlug = signal<string>('');
  
//   // Scroll State
//   canScrollLeft = false;
//   canScrollRight = true;
//   autoSlideInterval: any;

//   // Compute Card Width based on Config
//   // This calculates CSS flex-basis: calc(100% / itemsPerView - gap)
//   cardFlexBasis = computed(() => {
//     const items = this.config.itemsPerView || 4; // Default to 4
//     return `calc((100% - ${(items - 1) * 24}px) / ${items})`;
//   });

//   ngOnInit(): void {
//     this.route.parent?.paramMap.subscribe(params => {
//       this.orgSlug.set(params.get('orgSlug') || '');
//     });
//   }

//   ngAfterViewInit() {
//     this.checkScrollButtons();
    
//     // Start auto-slide only after view is ready
//     if (this.config?.autoSlide) {
//       this.startAutoSlide();
//     }
//   }

//   ngOnDestroy() {
//     if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
//   }

//   scroll(direction: 'left' | 'right') {
//     const container = this.sliderContainer.nativeElement;
//     // Scroll by approx one screen width or item width depending on device
//     const scrollAmount = container.clientWidth * 0.8; 
    
//     container.scrollBy({ 
//       left: direction === 'left' ? -scrollAmount : scrollAmount, 
//       behavior: 'smooth' 
//     });
    
//     setTimeout(() => this.checkScrollButtons(), 500);
//   }

//   checkScrollButtons() {
//     const el = this.sliderContainer?.nativeElement;
//     if (el) {
//       // Allow 5px tolerance for float rounding
//       this.canScrollLeft = el.scrollLeft > 5;
//       this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 5);
//     }
//   }

//   startAutoSlide() {
//     const delay = this.config.autoSlideDelay || 3000;
//     this.autoSlideInterval = setInterval(() => {
//       if (this.canScrollRight) {
//         this.scroll('right');
//       } else {
//         // Smooth snap back to start
//         this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
//         setTimeout(() => this.checkScrollButtons(), 500);
//       }
//     }, delay);
//   }

//   // Stop auto-slide when user interacts
//   pauseAutoSlide() {
//     if (this.autoSlideInterval) clearInterval(this.autoSlideInterval);
//   }

//   handleAddToCart(product: any) {
//     console.log('Adding to cart:', product.name);
//     // TODO: Connect to CartService
//   }
// }
