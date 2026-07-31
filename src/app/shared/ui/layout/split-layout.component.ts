// src/app/shared/ui/layout/split-layout.component.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SplitterModule } from 'primeng/splitter';

@Component({
  selector: 'app-split-layout',
  standalone: true,
  imports: [SplitterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full h-full min-h-[500px]' },
  template: `
    <p-splitter 
      [panelSizes]="panelSizes()" 
      [minSizes]="[20, 30]"
      [layout]="layout()"
      class="border-none bg-transparent h-full">
      <ng-template pTemplate>
        <div class="h-full w-full pr-[var(--spacing-md)] overflow-y-auto">
          <ng-content select="[master]"></ng-content>
        </div>
      </ng-template>
      <ng-template pTemplate>
        <div class="h-full w-full pl-[var(--spacing-md)] overflow-y-auto">
          <ng-content select="[detail]"></ng-content>
        </div>
      </ng-template>
    </p-splitter>
  `
})
export class SplitLayoutComponent {
  panelSizes = input<number[]>([35, 65]);
  layout = input<'horizontal' | 'vertical'>('horizontal');
}