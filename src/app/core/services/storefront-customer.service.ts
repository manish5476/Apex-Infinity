import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface StorefrontRegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  marketingOptIn?: boolean;
}

export interface StorefrontLoginDto {
  email: string;
  password: string;
}

export interface StorefrontAddressDto {
  fullName: string;
  phone: string;
  country?: string;
  state: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  addressType?: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  isDefault?: boolean;
}

export interface CheckoutDto {
  customer?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    marketingOptIn?: boolean;
  };
  shippingAddress: StorefrontAddressDto;
  billingAddress?: StorefrontAddressDto;
  saveAddress?: boolean;
  defaultAddress?: boolean;
  paymentIntentId?: string;
}

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerService extends BaseApiService {
  private readonly base = '/v1/store';

  readonly dashboard = signal<any>(null);
  readonly customer = computed(() => this.dashboard()?.customer ?? null);
  readonly isLoggedIn = computed(() => !!this.customer() && !this.customer()?.guestAccount);

  register(orgSlug: string, payload: StorefrontRegisterDto): Observable<any> {
    return this.post(`${this.base}/${orgSlug}/account/register`, payload).pipe(
      tap((res: any) => this.dashboard.set({ customer: res?.data ?? res }))
    );
  }

  login(orgSlug: string, payload: StorefrontLoginDto): Observable<any> {
    return this.post(`${this.base}/${orgSlug}/account/login`, payload).pipe(
      tap((res: any) => this.dashboard.set({ customer: res?.data?.customer ?? res?.data ?? res }))
    );
  }

  logout(orgSlug: string): Observable<any> {
    return this.post(`${this.base}/${orgSlug}/account/logout`, {}).pipe(
      tap(() => this.dashboard.set(null))
    );
  }

  me(orgSlug: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/account/me`).pipe(
      tap((res: any) => this.dashboard.set(res?.data ?? res))
    );
  }

  addAddress(orgSlug: string, payload: StorefrontAddressDto): Observable<any> {
    return this.post(`${this.base}/${orgSlug}/account/addresses`, payload);
  }

  checkout(orgSlug: string, payload: CheckoutDto): Observable<any> {
    return this.post(`${this.base}/${orgSlug}/checkout`, payload);
  }

  trackOrder(orgSlug: string, orderNumber: string, verify?: string): Observable<any> {
    return this.get(`${this.base}/${orgSlug}/orders/${orderNumber}`, verify ? { verify } : {});
  }
}
