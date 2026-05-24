import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { StorefrontAuthFacade } from '../../storefront/core/facades/storefront-auth.facade';

export const storefrontCustomerGuard: CanActivateFn = (route) => {
  const auth = inject(StorefrontAuthFacade);
  const router = inject(Router);
  const orgSlug = route.parent?.paramMap.get('orgSlug') ?? route.paramMap.get('orgSlug') ?? '';

  if (auth.isAuthenticated()) return true;

  return auth.restore(orgSlug).pipe(
    map(isAuthenticated => isAuthenticated || router.createUrlTree(['/store', orgSlug, 'login'])),
    catchError(() => of(router.createUrlTree(['/store', orgSlug, 'login'])))
  );
};
