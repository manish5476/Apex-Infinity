import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorefrontWishlistStore {
  readonly items = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  setItems(items: any[]): void {
    this.items.set(items ?? []);
    this.error.set(null);
  }
}
