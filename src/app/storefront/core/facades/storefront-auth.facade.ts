import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ForgotPasswordDto, ResetPasswordDto, StorefrontApiError, StorefrontCustomer, StorefrontDashboard, StorefrontLoginDto, StorefrontRegisterDto } from '@apx/storefront-contracts';
import { StorefrontAuthApi } from '../api/storefront-auth.api';
import { StorefrontAuthStore } from '../state/storefront-auth.store';
import { StorefrontCartFacade } from './storefront-cart.facade';

@Injectable({ providedIn: 'root' })
export class StorefrontAuthFacade {
  private readonly api = inject(StorefrontAuthApi);
  private readonly cart = inject(StorefrontCartFacade);
  readonly store = inject(StorefrontAuthStore);

  readonly customer = this.store.customer;
  readonly dashboard = this.store.dashboard;
  readonly isAuthenticated = this.store.isAuthenticated;
  readonly loading = this.store.loading;
  readonly restoring = this.store.restoring;
  readonly error = this.store.error;

  restore(orgSlug: string): Observable<boolean> {
    this.store.restoring.set(true);
    return this.api.me(orgSlug).pipe(
      tap(response => this.store.setDashboard(response.data)),
      map(() => true),
      catchError(() => {
        this.store.clear();
        return of(false);
      }),
      finalize(() => this.store.restoring.set(false))
    );
  }

  login(orgSlug: string, dto: StorefrontLoginDto): Observable<StorefrontCustomer | null> {
    this.store.loading.set(true);
    return this.api.login(orgSlug, dto).pipe(
      tap(response => this.store.setCustomer(response.data.customer)),
      tap(() => this.cart.merge(orgSlug).subscribe()),
      map(response => response.data.customer),
      catchError(error => this.handleError(error)),
      finalize(() => this.store.loading.set(false))
    );
  }

  register(orgSlug: string, dto: StorefrontRegisterDto): Observable<StorefrontCustomer | null> {
    this.store.loading.set(true);
    return this.api.register(orgSlug, dto).pipe(
      tap(response => this.store.setCustomer(response.data)),
      tap(() => this.cart.merge(orgSlug).subscribe()),
      map(response => response.data),
      catchError(error => this.handleError(error)),
      finalize(() => this.store.loading.set(false))
    );
  }

  logout(orgSlug: string): Observable<boolean> {
    return this.api.logout(orgSlug).pipe(
      tap(() => this.store.clear()),
      map(() => true),
      catchError(() => {
        this.store.clear();
        return of(true);
      })
    );
  }

  forgotPassword(orgSlug: string, dto: ForgotPasswordDto): Observable<boolean> {
    this.store.loading.set(true);
    return this.api.forgotPassword(orgSlug, dto).pipe(
      map(() => true),
      catchError(error => {
        this.store.error.set(error as StorefrontApiError);
        return of(false);
      }),
      finalize(() => this.store.loading.set(false))
    );
  }

  resetPassword(orgSlug: string, dto: ResetPasswordDto): Observable<boolean> {
    this.store.loading.set(true);
    return this.api.resetPassword(orgSlug, dto).pipe(
      map(() => true),
      catchError(error => {
        this.store.error.set(error as StorefrontApiError);
        return of(false);
      }),
      finalize(() => this.store.loading.set(false))
    );
  }

  private handleError(error: unknown): Observable<null> {
    this.store.error.set(error as StorefrontApiError);
    return of(null);
  }
}
