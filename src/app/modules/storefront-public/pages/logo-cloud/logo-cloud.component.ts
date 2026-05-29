
import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// ---------------------------------------------------------------------------
// Interfaces (Mapped strictly to SectionRegistry schema)
// ---------------------------------------------------------------------------
export interface LogoItem {
  image: string;
  alt?: string;
  link?: string;
}

export interface LogoCloudConfig {
  title?: string;
  logos?: LogoItem[];
  grayscale?: boolean;
  design?: any;       // Upgraded: Handles customBackground
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const PADDING: Record<string, string> = { 
  none: '0', sm: '2.5rem', md: '4rem', lg: '6rem', xl: '9rem' 
};

const MOCK_LOGOS: LogoItem[] = [
  { alt: 'Samsung', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/512px-Samsung_Logo.svg.png' },
  { alt: 'Sony', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/512px-Sony_logo.svg.png' },
  { alt: 'Apple', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/512px-Apple_logo_black.svg.png' },
  { alt: 'LG', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/LG_logo_%282015%29.svg/512px-LG_logo_%282015%29.svg.png' },
  { alt: 'Bose', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Bose_logo.svg/512px-Bose_logo.svg.png' },
  { alt: 'JBL', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/JBL_logo.svg/512px-JBL_logo.svg.png' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-logo-cloud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="lc-root" [ngStyle]="sectionStyle()">
      <div class="lc-container">
        
        @if (cfg().title) {
          <p class="lc-label" [ngStyle]="headingStyle()">{{ cfg().title }}</p>
        }

        <div class="lc-track-wrap">
          <div class="lc-track">
            
            @for (logo of logos(); track $index) {
              <ng-container *ngTemplateOutlet="logoTemplate; context: { logo: logo, isDup: false }"></ng-container>
            }
            
            @for (logo of logos(); track $index + '_dup') {
              <ng-container *ngTemplateOutlet="logoTemplate; context: { logo: logo, isDup: true }"></ng-container>
            }

          </div>
        </div>
      </div>
    </section>

    <ng-template #logoTemplate let-logo="logo" let-isDup="isDup">
      @if (logo.link) {
        <a [href]="isExternal(logo.link) ? logo.link : null"
           [routerLink]="!isExternal(logo.link) ? itemLink(logo.link) : null"
           [target]="isExternal(logo.link) ? '_blank' : '_self'"
           [attr.rel]="isExternal(logo.link) ? 'noopener noreferrer' : null"
           class="lc-logo" [class.lc-grayscale]="cfg().grayscale" 
           [attr.aria-hidden]="isDup ? 'true' : null">
          <img [src]="logo.image" [alt]="logo.alt || 'Partner Logo'" loading="lazy" />
        </a>
      } @else {
        <div class="lc-logo" [class.lc-grayscale]="cfg().grayscale" [attr.aria-hidden]="isDup ? 'true' : null">
          <img [src]="logo.image" [alt]="logo.alt || 'Partner Logo'" loading="lazy" />
        </div>
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .lc-root {
      background: var(--bg-secondary);
      overflow: hidden;
    }

    .lc-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 var(--spacing-2xl);
    }

    .lc-label {
      text-align: center;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      margin: 0 0 var(--spacing-4xl);
    }

    /* Marquee Track */
    .lc-track-wrap {
      overflow: hidden;
      mask-image: linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%);
    }

    .lc-track {
      display: flex;
      gap: 48px;
      align-items: center;
      animation: lc-scroll 28s linear infinite;
      width: max-content;
    }
    
    .lc-track:hover {
      animation-play-state: paused;
    }

    .lc-logo {
      flex-shrink: 0;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Adds a subtle lift on hover for clickable logos */
    a.lc-logo:hover {
      transform: translateY(-4px) scale(1.05);
    }

    .lc-logo img {
      height: 100%;
      width: auto;
      max-width: 120px;
      object-fit: contain;
      transition: opacity 0.3s ease, filter 0.3s ease;
    }

    .lc-grayscale img {
      filter: grayscale(100%);
      opacity: 0.4;
    }
    
    .lc-grayscale:hover img {
      filter: grayscale(0%);
      opacity: 1;
    }

    @keyframes lc-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
  `]
})
export class LogoCloudComponent {
  @Input() set config(v: LogoCloudConfig) { this._config.set(v ?? {}); }
  private _config = signal<LogoCloudConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Trusted Brands',
    grayscale: this._config().grayscale !== false,
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md'
  }));

  readonly logos = computed(() => {
    const src = this._config().logos;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK_LOGOS;
  });

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '4rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '4rem',
    'background-color': this.cfg().design?.customBackground || 'var(--bg-secondary)'
  }));

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-mono)',
      'color': this.cfg().typography?.headingColor || 'var(--text-tertiary)'
    };
  }

  itemLink(url: string | undefined): string[] | null {
    if (!url || url.startsWith('http') || url.startsWith('www')) return null;
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return clean ? ['/', clean] : null;
  }

  isExternal(url: string | undefined): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}
