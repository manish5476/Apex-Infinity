import { StorefrontApiError } from '@apx/storefront-contracts';

export interface StorefrontResourceState<T> {
  readonly data: T;
  readonly loading: boolean;
  readonly syncing: boolean;
  readonly error: StorefrontApiError | null;
  readonly loadedAt: number | null;
}

export function resourceState<T>(data: T): StorefrontResourceState<T> {
  return {
    data,
    loading: false,
    syncing: false,
    error: null,
    loadedAt: null
  };
}
