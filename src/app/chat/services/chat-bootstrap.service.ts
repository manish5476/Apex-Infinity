
import { Injectable, inject } from '@angular/core';
import { ChatService } from './chat.service';

@Injectable({ providedIn: 'root' })
export class ChatBootstrapService {

  private chat = inject(ChatService);

  init(token: string, userId: string, organizationId: string) {
    if (!token || !userId) return;

    // DO NOT set tokenRefresh here anymore (caused circular dependency)
    this.chat.connect(token);
  }

  stop() {
    this.chat.disconnect();
  }
}


// import { Injectable, inject } from '@angular/core';
// import { ChatService } from './chat.service';
// import { AuthService } from '../../modules/auth/services/auth-service';

// @Injectable({ providedIn: 'root' })
// export class ChatBootstrapService {

//   private chat = inject(ChatService);
//   private auth = inject(AuthService);

//   init(token: string, userId: string, organizationId: string) {
//     if (!token || !userId) return;

//     // IMPORTANT: attach token refresh callback BEFORE connecting
//     this.chat.setTokenRefresh(() => this.auth.refreshTokenPromise());

//     this.chat.connect(token);
//   }

//   stop() {
//     this.chat.disconnect();
//   }
// }
