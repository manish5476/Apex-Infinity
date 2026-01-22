import { Component ,Input} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

import { CellConfig, MasterRendererParams } from '../grid.types';

@Component({
  selector: 'app-master-cell-renderer',
  standalone: true,
  imports: [CommonModule, TagModule],
  template: `
    <div class="flex items-center h-full px-2 truncate">
      @switch (config.type) {

        @case ('boolean') {
          <i class="pi"
            [class.pi-check-circle]="value"
            [class.pi-times-circle]="!value"></i>
        }

        @case ('date') {
          {{ value | date:(config.dateFormat ?? 'dd/MM/yyyy') }}
        }

        @case ('currency') {
          {{ value | currency:(config.currencyCode ?? 'USD') }}
        }

        @case ('badge') {
          <p-tag [value]="value"
            [severity]="config.badgeSeverity?.(value) ?? 'info'">
          </p-tag>
        }

        @default {
          {{ value ?? '-' }}
        }
      }
    </div>
  `
})
export class MasterCellRendererComponent implements ICellRendererAngularComp {
  @Input() set cellParams(params: MasterRendererParams) {
    this.refresh(params);
  }

  params!: MasterRendererParams;
  config!: CellConfig;
  value: any;

  agInit(params: MasterRendererParams): void {
    this.refresh(params);
  }

  refresh(params: MasterRendererParams): boolean {
    this.params = params;
    this.config = params.cellConfig || { type: 'text' };
    this.value = params.value;
    return true;
  }
}