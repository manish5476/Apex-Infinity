import { Injectable, computed, inject, signal } from '@angular/core';
import { StorefrontAddress, StorefrontApiError, StorefrontOrder, StorefrontWishlistItem } from '@apx/storefront-contracts';
import { StorefrontAuthStore } from './storefront-auth.store';

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerStore {
  private readonly auth = inject(StorefrontAuthStore);

  readonly loading = signal(false);
  readonly error = signal<StorefrontApiError | null>(null);
  readonly customer = this.auth.customer;
  readonly addresses = computed<readonly StorefrontAddress[]>(() => this.auth.dashboard()?.addresses ?? []);
  readonly orders = computed<readonly StorefrontOrder[]>(() => this.auth.dashboard()?.orders ?? []);
  readonly wishlist = computed<readonly StorefrontWishlistItem[]>(() => this.auth.dashboard()?.wishlist ?? []);
  readonly recentlyViewed = computed(() => this.auth.customer()?.recentlyViewed ?? []);
}
