import { Component, ChangeDetectorRef, EventEmitter, Input, Output } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { Button } from "primeng/button";

interface CustomCellRendererParams extends ICellRendererParams {
  id?: string;
  rowData?: any;
  dynamicComponent?: any;
  icon?: string;
  tooltip?: string;
  eventName?: string;
}

@Component({
  selector: 'app-dialogbox',
  templateUrl: './dialogbox.component.html',
  styleUrls: ['./dialogbox.component.scss'],
  imports: [ CommonModule, FormsModule, Button],
  standalone: true
})
export class DialogboxComponent implements ICellRendererAngularComp {

  @Input() id!: string;
  @Input() rowData!: any;
  // @Input() dynamicComponent!: any;
  @Input() icon: string = 'pi pi-eye';
  @Input() tooltip: string = 'Open';
  @Input() eventName: string = 'dialogBoxEvent';
  @Output() dialogEvent = new EventEmitter<{ eventName: string, id: string, rowData: any }>();
  display = false;
  params: any;
  constructor(private cdr: ChangeDetectorRef) { }
   
  agInit(params: CustomCellRendererParams): void {
    this.params = params;
    this.id = params.id || this.id;
    this.rowData = params.data || params.rowData;
    this.icon = params.icon || this.icon;
    this.tooltip = params.tooltip || this.tooltip;
    this.eventName = params.eventName || this.eventName;
  }

  refresh(params: CustomCellRendererParams): boolean {
    return false;
  }

  openDialog(): void {
    this.display = true;
    if (this.params?.dialogEvent) {
      this.params.dialogEvent({
        eventName: this.eventName,
        id: this.id,
        rowData: this.rowData
      });
    }
    this.cdr.detectChanges();
  }
}
