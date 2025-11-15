// src/app/core/interceptors/jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  let token: any

  try {
    token = localStorage.getItem('apex_auth_token');
    console.log(token);
  } catch (e) {
    token = null;
  }

  const isApiUrl = req.url.startsWith(environment.apiUrl);
  if (token && isApiUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
