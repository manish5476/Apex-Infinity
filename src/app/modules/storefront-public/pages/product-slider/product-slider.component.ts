import { 
  Component, Input, OnInit, OnChanges, OnDestroy, AfterViewInit, 
  ChangeDetectionStrategy, signal, ViewChild, ElementRef, computed, inject, PLATFORM_ID 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SectionBaseConfig, SectionProduct, PADDING_MAP } from '../../dynamic-page/section.types';
import { PublicProduct } from '@core/models/storefront.model';
import { ProductCardComponent } from '../product-card/product-card';
import { StorefrontCartFacade } from '../../../../storefront/core/facades/storefront-cart.facade';

export interface ProductSliderConfig extends SectionBaseConfig {
  title?: string;
  itemsPerView?: number;
  showPrice?: boolean;
  showAddToCart?: boolean;
  autoPlay?: boolean;
}

@Component({
  selector: 'app-product-slider',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="section-root" [ngStyle]="sectionStyle()">

  <div class="container-wrapper standard">

    <div class="header-row">
      <div class="title-group">
        <h2 class="section-title animate-fade-in delay-1">{{ cfg().title }}</h2>
      </div>

      @if (products.length > cfg().itemsPerView) {
      <div class="nav-controls animate-fade-in delay-1">
        <button class="nav-btn prev" [disabled]="!canScrollLeft()" (click)="scroll('left'); pauseAutoSlide()"
          aria-label="Previous Slide">
          <i class="pi pi-arrow-left"></i>
        </button>
        <button class="nav-btn next" [disabled]="!canScrollRight()" (click)="scroll('right'); pauseAutoSlide()"
          aria-label="Next Slide">
          <i class="pi pi-arrow-right"></i>
        </button>
      </div>
      }
    </div>

    <div class="slider-viewport animate-fade-in delay-2" #sliderContainer (scroll)="checkScrollButtons()"
      (touchstart)="pauseAutoSlide()" (mouseenter)="pauseAutoSlide()">

      @if (!products || products.length === 0) {
        @for (i of [1,2,3,4,5]; track i) {
        <div class="slider-item">
          <div class="skeleton-card"></div>
        </div>
        }
      } @else {
        @for (product of products; track product.id || $index) {
        <div class="slider-item" [style.flex-basis]="cardFlexBasis()">
          <app-product-card 
            [product]="product" 
            [orgSlug]="organizationSlug" 
            (addToCart)="handleAddToCart($event)"
            class="h-full block">
          </app-product-card>
        </div>
        }
      }

    </div>

    @if (canScrollRight() && products.length > 2) {
    <div class="mobile-progress">
      <div class="progress-bar"></div>
    </div>
    }

  </div>
</section>
  `,
  styles: [`
    :host { display: block; }

    .section-root {
      position: relative;
      overflow: hidden;
      background-color: var(--bg-primary);
      transition: padding 0.3s ease, background-color 0.3s ease;
    }

    .container-wrapper {
      position: relative;
      z-index: 10;
      margin: 0 auto;
      padding: 0 var(--spacing-2xl, 2rem);

      &.standard { max-width: 1440px; }
      &.full { max-width: 100%; padding: 0 var(--spacing-xl, 1.5rem); }
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--spacing-4xl, 2.5rem);
    }

    .title-group .section-title {
      font-family: var(--font-heading, sans-serif);
      font-size: var(--font-size-3xl, 2rem);
      font-weight: 700;
      color: var(--text-primary, #111);
      line-height: 1.1;
      margin: 0;

      @media (min-width: 768px) { font-size: var(--font-size-4xl, 2.5rem); }
    }

    .nav-controls {
      display: none;
      gap: var(--spacing-sm, 0.5rem);

      @media (min-width: 768px) { display: flex; }

      .nav-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 1px solid var(--border-secondary, #e5e7eb);
        background: var(--bg-primary, #fff);
        color: var(--text-primary, #111);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          border-color: var(--color-primary, #2563eb);
          background: var(--color-primary, #2563eb);
          color: #fff;
          transform: scale(1.05);
        }

        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          border-color: var(--border-secondary, #e5e7eb);
        }
      }
    }

    .slider-viewport {
      display: flex;
      gap: var(--spacing-lg, 1.5rem);
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: var(--spacing-sm, 0.5rem) 0 var(--spacing-3xl, 2rem) 0;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .slider-item {
      flex-shrink: 0;
      scroll-snap-align: start;
      height: 100%;
      width: 280px; /* Mobile Default */

      @media (min-width: 768px) { width: auto; } /* Flex-basis takes over on desktop */
    }

    .skeleton-card {
      width: 100%;
      height: 400px;
      background: var(--bg-secondary, #f3f4f6);
      border-radius: var(--ui-border-radius-lg, 1rem);
      position: relative;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        transform: translateX(-100%);
        background-image: linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0));
        animation: shimmer 2s infinite;
      }
    }

    @keyframes shimmer { 100% { transform: translateX(100%); } }

    .mobile-progress {
      display: block;
      width: 100%;
      max-width: 200px;
      height: 2px;
      background: var(--border-secondary, #e5e7eb);
      margin: 0 auto;
      border-radius: 10px;
      overflow: hidden;

      @media (min-width: 768px) { display: none; }

      .progress-bar {
        height: 100%;
        background: var(--color-primary, #2563eb);
        width: 25%;
        border-radius: 10px;
        animation: slideIndicate 2s infinite ease-in-out;
      }
    }

    @keyframes slideIndicate {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(300%); }
    }
  `]
})
export class ProductSliderComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  // Inject PLATFORM_ID to strictly separate Server from Browser
  private readonly platformId = inject(PLATFORM_ID);

  @Input() config: ProductSliderConfig = {};
  @Input() data: SectionProduct[] | null = null;
  @Input() organizationSlug = ''; 

  @ViewChild('sliderContainer') sliderContainer!: ElementRef<HTMLElement>;

  products: PublicProduct[] = [];
  
  canScrollLeft = signal(false);
  canScrollRight = signal(true);
  
  private cartFacade = inject(StorefrontCartFacade);
  private _autoPlayTimer: any;

  readonly cfg = computed(() => ({
    title: this.config?.title || 'Featured Products',
    itemsPerView: this.config?.itemsPerView || 4,
    paddingTop: this.config?.paddingTop || 'md',
    paddingBottom: this.config?.paddingBottom || 'md',
    backgroundColor: this.config?.backgroundColor || 'var(--bg-primary)'
  }));

  readonly sectionStyle = computed(() => {
    const pt = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingTop] : '4rem';
    const pb = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingBottom] : '4rem';
    return {
      'padding-top': pt,
      'padding-bottom': pb,
      'background-color': this.cfg().backgroundColor
    };
  });

  ngOnInit() {
    this.updateData();
  }

  ngOnChanges() {
    this.updateData();
  }

  // Ensures DOM is loaded before we attach listeners or query widths
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.checkScrollButtons(), 150);
      this.initAutoPlay();
    }
  }

  ngOnDestroy() {
    this.pauseAutoSlide();
  }

  private updateData() {
    this.products = Array.isArray(this.data) ? this.data.map(p => this.toPublicProduct(p)) : [];
    
    // Only query the DOM if we are in the browser
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.checkScrollButtons();
        this.initAutoPlay();
      }, 100);
    }
  }

  // Pure CSS calculation (No window.innerWidth required!)
  cardFlexBasis(): string {
    const perView = this.cfg().itemsPerView;
    const gap = 1.5; // matches --spacing-lg (1.5rem)
    return `calc((100% - ${(perView - 1) * gap}rem) / ${perView})`;
  }

  scroll(direction: 'left' | 'right') {
    if (!isPlatformBrowser(this.platformId) || !this.sliderContainer) return;
    
    const el = this.sliderContainer.nativeElement;
    if (!el) return;

    const itemElement = el.querySelector('.slider-item') as HTMLElement;
    const scrollAmount = itemElement ? itemElement.offsetWidth + 24 : el.clientWidth;

    el.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
    
    setTimeout(() => this.checkScrollButtons(), 350);
  }

  checkScrollButtons() {
    // Failsafe for Server Side Rendering
    if (!isPlatformBrowser(this.platformId) || !this.sliderContainer?.nativeElement) return;
    
    const el = this.sliderContainer.nativeElement;
    
    this.canScrollLeft.set(el.scrollLeft > 1);
    this.canScrollRight.set(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 1);
  }
  
  private initAutoPlay() {
    if (!isPlatformBrowser(this.platformId)) return; // Prevent memory leaks on server

    this.pauseAutoSlide();
    if (this.config?.autoPlay && this.products.length > this.cfg().itemsPerView) {
      this._autoPlayTimer = setInterval(() => {
        if (!this.sliderContainer?.nativeElement) return;
        if (this.canScrollRight()) {
          this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          this.scroll('right');
        }
      }, 3500); 
    }
  }

  pauseAutoSlide() {
    // Only execute if window/browser context exists
    if (isPlatformBrowser(this.platformId) && this._autoPlayTimer) {
      clearInterval(this._autoPlayTimer);
      this._autoPlayTimer = null;
    }
  }

  handleAddToCart(product: PublicProduct) {
    if (this.organizationSlug) {
      this.cartFacade.add(this.organizationSlug, { productId: product.id || (product as any)._id, quantity: 1 }).subscribe();
    }
  }

  private toPublicProduct(p: SectionProduct): PublicProduct {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? null,
      image: p.image ?? null,
      images: p.images ?? [],
      tags: p.tags ?? [],
      price: p.price,
      stock: p.stock,
      category: p.category ?? null,
      categorySlug: p.categorySlug ?? null,
      brand: p.brand ?? null,
      brandSlug: p.brandSlug ?? null,
    };
  }
}


// import { Component, Input, OnInit, OnChanges, OnDestroy, ChangeDetectionStrategy, signal, ViewChild, ElementRef, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { SectionBaseConfig, SectionProduct, PADDING_MAP } from '../../dynamic-page/section.types';
// import { PublicProduct } from '@core/models/storefront.model';
// import { ProductCardComponent } from '../product-card/product-card';

// export interface ProductSliderConfig extends SectionBaseConfig {
//   title?: string;
//   itemsPerView?: number;
//   showPrice?: boolean;
//   showAddToCart?: boolean;
//   autoPlay?: boolean;
// }

// @Component({
//   selector: 'app-product-slider',
//   standalone: true,
//   imports: [CommonModule, ProductCardComponent],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
// <section class="section-root" [ngStyle]="sectionStyle()">

//   <div class="container-wrapper standard">

//     <div class="header-row">
//       <div class="title-group">
//         <h2 class="section-title animate-fade-in delay-1">{{ cfg().title }}</h2>
//       </div>

//       @if (products.length > cfg().itemsPerView) {
//       <div class="nav-controls animate-fade-in delay-1">
//         <button class="nav-btn prev" [disabled]="!canScrollLeft()" (click)="scroll('left'); pauseAutoSlide()"
//           aria-label="Previous Slide">
//           <i class="pi pi-arrow-left"></i>
//         </button>
//         <button class="nav-btn next" [disabled]="!canScrollRight()" (click)="scroll('right'); pauseAutoSlide()"
//           aria-label="Next Slide">
//           <i class="pi pi-arrow-right"></i>
//         </button>
//       </div>
//       }
//     </div>

//     <div class="slider-viewport animate-fade-in delay-2" #sliderContainer (scroll)="checkScrollButtons()"
//       (touchstart)="pauseAutoSlide()" (mouseenter)="pauseAutoSlide()">

//       @if (!products || products.length === 0) {
//         @for (i of [1,2,3,4,5]; track i) {
//         <div class="slider-item">
//           <div class="skeleton-card"></div>
//         </div>
//         }
//       } @else {
//         @for (product of products; track product.id || $index) {
//         <div class="slider-item" [style.flex-basis]="cardFlexBasis()">
//           <app-product-card 
//             [product]="product" 
//             [orgSlug]="organizationSlug" 
//             (addToCart)="handleAddToCart($event)"
//             class="h-full block">
//           </app-product-card>
//         </div>
//         }
//       }

//     </div>

//     @if (canScrollRight() && products.length > 2) {
//     <div class="mobile-progress">
//       <div class="progress-bar"></div>
//     </div>
//     }

//   </div>
// </section>
//   `,
//   styles: [`
//     /* ==========================================================================
//        COMPONENT: PREMIUM PRODUCT SLIDER
//        Strict Token Usage
//        ========================================================================== */

//     :host {
//       display: block;
//     }

//     .section-root {
//       position: relative;
//       overflow: hidden;
//       background-color: var(--bg-primary);
//       transition: padding 0.3s ease, background-color 0.3s ease;
//     }

//     /* --- CONTAINER --- */
//     .container-wrapper {
//       position: relative;
//       z-index: 10;
//       margin: 0 auto;
//       padding: 0 var(--spacing-2xl, 2rem);

//       &.standard {
//         max-width: 1440px;
//       }

//       &.full {
//         max-width: 100%;
//         padding: 0 var(--spacing-xl, 1.5rem);
//       }
//     }

//     /* --- HEADER --- */
//     .header-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-end;
//       margin-bottom: var(--spacing-4xl, 2.5rem);
//     }

//     .title-group {
//       .subtitle {
//         display: block;
//         font-family: var(--font-mono, monospace);
//         font-size: var(--font-size-xs, 0.75rem);
//         font-weight: 700;
//         text-transform: uppercase;
//         letter-spacing: 2px;
//         color: var(--color-primary, #2563eb);
//         margin-bottom: var(--spacing-sm, 0.5rem);
//       }

//       .section-title {
//         font-family: var(--font-heading, sans-serif);
//         font-size: var(--font-size-3xl, 2rem);
//         font-weight: 700;
//         color: var(--text-primary, #111);
//         line-height: 1.1;
//         margin: 0;

//         @media (min-width: 768px) {
//           font-size: var(--font-size-4xl, 2.5rem);
//         }
//       }
//     }

//     /* --- CONTROLS --- */
//     .nav-controls {
//       display: none;
//       gap: var(--spacing-sm, 0.5rem);

//       @media (min-width: 768px) {
//         display: flex;
//       }

//       .nav-btn {
//         width: 48px;
//         height: 48px;
//         border-radius: 50%;
//         border: 1px solid var(--border-secondary, #e5e7eb);
//         background: var(--bg-primary, #fff);
//         color: var(--text-primary, #111);

//         display: flex;
//         align-items: center;
//         justify-content: center;
//         cursor: pointer;
//         transition: all 0.2s ease;

//         &:hover:not(:disabled) {
//           border-color: var(--color-primary, #2563eb);
//           background: var(--color-primary, #2563eb);
//           color: #fff;
//           transform: scale(1.05);
//         }

//         &:disabled {
//           opacity: 0.3;
//           cursor: not-allowed;
//           border-color: var(--border-secondary, #e5e7eb);
//         }

//         i {
//           font-size: 0.9rem;
//         }
//       }
//     }

//     /* --- SLIDER VIEWPORT --- */
//     .slider-viewport {
//       display: flex;
//       gap: var(--spacing-lg, 1.5rem);
//       overflow-x: auto;
//       scroll-behavior: smooth;
//       padding: var(--spacing-sm, 0.5rem) 0 var(--spacing-3xl, 2rem) 0;
      
//       /* Scroll Snap Logic */
//       scroll-snap-type: x mandatory;
//       -webkit-overflow-scrolling: touch;

//       /* Hide Scrollbar */
//       scrollbar-width: none;
//       &::-webkit-scrollbar {
//         display: none;
//       }
//     }

//     .slider-item {
//       flex-shrink: 0;
//       scroll-snap-align: start;
//       height: 100%;

//       /* Mobile Default: Fixed width for consistency */
//       width: 280px;

//       @media (min-width: 768px) {
//         width: auto;
//       }
//     }

//     /* --- SKELETON LOADER --- */
//     .skeleton-card {
//       width: 100%;
//       height: 400px;
//       background: var(--bg-secondary, #f3f4f6);
//       border-radius: var(--ui-border-radius-lg, 1rem);
//       position: relative;
//       overflow: hidden;

//       &::after {
//         content: "";
//         position: absolute;
//         top: 0;
//         right: 0;
//         bottom: 0;
//         left: 0;
//         transform: translateX(-100%);
//         background-image: linear-gradient(90deg,
//             rgba(255, 255, 255, 0) 0,
//             rgba(255, 255, 255, 0.2) 20%,
//             rgba(255, 255, 255, 0.5) 60%,
//             rgba(255, 255, 255, 0));
//         animation: shimmer 2s infinite;
//       }
//     }

//     @keyframes shimmer {
//       100% { transform: translateX(100%); }
//     }

//     /* --- MOBILE PROGRESS BAR --- */
//     .mobile-progress {
//       display: block;
//       width: 100%;
//       max-width: 200px;
//       height: 2px;
//       background: var(--border-secondary, #e5e7eb);
//       margin: 0 auto;
//       border-radius: 10px;
//       overflow: hidden;

//       @media (min-width: 768px) {
//         display: none;
//       }

//       .progress-bar {
//         height: 100%;
//         background: var(--color-primary, #2563eb);
//         width: 25%;
//         border-radius: 10px;
//         animation: slideIndicate 2s infinite ease-in-out;
//       }
//     }

//     @keyframes slideIndicate {
//       0%, 100% { transform: translateX(0); }
//       50% { transform: translateX(300%); }
//     }
//   `]
// })
// export class ProductSliderComponent implements OnInit, OnChanges, OnDestroy {
//   @Input() config: ProductSliderConfig = {};
//   @Input() data: SectionProduct[] | null = null;
//   @Input() organizationSlug = ''; 

//   @ViewChild('sliderContainer') sliderContainer!: ElementRef<HTMLElement>;

//   products: PublicProduct[] = [];
  
//   // Signals for Native Scroll UI state
//   canScrollLeft = signal(false);
//   canScrollRight = signal(true);
  
//   private _autoPlayTimer: any;

//   readonly cfg = computed(() => {
//     return {
//       title: this.config.title || 'Featured Products',
//       itemsPerView: this.config.itemsPerView || 4,
//       paddingTop: this.config.paddingTop || 'md',
//       paddingBottom: this.config.paddingBottom || 'md',
//       backgroundColor: this.config.backgroundColor || 'var(--bg-primary)'
//     };
//   });

//   readonly sectionStyle = computed(() => {
//     const pt = PADDING_MAP ? PADDING_MAP[this.cfg().paddingTop] : '4rem';
//     const pb = PADDING_MAP ? PADDING_MAP[this.cfg().paddingBottom] : '4rem';
//     return {
//       'padding-top': pt,
//       'padding-bottom': pb,
//       'background-color': this.cfg().backgroundColor
//     };
//   });

//   ngOnInit() {
//     this.updateData();
//   }

//   // Captures updates from the builder dynamically
//   ngOnChanges() {
//     this.updateData();
//   }

//   ngOnDestroy() {
//     this.pauseAutoSlide();
//   }

//   private updateData() {
//     this.products = Array.isArray(this.data) ? this.data.map(p => this.toPublicProduct(p)) : [];
    
//     // Defer check to let DOM render products first
//     setTimeout(() => {
//       this.checkScrollButtons();
//       this.initAutoPlay();
//     }, 100);
//   }

//   // Calculates exact CSS flex-basis for desktop grids
//   cardFlexBasis(): string {
//     const perView = this.cfg().itemsPerView;
//     const gap = 1.5; // matches --spacing-lg (1.5rem)
//     return `calc((100% - ${(perView - 1) * gap}rem) / ${perView})`;
//   }

//   // --- Native Scroll Logic ---
  
//   scroll(direction: 'left' | 'right') {
//     if (!this.sliderContainer) return;
//     const el = this.sliderContainer.nativeElement;
    
//     // Scroll by the width of one item + gap
//     const itemElement = el.querySelector('.slider-item') as HTMLElement;
//     const scrollAmount = itemElement ? itemElement.offsetWidth + 24 : el.clientWidth;

//     el.scrollBy({
//       left: direction === 'right' ? scrollAmount : -scrollAmount,
//       behavior: 'smooth'
//     });
    
//     // Give smooth scroll time to finish before checking bounds
//     setTimeout(() => this.checkScrollButtons(), 350);
//   }

//   checkScrollButtons() {
//     if (!this.sliderContainer) return;
//     const el = this.sliderContainer.nativeElement;
    
//     // 1px buffer to account for sub-pixel rendering in some browsers
//     this.canScrollLeft.set(el.scrollLeft > 1);
//     this.canScrollRight.set(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 1);
//   }

//   // --- AutoPlay Logic ---
  
//   private initAutoPlay() {
//     this.pauseAutoSlide();
//     if (this.config.autoPlay && this.products.length > this.cfg().itemsPerView) {
//       this._autoPlayTimer = setInterval(() => {
//         if (!this.sliderContainer) return;
//                 // Loop back to start if at the end
//         if (!this.canScrollRight()) {
//           this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
//         } else {
//           this.scroll('right');
//         }
//       }, 3500); // Scroll every 3.5 seconds
//     }
//   }

//   pauseAutoSlide() {
//     if (this._autoPlayTimer) {
//       clearInterval(this._autoPlayTimer);
//       this._autoPlayTimer = null;
//     }
//   }

//   handleAddToCart(product: PublicProduct) {
//     console.log('Added to cart', product);
//     // integrate with your cart service
//   }

//   // Safe mapping utility
//   private toPublicProduct(p: SectionProduct): PublicProduct {
//     return {
//       id: p.id,
//       name: p.name,
//       slug: p.slug,
//       sku: p.sku ?? null,
//       image: p.image ?? null,
//       images: p.images ?? [],
//       tags: p.tags ?? [],
//       price: p.price,
//       stock: p.stock,
//       category: p.category ?? null,
//       categorySlug: p.categorySlug ?? null,
//       brand: p.brand ?? null,
//       brandSlug: p.brandSlug ?? null,
//     };
//   }
// }

// // import { CommonModule, isPlatformBrowser } from '@angular/common';
// // import { Component, Input, OnInit, ChangeDetectionStrategy, signal, OnChanges, PLATFORM_ID, inject } from '@angular/core';
// // import { SectionBaseConfig, SectionProduct, PADDING_MAP } from '../../dynamic-page/section.types';
// // import { PublicProduct } from '@core/models/storefront.model';
// // import { ProductCardComponent } from '../product-card/product-card';

// // export interface ProductSliderConfig extends SectionBaseConfig {
// //   title?: string;
// //   itemsPerView?: number;
// //   showPrice?: boolean;
// //   showAddToCart?: boolean;
// //   autoPlay?: boolean;
// // }

// // @Component({
// //   selector: 'app-product-slider',
// //   standalone: true,
// //   imports: [CommonModule, ProductCardComponent],
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   template: `
// // <section class="m3-slider-section" [style.paddingTop]="pt" [style.paddingBottom]="pb"
// //   [style.backgroundColor]="config.backgroundColor || 'var(--md-sys-color-surface)'">
  
// //   <div class="m3-slider-container">
// //     @if (config.title) {
// //       <div class="m3-slider-header">
// //         <h2 class="m3-slider-title">{{ config.title }}</h2>
// //         <a href="/products" class="m3-slider-link">View all <i class="pi pi-arrow-right"></i></a>
// //       </div>
// //     }
 
// //     @if (!products.length) {
// //       <div class="m3-slider-empty">
// //         <i class="pi pi-shopping-bag m3-slider-empty-icon"></i>
// //         <span>No products configured</span>
// //       </div>
// //     } @else {
// //       <div class="m3-slider-track-wrapper">
        
// //         <button class="m3-fab m3-nav-prev" [class.m3-nav-hidden]="offset() === 0" (click)="prev()" aria-label="Previous">
// //           <i class="pi pi-chevron-left"></i>
// //         </button>
 
// //         <div class="m3-slider-track" #track
// //           [style.transform]="'translateX(-' + (offset() * slideWidth) + 'px)'">
// //           @for (product of products; track product.id) {
// //             <div class="m3-slider-item" [style.minWidth]="slideWidth + 'px'">
// //               <app-product-card [product]="product"></app-product-card>
// //             </div>
// //           }
// //         </div>
 
// //         <button class="m3-fab m3-nav-next" [class.m3-nav-hidden]="offset() >= maxOffset()" (click)="next()" aria-label="Next">
// //           <i class="pi pi-chevron-right"></i>
// //         </button>
        
// //       </div>
// //     }
// //   </div>
// // </section>
// //   `,
// //   styles: [`
// //     /* --- M3 Standard Configuration --- */
// //     :host {
// //       display: block;
// //       width: 100%;
// //       --md-sys-color-primary: var(--theme-accent-primary, #1a73e8);
// //       --md-sys-color-surface: var(--bg-primary, #ffffff);
// //       --md-sys-color-on-surface: #202124;
// //       --md-sys-color-outline: #dadce0;
// //       --md-sys-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
      
// //       font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
// //       -webkit-font-smoothing: antialiased;
// //     }

// //     .m3-slider-section {
// //       overflow: hidden;
// //       background-color: var(--md-sys-color-surface);
// //     }

// //     .m3-slider-container {
// //       max-width: 1280px;
// //       margin: 0 auto;
// //       padding: 0 3%;
// //     }

// //     /* --- Header --- */
// //     .m3-slider-header {
// //       display: flex;
// //       align-items: flex-end;
// //       justify-content: space-between;
// //       margin-bottom: 20px;
// //     }

// //     .m3-slider-title {
// //       font-size: clamp(1.25rem, 2.5vw, 1.75rem);
// //       font-weight: 500;
// //       color: var(--md-sys-color-on-surface);
// //       margin: 0;
// //       line-height: 1.2;
// //       letter-spacing: -0.02em;
// //     }

// //     .m3-slider-link {
// //       font-size: 0.8125rem;
// //       font-weight: 500;
// //       color: var(--md-sys-color-primary);
// //       text-decoration: none;
// //       display: flex;
// //       align-items: center;
// //       gap: 6px;
// //       padding: 6px 10px;
// //       border-radius: 100px;
// //       transition: background 0.2s var(--md-sys-easing-standard);
// //     }

// //     .m3-slider-link:hover {
// //       background: rgba(26, 115, 232, 0.08);
// //     }

// //     /* --- Track Area --- */
// //     .m3-slider-track-wrapper {
// //       position: relative;
// //     }

// //     .m3-slider-track {
// //       display: flex;
// //       gap: 16px;
// //       transition: transform 0.5s var(--md-sys-easing-standard);
// //       padding-bottom: 12px;
// //       padding-top: 4px;
// //     }

// //     .m3-slider-item {
// //       flex-shrink: 0;
// //       box-sizing: border-box;
// //     }

// //     /* --- M3 Floating Navigation Buttons --- */
// //     .m3-fab {
// //       position: absolute;
// //       top: calc(50% - 16px); /* Account for padding bottom */
// //       transform: translateY(-50%);
// //       z-index: 5;
// //       width: 48px;
// //       height: 48px;
// //       border-radius: 50%;
// //       background: #ffffff;
// //       color: #5f6368;
// //       border: 1px solid var(--md-sys-color-outline);
// //       box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //       cursor: pointer;
// //       transition: all 0.2s var(--md-sys-easing-standard);
// //     }

// //     .m3-fab:hover {
// //       color: var(--md-sys-color-primary);
// //       background: #f8f9fa;
// //       box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
// //       transform: translateY(-50%) scale(1.05);
// //     }

// //     .m3-fab i { font-size: 1.25rem; font-weight: bold; }

// //     /* Float slightly outside the track boundary */
// //     .m3-nav-prev { left: -24px; }
// //     .m3-nav-next { right: -24px; }
    
// //     .m3-nav-hidden {
// //       opacity: 0;
// //       pointer-events: none;
// //       transform: translateY(-50%) scale(0.8);
// //     }

// //     /* --- Empty State --- */
// //     .m3-slider-empty {
// //       display: flex;
// //       flex-direction: column;
// //       align-items: center;
// //       justify-content: center;
// //       gap: 16px;
// //       padding: 80px 24px;
// //       background: #f8f9fa;
// //       border-radius: 24px;
// //       border: 1px dashed var(--md-sys-color-outline);
// //       color: #5f6368;
// //     }
// //     .m3-slider-empty-icon { font-size: 3rem; color: #dadce0; }
// //   `]
// // })
// // export class ProductSliderComponent implements OnInit, OnChanges {
// //   private readonly platformId = inject(PLATFORM_ID);

// //   @Input() config: ProductSliderConfig = {};
// //   @Input() data: SectionProduct[] | null = null;

// //   products: PublicProduct[] = [];
// //   pt = '40px';
// //   pb = '40px';
// //   slideWidth = 240;
// //   offset = signal(0);
// //   maxOffset = signal(0);

// //   // Runs once on load — safe for SSR (no HTTP calls here)
// //   ngOnInit(): void {
// //     this.updateSliderState();
// //   }

// //   // Runs EVERY TIME data or config changes from the page builder
// //   ngOnChanges(): void {
// //     this.updateSliderState();
// //   }

// //   // Centralized update logic
// //   private updateSliderState(): void {
// //     // 1. Update Padding Safely
// //     if (typeof PADDING_MAP !== 'undefined') {
// //       this.pt = PADDING_MAP[this.config?.paddingTop ?? 'md'] || '40px';
// //       this.pb = PADDING_MAP[this.config?.paddingBottom ?? 'md'] || '40px';
// //     }

// //     // 2. Map the incoming JSON data to products
// //     this.products = Array.isArray(this.data) ? this.data.map(p => this.toPublicProduct(p)) : [];

// //     // 3. Recalculate layout width — use 1100px as effective container width
// //     //    so cards feel compact and multiple fit comfortably in view
// //     const perView = this.config?.itemsPerView ?? 4;
// //     const gap = 20;
// //     const containerWidth = isPlatformBrowser(this.platformId)
// //       ? Math.min(window.innerWidth * 0.88, 1100)
// //       : 1100;
// //     this.slideWidth = Math.floor((containerWidth - (perView - 1) * gap) / perView);

// //     // 4. Update the maximum scroll limit based on actual loaded products
// //     const max = Math.max(0, this.products.length - perView);
// //     this.maxOffset.set(max);

// //     // 5. Prevent the slider from getting stuck out of bounds if items are removed
// //     if (this.offset() > max) {
// //       this.offset.set(max);
// //     }
// //   }

// //   prev(): void {
// //     this.offset.update(v => Math.max(0, v - 1));
// //   }

// //   next(): void {
// //     this.offset.update(v => Math.min(this.maxOffset(), v + 1));
// //   }

// //   private toPublicProduct(p: SectionProduct): PublicProduct {
// //     return {
// //       id: p.id,
// //       name: p.name,
// //       slug: p.slug,
// //       sku: p.sku ?? null,
// //       image: p.image ?? null,
// //       images: p.images ?? [],
// //       tags: p.tags ?? [],
// //       price: p.price,
// //       stock: p.stock,
// //       category: p.category ?? null,
// //       categorySlug: p.categorySlug ?? null,
// //       brand: p.brand ?? null,
// //       brandSlug: p.brandSlug ?? null,
// //     };
// //   }
// // }