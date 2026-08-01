import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { IconBtnComponent } from '../../../../shared/ui/buttons/icon-btn/icon-btn.component';

/** Minimal user shape required by the profile footer. */
export interface SidebarUser {
  name?: string;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
  employeeProfile?: { designation?: string; employeeId?: string };
}

/**
 * SidebarProfileComponent
 *
 * Renders the user identity footer:
 *   • PrimeNG Avatar with initials (accent-coloured ring)
 *   • Display name + resolved role string
 *   • Sign-out icon button
 *
 * In mini mode: shows only the avatar (with full-name tooltip).
 */
@Component({
  selector: 'app-sidebar-profile',
  standalone: true,
  imports: [AvatarModule, TooltipModule, IconBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer
      class="flex-shrink-0 border-t border-[var(--border-primary)] p-2.5"
      aria-label="User profile"
    >
      <div
        class="flex items-center gap-2.5 px-2 py-1.5 rounded-[10px] hover:bg-[var(--component-bg-hover)] transition-colors duration-[180ms]"
        [class.justify-center]="isMini()"
      >
        <!-- Avatar -->
        <p-avatar
          [label]="initials()"
          shape="circle"
          [pTooltip]="isMini() ? displayName() : ''"
          tooltipPosition="right"
          [style]="{
            background: 'var(--accent-focus)',
            color: 'var(--accent-primary)',
            width: '32px',
            height: '32px',
            fontSize: '11px',
            fontWeight: '600',
            flexShrink: '0',
            cursor: 'default',
            userSelect: 'none'
          }"
          [attr.aria-label]="displayName()"
        />

        <!-- Name + role (hidden in mini mode) -->
        @if (!isMini()) {
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-[var(--font-weight-semibold)]
                      text-[var(--text-primary)] m-0 truncate leading-tight select-none">
              {{ displayName() }}
            </p>
            <p class="text-[11px] text-[var(--text-muted)] m-0 truncate leading-tight
                      mt-[2px] select-none font-[var(--font-weight-normal)]">
              {{ role() }}
            </p>
          </div>

          <!-- Sign out -->
          <app-icon-btn
            icon="pi pi-sign-out"
            tooltip="Sign out"
            tooltipPosition="top"
            ariaLabel="Sign out of your account"
            (clicked)="signOut.emit()"
          />
        }
      </div>
    </footer>
  `,
})
export class SidebarProfileComponent {
  user = input<SidebarUser | null>(null);
  isMini = input<boolean>(false);

  signOut = output<void>();

  protected displayName = computed((): string => {
    const u = this.user();
    return u?.name?.trim() || 'User';
  });

  protected initials = computed((): string => {
    return this.displayName()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w.charAt(0).toUpperCase())
      .join('');
  });

  protected role = computed((): string => {
    const u = this.user();
    if (!u) return '';
    if (u.isOwner) return 'Owner';
    if (u.isSuperAdmin) return 'Super Admin';
    if (u.employeeProfile?.designation) return u.employeeProfile.designation;
    if (u.employeeProfile?.employeeId) return `EMP-${u.employeeProfile.employeeId}`;
    return 'Employee';
  });
}


