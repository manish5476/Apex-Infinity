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

// PrimeNG Imports (Kept for your app's compatibility)
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
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.4, 0.0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ height: '0', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <p-toast position="bottom-center"></p-toast>

    <main class="m3-pdp-root">
      @if (loading()) {
        <div class="m3-container m3-pdp-grid">
          <div class="m3-gallery-skeleton"></div>
          <div class="m3-info-skeleton">
            <div class="skel-line w-30"></div>
            <div class="skel-line w-80 h-xl"></div>
            <div class="skel-line w-40 h-lg"></div>
            <div class="skel-line w-100"></div>
            <div class="skel-line w-90"></div>
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
                  <img [src]="selectedImage()" [alt]="product().name" class="m3-main-img" />
                  
                  @if (product().price?.hasDiscount) {
                    <div class="m3-badge-sale">
                      Save {{ discountPercentage() }}%
                    </div>
                  }
                </div>

                @if (product().images && product().images.length > 1) {
                  <div class="m3-thumbnails">
                    @for (img of product().images; track img) {
                      <button 
                        class="m3-thumb-btn" 
                        [class.active]="selectedImage() === img"
                        (click)="changeImage(img)"
                        aria-label="View product image">
                        <img [src]="img" alt="Thumbnail" />
                      </button>
                    }
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
                  <i class="pi" [ngClass]="product().stock?.available ? 'pi-check-circle' : 'pi-times-circle'"></i>
                  {{ product().stock?.available ? 'In Stock' : 'Out of Stock' }}
                </span>
              </div>

              <p class="m3-description">
                {{ product().description }}
              </p>

              <div class="m3-controls">
                
                @if (product().stock?.available) {
                  <div class="m3-qty-selector">
                    <button class="m3-qty-btn" (click)="updateQuantity(-1)" [disabled]="quantity() <= 1" aria-label="Decrease quantity">
                      <i class="pi pi-minus"></i>
                    </button>
                    <span class="m3-qty-value">{{ quantity() }}</span>
                    <button class="m3-qty-btn" (click)="updateQuantity(1)" [disabled]="quantity() >= (product().stock?.quantity || 10)" aria-label="Increase quantity">
                      <i class="pi pi-plus"></i>
                    </button>
                  </div>

                  <button class="m3-btn-primary" (click)="addToCart()">
                    <i class="pi pi-shopping-bag"></i>
                    Add to Cart
                  </button>
                } @else {
                  <button class="m3-btn-disabled" disabled>
                    Out of Stock
                  </button>
                }

              </div>

              <div class="m3-perks">
                <div class="m3-perk">
                  <i class="pi pi-verified"></i>
                  <span>Official Warranty</span>
                </div>
                <div class="m3-perk">
                  <i class="pi pi-box"></i>
                  <span>Secure Packaging</span>
                </div>
                <div class="m3-perk">
                  <i class="pi pi-refresh"></i>
                  <span>Easy Returns</span>
                </div>
              </div>

              <div class="m3-accordions">
                
                <div class="m3-accordion">
                  <button class="m3-acc-header" (click)="toggleAccordion('details')" [attr.aria-expanded]="openAccordion() === 'details'">
                    <span>Product Details</span>
                    <i class="pi pi-chevron-down" [class.rotated]="openAccordion() === 'details'"></i>
                  </button>
                  @if (openAccordion() === 'details') {
                    <div class="m3-acc-content" @expandCollapse>
                      <p>SKU: {{ product().sku || 'N/A' }}</p>
                      <p>Category: {{ product().category?.name || 'General' }}</p>
                      <p>Unit: {{ product().unit || 'Piece' }}</p>
                    </div>
                  }
                </div>

                <div class="m3-accordion">
                  <button class="m3-acc-header" (click)="toggleAccordion('shipping')" [attr.aria-expanded]="openAccordion() === 'shipping'">
                    <span>Shipping & Returns</span>
                    <i class="pi pi-chevron-down" [class.rotated]="openAccordion() === 'shipping'"></i>
                  </button>
                  @if (openAccordion() === 'shipping') {
                    <div class="m3-acc-content" @expandCollapse>
                      <p>Free standard shipping on eligible orders. Returns are accepted within 30 days of delivery in original packaging.</p>
                    </div>
                  }
                </div>

              </div>

            </section>
          </div>
        </div>

      } @else {
        <div class="m3-not-found" @fadeUp>
          <i class="pi pi-box m3-not-found-icon"></i>
          <h2>Product Not Found</h2>
          <p>We couldn't find the product you're looking for.</p>
          <a [routerLink]="['/store', orgSlug()]" class="m3-btn-tonal">Return to Store</a>
        </div>
      }
    </main>
  `,
  styles: [`
    /* ==========================================================================
       GOOGLE STORE (MATERIAL DESIGN 3) PDP AESTHETIC
       ========================================================================== */
    :host {
      display: block;
      width: 100%;
      
      --md-sys-color-primary: #1a73e8; /* Google Blue */
      --md-sys-color-on-primary: var(--bg-primary, #ffffff);
      --md-sys-color-surface: var(--bg-primary, #ffffff);
      --md-sys-color-surface-variant: var(--bg-secondary, #f8f9fa);
      --md-sys-color-on-surface: var(--text-primary, #202124);
      --md-sys-color-on-surface-variant: var(--text-secondary, #5f6368);
      --md-sys-color-outline: var(--border-secondary, #dadce0);
      
      --md-sys-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
      font-family: 'Google Sans', Roboto, Arial, sans-serif;
      color: var(--md-sys-color-on-surface);
      -webkit-font-smoothing: antialiased;
    }

    .m3-pdp-root {
      background-color: var(--md-sys-color-surface);
      min-height: 100vh;
      padding-bottom: 5rem;
    }

    .m3-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 5%;
    }

    /* --- Navigation --- */
    .m3-breadcrumb {
      padding: 1.5rem 0;
    }

    .m3-back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .m3-back-link:hover {
      color: var(--md-sys-color-primary);
    }

    /* --- Grid Layout --- */
    .m3-pdp-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 1024px) {
      .m3-pdp-grid {
        grid-template-columns: 1.2fr 1fr;
        gap: 5rem;
        align-items: flex-start; /* Crucial for sticky behavior */
      }
    }

    /* --- Left: Gallery --- */
    .m3-gallery-sticky {
      position: sticky;
      top: 2rem; /* Sticks slightly below the top of the viewport */
    }

    .m3-main-image-surface {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      background-color: var(--md-sys-color-surface-variant);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
    }

    .m3-main-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      mix-blend-mode: multiply; /* Melts white image backgrounds into the gray surface */
    }

    .m3-badge-sale {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      background-color: #e8f0fe;
      color: #1967d2;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .m3-thumbnails {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scrollbar-width: none;
    }
    .m3-thumbnails::-webkit-scrollbar { display: none; }

    .m3-thumb-btn {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: 12px;
      border: 2px solid transparent;
      background-color: var(--md-sys-color-surface-variant);
      padding: 0.5rem;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .m3-thumb-btn.active {
      border-color: var(--md-sys-color-primary);
    }

    .m3-thumb-btn img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      mix-blend-mode: multiply;
    }

    /* --- Right: Info --- */
    .m3-info-section {
      display: flex;
      flex-direction: column;
      padding-top: 1rem;
    }

    .m3-eyebrow {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface-variant);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      display: block;
    }

    .m3-title {
      font-size: clamp(2rem, 3.5vw, 3rem);
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0 0 1.5rem 0;
    }

    .m3-price-stock-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .m3-price-block {
      display: flex;
      align-items: baseline;
      gap: 1rem;
    }

    .m3-price-current {
      font-size: 2rem;
      font-weight: 500;
    }

    .m3-price-original {
      font-size: 1.25rem;
      color: var(--md-sys-color-on-surface-variant);
      text-decoration: line-through;
    }

    .m3-stock-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 100px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .m3-stock-chip.in-stock { background: #e6f4ea; color: #137333; }
    .m3-stock-chip.out-of-stock { background: #fce8e6; color: #d93025; }

    .m3-description {
      font-size: 1rem;
      line-height: 1.6;
      color: var(--md-sys-color-on-surface-variant);
      margin: 0 0 2.5rem 0;
    }

    /* --- Controls --- */
    .m3-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    @media (min-width: 640px) {
      .m3-controls { flex-direction: row; }
    }

    .m3-qty-selector {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 100px;
      height: 56px; /* Google Store standard touch height */
      background: var(--md-sys-color-surface);
    }

    .m3-qty-btn {
      width: 56px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
      border-radius: 100px;
      transition: background 0.2s;
    }

    .m3-qty-btn:hover:not(:disabled) { background: var(--md-sys-color-surface-variant); }
    .m3-qty-btn:disabled { color: var(--md-sys-color-outline); cursor: not-allowed; }
    
    .m3-qty-value {
      font-weight: 500;
      min-width: 2.5rem;
      text-align: center;
    }

    .m3-btn-primary {
      flex: 1;
      height: 56px;
      border-radius: 100px;
      background-color: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border: none;
      font-family: 'Google Sans', sans-serif;
      font-size: 1.125rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .m3-btn-primary:hover { background-color: #1557b0; }

    .m3-btn-disabled {
      flex: 1;
      height: 56px;
      border-radius: 100px;
      background-color: var(--bg-secondary, #f1f3f4);
      color: var(--text-tertiary, #9aa0a6);
      border: none;
      font-family: 'Google Sans', sans-serif;
      font-size: 1.125rem;
      font-weight: 500;
      cursor: not-allowed;
    }

    /* --- Perks --- */
    .m3-perks {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      padding: 1.5rem 0;
      border-top: 1px solid var(--md-sys-color-outline);
      border-bottom: 1px solid var(--md-sys-color-outline);
      margin-bottom: 2rem;
    }

    .m3-perk {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      color: var(--md-sys-color-on-surface-variant);
    }

    .m3-perk i { font-size: 1.25rem; color: var(--md-sys-color-on-surface); }
    .m3-perk span { font-size: 0.75rem; font-weight: 500; }

    /* --- Accordions --- */
    .m3-accordions {
      display: flex;
      flex-direction: column;
    }

    .m3-accordion {
      border-bottom: 1px solid var(--md-sys-color-outline);
    }

    .m3-acc-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 0;
      background: transparent;
      border: none;
      font-family: 'Google Sans', sans-serif;
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      cursor: pointer;
    }

    .m3-acc-header i {
      transition: transform 0.3s var(--md-sys-easing-standard);
    }
    .m3-acc-header i.rotated {
      transform: rotate(180deg);
    }

    .m3-acc-content {
      padding-bottom: 1.5rem;
      color: var(--md-sys-color-on-surface-variant);
      line-height: 1.6;
    }

    /* --- Skeletons --- */
    .m3-gallery-skeleton {
      width: 100%;
      aspect-ratio: 1;
      background: var(--bg-secondary, #f1f3f4);
      border-radius: 24px;
      animation: pulse 1.5s infinite;
    }
    .m3-info-skeleton { display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem; }
    .skel-line { background: var(--bg-secondary, #f1f3f4); height: 1.5rem; border-radius: 4px; animation: pulse 1.5s infinite; }
    .skel-line.w-30 { width: 30%; }
    .skel-line.w-40 { width: 40%; }
    .skel-line.w-80 { width: 80%; }
    .skel-line.w-90 { width: 90%; }
    .skel-line.w-100 { width: 100%; }
    .skel-line.h-xl { height: 3rem; }
    .skel-line.h-lg { height: 2rem; }
    .skel-button { background: var(--bg-secondary, #f1f3f4); height: 56px; border-radius: 100px; width: 100%; animation: pulse 1.5s infinite; }
    .mt-xl { margin-top: 2rem; }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    /* --- 404 --- */
    .m3-not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10rem 2rem;
      text-align: center;
    }
    .m3-not-found-icon { font-size: 4rem; color: var(--md-sys-color-outline); margin-bottom: 1rem; }
    .m3-btn-tonal {
      display: inline-flex; padding: 0 1.5rem; height: 48px; border-radius: 100px;
      background: #e8f0fe; color: #1967d2; font-weight: 500; align-items: center;
      text-decoration: none; margin-top: 1.5rem; transition: background 0.2s;
    }
    .m3-btn-tonal:hover { background: #d2e3fc; }
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

    // Safely parse original and current from JSON structure
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
    this.selectedImage.set(url);
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
