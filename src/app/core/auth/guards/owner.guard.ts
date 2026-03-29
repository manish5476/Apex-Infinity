import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

/**
 * ownerGuard — only organization owners may access the route.
 * Pair with authGuard.
 *
 * canActivate: [authGuard, ownerGuard]
 */
export const ownerGuard: CanActivateFn = () => {
  const permSvc = inject(PermissionService);
  const router = inject(Router);

  if (permSvc.isOwner()) return true;
  return router.createUrlTree(['/unauthorized']);
};

/**
 * superAdminGuard — owners OR roles with isSuperAdmin flag.
 *
 * canActivate: [authGuard, superAdminGuard]
 */
export const superAdminGuard: CanActivateFn = () => {
  const permSvc = inject(PermissionService);
  const router = inject(Router);

  if (permSvc.isSuperAdmin()) return true;
  return router.createUrlTree(['/unauthorized']);
};
