
import { Component, Input, signal, computed, ChangeDetectionStrategy, ViewEncapsulation, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface NewsletterConfig {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  layout?: 'center' | 'inline' | 'split';
}

const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="nl-root w-full" [ngStyle]="sectionStyle()">
      <div class="nl-glow" aria-hidden="true" [ngStyle]="{'background-color': cfg().typography?.headingColor || 'var(--accent-primary)'}"></div>

      <div class="nl-container">
        <div class="nl-card" [ngStyle]="cardStyle()">
          <div class="nl-card-accent" aria-hidden="true" [ngStyle]="{'background': 'linear-gradient(to right, ' + (cfg().typography?.headingColor || 'var(--accent-primary)') + ', var(--accent-secondary, var(--accent-primary)))'}"></div>

          @if (status() === 'success') {
            <div class="nl-success">
              <div class="nl-success-icon"><i class="pi pi-check-circle"></i></div>
              <h3 [ngStyle]="headingStyle()">{{ cfg().successMessage }}</h3>
              <button (click)="reset()" class="nl-reset" type="button" [ngStyle]="linkStyle()">Subscribe another email</button>
            </div>
          } @else {
            <div class="nl-body" [ngClass]="{'md:flex-row md:text-left': cfg().layout === 'split'}">
              
              <div class="nl-text" [ngClass]="{'md:flex-1': cfg().layout === 'split'}">
                <span class="nl-eyebrow" [ngStyle]="{'color': cfg().typography?.headingColor || 'var(--accent-primary)'}">Newsletter</span>
                <h2 class="nl-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
                <p class="nl-subtitle" [ngStyle]="bodyStyle()">{{ cfg().subtitle }}</p>
              </div>

              <div class="nl-form-wrapper" [ngClass]="{'md:flex-1 w-full': cfg().layout === 'split', 'w-full': cfg().layout !== 'split'}">
                <form class="nl-form" [formGroup]="form" (ngSubmit)="submit()" novalidate [ngClass]="{'mx-auto': cfg().layout !== 'split'}">
                  
                  <div class="nl-input-group" [class.nl-input-error]="emailInvalid" [ngClass]="{'focus-ring': true}">
                    <i class="pi pi-envelope nl-input-icon"></i>
                    <input type="email" formControlName="email" class="nl-input" [placeholder]="cfg().placeholder" autocomplete="email" [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)'}" />
                    
                    <button type="submit" class="nl-btn" [disabled]="status() === 'submitting'" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">
                      @if (status() === 'submitting') {
                        <i class="pi pi-spin pi-spinner"></i>
                      } @else {
                        {{ cfg().buttonText }}
                      }
                    </button>
                  </div>

                  @if (emailInvalid) {
                    <p class="nl-error-msg" role="alert">
                      <i class="pi pi-exclamation-circle"></i> Please enter a valid email address
                    </p>
                  }
                </form>

                <p class="nl-disclaimer" [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)'}">
                  No spam, ever. Unsubscribe with one click.
                </p>
              </div>

            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .nl-root { position: relative; overflow: hidden; background: transparent; }

    .nl-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 600px; height: 300px; opacity: 0.06; filter: blur(80px); border-radius: 50%; pointer-events: none; }

    .nl-container { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 0 var(--spacing-2xl); }

    .nl-card { position: relative; background: var(--bg-primary); border: 1px solid var(--border-secondary); padding: var(--spacing-4xl); overflow: hidden; }

    .nl-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; }

    .nl-body { display: flex; flex-direction: column; gap: var(--spacing-2xl); align-items: center; text-align: center; }

    .nl-eyebrow { font-family: var(--font-mono); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; display: block; margin-bottom: var(--spacing-sm); }

    .nl-title { margin: 0 0 var(--spacing-sm); font-size: clamp(22px, 3vw, 36px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; }

    .nl-subtitle { margin: 0; font-size: var(--font-size-sm); line-height: 1.65; max-width: 440px; }
    
    .nl-form-wrapper { display: flex; flex-direction: column; align-items: center; gap: 1rem; }

    .nl-form { width: 100%; max-width: 520px; }

    .nl-input-group { display: flex; align-items: center; background: var(--bg-secondary); border: 1.5px solid var(--border-secondary); border-radius: 100px; padding: 6px 6px 6px 16px; gap: var(--spacing-sm); transition: border-color 0.2s ease, box-shadow 0.2s ease; }

    /* Focus ring logic relies on the nested input's focus state */
    .nl-input-group:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-primary) 15%, transparent 85%); }

    .nl-input-group.nl-input-error { border-color: var(--color-error, #ef4444); }

    .nl-input-icon { font-size: 14px; color: var(--text-tertiary); flex-shrink: 0; }

    .nl-input { flex: 1; background: transparent; border: none; outline: none; font-size: var(--font-size-sm); color: var(--text-primary); }
    .nl-input::placeholder { color: var(--text-tertiary); }

    .nl-btn { flex-shrink: 0; padding: 10px 22px; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: 100px; font-size: var(--font-size-xs); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.2s ease; }
    .nl-btn:hover:not(:disabled) { background: var(--accent-primary); color: var(--text-primary); transform: translateX(2px); }
    .nl-btn:disabled { opacity: 0.6; cursor: wait; }

    .nl-error-msg { margin: 8px 0 0; font-size: 11px; color: var(--color-error, #ef4444); display: flex; align-items: center; gap: 4px; justify-content: center; }
    .nl-error-msg i { font-size: 9px; }

    .nl-disclaimer { margin: 0; font-size: 11px; color: var(--text-tertiary); font-style: italic; text-align: center; }

    /* Success state */
    .nl-success { display: flex; flex-direction: column; align-items: center; gap: var(--spacing-lg); padding: var(--spacing-2xl) 0; text-align: center; animation: nl-pop 0.4s ease; }
    .nl-success-icon i { font-size: 3rem; color: var(--color-success, #059669); }
    .nl-success h3 { margin: 0; font-size: var(--font-size-xl); font-weight: 700; max-width: 400px; }

    .nl-reset { background: none; border: none; font-size: var(--font-size-sm); font-weight: 700; text-decoration: underline; cursor: pointer; }
    .nl-reset:hover { opacity: 0.75; }

    @keyframes nl-pop { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class NewsletterSignupComponent {
  private fb = inject(FormBuilder);

  @Input() set config(v: NewsletterConfig) { this._config.set(v ?? {}); }
  private _config = signal<NewsletterConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Stay in the loop',
    subtitle: this._config().subtitle ?? 'Get the latest deals, new arrivals, and exclusive offers straight to your inbox.',
    placeholder: this._config().placeholder ?? 'Enter your email address',
    buttonText: this._config().buttonText ?? 'Subscribe',
    successMessage: this._config().successMessage ?? 'You\'re in! Check your inbox for a welcome email.',
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    layout: this._config().layout ?? 'center'
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().typography?.headingColor || 'var(--text-primary)'
    };
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().typography?.bodyColor || 'var(--text-secondary)'
    };
  }

  linkStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().typography?.headingColor || 'var(--accent-primary)'
    };
  }

  cardStyle() {
    const base: any = {
      'border-radius': `var(--ui-border-radius-${this.cfg().design?.borderRadius || '2xl'})`,
    };
    if (this.cfg().design?.boxShadow && this.cfg().design?.boxShadow !== 'none') {
      base['box-shadow'] = `var(--shadow-${this.cfg().design.boxShadow})`;
    }
    return base;
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  get emailInvalid(): boolean {
    const c = this.form.get('email')!;
    return c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.status.set('submitting');
    setTimeout(() => { this.status.set('success'); }, 1200);
  }

  reset(): void { this.status.set('idle'); this.form.reset(); }
}




// // newsletter-signup.component.ts
// import {
//   Component, Input, signal, computed,
//   ChangeDetectionStrategy,
//   inject
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// export interface NewsletterConfig {
//   title?: string;
//   subtitle?: string;
//   placeholder?: string;
//   buttonText?: string;
//   successMessage?: string;
//   paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
//   backgroundColor?: string;
//   themeMode?: 'light' | 'dark' | 'auto';
// }

// const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };

// @Component({
//   selector: 'app-newsletter-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './newsletter-signup.component.html',
//   styleUrls: ['./newsletter-signup.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class NewsletterSignupComponent {
//   private fb = inject(FormBuilder);

//   @Input() set config(v: NewsletterConfig) { this._config.set(v ?? {}); }
//   private _config = signal<NewsletterConfig>({});

//   readonly cfg = computed(() => ({
//     title: this._config().title ?? 'Stay in the loop',
//     subtitle: this._config().subtitle ?? 'Get the latest deals, new arrivals, and exclusive offers straight to your inbox.',
//     placeholder: this._config().placeholder ?? 'Enter your email address',
//     buttonText: this._config().buttonText ?? 'Subscribe',
//     successMessage: this._config().successMessage ?? 'You\'re in! Check your inbox for a welcome email.',
//     paddingTop: this._config().paddingTop ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? ''
//   }));

//   readonly sectionStyle = computed(() => ({
//     'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   form = this.fb.group({
//     email: ['', [Validators.required, Validators.email]]
//   });

//   status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

//   get emailInvalid(): boolean {
//     const c = this.form.get('email')!;
//     return c.invalid && (c.dirty || c.touched);
//   }

//   submit(): void {
//     if (this.form.invalid) { this.form.markAllAsTouched(); return; }
//     this.status.set('submitting');
//     // Wire to real API endpoint here
//     setTimeout(() => { this.status.set('success'); }, 1200);
//   }

//   reset(): void { this.status.set('idle'); this.form.reset(); }
// }
