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

// PrimeNG v18/19 imports
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


/* ==========================================================================
   MASTER CELL COMPONENT  v2.1

   TAB FOCUS FIX applied:
   - focusEditor() now uses Promise.resolve() microtask instead of
     requestAnimationFrame + setTimeout(40ms).
   - Microtask fires BEFORE the browser paints the next frame, eliminating
     the flash where the AG Grid cell wrapper <div> appears focused.
   - agCell.classList.add('ag-cell-inline-editing') prevents AG Grid from
     stealing focus back when it detects the focusin event.

   Tab navigation is handled by tabToNextCell() in AppSharedGrid.
   ========================================================================== */
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
    TooltipModule
],
  template: `
    <div
      class="mcell-root"
      [class.is-editing]="showEditor"
      [class.is-readonly]="config.readOnly"
      [class.is-negative]="isNegativeValue()"
      (click)="onViewClick($event)"
    >

      <!-- ════════════════════════════════════════════════
           EDITOR MODE
           Shown when: (row is editing OR alwaysEditable) AND NOT readOnly
      ════════════════════════════════════════════════ -->
      @if (showEditor) {

        @switch (config.type) {

          <!-- TEXT -->
          @case ('text') {
            <input
              pInputText
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || ''"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- EMAIL -->
          @case ('email') {
            <input
              pInputText
              type="email"
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || 'email@example.com'"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- PHONE -->
          @case ('phone') {
            <input
              pInputText
              type="tel"
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || '+91 00000 00000'"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- URL -->
          @case ('url') {
            <input
              pInputText
              type="url"
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || 'https://'"
              autocomplete="off"
              #focusTarget
            />
          }

          <!-- NUMBER -->
          @case ('number') {
            <p-inputNumber
              class="mc-input-number"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              mode="decimal"
              [minFractionDigits]="config.minFractionDigits ?? 0"
              [maxFractionDigits]="config.maxFractionDigits ?? 2"
              [min]="config.min ?? null"
              [max]="config.max ?? null"
              [useGrouping]="true"
              [placeholder]="config.placeholder || ''"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              (onKeyDown)="onKeydown($event)"
              #focusTarget
            />
          }

          <!-- CURRENCY -->
          @case ('currency') {
            <p-inputNumber
              class="mc-input-number"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              mode="currency"
              [currency]="config.currencyCode ?? 'INR'"
              [locale]="config.currencyLocale ?? 'en-IN'"
              [minFractionDigits]="config.minFractionDigits ?? 2"
              [min]="config.min ?? null"
              [max]="config.max ?? null"
              [placeholder]="config.placeholder || ''"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              (onKeyDown)="onKeydown($event)"
              #focusTarget
            />
          }

          <!-- DATE -->
          @case ('date') {
            <p-datepicker
              class="mc-datepicker"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              appendTo="body"
              [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
              [showTime]="config.showTime ?? false"
              [showButtonBar]="true"
              [placeholder]="config.placeholder || 'Select date'"
              [panelStyleClass]="'mc-calendar-panel'"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              (onSelect)="onDraftChange($event)"
              #focusTarget
            />
          }

          <!-- SELECT -->
          @case ('select') {
            <p-select
              class="mc-select"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              [options]="config.options ?? []"
              [optionLabel]="config.optionLabel ?? 'label'"
              [optionValue]="config.optionValue ?? 'value'"
              appendTo="body"
              [filter]="(config.options?.length ?? 0) > 7"
              [showClear]="true"
              [placeholder]="config.placeholder || 'Select…'"
              [panelStyleClass]="'mc-dropdown-panel'"
              (onFocus)="onEditorFocus($event)"
              (onBlur)="onBlur($event)"
              #focusTarget
            />
          }

          <!-- BOOLEAN / CHECKBOX -->
          @case ('boolean') {
            <div
              class="mc-checkbox-wrap"
              (focusin)="onEditorFocus($event)"
              (focusout)="onBlur($event)"
            >
              <p-checkbox
                [ngModel]="draftValue"
                (ngModelChange)="onDraftChange($event)"
                [binary]="true"
                #focusTarget
              />
            </div>
          }

          <!-- TEXTAREA -->
          @case ('textarea') {
            <textarea
              pTextarea
              class="mc-textarea"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [rows]="config.rows ?? 2"
              [placeholder]="config.placeholder || ''"
              autoResize="true"
              #focusTarget
            ></textarea>
          }

          <!-- FALLBACK -->
          @default {
            <input
              pInputText
              class="mc-input"
              [ngModel]="draftValue"
              (ngModelChange)="onDraftChange($event)"
              (keydown)="onKeydown($event)"
              (focus)="onEditorFocus($event)"
              (blur)="onBlur($event)"
              [placeholder]="config.placeholder || ''"
              autocomplete="off"
              #focusTarget
            />
          }
        }
      }

      <!-- ════════════════════════════════════════════════
           VIEW MODE
           Shown when: not editing, OR readOnly=true
      ════════════════════════════════════════════════ -->
      @if (!showEditor) {

        <div class="mcell-viewer">
          @switch (config.type) {

            <!-- TEXT -->
            @case ('text') {
              @if (value) {
                <span class="mcell-text" [title]="value">
                  {{ cm.truncateText(value, config.truncateAt ?? 50) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- NUMBER -->
            @case ('number') {
              @if (value != null) {
                <span class="mcell-number">
                  {{ cm.formatNumber(value, config.maxFractionDigits ?? 2) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- CURRENCY -->
            @case ('currency') {
              @if (value != null) {
                <span class="mcell-currency" [class.is-negative]="value < 0">
                  <span class="mcell-currency-arrow">{{ value < 0 ? '▼' : '▲' }}</span>
                  {{ cm.formatCurrency(value) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- PERCENT -->
            @case ('percent') {
              @if (value != null) {
                <span class="mcell-percent">
                  {{ cm.formatPercent(value / 100, 1) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- DATE -->
            @case ('date') {
              @if (value) {
                <span
                  class="mcell-date"
                  [class.is-today]="cm.isToday(value)"
                  [class.is-overdue]="isOverdue()"
                  [pTooltip]="cm.timeAgoText(value)"
                  tooltipPosition="top"
                >
                  <i class="pi pi-calendar mcell-meta-icon"></i>
                  <span class="mcell-date-text">
                    {{ cm.formatDate(value, config.dateFormat ?? 'dd MMM yyyy') }}
                  </span>
                  @if (cm.isToday(value)) {
                    <span class="mcell-today-dot"></span>
                  }
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- DATETIME -->
            @case ('datetime') {
              @if (value) {
                <span class="mcell-date" [pTooltip]="cm.timeAgoText(value)" tooltipPosition="top">
                  <i class="pi pi-clock mcell-meta-icon"></i>
                  {{ cm.formatDateTime(value) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- TIME AGO -->
            @case ('timeago') {
              @if (value) {
                <span
                  class="mcell-timeago"
                  [pTooltip]="cm.formatDateTime(value)"
                  tooltipPosition="top"
                >
                  <i class="pi pi-clock mcell-meta-icon"></i>
                  {{ cm.timeAgoText(value) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- BOOLEAN -->
            @case ('boolean') {
              <div class="mcell-bool">
                @if (value) {
                  <span class="mcell-bool-chip is-true">
                    <i class="pi pi-check"></i>
                    <span>Yes</span>
                  </span>
                } @else {
                  <span class="mcell-bool-chip is-false">
                    <i class="pi pi-times"></i>
                    <span>No</span>
                  </span>
                }
              </div>
            }

            <!-- BADGE -->
            @case ('badge') {
              @if (value != null) {
                <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
                  <span class="mcell-badge-dot"></span>
                  {{ cm.toTitleCase(String(value)) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- SELECT -->
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
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- EMAIL -->
            @case ('email') {
              @if (value) {
                <a
                  class="mcell-link"
                  [href]="'mailto:' + value"
                  (click)="onLinkClick($event, value)"
                  [pTooltip]="'Send email to ' + value"
                  tooltipPosition="top"
                >
                  <i class="pi pi-envelope mcell-meta-icon"></i>
                  <span>{{ cm.truncateText(value, 28) }}</span>
                </a>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- PHONE -->
            @case ('phone') {
              @if (value) {
                <a
                  class="mcell-link"
                  [href]="'tel:' + value"
                  (click)="onLinkClick($event, value)"
                  [pTooltip]="'Call ' + cm.formatPhone(value)"
                  tooltipPosition="top"
                >
                  <i class="pi pi-phone mcell-meta-icon"></i>
                  <span>{{ cm.formatPhone(value) }}</span>
                </a>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- URL -->
            @case ('url') {
              @if (value) {
                <a
                  class="mcell-link mcell-url"
                  [href]="value"
                  target="_blank"
                  rel="noopener"
                  (click)="onLinkClick($event, value)"
                  [pTooltip]="value"
                  tooltipPosition="top"
                >
                  <i class="pi pi-external-link mcell-meta-icon"></i>
                  <span>{{ cm.truncateText(value, 30) }}</span>
                </a>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- PROGRESS -->
            @case ('progress') {
              <div class="mcell-progress-wrap">
                <div class="mcell-progress-track">
                  <div
                    class="mcell-progress-fill"
                    [style.width.%]="getProgressPct()"
                    [class.is-complete]="getProgressPct() >= 100"
                    [class.is-warning]="getProgressPct() >= 75 && getProgressPct() < 100"
                    [class.is-low]="getProgressPct() < 30"
                  ></div>
                </div>
                @if (config.showValue !== false) {
                  <span class="mcell-progress-label" [class.is-complete]="getProgressPct() >= 100">
                    {{ getProgressPct() }}%
                  </span>
                }
              </div>
            }

            <!-- AVATAR -->
            @case ('avatar') {
              <div class="mcell-avatar-wrap">
                @if (value && isImageUrl(value)) {
                  <div class="mcell-avatar">
                    <img [src]="value" [alt]="getAvatarInitials()" loading="lazy" />
                  </div>
                } @else {
                  <div
                    class="mcell-avatar"
                    [style.background]="getAvatarBg()"
                    [style.color]="getAvatarColor()"
                  >
                    <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
                  </div>
                }
                @if (config.labelField) {
                  <span class="mcell-avatar-label">
                    {{ params?.data?.[config.labelField] ?? '—' }}
                  </span>
                }
              </div>
            }

            <!-- TAGS -->
            @case ('tags') {
              @if (asTags(value).length) {
                <div class="mcell-tags">
                  @for (tag of asTags(value).slice(0, config.maxTags ?? 3); track tag) {
                    <span class="mcell-tag">{{ tag }}</span>
                  }
                  @if (asTags(value).length > (config.maxTags ?? 3)) {
                    <span
                      class="mcell-tag mcell-tag-more"
                      [pTooltip]="asTags(value).slice(config.maxTags ?? 3).join(', ')"
                      tooltipPosition="top"
                    >
                      +{{ asTags(value).length - (config.maxTags ?? 3) }}
                    </span>
                  }
                </div>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- COLOR -->
            @case ('color') {
              @if (value) {
                <div class="mcell-color">
                  <span class="mcell-color-swatch" [style.background]="value"></span>
                  <span class="mcell-color-label">{{ value }}</span>
                </div>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- FILE SIZE -->
            @case ('filesize') {
              @if (value != null) {
                <span class="mcell-filesize">
                  <i class="pi pi-file mcell-meta-icon"></i>
                  {{ cm.formatFileSize(value) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- DURATION -->
            @case ('duration') {
              @if (value != null) {
                <span class="mcell-duration">
                  <i class="pi pi-clock mcell-meta-icon"></i>
                  {{ cm.formatDuration(value) }}
                </span>
              } @else {
                <span class="mcell-empty">—</span>
              }
            }

            <!-- RATING -->
            @case ('rating') {
              <div class="mcell-rating">
                @for (star of getRatingStars(); track $index) {
                  <i
                    class="pi"
                    [class.pi-star-fill]="star"
                    [class.pi-star]="!star"
                    [class.is-filled]="star"
                  ></i>
                }
                @if (config.showValue !== false) {
                  <span class="mcell-rating-val">{{ value }}</span>
                }
              </div>
            }

            <!-- INITIALS -->
            @case ('initials') {
              <div
                class="mcell-initials-chip"
                [style.background]="getAvatarBg()"
                [style.color]="getAvatarColor()"
                [pTooltip]="value"
                tooltipPosition="top"
              >
                {{ cm.getInitials(value ?? '') }}
              </div>
            }

            <!-- TEXTAREA / MULTILINE -->
            @case ('textarea') {
              <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
            }

            <!-- DEFAULT -->
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

    /* ══════════════════════════════════════════════════════
       MASTER CELL v2.1 — APEX CRM Theme Token System
    ══════════════════════════════════════════════════════ */

    app-master-cell {
      display: flex;
      align-items: stretch;
      width: 100%;
      height: 100%;
    }

    /* ── ROOT ──────────────────────────────────────────── */
    .mcell-root {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
      transition: background var(--transition-fast);
    }
    .mcell-root.is-editing {
      background: color-mix(in srgb, var(--theme-accent-primary) 4%, var(--theme-bg-primary) 96%);
    }
    .mcell-root.is-readonly .mcell-viewer {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* ── VIEWER SHELL ──────────────────────────────────── */
    .mcell-viewer {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 var(--spacing-md);
      overflow: hidden;
      white-space: nowrap;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      font-family: var(--font-body);
    }

    /* ── META ICON ─────────────────────────────────────── */
    .mcell-meta-icon {
      font-size: 0.65rem;
      color: var(--theme-text-tertiary);
      flex-shrink: 0;
      transition: color var(--transition-fast);
    }

    /* ── EMPTY ─────────────────────────────────────────── */
    .mcell-empty {
      color: var(--theme-text-tertiary);
      font-style: italic;
      font-size: var(--font-size-xs);
      opacity: 0.7;
    }

    /* ── TEXT ──────────────────────────────────────────── */
    .mcell-text,
    .mcell-select-val {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      font-weight: var(--font-weight-normal);
    }

    .mcell-multiline {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      font-size: var(--font-size-sm);
      color: var(--theme-text-secondary);
      line-height: var(--line-height-normal);
    }

    /* ── NUMBER ────────────────────────────────────────── */
    .mcell-number {
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--theme-text-primary);
      letter-spacing: -0.2px;
    }

    /* ── PERCENT ───────────────────────────────────────── */
    .mcell-percent {
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--theme-accent-primary);
      letter-spacing: -0.2px;
    }

    /* ── CURRENCY ──────────────────────────────────────── */
    .mcell-currency {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-family: var(--font-mono);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      letter-spacing: -0.3px;
    }
    .mcell-currency-arrow {
      font-size: 0.5rem;
      opacity: 0.45;
      font-weight: var(--font-weight-bold);
    }
    .mcell-currency.is-negative {
      color: var(--theme-error, #ef4444);
    }
    .mcell-currency.is-negative .mcell-currency-arrow {
      opacity: 0.8;
    }

    /* ── DATE ──────────────────────────────────────────── */
    .mcell-date,
    .mcell-timeago {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      overflow: hidden;
      white-space: nowrap;
      cursor: default;
    }
    .mcell-date-text {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mcell-today-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--theme-accent-primary);
      flex-shrink: 0;
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-accent-primary) 25%, transparent 75%);
    }
    .mcell-date.is-today {
      color: var(--theme-accent-primary);
      font-weight: var(--font-weight-semibold);
    }
    .mcell-date.is-today .mcell-meta-icon {
      color: var(--theme-accent-primary);
    }
    .mcell-date.is-overdue {
      color: var(--theme-error, #ef4444);
    }
    .mcell-date.is-overdue .mcell-meta-icon {
      color: var(--theme-error, #ef4444);
    }
    .mcell-timeago {
      color: var(--theme-text-secondary);
      font-size: var(--font-size-xs);
      font-style: italic;
    }

    /* ── BOOLEAN CHIP ──────────────────────────────────── */
    .mcell-bool {
      display: flex;
      align-items: center;
    }
    .mcell-bool-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;
    }
    .mcell-bool-chip i { font-size: 0.6rem; }
    .mcell-bool-chip.is-true {
      background: color-mix(in srgb, var(--theme-success, #22c55e) 12%, transparent 88%);
      color: var(--theme-success, #22c55e);
      border: 1px solid color-mix(in srgb, var(--theme-success, #22c55e) 25%, transparent 75%);
    }
    .mcell-bool-chip.is-false {
      background: var(--theme-bg-ternary);
      color: var(--theme-text-tertiary);
      border: 1px solid var(--theme-border-primary);
    }

    /* ── BADGE ─────────────────────────────────────────── */
    .mcell-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 8px 2px 6px;
      border-radius: var(--ui-border-radius-sm);
      border: 1px solid var(--theme-border-primary);
      background: var(--theme-bg-ternary);
      color: var(--theme-text-secondary);
      white-space: nowrap;
    }
    .mcell-badge-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
      opacity: 0.8;
    }
    .mcell-badge[data-sev="success"] {
      background: color-mix(in srgb, var(--theme-success, #22c55e) 12%, transparent 88%);
      color: var(--theme-success, #22c55e);
      border-color: color-mix(in srgb, var(--theme-success, #22c55e) 25%, transparent 75%);
    }
    .mcell-badge[data-sev="warning"] {
      background: color-mix(in srgb, var(--theme-warning, #f59e0b) 12%, transparent 88%);
      color: var(--theme-warning, #f59e0b);
      border-color: color-mix(in srgb, var(--theme-warning, #f59e0b) 25%, transparent 75%);
    }
    .mcell-badge[data-sev="danger"] {
      background: color-mix(in srgb, var(--theme-error, #ef4444) 12%, transparent 88%);
      color: var(--theme-error, #ef4444);
      border-color: color-mix(in srgb, var(--theme-error, #ef4444) 25%, transparent 75%);
    }
    .mcell-badge[data-sev="info"] {
      background: color-mix(in srgb, var(--theme-accent-primary) 10%, transparent 90%);
      color: var(--theme-accent-primary);
      border-color: color-mix(in srgb, var(--theme-accent-primary) 22%, transparent 78%);
    }

    /* ── LINKS ─────────────────────────────────────────── */
    .mcell-link {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      color: var(--theme-accent-primary);
      text-decoration: none;
      font-size: var(--font-size-sm);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: 3px;
      padding: 1px 2px;
      margin: -1px -2px;
      transition: var(--transition-fast);
    }
    .mcell-link span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mcell-link:hover {
      text-decoration: underline;
      color: var(--theme-accent-hover);
    }
    .mcell-link:hover .mcell-meta-icon {
      color: var(--theme-accent-hover);
    }
    .mcell-link:focus-visible {
      outline: var(--focus-ring-width) solid var(--theme-accent-focus);
      outline-offset: var(--focus-ring-offset);
    }

    /* ── PROGRESS ──────────────────────────────────────── */
    .mcell-progress-wrap {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      width: 100%;
      padding: 0 2px;
    }
    .mcell-progress-track {
      flex: 1;
      height: 4px;
      background: var(--theme-bg-ternary);
      border-radius: var(--ui-border-radius-pill);
      overflow: hidden;
      border: 1px solid var(--theme-border-primary);
    }
    .mcell-progress-fill {
      height: 100%;
      background: var(--theme-accent-primary);
      border-radius: var(--ui-border-radius-pill);
      transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .mcell-progress-fill.is-complete  { background: var(--theme-success, #22c55e); }
    .mcell-progress-fill.is-warning   { background: var(--theme-warning, #f59e0b); }
    .mcell-progress-fill.is-low       { background: var(--theme-error, #ef4444); }
    .mcell-progress-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--theme-text-secondary);
      flex-shrink: 0;
      min-width: 30px;
      text-align: right;
      font-family: var(--font-mono);
    }
    .mcell-progress-label.is-complete { color: var(--theme-success, #22c55e); }

    /* ── AVATAR ────────────────────────────────────────── */
    .mcell-avatar-wrap {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      overflow: hidden;
    }
    .mcell-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      overflow: hidden;
      border: 1.5px solid var(--theme-border-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--elevation-1, 0 1px 3px rgba(0,0,0,0.08));
    }
    .mcell-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .mcell-avatar-initials {
      font-size: 0.6rem;
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .mcell-avatar-label {
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      font-weight: var(--font-weight-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── INITIALS CHIP ─────────────────────────────────── */
    .mcell-initials-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      font-size: 0.6rem;
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      flex-shrink: 0;
      border: 1.5px solid rgba(255,255,255,0.25);
      box-shadow: var(--elevation-1, 0 1px 3px rgba(0,0,0,0.08));
      cursor: default;
    }

    /* ── TAGS ──────────────────────────────────────────── */
    .mcell-tags {
      display: flex;
      align-items: center;
      gap: 3px;
      overflow: hidden;
      flex-wrap: nowrap;
    }
    .mcell-tag {
      display: inline-block;
      font-size: 0.6rem;
      font-weight: var(--font-weight-semibold);
      padding: 1px 6px;
      border-radius: var(--ui-border-radius-sm);
      background: var(--theme-bg-ternary);
      color: var(--theme-text-secondary);
      border: 1px solid var(--theme-border-primary);
      white-space: nowrap;
      letter-spacing: 0.02em;
    }
    .mcell-tag-more {
      background: color-mix(in srgb, var(--theme-accent-primary) 10%, var(--theme-bg-ternary) 90%);
      color: var(--theme-accent-primary);
      border-color: color-mix(in srgb, var(--theme-accent-primary) 20%, transparent 80%);
      cursor: pointer;
    }

    /* ── COLOR SWATCH ──────────────────────────────────── */
    .mcell-color { display: flex; align-items: center; gap: var(--spacing-sm); }
    .mcell-color-swatch {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid var(--theme-border-secondary);
      flex-shrink: 0;
      box-shadow: var(--shadow-xs);
    }
    .mcell-color-label {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      color: var(--theme-text-secondary);
      letter-spacing: 0.03em;
    }

    /* ── FILE SIZE / DURATION ──────────────────────────── */
    .mcell-filesize,
    .mcell-duration {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      color: var(--theme-text-secondary);
      font-weight: var(--font-weight-medium);
    }

    /* ── RATING ────────────────────────────────────────── */
    .mcell-rating {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .mcell-rating i {
      font-size: 0.7rem;
      color: var(--theme-border-secondary);
      transition: color var(--transition-fast);
    }
    .mcell-rating i.is-filled { color: var(--theme-warning, #f59e0b); }
    .mcell-rating-val {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--theme-text-secondary);
      font-family: var(--font-mono);
      margin-left: 3px;
    }

    /* ══════════════════════════════════════════════════════
       EDITOR FIELDS
    ══════════════════════════════════════════════════════ */

    .mc-input {
      width: 100%;
      height: 28px;
      padding: 0 var(--spacing-md, 8px);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      background: var(--theme-bg-primary);
      border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
      border-radius: var(--ui-border-radius-sm, 6px);
      outline: none;
      transition: var(--transition-fast);
      box-sizing: border-box;
    }
    .mc-input:focus {
      border-color: var(--theme-accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width, 2px)
        color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
      background: var(--theme-bg-primary);
    }
    .mc-input::placeholder {
      color: var(--theme-text-tertiary);
      font-size: var(--font-size-xs);
    }

    .mc-textarea {
      width: 100%;
      height: auto;
      min-height: 28px;
      padding: var(--spacing-xs, 4px) var(--spacing-md, 8px);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      background: var(--theme-bg-primary);
      border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
      border-radius: var(--ui-border-radius-sm, 6px);
      outline: none;
      resize: none;
      transition: var(--transition-fast);
      box-sizing: border-box;
    }
    .mc-textarea:focus {
      border-color: var(--theme-accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width, 2px)
        color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
    }
    .mc-textarea::placeholder { color: var(--theme-text-tertiary); }

    .mc-input-number { width: 100%; }
    .mc-input-number .p-inputnumber-input {
      width: 100%;
      height: 28px;
      padding: 0 var(--spacing-md, 8px);
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      text-align: right;
      color: var(--theme-text-primary);
      background: var(--theme-bg-primary);
      border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
      border-radius: var(--ui-border-radius-sm, 6px);
      outline: none;
      transition: var(--transition-fast);
    }
    .mc-input-number .p-inputnumber-input:focus {
      border-color: var(--theme-accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width, 2px)
        color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
    }

    .mc-select {
      width: 100%;
      height: 28px;
      border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
      border-radius: var(--ui-border-radius-sm, 6px);
      transition: var(--transition-fast);
    }
    .mc-select .p-select-label {
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      padding: 0 var(--spacing-md, 8px);
      line-height: 28px;
    }
    .mc-select.p-focus,
    .mc-select:focus-within {
      border-color: var(--theme-accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width, 2px)
        color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
      outline: none;
    }

    .mc-datepicker { width: 100%; }
    .mc-datepicker .p-datepicker-input {
      width: 100%;
      height: 28px;
      padding: 0 var(--spacing-md, 8px);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--theme-text-primary);
      background: var(--theme-bg-primary);
      border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
      border-radius: var(--ui-border-radius-sm, 6px);
      outline: none;
      transition: var(--transition-fast);
    }
    .mc-datepicker .p-datepicker-input:focus {
      border-color: var(--theme-accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width, 2px)
        color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
    }
    .mc-datepicker .p-datepicker-trigger { display: none; }

    .mc-checkbox-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

  `],
})
export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

  private readonly el = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);

  /** CommonMethodService — single source of truth for all formatting */
  readonly cm = inject(CommonMethodService);

  /** Expose String constructor for template use: String(value) */
  readonly String = String;

  /* ── OUTPUT ──────────────────────────────────────────── */
  readonly cellInteraction = output<CellInteractionEvent>();

  /* ── STATE ───────────────────────────────────────────── */
  params!: any;
  config: CellConfig = { type: 'text' };
  value: any;       // committed value — what view mode shows
  draftValue: any;  // live edit value — what editor binds to

  /* ── COMPUTED ────────────────────────────────────────── */
  get showEditor(): boolean {
    if (this.config.readOnly) return false;
    if (this.config.alwaysEditable) return true;
    return this.isRowEditing();
  }

  private isRowEditing(): boolean {
    try {
      const parent = this.params?.context?.componentParent;
      return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
    } catch {
      return false;
    }
  }

  isNegativeValue(): boolean {
    return (this.config.type === 'currency' || this.config.type === 'number')
      ? Number(this.value) < 0
      : false;
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
    if (this.showEditor) {
      this.focusEditor();
    }
  }

  ngOnDestroy(): void { }

  /* ── FOCUS — TAB FIX ─────────────────────────────────────────────────────
     BEFORE: requestAnimationFrame(() => setTimeout(() => focus(), 40))
       Problem: 40ms delay means AG Grid's cell wrapper <div> gets painted
       as focused (ag-cell-focus border flashes) before the inner input
       receives focus. User sees: [div flash] → [input focus]. Jarring.

     AFTER: Promise.resolve().then(() => focus())
       Promise microtasks run after the current JS task completes but
       BEFORE the browser renders the next frame. So the inner input
       receives focus before AG Grid paints anything — zero flash.

     Also: agCell.classList.add('ag-cell-inline-editing') tells AG Grid's
       internal focusin listener that the cell is already in edit mode,
       so it doesn't attempt to re-focus the wrapper div when it sees the
       focusin event bubble up from the inner input.

     Tab navigation itself is handled in AppSharedGrid.tabToNextCell()
     which intercepts Tab, returns the next CellPosition to AG Grid, then
     uses the same Promise.resolve() pattern to focus the input directly.
  ───────────────────────────────────────────────────────────────────────── */
  private focusEditor(): void {
    Promise.resolve().then(() => {
      const host = this.el.nativeElement as HTMLElement;

      const target =
        host.querySelector<HTMLElement>('input:not([type="hidden"]), textarea') ??
        host.querySelector<HTMLElement>(
          '.p-select .p-select-label, .p-checkbox-box, [tabindex="0"]'
        );

      if (!target) return;

      // Tell AG Grid this cell is already in inline-edit mode.
      // Prevents its own focusin handler from stealing focus back
      // to the wrapper div when the input fires its focusin event.
      const agCell = host.closest<HTMLElement>('.ag-cell');
      if (agCell) agCell.classList.add('ag-cell-inline-editing');

      target.focus({ preventScroll: false });

      // Select all text so the user can immediately type to replace
      if (
        target instanceof HTMLInputElement &&
        ['text', 'email', 'tel', 'url'].includes(target.type)
      ) {
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
        this.emit('enter', event);
        this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
      } else {
        this.emit('enter', event);
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.emit('escape', event);
      this.params?.context?.componentParent?.handleRowAction('cancel', this.params.data);
    }
  }

  onEditorFocus(event: Event | null | undefined): void {
    this.emit('focus', event ?? null);
  }

  onBlur(event: Event | null | undefined): void {
    this.emit('blur', event ?? null);
    if (this.config.alwaysEditable && this.config.enterToSave) {
      this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
    }
  }

  onViewClick(event: MouseEvent): void {
    if (!this.showEditor) this.emit('click', event);
  }

  onLinkClick(event: MouseEvent, _value: any): void {
    event.stopPropagation();
    this.emit('linkClick', event);
  }

  /* ── EMIT ────────────────────────────────────────────── */
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
    // badge CSS uses 'warning' but cm uses 'warn' — normalise
    if (severity === 'warn') return 'warning';
    return severity ?? 'secondary';
  }

  getProgressPct(): number {
    return this.cm.clamp(
      Math.round(((this.value ?? 0) / (this.config.max ?? 100)) * 100),
      0,
      100
    );
  }

  getAvatarInitials(): string {
    const field = this.config.labelField;
    const name = field
      ? this.params?.data?.[field]
      : (this.params?.data?.name ?? this.value);
    return this.cm.getInitials(name ?? '') || '?';
  }

  getAvatarBg(): string {
    const field = this.config.labelField;
    const name = field
      ? this.params?.data?.[field]
      : (this.params?.data?.name ?? this.value ?? '');
    return this.cm.stringToColor(String(name));
  }

  getAvatarColor(): string {
    return this.cm.getContrastColor(this.getAvatarBg());
  }

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

// import {
//   Component,
//   ViewEncapsulation,
//   ElementRef,
//   OnDestroy,
//   ChangeDetectionStrategy,
//   ChangeDetectorRef,
//   inject,
//   output,
// } from '@angular/core';
// import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ICellRendererAngularComp } from 'ag-grid-angular';

// // PrimeNG v18 imports
// import { InputTextModule } from 'primeng/inputtext';
// import { InputNumberModule } from 'primeng/inputnumber';
// import { TextareaModule } from 'primeng/textarea';
// import { SelectModule } from 'primeng/select';
// import { DatePickerModule } from 'primeng/datepicker';
// import { CheckboxModule } from 'primeng/checkbox';
// import { TagModule } from 'primeng/tag';
// import { TooltipModule } from 'primeng/tooltip';

// import {
//   CellConfig,
//   CellInteractionEvent,
//   CellInteractionType,
//   MasterCellParams,
//   SelectOption,
// } from '../grid.types';

// /* ==========================================================================
//    MASTER CELL COMPONENT

//    Single component that handles BOTH view and edit modes internally.
//    No component swapping — zero flicker, zero focus loss.

//    Controlled by:
//    - `isEditing` signal from parent (row-level edit)
//    - `cellConfig.alwaysEditable` (column-level always-on edit)
//    - `cellConfig.readOnly` (never editable even in edit mode)

//    Events:
//    - `cellInteraction` output fires a typed CellInteractionEvent for:
//        click | focus | blur | change | enter | escape | linkClick
//    ========================================================================== */
// @Component({
//   selector: 'app-master-cell',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   encapsulation: ViewEncapsulation.None,
//   imports: [
//     CommonModule,
//     FormsModule,
//     InputTextModule,
//     InputNumberModule,
//     TextareaModule,
//     SelectModule,
//     DatePickerModule,
//     CheckboxModule,
//     TagModule,
//     TooltipModule,
//     CurrencyPipe,
//     DatePipe,
//   ],
//   template: `
//     <div
//       class="mcell-root"
//       [class.is-editing]="showEditor"
//       [class.is-readonly]="config.readOnly"
//       (click)="onViewClick($event)"
//     >

//       <!-- ════════════════════════════════════════════════
//            EDITOR MODE
//            Shown when: (row is editing OR alwaysEditable) AND NOT readOnly
//       ════════════════════════════════════════════════ -->
//       @if (showEditor) {

//         @switch (config.type) {

//           <!-- TEXT -->
//           @case ('text') {
//             <input
//               pInputText
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (focus)="onEditorFocus($event)"
//               (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || ''"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           <!-- EMAIL -->
//           @case ('email') {
//             <input
//               pInputText
//               type="email"
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (focus)="onEditorFocus($event)"
//               (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || 'email@example.com'"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           <!-- PHONE -->
//           @case ('phone') {
//             <input
//               pInputText
//               type="tel"
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (focus)="onEditorFocus($event)"
//               (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || '+91 00000 00000'"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           <!-- URL -->
//           @case ('url') {
//             <input
//               pInputText
//               type="url"
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (focus)="onEditorFocus($event)"
//               (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || 'https://'"
//               autocomplete="off"
//               #focusTarget
//             />
//           }

//           <!-- NUMBER -->
//           @case ('number') {
//             <p-inputNumber
//               class="mc-input-number"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               mode="decimal"
//               [minFractionDigits]="config.minFractionDigits ?? 0"
//               [maxFractionDigits]="config.maxFractionDigits ?? 2"
//               [min]="config.min ?? null"
//               [max]="config.max ?? null"
//               [useGrouping]="true"
//               [placeholder]="config.placeholder || ''"
//               (onFocus)="onEditorFocus($event)"
//               (onBlur)="onBlur($event)"
//               (onKeyDown)="onKeydown($event)"
//               #focusTarget
//             />
//           }

//           <!-- CURRENCY -->
//           @case ('currency') {
//             <p-inputNumber
//               class="mc-input-number"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               mode="currency"
//               [currency]="config.currencyCode ?? 'INR'"
//               [locale]="config.currencyLocale ?? 'en-IN'"
//               [minFractionDigits]="config.minFractionDigits ?? 2"
//               [min]="config.min ?? null"
//               [max]="config.max ?? null"
//               [placeholder]="config.placeholder || ''"
//               (onFocus)="onEditorFocus($event)"
//               (onBlur)="onBlur($event)"
//               (onKeyDown)="onKeydown($event)"
//               #focusTarget
//             />
//           }

//           <!-- DATE -->
//           @case ('date') {
//             <p-datepicker
//               class="mc-datepicker"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               appendTo="body"
//               [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
//               [showTime]="config.showTime ?? false"
//               [showButtonBar]="true"
//               [placeholder]="config.placeholder || 'Select date'"
//               [panelStyleClass]="'mc-calendar-panel'"
//               (onFocus)="onEditorFocus($event)"
//               (onBlur)="onBlur($event)"
//               (onSelect)="onDraftChange($event)"
//               #focusTarget
//             />
//           }

//           <!-- SELECT -->
//           @case ('select') {
//             <p-select
//               class="mc-select"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               [options]="config.options ?? []"
//               [optionLabel]="config.optionLabel ?? 'label'"
//               [optionValue]="config.optionValue ?? 'value'"
//               appendTo="body"
//               [filter]="(config.options?.length ?? 0) > 7"
//               [showClear]="true"
//               [placeholder]="config.placeholder || 'Select…'"
//               [panelStyleClass]="'mc-dropdown-panel'"
//               (onFocus)="onEditorFocus($event)"
//               (onBlur)="onBlur($event)"
//               #focusTarget
//             />
//           }

//           <!-- BOOLEAN / CHECKBOX -->
//           @case ('boolean') {
//             <div
//               class="mc-checkbox-wrap"
//               (focusin)="onEditorFocus($event)"
//               (focusout)="onBlur($event)"
//             >
//               <p-checkbox
//                 [ngModel]="draftValue"
//                 (ngModelChange)="onDraftChange($event)"
//                 [binary]="true"
//                 #focusTarget
//               />
//             </div>
//           }

//           <!-- TEXTAREA -->
//           @case ('textarea') {
//             <textarea
//               pTextarea
//               class="mc-textarea"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (focus)="onEditorFocus($event)"
//               (blur)="onBlur($event)"
//               [rows]="config.rows ?? 2"
//               [placeholder]="config.placeholder || ''"
//               autoResize="true"
//               #focusTarget
//             ></textarea>
//           }

//           <!-- FALLBACK -->
//           @default {
//             <input
//               pInputText
//               class="mc-input"
//               [ngModel]="draftValue"
//               (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)"
//               (focus)="onEditorFocus($event)"
//               (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || ''"
//               autocomplete="off"
//               #focusTarget
//             />
//           }
//         }
//       }

//       <!-- ════════════════════════════════════════════════
//            VIEW MODE (READ ONLY RENDERER)
//            Shown when: not editing, OR readOnly=true
//       ════════════════════════════════════════════════ -->
//       @if (!showEditor) {

//         <div class="mcell-viewer">
//           @switch (config.type) {

//             @case ('boolean') {
//               <i class="pi mcell-bool-icon"
//                  [class.pi-check-circle]="value"
//                  [class.is-true]="value"
//                  [class.pi-times-circle]="!value"
//                  [class.is-false]="!value">
//               </i>
//             }

//             @case ('date') {
//               <span class="mcell-date">
//                 <i class="pi pi-calendar mcell-meta-icon"></i>
//                 {{ value | date:(config.dateFormat ?? 'dd MMM yyyy') }}
//               </span>
//             }

//             @case ('currency') {
//               <span class="mcell-currency" [class.is-negative]="value < 0">
//                 {{ value | currency:(config.currencyCode ?? 'INR'):'symbol':'1.2-2':(config.currencyLocale ?? 'en-IN') }}
//               </span>
//             }

//             @case ('number') {
//               <span class="mcell-number">
//                 {{ value | number:getNumberFormat() }}
//               </span>
//             }

//             @case ('badge') {
//               @if (value != null) {
//                 <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
//                   {{ value }}
//                 </span>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('select') {
//               <span class="mcell-select-val">
//                 {{ getSelectLabel(value) }}
//               </span>
//             }

//             @case ('color') {
//               <div class="mcell-color">
//                 <span class="mcell-color-swatch" [style.background]="value"></span>
//                 <span class="mcell-color-label">{{ value }}</span>
//               </div>
//             }

//             @case ('email') {
//               @if (value) {
//                 <a class="mcell-link"
//                    [href]="'mailto:' + value"
//                    (click)="onLinkClick($event, value)"
//                    pTooltip="Send email"
//                    tooltipPosition="top">
//                   <i class="pi pi-envelope mcell-meta-icon"></i>{{ value }}
//                 </a>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('phone') {
//               @if (value) {
//                 <a class="mcell-link"
//                    [href]="'tel:' + value"
//                    (click)="onLinkClick($event, value)">
//                   <i class="pi pi-phone mcell-meta-icon"></i>{{ value }}
//                 </a>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('url') {
//               @if (value) {
//                 <a class="mcell-link mcell-url"
//                    [href]="value"
//                    target="_blank"
//                    rel="noopener"
//                    (click)="onLinkClick($event, value)"
//                    pTooltip="Open link"
//                    tooltipPosition="top">
//                   <i class="pi pi-external-link mcell-meta-icon"></i>
//                   {{ value | slice:0:30 }}{{ value?.length > 30 ? '…' : '' }}
//                 </a>
//               } @else {
//                 <span class="mcell-empty">—</span>
//               }
//             }

//             @case ('progress') {
//               <div class="mcell-progress-wrap">
//                 <div class="mcell-progress-track">
//                   <div class="mcell-progress-fill"
//                        [style.width.%]="getProgressPct()">
//                   </div>
//                 </div>
//                 @if (config.showValue !== false) {
//                   <span class="mcell-progress-label">{{ getProgressPct() }}%</span>
//                 }
//               </div>
//             }

//             @case ('avatar') {
//               <div class="mcell-avatar">
//                 @if (value && isImageUrl(value)) {
//                   <img [src]="value" [alt]="getAvatarInitials()" loading="lazy" />
//                 } @else {
//                   <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
//                 }
//               </div>
//             }

//             @case ('tags') {
//               <div class="mcell-tags">
//                 @for (tag of asTags(value); track tag) {
//                   <span class="mcell-tag">{{ tag }}</span>
//                 }
//               </div>
//             }

//             @case ('textarea') {
//               <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
//             }

//             @default {
//               <span class="mcell-text" [title]="value">{{ value ?? '—' }}</span>
//             }
//           }
//         </div>
//       }

//     </div>
//   `,
//   styles: [`
//     /* ════════════════════════════════════════════════════
//        MASTER CELL — ALL VARS ARE THEME TOKENS
//     ════════════════════════════════════════════════════ */

//     app-master-cell { display: flex; align-items: stretch; width: 100%; height: 100%; }

//     .mcell-root {
//       display: flex;
//       align-items: center;
//       width: 100%;
//       height: 100%;
//       overflow: hidden;
//     }

//     /* ── VIEWER ────────────────────────────────────────── */
//     .mcell-viewer {
//       display: flex;
//       align-items: center;
//       width: 100%;
//       height: 100%;
//       padding: 0 6px;
//       overflow: hidden;
//       white-space: nowrap;
//       text-overflow: ellipsis;
//       font-size: 13px;
//       color: var(--theme-text-primary);
//       gap: 4px;
//     }

//     .mcell-text, .mcell-number, .mcell-date,
//     .mcell-select-val, .mcell-multiline {
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//       font-size: 13px;
//       color: var(--theme-text-primary);
//     }

//     .mcell-multiline {
//       white-space: normal;
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//     }

//     .mcell-meta-icon {
//       font-size: 0.7rem;
//       color: var(--theme-text-tertiary);
//       flex-shrink: 0;
//     }

//     .mcell-empty {
//       color: var(--theme-text-tertiary);
//       font-style: italic;
//       font-size: 12px;
//     }

//     /* Currency */
//     .mcell-currency {
//       font-family: var(--font-mono, monospace);
//       font-weight: 600;
//       font-size: 13px;
//       color: var(--theme-text-primary);
//       letter-spacing: -0.3px;
//       &.is-negative { color: var(--color-error, #ef4444); }
//     }

//     /* Number */
//     .mcell-number {
//       font-family: var(--font-mono, monospace);
//       font-size: 13px;
//     }

//     /* Boolean */
//     .mcell-bool-icon {
//       font-size: 15px;
//       &.is-true { color: var(--color-success, #22c55e); }
//       &.is-false { color: var(--theme-text-tertiary); }
//     }

//     /* Badge */
//     .mcell-badge {
//       display: inline-block;
//       font-size: 0.68rem;
//       font-weight: 700;
//       text-transform: uppercase;
//       letter-spacing: 0.04em;
//       padding: 2px 8px;
//       border-radius: 4px;
//       border: 1px solid transparent;
//       background: var(--theme-bg-ternary);
//       color: var(--theme-text-secondary);
//       border-color: var(--theme-border-primary);

//       &[data-sev="success"] {
//         background: rgba(34,197,94,0.10);
//         color: var(--color-success, #22c55e);
//         border-color: rgba(34,197,94,0.2);
//       }
//       &[data-sev="warning"] {
//         background: rgba(245,158,11,0.10);
//         color: var(--color-warning, #f59e0b);
//         border-color: rgba(245,158,11,0.2);
//       }
//       &[data-sev="danger"] {
//         background: rgba(239,68,68,0.10);
//         color: var(--color-error, #ef4444);
//         border-color: rgba(239,68,68,0.2);
//       }
//       &[data-sev="info"] {
//         background: rgba(var(--accent-primary-rgb), 0.10);
//         color: var(--theme-accent-primary);
//         border-color: rgba(var(--accent-primary-rgb), 0.2);
//       }
//     }

//     /* Color swatch */
//     .mcell-color { display: flex; align-items: center; gap: 6px; }
//     .mcell-color-swatch {
//       width: 14px; height: 14px;
//       border-radius: 3px;
//       border: 1px solid var(--theme-border-secondary);
//       flex-shrink: 0;
//     }
//     .mcell-color-label {
//       font-family: var(--font-mono, monospace);
//       font-size: 12px;
//       color: var(--theme-text-secondary);
//     }

//     /* Links */
//     .mcell-link {
//       display: flex; align-items: center; gap: 4px;
//       color: var(--theme-accent-primary);
//       text-decoration: none;
//       font-size: 13px;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//       &:hover { text-decoration: underline; }
//     }

//     /* Progress */
//     .mcell-progress-wrap { display: flex; align-items: center; gap: 6px; width: 100%; }
//     .mcell-progress-track {
//       flex: 1; height: 5px;
//       background: var(--theme-bg-ternary);
//       border-radius: 99px; overflow: hidden;
//     }
//     .mcell-progress-fill {
//       height: 100%;
//       background: var(--theme-accent-primary);
//       border-radius: 99px;
//       transition: width 0.3s ease;
//     }
//     .mcell-progress-label {
//       font-size: 11px; font-weight: 700;
//       color: var(--theme-text-secondary);
//       flex-shrink: 0; min-width: 28px;
//       text-align: right;
//     }

//     /* Avatar */
//     .mcell-avatar {
//       width: 28px; height: 28px;
//       border-radius: 50%;
//       overflow: hidden;
//       background: rgba(var(--accent-primary-rgb), 0.12);
//       border: 1px solid var(--theme-border-primary);
//       display: flex; align-items: center; justify-content: center;
//       flex-shrink: 0;
//       img { width: 100%; height: 100%; object-fit: cover; }
//     }
//     .mcell-avatar-initials {
//       font-size: 11px; font-weight: 700;
//       color: var(--theme-accent-primary);
//       text-transform: uppercase;
//     }

//     /* Tags */
//     .mcell-tags {
//       display: flex; align-items: center; gap: 4px;
//       overflow: hidden; flex-wrap: nowrap;
//     }
//     .mcell-tag {
//       display: inline-block;
//       font-size: 0.65rem; font-weight: 600;
//       padding: 1px 6px; border-radius: 3px;
//       background: var(--theme-bg-ternary);
//       color: var(--theme-text-secondary);
//       border: 1px solid var(--theme-border-primary);
//       white-space: nowrap;
//     }

//     /* ── EDITOR BASE ───────────────────────────────────── */
//     .mc-input {
//       width: 100%;
//       height: 30px;
//       padding: 0 8px;
//       font-family: var(--font-body);
//       font-size: 13px;
//       color: var(--theme-text-primary);
//       background: var(--theme-bg-primary);
//       border: 1px solid var(--theme-border-secondary);
//       border-radius: var(--ui-border-radius, 5px);
//       outline: none;
//       transition: border-color 0.12s, box-shadow 0.12s;
//       box-sizing: border-box;

//       &:focus {
//         border-color: var(--theme-accent-primary);
//         box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
//       }
//       &::placeholder { color: var(--theme-text-tertiary); }
//     }

//     .mc-textarea {
//       @extend .mc-input;
//       height: auto;
//       min-height: 30px;
//       padding: 4px 8px;
//       resize: none;
//     }

//     .mc-input-number {
//       width: 100%;
//       .p-inputnumber-input { @extend .mc-input; text-align: right; }
//     }

//     .mc-select {
//       width: 100%;
//       height: 30px;
//       .p-select-label {
//         font-family: var(--font-body);
//         font-size: 13px;
//         color: var(--theme-text-primary);
//         padding: 4px 8px;
//       }
//       &.p-focus {
//         border-color: var(--theme-accent-primary);
//         box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
//       }
//     }

//     .mc-datepicker {
//       width: 100%;
//       .p-datepicker-input { @extend .mc-input; }
//       .p-datepicker-trigger { display: none; }
//     }

//     .mc-checkbox-wrap {
//       display: flex; align-items: center; justify-content: center;
//       width: 100%; height: 100%;
//     }

//     /* ── STATE INDICATORS ──────────────────────────────── */
//     .mcell-root.is-editing {
//       background: rgba(var(--accent-primary-rgb), 0.03);
//     }

//     .mcell-root.is-readonly {
//       .mcell-viewer { opacity: 0.6; cursor: not-allowed; }
//     }
//   `],
// })
// export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

//   private readonly el = inject(ElementRef);
//   private readonly cdr = inject(ChangeDetectorRef);

//   /* ── OUTPUT ────────────────────────────────────────────
//      Single typed event bus for every cell interaction.
//      Wire it up in the parent via cellRendererParams passing
//      a callback, or read it through context.componentParent.
//   ──────────────────────────────────────────────────────── */
//   readonly cellInteraction = output<CellInteractionEvent>();

//   /* ── LIVE STATE ────────────────────────────────────── */
//   params!: any;
//   config: CellConfig = { type: 'text' };
//   value: any;          // Committed value (what renderer shows)
//   draftValue: any;     // Live edit value (what editor binds to)

//   /** True when this cell should show its editor */
//   get showEditor(): boolean {
//     if (this.config.readOnly) return false;
//     if (this.config.alwaysEditable) return true;
//     return this.isRowEditing();
//   }

//   private isRowEditing(): boolean {
//     try {
//       const parent = this.params?.context?.componentParent;
//       return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
//     } catch {
//       return false;
//     }
//   }

//   /* ── AG GRID LIFECYCLE ─────────────────────────────── */
//   agInit(params: any): void {
//     this.params = params;
//     this.config = params.cellConfig || { type: 'text' };
//     this.value = params.value;
//     this.draftValue = params.value;
//   }

//   refresh(params: any): boolean {
//     this.params = params;
//     this.config = params.cellConfig || { type: 'text' };
//     this.value = params.value;

//     if (!this.isRowEditing() && !this.config.alwaysEditable) {
//       this.draftValue = params.value;
//     }

//     this.cdr.markForCheck();
//     return true;
//   }

//   afterGuiAttached(): void {
//     if (this.showEditor) {
//       this.focusEditor();
//     }
//   }

//   ngOnDestroy(): void { }

//   /* ── EDITOR EVENTS ─────────────────────────────────── */

//   onDraftChange(val: any): void {
//     this.draftValue = val;

//     // Push to parent draft map
//     const parent = this.params?.context?.componentParent;
//     const id = this.params?.node?.id;
//     const field = this.params?.colDef?.field;
//     if (parent && id && field) {
//       parent.updateDraft(id, field, val);
//     }

//     this.emit('change', null);
//   }

//   onKeydown(event: KeyboardEvent): void {
//     if (event.key === 'Enter') {
//       if (this.config.enterToSave === true) {
//         event.preventDefault();
//         event.stopPropagation();
//         this.emit('enter', event);
//         const parent = this.params?.context?.componentParent;
//         if (parent) parent.handleRowAction('save', this.params.data);
//       }
//       // else: fall through — just emit enter for awareness
//       else {
//         this.emit('enter', event);
//       }
//     }

//     if (event.key === 'Escape') {
//       event.preventDefault();
//       event.stopPropagation();
//       this.emit('escape', event);
//       const parent = this.params?.context?.componentParent;
//       if (parent) parent.handleRowAction('cancel', this.params.data);
//     }
//   }

//   onEditorFocus(event: Event | null | undefined): void {
//     this.emit('focus', event ?? null);
//   }

//   onBlur(event: Event | null | undefined): void {
//     this.emit('blur', event ?? null);

//     // Auto-save on blur for alwaysEditable + enterToSave cells
//     if (this.config.alwaysEditable && this.config.enterToSave) {
//       const parent = this.params?.context?.componentParent;
//       if (parent) parent.handleRowAction('save', this.params.data);
//     }
//   }

//   /** Click on the view-mode cell (not a link) */
//   onViewClick(event: MouseEvent): void {
//     // Only emit for view mode — editor clicks fire focus/blur/change instead
//     if (!this.showEditor) {
//       this.emit('click', event);
//     }
//   }

//   /** Click on email / phone / url anchor tag */
//   onLinkClick(event: MouseEvent, _value: any): void {
//     event.stopPropagation();
//     this.emit('linkClick', event);
//   }

//   /* ── AUTO-FOCUS ────────────────────────────────────── */
//   private focusEditor(): void {
//     requestAnimationFrame(() => {
//       setTimeout(() => {
//         const el = this.el.nativeElement as HTMLElement;
//         const target =
//           el.querySelector<HTMLElement>('input, textarea') ??
//           el.querySelector<HTMLElement>('.p-select, .p-checkbox-box, [tabindex]:not([tabindex="-1"])');

//         if (target) {
//           target.focus();
//           if (
//             target instanceof HTMLInputElement &&
//             (target.type === 'text' || target.type === 'number' || target.type === 'email')
//           ) {
//             target.select();
//           }
//         }
//       }, 40);
//     });
//   }

//   /* ── EMIT HELPER ───────────────────────────────────── */
//   /**
//    * Builds and emits a CellInteractionEvent.
//    * Respects config.emitEvents (default: true).
//    * Also bubbles through context.componentParent.onCellInteraction()
//    * if the parent exposes that method — so the grid can aggregate all events.
//    */
//   private emit(type: CellInteractionType, nativeEvent: Event | null): void {
//     if (this.config.emitEvents === false) return;

//     const event: CellInteractionEvent = {
//       interactionType: type,
//       cellType: this.config.type,
//       value: this.value,
//       draftValue: this.draftValue,
//       field: this.params?.colDef?.field ?? '',
//       rowId: this.params?.node?.id ?? '',
//       rowData: this.params?.data ?? null,
//       nativeEvent: nativeEvent,
//     };

//     // 1. Component-level output (for anyone using the component standalone)
//     this.cellInteraction.emit(event);

//     // 2. Bubble to parent grid via context so AppSharedGrid can re-emit if needed
//     const parent = this.params?.context?.componentParent;
//     if (parent && typeof parent.onCellInteraction === 'function') {
//       parent.onCellInteraction(event);
//     }
//   }

//   /* ── VIEW HELPERS ──────────────────────────────────── */

//   getSelectLabel(value: any): string {
//     if (!this.config.options) return value ?? '—';
//     const opt = this.config.options.find(
//       o => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
//     );
//     return opt?.label ?? value ?? '—';
//   }

//   getBadgeSeverity(value: any): string {
//     if (this.config.badgeMap) {
//       const sev = this.config.badgeMap[String(value)];
//       if (sev) return sev;
//     }
//     const v = String(value ?? '').toLowerCase();
//     if (/active|paid|approved|completed|success/.test(v)) return 'success';
//     if (/pending|processing|draft|partial/.test(v)) return 'warning';
//     if (/rejected|cancelled|overdue|inactive|failed|deleted/.test(v)) return 'danger';
//     if (/info|new|open/.test(v)) return 'info';
//     return 'secondary';
//   }

//   getNumberFormat(): string {
//     const min = this.config.minFractionDigits ?? 0;
//     const max = this.config.maxFractionDigits ?? 2;
//     return `1.${min}-${max}`;
//   }

//   getProgressPct(): number {
//     const max = this.config.max ?? 100;
//     return Math.min(100, Math.round(((this.value ?? 0) / max) * 100));
//   }

//   getAvatarInitials(): string {
//     const field = this.config.labelField;
//     const src = field ? this.params?.data?.[field] : this.params?.data?.name;
//     if (!src) return '?';
//     return src.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
//   }

//   isImageUrl(val: any): boolean {
//     return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
//   }

//   asTags(val: any): string[] {
//     if (!val) return [];
//     if (Array.isArray(val)) return val.map(String);
//     return String(val).split(',').map(s => s.trim()).filter(Boolean);
//   }
// }
