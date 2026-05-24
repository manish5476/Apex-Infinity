import { Injectable, computed, inject } from '@angular/core';
import { StorefrontAuthStore } from './storefront-auth.store';

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerStore {
  private readonly authStore = inject(StorefrontAuthStore);

  readonly dashboard = this.authStore.dashboard;
  readonly customer = this.authStore.customer;
  readonly addresses = computed<any[]>(() => this.dashboard()?.addresses ?? []);
  readonly orders = computed<any[]>(() => this.dashboard()?.orders ?? []);
  readonly wishlist = computed<any[]>(() => this.dashboard()?.wishlist ?? []);
}
