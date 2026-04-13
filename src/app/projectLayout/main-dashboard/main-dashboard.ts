import { Component, HostListener, inject } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';
import { TabStripComponent, TabService } from '../../Tabbing';
import { Toast } from "primeng/toast";
@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [RouterOutlet, MainscreenHeader, Mainscreensidebar, Toast],
  templateUrl: './main-dashboard.html',
  styleUrl: './main-dashboard.scss'
})
export class MainDashboardComponent {
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
