// src/app/shared/ui/layout/floating-split-layout.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Component: app-floating-split-layout
 * Purpose: Full-viewport auth/onboarding split screen — an image/branding
 * showcase pane alongside a form/content pane. Used for login, signup,
 * and wizard-style flows.
 *
 * Note: content projected into [brand-overlay] is explicitly stacked
 * above the background image and scrim gradients via a positioned
 * wrapper — no need for consumers to add their own z-index handling.
 */
@Component({
  selector: 'app-floating-split-layout',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-fsl-host',
  },
  template: `
    <div class="app-fsl-wrapper">
      <div class="app-fsl-panel" [class.app-fsl-panel--reversed]="reverse()">

        <!-- LEFT PANE: Image & Branding Showcase -->
        <div class="app-fsl-panel__left">
          <img
            class="app-fsl-panel__image"
            [src]="imageSrc()"
            [alt]="imageAlt()" />

          <div class="app-fsl-panel__scrim app-fsl-panel__scrim--top" aria-hidden="true"></div>
          <div class="app-fsl-panel__scrim app-fsl-panel__scrim--bottom" aria-hidden="true"></div>

          <!-- Positioned above the image/scrim so projected content is
               always visible, regardless of what the consumer projects. -->
          <div class="app-fsl-panel__overlay-content">
            <ng-content select="[brand-overlay]"></ng-content>
          </div>
        </div>

        <!-- RIGHT PANE: Forms / Wizards -->
        <div class="app-fsl-panel__right">
          <div class="app-fsl-panel__right-inner">
            <ng-content></ng-content>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host.app-fsl-host {
      display: block;
      width: 100%;
    }

    .app-fsl-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100vh;   /* fallback for browsers without dvh support */
      height: 100dvh;
      background: var(--bg-secondary);
      padding: var(--spacing-2xl);
      overflow: hidden;
    }

    @media (min-width: 640px) {
      .app-fsl-wrapper { padding: var(--spacing-3xl); }
    }
    @media (min-width: 1024px) {
      .app-fsl-wrapper { padding: var(--spacing-4xl); }
    }

    .app-fsl-panel {
      display: flex;
      flex-direction: column;
      width: 100%;
      /* No --layout-max-width token exists yet; recommend adding one.
         Kept as a single named value here rather than an inline magic
         number in the template. */
      max-width: 90rem; /* 1440px */
      height: 100%;
      background: var(--bg-primary);
      /* Exceeds --ui-border-radius-xl (max 1.75rem); recommend adding
         --ui-border-radius-2xl to the theme scale rather than clamping
         this down to an existing token that doesn't match the design. */
      border-radius: 2rem;
      box-shadow: var(--shadow-3xl);
      overflow: hidden;
    }

    @media (min-width: 768px) {
      .app-fsl-panel {
        flex-direction: row;
        border-radius: 2.5rem;
      }
      .app-fsl-panel--reversed {
        flex-direction: row-reverse;
      }
    }

    /* ===== Left pane (image showcase) ===== */

    .app-fsl-panel__left {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 100%;
      padding: var(--spacing-4xl);
      /* Intentionally theme-independent — the showcase pane stays dark
         regardless of light/dark app theme. No matching semantic token
         exists yet; recommend adding e.g. --theme-showcase-bg if this
         pattern is reused elsewhere. */
      background-color: #111827;
      overflow: hidden;
    }

    @media (min-width: 1024px) {
      .app-fsl-panel__left { padding: var(--spacing-5xl); }
    }

    /* Hidden on mobile — image pane gives way entirely to the form pane. */
    @media (max-width: 767px) {
      .app-fsl-panel__left { display: none; }
    }

    @media (min-width: 768px) {
      .app-fsl-panel__left {
        width: 45%;
        height: 100%;
      }
    }

    .app-fsl-panel__image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.7;
      mix-blend-mode: luminosity;
      transition: transform 20s ease-out;
    }

    .app-fsl-panel__left:hover .app-fsl-panel__image {
      transform: scale(1.1);
    }

    .app-fsl-panel__scrim {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    /* Scrim gradients are intentionally flat black regardless of theme —
       their job is ensuring text legibility over an arbitrary image, not
       reflecting the app's color scheme. Candidate for dedicated
       --scrim-gradient-top / --scrim-gradient-bottom tokens if reused. */
    .app-fsl-panel__scrim--top {
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 60%);
    }

    .app-fsl-panel__scrim--bottom {
      background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.2) 60%, transparent);
    }

    .app-fsl-panel__overlay-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }

    /* ===== Right pane (form/content) ===== */

    .app-fsl-panel__right {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: var(--spacing-3xl);
      overflow-y: auto;
    }

    @media (min-width: 640px) {
      .app-fsl-panel__right { padding: var(--spacing-4xl); }
    }
    @media (min-width: 1024px) {
      .app-fsl-panel__right { padding: var(--spacing-5xl); }
    }

    @media (min-width: 768px) {
      .app-fsl-panel__right {
        width: 55%;
        height: 100%;
      }
    }

    .app-fsl-panel__right-inner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      max-width: 28rem; /* matches Tailwind's max-w-md; candidate for a
                            --form-max-width token if reused elsewhere */
      margin-inline: auto;
    }

    @media (min-width: 1280px) {
      .app-fsl-panel__right-inner {
        max-width: 32rem; /* matches Tailwind's max-w-lg */
      }
    }
  `],
})
export class FloatingSplitLayoutComponent {
  imageSrc = input.required<string>();
  imageAlt = input<string>('Background showcase');
  reverse = input<boolean>(false);
}

// import { Component, ChangeDetectionStrategy, input } from '@angular/core';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-floating-split-layout',
//   standalone: true,
//   imports: [CommonModule],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   host: { class: 'block w-full' },
//   template: `
//     <style>
//       .split-container {
//         display: flex;
//         flex-direction: column;
//         width: 100%;
//         max-width: 1440px;
//         height: 100%;
//         background-color: var(--bg-primary);
//         border-radius: 2rem;
//         box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
//         overflow: hidden;
//       }
//       .split-left, .split-right {
//         width: 100%;
//         display: flex;
//         flex-direction: column;
//       }
//       .split-right {
//         overflow-y: auto;
//       }
//       .split-left {
//         position: relative;
//         background-color: #111827;
//         justify-content: space-between;
//         overflow: hidden;
//       }
      
//       /* Mobile hide for image pane */
//       @media (max-width: 767px) {
//         .split-left { display: none !important; }
//       }

//       /* Desktop side-by-side layout */
//       @media (min-width: 768px) {
//         .split-container {
//           flex-direction: row;
//           border-radius: 2.5rem;
//         }
//         .split-container.is-reversed {
//           flex-direction: row-reverse;
//         }
//         .split-left {
//           width: 45%;
//           height: 100%;
//         }
//         .split-right {
//           width: 55%;
//           height: 100%;
//         }
//       }
//     </style>
//     <div class="h-screen w-full bg-[var(--bg-secondary)] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      
//       <div class="split-container" [class.is-reversed]="reverse()">
        
//         <!-- LEFT PANE: Image & Branding Showcase -->
//         <div class="split-left p-8 lg:p-12">
          
//           <img 
//             [src]="imageSrc()" 
//             [alt]="imageAlt()" 
//             class="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity transition-transform duration-[20s] ease-out hover:scale-110" 
//           />
          
//           <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none"></div>
//           <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none"></div>

//           <ng-content select="[brand-overlay]"></ng-content>
//         </div>

//         <!-- RIGHT PANE: Forms / Wizards -->
//         <div class="split-right p-6 sm:p-8 lg:p-12 xl:p-14 justify-center items-center">
//           <div class="w-full max-w-md xl:max-w-lg mx-auto flex flex-col justify-center">
//             <ng-content></ng-content>
//           </div>
//         </div>
        
//       </div>
//     </div>
//   `
// })
// export class FloatingSplitLayoutComponent {
//   imageSrc = input.required<string>();
//   imageAlt = input<string>('Background showcase');
//   reverse = input<boolean>(false);
// }
