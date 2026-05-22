import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400'
    }
  },
  {
    path: 'auth/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'storefront/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'store/:orgSlug',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600'
    }
  },
  {
    path: 'store/:orgSlug/products',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600'
    }
  },
  {
    path: 'store/:orgSlug/products/:productSlug',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
    }
  },
  {
    path: 'store/:orgSlug/:pageSlug',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=1800'
    }
  },
  {
    path: 'store/:orgSlug/**',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=1800'
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
