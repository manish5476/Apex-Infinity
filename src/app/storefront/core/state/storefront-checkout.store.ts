import { Injectable, computed, signal } from '@angular/core';
import { StorefrontAddressDto, StorefrontApiError } from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class StorefrontCheckoutStore {
  readonly step = signal<'contact' | 'delivery' | 'payment' | 'review'>('contact');
  readonly shippingAddress = signal<StorefrontAddressDto | null>(null);
  readonly billingAddress = signal<StorefrontAddressDto | null>(null);
  readonly loading = signal(false);
  readonly error = signal<StorefrontApiError | null>(null);

  readonly canReview = computed(() => !!this.shippingAddress());
}
