import { Inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const LAST_STORE_KEY = 'apex_storefront_last_store';
const RECENTLY_VIEWED_KEY = 'apex_storefront_recently_viewed';

@Injectable({ providedIn: 'root' })
export class StorefrontSessionService {
  readonly activeOrgSlug = signal<string | null>(null);
  readonly online = signal(true);
  readonly recentlyViewed = signal<any[]>([]);
  readonly hasStoreContext = computed(() => !!this.activeOrgSlug());

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    if (!this.isBrowser()) return;

    this.activeOrgSlug.set(localStorage.getItem(LAST_STORE_KEY));
    this.recentlyViewed.set(this.readJson<any[]>(RECENTLY_VIEWED_KEY, []));
    this.online.set(navigator.onLine);
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }

  setStore(orgSlug: string): void {
    this.activeOrgSlug.set(orgSlug);
    if (this.isBrowser()) localStorage.setItem(LAST_STORE_KEY, orgSlug);
  }

  rememberProduct(product: any): void {
    const id = product?._id ?? product?.id ?? product?.slug;
    if (!id) return;

    const next = [product, ...this.recentlyViewed().filter(item => (item?._id ?? item?.id ?? item?.slug) !== id)].slice(0, 12);
    this.recentlyViewed.set(next);
    if (this.isBrowser()) localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  }

  getGuestSessionHint(): string | null {
    if (!this.isBrowser()) return null;
    const match = document.cookie.match(/(?:^|;\s*)sf_session=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private readJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
