import { Component, OnInit, AfterViewInit, HostListener, signal, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Interface definition
interface FeatureDetail {
  id: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  points: string[];
  icon: string;
  colorVar: string;
  metric?: { label: string; value: string };
}

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="landing-root">
      
      <!-- NAVIGATION -->
      <nav class="navbar" [class.navbar-scrolled]="scrollY() > 50">
        <div class="container nav-content">
          <div class="brand">
            <div class="logo-box"><i class="pi pi-infinity"></i></div>
            <span class="logo-text">APEX <strong>INFINITY</strong></span>
          </div>

          <!-- Desktop Links (Hidden on Mobile) -->
          <div class="desktop-links">
            <a href="#solutions">Solutions</a>
            <a href="#platform">Platform</a>
            <a href="#developers">Developers</a>
            <a href="#pricing">Pricing</a>
          </div>

          <!-- Desktop Actions (Hidden on Mobile) -->
          <div class="nav-actions">
            <!-- Native Buttons replacing pButton -->
            <button class="p-button p-button-text font-bold" routerLink="/auth/login">Login</button>
            <button class="p-button p-button-primary p-button-rounded font-bold">Start Trial</button>
          </div>

          <!-- Mobile Toggle Button -->
          <button class="mobile-toggle" (click)="toggleMobileMenu()">
            <i class="pi pi-bars"></i>
          </button>
        </div>
      </nav>

      <!-- MOBILE MENU OVERLAY & DRAWER -->
      <div class="mobile-menu-overlay" [class.open]="mobileMenuOpen()" (click)="toggleMobileMenu()"></div>
      <div class="mobile-nav" [class.open]="mobileMenuOpen()">
        <div class="mobile-nav-header">
            <span class="logo-text">APEX <strong>INFINITY</strong></span>
            <button class="close-btn" (click)="toggleMobileMenu()"><i class="pi pi-times"></i></button>
        </div>
        <div class="mobile-links">
            <a href="#solutions" (click)="toggleMobileMenu()">Solutions</a>
            <a href="#platform" (click)="toggleMobileMenu()">Platform</a>
            <a href="#developers" (click)="toggleMobileMenu()">Developers</a>
            <a href="#pricing" (click)="toggleMobileMenu()">Pricing</a>
        </div>
        <div class="mobile-actions">
             <button class="p-button p-button-outlined w-full" routerLink="/auth/login">Login</button>
             <button class="p-button p-button-primary w-full">Start Trial</button>
        </div>
      </div>

      <!-- HERO SECTION -->
      <header class="hero-section">
        <div class="glow-orb top-right"></div>
        <div class="glow-orb bottom-left"></div>
        
        <div class="container hero-grid">
          <div class="hero-text reveal-on-scroll">
            <div class="accent-pill">
              <i class="pi pi-check-circle"></i> Angular 20 Powered
            </div>
            <h1>{{ heroData().headline }}</h1>
            <p class="hero-sub">{{ heroData().subhead }}</p>
            
            <div class="hero-cta">
              <button class="p-button p-button-lg p-button-rounded p-button-primary">
                <i class="pi pi-bolt mr-2"></i> Get Started Now
              </button>
              <button class="p-button p-button-lg p-button-rounded p-button-outlined">
                <i class="pi pi-play mr-2"></i> Watch Demo
              </button>
            </div>

            <div class="hero-stats">
              @for (stat of heroData().stats; track stat.label) {
                <div class="stat-item">
                  <strong>{{ stat.value }}</strong>
                  <span>{{ stat.label }}</span>
                </div>
              }
            </div>
          </div>

          <div class="hero-visual reveal-on-scroll">
            <div class="glass-dashboard">
              <div class="dash-header">
                <div class="dots"><span></span><span></span><span></span></div>
                <div class="dash-search">Search Modules...</div>
              </div>
              <div class="dash-body">
                <div class="dash-sidebar">
                  <div class="bar"></div><div class="bar"></div><div class="bar"></div>
                </div>
                <div class="dash-content">
                  <div class="widget-row">
                    <div class="widget lg">
                      <div class="chart-line"></div>
                    </div>
                    <div class="widget sm"></div>
                  </div>
                  <div class="widget-row">
                    <div class="widget md"></div>
                    <div class="widget md"></div>
                  </div>
                </div>
              </div>
              <div class="float-card users">
                <i class="pi pi-users"></i>
                <div><span>New Users</span><strong>+128</strong></div>
              </div>
              <div class="float-card sales">
                <i class="pi pi-chart-line"></i>
                <div><span>Revenue</span><strong>$42k</strong></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section class="trust-section">
        <div class="container">
          <p>POWERING NEXT-GEN ENTERPRISES</p>
          <div class="logos">
            <i class="pi pi-google"></i>
            <i class="pi pi-amazon"></i>
            <i class="pi pi-microsoft"></i>
            <i class="pi pi-apple"></i>
            <i class="pi pi-discord"></i>
            <i class="pi pi-slack"></i>
          </div>
        </div>
      </section>

      <section class="problem-solution container reveal-on-scroll">
        <div class="section-head">
          <h2>The Fragmentation Trap</h2>
          <p>Why modern businesses stop growing.</p>
        </div>
        <div class="problem-grid">
          @for (prob of problems(); track prob.title) {
            <div class="problem-card">
              <div class="icon-box"><i class="pi" [class]="prob.icon"></i></div>
              <h3>{{ prob.title }}</h3>
              <p>{{ prob.desc }}</p>
            </div>
          }
        </div>
      </section>

      <div id="solutions" class="deep-dive-wrapper">
        <div class="section-head container">
          <h2>The Infinite Suite</h2>
          <p>20+ Integrated Modules. One Source of Truth.</p>
        </div>

        @for (feature of deepDiveFeatures(); track feature.id; let i = $index) {
          <section class="feature-row reveal-on-scroll" [class.reversed]="i % 2 !== 0">
            <div class="container row-inner">
              
              <div class="feature-text">
                <div class="feature-pill" [style.background]="feature.colorVar + '20'" [style.color]="feature.colorVar">
                  {{ feature.category }}
                </div>
                <h3>{{ feature.title }}</h3>
                <span class="tagline">{{ feature.tagline }}</span>
                <p>{{ feature.description }}</p>
                
                <ul class="check-points">
                  @for (pt of feature.points; track pt) {
                    <li><i class="pi pi-check" [style.color]="feature.colorVar"></i> {{ pt }}</li>
                  }
                </ul>

                <div class="metric-badge" *ngIf="feature.metric">
                  <span class="lbl">{{ feature.metric.label }}</span>
                  <span class="val" [style.color]="feature.colorVar">{{ feature.metric.value }}</span>
                </div>
              </div>

              <div class="feature-visual">
                <div class="glass-window" [style.border-top-color]="feature.colorVar">
                  <div class="window-controls"><span></span><span></span></div>
                  <div class="window-body center-content">
                    <i [class]="feature.icon" class="main-icon" [style.color]="feature.colorVar"></i>
                    <div class="abstract-lines">
                      <div class="line" style="width: 80%"></div>
                      <div class="line" style="width: 60%"></div>
                      <div class="line" style="width: 90%"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        }
      </div>

      <section class="ai-section reveal-on-scroll">
        <div class="container ai-grid">
          <div class="ai-visual">
            <div class="brain-graphic">
              <i class="pi pi-sparkles"></i>
            </div>
          </div>
          <div class="ai-content">
            <span class="highlight">POWERED BY APEX INTELLIGENCE</span>
            <h2>Your Business, Self-Driving.</h2>
            <p>Apex AI doesn't just report history; it predicts the future. Forecast cash flow, detect inventory theft, and auto-generate purchase orders.</p>
            <div class="chat-sim">
              <div class="msg user">"Analyze Q3 profit margins."</div>
              <div class="msg bot">"Margins are up 12% driven by lower logistics costs in the North region."</div>
            </div>
          </div>
        </div>
      </section>

      <section id="developers" class="dev-section container reveal-on-scroll">
        <div class="section-head">
          <h2>Built for Builders</h2>
          <p>Extensible API first architecture.</p>
        </div>
        <div class="tech-grid">
          @for (tech of techStack(); track tech.name) {
            <div class="tech-card">
              <i [class]="tech.icon"></i>
              <span>{{ tech.name }}</span>
            </div>
          }
        </div>
        <div class="code-block">
          <div class="code-head">inventory-sync.ts</div>
          <pre><code><span class="kwd">import</span> {{ '{' }} ApexClient {{ '}' }} <span class="kwd">from</span> '@apex/sdk';

<span class="kwd">const</span> client = <span class="kwd">new</span> ApexClient(API_KEY);

<span class="comment">// Real-time stock update</span>
<span class="kwd">await</span> client.inventory.sync({{ '{' }}
  sku: 'IPHONE-15-PRO',
  qty: 50,
  warehouse: 'MUM-01'
{{ '}' }});</code></pre>
        </div>
      </section>

      <section id="pricing" class="pricing-section container reveal-on-scroll">
        <div class="section-head">
          <h2>Transparent Pricing</h2>
        </div>
        <div class="pricing-grid">
          <div class="price-card glass">
            <h3>Starter</h3>
            <div class="amount">₹4,999<span>/mo</span></div>
            <ul>
              <li><i class="pi pi-check"></i> 1 Branch</li>
              <li><i class="pi pi-check"></i> Finance & Inventory</li>
              <li><i class="pi pi-check"></i> 2 Users</li>
            </ul>
            <button class="p-button p-button-outlined w-full">Start Free</button>
          </div>
          <div class="price-card glass popular">
            <div class="ribbon">BEST VALUE</div>
            <h3>Growth</h3>
            <div class="amount">₹12,999<span>/mo</span></div>
            <ul>
              <li><i class="pi pi-check"></i> 5 Branches</li>
              <li><i class="pi pi-check"></i> HR, Payroll & Storefront</li>
              <li><i class="pi pi-check"></i> 10 Users</li>
            </ul>
            <button class="p-button p-button-primary w-full">Go Pro</button>
          </div>
          <div class="price-card glass">
            <h3>Enterprise</h3>
            <div class="amount">Custom</div>
            <ul>
              <li><i class="pi pi-check"></i> Unlimited Branches</li>
              <li><i class="pi pi-check"></i> AI Agent Access</li>
              <li><i class="pi pi-check"></i> Dedicated Support</li>
            </ul>
            <button class="p-button p-button-outlined w-full">Contact Sales</button>
          </div>
        </div>
      </section>

      <section class="testimonial-section container reveal-on-scroll">
        <h2>From the Founders</h2>
        <div class="review-grid">
          <div class="review-card glass">
            <p>"We reduced our audit time from 15 days to 2 hours. The real-time ledger is magic."</p>
            <div class="user">
              <div class="avatar">R</div>
              <div><strong>Rahul S.</strong><br><small>CFO, TechFlow</small></div>
            </div>
          </div>
          <div class="review-card glass">
            <p>"The storefront builder allowed us to go D2C in a weekend. Inventory sync is flawless."</p>
            <div class="user">
              <div class="avatar">P</div>
              <div><strong>Priya M.</strong><br><small>Founder, StyleUp</small></div>
            </div>
          </div>
        </div>
      </section>

      <!-- CUSTOM ACCORDION (Replaced p-accordion) -->
      <section class="faq-section container reveal-on-scroll">
        <h2>Common Questions</h2>
        <div class="faq-wrapper">
          <div class="accordion-root">
            @for (faq of faqs(); track faq.id; let i = $index) {
              <div class="accordion-item" [class.active]="activeAccordionIndex() === i">
                <button class="accordion-header" (click)="toggleAccordion(i)">
                  <span class="faq-head">{{ faq.question }}</span>
                  <i class="pi" [class.pi-chevron-down]="activeAccordionIndex() !== i" [class.pi-chevron-up]="activeAccordionIndex() === i"></i>
                </button>
                <div class="accordion-content" *ngIf="activeAccordionIndex() === i">
                  <p class="faq-body">{{ faq.answer }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="final-cta reveal-on-scroll">
        <div class="container">
          <div class="cta-box glass">
            <h2>Ready to Scale?</h2>
            <p>Join 500+ high-growth companies today.</p>
            <button class="p-button p-button-lg p-button-primary p-button-rounded">Get Started Free</button>
          </div>
        </div>
      </section>

      <footer class="main-footer">
        <div class="container footer-content">
          <div class="col brand-col">
            <h3>APEX INFINITY</h3>
            <p>© 2026 Apex Systems.</p>
          </div>
          <div class="col">
            <h4>Product</h4>
            <a href="#">Finance</a>
            <a href="#">HR & Payroll</a>
            <a href="#">Commerce</a>
          </div>
          <div class="col">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API Reference</a>
            <a href="#">Status</a>
          </div>
          <div class="col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&family=Fira+Code&display=swap');
    /* Note: In a real app, include primeicons.css. Here we assume generic icon support or load it via global CSS */

    // Force override for Landing Page Isolation
    .landing-root {
      // Variables from user request
      --bg-primary: #050505;
      --text-primary: #ffffff;
      --font-body: 'Inter', sans-serif;
      --accent-primary: #3b82f6;
      --accent-primary-rgb: 59, 130, 246;
      --accent-secondary: #8b5cf6;
      --accent-tertiary: #ec4899;
      --accent-tertiary-rgb: 236, 72, 153;
      --text-secondary: #94a3b8;
      --text-tertiary: #64748b;
      --color-success: #10b981;
      --color-error: #ef4444;
      --color-info: #0ea5e9;
      --color-warning: #f59e0b;

      background-color: var(--bg-primary) !important;
      color: var(--text-primary) !important;
      font-family: var(--font-body) !important;
      overflow-x: hidden !important;
      position: relative !important;
      width: 100% !important;
      line-height: 1.5 !important;
      min-height: 100vh;

      // Reset basic elements inside landing
      h1, h2, h3, h4, p, ul, li {
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      // --- Custom Mock PrimeNG Styles ---
      .p-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0.75rem 1.25rem !important;
        font-family: var(--font-body) !important;
        font-weight: 600 !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
        border: 1px solid transparent !important;
        outline: none !important;
        font-size: 1rem !important;
        background: transparent !important;
        color: var(--accent-primary) !important;
      }

      .p-button-primary {
        background: var(--accent-primary) !important;
        color: #ffffff !important;
        border-color: var(--accent-primary) !important;
        &:hover { background: color-mix(in srgb, var(--accent-primary) 90%, white) !important; }
      }

      .p-button-outlined {
        background: transparent !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        color: #ffffff !important;
        &:hover { border-color: var(--accent-primary) !important; background: rgba(var(--accent-primary-rgb), 0.1) !important; }
      }

      .p-button-rounded {
        border-radius: 9999px !important;
      }

      .p-button-text {
        background: transparent !important;
        border-color: transparent !important;
        color: #fff !important;
        &:hover { background: rgba(255,255,255,0.05) !important; }
      }

      .p-button-lg {
        padding: 1rem 2rem !important;
        font-size: 1.125rem !important;
      }
      
      .w-full { width: 100% !important; }
      .font-bold { font-weight: 700 !important; }
      .mr-2 { margin-right: 0.5rem !important; }

      // --- Mixins ---
      @mixin glass-panel {
        background: rgba(255, 255, 255, 0.02) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 20px !important;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
      }

      .container {
        max-width: 1300px !important;
        margin: 0 auto !important;
        padding: 0 24px !important;
      }

      // 1. Navbar
      .navbar {
        position: fixed !important;
        top: 0 !important; left: 0 !important; width: 100% !important;
        z-index: 1000 !important;
        padding: 20px 0 !important;
        transition: all 0.3s ease !important;

        &.navbar-scrolled {
          background: rgba(10,10,10,0.85) !important;
          backdrop-filter: blur(20px) !important;
          padding: 10px 0 !important;
          border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        }

        .nav-content {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }

        .brand {
          display: flex !important; align-items: center !important; gap: 10px !important;
          .logo-box {
            width: 36px !important; height: 36px !important;
            background: var(--accent-primary) !important;
            color: #fff !important;
            border-radius: 8px !important;
            display: grid !important; place-items: center !important;
            font-size: 1.2rem !important;
          }
          .logo-text { font-size: 1.25rem !important; font-weight: 500 !important; }
        }

        .desktop-links {
          display: none !important;
          gap: 30px !important;
          @media(min-width: 992px) { display: flex !important; }
          a {
            color: var(--text-secondary) !important;
            text-decoration: none !important;
            font-weight: 500 !important;
            &:hover { color: var(--accent-primary) !important; }
          }
        }

        .nav-actions {
          display: none !important; gap: 15px !important;
          @media(min-width: 992px) { display: flex !important; }
        }
        
        .mobile-toggle {
          background: none !important; border: none !important; font-size: 1.5rem !important;
          color: var(--text-primary) !important;
          @media(min-width: 992px) { display: none !important; }
        }
      }

      // --- MOBILE MENU FIX (ADDED STYLES) ---
      .mobile-menu-overlay {
        position: fixed !important; inset: 0 !important; background: rgba(0,0,0,0.6) !important; backdrop-filter: blur(4px) !important;
        z-index: 1001 !important; opacity: 0 !important; pointer-events: none !important; transition: opacity 0.3s !important;
        &.open { opacity: 1 !important; pointer-events: auto !important; }
      }

      .mobile-nav {
        position: fixed !important; top: 0 !important; right: -300px !important; width: 300px !important; height: 100vh !important;
        background: #0a0a0a !important; border-left: 1px solid rgba(255,255,255,0.1) !important;
        z-index: 1002 !important; transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        padding: 24px !important; display: flex !important; flex-direction: column !important;
        
        &.open { right: 0 !important; }

        .mobile-nav-header {
           display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 40px !important;
           .logo-text { font-size: 1.2rem !important; }
           .close-btn { background: none !important; border: none !important; color: #fff !important; font-size: 1.5rem !important; }
        }
        
        .mobile-links {
            display: flex !important; flex-direction: column !important; gap: 10px !important;
            a { 
                display: block !important; padding: 16px 0 !important; 
                border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
                color: #ccc !important; text-decoration: none !important; font-size: 1.1rem !important; 
                &:hover { color: var(--accent-primary) !important; padding-left: 10px !important; transition: 0.2s !important; }
            }
        }

        .mobile-actions { 
            margin-top: auto !important; display: flex !important; flex-direction: column !important; gap: 12px !important; 
        }
      }

      // 2. Hero
      .hero-section {
        padding-top: 140px !important;
        padding-bottom: 100px !important;
        position: relative !important;
        
        .glow-orb {
          position: absolute !important;
          width: 600px !important; height: 600px !important;
          background: var(--accent-primary) !important;
          filter: blur(150px) !important;
          opacity: 0.15 !important;
          z-index: -1 !important;
          border-radius: 50% !important;
          &.top-right { top: -200px !important; right: -100px !important; }
          &.bottom-left { bottom: -100px !important; left: -200px !important; background: var(--accent-secondary) !important; }
        }

        .hero-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 50px !important;
          align-items: center !important;
          @media(min-width: 992px) { grid-template-columns: 1.1fr 0.9fr !important; }
        }

        .hero-text {
          h1 {
            font-size: 3.5rem !important;
            line-height: 1.1 !important;
            font-weight: 800 !important;
            margin-bottom: 20px !important;
            background: linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
          }
          .hero-sub {
            font-size: 1.2rem !important;
            color: var(--text-secondary) !important;
            margin-bottom: 40px !important;
            max-width: 90% !important;
          }
          .accent-pill {
            display: inline-flex !important; align-items: center !important; gap: 8px !important;
            padding: 6px 14px !important;
            border-radius: 20px !important;
            background: rgba(var(--accent-primary-rgb), 0.1) !important;
            color: var(--accent-primary) !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            margin-bottom: 24px !important;
            border: 1px solid rgba(var(--accent-primary-rgb), 0.2) !important;
          }
          .hero-cta { display: flex !important; gap: 15px !important; margin-bottom: 50px !important; }
          .hero-stats {
            display: flex !important; gap: 40px !important; border-top: 1px solid rgba(255,255,255,0.1) !important; padding-top: 20px !important;
            .stat-item {
              strong { display: block !important; font-size: 1.8rem !important; font-weight: 700 !important; }
              span { font-size: 0.8rem !important; color: var(--text-tertiary) !important; text-transform: uppercase !important; }
            }
          }
        }

        .glass-dashboard {
          @include glass-panel;
          height: 450px !important;
          position: relative !important;
          padding: 20px !important;
          transform: perspective(1000px) rotateY(-5deg) !important;
          transition: transform 0.5s ease !important;
          &:hover { transform: perspective(1000px) rotateY(0deg) !important; }

          .dash-header {
            display: flex !important; justify-content: space-between !important; margin-bottom: 20px !important;
            .dots span { display: inline-block !important; width: 8px !important; height: 8px !important; background: rgba(255,255,255,0.2) !important; border-radius: 50% !important; margin-right: 5px !important; }
            .dash-search { width: 150px !important; height: 10px !important; background: rgba(255,255,255,0.1) !important; border-radius: 4px !important; }
          }
          .dash-body {
            display: flex !important; gap: 20px !important; height: 80% !important;
            .dash-sidebar {
              width: 50px !important; border-right: 1px solid rgba(255,255,255,0.05) !important;
              .bar { height: 8px !important; width: 30px !important; background: rgba(255,255,255,0.1) !important; margin-bottom: 10px !important; border-radius: 4px !important; }
            }
            .dash-content {
              flex: 1 !important;
              .widget-row { display: flex !important; gap: 15px !important; margin-bottom: 15px !important; }
              .widget { 
                background: rgba(255,255,255,0.03) !important; border-radius: 12px !important; 
                &.lg { flex: 2 !important; height: 150px !important; position: relative !important; overflow: hidden !important; }
                &.sm { flex: 1 !important; height: 150px !important; }
                &.md { flex: 1 !important; height: 120px !important; }
              }
              .chart-line {
                width: 100% !important; height: 100% !important;
                background: linear-gradient(90deg, transparent, rgba(var(--accent-primary-rgb), 0.2)) !important;
                clip-path: polygon(0 80%, 20% 60%, 40% 70%, 60% 40%, 80% 50%, 100% 20%, 100% 100%, 0 100%) !important;
              }
            }
          }
          .float-card {
            position: absolute !important; @include glass-panel;
            padding: 12px 20px !important; display: flex !important; align-items: center !important; gap: 15px !important;
            background: #111 !important; border: 1px solid rgba(255,255,255,0.15) !important;
            i { font-size: 1.5rem !important; }
            &.users { top: 40px !important; right: -30px !important; i { color: var(--accent-secondary) !important; } }
            &.sales { bottom: 60px !important; left: -30px !important; i { color: var(--color-success) !important; } }
          }
        }
      }

      // 3. Trust
      .trust-section {
        text-align: center !important; padding: 60px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important;
        p { font-size: 0.8rem !important; letter-spacing: 2px !important; color: var(--text-tertiary) !important; margin-bottom: 30px !important; }
        .logos { display: flex !important; justify-content: center !important; gap: 60px !important; flex-wrap: wrap !important; i { font-size: 2rem !important; opacity: 0.4 !important; } }
      }

      // 4. Problem/Solution
      .problem-solution {
        padding: 100px 24px !important;
        .section-head { text-align: center !important; margin-bottom: 60px !important; h2 { font-size: 2.5rem !important; margin-bottom: 10px !important; } p { color: var(--text-secondary) !important; } }
        .problem-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important; gap: 30px !important; }
        .problem-card {
          @include glass-panel; padding: 30px !important; text-align: center !important;
          .icon-box { font-size: 2rem !important; color: var(--color-error) !important; margin-bottom: 20px !important; }
          h3 { font-size: 1.2rem !important; margin-bottom: 10px !important; }
          p { font-size: 0.9rem !important; color: var(--text-secondary) !important; }
        }
      }

      // 5-14. Features Loop
      .deep-dive-wrapper {
        padding-bottom: 100px !important;
        .section-head { text-align: center !important; margin-bottom: 80px !important; padding-top: 80px !important; h2 { font-size: 3rem !important; margin-bottom: 10px !important; } }
        
        .feature-row {
          padding: 80px 0 !important;
          
          .row-inner {
            display: grid !important; grid-template-columns: 1fr !important; gap: 60px !important; align-items: center !important;
            @media(min-width: 992px) { grid-template-columns: 1fr 1fr !important; }
          }

          &.reversed .row-inner {
            @media(min-width: 992px) {
              .feature-text { order: 2 !important; }
              .feature-visual { order: 1 !important; }
            }
          }

          .feature-text {
            .feature-pill { display: inline-block !important; padding: 4px 12px !important; border-radius: 12px !important; font-size: 0.75rem !important; font-weight: 700 !important; text-transform: uppercase !important; margin-bottom: 15px !important; }
            h3 { font-size: 2.5rem !important; margin-bottom: 5px !important; }
            .tagline { display: block !important; font-size: 1.2rem !important; color: var(--text-secondary) !important; margin-bottom: 20px !important; }
            p { font-size: 1rem !important; line-height: 1.6 !important; color: var(--text-secondary) !important; margin-bottom: 30px !important; }
            .check-points {
              list-style: none !important; margin-bottom: 30px !important;
              li { display: flex !important; align-items: center !important; gap: 10px !important; margin-bottom: 10px !important; font-size: 1rem !important; }
            }
            .metric-badge {
              display: inline-flex !important; flex-direction: column !important; padding-left: 20px !important; border-left: 3px solid rgba(255,255,255,0.1) !important;
              .lbl { font-size: 0.75rem !important; color: var(--text-tertiary) !important; text-transform: uppercase !important; }
              .val { font-size: 1.8rem !important; font-weight: 800 !important; }
            }
          }

          .feature-visual {
            .glass-window {
              @include glass-panel; height: 350px !important; width: 100% !important; border-top-width: 3px !important;
              display: flex !important; flex-direction: column !important;
              .window-controls { padding: 15px !important; display: flex !important; gap: 8px !important; span { width: 10px !important; height: 10px !important; background: rgba(255,255,255,0.2) !important; border-radius: 50% !important; } }
              .window-body {
                flex: 1 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-direction: column !important;
                .main-icon { font-size: 5rem !important; margin-bottom: 30px !important; opacity: 0.8 !important; }
                .abstract-lines {
                  width: 60% !important; display: flex !important; flex-direction: column !important; gap: 10px !important;
                  .line { height: 8px !important; background: rgba(255,255,255,0.05) !important; border-radius: 4px !important; }
                }
              }
            }
          }
        }
      }

      // 15. AI Section
      .ai-section {
        background: #000 !important; padding: 100px 0 !important; border-top: 1px solid rgba(255,255,255,0.1) !important;
        .ai-grid {
          display: grid !important; grid-template-columns: 1fr !important; gap: 50px !important; align-items: center !important;
          @media(min-width: 992px) { grid-template-columns: 1fr 1fr !important; }
        }
        .brain-graphic { font-size: 8rem !important; color: var(--accent-tertiary) !important; text-align: center !important; animation: pulse-glow 3s infinite !important; }
        .highlight { color: var(--accent-tertiary) !important; font-weight: 700 !important; letter-spacing: 1px !important; font-size: 0.8rem !important; }
        h2 { font-size: 3rem !important; margin: 15px 0 !important; }
        .chat-sim {
          margin-top: 30px !important; display: flex !important; flex-direction: column !important; gap: 15px !important;
          .msg {
            padding: 15px 20px !important; border-radius: 20px !important; font-size: 0.9rem !important; max-width: 80% !important;
            &.user { align-self: flex-end !important; background: rgba(255,255,255,0.1) !important; }
            &.bot { align-self: flex-start !important; background: rgba(var(--accent-tertiary-rgb), 0.2) !important; border: 1px solid var(--accent-tertiary) !important; color: #fff !important; }
          }
        }
      }

      // 16. Dev Section
      .dev-section {
        padding: 100px 24px !important; text-align: center !important;
        .tech-grid { display: flex !important; justify-content: center !important; gap: 40px !important; margin: 40px 0 !important; }
        .tech-card { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; i { font-size: 2rem !important; } }
        .code-block {
          text-align: left !important; background: #1e1e1e !important; padding: 20px !important; border-radius: 12px !important; max-width: 700px !important; margin: 0 auto !important; box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
          .code-head { font-family: monospace !important; color: #666 !important; border-bottom: 1px solid #333 !important; padding-bottom: 10px !important; margin-bottom: 15px !important; }
          pre { color: #ccc !important; font-family: 'Fira Code', monospace !important; font-size: 0.9rem !important; overflow-x: auto !important; }
          .kwd { color: #c678dd !important; } .comment { color: #5c6370 !important; }
        }
      }

      // 17. Pricing
      .pricing-section {
        padding: 100px 24px !important;
        .pricing-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; gap: 30px !important; margin-top: 50px !important; }
        .price-card {
          @include glass-panel; padding: 40px !important; text-align: center !important; position: relative !important;
          &.popular { border: 1px solid var(--accent-primary) !important; background: rgba(var(--accent-primary-rgb), 0.05) !important; transform: scale(1.05) !important; z-index: 2 !important; }
          .ribbon { position: absolute !important; top: -12px !important; left: 50% !important; transform: translateX(-50%) !important; background: var(--accent-primary) !important; padding: 4px 12px !important; font-size: 0.7rem !important; border-radius: 10px !important; font-weight: 700 !important; }
          .amount { font-size: 2.5rem !important; font-weight: 700 !important; margin: 20px 0 !important; span { font-size: 1rem !important; color: var(--text-tertiary) !important; font-weight: 400 !important; } }
          ul { list-style: none !important; margin-bottom: 30px !important; text-align: left !important; li { margin-bottom: 10px !important; i { color: var(--color-success) !important; margin-right: 10px !important; } } }
        }
      }

      // 18. Testimonials
      .testimonial-section {
        padding: 100px 24px !important; text-align: center !important;
        h2 { margin-bottom: 60px !important; font-size: 2.5rem !important; }
        .review-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; gap: 30px !important; }
        .review-card {
          @include glass-panel; padding: 30px !important; text-align: left !important;
          p { font-size: 1.1rem !important; font-style: italic !important; margin-bottom: 20px !important; }
          .user { display: flex !important; align-items: center !important; gap: 15px !important; .avatar { width: 40px !important; height: 40px !important; background: #333 !important; border-radius: 50% !important; display: grid !important; place-items: center !important; } }
        }
      }

      // 19. FAQ - Custom Accordion Styles
      .faq-section {
        padding: 100px 24px !important; max-width: 900px !important; margin: 0 auto !important;
        h2 { text-align: center !important; margin-bottom: 50px !important; }
        
        .accordion-root {
          display: flex !important; flex-direction: column !important; gap: 15px !important;
        }

        .accordion-item {
          @include glass-panel; border-radius: 12px !important; overflow: hidden !important;
          transition: all 0.3s !important;
          
          &.active { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.05) !important; }

          .accordion-header {
            width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important;
            padding: 20px !important; background: transparent !important; border: none !important;
            color: #fff !important; font-weight: 600 !important; cursor: pointer !important; text-align: left !important;
            font-size: 1.1rem !important;
            
            i { font-size: 0.9rem !important; opacity: 0.7 !important; transition: transform 0.3s !important; }
          }

          .accordion-content {
            padding: 0 20px 20px !important; color: #ccc !important; line-height: 1.6 !important;
            border-top: 1px solid rgba(255,255,255,0.05) !important;
          }
        }
      }

      // 20. CTA
      .final-cta {
        padding: 100px 24px !important;
        .cta-box { @include glass-panel; text-align: center !important; padding: 80px 20px !important; h2 { font-size: 3rem !important; margin-bottom: 20px !important; } button { margin-top: 30px !important; } }
      }

      // 21. Footer
      .main-footer {
        background: #050505 !important; padding: 80px 0 40px !important; border-top: 1px solid rgba(255,255,255,0.05) !important;
        .footer-content { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important; gap: 40px !important; }
        h3 { font-size: 1.2rem !important; margin-bottom: 15px !important; color: #fff !important; }
        h4 { color: #888 !important; font-size: 0.9rem !important; margin-bottom: 20px !important; text-transform: uppercase !important; }
        a { display: block !important; color: #666 !important; margin-bottom: 10px !important; transition: 0.2s !important; &:hover { color: #fff !important; } }
      }

      // Animation
      @keyframes pulse-glow { 0% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(1); } }
      .reveal-on-scroll { opacity: 0 !important; transform: translateY(30px) !important; transition: all 0.8s ease-out !important; &.reveal-visible { opacity: 1 !important; transform: translateY(0) !important; } }
    }
  `]
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private scrollObserver: IntersectionObserver | null = null;

  readonly scrollY = signal(0);
  readonly activeTab = signal('finance');
  readonly mobileMenuOpen = signal(false);
  readonly activeAccordionIndex = signal<number | null>(0);

  // 1. Hero Data
  readonly heroData = signal({
    headline: 'Architecting the Infinite Enterprise.',
    subhead: 'Apex Infinity is the only ERP that unifies Financials, Supply Chain, and Human Capital with a reactive, sub-50ms core.',
    stats: [
      { label: 'Modules', value: '24+' },
      { label: 'Active Orgs', value: '500+' },
      { label: 'Uptime', value: '99.99%' }
    ]
  });

  // 2. The Massive Feature List (Restoring Depth)
  readonly deepDiveFeatures = signal<FeatureDetail[]>([
    {
      id: 'finance',
      category: 'Financial Core',
      title: 'Real-Time General Ledger',
      tagline: 'The Heart of Truth',
      description: 'A double-entry accounting engine that updates instantly. Every sale, purchase, and payroll run impacts the ledger in real-time. No end-of-day batch processing.',
      points: ['Multi-Branch Consolidation', 'Automated GST/Tax Filing', 'Audit Trail & Immutable Logs'],
      icon: 'pi pi-wallet',
      colorVar: 'var(--color-success)',
      metric: { label: 'Reconciliation Speed', value: '< 200ms' }
    },
    {
      id: 'inventory',
      category: 'Supply Chain',
      title: 'Multi-Location Inventory',
      tagline: 'Global Visibility',
      description: 'Track stock across warehouses, retail outlets, and transit vans. Smart transfer orders and low-stock alerts ensure you never miss a sale.',
      points: ['Batch & Expiry Tracking', 'Barcode/QR Scanning Support', 'Automated Replenishment'],
      icon: 'pi pi-box',
      colorVar: 'var(--accent-primary)',
      metric: { label: 'Stock Accuracy', value: '100%' }
    },
    {
      id: 'storefront',
      category: 'Commerce',
      title: 'Headless Storefront Builder',
      tagline: 'B2B & B2C Unified',
      description: 'Launch a pixel-perfect public store directly from your ERP. Inventory syncs instantly. Manage SEO, banners, and pricing without IT help.',
      points: ['Drag-and-Drop Page Builder', 'Real-time Stock Sync', 'Customer Portal Built-in'],
      icon: 'pi pi-shopping-cart',
      colorVar: 'var(--accent-secondary)',
      metric: { label: 'Deploy Time', value: '5 Mins' }
    },
    {
      id: 'hr',
      category: 'Human Capital',
      title: 'Biometric Attendance & Payroll',
      tagline: 'Manage People, Not Paper',
      description: 'Direct integration with biometric devices. Automated shift scheduling, leave management, and one-click payroll generation based on actual hours.',
      points: ['Geo-fenced Mobile Punching', 'Complex Shift Rotations', 'Payslip Generation'],
      icon: 'pi pi-users',
      colorVar: 'var(--color-info)',
      metric: { label: 'Payroll Errors', value: '0%' }
    },
    {
      id: 'emi',
      category: 'Lending Engine',
      title: 'EMI Lifecycle Management',
      tagline: 'Automated Collections',
      description: 'Designed for electronics retailers and financiers. Track down-payments, interest schedules, and automate SMS reminders for due installments.',
      points: ['Amortization Schedules', 'Penalty Calculation', 'Bad Debt Analytics'],
      icon: 'pi pi-calculator',
      colorVar: 'var(--color-warning)',
      metric: { label: 'Recovery Rate', value: '+18%' }
    },
    {
      id: 'ai',
      category: 'Intelligence',
      title: 'Apex AI Analyst',
      tagline: 'Your 24/7 CFO',
      description: 'Stop writing SQL. Ask questions like "Which branch had the highest profit margin last week?" and get visual answers instantly.',
      points: ['Natural Language Querying', 'Trend Forecasting', 'Anomaly Detection'],
      icon: 'pi pi-bolt',
      colorVar: 'var(--accent-tertiary)',
      metric: { label: 'Response Time', value: 'instant' }
    },
    {
      id: 'sales',
      category: 'Sales Force',
      title: 'Omnichannel Sales Order',
      tagline: 'Sell Everywhere',
      description: 'Unify offline POS, online orders, and B2B quotes. One screen to manage approvals, shipping, and invoicing across all channels.',
      points: ['Quotation to Invoice Flow', 'Credit Limit Checks', 'Sales Commission Tracking'],
      icon: 'pi pi-percentage',
      colorVar: 'var(--text-secondary)'
    },
    {
      id: 'purchase',
      category: 'Procurement',
      title: 'Smart Procurement',
      tagline: 'Optimize Spending',
      description: 'Vendor portals, purchase requisition workflows, and landed cost calculations. Know exactly what your inventory costs.',
      points: ['Vendor Performance Rating', 'GRN Verification', 'Landed Cost Analysis'],
      icon: 'pi pi-truck',
      colorVar: 'var(--color-error)'
    },
    {
      id: 'manufacturing',
      category: 'Production',
      title: 'Light Manufacturing',
      tagline: 'Bill of Materials',
      description: 'Manage BOMs, raw material consumption, and finished goods production. Perfect for assembly and packaging units.',
      points: ['Raw Material Planning', 'Wastage Tracking', 'Production Costing'],
      icon: 'pi pi-cog',
      colorVar: 'var(--text-primary)'
    },
    {
      id: 'assets',
      category: 'Asset Mgmt',
      title: 'Fixed Asset Tracking',
      tagline: 'Value Over Time',
      description: 'Depreciation schedules, asset maintenance logs, and location tracking for all company equipment.',
      points: ['Automated Depreciation', 'Maintenance Alerts', 'QR Asset Tagging'],
      icon: 'pi pi-building',
      colorVar: 'var(--accent-primary)'
    }
  ]);

  // 3. Problem/Solution Data
  readonly problems = signal([
    { title: 'Data Silos', desc: 'Finance doesn\'t talk to Sales.', icon: 'pi-server' },
    { title: 'Slow Closing', desc: 'Month-end takes 15 days.', icon: 'pi-calendar-times' },
    { title: 'Stock Outs', desc: 'Lost sales due to bad inventory data.', icon: 'pi-exclamation-triangle' },
    { title: 'Manual Error', desc: 'Spreadsheets serve as databases.', icon: 'pi-file-excel' }
  ]);

  // 4. FAQ Data
  readonly faqs = signal([
    { id: '1', question: 'How long does implementation take?', answer: 'For standard setups, you can go live in 48 hours. Enterprise migrations typically take 2-3 weeks.' },
    { id: '2', question: 'Is my data secure?', answer: 'We use AES-256 encryption at rest and TLS 1.3 in transit. We are ISO 27001 compliant.' },
    { id: '3', question: 'Can I customize the print formats?', answer: 'Yes, our "Print Designer" lets you drag-and-drop to create custom invoices, POs, and labels.' },
    { id: '4', question: 'Does it support multi-currency?', answer: 'Yes, automated exchange rate fetching and realized/unrealized gain/loss reporting is built-in.' }
  ]);

  // 5. Tech Stack (For the "Tech" section)
  readonly techStack = signal([
    { name: 'Angular 20', icon: 'pi pi-code' },
    { name: 'PrimeNG', icon: 'pi pi-palette' },
    { name: 'Signals', icon: 'pi pi-bolt' },
    { name: 'Node.js', icon: 'pi pi-server' }
  ]);

  constructor() {}

  ngOnInit() {
    // Theme logic removed to ensure standalone functionality
  }

  ngAfterViewInit() {
    this.initScrollObserver();
  }

  ngOnDestroy() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrollY.set(window.scrollY);
  }

  private initScrollObserver() {
    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-on-scroll').forEach(el => this.scrollObserver?.observe(el));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleAccordion(index: number) {
    if (this.activeAccordionIndex() === index) {
      this.activeAccordionIndex.set(null);
    } else {
      this.activeAccordionIndex.set(index);
    }
  }
}
// import { Component, OnInit, AfterViewInit, HostListener, signal, inject, ViewEncapsulation, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { ButtonModule } from 'primeng/button';
// import { TooltipModule } from 'primeng/tooltip';
// import { AccordionModule } from 'primeng/accordion';
// import { ThemeService } from '../core/services/theme.service';

// interface FeatureDetail {
//   id: string;
//   category: string;
//   title: string;
//   tagline: string;
//   description: string;
//   points: string[];
//   icon: string;
//   colorVar: string;
//   metric?: { label: string; value: string };
// }

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [CommonModule, RouterModule, ButtonModule, TooltipModule, AccordionModule],
//   templateUrl: './landing.component.html',
//   styleUrl: './landing.component.scss',
//   encapsulation: ViewEncapsulation.None 
// })
// export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
//   private themeService = inject(ThemeService);
//   private scrollObserver: IntersectionObserver | null = null;

//   readonly scrollY = signal(0);
//   readonly activeTab = signal('finance');
//   readonly mobileMenuOpen = signal(false);

//   // 1. Hero Data
//   readonly heroData = signal({
//     headline: 'Architecting the Infinite Enterprise.',
//     subhead: 'Apex Infinity is the only ERP that unifies Financials, Supply Chain, and Human Capital with a reactive, sub-50ms core.',
//     stats: [
//       { label: 'Modules', value: '24+' },
//       { label: 'Active Orgs', value: '500+' },
//       { label: 'Uptime', value: '99.99%' }
//     ]
//   });

//   // 2. The Massive Feature List (Restoring Depth)
//   readonly deepDiveFeatures = signal<FeatureDetail[]>([
//     {
//       id: 'finance',
//       category: 'Financial Core',
//       title: 'Real-Time General Ledger',
//       tagline: 'The Heart of Truth',
//       description: 'A double-entry accounting engine that updates instantly. Every sale, purchase, and payroll run impacts the ledger in real-time. No end-of-day batch processing.',
//       points: ['Multi-Branch Consolidation', 'Automated GST/Tax Filing', 'Audit Trail & Immutable Logs'],
//       icon: 'pi pi-wallet',
//       colorVar: 'var(--color-success)',
//       metric: { label: 'Reconciliation Speed', value: '< 200ms' }
//     },
//     {
//       id: 'inventory',
//       category: 'Supply Chain',
//       title: 'Multi-Location Inventory',
//       tagline: 'Global Visibility',
//       description: 'Track stock across warehouses, retail outlets, and transit vans. Smart transfer orders and low-stock alerts ensure you never miss a sale.',
//       points: ['Batch & Expiry Tracking', 'Barcode/QR Scanning Support', 'Automated Replenishment'],
//       icon: 'pi pi-box',
//       colorVar: 'var(--accent-primary)',
//       metric: { label: 'Stock Accuracy', value: '100%' }
//     },
//     {
//       id: 'storefront',
//       category: 'Commerce',
//       title: 'Headless Storefront Builder',
//       tagline: 'B2B & B2C Unified',
//       description: 'Launch a pixel-perfect public store directly from your ERP. Inventory syncs instantly. Manage SEO, banners, and pricing without IT help.',
//       points: ['Drag-and-Drop Page Builder', 'Real-time Stock Sync', 'Customer Portal Built-in'],
//       icon: 'pi pi-shopping-cart',
//       colorVar: 'var(--accent-secondary)',
//       metric: { label: 'Deploy Time', value: '5 Mins' }
//     },
//     {
//       id: 'hr',
//       category: 'Human Capital',
//       title: 'Biometric Attendance & Payroll',
//       tagline: 'Manage People, Not Paper',
//       description: 'Direct integration with biometric devices. Automated shift scheduling, leave management, and one-click payroll generation based on actual hours.',
//       points: ['Geo-fenced Mobile Punching', 'Complex Shift Rotations', 'Payslip Generation'],
//       icon: 'pi pi-users',
//       colorVar: 'var(--color-info)',
//       metric: { label: 'Payroll Errors', value: '0%' }
//     },
//     {
//       id: 'emi',
//       category: 'Lending Engine',
//       title: 'EMI Lifecycle Management',
//       tagline: 'Automated Collections',
//       description: 'Designed for electronics retailers and financiers. Track down-payments, interest schedules, and automate SMS reminders for due installments.',
//       points: ['Amortization Schedules', 'Penalty Calculation', 'Bad Debt Analytics'],
//       icon: 'pi pi-calculator',
//       colorVar: 'var(--color-warning)',
//       metric: { label: 'Recovery Rate', value: '+18%' }
//     },
//     {
//       id: 'ai',
//       category: 'Intelligence',
//       title: 'Apex AI Analyst',
//       tagline: 'Your 24/7 CFO',
//       description: 'Stop writing SQL. Ask questions like "Which branch had the highest profit margin last week?" and get visual answers instantly.',
//       points: ['Natural Language Querying', 'Trend Forecasting', 'Anomaly Detection'],
//       icon: 'pi pi-bolt',
//       colorVar: 'var(--accent-tertiary)',
//       metric: { label: 'Response Time', value: 'instant' }
//     },
//     {
//       id: 'sales',
//       category: 'Sales Force',
//       title: 'Omnichannel Sales Order',
//       tagline: 'Sell Everywhere',
//       description: 'Unify offline POS, online orders, and B2B quotes. One screen to manage approvals, shipping, and invoicing across all channels.',
//       points: ['Quotation to Invoice Flow', 'Credit Limit Checks', 'Sales Commission Tracking'],
//       icon: 'pi pi-percentage',
//       colorVar: 'var(--text-secondary)'
//     },
//     {
//       id: 'purchase',
//       category: 'Procurement',
//       title: 'Smart Procurement',
//       tagline: 'Optimize Spending',
//       description: 'Vendor portals, purchase requisition workflows, and landed cost calculations. Know exactly what your inventory costs.',
//       points: ['Vendor Performance Rating', 'GRN Verification', 'Landed Cost Analysis'],
//       icon: 'pi pi-truck',
//       colorVar: 'var(--color-error)'
//     },
//     {
//       id: 'manufacturing',
//       category: 'Production',
//       title: 'Light Manufacturing',
//       tagline: 'Bill of Materials',
//       description: 'Manage BOMs, raw material consumption, and finished goods production. Perfect for assembly and packaging units.',
//       points: ['Raw Material Planning', 'Wastage Tracking', 'Production Costing'],
//       icon: 'pi pi-cog',
//       colorVar: 'var(--text-primary)'
//     },
//     {
//       id: 'assets',
//       category: 'Asset Mgmt',
//       title: 'Fixed Asset Tracking',
//       tagline: 'Value Over Time',
//       description: 'Depreciation schedules, asset maintenance logs, and location tracking for all company equipment.',
//       points: ['Automated Depreciation', 'Maintenance Alerts', 'QR Asset Tagging'],
//       icon: 'pi pi-building',
//       colorVar: 'var(--accent-primary)'
//     }
//   ]);

//   // 3. Problem/Solution Data
//   readonly problems = signal([
//     { title: 'Data Silos', desc: 'Finance doesn\'t talk to Sales.', icon: 'pi-server' },
//     { title: 'Slow Closing', desc: 'Month-end takes 15 days.', icon: 'pi-calendar-times' },
//     { title: 'Stock Outs', desc: 'Lost sales due to bad inventory data.', icon: 'pi-exclamation-triangle' },
//     { title: 'Manual Error', desc: 'Spreadsheets serve as databases.', icon: 'pi-file-excel' }
//   ]);

//   // 4. FAQ Data
//   readonly faqs = signal([
//     { id: '1', question: 'How long does implementation take?', answer: 'For standard setups, you can go live in 48 hours. Enterprise migrations typically take 2-3 weeks.' },
//     { id: '2', question: 'Is my data secure?', answer: 'We use AES-256 encryption at rest and TLS 1.3 in transit. We are ISO 27001 compliant.' },
//     { id: '3', question: 'Can I customize the print formats?', answer: 'Yes, our "Print Designer" lets you drag-and-drop to create custom invoices, POs, and labels.' },
//     { id: '4', question: 'Does it support multi-currency?', answer: 'Yes, automated exchange rate fetching and realized/unrealized gain/loss reporting is built-in.' }
//   ]);

//   // 5. Tech Stack (For the "Tech" section)
//   readonly techStack = signal([
//     { name: 'Angular 20', icon: 'pi pi-code' },
//     { name: 'PrimeNG', icon: 'pi pi-palette' },
//     { name: 'Signals', icon: 'pi pi-bolt' },
//     { name: 'Node.js', icon: 'pi pi-server' }
//   ]);

//   constructor() {}

//   ngOnInit() {
//     this.themeService.setLightTheme('theme-glass');
//   }

//   ngAfterViewInit() {
//     this.initScrollObserver();
//   }

//   ngOnDestroy() {
//     if (this.scrollObserver) {
//       this.scrollObserver.disconnect();
//     }
//   }

//   @HostListener('window:scroll')
//   onScroll() {
//     this.scrollY.set(window.scrollY);
//   }

//   private initScrollObserver() {
//     this.scrollObserver = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add('reveal-visible');
//         }
//       });
//     }, { threshold: 0.1 });

//     document.querySelectorAll('.reveal-on-scroll').forEach(el => this.scrollObserver?.observe(el));
//   }

//   toggleMobileMenu() {
//     this.mobileMenuOpen.update(v => !v);
//   }
// }
