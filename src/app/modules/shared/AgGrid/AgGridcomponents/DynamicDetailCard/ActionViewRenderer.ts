import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDetailTableComponent } from './DynamicDetailCardComponent';
@Component({
  standalone: true,
  template: `
    <button class="table-action" (click)="viewDetails()">
      <i class="pi pi-eye"></i>
      <span>Details</span>
    </button>
  `,
  styles: [`
.table-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  background: transparent;
  border: var(--ui-border-width) solid var(--border-secondary);
  border-radius: var(--ui-border-radius-sm);
  cursor: pointer;
  transition: var(--transition-colors);
}

.table-action:hover {
  background: var(--component-bg-hover);
  color: var(--text-primary);
  border-color: var(--component-border-focus);
}

.table-action i {
  font-size: 0.75rem;
}
  `],
  providers: [DialogService]
})
export class ActionViewRenderer implements ICellRendererAngularComp {
  params!: ICellRendererParams;
  constructor(private dialogService: DialogService) { }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(): boolean { return false; }

  viewDetails() {
    this.dialogService.open(DynamicDetailTableComponent, {
      data: this.params.data,
      styleClass: 'theme-glass',
      width: '78vw',
      height: '88vh',
      closable: false
    });
  }
}
