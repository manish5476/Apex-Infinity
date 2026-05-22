import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { StorefrontCartService } from '@core/services/storefront.cart.service';
import { StorefrontPublicService } from '@core/services/storefront-public.service';
import {
  CheckoutDto,
  StorefrontAddressDto,
  StorefrontCustomerService
} from '@core/services/storefront-customer.service';

type CommerceMode =
  | 'cart'
  | 'checkout'
  | 'account'
  | 'addresses'
  | 'notifications'
  | 'orders'
  | 'login'
  | 'register'
  | 'wishlist'
  | 'track-order';

@Component({
  selector: 'app-commerce-flow',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyPipe],
  templateUrl: './commerce-flow.component.html',
  styleUrls: ['./commerce-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceFlowComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartService = inject(StorefrontCartService);
  private readonly customerService = inject(StorefrontCustomerService);
  private readonly publicService = inject(StorefrontPublicService);
  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly mode = signal<CommerceMode>('cart');
  readonly orgSlug = signal('');
  readonly loading = signal(true);
  readonly validating = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly suggestions = signal<any[]>([]);
  readonly checkoutStep = signal<'contact' | 'delivery' | 'payment' | 'review'>('contact');
  readonly trackedOrder = signal<any>(null);

  readonly cart = this.cartService.cart;
  readonly dashboard = this.customerService.dashboard;
  readonly customer = this.customerService.customer;

  readonly items = computed<any[]>(() => this.cart()?.items ?? this.cart()?.lineItems ?? []);
  readonly itemCount = this.cartService.itemCount;
  readonly subtotal = computed(() => this.moneyValue(this.cart()?.totals?.subtotal ?? this.cart()?.subtotal));
  readonly discount = computed(() => this.moneyValue(this.cart()?.discountTotals?.total ?? this.cart()?.discountAmount));
  readonly shipping = computed(() => this.items().length ? this.moneyValue(this.cart()?.shippingTotals?.total) : 0);
  readonly total = computed(() => this.moneyValue(this.cart()?.totals?.total ?? this.cart()?.grandTotal));
  readonly currency = computed(() => this.cart()?.currency ?? this.cart()?.totals?.currency ?? 'INR');
  readonly addresses = computed<any[]>(() => this.dashboard()?.addresses ?? []);
  readonly orders = computed<any[]>(() => this.dashboard()?.orders ?? []);
  readonly wishlist = computed<any[]>(() => this.dashboard()?.wishlist ?? []);

  readonly loginForm = {
    email: '',
    password: ''
  };

  readonly registerForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    marketingOptIn: true
  };

  readonly addressForm: StorefrontAddressDto = {
    fullName: '',
    phone: '',
    country: 'India',
    state: '',
    city: '',
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    addressType: 'home',
    isDefault: true
  };

  readonly checkoutContact = {
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    marketingOptIn: true,
    saveAddress: true
  };

  readonly couponCode = signal('');
  readonly trackOrderNumber = signal('');
  readonly trackVerify = signal('');

  readonly notifications = [
    { title: 'Order updates', body: 'Delivery, refund, and payment alerts will appear here.', icon: 'pi pi-truck' },
    { title: 'Rewards', body: 'Points, coupons, and loyalty activity will be grouped here.', icon: 'pi pi-gift' },
    { title: 'Security', body: 'Login and account protection messages stay visible.', icon: 'pi pi-shield' }
  ];

  ngOnInit(): void {
    this.route.parent?.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params.get('orgSlug') ?? '';
      this.orgSlug.set(slug);
      if (slug) {
        this.loadCart(slug);
        this.loadCustomer(slug);
      }
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.mode.set((data['mode'] as CommerceMode) ?? 'cart');
      this.error.set(null);
      this.success.set(null);
    });

    this.search$.pipe(
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(term => {
        const slug = this.orgSlug();
        if (!slug || term.trim().length < 2) return of({ products: [] });
        return this.publicService.searchProducts(slug, term).pipe(catchError(() => of({ products: [] })));
      }),
      takeUntil(this.destroy$)
    ).subscribe((res: any) => this.suggestions.set(res?.products ?? res?.data?.products ?? []));
  }

  loadCart(orgSlug = this.orgSlug()): void {
    this.loading.set(true);
    this.error.set(null);
    this.cartService.getCart(orgSlug).pipe(
      catchError(() => {
        this.error.set('Cart is temporarily unavailable. You can keep browsing while we reconnect.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loading.set(false));
  }

  loadCustomer(orgSlug = this.orgSlug()): void {
    this.customerService.me(orgSlug).pipe(catchError(() => of(null)), takeUntil(this.destroy$)).subscribe();
  }

  login(): void {
    this.submitting.set(true);
    this.customerService.login(this.orgSlug(), this.loginForm).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Login failed.');
        return of(null);
      })
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Welcome back. Your cart is synced.');
      this.loadCart();
      this.router.navigate(['/store', this.orgSlug(), 'account']);
    });
  }

  register(): void {
    this.submitting.set(true);
    this.customerService.register(this.orgSlug(), this.registerForm).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Account creation failed.');
        return of(null);
      })
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Account created. Your storefront profile is ready.');
      this.loadCart();
      this.router.navigate(['/store', this.orgSlug(), 'account']);
    });
  }

  logout(): void {
    this.customerService.logout(this.orgSlug()).subscribe(() => {
      this.cartService.resetCart();
      this.router.navigate(['/store', this.orgSlug(), 'login']);
    });
  }

  saveAddress(): void {
    this.submitting.set(true);
    this.customerService.addAddress(this.orgSlug(), this.addressForm).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Could not save address.');
        return of(null);
      })
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Address saved.');
      this.loadCustomer();
    });
  }

  placeOrder(): void {
    const payload: CheckoutDto = {
      customer: { ...this.checkoutContact },
      shippingAddress: this.addressForm,
      billingAddress: this.addressForm,
      saveAddress: this.checkoutContact.saveAddress,
      defaultAddress: true
    };

    this.submitting.set(true);
    this.customerService.checkout(this.orgSlug(), payload).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Checkout could not be completed.');
        return of(null);
      })
    ).subscribe((res: any) => {
      this.submitting.set(false);
      const order = res?.data ?? res;
      if (!order) return;
      this.success.set(`Order ${order.orderNumber} placed successfully.`);
      this.loadCart();
      this.router.navigate(['/store', this.orgSlug(), 'orders', 'success'], {
        queryParams: { order: order.orderNumber }
      });
    });
  }

  applyCoupon(): void {
    if (!this.couponCode().trim()) return;
    this.cartService.applyCoupon(this.orgSlug(), this.couponCode()).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Coupon could not be applied.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) this.success.set('Coupon saved for checkout.');
    });
  }

  estimateShipping(): void {
    this.cartService.estimateShipping(this.orgSlug(), { amount: 0, address: this.addressForm }).subscribe();
  }

  trackOrder(): void {
    if (!this.trackOrderNumber().trim()) return;
    this.submitting.set(true);
    this.customerService.trackOrder(this.orgSlug(), this.trackOrderNumber(), this.trackVerify()).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Order not found.');
        return of(null);
      })
    ).subscribe((res: any) => {
      this.submitting.set(false);
      this.trackedOrder.set(res?.data ?? res);
    });
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
      if (result?.valid !== false) this.router.navigate(['/store', this.orgSlug(), 'checkout']);
      else this.error.set('Some cart items need attention before checkout.');
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  productName(item: any): string {
    return item?.snapshot?.name ?? item?.product?.name ?? item?.name ?? 'Product';
  }

  productImage(item: any): string {
    return item?.snapshot?.image ?? item?.product?.images?.[0] ?? item?.image ?? 'assets/placeholder.png';
  }

  itemPrice(item: any): number {
    return this.moneyValue(item?.snapshot?.discountedPrice ?? item?.snapshot?.sellingPrice ?? item?.unitPrice ?? item?.price);
  }

  itemQuantity(item: any): number {
    return Number(item?.quantity ?? item?.qty ?? 1);
  }

  itemLineTotal(item: any): number {
    return this.moneyValue(item?.lineTotal ?? this.itemPrice(item) * this.itemQuantity(item));
  }

  addressLabel(address: any): string {
    return [address.addressLine1, address.city, address.state, address.postalCode].filter(Boolean).join(', ');
  }

  private itemId(item: any): string {
    return item?._id ?? item?.id ?? item?.cartItemId ?? '';
  }

  private moneyValue(value: any): number {
    return Number(value ?? 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
