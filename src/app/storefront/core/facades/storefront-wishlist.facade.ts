import { Injectable, inject } from '@angular/core';
import { StorefrontWishlistStore } from '../state/storefront-wishlist.store';
import { StorefrontCustomerFacade } from './storefront-customer.facade';

@Injectable({ providedIn: 'root' })
export class StorefrontWishlistFacade {
  private readonly customer = inject(StorefrontCustomerFacade);
  readonly store = inject(StorefrontWishlistStore);

  readonly items = this.customer.wishlist;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
}
