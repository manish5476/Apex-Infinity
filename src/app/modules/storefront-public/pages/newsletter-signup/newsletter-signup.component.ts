// newsletter-signup.component.ts
import {
  Component, Input, signal, computed,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

export interface NewsletterConfig {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  paddingTop?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  paddingBottom?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  backgroundColor?: string;
  themeMode?: 'light' | 'dark' | 'auto';
}

const PADDING: Record<string, string> = { none: '0', sm: '3rem', md: '5rem', lg: '8rem', xl: '11rem' };

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './newsletter-signup.component.html',
  styleUrls: ['./newsletter-signup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? ''
  }));

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '8rem',
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
