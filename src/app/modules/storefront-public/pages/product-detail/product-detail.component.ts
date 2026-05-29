import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { combineLatest, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';

// Services
import { StorefrontPublicService } from '../../../../core/services/storefront-public.service';
import { StorefrontStateService } from '../../../../core/services/storefront-state.service';
import { AppMessageService } from '@core/services/message.service';
import { StorefrontCartFacade } from '../../../../storefront/core/facades/storefront-cart.facade';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    TooltipModule,
    ToastModule,
    SkeletonModule,
    TagModule,
    CurrencyPipe
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('500ms cubic-bezier(0.1, 0.76, 0.55, 0.94)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('250ms cubic-bezier(0.2, 0, 0, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms cubic-bezier(0.2, 0, 0, 1)', style({ height: '0', opacity: 0 }))
      ])
    ]),
    trigger('imageSwitch', [
      transition('* => *', [
        style({ opacity: 0.6 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ],
  template: `
    <p-toast position="bottom-center"></p-toast>

    <main class="m3-pdp-root">
      @if (loading()) {
        <div class="m3-container m3-pdp-grid">
          <div class="m3-gallery-skeleton-wrapper">
            <div class="m3-gallery-skeleton"></div>
            <div class="m3-thumbnails-skeleton">
              <div class="skel-thumb"></div>
              <div class="skel-thumb"></div>
              <div class="skel-thumb"></div>
            </div>
          </div>
          <div class="m3-info-skeleton">
            <div class="skel-line w-20"></div>
            <div class="skel-line w-80 h-xl"></div>
            <div class="skel-line w-40 h-lg"></div>
            <div class="skel-line w-100 mt-md"></div>
            <div class="skel-line w-90"></div>
            <div class="skel-line w-95"></div>
            <div class="skel-button mt-xl"></div>
          </div>
        </div>
      } @else if (product()) {
        
        <div class="m3-container" @fadeUp>
          
          <nav class="m3-breadcrumb">
            <a [routerLink]="['/store', orgSlug()]" class="m3-back-link">
              <i class="pi pi-arrow-left"></i>
              <span>Back to Store</span>
            </a>
          </nav>

          <div class="m3-pdp-grid">
            
            <section class="m3-gallery-section">
              <div class="m3-gallery-sticky">
                
                <div class="m3-main-image-surface">
                  <img [@imageSwitch]="selectedImage()" [src]="selectedImage()" [alt]="product().name" class="m3-main-img" />
                  
                  @if (product().price?.hasDiscount) {
                    <div class="m3-badge-sale">
                      Save {{ discountPercentage() }}%
                    </div>
                  }
                </div>

                @if (product().images && product().images.length > 1) {
                  <div class="m3-thumbnails-track">
                    <div class="m3-thumbnails">
                      @for (img of product().images; track img) {
                        <button class="m3-thumb-btn" 
                                [class.active]="selectedImage() === img"
                                (click)="changeImage(img)"
                                aria-label="View alternative product image">
                          <img [src]="img" alt="" loading="lazy" />
                        </button>
                      }
                    </div>
                  </div>
                }

              </div>
            </section>

            <section class="m3-info-section">
              
              <div class="m3-info-header">
                <span class="m3-eyebrow">{{ product().brand?.name || product().category?.name }}</span>
                <h1 class="m3-title">{{ product().name }}</h1>
              </div>

              <div class="m3-price-stock-row">
                <div class="m3-price-block">
                  <span class="m3-price-current">
                    {{ product().price?.current | currency:(product().price?.currency || 'INR') : 'symbol' : '1.0-0' }}
                  </span>
                  @if (product().price?.hasDiscount) {
                    <span class="m3-price-original">
                      {{ product().price?.original | currency:(product().price?.currency || 'INR') : 'symbol' : '1.0-0' }}
                    </span>
                  }
                </div>
                
                <span class="m3-stock-chip" 
                      [class.in-stock]="product().stock?.available" 
                      [class.out-of-stock]="!product().stock?.available">
                  <span class="stock-dot"></span>
                  {{ product().stock?.available ? 'In Stock' : 'Out of Stock' }}
                </span>
              </div>

              <p class="m3-description">
                {{ product().description }}
              </p>

              <div class="m3-action-panel">
                @if (product().stock?.available) {
                  <div class="m3-controls-group">
                    <div class="m3-qty-selector-wrapper">
                      <span class="qty-label">Quantity</span>
                      <div class="m3-qty-selector">
                        <button class="m3-qty-btn" (click)="updateQuantity(-1)" [disabled]="quantity() <= 1" aria-label="Decrease quantity">
                          <i class="pi pi-minus"></i>
                        </button>
                        <span class="m3-qty-value" aria-live="polite" aria-label="Current quantity selection">{{ quantity() }}</span>
                        <button class="m3-qty-btn" (click)="updateQuantity(1)" [disabled]="quantity() >= (product().stock?.quantity || 10)" aria-label="Increase quantity">
                          <i class="pi pi-plus"></i>
                        </button>
                      </div>
                    </div>

                    <button class="m3-btn-primary" (click)="addToCart()" pRipple>
                      <i class="pi pi-shopping-bag"></i>
                      <span>Add to Cart</span>
                    </button>
                  </div>
                } @else {
                  <button class="m3-btn-disabled" disabled>
                    <i class="pi pi-ban"></i>
                    <span>Temporarily Out of Stock</span>
                  </button>
                }
              </div>

              <div class="m3-perks">
                <div class="m3-perk">
                  <div class="perk-icon-box"><i class="pi pi-verified"></i></div>
                  <div class="perk-text">
                    <span class="perk-title">Official Warranty</span>
                    <span class="perk-sub">100% authentic insurance protection</span>
                  </div>
                </div>
                <div class="m3-perk">
                  <div class="perk-icon-box"><i class="pi pi-box"></i></div>
                  <div class="perk-text">
                    <span class="perk-title">Secure Packaging</span>
                    <span class="perk-sub">Damage-proof layered shipment</span>
                  </div>
                </div>
                <div class="m3-perk">
                  <div class="perk-icon-box"><i class="pi pi-refresh"></i></div>
                  <div class="perk-text">
                    <span class="perk-title">Easy Returns</span>
                    <span class="perk-sub">Hassle-free 30-day structural claim</span>
                  </div>
                </div>
              </div>

              <div class="m3-accordions">
                
                <div class="m3-accordion" [class.open]="openAccordion() === 'details'">
                  <button class="m3-acc-header" (click)="toggleAccordion('details')" [attr.aria-expanded]="openAccordion() === 'details'">
                    <span>Product Specifications</span>
                    <span class="icon-circle"><i class="pi pi-chevron-down" [class.rotated]="openAccordion() === 'details'"></i></span>
                  </button>
                  @if (openAccordion() === 'details') {
                    <div class="m3-acc-content" @expandCollapse>
                      <div class="specs-table">
                        <div class="specs-row"><span class="spec-label">SKU Tracking</span><span class="spec-value">{{ product().sku || 'N/A' }}</span></div>
                        <div class="specs-row"><span class="spec-label">Classification</span><span class="spec-value">{{ product().category?.name || 'General' }}</span></div>
                        <div class="specs-row"><span class="spec-label">Packaging Unit</span><span class="spec-value">{{ product().unit || 'Piece' }}</span></div>
                      </div>
                    </div>
                  }
                </div>

                <div class="m3-accordion" [class.open]="openAccordion() === 'shipping'">
                  <button class="m3-acc-header" (click)="toggleAccordion('shipping')" [attr.aria-expanded]="openAccordion() === 'shipping'">
                    <span>Fulfillment & Dispatch Logistics</span>
                    <span class="icon-circle"><i class="pi pi-chevron-down" [class.rotated]="openAccordion() === 'shipping'"></i></span>
                  </button>
                  @if (openAccordion() === 'shipping') {
                    <div class="m3-acc-content" @expandCollapse>
                      <p class="shipping-notice">
                        Complimentary premium tracking logistics map enabled across all regions. Deliveries are dispatched within 24-48 business hours, arriving in optimal condition via temperature-monitored distribution streams.
                      </p>
                    </div>
                  }
                </div>

              </div>
            </section>
          </div>
        </div>

      } @else {
        <div class="m3-not-found" @fadeUp>
          <div class="not-found-illustration">
            <i class="pi pi-search m3-not-found-icon"></i>
          </div>
          <h2>Product Not Found</h2>
          <p>The parameter address identifier path requested is currently missing or moved.</p>
          <a [routerLink]="['/store', orgSlug()]" class="m3-btn-tonal">
            <i class="pi pi-home"></i>
            <span>Return to Storefront</span>
          </a>
        </div>
      }
    </main>
  `,
  styles: [`
    /* ==========================================================================
       PRODUCT DETAIL PAGE (Inherits Canonical Theme Variables)
       ========================================================================== */
    :host {
      display: block;
      width: 100%;
      
      /* Map old M3 tokens directly to your new Design System tokens */
      --m3-color-primary: var(--accent-primary);
      --m3-color-primary-hover: var(--accent-hover, var(--text-primary));
      --m3-color-surface: var(--bg-primary);
      --m3-color-surface-variant: var(--bg-secondary);
      --m3-color-on-surface: var(--text-primary);
      --m3-color-on-surface-variant: var(--text-secondary);
      --m3-color-outline: var(--border-secondary);
      
      --m3-color-sale-bg: color-mix(in srgb, var(--accent-primary) 12%, transparent);
      --m3-color-sale-text: var(--accent-primary);
      
      --m3-radius-xl: var(--ui-border-radius-xl, 28px);
      --m3-radius-md: var(--ui-border-radius-lg, 16px);
      --m3-radius-sm: var(--ui-border-radius-sm, 12px);
      --m3-easing: cubic-bezier(0.2, 0, 0, 1);
      
      font-family: var(--font-body);
      color: var(--m3-color-on-surface);
      background-color: var(--m3-color-surface);
      -webkit-font-smoothing: antialiased;
    }

    .m3-pdp-root { min-height: 100vh; padding-bottom: 8rem; }

    .m3-container { max-width: 1300px; margin: 0 auto; padding: 0 24px; }
    @media (max-width: 640px) { .m3-container { padding: 0 16px; } }

    /* ─── Breadcrumbs ────────────────────────────────── */
    .m3-breadcrumb { padding: 24px 0; }
    @media (max-width: 768px) { .m3-breadcrumb { padding: 16px 0; } }

    .m3-back-link {
      display: inline-flex; align-items: center; gap: 10px; color: var(--m3-color-on-surface-variant); text-decoration: none; font-weight: 600; font-size: 14px; padding: 8px 16px 8px 12px; border-radius: 100px; background: var(--m3-color-surface-variant); transition: all 0.25s var(--m3-easing);
    }
    .m3-back-link i { font-size: 12px; transition: transform 0.2s ease; }
    .m3-back-link:hover { color: var(--m3-color-primary); background: color-mix(in srgb, var(--m3-color-primary) 8%, var(--m3-color-surface-variant)); }
    .m3-back-link:hover i { transform: translateX(-3px); }

    /* ─── Structural Grid ───────────────────── */
    .m3-pdp-grid { display: grid; grid-template-columns: 1fr; gap: 32px; }
    @media (min-width: 1024px) { .m3-pdp-grid { grid-template-columns: 1.1fr 0.9fr; gap: 64px; align-items: start; } }

    /* ─── Gallery Engine ──────────────────────── */
    @media (min-width: 1024px) { .m3-gallery-sticky { position: sticky; top: 40px; } }

    .m3-main-image-surface {
      position: relative; width: 100%; aspect-ratio: 1 / 1; background-color: var(--m3-color-surface-variant); border-radius: var(--m3-radius-xl); display: flex; align-items: center; justify-content: center; padding: 40px; border: 1px solid var(--m3-color-outline); box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.015); overflow: hidden;
    }
    @media (max-width: 640px) { .m3-main-image-surface { border-radius: var(--m3-radius-md); padding: 20px; } }

    .m3-main-img { max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.04)); }

    .m3-badge-sale { position: absolute; top: 20px; left: 20px; background-color: var(--m3-color-sale-bg); color: var(--m3-color-sale-text); padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

    .m3-thumbnails-track { position: relative; margin-top: 16px; width: 100%; }
    .m3-thumbnails { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .m3-thumbnails::-webkit-scrollbar { display: none; }

    .m3-thumb-btn {
      flex-shrink: 0; width: 76px; height: 76px; border-radius: var(--m3-radius-sm); border: 2px solid transparent; background-color: var(--m3-color-surface-variant); padding: 6px; cursor: pointer; transition: all 0.2s var(--m3-easing);
    }
    .m3-thumb-btn img { width: 100%; height: 100%; object-fit: contain; }
    .m3-thumb-btn:hover { background-color: var(--m3-color-outline); }
    .m3-thumb-btn.active { border-color: var(--m3-color-primary); background-color: var(--m3-color-surface); box-shadow: 0 4px 12px color-mix(in srgb, var(--m3-color-primary) 15%, transparent); }

    /* ─── Info Section ───────────────── */
    .m3-info-section { display: flex; flex-direction: column; }
    .m3-info-header { margin-bottom: 16px; }

    .m3-eyebrow { font-family: var(--font-mono); font-size: 12px; font-weight: 700; color: var(--m3-color-primary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }

    .m3-title { font-family: var(--font-heading); font-size: clamp(24px, 4vw, 38px); font-weight: 700; color: var(--m3-color-on-surface); line-height: 1.15; letter-spacing: -0.03em; margin: 0; }

    .m3-price-stock-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding-bottom: 24px; border-bottom: 1px solid var(--m3-color-outline); margin-bottom: 24px; }
    .m3-price-block { display: flex; align-items: baseline; gap: 12px; }
    
    .m3-price-current { font-family: var(--font-heading); font-size: 32px; font-weight: 700; letter-spacing: -0.02em; color: var(--m3-color-on-surface); }
    .m3-price-original { font-size: 18px; color: var(--m3-color-on-surface-variant); text-decoration: line-through; font-weight: 400; }

    .m3-stock-chip {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .m3-stock-chip .stock-dot { width: 8px; height: 8px; border-radius: 50%; }
    .m3-stock-chip.in-stock { background: color-mix(in srgb, var(--color-success) 15%, transparent); color: var(--color-success); }
    .m3-stock-chip.in-stock .stock-dot { background: var(--color-success); }
    .m3-stock-chip.out-of-stock { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }
    .m3-stock-chip.out-of-stock .stock-dot { background: var(--color-error); }

    .m3-description { font-size: 15px; line-height: 1.65; color: var(--m3-color-on-surface-variant); margin: 0 0 32px 0; }

    /* ─── Control Panels ───────────────── */
    .m3-action-panel { background: var(--m3-color-surface-variant); padding: 20px; border-radius: var(--m3-radius-md); margin-bottom: 32px; border: 1px solid var(--m3-color-outline); }

    .m3-controls-group { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
    @media (max-width: 640px) { .m3-controls-group { flex-direction: column; align-items: stretch; } }

    .m3-qty-selector-wrapper { display: flex; flex-direction: column; gap: 8px; }
    .m3-qty-selector-wrapper .qty-label { font-family: var(--font-mono); font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--m3-color-on-surface-variant); letter-spacing: 1px; }

    .m3-qty-selector { display: inline-flex; align-items: center; border: 1px solid var(--m3-color-outline); border-radius: 100px; height: 48px; background: var(--m3-color-surface); padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }

    .m3-qty-btn { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--m3-color-on-surface); cursor: pointer; border-radius: 50%; transition: all 0.2s var(--m3-easing); }
    .m3-qty-btn:hover:not(:disabled) { background: var(--m3-color-surface-variant); color: var(--m3-color-primary); }
    .m3-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .m3-qty-value { font-family: var(--font-mono); font-size: 15px; font-weight: 700; min-width: 32px; text-align: center; }

    .m3-btn-primary {
      flex: 1; height: 48px; border-radius: 100px; background-color: var(--m3-color-primary); color: var(--bg-primary); border: none; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 14px color-mix(in srgb, var(--m3-color-primary) 25%, transparent); transition: all 0.2s var(--m3-easing);
    }
    .m3-btn-primary:hover { background-color: var(--m3-color-primary-hover); transform: translateY(-1px); box-shadow: 0 6px 20px color-mix(in srgb, var(--m3-color-primary) 35%, transparent); }
    
    .m3-btn-disabled { width: 100%; height: 48px; border-radius: 100px; background-color: var(--m3-color-surface-variant); color: var(--m3-color-on-surface-variant); border: none; font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: not-allowed; text-transform: uppercase; letter-spacing: 1px; }

    /* ─── Perks Layout ────────────────────────────────── */
    .m3-perks { display: flex; flex-direction: column; gap: 16px; padding: 24px 0; border-top: 1px solid var(--m3-color-outline); border-bottom: 1px solid var(--m3-color-outline); margin-bottom: 32px; }
    .m3-perk { display: flex; align-items: center; gap: 16px; }
    .perk-icon-box { width: 40px; height: 40px; border-radius: 10px; background: var(--m3-color-surface-variant); display: flex; align-items: center; justify-content: center; border: 1px solid var(--m3-color-outline); }
    .perk-icon-box i { font-size: 16px; color: var(--m3-color-primary); }
    .perk-text { display: flex; flex-direction: column; }
    .perk-title { font-size: 13.5px; font-weight: 600; color: var(--m3-color-on-surface); }
    .perk-sub { font-size: 11.5px; color: var(--m3-color-on-surface-variant); }

    /* ─── Accordions ─────────────────── */
    .m3-accordions { display: flex; flex-direction: column; gap: 12px; }
    .m3-accordion { border: 1px solid var(--m3-color-outline); border-radius: var(--m3-radius-sm); overflow: hidden; background: var(--m3-color-surface); transition: all 0.2s ease; }
    .m3-accordion.open { border-color: var(--m3-color-on-surface); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
    .m3-accordion.open .icon-circle { background: var(--m3-color-on-surface); color: var(--bg-primary); }

    .m3-acc-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; background: transparent; border: none; font-size: 15px; font-weight: 600; color: var(--m3-color-on-surface); cursor: pointer; text-align: left; }
    .icon-circle { width: 28px; height: 28px; border-radius: 50%; background: var(--m3-color-surface-variant); display: flex; align-items: center; justify-content: center; transition: all 0.25s ease; }
    .icon-circle i { font-size: 10px; transition: transform 0.25s var(--m3-easing); }
    .rotated { transform: rotate(180deg); }

    .m3-acc-content { padding: 0 20px 20px 20px; color: var(--m3-color-on-surface-variant); font-size: 14px; line-height: 1.6; }
    .specs-table { display: flex; flex-direction: column; gap: 10px; }
    .specs-row { display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed var(--m3-color-outline); }
    .specs-row:last-child { border: none; padding: 0; }
    .spec-label { color: var(--m3-color-on-surface-variant); font-weight: 500; }
    .spec-value { color: var(--m3-color-on-surface); font-weight: 600; text-align: right; }

    /* ─── Skeletons ────────────────────────────────── */
    .m3-gallery-skeleton-wrapper { display: flex; flex-direction: column; gap: 16px; }
    .m3-gallery-skeleton { width: 100%; aspect-ratio: 1; background: color-mix(in srgb, var(--bg-secondary) 80%, var(--border-secondary)); border-radius: var(--m3-radius-xl); animation: pulse 1.5s infinite; }
    .m3-thumbnails-skeleton { display: flex; gap: 12px; }
    .m3-thumbnails-skeleton .skel-thumb { width: 72px; height: 72px; border-radius: var(--m3-radius-sm); background: color-mix(in srgb, var(--bg-secondary) 80%, var(--border-secondary)); animation: pulse 1.5s infinite; }
    
    .m3-info-skeleton { display: flex; flex-direction: column; gap: 12px; }
    .skel-line { background: color-mix(in srgb, var(--bg-secondary) 80%, var(--border-secondary)); height: 16px; border-radius: 4px; animation: pulse 1.5s infinite; }
    .skel-line.w-20 { width: 20%; }
    .skel-line.w-40 { width: 40%; }
    .skel-line.w-80 { width: 80%; }
    .skel-line.w-90 { width: 90%; }
    .skel-line.w-95 { width: 95%; }
    .skel-line.w-100 { width: 100%; }
    .skel-line.h-xl { height: 40px; border-radius: 8px; }
    .skel-line.h-lg { height: 28px; border-radius: 6px; }
    .skel-button { background: color-mix(in srgb, var(--bg-secondary) 80%, var(--border-secondary)); height: 50px; border-radius: 100px; width: 100%; animation: pulse 1.5s infinite; }
    .mt-md { margin-top: 12px; }
    .mt-xl { margin-top: 24px; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* ─── 404 Fallback ─────────────────────────── */
    .m3-not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8rem 24px; text-align: center; }
    .m3-not-found h2 { font-family: var(--font-heading); font-size: 24px; font-weight: 700; margin: 16px 0 8px 0; }
    .m3-not-found p { font-size: 15px; color: var(--m3-color-on-surface-variant); margin-bottom: 24px; }
    
    .not-found-illustration { width: 80px; height: 80px; border-radius: 50%; background: var(--m3-color-surface-variant); display: flex; align-items: center; justify-content: center; border: 1px solid var(--m3-color-outline); }
    .not-found-illustration .m3-not-found-icon { font-size: 28px; color: var(--m3-color-on-surface-variant); }
    
    .m3-btn-tonal {
      display: inline-flex; align-items: center; gap: 8px; padding: 0 24px; height: 48px; border-radius: 100px; background: var(--m3-color-surface-variant); color: var(--m3-color-on-surface); font-weight: 600; font-size: 14px; text-decoration: none; transition: background 0.2s; border: 1px solid var(--m3-color-outline);
    }
    .m3-btn-tonal:hover { background: color-mix(in srgb, var(--m3-color-primary) 10%, var(--m3-color-surface-variant)); border-color: var(--m3-color-primary); color: var(--m3-color-primary); }
  `]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicService = inject(StorefrontPublicService);
  private stateService = inject(StorefrontStateService);
  private titleService = inject(Title);
  private messageService = inject(AppMessageService);
  private cartFacade = inject(StorefrontCartFacade);
  private destroyRef = inject(DestroyRef);

  product = signal<any>(null);
  loading = signal(true);
  selectedImage = signal<string>('');
  quantity = signal(1);
  orgSlug = signal('');
  openAccordion = signal<string>('details');

  discountPercentage = computed(() => {
    const p = this.product();
    if (!p || !p.price?.hasDiscount) return 0;

    const original = Number(p.price.original);
    const current = Number(p.price.current);

    return original ? Math.round(((original - current) / original) * 100) : 0;
  });

  ngOnInit() {
    this.setupRouteListener();
  }

  private setupRouteListener() {
    const parentParams$ = this.route.parent
      ? this.route.parent.paramMap
      : of(new Map<string, string>());

    combineLatest([parentParams$, this.route.paramMap])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.loading.set(true)),
        switchMap(([parentParams, childParams]) => {
          const org = parentParams.get('orgSlug') || '';
          const slug = childParams.get('productSlug') || '';

          this.orgSlug.set(org);

          if (org && slug) {
            return this.publicService.getProductBySlug(org, slug).pipe(
              catchError(err => {
                console.error('Error loading product:', err);
                this.loading.set(false);
                return of(null);
              })
            );
          }
          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (res && res.product) {
          this.handleProductLoad(res);
        } else {
          this.loading.set(false);
        }
      });
  }

  private handleProductLoad(res: any) {
    this.product.set(res.product);
    this.stateService.setState(res);

    if (res.product.image) {
      this.selectedImage.set(res.product.image);
    } else if (res.product.images && res.product.images.length > 0) {
      this.selectedImage.set(res.product.images[0]);
    } else {
      this.selectedImage.set('assets/placeholder.png');
    }

    const title = res.seo?.title || res.product.name;
    this.titleService.setTitle(title);

    this.loading.set(false);
  }

  changeImage(url: string) {
    if (this.selectedImage() !== url) {
      this.selectedImage.set(url);
    }
  }

  updateQuantity(delta: number) {
    this.quantity.update(q => {
      const stockLimit = this.product()?.stock?.quantity || 10;
      const newVal = q + delta;
      if (newVal < 1) return 1;
      if (newVal > stockLimit) return stockLimit;
      return newVal;
    });
  }

  toggleAccordion(section: string) {
    this.openAccordion.update(curr => curr === section ? '' : section);
  }

  addToCart() {
    const product = this.product();
    if (!product) return;
    const productId = product._id ?? product.id;
    if (!productId) return;
    this.cartFacade.add(this.orgSlug(), { productId, quantity: this.quantity() }).subscribe(cart => {
      if (cart) this.messageService.showSuccess(`Added ${this.quantity()}x ${product.name} to cart`);
    });
  }
}
