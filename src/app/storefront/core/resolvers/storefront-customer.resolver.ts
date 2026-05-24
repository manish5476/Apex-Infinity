import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { StorefrontDashboard } from '@apx/storefront-contracts';
import { StorefrontCustomerFacade } from '../facades/storefront-customer.facade';

export const storefrontCustomerResolver: ResolveFn<StorefrontDashboard | null> = (route) => {
  const orgSlug = route.parent?.paramMap.get('orgSlug') ?? route.paramMap.get('orgSlug') ?? '';
  return inject(StorefrontCustomerFacade).loadDashboard(orgSlug).pipe(catchError(() => of(null)));
};
