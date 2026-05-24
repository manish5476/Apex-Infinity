import { Injectable, computed, signal } from '@angular/core';
import { StorefrontApiError, StorefrontCustomer, StorefrontDashboard } from '@apx/storefront-contracts';

@Injectable({ providedIn: 'root' })
export class StorefrontAuthStore {
  readonly customer = signal<StorefrontCustomer | null>(null);
  readonly dashboard = signal<StorefrontDashboard | null>(null);
  readonly loading = signal(false);
  readonly restoring = signal(false);
  readonly error = signal<StorefrontApiError | null>(null);
  readonly lastRestoredAt = signal<number | null>(null);

  readonly isAuthenticated = computed(() => {
    const customer = this.customer();
    return !!customer && !customer.guestAccount;
  });

  setDashboard(dashboard: StorefrontDashboard): void {
    this.dashboard.set(dashboard);
    this.customer.set(dashboard.customer);
    this.error.set(null);
    this.lastRestoredAt.set(Date.now());
  }

  setCustomer(customer: StorefrontCustomer): void {
    this.customer.set(customer);
    this.error.set(null);
  }

  clear(): void {
    this.customer.set(null);
    this.dashboard.set(null);
    this.loading.set(false);
    this.restoring.set(false);
    this.error.set(null);
  }
}
