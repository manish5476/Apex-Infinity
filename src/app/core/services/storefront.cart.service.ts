// src/app/core/services/storefront-cart.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseApiService } from './base-api.service';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

export interface AddItemDto {
  productId: string;
  quantity?: number;
  branchId?: string;
  variantId?: string;
}

export interface CartValidationResult {
  valid: boolean;
  issues: Array<{
    itemId: string;
    productName: string;
    issue: 'unavailable' | 'out_of_stock' | 'insufficient_stock';
    requested: number;
    available: number;
  }>;
}

// ---------------------------------------------------------------------------
// Service
//
// Backend mount: embedded in public.routes.js
// Resolved URL : {environment.apiUrl}/v1/store/:orgSlug/cart/...
//
// Cart identity is managed server-side:
//   - Authenticated customers  → JWT cookie (withCredentials: true handles this)
//   - Guest users              → cartSession cookie set by the backend
//
// withCredentials: true is set on every request by BaseApiService,
// so both the auth JWT and the cartSession cookie are sent automatically.
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class StorefrontCartService extends BaseApiService {

  private readonly base = '/v1/store';

  // ── Reactive state ────────────────────────────────────────────────────────

  /** Latest cart snapshot. Updated automatically by methods that mutate the cart. */
  readonly cart = signal<any>(null);

  /** Derived: total number of individual units across all line items. */
  readonly itemCount = computed(() =>
    (this.cart()?.itemCount) ?? 0
  );

  /** Derived: grand total after discount. */
  readonly grandTotal = computed(() =>
    this.cart()?.totals?.total ?? this.cart()?.grandTotal ?? 0
  );

  // ── Private helpers ───────────────────────────────────────────────────────

  private cartBase(orgSlug: string): string {
    return `${this.base}/${orgSlug}/cart`;
  }

  /** Tap operator that writes the response cart into the signal. */
  private updateCart() {
    return tap((res: any) => {
      const cart = res?.data ?? res;
      if (cart?.id || cart?.items) {
        this.cart.set(cart);
      }
    });
  }

  // ── API methods ───────────────────────────────────────────────────────────

  /** Fetches (or creates) the active cart. Call on app init / storefront load. */
  getCart(orgSlug: string): Observable<any> {
    return this.get<any>(this.cartBase(orgSlug)).pipe(this.updateCart());
  }

  /** Add a product to the cart. Quantity defaults to 1. */
  addItem(orgSlug: string, item: AddItemDto): Observable<any> {
    return this.post<any>(
      `${this.cartBase(orgSlug)}/items`,
      { quantity: 1, ...item }
    ).pipe(this.updateCart());
  }

  /** Change the quantity of an existing cart line item. */
  updateItemQuantity(
    orgSlug: string,
    cartItemId: string,
    quantity: number
  ): Observable<any> {
    return this.patch<any>(
      `${this.cartBase(orgSlug)}/items/${cartItemId}`,
      { quantity }
    ).pipe(this.updateCart());
  }

  /** Remove a single line item from the cart. */
  removeItem(orgSlug: string, cartItemId: string): Observable<any> {
    return this.delete<any>(
      `${this.cartBase(orgSlug)}/items/${cartItemId}`
    ).pipe(this.updateCart());
  }

  /** Remove all items from the cart. */
  clearCart(orgSlug: string): Observable<any> {
    return this.delete<any>(this.cartBase(orgSlug)).pipe(this.updateCart());
  }

  /**
   * Re-validate all cart items against live stock before proceeding to checkout.
   * Returns 200 { valid: true } or 409 { valid: false, issues: [...] }.
   */
  validateCart(orgSlug: string): Observable<CartValidationResult> {
    return this.get<CartValidationResult>(
      `${this.cartBase(orgSlug)}/validate`
    );
  }

  applyCoupon(orgSlug: string, couponCode: string): Observable<any> {
    return this.post<any>(
      `${this.cartBase(orgSlug)}/coupons`,
      { couponCode }
    ).pipe(this.updateCart());
  }

  estimateShipping(orgSlug: string, payload: Record<string, any>): Observable<any> {
    return this.post<any>(
      `${this.cartBase(orgSlug)}/shipping-estimate`,
      payload
    ).pipe(this.updateCart());
  }

  /** Merge the current guest sf_session cart into the authenticated storefront customer cart. */
  mergeCart(orgSlug: string): Observable<any> {
    return this.post<any>(
      `${this.cartBase(orgSlug)}/merge`,
      {}
    ).pipe(this.updateCart());
  }

  // ── Local helpers (no HTTP) ───────────────────────────────────────────────

  /** Read the guest cartSession token from the browser cookie jar. */
  getGuestSessionToken(): string | null {
    if (typeof document === 'undefined') return null; // SSR guard
    const match = document.cookie.match(/(?:^|;\s*)sf_session=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /** Clear local signal state (call on logout). */
  resetCart(): void {
    this.cart.set(null);
  }
}
