// chat.models.ts - Shared interfaces (must match socket.service.ts)
export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
  publicId?: string;
}

export interface Message {
  _id?: string;
  channelId: string;
  senderId?: any;
  body?: string;
  attachments?: Attachment[];
  createdAt?: string;
  deleted?: boolean;
  read?: boolean;
  readBy?: string[];
  editedAt?: string;
  editedBy?: string;
}

export type ChatMessage = Message;

export interface Channel {
  _id: string;
  name?: string;
  type?: 'public' | 'private' | 'dm';
  members?: string[];
  isActive?: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface NotificationData {
  _id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'urgent';
  isRead?: boolean;
  createdAt?: string;
  metadata?: any;
  recipientId?: string;
  createdBy?: string;
  readAt?: string;
  readBy?: string;
}

export interface OnlineUser {
  userId: string;
  organizationId?: string;
  timestamp?: string;
}

export interface TypingData {
  channelId: string;
  userId: string;
  typing: boolean;
  timestamp?: string;
}