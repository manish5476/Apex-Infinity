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

// // src/app/core/interceptors/jwt.interceptor.ts
// import { HttpInterceptorFn } from '@angular/common/http';
// import { environment } from '../../../environments/environment';

// export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
//   let token: string | null = null;

//   try {
//     token = localStorage.getItem('apex_auth_token'); // direct, safe
//   } catch (e) {
//     token = null;
//   }

//   const isApiUrl = req.url.startsWith(environment.apiUrl || '');

//   if (token && isApiUrl) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }

//   return next(req);
// };

// import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { AuthService } from '../../modules/auth/services/auth-service';
// import { environment } from '../../../environments/environment';

// export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
//   const authService = inject(AuthService);
//   const token = authService.getToken();
//   const isApiUrl = req.url.startsWith(environment.apiUrl);

//   // Only attach the token to requests to our own API
//   if (token && isApiUrl) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }
//   return next(req);
// };