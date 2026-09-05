import {
  Component, ChangeDetectionStrategy, input, output,
  signal, computed, inject, TemplateRef, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, PercentPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// PrimeNG Form Modules
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';
import { StatusBadgeComponent } from '@shared/ui/badge/status-badge.component';
import { AvatarComponent } from '@shared/ui/media/avatar.component';
import { GridColumn, GridCellChangeEvent, CellRendererParams } from '../../grid-types';

@Component({
  selector: 'app-grid-cell',
  standalone: true,
  imports: [
    CommonModule, FormsModule, NgTemplateOutlet,
    InputTextModule, InputNumberModule, InputMaskModule, ColorPickerModule,
    TextareaModule, SelectModule, AutoCompleteModule, DatePickerModule,
    CheckboxModule, ToggleSwitchModule, ToggleButtonModule, RatingModule, SliderModule,
    TooltipModule, StatusBadgeComponent, AvatarComponent,
    CurrencyPipe, PercentPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grid-cell.component.html',
  styleUrls: ['./grid-cell.component.scss'],
  host: { class: 'block w-full h-full' }
})
export class GridCellComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  rowData = input.required<any>();
  column = input.required<GridColumn>();
  rowIndex = input<number>(0);
  isEditing = input<boolean>(false);

  cellChange = output<GridCellChangeEvent>();

  // Local mutable state strictly for the UI control binding in edit mode
  editValue = signal<any>(null);
  private previousValue: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isEditing'] && this.isEditing()) {
      this.previousValue = this.rawCellValue();
      this.editValue.set(this.previousValue);
    }
  }

  // ─── Value Resolution ───────────────────────────────────────────────────────
  readonly rawCellValue = computed<any>(() => {
    const row = this.rowData();
    const col = this.column();
    if (!row || !col) return null;

    if (typeof col.valueGetter === 'function') {
      try {
        return col.valueGetter({ data: row, row, colDef: col });
      } catch (e) {
        return null;
      }
    }

    if (typeof col.valueGetter === 'string') {
      return row[col.valueGetter];
    }

    // Support nested path e.g. "customer.name" if dot exists in field
    if (col.field && col.field.includes('.')) {
      const parts = col.field.split('.');
      let cur = row;
      for (const p of parts) {
        if (cur == null) return null;
        cur = cur[p];
      }
      return cur;
    }

    return row[col.field];
  });

  // ─── Custom Renderers Check ────────────────────────────────────────────────
  readonly isCustomTemplate = computed<boolean>(() => {
    return this.column().cellRenderer instanceof TemplateRef;
  });

  readonly isCustomFunction = computed<boolean>(() => {
    return typeof this.column().cellRenderer === 'function';
  });

  readonly customHtml = computed<SafeHtml | null>(() => {
    if (!this.isCustomFunction()) return null;
    const col = this.column();
    const row = this.rowData();
    const val = this.rawCellValue();

    const params: CellRendererParams = {
      value: val,
      data: row,
      row,
      colDef: col,
      column: col,
      index: this.rowIndex()
    };

    try {
      const result = (col.cellRenderer as Function)(params);
      if (result == null) return null;
      return this.sanitizer.bypassSecurityTrustHtml(String(result));
    } catch (e) {
      console.error(`Error executing cellRenderer for column ${col.field}:`, e);
      return null;
    }
  });

  readonly cellTemplateContext = computed(() => {
    const row = this.rowData();
    const col = this.column();
    const val = this.rawCellValue();
    return {
      $implicit: row,
      row,
      data: row,
      column: col,
      colDef: col,
      value: val,
      index: this.rowIndex()
    };
  });

  readonly asTemplate = (renderer: any): TemplateRef<any> => {
    return renderer as TemplateRef<any>;
  };

  // ─── Text & Formatting ─────────────────────────────────────────────────────
  readonly formattedValue = computed<string>(() => {
    const col = this.column();
    const row = this.rowData();
    const val = this.rawCellValue();

    if (col.valueFormatter) {
      try {
        if (typeof col.valueFormatter === 'function') {
          return String(col.valueFormatter({ value: val, data: row, row }));
        }
      } catch (e) { /* fallback */ }
    }

    if (col.formatter) {
      try {
        const res = col.formatter(val, row);
        return res != null ? String(res) : '';
      } catch (e) { /* fallback */ }
    }

    return val != null ? String(val) : '';
  });

  readonly isHtmlFormatted = computed<boolean>(() => {
    const col = this.column();
    if (col.type === 'html') return true;
    const val = this.formattedValue();
    if (!val || typeof val !== 'string') return false;
    return val.includes('<') && val.includes('>');
  });

  readonly safeFormattedHtml = computed<SafeHtml | null>(() => {
    const val = this.formattedValue();
    if (!val) return null;
    return this.sanitizer.bypassSecurityTrustHtml(val);
  });

  // ─── Alignment Resolution ──────────────────────────────────────────────────
  readonly alignClass = computed<string>(() => {
    const col = this.column();
    if (
      col.align === 'right' ||
      col.type === 'rightAligned' ||
      col.type === 'numeric' ||
      col.type === 'currency' ||
      col.type === 'number'
    ) {
      return 'justify-end text-right';
    }
    if (col.align === 'center') {
      return 'justify-center text-center';
    }
    return 'justify-start text-left';
  });

  // ─── Edit Handlers ─────────────────────────────────────────────────────────
  onValueChange(newValue: any): void {
    this.editValue.set(newValue);

    this.cellChange.emit({
      field: this.column().field,
      previousValue: this.previousValue,
      newValue,
    });

    this.previousValue = newValue;
  }
}
