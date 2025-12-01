import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Feature {
  title: string;
  desc: string;
  icon: string; // We will map string keys to SVGs in HTML
  cols: number; // For Bento Grid layout (span-1 or span-2)
  gradient: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  isPopular?: boolean;
  cta: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  
  @ViewChildren('revealItem') revealItems!: QueryList<ElementRef>;
  
  scrollY = 0;
  mobileMenuOpen = false;
  isYearly = false;
  activeFaqIndex: number | null = null;
  
  // Dynamic Stats
  stats = { users: 0, revenue: 0, uptime: 0 };
  private hasAnimatedStats = false;
  private observer: IntersectionObserver | null = null;

  // ---------------------------------------------------------
  // DATA: BENTO GRID FEATURES
  // ---------------------------------------------------------
  features: Feature[] = [
    { 
      title: 'Smart Invoicing', 
      desc: 'Auto-generate GST compliant invoices with QR codes instantly.', 
      icon: 'invoice', 
      cols: 2, // Spans 2 columns
      gradient: 'from-blue-500/20 to-cyan-500/20' 
    },
    { 
      title: 'Inventory Sync', 
      desc: 'Real-time stock across warehouses.', 
      icon: 'box', 
      cols: 1, 
      gradient: 'from-emerald-500/20 to-teal-500/20' 
    },
    { 
      title: 'Analytics Core', 
      desc: 'Predictive financial modeling.', 
      icon: 'chart', 
      cols: 1, 
      gradient: 'from-purple-500/20 to-pink-500/20' 
    },
    { 
      title: 'Team Collaboration', 
      desc: 'Role-based access control for your chartered accountants and staff.', 
      icon: 'users', 
      cols: 2, 
      gradient: 'from-orange-500/20 to-amber-500/20' 
    },
  ];

  // ---------------------------------------------------------
  // DATA: PRICING
  // ---------------------------------------------------------
  plans: Plan[] = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      desc: 'For solopreneurs.',
      features: ['5 Invoices/mo', 'Basic GST Reports', 'Email Support'],
      cta: 'Start Free'
    },
    {
      name: 'Growth',
      price: '₹2,499',
      period: 'per month',
      desc: 'For scaling startups.',
      features: ['Unlimited Invoices', 'Inventory Management', 'Priority Support', '3 Team Members'],
      isPopular: true,
      cta: 'Get Growth'
    },
    {
      name: 'Scale',
      price: '₹5,999',
      period: 'per month',
      desc: 'For large enterprises.',
      features: ['Everything in Growth', 'API Access', 'Dedicated Account Manager', 'Custom SLAs'],
      cta: 'Contact Sales'
    }
  ];

  // ---------------------------------------------------------
  // DATA: TESTIMONIALS
  // ---------------------------------------------------------
  testimonials = [
    {
      text: "We switched from Tally and never looked back. The UI is years ahead of the competition.",
      author: "Rajesh Kumar",
      role: "CEO, TechNova",
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh"
    },
    {
      text: "The automated GST filing feature alone saved us hiring a full-time accountant.",
      author: "Sneha Patel",
      role: "Founder, UrbanStyle",
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha"
    },
    {
      text: "Incredible uptime and support. Best investment for our logistics chain.",
      author: "Arjun Singh",
      role: "Director, FastLogistics",
      img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun"
    }
  ];
  // Add inside the LandingComponent class

  // ---------------------------------------------------------
  // DATA: INTEGRATIONS
  // ---------------------------------------------------------
  integrations = [
    { name: 'Slack', icon: 'slack' },
    { name: 'Shopify', icon: 'shopify' },
    { name: 'Razorpay', icon: 'razorpay' },
    { name: 'Zoho', icon: 'zoho' },
    { name: 'Gmail', icon: 'gmail' },
    { name: 'Excel', icon: 'excel' }
  ];

  // ---------------------------------------------------------
  // DATA: FAQ
  // ---------------------------------------------------------
  faqs = [
    { 
      q: 'Is my data secure?', 
      a: 'Absolutely. We use bank-grade AES-256 encryption and are SOC-2 Type II certified. Your data is backed up hourly to multiple distinct availability zones.' 
    },
    { 
      q: 'Can I migrate from Tally?', 
      a: 'Yes. We offer a one-click migration tool that imports your XML data from Tally directly into Apex Infinity. All your ledgers and history will be preserved.' 
    },
    { 
      q: 'Do you support e-Invoicing?', 
      a: 'Yes, we have a direct GSP (GST Suvidha Provider) license. You can generate IRN and QR codes instantly without leaving the dashboard.' 
    },
    { 
      q: 'What happens after the trial?', 
      a: 'You can choose to upgrade to a paid plan or continue on the "Starter" free tier forever. We will never delete your data without notice.' 
    }
  ];
  activeTestimonial = 0;

  // CTA
  emailInput = '';
  isSubmitting = false;
  isSuccess = false;

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Setup Intersection Observer for "reveal on scroll"
    const options = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          this.observer?.unobserve(entry.target);
        }
      });
    }, options);

    this.revealItems.forEach(item => this.observer?.observe(item.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollY = window.scrollY;
    this.checkStatsAnimation();
  }

  toggleYearly() {
    this.isYearly = !this.isYearly;
  }

  toggleFaq(index: number) {
    this.activeFaqIndex = this.activeFaqIndex === index ? null : index;
  }

  submitForm() {
    if(!this.emailInput) return;
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSuccess = true;
      this.emailInput = '';
    }, 1500);
  }

  private checkStatsAnimation() {
    if (this.hasAnimatedStats) return;
    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      const rect = statsSection.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        this.hasAnimatedStats = true;
        this.runCounter('users', 0, 15000, 2000);
        this.runCounter('revenue', 0, 45, 2000); // 45M
        this.runCounter('uptime', 90, 99.9, 2000);
      }
    }
  }

  private runCounter(key: 'users' | 'revenue' | 'uptime', start: number, end: number, duration: number) {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const value = start + (end - start) * (1 - Math.pow(1 - progress, 3)); // Cubic ease out
      
      if (key === 'uptime') this.stats[key] = parseFloat(value.toFixed(1));
      else this.stats[key] = Math.floor(value);

      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
}

// import { CommonModule, isPlatformBrowser, DecimalPipe, ViewportScroller } from '@angular/common';
// import { Component, HostListener, Inject, PLATFORM_ID, AfterViewInit, ElementRef, ViewChildren, QueryList, signal, computed, effect } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// interface FAQ {
//   question: string;
//   answer: string;
// }

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [CommonModule, FormsModule, DecimalPipe],
//   template: `
//     <style>
//       @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;700;800&display=swap');
//     </style>

//     <div class="relative min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-900 font-sans">
      
//       <div class="fixed inset-0 z-0 pointer-events-none">
//         <div class="absolute inset-0 opacity-[0.04] mix-blend-overlay" 
//              style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');">
//         </div>
        
//         <div class="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-blob"></div>
//         <div class="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] bg-cyan-300/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-2000"></div>
//         <div class="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] bg-indigo-300/20 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000"></div>

//         <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
//       </div>

//       <nav class="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500"
//            [class.translate-y-[-10px]]="scrollSignal() > 0 && !scrollSignal()"> <div class="w-full max-w-5xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
//              [ngClass]="{
//                'bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-slate-200/20 rounded-2xl py-3 px-6': isScrolled(),
//                'bg-transparent py-4 px-0': !isScrolled()
//              }">
//           <div class="flex items-center justify-between">
//             <div class="flex items-center gap-2 cursor-pointer group" (click)="scrollToTop()">
//               <div class="relative w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold font-display text-sm shadow-xl group-hover:scale-105 transition-transform">
//                 AT
//                 <div class="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-lg"></div>
//               </div>
//               <span class="font-display font-bold text-xl tracking-tight text-slate-900">
//                 Apex<span class="text-blue-600">Infinity</span>
//               </span>
//             </div>

//             <div class="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-white/50">
//               @for (link of navLinks; track link) {
//                 <button (click)="scrollToSection(link.id)" 
//                         class="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all duration-300">
//                   {{ link.label }}
//                 </button>
//               }
//             </div>

//             <div class="flex items-center gap-3">
//               <button class="hidden md:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Log in</button>
//               <button class="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-lg shadow-slate-900/20 hover:bg-blue-600 hover:scale-105 transition-all duration-300 active:scale-95">
//                 Start Free
//               </button>
//               <button class="md:hidden p-2 text-slate-600" (click)="toggleMobileMenu()">
//                 <span class="text-xl leading-none">{{ mobileMenuOpen() ? '✕' : '☰' }}</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       @if (mobileMenuOpen()) {
//         <div class="fixed inset-0 z-40 bg-white/95 backdrop-blur-3xl pt-24 px-6 animate-fade-in">
//           <div class="flex flex-col gap-6 text-center">
//             @for (link of navLinks; track link) {
//               <button (click)="scrollToSection(link.id); toggleMobileMenu()" class="text-2xl font-display font-bold text-slate-800">{{ link.label }}</button>
//             }
//             <div class="w-full h-px bg-slate-100 my-2"></div>
//             <button class="w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-bold text-lg">Log In</button>
//             <button class="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30">Get Started</button>
//           </div>
//         </div>
//       }

//       <main class="relative z-10">
//         <section class="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
//           <div class="max-w-4xl mx-auto text-center">
            
//             <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200/60 bg-white/60 backdrop-blur-md shadow-sm mb-8 animate-fade-in-up hover:border-blue-300 transition-colors cursor-default">
//               <span class="relative flex h-2 w-2">
//                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
//                 <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
//               </span>
//               <span class="text-xs font-semibold text-slate-600 tracking-wide uppercase">v2.0 Now Available</span>
//             </div>

//             <h1 class="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 leading-[0.95] mb-8 animate-fade-in-up animation-delay-100">
//               Accounting for <br />
//               <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 animate-gradient">
//                 Visionaries.
//               </span>
//             </h1>

//             <p class="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up animation-delay-200">
//               Stop fighting with spreadsheets. ApexInfinity is the AI-powered financial OS built for modern teams who demand speed and precision.
//             </p>

//             <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
//               <button class="group relative px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-2xl shadow-slate-900/30 hover:bg-blue-600 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
//                 <span class="relative z-10 flex items-center gap-2">
//                   Start Free Trial <span class="group-hover:translate-x-1 transition-transform">→</span>
//                 </span>
//                 <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
//               </button>

//               <button class="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300">
//                 Live Demo
//               </button>
//             </div>

//             <div class="mt-20 relative mx-auto max-w-5xl perspective-1000 animate-fade-in-up animation-delay-500">
//               <div class="relative rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-xl p-2 shadow-2xl shadow-indigo-500/10 transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out">
//                 <div class="aspect-[16/9] rounded-xl bg-slate-50 overflow-hidden border border-slate-100 relative">
//                    <div class="absolute top-0 left-0 w-64 h-full border-r border-slate-200 bg-white p-6 space-y-4 hidden md:block">
//                       <div class="h-8 w-24 bg-slate-100 rounded-lg"></div>
//                       <div class="space-y-3 pt-6">
//                          <div class="h-4 w-full bg-blue-50/50 rounded"></div>
//                          <div class="h-4 w-3/4 bg-slate-50 rounded"></div>
//                          <div class="h-4 w-5/6 bg-slate-50 rounded"></div>
//                       </div>
//                    </div>
//                    <div class="absolute top-8 md:left-72 left-8 right-8">
//                       <div class="flex gap-4 mb-8">
//                          <div class="h-24 w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//                             <div class="h-8 w-8 rounded-full bg-blue-100 mb-2"></div>
//                             <div class="h-4 w-16 bg-slate-100 rounded"></div>
//                          </div>
//                          <div class="h-24 w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//                             <div class="h-8 w-8 rounded-full bg-emerald-100 mb-2"></div>
//                             <div class="h-4 w-16 bg-slate-100 rounded"></div>
//                          </div>
//                          <div class="h-24 w-1/3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//                             <div class="h-8 w-8 rounded-full bg-purple-100 mb-2"></div>
//                             <div class="h-4 w-16 bg-slate-100 rounded"></div>
//                          </div>
//                       </div>
//                       <div class="h-48 w-full bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-100 shadow-sm"></div>
//                    </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section #counterSection class="reveal-section py-10 border-y border-slate-200/60 bg-white/40 backdrop-blur-sm">
//           <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
//             <div class="text-center">
//                <div class="font-display text-4xl font-bold text-slate-900 mb-1">{{ usersCount() | number: '1.0-0' }}+</div>
//                <div class="text-xs font-semibold uppercase tracking-widest text-slate-500">Users</div>
//             </div>
//             <div class="text-center">
//                <div class="font-display text-4xl font-bold text-slate-900 mb-1">{{ uptimeCount() | number: '1.1-1' }}%</div>
//                <div class="text-xs font-semibold uppercase tracking-widest text-slate-500">Uptime</div>
//             </div>
//             <div class="text-center">
//                <div class="font-display text-4xl font-bold text-slate-900 mb-1">₹{{ revenueCount() | number: '1.0-0' }}M</div>
//                <div class="text-xs font-semibold uppercase tracking-widest text-slate-500">Processed</div>
//             </div>
//             <div class="text-center">
//                <div class="font-display text-4xl font-bold text-slate-900 mb-1">{{ ratingCount() | number: '1.1-1' }}</div>
//                <div class="text-xs font-semibold uppercase tracking-widest text-slate-500">Rating</div>
//             </div>
//           </div>
//         </section>

//         <section id="features" class="reveal-section py-32 px-6">
//           <div class="max-w-7xl mx-auto">
//             <div class="text-center mb-20">
//               <h2 class="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-6">Built for speed.</h2>
//               <p class="text-xl text-slate-500 max-w-2xl mx-auto">Everything you need to manage your finances, designed with obsession.</p>
//             </div>

//             <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
//               @for (feature of features; track feature.title; let i = $index) {
//                 <div class="group relative p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1"
//                      [class.md:col-span-2]="i === 0"> <div class="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

//                   <div class="relative z-10 h-full flex flex-col justify-between">
//                     <div>
//                       <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {{feature.gradient}} flex items-center justify-center text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500 text-white">
//                         {{ feature.icon }}
//                       </div>
//                       <h3 class="font-display text-2xl font-bold text-slate-900 mb-3">{{ feature.title }}</h3>
//                       <p class="text-slate-500 leading-relaxed">{{ feature.description }}</p>
//                     </div>
                    
//                     <div class="mt-8 flex gap-2 flex-wrap">
//                        @for(tag of feature.points; track tag) {
//                          <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">{{ tag }}</span>
//                        }
//                     </div>
//                   </div>
//                 </div>
//               }
//             </div>
//           </div>
//         </section>

//         <section class="reveal-section py-24 px-6 relative">
//           <div class="max-w-5xl mx-auto">
//              <div class="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
//                 <div class="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-cyan-200"></div>
                
//                 @for (step of steps; track step.title; let i = $index) {
//                   <div class="relative text-center group">
//                      <div class="w-24 h-24 mx-auto rounded-3xl bg-white border border-slate-100 shadow-xl flex items-center justify-center relative z-10 mb-6 group-hover:scale-110 transition-transform duration-300">
//                         <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-900 font-bold font-display text-xl flex items-center justify-center border border-slate-200">
//                           {{ i + 1 }}
//                         </div>
//                      </div>
//                      <h3 class="font-display text-xl font-bold text-slate-900 mb-2">{{ step.title }}</h3>
//                      <p class="text-sm text-slate-500">{{ step.desc }}</p>
//                   </div>
//                 }
//              </div>
//           </div>
//         </section>

//         <section id="pricing" class="reveal-section py-32 px-6 bg-white border-y border-slate-100">
//            <div class="max-w-7xl mx-auto">
//               <div class="text-center mb-16">
//                  <h2 class="font-display text-4xl font-bold text-slate-900 mb-6">Simple pricing</h2>
//                  <div class="inline-flex items-center gap-4 bg-slate-100 p-1.5 rounded-full border border-slate-200">
//                     <button (click)="isYearly.set(false)" class="px-6 py-2 rounded-full text-sm font-semibold transition-all" [ngClass]="!isYearly() ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'">Monthly</button>
//                     <button (click)="isYearly.set(true)" class="px-6 py-2 rounded-full text-sm font-semibold transition-all" [ngClass]="isYearly() ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'">Yearly <span class="text-emerald-600 text-xs">-20%</span></button>
//                  </div>
//               </div>

//               <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
//                  @for (plan of plans; track plan.name) {
//                     <div class="relative p-8 rounded-[2rem] border transition-all duration-300 group hover:-translate-y-2"
//                          [ngClass]="plan.highlighted ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10 ring-4 ring-slate-100' : 'bg-white text-slate-900 border-slate-200 hover:shadow-xl'">
                       
//                        @if(plan.highlighted) {
//                          <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">Most Popular</div>
//                        }

//                        <h3 class="font-display text-2xl font-bold mb-2">{{ plan.name }}</h3>
//                        <p class="text-sm opacity-80 mb-6 min-h-[40px]">{{ plan.description }}</p>

//                        <div class="text-5xl font-bold mb-8 font-display">
//                           {{ plan.price }}<span class="text-lg opacity-50 font-normal" *ngIf="plan.price !== 'Free' && plan.price !== 'Custom'">/mo</span>
//                        </div>

//                        <button class="w-full py-3.5 rounded-xl font-bold text-sm mb-8 transition-all duration-300"
//                                [ngClass]="plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'">
//                           {{ plan.cta }}
//                        </button>

//                        <div class="space-y-4">
//                           @for (feat of plan.features; track feat) {
//                              <div class="flex items-center gap-3 text-sm font-medium opacity-90">
//                                 <span class="flex items-center justify-center w-5 h-5 rounded-full" [ngClass]="plan.highlighted ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'">✓</span>
//                                 {{ feat }}
//                              </div>
//                           }
//                        </div>
//                     </div>
//                  }
//               </div>
//            </div>
//         </section>

//         <section class="reveal-section py-24 px-6 max-w-3xl mx-auto">
//            <h2 class="font-display text-4xl font-bold text-slate-900 text-center mb-12">Questions?</h2>
//            <div class="space-y-4">
//               @for (faq of faqs; track $index) {
//                  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300"
//                       [class.ring-2]="openFaqIndex() === $index"
//                       [class.ring-blue-100]="openFaqIndex() === $index">
//                     <button (click)="toggleFaq($index)" class="w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors">
//                        <span class="font-semibold text-lg text-slate-900">{{ faq.question }}</span>
//                        <span class="text-2xl text-slate-400 font-light transition-transform duration-300" [class.rotate-45]="openFaqIndex() === $index">+</span>
//                     </button>
//                     @if (openFaqIndex() === $index) {
//                        <div class="px-6 pb-6 text-slate-600 leading-relaxed animate-fade-in border-t border-slate-100 pt-4">
//                           {{ faq.answer }}
//                        </div>
//                     }
//                  </div>
//               }
//            </div>
//         </section>

//         <section class="reveal-section py-32 px-6">
//            <div class="max-w-4xl mx-auto rounded-[3rem] bg-slate-900 p-12 md:p-20 text-center relative overflow-hidden">
//               <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
              
//               <div class="relative z-10">
//                  <h2 class="font-display text-4xl md:text-5xl font-bold text-white mb-6">Ready to upgrade?</h2>
//                  <p class="text-xl text-slate-300 mb-10 max-w-xl mx-auto">Join the new standard of business management.</p>
                 
//                  <form (ngSubmit)="onSubmitCta()" class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
//                     <input type="email" [(ngModel)]="ctaEmail" name="email" placeholder="work@email.com" 
//                            class="flex-1 px-6 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
//                     <button class="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50">
//                        {{ ctaSubmitted() ? 'Sent!' : 'Get Started' }}
//                     </button>
//                  </form>
//               </div>
//            </div>
//         </section>

//         <footer class="bg-slate-50 border-t border-slate-200 py-16 px-6">
//            <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
//               <div class="flex items-center gap-3">
//                  <div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">AT</div>
//                  <span class="font-display font-bold text-slate-900">ApexInfinity</span>
//               </div>
//               <div class="flex gap-8 text-sm font-medium text-slate-500">
//                  <a href="#" class="hover:text-slate-900 transition-colors">Twitter</a>
//                  <a href="#" class="hover:text-slate-900 transition-colors">GitHub</a>
//                  <a href="#" class="hover:text-slate-900 transition-colors">LinkedIn</a>
//               </div>
//               <p class="text-sm text-slate-400">© 2025 Apex Inc.</p>
//            </div>
//         </footer>

//       </main>
//     </div>
//   `,
//   styles: [`
//     .font-sans { font-family: 'Inter', sans-serif; }
//     .font-display { font-family: 'Outfit', sans-serif; }
    
//     .perspective-1000 { perspective: 1000px; }
    
//     @keyframes blob {
//       0% { transform: translate(0px, 0px) scale(1); }
//       33% { transform: translate(30px, -50px) scale(1.1); }
//       66% { transform: translate(-20px, 20px) scale(0.9); }
//       100% { transform: translate(0px, 0px) scale(1); }
//     }
//     .animate-blob { animation: blob 10s infinite; }
//     .animation-delay-2000 { animation-delay: 2s; }
//     .animation-delay-4000 { animation-delay: 4s; }

//     @keyframes fadeInUp {
//       from { opacity: 0; transform: translateY(30px); }
//       to { opacity: 1; transform: translateY(0); }
//     }
//     .animate-fade-in-up { opacity: 0; animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
//     .animation-delay-100 { animation-delay: 100ms; }
//     .animation-delay-200 { animation-delay: 200ms; }
//     .animation-delay-300 { animation-delay: 300ms; }
//     .animation-delay-500 { animation-delay: 500ms; }

//     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//     .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    
//     .animate-gradient {
//       background-size: 200% 200%;
//       animation: gradient 6s ease infinite;
//     }
//     @keyframes gradient {
//       0% { background-position: 0% 50%; }
//       50% { background-position: 100% 50%; }
//       100% { background-position: 0% 50%; }
//     }

//     /* Reveal Section */
//     .reveal-section {
//       opacity: 0;
//       transform: translateY(40px);
//       transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
//     }
//     .reveal-section.visible {
//       opacity: 1;
//       transform: translateY(0);
//     }
//   `]
// })
// export class LandingComponent implements AfterViewInit {
//   // --- SIGNALS FOR REACTIVITY ---
//   scrollSignal = signal(0);
//   isScrolled = computed(() => this.scrollSignal() > 50);
//   mobileMenuOpen = signal(false);
//   isYearly = signal(false);
//   openFaqIndex = signal<number | null>(null);
  
//   // Counters as Signals
//   usersCount = signal(0);
//   uptimeCount = signal(0);
//   revenueCount = signal(0);
//   ratingCount = signal(0);
  
//   ctaEmail = '';
//   ctaSubmitted = signal(false);
  
//   private hasAnimatedCounters = false;

//   @ViewChildren('counterSection') counterSections!: QueryList<ElementRef>;

//   navLinks = [
//     { label: 'Features', id: 'features' },
//     { label: 'Pricing', id: 'pricing' },
//     { label: 'Resources', id: 'resources' }
//   ];

//   features = [
//     { title: 'Smart Invoicing', description: 'Create GST-compliant invoices in seconds. Automated tax calculations handled for you.', points: ['Auto GST', 'E-Billing'], gradient: 'from-blue-600 to-blue-500', icon: '⚡' },
//     { title: 'Real-time Sync', description: 'Inventory updates instantly across all your warehouse locations.', points: ['Barcode Ready', 'API First'], gradient: 'from-cyan-500 to-blue-500', icon: '🔄' },
//     { title: 'Deep Analytics', description: 'Visualize your cash flow with beautiful, exportable reports.', points: ['Forecasting', 'Export CSV'], gradient: 'from-indigo-600 to-violet-500', icon: '📈' },
//   ];

//   steps = [
//     { title: 'Create Account', desc: 'Sign up in seconds.' },
//     { title: 'Import Data', desc: 'One-click CSV upload.' },
//     { title: 'Start Growing', desc: 'Automate your flow.' }
//   ];

//   plans = [
//     { name: 'Starter', price: 'Free', description: 'Perfect for side projects.', features: ['50 Invoices', 'Basic Reports'], cta: 'Start Free' },
//     { name: 'Pro', price: '₹2,999', description: 'For high-growth teams.', features: ['Unlimited Users', 'GST Automation', 'Priority Support'], cta: 'Start Trial', highlighted: true },
//     { name: 'Enterprise', price: 'Custom', description: 'For large organizations.', features: ['Dedicated Manager', 'SSO', 'SLA'], cta: 'Contact Sales' }
//   ];

//   faqs: FAQ[] = [
//     { question: 'Is my data secure?', answer: 'Yes. We use banking-grade encryption and SOC-2 certified infrastructure.' },
//     { question: 'Can I cancel anytime?', answer: 'Absolutely. No contracts, no hidden fees. Export your data whenever you want.' },
//     { question: 'Do you offer GST support?', answer: 'Yes, full GST compliance is built into the core of the platform.' }
//   ];

//   constructor(
//     @Inject(PLATFORM_ID) private platformId: Object,
//     private scroller: ViewportScroller
//   ) {}

//   @HostListener('window:scroll')
//   onScroll(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       this.scrollSignal.set(window.scrollY);
//     }
//   }

//   ngAfterViewInit(): void {
//     if (isPlatformBrowser(this.platformId)) {
//       this.setupObserver();
//     }
//   }

//   setupObserver() {
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           entry.target.classList.add('visible');
//           if (entry.target === this.counterSections.first?.nativeElement) {
//             this.triggerCounters();
//           }
//           observer.unobserve(entry.target);
//         }
//       });
//     }, { threshold: 0.1 });

//     document.querySelectorAll('.reveal-section').forEach(el => observer.observe(el));
//   }

//   toggleMobileMenu() { this.mobileMenuOpen.update(v => !v); }
//   toggleFaq(i: number) { this.openFaqIndex.update(curr => curr === i ? null : i); }

//   scrollToTop() {
//     this.scroller.scrollToPosition([0, 0]);
//   }

//   scrollToSection(id: string) {
//     this.scroller.scrollToAnchor(id);
//   }

//   onSubmitCta() {
//     if (!this.ctaEmail) return;
//     this.ctaSubmitted.set(true);
//     setTimeout(() => { this.ctaEmail = ''; this.ctaSubmitted.set(false); }, 3000);
//   }

//   private triggerCounters() {
//     if (this.hasAnimatedCounters) return;
//     this.hasAnimatedCounters = true;
//     this.animateValue(this.usersCount, 0, 5000, 2000);
//     this.animateValue(this.uptimeCount, 0, 99.9, 2000);
//     this.animateValue(this.revenueCount, 0, 50, 2000);
//     this.animateValue(this.ratingCount, 0, 4.9, 2000);
//   }

//   private animateValue(signalSetter: any, start: number, end: number, duration: number) {
//     const startTime = performance.now();
//     const animate = (currentTime: number) => {
//       const progress = Math.min((currentTime - startTime) / duration, 1);
//       const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
//       signalSetter.set(start + (end - start) * ease);
//       if (progress < 1) requestAnimationFrame(animate);
//     };
//     requestAnimationFrame(animate);
//   }
// }
// // import { CommonModule, isPlatformBrowser, DecimalPipe } from '@angular/common';
// // import { Component, HostListener, Inject, PLATFORM_ID, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
// // import { FormsModule } from '@angular/forms';

// // interface FAQ {
// //   question: string;
// //   answer: string;
// // }

// // @Component({
// //   selector: 'app-landing',
// //   standalone: true,
// //   imports: [CommonModule, FormsModule, DecimalPipe],
// //   template: `
// //     <div class="relative min-h-screen bg-[#F0F4F8] text-slate-900 overflow-x-hidden font-sans selection:bg-blue-200 selection:text-blue-900">
      
// //       <div class="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
// //            style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');">
// //       </div>

// //       <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
// //         <div class="absolute -top-32 -left-20 w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] mix-blend-multiply animate-blob"></div>
// //         <div class="absolute top-1/3 right-0 w-[28rem] h-[28rem] bg-cyan-300/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
// //         <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-indigo-300/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000"></div>
// //       </div>

// //       <nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/20"
// //            [ngClass]="{'bg-white/70 backdrop-blur-xl shadow-sm h-16': scrollY > 20, 'bg-transparent border-transparent h-24': scrollY <= 20}">
// //         <div class="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
// //           <div class="flex items-center gap-3 cursor-pointer group">
// //             <div class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
// //               AT
// //               <div class="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
// //             </div>
// //             <span class="font-bold text-xl tracking-tight text-slate-900">
// //               Apex<span class="text-blue-600">Infinity</span>
// //             </span>
// //           </div>

// //           <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
// //             @for (link of ['Features', 'Solutions', 'Pricing', 'Resources']; track link) {
// //               <button class="relative group py-2">
// //                 <span class="group-hover:text-blue-600 transition-colors">{{ link }}</span>
// //                 <span class="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-blue-600 group-hover:w-full transition-all duration-300"></span>
// //               </button>
// //             }
// //           </div>

// //           <div class="hidden md:flex items-center gap-4">
// //             <button class="text-slate-600 font-medium text-sm hover:text-blue-600 transition-colors">Sign In</button>
// //             <button class="relative px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300">
// //               Start Free
// //             </button>
// //           </div>

// //           <button class="md:hidden p-2 rounded-xl text-slate-600 hover:bg-black/5 transition" (click)="toggleMobileMenu()">
// //              <span class="text-2xl leading-none">{{ mobileMenuOpen ? '✕' : '☰' }}</span>
// //           </button>
// //         </div>

// //         @if (mobileMenuOpen) {
// //           <div class="md:hidden absolute top-full left-0 right-0 bg-white/90 backdrop-blur-2xl border-b border-slate-200 px-6 py-8 shadow-xl animate-fade-in">
// //             <div class="flex flex-col space-y-4">
// //               @for (link of ['Features', 'Solutions', 'Pricing', 'Resources']; track link) {
// //                 <button class="text-left text-lg font-medium text-slate-700 hover:text-blue-600">{{ link }}</button>
// //               }
// //               <div class="h-px bg-slate-100 my-4"></div>
// //               <button class="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-medium">Sign In</button>
// //               <button class="w-full py-3 rounded-xl bg-blue-600 text-white font-medium shadow-lg shadow-blue-500/30">Start Free</button>
// //             </div>
// //           </div>
// //         }
// //       </nav>

// //       <main class="pt-24">
// //         <section class="reveal-section relative flex flex-col items-center justify-center px-4 sm:px-6 pt-10 pb-32 overflow-hidden">
// //           <div class="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            
// //             <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-white/50 backdrop-blur-md shadow-sm text-sm font-medium text-slate-600 mb-4 animate-fade-in-up">
// //               <span class="relative flex h-2 w-2">
// //                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
// //                 <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
// //               </span>
// //               v2.0 is now live
// //             </div>

// //             <h1 class="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] animate-fade-in-up animation-delay-100">
// //               <span class="block text-slate-900">Complete Business</span>
// //               <span class="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 animate-gradient">
// //                 Management, Simplified
// //               </span>
// //             </h1>

// //             <p class="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
// //               Streamline invoicing, inventory, accounting, and team collaboration in one powerful platform.
// //             </p>

// //             <div class="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-up animation-delay-300">
// //               <button class="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300">
// //                 <span class="flex items-center gap-2">
// //                   Start Free Trial <span class="group-hover:translate-x-1 transition-transform">→</span>
// //                 </span>
// //               </button>

// //               <button class="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-1 transition-all duration-300">
// //                 View Interactive Demo
// //               </button>
// //             </div>

// //             <div class="flex flex-wrap justify-center gap-6 text-sm text-slate-500 pt-8 animate-fade-in-up animation-delay-500">
// //                <span class="flex items-center gap-2"><span class="text-emerald-500">✓</span> No credit card required</span>
// //                <span class="flex items-center gap-2"><span class="text-emerald-500">✓</span> 14-day free trial</span>
// //                <span class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Cancel anytime</span>
// //             </div>
// //           </div>
// //         </section>

// //         <section #counterSection class="reveal-section border-y border-white/50 bg-white/40 backdrop-blur-md px-6 py-16">
// //           <div class="max-w-7xl mx-auto">
// //             <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
// //               <div class="text-center group">
// //                 <div class="text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500">
// //                   {{ usersCount | number: '1.0-0' }}+
// //                 </div>
// //                 <p class="text-sm font-semibold uppercase tracking-wider text-slate-400">Active Users</p>
// //               </div>
// //               <div class="text-center group">
// //                 <div class="text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500">
// //                   {{ uptimeCount | number: '1.1-1' }}%
// //                 </div>
// //                 <p class="text-sm font-semibold uppercase tracking-wider text-slate-400">Uptime SLA</p>
// //               </div>
// //               <div class="text-center group">
// //                 <div class="text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500">
// //                   ₹{{ revenueCount | number: '1.0-0' }}M
// //                 </div>
// //                 <p class="text-sm font-semibold uppercase tracking-wider text-slate-400">Processed</p>
// //               </div>
// //               <div class="text-center group">
// //                 <div class="text-4xl md:text-5xl font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-500">
// //                   {{ ratingCount | number: '1.1-1' }}
// //                 </div>
// //                 <p class="text-sm font-semibold uppercase tracking-wider text-slate-400">User Rating</p>
// //               </div>
// //             </div>
// //           </div>
// //         </section>

// //         <section class="reveal-section py-32 px-6">
// //           <div class="max-w-7xl mx-auto">
// //             <div class="text-center mb-20">
// //               <h2 class="text-blue-600 font-bold tracking-widest uppercase text-sm mb-3">Capabilities</h2>
// //               <h3 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Everything you need to grow</h3>
// //               <p class="text-xl text-slate-500 max-w-2xl mx-auto">
// //                 Comprehensive tools designed for modern businesses. Manage everything in one intelligent platform.
// //               </p>
// //             </div>

// //             <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
// //               @for (feature of features; track feature.title) {
// //                 <div class="group relative p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
// //                   <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br {{feature.gradient}} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500 rounded-full"></div>

// //                   <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {{feature.gradient}} flex items-center justify-center text-white text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500">
// //                     {{ feature.icon }}
// //                   </div>

// //                   <h3 class="text-xl font-bold text-slate-900 mb-3">{{ feature.title }}</h3>
// //                   <p class="text-slate-500 mb-6 leading-relaxed">{{ feature.description }}</p>

// //                   <ul class="space-y-3">
// //                     @for (point of feature.points; track point) {
// //                       <li class="flex items-center gap-3 text-sm text-slate-600">
// //                         <span class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">✔</span>
// //                         {{ point }}
// //                       </li>
// //                     }
// //                   </ul>
// //                 </div>
// //               }
// //             </div>
// //           </div>
// //         </section>

// //         <section class="reveal-section py-32 px-6 bg-slate-50/50 border-y border-slate-200">
// //           <div class="max-w-7xl mx-auto">
// //             <div class="text-center mb-16">
// //               <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Simple, transparent pricing</h2>
              
// //               <div class="flex items-center justify-center gap-4 mt-8">
// //                 <span class="text-sm font-semibold transition-colors" [class.text-slate-400]="isYearly">Monthly</span>
// //                 <button (click)="togglePricing()" class="relative w-14 h-8 rounded-full bg-slate-200 shadow-inner transition-colors duration-300 focus:outline-none hover:bg-slate-300">
// //                   <div class="absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300" [class.translate-x-6]="isYearly"></div>
// //                 </button>
// //                 <span class="text-sm font-semibold transition-colors" [class.text-slate-400]="!isYearly">
// //                   Yearly <span class="ml-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">-20%</span>
// //                 </span>
// //               </div>
// //             </div>

// //             <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
// //               @for (plan of plans; track plan.name) {
// //                 <div class="relative p-8 rounded-[2rem] border transition-all duration-500 group"
// //                      [ngClass]="{
// //                        'bg-white shadow-2xl scale-105 border-blue-200 z-10': plan.highlighted,
// //                        'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl hover:scale-[1.02]': !plan.highlighted
// //                      }">
                  
// //                   @if (plan.highlighted) {
// //                     <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">Most Popular</div>
// //                   }

// //                   <h3 class="text-2xl font-bold text-slate-900 mb-2">{{ plan.name }}</h3>
// //                   <p class="text-slate-500 text-sm mb-6">{{ plan.description }}</p>

// //                   <div class="mb-8">
// //                     <span class="text-4xl font-bold text-slate-900">{{ plan.price }}</span>
// //                     @if (plan.price !== 'Free' && plan.price !== 'Custom') { <span class="text-slate-400">/mo</span> }
// //                   </div>

// //                   <button class="w-full py-3 rounded-xl font-bold text-sm mb-8 transition-all duration-300 hover:-translate-y-1"
// //                           [ngClass]="plan.highlighted 
// //                             ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50' 
// //                             : 'bg-white border border-slate-200 text-slate-900 hover:border-slate-300 shadow-sm'">
// //                     {{ plan.cta }}
// //                   </button>

// //                   <div class="space-y-3">
// //                     @for (feature of plan.features; track feature) {
// //                       <div class="flex items-center gap-3 text-sm text-slate-600">
// //                         <span class="text-emerald-500">✓</span> {{ feature }}
// //                       </div>
// //                     }
// //                   </div>
// //                 </div>
// //               }
// //             </div>
// //           </div>
// //         </section>

// //         <section class="reveal-section py-32 px-6">
// //           <div class="max-w-4xl mx-auto text-center">
// //             <h2 class="text-4xl font-bold text-slate-900 mb-12">Loved by businesses like yours</h2>
            
// //             <div class="relative p-10 md:p-14 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
// //               <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r" [ngClass]="testimonials[activeTestimonialIndex].color"></div>
              
// //               <div class="text-6xl text-slate-100 absolute top-8 left-10 font-serif">"</div>

// //               <div class="relative z-10">
// //                 <div class="flex justify-center gap-1 mb-6">
// //                   @for (star of [1,2,3,4,5]; track star) {
// //                     <span class="text-xl transition-all duration-300" 
// //                           [class.text-amber-400]="star <= testimonials[activeTestimonialIndex].rating"
// //                           [class.text-slate-200]="star > testimonials[activeTestimonialIndex].rating">★</span>
// //                   }
// //                 </div>

// //                 <p class="text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed mb-8 transition-opacity duration-300">
// //                   {{ testimonials[activeTestimonialIndex].quote }}
// //                 </p>

// //                 <div class="flex flex-col items-center">
// //                   <div class="w-16 h-16 rounded-full bg-gradient-to-br {{testimonials[activeTestimonialIndex].color}} flex items-center justify-center text-white text-xl font-bold shadow-lg mb-4">
// //                     {{ testimonials[activeTestimonialIndex].initials }}
// //                   </div>
// //                   <div class="font-bold text-slate-900 text-lg">{{ testimonials[activeTestimonialIndex].name }}</div>
// //                   <div class="text-slate-500">{{ testimonials[activeTestimonialIndex].role }} at {{ testimonials[activeTestimonialIndex].company }}</div>
// //                 </div>
// //               </div>
// //             </div>

// //             <div class="flex justify-center gap-3 mt-8">
// //               @for (t of testimonials; track $index) {
// //                 <button (click)="setActiveTestimonial($index)" 
// //                         class="h-2 rounded-full transition-all duration-300"
// //                         [ngClass]="$index === activeTestimonialIndex ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'">
// //                 </button>
// //               }
// //             </div>
// //           </div>
// //         </section>

// //         <section class="reveal-section py-24 px-6 max-w-3xl mx-auto">
// //           <h2 class="text-4xl font-bold text-slate-900 text-center mb-12">Common Questions</h2>
// //           <div class="space-y-4">
// //             @for (faq of faqs; track $index) {
// //               <div class="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all duration-300"
// //                    [class.shadow-md]="openFaqIndex === $index"
// //                    [class.border-blue-200]="openFaqIndex === $index">
// //                 <button (click)="setFaqOpen(openFaqIndex === $index ? null : $index)" 
// //                         class="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
// //                   <span class="font-semibold text-slate-900 text-lg" [class.text-blue-600]="openFaqIndex === $index">{{ faq.question }}</span>
// //                   <span class="text-slate-400 transform transition-transform duration-300" [class.rotate-180]="openFaqIndex === $index">▼</span>
// //                 </button>
// //                 @if (openFaqIndex === $index) {
// //                   <div class="px-6 pb-6 text-slate-600 leading-relaxed animate-fade-in">
// //                     {{ faq.answer }}
// //                   </div>
// //                 }
// //               </div>
// //             }
// //           </div>
// //         </section>

// //         <section class="reveal-section py-32 px-6 text-center">
// //           <div class="max-w-3xl mx-auto">
// //             <h2 class="text-5xl font-bold text-slate-900 mb-6">Ready to get started?</h2>
// //             <p class="text-xl text-slate-500 mb-10">Join 5,000+ companies managing their business with ApexInfinity.</p>
            
// //             <form (ngSubmit)="onSubmitCta()" class="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
// //               <input type="email" [(ngModel)]="ctaEmail" name="email" placeholder="Enter your work email" required
// //                      class="flex-1 px-6 py-4 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
// //               <button type="submit" class="px-8 py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 whitespace-nowrap">
// //                 {{ ctaSubmitted ? 'Check your inbox!' : 'Get Started Now' }}
// //               </button>
// //             </form>
// //           </div>
// //         </section>

// //       </main>

// //       <footer class="bg-white border-t border-slate-200 py-12 px-6">
// //         <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
// //           <div class="flex items-center gap-2 font-bold text-slate-900">
// //              <div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">AT</div>
// //              ApexInfinity
// //           </div>
// //           <div class="text-slate-500 text-sm">© 2025 Apex Infinity Inc. All rights reserved.</div>
// //           <div class="flex gap-6 text-sm font-medium text-slate-600">
// //             <a href="#" class="hover:text-blue-600">Privacy</a>
// //             <a href="#" class="hover:text-blue-600">Terms</a>
// //             <a href="#" class="hover:text-blue-600">Twitter</a>
// //           </div>
// //         </div>
// //       </footer>
// //     </div>
// //   `,
// //   styles: [`
// //     /* Animation Keyframes */
// //     @keyframes blob {
// //       0% { transform: translate(0px, 0px) scale(1); }
// //       33% { transform: translate(30px, -50px) scale(1.1); }
// //       66% { transform: translate(-20px, 20px) scale(0.9); }
// //       100% { transform: translate(0px, 0px) scale(1); }
// //     }
// //     .animate-blob {
// //       animation: blob 7s infinite;
// //     }
// //     .animation-delay-2000 { animation-delay: 2s; }
// //     .animation-delay-4000 { animation-delay: 4s; }

// //     @keyframes fadeInUp {
// //       from { opacity: 0; transform: translateY(20px); }
// //       to { opacity: 1; transform: translateY(0); }
// //     }
// //     .animate-fade-in-up {
// //       animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
// //       opacity: 0; 
// //     }
// //     .animation-delay-100 { animation-delay: 100ms; }
// //     .animation-delay-200 { animation-delay: 200ms; }
// //     .animation-delay-300 { animation-delay: 300ms; }
// //     .animation-delay-500 { animation-delay: 500ms; }

// //     @keyframes fadeIn {
// //       from { opacity: 0; }
// //       to { opacity: 1; }
// //     }
// //     .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }

// //     .animate-gradient {
// //       background-size: 200% 200%;
// //       animation: gradient 8s ease infinite;
// //     }
// //     @keyframes gradient {
// //       0%, 100% { background-position: 0% 50%; }
// //       50% { background-position: 100% 50%; }
// //     }

// //     /* Reveal Section Logic */
// //     .reveal-section {
// //       opacity: 0;
// //       transform: translateY(30px);
// //       transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
// //     }
// //     .reveal-section.visible {
// //       opacity: 1;
// //       transform: translateY(0);
// //     }
// //   `]
// // })
// // export class LandingComponent implements AfterViewInit {
// //   scrollY = 0;
// //   mobileMenuOpen = false;
// //   isYearly = false;
// //   openFaqIndex: number | null = null;
  
// //   // Counters
// //   usersCount = 0;
// //   uptimeCount = 0;
// //   revenueCount = 0;
// //   ratingCount = 0;
// //   private hasAnimatedCounters = false;

// //   // Form
// //   ctaEmail = '';
// //   ctaSubmitted = false;

// //   // Access elements
// //   @ViewChildren('counterSection') counterSections!: QueryList<ElementRef>;

// //   // Data
// //   features = [
// //     { title: 'Smart Invoicing', description: 'Create GST-compliant invoices in seconds with automated tax calculations.', points: ['Auto GST handling', 'QR-enabled e-billing'], gradient: 'from-blue-600 to-blue-400', icon: '💼' },
// //     { title: 'Inventory Sync', description: 'Track stock across warehouses in real-time with low stock alerts.', points: ['Barcode support', 'Batch/expiry tracking'], gradient: 'from-cyan-600 to-cyan-400', icon: '📦' },
// //     { title: 'Analytics', description: 'Actionable insights that help you grow your bottom line.', points: ['Sales dashboard', 'Downloadable reports'], gradient: 'from-indigo-600 to-indigo-400', icon: '📊' },
// //   ];

// //   plans = [
// //     { name: 'Starter', price: 'Free', description: 'For side hustlers.', features: ['50 Invoices', 'Basic reports'], cta: 'Get Started' },
// //     { name: 'Pro', price: '₹2,999', description: 'For growing teams.', features: ['Team access', 'GST reports', 'Priority Support'], cta: 'Start Trial', highlighted: true },
// //     { name: 'Enterprise', price: 'Custom', description: 'For scale.', features: ['Dedicated Manager', 'API Access', 'SSO'], cta: 'Contact Sales' }
// //   ];

// //   testimonials = [
// //     { name: 'Rajesh Kumar', role: 'CEO', company: 'TechFlow', quote: 'This saved tons of time managing my business. The GST automation is a lifesaver.', rating: 5, initials: 'RK', color: 'from-blue-500 to-blue-600' },
// //     { name: 'Priya Sharma', role: 'Director', company: 'Innovate', quote: 'Best investment for scaling operations. The inventory sync works flawlessly.', rating: 5, initials: 'PS', color: 'from-cyan-500 to-cyan-600' },
// //     { name: 'Amit Patel', role: 'Founder', company: 'BuildIt', quote: 'Support is incredible and the UI is beautiful. Highly recommend to everyone.', rating: 5, initials: 'AP', color: 'from-indigo-500 to-indigo-600' },
// //   ];
// //   activeTestimonialIndex = 0;

// //   faqs: FAQ[] = [
// //     { question: 'Is my data secure?', answer: 'Yes — we use SOC-2 grade encryption, daily backups, and zero third-party sharing.' },
// //     { question: 'Can I migrate my existing data?', answer: 'Yes — CSV, Excel import is built-in, and we offer assisted onboarding for Pro plans.' },
// //     { question: 'Is it GST ready?', answer: 'Yes — Full GST support including IRN, QR codes, and HSN logic automations.' },
// //     { question: 'Do you offer support?', answer: 'We offer email support for all plans, and priority/phone support for Pro and Enterprise.' },
// //   ];

// //   constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

// //   // FIX: Optimized Scroll Listener (prevents excessive Change Detection)
// //   @HostListener('window:scroll', [])
// //   onScroll(): void {
// //     if (isPlatformBrowser(this.platformId)) {
// //       requestAnimationFrame(() => {
// //         this.scrollY = window.scrollY || 0;
// //       });
// //     }
// //   }

// //   // FIX: SSR Safe Intersection Observer
// //   ngAfterViewInit(): void {
// //     if (isPlatformBrowser(this.platformId)) {
// //       this.setupIntersectionObserver();
// //     }
// //   }

// //   private setupIntersectionObserver() {
// //     const observer = new IntersectionObserver((entries) => {
// //       entries.forEach((entry) => {
// //         if (entry.isIntersecting) {
// //           entry.target.classList.add('visible');
          
// //           // Trigger counters if this is the counter section
// //           if (entry.target === this.counterSections.first?.nativeElement) {
// //             this.triggerCounters();
// //           }
          
// //           observer.unobserve(entry.target);
// //         }
// //       });
// //     }, { threshold: 0.15 });

// //     const elements = document.querySelectorAll('.reveal-section');
// //     elements.forEach((el) => observer.observe(el));
// //   }

// //   toggleMobileMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
// //   togglePricing() { this.isYearly = !this.isYearly; }
// //   setFaqOpen(index: number | null) { this.openFaqIndex = index; }
// //   setActiveTestimonial(index: number) { this.activeTestimonialIndex = index; }

// //   onSubmitCta() {
// //     if (!this.ctaEmail) return;
// //     this.ctaSubmitted = true;
// //     setTimeout(() => { this.ctaEmail = ''; this.ctaSubmitted = false; }, 3000);
// //   }

// //   private triggerCounters(): void {
// //     if (this.hasAnimatedCounters) return;
// //     this.hasAnimatedCounters = true;
// //     this.animateNumber(0, 5000, 2000, (v) => (this.usersCount = Math.round(v)));
// //     this.animateNumber(0, 99.9, 2000, (v) => (this.uptimeCount = parseFloat(v.toFixed(1))));
// //     this.animateNumber(0, 50, 2000, (v) => (this.revenueCount = Math.round(v)));
// //     this.animateNumber(0, 4.9, 2000, (v) => (this.ratingCount = parseFloat(v.toFixed(1))));
// //   }

// //   private animateNumber(start: number, end: number, duration: number, callback: (value: number) => void) {
// //     const startTime = performance.now();
// //     const step = (currentTime: number) => {
// //       const progress = Math.min((currentTime - startTime) / duration, 1);
// //       // Ease out quart
// //       const ease = 1 - Math.pow(1 - progress, 4);
// //       const value = start + (end - start) * ease;
// //       callback(value);
// //       if (progress < 1) requestAnimationFrame(step);
// //     };
// //     requestAnimationFrame(step);
// //   }
// // }

// // // import { CommonModule } from '@angular/common';
// // // import { Component, HostListener } from '@angular/core';
// // // import { FormsModule } from '@angular/forms';

// // // interface FAQ {
// // //   question: string;
// // //   answer: string;
// // // }

// // // @Component({
// // //   selector: 'app-landing',
// // //   standalone: true,
// // //   imports: [CommonModule, FormsModule],
// // //   templateUrl: './landing.component.html',
// // //   styleUrls: ['./landing.component.scss'],
// // // })
// // // export class LandingComponent {

// // //   scrollY = 0;
// // //   mobileMenuOpen = false;

// // //   // Pricing toggle
// // //   isYearly = false;

// // //   // FAQ
// // //   faqs: FAQ[] = [
// // //     { question: 'Is my data secure with AccounTech?', answer: 'Yes — we use SOC-2 grade encryption, backups and zero third-party sharing.' },
// // //     { question: 'Can I migrate my existing data?', answer: 'Yes — CSV, Excel and assisted onboarding included.' },
// // //     { question: 'Is AccounTech GST ready?', answer: 'Yes — Full GST support including IRN, QR and HSN logic.' },
// // //     { question: 'What happens after the free trial?', answer: 'You can continue on the free tier or upgrade — no auto-billing.' },
// // //     { question: 'Do you support mobile?', answer: 'Yes — Android, iOS and responsive browser support.' },
// // //     { question: 'Do you offer support?', answer: 'Email, priority and enterprise support plans available.' },
// // //   ];
// // //   openFaqIndex: number | null = null;

// // //   // Counters
// // //   usersCount = 0;
// // //   uptimeCount = 0;
// // //   revenueCount = 0;
// // //   ratingCount = 0;

// // //   private hasAnimatedCounters = false;

// // //   constructor() {
// // //     setTimeout(() => {
// // //       this.observeRevealElements();
// // //     }, 200);
// // //   }

// // //   @HostListener('window:scroll', [])
// // //   onScroll(): void {
// // //     this.scrollY = window.scrollY || 0;
// // //     this.triggerCounters();
// // //   }

// // //   toggleMobileMenu(): void {
// // //     this.mobileMenuOpen = !this.mobileMenuOpen;
// // //   }

// // //     setActiveTestimonial(index: number): void {
// // //     this.activeTestimonialIndex = index;
// // //   }
// // //   togglePricing(): void {
// // //     this.isYearly = !this.isYearly;
// // //   }

// // //   setFaqOpen(index: number | null): void {
// // //     this.openFaqIndex = index;
// // //   }

// // //   // -------------------------------------------------------------
// // //   // ANIMATION SYSTEM (No GSAP)
// // //   // -------------------------------------------------------------
// // //   private observeRevealElements(): void {
// // //     const elements = document.querySelectorAll('.reveal-section');

// // //     const observer = new IntersectionObserver(
// // //       (entries) => {
// // //         entries.forEach((entry) => {
// // //           if (entry.isIntersecting) {
// // //             (entry.target as HTMLElement).classList.add('visible');
// // //             observer.unobserve(entry.target);
// // //           }
// // //         });
// // //       },
// // //       { threshold: 0.25 }
// // //     );

// // //     elements.forEach((el) => observer.observe(el));
// // //   }

// // //   // -------------------------------------------------------------
// // // // FEATURES (for features section)
// // // // -------------------------------------------------------------
// // // features = [
// // //   {
// // //     title: 'Smart Invoicing',
// // //     description: 'Create GST-compliant invoices in seconds.',
// // //     points: [
// // //       'Auto GST handling',
// // //       'Templates',
// // //       'QR-enabled e-billing'
// // //     ],
// // //     gradient: 'from-blue-600 to-blue-400'
// // //   },
// // //   {
// // //     title: 'Inventory Management',
// // //     description: 'Track stock across warehouses.',
// // //     points: [
// // //       'Barcode support',
// // //       'Stock alerts',
// // //       'Batch/expiry tracking'
// // //     ],
// // //     gradient: 'from-cyan-600 to-cyan-400'
// // //   },
// // //   {
// // //     title: 'Business Analytics',
// // //     description: 'Insights that help you grow.',
// // //     points: [
// // //       'Sales dashboard',
// // //       'Customer insights',
// // //       'Downloadable reports'
// // //     ],
// // //     gradient: 'from-purple-600 to-purple-400'
// // //   },
// // // ];


// // // // -------------------------------------------------------------
// // // // STEPS (for onboarding section)
// // // // -------------------------------------------------------------
// // // steps = [
// // //   {
// // //     number: 1,
// // //     title: 'Create an Account',
// // //     points: ['No setup required', 'Free trial included'],
// // //     gradient: 'from-blue-600 to-cyan-500'
// // //   },
// // //   {
// // //     number: 2,
// // //     title: 'Add Data',
// // //     points: ['Import customers', 'Setup items'],
// // //     gradient: 'from-emerald-600 to-cyan-500'
// // //   },
// // //   {
// // //     number: 3,
// // //     title: 'Run Your Business',
// // //     points: ['Track invoices', 'Monitor sales'],
// // //     gradient: 'from-purple-600 to-pink-500'
// // //   },
// // // ];


// // // // -------------------------------------------------------------
// // // // PRICING PLANS
// // // // -------------------------------------------------------------
// // // plans = [
// // //   {
// // //     name: 'Starter',
// // //     price: 'Free',
// // //     description: 'For personal or starter usage.',
// // //     features: ['Invoices', 'Basic reports', 'Email support'],
// // //     cta: 'Get Started'
// // //   },
// // //   {
// // //     name: 'Pro',
// // //     price: '₹2,999',
// // //     description: 'Best for growing businesses.',
// // //     features: ['Team access', 'Export', 'GST reports'],
// // //     cta: 'Start Trial',
// // //     highlighted: true
// // //   },
// // //   {
// // //     name: 'Enterprise',
// // //     price: 'Custom',
// // //     description: 'For large teams.',
// // //     features: ['Full access', 'Dedicated support'],
// // //     cta: 'Contact Sales'
// // //   }
// // // ];


// // // // -------------------------------------------------------------
// // // // TESTIMONIALS
// // // // -------------------------------------------------------------
// // // testimonials = [
// // //   {
// // //     name: 'Rajesh Kumar',
// // //     quote: 'This saved tons of time managing my business.',
// // //     rating: 5,
// // //     initials: 'RK',
// // //     color: 'from-blue-500 to-blue-600'
// // //   },
// // //   {
// // //     name: 'Priya Sharma',
// // //     quote: 'Best investment for scaling operations.',
// // //     rating: 5,
// // //     initials: 'PS',
// // //     color: 'from-cyan-500 to-cyan-600'
// // //   },
// // // ];

// // // activeTestimonialIndex = 0;


// // // // -------------------------------------------------------------
// // // // CTA FORM
// // // // -------------------------------------------------------------
// // // ctaEmail = '';
// // // ctaSubmitted = false;

// // // onSubmitCta() {
// // //   if (!this.ctaEmail) return;

// // //   this.ctaSubmitted = true;

// // //   setTimeout(() => {
// // //     this.ctaEmail = '';
// // //     this.ctaSubmitted = false;
// // //   }, 2000);
// // // }

// // //   // -------------------------------------------------------------
// // //   // COUNTERS (requestAnimationFrame)
// // //   // -------------------------------------------------------------
// // //   private animateNumber(start: number, end: number, duration: number, callback: (value: number) => void) {
// // //     const startTime = performance.now();

// // //     const step = (currentTime: number) => {
// // //       const progress = Math.min((currentTime - startTime) / duration, 1);
// // //       const value = start + (end - start) * progress;
// // //       callback(value);

// // //       if (progress < 1) requestAnimationFrame(step);
// // //     };

// // //     requestAnimationFrame(step);
// // //   }

// // //   private triggerCounters(): void {
// // //     if (this.hasAnimatedCounters) return;

// // //     const section = document.querySelector('#social-proof');
// // //     if (!section) return;

// // //     const rect = section.getBoundingClientRect();
// // //     if (rect.top < window.innerHeight - 100) {
// // //       this.hasAnimatedCounters = true;

// // //       this.animateNumber(0, 5000, 1500, (v) => (this.usersCount = Math.round(v)));
// // //       this.animateNumber(0, 99.9, 1500, (v) => (this.uptimeCount = parseFloat(v.toFixed(1))));
// // //       this.animateNumber(0, 50, 1500, (v) => (this.revenueCount = Math.round(v)));
// // //       this.animateNumber(0, 4.9, 1500, (v) => (this.ratingCount = parseFloat(v.toFixed(1))));
// // //     }
// // //   }
// // // }
