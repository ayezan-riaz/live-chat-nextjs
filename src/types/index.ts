export interface User {
  id: number;
  name: string;
  phoneNumber: string;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: Date;
  senderId: number;
  chatId: number;
  sender: User;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
}

export interface Chat {
  chatId: number;
  chatType: string;
  otherUser: {
    id: number;
    name: string;
    phoneNumber: string;
    isOnline: boolean;
    lastSeen: Date | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    senderName: string;
  } | null;
  lastMessageTime: Date | null;
}

export interface SocketMessage {
  id: number;
  content: string;
  messageType: string;
  createdAt: Date;
  sender: User;
  chatId: number;
}

export interface FileUploadResponse {
    success: boolean;
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimeType: string;
}