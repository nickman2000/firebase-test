export interface ChatMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface ChatUser {
  uid: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: number;
}