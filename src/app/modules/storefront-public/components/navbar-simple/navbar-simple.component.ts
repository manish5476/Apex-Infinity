import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { StorefrontCartService } from '@core/services/storefront.cart.service';
import { StorefrontPublicService } from '@core/services/storefront-public.service';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { ThemeService } from '@core/services/theme.service';
import { Subject, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar-simple',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="sf-nav" [class.scrolled]="isScrolled()" [class.menu-open]="mobileOpen()">
      <nav class="sf-nav__bar" [class.transparent]="config?.transparent && !isScrolled()">
        <a class="sf-nav__brand" [routerLink]="['/store', slug(), 'home']">
          @if (logo) {
            <img [src]="logo" [alt]="organization?.name || 'Store'" />
          } @else {
            <span>{{ organization?.name || 'Store' }}</span>
          }
        </a>

        <div class="sf-nav__links" (mouseleave)="activeMega.set(null)">
          @for (item of menuItems(); track item.url || item.label) {
            <a [routerLink]="navLink(item.url)" (mouseenter)="openMega(item)" [class.has-mega]="hasMega(item)">
              {{ item.label }}
            </a>
          }

          @if (activeMega(); as mega) {
            <div class="mega-panel">
              <div class="mega-panel__copy">
                <span>Explore</span>
                <h3>{{ mega.label }}</h3>
                <p>{{ mega.description || 'Discover curated products, collections, and storefront stories.' }}</p>
              </div>
              <div class="mega-panel__grid">
                @for (child of mega.children || defaultMegaLinks; track child.url || child.label) {
                  <a [routerLink]="navLink(child.url)">
                    <i class="pi pi-arrow-right"></i>
                    <span>{{ child.label }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </div>

        <div class="sf-nav__actions">
          <button type="button" (click)="toggleTheme()" aria-label="Toggle Theme">
            <i class="pi" [ngClass]="isDarkMode() ? 'pi-sun' : 'pi-moon'"></i>
          </button>
          <button type="button" (click)="searchOpen.set(true)" aria-label="Search">
            <i class="pi pi-search"></i>
          </button>
          <button class="account-trigger" type="button" (click)="accountOpen.update(v => !v)" aria-label="Account">
            <i class="pi pi-user"></i>
          </button>
          <button class="cart-trigger" type="button" (click)="cartOpen.set(true)" aria-label="Cart">
            <i class="pi pi-shopping-bag"></i>
            @if (itemCount() > 0) { <span>{{ itemCount() }}</span> }
          </button>
          <button class="mobile-trigger" type="button" (click)="mobileOpen.set(true)" aria-label="Open menu">
            <i class="pi pi-bars"></i>
          </button>
        </div>

        @if (accountOpen()) {
          <div class="account-menu">
            <a [routerLink]="['/store', slug(), 'account']"><i class="pi pi-user"></i> Account dashboard</a>
            <a [routerLink]="['/store', slug(), 'account/orders']"><i class="pi pi-history"></i> Orders</a>
            <a [routerLink]="['/store', slug(), 'wishlist']"><i class="pi pi-heart"></i> Wishlist</a>
            <a [routerLink]="['/store', slug(), 'login']"><i class="pi pi-sign-in"></i> Sign in</a>
          </div>
        }
      </nav>
    </header>

    @if (searchOpen()) {
      <section class="overlay search-overlay" role="dialog" aria-modal="true" aria-label="Store search">
        <button class="overlay-close" type="button" (click)="searchOpen.set(false)" aria-label="Close search">
          <i class="pi pi-times"></i>
        </button>
        <div class="search-box">
          <span class="apx-kicker"><i class="pi pi-search"></i> Predictive search</span>
          <input autofocus type="search" placeholder="Search products, brands, categories..." [ngModel]="searchQuery()"
            (ngModelChange)="onSearch($event)" />
          <div class="search-results">
            @if (searchQuery().length < 2) {
              <p>Type at least two characters to search products.</p>
            } @else if (!searchResults().length) {
              <p>No instant matches yet. Try a product name, SKU, brand, or category.</p>
            } @else {
              @for (product of searchResults(); track product._id || product.id || product.slug) {
                <a [routerLink]="['/store', slug(), 'products', product.slug || product._id || product.id]" (click)="searchOpen.set(false)">
                  <span>{{ product.name }}</span>
                  <i class="pi pi-arrow-right"></i>
                </a>
              }
            }
          </div>
        </div>
      </section>
    }

    @if (cartOpen()) {
      <aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Cart drawer">
        <div class="drawer-head">
          <div><span>Your cart</span><strong>{{ itemCount() }} items</strong></div>
          <button type="button" (click)="cartOpen.set(false)" aria-label="Close cart"><i class="pi pi-times"></i></button>
        </div>
        <div class="drawer-lines">
          @if (!cartItems().length) {
            <div class="drawer-empty">
              <i class="pi pi-shopping-bag"></i>
              <h3>Your cart is empty</h3>
              <p>Find something beautiful and it will appear here.</p>
            </div>
          } @else {
            @for (item of cartItems(); track item._id || item.id || item.product?._id) {
              <article>
                <img [src]="productImage(item)" [alt]="productName(item)" />
                <div><h4>{{ productName(item) }}</h4><span>Qty {{ item.quantity || 1 }}</span></div>
                <strong>{{ lineTotal(item) | currency: currency() }}</strong>
              </article>
            }
          }
        </div>
        <div class="drawer-foot">
          <div><span>Total</span><strong>{{ grandTotal() | currency: currency() }}</strong></div>
          <a [routerLink]="['/store', slug(), 'cart']" (click)="cartOpen.set(false)">View cart</a>
          <a class="primary" [routerLink]="['/store', slug(), 'checkout']" (click)="cartOpen.set(false)">Checkout</a>
        </div>
      </aside>
      <button class="drawer-backdrop" type="button" (click)="cartOpen.set(false)" aria-label="Close cart drawer"></button>
    }

    @if (mobileOpen()) {
      <aside class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile menu">
        <div class="drawer-head">
          <strong>{{ organization?.name || 'Store' }}</strong>
          <button type="button" (click)="mobileOpen.set(false)" aria-label="Close menu"><i class="pi pi-times"></i></button>
        </div>
        <nav>
          @for (item of menuItems(); track item.url || item.label) {
            <a [routerLink]="navLink(item.url)" (click)="mobileOpen.set(false)">{{ item.label }} <i class="pi pi-arrow-right"></i></a>
          }
          <a [routerLink]="['/store', slug(), 'account']" (click)="mobileOpen.set(false)">Account <i class="pi pi-user"></i></a>
          <a [routerLink]="['/store', slug(), 'cart']" (click)="mobileOpen.set(false)">Cart <i class="pi pi-shopping-bag"></i></a>
        </nav>
      </aside>
      <button class="drawer-backdrop" type="button" (click)="mobileOpen.set(false)" aria-label="Close mobile menu"></button>
    }
  `,
  styleUrls: ['./navbar-simple.component.scss']
})
export class NavbarSimpleComponent implements OnInit, OnDestroy {
  private readonly stateService = inject(StorefrontStateService);
  private readonly cartService = inject(StorefrontCartService);
  private readonly publicService = inject(StorefrontPublicService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  @Input() config: any;
  @Input() logo: string | undefined;
  @Input() organization: any;
  @Input() set orgSlug(val: string) {
    if (val) this._inputSlug.set(val);
  }

  readonly isScrolled = signal(false);
  readonly mobileOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly cartOpen = signal(false);
  readonly accountOpen = signal(false);
  readonly activeMega = signal<any | null>(null);
  readonly searchQuery = signal('');
  readonly searchResults = signal<any[]>([]);
  readonly itemCount = this.cartService.itemCount;
  readonly grandTotal = this.cartService.grandTotal;
  readonly cartItems = computed<any[]>(() => this.cartService.cart()?.items ?? []);
  readonly currency = computed(() => this.cartService.cart()?.currency ?? 'INR');
  readonly isDarkMode = signal(false);

  readonly defaultMegaLinks = [
    { label: 'New arrivals', url: 'new-arrivals' },
    { label: 'Best sellers', url: 'best-sellers' },
    { label: 'Deals', url: 'deals' },
    { label: 'Gift cards', url: 'gift-card' }
  ];

  private readonly _inputSlug = signal('');
  readonly slug = computed(() =>
    this.stateService.organization()?.slug ||
    this.organization?.slug ||
    this._inputSlug() ||
    this.parseSlugFromUrl(this.router.url)
  );

  readonly menuItems = computed(() => {
    const items = this.config?.menuItems || this.config?.links;
    if (Array.isArray(items) && items.length) return items;
    return [
      { label: 'Shop', url: 'products', children: this.defaultMegaLinks },
      { label: 'New Arrivals', url: 'new-arrivals' },
      { label: 'Best Sellers', url: 'best-sellers' },
      { label: 'About', url: 'about' },
      { label: 'Contact', url: 'contact' }
    ];
  });

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.mobileOpen.set(false);
      this.accountOpen.set(false);
    });

    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe(s => {
      this.isDarkMode.set(s.isDarkMode);
    });

    this.search$.pipe(
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(term => {
        if (!this.slug() || term.trim().length < 2) return of({ products: [] });
        return this.publicService.searchProducts(this.slug(), term).pipe(catchError(() => of({ products: [] })));
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => this.searchResults.set(res?.products ?? res?.data?.products ?? []));

    if (this.slug()) this.cartService.getCart(this.slug()).pipe(catchError(() => of(null))).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 24);
  }

  toggleTheme(): void {
    this.themeService.setDarkMode(!this.isDarkMode());
  }

  navLink(url: string): string[] {
    if (!url || url === '/' || url === '') return ['/store', this.slug(), 'home'];
    return ['/store', this.slug(), url.replace(/^\/+/, '')];
  }

  openMega(item: any): void {
    this.activeMega.set(this.hasMega(item) ? item : null);
  }

  hasMega(item: any): boolean {
    return !!(item?.children?.length || item?.megaMenu || item?.url === 'products');
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  productName(item: any): string {
    return item?.product?.name ?? item?.name ?? 'Product';
  }

  productImage(item: any): string {
    return item?.product?.images?.[0] ?? item?.image ?? 'assets/placeholder.png';
  }

  lineTotal(item: any): number {
    return Number(item?.lineTotal ?? item?.total ?? item?.unitPrice ?? item?.price ?? 0);
  }

  private parseSlugFromUrl(url: string): string {
    const match = url.match(/\/store\/([^/?#]+)/);
    return (match?.[1] && match[1] !== 'undefined') ? match[1] : '';
  }
}
