import { Component, Input, computed } from '@angular/core';
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
    trigger('heroAnim', [
      transition(':enter', [
        query('.anim-target', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(150, [
            animate('1s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class HeroBannerComponent {
  @Input() config: any = {};

  // Determine if we render <video> or <img>
  get isVideo(): boolean {
    return this.config.mediaType === 'video';
  }

  // Use the videoUrl key for both types as requested
  get mediaSource(): string {
    return this.config.videoUrl;
  }

  // Resolve Height Class
  heightClass = computed(() => {
    const h = this.config.height || 'medium';
    return `h-${h}`;
  });

  // Resolve Alignment Class
  alignmentClass = computed(() => {
    const align = this.config.textAlign || 'center';
    return `align-${align}`;
  });

  // Inject dynamic theme colors into CSS variables
  get dynamicThemeStyles() {
    return {
      '--accent-primary': this.config.theme?.primaryColor || '#3B82F6',
      '--accent-secondary': this.config.theme?.secondaryColor || '#10B981',
      '--ui-border-radius': this.config.theme?.borderRadius === 'md' ? '12px' : '4px'
    };
  }
}
// import { Component, Input, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// @Component({
//   selector: 'app-hero-banner',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './hero-banner.component.html',
//   styleUrls: ['./hero-banner.component.scss'],
//   animations: [
//     trigger('heroAnim', [
//       transition(':enter', [
//         query('.anim-target', [
//           style({ opacity: 0, transform: 'translateY(30px)' }),
//           stagger(150, [
//             animate('1s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
//           ])
//         ], { optional: true })
//       ])
//     ])
//   ]
// })
// export class HeroBannerComponent {
//   @Input() config: any = {};

//   // Height Logic
//   heightClass = computed(() => {
//     switch (this.config.height) {
//       case 'small': return 'h-small';
//       case 'medium': return 'h-medium';
//       case 'large': return 'h-large';
//       case 'full_screen': return 'h-full';
//       case 'full': return 'h-full';
//       default: return 'h-medium';
//     }
//   });

//   // Alignment Logic
//   alignmentClass = computed(() => {
//     switch (this.config.textAlign) {
//       case 'center': return 'align-center';
//       case 'right': return 'align-right';
//       default: return 'align-left';
//     }
//   });

//   // Container Width Logic
//   containerClass = computed(() => {
//     switch (this.config.containerWidth) {
//       case 'narrow': return 'w-narrow';
//       case 'full': return 'w-full';
//       default: return 'w-standard';
//     }
//   });

//   get hasButtons() {
//     return this.config.ctaButtons && this.config.ctaButtons.length > 0;
//   }
// }

// // import { Component, Input, computed } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule } from '@angular/router';
// // import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// // @Component({
// //   selector: 'app-hero-banner',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule],
// //   templateUrl: './hero-banner.component.html',
// //   styleUrls: ['./hero-banner.component.scss'], // Linking the new styles
// //   animations: [
// //     trigger('heroAnim', [
// //       transition(':enter', [
// //         query('.anim-target', [
// //           style({ opacity: 0, transform: 'translateY(30px)' }),
// //           stagger(150, [
// //             animate('1s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
// //           ])
// //         ], { optional: true })
// //       ])
// //     ])
// //   ]
// // })
// // export class HeroBannerComponent {
// //   @Input() config: any = {};

// //   minHeightClass = computed(() => {
// //     switch (this.config.height) {
// //       case 'small': return 'min-h-[50vh] md:min-h-[60vh]';
// //       case 'medium': return 'min-h-[65vh] md:min-h-[75vh]';
// //       case 'large': return 'min-h-[85vh] md:min-h-[90vh]';
// //       case 'full_screen': return 'min-h-[90vh] md:min-h-screen';
// //       case 'full': return 'min-h-[90vh] md:min-h-screen'; // Legacy support
// //       default: return 'min-h-[65vh] md:min-h-[75vh]';
// //     }
// //   });

// //   alignmentClasses = computed(() => {
// //     switch (this.config.textAlign) {
// //       case 'center': return 'items-center text-center';
// //       case 'right': return 'items-end text-right';
// //       default: return 'items-start text-left';
// //     }
// //   });

// //   containerClass = computed(() => {
// //     switch (this.config.containerWidth) {
// //       case 'narrow': return 'max-w-4xl';
// //       case 'full': return 'max-w-full px-6 md:px-12';
// //       default: return 'max-w-7xl px-6 md:px-12';
// //     }
// //   });

// //   get hasButtons() {
// //     return this.config.ctaButtons && this.config.ctaButtons.length > 0;
// //   }
// // }

// // // import { Component, Input, computed } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { RouterModule } from '@angular/router';
// // // import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// // // @Component({
// // //   selector: 'app-hero-banner',
// // //   standalone: true,
// // //   imports: [CommonModule, RouterModule],
// // //   templateUrl: './hero-banner.component.html',
// // //   styleUrls: ['./hero-banner.component.scss'],
// // //   animations: [
// // //     trigger('heroAnim', [
// // //       transition(':enter', [
// // //         query('.anim-target', [
// // //           style({ opacity: 0, transform: 'translateY(30px)' }),
// // //           stagger(150, [
// // //             animate('1s cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
// // //           ])
// // //         ], { optional: true })
// // //       ])
// // //     ])
// // //   ]
// // // })
// // // export class HeroBannerComponent {
// // //   @Input() config: any = {};

// // //   // 1. Calculate Minimum Height based on config
// // //   minHeightClass = computed(() => {
// // //     switch (this.config.height) {
// // //       case 'small': return 'min-h-[50vh] md:min-h-[60vh]';
// // //       case 'medium': return 'min-h-[65vh] md:min-h-[75vh]';
// // //       case 'large': return 'min-h-[85vh] md:min-h-[90vh]';
// // //       case 'full_screen': return 'min-h-[90vh] md:min-h-screen';
// // //       default: return 'min-h-[65vh] md:min-h-[75vh]';
// // //     }
// // //   });

// // //   // 2. Alignment Logic (Flexbox classes)
// // //   alignmentClasses = computed(() => {
// // //     switch (this.config.textAlign) {
// // //       case 'center': return 'items-center text-center';
// // //       case 'right': return 'items-end text-right';
// // //       default: return 'items-start text-left';
// // //     }
// // //   });

// // //   // 3. Container Width Logic
// // //   containerClass = computed(() => {
// // //     switch (this.config.containerWidth) {
// // //       case 'narrow': return 'max-w-4xl';
// // //       case 'full': return 'max-w-full px-6 md:px-12';
// // //       default: return 'max-w-7xl px-6 md:px-12'; // Standard
// // //     }
// // //   });

// // //   // Helper to filter valid buttons
// // //   get hasButtons() {
// // //     return this.config.ctaButtons && this.config.ctaButtons.length > 0;
// // //   }
// // // }

// // // // import { Component, Input, signal, computed } from '@angular/core';
// // // // import { CommonModule } from '@angular/common';
// // // // import { RouterModule } from '@angular/router';
// // // // import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

// // // // @Component({
// // // //   selector: 'app-hero-banner',
// // // //   standalone: true,
// // // //   imports: [CommonModule, RouterModule],
// // // //   templateUrl: './hero-banner.component.html',
// // // //   styleUrls: ['./hero-banner.component.scss'],
// // // //   animations: [
// // // //     // Staggered Text Entrance
// // // //     trigger('heroEntrance', [
// // // //       transition(':enter', [
// // // //         query('.hero-anim', [
// // // //           style({ opacity: 0, transform: 'translateY(30px)' }),
// // // //           stagger(200, [
// // // //             animate('1s cubic-bezier(0.2, 0.8, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
// // // //           ])
// // // //         ])
// // // //       ])
// // // //     ])
// // // //   ]
// // // // })
// // // // export class HeroBannerComponent {
// // // //   @Input() config: any = {};

// // // //   // Map JSON height to CSS classes
// // // //   heightClass = computed(() => {
// // // //     switch (this.config.height) {
// // // //       case 'small': return 'min-h-[60vh]'; // Professional "Small"
// // // //       case 'medium': return 'min-h-[75vh]';
// // // //       case 'large': return 'min-h-screen';
// // // //       default: return 'min-h-[75vh]';
// // // //     }
// // // //   });

// // // //   // Map JSON alignment to CSS classes
// // // //   alignClass = computed(() => {
// // // //     switch (this.config.textAlign) {
// // // //       case 'center': return 'items-center text-center';
// // // //       case 'right': return 'items-end text-right';
// // // //       default: return 'items-start text-left'; // Default Left
// // // //     }
// // // //   });

// // // //   // Helper to ensure we don't render empty buttons
// // // //   get validButtons() {
// // // //     return this.config.ctaButtons?.filter((b: any) => b.text && b.url) || [];
// // // //   }
// // // // }
