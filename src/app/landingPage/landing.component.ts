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
