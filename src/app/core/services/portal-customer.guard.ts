import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CustomerPortalService } from '@core/services/customer-portal.service';

/**
 * Guard for customer portal routes.
 * Checks the portal JWT (portal_customer type) — separate from the
 * storefront customer guard which checks StorefrontCustomer auth.
 */
export const portalCustomerGuard: CanActivateFn = (route) => {
  const portal = inject(CustomerPortalService);
  const router = inject(Router);

  const orgSlug =
    route.parent?.paramMap.get('orgSlug') ??
    route.paramMap.get('orgSlug') ??
    '';

  if (portal.isPortalLoggedIn(orgSlug)) return true;

  return router.createUrlTree(['/store', orgSlug, 'portal', 'login']);
};
