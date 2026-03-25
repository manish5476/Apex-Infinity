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
      <div class="al-overlay">

        <div class="al-orb al-orb--a"></div>
        <div class="al-orb al-orb--b"></div>

        <div class="al-card">

          <!-- Spinner ring -->
          <div class="al-ring-wrap">
            <svg class="al-ring-svg" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="al-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="var(--accent-primary, #6366f1)"/>
                  <stop offset="100%" stop-color="var(--accent-secondary, #06b6d4)"/>
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r="32" stroke-width="2.5" class="al-ring-track"/>
              <circle cx="40" cy="40" r="32" stroke-width="2.5" class="al-ring-ghost" transform="rotate(-90 40 40)"/>
              <circle cx="40" cy="40" r="32" stroke-width="2.5" class="al-ring-arc"   transform="rotate(-90 40 40)"/>
            </svg>
            <i class="pi pi-bolt al-bolt-icon"></i>
          </div>

          <!-- Brand + status -->
          <div class="al-text-block">
            <span class="al-brand">{{ organization }}</span>
            <div class="al-status-row">
              <span class="al-status-text" [class.al-fade-in]="isTextVisible">{{ currentText }}</span>
              <span class="al-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>

          <!-- Thin progress bar -->
          <div class="al-bar-track">
            <div class="al-bar-fill"></div>
          </div>

          <!-- Dismiss -->
          <button class="al-dismiss" (click)="forceClose()">Dismiss</button>

        </div>
      </div>
    }
  `,
  styles: [`
    /* ==========================================================================
       OVERLAY
       ========================================================================== */
    .al-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(4, 4, 12, 0.82);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: al-fade-overlay 0.25s ease;
    }

    /* Ambient background orbs */
    .al-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      filter: blur(90px);
    }
    .al-orb--a {
      width: 420px; height: 420px;
      background: var(--accent-primary, #3730a3);
      opacity: 0.16;
      top: -120px; left: -100px;
      animation: al-orb-drift 8s ease-in-out infinite alternate;
    }
    .al-orb--b {
      width: 280px; height: 280px;
      background: var(--accent-secondary, #0e7490);
      opacity: 0.12;
      bottom: -60px; right: -40px;
      animation: al-orb-drift 10s ease-in-out infinite alternate-reverse;
    }

    /* ==========================================================================
       CARD
       ========================================================================== */
    .al-card {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 44px 52px;
      animation: al-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ==========================================================================
       RING SPINNER
       ========================================================================== */
    .al-ring-wrap {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .al-ring-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .al-ring-track {
      stroke: rgba(255, 255, 255, 0.07);
    }

    .al-ring-ghost {
      stroke: rgba(99, 102, 241, 0.3);
      stroke-dasharray: 80 200;
      stroke-dashoffset: 160;
      stroke-linecap: round;
      animation: al-dash 2.6s linear infinite reverse;
    }

    .al-ring-arc {
      stroke: url(#al-grad);
      stroke-dasharray: 200;
      stroke-dashoffset: 50;
      stroke-linecap: round;
      animation: al-dash 1.8s linear infinite;
    }

    .al-bolt-icon {
      position: relative;
      z-index: 2;
      font-size: 20px;
      color: #ffffff;
      animation: al-float 3s ease-in-out infinite;
    }

    /* ==========================================================================
       TEXT
       ========================================================================== */
    .al-text-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
    }

    .al-brand {
      font-family: var(--font-heading, sans-serif);
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 5px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.85);
    }

    .al-status-row {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 18px;
    }

    .al-status-text {
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(148, 163, 184, 0.65);
      opacity: 0;
      transform: translateY(5px);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }

    .al-status-text.al-fade-in {
      opacity: 1;
      transform: translateY(0);
    }

    .al-dots {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .al-dots span {
      display: inline-block;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--accent-primary, #6366f1);
      animation: al-blink 1.4s infinite both;
    }
    .al-dots span:nth-child(2) { animation-delay: 0.22s; }
    .al-dots span:nth-child(3) { animation-delay: 0.44s; }

    /* ==========================================================================
       PROGRESS BAR
       ========================================================================== */
    .al-bar-track {
      width: 140px;
      height: 2px;
      background: rgba(255, 255, 255, 0.07);
      border-radius: 99px;
      overflow: hidden;
    }

    .al-bar-fill {
      height: 100%;
      width: 45%;
      border-radius: 99px;
      background: linear-gradient(
        90deg,
        var(--accent-primary, #6366f1),
        var(--accent-secondary, #06b6d4)
      );
      position: relative;
      overflow: hidden;
    }

    .al-bar-fill::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.45),
        transparent
      );
      animation: al-shimmer 1.8s ease infinite;
    }

    /* ==========================================================================
       DISMISS BUTTON
       ========================================================================== */
    .al-dismiss {
      font-family: var(--font-body, sans-serif);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: rgba(100, 116, 139, 0.55);
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.07);
      padding: 8px 20px;
      border-radius: 99px;
      cursor: pointer;
      transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }

    .al-dismiss:hover {
      color: #f87171;
      border-color: rgba(239, 68, 68, 0.35);
      background: rgba(239, 68, 68, 0.06);
    }

    /* ==========================================================================
       KEYFRAMES
       ========================================================================== */
    @keyframes al-fade-overlay {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes al-scale-in {
      from { transform: scale(0.97); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }

    @keyframes al-dash {
      to { stroke-dashoffset: -60; }
    }

    @keyframes al-float {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-5px); }
    }

    @keyframes al-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }

    @keyframes al-blink {
      0%, 100% { opacity: 0.2; }
      40%       { opacity: 1; }
    }

    @keyframes al-orb-drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(30px, 20px) scale(1.08); }
    }
  `]
})
export class LoadingComponent implements OnInit, OnDestroy {
  public loadingService = inject(LoadingService);

  loadingTexts = [
    'Initializing Neural Core',
    'Establishing Secure Link',
    'Syncing Data Fragments',
    'Optimizing Viewport',
    'Calibrating Systems',
    'Loading Assets',
  ];

  currentText = '';
  organization = 'Apex Infinity';
  isTextVisible = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.organization =
      window.localStorage.getItem('orgSlug') || 'Apex Infinity';
    this.rotateText();
    this.intervalId = setInterval(() => this.rotateText(), 2800);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  rotateText(): void {
    this.isTextVisible = false;

    setTimeout(() => {
      let next: string;
      do {
        next = this.loadingTexts[
          Math.floor(Math.random() * this.loadingTexts.length)
        ];
      } while (next === this.currentText && this.loadingTexts.length > 1);

      this.currentText = next;
      this.isTextVisible = true;
    }, 350);
  }

  forceClose(): void {
    this.loadingService.hide();
  }
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
//       <div class="apex-loader-overlay animate-fadeIn">
        
//         <div class="ambient-glow"></div>

//         <div class="apex-glass-frame animate-scaleIn">
          
//           <div class="portal-container">
//             <div class="wave-loader">
//               <div class="wave-surface"></div>
//               <div class="wave-surface delay"></div>
//             </div>
            
//             <div class="center-icon">
//               <i class="pi pi-bolt"></i>
//             </div>
//           </div>

//           <div class="content-section">
//             <h1 class="brand-title">{{ organization || 'APEX INFINITY' }}</h1>
//             <div class="text-carousel">
//               <span class="sub-message fade-text" [class.visible]="isTextVisible">{{ currentText }}</span>
//               <div class="typing-indicator"><span>.</span><span>.</span><span>.</span></div>
//             </div>
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
//        1. FULL SCREEN OVERLAY
//        ========================================================================== */
//     .apex-loader-overlay {
//       position: fixed;
//       inset: 0;
//       z-index: 99999;
//       background: rgba(5, 5, 10, 0.8); /* Darker for better focus */
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       padding: 20px;
//       overflow: hidden;
//       backdrop-filter: blur(8px); /* Background blur */
//     }

//     /* Ambient background blobs */
//     .ambient-glow {
//       position: absolute;
//       width: 800px;
//       height: 800px;
//       background: radial-gradient(circle, var(--accent-primary, #4f46e5) 0%, transparent 60%);
//       opacity: 0.15;
//       filter: blur(100px);
//       z-index: -1;
//       animation: pulseGlow 5s ease-in-out infinite alternate;
//     }

//     /* ==========================================================================
//        2. THE GLASS FRAME
//        ========================================================================== */
//     .apex-glass-frame {
//       position: relative;
//       width: 100%;
//       height: 100%;
//       border-radius: 24px;
      
//       /* Enhanced Glass Effect */
//       background: rgba(255, 255, 255, 0.03);
//       backdrop-filter: blur(30px);
//       -webkit-backdrop-filter: blur(30px);
//       border: 1px solid rgba(255, 255, 255, 0.08);
//       box-shadow: 
//         inset 0 0 100px rgba(0,0,0,0.5), 
//         0 20px 50px rgba(0,0,0,0.6);

//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: 3rem;
//     }

//     /* ==========================================================================
//        3. THE PORTAL (Liquid Loader)
//        ========================================================================== */
//     .portal-container {
//       position: relative;
//       width: 180px;
//       height: 180px;
//       border-radius: 50%;
      
//       /* Neumorphic / Glass Hole Effect */
//       background: rgba(0, 0, 0, 0.3);
//       box-shadow: 
//         inset 0 4px 20px rgba(0,0,0,0.6),
//         0 0 0 1px rgba(255,255,255,0.1),
//         0 0 50px var(--accent-primary, rgba(79, 70, 229, 0.25));
      
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       overflow: hidden;
//     }

//     .wave-loader {
//       position: absolute;
//       width: 220%;
//       height: 220%;
//       top: -110%; 
//       left: -60%;
//       animation: fillUp 8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
//     }

//     .wave-surface {
//       position: absolute;
//       width: 100%;
//       height: 100%;
//       background: var(--accent-gradient, linear-gradient(180deg, rgba(99,102,241,1) 0%, rgba(6,182,212,1) 100%));
//       border-radius: 42%;
//       opacity: 0.85;
//       animation: spinWave 5s linear infinite;
//     }

//     .wave-surface.delay {
//       border-radius: 40%;
//       background: var(--accent-primary, #4f46e5);
//       opacity: 0.5;
//       animation: spinWave 7s linear infinite reverse;
//     }

//     .center-icon {
//       z-index: 10;
//       font-size: 3rem;
//       color: white;
//       filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
//       animation: floatIcon 3s ease-in-out infinite;
//     }

//     /* ==========================================================================
//        4. TYPOGRAPHY & ANIMATIONS
//        ========================================================================== */
//     .content-section {
//       text-align: center;
//       z-index: 2;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//     }

//     .brand-title {
//       font-family: var(--font-heading, sans-serif);
//       font-size: 2.2rem;
//       font-weight: 800;
//       letter-spacing: 6px;
//       color: white;
//       margin: 0 0 1rem 0;
//       text-transform: uppercase;
//       text-shadow: 0 10px 30px rgba(0,0,0,0.6);
//       /* Gradient Text */
//       background: linear-gradient(to right, #fff, #94a3b8);
//       -webkit-background-clip: text;
//       -webkit-text-fill-color: transparent;
//     }

//     .text-carousel {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       gap: 4px;
//       min-height: 1.5rem;
//     }

//     .sub-message {
//       font-family: var(--font-mono, monospace);
//       font-size: 0.95rem;
//       color: var(--text-secondary, #94a3b8);
//       text-transform: uppercase;
//       letter-spacing: 1.5px;
//       opacity: 0;
//       transform: translateY(5px);
//       transition: opacity 0.4s ease, transform 0.4s ease;
//     }

//     .sub-message.visible {
//       opacity: 1;
//       transform: translateY(0);
//     }

//     .typing-indicator span {
//       color: var(--accent-primary, #6366f1);
//       animation: blink 1.4s infinite both;
//       font-size: 1.5rem;
//       line-height: 0.5;
//       margin-left: 2px;
//     }
//     .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
//     .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

//     /* ==========================================================================
//        5. BUTTONS
//        ========================================================================== */
//     .dismiss-btn {
//       margin-top: 2rem;
//       background: rgba(255, 255, 255, 0.03);
//       border: 1px solid rgba(255, 255, 255, 0.1);
//       color: var(--text-tertiary, #64748b);
//       padding: 12px 32px;
//       border-radius: 99px;
//       font-size: 0.75rem;
//       text-transform: uppercase;
//       letter-spacing: 1.5px;
//       font-weight: 600;
//       cursor: pointer;
//       transition: all 0.3s ease;
//       backdrop-filter: blur(4px);
//     }

//     .dismiss-btn:hover {
//       background: rgba(239, 68, 68, 0.15);
//       border-color: rgba(239, 68, 68, 0.4);
//       color: #f87171;
//       transform: translateY(-1px);
//       box-shadow: 0 4px 12px rgba(0,0,0,0.2);
//     }

//     /* ==========================================================================
//        ANIMATIONS
//        ========================================================================== */
//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
//     @keyframes scaleIn { 
//       from { transform: scale(0.98); opacity: 0; } 
//       to { transform: scale(1); opacity: 1; } 
//     }
//     .animate-scaleIn { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

//     @keyframes spinWave {
//       0% { transform: translateY(0) rotate(0deg); }
//       100% { transform: translateY(-15px) rotate(360deg); }
//     }

//     @keyframes fillUp {
//       0% { top: 100%; }
//       100% { top: -55%; }
//     }

//     @keyframes floatIcon {
//       0%, 100% { transform: translateY(0); }
//       50% { transform: translateY(-6px); }
//     }
    
//     @keyframes pulseGlow {
//       0% { transform: scale(1); opacity: 0.1; }
//       100% { transform: scale(1.1); opacity: 0.18; }
//     }

//     @keyframes blink {
//       0% { opacity: 0.2; }
//       20% { opacity: 1; }
//       100% { opacity: 0.2; }
//     }
//   `]
// })
// export class LoadingComponent implements OnInit, OnDestroy {
//   public loadingService = inject(LoadingService);

//   loadingTexts = [
//     "Initializing Neural Core", 
//     "Establishing Secure Link", 
//     "Syncing Data Fragments",
//     "Optimizing Viewport",
//     "Calibrating Quantum Flux",
//     "Loading Assets"
//   ];
//   currentText = '';
//   organization: string | null = "Apex Infinity";
//   isTextVisible = false; // Added to control fade effect
//   private intervalId: any;

//   ngOnInit() {
//     this.organization = window.localStorage.getItem('orgSlug') || "Apex Infinity";
//     this.rotateText();
//     this.intervalId = setInterval(() => this.rotateText(), 3000);
//   }

//   ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

//   rotateText() {
//     // Fade out
//     this.isTextVisible = false;

//     // Wait for fade out, change text, then fade in
//     setTimeout(() => {
//       let nextText;
//       do {
//          nextText = this.loadingTexts[Math.floor(Math.random() * this.loadingTexts.length)];
//       } while (nextText === this.currentText && this.loadingTexts.length > 1);
      
//       this.currentText = nextText;
//       this.isTextVisible = true; // Fade in
//     }, 400); // Matches CSS transition time
//   }

//   forceClose() { this.loadingService.hide(); }
// }