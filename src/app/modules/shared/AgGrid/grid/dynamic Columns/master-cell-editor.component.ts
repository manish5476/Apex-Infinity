import {
  Component, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { TextareaModule } from 'primeng/textarea';
import { ColorPickerModule } from 'primeng/colorpicker';
// import { InputSwitchModule } from 'primeng/inputswitch';
// import { ChipsModule } from 'primeng/chips';

import { CellConfig, MasterEditorParams } from '../grid.types';

@Component({
  selector: 'app-master-cell-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    DatePickerModule,
    CheckboxModule,
    PasswordModule,
    TextareaModule,
    ColorPickerModule,
    // InputSwitchModule,
    // ChipsModule
  ],
  template: `
    <div class="w-full h-full flex items-center px-1">
      @switch (config.type) {

        @case ('number') {
          <p-inputNumber [(ngModel)]="value" class="w-full" />
        }

        @case ('textarea') {
          <textarea pTextarea [(ngModel)]="value" rows="3"
            class="w-full h-full"></textarea>
        }

        @case ('select') {
          <p-select [(ngModel)]="value"
            [options]="config.options ?? []"
            [optionLabel]="config.optionLabel || 'label'"
            [optionValue]="config.optionValue || 'value'"
            appendTo="body" class="w-full" />
        }

        @case ('multiselect') {
          <p-multiSelect [(ngModel)]="value"
            [options]="config.options ?? []"
            [optionLabel]="config.optionLabel || 'label'"
            [optionValue]="config.optionValue || 'value'"
            appendTo="body" class="w-full" />
        }

        @case ('date') {
          <p-datepicker [(ngModel)]="value"
            appendTo="body" class="w-full" />
        }

        @case ('boolean') {
          <p-checkbox [(ngModel)]="value" binary="true"></p-checkbox>
        }

        @case ('switch') {
          <p-inputSwitch [(ngModel)]="value"></p-inputSwitch>
        }

        @case ('color') {
          <p-colorPicker [(ngModel)]="value"></p-colorPicker>
        }

        @case ('tags') {
          <p-chips [(ngModel)]="value" class="w-full"></p-chips>
        }

        @default {
          <input pInputText [(ngModel)]="value"
            class="w-full"
            [placeholder]="config.placeholder || ''" />
        }
      }
    </div>
  `
})
export class MasterCellEditorComponent
  implements ICellEditorAngularComp, AfterViewInit {

  @ViewChild('input') input?: ElementRef;

  params!: MasterEditorParams;
  config!: CellConfig;
  value: any;

  agInit(params: MasterEditorParams): void {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
  }

  getValue(): any {
    return this.value;
  }

  isPopup(): boolean {
    return ['textarea', 'multiselect', 'tags', 'color']
      .includes(this.config.type);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.input?.nativeElement?.focus());
  }
}
