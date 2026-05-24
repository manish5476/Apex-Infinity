import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorefrontOrderStore {
  readonly currentOrder = signal<any>(null);
  readonly trackedOrder = signal<any>(null);
  readonly placing = signal(false);
  readonly error = signal<string | null>(null);

  clear(): void {
    this.currentOrder.set(null);
    this.trackedOrder.set(null);
    this.placing.set(false);
    this.error.set(null);
  }
}
