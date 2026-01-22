import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-logo-cloud',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './logo-cloud.component.html',
  styleUrls: ['./logo-cloud.component.scss']
})
export class LogoCloudComponent {
  @Input() config: any = {};

  // Computed Styles for the container
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // 1. Background Color
    if (this.config.backgroundColor) {
      style['background-color'] = this.config.backgroundColor;
    }

    // 2. Background Image (Added quotes to handle URLs safely)
    if (this.config.backgroundImage) {
      style['background-image'] = `url('${this.config.backgroundImage}')`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
      style['background-repeat'] = 'no-repeat';
    }

    // 3. Spacing
    const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '7rem' };
    style['padding-top'] = paddingMap[this.config.paddingTop] || '5rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '5rem';

    return style;
  });

  // Logo Filters (Grayscale + Opacity)
  logoStyle = computed(() => {
    return {
      'opacity': this.config.opacity || 0.7,
      'filter': this.config.grayscale ? 'grayscale(100%) contrast(80%)' : 'none'
    };
  });

  getLink(url: string | undefined): any[] | string | undefined {
    if (!url) return undefined;
    return url.startsWith('http') ? url : [url];
  }

  isExternal(url: string | undefined): boolean {
    return !!url && url.startsWith('http');
  }
}

// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-logo-cloud',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './logo-cloud.component.html',
//   styleUrls: ['./logo-cloud.component.scss']
// })
// export class LogoCloudComponent {
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
//     }

//     // Padding
//     const paddingMap: any = { 'sm': '2rem', 'md': '4rem', 'lg': '6rem', 'xl': '8rem' };
//     style['padding-top'] = paddingMap[this.config.paddingTop] || '4rem';
//     style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '4rem';

//     return style;
//   });

//   // Calculate Logo Opacity
//   logoStyle = computed(() => {
//     return {
//       'opacity': this.config.opacity || 0.6,
//       'filter': this.config.grayscale ? 'grayscale(100%)' : 'none'
//     };
//   });

//   // Helper for Link Handling
//   getLink(url: string | undefined): any[] | string | null {
//     if (!url) return null;
//     return url.startsWith('http') ? url : [url]; // Use href for external, routerLink for internal
//   }

//   isExternal(url: string | undefined): boolean {
//     return !!url && url.startsWith('http');
//   }
// }