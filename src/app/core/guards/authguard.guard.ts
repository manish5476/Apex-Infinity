import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth-service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const token = localStorage.getItem('apex_auth_token');
  const user = auth.currentUserValue;

  if (token && user) {
    return true;
  }

  // PASS THE RETURN URL so we can go back after login
  return router.createUrlTree(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
};