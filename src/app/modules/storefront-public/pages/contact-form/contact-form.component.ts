import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent {
  @Input() config: any = {};

  contactForm: FormGroup;
  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Default fields if JSON 'fields' array is empty
  defaultFields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, width: 'half' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, width: 'half' },
    { name: 'subject', label: 'Subject', type: 'text', required: false, width: 'full' },
    { name: 'message', label: 'Your Message', type: 'textarea', required: true, width: 'full' }
  ];

  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({});
  }

  ngOnInit() {
    this.initForm();
  }

  // Combine config fields with defaults if needed
  activeFields = computed(() => {
    return (this.config.fields && this.config.fields.length > 0) 
      ? this.config.fields 
      : this.defaultFields;
  });

  initForm() {
    const group: any = {};
    this.activeFields().forEach((field: any) => {
      const validators = field.required ? [Validators.required] : [];
      if (field.type === 'email') validators.push(Validators.email);
      group[field.name] = ['', validators];
    });
    this.contactForm = this.fb.group(group);
  }

  backgroundStyle = computed(() => {
    const style: any = {};
    if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;
    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }
    const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };
    style['padding-top'] = paddingMap[this.config.paddingTop] || '6rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '6rem';
    return style;
  });

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.status.set('submitting');

    // Simulate API Call
    setTimeout(() => {
      this.status.set('success');
      this.contactForm.reset();
      
      // Auto-reset status after 5 seconds so user can send another
      setTimeout(() => this.status.set('idle'), 5000);
    }, 1500);
  }
}