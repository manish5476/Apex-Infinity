// src/app/modules/storefront-public/pages/countdown-timer/countdown-timer.component.ts
import {
  Component, Input, OnInit, OnDestroy,
  signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';

export interface CountdownTimerConfig {
  targetDate?:   string;   // ISO string or DD/MM/YYYY
  title?:        string;
  style?:        'boxes' | 'plain';
  ctaText?:      string;
  ctaUrl?:       string;
  // Style
  paddingTop?:   'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?:'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundImage?: string;
  backgroundColor?: string;
}

interface TimeUnits {
  days:    string;
  hours:   string;
  minutes: string;
  seconds: string;
}

const PADDING: Record<string, string> = {
  none: '0', sm: '4rem', md: '7rem', lg: '10rem', xl: '14rem'
};

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './countdown-timer.component.html',
  styleUrls:   ['./countdown-timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownTimerComponent implements OnInit, OnDestroy {

  private stateService = inject(StorefrontStateService);
  private router       = inject(Router);

  @Input() set config(v: CountdownTimerConfig) { this._config.set(v ?? {}); }

  private _config     = signal<CountdownTimerConfig>({});
  private _intervalId: ReturnType<typeof setInterval> | null = null;

  readonly cfg = computed(() => ({
    title:       this._config().title        ?? 'Limited Time Offer',
    style:       this._config().style        ?? 'boxes',
    ctaText:     this._config().ctaText      ?? 'Shop Now',
    ctaUrl:      this._config().ctaUrl       ?? '',
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundImage: this._config().backgroundImage ?? '',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? '10rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '10rem',
    'background-color': this.cfg().backgroundColor || ''
  }));

  timeLeft = signal<TimeUnits>({ days: '00', hours: '00', minutes: '00', seconds: '00' });
  isExpired = signal(false);

  /** Resolved org slug — no hardcodes */
  readonly slug = computed(() =>
    this.stateService.organization()?.slug ||
    this._parseSlugFromUrl()
  );

  /** Build routerLink for CTA */
  readonly ctaLink = computed(() => {
    const url = this.cfg().ctaUrl;
    if (!url) return null;

    // External URL — handled with href in template
    if (url.startsWith('http') || url.startsWith('www')) return null;

    const s = this.slug();
    if (!s) return [url];

    // Strip leading slash to avoid double slash
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return ['/store', s, clean].filter(Boolean);
  });

  readonly ctaIsExternal = computed(() => {
    const url = this.cfg().ctaUrl;
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  });

  ngOnInit(): void {
    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this._intervalId) clearInterval(this._intervalId);
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
      days:    this._pad(Math.floor(diff / 86_400_000)),
      hours:   this._pad(Math.floor((diff % 86_400_000) / 3_600_000)),
      minutes: this._pad(Math.floor((diff % 3_600_000) / 60_000)),
      seconds: this._pad(Math.floor((diff % 60_000) / 1_000))
    });
  }

  private _parseDate(raw: string | undefined): number | null {
    if (!raw) return null;

    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
      const [d, m, y] = raw.split('/').map(Number);
      return new Date(y, m - 1, d).getTime();
    }

    // ISO or any other parseable format
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
}

// import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-countdown-timer',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   template: `
//     <section class="section-root" 
//              [style.padding-top]="paddingMap[config.paddingTop] || '8rem'"
//              [style.padding-bottom]="paddingMap[config.paddingBottom] || '8rem'">
      
//       @if (config.backgroundImage) {
//         <img [src]="config.backgroundImage" class="bg-image" alt="Background">
//       }
//       <div class="overlay-gradient"></div>

//       <div class="container-wrapper">
        
//         <div class="header-content">
//           <span class="badge animate-in">Ending Soon</span>
          
//           <h2 class="main-title animate-in delay-1">
//             {{ config.title || 'Limited Time Offer' }}
//           </h2>
//         </div>

//         <div class="timer-grid animate-in delay-2">
          
//           <div class="time-block">
//             <span class="number">{{ timeLeft().days }}</span>
//             <span class="label">Days</span>
//           </div>
          
//           <div class="separator">:</div>
          
//           <div class="time-block">
//             <span class="number">{{ timeLeft().hours }}</span>
//             <span class="label">Hours</span>
//           </div>

//           <div class="separator">:</div>

//           <div class="time-block">
//             <span class="number">{{ timeLeft().minutes }}</span>
//             <span class="label">Mins</span>
//           </div>

//           <div class="separator">:</div>

//           <div class="time-block">
//             <span class="number" style="color: #f43f5e;">{{ timeLeft().seconds }}</span>
//             <span class="label">Secs</span>
//           </div>

//         </div>

//         @if (config.ctaUrl) {
//           <div class="cta-wrapper animate-in delay-3">
//             <a [routerLink]="getLink(config.ctaUrl)" class="cta-btn">
//               Shop Now <i class="pi pi-arrow-right"></i>
//             </a>
//           </div>
//         }

//       </div>
//     </section>
//   `,
//   styleUrls: ['./countdown-timer.component.scss']
// })
// export class CountdownTimerComponent implements OnInit, OnDestroy {
//   @Input() config: any = {};

//   timeLeft = signal({ days: '00', hours: '00', minutes: '00', seconds: '00' });
//   private intervalId: any;

//   // Padding Mapper
//   paddingMap: any = {
//     'sm': '4rem', 'md': '8rem', 'lg': '12rem', 'xl': '16rem'
//   };

//   ngOnInit() {
//     this.startTimer();
//   }

//   ngOnDestroy() {
//     if (this.intervalId) clearInterval(this.intervalId);
//   }

//   private startTimer() {
//     this.calculateTime(); // Initial run
//     this.intervalId = setInterval(() => this.calculateTime(), 1000);
//   }

//   private calculateTime() {
//     // 1. Handle "DD/MM/YYYY" format specifically
//     const dateStr = this.config.targetDate;
//     if (!dateStr) return;

//     let targetDate: number;

//     if (dateStr.includes('/')) {
//       // Parse "19/01/2026" -> new Date(2026, 0, 19)
//       const parts = dateStr.split('/');
//       // Note: Month is 0-indexed in JS
//       targetDate = new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
//     } else {
//       // Fallback for standard ISO strings
//       targetDate = new Date(dateStr).getTime();
//     }

//     const now = new Date().getTime();
//     const diff = targetDate - now;

//     if (diff < 0) {
//       this.timeLeft.set({ days: '00', hours: '00', minutes: '00', seconds: '00' });
//       this.cleanup();
//       return;
//     }

//     const d = Math.floor(diff / (1000 * 60 * 60 * 24));
//     const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//     const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
//     const s = Math.floor((diff % (1000 * 60)) / 1000);

//     this.timeLeft.set({
//       days: this.pad(d),
//       hours: this.pad(h),
//       minutes: this.pad(m),
//       seconds: this.pad(s)
//     });
//   }

//   private pad(val: number): string {
//     return val < 10 ? `0${val}` : val.toString();
//   }

//   private cleanup() {
//     if (this.intervalId) clearInterval(this.intervalId);
//   }

//   // Helper to safely format link for Router
//   getLink(url: string): any[] {
//     // If it's a full URL (http), you'd normally use [href]. 
//     // Assuming internal link here based on context:
//     return ['/store', 'shivam', 'products'];
//   }
// }
