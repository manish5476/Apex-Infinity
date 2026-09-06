// src/app/tab-workspace/tab-workspace.guard.ts

import { CanActivateFn } from '@angular/router';

/**
 * TabWorkspaceGuard
 *
 * Optional route guard. Since TabWorkspaceManager automatically tracks
 * Angular Router's NavigationEnd events, routes are automatically registered
 * when navigated to. This guard serves as an explicit route marker and backward-compatibility
 * hook for existing routes.
 */
export const TabWorkspaceGuard: CanActivateFn = () => true;

/**
 * Backward compatibility alias for existing routes
 */
export const TabRouterGuard: CanActivateFn = TabWorkspaceGuard;
