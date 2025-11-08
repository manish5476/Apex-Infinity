import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router'; // Import Router and UrlTree
import { AuthService } from '../../modules/auth/services/auth-service';
import { map, filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs'; // Import Observable

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> | boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router); // Inject Router

  // 1. If user is already loaded in memory, we are good.
  if (authService.currentUserValue) {
    return true;
  }

  // ✅ NEW LOGIC: We can't know the user status yet.
  // We MUST wait for the AuthService to finish its
  // token validation.
  // We will wait for the *first* emission from currentUser$,
  // which is guaranteed to happen because of our service fix.

  return authService.currentUser$.pipe(
    // ✅ FIX: REMOVED the `filter(user => user !== null)`
    // We want the *first* emission, even if it's null.
    take(1), // Wait for the validation to complete
    map((user) => {
      // After validation, *now* we check the result.
      if (user) {
        // Validation was successful, user is logged in.
        return true;
      }

      // Validation failed (no token, or invalid token).
      // Redirect to login.
      return router.createUrlTree(['/auth/login']);
    })
  );
};