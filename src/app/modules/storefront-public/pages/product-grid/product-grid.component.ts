import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionProduct, PADDING_MAP } from '../../dynamic-page/section.types';
import { PublicProduct } from '@core/models/storefront.model';
import { ProductCardComponent } from '../product-card/product-card';
import { StorefrontCartFacade } from '../../../../storefront/core/facades/storefront-cart.facade';
import { inject } from '@angular/core';

export interface ProductGridConfig extends SectionBaseConfig {
  title?: string;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  pagination?: boolean;
}

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="m3-grid-section" [ngStyle]="sectionStyle()">
  <div class="m3-grid-container">
    
    <header class="m3-grid-header">
      <h2 class="m3-grid-title">{{ cfg().title }}</h2>
    </header>

    <div class="m3-grid-layout" 
         [style.--desktop-cols]="cfg().columns" 
         [style.--grid-gap]="gapSize()">
         
      @for (product of mappedProducts; track product.id || $index; let i = $index) {
        <div class="m3-grid-item" [style.animation-delay]="(i * 40) + 'ms'">
          <app-product-card 
            [product]="product" 
            [orgSlug]="orgSlug" 
            [layout]="'grid'"
            (addToCart)="handleAddToCart($event)">
          </app-product-card>
        </div>
      } @empty {
        <div class="m3-grid-empty">
          <div class="m3-empty-icon-wrapper">
            <i class="pi pi-box"></i>
          </div>
          <h3 class="m3-empty-title">No products found</h3>
          <p class="m3-empty-desc">We couldn't find what you're looking for. Try adjusting your filters or checking back later.</p>
        </div>
      }

    </div>

    @if (cfg().pagination && mappedProducts.length > 0) {
      <div class="m3-grid-footer">
        <button class="m3-btn-outlined" type="button">
          <span>Load More</span>
        </button>
      </div>
    }

  </div>
</section>
  `,
  styles: [`
    /* --- M3 Standard Configuration --- */
    :host {
      display: block;
      width: 100%;
      --md-sys-color-primary: var(--theme-accent-primary, #1a73e8);
      --md-sys-color-surface: var(--bg-primary, var(--bg-primary));
      --md-sys-color-surface-variant: var(--bg-secondary, #f8f9fa);
      --md-sys-color-on-surface: var(--text-primary, #202124);
      --md-sys-color-on-surface-variant: var(--text-secondary, #5f6368);
      --md-sys-color-outline: var(--border-secondary, #dadce0);
      --md-sys-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
      
      font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .m3-grid-section {
      background-color: var(--md-sys-color-surface);
      transition: background-color 0.3s ease;
    }

    .m3-grid-container {
      max-width: 1440px; /* Standard premium width */
      margin: 0 auto;
      padding: 0 5%;
    }

    /* --- Header --- */
    .m3-grid-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 32px;
      
      @media(min-width: 768px) {
        margin-bottom: 48px;
      }
    }

    .m3-grid-title {
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0;
      line-height: 1.2;
      letter-spacing: -0.02em;
      opacity: 0;
      animation: m3-fade-up 0.8s var(--md-sys-easing-standard) forwards;
    }

    /* --- CSS Grid Layout --- */
    .m3-grid-layout {
      display: grid;
      /* Mobile: 1 column, or 2 if items are small enough */
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--grid-gap, 24px);
      
      @media(min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
      
      @media(min-width: 1024px) {
        /* Desktop uses dynamic columns bound from config */
        grid-template-columns: repeat(var(--desktop-cols, 4), 1fr);
      }
    }

    .m3-grid-item {
      opacity: 0;
      /* Staggered entrance animation applied via inline style delay */
      animation: m3-fade-up 0.8s var(--md-sys-easing-standard) forwards;
    }

    /* --- Empty State --- */
    .m3-grid-empty {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      background: var(--md-sys-color-surface-variant);
      border: 1px dashed var(--md-sys-color-outline);
      border-radius: 24px;
      text-align: center;
    }

    .m3-empty-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 1px 2px rgba(60,64,67,0.1);
    }

    .m3-empty-icon-wrapper i {
      font-size: 2rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .m3-empty-title {
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0 0 8px 0;
    }

    .m3-empty-desc {
      font-size: 1rem;
      color: var(--md-sys-color-on-surface-variant);
      max-width: 400px;
      line-height: 1.5;
      margin: 0;
    }

    /* --- Footer / Load More --- */
    .m3-grid-footer {
      display: flex;
      justify-content: center;
      margin-top: 56px;
    }

    .m3-btn-outlined {
      height: 48px;
      padding: 0 32px;
      border-radius: 100px;
      background: transparent;
      color: var(--md-sys-color-on-surface);
      border: 1px solid var(--md-sys-color-outline);
      font-family: 'Google Sans', sans-serif;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s var(--md-sys-easing-standard);
    }

    .m3-btn-outlined:hover {
      background: var(--md-sys-color-surface-variant);
      color: var(--md-sys-color-primary);
    }

    /* --- Keyframes --- */
    @keyframes m3-fade-up {
      0% { opacity: 0; transform: translateY(24px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProductGridComponent implements OnChanges {
  @Input() config: ProductGridConfig = {};
  @Input() data: SectionProduct[] | null = null; // Matches registry output
  @Input() products: any[] = []; // Fallback for backward compatibility
  @Input() orgSlug: string = '';

  @Output() addToCart = new EventEmitter<PublicProduct>();

  private cartFacade = inject(StorefrontCartFacade);

  mappedProducts: PublicProduct[] = [];

  readonly cfg = computed(() => ({
    title: this.config?.title ?? 'Shop All',
    columns: this.config?.columns ?? 4,
    gap: this.config?.gap ?? 'md',
    pagination: this.config?.pagination ?? false,
    paddingTop: this.config?.paddingTop ?? 'md',
    paddingBottom: this.config?.paddingBottom ?? 'md',
    backgroundColor: this.config?.backgroundColor ?? 'var(--md-sys-color-surface)'
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

  // Re-map whenever inputs change (supports dynamic page builder)
  ngOnChanges(): void {
    // Prefer "data" array if passed by registry, fallback to "products" array
    const sourceData = Array.isArray(this.data) ? this.data : (Array.isArray(this.products) ? this.products : []);
    this.mappedProducts = sourceData.map(p => this.toPublicProduct(p));
  }

  gapSize(): string {
    switch (this.cfg().gap) {
      case 'sm': return '16px';
      case 'lg': return '40px';
      case 'md':
      default: return '24px'; // M3 standard gap
    }
  }

  handleAddToCart(product: PublicProduct) {
    if (this.orgSlug) {
      this.cartFacade.add(this.orgSlug, { productId: product.id || (product as any)._id, quantity: 1 }).subscribe();
    }
    this.addToCart.emit(product);
  }

  // Safe type casting for the product card
  private toPublicProduct(p: any): PublicProduct {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? null,
      image: p.image ?? null,
      images: p.images ?? [],
      tags: p.tags ?? [],
      price: p.price ?? { current: 0, original: 0, currency: 'INR' },
      stock: p.stock ?? { available: true, quantity: 10 },
      category: p.category ?? null,
      categorySlug: p.categorySlug ?? null,
      brand: p.brand ?? null,
      brandSlug: p.brandSlug ?? null,
    };
  }
}

// // src/app/modules/storefront-public/pages/product-grid/product-grid.component.ts
// import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ProductCardComponent } from '../product-card/product-card';
// import { ProductGridConfig } from '@core/models/storefront.model';

// @Component({
//   selector: 'app-product-grid',
//   standalone: true,
//   imports: [CommonModule, ProductCardComponent],
//   templateUrl: './product-grid.component.html',
//   styleUrls: ['./product-grid.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class ProductGridComponent {

//   @Input() set config(v: ProductGridConfig) { this._config.set(v ?? {}); }
//   private _config = signal<ProductGridConfig>({});

//   @Input() products: any[] = [];
//   @Input() orgSlug: string = '';

//   @Output() addToCart = new EventEmitter<any>();

//   readonly cfg = computed(() => ({
//     title: this._config().title ?? 'Shop All',
//     columns: this._config().columns ?? 4,
//     gap: this._config().gap ?? 'md',
//     pagination: this._config().pagination ?? false,
//     paddingTop: this._config().paddingTop ?? 'md',
//     paddingBottom: this._config().paddingBottom ?? 'md',
//     backgroundColor: this._config().backgroundColor ?? ''
//   }));

//   readonly paddingMap: Record<string, string> = {
//     none: '0',
//     sm: 'var(--spacing-3xl)',
//     md: 'var(--spacing-5xl)',
//     lg: 'calc(var(--spacing-5xl) * 1.5)',
//     xl: 'calc(var(--spacing-5xl) * 2)'
//   };

//   readonly sectionStyle = computed(() => ({
//     'padding-top': this.paddingMap[this.cfg().paddingTop] ?? this.paddingMap['md'],
//     'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md'],
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   handleAddToCart(product: any) {
//     this.addToCart.emit(product);
//   }
// }