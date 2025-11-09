import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading', // Selector remains 'app-loader' as requested
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading$ | async" class="loader-overlay">
      <div class="loader-content">
        
        <!-- Wave Equalizer -->
        <div class="wave-equalizer">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </div>

        <!-- Animated Rainbow Text -->
        <span class="brand-text">Apex Infinity</span>
      </div>
    </div>
  `,
  styles: [
    `
      .loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Theme-aware background color with transparency */
        background-color: color-mix(
          in srgb,
          var(--theme-bg-primary) 80%,
          transparent
        );
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
        /* Fade-in animation for a smooth appearance */
        animation: fadeIn 0.3s ease-in-out;
      }

      /* Container for the spinner and text */
      .loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem; /* Increased space */
      }

      /*
       * 1. The Wave Equalizer
       */
      .wave-equalizer {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        height: 60px;
        gap: 6px;
        /* REMOVED: hue-rotate animation */
      }

      .wave-equalizer .bar {
        display: block;
        width: 10px;
        height: 100%;
        border-radius: 4px;
        
        /* NEW: Applied a vertical rainbow gradient */
        background: linear-gradient(
          180deg, /* Vertical gradient */
          #ff00c1, 
          #ff9a00, 
          #33ff00, 
          #00c4ff, 
          #ff00c1
        );
        background-size: auto 200%; /* Sized for vertical animation */
        
        /* This animation makes the bars move up and down */
        animation: 
          waveRhythm 1.2s ease-in-out infinite alternate,
          rainbowBar 3s linear infinite; /* NEW: Added color flow animation */
      }

      /* Stagger the animation start time for the "wave" effect */
      .wave-equalizer .bar:nth-child(2) {
        animation-delay: -1.0s;
      }
      .wave-equalizer .bar:nth-child(3) {
        animation-delay: -0.8s;
      }
      .wave-equalizer .bar:nth-child(4) {
        animation-delay: -0.6s;
      }
      .wave-equalizer .bar:nth-child(5) {
        animation-delay: -0.4s;
      }

      /*
       * 2. The Rainbow Brand Text (Unchanged, already colorful)
       */
      .brand-text {
        font-family: var(--font-primary);
        font-size: 1.25rem; /* 20px */
        font-weight: 600;
        
        /* Animated gradient for rainbow text */
        background: linear-gradient(
          90deg, 
          #ff00c1, 
          #ff9a00, 
          #33ff00, 
          #00c4ff, 
          #ff00c1
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        
        /* This animation moves the gradient */
        animation: rainbowText 3s linear infinite;
      }

      /*
       * 3. Keyframes
       */

      /* Bar rhythm animation */
      @keyframes waveRhythm {
        from {
          transform: scaleY(0.1);
        }
        to {
          transform: scaleY(1);
        }
      }

      /* NEW: Animation for the bar's gradient to flow vertically */
      @keyframes rainbowBar {
        to {
          background-position: 0 -200%;
        }
      }

      /* Text gradient animation */
      @keyframes rainbowText {
        to {
          background-position: -200% center;
        }
      }

      /* Keyframe for the fade-in effect */
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class LoadingComponent {
  /**
   * An observable that emits true when a request is in progress, and false otherwise.
   */
  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.isLoading$;
  }
}

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Observable } from 'rxjs'; // Corrected 'in' to 'from'
// import { LoadingService } from '../../../core/services/loading.service';

// @Component({
//   selector: 'app-loading', // Selector remains 'app-loader' as requested
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div *ngIf="isLoading$ | async" class="loader-overlay">
//       <div class="loader-content">
        
//         <!-- NEW: Wave Equalizer -->
//         <div class="wave-equalizer">
//           <span class="bar"></span>
//           <span class="bar"></span>
//           <span class="bar"></span>
//           <span class="bar"></span>
//           <span class="bar"></span>
//         </div>

//         <!-- NEW: Animated Rainbow Text -->
//         <span class="brand-text">Apex Infinity</span>
//       </div>
//     </div>
//   `,
//   styles: [
//     `
//       .loader-overlay {
//         position: fixed;
//         inset: 0;
//         z-index: 50;
//         display: flex;
//         align-items: center;
//         justify-content: center;
//         /* Theme-aware background color with transparency */
//         background-color: color-mix(
//           in srgb,
//           var(--theme-bg-primary) 80%,
//           transparent
//         );
//         -webkit-backdrop-filter: blur(4px);
//         backdrop-filter: blur(4px);
//         /* Fade-in animation for a smooth appearance */
//         animation: fadeIn 0.3s ease-in-out;
//       }

//       /* Container for the spinner and text */
//       .loader-content {
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         gap: 2rem; /* Increased space */
//       }

//       /*
//        * 1. The Wave Equalizer
//        */
//       .wave-equalizer {
//         display: flex;
//         justify-content: center;
//         align-items: flex-end;
//         height: 60px;
//         gap: 6px;
//         /* This animation makes the bars cycle through the rainbow */
//         animation: rainbowHue 4s linear infinite;
//       }

//       .wave-equalizer .bar {
//         display: block;
//         width: 10px;
//         height: 100%;
//         border-radius: 4px;
//         background-color: var(--theme-accent-primary);
        
//         /* This animation makes the bars move up and down */
//         animation: waveRhythm 1.2s ease-in-out infinite alternate;
//       }

//       /* Stagger the animation start time for the "wave" effect */
//       .wave-equalizer .bar:nth-child(2) {
//         animation-delay: -1.0s;
//       }
//       .wave-equalizer .bar:nth-child(3) {
//         animation-delay: -0.8s;
//       }
//       .wave-equalizer .bar:nth-child(4) {
//         animation-delay: -0.6s;
//       }
//       .wave-equalizer .bar:nth-child(5) {
//         animation-delay: -0.4s;
//       }

//       /*
//        * 2. The Rainbow Brand Text
//        */
//       .brand-text {
//         font-family: var(--font-primary);
//         font-size: 1.25rem; /* 20px */
//         font-weight: 600;
        
//         /* Animated gradient for rainbow text */
//         background: linear-gradient(
//           90deg, 
//           #ff00c1, 
//           #ff9a00, 
//           #33ff00, 
//           #00c4ff, 
//           #ff00c1
//         );
//         background-size: 200% auto;
//         -webkit-background-clip: text;
//         background-clip: text;
//         -webkit-text-fill-color: transparent;
        
//         /* This animation moves the gradient */
//         animation: rainbowText 3s linear infinite;
//       }

//       /*
//        * 3. Keyframes
//        */

//       /* Bar rhythm animation */
//       @keyframes waveRhythm {
//         from {
//           transform: scaleY(0.1);
//         }
//         to {
//           transform: scaleY(1);
//         }
//       }

//       /* Bar color-shifting animation */
//       @keyframes rainbowHue {
//         to {
//           filter: hue-rotate(360deg);
//         }
//       }

//       /* Text gradient animation */
//       @keyframes rainbowText {
//         to {
//           background-position: -200% center;
//         }
//       }

//       /* Keyframe for the fade-in effect */
//       @keyframes fadeIn {
//         from {
//           opacity: 0;
//         }
//         to {
//           opacity: 1;
//         }
//       }
//     `,
//   ],
// })
// export class LoadingComponent {
//   /**
//    * An observable that emits true when a request is in progress, and false otherwise.
//    */
//   isLoading$: Observable<boolean>;

//   constructor(private loadingService: LoadingService) {
//     this.isLoading$ = this.loadingService.isLoading$;
//   }
// }
// // import { Component } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Observable } from 'rxjs';
// // import { LoadingService } from '../../../core/services/loading.service';

// // @Component({
// //   selector: 'app-loading', // Selector remains 'app-loader' as requested
// //   standalone: true,
// //   imports: [CommonModule],
// //   template: `
// //     <div *ngIf="isLoading$ | async" class="loader-overlay">
// //       <div class="loader-content">
// //         <div class="minimal-spinner"></div>
// //         <span class="brand-text">Apex Infinity</span>
// //       </div>
// //     </div>
// //   `,
// //   styles: [
// //     `
// //       .loader-overlay {
// //         position: fixed;
// //         inset: 0;
// //         z-index: 50;
// //         display: flex;
// //         align-items: center;
// //         justify-content: center;
// //         /* Theme-aware background color with transparency */
// //         background-color: color-mix(
// //           in srgb,
// //           var(--theme-bg-primary) 80%,
// //           transparent
// //         );
// //         -webkit-backdrop-filter: blur(4px);
// //         backdrop-filter: blur(4px);
// //         /* Fade-in animation for a smooth appearance */
// //         animation: fadeIn 0.3s ease-in-out;
// //       }

// //       /* Container for the spinner and text */
// //       .loader-content {
// //         display: flex;
// //         flex-direction: column;
// //         align-items: center;
// //         gap: 1.5rem; /* Space between spinner and text */
// //       }

// //       /* The minimalist spinner animation */
// //       .minimal-spinner {
// //         width: 50px;
// //         height: 50px;
// //         border-radius: 50%;
// //         border: 4px solid var(--theme-border-primary);
// //         /* The colored part of the spinner uses the theme's accent color */
// //         border-top-color: var(--theme-accent-primary);
// //         animation: spin 1s linear infinite;
// //       }

// //       /* The subtle glow effect for the brand name text */
// //       .brand-text {
// //         font-family: var(--font-primary);
// //         font-size: 1.125rem; /* 18px */
// //         font-weight: 500;
// //         color: var(--theme-text-secondary);
// //         /* Theme-aware glow using the accent color */
// //         text-shadow: 0 0 8px
// //           color-mix(in srgb, var(--theme-accent-primary) 30%, transparent);
// //       }

// //       /* Keyframe for the spinning animation */
// //       @keyframes spin {
// //         to {
// //           transform: rotate(360deg);
// //         }
// //       }

// //       /* Keyframe for the fade-in effect */
// //       @keyframes fadeIn {
// //         from {
// //           opacity: 0;
// //         }
// //         to {
// //           opacity: 1;
// //         }
// //       }
// //     `,
// //   ],
// // })
// // export class LoadingComponent {
// //   /**
// //    * An observable that emits true when a request is in progress, and false otherwise.
// //    */
// //   isLoading$: Observable<boolean>;

// //   constructor(private loadingService: LoadingService) {
// //     this.isLoading$ = this.loadingService.isLoading$;
// //   }
// // }
