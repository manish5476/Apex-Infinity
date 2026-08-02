import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HotkeyService {
  /** Signal that controls whether the global command palette is open. */
  public commandPaletteOpen = signal<boolean>(false);

  public openCommandPalette(): void {
    this.commandPaletteOpen.set(true);
  }

  public closeCommandPalette(): void {
    this.commandPaletteOpen.set(false);
  }

  public toggleCommandPalette(): void {
    this.commandPaletteOpen.update(v => !v);
  }
}
