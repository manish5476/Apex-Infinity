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

  // 1. Identify target
  const data = route.data || {};
  const routeConfig = route.routeConfig;
  
  // A route is a valid tab if it has a component, loads one, OR has explicit tab metadata
  const hasTarget = !!route.component || 
                    !!routeConfig?.loadComponent || 
                    !!routeConfig?.loadChildren || 
                    !!data['tabLabel'];

  if (!hasTarget) return true;

  // 2. Build path & metadata
  // Use state.url for the absolute path, but strip query params
  const fullUrl = state.url.split('?')[0];
  
  // Normalisation: Ensure we don't register the root '/' as a tab unless intended
  if (fullUrl === '/' || fullUrl === '/login' || fullUrl === '/signup') return true;

  const queryParams = route.queryParams as Record<string, string>;
  
  // Label Resolution: Preferred from Data > TitleCase from Path
  let label = (data['tabLabel'] as string | undefined);
  if (!label) {
    const segments = fullUrl.split('/').filter(Boolean);
    const lastSegment = segments.pop() || 'Home';
    label = titleCase(lastSegment);
  }

  const options: Pick<OpenTabOptions, 'icon' | 'pinned' | 'data'> = {
    icon: (data['tabIcon'] as string) || 'pi pi-file',
    pinned: !!data['tabPinned'],
    data: data
  };

  // 3. Register with Service
  // The service handles activation if the tab already exists.
  tabService.registerTab(fullUrl, label, queryParams, options);

  return true;
};

/** Helper to convert 'my-route' to 'My Route' */
function titleCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
