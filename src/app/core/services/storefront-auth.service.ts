import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  StorefrontCustomerService,
  StorefrontLoginDto,
  StorefrontRegisterDto
} from './storefront-customer.service';
import { StorefrontAuthStore } from './storefront-auth.store';
import { StorefrontCartService } from './storefront.cart.service';

@Injectable({ providedIn: 'root' })
export class StorefrontAuthService {
  private readonly customerApi = inject(StorefrontCustomerService);
  private readonly authStore = inject(StorefrontAuthStore);
  private readonly cartService = inject(StorefrontCartService);

  readonly customer = this.authStore.customer;
  readonly dashboard = this.authStore.dashboard;
  readonly isAuthenticated = this.authStore.isAuthenticated;

  hydrate(orgSlug: string): Observable<boolean> {
    this.authStore.loading.set(true);
    return this.customerApi.me(orgSlug).pipe(
      map(() => true),
      catchError(() => {
        this.authStore.clear();
        return of(false);
      }),
      tap(() => this.authStore.loading.set(false))
    );
  }

  login(orgSlug: string, payload: StorefrontLoginDto): Observable<any> {
    this.authStore.loading.set(true);
    return this.customerApi.login(orgSlug, payload).pipe(
      tap((res: any) => {
        const data = res?.data ?? res;
        this.authStore.setDashboard({ customer: data?.customer ?? data });
        if (data?.cart) this.cartService.setCart(data.cart);
      }),
      tap(() => this.authStore.loading.set(false)),
      catchError(err => {
        this.authStore.loading.set(false);
        this.authStore.error.set(err?.error?.message ?? 'Storefront login failed.');
        throw err;
      })
    );
  }

  register(orgSlug: string, payload: StorefrontRegisterDto): Observable<any> {
    this.authStore.loading.set(true);
    return this.customerApi.register(orgSlug, payload).pipe(
      tap((res: any) => this.authStore.setDashboard({ customer: res?.data ?? res })),
      tap(() => this.authStore.loading.set(false)),
      catchError(err => {
        this.authStore.loading.set(false);
        this.authStore.error.set(err?.error?.message ?? 'Storefront registration failed.');
        throw err;
      })
    );
  }

  logout(orgSlug: string): Observable<any> {
    return this.customerApi.logout(orgSlug).pipe(
      tap(() => {
        this.authStore.clear();
        this.cartService.resetCart();
      })
    );
  }
}
