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
  design?: any;       // Upgraded: Handles customBackground
  typography?: any;   // Upgraded: Handles custom fonts and text colors
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
    <section class="m3-grid-section" [ngStyle]="sectionStyle()">
      <div class="m3-grid-container">
        
        <header class="m3-grid-header">
          <h2 class="m3-grid-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
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
                [config]="cfg()" 
                (addToCart)="handleAddToCart($event)">
              </app-product-card>
            </div>
          } @empty {
            <div class="m3-grid-empty" [ngStyle]="{'background-color': cfg().design.customBackground ? 'rgba(0,0,0,0.02)' : 'var(--md-sys-color-surface-variant)'}">
              <div class="m3-empty-icon-wrapper">
                <i class="pi pi-box" [ngStyle]="{'color': cfg().typography.headingColor || 'var(--md-sys-color-on-surface-variant)'}"></i>
              </div>
              <h3 class="m3-empty-title" [ngStyle]="headingStyle()">No products found</h3>
              <p class="m3-empty-desc" [ngStyle]="bodyStyle()">We couldn't find what you're looking for. Try adjusting your filters or checking back later.</p>
            </div>
          }

        </div>

        @if (cfg().pagination && mappedProducts.length > 0) {
          <div class="m3-grid-footer">
            <button class="m3-btn-outlined" type="button" [ngStyle]="buttonStyle()">
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
      display: block; width: 100%;
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

    .m3-grid-section { background-color: var(--md-sys-color-surface); transition: background-color 0.3s ease; }

    .m3-grid-container { max-width: 1440px; margin: 0 auto; padding: 0 5%; }

    /* --- Header --- */
    .m3-grid-header { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 32px; }
    @media(min-width: 768px) { .m3-grid-header { margin-bottom: 48px; } }

    .m3-grid-title {
      font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; color: var(--md-sys-color-on-surface); margin: 0; line-height: 1.2; letter-spacing: -0.02em;
      opacity: 0; animation: m3-fade-up 0.8s var(--md-sys-easing-standard) forwards;
    }

    /* --- CSS Grid Layout --- */
    .m3-grid-layout {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--grid-gap, 24px);
    }
    @media(min-width: 768px) { .m3-grid-layout { grid-template-columns: repeat(2, 1fr); } }
    @media(min-width: 1024px) { .m3-grid-layout { grid-template-columns: repeat(var(--desktop-cols, 4), 1fr); } }

    .m3-grid-item { opacity: 0; animation: m3-fade-up 0.8s var(--md-sys-easing-standard) forwards; }

    /* --- Empty State --- */
    .m3-grid-empty {
      grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 24px;
      background: var(--md-sys-color-surface-variant); border: 1px dashed var(--md-sys-color-outline); border-radius: 24px; text-align: center;
    }

    .m3-empty-icon-wrapper {
      width: 80px; height: 80px; border-radius: 50%; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline);
      display: flex; align-items: center; justify-content: center; margin-bottom: 24px; box-shadow: 0 1px 2px rgba(60,64,67,0.1);
    }
    .m3-empty-icon-wrapper i { font-size: 2rem; color: var(--md-sys-color-on-surface-variant); }

    .m3-empty-title { font-size: 1.5rem; font-weight: 600; color: var(--md-sys-color-on-surface); margin: 0 0 8px 0; }
    .m3-empty-desc { font-size: 1rem; color: var(--md-sys-color-on-surface-variant); max-width: 400px; line-height: 1.5; margin: 0; }

    /* --- Footer / Load More --- */
    .m3-grid-footer { display: flex; justify-content: center; margin-top: 56px; }

    .m3-btn-outlined {
      height: 48px; padding: 0 32px; border-radius: 100px; background: transparent; color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline);
      font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s var(--md-sys-easing-standard);
    }
    .m3-btn-outlined:hover { background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-primary); }

    /* --- Keyframes --- */
    @keyframes m3-fade-up { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }
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
    backgroundColor: this.config?.backgroundColor ?? 'var(--md-sys-color-surface)'
  }));

  // --- Dynamic Style Mappings ---

  readonly sectionStyle = computed(() => {
    return {
      ...sectionPaddingStyles(this.config, 'md'),
      'background-color': this.cfg().design?.customBackground || this.cfg().backgroundColor || 'transparent'
    };
  });

  headingStyle() {
    return headingStyle(this.config);
  }

  bodyStyle() {
    return bodyStyle(this.config);
  }

  buttonStyle() {
    return {
      ...headingStyle(this.config),
      'border-color': this.cfg().typography?.headingColor || 'var(--md-sys-color-outline)'
    };
  }

  ngOnChanges(): void {
    const sourceData = Array.isArray(this.data) ? this.data : (Array.isArray(this.products) ? this.products : []);
    this.mappedProducts = sourceData.map(p => toPublicProduct(p as any));
  }

  gapSize(): string {
    switch (this.cfg().gap) {
      case 'sm': return '16px';
      case 'lg': return '40px';
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

}// import { Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy, OnChanges, ViewEncapsulation, inject } from '@angular/core';
