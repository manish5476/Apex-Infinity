import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss']
})
export class HeroBannerComponent {
  @Input() config: HeroConfig = {
    title: 'Make Something Colorful',
    subtitle: 'Hover over the text to see the magic happen.',
    backgroundImage: 'assets/hero-placeholder.jpg',
    height: 'full',
    textAlign: 'center',
    overlayOpacity: 0.7, // Darker overlay to make text pop
    ctaButtons: [
      { text: 'Get Started', url: '/start', variant: 'primary' }
    ]
  };

  // Sophisticated Color Palette (Not neon, but rich colors)
  private palette = [
    '#FFD700', // Gold
    '#FF6B6B', // Soft Red
    '#4ECDC4', // Teal
    '#1A535C', // Deep Blueish Green
    '#FF9F1C', // Orange
    '#C7F464', // Lime
    '#9D4EDD', // Violet
    '#F72585', // Pink
  ];

  // Helper to split text into chars
  get titleChars(): string[] {
    return this.config.title ? this.config.title.split('') : [];
  }

  // Store active colors for each character index
  activeColors: { [key: number]: string } = {};

  // 1. Mouse Enter: Assign a random color
  onHover(index: number) {
    const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
    this.activeColors[index] = randomColor;
  }

  // 2. Mouse Leave: Clear the color (CSS transition handles the fade back)
  onLeave(index: number) {
    delete this.activeColors[index];
  }

  // CSS Class Helpers
  get heightClass(): string {
    switch (this.config.height) {
      case 'small': return 'h-small';
      case 'large': return 'h-large';
      case 'full': return 'h-full-screen';
      default: return 'h-medium';
    }
  }

  get alignClass(): string {
    switch (this.config.textAlign) {
      case 'left': return 'align-left';
      case 'right': return 'align-right';
      default: return 'align-center';
    }
  }
}
export interface HeroConfig {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  height?: string;    // Widening this to string helps too
  textAlign?: string; // Widening this to string helps too
  overlayColor?: string;
  overlayOpacity?: number;
  ctaButtons?: Array<{
    text: string;
    url: string;
    variant: string; // <--- Change this from the union to just 'string'
  }>;
}
// export interface HeroConfig {
//   title: string;
//   subtitle?: string;
//   backgroundImage: string;
//   height?: 'small' | 'medium' | 'large' | 'full';
//   textAlign?: 'left' | 'center' | 'right';
//   overlayColor?: string;
//   overlayOpacity?: number;
//   ctaButtons?: Array<{
//     text: string;
//     url: string;
//     variant: 'primary' | 'secondary' | 'outline' | 'glass';
//   }>;
// }
// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-hero-banner',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './hero-banner.component.html',
//   styleUrls: ['./hero-banner.component.scss']
// })
// export class HeroBannerComponent {
//   @Input() config: HeroConfig = {
//     title: 'Elevate Your Lifestyle',
//     subtitle: 'Discover the latest collection of premium electronics.',
//     backgroundImage: 'assets/hero-placeholder.jpg',
//     height: 'medium',
//     textAlign: 'center',
//     overlayOpacity: 0.4,
//     ctaButtons: []
//   };

//   // 1. Helper to split title into characters for animation
//   get titleChars(): string[] {
//     return this.config.title ? this.config.title.split('') : [];
//   }

//   get heightClass(): string {
//     switch (this.config.height) {
//       case 'small': return 'h-small';
//       case 'large': return 'h-large';
//       case 'full': return 'h-full-screen';
//       default: return 'h-medium';
//     }
//   }

//   get alignClass(): string {
//     switch (this.config.textAlign) {
//       case 'left': return 'align-left';
//       case 'right': return 'align-right';
//       default: return 'align-center';
//     }
//   }
// }

// export interface HeroConfig {
//   title: string;
//   subtitle?: string;
//   backgroundImage: string;
//   height?: 'small' | 'medium' | 'large' | 'full';
//   textAlign?: 'left' | 'center' | 'right';
//   overlayColor?: string;
//   overlayOpacity?: number;
//   ctaButtons?: Array<{
//     text: string;
//     url: string;
//     variant: 'primary' | 'secondary' | 'outline' | 'glass';
//   }>;
// }

// // import { Component, Input } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule } from '@angular/router';

// // @Component({
// //   selector: 'app-hero-banner',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule],
// //   templateUrl: './hero-banner.component.html',
// //   styleUrls: ['./hero-banner.component.scss']
// // })
// // export class HeroBannerComponent {
// //   @Input() config: HeroConfig = {
// //     title: 'Elevate Your Lifestyle',
// //     subtitle: 'Discover the latest collection of premium electronics.',
// //     backgroundImage: 'assets/hero-placeholder.jpg',
// //     height: 'medium',
// //     textAlign: 'center',
// //     overlayOpacity: 0.4,
// //     ctaButtons: []
// //   };

// //   // Helper to determine height class based on config
// //   get heightClass(): string {
// //     switch (this.config.height) {
// //       case 'small': return 'h-small';
// //       case 'large': return 'h-large';
// //       case 'full': return 'h-full-screen';
// //       default: return 'h-medium';
// //     }
// //   }

// //   // Helper for alignment class
// //   get alignClass(): string {
// //     switch (this.config.textAlign) {
// //       case 'left': return 'align-left';
// //       case 'right': return 'align-right';
// //       default: return 'align-center';
// //     }
// //   }
// // }

// // // Interface for type safety
// // export interface HeroConfig {
// //   title: string;
// //   subtitle?: string;
// //   backgroundImage: string;
// //   height?: 'small' | 'medium' | 'large' | 'full';
// //   textAlign?: 'left' | 'center' | 'right';
// //   overlayColor?: string;
// //   overlayOpacity?: number;
// //   ctaButtons?: Array<{
// //     text: string;
// //     url: string;
// //     variant: 'primary' | 'secondary' | 'outline' | 'glass';
// //   }>;
// // }
