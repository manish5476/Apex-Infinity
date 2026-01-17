import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss'],
  animations: [
    // Staggered Text Entrance
    trigger('heroEntrance', [
      transition(':enter', [
        query('.hero-anim', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(200, [
            animate('1s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ])
      ])
    ])
  ]
})
export class HeroBannerComponent {
  @Input() config: any = {};

  // Map JSON height to CSS classes
  heightClass = computed(() => {
    switch (this.config.height) {
      case 'small': return 'min-h-[60vh]'; // Professional "Small"
      case 'medium': return 'min-h-[75vh]';
      case 'large': return 'min-h-screen';
      default: return 'min-h-[75vh]';
    }
  });

  // Map JSON alignment to CSS classes
  alignClass = computed(() => {
    switch (this.config.textAlign) {
      case 'center': return 'items-center text-center';
      case 'right': return 'items-end text-right';
      default: return 'items-start text-left'; // Default Left
    }
  });

  // Helper to ensure we don't render empty buttons
  get validButtons() {
    return this.config.ctaButtons?.filter((b: any) => b.text && b.url) || [];
  }
}

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
//     title: 'Make Something Colorful',
//     subtitle: 'Hover over the text to see the magic happen.',
//     backgroundImage: 'assets/hero-placeholder.jpg',
//     height: 'full',
//     textAlign: 'center',
//     overlayOpacity: 0.7, // Darker overlay to make text pop
//     ctaButtons: [
//       { text: 'Get Started', url: '/start', variant: 'primary' }
//     ]
//   };

//   // Sophisticated Color Palette (Not neon, but rich colors)
//   private palette = [
//     '#FFD700', // Gold
//     '#FF6B6B', // Soft Red
//     '#4ECDC4', // Teal
//     '#1A535C', // Deep Blueish Green
//     '#FF9F1C', // Orange
//     '#C7F464', // Lime
//     '#9D4EDD', // Violet
//     '#F72585', // Pink
//   ];

//   // Helper to split text into chars
//   get titleChars(): string[] {
//     return this.config.title ? this.config.title.split('') : [];
//   }

//   // Store active colors for each character index
//   activeColors: { [key: number]: string } = {};

//   // 1. Mouse Enter: Assign a random color
//   onHover(index: number) {
//     const randomColor = this.palette[Math.floor(Math.random() * this.palette.length)];
//     this.activeColors[index] = randomColor;
//   }

//   // 2. Mouse Leave: Clear the color (CSS transition handles the fade back)
//   onLeave(index: number) {
//     delete this.activeColors[index];
//   }

//   // CSS Class Helpers
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
//   title?: string;
//   subtitle?: string;
//   backgroundImage?: string;
//   height?: string;    // Widening this to string helps too
//   textAlign?: string; // Widening this to string helps too
//   overlayColor?: string;
//   overlayOpacity?: number;
//   ctaButtons?: Array<{
//     text: string;
//     url: string;
//     variant: string; // <--- Change this from the union to just 'string'
//   }>;
// }