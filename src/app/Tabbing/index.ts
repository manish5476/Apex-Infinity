// ─────────────────────────────────────────────────────────────────────────────
// index.ts  –  Public API barrel for @apex/tabs  (v2)
// ─────────────────────────────────────────────────────────────────────────────

export * from './tab.types';
export { TabService } from './Service/tab.service';
export { TabKeyboardService } from './Service/tab-keyboard.service';
export { RouteStateService } from './Service/route-state.service';
export { TabPersistenceService } from './Service/tab-persistence.service';
export { TabReuseStrategy } from './tab-reuse.strategy';
export { TabRouterGuard } from './tab-router.guard';
export { TabStripComponent } from './tab-strip/tab-strip.component';
export { TabOutletComponent } from './shell/tab-outlet.component';
