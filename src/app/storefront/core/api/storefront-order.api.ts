import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NormalizedStorefrontResponse, StorefrontOrder } from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontOrderApi {
  private readonly api = inject(StorefrontApiClient);

  track(orgSlug: string, orderNumber: string, verify?: string): Observable<NormalizedStorefrontResponse<StorefrontOrder>> {
    return this.api.get<StorefrontOrder>(orgSlug, `orders/${encodeURIComponent(orderNumber)}`, verify ? { verify } : undefined, { retryCount: 0 });
  }
}
