import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-content.component.html',
  styleUrls: ['./text-content.component.scss']
})
export class TextContentComponent {
  @Input() config: any = {};

  // Background Styles
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Background Color
    style['background-color'] = this.config.backgroundColor || 'var(--bg-primary)';

    // Background Image
    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
      // Fixed = Parallax Effect
      style['background-attachment'] = 'fixed'; 
    }

    // Padding Logic
    const paddingMap: any = { 
      'none': '0', 
      'sm': 'var(--spacing-3xl)', 
      'md': 'var(--spacing-6xl)', 
      'lg': 'var(--spacing-8xl)', 
      'xl': 'var(--spacing-9xl)' 
    };
    
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-6xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-6xl)';

    return style;
  });

  // Container Width
  maxWidthClass = computed(() => {
    switch (this.config.maxWidth) {
      case 'narrow': return 'max-w-2xl'; // ~672px (Article)
      case 'medium': return 'max-w-4xl'; // ~896px (Standard)
      case 'wide': return 'max-w-6xl';   // ~1152px
      case 'full': return 'max-w-full';
      default: return 'max-w-4xl';
    }
  });

  // Text Alignment
  alignmentClass = computed(() => {
    switch (this.config.alignment) {
      case 'center': return 'text-center mx-auto';
      case 'right': return 'text-right ml-auto';
      default: return 'text-left mr-auto';
    }
  });

  // Text Color Theme
  textClass = computed(() => {
    return this.config.theme === 'dark' 
      ? 'text-white' // Assuming dark background
      : 'text-dark'; // Use default dark text var
  });
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-text-content',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './text-content.component.html',
//   styleUrls: ['./text-content.component.scss']
// })
// export class TextContentComponent {
//   @Input() config: any = {};

//   // Dynamic Background Styles
//   backgroundStyle = computed(() => {
//     const style: any = {};
    
//     // Background Color
//     if (this.config.backgroundColor) {
//       style['background-color'] = this.config.backgroundColor;
//     }

//     // Background Image
//     if (this.config.backgroundImage) {
//       style['background-image'] = `url(${this.config.backgroundImage})`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//       style['background-attachment'] = 'scroll'; // Change to 'fixed' for parallax effect
//     }

//     // Padding
//     const paddingMap: any = { 'none': '0', 'sm': '3rem', 'md': '6rem', 'lg': '9rem', 'xl': '12rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '6rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '6rem';

//     return style;
//   });

//   // Container Max Width Calculation
//   maxWidthClass = computed(() => {
//     switch (this.config.maxWidth) {
//       case 'narrow': return 'max-w-2xl'; // 672px (Blog reading width)
//       case 'medium': return 'max-w-4xl'; // 896px (Standard)
//       case 'wide': return 'max-w-6xl';   // 1152px
//       case 'full': return 'max-w-full';
//       default: return 'max-w-4xl';
//     }
//   });

//   // Alignment Logic
//   alignmentClass = computed(() => {
//     switch (this.config.alignment) {
//       case 'center': return 'text-center mx-auto';
//       case 'right': return 'text-right ml-auto';
//       default: return 'text-left mr-auto';
//     }
//   });

//   // Theme Text Color Logic
//   textClass = computed(() => {
//     return this.config.theme === 'dark' ? 'text-white' : 'text-slate-900';
//   });
// }