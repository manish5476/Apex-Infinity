import { Injectable, signal } from '@angular/core';
import { StorefrontApiError, StorefrontOrder } from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class StorefrontOrderStore {
  readonly currentOrder = signal<StorefrontOrder | null>(null);
  readonly trackedOrder = signal<StorefrontOrder | null>(null);
  readonly loading = signal(false);
  readonly placing = signal(false);
  readonly error = signal<StorefrontApiError | null>(null);
}
