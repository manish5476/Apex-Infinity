import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { NormalizedStorefrontResponse, StorefrontWishlistItem } from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class StorefrontWishlistApi {
  list(): Observable<NormalizedStorefrontResponse<readonly StorefrontWishlistItem[]>> {
    return throwError(() => new Error('Storefront wishlist CRUD endpoints are not mounted yet. Dashboard wishlist is available through account/me.'));
  }
}
