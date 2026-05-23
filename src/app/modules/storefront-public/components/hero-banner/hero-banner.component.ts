// hero-banner.component.ts
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PADDING_MAP, SectionBaseConfig, SectionButton } from '../../../storefront-admin/schema/section.types';

interface HeroBannerConfig extends SectionBaseConfig {
  title?: string;
  titleTag?: 'h1' | 'h2' | 'h3';
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  backgroundImage?: string;
  height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
  overlayOpacity?: number;
  ctaButtons?: SectionButton[];
  contentPosition?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<section class="hero-banner" [style]="hostStyles">
  <!-- Background image layer -->
  @if (config.backgroundImage) {
    <div class="hero-bg"
      [style.backgroundImage]="'url(' + config.backgroundImage + ')'">
    </div>
  } @else {
    <div class="hero-bg hero-bg--gradient"></div>
  }

  <!-- Overlay -->
  <div class="hero-overlay"
    [style.opacity]="(config.overlayOpacity ?? 20) / 100">
  </div>

  <!-- Content -->
  <div class="hero-inner" [ngClass]="'hero-inner--' + (config.contentPosition ?? 'center')">
    <div class="hero-content" [ngClass]="'hero-content--' + (config.alignment ?? 'left')">

      @if (config.title) {
        <ng-container [ngSwitch]="config.titleTag ?? 'h2'">
          <h1 *ngSwitchCase="'h1'" class="hero-title">{{ config.title }}</h1>
          <h2 *ngSwitchCase="'h2'" class="hero-title">{{ config.title }}</h2>
          <h3 *ngSwitchCase="'h3'" class="hero-title">{{ config.title }}</h3>
        </ng-container>
      }

      @if (config.subtitle) {
        <p class="hero-subtitle">{{ config.subtitle }}</p>
      }

      @if (config.ctaButtons?.length) {
        <div class="hero-actions">
          @for (btn of config.ctaButtons; track $index) {
            @if (btn.text) {
              <a [href]="btn.link || '#'"
                class="hero-btn"
                [ngClass]="'hero-btn--' + (btn.variant ?? 'primary')">
                @if (btn.icon) {
                  <i [class]="btn.icon" aria-hidden="true"></i>
                }
                {{ btn.text }}
              </a>
            }
          }
        </div>
      }

    </div>
  </div>
</section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .hero-banner {
      position: relative;
      width: 100%;
      overflow: hidden;
      font-family: var(--font-heading, 'Plus Jakarta Sans', sans-serif);
    }

    /* Height variants */
    :host-context(.hero-height--small)  .hero-banner { min-height: 320px; }
    :host-context(.hero-height--medium) .hero-banner { min-height: 520px; }
    :host-context(.hero-height--large)  .hero-banner { min-height: 700px; }
    :host-context(.hero-height--screen) .hero-banner { min-height: 100vh; }

    .hero-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      transform: scale(1.03);
      transition: transform 8s ease-out;
    }

    .hero-bg--gradient {
      background: linear-gradient(135deg,
        var(--theme-accent-primary, #2563eb) 0%,
        color-mix(in srgb, var(--theme-accent-primary, #2563eb) 60%, #000) 100%);
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: #000;
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      z-index: 2;
      width: 100%;
      min-height: inherit;
      display: flex;
      align-items: center;
      padding: 64px 5%;
    }

    .hero-inner--left   { justify-content: flex-start; }
    .hero-inner--center { justify-content: center; }
    .hero-inner--right  { justify-content: flex-end; }

    .hero-content {
      max-width: 680px;
    }

    .hero-content--center { text-align: center; }
    .hero-content--right  { text-align: right; }

    .hero-title {
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0 0 16px;
      text-shadow: 0 2px 20px rgba(0,0,0,0.3);
    }

    .hero-subtitle {
      font-size: clamp(1rem, 2vw, 1.25rem);
      color: rgba(255,255,255,0.85);
      font-family: var(--font-body, 'Inter', sans-serif);
      font-weight: 400;
      line-height: 1.6;
      margin: 0 0 32px;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-content--center .hero-actions { justify-content: center; }
    .hero-content--right  .hero-actions { justify-content: flex-end; }

    .hero-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
      letter-spacing: 0.01em;
    }

    .hero-btn--primary {
      background: var(--theme-accent-primary, #2563eb);
      color: #fff;
      box-shadow: 0 4px 20px rgba(37,99,235,0.4);
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(37,99,235,0.5); }
    }

    .hero-btn--secondary {
      background: rgba(255,255,255,0.15);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.3);
      backdrop-filter: blur(8px);
      &:hover { background: rgba(255,255,255,0.25); }
    }

    .hero-btn--outline {
      background: transparent;
      color: #fff;
      border: 2px solid #fff;
      &:hover { background: #fff; color: #000; }
    }

    .hero-btn--ghost {
      background: transparent;
      color: rgba(255,255,255,0.85);
      &:hover { color: #fff; }
    }
  `]
})
export class HeroBannerComponent implements OnInit {
  @Input() config: HeroBannerConfig = {};
  @Input() data: any = null;

  hostStyles: Record<string, string> = {};

  ngOnInit(): void {
    const pt = PADDING_MAP[this.config.paddingTop ?? 'md'];
    const pb = PADDING_MAP[this.config.paddingBottom ?? 'md'];
    const heightMap: Record<string, string> = {
      small: '320px', medium: '520px', large: '700px', screen: '100vh', auto: 'auto'
    };
    this.hostStyles = {
      paddingTop: pt,
      paddingBottom: pb,
      minHeight: heightMap[this.config.height ?? 'medium'],
      backgroundColor: this.config.backgroundColor || 'transparent',
    };
  }
}


// // hero-banner.component.ts
// import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// export interface HeroBannerConfig {
//   title?: string;
//   titleTag?: 'h1' | 'h2' | 'h3';
//   subtitle?: string;
//   alignment?: 'left' | 'center' | 'right';
//   backgroundImage?: string;
//   height?: 'auto' | 'small' | 'medium' | 'large' | 'screen';
//   overlayOpacity?: number;
//   ctaButtons?: Array<{ text: string; link: string; variant: 'primary' | 'secondary' | 'outline' | 'ghost'; icon?: string }>;
//   contentPosition?: 'left' | 'center' | 'right';
//   paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?: string;
//   themeMode?: 'auto' | 'light' | 'dark' | 'glass';
// }

// const HEIGHT_MAP: Record<string, string> = {
//   auto: 'auto', small: '50vh', medium: '70vh', large: '85vh', screen: '100vh'
// };

// @Component({
//   selector: 'app-hero-banner',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './hero-banner.component.html',
//   styleUrls: ['./hero-banner.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class HeroBannerComponent {
//   @Input() set config(v: HeroBannerConfig) { this._config.set(v ?? {}); }
//   private _config = signal<HeroBannerConfig>({});

//   readonly cfg = computed(() => ({
//     title: this._config().title ?? 'Welcome to Our Store',
//     titleTag: this._config().titleTag ?? 'h2', // Fixed default to match schema
//     subtitle: this._config().subtitle ?? 'Discover something extraordinary',
//     alignment: this._config().alignment ?? 'center',
//     backgroundImage: this._config().backgroundImage ?? '',
//     height: this._config().height ?? 'large',
//     overlayOpacity: this._config().overlayOpacity ?? 40,
//     ctaButtons: this._config().ctaButtons ?? [
//       { text: 'Shop Now', link: '/products', variant: 'primary' as const },
//       { text: 'Learn More', link: '#', variant: 'outline' as const }
//     ],
//     contentPosition: this._config().contentPosition ?? 'center',
//     backgroundColor: this._config().backgroundColor ?? '',
//     paddingTop: this._config().paddingTop ?? 'md',
//     paddingBottom: this._config().paddingBottom ?? 'md',
//     themeMode: this._config().themeMode ?? 'auto'
//   }));

//   readonly paddingMap: Record<string, string> = {
//     none: '0',
//     sm: 'var(--spacing-3xl, 2rem)',
//     md: 'var(--spacing-5xl, 4rem)',
//     lg: 'calc(var(--spacing-5xl, 4rem) * 1.5)',
//     xl: 'calc(var(--spacing-5xl, 4rem) * 2)'
//   };

//   readonly sectionStyle = computed(() => ({
//     'min-height': HEIGHT_MAP[this.cfg().height] ?? '70vh',
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   readonly contentStyle = computed(() => ({
//     'padding-top': this.paddingMap[this.cfg().paddingTop] ?? this.paddingMap['md'],
//     'padding-bottom': this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['md']
//   }));

//   readonly overlayStyle = computed(() => ({
//     'opacity': (this.cfg().overlayOpacity / 100).toString()
//   }));

//   isExternal(url: string | null | undefined): boolean {
//     if (!url) return false;
//     return url.startsWith('http') || url.startsWith('www');
//   }

//   getLink(url: string | null | undefined): string {
//     if (!url) return '/';
//     return url;
//   }
// }
