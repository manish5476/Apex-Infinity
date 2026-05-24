import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NormalizedStorefrontResponse, StorefrontCheckoutDto, StorefrontOrder } from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontCheckoutApi {
  private readonly api = inject(StorefrontApiClient);

  placeOrder(orgSlug: string, dto: StorefrontCheckoutDto): Observable<NormalizedStorefrontResponse<StorefrontOrder>> {
    return this.api.post<StorefrontOrder, StorefrontCheckoutDto>(orgSlug, 'checkout', dto);
  }
}
