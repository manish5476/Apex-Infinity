// newsletter-signup.component.ts
import {
  Component, Input, signal, computed,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

export interface NewsletterConfig {
  title?:         string;
  subtitle?:      string;
  placeholder?:   string;
  buttonText?:    string;
  successMessage?:string;
  paddingTop?:    'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?:string;
  themeMode?:     'light' | 'dark' | 'auto';
}

const PADDING: Record<string, string> = { none:'0', sm:'3rem', md:'5rem', lg:'8rem', xl:'11rem' };

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './newsletter-signup.component.html',
  styleUrls:   ['./newsletter-signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsletterSignupComponent {
  private fb = inject(FormBuilder);

  @Input() set config(v: NewsletterConfig) { this._config.set(v ?? {}); }
  private _config = signal<NewsletterConfig>({});

  readonly cfg = computed(() => ({
    title:          this._config().title          ?? 'Stay in the loop',
    subtitle:       this._config().subtitle       ?? 'Get the latest deals, new arrivals, and exclusive offers straight to your inbox.',
    placeholder:    this._config().placeholder    ?? 'Enter your email address',
    buttonText:     this._config().buttonText     ?? 'Subscribe',
    successMessage: this._config().successMessage ?? 'You\'re in! Check your inbox for a welcome email.',
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? '8rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '8rem',
    'background-color': this.cfg().backgroundColor || ''
  }));

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
    // Wire to real API endpoint here
    setTimeout(() => { this.status.set('success'); }, 1200);
  }

  reset(): void { this.status.set('idle'); this.form.reset(); }
}

// import { Component, Input, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { NewsletterSignupConfig } from '@core/models/storefront.model';

// @Component({
//   selector: 'app-newsletter-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './newsletter-signup.component.html',
//   styleUrls: ['./newsletter-signup.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class NewsletterSignupComponent {
//   @Input() set config(v: NewsletterSignupConfig) { this._config.set(v ?? {}); }
//   private _config = signal<NewsletterSignupConfig>({});

//   private fb = inject(FormBuilder);

//   // 1. Reactive Form Initialization
//   emailForm: FormGroup = this.fb.group({
//     email: ['', [Validators.required, Validators.email]]
//   });

//   // 2. Modern Signal State
//   isSubmitting = signal(false);
//   subscribed = signal(false);

//   readonly cfg = computed(() => ({
//     title:           this._config().title           ?? 'Join Our Community',
//     description:     this._config().description     ?? 'Stay updated with our latest news and offers.',
//     buttonText:      this._config().buttonText      ?? 'Subscribe',
//     layout:          this._config().layout          ?? 'center',
//     placeholder:     this._config().placeholder     ?? 'Enter your email address',
//     disclaimer:      this._config().disclaimer      ?? 'No spam. Unsubscribe anytime.',
//     paddingTop:      this._config().paddingTop      ?? 'lg',
//     paddingBottom:   this._config().paddingBottom   ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? 'var(--bg-secondary)',
//     themeMode:       this._config().themeMode       ?? 'auto',
//   }));

//   // 3. Dynamic Styling (Theme Token Mapping)
//   readonly paddingMap: Record<string, string> = {
//     'none': '0',
//     'sm': 'var(--spacing-4xl)',
//     'md': 'var(--spacing-6xl)',
//     'lg': 'var(--spacing-8xl)',
//     'xl': 'var(--spacing-10xl)' // Optional scaling
//   };

//   readonly sectionStyles = computed(() => {
//     return {
//       'background-color': this.cfg().backgroundColor,
//       'padding-top':      this.paddingMap[this.cfg().paddingTop]    ?? this.paddingMap['lg'],
//       'padding-bottom':   this.paddingMap[this.cfg().paddingBottom] ?? this.paddingMap['lg']
//     };
//   });

//   // 4. Submit Logic
//   onSubmit() {
//     if (this.emailForm.invalid) {
//       this.emailForm.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);

//     // Simulate API Call
//     setTimeout(() => {
//       this.isSubmitting.set(false);
//       this.subscribed.set(true);
//       this.emailForm.reset();
      
//       // Optional: Reset state after 5 seconds to allow another signup
//       // setTimeout(() => this.subscribed.set(false), 5000);
//     }, 1500);
//   }
// }