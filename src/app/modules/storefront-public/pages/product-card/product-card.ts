import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { PublicProduct } from '@core/models/storefront.model';

type TagSeverity = "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined;

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule, ButtonModule, TagModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Kept to allow styling PrimeNG dialog
  template: `
<div class="m3-card" [class.is-unavailable]="!stockInfo().isAvailable" 
     (click)="goToFullDetails()" (keydown.enter)="goToFullDetails()" tabindex="0" role="button" 
     [attr.aria-label]="'View ' + product().name">

  <div class="m3-card__image-wrapper">
    <img [src]="displayImage()" [alt]="product().name" (error)="onImageError()" loading="lazy" class="m3-card__img" />
    
    <div class="m3-card__badges">
      @if (discountPercent() > 0) {
        <span class="m3-badge m3-badge--sale">Save {{ discountPercent() }}%</span>
      }
      @if (!stockInfo().isAvailable) {
        <span class="m3-badge m3-badge--out">Out of Stock</span>
      }
      @if (stockInfo().qty > 0 && stockInfo().qty < 5 && stockInfo().isAvailable) { 
        <span class="m3-badge m3-badge--warn">Only {{ stockInfo().qty }} left</span>
      }
    </div>

    <button class="m3-fab-mini m3-card__quick-view" (click)="openQuickView($event)" aria-label="Quick view">
      <i class="pi pi-eye"></i>
    </button>
  </div>

  <div class="m3-card__content">
    <div class="m3-card__text-stack">
      <span class="m3-card__eyebrow">{{ product().brand || product().category || 'Collection' }}</span>
      <h3 class="m3-card__title">{{ product().name }}</h3>
      
      <div class="m3-card__price-row">
        <span class="m3-price-current">
          {{ priceDisplay().current | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
        </span>
        @if (priceDisplay().hasDiscount) {
          <span class="m3-price-old">
            {{ priceDisplay().original | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
          </span>
        }
      </div>
    </div>

    <div class="m3-card__actions">
      @if (stockInfo().isAvailable) {
        <button class="m3-btn-tonal" (click)="handleAddToCart($event)" type="button">
          <i class="pi pi-shopping-bag"></i>
          <span>Add</span>
        </button>
      } @else {
        <button class="m3-btn-tonal m3-btn-tonal--disabled" disabled type="button">
          <span>Unavailable</span>
        </button>
      }
    </div>
  </div>
</div>

<p-dialog appendTo="body" [visible]="showModal()" (visibleChange)="showModal.set($event)" [modal]="true"
  [dismissableMask]="true" [showHeader]="false" styleClass="m3-dialog"
  [style]="{ width: '90vw', maxWidth: '1000px', padding: '0', borderRadius: '24px', overflow: 'hidden' }">

  <div class="m3-qv-layout">
    <button class="m3-icon-btn m3-qv-close" (click)="closeQuickView($event)" aria-label="Close">
      <i class="pi pi-times"></i>
    </button>

    <div class="m3-qv-gallery">
      <div class="m3-qv-img-container">
        <img [src]="displayImage()" [alt]="product().name" class="m3-qv-img" loading="lazy" />
      </div>
      @if (product().images && product().images.length > 1) {
        <div class="m3-qv-thumbs">
          @for (img of product().images.slice(0, 4); track img; let i = $index) {
            <button class="m3-qv-thumb" type="button">
              <img [src]="img" [alt]="'View ' + (i + 1)" />
            </button>
          }
        </div>
      }
    </div>

    <div class="m3-qv-details">
      <span class="m3-qv-eyebrow">{{ product().brand || product().category || 'Collection' }}</span>
      <h2 class="m3-qv-title">{{ product().name }}</h2>

      <div class="m3-qv-price-block">
        <span class="m3-price-hero">
          {{ priceDisplay().current | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
        </span>
        @if (priceDisplay().hasDiscount) {
          <span class="m3-price-old-hero">
            {{ priceDisplay().original | currency: priceDisplay().currency : 'symbol' : '1.0-0' }}
          </span>
          <span class="m3-badge m3-badge--sale">Save {{ discountPercent() }}%</span>
        }
      </div>

      <div class="m3-qv-chips">
        <span class="m3-chip" [class.m3-chip--green]="stockInfo().isAvailable" [class.m3-chip--red]="!stockInfo().isAvailable">
          {{ stockInfo().label }}
        </span>
        @if ($any(product()).rating) {
          <span class="m3-chip m3-chip--amber">
            <i class="pi pi-star-fill"></i> {{ $any(product()).rating }}
          </span>
        }
      </div>

      <div class="m3-divider"></div>

      <div class="m3-qv-desc">
        @if ($any(product()).description) {
          <p>{{ $any(product()).description }}</p>
        } @else {
          <p class="m3-qv-empty-desc">Full specifications available on the details page.</p>
        }
      </div>

      <div class="m3-qv-dock">
        <button class="m3-btn-filled m3-qv-add" (click)="handleAddToCart($event)" [disabled]="!stockInfo().isAvailable" type="button">
          <i class="pi pi-shopping-bag"></i>
          <span>Add to Cart</span>
        </button>
        <button class="m3-btn-outlined m3-qv-detail" (click)="goToFullDetails()" type="button">
          <span>View Details</span>
        </button>
      </div>
    </div>
  </div>
</p-dialog>
  `,
  styles: [`
    /* --- M3 Standard Configuration --- */
    :host {
      display: block;
      --md-sys-color-primary: var(--theme-accent-primary, #1a73e8);
      --md-sys-color-surface: var(--bg-primary, #ffffff);
      --md-sys-color-surface-variant: var(--bg-secondary, #f8f9fa);
      --md-sys-color-on-surface: var(--text-primary, #202124);
      --md-sys-color-on-surface-variant: var(--text-secondary, #5f6368);
      --md-sys-color-outline: var(--border-secondary, #dadce0);
      --md-sys-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
      
      font-family: 'Google Sans', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* --- M3 Product Card --- */
    .m3-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--md-sys-color-surface);
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      outline: none;
      transition: all 0.2s var(--md-sys-easing-standard);
      /* M3 Elevation Level 0 */
      box-shadow: 0 0 0 0 transparent;
    }

    .m3-card:hover, .m3-card:focus-visible {
      /* M3 Elevation Level 2 */
      box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
      border-color: transparent;
      transform: translateY(-2px);
    }

    .m3-card.is-unavailable {
      opacity: 0.7;
    }

    /* --- Image Area --- */
    .m3-card__image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      background-color: var(--md-sys-color-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 1rem;
    }

    .m3-card__img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      mix-blend-mode: multiply; /* Blends white backgrounds of product photos into the surface */
      transition: transform 0.4s var(--md-sys-easing-standard);
    }

    .m3-card:hover .m3-card__img {
      transform: scale(1.05);
    }

    /* --- Badges --- */
    .m3-card__badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2;
    }

    .m3-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      font-family: Roboto, sans-serif;
    }

    .m3-badge--sale { background: #e8f0fe; color: #1967d2; }
    .m3-badge--out { background: #fce8e6; color: #d93025; }
    .m3-badge--warn { background: #fef7e0; color: #e37400; }

    /* --- Quick View FAB --- */
    .m3-card__quick-view {
      position: absolute;
      top: 12px;
      right: 12px;
      opacity: 0;
      transform: scale(0.8);
      z-index: 2;
    }

    .m3-card:hover .m3-card__quick-view {
      opacity: 1;
      transform: scale(1);
    }

    .m3-fab-mini {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--md-sys-color-surface);
      color: var(--md-sys-color-on-surface);
      border: 1px solid var(--md-sys-color-outline);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s var(--md-sys-easing-standard);
      box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3);
    }

    .m3-fab-mini:hover {
      background: var(--md-sys-color-surface-variant);
      box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
    }

    /* --- Content Area --- */
    .m3-card__content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
      gap: 16px;
    }

    .m3-card__eyebrow {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant);
      font-weight: 500;
      margin-bottom: 4px;
      display: block;
    }

    .m3-card__title {
      font-size: 1rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      margin: 0 0 8px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .m3-card__price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .m3-price-current {
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
    }

    .m3-price-old {
      font-size: 0.875rem;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: line-through;
    }

    /* --- Buttons --- */
    .m3-btn-tonal {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 40px;
      border-radius: 100px;
      background: #e8f0fe; /* Google Light Blue Surface */
      color: #1967d2; /* Google Dark Blue Text */
      border: none;
      font-family: 'Google Sans', sans-serif;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s var(--md-sys-easing-standard);
    }

    .m3-btn-tonal:hover {
      background: #d2e3fc;
    }

    .m3-btn-tonal--disabled {
      background: var(--bg-secondary, #f1f3f4);
      color: var(--text-tertiary, #9aa0a6);
      cursor: not-allowed;
    }

    /* =========================================================
       QUICK VIEW MODAL OVERRIDES (Global due to ViewEncapsulation.None)
       ========================================================= */
    .m3-dialog .p-dialog-content {
      padding: 0 !important;
      background: var(--md-sys-color-surface) !important;
    }

    .m3-qv-layout {
      display: grid;
      grid-template-columns: 1fr;
      position: relative;
    }

    @media(min-width: 768px) {
      .m3-qv-layout { grid-template-columns: 1fr 1fr; }
    }

    .m3-qv-close {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 10;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      border: none;
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(60,64,67,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .m3-qv-gallery {
      background: var(--md-sys-color-surface-variant);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .m3-qv-img-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }

    .m3-qv-img {
      max-width: 100%;
      max-height: 400px;
      mix-blend-mode: multiply;
    }

    .m3-qv-thumbs {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .m3-qv-thumb {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline);
      background: var(--md-sys-color-surface);
      padding: 4px;
      cursor: pointer;
    }
    
    .m3-qv-thumb img { width: 100%; height: 100%; object-fit: contain; }

    .m3-qv-details {
      padding: 32px 40px;
      display: flex;
      flex-direction: column;
    }

    .m3-qv-eyebrow { font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-bottom: 8px; display: block;}
    .m3-qv-title { font-size: 1.75rem; font-weight: 500; color: var(--md-sys-color-on-surface); margin: 0 0 16px 0; line-height: 1.2;}
    
    .m3-qv-price-block { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px;}
    .m3-price-hero { font-size: 2rem; font-weight: 500; color: var(--md-sys-color-on-surface); }
    .m3-price-old-hero { font-size: 1.125rem; color: var(--md-sys-color-on-surface-variant); text-decoration: line-through; }

    .m3-qv-chips { display: flex; gap: 8px; margin-bottom: 24px; }
    .m3-chip { padding: 4px 12px; border-radius: 100px; font-size: 0.875rem; font-weight: 500; border: 1px solid var(--md-sys-color-outline); }
    .m3-chip--green { color: #137333; background: #e6f4ea; border-color: transparent; }
    .m3-chip--red { color: #d93025; background: #fce8e6; border-color: transparent; }
    .m3-chip--amber { color: #e37400; background: #fef7e0; border-color: transparent; }

    .m3-divider { height: 1px; background: var(--md-sys-color-outline); margin: 24px 0; }

    .m3-qv-desc { flex: 1; color: var(--md-sys-color-on-surface-variant); line-height: 1.6; font-size: 0.95rem; margin-bottom: 32px; }

    .m3-qv-dock { display: flex; gap: 16px; margin-top: auto; }
    
    .m3-btn-filled {
      flex: 1;
      height: 48px;
      border-radius: 100px;
      background: var(--md-sys-color-primary);
      color: var(--bg-primary, #ffffff);
      border: none;
      font-family: 'Google Sans', sans-serif;
      font-weight: 500;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .m3-btn-filled:hover:not([disabled]) { background: #1557b0; }
    .m3-btn-filled[disabled] { background: var(--bg-secondary, #f1f3f4); color: var(--text-tertiary, #9aa0a6); cursor: not-allowed; }

    .m3-btn-outlined {
      height: 48px;
      padding: 0 24px;
      border-radius: 100px;
      background: transparent;
      color: var(--md-sys-color-primary);
      border: 1px solid var(--md-sys-color-outline);
      font-family: 'Google Sans', sans-serif;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .m3-btn-outlined:hover { background: var(--md-sys-color-surface-variant); }
  `]
})
export class ProductCardComponent {
  private router = inject(Router);

  readonly product = input.required<PublicProduct>();
  readonly orgSlug = input<string>('');
  readonly layout = input<'grid' | 'list'>('grid');
  readonly addToCart = output<PublicProduct>();

  readonly showModal = signal(false);
  readonly imageError = signal(false);

  readonly displayImage = computed(() => {
    const p = this.product();
    if (this.imageError()) return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';
    if (p.images && p.images.length > 0) return p.images[0];
    if (p.image) return p.image;
    return 'https://images.pexels.com/photos/35209410/pexels-photo-35209410.jpeg';
  });

  readonly priceDisplay = computed(() => {
    const p = this.product().price;
    if (!p) return { current: 0, original: 0, currency: 'INR', hasDiscount: false };
    return {
      current: p.current || p.original || 0,
      original: p.original || 0,
      currency: p.currency || 'INR',
      hasDiscount: !!p.hasDiscount
    };
  });

  readonly stockInfo = computed(() => {
    const s = this.product().stock;
    if (!s) return { isAvailable: false, qty: 0, label: 'Out of Stock', severity: 'danger' as TagSeverity };

    const qty = s.quantity || 0;
    const available = s.available || (qty > 0);
    let severity: TagSeverity = 'danger';

    if (available) {
      severity = qty < 10 ? 'warn' : 'success';
    }

    return {
      isAvailable: available,
      qty: qty,
      label: available ? 'In Stock' : 'Out of Stock',
      severity: severity
    };
  });

  readonly discountPercent = computed(() => {
    const p = this.product();
    if (p.price?.discountPercentage) return p.price.discountPercentage;
    const pd = this.priceDisplay();
    if (!pd.hasDiscount || !pd.original) return 0;
    return Math.round(((pd.original - pd.current) / pd.original) * 100);
  });

  onImageError() { this.imageError.set(true); }

  openQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal.set(true);
  }

  closeQuickView(e?: Event) {
    e?.stopPropagation();
    this.showModal.set(false);
  }

  handleAddToCart(e?: Event) {
    e?.stopPropagation();
    this.addToCart.emit(this.product());
    this.showModal.set(false);
  }

  goToFullDetails() {
    this.showModal.set(false);
    const p = this.product();
    const org = this.orgSlug();

    if (p.url) {
      this.router.navigateByUrl(p.url);
      return;
    }

    if (org && p.slug) {
      this.router.navigate(['/store', org, 'products', p.slug]);
    }
  }
}

