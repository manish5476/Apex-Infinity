import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { StorefrontCartService } from '@core/services/storefront.cart.service';
import { StorefrontPublicService } from '@core/services/storefront-public.service';

type CommerceMode = 'cart' | 'checkout' | 'account' | 'addresses' | 'notifications' | 'orders';

@Component({
  selector: 'app-commerce-flow',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyPipe],
  templateUrl: './commerce-flow.component.html',
  styleUrls: ['./commerce-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceFlowComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartService = inject(StorefrontCartService);
  private readonly publicService = inject(StorefrontPublicService);
  private readonly search$ = new Subject<string>();

  readonly mode = signal<CommerceMode>('cart');
  readonly orgSlug = signal('');
  readonly loading = signal(true);
  readonly validating = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly suggestions = signal<any[]>([]);
  readonly checkoutStep = signal<'contact' | 'delivery' | 'payment' | 'review'>('contact');

  readonly cart = this.cartService.cart;
  readonly items = computed<any[]>(() => {
    const cart = this.cart();
    return cart?.items ?? cart?.lineItems ?? [];
  });
  readonly itemCount = this.cartService.itemCount;
  readonly subtotal = computed(() => this.moneyValue(this.cart()?.subtotal ?? this.cart()?.subTotal ?? this.cart()?.itemsTotal));
  readonly discount = computed(() => this.moneyValue(this.cart()?.discountTotal ?? this.cart()?.discount ?? 0));
  readonly shipping = computed(() => this.items().length ? this.moneyValue(this.cart()?.shippingTotal ?? 0) : 0);
  readonly total = computed(() => this.moneyValue(this.cart()?.grandTotal ?? this.cart()?.total ?? this.subtotal() - this.discount() + this.shipping()));
  readonly currency = computed(() => this.cart()?.currency ?? 'INR');

  readonly accountCards = [
    { title: 'Orders', value: 'Synced', icon: 'pi pi-history', route: 'account/orders', body: 'Track purchases, invoices, returns, and fulfillment updates.' },
    { title: 'Addresses', value: 'Saved', icon: 'pi pi-map-marker', route: 'account/addresses', body: 'Manage default shipping and billing addresses for faster checkout.' },
    { title: 'Notifications', value: 'Live', icon: 'pi pi-bell', route: 'account/notifications', body: 'Review delivery alerts, rewards, account security, and offers.' },
    { title: 'Rewards', value: 'Ready', icon: 'pi pi-gift', route: 'rewards', body: 'Loyalty, points, credit, and member benefits foundation.' }
  ];

  readonly addressCards = [
    { name: 'Home', line: 'Add your default delivery address', badge: 'Default shipping' },
    { name: 'Work', line: 'Keep another saved address for faster checkout', badge: 'Optional' }
  ];

  readonly notifications = [
    { title: 'Order updates', body: 'Delivery, refund, and payment alerts will appear here.', icon: 'pi pi-truck' },
    { title: 'Rewards', body: 'Points, coupons, and loyalty activity will be grouped here.', icon: 'pi pi-gift' },
    { title: 'Security', body: 'Login and account protection messages stay visible.', icon: 'pi pi-shield' }
  ];

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const slug = params.get('orgSlug') ?? '';
      this.orgSlug.set(slug);
      if (slug) this.loadCart(slug);
    });

    this.route.data.subscribe(data => {
      this.mode.set((data['mode'] as CommerceMode) ?? 'cart');
    });

    this.search$.pipe(
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(term => {
        const slug = this.orgSlug();
        if (!slug || term.trim().length < 2) return of({ products: [] });
        return this.publicService.searchProducts(slug, term).pipe(catchError(() => of({ products: [] })));
      })
    ).subscribe((res: any) => this.suggestions.set(res?.products ?? res?.data?.products ?? []));
  }

  loadCart(orgSlug = this.orgSlug()): void {
    this.loading.set(true);
    this.error.set(null);
    this.cartService.getCart(orgSlug).pipe(
      catchError(() => {
        this.error.set('Cart is temporarily unavailable. You can keep browsing while we reconnect.');
        return of(null);
      })
    ).subscribe(() => this.loading.set(false));
  }

  updateQuantity(item: any, quantity: number): void {
    const id = this.itemId(item);
    if (!id || quantity < 1) return;
    this.cartService.updateItemQuantity(this.orgSlug(), id, quantity).subscribe();
  }

  removeItem(item: any): void {
    const id = this.itemId(item);
    if (!id) return;
    this.cartService.removeItem(this.orgSlug(), id).subscribe();
  }

  validateAndCheckout(): void {
    this.validating.set(true);
    this.cartService.validateCart(this.orgSlug()).pipe(
      catchError((err) => of(err?.error ?? { valid: false }))
    ).subscribe(result => {
      this.validating.set(false);
      if (result?.valid !== false) {
        this.router.navigate(['/store', this.orgSlug(), 'checkout']);
      } else {
        this.error.set('Some cart items need attention before checkout.');
      }
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  productName(item: any): string {
    return item?.product?.name ?? item?.name ?? item?.productName ?? 'Product';
  }

  productImage(item: any): string {
    return item?.product?.images?.[0] ?? item?.image ?? item?.productImage ?? 'assets/placeholder.png';
  }

  itemPrice(item: any): number {
    return this.moneyValue(item?.unitPrice ?? item?.price ?? item?.product?.price?.discounted ?? item?.product?.sellingPrice ?? 0);
  }

  itemQuantity(item: any): number {
    return Number(item?.quantity ?? item?.qty ?? 1);
  }

  itemLineTotal(item: any): number {
    return this.moneyValue(item?.lineTotal ?? item?.total ?? this.itemPrice(item) * this.itemQuantity(item));
  }

  private itemId(item: any): string {
    return item?._id ?? item?.id ?? item?.cartItemId ?? '';
  }

  private moneyValue(value: any): number {
    return Number(value ?? 0);
  }
}
