// src/app/Tabbing/tab-reuse.strategy.ts
// Backward-compatibility bridge delegating to TabRouteReuseStrategy

import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from '@angular/router';
import { TabRouteReuseStrategy } from '../tab-workspace/tab-route-reuse.strategy';

export class TabReuseStrategy implements RouteReuseStrategy {
  private static readonly delegate = new TabRouteReuseStrategy();

  static evictCached(key: string): void {
    TabRouteReuseStrategy.evict(key);
  }

  static evictExceptCached(keys: Set<string>): void {
    TabRouteReuseStrategy.getInstance()?.evictExcept(keys);
  }

  static evictAllCached(): void {
    TabRouteReuseStrategy.evictAll();
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return TabReuseStrategy.delegate.shouldDetach(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    TabReuseStrategy.delegate.store(route, handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return TabReuseStrategy.delegate.shouldAttach(route);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return TabReuseStrategy.delegate.retrieve(route);
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return TabReuseStrategy.delegate.shouldReuseRoute(future, curr);
  }
}
