import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { StorefrontCart } from '@apx/storefront-contracts';
import { StorefrontCartFacade } from '../facades/storefront-cart.facade';

export const storefrontCartResolver: ResolveFn<StorefrontCart | null> = (route) => {
  const orgSlug = route.parent?.paramMap.get('orgSlug') ?? route.paramMap.get('orgSlug') ?? '';
  return inject(StorefrontCartFacade).load(orgSlug).pipe(catchError(() => of(null)));
};
