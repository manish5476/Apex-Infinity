import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NormalizedStorefrontResponse, ProductListParams, PublicProduct, PublicProductList } from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontPublicApi {
  private readonly api = inject(StorefrontApiClient);

  products(orgSlug: string, params?: ProductListParams): Observable<NormalizedStorefrontResponse<PublicProductList>> {
    return this.api.get<PublicProductList>(orgSlug, 'products', params ? { ...params } : undefined);
  }

  product(orgSlug: string, productSlug: string): Observable<NormalizedStorefrontResponse<{ readonly product: PublicProduct }>> {
    return this.api.get<{ readonly product: PublicProduct }>(orgSlug, `products/${productSlug}`);
  }

  search(orgSlug: string, query: string): Observable<NormalizedStorefrontResponse<PublicProductList>> {
    return this.api.get<PublicProductList>(orgSlug, 'search', { q: query });
  }
}
