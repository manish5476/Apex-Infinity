import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { AddCartItemDto, ApplyCouponDto, CartValidationResult, ShippingEstimateDto, StorefrontApiError, StorefrontCart } from '@apx/storefront-contracts';
import { StorefrontCartApi } from '../api/storefront-cart.api';
import { StorefrontCartStore } from '../state/storefront-cart.store';
import { StorefrontCacheService } from '../state/storefront-cache.service';

@Injectable({ providedIn: 'root' })
export class StorefrontCartFacade {
  private readonly api = inject(StorefrontCartApi);
  private readonly cache = inject(StorefrontCacheService);
  readonly store = inject(StorefrontCartStore);

  readonly cart = this.store.cart;
  readonly items = this.store.items;
  readonly itemCount = this.store.itemCount;
  readonly subtotal = this.store.subtotal;
  readonly discount = this.store.discount;
  readonly shipping = this.store.shipping;
  readonly tax = this.store.tax;
  readonly total = this.store.total;
  readonly currency = this.store.currency;
  readonly loading = this.store.loading;
  readonly syncing = this.store.syncing;
  readonly error = this.store.error;

  load(orgSlug: string, force = false): Observable<StorefrontCart | null> {
    const cacheKey = `cart:${orgSlug}`;
    const cached = this.cache.get<StorefrontCart>(cacheKey);
    if (cached && !force) {
      this.store.setCart(cached);
      this.revalidate(orgSlug);
      return of(cached);
    }

    this.store.loading.set(true);
    return this.api.getCart(orgSlug).pipe(
      tap(response => {
        this.store.setCart(response.data);
        this.cache.set(cacheKey, response.data, 30_000);
      }),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontCart>(error)),
      finalize(() => this.store.loading.set(false))
    );
  }

  add(orgSlug: string, dto: AddCartItemDto): Observable<StorefrontCart | null> {
    this.store.syncing.set(true);
    return this.api.addItem(orgSlug, dto).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontCart>(error)),
      finalize(() => this.store.syncing.set(false))
    );
  }

  updateQuantity(orgSlug: string, cartItemId: string, quantity: number): Observable<StorefrontCart | null> {
    const previous = this.store.cart();
    this.store.optimisticQuantity(cartItemId, quantity);
    this.store.syncing.set(true);
    return this.api.updateItem(orgSlug, cartItemId, { quantity }).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => {
        this.store.setCart(previous);
        return this.handleError<StorefrontCart>(error);
      }),
      finalize(() => this.store.syncing.set(false))
    );
  }

  remove(orgSlug: string, cartItemId: string): Observable<StorefrontCart | null> {
    const previous = this.store.cart();
    this.store.optimisticRemove(cartItemId);
    this.store.syncing.set(true);
    return this.api.removeItem(orgSlug, cartItemId).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => {
        this.store.setCart(previous);
        return this.handleError<StorefrontCart>(error);
      }),
      finalize(() => this.store.syncing.set(false))
    );
  }

  clear(orgSlug: string): Observable<StorefrontCart | null> {
    this.store.syncing.set(true);
    return this.api.clear(orgSlug).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontCart>(error)),
      finalize(() => this.store.syncing.set(false))
    );
  }

  applyCoupon(orgSlug: string, dto: ApplyCouponDto): Observable<StorefrontCart | null> {
    return this.api.applyCoupon(orgSlug, dto).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontCart>(error))
    );
  }

  estimateShipping(orgSlug: string, dto: ShippingEstimateDto): Observable<StorefrontCart | null> {
    return this.api.estimateShipping(orgSlug, dto).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontCart>(error))
    );
  }

  validate(orgSlug: string): Observable<CartValidationResult | null> {
    return this.api.validate(orgSlug).pipe(
      map(response => response.data),
      catchError(error => this.handleError<CartValidationResult>(error))
    );
  }

  merge(orgSlug: string): Observable<StorefrontCart | null> {
    return this.api.merge(orgSlug).pipe(
      tap(response => this.commit(orgSlug, response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontCart>(error))
    );
  }

  private revalidate(orgSlug: string): void {
    this.api.getCart(orgSlug).pipe(catchError(() => of(null))).subscribe(response => {
      if (response) this.commit(orgSlug, response.data);
    });
  }

  private commit(orgSlug: string, cart: StorefrontCart): void {
    this.store.setCart(cart);
    this.cache.set(`cart:${orgSlug}`, cart, 30_000);
  }

  private handleError<T>(error: unknown): Observable<T | null> {
    this.store.error.set(error as StorefrontApiError);
    return of(null);
  }
}
