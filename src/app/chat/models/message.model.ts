export interface Message {
  _id: string;
  channelId: string;
  senderId: string;
  body?: string;
  createdAt?: string;
  attachments?: any[];
}
