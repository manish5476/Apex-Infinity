import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { StorefrontAddress, StorefrontAddressDto, StorefrontApiError, StorefrontDashboard } from '@apx/storefront-contracts';
import { StorefrontCustomerApi } from '../api/storefront-customer.api';
import { StorefrontAuthStore } from '../state/storefront-auth.store';
import { StorefrontCustomerStore } from '../state/storefront-customer.store';

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerFacade {
  private readonly api = inject(StorefrontCustomerApi);
  private readonly authStore = inject(StorefrontAuthStore);
  readonly store = inject(StorefrontCustomerStore);

  readonly customer = this.store.customer;
  readonly addresses = this.store.addresses;
  readonly orders = this.store.orders;
  readonly wishlist = this.store.wishlist;
  readonly recentlyViewed = this.store.recentlyViewed;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  loadDashboard(orgSlug: string): Observable<StorefrontDashboard | null> {
    this.store.loading.set(true);
    return this.api.dashboard(orgSlug).pipe(
      tap(response => this.authStore.setDashboard(response.data)),
      map(response => response.data),
      catchError(error => this.handleError<StorefrontDashboard>(error)),
      finalize(() => this.store.loading.set(false))
    );
  }

  addAddress(orgSlug: string, dto: StorefrontAddressDto): Observable<StorefrontAddress | null> {
    this.store.loading.set(true);
    return this.api.addAddress(orgSlug, dto).pipe(
      map(response => response.data),
      tap(() => this.loadDashboard(orgSlug).subscribe()),
      catchError(error => this.handleError<StorefrontAddress>(error)),
      finalize(() => this.store.loading.set(false))
    );
  }

  private handleError<T>(error: unknown): Observable<T | null> {
    this.store.error.set(error as StorefrontApiError);
    return of(null);
  }
}
