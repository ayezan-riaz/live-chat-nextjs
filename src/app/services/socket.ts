import { io, Socket } from 'socket.io-client';
import { Message, SocketMessage } from '../../types/index';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    connect(): void {
        if (!this.socket) {
            this.socket = io('http://localhost:3001', {
                transports: ['websocket'],
                autoConnect: true,
            });

            this.socket.on('connect', () => {
                console.log('Connected to server');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });

            // Setup event listeners
            this.setupEventListeners();
        }
    }

    private setupEventListeners(): void {
        if (!this.socket) return;

 this.socket.on('messageReceived', (message: SocketMessage & { receiverPhoneNumber?: string }) => {
    this.emit('messageReceived', message);
});

        this.socket.on('userOnline', (data: { userId: number; phoneNumber: string; name: string }) => {
            this.emit('userOnline', data);
        });

        this.socket.on('userOffline', (data: { userId: number }) => {
            this.emit('userOffline', data);
        });

        this.socket.on('chatHistory', (messages: Message[]) => {
            this.emit('chatHistory', messages);
        });

        this.socket.on('userTyping', (data: { userId: number; userName: string; isTyping: boolean }) => {
            this.emit('userTyping', data);
        });

        // Add this to setupEventListeners method
        this.socket.on('chatUpdated', (chat: any) => {
            this.emit('chatUpdated', chat);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Event emitter methods
    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    off(event: string, callback: Function): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    private emit(event: string, data: any): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }

    // Socket methods
    setUserOnline(phoneNumber: string): void {
        if (this.socket) {
            this.socket.emit('userOnline', { phoneNumber });
        }
    }

    sendMessage(data: {
        content: string;
        senderPhoneNumber: string;
        receiverPhoneNumber: string;
        messageType?: string;
    }): void {
        if (this.socket) {
            this.socket.emit('sendMessage', data);
        }
    }

    joinChat(chatId: number, phoneNumber: string): void {
        if (this.socket) {
            this.socket.emit('joinChat', { chatId, phoneNumber });
        }
    }

    setTyping(chatId: number, phoneNumber: string, isTyping: boolean): void {
        if (this.socket) {
            this.socket.emit('typing', { chatId, phoneNumber, isTyping });
        }
    }

    sendFileMessage(data: {
        senderPhoneNumber: string;
        receiverPhoneNumber: string;
        content: string;
        messageType: string;
        fileName: string;
        filePath: string;
        fileSize: number;
    }): void {
        if (this.socket) {
            this.socket.emit('sendFileMessage', data);
        }
    }

}

export default new SocketService();