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

export function isStorefrontBrowserRoute(url: string): boolean {
  return url === '/store' || url.startsWith('/store/');
}
