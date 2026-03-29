import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../modules/auth/services/auth-service';

/**
 * authGuard — ensures the user is logged in.
 * Uses YOUR existing AuthService.isLoggedIn() — no duplication.
 * Redirects to /auth/login with returnUrl if not authenticated.
 *
 * Usage in routes:
 *   canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authSvc = inject(AuthService);
  const router = inject(Router);

  if (authSvc.isLoggedIn()) return true;

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
