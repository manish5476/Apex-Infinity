import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Permission, PermissionMode } from '../permissions.constants';

/**
 * Route data shape expected by permissionGuard.
 *
 * In your route definition:
 * {
 *   path: 'invoices',
 *   component: InvoiceListComponent,
 *   canActivate: [authGuard, permissionGuard],
 *   data: {
 *     permissions: [PERMISSIONS.INVOICE.READ],
 *     permissionMode: 'any',           // optional, default 'any'
 *     unauthorizedRedirect: '/dashboard' // optional, default '/unauthorized'
 *   }
 * }
 */
export interface PermissionRouteData {
  permissions: Permission[];
  permissionMode?: PermissionMode;
  unauthorizedRedirect?: string;
}

/**
 * permissionGuard — checks route data.permissions against user's permission set.
 * Always pair with authGuard so we know the user is logged in first.
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permSvc  = inject(PermissionService);
  const router   = inject(Router);
  const data     = route.data as PermissionRouteData;

  const permissions        = data?.permissions ?? [];
  const mode               = data?.permissionMode ?? 'any';
  const unauthorizedUrl    = data?.unauthorizedRedirect ?? '/unauthorized';

  // No permissions required on this route → allow
  if (!permissions.length) return true;

  const allowed = permSvc.check(permissions, mode);
  if (allowed) return true;

  return router.createUrlTree([unauthorizedUrl]);
};
