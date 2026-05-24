import { Injectable, signal } from '@angular/core';
import { StorefrontApiError, StorefrontWishlistItem } from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class StorefrontWishlistStore {
  readonly items = signal<readonly StorefrontWishlistItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<StorefrontApiError | null>(null);

  setItems(items: readonly StorefrontWishlistItem[]): void {
    this.items.set(items);
    this.error.set(null);
  }
}
