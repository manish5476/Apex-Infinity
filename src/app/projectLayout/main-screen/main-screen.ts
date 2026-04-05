import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';
import { TabStripComponent, TabService } from '../../Tabbing';
import { Toast } from "primeng/toast";
@Component({
  selector: 'app-main-screen',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainscreenHeader, Mainscreensidebar, Toast, TabStripComponent],
  templateUrl: './main-screen.html',
  styleUrl: './main-screen.scss'
})
export class MainScreen {
  public layout = inject(LayoutService);
  public tabService = inject(TabService);

  constructor() {
    this.updateWidth();
  }

  @HostListener('window:resize')
  updateWidth() {
    this.layout.screenWidth.set(window.innerWidth);
  }

  onMenuToggle() {
    if (this.layout.isDesktop()) {
      this.layout.togglePin();
    } else {
      this.layout.toggleMobile();
    }
  }
}
