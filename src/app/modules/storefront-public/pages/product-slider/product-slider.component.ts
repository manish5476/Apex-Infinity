import {
  Component, Input, OnInit, OnChanges, OnDestroy, AfterViewInit, 
  ChangeDetectionStrategy, signal, ViewChild, ElementRef, computed, inject, PLATFORM_ID, ViewEncapsulation
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SectionBaseConfig, SectionProduct } from '../../dynamic-page/section.types';
import { PublicProduct } from '@core/models/storefront.model';
import { ProductCardComponent } from '../product-card/product-card';
import { StorefrontCartFacade } from '../../../../storefront/core/facades/storefront-cart.facade';
import { headingStyle, normalizeDesign, normalizeTypography, resolveSectionTitle, sectionPaddingStyles, toPublicProduct } from '../../dynamic-page/section-config.utils';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface ProductSliderConfig extends SectionBaseConfig {
  title?: string;
  itemsPerView?: number;
  showPrice?: boolean;
  showAddToCart?: boolean;
  autoPlay?: boolean;
  design?: any;       // Upgraded: Handles customBackground
  typography?: any;   // Upgraded: Handles custom fonts
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-product-slider',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section-root" [ngStyle]="sectionStyle()">
      <div class="container-wrapper standard">

        <header class="header-row">
          <div class="title-group">
            <h2 class="section-title animate-fade-in delay-1" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
          </div>

          @if (products().length > cfg().itemsPerView) {
            <div class="nav-controls animate-fade-in delay-1">
              <button class="nav-btn prev" [disabled]="!canScrollLeft()" (click)="scroll('left'); pauseAutoSlide()" aria-label="Previous Slide">
                <i class="pi pi-arrow-left"></i>
              </button>
              <button class="nav-btn next" [disabled]="!canScrollRight()" (click)="scroll('right'); pauseAutoSlide()" aria-label="Next Slide">
                <i class="pi pi-arrow-right"></i>
              </button>
            </div>
          }
        </header>

        <div class="slider-viewport animate-fade-in delay-2" #sliderContainer (scroll)="checkScrollButtons()"
             (touchstart)="pauseAutoSlide()" (mouseenter)="pauseAutoSlide()">

          @if (products().length === 0) {
            @for (i of [1,2,3,4,5]; track i) {
              <div class="slider-item"><div class="skeleton-card"></div></div>
            }
          } @else {
            @for (product of products(); track product.id || $index) {
              <div class="slider-item" [style.flex-basis]="cardFlexBasis()">
                <app-product-card 
                  [product]="product" 
                  [orgSlug]="organizationSlug"
                  [config]="cfg()" 
                  (addToCart)="handleAddToCart($event)"
                  class="h-full block">
                </app-product-card>
              </div>
            }
          }
        </div>

        @if (canScrollRight() && products().length > 2) {
          <div class="mobile-progress"><div class="progress-bar"></div></div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .section-root { position: relative; overflow: hidden; transition: padding 0.3s ease, background-color 0.3s ease; }
    .container-wrapper { position: relative; z-index: 10; margin: 0 auto; padding: 0 var(--spacing-2xl, 2rem); max-width: 1440px; }
    .header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-4xl, 2.5rem); }
    .section-title { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; line-height: 1.1; margin: 0; }
    .nav-controls { display: none; gap: var(--spacing-sm, 0.5rem); }
    @media (min-width: 768px) { .nav-controls { display: flex; } }
    .nav-btn { width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--border-secondary, #e5e7eb); background: var(--bg-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    .nav-btn:hover:not(:disabled) { border-color: var(--accent-primary); background: var(--accent-primary); color: white; transform: scale(1.05); }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .slider-viewport { display: flex; gap: var(--spacing-lg, 1.5rem); overflow-x: auto; scroll-behavior: smooth; padding: var(--spacing-sm, 0.5rem) 0 var(--spacing-3xl, 2rem) 0; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .slider-viewport::-webkit-scrollbar { display: none; }
    .slider-item { flex-shrink: 0; scroll-snap-align: start; height: 100%; width: 280px; }
    @media (min-width: 768px) { .slider-item { width: auto; } }
    .skeleton-card { width: 100%; height: 400px; background: var(--bg-secondary); border-radius: var(--ui-border-radius-lg, 1rem); position: relative; overflow: hidden; }
    .mobile-progress { display: block; width: 100%; max-width: 200px; height: 2px; background: var(--border-secondary); margin: 0 auto; border-radius: 10px; overflow: hidden; }
    @media (min-width: 768px) { .mobile-progress { display: none; } }
    .progress-bar { height: 100%; background: var(--accent-primary); width: 25%; border-radius: 10px; animation: slideIndicate 2s infinite ease-in-out; }
    @keyframes slideIndicate { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(300%); } }
  `]
})
export class ProductSliderComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  
  @Input() config: ProductSliderConfig = {};
  @Input() data: SectionProduct[] | null = null;
  @Input() organizationSlug = ''; 

  @ViewChild('sliderContainer') sliderContainer!: ElementRef<HTMLElement>;

  products = signal<PublicProduct[]>([]);
  canScrollLeft = signal(false);
  canScrollRight = signal(true);
  
  private cartFacade = inject(StorefrontCartFacade);
  private _autoPlayTimer: any;

  readonly cfg = computed(() => ({
    title: resolveSectionTitle(this.config, 'Featured Products'),
    itemsPerView: this.config?.itemsPerView || 4,
    design: normalizeDesign(this.config),
    typography: normalizeTypography(this.config),
    paddingTop: this.config?.paddingTop || 'md',
    paddingBottom: this.config?.paddingBottom || 'md',
    backgroundColor: this.config?.design?.customBackground || 'var(--bg-primary)'
  }));

  readonly sectionStyle = computed(() => {
    return {
      ...sectionPaddingStyles(this.config, 'md'),
      'background-color': this.cfg().backgroundColor
    };
  });

  headingStyle() {
    return headingStyle(this.config);
  }

  cardFlexBasis(): string {
    const perView = this.cfg().itemsPerView;
    const gap = 1.5; 
    return `calc((100% - ${(perView - 1) * gap}rem) / ${perView})`;
  }

  ngOnInit() { this.updateData(); }
  ngOnChanges() { this.updateData(); }
  
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.checkScrollButtons(), 150);
      this.initAutoPlay();
    }
  }

  ngOnDestroy() { this.pauseAutoSlide(); }

  private updateData() {
    const sourceData = Array.isArray(this.data) ? this.data : [];
    this.products.set(sourceData.map(p => toPublicProduct(p as any)));
  }

  scroll(direction: 'left' | 'right') {
    if (!isPlatformBrowser(this.platformId) || !this.sliderContainer) return;
    const el = this.sliderContainer.nativeElement;
    const scrollAmount = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 24 : el.clientWidth;
    el.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    setTimeout(() => this.checkScrollButtons(), 350);
  }

  checkScrollButtons() {
    if (!isPlatformBrowser(this.platformId) || !this.sliderContainer?.nativeElement) return;
    const el = this.sliderContainer.nativeElement;
    this.canScrollLeft.set(el.scrollLeft > 1);
    this.canScrollRight.set(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 1);
  }
  
  private initAutoPlay() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.pauseAutoSlide();
    if (this.config?.autoPlay && this.products().length > this.cfg().itemsPerView) {
      this._autoPlayTimer = setInterval(() => {
        if (!this.sliderContainer?.nativeElement) return;
        if (!this.canScrollRight()) this.sliderContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        else this.scroll('right');
      }, 3500); 
    }
  }

  pauseAutoSlide() {
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

}
