// src/app/storefront/core/api/storefront-customer.api.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NormalizedStorefrontResponse,
  StorefrontAddress,
  StorefrontAddressDto,
  StorefrontDashboard,
  StorefrontOrder
} from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerApi {
  private readonly api = inject(StorefrontApiClient);

  /**
   * GET /api/v1/store/:organizationSlug/account/me
   * Returns the full customer dashboard (customer, addresses, orders, wishlist, carts).
   */
  dashboard(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontDashboard>> {
    return this.api.get<StorefrontDashboard>(orgSlug, 'account/me');
  }

  /**
   * POST /api/v1/store/:organizationSlug/account/addresses
   * Add a new address to the authenticated customer's address book.
   */
  addAddress(orgSlug: string, dto: StorefrontAddressDto): Observable<NormalizedStorefrontResponse<StorefrontAddress>> {
    return this.api.post<StorefrontAddress, StorefrontAddressDto>(orgSlug, 'account/addresses', dto);
  }

  /**
   * PUT /api/v1/store/:organizationSlug/account/addresses/:addressId
   * Update an existing address in the authenticated customer's address book.
   */
  updateAddress(orgSlug: string, addressId: string, dto: StorefrontAddressDto): Observable<NormalizedStorefrontResponse<StorefrontAddress>> {
    return this.api.put<StorefrontAddress, StorefrontAddressDto>(orgSlug, `account/addresses/${addressId}`, dto);
  }

  /**
   * GET /api/v1/store/:organizationSlug/account/orders
   * Paginated list of orders for the authenticated customer.
   */
  getOrders(orgSlug: string, params?: {
    readonly page?: number;
    readonly limit?: number;
    readonly status?: string;
  }): Observable<NormalizedStorefrontResponse<readonly StorefrontOrder[]>> {
    return this.api.get<readonly StorefrontOrder[]>(orgSlug, 'account/orders', params ?? {});
  }
}
