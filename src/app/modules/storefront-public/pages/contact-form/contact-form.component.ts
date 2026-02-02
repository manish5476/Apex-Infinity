import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required?: boolean;
  width?: 'full' | 'half';
}

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss']
})
export class ContactFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() config: any = {};

  contactForm: FormGroup = this.fb.group({});
  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  readonly defaultFields: FormFieldConfig[] = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, width: 'half' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, width: 'half' },
    { name: 'subject', label: 'Subject', type: 'text', required: false, width: 'full' },
    { name: 'message', label: 'Your Message', type: 'textarea', required: true, width: 'full' }
  ];

  activeFields = computed<FormFieldConfig[]>(() => {
    return (this.config.fields && this.config.fields.length > 0) 
      ? this.config.fields 
      : this.defaultFields;
  });

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const group: any = {};
    this.activeFields().forEach(field => {
      const validators = [];
      if (field.required) validators.push(Validators.required);
      if (field.type === 'email') validators.push(Validators.email);
      group[field.name] = ['', validators];
    });
    this.contactForm = this.fb.group(group);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ✅ INCREASED HEIGHT LOGIC HERE
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Background handling
    style['background-color'] = this.config.backgroundColor || 'var(--bg-primary)';
    
    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }

    // UPDATED PADDING MAP (Larger values)
    const paddingMap: any = { 
        'none': '0',
        'sm': '4rem',   // ~64px
        'md': '8rem',   // ~128px (Standard Premium Height)
        'lg': '12rem',  // ~192px (Tall)
        'xl': '16rem'   // ~256px (Very Tall)
    };
    
    // Default to '8rem' if not specified
    style['padding-top'] = paddingMap[this.config.paddingTop] || '8rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '8rem';
    
    // Optional: Enforce a minimum height for the whole section
    style['min-height'] = '800px'; 

    return style;
  });

  onSubmit() {
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
}
// import { Component, Input, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// @Component({
//   selector: 'app-contact-form',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './contact-form.component.html',
//   styleUrls: ['./contact-form.component.scss']
// })
// export class ContactFormComponent {
//   @Input() config: any = {};

//   contactForm: FormGroup;
//   status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

//   // Default fields if JSON 'fields' array is empty
//   defaultFields = [
//     { name: 'name', label: 'Full Name', type: 'text', required: true, width: 'half' },
//     { name: 'email', label: 'Email Address', type: 'email', required: true, width: 'half' },
//     { name: 'subject', label: 'Subject', type: 'text', required: false, width: 'full' },
//     { name: 'message', label: 'Your Message', type: 'textarea', required: true, width: 'full' }
//   ];

//   constructor(private fb: FormBuilder) {
//     this.contactForm = this.fb.group({});
//   }

//   ngOnInit() {
//     this.initForm();
//   }

//   // Combine config fields with defaults if needed
//   activeFields = computed(() => {
//     return (this.config.fields && this.config.fields.length > 0) 
//       ? this.config.fields 
//       : this.defaultFields;
//   });

//   initForm() {
//     const group: any = {};
//     this.activeFields().forEach((field: any) => {
//       const validators = field.required ? [Validators.required] : [];
//       if (field.type === 'email') validators.push(Validators.email);
//       group[field.name] = ['', validators];
//     });
//     this.contactForm = this.fb.group(group);
//   }

//   backgroundStyle = computed(() => {
//     const style: any = {};
//     if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;
//     if (this.config.backgroundImage) {
//       style['background-image'] = `url(${this.config.backgroundImage})`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//     }
//     const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '6rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '6rem';
//     return style;
//   });

//   onSubmit() {
//     if (this.contactForm.invalid) {
//       this.contactForm.markAllAsTouched();
//       return;
//     }

//     this.status.set('submitting');

//     // Simulate API Call
//     setTimeout(() => {
//       this.status.set('success');
//       this.contactForm.reset();
      
//       // Auto-reset status after 5 seconds so user can send another
//       setTimeout(() => this.status.set('idle'), 5000);
//     }, 1500);
//   }
// }