// src/app/core/guards/authguard.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth-service';
import { map, filter, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  // 1. If user is already loaded in memory, we are good.
  if (authService.currentUserValue) {
    return true;
  }

  // 2. If no token, we are definitely logged out.
  const token = authService.getToken();
  if (!token) {
    authService.logout();
    return false;
  }

  // 3. If token EXISTS but no user, validation is in progress.
  // We must wait for the currentUser$ to emit a value.
  // We skip the initial 'null' and wait for the validation result.
  return authService.currentUser$.pipe(
    filter(user => user !== null), // Wait for the first *successful* user load
    take(1), // Then complete
    map(() => true) // And allow navigation
  );
};

// // src/app/core/guards/authguard.guard.ts

// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { map, filter, take } from 'rxjs/operators';
// import { of } from 'rxjs';

// export const authGuard: CanActivateFn = (route, state) => {
//   const authService = inject(AuthService);
//   const router = inject(Router);

//   // 1. Check for token.
//   const token = authService.getToken();

//   if (!token) {
//     // 2. No token, no user. Redirect to org page immediately.
//     router.navigate(['/auth/org']);
//     return false;
//   }

//   // 3. Token exists. Check if user is already loaded (from BehaviorSubject).
//   if (authService.currentUserValue) {
//     // User is already loaded, allow navigation.
//     return true;
//   }

//   // 4. Token exists, but no user. This means validation is in progress
//   //    (the AuthService constructor is running validateTokenOnLoad()).
//   //    We MUST wait for the isAuthenticated$ observable to emit `true`.
  
//   return authService.isAuthenticated$.pipe(
//     filter(isLoggedIn => isLoggedIn === true), // Wait for the first `true` value
//     take(1), // Then take that value and complete
//     map(() => true) // Allow navigation
    
//     // Note: We don't need a 'false' case. If validation fails,
//     // your AuthService.validateTokenOnLoad() correctly calls logout(),
//     // which will navigate to the login page automatically.
//   );
// };

// // import { inject } from '@angular/core';
// // import { CanActivateFn, Router } from '@angular/router';
// // import { AuthService } from '../../modules/auth/services/auth-service';
// // import { map, take } from 'rxjs/operators';

// // export const authGuard: CanActivateFn = (route, state) => {
// //   const authService = inject(AuthService);
// //   const router = inject(Router);
// //   return authService.isAuthenticated$.pipe(
// //     take(1),
// //     map(isLoggedIn => {
// //       if (isLoggedIn) {
// //         return true;
// //       }
// //       router.navigate(['/auth/org']);
// //       return false;
// //     })
// //   );
// // };