import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-newsletter-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './newsletter-signup.component.html',
  styleUrls: ['./newsletter-signup.component.scss']
})
export class NewsletterSignupComponent {
  @Input() config: any = {};

  subscribed: any
  emailForm: any

  constructor(private fb: FormBuilder) { }
  ngOnInit(): void {
    this.subscribed = false;
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Layout Logic
  sectionStyle = computed(() => {
    const style: any = {};
    if (this.config.backgroundColor) style['background-color'] = this.config.backgroundColor;

    // Padding
    const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };
    style['padding-top'] = paddingMap[this.config.paddingTop] || '5rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '5rem';

    return style;
  });

  onSubmit() {
    if (this.emailForm.valid) {
      // Simulate API call
      setTimeout(() => {
        this.subscribed = true;
        this.emailForm.reset();
      }, 800);
    } else {
      this.emailForm.markAllAsTouched();
    }
  }
}