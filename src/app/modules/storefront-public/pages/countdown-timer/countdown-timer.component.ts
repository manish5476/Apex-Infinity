import {
  Component, Input, OnInit, OnDestroy,
  signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { CountdownTimerConfig } from '@core/models/storefront.model';

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
    ctaButton:   this._config().ctaButton,
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
    const url = this.cfg().ctaButton?.link;
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
