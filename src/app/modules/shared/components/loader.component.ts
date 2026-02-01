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
      <div class="apex-loader-overlay">
        
        <div class="apex-glass-card animate-enter">
          
          <div class="stars-layer">
            <div class="star s1"></div><div class="star s2"></div>
            <div class="star s3"></div><div class="star s4"></div>
            <div class="star s5"></div><div class="star s6"></div>
          </div>

          <div class="spinner-container">
             <div class="wave-loader"></div>
          </div>

          <div class="content-section">
            <h1 class="brand-title">Apex Infinity</h1>
            <p class="sub-message">{{ currentText }}</p>
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
       1. OVERLAY
       ========================================================================== */
    .apex-loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(10, 10, 20, 0.7); 
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease-out;
    }

    /* ==========================================================================
       2. GLASS CARD
       ========================================================================== */
    .apex-glass-card {
      position: relative;
      width: 100%;
      max-width: 380px;
      padding: 40px;
      border-radius: var(--ui-border-radius-xl);
      text-align: center;
      overflow: hidden;

      background: var(--glass-bg-c, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--glass-border-c, rgba(255, 255, 255, 0.1));
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
    }

    /* ==========================================================================
       3. THE WATER WAVE EFFECT (Restored & Upgraded)
       ========================================================================== */
    .spinner-container {
      width: 100px;
      height: 100px;
      margin: 0 auto;
    }

    .wave-loader {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      position: relative;
      overflow: hidden;
      
      /* Use your Accent Gradient for the "Water" color */
      background: var(--accent-gradient, linear-gradient(135deg, #3b82f6, #06b6d4));
      
      /* 3D Sphere Effect */
      box-shadow: 
        inset 0 0 20px rgba(0, 0, 0, 0.5),
        0 0 0 4px rgba(255, 255, 255, 0.05); /* Outer Ring */
    }

    .wave-loader::before,
    .wave-loader::after {
      content: "";
      position: absolute;
      width: 200%;
      height: 200%;
      border-radius: 40%; /* Irregular shape creates wave */
      top: -150%;
      left: -50%;
      background-color: rgba(255, 255, 255, 1); /* White Foam */
      animation: spinWave 6s linear infinite;
    }

    /* Front Wave */
    .wave-loader::after {
      border-radius: 45%;
      background: rgba(255, 255, 255, 0.9);
      top: -155%; /* Water Level */
      animation-duration: 5s;
    }

    /* Back Wave (Transparent) */
    .wave-loader::before {
      border-radius: 40%;
      background: rgba(255, 255, 255, 0.4);
      animation-duration: 8s;
    }

    /* ==========================================================================
       4. BRANDING
       ========================================================================== */
    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: 2px;
      text-transform: uppercase;
      background: linear-gradient(to right, #fff, var(--accent-primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .sub-message {
      font-family: var(--font-body);
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* ==========================================================================
       5. STARS & BUTTON
       ========================================================================== */
    .stars-layer { position: absolute; inset: 0; pointer-events: none; }
    .star { position: absolute; background: white; border-radius: 50%; animation: twinkle 3s infinite; }
    .s1 { width: 2px; height: 2px; top: 20%; left: 20%; }
    .s2 { width: 3px; height: 3px; top: 15%; right: 25%; animation-delay: 1s; }
    .s3 { width: 1px; height: 1px; bottom: 30%; left: 10%; }

    .dismiss-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-tertiary);
      padding: 8px 24px;
      border-radius: 20px;
      font-size: 0.75rem;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dismiss-btn:hover { border-color: var(--color-error); color: var(--color-error); }

    /* ==========================================================================
       ANIMATIONS
       ========================================================================== */
    @keyframes spinWave {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes twinkle { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    @keyframes enterCard {
      0% { opacity: 0; transform: scale(0.9) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-enter { animation: enterCard 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
  `]
})
export class LoadingComponent implements OnInit, OnDestroy {
  public loadingService = inject(LoadingService);
  
  loadingTexts = ["Synchronizing...", "Securing Data...", "Apex Infinity AI..."];
  currentText = '';
  private intervalId: any;

  ngOnInit() {
    this.rotateText();
    this.intervalId = setInterval(() => this.rotateText(), 2000);
  }

  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

  rotateText() {
    this.currentText = this.loadingTexts[Math.floor(Math.random() * this.loadingTexts.length)];
  }

  forceClose() { this.loadingService.hide(); }
}