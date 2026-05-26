import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { StorefrontPublicService } from '@core/services/storefront-public.service';
import {
  StorefrontAddressDto,
  StorefrontCartItem,
  StorefrontCheckoutDto,
  StorefrontWishlistItem
} from '@apx/storefront-contracts';
import { StorefrontSessionService } from '@core/services/storefront-session.service';
import { StorefrontCartFacade } from '../../../../storefront/core/facades/storefront-cart.facade';
import { StorefrontAuthFacade } from '../../../../storefront/core/facades/storefront-auth.facade';
import { StorefrontCustomerFacade } from '../../../../storefront/core/facades/storefront-customer.facade';
import { StorefrontCheckoutFacade } from '../../../../storefront/core/facades/storefront-checkout.facade';
import { StorefrontOrderFacade } from '../../../../storefront/core/facades/storefront-order.facade';

type CommerceMode =
  | 'cart'
  | 'checkout'
  | 'account'
  | 'addresses'
  | 'notifications'
  | 'orders'
  | 'login'
  | 'register'
  | 'forgot'
  | 'wishlist'
  | 'track-order';

@Component({
  selector: 'app-commerce-flow',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './commerce-flow.component.html',
  styleUrls: ['./commerce-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommerceFlowComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartFacade = inject(StorefrontCartFacade);
  private readonly storefrontAuth = inject(StorefrontAuthFacade);
  private readonly customerFacade = inject(StorefrontCustomerFacade);
  private readonly checkoutFacade = inject(StorefrontCheckoutFacade);
  private readonly orderFacade = inject(StorefrontOrderFacade);
  private readonly storefrontSession = inject(StorefrontSessionService);
  private readonly publicService = inject(StorefrontPublicService);
  private readonly cdr = inject(ChangeDetectorRef);
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
  readonly trackedOrder = this.orderFacade.trackedOrder;
  readonly savedForLater = signal<StorefrontCartItem[]>([]);
  readonly shippingEstimate = signal<any>(null);
  readonly taxEstimate = signal<any>(null);

  // Flow State
  readonly selectedAddressId = signal<string | null | undefined>(null);
  readonly showAddressForm = signal(false);
  readonly editAddressId = signal<string | null>(null);

  readonly cart = this.cartFacade.cart;
  readonly dashboard = this.storefrontAuth.dashboard;
  readonly customer = this.storefrontAuth.customer;

  readonly items = this.cartFacade.items;
  readonly itemCount = this.cartFacade.itemCount;
  readonly subtotal = this.cartFacade.subtotal;
  readonly discount = this.cartFacade.discount;
  readonly shipping = this.cartFacade.shipping;
  readonly total = this.cartFacade.total;
  readonly currency = this.cartFacade.currency;
  readonly addresses = this.customerFacade.addresses;
  readonly orders = this.customerFacade.orders;
  readonly wishlist = this.customerFacade.wishlist;

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

  readonly forgotForm = {
    email: ''
  };

  readonly addressForm = {
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
        this.storefrontSession.setStore(slug);
        this.loadCart(slug);
        this.loadCustomer(slug);
      }
    });

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      const mode = (data['mode'] as CommerceMode) ?? 'cart';
      this.mode.set(mode);
      this.error.set(null);
      this.success.set(null);

      // Eagerly load orders when navigating to the orders page
      if (mode === 'orders' && this.orgSlug()) {
        this.customerFacade.loadOrders(this.orgSlug()).pipe(
          catchError(() => of(null)),
          takeUntil(this.destroy$)
        ).subscribe();
      }
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
    ).subscribe((res: any) => this.suggestions.set(res?.results ?? res?.data?.results ?? res?.products ?? res?.data?.products ?? []));
  }

  loadCart(orgSlug = this.orgSlug()): void {
    this.loading.set(true);
    this.error.set(null);
    this.cartFacade.load(orgSlug).pipe(
      catchError(() => {
        this.error.set('Cart is temporarily unavailable. You can keep browsing while we reconnect.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loading.set(false));
  }

  loadCustomer(orgSlug = this.orgSlug()): void {
    this.storefrontAuth.restore(orgSlug).pipe(
      catchError(() => of(false)),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      const cust = this.customer();
      if (cust) {
        this.checkoutContact.email = cust.email || '';
        this.checkoutContact.firstName = cust.firstName || '';
        this.checkoutContact.lastName = cust.lastName || '';
        this.checkoutContact.phone = cust.phone || '';

        if (cust.defaultAddressId) {
          this.selectedAddressId.set(cust.defaultAddressId);
        } else if (this.addresses().length > 0) {
          this.selectedAddressId.set(this.addresses()[0]._id || this.addresses()[0].id || null);
        }
        this.cdr.markForCheck();
      }
    });
  }

  login(): void {
    this.submitting.set(true);
    this.storefrontAuth.login(this.orgSlug(), this.loginForm).pipe(
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
    this.storefrontAuth.register(this.orgSlug(), this.registerForm).pipe(
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

  submitForgot(): void {
    if (!this.forgotForm.email) return;
    this.submitting.set(true);
    this.storefrontAuth.forgotPassword(this.orgSlug(), { email: this.forgotForm.email }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Failed to process request.');
        return of(null);
      })
    ).subscribe(res => {
      this.submitting.set(false);
      if (res) {
        this.success.set('If an account exists with that email, we have sent password reset instructions.');
        this.forgotForm.email = '';
      }
    });
  }

  logout(): void {
    this.storefrontAuth.logout(this.orgSlug()).subscribe(() => {
      this.router.navigate(['/store', this.orgSlug(), 'login']);
    });
  }

  saveAddress(): void {
    this.submitting.set(true);
    const req$ = this.editAddressId()
      ? this.customerFacade.updateAddress(this.orgSlug(), this.editAddressId()!, this.addressForm as StorefrontAddressDto)
      : this.customerFacade.addAddress(this.orgSlug(), this.addressForm as StorefrontAddressDto);

    req$.pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Could not save address.');
        return of(null);
      })
    ).subscribe(res => {
      this.submitting.set(false);
      if (!res) return;
      this.success.set('Address saved.');
      this.showAddressForm.set(false);
      this.editAddressId.set(null);
      this.loadCustomer();
    });
  }

  editAddress(address: any): void {
    this.editAddressId.set(address._id || address.id);
    this.addressForm.fullName = address.fullName || '';
    this.addressForm.phone = address.phone || '';
    this.addressForm.country = address.country || 'India';
    this.addressForm.state = address.state || '';
    this.addressForm.city = address.city || '';
    this.addressForm.postalCode = address.postalCode || '';
    this.addressForm.addressLine1 = address.addressLine1 || '';
    this.addressForm.addressLine2 = address.addressLine2 || '';
    this.addressForm.landmark = address.landmark || '';
    this.addressForm.addressType = address.addressType || 'home';
    this.addressForm.isDefault = !!address.isDefault;
    this.showAddressForm.set(true);
  }

  cancelEditAddress(): void {
    this.showAddressForm.set(false);
    this.editAddressId.set(null);
    this.addressForm.fullName = '';
    this.addressForm.phone = '';
    this.addressForm.country = 'India';
    this.addressForm.state = '';
    this.addressForm.city = '';
    this.addressForm.postalCode = '';
    this.addressForm.addressLine1 = '';
    this.addressForm.addressLine2 = '';
    this.addressForm.landmark = '';
    this.addressForm.addressType = 'home';
    this.addressForm.isDefault = true;
  }

  placeOrder(): void {
    const addresses = this.addresses();
    const selectedId = this.selectedAddressId();
    let finalAddress = this.addressForm;

    if (selectedId && addresses.length) {
      const saved = addresses.find(a => (a as any)._id === selectedId || (a as any).id === selectedId);
      if (saved) {
        finalAddress = saved as any;
      }
    }

    const payload: StorefrontCheckoutDto = {
      customer: { ...this.checkoutContact },
      shippingAddress: finalAddress as StorefrontAddressDto,
      billingAddress: finalAddress as StorefrontAddressDto,
      saveAddress: this.checkoutContact.saveAddress,
      defaultAddress: true
    };

    this.submitting.set(true);
    this.checkoutFacade.placeOrder(this.orgSlug(), payload).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Checkout could not be completed.');
        return of(null);
      })
    ).subscribe(order => {
      this.submitting.set(false);
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
    this.cartFacade.applyCoupon(this.orgSlug(), { couponCode: this.couponCode() }).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Coupon could not be applied.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) this.success.set('Coupon saved for checkout.');
    });
  }

  estimateShipping(): void {
    this.cartFacade.estimateShipping(this.orgSlug(), { amount: 0, address: this.addressForm as StorefrontAddressDto }).subscribe(cart => {
      this.shippingEstimate.set(cart?.shippingTotals ?? null);
      this.taxEstimate.set(cart?.taxTotals ?? null);
    });
  }

  trackOrder(): void {
    if (!this.trackOrderNumber().trim()) return;
    this.submitting.set(true);
    this.orderFacade.track(this.orgSlug(), this.trackOrderNumber(), this.trackVerify()).pipe(
      catchError(err => {
        this.error.set(err?.error?.message ?? 'Order not found.');
        return of(null);
      })
    ).subscribe(order => {
      this.submitting.set(false);
      this.orderFacade.store.trackedOrder.set(order);
    });
  }

  updateQuantity(item: any, quantity: number): void {
    const id = this.itemId(item);
    if (!id || quantity < 1) return;
    this.cartFacade.updateQuantity(this.orgSlug(), id, quantity).subscribe();
  }

  removeItem(item: any): void {
    const id = this.itemId(item);
    if (!id) return;
    this.cartFacade.remove(this.orgSlug(), id).subscribe();
  }

  saveForLater(item: StorefrontCartItem): void {
    this.savedForLater.set([item, ...this.savedForLater().filter(saved => this.itemId(saved) !== this.itemId(item))]);
    this.removeItem(item);
  }

  moveSavedToCart(item: StorefrontCartItem): void {
    const productId = item.productId;
    if (!productId) return;
    this.cartFacade.add(this.orgSlug(), { productId: String(productId), quantity: this.itemQuantity(item) }).subscribe(() => {
      this.savedForLater.set(this.savedForLater().filter(saved => this.itemId(saved) !== this.itemId(item)));
    });
  }

  validateAndCheckout(): void {
    this.validating.set(true);
    this.cartFacade.validate(this.orgSlug()).pipe(
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

  wishlistTrack(item: StorefrontWishlistItem): string {
    return item._id ?? item.id ?? (typeof item.productId === 'string' ? item.productId : (item.productId as any)?._id ?? '');
  }

  wishlistName(item: StorefrontWishlistItem): string {
    if (typeof item.productId === 'string') return 'Saved item';
    return (item.productId as any)?.name ?? 'Saved item';
  }

  wishlistImage(item: StorefrontWishlistItem): string | null {
    if (typeof item.productId === 'string') return null;
    const imgs = (item.productId as any)?.images;
    return (imgs && imgs.length > 0) ? imgs[0] : null;
  }

  wishlistCurrentPrice(item: StorefrontWishlistItem): number {
    if (typeof item.productId === 'string') return 0;
    const p = item.productId as any;
    return p?.discountedPrice || p?.sellingPrice || 0;
  }

  wishlistOriginalPrice(item: StorefrontWishlistItem): number {
    if (typeof item.productId === 'string') return 0;
    return (item.productId as any)?.sellingPrice || 0;
  }

  wishlistSlug(item: StorefrontWishlistItem): string {
    if (typeof item.productId === 'string') return '';
    return (item.productId as any)?.slug ?? '';
  }

  removeFromWishlist(item: StorefrontWishlistItem): void {
    const productId = typeof item.productId === 'string'
      ? item.productId
      : (item.productId as any)?._id ?? '';
    if (!productId) return;
    this.customerFacade.toggleWishlist(this.orgSlug(), productId).subscribe();
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
