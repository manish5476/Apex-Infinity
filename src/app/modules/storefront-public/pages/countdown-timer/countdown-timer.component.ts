
import { Component, Input, OnInit, OnDestroy, signal, computed, inject, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
interface TimeUnits {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export interface CountdownTimerConfig {
  title?: string;
  style?: 'boxes' | 'plain';
  targetDate?: string;
  ctaButton?: { text: string; link: string; icon?: string };
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: string;
  paddingBottom?: string;
  backgroundImage?: string;
}

const PADDING: Record<string, string> = {
  none: '0', sm: '4rem', md: '7rem', lg: '10rem', xl: '14rem'
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="ct-root" [ngStyle]="sectionStyle()">
      @if (cfg().backgroundImage) {
        <img [src]="cfg().backgroundImage" class="ct-bg-img" alt="" aria-hidden="true" loading="lazy" />
      }
      <div class="ct-overlay" [class.has-image]="!!cfg().backgroundImage" [ngStyle]="{'background-color': cfg().backgroundImage ? 'rgba(0,0,0,0.65)' : 'transparent'}"></div>

      <div class="ct-container relative z-10">
        <div class="ct-badge" [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-mono)'}">
          <span class="ct-badge-dot"></span>
          Ending Soon
        </div>

        <h2 class="ct-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>

        @if (!isExpired()) {
          <div class="ct-units" [class.plain-style]="cfg().style === 'plain'">
            <div class="ct-unit">
              <div class="ct-number" [ngStyle]="numberStyle()">{{ timeLeft().days }}</div>
              <div class="ct-label" [ngStyle]="labelStyle()">Days</div>
            </div>

            <div class="ct-sep" aria-hidden="true" [ngStyle]="numberStyle()">:</div>

            <div class="ct-unit">
              <div class="ct-number" [ngStyle]="numberStyle()">{{ timeLeft().hours }}</div>
              <div class="ct-label" [ngStyle]="labelStyle()">Hours</div>
            </div>

            <div class="ct-sep" aria-hidden="true" [ngStyle]="numberStyle()">:</div>

            <div class="ct-unit">
              <div class="ct-number" [ngStyle]="numberStyle()">{{ timeLeft().minutes }}</div>
              <div class="ct-label" [ngStyle]="labelStyle()">Mins</div>
            </div>

            <div class="ct-sep" aria-hidden="true" [ngStyle]="numberStyle()">:</div>

            <div class="ct-unit ct-unit-secs">
              <div class="ct-number ct-seconds-number" [ngStyle]="numberStyle(true)">{{ timeLeft().seconds }}</div>
              <div class="ct-label" [ngStyle]="labelStyle()">Secs</div>
            </div>
          </div>
        } @else {
          <div class="ct-expired">
            <i class="pi pi-clock"></i>
            <span [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)'}">This offer has ended.</span>
          </div>
        }

        @if (cfg().ctaButton?.link && !isExpired()) {
          <div class="ct-cta-wrap">
            @if (ctaIsExternal()) {
              <a [href]="cfg().ctaButton!.link" target="_blank" rel="noopener" class="ct-cta-btn" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">
                {{ cfg().ctaButton!.text }}
                <i [class]="cfg().ctaButton!.icon || 'pi pi-arrow-right'"></i>
              </a>
            } @else if (ctaLink()) {
              <a [routerLink]="ctaLink()" class="ct-cta-btn" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">
                {{ cfg().ctaButton!.text }}
                <i [class]="cfg().ctaButton!.icon || 'pi pi-arrow-right'"></i>
              </a>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .ct-root { position: relative; overflow: hidden; text-align: center; width: 100%; }
    
    .ct-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; z-index: 0; }
    
    .ct-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at center top, color-mix(in srgb, var(--accent-primary) 12%, transparent) 0%, var(--bg-primary) 60%); z-index: 1; }
    .ct-overlay.has-image { background: rgba(0, 0, 0, 0.65); }

    .ct-container { max-width: 860px; margin: 0 auto; padding: 0 var(--spacing-2xl); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-2xl); }

    .ct-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border-primary); background: var(--bg-secondary); backdrop-filter: blur(6px); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-secondary); }
    .ct-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-primary); animation: ct-pulse 1.8s ease-in-out infinite; flex-shrink: 0; }

    @keyframes ct-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-primary) 40%, transparent); }
      50% { opacity: 0.7; box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent-primary) 0%, transparent); }
    }

    .ct-title { margin: 0; font-size: clamp(26px, 4.5vw, 52px); font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4); }

    .ct-units { display: flex; align-items: center; gap: 16px; justify-content: center; }
    @media (max-width: 480px) { .ct-units { gap: 10px; } }

    .ct-unit { display: flex; flex-direction: column; align-items: center; gap: 6px; }

    .ct-number { font-size: clamp(40px, 7vw, 80px); font-weight: 700; line-height: 1; letter-spacing: -0.02em; min-width: 2ch; text-align: center; }
    
    .ct-units:not(.plain-style) .ct-number { padding: 16px 20px; background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 14px; min-width: 90px; backdrop-filter: blur(8px); }
    @media (max-width: 480px) { .ct-units:not(.plain-style) .ct-number { min-width: 64px; padding: 12px 14px; } }

    .ct-units:not(.plain-style) .ct-unit-secs .ct-seconds-number { border-color: color-mix(in srgb, var(--accent-primary) 25%, transparent); background: color-mix(in srgb, var(--accent-primary) 8%, transparent); }

    .ct-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }

    .ct-sep { font-size: clamp(28px, 5vw, 60px); font-weight: 700; line-height: 1; padding-bottom: 24px; animation: ct-blink 1s step-end infinite; }

    @keyframes ct-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }

    .ct-expired { display: flex; align-items: center; gap: 10px; font-size: var(--font-size-lg); color: var(--text-secondary); }
    .ct-expired i { font-size: 1.5rem; }

    .ct-cta-wrap { margin-top: var(--spacing-sm); }
    .ct-cta-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 36px; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: var(--ui-border-radius-pill); font-size: var(--font-size-sm); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; transition: all 0.25s ease; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); }
    .ct-cta-btn i { font-size: 12px; transition: transform 0.2s ease; }
    .ct-cta-btn:hover { background: var(--accent-primary); color: var(--text-primary); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35); }
    .ct-cta-btn:hover i { transform: translateX(4px); }
    .ct-cta-btn:active { transform: translateY(0); }
  `]
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  private stateService = inject(StorefrontStateService);
  private router = inject(Router);

  @Input() set config(v: CountdownTimerConfig) { this._config.set(v ?? {}); }

  private _config = signal<CountdownTimerConfig>({});
  private _intervalId: ReturnType<typeof setInterval> | null = null;

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Limited Time Offer',
    style: this._config().style ?? 'boxes',
    ctaButton: this._config().ctaButton,
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundImage: this._config().backgroundImage ?? ''
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '10rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '10rem',
    'background-color': this.cfg().design?.customBackground || 'var(--bg-primary)'
  }));

  // Dynamic Typography Styles
  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().backgroundImage ? '#ffffff' : (this.cfg().typography?.headingColor || 'var(--text-primary)')
    };
  }

  numberStyle(isAccent = false) {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-mono)',
      'color': isAccent 
        ? 'var(--accent-primary)' 
        : (this.cfg().backgroundImage ? '#ffffff' : (this.cfg().typography?.headingColor || 'var(--text-primary)'))
    };
  }

  labelStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-mono)',
      'color': this.cfg().backgroundImage ? 'rgba(255, 255, 255, 0.7)' : (this.cfg().typography?.bodyColor || 'var(--text-secondary)')
    };
  }

  timeLeft = signal<TimeUnits>({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  isExpired = signal(false);

  readonly slug = computed(() => this.stateService.organization()?.slug || this._parseSlugFromUrl());

  readonly ctaLink = computed(() => {
    const url = this.cfg().ctaButton?.link;
    if (!url || url.startsWith('http') || url.startsWith('www')) return null;

    const s = this.slug();
    if (!s) return [url];

    const clean = url.startsWith('/') ? url.slice(1) : url;
    return ['/store', s, clean].filter(Boolean);
  });

  readonly ctaIsExternal = computed(() => {
    const url = this.cfg().ctaButton?.link;
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  });

  ngOnInit(): void {
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  private _tick(): void {
    const target = this._parseDate(this._config().targetDate);
    if (!target) return;

    const diff = target - Date.now();

    if (diff <= 0) {
      this.timeLeft.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      this.isExpired.set(true);
      if (this._intervalId) {
        clearInterval(this._intervalId);
        this._intervalId = null;
      }
      return;
    }

    this.timeLeft.set({
      days: this._pad(Math.floor(diff / 86_400_000)),
      hours: this._pad(Math.floor((diff % 86_400_000) / 3_600_000)),
      minutes: this._pad(Math.floor((diff % 3_600_000) / 60_000)),
      seconds: this._pad(Math.floor((diff % 60_000) / 1_000))
    });
  }

  private _parseDate(raw: string | undefined): number | null {
    if (!raw) return null;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/').map(Number);
      return new Date(y, m - 1, d).getTime();
    }
    const t = new Date(raw).getTime();
    return isNaN(t) ? null : t;
  }

  private _pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  private _parseSlugFromUrl(): string {
    const m = this.router.url.match(/\/store\/([^/?#]+)/);
    return (m?.[1] && m[1] !== 'undefined') ? m[1] : '';
  }
}// import {
//   Component, Input, OnInit, OnDestroy,
//   signal, computed, inject, ChangeDetectionStrategy
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, Router } from '@angular/router';
// import { StorefrontStateService } from '@core/services/storefront-state.service';
// import { CountdownTimerConfig } from '@core/models/storefront.model';

// interface TimeUnits {
//   days:    string;
//   hours:   string;
//   minutes: string;
//   seconds: string;
// }

// const PADDING: Record<string, string> = {
//   none: '0', sm: '4rem', md: '7rem', lg: '10rem', xl: '14rem'
// };

// @Component({
//   selector: 'app-countdown-timer',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './countdown-timer.component.html',
//   styleUrls:   ['./countdown-timer.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class CountdownTimerComponent implements OnInit, OnDestroy {

//   private stateService = inject(StorefrontStateService);
//   private router       = inject(Router);

//   @Input() set config(v: CountdownTimerConfig) { this._config.set(v ?? {}); }

//   private _config     = signal<CountdownTimerConfig>({});
//   private _intervalId: ReturnType<typeof setInterval> | null = null;

//   readonly cfg = computed(() => ({
//     title:       this._config().title        ?? 'Limited Time Offer',
//     style:       this._config().style        ?? 'boxes',
//     ctaButton:   this._config().ctaButton,
//     paddingTop:    this._config().paddingTop    ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundImage: this._config().backgroundImage ?? '',
//     backgroundColor: this._config().backgroundColor ?? ''
//   }));

//   readonly sectionStyle = computed(() => ({
//     'padding-top':    PADDING[this.cfg().paddingTop]    ?? '10rem',
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '10rem',
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   timeLeft = signal<TimeUnits>({ days: '00', hours: '00', minutes: '00', seconds: '00' });
//   isExpired = signal(false);

//   /** Resolved org slug — no hardcodes */
//   readonly slug = computed(() =>
//     this.stateService.organization()?.slug ||
//     this._parseSlugFromUrl()
//   );

//   /** Build routerLink for CTA */
//   readonly ctaLink = computed(() => {
//     const url = this.cfg().ctaButton?.link;
//     if (!url) return null;

//     // External URL — handled with href in template
//     if (url.startsWith('http') || url.startsWith('www')) return null;

//     const s = this.slug();
//     if (!s) return [url];

//     // Strip leading slash to avoid double slash
//     const clean = url.startsWith('/') ? url.slice(1) : url;
//     return ['/store', s, clean].filter(Boolean);
//   });

//   readonly ctaIsExternal = computed(() => {
//     const url = this.cfg().ctaButton?.link;
//     return !!url && (url.startsWith('http') || url.startsWith('www'));
//   });

//   ngOnInit(): void {
//     this._tick();
//     this._intervalId = setInterval(() => this._tick(), 1000);
//   }

//   ngOnDestroy(): void {
//     if (this._intervalId) {
//       clearInterval(this._intervalId);
//       this._intervalId = null;
//     }
//   }

//   private _tick(): void {
//     const target = this._parseDate(this._config().targetDate);
//     if (!target) return;

//     const diff = target - Date.now();

//     if (diff <= 0) {
//       this.timeLeft.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
//       this.isExpired.set(true);
//       if (this._intervalId) {
//         clearInterval(this._intervalId);
//         this._intervalId = null;
//       }
//       return;
//     }

//     this.timeLeft.set({
//       days:    this._pad(Math.floor(diff / 86_400_000)),
//       hours:   this._pad(Math.floor((diff % 86_400_000) / 3_600_000)),
//       minutes: this._pad(Math.floor((diff % 3_600_000) / 60_000)),
//       seconds: this._pad(Math.floor((diff % 60_000) / 1_000))
//     });
//   }

//   private _parseDate(raw: string | undefined): number | null {
//     if (!raw) return null;

//     // DD/MM/YYYY
//     if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
//       const [d, m, y] = raw.split('/').map(Number);
//       return new Date(y, m - 1, d).getTime();
//     }

//     // ISO or any other parseable format
//     const t = new Date(raw).getTime();
//     return isNaN(t) ? null : t;
//   }

//   private _pad(n: number): string {
//     return n < 10 ? `0${n}` : String(n);
//   }

//   private _parseSlugFromUrl(): string {
//     const m = this.router.url.match(/\/store\/([^/?#]+)/);
//     return (m?.[1] && m[1] !== 'undefined') ? m[1] : '';
//   }
// }
