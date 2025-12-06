import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { ToastModule } from 'primeng/toast';
import { LoadingComponent } from "./modules/shared/components/loader.component";
import { MasterListService } from './core/services/master-list.service';
// import { AiAssistantComponent } from "./AIAgent/components/ai-assistant/ai-assistant";
@Component({
  selector: 'app-root',
  imports: [ToastModule, RouterOutlet, LoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('apex');
  constructor(private masterList: MasterListService) { }
  ngOnInit() {
    this.masterList.initFromCache();
    // this.masterList.load();
  }

}
