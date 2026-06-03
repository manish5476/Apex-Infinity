import { Component, Input, Output, EventEmitter, computed, ChangeDetectionStrategy, OnChanges, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionBaseConfig, SectionProduct } from '../../dynamic-page/section.types';
import { PublicProduct } from '@core/models/storefront.model';
import { ProductCardComponent } from '../product-card/product-card';
import { StorefrontCartFacade } from '../../../../storefront/core/facades/storefront-cart.facade';
import { bodyStyle, headingStyle, normalizeDesign, normalizeTypography, resolveSectionTitle, sectionPaddingStyles, toPublicProduct } from '../../dynamic-page/section-config.utils';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface ProductGridConfig extends SectionBaseConfig {
  title?: string;
  columns?: 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  pagination?: boolean;
  design?: any;
  typography?: any;
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="storefront-grid-section" [ngStyle]="sectionStyle()">
      <div class="grid-container">
        
        <header class="section-header" 
                [style.justify-content]="headerAlignment()" 
                [style.text-align]="cfg().typography.alignment || 'left'">
          <div class="header-content">
            <h2 class="section-title" [ngStyle]="headingStyle()">
              {{ cfg().title }}
            </h2>
            @if (cfg().typography.subText) {
              <p class="section-subtitle" [ngStyle]="bodyStyle()">
                {{ cfg().typography.subText }}
              </p>
            }
          </div>
        </header>
        <div class="product-grid"  [style.--desktop-cols]="cfg().columns"  [style.--grid-gap]="gapSize()">
          @for (product of mappedProducts; track product.id || $index; let i = $index) {
            <div class="grid-item" [style.animation-delay]="(i * 30) + 'ms'">
              <app-product-card [product]="product" [orgSlug]="orgSlug" [layout]="'grid'"[config]="cfg()" (addToCart)="handleAddToCart($event)"></app-product-card>
            </div>
          } @empty {
            <div class="empty-state" [ngStyle]="{'background-color': cfg().design.customBackground ? 'rgba(0,0,0,0.02)' : 'var(--bg-secondary, #f8fafc)'}">
              <div class="empty-icon">
                <i class="pi pi-inbox" [ngStyle]="{'color': cfg().typography.headingColor || 'var(--text-tertiary, #94a3b8)'}"></i>
              </div>
              <h3 class="empty-title" [ngStyle]="headingStyle()">No products available</h3>
              <p class="empty-desc" [ngStyle]="bodyStyle()">
                We couldn't find any products in this section right now. Please check back later.
              </p>
            </div>
          }

        </div>

        @if (cfg().pagination && mappedProducts.length > 0) {
          <div class="grid-footer">
            <button class="load-more-btn" type="button" 
                    [style.border-color]="cfg().typography.headingColor || 'var(--border-primary, #e2e8f0)'"
                    [style.color]="cfg().typography.headingColor || 'var(--text-primary, #0f172a)'">
              <span>View All</span>
              <i class="pi pi-arrow-right"></i>
            </button>
          </div>
        }

      </div>
    </section>
  `,
  styles: [`
    /* --- Base Framework --- */
    :host {
      display: block; 
      width: 100%;
    }

    .storefront-grid-section {
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      transition: background-color 0.3s ease;
    }

    .grid-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 var(--spacing-4xl, 2rem);
    }

    /* --- Header --- */
    .section-header {
      display: flex;
      width: 100%;
      margin-bottom: var(--spacing-4xl, 3rem);
    }

    .header-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 800px;
    }

    .section-title {
      margin: 0;
      line-height: 1.1;
      opacity: 0; 
      animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .section-subtitle {
      margin: 0;
      opacity: 0.8;
      animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
    }

    /* --- CSS Grid Layout --- */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr); /* Default mobile: 2 cols */
      gap: var(--grid-gap, 24px);
    }
    
    /* Tablet */
    @media (min-width: 768px) {
      .product-grid {
        grid-template-columns: repeat(min(3, var(--desktop-cols)), 1fr);
      }
    }
    
    /* Desktop */
    @media (min-width: 1024px) {
      .product-grid {
        grid-template-columns: repeat(var(--desktop-cols, 4), 1fr);
      }
    }

    .grid-item {
      opacity: 0;
      animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* --- Premium Empty State --- */
    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 2rem;
      border-radius: var(--ui-border-radius-lg, 12px);
      text-align: center;
      border: 1px dashed var(--border-secondary, #cbd5e1);
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--bg-primary, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .empty-icon i {
      font-size: 1.5rem;
    }

    .empty-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
    }

    .empty-desc {
      margin: 0;
      max-width: 360px;
      opacity: 0.7;
    }

    /* --- Footer / Load More --- */
    .grid-footer {
      display: flex;
      justify-content: center;
      margin-top: 4rem;
    }

    .load-more-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      height: 48px;
      padding: 0 2rem;
      border-radius: 99px;
      background: transparent;
      border: 1px solid; /* Color driven by inline styles */
      font-weight: 600;
      font-size: 0.95rem;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .load-more-btn:hover {
      background: var(--bg-secondary, #f8fafc);
      transform: translateY(-2px);
    }

    /* --- Mobile Responsive Padding --- */
    @media (max-width: 767px) {
      .grid-container {
        padding: 0 1rem;
      }
      .section-header {
        margin-bottom: 2rem;
      }
      .grid-footer {
        margin-top: 2.5rem;
      }
    }

    /* --- Keyframes --- */
    @keyframes fade-up {
      0% { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProductGridComponent implements OnChanges {
  @Input() config: ProductGridConfig = {};
  @Input() data: SectionProduct[] | null = null;
  @Input() products: any[] = [];
  @Input() orgSlug: string = '';
  @Output() addToCart = new EventEmitter<PublicProduct>();

  private cartFacade = inject(StorefrontCartFacade);

  mappedProducts: PublicProduct[] = [];

  readonly cfg = computed(() => ({
    title: resolveSectionTitle(this.config, 'Shop All'),
    columns: this.config?.columns ?? 4,
    gap: this.config?.gap ?? 'md',
    pagination: this.config?.pagination ?? false,
    design: normalizeDesign(this.config),
    typography: normalizeTypography(this.config),
    paddingTop: this.config?.paddingTop ?? 'md',
    paddingBottom: this.config?.paddingBottom ?? 'md',
    backgroundColor: this.config?.backgroundColor || 'var(--bg-primary, #ffffff)'
  }));

  // --- Dynamic Style Mappings ---

  readonly sectionStyle = computed(() => {
    return {
      ...sectionPaddingStyles(this.config, 'md'),
      'background-color': this.cfg().design?.customBackground || this.cfg().backgroundColor
    };
  });

  headerAlignment(): string {
    const align = this.cfg().typography?.alignment;
    if (align === 'center') return 'center';
    if (align === 'right') return 'flex-end';
    return 'flex-start';
  }

  headingStyle() {
    return headingStyle(this.config);
  }

  bodyStyle() {
    return bodyStyle(this.config);
  }

  ngOnChanges(): void {
    const sourceData = Array.isArray(this.data) ? this.data : (Array.isArray(this.products) ? this.products : []);
    this.mappedProducts = sourceData.map(p => toPublicProduct(p as any));
  }

  gapSize(): string {
    // Maps your specific 'sm', 'md', 'lg' gap config to CSS values
    switch (this.cfg().gap) {
      case 'sm': return '12px';
      case 'lg': return '40px'; /* The 'lg' from your JSON will yield a nice wide 40px gap */
      case 'md':
      default: return '24px';
    }
  }

  handleAddToCart(product: PublicProduct) {
    if (this.orgSlug) {
      this.cartFacade.add(this.orgSlug, { productId: product.id || (product as any)._id, quantity: 1 }).subscribe();
    }
    this.addToCart.emit(product);
  }
}
