import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-split-content',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './split-content.component.html',
  styleUrls: ['./split-content.component.scss']
})
export class SplitContentComponent {
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
      style['background-attachment'] = 'fixed'; // Parallax effect
    }
    
    // Padding Logic
    const paddingMap: any = { 
        'sm': 'var(--spacing-3xl)', 
        'md': 'var(--spacing-5xl)', 
        'lg': 'var(--spacing-7xl)' 
    };
    
    style['padding-top'] = paddingMap[this.config.paddingTop] || 'var(--spacing-5xl)';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || 'var(--spacing-5xl)';
    
    return style;
  });

  // Helper for CTA Link
  getLink(url: string): any[] {
    if (!url) return [];
    // If internal, return array for routerLink.
    return [url];
  }
  
  isExternalLink(url: string): boolean {
    return !!url && (url.startsWith('http') || url.startsWith('www'));
  }
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-split-content',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './split-content.component.html',
//   styleUrls: ['./split-content.component.scss']
// })
// export class SplitContentComponent {
//   @Input() config: any = {};

//   // Background Styles
//   backgroundStyle = computed(() => {
//     const style: any = {};
//     if (this.config.backgroundColor) {
//       style['background-color'] = this.config.backgroundColor;
//     }
//     // Only use background image if it's meant for the SECTION bg, not the split image
//     if (this.config.backgroundImage) {
//       style['background-image'] = `url(${this.config.backgroundImage})`;
//       style['background-size'] = 'cover';
//       style['background-position'] = 'center';
//     }
    
//     const paddingMap: any = { 'sm': '3rem', 'md': '6rem', 'lg': '9rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '6rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '6rem';
    
//     return style;
//   });

//   // Layout Logic (Row vs Row-Reverse)
//   layoutClass = computed(() => {
//     return this.config.imagePosition === 'right' 
//       ? 'lg:flex-row-reverse' 
//       : 'lg:flex-row';
//   });

//   // Helper for CTA Link
//   getLink(url: string): any[] | string {
//     if (!url) return [];
//     return url.startsWith('http') ? url : [url];
//   }
  
//   isExternalLink(url: string): boolean {
//     return url?.startsWith('http');
//   }
// }