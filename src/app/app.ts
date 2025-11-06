import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { ToastModule } from 'primeng/toast';
@Component({
  selector: 'app-root',
  imports: [ToastModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('apex');
}
