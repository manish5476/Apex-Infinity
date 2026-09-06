// src/app/Tabbing/Service/tab-keyboard.service.ts
// Backward-compatibility bridge delegating to TabWorkspaceKeyboardService

import { Injectable, inject } from '@angular/core';
import { TabWorkspaceKeyboardService } from '../../tab-workspace/tab-workspace-keyboard.service';

@Injectable({ providedIn: 'root' })
export class TabKeyboardService {
  private readonly delegate = inject(TabWorkspaceKeyboardService);

  init(): void {
    this.delegate.init();
  }
}
