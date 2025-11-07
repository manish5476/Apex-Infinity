import { HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../modules/auth/services/auth-service';

export const AuthInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const authToken = authService.getToken();

  // If the token exists, clone the request and add the authorization header
//   if (authToken) {
//     const authReq = req.clone({
//       headers: req.headers.set('Authorization', `Bearer ${authToken}`),
//     });
//     return next(authReq);
//   }

//   // If no token, pass the original request along
//   return next(req);
// };
}