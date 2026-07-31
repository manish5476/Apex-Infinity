import {
  Component,
  ViewEncapsulation,
  ElementRef,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  output,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ICellRendererAngularComp } from 'ag-grid-angular';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  CellConfig,
  CellInteractionEvent,
  CellInteractionType,
  MasterCellParams,
  SelectOption,
} from '../grid.types';
import { CommonMethodService } from '@core/utils/common-method.service';
import { MasterDropdownComponent } from '../../../components/masterFilterDropdown/master-dropdown.component';

@Component({
  selector: 'app-master-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TagModule,
    TooltipModule,
    MasterDropdownComponent,
  ],
  template: `
    <div
      class="mcell-root"
      [class.is-editing]="showEditor"
      [class.is-readonly]="config.readOnly"
      [class.is-negative]="isNegativeValue()"
      (click)="onViewClick($event)"
    >

      <!-- ════════════ EDITOR MODE ════════════ -->
      @if (showEditor) {
        @switch (config.type) {

          @case ('text') {
            <input pInputText class="mc-input"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
              [placeholder]="config.placeholder || ''" autocomplete="off" #focusTarget />
          }

          @case ('email') {
            <input pInputText type="email" class="mc-input"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
              [placeholder]="config.placeholder || 'email@example.com'" autocomplete="off" #focusTarget />
          }

          @case ('phone') {
            <input pInputText type="tel" class="mc-input"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
              [placeholder]="config.placeholder || '+91 00000 00000'" autocomplete="off" #focusTarget />
          }

          @case ('url') {
            <input pInputText type="url" class="mc-input"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
              [placeholder]="config.placeholder || 'https://'" autocomplete="off" #focusTarget />
          }

          @case ('number') {
            <p-inputNumber class="mc-input-number"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              mode="decimal"
              [minFractionDigits]="config.minFractionDigits ?? 0"
              [maxFractionDigits]="config.maxFractionDigits ?? 2"
              [min]="config.min ?? null" [max]="config.max ?? null"
              [useGrouping]="true" [placeholder]="config.placeholder || ''"
              (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
              (onKeyDown)="onKeydown($event)" #focusTarget />
          }

          @case ('currency') {
            <p-inputNumber class="mc-input-number"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              mode="currency"
              [currency]="config.currencyCode ?? 'INR'"
              [locale]="config.currencyLocale ?? 'en-IN'"
              [minFractionDigits]="config.minFractionDigits ?? 2"
              [min]="config.min ?? null" [max]="config.max ?? null"
              [placeholder]="config.placeholder || ''"
              (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
              (onKeyDown)="onKeydown($event)" #focusTarget />
          }

          @case ('date') {
            <p-datepicker class="mc-datepicker"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              appendTo="body"
              [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
              [showTime]="config.showTime ?? false"
              [showButtonBar]="true"
              [placeholder]="config.placeholder || 'Select date'"
              [panelStyleClass]="'mc-calendar-panel'"
              (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
              (onSelect)="onDraftChange($event)" #focusTarget />
          }

          @case ('select') {
            <p-select class="mc-select"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              [options]="config.options ?? []"
              [optionLabel]="config.optionLabel ?? 'label'"
              [optionValue]="config.optionValue ?? 'value'"
              appendTo="body"
              [filter]="(config.options?.length ?? 0) > 7"
              [showClear]="true"
              [placeholder]="config.placeholder || 'Select…'"
              [panelStyleClass]="'mc-dropdown-panel'"
              (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)" #focusTarget />
          }

          @case ('master-dropdown') {
            <app-master-dropdown class="mc-select"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              [endpoint]="config.endpoint!"
              [placeholder]="config.placeholder || 'Select…'"
              (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)" #focusTarget />
          }

          @case ('boolean') {
            <div class="mc-checkbox-wrap" (focusin)="onEditorFocus($event)" (focusout)="onBlur($event)">
              <p-checkbox [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
                [binary]="true" #focusTarget />
            </div>
          }

          @case ('textarea') {
            <textarea pTextarea class="mc-textarea"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
              [rows]="config.rows ?? 2" [placeholder]="config.placeholder || ''"
              autoResize="true" #focusTarget></textarea>
          }

          @default {
            <input pInputText class="mc-input"
              [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
              [placeholder]="config.placeholder || ''" autocomplete="off" #focusTarget />
          }
        }
      }

      <!-- ════════════ VIEW MODE ════════════ -->
      @if (!showEditor) {
        <div class="mcell-viewer">

          @switch (config.type) {

            @case ('text') {
              @if (value) {
                <span class="mcell-text" [title]="value">
                  {{ cm.truncateText(value, config.truncateAt ?? 50) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('number') {
              @if (value != null) {
                <span class="mcell-number">
                  {{ cm.formatNumber(value, config.maxFractionDigits ?? 2) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('currency') {
              @if (value != null) {
                <span class="mcell-currency" [class.is-negative]="value < 0">
                  <i class="mcell-currency-arrow pi" [class.pi-arrow-up-right]="value >= 0" [class.pi-arrow-down-right]="value < 0"></i>
                  {{ cm.formatCurrency(value) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('percent') {
              @if (value != null) {
                <div class="mcell-percent-wrap">
                  <span class="mcell-percent">{{ cm.formatPercent(value / 100, 1) }}</span>
                  <div class="mcell-pct-bar-track">
                    <div class="mcell-pct-bar-fill" [style.width.%]="cm.clamp(value, 0, 100)"></div>
                  </div>
                </div>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('date') {
              @if (value) {
                <span class="mcell-date"
                  [class.is-today]="cm.isToday(value)"
                  [class.is-overdue]="isOverdue()"
                  [pTooltip]="cm.timeAgoText(value)"
                  tooltipPosition="top">
                  <i class="pi pi-calendar mcell-icon"></i>
                  <span class="mcell-date-text">{{ cm.formatDate(value, config.dateFormat ?? 'dd MMM yyyy') }}</span>
                  @if (cm.isToday(value)) { <span class="mcell-today-badge">Today</span> }
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('datetime') {
              @if (value) {
                <span class="mcell-date" [pTooltip]="cm.timeAgoText(value)" tooltipPosition="top">
                  <i class="pi pi-clock mcell-icon"></i>
                  {{ cm.formatDateTime(value) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('timeago') {
              @if (value) {
                <span class="mcell-timeago" [pTooltip]="cm.formatDateTime(value)" tooltipPosition="top">
                  <i class="pi pi-history mcell-icon"></i>
                  {{ cm.timeAgoText(value) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('boolean') {
              <div class="mcell-bool">
                <span class="mcell-bool-chip" [class.is-true]="value" [class.is-false]="!value">
                  <i class="pi" [class.pi-check]="value" [class.pi-times]="!value"></i>
                  {{ value ? 'Yes' : 'No' }}
                </span>
              </div>
            }

            @case ('badge') {
              @if (value != null) {
                <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
                  <span class="mcell-badge-dot"></span>
                  {{ cm.toTitleCase(String(value)) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('select') {
              @if (value != null) {
                @if (config.selectAsBadge) {
                  <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
                    <span class="mcell-badge-dot"></span>
                    {{ getSelectLabel(value) }}
                  </span>
                } @else {
                  <span class="mcell-select-val">{{ getSelectLabel(value) }}</span>
                }
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('email') {
              @if (value) {
                <a class="mcell-link" [href]="'mailto:' + value"
                  (click)="onLinkClick($event, value)"
                  [pTooltip]="'Send email to ' + value" tooltipPosition="top">
                  <i class="pi pi-envelope mcell-icon"></i>
                  <span>{{ cm.truncateText(value, 28) }}</span>
                </a>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('phone') {
              @if (value) {
                <a class="mcell-link" [href]="'tel:' + value"
                  (click)="onLinkClick($event, value)"
                  [pTooltip]="'Call ' + cm.formatPhone(value)" tooltipPosition="top">
                  <i class="pi pi-phone mcell-icon"></i>
                  <span>{{ cm.formatPhone(value) }}</span>
                </a>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('url') {
              @if (value) {
                <a class="mcell-link mcell-url" [href]="value"
                  target="_blank" rel="noopener"
                  (click)="onLinkClick($event, value)"
                  [pTooltip]="value" tooltipPosition="top">
                  <i class="pi pi-external-link mcell-icon"></i>
                  <span>{{ cm.truncateText(value, 30) }}</span>
                </a>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('progress') {
              <div class="mcell-progress-wrap">
                <div class="mcell-progress-track">
                  <div class="mcell-progress-fill"
                    [style.width.%]="getProgressPct()"
                    [class.is-complete]="getProgressPct() >= 100"
                    [class.is-warning]="getProgressPct() >= 60 && getProgressPct() < 100"
                    [class.is-low]="getProgressPct() < 30">
                  </div>
                </div>
                @if (config.showValue !== false) {
                  <span class="mcell-progress-label" [class.is-complete]="getProgressPct() >= 100">
                    {{ getProgressPct() }}%
                  </span>
                }
              </div>
            }

            @case ('avatar') {
              <div class="mcell-avatar-wrap">
                @if (value && isImageUrl(value)) {
                  <div class="mcell-avatar"><img [src]="value" [alt]="getAvatarInitials()" loading="lazy" /></div>
                } @else {
                  <div class="mcell-avatar" [style.background]="getAvatarBg()" [style.color]="getAvatarColor()">
                    <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
                  </div>
                }
                @if (config.labelField) {
                  <span class="mcell-avatar-label">{{ params?.data?.[config.labelField] ?? '—' }}</span>
                }
              </div>
            }

            @case ('tags') {
              @if (asTags(value).length) {
                <div class="mcell-tags">
                  @for (tag of asTags(value).slice(0, config.maxTags ?? 3); track tag) {
                    <span class="mcell-tag">{{ tag }}</span>
                  }
                  @if (asTags(value).length > (config.maxTags ?? 3)) {
                    <span class="mcell-tag mcell-tag-more"
                      [pTooltip]="asTags(value).slice(config.maxTags ?? 3).join(', ')"
                      tooltipPosition="top">
                      +{{ asTags(value).length - (config.maxTags ?? 3) }}
                    </span>
                  }
                </div>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('color') {
              @if (value) {
                <div class="mcell-color">
                  <span class="mcell-color-swatch" [style.background]="value"></span>
                  <span class="mcell-color-label">{{ value }}</span>
                </div>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('filesize') {
              @if (value != null) {
                <span class="mcell-mono-chip">
                  <i class="pi pi-file mcell-icon"></i>
                  {{ cm.formatFileSize(value) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('duration') {
              @if (value != null) {
                <span class="mcell-mono-chip">
                  <i class="pi pi-clock mcell-icon"></i>
                  {{ cm.formatDuration(value) }}
                </span>
              } @else { <span class="mcell-empty">—</span> }
            }

            @case ('rating') {
              <div class="mcell-rating">
                @for (star of getRatingStars(); track $index) {
                  <i class="pi" [class.pi-star-fill]="star" [class.pi-star]="!star" [class.is-filled]="star"></i>
                }
                @if (config.showValue !== false) {
                  <span class="mcell-rating-val">{{ value }}</span>
                }
              </div>
            }

            @case ('initials') {
              <div class="mcell-initials-chip"
                [style.background]="getAvatarBg()"
                [style.color]="getAvatarColor()"
                [pTooltip]="value" tooltipPosition="top">
                {{ cm.getInitials(value ?? '') }}
              </div>
            }

            @case ('textarea') {
              <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
            }

            @default {
              <span class="mcell-text" [title]="value">
                {{ value != null ? cm.truncateText(String(value), 50) : '—' }}
              </span>
            }

          }
        </div>
      }

    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════════════════════════
       MASTER CELL — Complete Polished Styles
       Design System: Token-first, AG Grid–aware, Stripe/Linear grade
    ══════════════════════════════════════════════════════════════ */

    /*
      WHY CELLS WERE BREAKING — ROOT CAUSE ANALYSIS:
      ─────────────────────────────────────────────
      1. AG Grid wraps each cell in: .ag-cell > .ag-cell-wrapper > .ag-cell-value
         All three use display:flex + align-items:stretch by default.
         If the component host (app-master-cell) has display:block, it fills
         width but NOT height, causing vertical misalignment.
         FIX: host must be display:flex with height:100%.

      2. .mcell-root needs to be display:flex + align-items:center to vertically
         center content. Without this, children float to the top of the cell.

      3. Chips/badges inside flex containers stretch to fill height unless
         align-self:center + height:max-content is set explicitly.

      4. AG Grid cells have 0 padding by default — all internal spacing must
         come from the renderer, not the cell. We own the full cell box.
    */

    /* ── HOST: Bridge between AG Grid cell-value div and our root ── */
    app-master-cell {
      display: flex;          /* Critical: flex not block */
      align-items: stretch;   /* Inherit full cell height */
      width: 100%;
      height: 100%;
      overflow: hidden;       /* Prevent any overflow leaking into grid row */
    }

    /* ── ROOT CONTAINER ─────────────────────────────────────────── */
    .mcell-root {
      display: flex;
      align-items: center;     /* Vertical centering of all content */
      width: 100%;
      height: 100%;
      /* 
        Horizontal padding owns all spacing inside the cell.
        AG Grid row height 42px → we use 6px top/bottom via flex centering.
        Left/right padding: 10px to match header padding and feel balanced.
      */
      padding: 0 10px;
      box-sizing: border-box;
      overflow: hidden;
      transition: background 0.15s ease;
    }

    /* Editing state: subtle tinted background signals active field */
    .mcell-root.is-editing {
      background: color-mix(in srgb, var(--accent-primary) 5%, transparent 95%);
      padding: 0 6px; /* Tighter padding to give editor inputs more room */
    }

    /* Read-only: muted appearance + blocked interaction */
    .mcell-root.is-readonly .mcell-viewer {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── VIEWER SHELL ───────────────────────────────────────────── */
    /*
      This wraps all view-mode content. It must:
      - Fill width (flex:1) so text truncation works
      - Stay vertically centered (align-items:center)
      - Never overflow the cell (overflow:hidden)
    */
    .mcell-viewer {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;            /* Key: allows flex children to shrink+truncate */
      gap: 5px;
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      overflow: hidden;        /* Clips any runaway content */
    }

    /* ── SHARED ICON ────────────────────────────────────────────── */
    .mcell-icon {
      font-size: 11px;
      color: var(--text-tertiary);
      flex-shrink: 0;           /* Never squeeze the icon */
      line-height: 1;
    }

    /* ── EMPTY PLACEHOLDER ──────────────────────────────────────── */
    .mcell-empty {
      color: var(--text-disabled);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-normal);
      user-select: none;
      letter-spacing: 0.02em;
    }

    /* ── TEXT ───────────────────────────────────────────────────── */
    .mcell-text,
    .mcell-select-val {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;            /* Allows truncation inside flex parent */
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
      line-height: var(--line-height-tight);
    }

    /* ── MULTILINE (textarea viewer) ────────────────────────────── */
    .mcell-multiline {
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
      color: var(--text-secondary);
      font-weight: var(--font-weight-normal);
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-width: 0;
      /* Small vertical margin so text doesn't touch top/bottom borders */
      padding: 3px 0;
    }

    /* ── NUMBER / CURRENCY ──────────────────────────────────────── */
    .mcell-number,
    .mcell-currency {
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      letter-spacing: -0.03em;
      line-height: 1;
      white-space: nowrap;
    }
    .mcell-currency {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .mcell-currency-arrow {
      font-size: 10px;
      opacity: 0.5;
      flex-shrink: 0;
    }
    .mcell-currency.is-negative { color: var(--color-error); }

    /* ── PERCENT ────────────────────────────────────────────────── */
    .mcell-percent-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      min-width: 0;
    }
    .mcell-percent {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      white-space: nowrap;
      min-width: 34px;
      text-align: right;
    }
    .mcell-pct-bar-track {
      flex: 1;
      height: 4px;
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius-pill);
      overflow: hidden;
    }
    .mcell-pct-bar-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      transition: width 0.3s ease;
    }

    /* ── DATE / DATETIME / TIMEAGO ──────────────────────────────── */
    .mcell-date,
    .mcell-timeago {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      min-width: 0;
    }
    .mcell-date-text {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mcell-date.is-today { color: var(--accent-primary); font-weight: var(--font-weight-semibold); }
    .mcell-date.is-overdue { color: var(--color-error); }
    .mcell-today-badge {
      display: inline-flex;
      align-items: center;
      font-size: 9px;
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: var(--ui-border-radius-pill);
      background: color-mix(in srgb, var(--accent-primary) 12%, transparent 88%);
      color: var(--accent-primary);
      border: 1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent 75%);
      flex-shrink: 0;
      line-height: 1.4;
    }

    /* ── BOOLEAN CHIP ───────────────────────────────────────────── */
    /*
      CRITICAL FIX: Flex parent (.mcell-viewer) defaults to align-items:center.
      Without explicit height constraint, the chip tries to fill the cell height.
      Solution: align-self:center + height:max-content on the chip itself.
    */
    .mcell-bool {
      display: contents; /* Transparent wrapper — lets chip live directly in viewer flex */
    }
    .mcell-bool-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--ui-border-radius-pill);
      font-size: 11px;
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;
      border: 1px solid transparent;
      line-height: 1;
      /* Shape-lock: never stretch */
      width: max-content;
      height: max-content;
      align-self: center;
      flex-shrink: 0;
    }
    .mcell-bool-chip i { font-size: 9px; }

    .mcell-bool-chip.is-true {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-color: var(--color-success-border);
    }
    .mcell-bool-chip.is-false {
      background: var(--bg-ternary);
      color: var(--text-tertiary);
      border-color: var(--border-secondary);
    }

    /* ── BADGE ──────────────────────────────────────────────────── */
    /*
      Same shape-lock pattern as bool-chip.
      text-transform:uppercase + letter-spacing creates the "status label" feel.
    */
    .mcell-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: var(--ui-border-radius-pill);
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
      border: 1px solid var(--border-secondary);
      background: var(--bg-ternary);
      color: var(--text-tertiary);
      line-height: 1;
      /* Shape-lock */
      width: max-content;
      height: max-content;
      align-self: center;
      flex-shrink: 0;
    }
    .mcell-badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.75;
      flex-shrink: 0;
    }

    /* Semantic severity colors */
    .mcell-badge[data-sev="success"] {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-color: var(--color-success-border);
    }
    .mcell-badge[data-sev="warning"] {
      background: var(--color-warning-bg);
      color: var(--color-warning-dark);
      border-color: var(--color-warning-border);
    }
    .mcell-badge[data-sev="danger"] {
      background: var(--color-error-bg);
      color: var(--color-error-dark);
      border-color: var(--color-error-border);
    }
    .mcell-badge[data-sev="info"],
    .mcell-badge[data-sev="primary"] {
      background: var(--color-info-bg);
      color: var(--color-info-dark);
      border-color: var(--color-info-border);
    }

    /* ── AVATAR ─────────────────────────────────────────────────── */
    .mcell-avatar-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
      overflow: hidden;
      min-width: 0;
    }
    .mcell-avatar {
      /* Fixed dimensions — never stretch */
      width: 26px;
      height: 26px;
      flex: 0 0 26px;
      border-radius: 50%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 1.5px var(--border-primary);
    }
    .mcell-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .mcell-avatar-initials {
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.03em;
      text-transform: uppercase;
      line-height: 1;
    }
    .mcell-avatar-label {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    /* ── INITIALS CHIP ──────────────────────────────────────────── */
    .mcell-initials-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      flex: 0 0 26px;
      border-radius: 50%;
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      cursor: default;
    }

    /* ── PROGRESS ───────────────────────────────────────────────── */
    .mcell-progress-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
      width: 100%;
      min-width: 0;
    }
    .mcell-progress-track {
      flex: 1;
      min-width: 0;
      height: 5px;
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius-pill);
      overflow: hidden;
    }
    .mcell-progress-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      transition: width 0.3s ease;
    }
    .mcell-progress-fill.is-complete { background: var(--color-success); }
    .mcell-progress-fill.is-warning  { background: var(--color-warning); }
    .mcell-progress-fill.is-low      { background: var(--color-error); }
    .mcell-progress-label {
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      min-width: 32px;
      text-align: right;
      flex-shrink: 0;
    }
    .mcell-progress-label.is-complete { color: var(--color-success); }

    /* ── TAGS ───────────────────────────────────────────────────── */
    .mcell-tags {
      display: flex;
      align-items: center;
      gap: 3px;
      overflow: hidden;
      min-width: 0;
    }
    .mcell-tag {
      display: inline-flex;
      align-items: center;
      font-size: 11px;
      font-weight: var(--font-weight-semibold);
      padding: 2px 7px;
      border-radius: 4px;
      background: var(--bg-ternary);
      color: var(--text-secondary);
      white-space: nowrap;
      border: 1px solid var(--border-secondary);
      /* Shape-lock */
      flex-shrink: 0;
      height: max-content;
      align-self: center;
    }
    .mcell-tag-more {
      background: color-mix(in srgb, var(--accent-primary) 8%, transparent 92%);
      color: var(--accent-primary);
      border-color: color-mix(in srgb, var(--accent-primary) 20%, transparent 80%);
      cursor: default;
    }

    /* ── LINK (email, phone, url) ───────────────────────────────── */
    .mcell-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--accent-primary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      overflow: hidden;
      min-width: 0;
      transition: color 0.12s ease, opacity 0.12s ease;
    }
    .mcell-link:hover {
      color: var(--accent-hover);
      text-decoration: underline;
      opacity: 0.9;
    }
    .mcell-link span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── COLOR SWATCH ───────────────────────────────────────────── */
    .mcell-color {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .mcell-color-swatch {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      border-radius: 3px;
      border: 1px solid var(--border-primary);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
    }
    .mcell-color-label {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* ── MONO CHIP (filesize, duration) ─────────────────────────── */
    .mcell-mono-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* ── RATING ─────────────────────────────────────────────────── */
    .mcell-rating {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .mcell-rating .pi {
      font-size: 12px;
      color: var(--bg-ternary);
      transition: color 0.12s ease;
    }
    .mcell-rating .pi.is-filled { color: #f59e0b; }
    .mcell-rating-val {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-tertiary);
      margin-left: 4px;
    }

    /* ══════════════════════════════════════════════════════════════
       EDITOR INPUT FIELDS
       All editor inputs must fit within the 42px row height.
       Standard target: 30px height for inputs, leaving 6px top+bottom.
    ══════════════════════════════════════════════════════════════ */

    /* ── TEXT / EMAIL / PHONE / URL (native inputs via pInputText) ── */
    .mc-input {
      width: 100%;
      height: 30px;
      padding: 0 8px;
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: 1.5px solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
      /* Prevent any overflow out of cell */
      min-width: 0;
    }
    .mc-input::placeholder {
      color: var(--text-disabled);
      font-weight: var(--font-weight-normal);
    }
    .mc-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 18%, transparent 82%);
    }

    /* ── NUMBER / CURRENCY (p-inputNumber wrapper) ──────────────── */
    .mc-input-number {
      width: 100%;
      display: block;
    }
    /* Target the inner <input> PrimeNG generates */
    .mc-input-number .p-inputnumber-input {
      width: 100% !important;
      height: 30px;
      padding: 0 8px;
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: 1.5px solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-sm) !important;
      outline: none !important;
      box-sizing: border-box;
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
    }
    .mc-input-number .p-inputnumber-input:focus {
      border-color: var(--accent-primary) !important;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 18%, transparent 82%) !important;
    }
    /* Hide PrimeNG's default spin buttons — AG Grid rows are too small for them */
    .mc-input-number .p-inputnumber-button-group { display: none; }

    /* ── SELECT (p-select) ──────────────────────────────────────── */
    .mc-select {
      width: 100%;
    }
    .mc-select .p-select-label {
      height: 30px;
      padding: 0 8px;
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: 1.5px solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-sm) !important;
      display: flex;
      align-items: center;
      outline: none;
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
    }
    .mc-select.p-focus .p-select-label,
    .mc-select .p-select-label:focus {
      border-color: var(--accent-primary) !important;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 18%, transparent 82%) !important;
    }
    /* Dropdown panel (appended to body) */
    .mc-dropdown-panel .p-select-list {
      font-size: var(--font-size-sm);
      padding: 4px;
    }
    .mc-dropdown-panel .p-select-option {
      border-radius: 4px;
      padding: 6px 8px;
      font-size: var(--font-size-sm);
    }

    /* ── DATE PICKER (p-datepicker) ─────────────────────────────── */
    .mc-datepicker {
      width: 100%;
    }
    .mc-datepicker .p-datepicker-input {
      height: 30px;
      padding: 0 8px;
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: 1.5px solid var(--border-primary) !important;
      border-radius: var(--ui-border-radius-sm) !important;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
    }
    .mc-datepicker .p-datepicker-input:focus {
      border-color: var(--accent-primary) !important;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 18%, transparent 82%) !important;
    }
    .mc-calendar-panel {
      font-size: var(--font-size-sm);
      border-radius: var(--ui-border-radius);
      box-shadow: var(--shadow-xl);
    }

    /* ── CHECKBOX (p-checkbox) ──────────────────────────────────── */
    .mc-checkbox-wrap {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      height: 100%;
    }
    .mc-checkbox-wrap .p-checkbox-box {
      width: 18px !important;
      height: 18px !important;
      border-radius: 4px !important;
    }

    /* ── TEXTAREA ───────────────────────────────────────────────── */
    .mc-textarea {
      width: 100%;
      min-height: 30px;
      padding: 4px 8px;
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: 1.5px solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
      outline: none;
      resize: vertical;
      box-sizing: border-box;
      line-height: var(--line-height-normal);
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
    }
    .mc-textarea:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-primary) 18%, transparent 82%);
    }
    .mc-textarea::placeholder {
      color: var(--text-disabled);
    }
  `]
})
export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

  private readonly el = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly cm = inject(CommonMethodService);
  readonly String = String;

  readonly cellInteraction = output<CellInteractionEvent>();

  params!: any;
  config: CellConfig = { type: 'text' };
  value: any;
  draftValue: any;

  get showEditor(): boolean {
    if (this.config.readOnly) return false;
    if (this.config.alwaysEditable) return true;
    return this.isRowEditing();
  }

  private isRowEditing(): boolean {
    try {
      const parent = this.params?.context?.componentParent;
      return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
    } catch { return false; }
  }

  isNegativeValue(): boolean {
    return (this.config.type === 'currency' || this.config.type === 'number')
      ? Number(this.value) < 0 : false;
  }

  isOverdue(): boolean {
    if (!this.value || this.config.type !== 'date') return false;
    return this.cm.isPast(this.value) && !this.cm.isToday(this.value);
  }

  /* ── AG GRID LIFECYCLE ───────────────────────────────── */
  agInit(params: any): void {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
    this.draftValue = params.value;
  }

  refresh(params: any): boolean {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
    if (!this.isRowEditing() && !this.config.alwaysEditable) {
      this.draftValue = params.value;
    }
    this.cdr.markForCheck();
    return true;
  }

  afterGuiAttached(): void {
    if (this.showEditor) this.focusEditor();
  }

  ngOnDestroy(): void { }

  /* ── FOCUS — microtask pattern ───────────────────────── */
  private focusEditor(): void {
    Promise.resolve().then(() => {
      const host = this.el.nativeElement as HTMLElement;
      const target =
        host.querySelector<HTMLElement>('input:not([type="hidden"]), textarea') ??
        host.querySelector<HTMLElement>('.p-select .p-select-label, .p-checkbox-box, [tabindex="0"]');
      if (!target) return;

      const agCell = host.closest<HTMLElement>('.ag-cell');
      if (agCell) agCell.classList.add('ag-cell-inline-editing');

      target.focus({ preventScroll: false });

      if (target instanceof HTMLInputElement && ['text', 'email', 'tel', 'url'].includes(target.type)) {
        target.select();
      }
    });
  }

  /* ── EDITOR EVENTS ───────────────────────────────────── */
  onDraftChange(val: any): void {
    this.draftValue = val;
    const parent = this.params?.context?.componentParent;
    const id = this.params?.node?.id;
    const field = this.params?.colDef?.field;
    if (parent && id && field) parent.updateDraft(id, field, val);
    this.emit('change', null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.config.enterToSave === true) {
        event.preventDefault();
        event.stopPropagation();
        this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
      }
      this.emit('enter', event);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.params?.context?.componentParent?.handleRowAction('cancel', this.params.data);
      this.emit('escape', event);
    }
  }

  onEditorFocus(event: Event | null | undefined): void { this.emit('focus', event ?? null); }
  onBlur(event: Event | null | undefined): void {
    this.emit('blur', event ?? null);
    if (this.config.alwaysEditable && this.config.enterToSave) {
      this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
    }
  }
  onViewClick(event: MouseEvent): void { if (!this.showEditor) this.emit('click', event); }
  onLinkClick(event: MouseEvent, _value: any): void {
    event.stopPropagation();
    this.emit('linkClick', event);
  }

  private emit(type: CellInteractionType, nativeEvent: Event | null): void {
    if (this.config.emitEvents === false) return;
    const event: CellInteractionEvent = {
      interactionType: type,
      cellType: this.config.type,
      value: this.value,
      draftValue: this.draftValue,
      field: this.params?.colDef?.field ?? '',
      rowId: this.params?.node?.id ?? '',
      rowData: this.params?.data ?? null,
      nativeEvent,
    };
    this.cellInteraction.emit(event);
    const parent = this.params?.context?.componentParent;
    if (parent && typeof parent.onCellInteraction === 'function') {
      parent.onCellInteraction(event);
    }
  }

  /* ── VIEW HELPERS ────────────────────────────────────── */
  getSelectLabel(value: any): string {
    if (!this.config.options) return value ?? '—';
    const opt = this.config.options.find(
      (o) => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
    );
    return opt?.label ?? value ?? '—';
  }

  getBadgeSeverity(value: any): string {
    if (this.config.badgeMap) {
      const sev = this.config.badgeMap[String(value)];
      if (sev) return sev;
    }
    const severity = this.cm.mapStatusToSeverity(String(value ?? ''));
    if (severity === 'warn') return 'warning';
    return severity ?? 'secondary';
  }

  getProgressPct(): number {
    return this.cm.clamp(
      Math.round(((this.value ?? 0) / (this.config.max ?? 100)) * 100),
      0, 100
    );
  }

  getAvatarInitials(): string {
    const field = this.config.labelField;
    const name = field ? this.params?.data?.[field] : (this.params?.data?.name ?? this.value);
    return this.cm.getInitials(name ?? '') || '?';
  }

  getAvatarBg(): string {
    const field = this.config.labelField;
    const name = field ? this.params?.data?.[field] : (this.params?.data?.name ?? this.value ?? '');
    return this.cm.stringToColor(String(name));
  }

  getAvatarColor(): string { return this.cm.getContrastColor(this.getAvatarBg()); }

  isImageUrl(val: any): boolean {
    return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
  }

  asTags(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    return String(val).split(',').map((s) => s.trim()).filter(Boolean);
  }

  getRatingStars(): boolean[] {
    const max = this.config.max ?? 5;
    const filled = Math.round(Number(this.value) || 0);
    return Array.from({ length: max }, (_, i) => i < filled);
  }
}