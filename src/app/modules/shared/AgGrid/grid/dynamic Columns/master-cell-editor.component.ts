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
    /* ══════════════════════════════════════════════════════
       MASTER CELL v2.4 — Tokens-Only "Billion Dollar" UI
       Fixes: Ag-Grid Flex stretching on chips/badges.
       Enhancements: Perfect typography spacing, pure theme vars.
    ══════════════════════════════════════════════════════ */

    app-master-cell {
      display: block; 
      width: 100%;
      height: 100%;
    }

    /* ── ROOT ──────────────────────────────────────────── */
    .mcell-root {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 0 var(--spacing-sm);
      box-sizing: border-box;
      transition: background var(--transition-base);
    }
    .mcell-root.is-editing {
      background: var(--color-primary-bg);
    }
    .mcell-root.is-readonly .mcell-viewer {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* ── VIEWER SHELL ──────────────────────────────────── */
    .mcell-viewer {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      gap: var(--spacing-sm);
      font-size: var(--font-size-sm);
      font-family: var(--font-body);
      color: var(--text-primary);
    }

    /* ── SHARED ICON ───────────────────────────────────── */
    .mcell-icon {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      flex-shrink: 0;
      transition: color var(--transition-fast);
    }

    /* ── EMPTY PLACEHOLDER ─────────────────────────────── */
    .mcell-empty {
      color: var(--text-disabled);
      font-size: var(--font-size-xs);
      user-select: none;
    }

    /* ── TEXT / SELECT ─────────────────────────────────── */
    .mcell-text,
    .mcell-select-val {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--text-primary);
    }

    /* ── MULTILINE / DESCRIPTION ───────────────────────── */
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
      margin: var(--spacing-sm) 0; /* Let it breathe away from borders */
      padding-right: var(--spacing-sm);
    }

    /* ── NUMBER / CURRENCY ─────────────────────────────── */
    .mcell-number, .mcell-currency {
      font-family: var(--font-mono);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .mcell-currency { display: inline-flex; align-items: center; gap: var(--spacing-xs); }
    .mcell-currency-arrow { font-size: 0.65rem; opacity: 0.5; }
    .mcell-currency.is-negative { color: var(--color-error); }

    /* ── BOOLEAN CHIP (Fixed Shape & Stretch) ──────────── */
    .mcell-bool { 
      display: flex; 
      align-items: center; 
      height: 100%;
    }
    .mcell-bool-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      letter-spacing: 0.02em;
      border: var(--ui-border-width) solid transparent;
      line-height: var(--line-height-tight);
      
      /* Stop Flexbox stretching it vertically */
      width: max-content; 
      height: max-content;
      align-self: center; 
      flex-shrink: 0;
    }
    .mcell-bool-chip i { font-size: 0.65rem; }
    
    .mcell-bool-chip.is-true {
      background: var(--color-success-bg);
      color: var(--color-success-dark);
      border-color: var(--color-success-border);
    }
    .mcell-bool-chip.is-false {
      background: var(--bg-ternary);
      color: var(--text-secondary);
      border-color: var(--border-secondary);
    }

    /* ── BADGE (Fixed Shape & Stretch) ─────────────────── */
    .mcell-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius-pill);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      border: var(--ui-border-width) solid var(--border-secondary);
      background: var(--bg-ternary);
      color: var(--text-tertiary);
      line-height: var(--line-height-tight);

      /* Stop Flexbox stretching it vertically */
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
      opacity: 0.8;
      flex-shrink: 0;
    }
    
    /* Elegant Semantic Colors mapped purely to your Tokens */
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
    .mcell-badge[data-sev="info"], .mcell-badge[data-sev="primary"] {
      background: var(--color-info-bg);
      color: var(--color-info-dark);
      border-color: var(--color-info-border);
    }

    /* ── AVATAR ────────────────────────────────────────── */
    .mcell-avatar-wrap {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      overflow: hidden;
    }
    .mcell-avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--ui-border-radius-pill);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }
    .mcell-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .mcell-avatar-initials {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .mcell-avatar-label {
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── PROGRESS ──────────────────────────────────────── */
    .mcell-progress-wrap {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      width: 100%;
      padding-right: var(--spacing-sm);
    }
    .mcell-progress-track {
      flex: 1;
      height: 6px;
      background: var(--bg-ternary);
      border-radius: var(--ui-border-radius-pill);
      overflow: hidden;
    }
    .mcell-progress-fill {
      height: 100%;
      background: var(--accent-primary);
      border-radius: var(--ui-border-radius-pill);
      transition: width var(--transition-slow);
    }
    .mcell-progress-fill.is-complete { background: var(--color-success); }
    .mcell-progress-fill.is-warning  { background: var(--color-warning); }
    .mcell-progress-fill.is-low      { background: var(--color-error); }
    .mcell-progress-label {
      font-family: var(--font-mono);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--text-secondary);
      min-width: 30px;
      text-align: right;
    }

    /* ── TAGS ──────────────────────────────────────────── */
    .mcell-tags {
      display: flex;
      align-items: center;
      height: 100%;
      gap: var(--spacing-xs);
      overflow: hidden;
    }
    .mcell-tag {
      display: inline-block;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      padding: var(--spacing-xs) var(--spacing-md);
      border-radius: var(--ui-border-radius-sm);
      background: var(--bg-ternary);
      color: var(--text-secondary);
      white-space: nowrap;
      
      height: max-content;
      align-self: center;
    }

    /* ══════════════════════════════════════════════════════
       EDITOR FIELDS
    ══════════════════════════════════════════════════════ */
    .mc-input, .mc-input-number .p-inputnumber-input, .mc-select, .mc-datepicker .p-datepicker-input {
      width: 100%;
      height: 32px; 
      padding: 0 var(--spacing-md);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
      outline: none;
      transition: var(--transition-fast);
    }
    .mc-input:focus, .mc-input-number .p-inputnumber-input:focus, .mc-select.p-focus, .mc-datepicker .p-datepicker-input:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 var(--focus-ring-width) var(--color-primary-bg);
    }
    .mc-textarea {
      width: 100%;
      min-height: 32px;
      padding: var(--spacing-sm) var(--spacing-md);
      font-family: var(--font-body);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      background: var(--bg-primary);
      border: var(--ui-border-width) solid var(--border-primary);
      border-radius: var(--ui-border-radius-sm);
      outline: none;
      resize: vertical;
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

// import { FormsModule } from '@angular/forms';
// import { ICellRendererAngularComp } from 'ag-grid-angular';

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
// import { CommonMethodService } from '@core/utils/common-method.service';

// @Component({
//   selector: 'app-master-cell',
//   standalone: true,
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   encapsulation: ViewEncapsulation.None,
//   imports: [
//     FormsModule,
//     InputTextModule,
//     InputNumberModule,
//     TextareaModule,
//     SelectModule,
//     DatePickerModule,
//     CheckboxModule,
//     TagModule,
//     TooltipModule,
//   ],
//   template: `
//     <div
//       class="mcell-root"
//       [class.is-editing]="showEditor"
//       [class.is-readonly]="config.readOnly"
//       [class.is-negative]="isNegativeValue()"
//       (click)="onViewClick($event)"
//     >

//       <!-- ════════════ EDITOR MODE ════════════ -->
//       @if (showEditor) {
//         @switch (config.type) {

//           @case ('text') {
//             <input pInputText class="mc-input"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || ''" autocomplete="off" #focusTarget />
//           }

//           @case ('email') {
//             <input pInputText type="email" class="mc-input"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || 'email@example.com'" autocomplete="off" #focusTarget />
//           }

//           @case ('phone') {
//             <input pInputText type="tel" class="mc-input"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || '+91 00000 00000'" autocomplete="off" #focusTarget />
//           }

//           @case ('url') {
//             <input pInputText type="url" class="mc-input"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || 'https://'" autocomplete="off" #focusTarget />
//           }

//           @case ('number') {
//             <p-inputNumber class="mc-input-number"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               mode="decimal"
//               [minFractionDigits]="config.minFractionDigits ?? 0"
//               [maxFractionDigits]="config.maxFractionDigits ?? 2"
//               [min]="config.min ?? null" [max]="config.max ?? null"
//               [useGrouping]="true" [placeholder]="config.placeholder || ''"
//               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
//               (onKeyDown)="onKeydown($event)" #focusTarget />
//           }

//           @case ('currency') {
//             <p-inputNumber class="mc-input-number"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               mode="currency"
//               [currency]="config.currencyCode ?? 'INR'"
//               [locale]="config.currencyLocale ?? 'en-IN'"
//               [minFractionDigits]="config.minFractionDigits ?? 2"
//               [min]="config.min ?? null" [max]="config.max ?? null"
//               [placeholder]="config.placeholder || ''"
//               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
//               (onKeyDown)="onKeydown($event)" #focusTarget />
//           }

//           @case ('date') {
//             <p-datepicker class="mc-datepicker"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               appendTo="body"
//               [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
//               [showTime]="config.showTime ?? false"
//               [showButtonBar]="true"
//               [placeholder]="config.placeholder || 'Select date'"
//               [panelStyleClass]="'mc-calendar-panel'"
//               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
//               (onSelect)="onDraftChange($event)" #focusTarget />
//           }

//           @case ('select') {
//             <p-select class="mc-select"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               [options]="config.options ?? []"
//               [optionLabel]="config.optionLabel ?? 'label'"
//               [optionValue]="config.optionValue ?? 'value'"
//               appendTo="body"
//               [filter]="(config.options?.length ?? 0) > 7"
//               [showClear]="true"
//               [placeholder]="config.placeholder || 'Select…'"
//               [panelStyleClass]="'mc-dropdown-panel'"
//               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)" #focusTarget />
//           }

//           @case ('boolean') {
//             <div class="mc-checkbox-wrap" (focusin)="onEditorFocus($event)" (focusout)="onBlur($event)">
//               <p-checkbox [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//                 [binary]="true" #focusTarget />
//             </div>
//           }

//           @case ('textarea') {
//             <textarea pTextarea class="mc-textarea"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
//               [rows]="config.rows ?? 2" [placeholder]="config.placeholder || ''"
//               autoResize="true" #focusTarget></textarea>
//           }

//           @default {
//             <input pInputText class="mc-input"
//               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
//               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
//               [placeholder]="config.placeholder || ''" autocomplete="off" #focusTarget />
//           }
//         }
//       }

//       <!-- ════════════ VIEW MODE ════════════ -->
//       @if (!showEditor) {
//         <div class="mcell-viewer">

//           @switch (config.type) {

//             @case ('text') {
//               @if (value) {
//                 <span class="mcell-text" [title]="value">
//                   {{ cm.truncateText(value, config.truncateAt ?? 50) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('number') {
//               @if (value != null) {
//                 <span class="mcell-number">
//                   {{ cm.formatNumber(value, config.maxFractionDigits ?? 2) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('currency') {
//               @if (value != null) {
//                 <span class="mcell-currency" [class.is-negative]="value < 0">
//                   <i class="mcell-currency-arrow pi" [class.pi-arrow-up-right]="value >= 0" [class.pi-arrow-down-right]="value < 0"></i>
//                   {{ cm.formatCurrency(value) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('percent') {
//               @if (value != null) {
//                 <div class="mcell-percent-wrap">
//                   <span class="mcell-percent">{{ cm.formatPercent(value / 100, 1) }}</span>
//                   <div class="mcell-pct-bar-track">
//                     <div class="mcell-pct-bar-fill" [style.width.%]="cm.clamp(value, 0, 100)"></div>
//                   </div>
//                 </div>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('date') {
//               @if (value) {
//                 <span class="mcell-date"
//                   [class.is-today]="cm.isToday(value)"
//                   [class.is-overdue]="isOverdue()"
//                   [pTooltip]="cm.timeAgoText(value)"
//                   tooltipPosition="top">
//                   <i class="pi pi-calendar mcell-icon"></i>
//                   <span class="mcell-date-text">{{ cm.formatDate(value, config.dateFormat ?? 'dd MMM yyyy') }}</span>
//                   @if (cm.isToday(value)) { <span class="mcell-today-badge">Today</span> }
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('datetime') {
//               @if (value) {
//                 <span class="mcell-date" [pTooltip]="cm.timeAgoText(value)" tooltipPosition="top">
//                   <i class="pi pi-clock mcell-icon"></i>
//                   {{ cm.formatDateTime(value) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('timeago') {
//               @if (value) {
//                 <span class="mcell-timeago" [pTooltip]="cm.formatDateTime(value)" tooltipPosition="top">
//                   <i class="pi pi-history mcell-icon"></i>
//                   {{ cm.timeAgoText(value) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('boolean') {
//               <div class="mcell-bool">
//                 <span class="mcell-bool-chip" [class.is-true]="value" [class.is-false]="!value">
//                   <i class="pi" [class.pi-check]="value" [class.pi-times]="!value"></i>
//                   {{ value ? 'Yes' : 'No' }}
//                 </span>
//               </div>
//             }

//             @case ('badge') {
//               @if (value != null) {
//                 <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
//                   <span class="mcell-badge-dot"></span>
//                   {{ cm.toTitleCase(String(value)) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('select') {
//               @if (value != null) {
//                 @if (config.selectAsBadge) {
//                   <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
//                     <span class="mcell-badge-dot"></span>
//                     {{ getSelectLabel(value) }}
//                   </span>
//                 } @else {
//                   <span class="mcell-select-val">{{ getSelectLabel(value) }}</span>
//                 }
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('email') {
//               @if (value) {
//                 <a class="mcell-link" [href]="'mailto:' + value"
//                   (click)="onLinkClick($event, value)"
//                   [pTooltip]="'Send email to ' + value" tooltipPosition="top">
//                   <i class="pi pi-envelope mcell-icon"></i>
//                   <span>{{ cm.truncateText(value, 28) }}</span>
//                 </a>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('phone') {
//               @if (value) {
//                 <a class="mcell-link" [href]="'tel:' + value"
//                   (click)="onLinkClick($event, value)"
//                   [pTooltip]="'Call ' + cm.formatPhone(value)" tooltipPosition="top">
//                   <i class="pi pi-phone mcell-icon"></i>
//                   <span>{{ cm.formatPhone(value) }}</span>
//                 </a>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('url') {
//               @if (value) {
//                 <a class="mcell-link mcell-url" [href]="value"
//                   target="_blank" rel="noopener"
//                   (click)="onLinkClick($event, value)"
//                   [pTooltip]="value" tooltipPosition="top">
//                   <i class="pi pi-external-link mcell-icon"></i>
//                   <span>{{ cm.truncateText(value, 30) }}</span>
//                 </a>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('progress') {
//               <div class="mcell-progress-wrap">
//                 <div class="mcell-progress-track">
//                   <div class="mcell-progress-fill"
//                     [style.width.%]="getProgressPct()"
//                     [class.is-complete]="getProgressPct() >= 100"
//                     [class.is-warning]="getProgressPct() >= 60 && getProgressPct() < 100"
//                     [class.is-low]="getProgressPct() < 30">
//                   </div>
//                 </div>
//                 @if (config.showValue !== false) {
//                   <span class="mcell-progress-label" [class.is-complete]="getProgressPct() >= 100">
//                     {{ getProgressPct() }}%
//                   </span>
//                 }
//               </div>
//             }

//             @case ('avatar') {
//               <div class="mcell-avatar-wrap">
//                 @if (value && isImageUrl(value)) {
//                   <div class="mcell-avatar"><img [src]="value" [alt]="getAvatarInitials()" loading="lazy" /></div>
//                 } @else {
//                   <div class="mcell-avatar" [style.background]="getAvatarBg()" [style.color]="getAvatarColor()">
//                     <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
//                   </div>
//                 }
//                 @if (config.labelField) {
//                   <span class="mcell-avatar-label">{{ params?.data?.[config.labelField] ?? '—' }}</span>
//                 }
//               </div>
//             }

//             @case ('tags') {
//               @if (asTags(value).length) {
//                 <div class="mcell-tags">
//                   @for (tag of asTags(value).slice(0, config.maxTags ?? 3); track tag) {
//                     <span class="mcell-tag">{{ tag }}</span>
//                   }
//                   @if (asTags(value).length > (config.maxTags ?? 3)) {
//                     <span class="mcell-tag mcell-tag-more"
//                       [pTooltip]="asTags(value).slice(config.maxTags ?? 3).join(', ')"
//                       tooltipPosition="top">
//                       +{{ asTags(value).length - (config.maxTags ?? 3) }}
//                     </span>
//                   }
//                 </div>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('color') {
//               @if (value) {
//                 <div class="mcell-color">
//                   <span class="mcell-color-swatch" [style.background]="value"></span>
//                   <span class="mcell-color-label">{{ value }}</span>
//                 </div>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('filesize') {
//               @if (value != null) {
//                 <span class="mcell-mono-chip">
//                   <i class="pi pi-file mcell-icon"></i>
//                   {{ cm.formatFileSize(value) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('duration') {
//               @if (value != null) {
//                 <span class="mcell-mono-chip">
//                   <i class="pi pi-clock mcell-icon"></i>
//                   {{ cm.formatDuration(value) }}
//                 </span>
//               } @else { <span class="mcell-empty">—</span> }
//             }

//             @case ('rating') {
//               <div class="mcell-rating">
//                 @for (star of getRatingStars(); track $index) {
//                   <i class="pi" [class.pi-star-fill]="star" [class.pi-star]="!star" [class.is-filled]="star"></i>
//                 }
//                 @if (config.showValue !== false) {
//                   <span class="mcell-rating-val">{{ value }}</span>
//                 }
//               </div>
//             }

//             @case ('initials') {
//               <div class="mcell-initials-chip"
//                 [style.background]="getAvatarBg()"
//                 [style.color]="getAvatarColor()"
//                 [pTooltip]="value" tooltipPosition="top">
//                 {{ cm.getInitials(value ?? '') }}
//               </div>
//             }

//             @case ('textarea') {
//               <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
//             }

//             @default {
//               <span class="mcell-text" [title]="value">
//                 {{ value != null ? cm.truncateText(String(value), 50) : '—' }}
//               </span>
//             }

//           }
//         </div>
//       }

//     </div>
//   `,
//   styles: [`
//     /* ══════════════════════════════════════════════════════
//        MASTER CELL v2.3 — BILLION DOLLAR UI UPGRADE
//        Fixed: Badges expanding to cell height.
//        Enhanced: Typography, pill shapes, and subtle colors.
//     ══════════════════════════════════════════════════════ */

//     app-master-cell {
//       display: block; /* Removed flex stretch */
//       width: 100%;
//       height: 100%;
//     }

//     /* ── ROOT ──────────────────────────────────────────── */
//     .mcell-root {
//       display: flex;
//       align-items: center;
//       width: 100%;
//       height: 100%;
//       padding: 0 var(--spacing-sm, 8px);
//       box-sizing: border-box;
//       transition: background 0.2s ease;
//     }
//     .mcell-root.is-editing {
//       background: rgba(var(--accent-primary-rgb, 79, 70, 229), 0.05);
//     }
//     .mcell-root.is-readonly .mcell-viewer {
//       opacity: 0.5;
//       cursor: not-allowed;
//       pointer-events: none;
//     }

//     /* ── VIEWER SHELL ──────────────────────────────────── */
//     .mcell-viewer {
//       display: flex;
//       align-items: center;
//       width: 100%;
//       /* Removed height: 100% so contents control height naturally */
//       gap: 8px;
//       font-size: 13.5px;
//       font-family: var(--font-body, inherit);
//       color: var(--theme-text-primary, #1e293b);
//     }

//     /* ── SHARED ICON ───────────────────────────────────── */
//     .mcell-icon {
//       font-size: 11px;
//       color: #94a3b8;
//       flex-shrink: 0;
//       transition: color 0.2s ease;
//     }

//     /* ── EMPTY PLACEHOLDER ─────────────────────────────── */
//     .mcell-empty {
//       color: #cbd5e1;
//       font-size: 12px;
//       user-select: none;
//     }

//     /* ── TEXT / SELECT ─────────────────────────────────── */
//     .mcell-text,
//     .mcell-select-val {
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//       font-size: 13.5px;
//       font-weight: 500;
//       color: var(--theme-text-primary, #0f172a);
//     }

//     /* ── MULTILINE / DESCRIPTION ───────────────────────── */
//     .mcell-multiline {
//       font-size: 13px;
//       line-height: 1.5;
//       color: #475569; /* Softer, professional grey */
//       font-weight: 400;
//       white-space: normal;
//       display: -webkit-box;
//       -webkit-line-clamp: 2;
//       -webkit-box-orient: vertical;
//       overflow: hidden;
//       margin: 6px 0; /* Breathing room inside cell */
//       padding-right: 8px;
//     }

//     /* ── NUMBER / CURRENCY ─────────────────────────────── */
//     .mcell-number, .mcell-currency {
//       font-family: var(--font-mono, monospace);
//       font-size: 13px;
//       font-weight: 600;
//       color: #1e293b;
//       letter-spacing: -0.3px;
//     }
//     .mcell-currency { display: inline-flex; align-items: center; gap: 4px; }
//     .mcell-currency-arrow { font-size: 9px; opacity: 0.5; }
//     .mcell-currency.is-negative { color: #ef4444; }

//     /* ── BOOLEAN CHIP (Fixed Shape) ────────────────────── */
//     .mcell-bool { 
//       display: flex; 
//       align-items: center; 
//     }
//     .mcell-bool-chip {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       gap: 6px;
//       height: 24px; /* Strict Pill Height */
//       padding: 0 10px;
//       border-radius: 99px; /* Perfect Pill */
//       font-size: 11.5px;
//       font-weight: 600;
//       letter-spacing: 0.02em;
//       border: 1px solid transparent;
//       width: max-content; /* Prevent cell stretching */
//       flex-shrink: 0;
//       line-height: 1;
//     }
//     .mcell-bool-chip i { font-size: 10px; }
    
//     .mcell-bool-chip.is-true {
//       background: rgba(16, 185, 129, 0.1);
//       color: #059669;
//       border-color: rgba(16, 185, 129, 0.2);
//     }
//     .mcell-bool-chip.is-false {
//       background: rgba(100, 116, 139, 0.08);
//       color: #64748b;
//       border-color: rgba(100, 116, 139, 0.15);
//     }

//     /* ── BADGE (Fixed Block Stretch) ───────────────────── */
//     .mcell-badge {
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;
//       gap: 6px;
//       height: 24px; /* Strict Pill Height */
//       padding: 0 10px;
//       border-radius: 99px; /* Perfect Pill */
//       font-size: 11px;
//       font-weight: 600;
//       text-transform: uppercase;
//       letter-spacing: 0.04em;
//       white-space: nowrap;
//       width: max-content; /* Stop stretching! */
//       flex-shrink: 0;
//       line-height: 1;
//       background: rgba(100, 116, 139, 0.08);
//       color: #475569;
//       border: 1px solid rgba(100, 116, 139, 0.15);
//     }
//     .mcell-badge-dot {
//       width: 5px;
//       height: 5px;
//       border-radius: 50%;
//       background: currentColor;
//       opacity: 0.8;
//       flex-shrink: 0;
//     }
    
//     /* Elegant Semantic Colors */
//     .mcell-badge[data-sev="success"] {
//       background: rgba(16, 185, 129, 0.1);
//       color: #059669;
//       border-color: rgba(16, 185, 129, 0.2);
//     }
//     .mcell-badge[data-sev="warning"] {
//       background: rgba(245, 158, 11, 0.1);
//       color: #d97706;
//       border-color: rgba(245, 158, 11, 0.2);
//     }
//     .mcell-badge[data-sev="danger"] {
//       background: rgba(239, 68, 68, 0.1);
//       color: #dc2626;
//       border-color: rgba(239, 68, 68, 0.2);
//     }
//     .mcell-badge[data-sev="info"], .mcell-badge[data-sev="primary"] {
//       background: rgba(59, 130, 246, 0.1);
//       color: #2563eb;
//       border-color: rgba(59, 130, 246, 0.2);
//     }

//     /* ── AVATAR ────────────────────────────────────────── */
//     .mcell-avatar-wrap {
//       display: flex;
//       align-items: center;
//       gap: 10px;
//       overflow: hidden;
//     }
//     .mcell-avatar {
//       width: 28px;
//       height: 28px;
//       border-radius: 50%;
//       overflow: hidden;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       flex-shrink: 0;
//       box-shadow: 0 2px 4px rgba(0,0,0,0.06); /* Crisp shadow */
//     }
//     .mcell-avatar img { width: 100%; height: 100%; object-fit: cover; }
//     .mcell-avatar-initials {
//       font-size: 11px;
//       font-weight: 700;
//       letter-spacing: 0.03em;
//       text-transform: uppercase;
//     }
//     .mcell-avatar-label {
//       font-size: 13.5px;
//       color: #0f172a;
//       font-weight: 500;
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//     }

//     /* ── PROGRESS ──────────────────────────────────────── */
//     .mcell-progress-wrap {
//       display: flex;
//       align-items: center;
//       gap: 10px;
//       width: 100%;
//       padding-right: 8px;
//     }
//     .mcell-progress-track {
//       flex: 1;
//       height: 6px;
//       background: #e2e8f0;
//       border-radius: 99px;
//       overflow: hidden;
//     }
//     .mcell-progress-fill {
//       height: 100%;
//       background: #3b82f6;
//       border-radius: 99px;
//       transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
//     }
//     .mcell-progress-fill.is-complete { background: #10b981; }
//     .mcell-progress-fill.is-warning  { background: #f59e0b; }
//     .mcell-progress-fill.is-low      { background: #ef4444; }
//     .mcell-progress-label {
//       font-family: var(--font-mono, monospace);
//       font-size: 11px;
//       font-weight: 700;
//       color: #64748b;
//       min-width: 30px;
//       text-align: right;
//     }

//     /* ── TAGS ──────────────────────────────────────────── */
//     .mcell-tags {
//       display: flex;
//       align-items: center;
//       gap: 4px;
//       overflow: hidden;
//     }
//     .mcell-tag {
//       display: inline-block;
//       font-size: 11px;
//       font-weight: 600;
//       padding: 3px 8px;
//       border-radius: 6px;
//       background: #f1f5f9;
//       color: #475569;
//       white-space: nowrap;
//     }

//     /* ══════════════════════════════════════════════════════
//        EDITOR FIELDS (Kept structurally the same)
//     ══════════════════════════════════════════════════════ */
//     .mc-input, .mc-input-number .p-inputnumber-input, .mc-select, .mc-datepicker .p-datepicker-input {
//       width: 100%;
//       height: 30px; /* Slightly taller for modern feel */
//       padding: 0 10px;
//       font-family: inherit;
//       font-size: 13px;
//       color: #0f172a;
//       background: #ffffff;
//       border: 1px solid #cbd5e1;
//       border-radius: 6px;
//       outline: none;
//       transition: all 0.2s;
//     }
//     .mc-input:focus, .mc-input-number .p-inputnumber-input:focus, .mc-select.p-focus, .mc-datepicker .p-datepicker-input:focus {
//       border-color: var(--theme-accent-primary, #3b82f6);
//       box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
//     }
//     .mc-textarea {
//       width: 100%;
//       min-height: 30px;
//       padding: 6px 10px;
//       font-family: inherit;
//       font-size: 13px;
//       border: 1px solid #cbd5e1;
//       border-radius: 6px;
//       outline: none;
//       resize: vertical;
//     }
//   `]
// })
// export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

//   private readonly el = inject(ElementRef);
//   private readonly cdr = inject(ChangeDetectorRef);
//   readonly cm = inject(CommonMethodService);
//   readonly String = String;

//   readonly cellInteraction = output<CellInteractionEvent>();

//   params!: any;
//   config: CellConfig = { type: 'text' };
//   value: any;
//   draftValue: any;

//   get showEditor(): boolean {
//     if (this.config.readOnly) return false;
//     if (this.config.alwaysEditable) return true;
//     return this.isRowEditing();
//   }

//   private isRowEditing(): boolean {
//     try {
//       const parent = this.params?.context?.componentParent;
//       return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
//     } catch { return false; }
//   }

//   isNegativeValue(): boolean {
//     return (this.config.type === 'currency' || this.config.type === 'number')
//       ? Number(this.value) < 0 : false;
//   }

//   isOverdue(): boolean {
//     if (!this.value || this.config.type !== 'date') return false;
//     return this.cm.isPast(this.value) && !this.cm.isToday(this.value);
//   }

//   /* ── AG GRID LIFECYCLE ───────────────────────────────── */
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
//     if (this.showEditor) this.focusEditor();
//   }

//   ngOnDestroy(): void { }

//   /* ── FOCUS — microtask pattern ───────────────────────── */
//   private focusEditor(): void {
//     Promise.resolve().then(() => {
//       const host = this.el.nativeElement as HTMLElement;
//       const target =
//         host.querySelector<HTMLElement>('input:not([type="hidden"]), textarea') ??
//         host.querySelector<HTMLElement>('.p-select .p-select-label, .p-checkbox-box, [tabindex="0"]');
//       if (!target) return;

//       const agCell = host.closest<HTMLElement>('.ag-cell');
//       if (agCell) agCell.classList.add('ag-cell-inline-editing');

//       target.focus({ preventScroll: false });

//       if (target instanceof HTMLInputElement && ['text', 'email', 'tel', 'url'].includes(target.type)) {
//         target.select();
//       }
//     });
//   }

//   /* ── EDITOR EVENTS ───────────────────────────────────── */
//   onDraftChange(val: any): void {
//     this.draftValue = val;
//     const parent = this.params?.context?.componentParent;
//     const id = this.params?.node?.id;
//     const field = this.params?.colDef?.field;
//     if (parent && id && field) parent.updateDraft(id, field, val);
//     this.emit('change', null);
//   }

//   onKeydown(event: KeyboardEvent): void {
//     if (event.key === 'Enter') {
//       if (this.config.enterToSave === true) {
//         event.preventDefault();
//         event.stopPropagation();
//         this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
//       }
//       this.emit('enter', event);
//     }
//     if (event.key === 'Escape') {
//       event.preventDefault();
//       event.stopPropagation();
//       this.params?.context?.componentParent?.handleRowAction('cancel', this.params.data);
//       this.emit('escape', event);
//     }
//   }

//   onEditorFocus(event: Event | null | undefined): void { this.emit('focus', event ?? null); }
//   onBlur(event: Event | null | undefined): void {
//     this.emit('blur', event ?? null);
//     if (this.config.alwaysEditable && this.config.enterToSave) {
//       this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
//     }
//   }
//   onViewClick(event: MouseEvent): void { if (!this.showEditor) this.emit('click', event); }
//   onLinkClick(event: MouseEvent, _value: any): void {
//     event.stopPropagation();
//     this.emit('linkClick', event);
//   }

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
//       nativeEvent,
//     };
//     this.cellInteraction.emit(event);
//     const parent = this.params?.context?.componentParent;
//     if (parent && typeof parent.onCellInteraction === 'function') {
//       parent.onCellInteraction(event);
//     }
//   }

//   /* ── VIEW HELPERS ────────────────────────────────────── */
//   getSelectLabel(value: any): string {
//     if (!this.config.options) return value ?? '—';
//     const opt = this.config.options.find(
//       (o) => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
//     );
//     return opt?.label ?? value ?? '—';
//   }

//   getBadgeSeverity(value: any): string {
//     if (this.config.badgeMap) {
//       const sev = this.config.badgeMap[String(value)];
//       if (sev) return sev;
//     }
//     const severity = this.cm.mapStatusToSeverity(String(value ?? ''));
//     if (severity === 'warn') return 'warning';
//     return severity ?? 'secondary';
//   }

//   getProgressPct(): number {
//     return this.cm.clamp(
//       Math.round(((this.value ?? 0) / (this.config.max ?? 100)) * 100),
//       0, 100
//     );
//   }

//   getAvatarInitials(): string {
//     const field = this.config.labelField;
//     const name = field ? this.params?.data?.[field] : (this.params?.data?.name ?? this.value);
//     return this.cm.getInitials(name ?? '') || '?';
//   }

//   getAvatarBg(): string {
//     const field = this.config.labelField;
//     const name = field ? this.params?.data?.[field] : (this.params?.data?.name ?? this.value ?? '');
//     return this.cm.stringToColor(String(name));
//   }

//   getAvatarColor(): string { return this.cm.getContrastColor(this.getAvatarBg()); }
//   isImageUrl(val: any): boolean {
//     return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
//   }
//   asTags(val: any): string[] {
//     if (!val) return [];
//     if (Array.isArray(val)) return val.map(String);
//     return String(val).split(',').map((s) => s.trim()).filter(Boolean);
//   }
//   getRatingStars(): boolean[] {
//     const max = this.config.max ?? 5;
//     const filled = Math.round(Number(this.value) || 0);
//     return Array.from({ length: max }, (_, i) => i < filled);
//   }
// }

// // import {
// //   Component,
// //   ViewEncapsulation,
// //   ElementRef,
// //   OnDestroy,
// //   ChangeDetectionStrategy,
// //   ChangeDetectorRef,
// //   inject,
// //   output,
// // } from '@angular/core';

// // import { FormsModule } from '@angular/forms';
// // import { ICellRendererAngularComp } from 'ag-grid-angular';

// // import { InputTextModule } from 'primeng/inputtext';
// // import { InputNumberModule } from 'primeng/inputnumber';
// // import { TextareaModule } from 'primeng/textarea';
// // import { SelectModule } from 'primeng/select';
// // import { DatePickerModule } from 'primeng/datepicker';
// // import { CheckboxModule } from 'primeng/checkbox';
// // import { TagModule } from 'primeng/tag';
// // import { TooltipModule } from 'primeng/tooltip';

// // import {
// //   CellConfig,
// //   CellInteractionEvent,
// //   CellInteractionType,
// //   MasterCellParams,
// //   SelectOption,
// // } from '../grid.types';
// // import { CommonMethodService } from '@core/utils/common-method.service';

// // /* ==========================================================================
// //    MASTER CELL COMPONENT  v2.2

// //    TAB FIX (root cause): AG Grid rebuilds ColDef objects on every columnDefs()
// //    signal emission. Comparing `col.getColDef().cellRenderer === MasterCellComponent`
// //    inside tabToNextCell failed because the reference was stale after the computed
// //    signal re-ran. Fix: tag every MasterCell column with a stable colId marker
// //    (`__mcell__` prefix) set in AppSharedGrid.columnDefs(), then filter by that
// //    marker — no class reference comparison needed.

// //    VIEW MODE REDESIGN: All viewer classes rebuilt with token-first approach.
// //    Every primitive maps directly to a --theme-* or spacing token.
// //    ========================================================================== */
// // @Component({
// //   selector: 'app-master-cell',
// //   standalone: true,
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   encapsulation: ViewEncapsulation.None,
// //   imports: [
// //     FormsModule,
// //     InputTextModule,
// //     InputNumberModule,
// //     TextareaModule,
// //     SelectModule,
// //     DatePickerModule,
// //     CheckboxModule,
// //     TagModule,
// //     TooltipModule,
// //   ],
// //   template: `
// //     <div
// //       class="mcell-root"
// //       [class.is-editing]="showEditor"
// //       [class.is-readonly]="config.readOnly"
// //       [class.is-negative]="isNegativeValue()"
// //       (click)="onViewClick($event)"
// //     >

// //       <!-- ════════════ EDITOR MODE ════════════ -->
// //       @if (showEditor) {
// //         @switch (config.type) {

// //           @case ('text') {
// //             <input pInputText class="mc-input"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
// //               [placeholder]="config.placeholder || ''" autocomplete="off" #focusTarget />
// //           }

// //           @case ('email') {
// //             <input pInputText type="email" class="mc-input"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
// //               [placeholder]="config.placeholder || 'email@example.com'" autocomplete="off" #focusTarget />
// //           }

// //           @case ('phone') {
// //             <input pInputText type="tel" class="mc-input"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
// //               [placeholder]="config.placeholder || '+91 00000 00000'" autocomplete="off" #focusTarget />
// //           }

// //           @case ('url') {
// //             <input pInputText type="url" class="mc-input"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
// //               [placeholder]="config.placeholder || 'https://'" autocomplete="off" #focusTarget />
// //           }

// //           @case ('number') {
// //             <p-inputNumber class="mc-input-number"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               mode="decimal"
// //               [minFractionDigits]="config.minFractionDigits ?? 0"
// //               [maxFractionDigits]="config.maxFractionDigits ?? 2"
// //               [min]="config.min ?? null" [max]="config.max ?? null"
// //               [useGrouping]="true" [placeholder]="config.placeholder || ''"
// //               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
// //               (onKeyDown)="onKeydown($event)" #focusTarget />
// //           }

// //           @case ('currency') {
// //             <p-inputNumber class="mc-input-number"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               mode="currency"
// //               [currency]="config.currencyCode ?? 'INR'"
// //               [locale]="config.currencyLocale ?? 'en-IN'"
// //               [minFractionDigits]="config.minFractionDigits ?? 2"
// //               [min]="config.min ?? null" [max]="config.max ?? null"
// //               [placeholder]="config.placeholder || ''"
// //               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
// //               (onKeyDown)="onKeydown($event)" #focusTarget />
// //           }

// //           @case ('date') {
// //             <p-datepicker class="mc-datepicker"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               appendTo="body"
// //               [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
// //               [showTime]="config.showTime ?? false"
// //               [showButtonBar]="true"
// //               [placeholder]="config.placeholder || 'Select date'"
// //               [panelStyleClass]="'mc-calendar-panel'"
// //               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)"
// //               (onSelect)="onDraftChange($event)" #focusTarget />
// //           }

// //           @case ('select') {
// //             <p-select class="mc-select"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               [options]="config.options ?? []"
// //               [optionLabel]="config.optionLabel ?? 'label'"
// //               [optionValue]="config.optionValue ?? 'value'"
// //               appendTo="body"
// //               [filter]="(config.options?.length ?? 0) > 7"
// //               [showClear]="true"
// //               [placeholder]="config.placeholder || 'Select…'"
// //               [panelStyleClass]="'mc-dropdown-panel'"
// //               (onFocus)="onEditorFocus($event)" (onBlur)="onBlur($event)" #focusTarget />
// //           }

// //           @case ('boolean') {
// //             <div class="mc-checkbox-wrap" (focusin)="onEditorFocus($event)" (focusout)="onBlur($event)">
// //               <p-checkbox [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //                 [binary]="true" #focusTarget />
// //             </div>
// //           }

// //           @case ('textarea') {
// //             <textarea pTextarea class="mc-textarea"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
// //               [rows]="config.rows ?? 2" [placeholder]="config.placeholder || ''"
// //               autoResize="true" #focusTarget></textarea>
// //           }

// //           @default {
// //             <input pInputText class="mc-input"
// //               [ngModel]="draftValue" (ngModelChange)="onDraftChange($event)"
// //               (keydown)="onKeydown($event)" (focus)="onEditorFocus($event)" (blur)="onBlur($event)"
// //               [placeholder]="config.placeholder || ''" autocomplete="off" #focusTarget />
// //           }
// //         }
// //       }

// //       <!-- ════════════ VIEW MODE ════════════ -->
// //       @if (!showEditor) {
// //         <div class="mcell-viewer">

// //           @switch (config.type) {

// //             @case ('text') {
// //               @if (value) {
// //                 <span class="mcell-text" [title]="value">
// //                   {{ cm.truncateText(value, config.truncateAt ?? 50) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('number') {
// //               @if (value != null) {
// //                 <span class="mcell-number">
// //                   {{ cm.formatNumber(value, config.maxFractionDigits ?? 2) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('currency') {
// //               @if (value != null) {
// //                 <span class="mcell-currency" [class.is-negative]="value < 0">
// //                   <i class="mcell-currency-arrow pi" [class.pi-arrow-up-right]="value >= 0" [class.pi-arrow-down-right]="value < 0"></i>
// //                   {{ cm.formatCurrency(value) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('percent') {
// //               @if (value != null) {
// //                 <div class="mcell-percent-wrap">
// //                   <span class="mcell-percent">{{ cm.formatPercent(value / 100, 1) }}</span>
// //                   <div class="mcell-pct-bar-track">
// //                     <div class="mcell-pct-bar-fill" [style.width.%]="cm.clamp(value, 0, 100)"></div>
// //                   </div>
// //                 </div>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('date') {
// //               @if (value) {
// //                 <span class="mcell-date"
// //                   [class.is-today]="cm.isToday(value)"
// //                   [class.is-overdue]="isOverdue()"
// //                   [pTooltip]="cm.timeAgoText(value)"
// //                   tooltipPosition="top">
// //                   <i class="pi pi-calendar mcell-icon"></i>
// //                   <span class="mcell-date-text">{{ cm.formatDate(value, config.dateFormat ?? 'dd MMM yyyy') }}</span>
// //                   @if (cm.isToday(value)) { <span class="mcell-today-badge">Today</span> }
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('datetime') {
// //               @if (value) {
// //                 <span class="mcell-date" [pTooltip]="cm.timeAgoText(value)" tooltipPosition="top">
// //                   <i class="pi pi-clock mcell-icon"></i>
// //                   {{ cm.formatDateTime(value) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('timeago') {
// //               @if (value) {
// //                 <span class="mcell-timeago" [pTooltip]="cm.formatDateTime(value)" tooltipPosition="top">
// //                   <i class="pi pi-history mcell-icon"></i>
// //                   {{ cm.timeAgoText(value) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('boolean') {
// //               <div class="mcell-bool">
// //                 <span class="mcell-bool-chip" [class.is-true]="value" [class.is-false]="!value">
// //                   <i class="pi" [class.pi-check]="value" [class.pi-times]="!value"></i>
// //                   {{ value ? 'Yes' : 'No' }}
// //                 </span>
// //               </div>
// //             }

// //             @case ('badge') {
// //               @if (value != null) {
// //                 <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
// //                   <span class="mcell-badge-dot"></span>
// //                   {{ cm.toTitleCase(String(value)) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('select') {
// //               @if (value != null) {
// //                 @if (config.selectAsBadge) {
// //                   <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
// //                     <span class="mcell-badge-dot"></span>
// //                     {{ getSelectLabel(value) }}
// //                   </span>
// //                 } @else {
// //                   <span class="mcell-select-val">{{ getSelectLabel(value) }}</span>
// //                 }
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('email') {
// //               @if (value) {
// //                 <a class="mcell-link" [href]="'mailto:' + value"
// //                   (click)="onLinkClick($event, value)"
// //                   [pTooltip]="'Send email to ' + value" tooltipPosition="top">
// //                   <i class="pi pi-envelope mcell-icon"></i>
// //                   <span>{{ cm.truncateText(value, 28) }}</span>
// //                 </a>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('phone') {
// //               @if (value) {
// //                 <a class="mcell-link" [href]="'tel:' + value"
// //                   (click)="onLinkClick($event, value)"
// //                   [pTooltip]="'Call ' + cm.formatPhone(value)" tooltipPosition="top">
// //                   <i class="pi pi-phone mcell-icon"></i>
// //                   <span>{{ cm.formatPhone(value) }}</span>
// //                 </a>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('url') {
// //               @if (value) {
// //                 <a class="mcell-link mcell-url" [href]="value"
// //                   target="_blank" rel="noopener"
// //                   (click)="onLinkClick($event, value)"
// //                   [pTooltip]="value" tooltipPosition="top">
// //                   <i class="pi pi-external-link mcell-icon"></i>
// //                   <span>{{ cm.truncateText(value, 30) }}</span>
// //                 </a>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('progress') {
// //               <div class="mcell-progress-wrap">
// //                 <div class="mcell-progress-track">
// //                   <div class="mcell-progress-fill"
// //                     [style.width.%]="getProgressPct()"
// //                     [class.is-complete]="getProgressPct() >= 100"
// //                     [class.is-warning]="getProgressPct() >= 60 && getProgressPct() < 100"
// //                     [class.is-low]="getProgressPct() < 30">
// //                   </div>
// //                 </div>
// //                 @if (config.showValue !== false) {
// //                   <span class="mcell-progress-label" [class.is-complete]="getProgressPct() >= 100">
// //                     {{ getProgressPct() }}%
// //                   </span>
// //                 }
// //               </div>
// //             }

// //             @case ('avatar') {
// //               <div class="mcell-avatar-wrap">
// //                 @if (value && isImageUrl(value)) {
// //                   <div class="mcell-avatar"><img [src]="value" [alt]="getAvatarInitials()" loading="lazy" /></div>
// //                 } @else {
// //                   <div class="mcell-avatar" [style.background]="getAvatarBg()" [style.color]="getAvatarColor()">
// //                     <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
// //                   </div>
// //                 }
// //                 @if (config.labelField) {
// //                   <span class="mcell-avatar-label">{{ params?.data?.[config.labelField] ?? '—' }}</span>
// //                 }
// //               </div>
// //             }

// //             @case ('tags') {
// //               @if (asTags(value).length) {
// //                 <div class="mcell-tags">
// //                   @for (tag of asTags(value).slice(0, config.maxTags ?? 3); track tag) {
// //                     <span class="mcell-tag">{{ tag }}</span>
// //                   }
// //                   @if (asTags(value).length > (config.maxTags ?? 3)) {
// //                     <span class="mcell-tag mcell-tag-more"
// //                       [pTooltip]="asTags(value).slice(config.maxTags ?? 3).join(', ')"
// //                       tooltipPosition="top">
// //                       +{{ asTags(value).length - (config.maxTags ?? 3) }}
// //                     </span>
// //                   }
// //                 </div>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('color') {
// //               @if (value) {
// //                 <div class="mcell-color">
// //                   <span class="mcell-color-swatch" [style.background]="value"></span>
// //                   <span class="mcell-color-label">{{ value }}</span>
// //                 </div>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('filesize') {
// //               @if (value != null) {
// //                 <span class="mcell-mono-chip">
// //                   <i class="pi pi-file mcell-icon"></i>
// //                   {{ cm.formatFileSize(value) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('duration') {
// //               @if (value != null) {
// //                 <span class="mcell-mono-chip">
// //                   <i class="pi pi-clock mcell-icon"></i>
// //                   {{ cm.formatDuration(value) }}
// //                 </span>
// //               } @else { <span class="mcell-empty">—</span> }
// //             }

// //             @case ('rating') {
// //               <div class="mcell-rating">
// //                 @for (star of getRatingStars(); track $index) {
// //                   <i class="pi" [class.pi-star-fill]="star" [class.pi-star]="!star" [class.is-filled]="star"></i>
// //                 }
// //                 @if (config.showValue !== false) {
// //                   <span class="mcell-rating-val">{{ value }}</span>
// //                 }
// //               </div>
// //             }

// //             @case ('initials') {
// //               <div class="mcell-initials-chip"
// //                 [style.background]="getAvatarBg()"
// //                 [style.color]="getAvatarColor()"
// //                 [pTooltip]="value" tooltipPosition="top">
// //                 {{ cm.getInitials(value ?? '') }}
// //               </div>
// //             }

// //             @case ('textarea') {
// //               <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
// //             }

// //             @default {
// //               <span class="mcell-text" [title]="value">
// //                 {{ value != null ? cm.truncateText(String(value), 50) : '—' }}
// //               </span>
// //             }

// //           }
// //         </div>
// //       }

// //     </div>
// //   `,
// //   styles: [`

// //     /* ══════════════════════════════════════════════════════
// //        MASTER CELL v2.2 — token-first view mode redesign
// //     ══════════════════════════════════════════════════════ */

// //     app-master-cell {
// //       display: flex;
// //       align-items: stretch;
// //       width: 100%;
// //       height: 100%;
// //     }

// //     /* ── ROOT ──────────────────────────────────────────── */
// //     .mcell-root {
// //       display: flex;
// //       align-items: center;
// //       width: 100%;
// //       height: 100%;
// //       overflow: hidden;
// //       transition: background var(--transition-fast);
// //     }
// //     .mcell-root.is-editing {
// //       background: color-mix(in srgb, var(--theme-accent-primary) 5%, transparent 95%);
// //     }
// //     .mcell-root.is-readonly .mcell-viewer {
// //       opacity: 0.5;
// //       cursor: not-allowed;
// //       pointer-events: none;
// //     }

// //     /* ── VIEWER SHELL ──────────────────────────────────── */
// //     .mcell-viewer {
// //       display: flex;
// //       align-items: center;
// //       width: 100%;
// //       height: 100%;
// //       padding: 0 var(--spacing-md);
// //       overflow: hidden;
// //       white-space: nowrap;
// //       gap: var(--spacing-xs);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       font-family: var(--font-body);
// //     }

// //     /* ── SHARED ICON ───────────────────────────────────── */
// //     .mcell-icon {
// //       font-size: 0.62rem;
// //       color: var(--theme-text-tertiary);
// //       flex-shrink: 0;
// //       opacity: 0.7;
// //       transition: color var(--transition-fast), opacity var(--transition-fast);
// //     }

// //     /* ── EMPTY PLACEHOLDER ─────────────────────────────── */
// //     .mcell-empty {
// //       color: var(--theme-text-tertiary);
// //       font-size: var(--font-size-xs);
// //       opacity: 0.5;
// //       letter-spacing: 0.02em;
// //       user-select: none;
// //     }

// //     /* ── TEXT / SELECT ─────────────────────────────────── */
// //     .mcell-text,
// //     .mcell-select-val {
// //       overflow: hidden;
// //       text-overflow: ellipsis;
// //       white-space: nowrap;
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       font-weight: var(--font-weight-normal);
// //       line-height: var(--line-height-normal);
// //     }

// //     .mcell-multiline {
// //       overflow: hidden;
// //       text-overflow: ellipsis;
// //       white-space: normal;
// //       display: -webkit-box;
// //       -webkit-line-clamp: 2;
// //       -webkit-box-orient: vertical;
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-secondary);
// //       line-height: var(--line-height-relaxed);
// //     }

// //     /* ── NUMBER ────────────────────────────────────────── */
// //     .mcell-number {
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-sm);
// //       font-weight: var(--font-weight-semibold);
// //       color: var(--theme-text-primary);
// //       letter-spacing: -0.3px;
// //     }

// //     /* ── PERCENT — inline bar ──────────────────────────── */
// //     .mcell-percent-wrap {
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //       width: 100%;
// //       min-width: 0;
// //     }
// //     .mcell-percent {
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--theme-accent-primary);
// //       flex-shrink: 0;
// //       min-width: 32px;
// //       letter-spacing: -0.2px;
// //     }
// //     .mcell-pct-bar-track {
// //       flex: 1;
// //       height: 3px;
// //       background: var(--theme-bg-ternary);
// //       border-radius: var(--ui-border-radius-pill);
// //       overflow: hidden;
// //     }
// //     .mcell-pct-bar-fill {
// //       height: 100%;
// //       background: var(--theme-accent-primary);
// //       border-radius: var(--ui-border-radius-pill);
// //       transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
// //     }

// //     /* ── CURRENCY ──────────────────────────────────────── */
// //     .mcell-currency {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: 3px;
// //       font-family: var(--font-mono);
// //       font-weight: var(--font-weight-semibold);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       letter-spacing: -0.3px;
// //     }
// //     .mcell-currency-arrow {
// //       font-size: 0.6rem;
// //       opacity: 0.45;
// //     }
// //     .mcell-currency.is-negative {
// //       color: var(--theme-error, #ef4444);
// //     }
// //     .mcell-currency.is-negative .mcell-currency-arrow {
// //       opacity: 0.75;
// //     }

// //     /* ── DATE ──────────────────────────────────────────── */
// //     .mcell-date,
// //     .mcell-timeago {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: var(--spacing-xs);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-secondary);
// //       overflow: hidden;
// //       cursor: default;
// //     }
// //     .mcell-date-text {
// //       overflow: hidden;
// //       text-overflow: ellipsis;
// //       white-space: nowrap;
// //       color: var(--theme-text-primary);
// //     }
// //     .mcell-today-badge {
// //       display: inline-flex;
// //       align-items: center;
// //       padding: 1px 6px;
// //       border-radius: var(--ui-border-radius-pill);
// //       background: color-mix(in srgb, var(--theme-accent-primary) 14%, transparent 86%);
// //       color: var(--theme-accent-primary);
// //       font-size: 0.58rem;
// //       font-weight: var(--font-weight-bold);
// //       letter-spacing: 0.04em;
// //       text-transform: uppercase;
// //       flex-shrink: 0;
// //       border: 1px solid color-mix(in srgb, var(--theme-accent-primary) 22%, transparent 78%);
// //     }
// //     .mcell-date.is-today .mcell-date-text,
// //     .mcell-date.is-today .mcell-icon {
// //       color: var(--theme-accent-primary);
// //     }
// //     .mcell-date.is-overdue .mcell-date-text,
// //     .mcell-date.is-overdue .mcell-icon {
// //       color: var(--theme-error, #ef4444);
// //     }
// //     .mcell-date.is-overdue .mcell-icon { opacity: 1; }
// //     .mcell-timeago {
// //       font-size: var(--font-size-xs);
// //       color: var(--theme-text-tertiary);
// //       font-style: italic;
// //     }

// //     /* ── BOOLEAN CHIP ──────────────────────────────────── */
// //     .mcell-bool { display: flex; align-items: center; }
// //     .mcell-bool-chip {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: 4px;
// //       padding: 2px 9px 2px 7px;
// //       border-radius: var(--ui-border-radius-pill);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-semibold);
// //       letter-spacing: 0.02em;
// //       border: 1px solid transparent;
// //       transition: var(--transition-fast);
// //     }
// //     .mcell-bool-chip i { font-size: 0.58rem; }
// //     .mcell-bool-chip.is-true {
// //       background: color-mix(in srgb, var(--theme-success, #22c55e) 11%, transparent 89%);
// //       color: var(--theme-success, #22c55e);
// //       border-color: color-mix(in srgb, var(--theme-success, #22c55e) 22%, transparent 78%);
// //     }
// //     .mcell-bool-chip.is-false {
// //       background: var(--theme-bg-ternary);
// //       color: var(--theme-text-tertiary);
// //       border-color: var(--theme-border-primary);
// //     }

// //     /* ── BADGE ─────────────────────────────────────────── */
// //     .mcell-badge {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: 5px;
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       text-transform: uppercase;
// //       letter-spacing: 0.055em;
// //       padding: 2px 8px 2px 6px;
// //       border-radius: var(--ui-border-radius-sm);
// //       border: 1px solid var(--theme-border-primary);
// //       background: var(--theme-bg-ternary);
// //       color: var(--theme-text-tertiary);
// //       white-space: nowrap;
// //       transition: var(--transition-fast);
// //     }
// //     .mcell-badge-dot {
// //       width: 5px;
// //       height: 5px;
// //       border-radius: 50%;
// //       background: currentColor;
// //       flex-shrink: 0;
// //       opacity: 0.85;
// //     }
// //     .mcell-badge[data-sev="success"] {
// //       background: color-mix(in srgb, var(--theme-success, #22c55e) 10%, transparent 90%);
// //       color: var(--theme-success, #22c55e);
// //       border-color: color-mix(in srgb, var(--theme-success, #22c55e) 22%, transparent 78%);
// //     }
// //     .mcell-badge[data-sev="warning"] {
// //       background: color-mix(in srgb, var(--theme-warning, #f59e0b) 10%, transparent 90%);
// //       color: var(--theme-warning, #f59e0b);
// //       border-color: color-mix(in srgb, var(--theme-warning, #f59e0b) 22%, transparent 78%);
// //     }
// //     .mcell-badge[data-sev="danger"] {
// //       background: color-mix(in srgb, var(--theme-error, #ef4444) 10%, transparent 90%);
// //       color: var(--theme-error, #ef4444);
// //       border-color: color-mix(in srgb, var(--theme-error, #ef4444) 22%, transparent 78%);
// //     }
// //     .mcell-badge[data-sev="info"] {
// //       background: color-mix(in srgb, var(--theme-accent-primary) 9%, transparent 91%);
// //       color: var(--theme-accent-primary);
// //       border-color: color-mix(in srgb, var(--theme-accent-primary) 20%, transparent 80%);
// //     }

// //     /* ── LINKS ─────────────────────────────────────────── */
// //     .mcell-link {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: var(--spacing-xs);
// //       color: var(--theme-accent-primary);
// //       text-decoration: none;
// //       font-size: var(--font-size-sm);
// //       overflow: hidden;
// //       white-space: nowrap;
// //       border-radius: 3px;
// //       padding: 1px 3px;
// //       margin: -1px -3px;
// //       transition: var(--transition-fast);
// //     }
// //     .mcell-link span { overflow: hidden; text-overflow: ellipsis; }
// //     .mcell-link:hover {
// //       text-decoration: underline;
// //       color: var(--theme-accent-hover);
// //       background: color-mix(in srgb, var(--theme-accent-primary) 6%, transparent 94%);
// //     }
// //     .mcell-link:hover .mcell-icon { color: var(--theme-accent-hover); opacity: 1; }
// //     .mcell-link:focus-visible {
// //       outline: var(--focus-ring-width) solid var(--theme-accent-focus);
// //       outline-offset: var(--focus-ring-offset);
// //     }

// //     /* ── PROGRESS ──────────────────────────────────────── */
// //     .mcell-progress-wrap {
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //       width: 100%;
// //       padding: 0 2px;
// //     }
// //     .mcell-progress-track {
// //       flex: 1;
// //       height: 5px;
// //       background: var(--theme-bg-ternary);
// //       border-radius: var(--ui-border-radius-pill);
// //       overflow: hidden;
// //     }
// //     .mcell-progress-fill {
// //       height: 100%;
// //       background: var(--theme-accent-primary);
// //       border-radius: var(--ui-border-radius-pill);
// //       transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
// //     }
// //     .mcell-progress-fill.is-complete { background: var(--theme-success, #22c55e); }
// //     .mcell-progress-fill.is-warning  { background: var(--theme-warning, #f59e0b); }
// //     .mcell-progress-fill.is-low      { background: var(--theme-error, #ef4444); }
// //     .mcell-progress-label {
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--theme-text-secondary);
// //       flex-shrink: 0;
// //       min-width: 30px;
// //       text-align: right;
// //     }
// //     .mcell-progress-label.is-complete { color: var(--theme-success, #22c55e); }

// //     /* ── AVATAR ────────────────────────────────────────── */
// //     .mcell-avatar-wrap {
// //       display: flex;
// //       align-items: center;
// //       gap: var(--spacing-sm);
// //       overflow: hidden;
// //     }
// //     .mcell-avatar {
// //       width: 26px;
// //       height: 26px;
// //       border-radius: 50%;
// //       overflow: hidden;
// //       border: 1.5px solid var(--theme-border-primary);
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //       flex-shrink: 0;
// //       box-shadow: var(--elevation-1);
// //     }
// //     .mcell-avatar img { width: 100%; height: 100%; object-fit: cover; }
// //     .mcell-avatar-initials {
// //       font-size: 0.58rem;
// //       font-weight: var(--font-weight-bold);
// //       letter-spacing: 0.03em;
// //       text-transform: uppercase;
// //     }
// //     .mcell-avatar-label {
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       font-weight: var(--font-weight-medium);
// //       overflow: hidden;
// //       text-overflow: ellipsis;
// //       white-space: nowrap;
// //     }

// //     /* ── INITIALS CHIP ─────────────────────────────────── */
// //     .mcell-initials-chip {
// //       display: inline-flex;
// //       align-items: center;
// //       justify-content: center;
// //       width: 26px;
// //       height: 26px;
// //       border-radius: 50%;
// //       font-size: 0.58rem;
// //       font-weight: var(--font-weight-bold);
// //       text-transform: uppercase;
// //       letter-spacing: 0.03em;
// //       flex-shrink: 0;
// //       border: 1.5px solid rgba(255,255,255,0.2);
// //       box-shadow: var(--elevation-1);
// //       cursor: default;
// //     }

// //     /* ── TAGS ──────────────────────────────────────────── */
// //     .mcell-tags {
// //       display: flex;
// //       align-items: center;
// //       gap: 3px;
// //       overflow: hidden;
// //       flex-wrap: nowrap;
// //     }
// //     .mcell-tag {
// //       display: inline-block;
// //       font-size: 0.58rem;
// //       font-weight: var(--font-weight-semibold);
// //       padding: 1px 6px;
// //       border-radius: var(--ui-border-radius-sm);
// //       background: var(--theme-bg-ternary);
// //       color: var(--theme-text-secondary);
// //       border: 1px solid var(--theme-border-primary);
// //       white-space: nowrap;
// //       letter-spacing: 0.02em;
// //     }
// //     .mcell-tag-more {
// //       background: color-mix(in srgb, var(--theme-accent-primary) 9%, var(--theme-bg-ternary) 91%);
// //       color: var(--theme-accent-primary);
// //       border-color: color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// //       cursor: pointer;
// //     }

// //     /* ── COLOR SWATCH ──────────────────────────────────── */
// //     .mcell-color { display: flex; align-items: center; gap: var(--spacing-sm); }
// //     .mcell-color-swatch {
// //       width: 14px;
// //       height: 14px;
// //       border-radius: 3px;
// //       border: 1px solid var(--theme-border-secondary);
// //       flex-shrink: 0;
// //       box-shadow: var(--shadow-xs);
// //     }
// //     .mcell-color-label {
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-xs);
// //       color: var(--theme-text-secondary);
// //       letter-spacing: 0.03em;
// //     }

// //     /* ── MONO CHIP (filesize / duration) ───────────────── */
// //     .mcell-mono-chip {
// //       display: inline-flex;
// //       align-items: center;
// //       gap: var(--spacing-xs);
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-secondary);
// //       font-weight: var(--font-weight-medium);
// //       background: var(--theme-bg-ternary);
// //       border: 1px solid var(--theme-border-primary);
// //       padding: 1px 7px;
// //       border-radius: var(--ui-border-radius-sm);
// //     }

// //     /* ── RATING ────────────────────────────────────────── */
// //     .mcell-rating { display: flex; align-items: center; gap: 2px; }
// //     .mcell-rating i {
// //       font-size: 0.7rem;
// //       color: var(--theme-border-secondary);
// //       transition: color var(--transition-fast);
// //     }
// //     .mcell-rating i.is-filled { color: var(--theme-warning, #f59e0b); }
// //     .mcell-rating-val {
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-xs);
// //       font-weight: var(--font-weight-bold);
// //       color: var(--theme-text-secondary);
// //       margin-left: 3px;
// //     }

// //     /* ══════════════════════════════════════════════════════
// //        EDITOR FIELDS
// //     ══════════════════════════════════════════════════════ */

// //     .mc-input {
// //       width: 100%;
// //       height: 28px;
// //       padding: 0 var(--spacing-md, 8px);
// //       font-family: var(--font-body);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       background: var(--theme-bg-primary);
// //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// //       border-radius: var(--ui-border-radius-sm, 6px);
// //       outline: none;
// //       transition: var(--transition-fast);
// //       box-sizing: border-box;
// //     }
// //     .mc-input:focus {
// //       border-color: var(--theme-accent-primary);
// //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// //     }
// //     .mc-input::placeholder { color: var(--theme-text-tertiary); font-size: var(--font-size-xs); }

// //     .mc-textarea {
// //       width: 100%;
// //       min-height: 28px;
// //       padding: var(--spacing-xs) var(--spacing-md);
// //       font-family: var(--font-body);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       background: var(--theme-bg-primary);
// //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// //       border-radius: var(--ui-border-radius-sm, 6px);
// //       outline: none;
// //       resize: none;
// //       transition: var(--transition-fast);
// //       box-sizing: border-box;
// //     }
// //     .mc-textarea:focus {
// //       border-color: var(--theme-accent-primary);
// //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// //     }

// //     .mc-input-number { width: 100%; }
// //     .mc-input-number .p-inputnumber-input {
// //       width: 100%;
// //       height: 28px;
// //       padding: 0 var(--spacing-md);
// //       font-family: var(--font-mono);
// //       font-size: var(--font-size-sm);
// //       text-align: right;
// //       color: var(--theme-text-primary);
// //       background: var(--theme-bg-primary);
// //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// //       border-radius: var(--ui-border-radius-sm, 6px);
// //       outline: none;
// //       transition: var(--transition-fast);
// //     }
// //     .mc-input-number .p-inputnumber-input:focus {
// //       border-color: var(--theme-accent-primary);
// //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// //     }

// //     .mc-select {
// //       width: 100%;
// //       height: 28px;
// //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// //       border-radius: var(--ui-border-radius-sm, 6px);
// //       transition: var(--transition-fast);
// //     }
// //     .mc-select .p-select-label {
// //       font-family: var(--font-body);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       padding: 0 var(--spacing-md);
// //       line-height: 28px;
// //     }
// //     .mc-select.p-focus,
// //     .mc-select:focus-within {
// //       border-color: var(--theme-accent-primary);
// //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// //       outline: none;
// //     }

// //     .mc-datepicker { width: 100%; }
// //     .mc-datepicker .p-datepicker-input {
// //       width: 100%;
// //       height: 28px;
// //       padding: 0 var(--spacing-md);
// //       font-family: var(--font-body);
// //       font-size: var(--font-size-sm);
// //       color: var(--theme-text-primary);
// //       background: var(--theme-bg-primary);
// //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// //       border-radius: var(--ui-border-radius-sm, 6px);
// //       outline: none;
// //       transition: var(--transition-fast);
// //     }
// //     .mc-datepicker .p-datepicker-input:focus {
// //       border-color: var(--theme-accent-primary);
// //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// //     }
// //     .mc-datepicker .p-datepicker-trigger { display: none; }

// //     .mc-checkbox-wrap {
// //       display: flex;
// //       align-items: center;
// //       justify-content: center;
// //       width: 100%;
// //       height: 100%;
// //     }

// //   `],
// // })
// // export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

// //   private readonly el = inject(ElementRef);
// //   private readonly cdr = inject(ChangeDetectorRef);
// //   readonly cm = inject(CommonMethodService);
// //   readonly String = String;

// //   readonly cellInteraction = output<CellInteractionEvent>();

// //   params!: any;
// //   config: CellConfig = { type: 'text' };
// //   value: any;
// //   draftValue: any;

// //   get showEditor(): boolean {
// //     if (this.config.readOnly) return false;
// //     if (this.config.alwaysEditable) return true;
// //     return this.isRowEditing();
// //   }

// //   private isRowEditing(): boolean {
// //     try {
// //       const parent = this.params?.context?.componentParent;
// //       return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
// //     } catch { return false; }
// //   }

// //   isNegativeValue(): boolean {
// //     return (this.config.type === 'currency' || this.config.type === 'number')
// //       ? Number(this.value) < 0 : false;
// //   }

// //   isOverdue(): boolean {
// //     if (!this.value || this.config.type !== 'date') return false;
// //     return this.cm.isPast(this.value) && !this.cm.isToday(this.value);
// //   }

// //   /* ── AG GRID LIFECYCLE ───────────────────────────────── */
// //   agInit(params: any): void {
// //     this.params = params;
// //     this.config = params.cellConfig || { type: 'text' };
// //     this.value = params.value;
// //     this.draftValue = params.value;
// //   }

// //   refresh(params: any): boolean {
// //     this.params = params;
// //     this.config = params.cellConfig || { type: 'text' };
// //     this.value = params.value;
// //     if (!this.isRowEditing() && !this.config.alwaysEditable) {
// //       this.draftValue = params.value;
// //     }
// //     this.cdr.markForCheck();
// //     return true;
// //   }

// //   afterGuiAttached(): void {
// //     if (this.showEditor) this.focusEditor();
// //   }

// //   ngOnDestroy(): void { }

// //   /* ── FOCUS — microtask pattern ───────────────────────── */
// //   private focusEditor(): void {
// //     Promise.resolve().then(() => {
// //       const host = this.el.nativeElement as HTMLElement;
// //       const target =
// //         host.querySelector<HTMLElement>('input:not([type="hidden"]), textarea') ??
// //         host.querySelector<HTMLElement>('.p-select .p-select-label, .p-checkbox-box, [tabindex="0"]');
// //       if (!target) return;

// //       const agCell = host.closest<HTMLElement>('.ag-cell');
// //       if (agCell) agCell.classList.add('ag-cell-inline-editing');

// //       target.focus({ preventScroll: false });

// //       if (target instanceof HTMLInputElement && ['text', 'email', 'tel', 'url'].includes(target.type)) {
// //         target.select();
// //       }
// //     });
// //   }

// //   /* ── EDITOR EVENTS ───────────────────────────────────── */
// //   onDraftChange(val: any): void {
// //     this.draftValue = val;
// //     const parent = this.params?.context?.componentParent;
// //     const id = this.params?.node?.id;
// //     const field = this.params?.colDef?.field;
// //     if (parent && id && field) parent.updateDraft(id, field, val);
// //     this.emit('change', null);
// //   }

// //   onKeydown(event: KeyboardEvent): void {
// //     if (event.key === 'Enter') {
// //       if (this.config.enterToSave === true) {
// //         event.preventDefault();
// //         event.stopPropagation();
// //         this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
// //       }
// //       this.emit('enter', event);
// //     }
// //     if (event.key === 'Escape') {
// //       event.preventDefault();
// //       event.stopPropagation();
// //       this.params?.context?.componentParent?.handleRowAction('cancel', this.params.data);
// //       this.emit('escape', event);
// //     }
// //   }

// //   onEditorFocus(event: Event | null | undefined): void { this.emit('focus', event ?? null); }
// //   onBlur(event: Event | null | undefined): void {
// //     this.emit('blur', event ?? null);
// //     if (this.config.alwaysEditable && this.config.enterToSave) {
// //       this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
// //     }
// //   }
// //   onViewClick(event: MouseEvent): void { if (!this.showEditor) this.emit('click', event); }
// //   onLinkClick(event: MouseEvent, _value: any): void {
// //     event.stopPropagation();
// //     this.emit('linkClick', event);
// //   }

// //   private emit(type: CellInteractionType, nativeEvent: Event | null): void {
// //     if (this.config.emitEvents === false) return;
// //     const event: CellInteractionEvent = {
// //       interactionType: type,
// //       cellType: this.config.type,
// //       value: this.value,
// //       draftValue: this.draftValue,
// //       field: this.params?.colDef?.field ?? '',
// //       rowId: this.params?.node?.id ?? '',
// //       rowData: this.params?.data ?? null,
// //       nativeEvent,
// //     };
// //     this.cellInteraction.emit(event);
// //     const parent = this.params?.context?.componentParent;
// //     if (parent && typeof parent.onCellInteraction === 'function') {
// //       parent.onCellInteraction(event);
// //     }
// //   }

// //   /* ── VIEW HELPERS ────────────────────────────────────── */
// //   getSelectLabel(value: any): string {
// //     if (!this.config.options) return value ?? '—';
// //     const opt = this.config.options.find(
// //       (o) => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
// //     );
// //     return opt?.label ?? value ?? '—';
// //   }

// //   getBadgeSeverity(value: any): string {
// //     if (this.config.badgeMap) {
// //       const sev = this.config.badgeMap[String(value)];
// //       if (sev) return sev;
// //     }
// //     const severity = this.cm.mapStatusToSeverity(String(value ?? ''));
// //     if (severity === 'warn') return 'warning';
// //     return severity ?? 'secondary';
// //   }

// //   getProgressPct(): number {
// //     return this.cm.clamp(
// //       Math.round(((this.value ?? 0) / (this.config.max ?? 100)) * 100),
// //       0, 100
// //     );
// //   }

// //   getAvatarInitials(): string {
// //     const field = this.config.labelField;
// //     const name = field ? this.params?.data?.[field] : (this.params?.data?.name ?? this.value);
// //     return this.cm.getInitials(name ?? '') || '?';
// //   }

// //   getAvatarBg(): string {
// //     const field = this.config.labelField;
// //     const name = field ? this.params?.data?.[field] : (this.params?.data?.name ?? this.value ?? '');
// //     return this.cm.stringToColor(String(name));
// //   }

// //   getAvatarColor(): string { return this.cm.getContrastColor(this.getAvatarBg()); }
// //   isImageUrl(val: any): boolean {
// //     return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
// //   }
// //   asTags(val: any): string[] {
// //     if (!val) return [];
// //     if (Array.isArray(val)) return val.map(String);
// //     return String(val).split(',').map((s) => s.trim()).filter(Boolean);
// //   }
// //   getRatingStars(): boolean[] {
// //     const max = this.config.max ?? 5;
// //     const filled = Math.round(Number(this.value) || 0);
// //     return Array.from({ length: max }, (_, i) => i < filled);
// //   }
// // }
// // // import {
// // //   Component,
// // //   ViewEncapsulation,
// // //   ElementRef,
// // //   OnDestroy,
// // //   ChangeDetectionStrategy,
// // //   ChangeDetectorRef,
// // //   inject,
// // //   output,
// // // } from '@angular/core';

// // // import { FormsModule } from '@angular/forms';
// // // import { ICellRendererAngularComp } from 'ag-grid-angular';

// // // // PrimeNG v18/19 imports
// // // import { InputTextModule } from 'primeng/inputtext';
// // // import { InputNumberModule } from 'primeng/inputnumber';
// // // import { TextareaModule } from 'primeng/textarea';
// // // import { SelectModule } from 'primeng/select';
// // // import { DatePickerModule } from 'primeng/datepicker';
// // // import { CheckboxModule } from 'primeng/checkbox';
// // // import { TagModule } from 'primeng/tag';
// // // import { TooltipModule } from 'primeng/tooltip';

// // // import {
// // //   CellConfig,
// // //   CellInteractionEvent,
// // //   CellInteractionType,
// // //   MasterCellParams,
// // //   SelectOption,
// // // } from '../grid.types';
// // // import { CommonMethodService } from '@core/utils/common-method.service';


// // // /* ==========================================================================
// // //    MASTER CELL COMPONENT  v2.1

// // //    TAB FOCUS FIX applied:
// // //    - focusEditor() now uses Promise.resolve() microtask instead of
// // //      requestAnimationFrame + setTimeout(40ms).
// // //    - Microtask fires BEFORE the browser paints the next frame, eliminating
// // //      the flash where the AG Grid cell wrapper <div> appears focused.
// // //    - agCell.classList.add('ag-cell-inline-editing') prevents AG Grid from
// // //      stealing focus back when it detects the focusin event.

// // //    Tab navigation is handled by tabToNextCell() in AppSharedGrid.
// // //    ========================================================================== */
// // // @Component({
// // //   selector: 'app-master-cell',
// // //   standalone: true,
// // //   changeDetection: ChangeDetectionStrategy.OnPush,
// // //   encapsulation: ViewEncapsulation.None,
// // //   imports: [
// // //     FormsModule,
// // //     InputTextModule,
// // //     InputNumberModule,
// // //     TextareaModule,
// // //     SelectModule,
// // //     DatePickerModule,
// // //     CheckboxModule,
// // //     TagModule,
// // //     TooltipModule
// // // ],
// // //   template: `
// // //     <div
// // //       class="mcell-root"
// // //       [class.is-editing]="showEditor"
// // //       [class.is-readonly]="config.readOnly"
// // //       [class.is-negative]="isNegativeValue()"
// // //       (click)="onViewClick($event)"
// // //     >

// // //       <!-- ════════════════════════════════════════════════
// // //            EDITOR MODE
// // //            Shown when: (row is editing OR alwaysEditable) AND NOT readOnly
// // //       ════════════════════════════════════════════════ -->
// // //       @if (showEditor) {

// // //         @switch (config.type) {

// // //           <!-- TEXT -->
// // //           @case ('text') {
// // //             <input
// // //               pInputText
// // //               class="mc-input"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               (keydown)="onKeydown($event)"
// // //               (focus)="onEditorFocus($event)"
// // //               (blur)="onBlur($event)"
// // //               [placeholder]="config.placeholder || ''"
// // //               autocomplete="off"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- EMAIL -->
// // //           @case ('email') {
// // //             <input
// // //               pInputText
// // //               type="email"
// // //               class="mc-input"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               (keydown)="onKeydown($event)"
// // //               (focus)="onEditorFocus($event)"
// // //               (blur)="onBlur($event)"
// // //               [placeholder]="config.placeholder || 'email@example.com'"
// // //               autocomplete="off"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- PHONE -->
// // //           @case ('phone') {
// // //             <input
// // //               pInputText
// // //               type="tel"
// // //               class="mc-input"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               (keydown)="onKeydown($event)"
// // //               (focus)="onEditorFocus($event)"
// // //               (blur)="onBlur($event)"
// // //               [placeholder]="config.placeholder || '+91 00000 00000'"
// // //               autocomplete="off"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- URL -->
// // //           @case ('url') {
// // //             <input
// // //               pInputText
// // //               type="url"
// // //               class="mc-input"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               (keydown)="onKeydown($event)"
// // //               (focus)="onEditorFocus($event)"
// // //               (blur)="onBlur($event)"
// // //               [placeholder]="config.placeholder || 'https://'"
// // //               autocomplete="off"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- NUMBER -->
// // //           @case ('number') {
// // //             <p-inputNumber
// // //               class="mc-input-number"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               mode="decimal"
// // //               [minFractionDigits]="config.minFractionDigits ?? 0"
// // //               [maxFractionDigits]="config.maxFractionDigits ?? 2"
// // //               [min]="config.min ?? null"
// // //               [max]="config.max ?? null"
// // //               [useGrouping]="true"
// // //               [placeholder]="config.placeholder || ''"
// // //               (onFocus)="onEditorFocus($event)"
// // //               (onBlur)="onBlur($event)"
// // //               (onKeyDown)="onKeydown($event)"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- CURRENCY -->
// // //           @case ('currency') {
// // //             <p-inputNumber
// // //               class="mc-input-number"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               mode="currency"
// // //               [currency]="config.currencyCode ?? 'INR'"
// // //               [locale]="config.currencyLocale ?? 'en-IN'"
// // //               [minFractionDigits]="config.minFractionDigits ?? 2"
// // //               [min]="config.min ?? null"
// // //               [max]="config.max ?? null"
// // //               [placeholder]="config.placeholder || ''"
// // //               (onFocus)="onEditorFocus($event)"
// // //               (onBlur)="onBlur($event)"
// // //               (onKeyDown)="onKeydown($event)"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- DATE -->
// // //           @case ('date') {
// // //             <p-datepicker
// // //               class="mc-datepicker"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               appendTo="body"
// // //               [dateFormat]="config.datePickerFormat ?? 'dd/mm/yy'"
// // //               [showTime]="config.showTime ?? false"
// // //               [showButtonBar]="true"
// // //               [placeholder]="config.placeholder || 'Select date'"
// // //               [panelStyleClass]="'mc-calendar-panel'"
// // //               (onFocus)="onEditorFocus($event)"
// // //               (onBlur)="onBlur($event)"
// // //               (onSelect)="onDraftChange($event)"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- SELECT -->
// // //           @case ('select') {
// // //             <p-select
// // //               class="mc-select"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               [options]="config.options ?? []"
// // //               [optionLabel]="config.optionLabel ?? 'label'"
// // //               [optionValue]="config.optionValue ?? 'value'"
// // //               appendTo="body"
// // //               [filter]="(config.options?.length ?? 0) > 7"
// // //               [showClear]="true"
// // //               [placeholder]="config.placeholder || 'Select…'"
// // //               [panelStyleClass]="'mc-dropdown-panel'"
// // //               (onFocus)="onEditorFocus($event)"
// // //               (onBlur)="onBlur($event)"
// // //               #focusTarget
// // //             />
// // //           }

// // //           <!-- BOOLEAN / CHECKBOX -->
// // //           @case ('boolean') {
// // //             <div
// // //               class="mc-checkbox-wrap"
// // //               (focusin)="onEditorFocus($event)"
// // //               (focusout)="onBlur($event)"
// // //             >
// // //               <p-checkbox
// // //                 [ngModel]="draftValue"
// // //                 (ngModelChange)="onDraftChange($event)"
// // //                 [binary]="true"
// // //                 #focusTarget
// // //               />
// // //             </div>
// // //           }

// // //           <!-- TEXTAREA -->
// // //           @case ('textarea') {
// // //             <textarea
// // //               pTextarea
// // //               class="mc-textarea"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               (keydown)="onKeydown($event)"
// // //               (focus)="onEditorFocus($event)"
// // //               (blur)="onBlur($event)"
// // //               [rows]="config.rows ?? 2"
// // //               [placeholder]="config.placeholder || ''"
// // //               autoResize="true"
// // //               #focusTarget
// // //             ></textarea>
// // //           }

// // //           <!-- FALLBACK -->
// // //           @default {
// // //             <input
// // //               pInputText
// // //               class="mc-input"
// // //               [ngModel]="draftValue"
// // //               (ngModelChange)="onDraftChange($event)"
// // //               (keydown)="onKeydown($event)"
// // //               (focus)="onEditorFocus($event)"
// // //               (blur)="onBlur($event)"
// // //               [placeholder]="config.placeholder || ''"
// // //               autocomplete="off"
// // //               #focusTarget
// // //             />
// // //           }
// // //         }
// // //       }

// // //       <!-- ════════════════════════════════════════════════
// // //            VIEW MODE
// // //            Shown when: not editing, OR readOnly=true
// // //       ════════════════════════════════════════════════ -->
// // //       @if (!showEditor) {

// // //         <div class="mcell-viewer">
// // //           @switch (config.type) {

// // //             <!-- TEXT -->
// // //             @case ('text') {
// // //               @if (value) {
// // //                 <span class="mcell-text" [title]="value">
// // //                   {{ cm.truncateText(value, config.truncateAt ?? 50) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- NUMBER -->
// // //             @case ('number') {
// // //               @if (value != null) {
// // //                 <span class="mcell-number">
// // //                   {{ cm.formatNumber(value, config.maxFractionDigits ?? 2) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- CURRENCY -->
// // //             @case ('currency') {
// // //               @if (value != null) {
// // //                 <span class="mcell-currency" [class.is-negative]="value < 0">
// // //                   <span class="mcell-currency-arrow">{{ value < 0 ? '▼' : '▲' }}</span>
// // //                   {{ cm.formatCurrency(value) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- PERCENT -->
// // //             @case ('percent') {
// // //               @if (value != null) {
// // //                 <span class="mcell-percent">
// // //                   {{ cm.formatPercent(value / 100, 1) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- DATE -->
// // //             @case ('date') {
// // //               @if (value) {
// // //                 <span
// // //                   class="mcell-date"
// // //                   [class.is-today]="cm.isToday(value)"
// // //                   [class.is-overdue]="isOverdue()"
// // //                   [pTooltip]="cm.timeAgoText(value)"
// // //                   tooltipPosition="top"
// // //                 >
// // //                   <i class="pi pi-calendar mcell-meta-icon"></i>
// // //                   <span class="mcell-date-text">
// // //                     {{ cm.formatDate(value, config.dateFormat ?? 'dd MMM yyyy') }}
// // //                   </span>
// // //                   @if (cm.isToday(value)) {
// // //                     <span class="mcell-today-dot"></span>
// // //                   }
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- DATETIME -->
// // //             @case ('datetime') {
// // //               @if (value) {
// // //                 <span class="mcell-date" [pTooltip]="cm.timeAgoText(value)" tooltipPosition="top">
// // //                   <i class="pi pi-clock mcell-meta-icon"></i>
// // //                   {{ cm.formatDateTime(value) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- TIME AGO -->
// // //             @case ('timeago') {
// // //               @if (value) {
// // //                 <span
// // //                   class="mcell-timeago"
// // //                   [pTooltip]="cm.formatDateTime(value)"
// // //                   tooltipPosition="top"
// // //                 >
// // //                   <i class="pi pi-clock mcell-meta-icon"></i>
// // //                   {{ cm.timeAgoText(value) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- BOOLEAN -->
// // //             @case ('boolean') {
// // //               <div class="mcell-bool">
// // //                 @if (value) {
// // //                   <span class="mcell-bool-chip is-true">
// // //                     <i class="pi pi-check"></i>
// // //                     <span>Yes</span>
// // //                   </span>
// // //                 } @else {
// // //                   <span class="mcell-bool-chip is-false">
// // //                     <i class="pi pi-times"></i>
// // //                     <span>No</span>
// // //                   </span>
// // //                 }
// // //               </div>
// // //             }

// // //             <!-- BADGE -->
// // //             @case ('badge') {
// // //               @if (value != null) {
// // //                 <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
// // //                   <span class="mcell-badge-dot"></span>
// // //                   {{ cm.toTitleCase(String(value)) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- SELECT -->
// // //             @case ('select') {
// // //               @if (value != null) {
// // //                 @if (config.selectAsBadge) {
// // //                   <span class="mcell-badge" [attr.data-sev]="getBadgeSeverity(value)">
// // //                     <span class="mcell-badge-dot"></span>
// // //                     {{ getSelectLabel(value) }}
// // //                   </span>
// // //                 } @else {
// // //                   <span class="mcell-select-val">{{ getSelectLabel(value) }}</span>
// // //                 }
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- EMAIL -->
// // //             @case ('email') {
// // //               @if (value) {
// // //                 <a
// // //                   class="mcell-link"
// // //                   [href]="'mailto:' + value"
// // //                   (click)="onLinkClick($event, value)"
// // //                   [pTooltip]="'Send email to ' + value"
// // //                   tooltipPosition="top"
// // //                 >
// // //                   <i class="pi pi-envelope mcell-meta-icon"></i>
// // //                   <span>{{ cm.truncateText(value, 28) }}</span>
// // //                 </a>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- PHONE -->
// // //             @case ('phone') {
// // //               @if (value) {
// // //                 <a
// // //                   class="mcell-link"
// // //                   [href]="'tel:' + value"
// // //                   (click)="onLinkClick($event, value)"
// // //                   [pTooltip]="'Call ' + cm.formatPhone(value)"
// // //                   tooltipPosition="top"
// // //                 >
// // //                   <i class="pi pi-phone mcell-meta-icon"></i>
// // //                   <span>{{ cm.formatPhone(value) }}</span>
// // //                 </a>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- URL -->
// // //             @case ('url') {
// // //               @if (value) {
// // //                 <a
// // //                   class="mcell-link mcell-url"
// // //                   [href]="value"
// // //                   target="_blank"
// // //                   rel="noopener"
// // //                   (click)="onLinkClick($event, value)"
// // //                   [pTooltip]="value"
// // //                   tooltipPosition="top"
// // //                 >
// // //                   <i class="pi pi-external-link mcell-meta-icon"></i>
// // //                   <span>{{ cm.truncateText(value, 30) }}</span>
// // //                 </a>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- PROGRESS -->
// // //             @case ('progress') {
// // //               <div class="mcell-progress-wrap">
// // //                 <div class="mcell-progress-track">
// // //                   <div
// // //                     class="mcell-progress-fill"
// // //                     [style.width.%]="getProgressPct()"
// // //                     [class.is-complete]="getProgressPct() >= 100"
// // //                     [class.is-warning]="getProgressPct() >= 75 && getProgressPct() < 100"
// // //                     [class.is-low]="getProgressPct() < 30"
// // //                   ></div>
// // //                 </div>
// // //                 @if (config.showValue !== false) {
// // //                   <span class="mcell-progress-label" [class.is-complete]="getProgressPct() >= 100">
// // //                     {{ getProgressPct() }}%
// // //                   </span>
// // //                 }
// // //               </div>
// // //             }

// // //             <!-- AVATAR -->
// // //             @case ('avatar') {
// // //               <div class="mcell-avatar-wrap">
// // //                 @if (value && isImageUrl(value)) {
// // //                   <div class="mcell-avatar">
// // //                     <img [src]="value" [alt]="getAvatarInitials()" loading="lazy" />
// // //                   </div>
// // //                 } @else {
// // //                   <div
// // //                     class="mcell-avatar"
// // //                     [style.background]="getAvatarBg()"
// // //                     [style.color]="getAvatarColor()"
// // //                   >
// // //                     <span class="mcell-avatar-initials">{{ getAvatarInitials() }}</span>
// // //                   </div>
// // //                 }
// // //                 @if (config.labelField) {
// // //                   <span class="mcell-avatar-label">
// // //                     {{ params?.data?.[config.labelField] ?? '—' }}
// // //                   </span>
// // //                 }
// // //               </div>
// // //             }

// // //             <!-- TAGS -->
// // //             @case ('tags') {
// // //               @if (asTags(value).length) {
// // //                 <div class="mcell-tags">
// // //                   @for (tag of asTags(value).slice(0, config.maxTags ?? 3); track tag) {
// // //                     <span class="mcell-tag">{{ tag }}</span>
// // //                   }
// // //                   @if (asTags(value).length > (config.maxTags ?? 3)) {
// // //                     <span
// // //                       class="mcell-tag mcell-tag-more"
// // //                       [pTooltip]="asTags(value).slice(config.maxTags ?? 3).join(', ')"
// // //                       tooltipPosition="top"
// // //                     >
// // //                       +{{ asTags(value).length - (config.maxTags ?? 3) }}
// // //                     </span>
// // //                   }
// // //                 </div>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- COLOR -->
// // //             @case ('color') {
// // //               @if (value) {
// // //                 <div class="mcell-color">
// // //                   <span class="mcell-color-swatch" [style.background]="value"></span>
// // //                   <span class="mcell-color-label">{{ value }}</span>
// // //                 </div>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- FILE SIZE -->
// // //             @case ('filesize') {
// // //               @if (value != null) {
// // //                 <span class="mcell-filesize">
// // //                   <i class="pi pi-file mcell-meta-icon"></i>
// // //                   {{ cm.formatFileSize(value) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- DURATION -->
// // //             @case ('duration') {
// // //               @if (value != null) {
// // //                 <span class="mcell-duration">
// // //                   <i class="pi pi-clock mcell-meta-icon"></i>
// // //                   {{ cm.formatDuration(value) }}
// // //                 </span>
// // //               } @else {
// // //                 <span class="mcell-empty">—</span>
// // //               }
// // //             }

// // //             <!-- RATING -->
// // //             @case ('rating') {
// // //               <div class="mcell-rating">
// // //                 @for (star of getRatingStars(); track $index) {
// // //                   <i
// // //                     class="pi"
// // //                     [class.pi-star-fill]="star"
// // //                     [class.pi-star]="!star"
// // //                     [class.is-filled]="star"
// // //                   ></i>
// // //                 }
// // //                 @if (config.showValue !== false) {
// // //                   <span class="mcell-rating-val">{{ value }}</span>
// // //                 }
// // //               </div>
// // //             }

// // //             <!-- INITIALS -->
// // //             @case ('initials') {
// // //               <div
// // //                 class="mcell-initials-chip"
// // //                 [style.background]="getAvatarBg()"
// // //                 [style.color]="getAvatarColor()"
// // //                 [pTooltip]="value"
// // //                 tooltipPosition="top"
// // //               >
// // //                 {{ cm.getInitials(value ?? '') }}
// // //               </div>
// // //             }

// // //             <!-- TEXTAREA / MULTILINE -->
// // //             @case ('textarea') {
// // //               <span class="mcell-multiline" [title]="value">{{ value ?? '—' }}</span>
// // //             }

// // //             <!-- DEFAULT -->
// // //             @default {
// // //               <span class="mcell-text" [title]="value">
// // //                 {{ value != null ? cm.truncateText(String(value), 50) : '—' }}
// // //               </span>
// // //             }

// // //           }
// // //         </div>
// // //       }

// // //     </div>
// // //   `,
// // //   styles: [`

// // //     /* ══════════════════════════════════════════════════════
// // //        MASTER CELL v2.1 — APEX CRM Theme Token System
// // //     ══════════════════════════════════════════════════════ */

// // //     app-master-cell {
// // //       display: flex;
// // //       align-items: stretch;
// // //       width: 100%;
// // //       height: 100%;
// // //     }

// // //     /* ── ROOT ──────────────────────────────────────────── */
// // //     .mcell-root {
// // //       display: flex;
// // //       align-items: center;
// // //       width: 100%;
// // //       height: 100%;
// // //       overflow: hidden;
// // //       transition: background var(--transition-fast);
// // //     }
// // //     .mcell-root.is-editing {
// // //       background: color-mix(in srgb, var(--theme-accent-primary) 4%, var(--theme-bg-primary) 96%);
// // //     }
// // //     .mcell-root.is-readonly .mcell-viewer {
// // //       opacity: 0.55;
// // //       cursor: not-allowed;
// // //     }

// // //     /* ── VIEWER SHELL ──────────────────────────────────── */
// // //     .mcell-viewer {
// // //       display: flex;
// // //       align-items: center;
// // //       width: 100%;
// // //       height: 100%;
// // //       padding: 0 var(--spacing-md);
// // //       overflow: hidden;
// // //       white-space: nowrap;
// // //       gap: var(--spacing-xs);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       font-family: var(--font-body);
// // //     }

// // //     /* ── META ICON ─────────────────────────────────────── */
// // //     .mcell-meta-icon {
// // //       font-size: 0.65rem;
// // //       color: var(--theme-text-tertiary);
// // //       flex-shrink: 0;
// // //       transition: color var(--transition-fast);
// // //     }

// // //     /* ── EMPTY ─────────────────────────────────────────── */
// // //     .mcell-empty {
// // //       color: var(--theme-text-tertiary);
// // //       font-style: italic;
// // //       font-size: var(--font-size-xs);
// // //       opacity: 0.7;
// // //     }

// // //     /* ── TEXT ──────────────────────────────────────────── */
// // //     .mcell-text,
// // //     .mcell-select-val {
// // //       overflow: hidden;
// // //       text-overflow: ellipsis;
// // //       white-space: nowrap;
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       font-weight: var(--font-weight-normal);
// // //     }

// // //     .mcell-multiline {
// // //       overflow: hidden;
// // //       text-overflow: ellipsis;
// // //       white-space: normal;
// // //       display: -webkit-box;
// // //       -webkit-line-clamp: 2;
// // //       -webkit-box-orient: vertical;
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-secondary);
// // //       line-height: var(--line-height-normal);
// // //     }

// // //     /* ── NUMBER ────────────────────────────────────────── */
// // //     .mcell-number {
// // //       font-family: var(--font-mono);
// // //       font-size: var(--font-size-sm);
// // //       font-weight: var(--font-weight-medium);
// // //       color: var(--theme-text-primary);
// // //       letter-spacing: -0.2px;
// // //     }

// // //     /* ── PERCENT ───────────────────────────────────────── */
// // //     .mcell-percent {
// // //       font-family: var(--font-mono);
// // //       font-size: var(--font-size-sm);
// // //       font-weight: var(--font-weight-semibold);
// // //       color: var(--theme-accent-primary);
// // //       letter-spacing: -0.2px;
// // //     }

// // //     /* ── CURRENCY ──────────────────────────────────────── */
// // //     .mcell-currency {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       gap: 3px;
// // //       font-family: var(--font-mono);
// // //       font-weight: var(--font-weight-semibold);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       letter-spacing: -0.3px;
// // //     }
// // //     .mcell-currency-arrow {
// // //       font-size: 0.5rem;
// // //       opacity: 0.45;
// // //       font-weight: var(--font-weight-bold);
// // //     }
// // //     .mcell-currency.is-negative {
// // //       color: var(--theme-error, #ef4444);
// // //     }
// // //     .mcell-currency.is-negative .mcell-currency-arrow {
// // //       opacity: 0.8;
// // //     }

// // //     /* ── DATE ──────────────────────────────────────────── */
// // //     .mcell-date,
// // //     .mcell-timeago {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       gap: var(--spacing-xs);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       overflow: hidden;
// // //       white-space: nowrap;
// // //       cursor: default;
// // //     }
// // //     .mcell-date-text {
// // //       overflow: hidden;
// // //       text-overflow: ellipsis;
// // //     }
// // //     .mcell-today-dot {
// // //       width: 5px;
// // //       height: 5px;
// // //       border-radius: 50%;
// // //       background: var(--theme-accent-primary);
// // //       flex-shrink: 0;
// // //       box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-accent-primary) 25%, transparent 75%);
// // //     }
// // //     .mcell-date.is-today {
// // //       color: var(--theme-accent-primary);
// // //       font-weight: var(--font-weight-semibold);
// // //     }
// // //     .mcell-date.is-today .mcell-meta-icon {
// // //       color: var(--theme-accent-primary);
// // //     }
// // //     .mcell-date.is-overdue {
// // //       color: var(--theme-error, #ef4444);
// // //     }
// // //     .mcell-date.is-overdue .mcell-meta-icon {
// // //       color: var(--theme-error, #ef4444);
// // //     }
// // //     .mcell-timeago {
// // //       color: var(--theme-text-secondary);
// // //       font-size: var(--font-size-xs);
// // //       font-style: italic;
// // //     }

// // //     /* ── BOOLEAN CHIP ──────────────────────────────────── */
// // //     .mcell-bool {
// // //       display: flex;
// // //       align-items: center;
// // //     }
// // //     .mcell-bool-chip {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       gap: 4px;
// // //       padding: 2px 8px;
// // //       border-radius: var(--ui-border-radius-pill);
// // //       font-size: var(--font-size-xs);
// // //       font-weight: var(--font-weight-semibold);
// // //       letter-spacing: 0.02em;
// // //     }
// // //     .mcell-bool-chip i { font-size: 0.6rem; }
// // //     .mcell-bool-chip.is-true {
// // //       background: color-mix(in srgb, var(--theme-success, #22c55e) 12%, transparent 88%);
// // //       color: var(--theme-success, #22c55e);
// // //       border: 1px solid color-mix(in srgb, var(--theme-success, #22c55e) 25%, transparent 75%);
// // //     }
// // //     .mcell-bool-chip.is-false {
// // //       background: var(--theme-bg-ternary);
// // //       color: var(--theme-text-tertiary);
// // //       border: 1px solid var(--theme-border-primary);
// // //     }

// // //     /* ── BADGE ─────────────────────────────────────────── */
// // //     .mcell-badge {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       gap: 5px;
// // //       font-size: var(--font-size-xs);
// // //       font-weight: var(--font-weight-bold);
// // //       text-transform: uppercase;
// // //       letter-spacing: 0.05em;
// // //       padding: 2px 8px 2px 6px;
// // //       border-radius: var(--ui-border-radius-sm);
// // //       border: 1px solid var(--theme-border-primary);
// // //       background: var(--theme-bg-ternary);
// // //       color: var(--theme-text-secondary);
// // //       white-space: nowrap;
// // //     }
// // //     .mcell-badge-dot {
// // //       width: 5px;
// // //       height: 5px;
// // //       border-radius: 50%;
// // //       background: currentColor;
// // //       flex-shrink: 0;
// // //       opacity: 0.8;
// // //     }
// // //     .mcell-badge[data-sev="success"] {
// // //       background: color-mix(in srgb, var(--theme-success, #22c55e) 12%, transparent 88%);
// // //       color: var(--theme-success, #22c55e);
// // //       border-color: color-mix(in srgb, var(--theme-success, #22c55e) 25%, transparent 75%);
// // //     }
// // //     .mcell-badge[data-sev="warning"] {
// // //       background: color-mix(in srgb, var(--theme-warning, #f59e0b) 12%, transparent 88%);
// // //       color: var(--theme-warning, #f59e0b);
// // //       border-color: color-mix(in srgb, var(--theme-warning, #f59e0b) 25%, transparent 75%);
// // //     }
// // //     .mcell-badge[data-sev="danger"] {
// // //       background: color-mix(in srgb, var(--theme-error, #ef4444) 12%, transparent 88%);
// // //       color: var(--theme-error, #ef4444);
// // //       border-color: color-mix(in srgb, var(--theme-error, #ef4444) 25%, transparent 75%);
// // //     }
// // //     .mcell-badge[data-sev="info"] {
// // //       background: color-mix(in srgb, var(--theme-accent-primary) 10%, transparent 90%);
// // //       color: var(--theme-accent-primary);
// // //       border-color: color-mix(in srgb, var(--theme-accent-primary) 22%, transparent 78%);
// // //     }

// // //     /* ── LINKS ─────────────────────────────────────────── */
// // //     .mcell-link {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       gap: var(--spacing-xs);
// // //       color: var(--theme-accent-primary);
// // //       text-decoration: none;
// // //       font-size: var(--font-size-sm);
// // //       overflow: hidden;
// // //       text-overflow: ellipsis;
// // //       white-space: nowrap;
// // //       border-radius: 3px;
// // //       padding: 1px 2px;
// // //       margin: -1px -2px;
// // //       transition: var(--transition-fast);
// // //     }
// // //     .mcell-link span {
// // //       overflow: hidden;
// // //       text-overflow: ellipsis;
// // //     }
// // //     .mcell-link:hover {
// // //       text-decoration: underline;
// // //       color: var(--theme-accent-hover);
// // //     }
// // //     .mcell-link:hover .mcell-meta-icon {
// // //       color: var(--theme-accent-hover);
// // //     }
// // //     .mcell-link:focus-visible {
// // //       outline: var(--focus-ring-width) solid var(--theme-accent-focus);
// // //       outline-offset: var(--focus-ring-offset);
// // //     }

// // //     /* ── PROGRESS ──────────────────────────────────────── */
// // //     .mcell-progress-wrap {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-sm);
// // //       width: 100%;
// // //       padding: 0 2px;
// // //     }
// // //     .mcell-progress-track {
// // //       flex: 1;
// // //       height: 4px;
// // //       background: var(--theme-bg-ternary);
// // //       border-radius: var(--ui-border-radius-pill);
// // //       overflow: hidden;
// // //       border: 1px solid var(--theme-border-primary);
// // //     }
// // //     .mcell-progress-fill {
// // //       height: 100%;
// // //       background: var(--theme-accent-primary);
// // //       border-radius: var(--ui-border-radius-pill);
// // //       transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
// // //     }
// // //     .mcell-progress-fill.is-complete  { background: var(--theme-success, #22c55e); }
// // //     .mcell-progress-fill.is-warning   { background: var(--theme-warning, #f59e0b); }
// // //     .mcell-progress-fill.is-low       { background: var(--theme-error, #ef4444); }
// // //     .mcell-progress-label {
// // //       font-size: var(--font-size-xs);
// // //       font-weight: var(--font-weight-bold);
// // //       color: var(--theme-text-secondary);
// // //       flex-shrink: 0;
// // //       min-width: 30px;
// // //       text-align: right;
// // //       font-family: var(--font-mono);
// // //     }
// // //     .mcell-progress-label.is-complete { color: var(--theme-success, #22c55e); }

// // //     /* ── AVATAR ────────────────────────────────────────── */
// // //     .mcell-avatar-wrap {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: var(--spacing-sm);
// // //       overflow: hidden;
// // //     }
// // //     .mcell-avatar {
// // //       width: 26px;
// // //       height: 26px;
// // //       border-radius: 50%;
// // //       overflow: hidden;
// // //       border: 1.5px solid var(--theme-border-primary);
// // //       display: flex;
// // //       align-items: center;
// // //       justify-content: center;
// // //       flex-shrink: 0;
// // //       box-shadow: var(--elevation-1, 0 1px 3px rgba(0,0,0,0.08));
// // //     }
// // //     .mcell-avatar img {
// // //       width: 100%;
// // //       height: 100%;
// // //       object-fit: cover;
// // //     }
// // //     .mcell-avatar-initials {
// // //       font-size: 0.6rem;
// // //       font-weight: var(--font-weight-bold);
// // //       letter-spacing: 0.03em;
// // //       text-transform: uppercase;
// // //     }
// // //     .mcell-avatar-label {
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       font-weight: var(--font-weight-medium);
// // //       overflow: hidden;
// // //       text-overflow: ellipsis;
// // //       white-space: nowrap;
// // //     }

// // //     /* ── INITIALS CHIP ─────────────────────────────────── */
// // //     .mcell-initials-chip {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       justify-content: center;
// // //       width: 26px;
// // //       height: 26px;
// // //       border-radius: 50%;
// // //       font-size: 0.6rem;
// // //       font-weight: var(--font-weight-bold);
// // //       text-transform: uppercase;
// // //       letter-spacing: 0.03em;
// // //       flex-shrink: 0;
// // //       border: 1.5px solid rgba(255,255,255,0.25);
// // //       box-shadow: var(--elevation-1, 0 1px 3px rgba(0,0,0,0.08));
// // //       cursor: default;
// // //     }

// // //     /* ── TAGS ──────────────────────────────────────────── */
// // //     .mcell-tags {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: 3px;
// // //       overflow: hidden;
// // //       flex-wrap: nowrap;
// // //     }
// // //     .mcell-tag {
// // //       display: inline-block;
// // //       font-size: 0.6rem;
// // //       font-weight: var(--font-weight-semibold);
// // //       padding: 1px 6px;
// // //       border-radius: var(--ui-border-radius-sm);
// // //       background: var(--theme-bg-ternary);
// // //       color: var(--theme-text-secondary);
// // //       border: 1px solid var(--theme-border-primary);
// // //       white-space: nowrap;
// // //       letter-spacing: 0.02em;
// // //     }
// // //     .mcell-tag-more {
// // //       background: color-mix(in srgb, var(--theme-accent-primary) 10%, var(--theme-bg-ternary) 90%);
// // //       color: var(--theme-accent-primary);
// // //       border-color: color-mix(in srgb, var(--theme-accent-primary) 20%, transparent 80%);
// // //       cursor: pointer;
// // //     }

// // //     /* ── COLOR SWATCH ──────────────────────────────────── */
// // //     .mcell-color { display: flex; align-items: center; gap: var(--spacing-sm); }
// // //     .mcell-color-swatch {
// // //       width: 14px;
// // //       height: 14px;
// // //       border-radius: 3px;
// // //       border: 1px solid var(--theme-border-secondary);
// // //       flex-shrink: 0;
// // //       box-shadow: var(--shadow-xs);
// // //     }
// // //     .mcell-color-label {
// // //       font-family: var(--font-mono);
// // //       font-size: var(--font-size-xs);
// // //       color: var(--theme-text-secondary);
// // //       letter-spacing: 0.03em;
// // //     }

// // //     /* ── FILE SIZE / DURATION ──────────────────────────── */
// // //     .mcell-filesize,
// // //     .mcell-duration {
// // //       display: inline-flex;
// // //       align-items: center;
// // //       gap: var(--spacing-xs);
// // //       font-family: var(--font-mono);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-secondary);
// // //       font-weight: var(--font-weight-medium);
// // //     }

// // //     /* ── RATING ────────────────────────────────────────── */
// // //     .mcell-rating {
// // //       display: flex;
// // //       align-items: center;
// // //       gap: 2px;
// // //     }
// // //     .mcell-rating i {
// // //       font-size: 0.7rem;
// // //       color: var(--theme-border-secondary);
// // //       transition: color var(--transition-fast);
// // //     }
// // //     .mcell-rating i.is-filled { color: var(--theme-warning, #f59e0b); }
// // //     .mcell-rating-val {
// // //       font-size: var(--font-size-xs);
// // //       font-weight: var(--font-weight-bold);
// // //       color: var(--theme-text-secondary);
// // //       font-family: var(--font-mono);
// // //       margin-left: 3px;
// // //     }

// // //     /* ══════════════════════════════════════════════════════
// // //        EDITOR FIELDS
// // //     ══════════════════════════════════════════════════════ */

// // //     .mc-input {
// // //       width: 100%;
// // //       height: 28px;
// // //       padding: 0 var(--spacing-md, 8px);
// // //       font-family: var(--font-body);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       background: var(--theme-bg-primary);
// // //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// // //       border-radius: var(--ui-border-radius-sm, 6px);
// // //       outline: none;
// // //       transition: var(--transition-fast);
// // //       box-sizing: border-box;
// // //     }
// // //     .mc-input:focus {
// // //       border-color: var(--theme-accent-primary);
// // //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// // //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// // //       background: var(--theme-bg-primary);
// // //     }
// // //     .mc-input::placeholder {
// // //       color: var(--theme-text-tertiary);
// // //       font-size: var(--font-size-xs);
// // //     }

// // //     .mc-textarea {
// // //       width: 100%;
// // //       height: auto;
// // //       min-height: 28px;
// // //       padding: var(--spacing-xs, 4px) var(--spacing-md, 8px);
// // //       font-family: var(--font-body);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       background: var(--theme-bg-primary);
// // //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// // //       border-radius: var(--ui-border-radius-sm, 6px);
// // //       outline: none;
// // //       resize: none;
// // //       transition: var(--transition-fast);
// // //       box-sizing: border-box;
// // //     }
// // //     .mc-textarea:focus {
// // //       border-color: var(--theme-accent-primary);
// // //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// // //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// // //     }
// // //     .mc-textarea::placeholder { color: var(--theme-text-tertiary); }

// // //     .mc-input-number { width: 100%; }
// // //     .mc-input-number .p-inputnumber-input {
// // //       width: 100%;
// // //       height: 28px;
// // //       padding: 0 var(--spacing-md, 8px);
// // //       font-family: var(--font-mono);
// // //       font-size: var(--font-size-sm);
// // //       text-align: right;
// // //       color: var(--theme-text-primary);
// // //       background: var(--theme-bg-primary);
// // //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// // //       border-radius: var(--ui-border-radius-sm, 6px);
// // //       outline: none;
// // //       transition: var(--transition-fast);
// // //     }
// // //     .mc-input-number .p-inputnumber-input:focus {
// // //       border-color: var(--theme-accent-primary);
// // //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// // //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// // //     }

// // //     .mc-select {
// // //       width: 100%;
// // //       height: 28px;
// // //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// // //       border-radius: var(--ui-border-radius-sm, 6px);
// // //       transition: var(--transition-fast);
// // //     }
// // //     .mc-select .p-select-label {
// // //       font-family: var(--font-body);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       padding: 0 var(--spacing-md, 8px);
// // //       line-height: 28px;
// // //     }
// // //     .mc-select.p-focus,
// // //     .mc-select:focus-within {
// // //       border-color: var(--theme-accent-primary);
// // //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// // //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// // //       outline: none;
// // //     }

// // //     .mc-datepicker { width: 100%; }
// // //     .mc-datepicker .p-datepicker-input {
// // //       width: 100%;
// // //       height: 28px;
// // //       padding: 0 var(--spacing-md, 8px);
// // //       font-family: var(--font-body);
// // //       font-size: var(--font-size-sm);
// // //       color: var(--theme-text-primary);
// // //       background: var(--theme-bg-primary);
// // //       border: var(--ui-border-width, 1px) solid var(--theme-border-secondary);
// // //       border-radius: var(--ui-border-radius-sm, 6px);
// // //       outline: none;
// // //       transition: var(--transition-fast);
// // //     }
// // //     .mc-datepicker .p-datepicker-input:focus {
// // //       border-color: var(--theme-accent-primary);
// // //       box-shadow: 0 0 0 var(--focus-ring-width, 2px)
// // //         color-mix(in srgb, var(--theme-accent-primary) 18%, transparent 82%);
// // //     }
// // //     .mc-datepicker .p-datepicker-trigger { display: none; }

// // //     .mc-checkbox-wrap {
// // //       display: flex;
// // //       align-items: center;
// // //       justify-content: center;
// // //       width: 100%;
// // //       height: 100%;
// // //     }

// // //   `],
// // // })
// // // export class MasterCellComponent implements ICellRendererAngularComp, OnDestroy {

// // //   private readonly el = inject(ElementRef);
// // //   private readonly cdr = inject(ChangeDetectorRef);

// // //   /** CommonMethodService — single source of truth for all formatting */
// // //   readonly cm = inject(CommonMethodService);

// // //   /** Expose String constructor for template use: String(value) */
// // //   readonly String = String;

// // //   /* ── OUTPUT ──────────────────────────────────────────── */
// // //   readonly cellInteraction = output<CellInteractionEvent>();

// // //   /* ── STATE ───────────────────────────────────────────── */
// // //   params!: any;
// // //   config: CellConfig = { type: 'text' };
// // //   value: any;       // committed value — what view mode shows
// // //   draftValue: any;  // live edit value — what editor binds to

// // //   /* ── COMPUTED ────────────────────────────────────────── */
// // //   get showEditor(): boolean {
// // //     if (this.config.readOnly) return false;
// // //     if (this.config.alwaysEditable) return true;
// // //     return this.isRowEditing();
// // //   }

// // //   private isRowEditing(): boolean {
// // //     try {
// // //       const parent = this.params?.context?.componentParent;
// // //       return parent?.editingIds?.()?.has(this.params.node.id) ?? false;
// // //     } catch {
// // //       return false;
// // //     }
// // //   }

// // //   isNegativeValue(): boolean {
// // //     return (this.config.type === 'currency' || this.config.type === 'number')
// // //       ? Number(this.value) < 0
// // //       : false;
// // //   }

// // //   isOverdue(): boolean {
// // //     if (!this.value || this.config.type !== 'date') return false;
// // //     return this.cm.isPast(this.value) && !this.cm.isToday(this.value);
// // //   }

// // //   /* ── AG GRID LIFECYCLE ───────────────────────────────── */
// // //   agInit(params: any): void {
// // //     this.params = params;
// // //     this.config = params.cellConfig || { type: 'text' };
// // //     this.value = params.value;
// // //     this.draftValue = params.value;
// // //   }

// // //   refresh(params: any): boolean {
// // //     this.params = params;
// // //     this.config = params.cellConfig || { type: 'text' };
// // //     this.value = params.value;
// // //     if (!this.isRowEditing() && !this.config.alwaysEditable) {
// // //       this.draftValue = params.value;
// // //     }
// // //     this.cdr.markForCheck();
// // //     return true;
// // //   }

// // //   afterGuiAttached(): void {
// // //     if (this.showEditor) {
// // //       this.focusEditor();
// // //     }
// // //   }

// // //   ngOnDestroy(): void { }

// // //   /* ── FOCUS — TAB FIX ─────────────────────────────────────────────────────
// // //      BEFORE: requestAnimationFrame(() => setTimeout(() => focus(), 40))
// // //        Problem: 40ms delay means AG Grid's cell wrapper <div> gets painted
// // //        as focused (ag-cell-focus border flashes) before the inner input
// // //        receives focus. User sees: [div flash] → [input focus]. Jarring.

// // //      AFTER: Promise.resolve().then(() => focus())
// // //        Promise microtasks run after the current JS task completes but
// // //        BEFORE the browser renders the next frame. So the inner input
// // //        receives focus before AG Grid paints anything — zero flash.

// // //      Also: agCell.classList.add('ag-cell-inline-editing') tells AG Grid's
// // //        internal focusin listener that the cell is already in edit mode,
// // //        so it doesn't attempt to re-focus the wrapper div when it sees the
// // //        focusin event bubble up from the inner input.

// // //      Tab navigation itself is handled in AppSharedGrid.tabToNextCell()
// // //      which intercepts Tab, returns the next CellPosition to AG Grid, then
// // //      uses the same Promise.resolve() pattern to focus the input directly.
// // //   ───────────────────────────────────────────────────────────────────────── */
// // //   private focusEditor(): void {
// // //     Promise.resolve().then(() => {
// // //       const host = this.el.nativeElement as HTMLElement;

// // //       const target =
// // //         host.querySelector<HTMLElement>('input:not([type="hidden"]), textarea') ??
// // //         host.querySelector<HTMLElement>(
// // //           '.p-select .p-select-label, .p-checkbox-box, [tabindex="0"]'
// // //         );

// // //       if (!target) return;

// // //       // Tell AG Grid this cell is already in inline-edit mode.
// // //       // Prevents its own focusin handler from stealing focus back
// // //       // to the wrapper div when the input fires its focusin event.
// // //       const agCell = host.closest<HTMLElement>('.ag-cell');
// // //       if (agCell) agCell.classList.add('ag-cell-inline-editing');

// // //       target.focus({ preventScroll: false });

// // //       // Select all text so the user can immediately type to replace
// // //       if (
// // //         target instanceof HTMLInputElement &&
// // //         ['text', 'email', 'tel', 'url'].includes(target.type)
// // //       ) {
// // //         target.select();
// // //       }
// // //     });
// // //   }

// // //   /* ── EDITOR EVENTS ───────────────────────────────────── */

// // //   onDraftChange(val: any): void {
// // //     this.draftValue = val;
// // //     const parent = this.params?.context?.componentParent;
// // //     const id = this.params?.node?.id;
// // //     const field = this.params?.colDef?.field;
// // //     if (parent && id && field) parent.updateDraft(id, field, val);
// // //     this.emit('change', null);
// // //   }

// // //   onKeydown(event: KeyboardEvent): void {
// // //     if (event.key === 'Enter') {
// // //       if (this.config.enterToSave === true) {
// // //         event.preventDefault();
// // //         event.stopPropagation();
// // //         this.emit('enter', event);
// // //         this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
// // //       } else {
// // //         this.emit('enter', event);
// // //       }
// // //     }
// // //     if (event.key === 'Escape') {
// // //       event.preventDefault();
// // //       event.stopPropagation();
// // //       this.emit('escape', event);
// // //       this.params?.context?.componentParent?.handleRowAction('cancel', this.params.data);
// // //     }
// // //   }

// // //   onEditorFocus(event: Event | null | undefined): void {
// // //     this.emit('focus', event ?? null);
// // //   }

// // //   onBlur(event: Event | null | undefined): void {
// // //     this.emit('blur', event ?? null);
// // //     if (this.config.alwaysEditable && this.config.enterToSave) {
// // //       this.params?.context?.componentParent?.handleRowAction('save', this.params.data);
// // //     }
// // //   }

// // //   onViewClick(event: MouseEvent): void {
// // //     if (!this.showEditor) this.emit('click', event);
// // //   }

// // //   onLinkClick(event: MouseEvent, _value: any): void {
// // //     event.stopPropagation();
// // //     this.emit('linkClick', event);
// // //   }

// // //   /* ── EMIT ────────────────────────────────────────────── */
// // //   private emit(type: CellInteractionType, nativeEvent: Event | null): void {
// // //     if (this.config.emitEvents === false) return;

// // //     const event: CellInteractionEvent = {
// // //       interactionType: type,
// // //       cellType: this.config.type,
// // //       value: this.value,
// // //       draftValue: this.draftValue,
// // //       field: this.params?.colDef?.field ?? '',
// // //       rowId: this.params?.node?.id ?? '',
// // //       rowData: this.params?.data ?? null,
// // //       nativeEvent,
// // //     };

// // //     this.cellInteraction.emit(event);

// // //     const parent = this.params?.context?.componentParent;
// // //     if (parent && typeof parent.onCellInteraction === 'function') {
// // //       parent.onCellInteraction(event);
// // //     }
// // //   }

// // //   /* ── VIEW HELPERS ────────────────────────────────────── */

// // //   getSelectLabel(value: any): string {
// // //     if (!this.config.options) return value ?? '—';
// // //     const opt = this.config.options.find(
// // //       (o) => o[(this.config.optionValue ?? 'value') as keyof SelectOption] === value
// // //     );
// // //     return opt?.label ?? value ?? '—';
// // //   }

// // //   getBadgeSeverity(value: any): string {
// // //     if (this.config.badgeMap) {
// // //       const sev = this.config.badgeMap[String(value)];
// // //       if (sev) return sev;
// // //     }
// // //     const severity = this.cm.mapStatusToSeverity(String(value ?? ''));
// // //     // badge CSS uses 'warning' but cm uses 'warn' — normalise
// // //     if (severity === 'warn') return 'warning';
// // //     return severity ?? 'secondary';
// // //   }

// // //   getProgressPct(): number {
// // //     return this.cm.clamp(
// // //       Math.round(((this.value ?? 0) / (this.config.max ?? 100)) * 100),
// // //       0,
// // //       100
// // //     );
// // //   }

// // //   getAvatarInitials(): string {
// // //     const field = this.config.labelField;
// // //     const name = field
// // //       ? this.params?.data?.[field]
// // //       : (this.params?.data?.name ?? this.value);
// // //     return this.cm.getInitials(name ?? '') || '?';
// // //   }

// // //   getAvatarBg(): string {
// // //     const field = this.config.labelField;
// // //     const name = field
// // //       ? this.params?.data?.[field]
// // //       : (this.params?.data?.name ?? this.value ?? '');
// // //     return this.cm.stringToColor(String(name));
// // //   }

// // //   getAvatarColor(): string {
// // //     return this.cm.getContrastColor(this.getAvatarBg());
// // //   }

// // //   isImageUrl(val: any): boolean {
// // //     return typeof val === 'string' && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(val);
// // //   }

// // //   asTags(val: any): string[] {
// // //     if (!val) return [];
// // //     if (Array.isArray(val)) return val.map(String);
// // //     return String(val).split(',').map((s) => s.trim()).filter(Boolean);
// // //   }

// // //   getRatingStars(): boolean[] {
// // //     const max = this.config.max ?? 5;
// // //     const filled = Math.round(Number(this.value) || 0);
// // //     return Array.from({ length: max }, (_, i) => i < filled);
// // //   }
// // // }
