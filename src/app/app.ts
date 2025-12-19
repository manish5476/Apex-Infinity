import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainScreen } from './projectLayout/main-screen/main-screen';
import { ToastModule } from 'primeng/toast';
import { LoadingComponent } from "./modules/shared/components/loader.component";
import { MasterListService } from './core/services/master-list.service';
import { AnnouncementListenerComponent } from "./modules/shared/components/announcement-banner/announcement-banner.component";
import { AuthService } from './modules/auth/services/auth-service';
import { SocketService } from './core/services/socket.service';
// import { AiAssistantComponent } from "./AIAgent/components/ai-assistant/ai-assistant";
@Component({
  selector: 'app-root',
  imports: [ToastModule, RouterOutlet, LoadingComponent, AnnouncementListenerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('apex');

  constructor(private auth: AuthService, private socketService: SocketService, private masterList: MasterListService) {
    this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.socketService.connect(this.auth.authTokenData, user.organizationId);
      } else {
        this.socketService.disconnect();
      }
    });
  }

  ngOnInit() {
    this.masterList.initFromCache();
    // this.masterList.load();
  }

}
