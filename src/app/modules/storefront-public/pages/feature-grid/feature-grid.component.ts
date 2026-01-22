import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feature-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './feature-grid.component.html',
  styleUrls: ['./feature-grid.component.scss']
})
export class FeatureGridComponent {
  @Input() config: any = {};

  // Compute Grid Columns (CSS Variable)
  gridStyle = computed(() => {
    const cols = this.config.columns || 3;
    return {
      '--cols': cols,
      '--gap': '2rem'
    };
  });

  // Background Style (Color or Image)
  backgroundStyle = computed(() => {
    const style: any = {};
    
    // Base Color
    if (this.config.backgroundColor) {
      style['background-color'] = this.config.backgroundColor;
    }

    // Background Image (with overlay logic)
    if (this.config.backgroundImage) {
      style['background-image'] = `url(${this.config.backgroundImage})`;
      style['background-size'] = 'cover';
      style['background-position'] = 'center';
    }

    // Padding Logic
    const paddingMap: any = { 'sm': '3rem', 'md': '5rem', 'lg': '8rem' };
    style['padding-top'] = paddingMap[this.config.paddingTop] || '5rem';
    style['padding-bottom'] = paddingMap[this.config.paddingBottom] || '5rem';

    return style;
  });

  // Helper for internal/external links
  getLink(url: string): string | any[] {
    if (!url) return [];
    if (url.startsWith('http')) return url; // Handle in template via href if needed, but routerLink usually fine for internal
    return [url];
  }
}