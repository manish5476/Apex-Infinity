import { Injectable, computed, signal } from '@angular/core';
import { StorefrontApiError, StorefrontCart, StorefrontCartItem } from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class StorefrontCartStore {
  readonly cart = signal<StorefrontCart | null>(null);
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly error = signal<StorefrontApiError | null>(null);
  readonly loadedAt = signal<number | null>(null);

  readonly items = computed<readonly StorefrontCartItem[]>(() => this.cart()?.items ?? this.cart()?.cartItems ?? []);
  readonly itemCount = computed(() => this.cart()?.itemCount ?? this.items().reduce((total, item) => total + item.quantity, 0));
  readonly subtotal = computed(() => this.cart()?.totals?.subtotal ?? 0);
  readonly discount = computed(() => this.cart()?.discountTotals?.total ?? this.cart()?.totals?.discount ?? 0);
  readonly shipping = computed(() => this.cart()?.shippingTotals?.total ?? this.cart()?.totals?.shipping ?? 0);
  readonly tax = computed(() => this.cart()?.taxTotals?.total ?? this.cart()?.totals?.tax ?? 0);
  readonly total = computed(() => this.cart()?.totals?.total ?? this.cart()?.totals?.grandTotal ?? 0);
  readonly currency = computed(() => this.cart()?.currency ?? this.cart()?.totals?.currency ?? 'INR');
  readonly isEmpty = computed(() => this.items().length === 0);

  setCart(cart: StorefrontCart | null): void {
    this.cart.set(cart);
    this.error.set(null);
    this.loadedAt.set(Date.now());
  }

  optimisticQuantity(cartItemId: string, quantity: number): void {
    const cart = this.cart();
    if (!cart) return;
    const items = this.items().map(item => this.itemId(item) === cartItemId ? { ...item, quantity } : item);
    this.cart.set({ ...cart, items });
  }

  optimisticRemove(cartItemId: string): void {
    const cart = this.cart();
    if (!cart) return;
    this.cart.set({ ...cart, items: this.items().filter(item => this.itemId(item) !== cartItemId) });
  }

  clear(): void {
    this.setCart(null);
    this.loading.set(false);
    this.syncing.set(false);
  }

  private itemId(item: StorefrontCartItem): string {
    return item._id ?? item.id ?? '';
  }
}
