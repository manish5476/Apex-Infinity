import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { IconBtnComponent } from '../../../../shared/ui/buttons/icon-btn/icon-btn.component';
export interface SidebarUser {
  name?: string;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
  employeeProfile?: { designation?: string; employeeId?: string };
}
@Component({
  selector: 'app-sidebar-profile',
  standalone: true,
  imports: [AvatarModule, TooltipModule, IconBtnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="flex-shrink-0 px-3 pb-4 pt-2" aria-label="User profile">
      <div
        class="flex items-center gap-3.5 px-3 py-2 h-[48px] rounded-[20px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-300 cursor-pointer"
        [class.justify-center]="isMini()"
      >
        <!-- Avatar -->
        <p-avatar
          [label]="initials()"
          shape="circle"
          [pTooltip]="isMini() ? displayName() : ''"
          tooltipPosition="right"
          [style]="{
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            width: '28px',
            height: '28px',
            fontSize: '11px',
            fontWeight: '700',
            flexShrink: '0',
            userSelect: 'none'
          }"
        />

        @if (!isMini()) {
          <div class="flex-1 min-w-0 flex items-center justify-between">
            <div class="flex flex-col min-w-0">
              <span class="text-[14px] font-[var(--font-weight-semibold)] tracking-tight text-[var(--text-primary)] truncate">
                {{ displayName() }}
              </span>
            </div>
            
            <app-icon-btn
              icon="pi pi-sign-out"
              tooltip="Sign out"
              tooltipPosition="top"
              (clicked)="signOut.emit()"
            />
          </div>
        }
      </div>
    </footer>
  `,
})
export class SidebarProfileComponent {
  user = input<SidebarUser | null>(null);
  isMini = input<boolean>(false);
  signOut = output<void>();

  protected displayName = computed(() => this.user()?.name?.trim() || 'User');
  protected initials = computed(() =>
    this.displayName().split(' ').filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
  );
}

// import {
//   ChangeDetectionStrategy,
//   Component,
//   computed,
//   input,
//   output,
// } from '@angular/core';
// import { AvatarModule } from 'primeng/avatar';
// import { TooltipModule } from 'primeng/tooltip';
// import { IconBtnComponent } from '../../../../shared/ui/buttons/icon-btn/icon-btn.component';

// /** Minimal user shape required by the profile footer. */
// export interface SidebarUser {
//   name?: string;
//   isOwner?: boolean;
//   isSuperAdmin?: boolean;
//   employeeProfile?: { designation?: string; employeeId?: string };
// }

// /**
//  * SidebarProfileComponent
//  *
//  * Renders the user identity footer:
//  *   • PrimeNG Avatar with initials (accent-coloured ring)
//  *   • Display name + resolved role string
//  *   • Sign-out icon button
//  *
//  * In mini mode: shows only the avatar (with full-name tooltip).
//  */
// @Component({
//   selector: 'app-sidebar-profile',
//   standalone: true,
//   imports: [AvatarModule, TooltipModule, IconBtnComponent],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   template: `
//     <footer
//       class="flex-shrink-0 border-t border-[var(--border-primary)] p-1.5"
//       aria-label="User profile"
//     >
//       <div
//         class="flex items-center gap-2.5 px-2 py-1 h-[36px] rounded-lg hover:bg-[var(--component-bg-hover)] transition-colors duration-[180ms]"
//         [class.justify-center]="isMini()"
//       >
//         <!-- Avatar -->
//         <p-avatar
//           [label]="initials()"
//           shape="circle"
//           [pTooltip]="isMini() ? displayName() : ''"
//           tooltipPosition="right"
//           [style]="{
//             background: 'var(--accent-focus)',
//             color: 'var(--accent-primary)',
//             width: '24px',
//             height: '24px',
//             fontSize: '10px',
//             fontWeight: '600',
//             flexShrink: '0',
//             cursor: 'default',
//             userSelect: 'none'
//           }"
//           [attr.aria-label]="displayName()"
//         />

//         <!-- Name + role (hidden in mini mode) -->
//         @if (!isMini()) {
//           <div class="flex-1 min-w-0 flex items-center justify-between">
//             <div class="flex items-baseline gap-1.5 truncate">
//               <span class="text-[13px] font-[var(--font-weight-semibold)] text-[var(--text-primary)] truncate">
//                 {{ displayName() }}
//               </span>
//               <span class="text-[11px] text-[var(--text-muted)] truncate font-[var(--font-weight-normal)]">
//                 {{ role() }}
//               </span>
//             </div>
//           </div>

//           <!-- Sign out -->
//           <app-icon-btn
//             icon="pi pi-sign-out"
//             tooltip="Sign out"
//             tooltipPosition="top"
//             ariaLabel="Sign out of your account"
//             (clicked)="signOut.emit()"
//           />
//         }
//       </div>
//     </footer>
//   `,
// })
// export class SidebarProfileComponent {
//   user = input<SidebarUser | null>(null);
//   isMini = input<boolean>(false);

//   signOut = output<void>();

//   protected displayName = computed((): string => {
//     const u = this.user();
//     return u?.name?.trim() || 'User';
//   });

//   protected initials = computed((): string => {
//     return this.displayName()
//       .split(' ')
//       .filter(Boolean)
//       .slice(0, 2)
//       .map(w => w.charAt(0).toUpperCase())
//       .join('');
//   });

//   protected role = computed((): string => {
//     const u = this.user();
//     if (!u) return '';
//     if (u.isOwner) return 'Owner';
//     if (u.isSuperAdmin) return 'Super Admin';
//     if (u.employeeProfile?.designation) return u.employeeProfile.designation;
//     if (u.employeeProfile?.employeeId) return `EMP-${u.employeeProfile.employeeId}`;
//     return 'Employee';
//   });
// }


