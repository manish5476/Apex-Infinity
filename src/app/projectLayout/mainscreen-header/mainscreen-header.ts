import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { PopoverModule, Popover } from 'primeng/popover';
import { TieredMenuModule } from 'primeng/tieredmenu';

// Services & Components
import { ThemeService, ThemeSettings } from '../../core/services/theme.service';
import { AuthService } from '../../modules/auth/services/auth-service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../modules/organization/components/notification-bell-component/notification-bell-component';
import { LayoutService } from '../layout.service';
import { SIDEBAR_MENU } from '../mainscreensidebar/menu-items.constants';

// Interfaces for Type Safety
export interface Theme {
  name: string;
  id: string;
  color: string;
  gradient: string;
  category: string;
  description: string;
}

export interface ThemeGroup {
  category: string;
  themes: Theme[];
}

@Component({
  selector: 'app-mainscreen-header',
  standalone: true,
  imports: [
    CommonModule, 
    TieredMenuModule,
    FormsModule,
    RouterModule,
    AvatarModule,
    ButtonModule,
    TooltipModule,
    ToggleButtonModule,
    PopoverModule,
    NotificationBellComponent
  ],
  templateUrl: './mainscreen-header.html',
  styleUrl: './mainscreen-header.scss',
})
export class MainscreenHeader implements OnInit, OnDestroy {
  // Inputs & Outputs
  @Input() isMobileMenuOpen: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  @ViewChild('profilePopover') profilePopover!: Popover;
  @ViewChild('notificationPopover') notificationPopover!: Popover;

  // Dependency Injection
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private layout = inject(LayoutService);
  private destroy$ = new Subject<void>();
  
  textScale: number = 100;
  
  // State
  activePopoverTab: 'settings' | 'notifications' = 'settings';
  currentUser: any = null;
  recentNotifications: any[] = [];

  // Theme State
  isDarkMode = false;
  activeThemeId: string = 'theme-light';
  themeGroups: ThemeGroup[] = [];
  mobileMenuItems: any;

  mockNotifications = [
    { id: 1, title: 'New Member Request', message: 'John Doe wants to join your organization', time: '2 min ago', read: false, type: 'info' },
    { id: 2, title: 'Task Completed', message: 'Project "Dashboard Redesign" has been completed', time: '1 hour ago', read: false, type: 'success' },
    { id: 3, title: 'System Update', message: 'Scheduled maintenance in 30 minutes', time: '3 hours ago', read: true, type: 'warning' },
    { id: 4, title: 'New Message', message: 'You have a new message from Sarah', time: '5 hours ago', read: true, type: 'info' },
  ];

  // Converted to a class property instead of an exported const
  allThemes: Theme[] = [
    {name: "theme-neon-eclipse",id: "theme-neon-eclipse",color: "#bf00ff",gradient: "linear-gradient(135deg, #bf00ff 0%, #3a0088 100%)",category: "theme-neon-eclipse",description: "Vibrant neon tones piercing through a deep, dark eclipse background."},
    {name: "theme-naval-amber",id: "theme-naval-amber",color: "#ffbf00",gradient: "linear-gradient(135deg, #000080 0%, #ffbf00 100%)",category: "theme-naval-amber",description: "A commanding deep naval blue contrasted with warm, glowing amber highlights."},
    {name: "theme-abyssal-coral",id: "theme-abyssal-coral",color: "#ff7f50",gradient: "linear-gradient(135deg, #0b1d28 0%, #ff7f50 100%)",category: "theme-abyssal-coral",description: "Deep oceanic abyssal tones paired with vibrant, living coral."},
    {name: "theme-slate-rust",id: "theme-slate-rust",color: "#b7410e",gradient: "linear-gradient(135deg, #708090 0%, #b7410e 100%)",category: "theme-slate-rust",description: "Cool slate gray accented by earthy, oxidized rust tones."},
    {name: "theme-indigo-tangerine",id: "theme-indigo-tangerine",color: "#f28500",gradient: "linear-gradient(135deg, #4b0082 0%, #f28500 100%)",category: "theme-indigo-tangerine",description: "A striking combination of deep indigo and bright, citrusy tangerine."},
    {name: "theme-solar-space",id: "theme-solar-space",color: "#ffcc00",gradient: "linear-gradient(135deg, #000000 0%, #ffcc00 100%)",category: "theme-solar-space",description: "The absolute darkness of space illuminated by intense solar yellow."},
    {name: "theme-cobalt-mango",id: "theme-cobalt-mango",color: "#ff8243",gradient: "linear-gradient(135deg, #0047ab 0%, #ff8243 100%)",category: "theme-cobalt-mango",description: "Rich cobalt blue balanced with sweet, tropical mango orange."},
    {name: "theme-sapphire-flame",id: "theme-sapphire-flame",color: "#e25822",gradient: "linear-gradient(135deg, #0f52ba 0%, #e25822 100%)",category: "theme-sapphire-flame",description: "Cool sapphire depths ignited by a warm, fiery red-orange."},
    {name: "theme-oceanic-peach",id: "theme-oceanic-peach",color: "#ffcba4",gradient: "linear-gradient(135deg, #006994 0%, #ffcba4 100%)",category: "theme-oceanic-peach",description: "Rolling oceanic blues softened by gentle peach pastels."},
    {name: "theme-lapis-tiger",id: "theme-lapis-tiger",color: "#fd6a02",gradient: "linear-gradient(135deg, #26619c 0%, #fd6a02 100%)",category: "theme-lapis-tiger",description: "Bold lapis lazuli combined with fierce, striking tiger orange."},
    {name: "theme-midnight-marigold",id: "theme-midnight-marigold",color: "#eaa221",gradient: "linear-gradient(135deg, #191970 0%, #eaa221 100%)",category: "theme-midnight-marigold",description: "The darkest midnight hour lit up by golden marigold hues."},
    {name: "theme-twilight-burnt",id: "theme-twilight-burnt",color: "#cc5500",gradient: "linear-gradient(135deg, #301934 0%, #cc5500 100%)",category: "theme-twilight-burnt",description: "A fading twilight purple grounded by deep, burnt orange."},
    {name: "theme-void-electric",id: "theme-void-electric",color: "#0ff0fc",gradient: "linear-gradient(135deg, #0f0f0f 0%, #0ff0fc 100%)",category: "theme-void-electric",description: "A deep, empty void pierced by bright electric cyan."},
    {name: "theme-storm-apricot",id: "theme-storm-apricot",color: "#fbceb1",gradient: "linear-gradient(135deg, #4f666a 0%, #fbceb1 100%)",category: "theme-storm-apricot",description: "Turbulent storm-cloud grays offset by a soft, cheerful apricot."},
    {name: "theme-marine-copper",id: "theme-marine-copper",color: "#b87333",gradient: "linear-gradient(135deg, #000080 0%, #b87333 100%)",category: "theme-marine-copper",description: "Nautical marine blues complemented by polished copper accents."},
    {name: "theme-royal-pumpkin",id: "theme-royal-pumpkin",color: "#ff7518",gradient: "linear-gradient(135deg, #4169e1 0%, #ff7518 100%)",category: "theme-royal-pumpkin",description: "Classic royal blue paired with a festive, bright pumpkin orange."},
    {name: "theme-eclipse-tangerine",id: "theme-eclipse-tangerine",color: "#f28500",gradient: "linear-gradient(135deg, #111111 0%, #f28500 100%)",category: "theme-eclipse-tangerine",description: "A stark shadow eclipse rimmed with a vibrant tangerine glow."},
    {name: "theme-cyber-navy",id: "theme-cyber-navy",color: "#00ff00",gradient: "linear-gradient(135deg, #000080 0%, #00ff00 100%)",category: "theme-cyber-navy",description: "Traditional navy blue upgraded with futuristic cyber-green elements."},
    {name: "theme-midnight-gold",id: "theme-midnight-gold",color: "#ffd700",gradient: "linear-gradient(135deg, #191970 0%, #ffd700 100%)",category: "theme-midnight-gold",description: "Luxurious metallic gold standing out against a midnight backdrop."},
    {name: "theme-deep-supernova",id: "theme-deep-supernova",color: "#ff4040",gradient: "linear-gradient(135deg, #1a0b2e 0%, #ff4040 100%)",category: "theme-deep-supernova",description: "The deep purples of space exploding into a brilliant red supernova."},
    {name: "theme-midnight-bronze",id: "theme-midnight-bronze",color: "#cd7f32",gradient: "linear-gradient(135deg, #191970 0%, #cd7f32 100%)",category: "theme-midnight-bronze",description: "Dark, moody blues accented by rich, antiqued bronze."},
    {name: "theme-frosted-pearl",id: "theme-frosted-pearl",color: "#eae0c8",gradient: "linear-gradient(135deg, #ffffff 0%, #eae0c8 100%)",category: "theme-frosted-pearl",description: "A clean, bright theme featuring icy whites and soft pearl undertones."},
    {name: "theme-crisp-structure",id: "theme-crisp-structure",color: "#2a2a2a",gradient: "linear-gradient(135deg, #f5f5f5 0%, #2a2a2a 100%)",category: "theme-crisp-structure",description: "High-contrast architectural whites and structured, sharp charcoal grays."},
    {name: "theme-blueprint-light",id: "theme-blueprint-light",color: "#3b82f6",gradient: "linear-gradient(135deg, #ffffff 0%, #3b82f6 100%)",category: "theme-blueprint-light",description: "A light, analytical theme inspired by crisp architectural blueprints."},
    {name: "theme-cloud-ivory",id: "theme-cloud-ivory",color: "#fffff0",gradient: "linear-gradient(135deg, #f0f8ff 0%, #fffff0 100%)",category: "theme-cloud-ivory",description: "Soft, floating cloud colors blended with warm, luxurious ivory."},
    {name: "theme-royal-sapphire",id: "theme-royal-sapphire",color: "#0f52ba",gradient: "linear-gradient(135deg, #4169e1 0%, #0f52ba 100%)",category: "theme-royal-sapphire",description: "A majestic blend of royal blue and deep, brilliant sapphire."},
    {name: "theme-ocean-mist",id: "theme-ocean-mist",color: "#e0ffff",gradient: "linear-gradient(135deg, #006994 0%, #e0ffff 100%)",category: "theme-ocean-mist",description: "Cool oceanic blues softened by a sheer, breathable mist."},
    {name: "theme-executive-velvet",id: "theme-executive-velvet",color: "#800020",gradient: "linear-gradient(135deg, #1a1a1a 0%, #800020 100%)",category: "theme-executive-velvet",description: "Professional, dark styling with rich, tactile burgundy velvet accents."},
    {name: "theme-obsidian-blue",id: "theme-obsidian-blue",color: "#00008b",gradient: "linear-gradient(135deg, #0b0b0b 0%, #00008b 100%)",category: "theme-obsidian-blue",description: "Sleek, black volcanic obsidian shining with deep blue undertones."},
    {name: "theme-coastal-command",id: "theme-coastal-command",color: "#4682b4",gradient: "linear-gradient(135deg, #2f4f4f 0%, #4682b4 100%)",category: "theme-coastal-command",description: "Authoritative slate and steel blues inspired by coastal defense operations."},
    {name: "theme-warm-meridian",id: "theme-warm-meridian",color: "#ff8c00",gradient: "linear-gradient(135deg, #d2691e 0%, #ff8c00 100%)",category: "theme-warm-meridian",description: "Sun-drenched, equatorial warmth in deep orange and terracotta."},
    {name: "theme-arctic-glass",id: "theme-arctic-glass",color: "#b0e0e6",gradient: "linear-gradient(135deg, #ffffff 0%, #b0e0e6 100%)",category: "theme-arctic-glass",description: "Transparent, freezing whites combined with icy powder blues."},
    {name: "theme-obsidian-contrast",id: "theme-obsidian-contrast",color: "#ffffff",gradient: "linear-gradient(135deg, #050505 0%, #ffffff 100%)",category: "theme-obsidian-contrast",description: "Maximum contrast featuring pitch-black obsidian and pure white."},
    {name: "theme-deep-emerald",id: "theme-deep-emerald",color: "#004b23",gradient: "linear-gradient(135deg, #001f0e 0%, #004b23 100%)",category: "theme-deep-emerald",description: "Lush, dark green styling inspired by deep forest emeralds."},
    {name: "theme-obsidian-jade",id: "theme-obsidian-jade",color: "#00a86b",gradient: "linear-gradient(135deg, #0b0b0b 0%, #00a86b 100%)",category: "theme-obsidian-jade",description: "Dark, glossy obsidian paired with striking, vibrant jade green."},
    {name: "theme-daylight-orange",id: "theme-daylight-orange",color: "#ff8c00",gradient: "linear-gradient(135deg, #87ceeb 0%, #ff8c00 100%)",category: "theme-daylight-orange",description: "Bright daylight sky blues warming up to a sunny, daytime orange."},
    {name: "theme-morning-tangerine",id: "theme-morning-tangerine",color: "#f28500",gradient: "linear-gradient(135deg, #ffdf00 0%, #f28500 100%)",category: "theme-morning-tangerine",description: "A fresh, awakening blend of early yellow light and tangerine."},
    {name: "theme-crisp-apricot",id: "theme-crisp-apricot",color: "#fbceb1",gradient: "linear-gradient(135deg, #ffffff 0%, #fbceb1 100%)",category: "theme-crisp-apricot",description: "Clean whites with a very subtle, refreshing splash of apricot."},
    {name: "theme-naval-dawn",id: "theme-naval-dawn",color: "#ffb6c1",gradient: "linear-gradient(135deg, #000080 0%, #ffb6c1 100%)",category: "theme-naval-dawn",description: "Deep naval night-sky giving way to the soft pinks of early dawn."},
    {name: "theme-azure-sun",id: "theme-azure-sun",color: "#ffd700",gradient: "linear-gradient(135deg, #007fff 0%, #ffd700 100%)",category: "theme-azure-sun",description: "A brilliant, cloudless azure sky paired with a radiant yellow sun."},
    {name: "theme-cloud-amber",id: "theme-cloud-amber",color: "#ffbf00",gradient: "linear-gradient(135deg, #f0f8ff 0%, #ffbf00 100%)",category: "theme-cloud-amber",description: "Soft, misty cloud grays touched by the warm glow of amber."},
    {name: "theme-luminous-coral",id: "theme-luminous-coral",color: "#ff7f50",gradient: "linear-gradient(135deg, #ffdab9 0%, #ff7f50 100%)",category: "theme-luminous-coral",description: "A highly radiant, glowing coral over a warm, luminous background."},
    {name: "theme-midnight-slate",id: "theme-midnight-slate",color: "#708090",gradient: "linear-gradient(135deg, #191970 0%, #708090 100%)",category: "theme-midnight-slate",description: "The deep hues of midnight blue resting against cool, rigid slate."},
    {name: "theme-solar-flare",id: "theme-solar-flare",color: "#ff4500",gradient: "linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)",category: "theme-solar-flare",description: "Intense, radiating heat captured through brilliant oranges and reds."},
    {name: "theme-horizon",id: "theme-horizon",color: "#db7093",gradient: "linear-gradient(135deg, #87ceeb 0%, #db7093 100%)",category: "theme-horizon",description: "A vast gradient spanning from a light blue sky to a pale, dusky pink."},
    {name: "theme-midnight-city",id: "theme-midnight-city",color: "#ff1493",gradient: "linear-gradient(135deg, #1a1a2e 0%, #ff1493 100%)",category: "theme-midnight-city",description: "Dark, urban nightscapes splashed with bright pink neon lights."},
    {name: "theme-bio-frost",id: "theme-bio-frost",color: "#00fa9a",gradient: "linear-gradient(135deg, #e0ffff 0%, #00fa9a 100%)",category: "theme-bio-frost",description: "Organic, glowing bio-luminescent greens under a layer of icy frost."},
    {name: "theme-royal",id: "theme-royal",color: "#4169e1",gradient: "linear-gradient(135deg, #000080 0%, #4169e1 100%)",category: "theme-royal",description: "A classic, elegant theme rooted entirely in majestic royal blues."},
    {name: "theme-nebula",id: "theme-nebula",color: "#8a2be2",gradient: "linear-gradient(135deg, #4b0082 0%, #8a2be2 100%)",category: "theme-nebula",description: "Swirling, cosmic dust rendered in vibrant purples and deep indigos."},
    {name: "theme-luxury",id: "theme-luxury",color: "#d4af37",gradient: "linear-gradient(135deg, #000000 0%, #d4af37 100%)",category: "theme-luxury",description: "High-end aesthetic combining absolute black with opulent gold."},
    {name: "theme-futuristic",id: "theme-futuristic",color: "#00ffff",gradient: "linear-gradient(135deg, #0a0a0a 0%, #00ffff 100%)",category: "theme-futuristic",description: "A highly technical dark interface lit by sharp, glowing cyan."},
    {name: "theme-sunset",id: "theme-sunset",color: "#ff4500",gradient: "linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)",category: "theme-sunset",description: "The dramatic, cascading colors of a late evening sunset."},
    {name: "theme-slate-ember",id: "theme-slate-ember",color: "#b88645",gradient: "linear-gradient(135deg, #2f4f4f 0%, #b88645 100%)",category: "theme-slate-ember",description: "Dark premium glass with deep blue base and rich bronze accents."},
    {name: "theme-sage-cream",id: "theme-sage-cream",color: "#fffdd0",gradient: "linear-gradient(135deg, #9dc183 0%, #fffdd0 100%)",category: "theme-sage-cream",description: "An earthy, calming blend of herbal sage green and smooth cream."},
    {name: "theme-midnight-royal",id: "theme-midnight-royal",color: "#4169e1",gradient: "linear-gradient(135deg, #191970 0%, #4169e1 100%)",category: "theme-midnight-royal",description: "A rich, monochromatic dive from midnight shadows into royal blue."},
    {name: "theme-deep-space",id: "theme-deep-space",color: "#ffffff",gradient: "linear-gradient(135deg, #0d0d0d 0%, #2a2a35 100%)",category: "theme-deep-space",description: "An ultra-dark, immersive theme mirroring the vastness of space."},
    {name: "theme-rose-glass",id: "theme-rose-glass",color: "#ff66cc",gradient: "linear-gradient(135deg, #ffb6c1 0%, #ff66cc 100%)",category: "theme-rose-glass",description: "Translucent, elegant interfaces tinted with a delicate rose hue."},
    {name: "theme-amethyst-pearl",id: "theme-amethyst-pearl",color: "#9966cc",gradient: "linear-gradient(135deg, #fdfbf7 0%, #9966cc 100%)",category: "theme-amethyst-pearl",description: "Soft pearlescent whites intersecting with crystalline amethyst purple."},
    {name: "theme-indigo-breeze",id: "theme-indigo-breeze",color: "#00bfff",gradient: "linear-gradient(135deg, #4b0082 0%, #00bfff 100%)",category: "theme-indigo-breeze",description: "Heavy, dark indigo lightened by a sweeping, breezy cyan."},
    {name: "theme-teal-mist",id: "theme-teal-mist",color: "#008080",gradient: "linear-gradient(135deg, #e0f6f6 0%, #008080 100%)",category: "theme-teal-mist",description: "A foggy, atmospheric gradient featuring deep and light teal tones."},
    {name: "theme-emerald-dawn",id: "theme-emerald-dawn",color: "#50c878",gradient: "linear-gradient(135deg, #013220 0%, #50c878 100%)",category: "theme-emerald-dawn",description: "The transition from dark, forest night to a vibrant emerald morning."},
    {name: "theme-royal-sky",id: "theme-royal-sky",color: "#87ceeb",gradient: "linear-gradient(135deg, #4169e1 0%, #87ceeb 100%)",category: "theme-royal-sky",description: "A soaring gradient blending deep royal blue into light sky blue."},
    {name: "theme-violet-whisper",id: "theme-violet-whisper",color: "#ee82ee",gradient: "linear-gradient(135deg, #f8f8ff 0%, #ee82ee 100%)",category: "theme-violet-whisper",description: "A barely-there, airy theme with a soft touch of violet."},
    {name: "theme-aurora-glass",id: "theme-aurora-glass",color: "#00ff7f",gradient: "linear-gradient(135deg, #020024 0%, #00ff7f 100%)",category: "theme-aurora-glass",description: "Translucent layering capturing the green luminescence of the aurora."},
    {name: "theme-obsidian-rose",id: "theme-obsidian-rose",color: "#ff007f",gradient: "linear-gradient(135deg, #111111 0%, #ff007f 100%)",category: "theme-obsidian-rose",description: "Sleek, dark obsidian pierced by a bold, romantic rose pink."},
    {name: "theme-arctic-crystal",id: "theme-arctic-crystal",color: "#aeece1",gradient: "linear-gradient(135deg, #ffffff 0%, #aeece1 100%)",category: "theme-arctic-crystal",description: "A pristine, sharp theme inspired by crystalline arctic ice formations."}
  ];

  ngOnInit() {
    this.organizeThemes();
    this.mobileMenuItems = SIDEBAR_MENU;
    
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => this.currentUser = u);

    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe((n: any) => {
      const safeNotifications = Array.isArray(n) ? n : (n?.data || n?.notifications || []);
      this.recentNotifications = safeNotifications.filter((x: any) => !x.isRead);

      if (this.recentNotifications.length === 0) {
        this.recentNotifications = this.mockNotifications.filter(mock => !mock.read);
      }
    });

    this.themeService.settings$.pipe(takeUntil(this.destroy$)).subscribe((s: ThemeSettings) => {
      this.isDarkMode = s.isDarkMode;
      this.activeThemeId = s.isDarkMode ? 'theme-dark' : s.lightThemeClass || 'theme-light';
      if (s.textScale) {
        this.textScale = s.textScale;
      }
    });
  }

  updateTextScale(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.themeService.setTextScale(value);
  }

  organizeThemes() {
    const categoryMapping: Record<string, string> = {
      'core': 'Core',
      'professional': 'Professional',
      'minimal': 'Minimal',
      'colorful': 'Colorful',
      'luxury': 'Luxury',
      'modern': 'Modern',
      'system': 'System',
      'dark': 'Dark'
    };

    const categories = [...new Set(this.allThemes.map(t => t.category))];

    this.themeGroups = categories.map(cat => ({
      category: categoryMapping[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
      themes: this.allThemes.filter(t => t.category === cat)
    }));
  }

  onMenuToggle() {
    if (this.layout.isMobile()) {
      this.layout.toggleMobile();
    } else {
      this.layout.togglePin();
    }
    this.toggleSidebar.emit();
  }

  toggleDarkMode(isDark: boolean) {
    this.themeService.setDarkMode(isDark);
  }

  selectTheme(id: string) {
    if (id === 'theme-dark') {
      this.themeService.setDarkMode(true);
    } else if (id === 'auto-theme') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.themeService.setDarkMode(prefersDark);
      this.activeThemeId = prefersDark ? 'theme-dark' : 'theme-light';
    } else {
      this.themeService.setLightTheme(id);
      this.themeService.setDarkMode(false);
      this.activeThemeId = id;
    }
  }

  randomTheme() {
    const availableThemes = this.allThemes.filter(theme => theme.id !== this.activeThemeId);
    if (availableThemes.length === 0) return;

    const randomIndex = Math.floor(Math.random() * availableThemes.length);
    const randomTheme = availableThemes[randomIndex];
    this.selectTheme(randomTheme.id);
  }

  resetToDefault() {
    this.selectTheme('theme-light');
    this.themeService.setDarkMode(false);
  }

  logout() {
    this.authService.logout();
    this.closeAllPopovers();
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
  }

  loadNotifications() {
    // Refresh notifications if needed
  }

  clearAllNotifications() {
    if (this.recentNotifications.length === 0) return;
    this.notificationService.markAllAsRead();
    this.recentNotifications = [];
  }

  markAllAsRead() {
    this.recentNotifications.forEach(notification => {
      notification.read = true;
    });
    this.notificationService.markAllAsRead();
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'success': return 'pi pi-check-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      case 'error': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  closeAllPopovers() {
    if (this.profilePopover) this.profilePopover.hide();
    if (this.notificationPopover) this.notificationPopover.hide();
  }
  
  ngOnDestroy() {
    this.destroy$?.next();
    this.destroy$?.complete();
  }
}
