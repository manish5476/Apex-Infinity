import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './newsletter-signup.component.html',
  styleUrls: ['./newsletter-signup.component.scss']
})
export class NewsletterSignupComponent {
  @Input() config: any = {};

  private fb = inject(FormBuilder);

  // 1. Reactive Form Initialization
  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // 2. Modern Signal State
  isSubmitting = signal(false);
  subscribed = signal(false);

  // 3. Dynamic Styling (Theme Token Mapping)
  sectionStyles = computed(() => {
    const style: any = {};
    
    // Background Color (Fallback to secondary theme color)
    style['background-color'] = this.config.backgroundColor || 'var(--bg-secondary)';
    
    // Background Image (if provided)
    if (this.config.backgroundImage) {
        style['background-image'] = `url(${this.config.backgroundImage})`;
        style['background-size'] = 'cover';
        style['background-position'] = 'center';
    }

    // Padding Logic (Maps to your CSS Variables)
    const paddingMap: any = {
      'none': '0',
      'sm': 'var(--spacing-4xl)',
      'md': 'var(--spacing-6xl)',
      'lg': 'var(--spacing-8xl)'
    };

    // Default to 'lg' for a spacious premium look
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-7xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-7xl)';

    return style;
  });

  // 4. Submit Logic
  onSubmit() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    // Simulate API Call
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.subscribed.set(true);
      this.emailForm.reset();
      
      // Optional: Reset state after 5 seconds to allow another signup
      // setTimeout(() => this.subscribed.set(false), 5000);
    }, 1500);
  }
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// @Component({
//   selector: 'app-newsletter-signup',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './newsletter-signup.component.html',
//   styleUrls: ['./newsletter-signup.component.scss']
// })
// export class NewsletterSignupComponent {
//   @Input() config: any = {};

//   subscribed: any
//   emailForm: any

//   constructor(private fb: FormBuilder) { }
//   ngOnInit(): void {
//     this.subscribed = false;
//     this.emailForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]]
//     });
//   }

//   // Layout Logic
//   sectionStyle = computed(() => {
//     const style: any = {};
//     if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;

//     // Padding
//     const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '5rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '5rem';

//     return style;
//   });

//   onSubmit() {
//     if (this.emailForm.valid) {
//       // Simulate API call
//       setTimeout(() => {
//         this.subscribed = true;
//         this.emailForm.reset();
//       }, 800);
//     } else {
//       this.emailForm.markAllAsTouched();
//     }
//   }
// }