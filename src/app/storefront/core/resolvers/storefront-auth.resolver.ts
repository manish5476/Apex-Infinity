import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { StorefrontAuthFacade } from '../facades/storefront-auth.facade';

export const storefrontAuthResolver: ResolveFn<boolean> = (route) => {
  const orgSlug = route.parent?.paramMap.get('orgSlug') ?? route.paramMap.get('orgSlug') ?? '';
  return inject(StorefrontAuthFacade).restore(orgSlug).pipe(catchError(() => of(false)));
};
