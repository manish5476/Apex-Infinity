import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading$ | async) {
      <div class="loader-overlay">
        <div class="loader-container">
          
          <div class="equalizer">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
          </div>

          <div class="text-wrapper">
            <span class="brand-text" data-text="Apex Infinity">Apex Infinity</span>
            <div class="scanline"></div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* --- 1. The Glassmorphism Overlay --- */
    .loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      
      /* Premium dark glass effect */
      background: rgba(15, 23, 42, 0.6); /* Slate-900 with opacity */
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      
      /* Subtle noise texture for realism */
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
      
      animation: overlayFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2.5rem;
      position: relative;
      /* Slight glow behind the whole container */
      filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.3)); 
    }

    /* --- 2. The Fluid Neon Equalizer --- */
    .equalizer {
      display: flex;
      gap: 8px;
      height: 60px;
      align-items: flex-end;
    }

    .bar {
      width: 10px;
      border-radius: 999px;
      
      /* The "Apex" Gradient - Vivid & vertical */
      background: linear-gradient(to top, #6366f1, #8b5cf6, #d946ef, #ec4899);
      background-size: 100% 400%;
      
      /* Complex animation chain */
      animation: 
        equalize 1s ease-in-out infinite alternate,
        gradientFlow 2s ease infinite,
        glowPulse 1.5s ease-in-out infinite alternate;
    }

    /* Staggered Delays for the "Wave" look */
    .bar:nth-child(1) { height: 40%; animation-delay: -0.4s; }
    .bar:nth-child(2) { height: 70%; animation-delay: -0.2s; }
    .bar:nth-child(3) { height: 100%; animation-delay: 0s;    }
    .bar:nth-child(4) { height: 70%; animation-delay: -0.2s; }
    .bar:nth-child(5) { height: 40%; animation-delay: -0.4s; }

    /* --- 3. The Cinematic Text --- */
    .text-wrapper {
      position: relative;
      overflow: hidden;
      padding: 0 4px;
    }

    .brand-text {
      font-family: 'Inter', sans-serif; /* Or your specialized font */
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: transparent;
      
      /* Metallic Gradient Text */
      background: linear-gradient(
        90deg, 
        #ffffff 0%, 
        #94a3b8 20%, 
        #ffffff 50%, 
        #94a3b8 80%, 
        #ffffff 100%
      );
      background-size: 200% auto;
      background-clip: text;
      -webkit-background-clip: text;
      
      animation: textShimmer 3s linear infinite;
    }

    /* Reflective Shine underneath */
    .brand-text::after {
      content: attr(data-text);
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.3) 100%);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      filter: blur(2px);
      opacity: 0.5;
    }

    /* --- 4. Animations --- */

    @keyframes equalize {
      0% { transform: scaleY(0.3); }
      100% { transform: scaleY(1); }
    }

    @keyframes gradientFlow {
      0% { background-position: 0% 100%; }
      50% { background-position: 0% 0%; }
      100% { background-position: 0% 100%; }
    }

    @keyframes glowPulse {
      0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
      100% { box-shadow: 0 0 25px rgba(217, 70, 239, 0.6); }
    }

    @keyframes textShimmer {
      to { background-position: 200% center; }
    }

    @keyframes overlayFadeIn {
      from { opacity: 0; backdrop-filter: blur(0px); }
      to { opacity: 1; backdrop-filter: blur(16px) saturate(180%); }
    }
  `]
})
export class LoadingComponent {
  public loadingService = inject(LoadingService);
}

// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Observable } from 'rxjs';
// import { LoadingService } from '../../../core/services/loading.service';

// @Component({
//   selector: 'app-loading', // Selector remains 'app-loader' as requested
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div *ngIf="isLoading$ | async" class="loader-overlay">
//       <div class="loader-content">
        
//         <!-- Wave Equalizer -->
//         <div class="wave-equalizer">
//           <span class="bar"></span>
//           <span class="bar"></span>
//           <span class="bar"></span>
//           <span class="bar"></span>
//           <span class="bar"></span>
//         </div>

//         <!-- Animated Rainbow Text -->
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
//         /* REMOVED: hue-rotate animation */
//       }

//       .wave-equalizer .bar {
//         display: block;
//         width: 10px;
//         height: 100%;
//         border-radius: 4px;
        
//         /* NEW: Applied a vertical rainbow gradient */
//         background: linear-gradient(
//           180deg, /* Vertical gradient */
//           #ff00c1, 
//           #ff9a00, 
//           #33ff00, 
//           #00c4ff, 
//           #ff00c1
//         );
//         background-size: auto 200%; /* Sized for vertical animation */
        
//         /* This animation makes the bars move up and down */
//         animation: 
//           waveRhythm 1.2s ease-in-out infinite alternate,
//           rainbowBar 3s linear infinite; /* NEW: Added color flow animation */
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
//        * 2. The Rainbow Brand Text (Unchanged, already colorful)
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

//       /* NEW: Animation for the bar's gradient to flow vertically */
//       @keyframes rainbowBar {
//         to {
//           background-position: 0 -200%;
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