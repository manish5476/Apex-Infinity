import { HttpInterceptorFn } from '@angular/common/http';
import { isStorefrontApiUrl } from '../services/storefront-request.util';

export const storefrontAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isStorefrontApiUrl(req.url)) return next(req);

  const storefrontReq = req.clone({
    headers: req.headers
      .delete('Authorization')
      .set('Accept', 'application/json'),
    withCredentials: true
  });

  return next(storefrontReq);
};
