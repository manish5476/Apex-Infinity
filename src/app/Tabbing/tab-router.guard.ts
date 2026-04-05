// ─────────────────────────────────────────────────────────────────────────────
// tab-router.guard.ts  –  Intercepts Angular Router navigation → opens tabs
// FIX #1: Now uses tabService.registerTab() — zero private/any access.
// ─────────────────────────────────────────────────────────────────────────────
//
// Add to routes that should open in the tab strip:
//
//   {
//     path: 'customers/:id',
//     component: CustomerDetailComponent,
//     canActivate: [TabRouterGuard],
//     data: { tabLabel: 'Customer', tabIcon: 'pi pi-user', reuseTab: true }
//   }

import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TabService } from './Service/tab.service';
import { OpenTabOptions } from './tab.types';

export const TabRouterGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const tabService = inject(TabService);
  const path = state.url.split('?')[0];
  const queryParams = route.queryParams as Record<string, string>;
  const data = route.data as Record<string, unknown>;

  // FIX: Only register a tab for routes that render a component or were explicitly marked as a tab.
  // This handles standard 'component' and lazy-loaded 'loadComponent'/ 'loadChildren' correctly.
  const hasTarget = !!route.component || !!route.routeConfig?.loadComponent || !!route.routeConfig?.loadChildren || !!data['tabLabel'];

  if (!hasTarget) {
    return true; 
  }

  const label = (data['tabLabel'] as string | undefined)
    ?? titleCase(path.split('/').filter(Boolean).pop() ?? path);

  const options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data'> = {
    icon: data['tabIcon'] as string | undefined,
    pinned: (data['tabPinned'] as boolean | undefined) ?? false,
    data: (data['tabData'] as Record<string, unknown> | undefined) ?? {},
  };

  tabService.registerTab(path, label, queryParams, options);

  return true;
};

function titleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// // ─────────────────────────────────────────────────────────────────────────────
// // tab-router.guard.ts  –  Intercepts Angular Router navigation → opens tabs
// // FIX #1: Now uses tabService.registerTab() — zero private/any access.
// // ─────────────────────────────────────────────────────────────────────────────
// //
// // Add to routes that should open in the tab strip:
// //
// //   {
// //     path: 'customers/:id',
// //     component: CustomerDetailComponent,
// //     canActivate: [TabRouterGuard],
// //     data: { tabLabel: 'Customer', tabIcon: 'pi pi-user', reuseTab: true }
// //   }

// import { inject } from '@angular/core';
// import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
// import { TabService } from './tab.service';
// import { OpenTabOptions } from './tab.types';

// export const TabRouterGuard: CanActivateFn = (
//   route: ActivatedRouteSnapshot,
//   state: RouterStateSnapshot
// ) => {
//   const tabService  = inject(TabService);
//   const path        = state.url.split('?')[0];
//   const queryParams = route.queryParams as Record<string, string>;
//   const data        = route.data as Record<string, unknown>;

//   const label = (data['tabLabel'] as string | undefined)
//     ?? titleCase(path.split('/').filter(Boolean).pop() ?? path);

//   const options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data'> = {
//     icon:   data['tabIcon']   as string  | undefined,
//     pinned: (data['tabPinned'] as boolean | undefined) ?? false,
//     data:   (data['tabData']  as Record<string, unknown> | undefined) ?? {},
//   };

//   // FIX: clean public call — no (as any) casting, no private method access
//   tabService.registerTab(path, label, queryParams, options);

//   return true;
// };

// function titleCase(str: string): string {
//   return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
// }
