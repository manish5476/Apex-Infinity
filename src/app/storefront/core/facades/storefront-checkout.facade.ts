import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { StorefrontApiError, StorefrontCheckoutDto, StorefrontOrder } from '@apx/storefront-contracts';
import { StorefrontCheckoutApi } from '../api/storefront-checkout.api';
import { StorefrontCartFacade } from './storefront-cart.facade';
import { StorefrontOrderStore } from '../state/storefront-order.store';
import { StorefrontCheckoutStore } from '../state/storefront-checkout.store';

@Injectable({ providedIn: 'root' })
export class StorefrontCheckoutFacade {
  private readonly api = inject(StorefrontCheckoutApi);
  private readonly cart = inject(StorefrontCartFacade);
  private readonly orderStore = inject(StorefrontOrderStore);
  readonly store = inject(StorefrontCheckoutStore);

  readonly step = this.store.step;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  placeOrder(orgSlug: string, dto: StorefrontCheckoutDto): Observable<StorefrontOrder | null> {
    this.store.loading.set(true);
    this.orderStore.placing.set(true);
    return this.api.placeOrder(orgSlug, dto).pipe(
      tap(response => this.orderStore.currentOrder.set(response.data)),
      tap(() => this.cart.load(orgSlug, true).subscribe()),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontOrder>(error)),
      finalize(() => {
        this.store.loading.set(false);
        this.orderStore.placing.set(false);
      })
    );
  }

  private handleError<T>(error: unknown): Observable<T | null> {
    this.store.error.set(error as StorefrontApiError);
    return of(null);
  }
}
