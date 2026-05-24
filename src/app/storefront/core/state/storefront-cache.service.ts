import { Injectable, signal } from '@angular/core';

interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class StorefrontCacheService {
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  readonly version = signal(0);

  get<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = 60_000): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
    this.version.update(value => value + 1);
  }

  invalidate(prefix: string): void {
    Array.from(this.entries.keys()).forEach(key => {
      if (key.startsWith(prefix)) this.entries.delete(key);
    });
    this.version.update(value => value + 1);
  }
}
