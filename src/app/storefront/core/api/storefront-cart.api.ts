import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AddCartItemDto,
  ApplyCouponDto,
  CartValidationResult,
  NormalizedStorefrontResponse,
  ShippingEstimateDto,
  StorefrontCart,
  UpdateCartItemDto
} from '@apx/storefront-contracts';
import { StorefrontApiClient } from './storefront-api.client';

@Injectable({ providedIn: 'root' })
export class StorefrontCartApi {
  private readonly api = inject(StorefrontApiClient);

  getCart(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.get<StorefrontCart>(orgSlug, 'cart');
  }

  addItem(orgSlug: string, dto: AddCartItemDto): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.post<StorefrontCart, AddCartItemDto>(orgSlug, 'cart/items', dto);
  }

  updateItem(orgSlug: string, cartItemId: string, dto: UpdateCartItemDto): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.patch<StorefrontCart, UpdateCartItemDto>(orgSlug, `cart/items/${cartItemId}`, dto);
  }

  removeItem(orgSlug: string, cartItemId: string): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.delete<StorefrontCart>(orgSlug, `cart/items/${cartItemId}`);
  }

  clear(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.delete<StorefrontCart>(orgSlug, 'cart');
  }

  validate(orgSlug: string): Observable<NormalizedStorefrontResponse<CartValidationResult>> {
    return this.api.get<CartValidationResult>(orgSlug, 'cart/validate', undefined, { retryCount: 0 });
  }

  applyCoupon(orgSlug: string, dto: ApplyCouponDto): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.post<StorefrontCart, ApplyCouponDto>(orgSlug, 'cart/coupons', dto);
  }

  estimateShipping(orgSlug: string, dto: ShippingEstimateDto): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.post<StorefrontCart, ShippingEstimateDto>(orgSlug, 'cart/shipping-estimate', dto);
  }

  merge(orgSlug: string): Observable<NormalizedStorefrontResponse<StorefrontCart>> {
    return this.api.post<StorefrontCart, Record<string, never>>(orgSlug, 'cart/merge', {});
  }
}
