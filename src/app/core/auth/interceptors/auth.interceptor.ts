import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../../modules/auth/services/auth-service';

/**
 * authInterceptor — functional HTTP interceptor (Angular 15+)
 *
 * 1. Attaches Bearer token using YOUR AuthService.authTokenData
 * 2. 401 → calls AuthService.logout() (which already clears storage + redirects)
 * 3. 403 → redirects to /unauthorized (session kept alive)
 *
 * NOTE: Token attachment is handled here ONLY if your ApiService
 * does not already attach it. If your ApiService/another interceptor
 * already attaches the Authorization header, remove the header-attachment
 * block below to avoid duplication.
 *
 * Register in app.config.ts:
 *   provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authSvc = inject(AuthService);
  const router = inject(Router);
  const token = authSvc.authTokenData;

  // Attach Authorization header if token exists and not already set
  const authReq = (token && !req.headers.has('Authorization'))
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const code = err.error?.code;
        // TOKEN_EXPIRED or any 401 → AuthService.logout() handles
        // clearing localStorage + redirecting to /auth/login
        if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
          authSvc.logout();
        }
        // For other 401s (wrong password etc.), let the component handle it
      } else if (err.status === 403) {
        // Logged in but no permission — go to unauthorized page
        router.navigate(['/unauthorized']);
      }

      return throwError(() => err);
    })
  );
};
