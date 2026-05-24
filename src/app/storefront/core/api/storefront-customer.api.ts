import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NormalizedStorefrontResponse,
  StorefrontAddress,
  StorefrontAddressDto,
  StorefrontDashboard
} from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerApi {
  private readonly api = inject(StorefrontApiClient);

  dashboard(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontDashboard>> {
    return this.api.get<StorefrontDashboard>(orgSlug, 'account/me');
  }

  addAddress(orgSlug: string, dto: StorefrontAddressDto): Observable<NormalizedStorefrontResponse<StorefrontAddress>> {
    return this.api.post<StorefrontAddress, StorefrontAddressDto>(orgSlug, 'account/addresses', dto);
  }
}
