import { environment } from '../../../environments/environment';

export function isStorefrontApiUrl(url: string): boolean {
  const apiUrl = environment.apiUrl.replace(/\/$/, '');

  return (
    url.startsWith(`${apiUrl}/v1/store/`) ||
    url === `${apiUrl}/v1/store` ||
    url.startsWith('/v1/store/') ||
    url === '/v1/store'
  );
}

export function isPlatformDeliveryApiUrl(url: string): boolean {
  const apiUrl = environment.apiUrl.replace(/\/$/, '');

  return (
    url.startsWith(`${apiUrl}/v1/platform-delivery/`) ||
    url === `${apiUrl}/v1/platform-delivery` ||
    url.startsWith('/v1/platform-delivery/') ||
    url === '/v1/platform-delivery'
  );
}

export function isMerchantDeliveryApiUrl(url: string): boolean {
  const apiUrl = environment.apiUrl.replace(/\/$/, '');

  return (
    url.startsWith(`${apiUrl}/v1/delivery-agent/`) ||
    url === `${apiUrl}/v1/delivery-agent` ||
    url.startsWith('/v1/delivery-agent/') ||
    url === '/v1/delivery-agent'
  );
}

export function isStorefrontBrowserRoute(url: string): boolean {
  return url === '/store' || url.startsWith('/store/');
}
