// src/app/core/services/chat-http.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Channel } from 'diagnostics_channel';
import { Message } from '../message';
import { Attachment } from '../../../chat/chat.component/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatHttpService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  sendMessage(payload: { channelId: string; body: string; attachments?: Attachment[] }): Promise<Message> {
    const { channelId, body, attachments = [] } = payload;
    if (!channelId || (!body && !attachments.length)) return Promise.reject(new Error('Invalid Payload'));
    return lastValueFrom(this.http.post<Message>(`${this.apiUrl}/v1/chat/messages`, payload));
  }

  createChannel(name: string, type: any, members: string[] = []) {
    return this.http.post<Channel>(`${this.apiUrl}/v1/chat/channels`, { name, type, members });
  }

  leaveChannel(channelId: string) {
    return this.http.post(`${this.apiUrl}/v1/chat/channels/${channelId}/leave`, {});
  }

  addMember(channelId: string, userId: string) {
    return this.http.post(`${this.apiUrl}/v1/chat/channels/${channelId}/members`, { userId });
  }

  removeMember(channelId: string, userId: string) {
    return this.http.delete(`${this.apiUrl}/v1/chat/channels/${channelId}/members/${userId}`);
  }

  uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${this.apiUrl}/v1/chat/upload`, formData);
  }

  deleteMessage(messageId: string) {
    return this.http.delete(`${this.apiUrl}/v1/chat/messages/${messageId}`);
  }

  editMessage(messageId: string, body: string) {
    return this.http.patch<Message>(`${this.apiUrl}/v1/chat/messages/${messageId}`, { body });
  }

  listChannels() {
    return this.http.get<Channel[]>(`${this.apiUrl}/v1/chat/channels`);
  }

  fetchMessages(channelId: string, before?: string, limit = 50) {
    const params: any = { limit };
    if (before) params.before = before;
    return this.http.get<{ messages: Message[] }>(`${this.apiUrl}/v1/chat/channels/${channelId}/messages`, { params });
  }
}