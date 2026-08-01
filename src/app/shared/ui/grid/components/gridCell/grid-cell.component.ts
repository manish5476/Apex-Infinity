import {
  Component, ChangeDetectionStrategy, input, output,
  signal, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
import { GridColumn, GridCellChangeEvent } from '../../grid-types';


@Component({
  selector: 'app-grid-cell',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
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
  rowData = input.required<any>();
  column = input.required<GridColumn>();
  isEditing = input<boolean>(false);

  cellChange = output<GridCellChangeEvent>();

  // Local mutable state strictly for the UI control binding
  editValue = signal<any>(null);
  private previousValue: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isEditing'] && this.isEditing()) {
      this.previousValue = this.rowData()[this.column().field];
      this.editValue.set(this.previousValue);
    }
  }

  onValueChange(newValue: any): void {
    // We update our local signal for UI responsiveness
    this.editValue.set(newValue);

    // IMMUTABLE DISPATCH: Do NOT mutate rowData directly here.
    // The core grid component handles merging this into the editDraft linkedSignal.
    this.cellChange.emit({
      field: this.column().field,
      previousValue: this.previousValue,
      newValue,
    });

    this.previousValue = newValue;
  }
}

