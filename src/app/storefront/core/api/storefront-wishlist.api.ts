import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NormalizedStorefrontResponse } from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

export interface WishlistToggleResult {
  action: 'added' | 'removed';
  productId: string;
}

@Injectable({ providedIn: 'root' })
export class StorefrontWishlistApi {
  private readonly api = inject(StorefrontApiClient);

  toggle(orgSlug: string, productId: string): Observable<NormalizedStorefrontResponse<WishlistToggleResult>> {
    return this.api.post<WishlistToggleResult, { productId: string }>(
      orgSlug,
      'account/wishlist/toggle',
      { productId }
    );
  }
}
