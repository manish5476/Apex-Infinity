import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconBtnComponent } from '../../../../shared/ui/buttons/icon-btn/icon-btn.component';

/**
 * SidebarHeaderComponent
 *
 * Renders the brand mark, workspace name, search trigger,
 * mini-mode toggle, pin button (desktop only), and close button (mobile only).
 *
 * All state mutations are emitted upward — this component is purely presentational.
 */
@Component({
  selector: 'app-sidebar-header',
  standalone: true,
  imports: [IconBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex items-center h-[56px] px-3.5 flex-shrink-0 border-b border-[var(--border-primary)]"
      [class.justify-center]="isMini()"
      [class.justify-between]="!isMini()"
    >
      <!-- ── Brand ─────────────────────────────────────────── -->
      <div
        class="flex items-center gap-2.5 min-w-0 flex-1 cursor-default"
        [class.flex-1]="!isMini()"
        [class.flex-none]="isMini()"
      >
        <!-- Logo mark -->
        <div class="w-7 h-7 flex-shrink-0 rounded-[8px] flex items-center justify-center
                    bg-[var(--accent-primary)] text-white shadow-sm font-semibold text-[13px] tracking-tight">
          <svg viewBox="0 0 32 32" fill="none" class="w-[14px] h-[14px]" aria-hidden="true">
            <path d="M4 28L16 4L28 28" stroke="currentColor" stroke-width="3"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 20.5L23 20.5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Name + workspace (hidden in mini mode) -->
        @if (!isMini()) {
          <div class="flex flex-col min-w-0 select-none">
            <span class="text-[13px] font-[var(--font-weight-semibold)]
                         text-[var(--text-primary)] tracking-tight leading-[1.2] truncate">
              Apex
              <span class="text-[var(--text-tertiary)] font-normal">Infinity</span>
            </span>
            @if (workspaceName()) {
              <span class="text-[10px] leading-[1.2] text-[var(--text-muted)] truncate mt-[1px]">
                {{ workspaceName() }}
              </span>
            }
          </div>
        }
      </div>

      <!-- ── Header actions (hidden in mini — collapse button rendered separately) ── -->
      @if (!isMini()) {
        <div class="flex items-center gap-1 flex-shrink-0">

          <!-- Search -->
          @if (!isMobile()) {
            <app-icon-btn
              icon="pi pi-search"
              tooltip="Search (Ctrl+K)"
              ariaLabel="Open spotlight search"
              (clicked)="searchOpen.emit()"
            />
          }

          <!-- Pin toggle (desktop only) -->
          @if (!isMobile()) {
            <app-icon-btn
              icon="pi pi-thumbtack"
              [tooltip]="isPinned() ? 'Unpin sidebar' : 'Pin sidebar'"
              ariaLabel="Toggle sidebar pin"
              [active]="isPinned()"
              (clicked)="togglePin.emit()"
            />
          }

          <!-- Collapse to mini (desktop only) -->
          @if (!isMobile()) {
            <app-icon-btn
              icon="pi pi-angle-double-left"
              tooltip="Collapse sidebar"
              ariaLabel="Collapse sidebar to icon mode"
              (clicked)="toggleMini.emit()"
            />
          }

          <!-- Mobile: close button -->
          @if (isMobile()) {
            <app-icon-btn
              icon="pi pi-times"
              tooltip="Close menu"
              ariaLabel="Close navigation menu"
              (clicked)="closeMobile.emit()"
            />
          }
        </div>
      } @else {
        <!-- Mini mode: only expand button -->
        <app-icon-btn
          icon="pi pi-angle-double-right"
          tooltip="Expand sidebar"
          tooltipPosition="right"
          ariaLabel="Expand sidebar"
          (clicked)="toggleMini.emit()"
        />
      }
    </header>
  `,
})
export class SidebarHeaderComponent {
  isMini = input<boolean>(false);
  isPinned = input<boolean>(false);
  isMobile = input<boolean>(false);
  workspaceName = input<string>('');

  searchOpen = output<void>();
  togglePin = output<void>();
  toggleMini = output<void>();
  closeMobile = output<void>();
}

