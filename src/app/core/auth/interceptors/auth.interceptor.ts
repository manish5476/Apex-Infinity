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
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSvc = inject(AuthService);
  const router = inject(Router);
  const token = authSvc.authTokenData;

  const authReq = (token && !req.headers.has('Authorization'))
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // If the request was to the login endpoint, let the component handle the "Wrong Password" error
        if (req.url.includes('/login')) {
          return throwError(() => err);
        }

        // Otherwise, any 401 on any API means the session is dead. Kick them out.
        authSvc.logout();
      } else if (err.status === 403) {
        router.navigate(['/unauthorized']);
      }
      return throwError(() => err);
    })
  );
};