import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (typeof (globalThis as any).window === 'undefined') {
  const storage = new Map<string, string>();
  const screenShim = {
    width: 1440,
    height: 900,
    availWidth: 1440,
    availHeight: 900,
    colorDepth: 24,
    pixelDepth: 24,
    deviceXDPI: 96,
    logicalXDPI: 96,
    deviceYDPI: 96,
    logicalYDPI: 96
  };
  const localStorageShim = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() { return storage.size; }
  };

  (globalThis as any).screen = screenShim;
  (globalThis as any).localStorage = localStorageShim;
  (globalThis as any).document = {
    visibilityState: 'visible',
    activeElement: null,
    documentElement: {
      classList: { add: () => undefined, remove: () => undefined, toggle: () => undefined, forEach: () => undefined },
      style: { setProperty: () => undefined, removeProperty: () => undefined },
      setAttribute: () => undefined
    },
    body: { appendChild: () => undefined, removeChild: () => undefined },
    head: { appendChild: () => undefined, insertBefore: () => undefined },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    createElement: () => ({
      style: {},
      classList: { add: () => undefined, remove: () => undefined },
      setAttribute: () => undefined,
      appendChild: () => undefined,
      remove: () => undefined
    }),
    getElementById: () => null,
    querySelector: () => null
  };
  (globalThis as any).window = {
    innerWidth: 1440,
    innerHeight: 900,
    devicePixelRatio: 1,
    scrollY: 0,
    screen: screenShim,
    localStorage: localStorageShim,
    location: { href: '/', search: '', pathname: '/' },
    history: { back: () => undefined },
    URL,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    scrollTo: () => undefined,
    open: () => null,
    print: () => undefined,
    matchMedia: () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false
    })
  };
}

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const app = express();
const angularApp = new AngularNodeAppEngine();

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /auth',
    'Disallow: /storefront',
    'Sitemap: /sitemap.xml'
  ].join('\n'));
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>/</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
</urlset>`);
});

app.get(/.*\..*/, express.static(browserDistFolder, {
  maxAge: '1y',
  immutable: true,
  index: false,
  redirect: false
}));

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => response ? writeResponseToNodeResponse(response, res) : next())
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = Number(process.env['PORT'] ?? 4000);
  app.listen(port, () => {
    console.log(`Angular SSR server listening on http://localhost:${port}`);
  });
}

export default createNodeRequestHandler(app);
