

// ============================================================================
// product-slider.component.ts
// ============================================================================
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { SectionBaseConfig, SectionProduct, PADDING_MAP } from '../../../storefront-admin/schema/section.types';
import { ProductCardComponent } from "../product-card/product-card";

interface ProductSliderConfig extends SectionBaseConfig {
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
<section class="ps-section" [style.paddingTop]="pt" [style.paddingBottom]="pb"
  [style.backgroundColor]="config.backgroundColor || 'transparent'">
  <div class="ps-container">
    @if (config.title) {
      <div class="ps-header">
        <h2 class="ps-title">{{ config.title }}</h2>
        <a href="/products" class="ps-see-all">View all <i class="pi pi-arrow-right"></i></a>
      </div>
    }

    @if (!products.length) {
      <div class="ps-empty">
        <i class="pi pi-shopping-bag ps-empty-icon"></i>
        <span>No products configured</span>
      </div>
    } @else {
      <div class="ps-track-wrapper">
        <button class="ps-nav ps-nav--prev" (click)="prev()" aria-label="Previous">
          <i class="pi pi-chevron-left"></i>
        </button>

        <div class="ps-track" #track
          [style.transform]="'translateX(-' + (offset() * slideWidth) + 'px)'">
          @for (product of products; track product.id) {
            <div class="ps-card" [style.minWidth]="slideWidth + 'px'">
              <app-product-card [product]="$any(product)">
              </app-product-card>
            </div>
          }
        </div>

        <button class="ps-nav ps-nav--next" (click)="next()" aria-label="Next">
          <i class="pi pi-chevron-right"></i>
        </button>
      </div>
    }
  </div>
</section>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .ps-section { overflow: hidden; }
    .ps-container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
    .ps-header {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 24px;
    }
    .ps-title {
      font-family: var(--font-heading, sans-serif);
      font-size: clamp(1.25rem, 2.5vw, 1.75rem);
      font-weight: 700;
      color: var(--theme-text-primary, #111);
      margin: 0;
    }
    .ps-see-all {
      font-size: 0.8125rem; font-weight: 600;
      color: var(--theme-accent-primary, #2563eb);
      text-decoration: none; display: flex; align-items: center; gap: 4px;
      &:hover { text-decoration: underline; }
    }
    .ps-empty {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 64px; color: var(--theme-text-tertiary, #9ca3af);
    }
    .ps-empty-icon { font-size: 2.5rem; opacity: 0.3; }
    .ps-track-wrapper {
      position: relative;
      overflow: hidden;
    }
    .ps-track {
      display: flex;
      gap: 16px;
      transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.2, 1);
    }
    .ps-card { flex-shrink: 0; }
    .ps-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      z-index: 5; width: 36px; height: 36px; border-radius: 50%;
      background: var(--theme-bg-primary, #fff);
      border: 1px solid var(--theme-border-primary, #e5e7eb);
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s;
      color: var(--theme-text-primary, #111);
      &:hover { background: var(--theme-accent-primary, #2563eb); color: #fff; border-color: var(--theme-accent-primary, #2563eb); }
    }
    .ps-nav--prev { left: -18px; }
    .ps-nav--next { right: -18px; }
  `]
})
export class ProductSliderComponent implements OnInit {
  @Input() config: ProductSliderConfig = {};
  @Input() data: SectionProduct[] | null = null;

  products: SectionProduct[] = [];
  pt = '0'; pb = '0';
  slideWidth = 260;
  offset = signal(0);

  ngOnInit(): void {
    this.pt = PADDING_MAP[this.config.paddingTop ?? 'md'];
    this.pb = PADDING_MAP[this.config.paddingBottom ?? 'md'];
    this.products = Array.isArray(this.data) ? this.data : [];
    // Calculate slide width based on itemsPerView
    const perView = this.config.itemsPerView ?? 4;
    // Will be recalculated on render but set a default
    this.slideWidth = Math.floor((1232 - (perView - 1) * 16) / perView);
  }

  prev(): void {
    this.offset.update(v => Math.max(0, v - 1));
  }

  next(): void {
    const max = Math.max(0, this.products.length - (this.config.itemsPerView ?? 4));
    this.offset.update(v => Math.min(max, v + 1));
  }
}




// // src/app/modules/storefront-public/components/product-slider/product-slider.component.ts
// import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, inject, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { ProductCardComponent } from '../../components/product-card/product-card';
// import { ProductSliderConfig } from '@core/models/storefront.model';
// import { Subject } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// @Component({
//   selector: 'app-product-slider',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ProductCardComponent],
//   templateUrl: './product-slider.component.html',
//   styleUrls: ['./product-slider.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class ProductSliderComponent implements OnInit, AfterViewInit, OnDestroy {
//     private readonly destroy$ = new Subject<void>();

//   @Input() set config(v: ProductSliderConfig) { this._config.set(v ?? {}); }
//   private _config = signal<ProductSliderConfig>({});
  
//   @Input() products: any[] = [];
  
//   @ViewChild('sliderContainer') sliderContainer!: ElementRef;

//   private route = inject(ActivatedRoute);
//   orgSlug = signal<string>('');

//   readonly cfg = computed(() => ({
//     title:         this._config().title         ?? 'Top Products',
//     itemsPerView:  this._config().itemsPerView  ?? 4,
//     showPrice:     this._config().showPrice     ?? true,
//     showAddToCart: this._config().showAddToCart ?? true,
//     autoPlay:      this._config().autoPlay      ?? false,
//     paddingTop:    this._config().paddingTop    ?? 'md',
//     paddingBottom: this._config().paddingBottom ?? 'md',
//     backgroundColor: this._config().backgroundColor ?? ''
//   }));
  
//   // Scroll State
//   canScrollLeft = signal(false);
//   canScrollRight = signal(true);
//   autoSlideInterval: any;

//   // Layout Mappers
//   readonly paddingMap: Record<string, string> = {
//     none: '0',
//     sm: 'var(--spacing-3xl)', 
//     md: 'var(--spacing-5xl)', 
//     lg: 'calc(var(--spacing-5xl) * 1.5)',
//     xl: 'calc(var(--spacing-5xl) * 2)'
//   };

//   readonly sectionStyle = computed(() => ({
//     'padding-top':    this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['md'],
//     'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md'],
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   // Compute Card Flex Basis for Desktop
//   cardFlexBasis = computed(() => {
//     const items = this.cfg().itemsPerView;
//     return `calc((100% - ${(items - 1) * 24}px) / ${items})`;
//   });

//   ngOnInit(): void {
//     this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
//       this.orgSlug.set(params.get('orgSlug') || '');
//     });
//   }

//   ngAfterViewInit() {
//     setTimeout(() => this.checkScrollButtons(), 200);
//     if (this.cfg().autoPlay) {
//       this.startAutoSlide();
//     }
//   }

//   ngOnDestroy() {
//     this.pauseAutoSlide();
//       this.destroy$.next();
//       this.destroy$.complete();
//   }

//   scroll(direction: 'left' | 'right') {
//     const container = this.sliderContainer.nativeElement;
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
//       this.canScrollLeft.set(el.scrollLeft > 10);
//       this.canScrollRight.set(el.scrollLeft < (el.scrollWidth - el.clientWidth - 10));
//     }
//   }

//   startAutoSlide() {
//     const delay = 4000;
//     this.autoSlideInterval = setInterval(() => {
//       if (this.canScrollRight()) {
//         this.scroll('right');
//       } else {
//         this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
//         setTimeout(() => this.checkScrollButtons(), 500);
//       }
//     }, delay);
//   }

//   pauseAutoSlide() {
//     if (this.autoSlideInterval) {
//       clearInterval(this.autoSlideInterval);
//       this.autoSlideInterval = null;
//     }
//   }

//   handleAddToCart(product: any) {
//     console.log('Add to cart clicked:', product.name);
//   }
// }
