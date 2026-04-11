import {
  Component, OnInit, AfterViewInit, OnDestroy,
  HostListener, signal, ViewEncapsulation, ChangeDetectionStrategy,
  Injectable
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface FeatureDetail {
  id: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  points: string[];
  icon: string;
  color: string;
  metric?: { label: string; value: string };
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ═══════════════════════════════════════════════════════
         APEX INFINITY — PREMIUM LANDING PAGE
    ═══════════════════════════════════════════════════════ -->
    <div class="lp-root">

      <!-- ── NAVBAR ─────────────────────────────────────── -->
      <nav class="lp-nav" [class.nav--scrolled]="scrollY() > 20">
        <div class="lp-nav__inner">
          <a class="nav__brand" routerLink="/">
            <div class="nav__logo-mark"><i class="pi pi-infinity"></i></div>
            <span class="nav__logo-text">APEX <b>INFINITY</b></span>
          </a>

          <div class="nav__links hide-on-mobile">
            @for (link of navLinks; track link) {
              <a class="nav__link" href="#{{ link.toLowerCase() }}">{{ link }}</a>
            }
          </div>

          <div class="nav__actions hide-on-mobile">
            <button class="btn-ghost" routerLink="/auth/login">Sign In</button>
            <button class="btn-primary" routerLink="/auth/signup">
              Start Free Trial <i class="pi pi-arrow-right btn-icon-right"></i>
            </button>
          </div>

          <button class="nav__hamburger show-on-mobile" (click)="toggleMobileMenu()" [class.is-open]="mobileMenuOpen()">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      <!-- Mobile drawer -->
      <div class="mob-overlay" [class.is-open]="mobileMenuOpen()" (click)="toggleMobileMenu()"></div>
      <div class="mob-drawer" [class.is-open]="mobileMenuOpen()">
        <div class="mob-drawer__head">
          <span class="nav__logo-text">APEX <b>INFINITY</b></span>
          <button class="mob-close" (click)="toggleMobileMenu()"><i class="pi pi-times"></i></button>
        </div>
        <nav class="mob-drawer__links">
          @for (link of navLinks; track link) {
            <a href="#{{ link.toLowerCase() }}" (click)="toggleMobileMenu()">{{ link }}</a>
          }
        </nav>
        <div class="mob-drawer__actions">
          <button class="btn-ghost w-full justify-center" routerLink="/auth/login">Sign In</button>
          <button class="btn-primary w-full justify-center" routerLink="/auth/signup">Start Free Trial</button>
        </div>
      </div>

      <!-- ── HERO ───────────────────────────────────────── -->
      <section class="lp-hero">
        <!-- Background atmosphere / Orbs -->
        <div class="hero__bg">
          <div class="hero__grid-lines"></div>
          <div class="hero__orb hero__orb--1"></div>
          <div class="hero__orb hero__orb--2"></div>
        </div>

        <div class="hero__inner">
          <div class="hero__content reveal">
            <div class="hero__eyebrow">
              <span class="badge-live">
                <span class="pulse-dot"></span> Live on 500+ organisations
              </span>
            </div>

            <h1 class="hero__headline">
              One Platform.<br><span class="text-gradient">Infinite Possibility.</span>
            </h1>

            <p class="hero__sub">{{ heroData().subhead }}</p>

            <div class="hero__cta">
              <button class="btn-primary btn-xl" routerLink="/auth/signup">
                Get Started Free <i class="pi pi-arrow-right btn-icon-right"></i>
              </button>
              <button class="btn-outline btn-xl">
                <i class="pi pi-play-circle btn-icon-left"></i> Watch 2-min Demo
              </button>
            </div>

            <div class="hero__stats">
              @for (stat of heroData().stats; track stat.label) {
                <div class="stat-block">
                  <span class="stat-val">{{ stat.value }}</span>
                  <span class="stat-label">{{ stat.label }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Hero Dashboard Mockup -->
          <div class="hero__visual reveal">
            <div class="mockup-window glass-panel">
              <div class="mockup-header">
                <div class="mac-dots"><span></span><span></span><span></span></div>
                <div class="mockup-title">apex-infinity / dashboard</div>
              </div>
              
              <div class="mockup-body">
                <!-- Mock Sidebar -->
                <div class="mock-sidebar">
                  <div class="ms-logo"><i class="pi pi-infinity"></i></div>
                  <div class="ms-item active"></div>
                  <div class="ms-item"></div>
                  <div class="ms-item"></div>
                  <div class="ms-item"></div>
                </div>
                
                <!-- Mock Content -->
                <div class="mock-content">
                  <div class="mock-kpi-row">
                    <div class="mock-kpi">
                      <div class="kpi-lbl">Revenue</div>
                      <div class="kpi-val text-success">₹84.2L</div>
                    </div>
                    <div class="mock-kpi">
                      <div class="kpi-lbl">Active Users</div>
                      <div class="kpi-val text-info">1,284</div>
                    </div>
                    <div class="mock-kpi">
                      <div class="kpi-lbl">Pending AP</div>
                      <div class="kpi-val text-warning">₹12.4L</div>
                    </div>
                  </div>
                  
                  <div class="mock-chart">
                    <div class="chart-bars">
                      @for (h of [40, 60, 45, 80, 65, 90, 75]; track $index) {
                        <div class="chart-bar" [style.height.%]="h"></div>
                      }
                    </div>
                  </div>
                  
                  <div class="mock-table">
                    <div class="mock-row header"></div>
                    <div class="mock-row"></div>
                    <div class="mock-row"></div>
                    <div class="mock-row"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Floating Mini Cards -->
            <div class="float-card float-tl glass-panel">
              <div class="fc-icon bg-success-light text-success"><i class="pi pi-check-circle"></i></div>
              <div class="fc-data">
                <span class="fc-lbl">Invoice Paid</span>
                <span class="fc-val">₹2,40,000</span>
              </div>
            </div>

            <div class="float-card float-br glass-panel">
              <div class="fc-icon bg-info-light text-info"><i class="pi pi-chart-line"></i></div>
              <div class="fc-data">
                <span class="fc-lbl">MoM Growth</span>
                <span class="fc-val">+22.4%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── TRUST BAR ──────────────────────────────────── -->
      <div class="lp-trust reveal">
        <p class="trust-label">Powering next-gen enterprises across India</p>
        <div class="trust-logos">
          @for (icon of ['pi-google','pi-amazon','pi-microsoft','pi-apple','pi-discord','pi-slack']; track icon) {
            <i class="pi {{ icon }} t-logo"></i>
          }
        </div>
      </div>

      <!-- ── PROBLEMS ────────────────────────────────────── -->
      <section class="lp-section bg-surface-alt" id="solutions">
        <div class="lp-container">
          <div class="section-head text-center reveal">
            <span class="eyebrow">The Problem</span>
            <h2 class="section-title">Fragmentation kills growth.</h2>
            <p class="section-sub mx-auto">Most businesses run on 6–10 disconnected tools. The cost is invisible — until it isn't.</p>
          </div>

          <div class="problems-grid">
            @for (p of problems(); track p.title; let i = $index) {
              <div class="problem-card reveal" [style.animation-delay.ms]="i * 100">
                <div class="pc-icon"><i class="pi {{ p.icon }}"></i></div>
                <h3 class="pc-title">{{ p.title }}</h3>
                <p class="pc-desc">{{ p.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── FEATURES DEEP-DIVE ─────────────────────────── -->
      <section class="lp-section" id="platform">
        <div class="lp-container">
          <div class="section-head reveal">
            <span class="eyebrow">The Platform</span>
            <h2 class="section-title">The Infinite Suite.</h2>
            <p class="section-sub">20+ integrated modules. One source of truth.</p>
          </div>

          <div class="features-layout">
            
            <!-- Tabs -->
            <div class="features-tabs reveal">
              @for (feat of features(); track feat.id; let i = $index) {
                <button 
                  class="f-tab" 
                  [class.active]="activeFeatureIdx() === i"
                  [style.--feat-color]="feat.color" 
                  (click)="setFeature(i)">
                  <div class="f-tab-icon"><i class="pi {{ feat.icon }}"></i></div>
                  <span class="f-tab-text">{{ feat.category }}</span>
                  @if (activeFeatureIdx() === i) {
                    <div class="f-tab-progress"></div>
                  }
                </button>
              }
            </div>

            <!-- Panel -->
            <div class="features-panel reveal">
              <div class="f-panel-card" [style.--panel-color]="getActiveFeature().color">
                
                <div class="f-panel-content">
                  <span class="fp-cat" [style.color]="getActiveFeature().color">
                    {{ getActiveFeature().category }}
                  </span>
                  <h3 class="fp-title">{{ getActiveFeature().title }}</h3>
                  <p class="fp-tagline">{{ getActiveFeature().tagline }}</p>
                  <p class="fp-desc">{{ getActiveFeature().description }}</p>

                  <ul class="fp-points">
                    @for (pt of getActiveFeature().points; track pt) {
                      <li>
                        <div class="fp-check" [style.background]="'color-mix(in srgb, ' + getActiveFeature().color + ' 15%, transparent)'" [style.color]="getActiveFeature().color">
                          <i class="pi pi-check"></i>
                        </div>
                        <span>{{ pt }}</span>
                      </li>
                    }
                  </ul>

                  @if (getActiveFeature().metric) {
                    <div class="fp-metric-box" [style.border-color]="'color-mix(in srgb, ' + getActiveFeature().color + ' 30%, transparent)'">
                      <span class="fp-metric-lbl">{{ getActiveFeature().metric!.label }}</span>
                      <span class="fp-metric-val" [style.color]="getActiveFeature().color">
                        {{ getActiveFeature().metric!.value }}
                      </span>
                    </div>
                  }
                </div>

                <div class="f-panel-visual">
                  <div class="fp-window" [style.border-top-color]="getActiveFeature().color">
                    <div class="fp-win-header">
                      <div class="mac-dots"><span></span><span></span><span></span></div>
                    </div>
                    <div class="fp-win-body">
                      <div class="fp-big-icon" [style.background]="'color-mix(in srgb, ' + getActiveFeature().color + ' 10%, transparent)'">
                        <i class="pi {{ getActiveFeature().icon }}" [style.color]="getActiveFeature().color"></i>
                      </div>
                      <div class="fp-wireframes">
                        <div class="fp-wire" style="width: 75%"></div>
                        <div class="fp-wire" style="width: 50%"></div>
                        <div class="fp-wire" style="width: 85%"></div>
                        <div class="fp-wire" style="width: 40%"></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── AI SECTION ─────────────────────────────────── -->
      <section class="lp-section ai-section reveal">
        <div class="ai-bg-glow"></div>
        <div class="lp-container ai-inner">
          <div class="ai-badge">
            <i class="pi pi-sparkles"></i> POWERED BY APEX INTELLIGENCE
          </div>
          <h2 class="ai-title">Your business, <span class="text-gradient-alt">self-driving.</span></h2>
          <p class="ai-sub">
            Apex AI doesn't just report history — it predicts the future.
            Forecast cash flow, detect inventory anomalies, and auto-raise purchase orders using natural language.
          </p>

          <div class="ai-chat-window glass-panel">
            <div class="chat-row user-row">
              <div class="chat-bubble user-bubble">
                "Which branch had the highest net margin last month, and why?"
              </div>
            </div>
            <div class="chat-row bot-row">
              <div class="bot-avatar"><i class="pi pi-infinity"></i></div>
              <div class="chat-bubble bot-bubble">
                <strong>Mumbai - Andheri</strong> led with <strong>34.2% net margin</strong>,
                driven by a 22% reduction in logistics costs and 3 bulk B2B orders totalling ₹18.4L.
                <div class="chat-meta">Based on 1,284 transactions · Generated in 0.4s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── PRICING ────────────────────────────────────── -->
      <section class="lp-section bg-surface-alt" id="pricing">
        <div class="lp-container">
          <div class="section-head text-center reveal">
            <span class="eyebrow">Pricing</span>
            <h2 class="section-title">Transparent, always.</h2>
            <p class="section-sub mx-auto">No hidden fees. No per-module charges. Cancel anytime.</p>
          </div>

          <div class="pricing-grid">
            @for (plan of pricingPlans(); track plan.name; let i = $index) {
              <div class="price-card reveal" [class.popular]="plan.popular" [style.animation-delay.ms]="i * 100">
                @if (plan.popular) {
                  <div class="popular-badge">Most Popular</div>
                }
                <div class="pc-head">
                  <h3 class="pc-name">{{ plan.name }}</h3>
                  <div class="pc-price-wrap">
                    <span class="pc-price">{{ plan.price }}</span>
                    <span class="pc-period">{{ plan.period }}</span>
                  </div>
                </div>
                
                <div class="pc-body">
                  <ul class="pc-features">
                    @for (f of plan.features; track f) {
                      <li><i class="pi pi-check-circle text-primary"></i> {{ f }}</li>
                    }
                  </ul>
                </div>
                
                <div class="pc-footer">
                  <button class="w-full" [ngClass]="plan.popular ? 'btn-primary' : 'btn-outline'">
                    {{ plan.cta }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── FAQ ───────────────────────────────────────── -->
      <section class="lp-section">
        <div class="lp-container max-w-3xl">
          <div class="section-head text-center reveal">
            <span class="eyebrow">FAQ</span>
            <h2 class="section-title">Common questions.</h2>
          </div>

          <div class="faq-list">
            @for (item of faqs(); track item.q; let i = $index) {
              <div class="faq-item reveal" [class.open]="activeAccordionIdx() === i">
                <button class="faq-btn" (click)="toggleAccordion(i)">
                  <span class="faq-q">{{ item.q }}</span>
                  <div class="faq-icon">
                    <i class="pi" [ngClass]="activeAccordionIdx() === i ? 'pi-minus' : 'pi-plus'"></i>
                  </div>
                </button>
                @if (activeAccordionIdx() === i) {
                  <div class="faq-a">
                    <p>{{ item.a }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- ── FINAL CTA ──────────────────────────────────── -->
      <section class="lp-section cta-section reveal">
        <div class="cta-inner glass-panel">
          <div class="cta-glow"></div>
          <span class="eyebrow">Get Started Today</span>
          <h2 class="cta-title">Ready to scale without limits?</h2>
          <p class="cta-sub">Join 500+ high-growth companies already running on Apex Infinity.</p>
          
          <div class="cta-actions">
            <button class="btn-primary btn-xl" routerLink="/auth/signup">
              Start Your Free Trial <i class="pi pi-arrow-right btn-icon-right"></i>
            </button>
            <button class="btn-outline btn-xl">Talk to Sales</button>
          </div>
          <p class="cta-note">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      <!-- ── FOOTER ─────────────────────────────────────── -->
      <footer class="lp-footer">
        <div class="lp-container footer-grid">
          
          <div class="footer-brand">
            <div class="f-logo">
              <i class="pi pi-infinity"></i> APEX INFINITY
            </div>
            <p class="f-tagline">The operating system for the modern Indian enterprise.</p>
            <p class="f-copy">© 2026 Apex Systems Pvt. Ltd. All rights reserved.</p>
          </div>

          <div class="footer-links">
            <h4>Product</h4>
            <a href="#">Finance & Accounting</a>
            <a href="#">HR & Payroll</a>
            <a href="#">Supply Chain</a>
            <a href="#">Commerce</a>
          </div>

          <div class="footer-links">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API Reference</a>
            <a href="#">Changelog</a>
            <a href="#">Status Page</a>
          </div>

          <div class="footer-links">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
          
        </div>
      </footer>

    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════════
       APEX INFINITY LANDING PAGE - "BILLION DOLLAR" TOKENS
    ══════════════════════════════════════════════════════════ */
    
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-body);
      overflow-x: hidden;
      scroll-behavior: smooth;
    }

    /* ── UTILITIES ── */
    .lp-root { width: 100%; overflow: hidden; }
    .lp-container { max-width: 1400px; margin: 0 auto; padding: 0 var(--spacing-2xl); width: 100%; }
    .max-w-3xl { max-width: 900px; margin: 0 auto; }
    .text-center { text-align: center; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    .w-full { width: 100%; }
    .justify-center { justify-content: center; }
    .bg-surface-alt { background: var(--bg-secondary); }
    
    .text-gradient {
      background: var(--accent-gradient, linear-gradient(135deg, var(--accent-primary), #8b5cf6));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .text-gradient-alt {
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .text-success { color: var(--color-success); }
    .text-info { color: var(--color-info); }
    .text-warning { color: var(--color-warning); }
    .text-primary { color: var(--accent-primary); }
    .bg-success-light { background: color-mix(in srgb, var(--color-success) 15%, transparent); }
    .bg-info-light { background: color-mix(in srgb, var(--color-info) 15%, transparent); }

    /* ── BUTTONS ── */
    button {
      font-family: var(--font-body);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      display: inline-flex; align-items: center; gap: var(--spacing-sm);
      height: 40px; padding: 0 var(--spacing-xl);
      border-radius: var(--ui-border-radius-pill);
      cursor: pointer; transition: var(--transition-base);
      border: var(--ui-border-width) solid transparent;
      outline: none;
    }
    .btn-xl { height: 48px; padding: 0 var(--spacing-2xl); font-size: var(--font-size-base); }
    .btn-icon-right { font-size: 12px; transition: transform var(--transition-fast); }
    .btn-icon-left { font-size: 16px; }

    .btn-primary { 
      background: var(--accent-primary); color: #fff; 
      box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-primary) 30%, transparent); 
    }
    .btn-primary:hover { 
      background: var(--accent-hover); transform: translateY(-2px); 
      box-shadow: 0 6px 16px color-mix(in srgb, var(--accent-primary) 40%, transparent); 
    }
    .btn-primary:hover .btn-icon-right { transform: translateX(4px); }

    .btn-ghost { background: transparent; color: var(--text-secondary); }
    .btn-ghost:hover { color: var(--text-primary); background: var(--bg-secondary); }

    .btn-outline { 
      background: var(--bg-primary); border-color: var(--border-secondary); color: var(--text-primary); 
    }
    .btn-outline:hover { border-color: var(--text-tertiary); background: var(--bg-secondary); }

    /* ── GLASS PANEL ── */
    .glass-panel {
      background: var(--glass-bg-c, rgba(255,255,255,0.7));
      backdrop-filter: blur(var(--glass-blur-c, 16px));
      -webkit-backdrop-filter: blur(var(--glass-blur-c, 16px));
      border: var(--ui-border-width) solid var(--glass-border-c, rgba(255,255,255,0.2));
      box-shadow: var(--shadow-xl);
    }

    /* ── SECTION TYPOGRAPHY ── */
    .lp-section { padding: 120px 0; position: relative; }
    .section-head { margin-bottom: 64px; }
    .eyebrow {
      display: inline-block; font-family: var(--font-mono); font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--accent-primary); margin-bottom: var(--spacing-md);
    }
    .section-title {
      font-family: var(--font-heading); font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold); color: var(--text-primary);
      margin: 0 0 var(--spacing-md) 0; letter-spacing: -0.02em; line-height: 1.1;
    }
    .section-sub {
      font-size: var(--font-size-lg); color: var(--text-secondary); max-width: 600px;
      line-height: var(--line-height-relaxed); margin: 0;
    }

    /* ── ANIMATIONS ── */
    .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.2, 0.9, 0.2, 1); }
    .reveal.is-visible { opacity: 1; transform: translateY(0); }

    /* ── NAVBAR ─────────────────────────────────────── */
    .lp-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-fixed);
      transition: var(--transition-base); padding: var(--spacing-md) 0;
    }
    .lp-nav.nav--scrolled {
      padding: var(--spacing-sm) 0;
      background: var(--glass-bg-c, rgba(255,255,255,0.8));
      backdrop-filter: blur(var(--glass-blur-c, 12px));
      border-bottom: 1px solid var(--border-secondary);
      box-shadow: var(--shadow-sm);
    }
    .lp-nav__inner {
      max-width: 1400px; margin: 0 auto; padding: 0 var(--spacing-2xl);
      display: flex; justify-content: space-between; align-items: center;
    }
    
    .nav__brand { display: flex; align-items: center; gap: 8px; text-decoration: none; }
    .nav__logo-mark {
      width: 32px; height: 32px; border-radius: 8px;
      background: var(--accent-primary); color: white;
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .nav__logo-text { font-family: var(--font-heading); font-size: 18px; color: var(--text-primary); letter-spacing: -0.02em; }
    
    .nav__links { display: flex; gap: var(--spacing-2xl); }
    .nav__link {
      text-decoration: none; font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
      color: var(--text-secondary); transition: var(--transition-fast);
    }
    .nav__link:hover { color: var(--text-primary); }

    .nav__actions { display: flex; align-items: center; gap: var(--spacing-md); }

    /* Mobile Nav */
    .nav__hamburger { display: none; background: transparent; border: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 5px; z-index: 600; }
    .nav__hamburger span { display: block; width: 24px; height: 2px; background: var(--text-primary); transition: 0.3s; }
    .mob-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 500; opacity: 0; pointer-events: none; transition: 0.3s; }
    .mob-overlay.is-open { opacity: 1; pointer-events: auto; }
    .mob-drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 300px; background: var(--bg-primary); z-index: 501;
      transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.2, 1);
      display: flex; flex-direction: column; padding: var(--spacing-2xl); box-shadow: var(--shadow-2xl);
    }
    .mob-drawer.is-open { transform: translateX(0); }
    .mob-drawer__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .mob-close { background: transparent; border: none; font-size: 24px; color: var(--text-secondary); cursor: pointer; }
    .mob-drawer__links { display: flex; flex-direction: column; gap: 24px; margin-bottom: auto; }
    .mob-drawer__links a { text-decoration: none; font-size: 18px; font-weight: 600; color: var(--text-primary); }
    .mob-drawer__actions { display: flex; flex-direction: column; gap: 12px; }

    /* ── HERO ───────────────────────────────────────── */
    .lp-hero {
      position: relative; padding: 180px 0 100px; min-height: 100vh;
      display: flex; align-items: center; overflow: hidden;
    }
    
    .hero__bg { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
    .hero__grid-lines {
      position: absolute; inset: 0;
      background-image: 
        linear-gradient(to right, var(--border-secondary) 1px, transparent 1px),
        linear-gradient(to bottom, var(--border-secondary) 1px, transparent 1px);
      background-size: 60px 60px; opacity: 0.4;
      mask-image: linear-gradient(to bottom, transparent, black 10%, black 70%, transparent);
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 70%, transparent);
    }
    .hero__orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; z-index: 0; }
    .hero__orb--1 { width: 600px; height: 600px; background: var(--accent-primary); top: -100px; right: -100px; }
    .hero__orb--2 { width: 500px; height: 500px; background: #8b5cf6; bottom: -100px; left: -100px; }

    .hero__inner {
      position: relative; z-index: 1; max-width: 1400px; margin: 0 auto; padding: 0 var(--spacing-2xl);
      display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
    }

    .hero__eyebrow { margin-bottom: var(--spacing-xl); }
    .badge-live {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px;
      border-radius: var(--ui-border-radius-pill); border: 1px solid var(--color-success-border, rgba(16, 185, 129, 0.3));
      background: var(--color-success-bg, rgba(16, 185, 129, 0.1)); color: var(--color-success);
      font-size: var(--font-size-xs); font-weight: var(--font-weight-bold); text-transform: uppercase; letter-spacing: 0.05em;
    }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse 2s infinite; }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

    .hero__headline {
      font-family: var(--font-heading); font-size: clamp(3rem, 5vw, 4.5rem);
      font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; color: var(--text-primary); margin: 0 0 24px 0;
    }
    .hero__sub { font-size: 1.125rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 40px 0; max-width: 540px; }

    .hero__cta { display: flex; gap: var(--spacing-md); margin-bottom: 60px; flex-wrap: wrap; }

    .hero__stats { display: flex; gap: 40px; flex-wrap: wrap; }
    .stat-block { display: flex; flex-direction: column; gap: 4px; }
    .stat-val { font-family: var(--font-heading); font-size: 24px; font-weight: 800; color: var(--text-primary); }
    .stat-label { font-size: 12px; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; }

    /* Hero Visual (Mockup) */
    .hero__visual { position: relative; perspective: 1000px; }
    .mockup-window {
      width: 100%; height: 500px; border-radius: var(--ui-border-radius-xl); overflow: hidden;
      display: flex; flex-direction: column; transform: rotateY(-5deg) rotateX(2deg);
      box-shadow: 20px 30px 60px rgba(0,0,0,0.15);
    }
    .mockup-header {
      height: 40px; border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; padding: 0 16px; background: rgba(255,255,255,0.4);
    }
    .mac-dots { display: flex; gap: 6px; }
    .mac-dots span { width: 10px; height: 10px; border-radius: 50%; }
    .mac-dots span:nth-child(1) { background: #ff5f56; }
    .mac-dots span:nth-child(2) { background: #ffbd2e; }
    .mac-dots span:nth-child(3) { background: #27c93f; }
    .mockup-title { flex: 1; text-align: center; font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
    
    .mockup-body { flex: 1; display: flex; background: var(--bg-primary); }
    .mock-sidebar { width: 60px; border-right: 1px solid var(--border-secondary); display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 16px; background: var(--bg-secondary); }
    .ms-logo { width: 32px; height: 32px; background: var(--accent-primary); color: #fff; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; margin-bottom: 10px; }
    .ms-item { width: 24px; height: 24px; border-radius: 6px; background: var(--border-primary); opacity: 0.5; }
    .ms-item.active { background: var(--accent-primary); opacity: 1; }

    .mock-content { flex: 1; padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .mock-kpi-row { display: flex; gap: 16px; }
    .mock-kpi { flex: 1; border: 1px solid var(--border-secondary); border-radius: 12px; padding: 16px; background: var(--bg-secondary); }
    .kpi-lbl { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
    .kpi-val { font-size: 20px; font-weight: bold; font-family: var(--font-heading); }
    
    .mock-chart { flex: 1; border: 1px solid var(--border-secondary); border-radius: 12px; padding: 16px; display: flex; align-items: flex-end; gap: 8px; background: var(--bg-secondary); }
    .chart-bars { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; height: 100%; gap: 4px; }
    .chart-bar { flex: 1; background: var(--accent-primary); border-radius: 4px 4px 0 0; opacity: 0.8; }
    .chart-bar:hover { opacity: 1; }

    .mock-table { display: flex; flex-direction: column; gap: 8px; }
    .mock-row { height: 24px; border-radius: 6px; background: var(--border-secondary); opacity: 0.3; }
    .mock-row.header { background: var(--text-tertiary); opacity: 0.2; }

    /* Floaters */
    .float-card {
      position: absolute; padding: 16px 20px; border-radius: 16px; display: flex; align-items: center; gap: 16px;
      animation: float 6s ease-in-out infinite; z-index: 10;
    }
    .float-tl { top: 10%; left: -40px; animation-delay: 0s; }
    .float-br { bottom: 15%; right: -30px; animation-delay: 3s; }
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
    
    .fc-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .fc-data { display: flex; flex-direction: column; }
    .fc-lbl { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
    .fc-val { font-size: 16px; font-weight: 800; color: var(--text-primary); font-family: var(--font-heading); }

    /* ── TRUST BAR ──────────────────────────────────── */
    .lp-trust { text-align: center; padding: 40px 20px; border-top: 1px solid var(--border-secondary); border-bottom: 1px solid var(--border-secondary); background: var(--bg-secondary); }
    .trust-label { font-size: 12px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 24px; }
    .trust-logos { display: flex; justify-content: center; flex-wrap: wrap; gap: 60px; opacity: 0.6; }
    .t-logo { font-size: 28px; color: var(--text-secondary); transition: var(--transition-base); }
    .t-logo:hover { opacity: 1; color: var(--text-primary); transform: scale(1.1); }

    /* ── PROBLEMS ────────────────────────────────────── */
    .problems-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-xl); margin-top: 40px; }
    .problem-card {
      background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); padding: var(--spacing-2xl); transition: var(--transition-base);
    }
    .problem-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-md); transform: translateY(-4px); }
    .pc-icon { width: 48px; height: 48px; border-radius: 12px; background: var(--bg-secondary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; font-size: 20px; color: var(--text-secondary); margin-bottom: 20px; }
    .pc-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0; }
    .pc-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin: 0; }

    /* ── FEATURES ───────────────────────────────────── */
    .features-layout { display: grid; grid-template-columns: 300px 1fr; gap: 60px; margin-top: 40px; align-items: start; }
    
    .features-tabs { display: flex; flex-direction: column; gap: 8px; }
    .f-tab {
      display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: transparent; border: none; border-radius: 12px; cursor: pointer; text-align: left; transition: var(--transition-base); position: relative; overflow: hidden;
    }
    .f-tab:hover { background: var(--bg-secondary); }
    .f-tab.active { background: var(--bg-secondary); box-shadow: var(--shadow-sm); }
    .f-tab-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--border-secondary); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--text-tertiary); transition: var(--transition-base); }
    .f-tab-text { font-size: 16px; font-weight: 600; color: var(--text-secondary); transition: var(--transition-base); }
    
    .f-tab.active .f-tab-icon { background: var(--feat-color); color: white; border-color: var(--feat-color); }
    .f-tab.active .f-tab-text { color: var(--text-primary); }
    
    .f-tab-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: var(--feat-color); animation: progress 4s linear forwards; }
    @keyframes progress { from { width: 0%; } to { width: 100%; } }

    .features-panel { position: relative; perspective: 1000px; }
    .f-panel-card {
      background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: 24px; box-shadow: var(--shadow-xl); display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; transition: all 0.4s ease; border-top: 4px solid var(--panel-color);
    }
    .f-panel-content { padding: 48px; display: flex; flex-direction: column; }
    .fp-cat { font-family: var(--font-mono); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
    .fp-title { font-family: var(--font-heading); font-size: 32px; font-weight: 800; color: var(--text-primary); margin: 0 0 12px 0; line-height: 1.2; }
    .fp-tagline { font-size: 18px; color: var(--text-secondary); margin: 0 0 24px 0; }
    .fp-desc { font-size: 15px; color: var(--text-tertiary); line-height: 1.6; margin: 0 0 32px 0; }
    
    .fp-points { list-style: none; padding: 0; margin: 0 0 32px 0; display: flex; flex-direction: column; gap: 16px; }
    .fp-points li { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; color: var(--text-secondary); line-height: 1.4; }
    .fp-check { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; margin-top: 2px; }

    .fp-metric-box { margin-top: auto; padding: 16px 20px; border: 1px solid var(--border-secondary); border-radius: 12px; background: var(--bg-secondary); display: flex; flex-direction: column; gap: 4px; }
    .fp-metric-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; }
    .fp-metric-val { font-family: var(--font-heading); font-size: 32px; font-weight: 800; }

    .f-panel-visual { background: var(--bg-secondary); padding: 48px; display: flex; align-items: center; justify-content: center; }
    .fp-window { width: 100%; height: 100%; background: var(--bg-primary); border-radius: 16px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-secondary); display: flex; flex-direction: column; overflow: hidden; border-top-width: 4px; }
    .fp-win-header { height: 32px; border-bottom: 1px solid var(--border-secondary); display: flex; align-items: center; padding: 0 12px; }
    .fp-win-body { flex: 1; padding: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px; }
    .fp-big-icon { width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; }
    .fp-wireframes { width: 100%; display: flex; flex-direction: column; gap: 12px; align-items: center; }
    .fp-wire { height: 12px; border-radius: 6px; background: var(--border-secondary); opacity: 0.5; }

    /* ── AI SECTION ─────────────────────────────────── */
    .ai-section { position: relative; text-align: center; overflow: hidden; }
    .ai-bg-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 800px; height: 800px; background: radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%); z-index: 0; pointer-events: none; }
    .ai-inner { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
    .ai-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-family: var(--font-mono); font-weight: 700; color: #ec4899; background: rgba(236, 72, 153, 0.1); padding: 6px 16px; border-radius: 20px; border: 1px solid rgba(236, 72, 153, 0.2); margin-bottom: 24px; letter-spacing: 0.1em; }
    .ai-title { font-family: var(--font-heading); font-size: 48px; font-weight: 800; color: var(--text-primary); line-height: 1.1; margin: 0 0 24px 0; }
    .ai-sub { font-size: 18px; color: var(--text-secondary); max-width: 600px; line-height: 1.6; margin: 0 0 60px 0; }

    .ai-chat-window { width: 100%; max-width: 800px; border-radius: 24px; padding: 40px; display: flex; flex-direction: column; gap: 32px; text-align: left; }
    .chat-row { display: flex; gap: 16px; }
    .user-row { justify-content: flex-end; }
    .chat-bubble { padding: 16px 24px; border-radius: 20px; font-size: 15px; line-height: 1.5; max-width: 80%; }
    .user-bubble { background: var(--bg-primary); border: 1px solid var(--border-primary); color: var(--text-primary); border-bottom-right-radius: 4px; box-shadow: var(--shadow-sm); font-style: italic; }
    .bot-bubble { background: color-mix(in srgb, #ec4899 5%, var(--bg-primary)); border: 1px solid color-mix(in srgb, #ec4899 20%, transparent); color: var(--text-primary); border-bottom-left-radius: 4px; box-shadow: var(--shadow-md); }
    .bot-avatar { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .chat-meta { font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); margin-top: 12px; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── PRICING ────────────────────────────────────── */
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-xl); margin-top: 40px; align-items: end; }
    .price-card { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: var(--ui-border-radius-xl); padding: 40px; position: relative; transition: var(--transition-base); display: flex; flex-direction: column; }
    .price-card:hover { border-color: var(--border-secondary); box-shadow: var(--shadow-xl); transform: translateY(-4px); }
    .price-card.popular { border-color: var(--accent-primary); box-shadow: 0 20px 40px color-mix(in srgb, var(--accent-primary) 15%, transparent); border-width: 2px; }
    
    .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent-primary); color: white; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 16px; border-radius: 20px; }
    .pc-name { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px 0; }
    .pc-price-wrap { display: flex; align-items: baseline; gap: 4px; margin-bottom: 32px; }
    .pc-price { font-family: var(--font-heading); font-size: 40px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
    .pc-period { font-size: 14px; color: var(--text-tertiary); }
    
    .pc-features { list-style: none; padding: 0; margin: 0 0 40px 0; display: flex; flex-direction: column; gap: 16px; flex: 1; }
    .pc-features li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--text-secondary); }
    
    /* ── FAQ ───────────────────────────────────────── */
    .faq-list { display: flex; flex-direction: column; gap: 16px; margin-top: 40px; }
    .faq-item { background: var(--bg-primary); border: 1px solid var(--border-primary); border-radius: 16px; overflow: hidden; transition: var(--transition-base); }
    .faq-item:hover { border-color: var(--border-secondary); }
    .faq-item.open { border-color: var(--accent-primary); box-shadow: var(--shadow-sm); }
    .faq-btn { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 24px; background: transparent; border: none; font-size: 16px; font-weight: 600; color: var(--text-primary); cursor: pointer; text-align: left; }
    .faq-icon { width: 24px; height: 24px; border-radius: 50%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-tertiary); transition: var(--transition-fast); }
    .faq-item.open .faq-icon { background: var(--accent-primary); color: white; }
    .faq-a { padding: 0 24px 24px; font-size: 15px; color: var(--text-secondary); line-height: 1.6; }
    .faq-a p { margin: 0; }

    /* ── FINAL CTA ──────────────────────────────────── */
    .cta-section { padding-bottom: 120px; }
    .cta-inner { position: relative; text-align: center; padding: 80px 20px; border-radius: 32px; overflow: hidden; }
    .cta-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, color-mix(in srgb, var(--accent-primary) 15%, transparent) 0%, transparent 70%); pointer-events: none; }
    .cta-title { font-family: var(--font-heading); font-size: 48px; font-weight: 800; color: var(--text-primary); margin: 0 0 24px 0; line-height: 1.1; }
    .cta-sub { font-size: 18px; color: var(--text-secondary); margin: 0 auto 40px auto; max-width: 500px; }
    .cta-actions { display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .cta-note { font-size: 12px; color: var(--text-tertiary); }

    /* ── FOOTER ─────────────────────────────────────── */
    .lp-footer { background: var(--bg-secondary); border-top: 1px solid var(--border-secondary); padding: 80px 0 40px; }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; }
    .footer-brand { padding-right: 40px; }
    .f-logo { display: flex; align-items: center; gap: 8px; font-family: var(--font-heading); font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--text-primary); }
    .f-tagline { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 24px 0; }
    .f-copy { font-size: 12px; color: var(--text-tertiary); margin: 0; }
    
    .footer-links h4 { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 20px 0; }
    .footer-links a { display: block; font-size: 14px; color: var(--text-secondary); text-decoration: none; margin-bottom: 12px; transition: var(--transition-fast); }
    .footer-links a:hover { color: var(--accent-primary); }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) {
      .hero__inner { grid-template-columns: 1fr; text-align: center; }
      .hero__cta, .hero__stats { justify-content: center; }
      .hero__visual { max-width: 800px; margin: 0 auto; }
      .features-layout { grid-template-columns: 1fr; }
      .features-tabs { flex-direction: row; overflow-x: auto; padding-bottom: 16px; }
      .f-tab { white-space: nowrap; }
    }
    
    @media (max-width: 768px) {
      .hide-on-mobile { display: none !important; }
      .nav__hamburger { display: flex; }
      .hero__headline { font-size: 2.5rem; }
      .f-panel-card { grid-template-columns: 1fr; }
      .f-panel-visual { display: none; } /* Hide complex graphic on small screens */
      .footer-grid { grid-template-columns: 1fr 1fr; }
      .footer-brand { grid-column: span 2; padding-right: 0; }
      .ai-title { font-size: 32px; }
    }
    @media (max-width: 480px) {
      .footer-grid { grid-template-columns: 1fr; }
      .footer-brand { grid-column: span 1; }
      .chat-row { flex-direction: column; align-items: flex-start; }
      .bot-row { align-items: flex-end; }
      .chat-bubble { max-width: 100%; }
    }
  `]
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── State ───────────────────────────────────────────────────────────────────
  readonly scrollY            = signal(0);
  readonly mobileMenuOpen     = signal(false);
  readonly activeAccordionIdx = signal<number | null>(0);
  readonly activeFeatureIdx   = signal(0);

  // ── Data ────────────────────────────────────────────────────────────────────
  readonly heroData = signal({
    headline: 'One Platform.\nInfinite Possibility.',
    subhead:  'Apex Infinity unifies Financials, Inventory, HR, and Commerce in a single reactive core — purpose-built for high-growth Indian enterprises.',
    stats: [
      { value: '24+',    label: 'Integrated Modules' },
      { value: '500+',   label: 'Active Organisations' },
      { value: '99.9%',  label: 'Guaranteed Uptime' },
      { value: '<50ms',  label: 'API Response Time' },
    ],
  });

  readonly features = signal<FeatureDetail[]>([
    {
      id:          'finance',
      category:    'Financial Core',
      title:       'Real-Time General Ledger',
      tagline:     'Every rupee. Every second.',
      description: 'A true double-entry accounting engine with live posting. Every sale, purchase, and payroll run reflects instantly — no overnight batch, no stale data.',
      points:      ['Multi-branch P&L consolidation', 'Automated GST/TDS filing', 'Immutable audit trail with user stamps', 'Bank reconciliation in seconds'],
      icon:        'pi-wallet',
      color:       'var(--color-success, #10b981)',
      metric:      { label: 'Reconciliation time', value: '<200ms' },
    },
    {
      id:          'inventory',
      category:    'Supply Chain',
      title:       'Multi-Location Inventory',
      tagline:     'Total stock visibility.',
      description: 'Track stock across warehouses, retail outlets, and transit vans in real time. Smart transfer orders and predictive low-stock alerts eliminate lost sales.',
      points:      ['Batch & expiry date tracking', 'Barcode / QR scanning built-in', 'Automated reorder point triggers', 'Variance & shrinkage reporting'],
      icon:        'pi-box',
      color:       'var(--color-info, #3b82f6)',
      metric:      { label: 'Stock accuracy', value: '100%' },
    },
    {
      id:          'hr',
      category:    'Human Capital',
      title:       'Biometric Attendance & Payroll',
      tagline:     'People ops without the paper.',
      description: 'Native integration with biometric devices and geo-fenced mobile punching. One-click payroll generation, leave approval workflows, and digital payslips.',
      points:      ['Complex shift rotations & swaps', 'OT, LOP, and holiday calendar', 'Statutory compliance (PF, ESI, PT)', 'Employee self-service portal'],
      icon:        'pi-users',
      color:       'var(--color-primary, #6366f1)',
      metric:      { label: 'Payroll processing errors', value: '0%' },
    },
    {
      id:          'emi',
      category:    'Lending Engine',
      title:       'EMI Lifecycle Management',
      tagline:     'Automate collections.',
      description: 'Built for electronics retailers and NBFCs. Track down-payments, amortisation schedules, and auto-trigger WhatsApp/SMS reminders for due installments.',
      points:      ['Flexible amortisation models', 'Penalty & interest calculation', 'Repossession workflow', 'Bad-debt provisioning'],
      icon:        'pi-calculator',
      color:       'var(--color-warning, #f59e0b)',
      metric:      { label: 'Collection recovery uplift', value: '+18%' },
    },
    {
      id:          'storefront',
      category:    'Commerce',
      title:       'Headless Storefront Builder',
      tagline:     'Go D2C in a weekend.',
      description: 'Launch a pixel-perfect B2B or B2C store directly from your ERP. Inventory syncs in real time. No IT needed — SEO, banners, and pricing managed in-app.',
      points:      ['Drag-and-drop page builder', 'Customer portal with order history', 'Dynamic pricing & discount rules', 'Payment gateway integrations'],
      icon:        'pi-shopping-cart',
      color:       '#8b5cf6',
      metric:      { label: 'Time to launch', value: '5 mins' },
    },
    {
      id:          'ai',
      category:    'Intelligence Layer',
      title:       'Apex AI Analyst',
      tagline:     'Your 24/7 CFO.',
      description: 'Stop writing SQL. Ask "Which branch had the highest margin last week?" and get instant visual answers. Forecast cash flow, detect anomalies, auto-raise POs.',
      points:      ['Natural language querying', '90-day cash flow forecasting', 'Inventory theft anomaly detection', 'Auto-generated purchase orders'],
      icon:        'pi-sparkles',
      color:       '#ec4899',
      metric:      { label: 'Insight response time', value: 'instant' },
    },
  ]);

  readonly problems = signal([
    { icon: 'pi-server',               title: 'Data Silos',      desc: 'Finance, sales, and inventory live in separate tools that never agree.' },
    { icon: 'pi-calendar-times',       title: 'Slow Month-End',  desc: 'Closing the books takes 15 days of painful manual reconciliation.' },
    { icon: 'pi-exclamation-triangle', title: 'Stock-Outs',      desc: 'Lost sales from bad inventory data hurt revenue and trust.' },
    { icon: 'pi-file-excel',           title: 'Spreadsheet Risk', desc: 'Critical decisions made on spreadsheets riddled with human error.' },
  ]);

  readonly pricingPlans = signal([
    {
      name:     'Starter',
      price:    '₹4,999',
      period:   '/mo',
      popular:  false,
      features: ['1 Branch', 'Finance & Inventory', 'Up to 5 Users', 'Email Support'],
      cta:      'Start Free Trial',
      ctaClass: 'btn-outline',
    },
    {
      name:     'Growth',
      price:    '₹12,999',
      period:   '/mo',
      popular:  true,
      features: ['5 Branches', 'HR, Payroll & Storefront', 'Up to 25 Users', 'WhatsApp Notifications', 'Priority Support'],
      cta:      'Get Started',
      ctaClass: 'btn-primary',
    },
    {
      name:     'Enterprise',
      price:    'Custom',
      period:   '',
      popular:  false,
      features: ['Unlimited Branches', 'Apex AI Access', 'Unlimited Users', 'Dedicated CSM', 'SLA Guarantee'],
      cta:      'Contact Sales',
      ctaClass: 'btn-outline',
    },
  ]);

  readonly testimonials = signal([
    {
      quote:    'We reduced our month-end audit from 15 days to 2 hours. The real-time ledger is genuinely magical.',
      name:     'Rahul Sharma',
      role:     'CFO, TechFlow Industries',
      initials: 'RS',
      color:    'var(--color-success)',
    },
    {
      quote:    'The storefront builder let us go D2C in a single weekend. Inventory sync is flawless across all channels.',
      name:     'Priya Mehta',
      role:     'Founder, StyleUp Retail',
      initials: 'PM',
      color:    'var(--color-info)',
    },
    {
      quote:    'EMI tracking alone saved us ₹40L a year in missed collection follow-ups. The WhatsApp reminders just work.',
      name:     'Arjun Nair',
      role:     'MD, Kochi Electronics Hub',
      initials: 'AN',
      color:    'var(--color-warning)',
    },
  ]);

  readonly faqs = signal([
    { q: 'How quickly can we go live?',         a: 'Standard setups go live in 48 hours. Enterprise data migrations typically take 2–3 weeks with dedicated onboarding support.' },
    { q: 'Is our data secure?',                 a: 'All data is encrypted with AES-256 at rest and TLS 1.3 in transit. We are ISO 27001 certified and conduct quarterly penetration tests.' },
    { q: 'Can we customise invoice templates?', a: 'Yes — the Print Designer lets you drag and drop to build custom invoices, purchase orders, payslips, and delivery challans.' },
    { q: 'Does it support multi-currency?',     a: 'Yes. Live exchange rate feeds, realised/unrealised gain/loss reporting, and FEMA-compliant ledgers are built in.' },
    { q: 'What integrations are available?',     a: 'We connect natively with Razorpay, PayU, Tally (import), Shopify, and 40+ logistics partners. REST API and webhooks available on all plans.' },
  ]);

  readonly navLinks = ['Solutions', 'Platform', 'Pricing'];

  // ── Private ─────────────────────────────────────────────────────────────────
  private scrollObserver: IntersectionObserver | null = null;
  private featureTimer: ReturnType<typeof setInterval> | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initScrollObserver();
    this.startFeatureTimer();
  }

  ngOnDestroy(): void {
    this.scrollObserver?.disconnect();
    if (this.featureTimer) clearInterval(this.featureTimer);
  }

  // ── Host listeners ───────────────────────────────────────────────────────────
  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollY.set(window.scrollY);
  }

  // ── Methods ──────────────────────────────────────────────────────────────────
  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleAccordion(i: number): void {
    this.activeAccordionIdx.set(this.activeAccordionIdx() === i ? null : i);
  }

  setFeature(i: number): void {
    this.activeFeatureIdx.set(i);
    // Reset auto-cycle timer on manual selection
    if (this.featureTimer) clearInterval(this.featureTimer);
    this.startFeatureTimer();
  }

  getActiveFeature(): FeatureDetail {
    return this.features()[this.activeFeatureIdx()];
  }

  private initScrollObserver(): void {
    this.scrollObserver = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach(el => this.scrollObserver!.observe(el));
  }

  private startFeatureTimer(): void {
    this.featureTimer = setInterval(() => {
      this.activeFeatureIdx.update(i => (i + 1) % this.features().length);
    }, 4000);
  }
}
// import {
//   Component, OnInit, AfterViewInit, OnDestroy,
//   HostListener, signal, ViewEncapsulation, ChangeDetectionStrategy
// } from '@angular/core';

// import { RouterModule } from '@angular/router';

// export interface FeatureDetail {
//   id: string;
//   category: string;
//   title: string;
//   tagline: string;
//   description: string;
//   points: string[];
//   icon: string;
//   color: string;
//   metric?: { label: string; value: string };
// }

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [RouterModule],
//   templateUrl: './landing.component.html',
//   styleUrls: ['./landing.component.scss'],
//   encapsulation: ViewEncapsulation.None,
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

//   // ── State ───────────────────────────────────────────────────────────────────
//   readonly scrollY            = signal(0);
//   readonly mobileMenuOpen     = signal(false);
//   readonly activeAccordionIdx = signal<number | null>(0);
//   readonly activeFeatureIdx   = signal(0);

//   // ── Data ────────────────────────────────────────────────────────────────────
//   readonly heroData = signal({
//     headline: 'One Platform.\nInfinite Possibility.',
//     subhead:  'Apex Infinity unifies Financials, Inventory, HR, and Commerce in a single reactive core — purpose-built for high-growth Indian enterprises.',
//     stats: [
//       { value: '24+',    label: 'Integrated Modules' },
//       { value: '500+',   label: 'Active Organisations' },
//       { value: '99.99%', label: 'Guaranteed Uptime' },
//       { value: '<50ms',  label: 'API Response Time' },
//     ],
//   });

//   readonly features = signal<FeatureDetail[]>([
//     {
//       id:          'finance',
//       category:    'Financial Core',
//       title:       'Real-Time General Ledger',
//       tagline:     'Every rupee. Every second.',
//       description: 'A true double-entry accounting engine with live posting. Every sale, purchase, and payroll run reflects instantly — no overnight batch, no stale data.',
//       points:      ['Multi-branch P&L consolidation', 'Automated GST/TDS filing', 'Immutable audit trail with user stamps', 'Bank reconciliation in seconds'],
//       icon:        'pi-wallet',
//       color:       '#10b981',
//       metric:      { label: 'Reconciliation time', value: '<200ms' },
//     },
//     {
//       id:          'inventory',
//       category:    'Supply Chain',
//       title:       'Multi-Location Inventory',
//       tagline:     'Total stock visibility.',
//       description: 'Track stock across warehouses, retail outlets, and transit vans in real time. Smart transfer orders and predictive low-stock alerts eliminate lost sales.',
//       points:      ['Batch & expiry date tracking', 'Barcode / QR scanning built-in', 'Automated reorder point triggers', 'Variance & shrinkage reporting'],
//       icon:        'pi-box',
//       color:       '#3b82f6',
//       metric:      { label: 'Stock accuracy', value: '100%' },
//     },
//     {
//       id:          'hr',
//       category:    'Human Capital',
//       title:       'Biometric Attendance & Payroll',
//       tagline:     'People ops without the paper.',
//       description: 'Native integration with biometric devices and geo-fenced mobile punching. One-click payroll generation, leave approval workflows, and digital payslips.',
//       points:      ['Complex shift rotations & swaps', 'OT, LOP, and holiday calendar', 'Statutory compliance (PF, ESI, PT)', 'Employee self-service portal'],
//       icon:        'pi-users',
//       color:       '#0ea5e9',
//       metric:      { label: 'Payroll processing errors', value: '0%' },
//     },
//     {
//       id:          'emi',
//       category:    'Lending Engine',
//       title:       'EMI Lifecycle Management',
//       tagline:     'Automate collections.',
//       description: 'Built for electronics retailers and NBFCs. Track down-payments, amortisation schedules, and auto-trigger WhatsApp/SMS reminders for due installments.',
//       points:      ['Flexible amortisation models', 'Penalty & interest calculation', 'Repossession workflow', 'Bad-debt provisioning'],
//       icon:        'pi-calculator',
//       color:       '#f59e0b',
//       metric:      { label: 'Collection recovery uplift', value: '+18%' },
//     },
//     {
//       id:          'storefront',
//       category:    'Commerce',
//       title:       'Headless Storefront Builder',
//       tagline:     'Go D2C in a weekend.',
//       description: 'Launch a pixel-perfect B2B or B2C store directly from your ERP. Inventory syncs in real time. No IT needed — SEO, banners, and pricing managed in-app.',
//       points:      ['Drag-and-drop page builder', 'Customer portal with order history', 'Dynamic pricing & discount rules', 'Payment gateway integrations'],
//       icon:        'pi-shopping-cart',
//       color:       '#8b5cf6',
//       metric:      { label: 'Time to launch', value: '5 mins' },
//     },
//     {
//       id:          'ai',
//       category:    'Intelligence Layer',
//       title:       'Apex AI Analyst',
//       tagline:     'Your 24/7 CFO.',
//       description: 'Stop writing SQL. Ask "Which branch had the highest margin last week?" and get instant visual answers. Forecast cash flow, detect anomalies, auto-raise POs.',
//       points:      ['Natural language querying', '90-day cash flow forecasting', 'Inventory theft anomaly detection', 'Auto-generated purchase orders'],
//       icon:        'pi-sparkles',
//       color:       '#ec4899',
//       metric:      { label: 'Insight response time', value: 'instant' },
//     },
//   ]);

//   readonly problems = signal([
//     { icon: 'pi-server',               title: 'Data Silos',      desc: 'Finance, sales, and inventory live in separate tools that never agree.' },
//     { icon: 'pi-calendar-times',       title: 'Slow Month-End',  desc: 'Closing the books takes 15 days of painful manual reconciliation.' },
//     { icon: 'pi-exclamation-triangle', title: 'Stock-Outs',      desc: 'Lost sales from bad inventory data hurt revenue and trust.' },
//     { icon: 'pi-file-excel',           title: 'Spreadsheet Risk', desc: 'Critical decisions made on spreadsheets riddled with human error.' },
//   ]);

//   readonly pricingPlans = signal([
//     {
//       name:     'Starter',
//       price:    '₹4,999',
//       period:   '/mo',
//       popular:  false,
//       features: ['1 Branch', 'Finance & Inventory', 'Up to 5 Users', 'Email Support'],
//       cta:      'Start Free Trial',
//       ctaClass: 'btn-outline',
//     },
//     {
//       name:     'Growth',
//       price:    '₹12,999',
//       period:   '/mo',
//       popular:  true,
//       features: ['5 Branches', 'HR, Payroll & Storefront', 'Up to 25 Users', 'WhatsApp Notifications', 'Priority Support'],
//       cta:      'Get Started',
//       ctaClass: 'btn-primary',
//     },
//     {
//       name:     'Enterprise',
//       price:    'Custom',
//       period:   '',
//       popular:  false,
//       features: ['Unlimited Branches', 'Apex AI Access', 'Unlimited Users', 'Dedicated CSM', 'SLA Guarantee'],
//       cta:      'Contact Sales',
//       ctaClass: 'btn-outline',
//     },
//   ]);

//   readonly testimonials = signal([
//     {
//       quote:    'We reduced our month-end audit from 15 days to 2 hours. The real-time ledger is genuinely magical.',
//       name:     'Rahul Sharma',
//       role:     'CFO, TechFlow Industries',
//       initials: 'RS',
//       color:    '#10b981',
//     },
//     {
//       quote:    'The storefront builder let us go D2C in a single weekend. Inventory sync is flawless across all channels.',
//       name:     'Priya Mehta',
//       role:     'Founder, StyleUp Retail',
//       initials: 'PM',
//       color:    '#3b82f6',
//     },
//     {
//       quote:    'EMI tracking alone saved us ₹40L a year in missed collection follow-ups. The WhatsApp reminders just work.',
//       name:     'Arjun Nair',
//       role:     'MD, Kochi Electronics Hub',
//       initials: 'AN',
//       color:    '#f59e0b',
//     },
//   ]);

//   readonly faqs = signal([
//     { q: 'How quickly can we go live?',         a: 'Standard setups go live in 48 hours. Enterprise data migrations typically take 2–3 weeks with dedicated onboarding support.' },
//     { q: 'Is our data secure?',                  a: 'All data is encrypted with AES-256 at rest and TLS 1.3 in transit. We are ISO 27001 certified and conduct quarterly penetration tests.' },
//     { q: 'Can we customise invoice templates?',  a: 'Yes — the Print Designer lets you drag and drop to build custom invoices, purchase orders, payslips, and delivery challans.' },
//     { q: 'Does it support multi-currency?',      a: 'Yes. Live exchange rate feeds, realised/unrealised gain/loss reporting, and FEMA-compliant ledgers are built in.' },
//     { q: 'What integrations are available?',     a: 'We connect natively with Razorpay, PayU, Tally (import), Shopify, and 40+ logistics partners. REST API and webhooks available on all plans.' },
//   ]);

//   readonly navLinks = ['Solutions', 'Platform', 'Developers', 'Pricing'];

//   // ── Private ─────────────────────────────────────────────────────────────────
//   private scrollObserver: IntersectionObserver | null = null;
//   private featureTimer: ReturnType<typeof setInterval> | null = null;

//   // ── Lifecycle ────────────────────────────────────────────────────────────────
//   ngOnInit(): void {}

//   ngAfterViewInit(): void {
//     this.initScrollObserver();
//     this.startFeatureTimer();
//   }

//   ngOnDestroy(): void {
//     this.scrollObserver?.disconnect();
//     if (this.featureTimer) clearInterval(this.featureTimer);
//   }

//   // ── Host listeners ───────────────────────────────────────────────────────────
//   @HostListener('window:scroll')
//   onScroll(): void {
//     this.scrollY.set(window.scrollY);
//   }

//   // ── Methods ──────────────────────────────────────────────────────────────────
//   toggleMobileMenu(): void {
//     this.mobileMenuOpen.update(v => !v);
//   }

//   toggleAccordion(i: number): void {
//     this.activeAccordionIdx.set(this.activeAccordionIdx() === i ? null : i);
//   }

//   setFeature(i: number): void {
//     this.activeFeatureIdx.set(i);
//     // Reset auto-cycle timer on manual selection
//     if (this.featureTimer) clearInterval(this.featureTimer);
//     this.startFeatureTimer();
//   }

//   getActiveFeature(): FeatureDetail {
//     return this.features()[this.activeFeatureIdx()];
//   }

//   private initScrollObserver(): void {
//     this.scrollObserver = new IntersectionObserver(
//       entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
//       { threshold: 0.08 }
//     );
//     document.querySelectorAll('.reveal').forEach(el => this.scrollObserver!.observe(el));
//   }

//   private startFeatureTimer(): void {
//     this.featureTimer = setInterval(() => {
//       this.activeFeatureIdx.update(i => (i + 1) % this.features().length);
//     }, 4000);
//   }
// }

// // import { Component, OnInit, AfterViewInit, HostListener, signal, ViewEncapsulation, OnDestroy } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { RouterModule } from '@angular/router';

// // // Interface definition
// // interface FeatureDetail {
// //   id: string;
// //   category: string;
// //   title: string;
// //   tagline: string;
// //   description: string;
// //   points: string[];
// //   icon: string;
// //   colorVar: string;
// //   metric?: { label: string; value: string };
// // }

// // @Component({
// //   selector: 'app-landing',
// //   standalone: true,
// //   imports: [CommonModule, RouterModule],
// //   encapsulation: ViewEncapsulation.None,
// //   template: `
// //     <div class="landing-root">
      
// //       <!-- NAVIGATION -->
// //       <nav class="navbar" [class.navbar-scrolled]="scrollY() > 50">
// //         <div class="container nav-content">
// //           <div class="brand">
// //             <div class="logo-box"><i class="pi pi-infinity"></i></div>
// //             <span class="logo-text">APEX <strong>INFINITY</strong></span>
// //           </div>

// //           <!-- Desktop Links (Hidden on Mobile) -->
// //           <div class="desktop-links">
// //             <a href="#solutions">Solutions</a>
// //             <a href="#platform">Platform</a>
// //             <a href="#developers">Developers</a>
// //             <a href="#pricing">Pricing</a>
// //           </div>

// //           <!-- Desktop Actions (Hidden on Mobile) -->
// //           <div class="nav-actions">
// //             <!-- Native Buttons replacing pButton -->
// //             <button class="p-button p-button-text font-bold" routerLink="/auth/login">Login</button>
// //             <button class="p-button p-button-primary p-button-rounded font-bold">Start Trial</button>
// //           </div>

// //           <!-- Mobile Toggle Button -->
// //           <button class="mobile-toggle" (click)="toggleMobileMenu()">
// //             <i class="pi pi-bars"></i>
// //           </button>
// //         </div>
// //       </nav>

// //       <!-- MOBILE MENU OVERLAY & DRAWER -->
// //       <div class="mobile-menu-overlay" [class.open]="mobileMenuOpen()" (click)="toggleMobileMenu()"></div>
// //       <div class="mobile-nav" [class.open]="mobileMenuOpen()">
// //         <div class="mobile-nav-header">
// //             <span class="logo-text">APEX <strong>INFINITY</strong></span>
// //             <button class="close-btn" (click)="toggleMobileMenu()"><i class="pi pi-times"></i></button>
// //         </div>
// //         <div class="mobile-links">
// //             <a href="#solutions" (click)="toggleMobileMenu()">Solutions</a>
// //             <a href="#platform" (click)="toggleMobileMenu()">Platform</a>
// //             <a href="#developers" (click)="toggleMobileMenu()">Developers</a>
// //             <a href="#pricing" (click)="toggleMobileMenu()">Pricing</a>
// //         </div>
// //         <div class="mobile-actions">
// //              <button class="p-button p-button-outlined w-full" routerLink="/auth/login">Login</button>
// //              <button class="p-button p-button-primary w-full">Start Trial</button>
// //         </div>
// //       </div>

// //       <!-- HERO SECTION -->
// //       <header class="hero-section">
// //         <div class="glow-orb top-right"></div>
// //         <div class="glow-orb bottom-left"></div>
        
// //         <div class="container hero-grid">
// //           <div class="hero-text reveal-on-scroll">
// //             <div class="accent-pill">
// //               <i class="pi pi-check-circle"></i> Angular 20 Powered
// //             </div>
// //             <h1>{{ heroData().headline }}</h1>
// //             <p class="hero-sub">{{ heroData().subhead }}</p>
            
// //             <div class="hero-cta">
// //               <button class="p-button p-button-lg p-button-rounded p-button-primary">
// //                 <i class="pi pi-bolt mr-2"></i> Get Started Now
// //               </button>
// //               <button class="p-button p-button-lg p-button-rounded p-button-outlined">
// //                 <i class="pi pi-play mr-2"></i> Watch Demo
// //               </button>
// //             </div>

// //             <div class="hero-stats">
// //               @for (stat of heroData().stats; track stat.label) {
// //                 <div class="stat-item">
// //                   <strong>{{ stat.value }}</strong>
// //                   <span>{{ stat.label }}</span>
// //                 </div>
// //               }
// //             </div>
// //           </div>

// //           <div class="hero-visual reveal-on-scroll">
// //             <div class="glass-dashboard">
// //               <div class="dash-header">
// //                 <div class="dots"><span></span><span></span><span></span></div>
// //                 <div class="dash-search">Search Modules...</div>
// //               </div>
// //               <div class="dash-body">
// //                 <div class="dash-sidebar">
// //                   <div class="bar"></div><div class="bar"></div><div class="bar"></div>
// //                 </div>
// //                 <div class="dash-content">
// //                   <div class="widget-row">
// //                     <div class="widget lg">
// //                       <div class="chart-line"></div>
// //                     </div>
// //                     <div class="widget sm"></div>
// //                   </div>
// //                   <div class="widget-row">
// //                     <div class="widget md"></div>
// //                     <div class="widget md"></div>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div class="float-card users">
// //                 <i class="pi pi-users"></i>
// //                 <div><span>New Users</span><strong>+128</strong></div>
// //               </div>
// //               <div class="float-card sales">
// //                 <i class="pi pi-chart-line"></i>
// //                 <div><span>Revenue</span><strong>$42k</strong></div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </header>

// //       <section class="trust-section">
// //         <div class="container">
// //           <p>POWERING NEXT-GEN ENTERPRISES</p>
// //           <div class="logos">
// //             <i class="pi pi-google"></i>
// //             <i class="pi pi-amazon"></i>
// //             <i class="pi pi-microsoft"></i>
// //             <i class="pi pi-apple"></i>
// //             <i class="pi pi-discord"></i>
// //             <i class="pi pi-slack"></i>
// //           </div>
// //         </div>
// //       </section>

// //       <section class="problem-solution container reveal-on-scroll">
// //         <div class="section-head">
// //           <h2>The Fragmentation Trap</h2>
// //           <p>Why modern businesses stop growing.</p>
// //         </div>
// //         <div class="problem-grid">
// //           @for (prob of problems(); track prob.title) {
// //             <div class="problem-card">
// //               <div class="icon-box"><i class="pi" [class]="prob.icon"></i></div>
// //               <h3>{{ prob.title }}</h3>
// //               <p>{{ prob.desc }}</p>
// //             </div>
// //           }
// //         </div>
// //       </section>

// //       <div id="solutions" class="deep-dive-wrapper">
// //         <div class="section-head container">
// //           <h2>The Infinite Suite</h2>
// //           <p>20+ Integrated Modules. One Source of Truth.</p>
// //         </div>

// //         @for (feature of deepDiveFeatures(); track feature.id; let i = $index) {
// //           <section class="feature-row reveal-on-scroll" [class.reversed]="i % 2 !== 0">
// //             <div class="container row-inner">
              
// //               <div class="feature-text">
// //                 <div class="feature-pill" [style.background]="feature.colorVar + '20'" [style.color]="feature.colorVar">
// //                   {{ feature.category }}
// //                 </div>
// //                 <h3>{{ feature.title }}</h3>
// //                 <span class="tagline">{{ feature.tagline }}</span>
// //                 <p>{{ feature.description }}</p>
                
// //                 <ul class="check-points">
// //                   @for (pt of feature.points; track pt) {
// //                     <li><i class="pi pi-check" [style.color]="feature.colorVar"></i> {{ pt }}</li>
// //                   }
// //                 </ul>

// //                 <div class="metric-badge" *ngIf="feature.metric">
// //                   <span class="lbl">{{ feature.metric.label }}</span>
// //                   <span class="val" [style.color]="feature.colorVar">{{ feature.metric.value }}</span>
// //                 </div>
// //               </div>

// //               <div class="feature-visual">
// //                 <div class="glass-window" [style.border-top-color]="feature.colorVar">
// //                   <div class="window-controls"><span></span><span></span></div>
// //                   <div class="window-body center-content">
// //                     <i [class]="feature.icon" class="main-icon" [style.color]="feature.colorVar"></i>
// //                     <div class="abstract-lines">
// //                       <div class="line" style="width: 80%"></div>
// //                       <div class="line" style="width: 60%"></div>
// //                       <div class="line" style="width: 90%"></div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>

// //             </div>
// //           </section>
// //         }
// //       </div>

// //       <section class="ai-section reveal-on-scroll">
// //         <div class="container ai-grid">
// //           <div class="ai-visual">
// //             <div class="brain-graphic">
// //               <i class="pi pi-sparkles"></i>
// //             </div>
// //           </div>
// //           <div class="ai-content">
// //             <span class="highlight">POWERED BY APEX INTELLIGENCE</span>
// //             <h2>Your Business, Self-Driving.</h2>
// //             <p>Apex AI doesn't just report history; it predicts the future. Forecast cash flow, detect inventory theft, and auto-generate purchase orders.</p>
// //             <div class="chat-sim">
// //               <div class="msg user">"Analyze Q3 profit margins."</div>
// //               <div class="msg bot">"Margins are up 12% driven by lower logistics costs in the North region."</div>
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       <section id="developers" class="dev-section container reveal-on-scroll">
// //         <div class="section-head">
// //           <h2>Built for Builders</h2>
// //           <p>Extensible API first architecture.</p>
// //         </div>
// //         <div class="tech-grid">
// //           @for (tech of techStack(); track tech.name) {
// //             <div class="tech-card">
// //               <i [class]="tech.icon"></i>
// //               <span>{{ tech.name }}</span>
// //             </div>
// //           }
// //         </div>
// //         <div class="code-block">
// //           <div class="code-head">inventory-sync.ts</div>
// //           <pre><code><span class="kwd">import</span> {{ '{' }} ApexClient {{ '}' }} <span class="kwd">from</span> '@apex/sdk';

// // <span class="kwd">const</span> client = <span class="kwd">new</span> ApexClient(API_KEY);

// // <span class="comment">// Real-time stock update</span>
// // <span class="kwd">await</span> client.inventory.sync({{ '{' }}
// //   sku: 'IPHONE-15-PRO',
// //   qty: 50,
// //   warehouse: 'MUM-01'
// // {{ '}' }});</code></pre>
// //         </div>
// //       </section>

// //       <section id="pricing" class="pricing-section container reveal-on-scroll">
// //         <div class="section-head">
// //           <h2>Transparent Pricing</h2>
// //         </div>
// //         <div class="pricing-grid">
// //           <div class="price-card glass">
// //             <h3>Starter</h3>
// //             <div class="amount">₹4,999<span>/mo</span></div>
// //             <ul>
// //               <li><i class="pi pi-check"></i> 1 Branch</li>
// //               <li><i class="pi pi-check"></i> Finance & Inventory</li>
// //               <li><i class="pi pi-check"></i> 2 Users</li>
// //             </ul>
// //             <button class="p-button p-button-outlined w-full">Start Free</button>
// //           </div>
// //           <div class="price-card glass popular">
// //             <div class="ribbon">BEST VALUE</div>
// //             <h3>Growth</h3>
// //             <div class="amount">₹12,999<span>/mo</span></div>
// //             <ul>
// //               <li><i class="pi pi-check"></i> 5 Branches</li>
// //               <li><i class="pi pi-check"></i> HR, Payroll & Storefront</li>
// //               <li><i class="pi pi-check"></i> 10 Users</li>
// //             </ul>
// //             <button class="p-button p-button-primary w-full">Go Pro</button>
// //           </div>
// //           <div class="price-card glass">
// //             <h3>Enterprise</h3>
// //             <div class="amount">Custom</div>
// //             <ul>
// //               <li><i class="pi pi-check"></i> Unlimited Branches</li>
// //               <li><i class="pi pi-check"></i> AI Agent Access</li>
// //               <li><i class="pi pi-check"></i> Dedicated Support</li>
// //             </ul>
// //             <button class="p-button p-button-outlined w-full">Contact Sales</button>
// //           </div>
// //         </div>
// //       </section>

// //       <section class="testimonial-section container reveal-on-scroll">
// //         <h2>From the Founders</h2>
// //         <div class="review-grid">
// //           <div class="review-card glass">
// //             <p>"We reduced our audit time from 15 days to 2 hours. The real-time ledger is magic."</p>
// //             <div class="user">
// //               <div class="avatar">R</div>
// //               <div><strong>Rahul S.</strong><br><small>CFO, TechFlow</small></div>
// //             </div>
// //           </div>
// //           <div class="review-card glass">
// //             <p>"The storefront builder allowed us to go D2C in a weekend. Inventory sync is flawless."</p>
// //             <div class="user">
// //               <div class="avatar">P</div>
// //               <div><strong>Priya M.</strong><br><small>Founder, StyleUp</small></div>
// //             </div>
// //           </div>
// //         </div>
// //       </section>

// //       <!-- CUSTOM ACCORDION (Replaced p-accordion) -->
// //       <section class="faq-section container reveal-on-scroll">
// //         <h2>Common Questions</h2>
// //         <div class="faq-wrapper">
// //           <div class="accordion-root">
// //             @for (faq of faqs(); track faq.id; let i = $index) {
// //               <div class="accordion-item" [class.active]="activeAccordionIndex() === i">
// //                 <button class="accordion-header" (click)="toggleAccordion(i)">
// //                   <span class="faq-head">{{ faq.question }}</span>
// //                   <i class="pi" [class.pi-chevron-down]="activeAccordionIndex() !== i" [class.pi-chevron-up]="activeAccordionIndex() === i"></i>
// //                 </button>
// //                 <div class="accordion-content" *ngIf="activeAccordionIndex() === i">
// //                   <p class="faq-body">{{ faq.answer }}</p>
// //                 </div>
// //               </div>
// //             }
// //           </div>
// //         </div>
// //       </section>

// //       <section class="final-cta reveal-on-scroll">
// //         <div class="container">
// //           <div class="cta-box glass">
// //             <h2>Ready to Scale?</h2>
// //             <p>Join 500+ high-growth companies today.</p>
// //             <button class="p-button p-button-lg p-button-primary p-button-rounded">Get Started Free</button>
// //           </div>
// //         </div>
// //       </section>

// //       <footer class="main-footer">
// //         <div class="container footer-content">
// //           <div class="col brand-col">
// //             <h3>APEX INFINITY</h3>
// //             <p>© 2026 Apex Systems.</p>
// //           </div>
// //           <div class="col">
// //             <h4>Product</h4>
// //             <a href="#">Finance</a>
// //             <a href="#">HR & Payroll</a>
// //             <a href="#">Commerce</a>
// //           </div>
// //           <div class="col">
// //             <h4>Resources</h4>
// //             <a href="#">Documentation</a>
// //             <a href="#">API Reference</a>
// //             <a href="#">Status</a>
// //           </div>
// //           <div class="col">
// //             <h4>Legal</h4>
// //             <a href="#">Privacy Policy</a>
// //             <a href="#">Terms of Service</a>
// //           </div>
// //         </div>
// //       </footer>

// //     </div>
// //   `,
// //   styles: [`
// //     @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&family=Fira+Code&display=swap');
// //     /* Note: In a real app, include primeicons.css. Here we assume generic icon support or load it via global CSS */

// //     // Force override for Landing Page Isolation
// //     .landing-root {
// //       // Variables from user request
// //       --bg-primary: #050505;
// //       --text-primary: #ffffff;
// //       --font-body: 'Inter', sans-serif;
// //       --accent-primary: #3b82f6;
// //       --accent-primary-rgb: 59, 130, 246;
// //       --accent-secondary: #8b5cf6;
// //       --accent-tertiary: #ec4899;
// //       --accent-tertiary-rgb: 236, 72, 153;
// //       --text-secondary: #94a3b8;
// //       --text-tertiary: #64748b;
// //       --color-success: #10b981;
// //       --color-error: #ef4444;
// //       --color-info: #0ea5e9;
// //       --color-warning: #f59e0b;

// //       background-color: var(--bg-primary) !important;
// //       color: var(--text-primary) !important;
// //       font-family: var(--font-body) !important;
// //       overflow-x: hidden !important;
// //       position: relative !important;
// //       width: 100% !important;
// //       line-height: 1.5 !important;
// //       min-height: 100vh;

// //       // Reset basic elements inside landing
// //       h1, h2, h3, h4, p, ul, li {
// //         margin: 0 !important;
// //         padding: 0 !important;
// //         box-sizing: border-box !important;
// //       }

// //       // --- Custom Mock PrimeNG Styles ---
// //       .p-button {
// //         display: inline-flex !important;
// //         align-items: center !important;
// //         justify-content: center !important;
// //         padding: 0.75rem 1.25rem !important;
// //         font-family: var(--font-body) !important;
// //         font-weight: 600 !important;
// //         border-radius: 6px !important;
// //         cursor: pointer !important;
// //         transition: all 0.2s !important;
// //         border: 1px solid transparent !important;
// //         outline: none !important;
// //         font-size: 1rem !important;
// //         background: transparent !important;
// //         color: var(--accent-primary) !important;
// //       }

// //       .p-button-primary {
// //         background: var(--accent-primary) !important;
// //         color: #ffffff !important;
// //         border-color: var(--accent-primary) !important;
// //         &:hover { background: color-mix(in srgb, var(--accent-primary) 90%, white) !important; }
// //       }

// //       .p-button-outlined {
// //         background: transparent !important;
// //         border: 1px solid rgba(255,255,255,0.2) !important;
// //         color: #ffffff !important;
// //         &:hover { border-color: var(--accent-primary) !important; background: rgba(var(--accent-primary-rgb), 0.1) !important; }
// //       }

// //       .p-button-rounded {
// //         border-radius: 9999px !important;
// //       }

// //       .p-button-text {
// //         background: transparent !important;
// //         border-color: transparent !important;
// //         color: #fff !important;
// //         &:hover { background: rgba(255,255,255,0.05) !important; }
// //       }

// //       .p-button-lg {
// //         padding: 1rem 2rem !important;
// //         font-size: 1.125rem !important;
// //       }
      
// //       .w-full { width: 100% !important; }
// //       .font-bold { font-weight: 700 !important; }
// //       .mr-2 { margin-right: 0.5rem !important; }

// //       // --- Mixins ---
// //       @mixin glass-panel {
// //         background: rgba(255, 255, 255, 0.02) !important;
// //         backdrop-filter: blur(16px) !important;
// //         -webkit-backdrop-filter: blur(16px) !important;
// //         border: 1px solid rgba(255, 255, 255, 0.08) !important;
// //         border-radius: 20px !important;
// //         box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
// //       }

// //       .container {
// //         max-width: 1300px !important;
// //         margin: 0 auto !important;
// //         padding: 0 24px !important;
// //       }

// //       // 1. Navbar
// //       .navbar {
// //         position: fixed !important;
// //         top: 0 !important; left: 0 !important; width: 100% !important;
// //         z-index: 1000 !important;
// //         padding: 20px 0 !important;
// //         transition: all 0.3s ease !important;

// //         &.navbar-scrolled {
// //           background: rgba(10,10,10,0.85) !important;
// //           backdrop-filter: blur(20px) !important;
// //           padding: 10px 0 !important;
// //           border-bottom: 1px solid rgba(255,255,255,0.05) !important;
// //         }

// //         .nav-content {
// //           display: flex !important;
// //           justify-content: space-between !important;
// //           align-items: center !important;
// //         }

// //         .brand {
// //           display: flex !important; align-items: center !important; gap: 10px !important;
// //           .logo-box {
// //             width: 36px !important; height: 36px !important;
// //             background: var(--accent-primary) !important;
// //             color: #fff !important;
// //             border-radius: 8px !important;
// //             display: grid !important; place-items: center !important;
// //             font-size: 1.2rem !important;
// //           }
// //           .logo-text { font-size: 1.25rem !important; font-weight: 500 !important; }
// //         }

// //         .desktop-links {
// //           display: none !important;
// //           gap: 30px !important;
// //           @media(min-width: 992px) { display: flex !important; }
// //           a {
// //             color: var(--text-secondary) !important;
// //             text-decoration: none !important;
// //             font-weight: 500 !important;
// //             &:hover { color: var(--accent-primary) !important; }
// //           }
// //         }

// //         .nav-actions {
// //           display: none !important; gap: 15px !important;
// //           @media(min-width: 992px) { display: flex !important; }
// //         }
        
// //         .mobile-toggle {
// //           background: none !important; border: none !important; font-size: 1.5rem !important;
// //           color: var(--text-primary) !important;
// //           @media(min-width: 992px) { display: none !important; }
// //         }
// //       }

// //       // --- MOBILE MENU FIX (ADDED STYLES) ---
// //       .mobile-menu-overlay {
// //         position: fixed !important; inset: 0 !important; background: rgba(0,0,0,0.6) !important; backdrop-filter: blur(4px) !important;
// //         z-index: 1001 !important; opacity: 0 !important; pointer-events: none !important; transition: opacity 0.3s !important;
// //         &.open { opacity: 1 !important; pointer-events: auto !important; }
// //       }

// //       .mobile-nav {
// //         position: fixed !important; top: 0 !important; right: -300px !important; width: 300px !important; height: 100vh !important;
// //         background: #0a0a0a !important; border-left: 1px solid rgba(255,255,255,0.1) !important;
// //         z-index: 1002 !important; transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
// //         padding: 24px !important; display: flex !important; flex-direction: column !important;
        
// //         &.open { right: 0 !important; }

// //         .mobile-nav-header {
// //            display: flex !important; justify-content: space-between !important; align-items: center !important; margin-bottom: 40px !important;
// //            .logo-text { font-size: 1.2rem !important; }
// //            .close-btn { background: none !important; border: none !important; color: #fff !important; font-size: 1.5rem !important; }
// //         }
        
// //         .mobile-links {
// //             display: flex !important; flex-direction: column !important; gap: 10px !important;
// //             a { 
// //                 display: block !important; padding: 16px 0 !important; 
// //                 border-bottom: 1px solid rgba(255,255,255,0.05) !important; 
// //                 color: #ccc !important; text-decoration: none !important; font-size: 1.1rem !important; 
// //                 &:hover { color: var(--accent-primary) !important; padding-left: 10px !important; transition: 0.2s !important; }
// //             }
// //         }

// //         .mobile-actions { 
// //             margin-top: auto !important; display: flex !important; flex-direction: column !important; gap: 12px !important; 
// //         }
// //       }

// //       // 2. Hero
// //       .hero-section {
// //         padding-top: 140px !important;
// //         padding-bottom: 100px !important;
// //         position: relative !important;
        
// //         .glow-orb {
// //           position: absolute !important;
// //           width: 600px !important; height: 600px !important;
// //           background: var(--accent-primary) !important;
// //           filter: blur(150px) !important;
// //           opacity: 0.15 !important;
// //           z-index: -1 !important;
// //           border-radius: 50% !important;
// //           &.top-right { top: -200px !important; right: -100px !important; }
// //           &.bottom-left { bottom: -100px !important; left: -200px !important; background: var(--accent-secondary) !important; }
// //         }

// //         .hero-grid {
// //           display: grid !important;
// //           grid-template-columns: 1fr !important;
// //           gap: 50px !important;
// //           align-items: center !important;
// //           @media(min-width: 992px) { grid-template-columns: 1.1fr 0.9fr !important; }
// //         }

// //         .hero-text {
// //           h1 {
// //             font-size: 3.5rem !important;
// //             line-height: 1.1 !important;
// //             font-weight: 800 !important;
// //             margin-bottom: 20px !important;
// //             background: linear-gradient(135deg, #fff 30%, var(--accent-primary) 100%) !important;
// //             -webkit-background-clip: text !important;
// //             -webkit-text-fill-color: transparent !important;
// //           }
// //           .hero-sub {
// //             font-size: 1.2rem !important;
// //             color: var(--text-secondary) !important;
// //             margin-bottom: 40px !important;
// //             max-width: 90% !important;
// //           }
// //           .accent-pill {
// //             display: inline-flex !important; align-items: center !important; gap: 8px !important;
// //             padding: 6px 14px !important;
// //             border-radius: 20px !important;
// //             background: rgba(var(--accent-primary-rgb), 0.1) !important;
// //             color: var(--accent-primary) !important;
// //             font-size: 0.85rem !important;
// //             font-weight: 600 !important;
// //             margin-bottom: 24px !important;
// //             border: 1px solid rgba(var(--accent-primary-rgb), 0.2) !important;
// //           }
// //           .hero-cta { display: flex !important; gap: 15px !important; margin-bottom: 50px !important; }
// //           .hero-stats {
// //             display: flex !important; gap: 40px !important; border-top: 1px solid rgba(255,255,255,0.1) !important; padding-top: 20px !important;
// //             .stat-item {
// //               strong { display: block !important; font-size: 1.8rem !important; font-weight: 700 !important; }
// //               span { font-size: 0.8rem !important; color: var(--text-tertiary) !important; text-transform: uppercase !important; }
// //             }
// //           }
// //         }

// //         .glass-dashboard {
// //           @include glass-panel;
// //           height: 450px !important;
// //           position: relative !important;
// //           padding: 20px !important;
// //           transform: perspective(1000px) rotateY(-5deg) !important;
// //           transition: transform 0.5s ease !important;
// //           &:hover { transform: perspective(1000px) rotateY(0deg) !important; }

// //           .dash-header {
// //             display: flex !important; justify-content: space-between !important; margin-bottom: 20px !important;
// //             .dots span { display: inline-block !important; width: 8px !important; height: 8px !important; background: rgba(255,255,255,0.2) !important; border-radius: 50% !important; margin-right: 5px !important; }
// //             .dash-search { width: 150px !important; height: 10px !important; background: rgba(255,255,255,0.1) !important; border-radius: 4px !important; }
// //           }
// //           .dash-body {
// //             display: flex !important; gap: 20px !important; height: 80% !important;
// //             .dash-sidebar {
// //               width: 50px !important; border-right: 1px solid rgba(255,255,255,0.05) !important;
// //               .bar { height: 8px !important; width: 30px !important; background: rgba(255,255,255,0.1) !important; margin-bottom: 10px !important; border-radius: 4px !important; }
// //             }
// //             .dash-content {
// //               flex: 1 !important;
// //               .widget-row { display: flex !important; gap: 15px !important; margin-bottom: 15px !important; }
// //               .widget { 
// //                 background: rgba(255,255,255,0.03) !important; border-radius: 12px !important; 
// //                 &.lg { flex: 2 !important; height: 150px !important; position: relative !important; overflow: hidden !important; }
// //                 &.sm { flex: 1 !important; height: 150px !important; }
// //                 &.md { flex: 1 !important; height: 120px !important; }
// //               }
// //               .chart-line {
// //                 width: 100% !important; height: 100% !important;
// //                 background: linear-gradient(90deg, transparent, rgba(var(--accent-primary-rgb), 0.2)) !important;
// //                 clip-path: polygon(0 80%, 20% 60%, 40% 70%, 60% 40%, 80% 50%, 100% 20%, 100% 100%, 0 100%) !important;
// //               }
// //             }
// //           }
// //           .float-card {
// //             position: absolute !important; @include glass-panel;
// //             padding: 12px 20px !important; display: flex !important; align-items: center !important; gap: 15px !important;
// //             background: #111 !important; border: 1px solid rgba(255,255,255,0.15) !important;
// //             i { font-size: 1.5rem !important; }
// //             &.users { top: 40px !important; right: -30px !important; i { color: var(--accent-secondary) !important; } }
// //             &.sales { bottom: 60px !important; left: -30px !important; i { color: var(--color-success) !important; } }
// //           }
// //         }
// //       }

// //       // 3. Trust
// //       .trust-section {
// //         text-align: center !important; padding: 60px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important;
// //         p { font-size: 0.8rem !important; letter-spacing: 2px !important; color: var(--text-tertiary) !important; margin-bottom: 30px !important; }
// //         .logos { display: flex !important; justify-content: center !important; gap: 60px !important; flex-wrap: wrap !important; i { font-size: 2rem !important; opacity: 0.4 !important; } }
// //       }

// //       // 4. Problem/Solution
// //       .problem-solution {
// //         padding: 100px 24px !important;
// //         .section-head { text-align: center !important; margin-bottom: 60px !important; h2 { font-size: 2.5rem !important; margin-bottom: 10px !important; } p { color: var(--text-secondary) !important; } }
// //         .problem-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important; gap: 30px !important; }
// //         .problem-card {
// //           @include glass-panel; padding: 30px !important; text-align: center !important;
// //           .icon-box { font-size: 2rem !important; color: var(--color-error) !important; margin-bottom: 20px !important; }
// //           h3 { font-size: 1.2rem !important; margin-bottom: 10px !important; }
// //           p { font-size: 0.9rem !important; color: var(--text-secondary) !important; }
// //         }
// //       }

// //       // 5-14. Features Loop
// //       .deep-dive-wrapper {
// //         padding-bottom: 100px !important;
// //         .section-head { text-align: center !important; margin-bottom: 80px !important; padding-top: 80px !important; h2 { font-size: 3rem !important; margin-bottom: 10px !important; } }
        
// //         .feature-row {
// //           padding: 80px 0 !important;
          
// //           .row-inner {
// //             display: grid !important; grid-template-columns: 1fr !important; gap: 60px !important; align-items: center !important;
// //             @media(min-width: 992px) { grid-template-columns: 1fr 1fr !important; }
// //           }

// //           &.reversed .row-inner {
// //             @media(min-width: 992px) {
// //               .feature-text { order: 2 !important; }
// //               .feature-visual { order: 1 !important; }
// //             }
// //           }

// //           .feature-text {
// //             .feature-pill { display: inline-block !important; padding: 4px 12px !important; border-radius: 12px !important; font-size: 0.75rem !important; font-weight: 700 !important; text-transform: uppercase !important; margin-bottom: 15px !important; }
// //             h3 { font-size: 2.5rem !important; margin-bottom: 5px !important; }
// //             .tagline { display: block !important; font-size: 1.2rem !important; color: var(--text-secondary) !important; margin-bottom: 20px !important; }
// //             p { font-size: 1rem !important; line-height: 1.6 !important; color: var(--text-secondary) !important; margin-bottom: 30px !important; }
// //             .check-points {
// //               list-style: none !important; margin-bottom: 30px !important;
// //               li { display: flex !important; align-items: center !important; gap: 10px !important; margin-bottom: 10px !important; font-size: 1rem !important; }
// //             }
// //             .metric-badge {
// //               display: inline-flex !important; flex-direction: column !important; padding-left: 20px !important; border-left: 3px solid rgba(255,255,255,0.1) !important;
// //               .lbl { font-size: 0.75rem !important; color: var(--text-tertiary) !important; text-transform: uppercase !important; }
// //               .val { font-size: 1.8rem !important; font-weight: 800 !important; }
// //             }
// //           }

// //           .feature-visual {
// //             .glass-window {
// //               @include glass-panel; height: 350px !important; width: 100% !important; border-top-width: 3px !important;
// //               display: flex !important; flex-direction: column !important;
// //               .window-controls { padding: 15px !important; display: flex !important; gap: 8px !important; span { width: 10px !important; height: 10px !important; background: rgba(255,255,255,0.2) !important; border-radius: 50% !important; } }
// //               .window-body {
// //                 flex: 1 !important; display: flex !important; align-items: center !important; justify-content: center !important; flex-direction: column !important;
// //                 .main-icon { font-size: 5rem !important; margin-bottom: 30px !important; opacity: 0.8 !important; }
// //                 .abstract-lines {
// //                   width: 60% !important; display: flex !important; flex-direction: column !important; gap: 10px !important;
// //                   .line { height: 8px !important; background: rgba(255,255,255,0.05) !important; border-radius: 4px !important; }
// //                 }
// //               }
// //             }
// //           }
// //         }
// //       }

// //       // 15. AI Section
// //       .ai-section {
// //         background: #000 !important; padding: 100px 0 !important; border-top: 1px solid rgba(255,255,255,0.1) !important;
// //         .ai-grid {
// //           display: grid !important; grid-template-columns: 1fr !important; gap: 50px !important; align-items: center !important;
// //           @media(min-width: 992px) { grid-template-columns: 1fr 1fr !important; }
// //         }
// //         .brain-graphic { font-size: 8rem !important; color: var(--accent-tertiary) !important; text-align: center !important; animation: pulse-glow 3s infinite !important; }
// //         .highlight { color: var(--accent-tertiary) !important; font-weight: 700 !important; letter-spacing: 1px !important; font-size: 0.8rem !important; }
// //         h2 { font-size: 3rem !important; margin: 15px 0 !important; }
// //         .chat-sim {
// //           margin-top: 30px !important; display: flex !important; flex-direction: column !important; gap: 15px !important;
// //           .msg {
// //             padding: 15px 20px !important; border-radius: 20px !important; font-size: 0.9rem !important; max-width: 80% !important;
// //             &.user { align-self: flex-end !important; background: rgba(255,255,255,0.1) !important; }
// //             &.bot { align-self: flex-start !important; background: rgba(var(--accent-tertiary-rgb), 0.2) !important; border: 1px solid var(--accent-tertiary) !important; color: #fff !important; }
// //           }
// //         }
// //       }

// //       // 16. Dev Section
// //       .dev-section {
// //         padding: 100px 24px !important; text-align: center !important;
// //         .tech-grid { display: flex !important; justify-content: center !important; gap: 40px !important; margin: 40px 0 !important; }
// //         .tech-card { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 10px !important; i { font-size: 2rem !important; } }
// //         .code-block {
// //           text-align: left !important; background: #1e1e1e !important; padding: 20px !important; border-radius: 12px !important; max-width: 700px !important; margin: 0 auto !important; box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important;
// //           .code-head { font-family: monospace !important; color: #666 !important; border-bottom: 1px solid #333 !important; padding-bottom: 10px !important; margin-bottom: 15px !important; }
// //           pre { color: #ccc !important; font-family: 'Fira Code', monospace !important; font-size: 0.9rem !important; overflow-x: auto !important; }
// //           .kwd { color: #c678dd !important; } .comment { color: #5c6370 !important; }
// //         }
// //       }

// //       // 17. Pricing
// //       .pricing-section {
// //         padding: 100px 24px !important;
// //         .pricing-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; gap: 30px !important; margin-top: 50px !important; }
// //         .price-card {
// //           @include glass-panel; padding: 40px !important; text-align: center !important; position: relative !important;
// //           &.popular { border: 1px solid var(--accent-primary) !important; background: rgba(var(--accent-primary-rgb), 0.05) !important; transform: scale(1.05) !important; z-index: 2 !important; }
// //           .ribbon { position: absolute !important; top: -12px !important; left: 50% !important; transform: translateX(-50%) !important; background: var(--accent-primary) !important; padding: 4px 12px !important; font-size: 0.7rem !important; border-radius: 10px !important; font-weight: 700 !important; }
// //           .amount { font-size: 2.5rem !important; font-weight: 700 !important; margin: 20px 0 !important; span { font-size: 1rem !important; color: var(--text-tertiary) !important; font-weight: 400 !important; } }
// //           ul { list-style: none !important; margin-bottom: 30px !important; text-align: left !important; li { margin-bottom: 10px !important; i { color: var(--color-success) !important; margin-right: 10px !important; } } }
// //         }
// //       }

// //       // 18. Testimonials
// //       .testimonial-section {
// //         padding: 100px 24px !important; text-align: center !important;
// //         h2 { margin-bottom: 60px !important; font-size: 2.5rem !important; }
// //         .review-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important; gap: 30px !important; }
// //         .review-card {
// //           @include glass-panel; padding: 30px !important; text-align: left !important;
// //           p { font-size: 1.1rem !important; font-style: italic !important; margin-bottom: 20px !important; }
// //           .user { display: flex !important; align-items: center !important; gap: 15px !important; .avatar { width: 40px !important; height: 40px !important; background: #333 !important; border-radius: 50% !important; display: grid !important; place-items: center !important; } }
// //         }
// //       }

// //       // 19. FAQ - Custom Accordion Styles
// //       .faq-section {
// //         padding: 100px 24px !important; max-width: 900px !important; margin: 0 auto !important;
// //         h2 { text-align: center !important; margin-bottom: 50px !important; }
        
// //         .accordion-root {
// //           display: flex !important; flex-direction: column !important; gap: 15px !important;
// //         }

// //         .accordion-item {
// //           @include glass-panel; border-radius: 12px !important; overflow: hidden !important;
// //           transition: all 0.3s !important;
          
// //           &.active { border-color: rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.05) !important; }

// //           .accordion-header {
// //             width: 100% !important; display: flex !important; justify-content: space-between !important; align-items: center !important;
// //             padding: 20px !important; background: transparent !important; border: none !important;
// //             color: #fff !important; font-weight: 600 !important; cursor: pointer !important; text-align: left !important;
// //             font-size: 1.1rem !important;
            
// //             i { font-size: 0.9rem !important; opacity: 0.7 !important; transition: transform 0.3s !important; }
// //           }

// //           .accordion-content {
// //             padding: 0 20px 20px !important; color: #ccc !important; line-height: 1.6 !important;
// //             border-top: 1px solid rgba(255,255,255,0.05) !important;
// //           }
// //         }
// //       }

// //       // 20. CTA
// //       .final-cta {
// //         padding: 100px 24px !important;
// //         .cta-box { @include glass-panel; text-align: center !important; padding: 80px 20px !important; h2 { font-size: 3rem !important; margin-bottom: 20px !important; } button { margin-top: 30px !important; } }
// //       }

// //       // 21. Footer
// //       .main-footer {
// //         background: #050505 !important; padding: 80px 0 40px !important; border-top: 1px solid rgba(255,255,255,0.05) !important;
// //         .footer-content { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important; gap: 40px !important; }
// //         h3 { font-size: 1.2rem !important; margin-bottom: 15px !important; color: #fff !important; }
// //         h4 { color: #888 !important; font-size: 0.9rem !important; margin-bottom: 20px !important; text-transform: uppercase !important; }
// //         a { display: block !important; color: #666 !important; margin-bottom: 10px !important; transition: 0.2s !important; &:hover { color: #fff !important; } }
// //       }

// //       // Animation
// //       @keyframes pulse-glow { 0% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(1); } }
// //       .reveal-on-scroll { opacity: 0 !important; transform: translateY(30px) !important; transition: all 0.8s ease-out !important; &.reveal-visible { opacity: 1 !important; transform: translateY(0) !important; } }
// //     }
// //   `]
// // })
// // export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
// //   private scrollObserver: IntersectionObserver | null = null;

// //   readonly scrollY = signal(0);
// //   readonly activeTab = signal('finance');
// //   readonly mobileMenuOpen = signal(false);
// //   readonly activeAccordionIndex = signal<number | null>(0);

// //   // 1. Hero Data
// //   readonly heroData = signal({
// //     headline: 'Architecting the Infinite Enterprise.',
// //     subhead: 'Apex Infinity is the only ERP that unifies Financials, Supply Chain, and Human Capital with a reactive, sub-50ms core.',
// //     stats: [
// //       { label: 'Modules', value: '24+' },
// //       { label: 'Active Orgs', value: '500+' },
// //       { label: 'Uptime', value: '99.99%' }
// //     ]
// //   });

// //   // 2. The Massive Feature List (Restoring Depth)
// //   readonly deepDiveFeatures = signal<FeatureDetail[]>([
// //     {
// //       id: 'finance',
// //       category: 'Financial Core',
// //       title: 'Real-Time General Ledger',
// //       tagline: 'The Heart of Truth',
// //       description: 'A double-entry accounting engine that updates instantly. Every sale, purchase, and payroll run impacts the ledger in real-time. No end-of-day batch processing.',
// //       points: ['Multi-Branch Consolidation', 'Automated GST/Tax Filing', 'Audit Trail & Immutable Logs'],
// //       icon: 'pi pi-wallet',
// //       colorVar: 'var(--color-success)',
// //       metric: { label: 'Reconciliation Speed', value: '< 200ms' }
// //     },
// //     {
// //       id: 'inventory',
// //       category: 'Supply Chain',
// //       title: 'Multi-Location Inventory',
// //       tagline: 'Global Visibility',
// //       description: 'Track stock across warehouses, retail outlets, and transit vans. Smart transfer orders and low-stock alerts ensure you never miss a sale.',
// //       points: ['Batch & Expiry Tracking', 'Barcode/QR Scanning Support', 'Automated Replenishment'],
// //       icon: 'pi pi-box',
// //       colorVar: 'var(--accent-primary)',
// //       metric: { label: 'Stock Accuracy', value: '100%' }
// //     },
// //     {
// //       id: 'storefront',
// //       category: 'Commerce',
// //       title: 'Headless Storefront Builder',
// //       tagline: 'B2B & B2C Unified',
// //       description: 'Launch a pixel-perfect public store directly from your ERP. Inventory syncs instantly. Manage SEO, banners, and pricing without IT help.',
// //       points: ['Drag-and-Drop Page Builder', 'Real-time Stock Sync', 'Customer Portal Built-in'],
// //       icon: 'pi pi-shopping-cart',
// //       colorVar: 'var(--accent-secondary)',
// //       metric: { label: 'Deploy Time', value: '5 Mins' }
// //     },
// //     {
// //       id: 'hr',
// //       category: 'Human Capital',
// //       title: 'Biometric Attendance & Payroll',
// //       tagline: 'Manage People, Not Paper',
// //       description: 'Direct integration with biometric devices. Automated shift scheduling, leave management, and one-click payroll generation based on actual hours.',
// //       points: ['Geo-fenced Mobile Punching', 'Complex Shift Rotations', 'Payslip Generation'],
// //       icon: 'pi pi-users',
// //       colorVar: 'var(--color-info)',
// //       metric: { label: 'Payroll Errors', value: '0%' }
// //     },
// //     {
// //       id: 'emi',
// //       category: 'Lending Engine',
// //       title: 'EMI Lifecycle Management',
// //       tagline: 'Automated Collections',
// //       description: 'Designed for electronics retailers and financiers. Track down-payments, interest schedules, and automate SMS reminders for due installments.',
// //       points: ['Amortization Schedules', 'Penalty Calculation', 'Bad Debt Analytics'],
// //       icon: 'pi pi-calculator',
// //       colorVar: 'var(--color-warning)',
// //       metric: { label: 'Recovery Rate', value: '+18%' }
// //     },
// //     {
// //       id: 'ai',
// //       category: 'Intelligence',
// //       title: 'Apex AI Analyst',
// //       tagline: 'Your 24/7 CFO',
// //       description: 'Stop writing SQL. Ask questions like "Which branch had the highest profit margin last week?" and get visual answers instantly.',
// //       points: ['Natural Language Querying', 'Trend Forecasting', 'Anomaly Detection'],
// //       icon: 'pi pi-bolt',
// //       colorVar: 'var(--accent-tertiary)',
// //       metric: { label: 'Response Time', value: 'instant' }
// //     },
// //     {
// //       id: 'sales',
// //       category: 'Sales Force',
// //       title: 'Omnichannel Sales Order',
// //       tagline: 'Sell Everywhere',
// //       description: 'Unify offline POS, online orders, and B2B quotes. One screen to manage approvals, shipping, and invoicing across all channels.',
// //       points: ['Quotation to Invoice Flow', 'Credit Limit Checks', 'Sales Commission Tracking'],
// //       icon: 'pi pi-percentage',
// //       colorVar: 'var(--text-secondary)'
// //     },
// //     {
// //       id: 'purchase',
// //       category: 'Procurement',
// //       title: 'Smart Procurement',
// //       tagline: 'Optimize Spending',
// //       description: 'Vendor portals, purchase requisition workflows, and landed cost calculations. Know exactly what your inventory costs.',
// //       points: ['Vendor Performance Rating', 'GRN Verification', 'Landed Cost Analysis'],
// //       icon: 'pi pi-truck',
// //       colorVar: 'var(--color-error)'
// //     },
// //     {
// //       id: 'manufacturing',
// //       category: 'Production',
// //       title: 'Light Manufacturing',
// //       tagline: 'Bill of Materials',
// //       description: 'Manage BOMs, raw material consumption, and finished goods production. Perfect for assembly and packaging units.',
// //       points: ['Raw Material Planning', 'Wastage Tracking', 'Production Costing'],
// //       icon: 'pi pi-cog',
// //       colorVar: 'var(--text-primary)'
// //     },
// //     {
// //       id: 'assets',
// //       category: 'Asset Mgmt',
// //       title: 'Fixed Asset Tracking',
// //       tagline: 'Value Over Time',
// //       description: 'Depreciation schedules, asset maintenance logs, and location tracking for all company equipment.',
// //       points: ['Automated Depreciation', 'Maintenance Alerts', 'QR Asset Tagging'],
// //       icon: 'pi pi-building',
// //       colorVar: 'var(--accent-primary)'
// //     }
// //   ]);

// //   // 3. Problem/Solution Data
// //   readonly problems = signal([
// //     { title: 'Data Silos', desc: 'Finance doesn\'t talk to Sales.', icon: 'pi-server' },
// //     { title: 'Slow Closing', desc: 'Month-end takes 15 days.', icon: 'pi-calendar-times' },
// //     { title: 'Stock Outs', desc: 'Lost sales due to bad inventory data.', icon: 'pi-exclamation-triangle' },
// //     { title: 'Manual Error', desc: 'Spreadsheets serve as databases.', icon: 'pi-file-excel' }
// //   ]);

// //   // 4. FAQ Data
// //   readonly faqs = signal([
// //     { id: '1', question: 'How long does implementation take?', answer: 'For standard setups, you can go live in 48 hours. Enterprise migrations typically take 2-3 weeks.' },
// //     { id: '2', question: 'Is my data secure?', answer: 'We use AES-256 encryption at rest and TLS 1.3 in transit. We are ISO 27001 compliant.' },
// //     { id: '3', question: 'Can I customize the print formats?', answer: 'Yes, our "Print Designer" lets you drag-and-drop to create custom invoices, POs, and labels.' },
// //     { id: '4', question: 'Does it support multi-currency?', answer: 'Yes, automated exchange rate fetching and realized/unrealized gain/loss reporting is built-in.' }
// //   ]);

// //   // 5. Tech Stack (For the "Tech" section)
// //   readonly techStack = signal([
// //     { name: 'Angular 20', icon: 'pi pi-code' },
// //     { name: 'PrimeNG', icon: 'pi pi-palette' },
// //     { name: 'Signals', icon: 'pi pi-bolt' },
// //     { name: 'Node.js', icon: 'pi pi-server' }
// //   ]);

// //   constructor() {}

// //   ngOnInit() {
// //     // Theme logic removed to ensure standalone functionality
// //   }

// //   ngAfterViewInit() {
// //     this.initScrollObserver();
// //   }

// //   ngOnDestroy() {
// //     if (this.scrollObserver) {
// //       this.scrollObserver.disconnect();
// //     }
// //   }

// //   @HostListener('window:scroll')
// //   onScroll() {
// //     this.scrollY.set(window.scrollY);
// //   }

// //   private initScrollObserver() {
// //     this.scrollObserver = new IntersectionObserver((entries) => {
// //       entries.forEach(entry => {
// //         if (entry.isIntersecting) {
// //           entry.target.classList.add('reveal-visible');
// //         }
// //       });
// //     }, { threshold: 0.1 });

// //     document.querySelectorAll('.reveal-on-scroll').forEach(el => this.scrollObserver?.observe(el));
// //   }

// //   toggleMobileMenu() {
// //     this.mobileMenuOpen.update(v => !v);
// //   }

// //   toggleAccordion(index: number) {
// //     if (this.activeAccordionIndex() === index) {
// //       this.activeAccordionIndex.set(null);
// //     } else {
// //       this.activeAccordionIndex.set(index);
// //     }
// //   }
// // }
// // // import { Component, OnInit, AfterViewInit, HostListener, signal, inject, ViewEncapsulation, OnDestroy } from '@angular/core';
// // // import { CommonModule } from '@angular/common';
// // // import { RouterModule } from '@angular/router';
// // // import { ButtonModule } from 'primeng/button';
// // // import { TooltipModule } from 'primeng/tooltip';
// // // import { AccordionModule } from 'primeng/accordion';
// // // import { ThemeService } from '../core/services/theme.service';

// // // interface FeatureDetail {
// // //   id: string;
// // //   category: string;
// // //   title: string;
// // //   tagline: string;
// // //   description: string;
// // //   points: string[];
// // //   icon: string;
// // //   colorVar: string;
// // //   metric?: { label: string; value: string };
// // // }

// // // @Component({
// // //   selector: '',
// // //   standalone: true,
// // //   imports: [CommonModule, RouterModule, ButtonModule, TooltipModule, AccordionModule],
// // //   templateUrl: './landing.component.html',
// // //   styleUrl: './landing.component.scss',
// // //   encapsulation: ViewEncapsulation.None 
// // // })
// // // export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
// // //   private themeService = inject(ThemeService);
// // //   private scrollObserver: IntersectionObserver | null = null;

// // //   readonly scrollY = signal(0);
// // //   readonly activeTab = signal('finance');
// // //   readonly mobileMenuOpen = signal(false);

// // //   // 1. Hero Data
// // //   readonly heroData = signal({
// // //     headline: 'Architecting the Infinite Enterprise.',
// // //     subhead: 'Apex Infinity is the only ERP that unifies Financials, Supply Chain, and Human Capital with a reactive, sub-50ms core.',
// // //     stats: [
// // //       { label: 'Modules', value: '24+' },
// // //       { label: 'Active Orgs', value: '500+' },
// // //       { label: 'Uptime', value: '99.99%' }
// // //     ]
// // //   });

// // //   // 2. The Massive Feature List (Restoring Depth)
// // //   readonly deepDiveFeatures = signal<FeatureDetail[]>([
// // //     {
// // //       id: 'finance',
// // //       category: 'Financial Core',
// // //       title: 'Real-Time General Ledger',
// // //       tagline: 'The Heart of Truth',
// // //       description: 'A double-entry accounting engine that updates instantly. Every sale, purchase, and payroll run impacts the ledger in real-time. No end-of-day batch processing.',
// // //       points: ['Multi-Branch Consolidation', 'Automated GST/Tax Filing', 'Audit Trail & Immutable Logs'],
// // //       icon: 'pi pi-wallet',
// // //       colorVar: 'var(--color-success)',
// // //       metric: { label: 'Reconciliation Speed', value: '< 200ms' }
// // //     },
// // //     {
// // //       id: 'inventory',
// // //       category: 'Supply Chain',
// // //       title: 'Multi-Location Inventory',
// // //       tagline: 'Global Visibility',
// // //       description: 'Track stock across warehouses, retail outlets, and transit vans. Smart transfer orders and low-stock alerts ensure you never miss a sale.',
// // //       points: ['Batch & Expiry Tracking', 'Barcode/QR Scanning Support', 'Automated Replenishment'],
// // //       icon: 'pi pi-box',
// // //       colorVar: 'var(--accent-primary)',
// // //       metric: { label: 'Stock Accuracy', value: '100%' }
// // //     },
// // //     {
// // //       id: 'storefront',
// // //       category: 'Commerce',
// // //       title: 'Headless Storefront Builder',
// // //       tagline: 'B2B & B2C Unified',
// // //       description: 'Launch a pixel-perfect public store directly from your ERP. Inventory syncs instantly. Manage SEO, banners, and pricing without IT help.',
// // //       points: ['Drag-and-Drop Page Builder', 'Real-time Stock Sync', 'Customer Portal Built-in'],
// // //       icon: 'pi pi-shopping-cart',
// // //       colorVar: 'var(--accent-secondary)',
// // //       metric: { label: 'Deploy Time', value: '5 Mins' }
// // //     },
// // //     {
// // //       id: 'hr',
// // //       category: 'Human Capital',
// // //       title: 'Biometric Attendance & Payroll',
// // //       tagline: 'Manage People, Not Paper',
// // //       description: 'Direct integration with biometric devices. Automated shift scheduling, leave management, and one-click payroll generation based on actual hours.',
// // //       points: ['Geo-fenced Mobile Punching', 'Complex Shift Rotations', 'Payslip Generation'],
// // //       icon: 'pi pi-users',
// // //       colorVar: 'var(--color-info)',
// // //       metric: { label: 'Payroll Errors', value: '0%' }
// // //     },
// // //     {
// // //       id: 'emi',
// // //       category: 'Lending Engine',
// // //       title: 'EMI Lifecycle Management',
// // //       tagline: 'Automated Collections',
// // //       description: 'Designed for electronics retailers and financiers. Track down-payments, interest schedules, and automate SMS reminders for due installments.',
// // //       points: ['Amortization Schedules', 'Penalty Calculation', 'Bad Debt Analytics'],
// // //       icon: 'pi pi-calculator',
// // //       colorVar: 'var(--color-warning)',
// // //       metric: { label: 'Recovery Rate', value: '+18%' }
// // //     },
// // //     {
// // //       id: 'ai',
// // //       category: 'Intelligence',
// // //       title: 'Apex AI Analyst',
// // //       tagline: 'Your 24/7 CFO',
// // //       description: 'Stop writing SQL. Ask questions like "Which branch had the highest profit margin last week?" and get visual answers instantly.',
// // //       points: ['Natural Language Querying', 'Trend Forecasting', 'Anomaly Detection'],
// // //       icon: 'pi pi-bolt',
// // //       colorVar: 'var(--accent-tertiary)',
// // //       metric: { label: 'Response Time', value: 'instant' }
// // //     },
// // //     {
// // //       id: 'sales',
// // //       category: 'Sales Force',
// // //       title: 'Omnichannel Sales Order',
// // //       tagline: 'Sell Everywhere',
// // //       description: 'Unify offline POS, online orders, and B2B quotes. One screen to manage approvals, shipping, and invoicing across all channels.',
// // //       points: ['Quotation to Invoice Flow', 'Credit Limit Checks', 'Sales Commission Tracking'],
// // //       icon: 'pi pi-percentage',
// // //       colorVar: 'var(--text-secondary)'
// // //     },
// // //     {
// // //       id: 'purchase',
// // //       category: 'Procurement',
// // //       title: 'Smart Procurement',
// // //       tagline: 'Optimize Spending',
// // //       description: 'Vendor portals, purchase requisition workflows, and landed cost calculations. Know exactly what your inventory costs.',
// // //       points: ['Vendor Performance Rating', 'GRN Verification', 'Landed Cost Analysis'],
// // //       icon: 'pi pi-truck',
// // //       colorVar: 'var(--color-error)'
// // //     },
// // //     {
// // //       id: 'manufacturing',
// // //       category: 'Production',
// // //       title: 'Light Manufacturing',
// // //       tagline: 'Bill of Materials',
// // //       description: 'Manage BOMs, raw material consumption, and finished goods production. Perfect for assembly and packaging units.',
// // //       points: ['Raw Material Planning', 'Wastage Tracking', 'Production Costing'],
// // //       icon: 'pi pi-cog',
// // //       colorVar: 'var(--text-primary)'
// // //     },
// // //     {
// // //       id: 'assets',
// // //       category: 'Asset Mgmt',
// // //       title: 'Fixed Asset Tracking',
// // //       tagline: 'Value Over Time',
// // //       description: 'Depreciation schedules, asset maintenance logs, and location tracking for all company equipment.',
// // //       points: ['Automated Depreciation', 'Maintenance Alerts', 'QR Asset Tagging'],
// // //       icon: 'pi pi-building',
// // //       colorVar: 'var(--accent-primary)'
// // //     }
// // //   ]);

// // //   // 3. Problem/Solution Data
// // //   readonly problems = signal([
// // //     { title: 'Data Silos', desc: 'Finance doesn\'t talk to Sales.', icon: 'pi-server' },
// // //     { title: 'Slow Closing', desc: 'Month-end takes 15 days.', icon: 'pi-calendar-times' },
// // //     { title: 'Stock Outs', desc: 'Lost sales due to bad inventory data.', icon: 'pi-exclamation-triangle' },
// // //     { title: 'Manual Error', desc: 'Spreadsheets serve as databases.', icon: 'pi-file-excel' }
// // //   ]);

// // //   // 4. FAQ Data
// // //   readonly faqs = signal([
// // //     { id: '1', question: 'How long does implementation take?', answer: 'For standard setups, you can go live in 48 hours. Enterprise migrations typically take 2-3 weeks.' },
// // //     { id: '2', question: 'Is my data secure?', answer: 'We use AES-256 encryption at rest and TLS 1.3 in transit. We are ISO 27001 compliant.' },
// // //     { id: '3', question: 'Can I customize the print formats?', answer: 'Yes, our "Print Designer" lets you drag-and-drop to create custom invoices, POs, and labels.' },
// // //     { id: '4', question: 'Does it support multi-currency?', answer: 'Yes, automated exchange rate fetching and realized/unrealized gain/loss reporting is built-in.' }
// // //   ]);

// // //   // 5. Tech Stack (For the "Tech" section)
// // //   readonly techStack = signal([
// // //     { name: 'Angular 20', icon: 'pi pi-code' },
// // //     { name: 'PrimeNG', icon: 'pi pi-palette' },
// // //     { name: 'Signals', icon: 'pi pi-bolt' },
// // //     { name: 'Node.js', icon: 'pi pi-server' }
// // //   ]);

// // //   constructor() {}

// // //   ngOnInit() {
// // //     this.themeService.setLightTheme('theme-glass');
// // //   }

// // //   ngAfterViewInit() {
// // //     this.initScrollObserver();
// // //   }

// // //   ngOnDestroy() {
// // //     if (this.scrollObserver) {
// // //       this.scrollObserver.disconnect();
// // //     }
// // //   }

// // //   @HostListener('window:scroll')
// // //   onScroll() {
// // //     this.scrollY.set(window.scrollY);
// // //   }

// // //   private initScrollObserver() {
// // //     this.scrollObserver = new IntersectionObserver((entries) => {
// // //       entries.forEach(entry => {
// // //         if (entry.isIntersecting) {
// // //           entry.target.classList.add('reveal-visible');
// // //         }
// // //       });
// // //     }, { threshold: 0.1 });

// // //     document.querySelectorAll('.reveal-on-scroll').forEach(el => this.scrollObserver?.observe(el));
// // //   }

// // //   toggleMobileMenu() {
// // //     this.mobileMenuOpen.update(v => !v);
// // //   }
// // // }
