// src/app/Tabbing/index.ts
// Re-exports modern tab-workspace module and maintains backward compatibility

export * from '../tab-workspace';
export type { TabId, TabIdMode, TabMeta, TabState, OpenTabOptions } from './tab.types';
export { TabService } from './Service/tab.service';
export { TabKeyboardService } from './Service/tab-keyboard.service';
export { TabReuseStrategy } from './tab-reuse.strategy';
export { TabRouterGuard, TabWorkspaceGuard } from './tab-router.guard';
export { TabStripComponent } from './tab-strip/tab-strip.component';
export { TabOutletComponent } from './shell/tab-outlet.component';
