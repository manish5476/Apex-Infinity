// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  let token: any;
  try {
    token = localStorage.getItem('apex_auth_token');
  } catch (e) {
    token = null;
  }

  const isApiUrl = req.url.startsWith(environment.apiUrl);
  if (token && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      const msg = error?.error?.message || error?.message;

      // 🔥 Detect token expiration
      if (
        error.status === 401 ||
        msg === 'jwt expired' ||
        msg === 'TokenExpiredError'
      ) {
        console.warn('⛔ JWT expired — logging out...');

        localStorage.removeItem('apex_auth_token');
        localStorage.removeItem('apex_user');
        
        // Redirect to login
        router.navigate(['/auth/login']);

        return throwError(() => error);
      }

      return throwError(() => error);
    })
  );
};
