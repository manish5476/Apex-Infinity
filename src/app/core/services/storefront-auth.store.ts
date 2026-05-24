import { Injectable, computed, signal } from '@angular/core';

export interface StorefrontCustomerIdentity {
  _id?: string;
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  guestAccount?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class StorefrontAuthStore {
  readonly customer = signal<StorefrontCustomerIdentity | null>(null);
  readonly dashboard = signal<any>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this.customer() && !this.customer()?.guestAccount);

  setDashboard(value: any): void {
    this.dashboard.set(value);
    this.customer.set(value?.customer ?? value ?? null);
    this.error.set(null);
  }

  setCustomer(value: StorefrontCustomerIdentity | null): void {
    this.customer.set(value);
    this.error.set(null);
  }

  clear(): void {
    this.customer.set(null);
    this.dashboard.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
