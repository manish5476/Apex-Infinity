import {
  Component, Input, OnInit, signal, computed, inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorefrontStateService } from '@core/services/storefront-state.service';
import { ContactFormConfig, ContactFieldConfig } from '@core/models/storefront.model';

const PADDING: Record<string, string> = {
  none: '0', sm: '4rem', md: '7rem', lg: '10rem', xl: '14rem'
};

const DEFAULT_FIELDS: ContactFieldConfig[] = [
  { name: 'name',    label: 'Full Name',      type: 'text',     required: true,  width: 'half' },
  { name: 'email',   label: 'Email Address',  type: 'email',    required: true,  width: 'half' },
  { name: 'subject', label: 'Subject',        type: 'text',     required: false, width: 'full' },
  { name: 'message', label: 'Message',        type: 'textarea', required: true,  width: 'full' }
];

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrls:   ['./contact-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactFormComponent implements OnInit {

  private fb           = inject(FormBuilder);
  private stateService = inject(StorefrontStateService);

  @Input() set config(v: ContactFormConfig) {
    this._config.set(v ?? {});
    // Rebuild form whenever config changes (fields may differ per page)
    this._buildForm();
  }

  private _config = signal<ContactFormConfig>({});

  readonly cfg = computed(() => ({
    title:       this._config().title            ?? 'Get in Touch',
    subtitle:    this._config().subtitle         ?? 'Contact Us',
    description: this._config().description      ?? 'Have a question or proposal? Fill out the form and we\'ll get back to you within 24 hours.',
    submitBtn:   this._config().submitButtonText ?? 'Send Message',
    successMsg:  this._config().successMessage   ?? 'Thank you for reaching out. We\'ll be in touch shortly.',
    paddingTop:    this._config().paddingTop    ?? 'lg',
    paddingBottom: this._config().paddingBottom ?? 'lg',
    backgroundColor: this._config().backgroundColor ?? '',
    backgroundImage: this._config().backgroundImage ?? ''
  }));

  readonly activeFields = computed<ContactFieldConfig[]>(() => {
    const f = this._config().fields;
    return (Array.isArray(f) && f.length > 0) ? f : DEFAULT_FIELDS;
  });

  // Contact details from organisation state — no hardcodes
  readonly orgContact = computed(() => this.stateService.organization()?.contact);

  readonly sectionStyle = computed(() => ({
    'padding-top':    PADDING[this.cfg().paddingTop]    ?? '10rem',
    'padding-bottom': PADDING[this.cfg().paddingBottom] ?? '10rem',
    'background-color': this.cfg().backgroundColor || ''
  }));

  contactForm: FormGroup = this.fb.group({});
  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  ngOnInit(): void {
    this._buildForm();
  }

  private _buildForm(): void {
    const group: Record<string, any> = {};
    this.activeFields().forEach(f => {
      const v = [];
      if (f.required)        v.push(Validators.required);
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
    // Wire to real API here — currently simulated
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