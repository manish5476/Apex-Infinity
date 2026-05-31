/**
 * AvatarNameRendererComponent
 * ─────────────────────────────────────────────────────────────────────────────
 * A rich AG Grid cell renderer that shows:
 *  • A circular avatar (image or initials fallback with seeded colour)
 *  • An optional online/offline/away status dot
 *  • Primary label (name) + optional sub-label (e.g. employee id, role)
 *
 * USAGE — in your ColDef:
 * ─────────────────────────────────────────────────────────────────────────────
 *  {
 *    headerName: 'Name',
 *    field: 'name',
 *    minWidth: 220,
 *    cellRenderer: 'AvatarNameRenderer',
 *    cellRendererParams: {
 *      // All params are optional — omit what you don't need
 *
 *      // Where to read the avatar URL from the row data
 *      avatarField: 'avatarUrl',          // default: 'avatarUrl'
 *
 *      // Sub-label shown in muted text below the name
 *      subLabelField: 'email',            // default: undefined → no sub-label
 *
 *      // Status dot: field in row data that holds 'online' | 'offline' | 'away'
 *      statusField: 'status',             // default: undefined → no dot shown
 *
 *      // Override the primary label field (defaults to the column's own `field`)
 *      labelField: 'fullName',
 *
 *      // Avatar size in px (default: 32)
 *      avatarSize: 36,
 *    } satisfies AvatarNameRendererParams,
 *  }
 *
 * REGISTER in your AgShareGrid component registry:
 * ─────────────────────────────────────────────────────────────────────────────
 *  readonly components = { UnifiedActionRenderer, AvatarNameRenderer };
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  signal,
  OnInit,
} from '@angular/core';

import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ICellRendererParams } from 'ag-grid-community';

/* ── Public param contract ──────────────────────────────────────────────── */
export interface AvatarNameRendererParams {
  /** Row field holding the avatar image URL. Default: 'avatarUrl' */
  avatarField?: string;
  /** Row field holding the sub-label (e.g. email, role). Optional. */
  subLabelField?: string;
  /** Row field holding status string: 'online' | 'offline' | 'away'. Optional. */
  statusField?: string;
  /** Override which field is the primary label. Defaults to colDef.field. */
  labelField?: string;
  /** Avatar circle diameter in px. Default: 32. */
  avatarSize?: number;
}

type FullParams = ICellRendererParams & AvatarNameRendererParams;

/* ── Seeded colour palette for initials fallbacks ───────────────────────── */
const AVATAR_PALETTE = [
  { bg: '#e8e4fb', text: '#5b4fcf' },
  { bg: '#d6f0ff', text: '#1a6fa8' },
  { bg: '#d9f7e8', text: '#1a7a4a' },
  { bg: '#fde8d8', text: '#b8511a' },
  { bg: '#fce4f1', text: '#a83070' },
  { bg: '#fff3cd', text: '#9a6800' },
  { bg: '#e2f0d9', text: '#3d6e24' },
  { bg: '#e0f4f4', text: '#1a7272' },
];

function seedColour(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── Status dot colours ─────────────────────────────────────────────────── */
const STATUS_COLOUR: Record<string, string> = {
  online:  '#22c55e',
  offline: '#94a3b8',
  away:    '#f59e0b',
  busy:    '#ef4444',
};

/* ── Component ──────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-avatar-name-renderer',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="anr-cell">
      <!-- Avatar -->
      <div
        class="anr-avatar"
        [style.width.px]="size()"
        [style.height.px]="size()"
        [style.background]="avatarUrl() ? 'transparent' : colour().bg"
        [style.color]="colour().text"
        [style.fontSize.px]="size() * 0.35"
      >
        @if (avatarUrl()) {
          <img
            [src]="avatarUrl()"
            [alt]="label()"
            (error)="onImgError()"
            [style.width.px]="size()"
            [style.height.px]="size()"
          />
        } @else {
          {{ initials() }}
        }

        <!-- Status dot -->
        @if (statusColour()) {
          <span
            class="anr-dot"
            [style.background]="statusColour()"
            [style.width.px]="size() * 0.30"
            [style.height.px]="size() * 0.30"
            [style.bottom.px]="0"
            [style.right.px]="0"
          ></span>
        }
      </div>

      <!-- Text -->
      <div class="anr-text">
        <span class="anr-label">{{ label() }}</span>
        @if (subLabel()) {
          <span class="anr-sub">{{ subLabel() }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .anr-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 100%;
      padding: 0 2px;
    }

    .anr-avatar {
      position: relative;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      letter-spacing: 0.02em;
      overflow: visible; /* dot clips outside circle */

      img {
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }
    }

    .anr-dot {
      position: absolute;
      border-radius: 50%;
      border: 2px solid var(--theme-bg-primary, #fff);
      box-sizing: content-box;
    }

    .anr-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0; /* allow text truncation inside flex */
    }

    .anr-label {
      font-size: var(--font-size-sm, 0.75rem);
      font-weight: 500;
      color: var(--theme-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .anr-sub {
      font-size: var(--font-size-xs, 0.65rem);
      color: var(--theme-text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class AvatarNameRendererComponent implements ICellRendererAngularComp, OnInit {
  /* signals */
  readonly label      = signal('');
  readonly subLabel   = signal('');
  readonly avatarUrl  = signal('');
  readonly initials   = signal('');
  readonly colour     = signal(AVATAR_PALETTE[0]);
  readonly statusColour = signal('');
  readonly size       = signal(32);

  private params!: FullParams;

  agInit(params: FullParams): void {
    this.params = params;
    this.refresh(params);
  }

  ngOnInit(): void {}

  refresh(params: FullParams): boolean {
    const row = params.data ?? {};
    const labelField = params.labelField ?? params.colDef?.field ?? 'name';
    const name  = String(row[labelField] ?? params.value ?? '');
    const sub   = params.subLabelField ? String(row[params.subLabelField] ?? '') : '';
    const url   = params.avatarField   ? String(row[params.avatarField]   ?? '') : '';
    const status = params.statusField  ? String(row[params.statusField]   ?? '').toLowerCase() : '';

    this.label.set(name);
    this.subLabel.set(sub);
    this.avatarUrl.set(url);
    this.initials.set(initials(name));
    this.colour.set(seedColour(name));
    this.size.set(params.avatarSize ?? 32);
    this.statusColour.set(STATUS_COLOUR[status] ?? '');
    return true;
  }

  onImgError(): void {
    this.avatarUrl.set(''); // fall back to initials
  }
}
