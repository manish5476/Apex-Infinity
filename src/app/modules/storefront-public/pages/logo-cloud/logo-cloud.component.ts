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

  // Dynamic Background Styles
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Background Color
    if (this.config.backgroundColor) {
      style['background-color'] = this.config.backgroundColor;
    }

    // Background Image
    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }

    // Padding
    const paddingMap: any = { 'sm': '2rem', 'md': '4rem', 'lg': '6rem', 'xl': '8rem' };
    style['padding-top'] = paddingMap[this.config.paddingTop] || '4rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '4rem';

    return style;
  });

  // Calculate Logo Opacity
  logoStyle = computed(() => {
    return {
      'opacity': this.config.opacity || 0.6,
      'filter': this.config.grayscale ? 'grayscale(100%)' : 'none'
    };
  });

  // Helper for Link Handling
  getLink(url: string | undefined): any[] | string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : [url]; // Use href for external, routerLink for internal
  }

  isExternal(url: string | undefined): boolean {
    return !!url && url.startsWith('http');
  }
}