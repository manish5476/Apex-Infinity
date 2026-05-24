import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorefrontCartStore {
  readonly cart = signal<any>(null);
  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly error = signal<string | null>(null);

  readonly items = computed<any[]>(() => this.cart()?.items ?? this.cart()?.lineItems ?? []);
  readonly itemCount = computed(() => this.cart()?.itemCount ?? this.items().reduce((sum, item) => sum + Number(item?.quantity ?? item?.qty ?? 1), 0));
  readonly grandTotal = computed(() => this.cart()?.totals?.total ?? this.cart()?.grandTotal ?? 0);

  setCart(value: any): void {
    this.cart.set(value);
    this.error.set(null);
  }

  clear(): void {
    this.cart.set(null);
    this.loading.set(false);
    this.syncing.set(false);
    this.error.set(null);
  }
}
