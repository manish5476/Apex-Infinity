import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { User } from '../../../../modules/auth/services/auth.types';

@Component({
  selector: 'app-sidebar-header',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex items-center px-3.5 py-3 flex-shrink-0 select-none border-b border-[var(--border-secondary)]"
      [class.justify-center]="isMini()"
      [class.justify-between]="!isMini()"
    >
      <!-- ── User Profile & Greeting ─────────────────────────── -->
      @if (!isMini()) {
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <!-- Avatar with Online Status Indicator -->
          <div class="relative w-9 h-9 flex-shrink-0 cursor-default">
            @if (user()?.avatar) {
              <img
                [src]="user()?.avatar"
                [alt]="displayName()"
                class="w-full h-full rounded-full object-cover ring-2 ring-[var(--border-secondary)] shadow-sm"
              />
            } @else {
              <div
                class="w-full h-full rounded-full flex items-center justify-center font-bold text-[12px] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] text-white ring-2 ring-[var(--border-secondary)] shadow-sm tracking-tight"
              >
                {{ initials() }}
              </div>
            }
            <!-- Green Online Dot -->
            <span
              class="w-2.5 h-2.5 bg-[var(--color-success)] rounded-full border-2 border-[var(--bg-primary)] absolute -bottom-0.5 -right-0.5 shadow-xs"
              aria-label="Online"
            ></span>
          </div>

          <!-- Greeting + Name -->
          <div class="flex flex-col min-w-0 overflow-hidden leading-tight">
            <span class="text-[11px] font-medium text-[var(--text-tertiary)] truncate flex items-center gap-1">
              {{ greeting() }} <span class="text-[11px]">👋</span>
            </span>
            <span class="text-[13px] font-bold text-[var(--text-primary)] tracking-tight truncate mt-0.5">
              {{ firstName() }}
            </span>
          </div>
        </div>

        <!-- ── Header Action Buttons ───────────────────────────── -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <!-- Search / Command Palette -->
          <button
            type="button"
            (click)="searchOpen.emit()"
            class="w-7 h-7 rounded-full bg-[var(--component-bg-hover)] hover:bg-[var(--component-bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] flex items-center justify-center transition-all cursor-pointer focus:outline-none"
            pTooltip="Search (Ctrl+K)"
            tooltipPosition="bottom"
            aria-label="Search"
          >
            <i class="pi pi-search text-[11px]"></i>
          </button>

          <!-- Notification Bell -->
          <button
            type="button"
            (click)="searchOpen.emit()"
            class="w-7 h-7 rounded-full bg-[var(--component-bg-hover)] hover:bg-[var(--component-bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] flex items-center justify-center transition-all cursor-pointer focus:outline-none"
            pTooltip="Notifications"
            tooltipPosition="bottom"
            aria-label="Notifications"
          >
            <i class="pi pi-bell text-[11px]"></i>
          </button>

          <!-- Collapse Sidebar Button -->
          @if (!isMobile()) {
            <button
              type="button"
              (click)="toggleMini.emit()"
              class="w-7 h-7 rounded-full bg-[var(--component-bg-hover)] hover:bg-[var(--component-bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] flex items-center justify-center transition-all cursor-pointer focus:outline-none"
              pTooltip="Collapse sidebar"
              tooltipPosition="bottom"
              aria-label="Collapse sidebar"
            >
              <i class="pi pi-chevron-left text-[10px]"></i>
            </button>
          }

          <!-- Mobile Close Button -->
          @if (isMobile()) {
            <button
              type="button"
              (click)="closeMobile.emit()"
              class="w-7 h-7 rounded-full bg-[var(--component-bg-hover)] hover:bg-[var(--component-bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] flex items-center justify-center transition-all cursor-pointer focus:outline-none"
              aria-label="Close menu"
            >
              <i class="pi pi-times text-[11px]"></i>
            </button>
          }
        </div>
      } @else {
        <!-- ── Mini Mode Header ────────────────────────────────── -->
        <div
          class="relative w-8 h-8 flex-shrink-0 cursor-pointer"
          (click)="toggleMini.emit()"
          [pTooltip]="displayName()"
          tooltipPosition="right"
        >
          @if (user()?.avatar) {
            <img
              [src]="user()?.avatar"
              [alt]="displayName()"
              class="w-full h-full rounded-full object-cover ring-2 ring-[var(--border-secondary)]"
            />
          } @else {
            <div
              class="w-full h-full rounded-full flex items-center justify-center font-bold text-[11px] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)] text-white ring-2 ring-[var(--border-secondary)]"
            >
              {{ initials() }}
            </div>
          }
          <span
            class="w-2 h-2 bg-[var(--color-success)] rounded-full border border-[var(--bg-primary)] absolute -bottom-0.5 -right-0.5"
          ></span>
        </div>
      }
    </header>
  `,
})
export class SidebarHeaderComponent {
  user = input<User | null>(null);
  isMini = input<boolean>(false);
  isPinned = input<boolean>(false);
  isMobile = input<boolean>(false);
  workspaceName = input<string>('');

  searchOpen = output<void>();
  togglePin = output<void>();
  toggleMini = output<void>();
  closeMobile = output<void>();

  protected greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  protected displayName = computed(() => {
    const u = this.user();
    return u?.name?.trim() || 'User';
  });

  protected firstName = computed(() => {
    const name = this.displayName();
    return name.split(/\s+/)[0] || 'User';
  });

  protected initials = computed(() => {
    const name = this.displayName();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });
}
