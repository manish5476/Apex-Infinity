import { Component, Input, computed, ChangeDetectionStrategy, OnChanges, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionBaseConfig, PADDING_MAP } from '../../dynamic-page/section.types';
import { PublicProduct } from '@core/models/storefront.model';
import { StorefrontStateService } from '@core/services/storefront-state.service';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface FeaturedProductConfig extends SectionBaseConfig {
  title?: string;
  layout?: 'image_left' | 'image_right';
  showDescription?: boolean;
  showReviews?: boolean;
  productId?: string;
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  backgroundImage?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-featured-product',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="prem-featured" [ngStyle]="sectionStyle()">
      
      @if (cfg().backgroundImage) {
        <div class="prem-bg-image" [style.background-image]="'url(' + cfg().backgroundImage + ')'"></div>
        <div class="prem-bg-overlay"></div>
      }

      <div class="prem-featured__container relative z-10">
        
        @if (!mappedProduct) {
          <div class="prem-empty">
            <div class="prem-empty__icon"><i class="pi pi-box"></i></div>
            <h3 class="prem-empty__title" [ngStyle]="headingStyle()">Feature a Product</h3>
            <p class="prem-empty__desc" [ngStyle]="bodyStyle()">Select a product from your catalog to showcase it here.</p>
          </div>
        } @else {
          
          <div class="prem-grid" [class.prem-grid--reversed]="cfg().layout === 'image_right'">
            
            <div class="prem-media group">
              <div class="prem-media__glow" aria-hidden="true" [ngStyle]="{'background': glowStyle()}"></div>
              
              <div class="prem-media__card" [ngStyle]="cardStyle()">
                <img [src]="mappedProduct.image || 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg'" 
                     [alt]="mappedProduct.name"
                     class="prem-media__img" loading="lazy" />
                
                @if (mappedProduct.price.hasDiscount) {
                  <div class="prem-badge">
                    Save {{ mappedProduct.price.discountPercentage || calculateDiscount() }}%
                  </div>
                }
              </div>
            </div>

            <div class="prem-content">
              
              <div class="prem-content__header">
                @if (mappedProduct.brand || mappedProduct.category) {
                  <span class="prem-eyebrow" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}">
                    {{ mappedProduct.brand || mappedProduct.category }}
                  </span>
                }
                <h2 class="prem-title" [ngStyle]="headingStyle()">{{ mappedProduct.name }}</h2>
              </div>

              <div class="prem-price-row">
                <span class="prem-price-current" [ngStyle]="headingStyle()">
                  {{ mappedProduct.price.current | currency:(mappedProduct.price.currency || 'INR') : 'symbol' : '1.0-0' }}
                </span>
                @if (mappedProduct.price.hasDiscount) {
                  <span class="prem-price-old" [ngStyle]="bodyStyle()">
                    {{ mappedProduct.price.original | currency:(mappedProduct.price.currency || 'INR') : 'symbol' : '1.0-0' }}
                  </span>
                }
              </div>

              @if (cfg().showDescription !== false) {
                <p class="prem-desc" [ngStyle]="bodyStyle()">
                  {{ mappedProduct.description || 'Discover the exceptional quality and design of ' + mappedProduct.name + '. Expertly crafted to elevate your experience and integrate seamlessly into your everyday life.' }}
                </p>
              }

              <div class="prem-actions">
                <button class="prem-btn prem-btn--primary" type="button" 
                        [ngStyle]="{'background-color': cfg().typography?.headingColor || 'var(--accent-primary)'}">
                  <span>Add to Cart</span>
                  <i class="pi pi-arrow-right"></i>
                </button>
                <a [routerLink]="['/store', orgSlug(), 'products', mappedProduct.slug]" 
                   class="prem-btn prem-btn--secondary"
                   [ngStyle]="{'color': cfg().backgroundImage ? '#ffffff' : 'var(--text-primary)', 'border-color': cfg().backgroundImage ? 'rgba(255,255,255,0.3)' : 'var(--border-primary)'}">
                  <span>View Details</span>
                </a>
              </div>
              
              <div class="prem-trust" [ngStyle]="{'border-color': cfg().backgroundImage ? 'rgba(255,255,255,0.2)' : 'var(--border-secondary)'}">
                 <div class="prem-trust__item" [ngStyle]="bodyStyle()">
                   <div class="prem-trust__icon" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}"><i class="pi pi-shield"></i></div>
                   <span>Warranty</span>
                 </div>
                 <div class="prem-trust__item" [ngStyle]="bodyStyle()">
                   <div class="prem-trust__icon" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}"><i class="pi pi-send"></i></div>
                   <span>Shipping</span>
                 </div>
                 <div class="prem-trust__item" [ngStyle]="bodyStyle()">
                   <div class="prem-trust__icon" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}"><i class="pi pi-refresh"></i></div>
                   <span>Returns</span>
                 </div>
              </div>
              
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    /* ==========================================================================
       APPLE / LINEAR PREMIUM AESTHETIC
       ========================================================================== */
    :host {
      display: block;
      width: 100%;
      --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    .prem-featured {
      position: relative;
      overflow: hidden;
      transition: background-color 0.5s var(--ease-smooth);
      width: 100%;
    }

    .prem-bg-image { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
    .prem-bg-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.65); z-index: 1; }

    .prem-featured__container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 5%;
    }

    .prem-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      align-items: center;
    }

    @media (min-width: 1024px) {
      .prem-grid { grid-template-columns: 1fr 1fr; gap: 6rem; }
      .prem-grid--reversed { direction: rtl; }
      .prem-grid--reversed > * { direction: ltr; }
    }

    .prem-media { position: relative; width: 100%; perspective: 1000px; }

    .prem-media__glow {
      position: absolute; inset: -10%;
      filter: blur(60px); opacity: 0.3; z-index: 0;
      transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
      transform: scale(0.9);
    }
    .prem-media:hover .prem-media__glow { opacity: 0.6; transform: scale(1.05); }

    .prem-media__card {
      position: relative; z-index: 1; width: 100%; aspect-ratio: 1 / 1;
      background-color: var(--bg-secondary);
      border: 1px solid color-mix(in srgb, var(--border-secondary) 50%, transparent);
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      transition: transform 0.6s var(--ease-spring), box-shadow 0.6s var(--ease-smooth);
    }
    @media (min-width: 768px) { .prem-media__card { aspect-ratio: 4 / 5; } }
    .prem-media:hover .prem-media__card { transform: translateY(-8px); }

    .prem-media__img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 0.8s var(--ease-smooth);
    }
    .prem-media:hover .prem-media__img { transform: scale(1.03); }

    .prem-badge {
      position: absolute; top: 1.5rem; left: 1.5rem;
      background: rgba(255, 255, 255, 0.8); color: var(--color-error, #ef4444);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 0.5rem 1rem; border-radius: 100px;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .prem-content { display: flex; flex-direction: column; z-index: 2; }

    .prem-eyebrow {
      display: inline-block; font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 1rem;
    }

    .prem-title {
      font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 1.5rem 0;
      /* Background clip preserves gradient if colors aren't overridden */
      background: linear-gradient(to right bottom, currentcolor 30%, color-mix(in srgb, currentcolor 60%, transparent));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .prem-price-row { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2rem; }
    .prem-price-current { font-size: 2.25rem; font-weight: 700; letter-spacing: -0.02em; }
    .prem-price-old { font-size: 1.25rem; font-weight: 500; text-decoration: line-through; opacity: 0.6; }

    .prem-desc { font-size: 1.125rem; line-height: 1.6; margin: 0 0 2.5rem 0; max-width: 500px; }

    .prem-actions { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 3rem; }
    @media (min-width: 640px) { .prem-actions { flex-direction: row; } }

    .prem-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem;
      height: 3.5rem; padding: 0 2.5rem; border-radius: 100px; font-size: 1rem; font-weight: 600;
      text-decoration: none; cursor: pointer; transition: all 0.3s var(--ease-spring);
    }
    
    .prem-btn--primary {
      color: var(--bg-primary); border: 1px solid transparent;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--accent-primary) 25%, transparent);
    }
    .prem-btn--primary:hover { transform: translateY(-2px); filter: brightness(1.1); }
    
    .prem-btn--secondary { background-color: transparent; border: 1px solid var(--border-primary); }
    .prem-btn--secondary:hover { background-color: color-mix(in srgb, currentcolor 5%, transparent); }

    .prem-trust { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding-top: 2rem; border-top: 1px solid var(--border-secondary); }
    .prem-trust__item { display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    
    .prem-trust__icon {
      width: 2.5rem; height: 2.5rem; border-radius: 50%;
      background: color-mix(in srgb, currentcolor 8%, transparent);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s var(--ease-spring);
    }
    .prem-trust__item:hover .prem-trust__icon { transform: scale(1.1) rotate(5deg); background: color-mix(in srgb, currentcolor 15%, transparent); }
    .prem-trust__item i { font-size: 1rem; }
    .prem-trust__item span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

    .prem-empty {
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6rem 2rem;
      background: color-mix(in srgb, var(--bg-secondary) 50%, transparent); border-radius: 2rem;
      border: 1px dashed var(--border-primary); text-align: center;
    }
    .prem-empty__icon {
      width: 5rem; height: 5rem; border-radius: 50%; background: var(--bg-primary); display: flex; align-items: center;
      justify-content: center; margin-bottom: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); color: var(--text-secondary);
    }
    .prem-empty__icon i { font-size: 2rem; }
    .prem-empty__title { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem 0; }
    .prem-empty__desc { max-width: 400px; }
  `]
})
export class FeaturedProductComponent implements OnChanges {
  @Input() config: FeaturedProductConfig = {};
  @Input() product: any = null;
  @Input() data: any = null;

  mappedProduct: (PublicProduct & { description?: string | null }) | null = null;

  constructor(private state: StorefrontStateService) { }

  orgSlug = computed(() => this.state.organization().slug || '');

  readonly cfg = computed(() => ({
    layout: this.config?.layout || 'image_left',
    showDescription: this.config?.showDescription ?? true,
    showReviews: this.config?.showReviews ?? true,
    paddingTop: this.config?.paddingTop ?? 'md',
    paddingBottom: this.config?.paddingBottom ?? 'md',
    design: this.config?.design,
    typography: this.config?.typography,
    backgroundImage: this.config?.backgroundImage
  }));

  readonly sectionStyle = computed(() => {
    const pt = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingTop] : '4rem';
    const pb = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingBottom] : '4rem';

    return {
      'padding-top': pt,
      'padding-bottom': pb,
      'background-color': this.cfg().design?.customBackground || 'transparent'
    };
  });

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().backgroundImage ? '#ffffff' : (this.cfg().typography?.headingColor || 'var(--text-primary)')
    };
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().backgroundImage ? 'rgba(255, 255, 255, 0.8)' : (this.cfg().typography?.bodyColor || 'var(--text-secondary)')
    };
  }

  cardStyle() {
    const base: any = {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`,
    };
    if (this.cfg().design?.boxShadow && this.cfg().design?.boxShadow !== 'none') {
      base['box-shadow'] = `var(--shadow-${this.cfg().design.boxShadow})`;
    }
    return base;
  }

  glowStyle() {
    const color = this.cfg().typography?.headingColor || 'var(--accent-primary)';
    return `radial-gradient(circle at center, color-mix(in srgb, ${color} 40%, transparent), transparent 60%)`;
  }

  ngOnChanges(): void {
    const rawData = this.product || this.data;
    const extractProduct = Array.isArray(rawData) ? rawData[0] : rawData;

    if (extractProduct && extractProduct.id) {
      this.mappedProduct = this.toPublicProduct(extractProduct);
    } else {
      this.mappedProduct = null;
    }
  }

  calculateDiscount(): number {
    if (!this.mappedProduct?.price) return 0;
    const { original, current } = this.mappedProduct.price;
    if (!original || !current || current >= original) return 0;
    return Math.round(((original - current) / original) * 100);
  }

  private toPublicProduct(p: any): PublicProduct & { description?: string | null } {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? null,
      image: p.image ?? null,
      images: p.images ?? [],
      tags: p.tags ?? [],
      description: p.description ?? null,
      price: p.price ?? { current: 0, original: 0, currency: 'INR' },
      stock: p.stock ?? { available: true, quantity: 10 },
      category: p.category ?? null,
      categorySlug: p.categorySlug ?? null,
      brand: p.brand ?? null,
      brandSlug: p.brandSlug ?? null,
    };
  }
}// import { Component, Input, computed, ChangeDetectionStrategy, OnChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { SectionBaseConfig, PADDING_MAP } from '../../dynamic-page/section.types';
// import { PublicProduct } from '@core/models/storefront.model';
// import { StorefrontStateService } from '@core/services/storefront-state.service';

// export interface FeaturedProductConfig extends SectionBaseConfig {
//   title?: string;
//   layout?: 'image_left' | 'image_right';
//   showDescription?: boolean;
//   showReviews?: boolean;
//   productId?: string;
// }

// @Component({
//   selector: 'app-featured-product',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
// <section class="prem-featured" [ngStyle]="sectionStyle()">
//   <div class="prem-featured__container">
    
//     @if (!mappedProduct) {
//       <div class="prem-empty">
//         <div class="prem-empty__icon">
//           <i class="pi pi-box"></i>
//         </div>
//         <h3 class="prem-empty__title">Feature a Product</h3>
//         <p class="prem-empty__desc">Select a product from your catalog to showcase it here.</p>
//       </div>
//     } @else {
      
//       <div class="prem-grid" [class.prem-grid--reversed]="cfg().layout === 'image_right'">
        
//         <div class="prem-media group">
//           <div class="prem-media__glow" aria-hidden="true"></div>
          
//           <div class="prem-media__card">
//             <img [src]="mappedProduct.image || 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg'" 
//                  [alt]="mappedProduct.name"
//                  class="prem-media__img" loading="lazy" />
            
//             @if (mappedProduct.price.hasDiscount) {
//               <div class="prem-badge">
//                 Save {{ mappedProduct.price.discountPercentage || calculateDiscount() }}%
//               </div>
//             }
//           </div>
//         </div>

//         <div class="prem-content">
          
//           <div class="prem-content__header">
//             @if (mappedProduct.brand || mappedProduct.category) {
//               <span class="prem-eyebrow">{{ mappedProduct.brand || mappedProduct.category }}</span>
//             }
//             <h2 class="prem-title">{{ mappedProduct.name }}</h2>
//           </div>

//           <div class="prem-price-row">
//             <span class="prem-price-current">
//               {{ mappedProduct.price.current | currency:(mappedProduct.price.currency || 'INR') : 'symbol' : '1.0-0' }}
//             </span>
//             @if (mappedProduct.price.hasDiscount) {
//               <span class="prem-price-old">
//                 {{ mappedProduct.price.original | currency:(mappedProduct.price.currency || 'INR') : 'symbol' : '1.0-0' }}
//               </span>
//             }
//           </div>

//           @if (cfg().showDescription !== false) {
//             <p class="prem-desc">
//               {{ mappedProduct.description || 'Discover the exceptional quality and design of ' + mappedProduct.name + '. Expertly crafted to elevate your experience and integrate seamlessly into your everyday life.' }}
//             </p>
//           }

//           <div class="prem-actions">
//             <button class="prem-btn prem-btn--primary" type="button">
//               <span>Add to Cart</span>
//               <i class="pi pi-arrow-right"></i>
//             </button>
//             <a [routerLink]="['/store', orgSlug(), 'products', mappedProduct.slug]" class="prem-btn prem-btn--secondary">
//               <span>View Details</span>
//             </a>
//           </div>
          
//           <div class="prem-trust">
//              <div class="prem-trust__item">
//                <div class="prem-trust__icon"><i class="pi pi-shield"></i></div>
//                <span>Warranty</span>
//              </div>
//              <div class="prem-trust__item">
//                <div class="prem-trust__icon"><i class="pi pi-send"></i></div>
//                <span>Shipping</span>
//              </div>
//              <div class="prem-trust__item">
//                <div class="prem-trust__icon"><i class="pi pi-refresh"></i></div>
//                <span>Returns</span>
//              </div>
//           </div>
          
//         </div>
//       </div>
//     }
//   </div>
// </section>
//   `,
//   styles: [`
//     /* ==========================================================================
//        APPLE / LINEAR PREMIUM AESTHETIC
//        ========================================================================== */
//     :host {
//       display: block;
//       width: 100%;
      
//       /* Premium Easing Curves */
//       --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1);
//       --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
//     }

//     .prem-featured {
//       background-color: var(--bg-primary, var(--bg-primary));
//       overflow: hidden;
//       transition: background-color 0.5s var(--ease-smooth);
//       font-family: var(--font-heading, 'Inter', -apple-system, sans-serif);
//       color: var(--text-primary, var(--text-primary));
//     }

//     .prem-featured__container {
//       max-width: 1440px;
//       margin: 0 auto;
//       padding: 0 5%;
//     }

//     /* --- Grid Layout --- */
//     .prem-grid {
//       display: grid;
//       grid-template-columns: 1fr;
//       gap: 3rem;
//       align-items: center;
//     }

//     @media (min-width: 1024px) {
//       .prem-grid {
//         grid-template-columns: 1fr 1fr;
//         gap: 6rem;
//       }
//       .prem-grid--reversed {
//         direction: rtl; /* Cleanest way to swap visual order */
//       }
//       .prem-grid--reversed > * {
//         direction: ltr; /* Reset text direction */
//       }
//     }

//     /* --- Media Area (Cinematic Shadow & Glow) --- */
//     .prem-media {
//       position: relative;
//       width: 100%;
//       perspective: 1000px; /* Prepares for 3D hover effects if desired */
//     }

//     .prem-media__glow {
//       position: absolute;
//       inset: -10%;
//       background: radial-gradient(circle at center, color-mix(in srgb, var(--theme-accent-primary, var(--accent-primary)) 40%, transparent), transparent 60%);
//       filter: blur(60px);
//       opacity: 0.3;
//       z-index: 0;
//       transition: opacity 0.8s var(--ease-smooth), transform 0.8s var(--ease-smooth);
//       transform: scale(0.9);
//     }

//     .prem-media:hover .prem-media__glow {
//       opacity: 0.6;
//       transform: scale(1.05);
//     }

//     .prem-media__card {
//       position: relative;
//       z-index: 1;
//       width: 100%;
//       aspect-ratio: 1 / 1;
//       border-radius: 2rem; /* Smooth Apple-like corners */
//       background-color: var(--bg-secondary, var(--bg-secondary));
//       border: 1px solid color-mix(in srgb, var(--border-secondary, var(--border-primary)) 50%, transparent);
//       box-shadow: 
//         0 4px 6px -1px rgba(0, 0, 0, 0.05),
//         0 20px 40px -10px rgba(0, 0, 0, 0.1);
//       overflow: hidden;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       transition: transform 0.6s var(--ease-spring), box-shadow 0.6s var(--ease-smooth);
//     }

//     @media (min-width: 768px) {
//       .prem-media__card { aspect-ratio: 4 / 5; }
//     }

//     .prem-media:hover .prem-media__card {
//       transform: translateY(-8px);
//       box-shadow: 
//         0 10px 15px -3px rgba(0, 0, 0, 0.05),
//         0 30px 60px -15px color-mix(in srgb, var(--theme-accent-primary, var(--accent-primary)) 20%, rgba(0,0,0,0.15));
//     }

//     .prem-media__img {
//       width: 100%;
//       height: 100%;
//       object-fit: cover;
//       transition: transform 0.8s var(--ease-smooth);
//     }

//     .prem-media:hover .prem-media__img {
//       transform: scale(1.03);
//     }

//     /* Glassmorphism Badge */
//     .prem-badge {
//       position: absolute;
//       top: 1.5rem;
//       left: 1.5rem;
//       background: rgba(255, 255, 255, 0.8);
//       color: var(--color-error); /* Premium Rose/Red */
//       backdrop-filter: blur(12px);
//       -webkit-backdrop-filter: blur(12px);
//       border: 1px solid rgba(255, 255, 255, 0.5);
//       padding: 0.5rem 1rem;
//       border-radius: 100px;
//       font-size: 0.75rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.1em;
//       box-shadow: 0 4px 12px rgba(0,0,0,0.05);
//     }

//     /* --- Content Area --- */
//     .prem-content {
//       display: flex;
//       flex-direction: column;
//       z-index: 2;
//     }

//     .prem-eyebrow {
//       display: inline-block;
//       font-family: var(--font-mono, monospace);
//       font-size: 0.8125rem;
//       font-weight: 600;
//       color: var(--text-tertiary, var(--text-secondary));
//       text-transform: uppercase;
//       letter-spacing: 0.15em;
//       margin-bottom: 1rem;
//     }

//     .prem-title {
//       font-size: clamp(2.5rem, 5vw, 4rem);
//       font-weight: 800;
//       letter-spacing: -0.03em;
//       line-height: 1.05;
//       margin: 0 0 1.5rem 0;
//       color: var(--text-primary, var(--text-primary));
//       /* Subtle text gradient for a highly polished feel */
//       background: linear-gradient(to right bottom, var(--text-primary, var(--text-primary)) 30%, color-mix(in srgb, var(--text-primary, var(--text-primary)) 60%, transparent));
//       -webkit-background-clip: text;
//       -webkit-text-fill-color: transparent;
//     }

//     .prem-price-row {
//       display: flex;
//       align-items: baseline;
//       gap: 1rem;
//       margin-bottom: 2rem;
//     }

//     .prem-price-current {
//       font-size: 2.25rem;
//       font-weight: 700;
//       color: var(--text-primary, var(--text-primary));
//       letter-spacing: -0.02em;
//     }

//     .prem-price-old {
//       font-size: 1.25rem;
//       font-weight: 500;
//       color: var(--text-tertiary, var(--text-secondary));
//       text-decoration: line-through;
//     }

//     .prem-desc {
//       font-size: 1.125rem;
//       line-height: 1.6;
//       color: var(--text-secondary, var(--text-secondary));
//       margin: 0 0 2.5rem 0;
//       max-width: 500px;
//     }

//     /* --- Actions --- */
//     .prem-actions {
//       display: flex;
//       flex-direction: column;
//       gap: 1rem;
//       margin-bottom: 3rem;
//     }

//     @media (min-width: 640px) {
//       .prem-actions { flex-direction: row; }
//     }

//     .prem-btn {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       gap: 0.75rem;
//       height: 3.5rem;
//       padding: 0 2.5rem;
//       border-radius: 100px;
//       font-size: 1rem;
//       font-weight: 600;
//       text-decoration: none;
//       cursor: pointer;
//       transition: all 0.3s var(--ease-spring);
//     }

//     .prem-btn--primary {
//       background-color: var(--theme-accent-primary, var(--text-primary));
//       color: var(--bg-primary, var(--bg-primary));
//       border: 1px solid transparent;
//       box-shadow: 0 4px 14px color-mix(in srgb, var(--theme-accent-primary, var(--text-primary)) 25%, transparent);
//     }

//     .prem-btn--primary:hover {
//       transform: translateY(-2px);
//       box-shadow: 0 8px 20px color-mix(in srgb, var(--theme-accent-primary, var(--text-primary)) 40%, transparent);
//       filter: brightness(1.1);
//     }

//     .prem-btn--secondary {
//       background-color: transparent;
//       color: var(--text-primary, var(--text-primary));
//       border: 1px solid color-mix(in srgb, var(--text-primary, var(--text-primary)) 20%, transparent);
//     }

//     .prem-btn--secondary:hover {
//       background-color: color-mix(in srgb, var(--text-primary, var(--text-primary)) 5%, transparent);
//       border-color: color-mix(in srgb, var(--text-primary, var(--text-primary)) 40%, transparent);
//     }

//     /* --- Trust Indicators --- */
//     .prem-trust {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: 1.5rem;
//       padding-top: 2rem;
//       border-top: 1px solid color-mix(in srgb, var(--border-secondary, var(--border-primary)) 60%, transparent);
//     }

//     .prem-trust__item {
//       display: flex;
//       flex-direction: column;
//       align-items: flex-start;
//       gap: 0.75rem;
//       color: var(--text-secondary, var(--text-secondary));
//     }

//     .prem-trust__icon {
//       width: 2.5rem;
//       height: 2.5rem;
//       border-radius: 50%;
//       background: color-mix(in srgb, var(--text-primary, var(--text-primary)) 5%, transparent);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       color: var(--text-primary, var(--text-primary));
//       transition: transform 0.3s var(--ease-spring);
//     }

//     .prem-trust__item:hover .prem-trust__icon {
//       transform: scale(1.1) rotate(5deg);
//       background: color-mix(in srgb, var(--theme-accent-primary, var(--accent-primary)) 10%, transparent);
//       color: var(--theme-accent-primary, var(--accent-primary));
//     }

//     .prem-trust__item i { font-size: 1rem; }
//     .prem-trust__item span { 
//       font-size: 0.75rem; 
//       font-weight: 700; 
//       text-transform: uppercase; 
//       letter-spacing: 0.05em; 
//     }

//     /* --- Empty State --- */
//     .prem-empty {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       padding: 6rem 2rem;
//       background: color-mix(in srgb, var(--bg-secondary, var(--bg-secondary)) 50%, transparent);
//       border-radius: 2rem;
//       border: 1px dashed color-mix(in srgb, var(--border-secondary, var(--border-primary)) 80%, transparent);
//       text-align: center;
//     }

//     .prem-empty__icon {
//       width: 5rem;
//       height: 5rem;
//       border-radius: 50%;
//       background: var(--bg-primary, var(--bg-primary));
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       margin-bottom: 1.5rem;
//       box-shadow: 0 4px 20px rgba(0,0,0,0.05);
//       color: var(--text-tertiary, var(--text-secondary));
//     }

//     .prem-empty__icon i { font-size: 2rem; }
//     .prem-empty__title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary, var(--text-primary)); margin: 0 0 0.5rem 0; }
//     .prem-empty__desc { color: var(--text-secondary, var(--text-secondary)); max-width: 400px; }
//   `]
// })
// export class FeaturedProductComponent implements OnChanges {
//   @Input() config: FeaturedProductConfig = {};
//   @Input() product: any = null;
//   @Input() data: any = null;

//   mappedProduct: (PublicProduct & { description?: string | null }) | null = null;

//   constructor(private state: StorefrontStateService) { }

//   orgSlug = computed(() => this.state.organization().slug || '');

//   readonly cfg = computed(() => ({
//     layout: this.config?.layout || 'image_left',
//     showDescription: this.config?.showDescription ?? true,
//     showReviews: this.config?.showReviews ?? true,
//     paddingTop: this.config?.paddingTop ?? 'md',
//     paddingBottom: this.config?.paddingBottom ?? 'md',
//     backgroundColor: this.config?.backgroundColor || 'var(--bg-primary)'
//   }));

//   readonly sectionStyle = computed(() => {
//     const pt = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingTop] : '4rem';
//     const pb = typeof PADDING_MAP !== 'undefined' && PADDING_MAP ? PADDING_MAP[this.cfg().paddingBottom] : '4rem';

//     return {
//       'padding-top': pt,
//       'padding-bottom': pb,
//       'background-color': this.cfg().backgroundColor
//     };
//   });

//   ngOnChanges(): void {
//     const rawData = this.product || this.data;
//     const extractProduct = Array.isArray(rawData) ? rawData[0] : rawData;

//     if (extractProduct && extractProduct.id) {
//       this.mappedProduct = this.toPublicProduct(extractProduct);
//     } else {
//       this.mappedProduct = null;
//     }
//   }

//   calculateDiscount(): number {
//     if (!this.mappedProduct?.price) return 0;
//     const { original, current } = this.mappedProduct.price;
//     if (!original || !current || current >= original) return 0;
//     return Math.round(((original - current) / original) * 100);
//   }

//   private toPublicProduct(p: any): PublicProduct & { description?: string | null } {
//     return {
//       id: p.id,
//       name: p.name,
//       slug: p.slug,
//       sku: p.sku ?? null,
//       image: p.image ?? null,
//       images: p.images ?? [],
//       tags: p.tags ?? [],
//       description: p.description ?? null,
//       price: p.price ?? { current: 0, original: 0, currency: 'INR' },
//       stock: p.stock ?? { available: true, quantity: 10 },
//       category: p.category ?? null,
//       categorySlug: p.categorySlug ?? null,
//       brand: p.brand ?? null,
//       brandSlug: p.brandSlug ?? null,
//     };
//   }
// }
