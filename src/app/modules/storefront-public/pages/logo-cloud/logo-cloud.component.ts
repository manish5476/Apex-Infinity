// logo-cloud.component.ts
import { Component, Input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LogoItem { name: string; image: string; url?: string; }

export interface LogoCloudConfig {
  title?: string;
  items?: LogoItem[];
  grayscale?: boolean;
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
}

const PADDING: Record<string, string> = { none: '0', sm: '2.5rem', md: '4rem', lg: '6rem', xl: '9rem' };

const MOCK: LogoItem[] = [
  { name: 'Samsung', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/512px-Samsung_Logo.svg.png' },
  { name: 'Sony', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/512px-Sony_logo.svg.png' },
  { name: 'Apple', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/512px-Apple_logo_black.svg.png' },
  { name: 'LG', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/LG_logo_%282015%29.svg/512px-LG_logo_%282015%29.svg.png' },
  { name: 'Bose', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Bose_logo.svg/512px-Bose_logo.svg.png' },
  { name: 'JBL', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/JBL_logo.svg/512px-JBL_logo.svg.png' }
];

@Component({
  selector: 'app-logo-cloud',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="lc-root" [ngStyle]="sectionStyle()">
      <div class="lc-container">
        @if (cfg().title) {
          <p class="lc-label">{{ cfg().title }}</p>
        }
        <div class="lc-track-wrap">
          <div class="lc-track">
            @for (item of items(); track item.name) {
              <div class="lc-logo" [class.lc-grayscale]="cfg().grayscale">
                <img [src]="item.image" [alt]="item.name" loading="lazy" />
              </div>
            }
            <!-- Duplicate for seamless loop -->
            @for (item of items(); track item.name + '_dup') {
              <div class="lc-logo" [class.lc-grayscale]="cfg().grayscale" aria-hidden="true">
                <img [src]="item.image" [alt]="item.name" loading="lazy" />
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

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
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--text-tertiary);
      margin: 0 0 var(--spacing-3xl);
    }

    /* Marquee track */
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

      &:hover { animation-play-state: paused; }
    }

    .lc-logo {
      flex-shrink: 0;
      height: 36px;
      display: flex;
      align-items: center;

      img {
        height: 100%;
        width: auto;
        max-width: 120px;
        object-fit: contain;
        transition: opacity 0.2s ease, filter 0.2s ease;
      }
    }

    .lc-grayscale img {
      filter: grayscale(100%);
      opacity: 0.4;
      &:hover { filter: none; opacity: 1; }
    }

    @keyframes lc-scroll {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoCloudComponent {
  @Input() set config(v: LogoCloudConfig) { this._config.set(v ?? {}); }
  private _config = signal<LogoCloudConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Trusted Brands',
    grayscale: this._config().grayscale !== false,
    paddingTop: this._config().paddingTop ?? 'md',
    paddingBottom: this._config().paddingBottom ?? 'md',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly items = computed(() => {
    const src = this._config().items;
    return (Array.isArray(src) && src.length > 0) ? src : MOCK;
  });

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '4rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '4rem',
    'background-color': this.cfg().backgroundColor || ''
  }));
}
