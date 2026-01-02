import { Component, OnInit, HostListener, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CountUpModule } from 'ngx-countup';

interface Feature {
  title: string;
  desc: string;
  group: string;
  icon: string;
  tags?: string;
}

interface Plan {
  name: string;
  price: string;
  desc: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
}

interface NavItem {
  label: string;
  href: string;
}

interface Stat {
  label: string;
  value: number;
  suffix: string;
}

interface DashboardMetric {
  title: string;
  value: string;
  icon: string;
  color: string;
  change: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, CountUpModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LandingComponent implements OnInit {
  // State
  showMobileMenu = false;
  activeCategory = 'all';
  scrollY = 0;
  isYearly = signal(true);
  
  // Data
  navItems: NavItem[] = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Customers', href: '#customers' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Docs', href: 'https://docs.apexinfinity.ai' },
  ];
  
  stats: Stat[] = [
    { label: 'Active Businesses', value: 5000, suffix: '+' },
    { label: 'Processed Invoices', value: 2500000, suffix: '+' },
    { label: 'Avg. Revenue Growth', value: 32, suffix: '%' },
    { label: 'Uptime', value: 99.9, suffix: '%' }
  ];
  
  categories = ['Analytics', 'Finance', 'Inventory', 'CRM', 'Communication', 'System'];
  
  features: Feature[] = [
    {
      title: 'AI-Powered Forecasting',
      desc: 'Predict revenue trends and customer behavior with machine learning algorithms.',
      group: 'Analytics',
      icon: 'fas fa-brain',
      tags: 'predictive machine-learning forecasting'
    },
    {
      title: 'Real-Time Inventory Sync',
      desc: 'Track inventory across all locations with automatic reorder points.',
      group: 'Inventory',
      icon: 'fas fa-boxes',
      tags: 'inventory tracking automation'
    },
    {
      title: 'Smart Financial Dashboard',
      desc: 'Monitor cash flow, P&L, and financial health in one unified view.',
      group: 'Finance',
      icon: 'fas fa-chart-line',
      tags: 'finance cash-flow analytics'
    },
    {
      title: 'Team Collaboration Hub',
      desc: 'Built-in chat, task management, and file sharing for your team.',
      group: 'Communication',
      icon: 'fas fa-comments',
      tags: 'chat collaboration team'
    },
    {
      title: 'Automated GST Reports',
      desc: 'Generate compliant GST reports automatically every month.',
      group: 'Finance',
      icon: 'fas fa-file-invoice',
      tags: 'tax compliance gst'
    },
    {
      title: 'Customer 360° View',
      desc: 'Complete customer profile with purchase history and interactions.',
      group: 'CRM',
      icon: 'fas fa-users',
      tags: 'crm customer-profile analytics'
    },
    {
      title: 'Role-Based Access Control',
      desc: 'Granular permissions and access controls for security.',
      group: 'System',
      icon: 'fas fa-shield-alt',
      tags: 'security rbac permissions'
    },
    {
      title: 'API & Webhook Support',
      desc: 'Connect with other tools and build custom integrations.',
      group: 'System',
      icon: 'fas fa-plug',
      tags: 'api integration webhooks'
    },
    {
      title: 'Mobile App',
      desc: 'Full-featured mobile app for iOS and Android.',
      group: 'System',
      icon: 'fas fa-mobile-alt',
      tags: 'mobile ios android'
    }
  ];
  
  dashboardMetrics: DashboardMetric[] = [
    { title: 'Monthly Revenue', value: '₹4.2M', icon: 'fas fa-rupee-sign', color: 'green-400', change: '+12.5%' },
    { title: 'Active Customers', value: '2,842', icon: 'fas fa-users', color: 'blue-400', change: '+8.2%' },
    { title: 'Inventory Value', value: '₹8.7M', icon: 'fas fa-box', color: 'purple-400', change: '+5.4%' }
  ];
  
  chartData = [
    { height: '60%', gradient: 'linear-gradient(to top, #6366f1, #818cf8)', label: 'Mon' },
    { height: '75%', gradient: 'linear-gradient(to top, #6366f1, #818cf8)', label: 'Tue' },
    { height: '90%', gradient: 'linear-gradient(to top, #8b5cf6, #a78bfa)', label: 'Wed' },
    { height: '85%', gradient: 'linear-gradient(to top, #6366f1, #818cf8)', label: 'Thu' },
    { height: '95%', gradient: 'linear-gradient(to top, #06b6d4, #22d3ee)', label: 'Fri' },
    { height: '80%', gradient: 'linear-gradient(to top, #6366f1, #818cf8)', label: 'Sat' },
    { height: '70%', gradient: 'linear-gradient(to top, #6366f1, #818cf8)', label: 'Sun' }
  ];
  
  integrations = [
    { name: 'Razorpay', icon: 'fas fa-credit-card', type: 'Payment' },
    { name: 'Google Workspace', icon: 'fab fa-google', type: 'Productivity' },
    { name: 'Slack', icon: 'fab fa-slack', type: 'Communication' },
    { name: 'Shopify', icon: 'fas fa-store', type: 'E-commerce' },
    { name: 'WhatsApp', icon: 'fab fa-whatsapp', type: 'Messaging' },
    { name: 'QuickBooks', icon: 'fas fa-book', type: 'Accounting' },
    { name: 'Zapier', icon: 'fas fa-bolt', type: 'Automation' },
    { name: 'Mailchimp', icon: 'fas fa-envelope', type: 'Marketing' },
    { name: 'GitHub', icon: 'fab fa-github', type: 'Development' },
    { name: 'Dropbox', icon: 'fab fa-dropbox', type: 'Storage' },
    { name: 'Salesforce', icon: 'fas fa-cloud', type: 'CRM' },
    { name: 'Zoom', icon: 'fas fa-video', type: 'Video' }
  ];
  
  plans: Plan[] = [
    {
      name: 'Starter',
      price: 'Free',
      desc: 'Perfect for small businesses getting started',
      features: [
        'Up to 5 users',
        '100 invoices/month',
        'Basic analytics',
        'Email support',
        'Mobile app access'
      ],
      cta: 'Get Started'
    },
    {
      name: 'Growth',
      price: '₹2,499',
      desc: 'For growing businesses that need more power',
      features: [
        'Up to 25 users',
        'Unlimited invoices',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Custom reports'
      ],
      isPopular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'For large organizations with complex needs',
      features: [
        'Unlimited users',
        'Custom modules',
        'Dedicated support',
        'SLA guarantees',
        'On-premise deployment',
        'Custom integrations'
      ],
      cta: 'Contact Sales'
    }
  ];
  
  footerLinks = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'API Docs', href: '#' },
        { label: 'Changelog', href: '#' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Contact', href: '#' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'GDPR', href: '#' }
      ]
    }
  ];
  
  // Computed
  filteredFeatures = computed(() => {
    if (this.activeCategory === 'all') {
      return this.features;
    }
    return this.features.filter(f => f.group === this.activeCategory);
  });
  
  ngOnInit() {
    this.initAnimations();
  }
  
  @HostListener('window:scroll', ['$event'])
  onScroll() {
    this.scrollY = window.scrollY;
    const nav = document.querySelector('.glass-nav');
    if (this.scrollY > 50) {
      nav?.classList.add('scrolled');
    } else {
      nav?.classList.remove('scrolled');
    }
  }
  
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }
  
  setActiveCategory(category: string) {
    this.activeCategory = category;
    // Smooth scroll to features
    if (category !== 'all') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  playDemo() {
    // Implement demo video play
    console.log('Playing demo video');
  }
  
  scheduleDemo() {
    // Implement demo scheduling
    console.log('Scheduling demo');
  }
  
  private initAnimations() {
    // Initialize any animation observers
    this.initializeIntersectionObserver();
  }
  
  private initializeIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, { threshold: 0.1 });
    
    // Observe all elements with animation classes
    document.querySelectorAll('.feature-card, .metric-card, .pricing-card').forEach(el => {
      observer.observe(el);
    });
  }
}
// import {
//   Component,
//   ElementRef,
//   AfterViewInit,
//   OnDestroy,
//   HostListener,
//   signal,
//   computed,
//   Inject,
//   PLATFORM_ID,
//   ViewChildren,
//   QueryList,
//   inject,
//   ViewEncapsulation,
//   ChangeDetectionStrategy,
//   ChangeDetectorRef
// } from '@angular/core';
// import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterModule } from '@angular/router';
// import { ThemeService } from '../core/services/theme.service';

// interface Feature {
//   title: string;
//   desc: string;
//   group: string;
//   icon: string;
//   tags?: string;
// }

// interface Plan {
//   name: string;
//   price: string;
//   desc: string;
//   features: string[];
//   isPopular?: boolean;
//   cta: string;
// }

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterModule],
//   templateUrl: './landing.component.html',
//   styleUrls: ['./landing.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   encapsulation: ViewEncapsulation.None
// })
// export class LandingComponent implements AfterViewInit, OnDestroy {
  
//   private themeService = inject(ThemeService);
//   private cdr = inject(ChangeDetectorRef);
//   private observer: IntersectionObserver | null = null;
//   @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;

//   // --- STATE ---
//   scrollY = 0;
//   isYearly = signal(true); 
//   emailInput = '';
//   isSubmitting = false;
//   isSuccess = false;
  
//   // Stats Animation State
//   stats = { users: 0, revenue: 0, uptime: 0 };
//   private hasAnimatedStats = false;

//   // --- SIGNALS ---
//   searchQuery = signal('');
//   selectedCategory = signal('All');

//   // Available Themes
//   availableThemes = [
//     { name: 'Glass', class: 'theme-glass' },
//     { name: 'Light', class: 'theme-light' },
//     { name: 'Dark', class: 'theme-dark' },
//     { name: 'Titanium', class: 'theme-titanium' },
//     { name: 'Ocean', class: 'theme-ocean' }
//   ];
  
//   // --- DATA: FEATURES ---
//   features: Feature[] = [
//     { title: "Executive Dashboard", desc: "High-level strategic insights & KPI monitoring.", group: "Analytics", icon: "pi-th-large", tags: "view_executive" },
//     { title: "Branch Comparison", desc: "Benchmark performance across multiple locations.", group: "Analytics", icon: "pi-arrow-right-arrow-left", tags: "view_branch_comparison" },
//     { title: "AI Revenue Forecast", desc: "Predict sales & revenue using AI models.", group: "Analytics", icon: "pi-chart-line", tags: "view_forecast" },
//     { title: "Critical Alerts", desc: "Real-time risk & stock-out notifications.", group: "Analytics", icon: "pi-exclamation-triangle", tags: "view_alerts" },
//     { title: "Financial Summary", desc: "P&L, Revenue, and Expense overview.", group: "Analytics", icon: "pi-chart-pie", tags: "view_financial" },
//     { title: "Cash Flow Analysis", desc: "Track cash movement & payment modes.", group: "Analytics", icon: "pi-money-bill", tags: "view_cashflow" },
//     { title: "GST & Tax Reports", desc: "Input/Output tax analysis for compliance.", group: "Analytics", icon: "pi-file", tags: "view_tax" },
//     { title: "Debtor Aging", desc: "0-90+ days outstanding payment analysis.", group: "Analytics", icon: "pi-hourglass", tags: "view_debtor_aging" },
//     { title: "Profitability Matrix", desc: "Real Gross Profit & Margin tracking.", group: "Analytics", icon: "pi-percentage", tags: "view_profitability" },
//     { title: "Staff Leaderboard", desc: "Employee performance tracking & KPIs.", group: "Analytics", icon: "pi-star", tags: "view_staff_performance" },
//     { title: "Peak Hour Heatmap", desc: "Visualize busiest times & days.", group: "Analytics", icon: "pi-clock", tags: "view_peak_hours" },
//     { title: "Dead Stock Detector", desc: "Identify items non-moving > 90 days.", group: "Analytics", icon: "pi-box", tags: "view_dead_stock" },
//     { title: "Stock-out Prediction", desc: "AI run-rate analysis for restocking.", group: "Analytics", icon: "pi-bolt", tags: "view_stock_forecast" },
//     { title: "RFM Segmentation", desc: "Segment by Recency, Frequency, Money.", group: "Analytics", icon: "pi-users", tags: "view_customer_segmentation" },
//     { title: "Cohort Retention", desc: "Analyze customer loyalty over time.", group: "Analytics", icon: "pi-heart", tags: "view_customer_retention" },
//     { title: "Credit Limits", desc: "Set & manage customer credit limits.", group: "CRM", icon: "pi-credit-card", tags: "customer:credit_limit" },
//     { title: "Purchase Orders", desc: "Manage supplier purchasing lifecyle.", group: "Inventory", icon: "pi-shopping-cart", tags: "purchase:read create update delete" },
//     { title: "Invoice Engine", desc: "Create, Edit & Delete Invoices.", group: "Sales", icon: "pi-file-edit", tags: "invoice:read create update delete" },
//     { title: "EMI Management", desc: "Create EMI plans & collect payments.", group: "Finance", icon: "pi-calendar", tags: "emi:read create pay" },
//     { title: "RBAC Controls", desc: "Manage roles & granular permissions.", group: "System", icon: "pi-lock", tags: "role:manage" },
//     { title: "Audit Logs", desc: "View security logs & suspicious activity.", group: "System", icon: "pi-shield", tags: "logs:view analytics:view_security_audit" },
//     { title: "AI Assistant", desc: "Chat with your data using AI.", group: "Utilities", icon: "pi-android", tags: "ai:chat" },
//     { title: "Team Chat", desc: "Real-time messaging with channels & DMs.", group: "Communication", icon: "pi-comments", tags: "chat:read create" },
//     { title: "Broadcast Messages", desc: "Send announcements to entire teams instantly.", group: "Communication", icon: "pi-megaphone", tags: "broadcast:create send" },
//     { title: "File Sharing", desc: "Share documents & media in conversations.", group: "Communication", icon: "pi-paperclip", tags: "chat:attach" },
//     { title: "Notification Center", desc: "Centralized alerts for all activities.", group: "Communication", icon: "pi-bell", tags: "notifications:view" }
//   ];

//   // --- DATA: PLANS ---
//   plans: Plan[] = [
//     {
//       name: 'Starter',
//       price: 'Free',
//       desc: 'For solopreneurs just starting.',
//       features: ['5 Invoices/mo', 'Basic GST Reports', 'Email Support'],
//       cta: 'Start Free'
//     },
//     {
//       name: 'Growth',
//       price: '₹2,499',
//       desc: 'For scaling startups who value time.',
//       features: ['Unlimited Invoices', 'Inventory Sync', 'Priority Support', '3 Team Members'],
//       isPopular: true,
//       cta: 'Get Growth'
//     },
//     {
//       name: 'Scale',
//       price: '₹5,999',
//       desc: 'For established enterprises.',
//       features: ['Everything in Growth', 'API Access', 'Dedicated Account Manager', 'Custom SLAs'],
//       cta: 'Contact Sales'
//     }
//   ];

//   // --- COMPUTED ---
//   categories = computed(() => ['All', ...new Set(this.features.map(f => f.group))]);
  
//   filteredFeatures = computed(() => {
//     const q = this.searchQuery().toLowerCase().trim();
//     const group = this.selectedCategory();

//     return this.features.filter(f => {
//       const matchesGroup = group === 'All' || f.group === group;
      
//       const title = f.title ? f.title.toLowerCase() : '';
//       const desc = f.desc ? f.desc.toLowerCase() : '';
//       const tags = f.tags ? f.tags.toLowerCase() : '';

//       const matchesSearch = !q || title.includes(q) || desc.includes(q) || tags.includes(q);
      
//       return matchesGroup && matchesSearch;
//     });
//   });

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

//   ngAfterViewInit() {
//     if (isPlatformBrowser(this.platformId)) {
//       setTimeout(() => this.initIntersectionObserver(), 100);
//       this.runCounter('revenue', 0, 45, 2000);
//       this.runCounter('users', 0, 15000, 2000);
//     }
//   }

//   ngOnDestroy() {
//     this.observer?.disconnect();
//   }

//   @HostListener('window:scroll', [])
//   onWindowScroll() {
//     this.scrollY = window.scrollY;
//     this.checkStatsAnimation();
//   }

//   setCategory(cat: string) {
//     this.selectedCategory.set(cat);
//   }

//   togglePricing() {
//     this.isYearly.update(v => !v);
//   }

//   selectTheme(themeClass: string) {
//     this.themeService.setLightTheme(themeClass);
//   }

//   private initIntersectionObserver() {
//     const options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
//     this.observer = new IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add('active');
//           this.cdr.markForCheck(); // Ensure change detection runs
//           this.observer?.unobserve(entry.target);
//         }
//       });
//     }, options);

//     this.revealItems.forEach(item => this.observer?.observe(item.nativeElement));
//   }

//   private checkStatsAnimation() {
//     if (this.hasAnimatedStats) return;
//     if (this.scrollY > 300) {
//       this.hasAnimatedStats = true;
//       this.runCounter('uptime', 90, 99.9, 2000);
//     }
//   }

//   private runCounter(key: 'users' | 'revenue' | 'uptime', start: number, end: number, duration: number) {
//     let startTime: number | null = null;
//     const step = (timestamp: number) => {
//       if (!startTime) startTime = timestamp;
//       const progress = Math.min((timestamp - startTime) / duration, 1);
//       const value = start + (end - start) * (1 - Math.pow(1 - progress, 3)); 
      
//       if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
//       else this.stats[key] = Math.floor(value);
      
//       this.cdr.markForCheck(); // Trigger update for async change

//       if (progress < 1) window.requestAnimationFrame(step);
//     };
//     window.requestAnimationFrame(step);
//   }
// }
