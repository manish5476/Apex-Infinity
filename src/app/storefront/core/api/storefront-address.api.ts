import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NormalizedStorefrontResponse, StorefrontAddress, StorefrontAddressDto } from '@apx/storefront-contracts';
import { StorefrontCustomerApi } from './storefront-customer.api';

@Injectable({ providedIn: 'root' })
export class StorefrontAddressApi {
  private readonly customerApi = inject(StorefrontCustomerApi);

  add(orgSlug: string, dto: StorefrontAddressDto): Observable<NormalizedStorefrontResponse<StorefrontAddress>> {
    return this.customerApi.addAddress(orgSlug, dto);
  }
}
