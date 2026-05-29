import { Component, Input, OnInit, signal, computed, inject, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorefrontStateService } from '@core/services/storefront-state.service';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------
export interface ContactFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea';
  required: boolean;
  width: 'half' | 'full';
}

export interface ContactFormConfig {
  title?: string;
  subtitle?: string;
  description?: string;
  submitButtonText?: string;
  successMessage?: string;
  fields?: ContactFieldConfig[];
  design?: any;       // Upgraded: Handles customBackground, borderRadius, boxShadow
  typography?: any;   // Upgraded: Handles custom fonts and text colors
  paddingTop?: string;
  paddingBottom?: string;
  backgroundImage?: string;
}

const PADDING: Record<string, string> = {
  none: '0', sm: '4rem', md: '7rem', lg: '10rem', xl: '14rem'
};

const DEFAULT_FIELDS: ContactFieldConfig[] = [
  { name: 'name',    label: 'Full Name',     type: 'text',     required: true,  width: 'half' },
  { name: 'email',   label: 'Email Address', type: 'email',    required: true,  width: 'half' },
  { name: 'subject', label: 'Subject',       type: 'text',     required: false, width: 'full' },
  { name: 'message', label: 'Message',       type: 'textarea', required: true,  width: 'full' }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="cf-root" [ngStyle]="sectionStyle()">
      <div class="cf-glow cf-glow-tl" aria-hidden="true"></div>
      <div class="cf-glow cf-glow-br" aria-hidden="true"></div>

      @if (cfg().backgroundImage) {
        <div class="cf-bg-image" [style.background-image]="'url(' + cfg().backgroundImage + ')'"></div>
        <div class="cf-bg-overlay"></div>
      }

      <div class="cf-container">
        <div class="cf-layout">

          <div class="cf-info z-10 relative">
            <span class="cf-eyebrow" [ngStyle]="{'color': cfg().backgroundImage ? 'rgba(255,255,255,0.7)' : (cfg().typography?.headingColor || 'var(--accent-primary)')}">
              {{ cfg().subtitle }}
            </span>
            <h2 class="cf-title" [ngStyle]="headingStyle()">{{ cfg().title }}</h2>
            <p class="cf-desc" [ngStyle]="bodyStyle()">{{ cfg().description }}</p>

            <div class="cf-details">
              @if (orgContact()?.email) {
                <div class="cf-detail-item group">
                  <div class="cf-detail-icon"><i class="pi pi-envelope"></i></div>
                  <div class="cf-detail-text">
                    <span class="cf-detail-label">Email</span>
                    <a [href]="'mailto:' + orgContact()!.email" class="cf-detail-value" [ngStyle]="{'color': cfg().backgroundImage ? '#ffffff' : 'var(--text-primary)'}">
                      {{ orgContact()!.email }}
                    </a>
                  </div>
                </div>
              }

              @if (orgContact()?.phone) {
                <div class="cf-detail-item group">
                  <div class="cf-detail-icon"><i class="pi pi-phone"></i></div>
                  <div class="cf-detail-text">
                    <span class="cf-detail-label">Phone</span>
                    <a [href]="'tel:' + orgContact()!.phone" class="cf-detail-value" [ngStyle]="{'color': cfg().backgroundImage ? '#ffffff' : 'var(--text-primary)'}">
                      {{ orgContact()!.phone }}
                    </a>
                  </div>
                </div>
              }

              @if (orgContact()?.address) {
                <div class="cf-detail-item group">
                  <div class="cf-detail-icon"><i class="pi pi-map-marker"></i></div>
                  <div class="cf-detail-text">
                    <span class="cf-detail-label">Address</span>
                    <span class="cf-detail-value" [ngStyle]="{'color': cfg().backgroundImage ? '#ffffff' : 'var(--text-primary)'}">
                      {{ orgContact()!.address }}
                    </span>
                  </div>
                </div>
              }

              @if (!orgContact()?.email && !orgContact()?.phone) {
                <p class="cf-no-contact">Contact information not configured.</p>
              }
            </div>
          </div>

          <div class="cf-card z-10 relative"
               [ngStyle]="{
                 'border-radius': 'var(--ui-border-radius-' + (cfg().design?.borderRadius || '2xl') + ')',
                 'box-shadow': 'var(--shadow-' + (cfg().design?.boxShadow || 'xl') + ')'
               }">
            <div class="cf-card-accent" aria-hidden="true"></div>

            @if (status() === 'success') {
              <div class="cf-success">
                <div class="cf-success-icon"><i class="pi pi-check-circle"></i></div>
                <h3 class="cf-success-title" [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">Message Sent!</h3>
                <p class="cf-success-msg" [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)'}">{{ cfg().successMsg }}</p>
                <button (click)="resetForm()" class="cf-reset-btn" type="button">Send another message</button>
              </div>
            } @else {
              <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" novalidate>
                <div class="cf-fields">
                  @for (field of activeFields(); track field.name) {
                    <div class="cf-field-wrap" [class.half]="field.width === 'half'" [class.full]="field.width !== 'half'">
                      
                      @if (field.type === 'textarea') {
                        <div class="cf-input-group">
                          <textarea [formControlName]="field.name" class="cf-textarea" [class.is-error]="isInvalid(field.name)" placeholder=" " rows="4"
                                    [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)'}"></textarea>
                          <label class="cf-label">{{ field.label }} @if (field.required) { <span class="cf-required">*</span> }</label>
                          <div class="cf-focus-line" aria-hidden="true"></div>
                        </div>
                      } @else {
                        <div class="cf-input-group">
                          <input [type]="field.type" [formControlName]="field.name" class="cf-input" [class.is-error]="isInvalid(field.name)" placeholder=" "
                                 [ngStyle]="{'font-family': cfg().typography?.bodyFont || 'var(--font-body)'}" />
                          <label class="cf-label">{{ field.label }} @if (field.required) { <span class="cf-required">*</span> }</label>
                          <div class="cf-focus-line" aria-hidden="true"></div>
                        </div>
                      }

                      @if (isInvalid(field.name)) {
                        <span class="cf-error-msg" role="alert">
                          <i class="pi pi-exclamation-circle"></i>
                          @if (contactForm.get(field.name)?.errors?.['required']) { This field is required }
                          @else if (contactForm.get(field.name)?.errors?.['email']) { Please enter a valid email }
                        </span>
                      }
                    </div>
                  }
                </div>

                <button type="submit" class="cf-submit-btn" [disabled]="status() === 'submitting'">
                  @if (status() === 'submitting') {
                    <i class="pi pi-spin pi-spinner"></i><span>Sending…</span>
                  } @else {
                    <span [ngStyle]="{'font-family': cfg().typography?.headingFont || 'var(--font-heading)'}">{{ cfg().submitBtn }}</span>
                    <i class="pi pi-send"></i>
                  }
                </button>
              </form>
            }
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .cf-root { position: relative; overflow: hidden; background-color: transparent; width: 100%; }
    
    .cf-glow { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; filter: blur(100px); opacity: 0.06; }
    .cf-glow-tl { top: -15%; right: -5%; width: 600px; height: 600px; background: var(--accent-primary); }
    .cf-glow-br { bottom: -20%; left: -10%; width: 500px; height: 500px; background: var(--accent-secondary, var(--accent-primary)); }
    
    .cf-bg-image { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
    .cf-bg-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 1; }
    
    .cf-container { position: relative; z-index: 10; max-width: 1240px; margin: 0 auto; padding: 0 var(--spacing-2xl); }
    .cf-layout { display: grid; grid-template-columns: 1fr; gap: var(--spacing-4xl); align-items: start; }
    @media (min-width: 1024px) { .cf-layout { grid-template-columns: 1fr 1.3fr; gap: var(--spacing-5xl); } }

    .cf-info { display: flex; flex-direction: column; gap: var(--spacing-xl); }
    .cf-eyebrow { display: block; font-family: var(--font-mono); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; }
    .cf-title { margin: 0; font-size: clamp(28px, 4vw, 48px); font-weight: 700; line-height: 1.1; letter-spacing: -0.025em; }
    .cf-desc { margin: 0; font-size: var(--font-size-md); line-height: 1.7; max-width: 440px; }

    .cf-details { display: flex; flex-direction: column; gap: var(--spacing-lg); margin-top: var(--spacing-xl); }
    .cf-detail-item { display: flex; align-items: flex-start; gap: var(--spacing-md); transition: opacity 0.2s ease; }
    .cf-detail-item:hover { opacity: 0.85; }
    .cf-detail-icon { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; color: var(--accent-primary); flex-shrink: 0; transition: all 0.2s ease; }
    .cf-detail-item:hover .cf-detail-icon { background: var(--accent-primary); color: var(--text-primary); border-color: transparent; box-shadow: var(--shadow-md); }
    .cf-detail-icon i { font-size: 14px; }
    .cf-detail-text { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
    .cf-detail-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-tertiary); font-family: var(--font-mono); }
    .cf-detail-value { font-size: var(--font-size-sm); font-weight: 500; text-decoration: none; transition: color 0.15s ease; }
    .cf-detail-value:hover { color: var(--accent-primary) !important; }
    .cf-no-contact { font-size: var(--font-size-sm); color: var(--text-tertiary); font-style: italic; margin: 0; }

    .cf-card { background: var(--bg-secondary); border: 1px solid var(--border-secondary); padding: var(--spacing-3xl); position: relative; overflow: hidden; }
    @media (min-width: 768px) { .cf-card { padding: var(--spacing-4xl); } }
    .cf-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary, var(--accent-primary))); }

    .cf-fields { display: flex; flex-wrap: wrap; gap: var(--spacing-xl); margin-bottom: var(--spacing-xl); }
    .cf-field-wrap { width: 100%; }
    @media (min-width: 640px) { .cf-field-wrap.half { width: calc(50% - var(--spacing-xl) / 2); } }

    .cf-input-group { position: relative; display: flex; flex-direction: column; }
    .cf-input, .cf-textarea { width: 100%; background: var(--bg-primary); border: none; border-bottom: 1.5px solid var(--border-secondary); border-radius: 0; padding: 20px 4px 6px; font-size: var(--font-size-base); color: var(--text-primary); outline: none; transition: border-color 0.2s ease; box-sizing: border-box; -webkit-appearance: none; }
    .cf-input::placeholder, .cf-textarea::placeholder { color: transparent; }
    .cf-input.is-error, .cf-textarea.is-error { border-bottom-color: var(--color-error, #ef4444); }
    .cf-textarea { resize: vertical; min-height: 110px; }

    .cf-label { position: absolute; top: 18px; left: 4px; font-size: var(--font-size-sm); color: var(--text-tertiary); pointer-events: none; transform-origin: left top; transition: transform 0.2s ease, color 0.2s ease, font-size 0.2s ease; }
    .cf-required { color: var(--color-error, #ef4444); margin-left: 2px; }

    .cf-input:focus ~ .cf-label, .cf-input:not(:placeholder-shown) ~ .cf-label,
    .cf-textarea:focus ~ .cf-label, .cf-textarea:not(:placeholder-shown) ~ .cf-label { transform: translateY(-14px) scale(0.78); color: var(--text-secondary); font-weight: 700; letter-spacing: 0.4px; }

    .cf-focus-line { position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: var(--accent-primary); transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
    .cf-input:focus ~ .cf-label ~ .cf-focus-line, .cf-input:focus ~ .cf-focus-line,
    .cf-textarea:focus ~ .cf-focus-line { width: 100%; }

    .cf-error-msg { display: flex; align-items: center; gap: 4px; margin-top: 5px; font-size: 11px; color: var(--color-error, #ef4444); font-weight: 600; }
    .cf-error-msg i { font-size: 9px; }

    .cf-submit-btn { width: 100%; padding: var(--spacing-lg) var(--spacing-2xl); background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: var(--ui-border-radius-pill); font-size: var(--font-size-sm); font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm); transition: all 0.25s ease; }
    .cf-submit-btn:hover:not(:disabled) { background: var(--accent-primary); color: var(--text-primary); transform: translateY(-2px); box-shadow: var(--shadow-lg); }
    .cf-submit-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
    .cf-submit-btn:disabled { opacity: 0.65; cursor: wait; }

    .cf-success { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--spacing-4xl) 0; gap: var(--spacing-lg); animation: cf-fade-in 0.5s ease; }
    .cf-success-icon { width: 72px; height: 72px; border-radius: 50%; background: var(--color-success-bg, #ecfdf5); display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-sm); color: var(--color-success, #059669); font-size: 2rem; }
    .cf-success-title { margin: 0; font-size: var(--font-size-2xl); font-weight: 700; color: var(--text-primary); }
    .cf-success-msg { margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6; max-width: 320px; }
    .cf-reset-btn { background: none; border: none; color: var(--accent-primary); font-size: var(--font-size-sm); font-weight: 700; text-decoration: underline; cursor: pointer; transition: opacity 0.15s ease; }
    .cf-reset-btn:hover { opacity: 0.75; }

    @keyframes cf-fade-in {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ContactFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private stateService = inject(StorefrontStateService);

  @Input() set config(v: ContactFormConfig) {
    this._config.set(v ?? {});
    this._buildForm();
  }

  private _config = signal<ContactFormConfig>({});

  readonly cfg = computed(() => ({
    title: this._config().title ?? 'Get in Touch',
    subtitle: this._config().subtitle ?? 'Contact Us',
    description: this._config().description ?? "Have a question or proposal? Fill out the form and we'll get back to you within 24 hours.",
    submitBtn: this._config().submitButtonText ?? 'Send Message',
    successMsg: this._config().successMessage ?? "Thank you for reaching out. We'll be in touch shortly.",
    design: this._config().design,
    typography: this._config().typography,
    paddingTop: this._config().paddingTop ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundImage: this._config().backgroundImage ?? ''
  }));

  readonly activeFields = computed<ContactFieldConfig[]>(() => {
    const f = this._config().fields;
    return (Array.isArray(f) && f.length > 0) ? f : DEFAULT_FIELDS;
  });

  readonly orgContact = computed(() => this.stateService.organization()?.contact);

  readonly sectionStyle = computed(() => ({
    'padding-top': PADDING[this.cfg().paddingTop] ?? '10rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '10rem',
    'background-color': this.cfg().design?.customBackground || 'transparent'
  }));

  headingStyle() {
    return {
      'font-family': this.cfg().typography?.headingFont || 'var(--font-heading)',
      'color': this.cfg().backgroundImage ? '#ffffff' : (this.cfg().typography?.headingColor || 'var(--text-primary)')
    };
  }

  bodyStyle() {
    return {
      'font-family': this.cfg().typography?.bodyFont || 'var(--font-body)',
      'color': this.cfg().backgroundImage ? 'rgba(255, 255, 255, 0.8)' : (this.cfg().typography?.bodyColor || 'var(--text-secondary)')
    };
  }

  contactForm: FormGroup = this.fb.group({});
  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  ngOnInit(): void {
    this._buildForm();
  }

  private _buildForm(): void {
    const group: Record<string, any> = {};
    this.activeFields().forEach(f => {
      const v = [];
      if (f.required) v.push(Validators.required);
      if (f.type === 'email') v.push(Validators.email);
      group[f.name] = ['', v];
    });
    this.contactForm = this.fb.group(group);
  }

  isInvalid(name: string): boolean {
    const ctrl = this.contactForm.get(name);
    return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.status.set('submitting');
    setTimeout(() => {
      this.status.set('success');
      this.contactForm.reset();
    }, 1500);
  }

  resetForm(): void {
    this.status.set('idle');
    this.contactForm.reset();
  }
}


// import {
//   Component, Input, OnInit, signal, computed, inject,
//   ChangeDetectionStrategy
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { StorefrontStateService } from '@core/services/storefront-state.service';
// import { ContactFormConfig, ContactFieldConfig } from '@core/models/storefront.model';

// const PADDING: Record<string, string> = {
//   none: '0', sm: '4rem', md: '7rem', lg: '10rem', xl: '14rem'
// };

// const DEFAULT_FIELDS: ContactFieldConfig[] = [
//   { name: 'name',    label: 'Full Name',      type: 'text',     required: true,  width: 'half' },
//   { name: 'email',   label: 'Email Address',  type: 'email',    required: true,  width: 'half' },
//   { name: 'subject', label: 'Subject',        type: 'text',     required: false, width: 'full' },
//   { name: 'message', label: 'Message',        type: 'textarea', required: true,  width: 'full' }
// ];

// @Component({
//   selector: 'app-contact-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './contact-form.component.html',
//   styleUrls:   ['./contact-form.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class ContactFormComponent implements OnInit {

//   private fb           = inject(FormBuilder);
//   private stateService = inject(StorefrontStateService);

//   @Input() set config(v: ContactFormConfig) {
//     this._config.set(v ?? {});
//     // Rebuild form whenever config changes (fields may differ per page)
//     this._buildForm();
//   }

//   private _config = signal<ContactFormConfig>({});

//   readonly cfg = computed(() => ({
//     title:       this._config().title            ?? 'Get in Touch',
//     subtitle:    this._config().subtitle         ?? 'Contact Us',
//     description: this._config().description      ?? 'Have a question or proposal? Fill out the form and we\'ll get back to you within 24 hours.',
//     submitBtn:   this._config().submitButtonText ?? 'Send Message',
//     successMsg:  this._config().successMessage   ?? 'Thank you for reaching out. We\'ll be in touch shortly.',
//     paddingTop:    this._config().paddingTop    ?? 'lg',
//     paddingBottom: this._config().paddingBottom ?? 'lg',
//     backgroundColor: this._config().backgroundColor ?? '',
//     backgroundImage: this._config().backgroundImage ?? ''
//   }));

//   readonly activeFields = computed<ContactFieldConfig[]>(() => {
//     const f = this._config().fields;
//     return (Array.isArray(f) && f.length > 0) ? f : DEFAULT_FIELDS;
//   });

//   // Contact details from organisation state — no hardcodes
//   readonly orgContact = computed(() => this.stateService.organization()?.contact);

//   readonly sectionStyle = computed(() => ({
//     'padding-top':    PADDING[this.cfg().paddingTop]    ?? '10rem',
//     'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '10rem',
//     'background-color': this.cfg().backgroundColor || ''
//   }));

//   contactForm: FormGroup = this.fb.group({});
//   status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

//   ngOnInit(): void {
//     this._buildForm();
//   }

//   private _buildForm(): void {
//     const group: Record<string, any> = {};
//     this.activeFields().forEach(f => {
//       const v = [];
//       if (f.required)        v.push(Validators.required);
//       if (f.type === 'email') v.push(Validators.email);
//       group[f.name] = ['', v];
//     });
//     this.contactForm = this.fb.group(group);
//   }

//   isInvalid(name: string): boolean {
//     const ctrl = this.contactForm.get(name);
//     return !!(ctrl?.invalid && (ctrl.dirty || ctrl.touched));
//   }

//   onSubmit(): void {
//     if (this.contactForm.invalid) {
//       this.contactForm.markAllAsTouched();
//       return;
//     }
//     this.status.set('submitting');
//     // Wire to real API here — currently simulated
//     setTimeout(() => {
//       this.status.set('success');
//       this.contactForm.reset();
//     }, 1500);
//   }

//   resetForm(): void {
//     this.status.set('idle');
//     this.contactForm.reset();
//   }
// }
