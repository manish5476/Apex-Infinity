import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { StorefrontApiError, StorefrontOrder } from '@apx/storefront-contracts';
import { StorefrontOrderApi } from '../api/storefront-order.api';
import { StorefrontOrderStore } from '../state/storefront-order.store';

@Injectable({ providedIn: 'root' })
export class StorefrontOrderFacade {
  private readonly api = inject(StorefrontOrderApi);
  readonly store = inject(StorefrontOrderStore);

  readonly currentOrder = this.store.currentOrder;
  readonly trackedOrder = this.store.trackedOrder;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  track(orgSlug: string, orderNumber: string, verify?: string): Observable<StorefrontOrder | null> {
    this.store.loading.set(true);
    return this.api.track(orgSlug, orderNumber, verify).pipe(
      tap(response => this.store.trackedOrder.set(response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontOrder>(error)),
      finalize(() => this.store.loading.set(false))
    );
  }

  private handleError<T>(error: unknown): Observable<T | null> {
    this.store.error.set(error as StorefrontApiError);
    return of(null);
  }
}
