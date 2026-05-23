// src/app/modules/storefront-public/dynamic-page/dynamic-page.component.ts
import { Component, OnInit, inject, signal, isDevMode, OnDestroy } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';

import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest, Subject } from 'rxjs';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';


import { StorefrontPublicService } from '@core/services/storefront-public.service';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { takeUntil } from "rxjs/operators";
import { StorefrontSectionRendererComponent } from './storefront-section-renderer.component';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StorefrontSectionRendererComponent
  ],
  templateUrl: './dynamic-page.component.html',
  styles: [`
    :host {
      display: block;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
      min-height: 100vh;
    }

    .loader-screen {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2xl);
    }

    .storefront-skeleton {
      width: min(720px, calc(100vw - 48px));
      display: grid;
      gap: var(--apx-space-4, 1rem);
    }

    .storefront-skeleton span {
      min-height: 5rem;
      border-radius: var(--apx-radius-lg, 12px);
      border: 1px solid var(--apx-color-border, rgba(17, 24, 39, 0.1));
      background:
        linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent),
        var(--apx-color-surface-raised, rgba(255,255,255,0.86));
      background-size: 220% 100%;
      animation: apxSkeleton 1.25s var(--apx-ease-standard, ease) infinite;
    }

    .loading-text {
      font-family: var(--font-heading);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--text-tertiary);
    }

    @keyframes apxSkeleton {
      from { background-position: 220% 0; }
      to { background-position: -220% 0; }
    }

    .error-screen {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
    }

    .error-card {
      position: relative;
      max-width: 480px; width: 100%;
      padding: var(--spacing-4xl);
      text-align: center;
      background: var(--glass-bg-c);
      backdrop-filter: var(--glass-blur-c);
      border: 1px solid var(--glass-border-c);
      box-shadow: var(--glass-shadow-c);
      border-radius: var(--radius-2xl);
      overflow: hidden;
    }

    .gradient-line {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 4px;
      background: var(--accent-gradient);
    }

    .error-code {
      font-family: var(--font-heading);
      font-size: var(--font-size-5xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      margin: 0;
    }

    .separator {
      width: 40px; height: 2px;
      background: var(--border-secondary);
      margin: var(--spacing-2xl) auto;
    }

    .error-msg {
      color: var(--text-secondary);
      font-size: var(--font-size-lg);
      margin-bottom: var(--spacing-3xl);
    }

    .return-btn {
      display: inline-flex; align-items: center; gap: var(--spacing-md);
      padding: var(--spacing-lg) var(--spacing-3xl);
      background: var(--accent-primary);
      color: var(--bg-primary);
      border-radius: 100px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase; letter-spacing: 0.1em;
      text-decoration: none; transition: var(--transition-base);
      box-shadow: var(--shadow-md);
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    }

    .page-wrapper { width: 100%; min-height: 100vh; }
    .section-block {
      position: relative;
      width: 100%;
      background: var(--sf-section-bg, transparent);
    }

    .section-block[data-padding-top="none"] { padding-top: 0; }
    .section-block[data-padding-top="sm"] { padding-top: var(--sf-space-6); }
    .section-block[data-padding-top="md"] { padding-top: var(--sf-space-10); }
    .section-block[data-padding-top="lg"] { padding-top: var(--sf-space-16); }
    .section-block[data-padding-top="xl"] { padding-top: var(--sf-space-20); }
    .section-block[data-padding-bottom="none"] { padding-bottom: 0; }
    .section-block[data-padding-bottom="sm"] { padding-bottom: var(--sf-space-6); }
    .section-block[data-padding-bottom="md"] { padding-bottom: var(--sf-space-10); }
    .section-block[data-padding-bottom="lg"] { padding-bottom: var(--sf-space-16); }
    .section-block[data-padding-bottom="xl"] { padding-bottom: var(--sf-space-20); }

    .section-block[data-theme-mode="dark"] {
      background: var(--sf-color-canvas);
      color: var(--sf-color-ink);
    }

    @media (max-width: 767px) {
      .section-block[data-padding-top="lg"],
      .section-block[data-padding-top="xl"] { padding-top: var(--sf-space-12); }
      .section-block[data-padding-bottom="lg"],
      .section-block[data-padding-bottom="xl"] { padding-bottom: var(--sf-space-12); }
    }

    .debug-placeholder {
      margin: var(--spacing-3xl) auto;
      max-width: 600px; padding: var(--spacing-2xl);
      border: 1px dashed var(--color-error-border);
      background: var(--color-error-bg);
      color: var(--color-error-dark);
      border-radius: var(--ui-border-radius-lg);
      display: flex; align-items: center; justify-content: center;
      gap: var(--spacing-xl);
      font-family: var(--font-mono); font-size: var(--font-size-sm);
    }
  `],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFade', [
      transition(':enter', [
        query('.section-enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger('100ms', [
            animate('0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DynamicPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private storefrontService = inject(StorefrontPublicService);
  private stateService = inject(StorefrontStateService);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  pageData = signal<any>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  orgSlug = '';
  // Expose isDevMode as a property for the template
  readonly isDev = isDevMode();
  isDevMode: any;

  ngOnInit(): void {
    combineLatest([
      this.route.parent?.params ?? this.route.params,
      this.route.params
    ]).pipe(takeUntil(this.destroy$)).subscribe(([parentParams, childParams]) => {
      const params = { ...parentParams, ...childParams };
      const orgSlug = params['orgSlug'];
      const wildcardSlug = this.route.snapshot.url.map(s => s.path).join('/');
      const pageSlug = params['pageSlug'] || wildcardSlug || 'home';

      this.orgSlug = orgSlug ?? '';

      if (orgSlug) {
        this.loadPage(orgSlug, pageSlug);
      }
    });
  }

  loadPage(orgSlug: string, pageSlug: string, attemptedNotFound = false): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.storefrontService.getPage(orgSlug, pageSlug).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        // Handle both { data: {...} } and flat response shapes
        const data = res?.data ?? res;

        if (!data?.page) {
          this.error.set('Page not found.');
          this.isLoading.set(false);
          return;
        }

        this.pageData.set(data);
        this.stateService.setState(data);
        this._updateSeo(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        if (err?.status === 404 && pageSlug !== '404' && !attemptedNotFound) {
          this.loadPage(orgSlug, '404', true);
          return;
        }

        const msg = err?.status === 404
          ? 'The page you are looking for does not exist.'
          : 'We encountered an error loading this page.';
        this._updateSeo({
          organization: this.stateService.organization(),
          page: {
            name: 'Page not found',
            slug: pageSlug,
            seo: {
              title: 'Page not found',
              description: msg,
              noIndex: true
            }
          }
        });
        this.error.set(msg);
        this.isLoading.set(false);
      }
    });
  }

  private _updateSeo(data: any): void {
    const seo = data?.page?.seo;
    if (!seo) return;
    this.titleService.setTitle(seo.title ?? data.page.name ?? 'Store');
    if (seo.description) {
      this.metaService.updateTag({ name: 'description', content: seo.description });
      this.metaService.updateTag({ property: 'og:description', content: seo.description });
    }
    if (seo.image) {
      this.metaService.updateTag({ property: 'og:image', content: seo.image });
    }
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:title', content: seo.title ?? data.page.name ?? 'Store' });
    this.metaService.updateTag({ name: 'twitter:card', content: seo.image ? 'summary_large_image' : 'summary' });
    const canonical = this._canonicalUrl(data);
    this.metaService.updateTag({ property: 'og:url', content: canonical });
    this._updateCanonicalLink(canonical);
    this._updateJsonLd(data);
    if (seo.noIndex) {
      this.metaService.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    }
  }

  private _updateJsonLd(data: any): void {
    const id = 'storefront-page-jsonld';
    this.document.getElementById(id)?.remove();

    const org = data?.organization;
    const page = data?.page;
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page?.seo?.title ?? page?.name,
      description: page?.seo?.description,
      publisher: org ? {
        '@type': 'Organization',
        name: org.name,
        logo: org.logo || undefined
      } : undefined,
      url: this._canonicalUrl(data)
    });
    this.document.head.appendChild(script);
  }

  private _canonicalUrl(data: any): string {
    const explicit = data?.page?.seo?.canonicalUrl ?? data?.page?.canonicalUrl;
    if (explicit) return explicit;

    const origin = this.document.location?.origin ?? '';
    const org = data?.organization?.slug ?? this.orgSlug;
    const slug = data?.page?.slug ?? 'home';
    const path = slug === 'home' ? `/store/${org}/home` : `/store/${org}/${slug}`;
    return `${origin}${path}`.replace(/\/+$/, '');
  }

  private _updateCanonicalLink(url: string): void {
    const id = 'storefront-canonical';
    let link = this.document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.id = id;
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = url;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
