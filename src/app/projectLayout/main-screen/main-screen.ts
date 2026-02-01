import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutService } from '../layout.service';
import { MainscreenHeader } from '../mainscreen-header/mainscreen-header';
import { Mainscreensidebar } from '../mainscreensidebar/mainscreensidebar';
import { Toast } from "primeng/toast";
@Component({
  selector: 'app-main-screen',
  standalone: true,
  imports: [RouterOutlet, MainscreenHeader, Mainscreensidebar, Toast],
  templateUrl: './main-screen.html',
  styleUrl: './main-screen.scss'
})
export class MainScreen {
  layout = inject(LayoutService);

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
