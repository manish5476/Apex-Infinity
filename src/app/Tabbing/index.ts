// ─────────────────────────────────────────────────────────────────────────────
// index.ts  –  Public API barrel for @apex/tabs  (v2)
// ─────────────────────────────────────────────────────────────────────────────

export * from './tab.types';
export { TabService }         from './tab.service';
export { TabKeyboardService } from './tab-keyboard.service';
export { TabReuseStrategy }   from './tab-reuse.strategy';
export { TabRouterGuard }     from './tab-router.guard';
export { TabStripComponent }  from './tab-strip/tab-strip.component';
export { TabOutletComponent } from './tab-outlet/tab-outlet.component';
