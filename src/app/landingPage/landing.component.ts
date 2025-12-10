import { CommonModule } from '@angular/common';
import { Component, HostListener, AfterViewInit, ViewChildren, QueryList, ElementRef, OnDestroy, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

type StatKey = 'users' | 'transactions' | 'uptime';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;
  @HostListener('scroll', ['$event']) 
onScroll(event: Event) {
  this.checkStatsAnimation();
}
  // UI State
  activeTab = 'finance';
  theme: 'light' | 'dark' = 'light';
  
  // Animated Stats
  stats = { users: 0, transactions: 0, uptime: 0 };
  private hasAnimatedStats = false;
  private observer: IntersectionObserver | null = null;

  // --- NEW: ROI Calculator Logic ---
  roiEmployees = 10;
  roiHoursSaved = 5;
  roiHourlyRate = 500; // INR
  
  // Computed property (simple getter for UI)
  get monthlySavings(): number {
    return this.roiEmployees * this.roiHoursSaved * this.roiHourlyRate;
  }

  // --- NEW: Developer Mode Snippet ---
  codeSnippet = `
  // Apex Infinity API
  // Automated Reconciliation
  {
    "status": "success",
    "data": {
       "reconciled": true,
       "confidence": 0.99,
       "matched_ledger": "HDFC_001"
    }
  }`;

  // Existing Data Modules
  modules = [
    { id: 'finance', label: 'Financial Core', title: 'Complete Financial Control', desc: 'Invoices, ledgers, GST, and reconciliation—auditable and fast.', icon: 'pi pi-wallet', tags: ['GST Ready', 'Auto-Recon'] },
    { id: 'inventory', label: 'Inventory Hub', title: 'Multi-Branch Inventory', desc: 'Real-time syncing across branches with dead-stock detection.', icon: 'pi pi-box', tags: ['Sync', 'Forecast'] },
    { id: 'ai', label: 'Apex AI', title: 'The Neural Analyst', desc: 'Natural language queries for your entire business database.', icon: 'pi pi-bolt', tags: ['Generative', 'Predictive'] }
  ];

  // Refined Features for Bento Grid
  bentoFeatures = [
    { title: 'Predictive AI', desc: 'Forecasts revenue with 94% accuracy.', class: 'span-2', icon: 'pi pi-chart-line' },
    { title: 'Role-Based Access', desc: 'Granular permissions.', class: 'span-1', icon: 'pi pi-lock' },
    { title: 'Auto-Invoicing', desc: 'Recurring billing engine.', class: 'span-1', icon: 'pi pi-receipt' },
    { title: 'Multi-Branch Sync', desc: 'Real-time data mesh.', class: 'span-2', icon: 'pi pi-sitemap' },
  ];

  permissionsList = [
    { tag: 'analytics:view_executive', group: 'Analytics', desc: 'Strategic Insights' },
    { tag: 'product:stock_adjust', group: 'Inventory', desc: 'Stock Adjustment' },
    { tag: 'ai:chat', group: 'Utilities', desc: 'AI Assistant' },
    { tag: 'reconciliation:read', group: 'Finance', desc: 'Reconciliation Reports' }
  ];

  caseStudies = [
    { name: 'Shardha Electronics', metric: '+28%', label: 'Revenue Growth', brief: 'Reduced dead stock across 8 branches.' },
    { name: 'Mehta Distributors', metric: '+18%', label: 'Cashflow', brief: 'Automated vendor scheduling.' },
    { name: 'Urban Retail', metric: '99.9%', label: 'Uptime', brief: 'Centralized operations across 26 stores.' }
  ];
  carouselIndex = 0;

  pricing = [
    { name: 'Starter', price: '₹999', period: '/mo', features: ['Core Finance', '1 Branch', 'Email Support'], highlight: false },
    { name: 'Scale', price: '₹4,999', period: '/mo', features: ['Multi-Branch', 'AI Forecasts', 'Priority Support'], highlight: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['SLA', 'Onboarding', 'Dedicated Manager'], highlight: false }
  ];

  constructor() {}

  ngOnInit(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  ngAfterViewInit(): void {
    const options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    setTimeout(() => {
      this.revealItems?.forEach(item => this.observer?.observe(item.nativeElement));
    }, 100);
    
    this.checkStatsAnimation();
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }

  @HostListener('window:scroll')
  onWindowScroll() { this.checkStatsAnimation(); }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  setActiveTab(tabId: string) { this.activeTab = tabId; }

  nextCase() { this.carouselIndex = (this.carouselIndex + 1) % this.caseStudies.length; }
  prevCase() { this.carouselIndex = (this.carouselIndex - 1 + this.caseStudies.length) % this.caseStudies.length; }

  // Animation Logic (Kept optimized)
  private checkStatsAnimation() {
    if (this.hasAnimatedStats) return;
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;
    const rect = statsSection.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      this.hasAnimatedStats = true;
      this.runCounter('users', 0, 1200, 1500);
      this.runCounter('transactions', 0, 85, 1500);
      this.runCounter('uptime', 90, 99.9, 1500);
    }
  }

  private runCounter(key: StatKey, start: number, end: number, duration: number) {
    let startTime: number | null = null;
    const step = (t: number) => {
      if (!startTime) startTime = t;
      const progress = Math.min((t - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const value = start + (end - start) * eased;
      
      if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
      else this.stats[key] = Math.floor(value);
      
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
}

// import { CommonModule } from '@angular/common';
// import { Component, HostListener, AfterViewInit, ViewChildren, QueryList, ElementRef, OnDestroy, ChangeDetectionStrategy, OnInit } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';

// type StatKey = 'users'|'transactions'|'uptime';

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './landing.component.html',
//   styleUrls: ['./landing.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush
// })
// export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
//   @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;
//   @ViewChildren('carouselItem') carouselItems!: QueryList<ElementRef>;

//   // UI state
//   activeTab = 'finance';
//   theme: 'light' | 'dark' = 'light';

//   // Stats (animated)
//   stats = { users: 0, transactions: 0, uptime: 0 };
//   private hasAnimatedStats = false;
//   private observer: IntersectionObserver | null = null;

//   // Data (can be wired to APIs)
//   modules = [
//     { id: 'finance', label: 'Financial Core', title: 'Complete Financial Control', desc: 'Invoices, ledgers, GST, EMI and reconciliation—automated and auditable.', icon: 'pi pi-wallet', features: ['P&L & Cashflow', 'EMI Scheduling', 'Bank Reconciliation'] },
//     { id: 'inventory', label: 'Inventory & Supply', title: 'Multi-Branch Inventory', desc: 'Branch sync, dead-stock detection and reorder intelligence.', icon: 'pi pi-box', features: ['Stock Forecasts', 'Supplier Scorecard', 'Low-stock Alerts'] },
//     { id: 'ai', label: 'Apex AI', title: 'AI Financial Analyst', desc: 'Natural language insights and predictive forecasts.', icon: 'pi pi-bolt', features: ['Natural Q&A', 'Anomaly Detection', 'Forecasting'] }
//   ];

//   features = [
//     { title: 'AI-Powered Insights', desc: 'Predictive models and explainable signals.', highlight: true },
//     { title: 'Role-Based Access', desc: 'Granular permissions and audit logs.' , highlight: false},
//     { title: 'Multi-Branch Sync', desc: 'Real-time inventory and sales across branches.' , highlight: false},
//     { title: 'Invoice & EMI Engine', desc: 'Automate invoices, reminders and EMIs.' , highlight: false},
//     { title: 'Export & Compliance', desc: 'Export governance + audit trails.' , highlight: false},
//     { title: 'Customer Risk Engine', desc: 'RFM segmentation & debtor aging.' , highlight: false}
//   ];

//   // Representative capability tiles (from permissions map)
//   permissionsList = [
//     { tag: 'analytics:view_executive', group: 'Analytics', desc: 'Access Executive Dashboard & Strategic Insights' },
//     { tag: 'analytics:view_forecast', group: 'Analytics', desc: 'View AI Revenue & Sales Forecasts' },
//     { tag: 'analytics:export_data', group: 'Analytics', desc: 'Export Reports to CSV/Excel' },
//     { tag: 'product:stock_adjust', group: 'Inventory', desc: 'Manual Stock Adjustment' },
//     { tag: 'user:manage', group: 'System', desc: 'Create/Edit/Delete Users' },
//     { tag: 'invoice:create', group: 'Sales', desc: 'Create Invoices' },
//     { tag: 'ai:chat', group: 'Utilities', desc: 'Use AI Assistant' },
//     { tag: 'reconciliation:read', group: 'Finance', desc: 'View Reconciliation Reports' }
//   ];

//   caseStudies = [
//     { name: 'Shardha Electronics', metric: 'Revenue +28%', brief: 'Reduced dead stock across 8 branches.' },
//     { name: 'Mehta Distributors', metric: 'Cashflow +18%', brief: 'Automated reconciliation and vendor scheduling.' },
//     { name: 'Urban Retail', metric: 'Uptime 99.99%', brief: 'Centralized operations across 26 stores.' }
//   ];
//   carouselIndex = 0;

//   comparison = [
//     { product: 'Apex Infinity', accounting: 'Full ledger, invoices, recon', inventory: 'Multi-branch sync, forecasts', ai: 'Natural language forecasts', permissions: 'Granular RBAC & exports', enterprise: 'SSO, SLA, audit logs' },
//     { product: 'Zoho', accounting: 'ERP-lite accounting', inventory: 'Basic inventory modules', ai: 'Limited predictive insights', permissions: 'Role controls', enterprise: 'Paid advanced tiers' },
//     { product: 'TallyPrime', accounting: 'Strong accounting, GST', inventory: 'Stock basics', ai: 'None', permissions: 'User roles limited', enterprise: 'On-premise focus' },
//     { product: 'Vyapar', accounting: 'SMB invoicing & GST', inventory: 'Small store inventory', ai: 'None', permissions: 'Basic user model', enterprise: 'SMB-focused' },
//     { product: 'QuickBooks', accounting: 'Cloud accounting, recon', inventory: 'Inventory add-on', ai: 'Smart suggestions', permissions: 'Role-level access', enterprise: 'Mid-market' }
//   ];

//   pricing = [
//     { name: 'Starter', price: '₹999/mo', bullets: ['Core Finance', '1 Branch', 'Email Support'] },
//     { name: 'Scale', price: '₹4,999/mo', bullets: ['Multi-Branch', 'AI Forecasts', 'Priority Support'] },
//     { name: 'Enterprise', price: 'Contact', bullets: ['SLA', 'Onboarding', 'Custom Integrations'] }
//   ];

//   constructor() {}

//   ngOnInit(): void {
//     document.documentElement.setAttribute('data-theme', this.theme);
//   }

//   ngAfterViewInit(): void {
//     const options = { threshold: 0.12, rootMargin: '0px 0px -80px 0px' };
//     this.observer = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add('in-view');
//           this.observer?.unobserve(entry.target);
//         }
//       });
//     }, options);

//     setTimeout(() => {
//       this.revealItems?.forEach(item => this.observer?.observe(item.nativeElement));
//     }, 80);

//     this.checkStatsAnimation();
//   }

//   ngOnDestroy(): void { this.observer?.disconnect(); }

//   @HostListener('window:scroll')
//   onWindowScroll() { this.checkStatsAnimation(); }

//   setActiveTab(tabId: string) { this.activeTab = tabId; }

//   toggleTheme(value: 'light'|'dark') {
//     this.theme = value;
//     document.documentElement.setAttribute('data-theme', value);
//   }

//   private checkStatsAnimation() {
//     if (this.hasAnimatedStats) return;
//     const statsSection = document.getElementById('stats-section');
//     if (!statsSection) return;
//     const rect = statsSection.getBoundingClientRect();
//     if (rect.top < window.innerHeight - 100) {
//       this.hasAnimatedStats = true;
//       this.runCounter('users', 0, 1200, 1600);
//       this.runCounter('transactions', 0, 85, 1600);
//       this.runCounter('uptime', 90, 99.9, 1600);
//     }
//   }

//   private runCounter(key: StatKey, start: number, end: number, duration: number) {
//     let startTime: number | null = null;
//     const step = (t: number) => {
//       if (!startTime) startTime = t;
//       const p = Math.min((t - startTime) / duration, 1);
//       const eased = 1 - Math.pow(1 - p, 3);
//       const value = start + (end - start) * eased;
//       if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
//       else this.stats[key] = Math.floor(value);
//       if (p < 1) window.requestAnimationFrame(step);
//     };
//     window.requestAnimationFrame(step);
//   }

//   nextCase() { this.carouselIndex = (this.carouselIndex + 1) % this.caseStudies.length; }
//   prevCase() { this.carouselIndex = (this.carouselIndex - 1 + this.caseStudies.length) % this.caseStudies.length; }
// }


// // import { CommonModule } from '@angular/common';
// // import { Component, HostListener, AfterViewInit, ViewChildren, QueryList, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
// // import { FormsModule } from '@angular/forms';
// // import { RouterModule } from '@angular/router';

// // type StatKey = 'users'|'transactions'|'uptime';

// // @Component({
// //   selector: 'app-landing',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule, RouterModule],
// //   templateUrl: './landing.component.html',
// //   styleUrls: ['./landing.component.scss'],
// //   changeDetection: ChangeDetectionStrategy.OnPush
// // })
// // export class LandingComponent implements AfterViewInit, OnDestroy {
// //   @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;
// //   @ViewChildren('carouselItem') carouselItems!: QueryList<ElementRef>;

// //   scrollY = 0;
// //   activeTab = 'finance';
// //   theme: 'light'|'dark' = 'light';

// //   // animated stats
// //   stats = { users: 0, transactions: 0, uptime: 0 };
// //   private hasAnimatedStats = false;
// //   private observer: IntersectionObserver | null = null;

// //   // core modules
// //   modules = [
// //     { id: 'finance', label: 'Financial Core', title: 'Complete Financial Control', desc: 'Invoices, ledgers, GST, EMI and recon—automated and auditable.', icon: 'pi pi-wallet', features: ['P&L & Cashflow', 'EMI Scheduling', 'Bank Reconciliation'] },
// //     { id: 'inventory', label: 'Inventory & Supply', title: 'Multi-Branch Inventory', desc: 'Branch sync, dead-stock detection and reorder intelligence.', icon: 'pi pi-box', features: ['Stock Forecasts', 'Supplier Scorecard', 'Low-stock Alerts'] },
// //     { id: 'ai', label: 'Apex AI', title: 'AI Financial Analyst', desc: 'Natural language insights and predictive forecasts.', icon: 'pi pi-bolt', features: ['Natural Q&A', 'Anomaly Detection', 'Forecasting'] }
// //   ];

// //   features = [
// //     { title: 'AI-Powered Insights', desc: 'Predictive models and explainable signals.', highlight: true },
// //     { title: 'Role-Based Access', desc: 'Granular permissions and audit logs.' , highlight: false},
// //     { title: 'Multi-Branch Sync', desc: 'Real-time inventory and sales across branches.' , highlight: false},
// //     { title: 'Invoice & EMI Engine', desc: 'Automate invoices, reminders and EMIs.' , highlight: false},
// //     { title: 'Export & Compliance', desc: 'Export governance + audit trails.' , highlight: false},
// //     { title: 'Customer Risk Engine', desc: 'RFM segmentation & debtor aging.' , highlight: false}
// //   ];

// //   // Use the permissions list as capability map for storytelling (subset shown)
// //   permissionsList = [
// //     { tag: 'analytics:view_executive', group: 'Analytics', desc: 'Access Executive Dashboard & Strategic Insights' },
// //     { tag: 'analytics:view_forecast', group: 'Analytics', desc: 'View AI Revenue & Sales Forecasts' },
// //     { tag: 'analytics:export_data', group: 'Analytics', desc: 'Export Reports to CSV/Excel' },
// //     { tag: 'product:stock_adjust', group: 'Inventory', desc: 'Manual Stock Adjustment' },
// //     { tag: 'user:manage', group: 'System', desc: 'Create/Edit/Delete Users' },
// //     { tag: 'invoice:create', group: 'Sales', desc: 'Create Invoices' },
// //     { tag: 'ai:chat', group: 'Utilities', desc: 'Use AI Assistant' },
// //     { tag: 'reconciliation:read', group: 'Finance', desc: 'View Reconciliation Reports' }
// //   ];

// //   // case studies
// //   caseStudies = [
// //     { name: 'Shardha Electronics', metric: 'Revenue +28%', brief: 'Reduced dead stock and improved cash conversion across 8 branches.' },
// //     { name: 'Mehta Distributors', metric: 'Cashflow +18%', brief: 'Automated reconciliation and vendor scheduling.' },
// //     { name: 'Urban Retail', metric: 'Uptime 99.99%', brief: 'Single pane operations across 26 stores.' }
// //   ];
// //   carouselIndex = 0;

// //   // comparison table (data-driven)
// //   comparison = [
// //     {
// //       product: 'Apex Infinity',
// //       accounting: 'Full ledger, invoices, recon',
// //       inventory: 'Multi-branch sync, forecasts',
// //       ai: 'Natural language forecasts',
// //       permissions: 'Granular RBAC & exports',
// //       enterprise: 'SSO, SLA, audit logs'
// //     },
// //     {
// //       product: 'Zoho',
// //       accounting: 'ERP-lite accounting',
// //       inventory: 'Basic inventory modules',
// //       ai: 'Limited predictive insights',
// //       permissions: 'Role controls',
// //       enterprise: 'Paid advanced tiers'
// //     },
// //     {
// //       product: 'TallyPrime',
// //       accounting: 'Strong accounting, GST',
// //       inventory: 'Stock basics',
// //       ai: 'None (manual analysis)',
// //       permissions: 'User roles limited',
// //       enterprise: 'Traditional on-premise focus'
// //     },
// //     {
// //       product: 'Vyapar',
// //       accounting: 'SMB invoicing & GST',
// //       inventory: 'Small store inventory',
// //       ai: 'None',
// //       permissions: 'Basic user model',
// //       enterprise: 'SMB-focused'
// //     },
// //     {
// //       product: 'QuickBooks',
// //       accounting: 'Cloud accounting, recon',
// //       inventory: 'Inventory add-on',
// //       ai: 'Smart suggestions',
// //       permissions: 'Role-level access',
// //       enterprise: 'Mid-market, limited enterprise features'
// //     }
// //   ];

// //   // pricing teaser
// //   pricing = [
// //     { name: 'Starter', price: '₹999/mo', bullets: ['Core Finance', '1 Branch', 'Email Support'] },
// //     { name: 'Scale', price: '₹4,999/mo', bullets: ['Multi-Branch', 'AI Forecasts', 'Priority Support'] },
// //     { name: 'Enterprise', price: 'Contact', bullets: ['SLA', 'Onboarding', 'Custom Integrations'] }
// //   ];

// //   constructor() {}

// //   ngAfterViewInit(): void {
// //     // Intersection observer for reveal
// //     const options = { threshold: 0.12, rootMargin: '0px 0px -80px 0px' };
// //     this.observer = new IntersectionObserver((entries) => {
// //       entries.forEach(entry => {
// //         if (entry.isIntersecting) {
// //           entry.target.classList.add('in-view');
// //           this.observer?.unobserve(entry.target);
// //         }
// //       });
// //     }, options);

// //     setTimeout(() => {
// //       this.revealItems?.forEach(item => this.observer?.observe(item.nativeElement));
// //     }, 100);

// //     this.checkStatsAnimation();
// //   }

// //   ngOnDestroy(): void {
// //     this.observer?.disconnect();
// //   }

// //   @HostListener('window:scroll')
// //   onWindowScroll() {
// //     this.scrollY = window.scrollY;
// //     this.checkStatsAnimation();
// //   }

// //   setActiveTab(tabId: string) { this.activeTab = tabId; }

// //   toggleTheme(value: 'light'|'dark') {
// //     this.theme = value;
// //     document.documentElement.setAttribute('data-theme', value);
// //   }

// //   // Stats animation
// //   private checkStatsAnimation() {
// //     if (this.hasAnimatedStats) return;
// //     const statsSection = document.getElementById('stats-section');
// //     if (!statsSection) return;
// //     const rect = statsSection.getBoundingClientRect();
// //     if (rect.top < window.innerHeight - 100) {
// //       this.hasAnimatedStats = true;
// //       this.runCounter('users', 0, 1200, 1800);
// //       this.runCounter('transactions', 0, 85, 1800);
// //       this.runCounter('uptime', 90, 99.9, 1800);
// //     }
// //   }

// //   private runCounter(key: StatKey, start: number, end: number, duration: number) {
// //     let startTime: number | null = null;
// //     const step = (timestamp: number) => {
// //       if (!startTime) startTime = timestamp;
// //       const progress = Math.min((timestamp - startTime) / duration, 1);
// //       const eased = 1 - Math.pow(1 - progress, 3);
// //       const value = start + (end - start) * eased;
// //       if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
// //       else this.stats[key] = Math.floor(value);
// //       if (progress < 1) window.requestAnimationFrame(step);
// //     };
// //     window.requestAnimationFrame(step);
// //   }

// //   // carousel controls
// //   nextCase() { this.carouselIndex = (this.carouselIndex + 1) % this.caseStudies.length; }
// //   prevCase() { this.carouselIndex = (this.carouselIndex - 1 + this.caseStudies.length) % this.caseStudies.length; }
// // }


// // // import { CommonModule } from '@angular/common';
// // // import { Component, HostListener, AfterViewInit, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
// // // import { FormsModule } from '@angular/forms';
// // // import { RouterModule } from '@angular/router';

// // // @Component({
// // //   selector: 'app-landing',
// // //   standalone: true,
// // //   imports: [CommonModule, FormsModule, RouterModule],
// // //   templateUrl: './landing.component.html',
// // //   styleUrls: ['./landing.component.scss'],
// // // })
// // // export class LandingComponent implements AfterViewInit, OnDestroy {
// // //   @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;

// // //   scrollY = 0;
// // //   mobileMenuOpen = false;
// // //   activeTab = 'finance'; // For the feature switcher
  
// // //   // Dynamic Stats
// // //   stats = { users: 0, transactions: 0, uptime: 0 };
// // //   private hasAnimatedStats = false;
// // //   private observer: IntersectionObserver | null = null;

// // //   // ---------------------------------------------------------
// // //   // CORE MODULES (Based on your file structure)
// // //   // ---------------------------------------------------------
// // //   modules = [
// // //     {
// // //       id: 'finance',
// // //       label: 'Financial Core',
// // //       title: 'Complete Financial Control',
// // //       desc: 'Manage Invoices, Payments, and EMIs with bank-grade precision.',
// // //       icon: 'pi pi-wallet',
// // //       features: ['GST Compliant Invoicing', 'EMI & Loan Tracking', 'Real-time Ledger']
// // //     },
// // //     {
// // //       id: 'inventory',
// // //       label: 'Inventory & Supply',
// // //       title: 'Multi-Branch Inventory',
// // //       desc: 'Sync stock levels across branches and manage suppliers effortlessly.',
// // //       icon: 'pi pi-box',
// // //       features: ['Branch-wise Stock', 'Supplier Management', 'Low Stock Alerts']
// // //     },
// // //     {
// // //       id: 'ai',
// // //       label: 'Apex AI Agent',
// // //       title: 'Your Intelligent CFO',
// // //       desc: 'Ask questions like "What is my predicted revenue next month?" and get instant answers.',
// // //       icon: 'pi pi-bolt',
// // //       features: ['Natural Language Queries', 'Predictive Analytics', 'Automated Insights']
// // //     }
// // //   ];

// // //   // ---------------------------------------------------------
// // //   // BENTO GRID FEATURES
// // //   // ---------------------------------------------------------
// // //   features = [
// // //     { 
// // //       title: 'AI-Powered Insights', 
// // //       desc: 'Built-in AI Assistant to analyze risk and forecast revenue.', 
// // //       icon: 'ai', 
// // //       cols: 2, 
// // //       color: 'from-violet-500/20 to-fuchsia-500/20',
// // //       border: 'hover:border-violet-500/50'
// // //     },
// // //     { 
// // //       title: 'Branch Management', 
// // //       desc: 'Centralized control for multi-location businesses.', 
// // //       icon: 'branch', 
// // //       cols: 1, 
// // //       color: 'from-cyan-500/20 to-blue-500/20',
// // //       border: 'hover:border-cyan-500/50'
// // //     },
// // //     { 
// // //       title: 'EMI Automation', 
// // //       desc: 'Track loans and automated EMI schedules.', 
// // //       icon: 'emi', 
// // //       cols: 1, 
// // //       color: 'from-emerald-500/20 to-teal-500/20',
// // //       border: 'hover:border-emerald-500/50'
// // //     },
// // //     { 
// // //       title: 'Role-Based Access', 
// // //       desc: 'Granular permissions for Admins, Managers, and Accountants.', 
// // //       icon: 'lock', 
// // //       cols: 2, 
// // //       color: 'from-orange-500/20 to-red-500/20',
// // //       border: 'hover:border-orange-500/50'
// // //     },
// // //   ];

// // //   constructor() {}

// // //   ngAfterViewInit(): void {
// // //     const options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
// // //     this.observer = new IntersectionObserver((entries) => {
// // //       entries.forEach(entry => {
// // //         if (entry.isIntersecting) {
// // //           entry.target.classList.add('in-view');
// // //           this.observer?.unobserve(entry.target);
// // //         }
// // //       });
// // //     }, options);

// // //     this.revealItems.forEach(item => this.observer?.observe(item.nativeElement));
// // //   }

// // //   ngOnDestroy(): void {
// // //     this.observer?.disconnect();
// // //   }

// // //   @HostListener('window:scroll', [])
// // //   onWindowScroll() {
// // //     this.scrollY = window.scrollY;
// // //     this.checkStatsAnimation();
// // //   }

// // //   setActiveTab(tabId: string) {
// // //     this.activeTab = tabId;
// // //   }

// // //   private checkStatsAnimation() {
// // //     if (this.hasAnimatedStats) return;
// // //     const statsSection = document.getElementById('stats-section');
// // //     if (statsSection) {
// // //       const rect = statsSection.getBoundingClientRect();
// // //       if (rect.top < window.innerHeight - 100) {
// // //         this.hasAnimatedStats = true;
// // //         this.runCounter('users', 0, 1200, 2000);
// // //         this.runCounter('transactions', 0, 85, 2000); // 85M
// // //         this.runCounter('uptime', 90, 99.9, 2000);
// // //       }
// // //     }
// // //   }

// // //   private runCounter(key: 'users' | 'transactions' | 'uptime', start: number, end: number, duration: number) {
// // //     let startTime: number | null = null;
// // //     const step = (timestamp: number) => {
// // //       if (!startTime) startTime = timestamp;
// // //       const progress = Math.min((timestamp - startTime) / duration, 1);
// // //       const value = start + (end - start) * (1 - Math.pow(1 - progress, 3)); 
      
// // //       if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
// // //       else this.stats[key] = Math.floor(value);

// // //       if (progress < 1) window.requestAnimationFrame(step);
// // //     };
// // //     window.requestAnimationFrame(step);
// // //   }
// // // }

// // // // import { CommonModule } from '@angular/common';
// // // // import { Component, HostListener, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, OnDestroy } from '@angular/core';
// // // // import { FormsModule } from '@angular/forms';

// // // // interface Feature {
// // // //   title: string;
// // // //   desc: string;
// // // //   icon: string; // We will map string keys to SVGs in HTML
// // // //   cols: number; // For Bento Grid layout (span-1 or span-2)
// // // //   gradient: string;
// // // // }

// // // // interface Plan {
// // // //   name: string;
// // // //   price: string;
// // // //   period: string;
// // // //   desc: string;
// // // //   features: string[];
// // // //   isPopular?: boolean;
// // // //   cta: string;
// // // // }

// // // // @Component({
// // // //   selector: 'app-landing',
// // // //   standalone: true,
// // // //   imports: [CommonModule, FormsModule],
// // // //   templateUrl: './landing.component.html',
// // // //   styleUrls: ['./landing.component.scss'],
// // // // })
// // // // export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  
// // // //   @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;
  
// // // //   scrollY = 0;
// // // //   mobileMenuOpen = false;
// // // //   isYearly = false;
// // // //   activeFaqIndex: number | null = null;
  
// // // //   // Dynamic Stats
// // // //   stats = { users: 0, revenue: 0, uptime: 0 };
// // // //   private hasAnimatedStats = false;
// // // //   private observer: IntersectionObserver | null = null;

// // // //   // ---------------------------------------------------------
// // // //   // DATA: BENTO GRID FEATURES
// // // //   // ---------------------------------------------------------
// // // //   features: Feature[] = [
// // // //     { 
// // // //       title: 'Smart Invoicing', 
// // // //       desc: 'Auto-generate GST compliant invoices with QR codes instantly.', 
// // // //       icon: 'invoice', 
// // // //       cols: 2, // Spans 2 columns
// // // //       gradient: 'from-blue-500/20 to-cyan-500/20' 
// // // //     },
// // // //     { 
// // // //       title: 'Inventory Sync', 
// // // //       desc: 'Real-time stock across warehouses.', 
// // // //       icon: 'box', 
// // // //       cols: 1, 
// // // //       gradient: 'from-emerald-500/20 to-teal-500/20' 
// // // //     },
// // // //     { 
// // // //       title: 'Analytics Core', 
// // // //       desc: 'Predictive financial modeling.', 
// // // //       icon: 'chart', 
// // // //       cols: 1, 
// // // //       gradient: 'from-purple-500/20 to-pink-500/20' 
// // // //     },
// // // //     { 
// // // //       title: 'Team Collaboration', 
// // // //       desc: 'Role-based access control for your chartered accountants and staff.', 
// // // //       icon: 'users', 
// // // //       cols: 2, 
// // // //       gradient: 'from-orange-500/20 to-amber-500/20' 
// // // //     },
// // // //   ];

// // // //   // ---------------------------------------------------------
// // // //   // DATA: PRICING
// // // //   // ---------------------------------------------------------
// // // //   plans: Plan[] = [
// // // //     {
// // // //       name: 'Starter',
// // // //       price: 'Free',
// // // //       period: 'forever',
// // // //       desc: 'For solopreneurs.',
// // // //       features: ['5 Invoices/mo', 'Basic GST Reports', 'Email Support'],
// // // //       cta: 'Start Free'
// // // //     },
// // // //     {
// // // //       name: 'Growth',
// // // //       price: '₹2,499',
// // // //       period: 'per month',
// // // //       desc: 'For scaling startups.',
// // // //       features: ['Unlimited Invoices', 'Inventory Management', 'Priority Support', '3 Team Members'],
// // // //       isPopular: true,
// // // //       cta: 'Get Growth'
// // // //     },
// // // //     {
// // // //       name: 'Scale',
// // // //       price: '₹5,999',
// // // //       period: 'per month',
// // // //       desc: 'For large enterprises.',
// // // //       features: ['Everything in Growth', 'API Access', 'Dedicated Account Manager', 'Custom SLAs'],
// // // //       cta: 'Contact Sales'
// // // //     }
// // // //   ];

// // // //   // ---------------------------------------------------------
// // // //   // DATA: TESTIMONIALS
// // // //   // ---------------------------------------------------------
// // // //   testimonials = [
// // // //     {
// // // //       text: "We switched from Tally and never looked back. The UI is years ahead of the competition.",
// // // //       author: "Rajesh Kumar",
// // // //       role: "CEO, TechNova",
// // // //       img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
// // // //     },
// // // //     {
// // // //       text: "The automated GST filing feature alone saved us hiring a full-time accountant.",
// // // //       author: "Sneha Patel",
// // // //       role: "Founder, UrbanStyle",
// // // //       img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha"
// // // //     },
// // // //     {
// // // //       text: "Incredible uptime and support. Best investment for our logistics chain.",
// // // //       author: "Arjun Singh",
// // // //       role: "Director, FastLogistics",
// // // //       img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun"
// // // //     }
// // // //   ];
// // // //   // Add inside the LandingComponent class

// // // //   // ---------------------------------------------------------
// // // //   // DATA: INTEGRATIONS
// // // //   // ---------------------------------------------------------
// // // //   integrations = [
// // // //     { name: 'Slack', icon: 'slack' },
// // // //     { name: 'Shopify', icon: 'shopify' },
// // // //     { name: 'Razorpay', icon: 'razorpay' },
// // // //     { name: 'Zoho', icon: 'zoho' },
// // // //     { name: 'Gmail', icon: 'gmail' },
// // // //     { name: 'Excel', icon: 'excel' }
// // // //   ];

// // // //   // ---------------------------------------------------------
// // // //   // DATA: FAQ
// // // //   // ---------------------------------------------------------
// // // //   faqs = [
// // // //     { 
// // // //       q: 'Is my data secure?', 
// // // //       a: 'Absolutely. We use bank-grade AES-256 encryption and are SOC-2 Type II certified. Your data is backed up hourly to multiple distinct availability zones.' 
// // // //     },
// // // //     { 
// // // //       q: 'Can I migrate from Tally?', 
// // // //       a: 'Yes. We offer a one-click migration tool that imports your XML data from Tally directly into Apex Infinity. All your ledgers and history will be preserved.' 
// // // //     },
// // // //     { 
// // // //       q: 'Do you support e-Invoicing?', 
// // // //       a: 'Yes, we have a direct GSP (GST Suvidha Provider) license. You can generate IRN and QR codes instantly without leaving the dashboard.' 
// // // //     },
// // // //     { 
// // // //       q: 'What happens after the trial?', 
// // // //       a: 'You can choose to upgrade to a paid plan or continue on the "Starter" free tier forever. We will never delete your data without notice.' 
// // // //     }
// // // //   ];
// // // //   activeTestimonial = 0;

// // // //   // CTA
// // // //   emailInput = '';
// // // //   isSubmitting = false;
// // // //   isSuccess = false;

// // // //   constructor() {}

// // // //   ngOnInit(): void {}

// // // //   ngAfterViewInit(): void {
// // // //     // Setup Intersection Observer for "reveal on scroll"
// // // //     const options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
// // // //     this.observer = new IntersectionObserver((entries) => {
// // // //       entries.forEach(entry => {
// // // //         if (entry.isIntersecting) {
// // // //           entry.target.classList.add('in-view');
// // // //           this.observer?.unobserve(entry.target);
// // // //         }
// // // //       });
// // // //     }, options);

// // // //     this.revealItems.forEach(item => this.observer?.observe(item.nativeElement));
// // // //   }

// // // //   ngOnDestroy(): void {
// // // //     this.observer?.disconnect();
// // // //   }

// // // //   @HostListener('window:scroll', [])
// // // //   onWindowScroll() {
// // // //     this.scrollY = window.scrollY;
// // // //     this.checkStatsAnimation();
// // // //   }

// // // //   toggleYearly() {
// // // //     this.isYearly = !this.isYearly;
// // // //   }

// // // //   toggleFaq(index: number) {
// // // //     this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
// // // //   }

// // // //   submitForm() {
// // // //     if(!this.emailInput) return;
// // // //     this.isSubmitting = true;
// // // //     setTimeout(() => {
// // // //       this.isSubmitting = false;
// // // //       this.isSuccess = true;
// // // //       this.emailInput = '';
// // // //     }, 1500);
// // // //   }

// // // //   private checkStatsAnimation() {
// // // //     if (this.hasAnimatedStats) return;
// // // //     const statsSection = document.getElementById('stats-section');
// // // //     if (statsSection) {
// // // //       const rect = statsSection.getBoundingClientRect();
// // // //       if (rect.top < window.innerHeight - 100) {
// // // //         this.hasAnimatedStats = true;
// // // //         this.runCounter('users', 0, 15000, 2000);
// // // //         this.runCounter('revenue', 0, 45, 2000); // 45M
// // // //         this.runCounter('uptime', 90, 99.9, 2000);
// // // //       }
// // // //     }
// // // //   }

// // // //   private runCounter(key: 'users' | 'revenue' | 'uptime', start: number, end: number, duration: number) {
// // // //     let startTime: number | null = null;
// // // //     const step = (timestamp: number) => {
// // // //       if (!startTime) startTime = timestamp;
// // // //       const progress = Math.min((timestamp - startTime) / duration, 1);
// // // //       const value = start + (end - start) * (1 - Math.pow(1 - progress, 3)); // Cubic ease out
      
// // // //       if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
// // // //       else this.stats[key] = Math.floor(value);

// // // //       if (progress < 1) window.requestAnimationFrame(step);
// // // //     };
// // // //     window.requestAnimationFrame(step);
// // // //   }
// // // // }
