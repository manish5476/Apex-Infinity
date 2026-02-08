import { Component, inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (loadingService.isLoading$ | async) {
      <div class="apex-loader-overlay animate-fadeIn">
        
        <div class="ambient-glow"></div>

        <div class="apex-glass-frame animate-scaleIn">
          
          <div class="portal-container">
            <div class="wave-loader">
              <div class="wave-surface"></div>
              <div class="wave-surface delay"></div>
            </div>
            
            <div class="center-icon">
              <i class="pi pi-bolt"></i>
            </div>
          </div>

          <div class="content-section">
            <h1 class="brand-title">{{ organization || 'APEX INFINITY' }}</h1>
            <div class="text-carousel">
              <span class="sub-message">{{ currentText }}</span>
              <div class="typing-indicator"><span>.</span><span>.</span><span>.</span></div>
            </div>
          </div>

          <button class="dismiss-btn" (click)="forceClose()">
            <span>Dismiss</span>
          </button>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ==========================================================================
       1. FULL SCREEN OVERLAY
       ========================================================================== */
    .apex-loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(5, 5, 10, 0.6); /* Dark dim layer */
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px; /* Outer spacing */
      overflow: hidden;
    }

    /* Ambient background blobs to show off the glass effect */
    .ambient-glow {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--accent-primary, #4f46e5) 0%, transparent 70%);
      opacity: 0.15;
      filter: blur(80px);
      z-index: -1;
      animation: pulseGlow 4s ease-in-out infinite alternate;
    }

    /* ==========================================================================
       2. THE GLASS FRAME (The "Screen")
       ========================================================================== */
    .apex-glass-frame {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 24px; /* Curved viewport */
      
      /* The Massive Glass Effect */
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 
        inset 0 0 100px rgba(0,0,0,0.5), /* Inner vignetting */
        0 20px 50px rgba(0,0,0,0.5);     /* Drop shadow */

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3rem;
    }

    /* ==========================================================================
       3. THE PORTAL (Liquid Loader)
       ========================================================================== */
    .portal-container {
      position: relative;
      width: 180px; /* Big Circle */
      height: 180px;
      border-radius: 50%;
      
      /* Neumorphic / Glass Hole Effect */
      background: rgba(0, 0, 0, 0.2);
      box-shadow: 
        inset 0 4px 20px rgba(0,0,0,0.5),
        0 0 0 1px rgba(255,255,255,0.1),
        0 0 40px var(--accent-primary, rgba(79, 70, 229, 0.3)); /* Outer Glow */
      
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .wave-loader {
      position: absolute;
      width: 200%;
      height: 200%;
      top: -100%; /* Start empty */
      left: -50%;
      animation: fillUp 10s ease-out forwards;
    }

    .wave-surface {
      position: absolute;
      width: 100%;
      height: 100%;
      background: var(--accent-gradient, linear-gradient(180deg, rgba(59,130,246,1) 0%, rgba(6,182,212,1) 100%));
      border-radius: 40%;
      opacity: 0.8;
      animation: spinWave 6s linear infinite;
    }

    .wave-surface.delay {
      border-radius: 45%;
      background: var(--accent-primary, #3b82f6);
      opacity: 0.4;
      animation: spinWave 8s linear infinite reverse;
    }

    .center-icon {
      z-index: 10;
      font-size: 2.5rem;
      color: white;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      animation: floatIcon 3s ease-in-out infinite;
    }

    /* ==========================================================================
       4. TYPOGRAPHY
       ========================================================================== */
    .content-section {
      text-align: center;
      z-index: 2;
    }

    .brand-title {
      font-family: var(--font-heading, sans-serif);
      font-size: 2rem; /* Larger */
      font-weight: 800;
      letter-spacing: 4px;
      color: white;
      margin: 0 0 1rem 0;
      text-transform: uppercase;
      text-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

    .text-carousel {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    .sub-message {
      font-family: var(--font-mono, monospace);
      font-size: 0.9rem;
      color: var(--text-secondary, #94a3b8);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .typing-indicator span {
      color: var(--accent-primary);
      animation: blink 1.4s infinite both;
      font-size: 1.5rem;
      line-height: 0.5;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    /* ==========================================================================
       5. BUTTONS
       ========================================================================== */
    .dismiss-btn {
      margin-top: 2rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-tertiary, #64748b);
      padding: 10px 30px;
      border-radius: 30px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .dismiss-btn:hover {
      background: rgba(255, 40, 40, 0.1);
      border-color: rgba(255, 40, 40, 0.4);
      color: #f87171;
    }

    /* ==========================================================================
       ANIMATIONS
       ========================================================================== */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    @keyframes scaleIn { 
      from { transform: scale(0.95); opacity: 0; } 
      to { transform: scale(1); opacity: 1; } 
    }
    .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }

    @keyframes spinWave {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(-20px) rotate(360deg); }
    }

    @keyframes fillUp {
      0% { top: 100%; } /* Start below */
      100% { top: -60%; } /* End covering most of circle */
    }

    @keyframes floatIcon {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    
    @keyframes pulseGlow {
      0% { transform: scale(1); opacity: 0.1; }
      100% { transform: scale(1.2); opacity: 0.2; }
    }

    @keyframes blink {
      0% { opacity: 0.2; }
      20% { opacity: 1; }
      100% { opacity: 0.2; }
    }
  `]
})
export class LoadingComponent implements OnInit, OnDestroy {
  public loadingService = inject(LoadingService);

  loadingTexts = [
    "Initializing Neural Core", 
    "Establishing Secure Link", 
    "Syncing Data Fragments",
    "Optimizing Viewport"
  ];
  currentText = '';
  organization: string | null = "Apex Infinity";
  private intervalId: any;

  ngOnInit() {
    this.organization = window.localStorage.getItem('orgSlug') || "Apex Infinity";
    this.rotateText();
    this.intervalId = setInterval(() => this.rotateText(), 2500);
  }

  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

  rotateText() {
    // Logic to ensure we don't pick the same text twice in a row
    let nextText;
    do {
       nextText = this.loadingTexts[Math.floor(Math.random() * this.loadingTexts.length)];
    } while (nextText === this.currentText && this.loadingTexts.length > 1);
    
    this.currentText = nextText;
  }

  forceClose() { this.loadingService.hide(); }
}





// import { Component, inject, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LoadingService } from '../../../core/services/loading.service';

// @Component({
//   selector: 'app-loading',
//   standalone: true,
//   imports: [CommonModule],
//   encapsulation: ViewEncapsulation.None,
//   template: `
//     @if (loadingService.isLoading$ | async) {
//       <div class="apex-loader-overlay">
//         <div class="apex-glass-card animate-enter">
//           <div class="stars-layer">
//             <div class="star s1"></div><div class="star s2"></div>
//             <div class="star s3"></div><div class="star s4"></div>
//             <div class="star s5"></div><div class="star s6"></div>
//           </div>
//           <div class="spinner-container">
//              <div class="wave-loader"></div>
//           </div>
//           <div class="content-section">
//             <h1 class="brand-title">{{organination}}</h1>
//             <p class="sub-message">{{ currentText }}</p>
//           </div>
//           <button class="dismiss-btn" (click)="forceClose()">
//             <span>Dismiss</span>
//           </button>
//         </div>
//       </div>
//     }
//   `,
//   styles: [`
//     /* ==========================================================================
//        1. OVERLAY
//        ========================================================================== */
//     .apex-loader-overlay {
//       position: fixed;
//       inset: 0;
//       z-index: 99999;
//       background: rgba(10, 10, 20, 0.7); 
//       backdrop-filter: blur(10px);
//       -webkit-backdrop-filter: blur(10px);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       animation: fadeIn 0.3s ease-out;
//     }

//     /* ==========================================================================
//        2. GLASS CARD
//        ========================================================================== */
//     .apex-glass-card {
//       position: relative;
//       width: 100%;
//       max-width: 380px;
//       padding: 40px;
//       border-radius: var(--ui-border-radius-xl);
//       text-align: center;
//       overflow: hidden;

//       background: var(--glass-bg-c, rgba(255, 255, 255, 0.05));
//       border: 1px solid var(--glass-border-c, rgba(255, 255, 255, 0.1));
//       box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       gap: 30px;
//     }

//     /* ==========================================================================
//        3. THE WATER WAVE EFFECT (Restored & Upgraded)
//        ========================================================================== */
//     .spinner-container {
//       width: 100px;
//       height: 100px;
//       margin: 0 auto;
//     }

//     .wave-loader {
//       width: 100%;
//       height: 100%;
//       border-radius: 50%;
//       position: relative;
//       overflow: hidden;
      
//       /* Use your Accent Gradient for the "Water" color */
//       background: var(--accent-gradient, linear-gradient(135deg, #3b82f6, #06b6d4));
      
//       /* 3D Sphere Effect */
//       box-shadow: 
//         inset 0 0 20px rgba(0, 0, 0, 0.5),
//         0 0 0 4px rgba(255, 255, 255, 0.05); /* Outer Ring */
//     }

//     .wave-loader::before,
//     .wave-loader::after {
//       content: "";
//       position: absolute;
//       width: 200%;
//       height: 200%;
//       border-radius: 40%; /* Irregular shape creates wave */
//       top: -150%;
//       left: -50%;
//       background-color: rgba(255, 255, 255, 1); /* White Foam */
//       animation: spinWave 6s linear infinite;
//     }

//     /* Front Wave */
//     .wave-loader::after {
//       border-radius: 45%;
//       background: rgba(255, 255, 255, 0.9);
//       top: -155%; /* Water Level */
//       animation-duration: 5s;
//     }

//     /* Back Wave (Transparent) */
//     .wave-loader::before {
//       border-radius: 40%;
//       background: rgba(255, 255, 255, 0.4);
//       animation-duration: 8s;
//     }

//     /* ==========================================================================
//        4. BRANDING
//        ========================================================================== */
//     .brand-title {
//       font-family: var(--font-heading);
//       font-size: 1.5rem;
//       font-weight: 700;
//       margin: 0 0 8px 0;
//       letter-spacing: 2px;
//       text-transform: uppercase;
//       background: linear-gradient(to right, #fff, var(--accent-primary));
//       -webkit-background-clip: text;
//       -webkit-text-fill-color: transparent;
//     }

//     .sub-message {
//       font-family: var(--font-body);
//       font-size: 0.85rem;
//       color: var(--text-secondary);
//       margin: 0;
//     }

//     /* ==========================================================================
//        5. STARS & BUTTON
//        ========================================================================== */
//     .stars-layer { position: absolute; inset: 0; pointer-events: none; }
//     .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s infinite; }
//     .s1 { width: 2px; height: 2px; top: 20%; left: 20%; }
//     .s2 { width: 3px; height: 3px; top: 15%; right: 25%; animation-delay: 1s; }
//     .s3 { width: 1px; height: 1px; bottom: 30%; left: 10%; }

//     .dismiss-btn {
//       background: transparent;
//       border: 1px solid rgba(255, 255, 255, 0.1);
//       color: var(--text-tertiary);
//       padding: 8px 24px;
//       border-radius: 20px;
//       font-size: 0.75rem;
//       text-transform: uppercase;
//       cursor: pointer;
//       transition: all 0.2s;
//     }
//     .dismiss-btn:hover { border-color: var(--color-error); color: var(--color-error); }

//     /* ==========================================================================
//        ANIMATIONS
//        ========================================================================== */
//     @keyframes spinWave {
//       0% { transform: rotate(0deg); }
//       100% { transform: rotate(360deg); }
//     }
//     @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
//     @keyframes enterCard {
//       0% { opacity: 0; transform: scale(0.9) translateY(20px); }
//       100% { opacity: 1; transform: scale(1) translateY(0); }
//     }
//     .animate-enter { animation: enterCard 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
//   `]
// })
// export class LoadingComponent implements OnInit, OnDestroy {
//   public loadingService = inject(LoadingService);

//   loadingTexts = ["Synchronizing...", "Securing Data...", "Apex Infinity AI..."];
//   currentText = '';
//   organination: any = "Welcome"
//   private intervalId: any;

//   ngOnInit() {
//     this.rotateText();
//     this.organination = window.localStorage.getItem('orgSlug')
//     this.intervalId = setInterval(() => this.rotateText(), 2000);
//   }

//   ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

//   rotateText() {
//     this.currentText = this.loadingTexts[Math.floor(Math.random() * this.loadingTexts.length)];
//   }

//   forceClose() { this.loadingService.hide(); }
// }