
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
