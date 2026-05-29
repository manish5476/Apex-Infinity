import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

function resolveOrgSlug(route: Parameters<CanActivateFn>[0]): string {
  let current: typeof route | null = route;
  while (current) {
    const orgSlug = current.paramMap.get('orgSlug');
    if (orgSlug) return orgSlug;
    current = current.parent;
  }
  return '';
}

export const deliveryAgentGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const orgSlug = resolveOrgSlug(route);

  if (orgSlug && localStorage.getItem(`delivery_token_${orgSlug}`)) return true;

  return orgSlug
    ? router.createUrlTree(['/store', orgSlug, 'delivery', 'login'])
    : router.createUrlTree(['/']);
};
