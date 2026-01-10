import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

interface LoadingContent {
  icon: string;
  quote: string;
  color: string;
  gradient: string;
}

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading$ | async) {
      <div class="loader-overlay">
        <div class="particle-background">
          <div class="particle" *ngFor="let particle of particles"></div>
        </div>
        
        <div class="loader-container">
          
          <!-- Dynamic Icon Display -->
          <div class="icon-display">
            <div 
              class="icon-wrapper" 
              [style.background]="currentContent.gradient"
            >
              <div class="icon" [innerHTML]="currentContent.icon"></div>
              <div class="icon-glow"></div>
            </div>
            
            <!-- Rotating Orbit Elements -->
            <div class="orbit">
              <div class="orbital-dot dot-1"></div>
              <div class="orbital-dot dot-2"></div>
              <div class="orbital-dot dot-3"></div>
            </div>
          </div>

          <!-- Quote Display -->
          <div class="quote-container">
            <div class="quote-text">{{currentContent.quote}}</div>
            <div class="quote-author">Apex Infinity</div>
            <div class="quote-decor">
              <div class="quote-line left"></div>
              <div class="quote-mark">❝</div>
              <div class="quote-line right"></div>
            </div>
          </div>

          <!-- Progress Indicator -->
          <div class="progress-indicator">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress"></div>
              <div class="progress-pulse"></div>
            </div>
            <div class="progress-text">
              Loading {{loadingItems[currentItemIndex]}}...
              <span class="progress-percent">{{progress}}%</span>
            </div>
          </div>

          <!-- Loading Tips -->
          <div class="tips-container">
            <div class="tip-text">
              <span class="tip-icon">💡</span>
              {{loadingTips[currentTipIndex]}}
            </div>
            <div class="tip-counter">
              Tip {{currentTipIndex + 1}} of {{loadingTips.length}}
            </div>
          </div>

          <!-- Fun Fact -->
          <div class="fun-fact" [style.border-color]="currentContent.color">
            <div class="fun-fact-icon">🎯</div>
            <div class="fun-fact-text">This will be worth the wait!</div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* === Modern Dynamic Loading Overlay === */
    
    /* 1. Animated Background */
    .loader-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      
      /* Dynamic Gradient Background */
      background: linear-gradient(
        135deg,
        #667eea 0%,
        #764ba2 25%,
        #f093fb 50%,
        #f5576c 75%,
        #667eea 100%
      );
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
      
      /* Noise Texture */
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.15;
        mix-blend-mode: overlay;
      }
    }

    .particle-background {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .particle {
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      animation: floatParticle 20s linear infinite;
      
      &:nth-child(1) {
        width: 80px; height: 80px;
        top: 10%; left: 20%;
        animation-delay: 0s;
        background: radial-gradient(circle, #FF6B6B, transparent 70%);
      }
      &:nth-child(2) {
        width: 120px; height: 120px;
        top: 60%; left: 80%;
        animation-delay: -5s;
        background: radial-gradient(circle, #4ECDC4, transparent 70%);
      }
      &:nth-child(3) {
        width: 100px; height: 100px;
        top: 80%; left: 10%;
        animation-delay: -10s;
        background: radial-gradient(circle, #FFD166, transparent 70%);
      }
      &:nth-child(4) {
        width: 150px; height: 150px;
        top: 20%; left: 70%;
        animation-delay: -15s;
        background: radial-gradient(circle, #06D6A0, transparent 70%);
      }
      &:nth-child(5) {
        width: 90px; height: 90px;
        top: 70%; left: 40%;
        animation-delay: -7s;
        background: radial-gradient(circle, #118AB2, transparent 70%);
      }
    }

    /* 2. Main Container */
    .loader-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border-radius: 32px;
      padding: 3.5rem;
      width: 90%;
      max-width: 600px;
      position: relative;
      z-index: 10;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      animation: containerFloat 6s ease-in-out infinite;
    }

    /* 3. Dynamic Icon Display */
    .icon-display {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 2.5rem;
    }

    .icon-wrapper {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
      transform-style: preserve-3d;
      animation: iconFloat 3s ease-in-out infinite;
      
      /* Glass effect */
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.7) 0%,
        rgba(255, 255, 255, 0.3) 100%
      );
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }

    .icon {
      font-size: 4rem;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
      animation: iconPulse 2s ease-in-out infinite;
    }

    .icon-glow {
      position: absolute;
      inset: -20px;
      border-radius: 50%;
      background: inherit;
      filter: blur(30px);
      opacity: 0.5;
      z-index: 1;
      animation: glowPulse 3s ease-in-out infinite;
    }

    /* 4. Orbital Animation */
    .orbit {
      position: absolute;
      inset: -40px;
      animation: orbitSpin 8s linear infinite;
    }

    .orbital-dot {
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      
      &.dot-1 {
        background: #FF6B6B;
        animation: dotOrbit1 3s ease-in-out infinite;
      }
      &.dot-2 {
        background: #4ECDC4;
        animation: dotOrbit2 4s ease-in-out infinite 0.5s;
      }
      &.dot-3 {
        background: #FFD166;
        animation: dotOrbit3 5s ease-in-out infinite 1s;
      }
    }

    /* 5. Quote Styling */
    .quote-container {
      text-align: center;
      margin-bottom: 2.5rem;
      position: relative;
    }

    .quote-text {
      font-family: 'Georgia', serif;
      font-size: 1.4rem;
      font-weight: 500;
      line-height: 1.6;
      color: #2D3748;
      margin-bottom: 0.75rem;
      font-style: italic;
      min-height: 4rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .quote-author {
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: #4A5568;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .quote-decor {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .quote-line {
      flex: 1;
      height: 2px;
      background: linear-gradient(90deg, transparent, #CBD5E0, transparent);
    }

    .quote-mark {
      font-size: 2rem;
      color: #667eea;
      animation: markBounce 2s ease-in-out infinite;
    }

    /* 6. Progress Indicator */
    .progress-indicator {
      margin-bottom: 2rem;
    }

    .progress-bar {
      height: 12px;
      background: rgba(203, 213, 224, 0.3);
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      margin-bottom: 0.75rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 6px;
      transition: width 0.3s ease;
      position: relative;
      z-index: 2;
    }

    .progress-pulse {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
      animation: progressPulse 1.5s ease-in-out infinite;
    }

    .progress-text {
      display: flex;
      justify-content: space-between;
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      color: #4A5568;
    }

    .progress-percent {
      font-weight: 700;
      color: #667eea;
    }

    /* 7. Tips Container */
    .tips-container {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }

    .tip-text {
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      color: #2D3748;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tip-icon {
      font-size: 1.2rem;
    }

    .tip-counter {
      font-family: 'Inter', sans-serif;
      font-size: 0.75rem;
      color: #718096;
      text-align: right;
      font-weight: 500;
    }

    /* 8. Fun Fact */
    .fun-fact {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      border: 2px dashed;
      background: rgba(255, 255, 255, 0.7);
    }

    .fun-fact-icon {
      font-size: 1.5rem;
      animation: spin 3s linear infinite;
    }

    .fun-fact-text {
      font-family: 'Inter', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      color: #2D3748;
    }

    /* 9. Loading Items */
    .loading-items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 1rem;
    }

    .loading-item {
      background: rgba(102, 126, 234, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #667eea;
      font-weight: 500;
      animation: itemGlow 2s ease-in-out infinite;
    }

    /* 10. Animations */
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes floatParticle {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      25% {
        transform: translate(100px, -50px) rotate(90deg);
      }
      50% {
        transform: translate(50px, 100px) rotate(180deg);
      }
      75% {
        transform: translate(-50px, 50px) rotate(270deg);
      }
    }

    @keyframes containerFloat {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-20px);
      }
    }

    @keyframes iconFloat {
      0%, 100% {
        transform: translateY(0) scale(1);
      }
      50% {
        transform: translateY(-20px) scale(1.05);
      }
    }

    @keyframes iconPulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    @keyframes glowPulse {
      0%, 100% {
        opacity: 0.3;
        transform: scale(0.9);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.1);
      }
    }

    @keyframes orbitSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes dotOrbit1 {
      0%, 100% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
      50% { transform: rotate(180deg) translateX(80px) rotate(-180deg); }
    }

    @keyframes dotOrbit2 {
      0%, 100% { transform: rotate(120deg) translateX(80px) rotate(-120deg); }
      50% { transform: rotate(300deg) translateX(80px) rotate(-300deg); }
    }

    @keyframes dotOrbit3 {
      0%, 100% { transform: rotate(240deg) translateX(80px) rotate(-240deg); }
      50% { transform: rotate(420deg) translateX(80px) rotate(-420deg); }
    }

    @keyframes markBounce {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
    }

    @keyframes progressPulse {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes itemGlow {
      0%, 100% {
        box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
      }
      50% {
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
      }
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .loader-container {
        padding: 2rem;
        width: 95%;
        border-radius: 24px;
      }
      
      .icon-display {
        width: 100px;
        height: 100px;
      }
      
      .icon {
        font-size: 3rem;
      }
      
      .quote-text {
        font-size: 1.1rem;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .loader-container {
        background: rgba(26, 32, 44, 0.95);
      }
      
      .quote-text, .progress-text, .tip-text, .fun-fact-text {
        color: #E2E8F0;
      }
      
      .progress-bar {
        background: rgba(74, 85, 104, 0.3);
      }
      
      .tips-container {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
      }
    }
  `]
})
export class LoadingComponent implements OnInit, OnDestroy {
  public loadingService = inject(LoadingService);
  
  // Dynamic content that changes each time
  loadingContents: LoadingContent[] = [
    {
      icon: '🚀',
      quote: "Great things are done by a series of small things brought together",
      color: '#FF6B6B',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)'
    },
    {
      icon: '⚡',
      quote: "The secret of getting ahead is getting started",
      color: '#4ECDC4',
      gradient: 'linear-gradient(135deg, #4ECDC4, #06D6A0)'
    },
    {
      icon: '💎',
      quote: "Quality is not an act, it is a habit",
      color: '#FFD166',
      gradient: 'linear-gradient(135deg, #FFD166, #FFB347)'
    },
    {
      icon: '🎯',
      quote: "Focus on being productive instead of busy",
      color: '#118AB2',
      gradient: 'linear-gradient(135deg, #118AB2, #073B4C)'
    },
    {
      icon: '🌟',
      quote: "The future depends on what you do today",
      color: '#9D4EDD',
      gradient: 'linear-gradient(135deg, #9D4EDD, #560BAD)'
    },
    {
      icon: '🔮',
      quote: "Innovation distinguishes between a leader and a follower",
      color: '#FB5607',
      gradient: 'linear-gradient(135deg, #FB5607, #FF006E)'
    }
  ];

  loadingTips: string[] = [
    "Pro tip: Use keyboard shortcuts to navigate faster",
    "Did you know? You can customize your dashboard layout",
    "Our AI is optimizing your experience in real-time",
    "Your data is encrypted with military-grade security",
    "Save time by creating custom templates",
    "New features are added every week based on user feedback"
  ];

  loadingItems: string[] = [
    "essential components",
    "secure modules",
    "AI algorithms",
    "data analytics",
    "user interface",
    "real-time updates"
  ];

  particles = Array(5).fill(0);
  currentContentIndex = 0;
  currentTipIndex = 0;
  currentItemIndex = 0;
  progress = 0;
  private intervalId: any;

  get currentContent(): LoadingContent {
    return this.loadingContents[this.currentContentIndex];
  }

  ngOnInit() {
    // Randomize initial content
    this.currentContentIndex = Math.floor(Math.random() * this.loadingContents.length);
    this.currentTipIndex = Math.floor(Math.random() * this.loadingTips.length);
    this.currentItemIndex = Math.floor(Math.random() * this.loadingItems.length);

    // Progress animation
    this.animateProgress();

    // Rotate content every 5 seconds
    this.intervalId = setInterval(() => {
      this.rotateContent();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  animateProgress() {
    const progressInterval = setInterval(() => {
      if (this.progress < 90) {
        // Random progress increments to make it feel more natural
        this.progress += Math.floor(Math.random() * 10) + 1;
        if (this.progress > 90) this.progress = 90;
      } else if (this.progress < 95) {
        // Slow down near completion
        this.progress += Math.random() > 0.7 ? 1 : 0;
      }
      
      // Rotate loading item every 20% progress
      if (this.progress % 20 === 0 && this.progress > 0) {
        this.currentItemIndex = (this.currentItemIndex + 1) % this.loadingItems.length;
      }
    }, 300);

    // Clear interval when loading is done
    this.loadingService.isLoading$.subscribe(isLoading => {
      if (!isLoading) {
        clearInterval(progressInterval);
        this.progress = 100;
      }
    });
  }

  rotateContent() {
    // Rotate through content
    this.currentContentIndex = (this.currentContentIndex + 1) % this.loadingContents.length;
    this.currentTipIndex = (this.currentTipIndex + 1) % this.loadingTips.length;
    
    // Sometimes show a random item instead of sequential
    if (Math.random() > 0.7) {
      this.currentItemIndex = Math.floor(Math.random() * this.loadingItems.length);
    }
  }
}

// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { LoadingService } from '../../../core/services/loading.service';

// @Component({
//   selector: 'app-loading',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     @if (loadingService.isLoading$ | async) {
//       <div class="loader-overlay">
//         <div class="loader-container">
          
//           <div class="equalizer">
//             <div class="bar"></div>
//             <div class="bar"></div>
//             <div class="bar"></div>
//             <div class="bar"></div>
//             <div class="bar"></div>
//           </div>

//           <div class="text-wrapper">
//             <span class="brand-text" data-text="Apex Infinity">Apex Infinity</span>
//             <div class="scanline"></div>
//           </div>

//         </div>
//       </div>
//     }
//   `,
//   styles: [`
//     /* --- 1. The Glassmorphism Overlay --- */
//     .loader-overlay {
//       position: fixed;
//       inset: 0;
//       z-index: 9999;
//       display: flex;
//       align-items: center;
//       justify-content: center;
      
//       /* Premium dark glass effect */
//       background: rgba(15, 23, 42, 0.6); /* Slate-900 with opacity */
//       backdrop-filter: blur(16px) saturate(180%);
//       -webkit-backdrop-filter: blur(16px) saturate(180%);
      
//       /* Subtle noise texture for realism */
//       background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
      
//       animation: overlayFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//     }

//     .loader-container {
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       gap: 2.5rem;
//       position: relative;
//       /* Slight glow behind the whole container */
//       filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.3)); 
//     }

//     /* --- 2. The Fluid Neon Equalizer --- */
//     .equalizer {
//       display: flex;
//       gap: 8px;
//       height: 60px;
//       align-items: flex-end;
//     }

//     .bar {
//       width: 10px;
//       border-radius: 999px;
      
//       /* The "Apex" Gradient - Vivid & vertical */
//       background: linear-gradient(to top, #6366f1, #8b5cf6, #d946ef, #ec4899);
//       background-size: 100% 400%;
      
//       /* Complex animation chain */
//       animation: 
//         equalize 1s ease-in-out infinite alternate,
//         gradientFlow 2s ease infinite,
//         glowPulse 1.5s ease-in-out infinite alternate;
//     }

//     /* Staggered Delays for the "Wave" look */
//     .bar:nth-child(1) { height: 40%; animation-delay: -0.4s; }
//     .bar:nth-child(2) { height: 70%; animation-delay: -0.2s; }
//     .bar:nth-child(3) { height: 100%; animation-delay: 0s;    }
//     .bar:nth-child(4) { height: 70%; animation-delay: -0.2s; }
//     .bar:nth-child(5) { height: 40%; animation-delay: -0.4s; }

//     /* --- 3. The Cinematic Text --- */
//     .text-wrapper {
//       position: relative;
//       overflow: hidden;
//       padding: 0 4px;
//     }

//     .brand-text {
//       font-family: 'Inter', sans-serif; /* Or your specialized font */
//       font-size: 1.5rem;
//       font-weight: 800;
//       letter-spacing: 0.1em;
//       text-transform: uppercase;
//       color: transparent;
      
//       /* Metallic Gradient Text */
//       background: linear-gradient(
//         90deg, 
//         #ffffff 0%, 
//         #94a3b8 20%, 
//         #ffffff 50%, 
//         #94a3b8 80%, 
//         #ffffff 100%
//       );
//       background-size: 200% auto;
//       background-clip: text;
//       -webkit-background-clip: text;
      
//       animation: textShimmer 3s linear infinite;
//     }

//     /* Reflective Shine underneath */
//     .brand-text::after {
//       content: attr(data-text);
//       position: absolute;
//       left: 0;
//       top: 0;
//       width: 100%;
//       height: 100%;
//       background: linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.3) 100%);
//       background-clip: text;
//       -webkit-background-clip: text;
//       color: transparent;
//       filter: blur(2px);
//       opacity: 0.5;
//     }

//     /* --- 4. Animations --- */

//     @keyframes equalize {
//       0% { transform: scaleY(0.3); }
//       100% { transform: scaleY(1); }
//     }

//     @keyframes gradientFlow {
//       0% { background-position: 0% 100%; }
//       50% { background-position: 0% 0%; }
//       100% { background-position: 0% 100%; }
//     }

//     @keyframes glowPulse {
//       0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
//       100% { box-shadow: 0 0 25px rgba(217, 70, 239, 0.6); }
//     }

//     @keyframes textShimmer {
//       to { background-position: 200% center; }
//     }

//     @keyframes overlayFadeIn {
//       from { opacity: 0; backdrop-filter: blur(0px); }
//       to { opacity: 1; backdrop-filter: blur(16px) saturate(180%); }
//     }
//   `]
// })
// export class LoadingComponent {
//   public loadingService = inject(LoadingService);
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
        
// //         <!-- Wave Equalizer -->
// //         <div class="wave-equalizer">
// //           <span class="bar"></span>
// //           <span class="bar"></span>
// //           <span class="bar"></span>
// //           <span class="bar"></span>
// //           <span class="bar"></span>
// //         </div>

// //         <!-- Animated Rainbow Text -->
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
// //         gap: 2rem; /* Increased space */
// //       }

// //       /*
// //        * 1. The Wave Equalizer
// //        */
// //       .wave-equalizer {
// //         display: flex;
// //         justify-content: center;
// //         align-items: flex-end;
// //         height: 60px;
// //         gap: 6px;
// //         /* REMOVED: hue-rotate animation */
// //       }

// //       .wave-equalizer .bar {
// //         display: block;
// //         width: 10px;
// //         height: 100%;
// //         border-radius: 4px;
        
// //         /* NEW: Applied a vertical rainbow gradient */
// //         background: linear-gradient(
// //           180deg, /* Vertical gradient */
// //           #ff00c1, 
// //           #ff9a00, 
// //           #33ff00, 
// //           #00c4ff, 
// //           #ff00c1
// //         );
// //         background-size: auto 200%; /* Sized for vertical animation */
        
// //         /* This animation makes the bars move up and down */
// //         animation: 
// //           waveRhythm 1.2s ease-in-out infinite alternate,
// //           rainbowBar 3s linear infinite; /* NEW: Added color flow animation */
// //       }

// //       /* Stagger the animation start time for the "wave" effect */
// //       .wave-equalizer .bar:nth-child(2) {
// //         animation-delay: -1.0s;
// //       }
// //       .wave-equalizer .bar:nth-child(3) {
// //         animation-delay: -0.8s;
// //       }
// //       .wave-equalizer .bar:nth-child(4) {
// //         animation-delay: -0.6s;
// //       }
// //       .wave-equalizer .bar:nth-child(5) {
// //         animation-delay: -0.4s;
// //       }

// //       /*
// //        * 2. The Rainbow Brand Text (Unchanged, already colorful)
// //        */
// //       .brand-text {
// //         font-family: var(--font-primary);
// //         font-size: 1.25rem; /* 20px */
// //         font-weight: 600;
        
// //         /* Animated gradient for rainbow text */
// //         background: linear-gradient(
// //           90deg, 
// //           #ff00c1, 
// //           #ff9a00, 
// //           #33ff00, 
// //           #00c4ff, 
// //           #ff00c1
// //         );
// //         background-size: 200% auto;
// //         -webkit-background-clip: text;
// //         background-clip: text;
// //         -webkit-text-fill-color: transparent;
        
// //         /* This animation moves the gradient */
// //         animation: rainbowText 3s linear infinite;
// //       }

// //       /*
// //        * 3. Keyframes
// //        */

// //       /* Bar rhythm animation */
// //       @keyframes waveRhythm {
// //         from {
// //           transform: scaleY(0.1);
// //         }
// //         to {
// //           transform: scaleY(1);
// //         }
// //       }

// //       /* NEW: Animation for the bar's gradient to flow vertically */
// //       @keyframes rainbowBar {
// //         to {
// //           background-position: 0 -200%;
// //         }
// //       }

// //       /* Text gradient animation */
// //       @keyframes rainbowText {
// //         to {
// //           background-position: -200% center;
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
