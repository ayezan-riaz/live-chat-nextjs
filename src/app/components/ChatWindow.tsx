
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Phone, Video, MoreVertical, Paperclip } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import socketService from '../services/socket';
import { fileApi } from '../services/api';
import { FileUploadResponse, Message } from '@/types';




const ChatWindow: React.FC = () => {
  const { state, sendMessage, dispatch } = useChat(); // Add dispatch here

    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Add these state variables
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Best practice
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    useEffect(() => {
        scrollToBottom();
    }, [state.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !state.activeChat || !state.currentUser) return;

        sendMessage(messageInput.trim(), state.activeChat.otherUser.phoneNumber);
        setMessageInput('');

        // Stop typing indicator
        if (isTyping) {
            setIsTyping(false);
            if (state.activeChat.chatId) {
                socketService.setTyping(state.activeChat.chatId, state.currentUser.phoneNumber, false);
            }
        }


        
    };

    // Add file handling functions
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

useEffect(() => {
    if (state.activeChat && state.activeChat.chatId === 0) {
        dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
}, [state.activeChat?.otherUser?.phoneNumber, dispatch]);

    // Update the handleSendFile function
    const handleSendFile = async () => {
        if (!selectedFile || !state.activeChat || !state.currentUser) return;

        setIsUploading(true);
        try {
            // Use temporary chatId for new chats, backend will handle it
            const chatId: number | string = state.activeChat.chatId || 'temp';

            const response = await fileApi.uploadFile(chatId, selectedFile);
            const fileData = response.data as FileUploadResponse;

            let messageType = 'file';
            if (selectedFile.type.startsWith('image/')) messageType = 'image';
            else if (selectedFile.type.startsWith('audio/')) messageType = 'audio';

            socketService.sendFileMessage({
                senderPhoneNumber: state.currentUser.phoneNumber,
                receiverPhoneNumber: state.activeChat.otherUser.phoneNumber,
                content: selectedFile.name,
                messageType,
                fileName: fileData.filename,
                filePath: fileData.path,
                fileSize: fileData.size
            });

            setSelectedFile(null);
        } catch (error) {
            console.error('File upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };
    // Add file preview function
    const renderFilePreview = (message: Message) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        if (message.messageType === 'image') {
            return (
                <img
                    src={baseUrl + message.filePath}
                    alt={message.fileName}
                    className="max-w-xs rounded-lg cursor-pointer"
                    onClick={() => window.open(baseUrl + message.filePath, '_blank')}
                />
            );
        } else if (message.messageType === 'audio') {
            return (
                <audio controls className="max-w-xs">
                    <source src={baseUrl + message.filePath} type="audio/mpeg" />
                    Your browser does not support audio.
                </audio>
            );
        } else if (message.messageType === 'file') {
            return (
                <div className="flex items-center space-x-2 p-2 border rounded">
                    <Paperclip className="w-4 h-4" />
                    <a
                        href={baseUrl + message.filePath}
                        download={message.fileName}
                        className="text-blue-400 hover:underline"
                    >
                        {message.fileName}
                    </a>
                </div>
            );
        }
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessageInput(value);

        if (!state.activeChat?.chatId || !state.currentUser) return;

        // Handle typing indicator
        if (value.trim() && !isTyping) {
            setIsTyping(true);
            socketService.setTyping(state.activeChat.chatId, state.currentUser.phoneNumber, true);
        } else if (!value.trim() && isTyping) {
            setIsTyping(false);
            socketService.setTyping(state.activeChat.chatId, state.currentUser.phoneNumber, false);
        }

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing indicator
        if (value.trim()) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (state.activeChat?.chatId && state.currentUser) {
                    socketService.setTyping(state.activeChat.chatId, state.currentUser.phoneNumber, false);
                }
            }, 2000);
        }
    };

    const formatMessageTime = (date: Date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return format(messageDate, 'HH:mm');
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday ' + format(messageDate, 'HH:mm');
        } else {
            return format(messageDate, 'dd/MM/yyyy HH:mm');
        }
    };

    const getOnlineStatus = () => {
        if (!state.activeChat) return '';

        if (state.onlineUsers.has(state.activeChat.otherUser.id)) {
            return 'Online';
        } else if (state.activeChat.otherUser.lastSeen) {
            return `Last seen ${formatDistanceToNow(new Date(state.activeChat.otherUser.lastSeen), { addSuffix: true })}`;
        } else {
            return 'Offline';
        }
    };

    const getTypingUsers = () => {
        if (!state.activeChat) return [];
        return Array.from(state.typingUsers.entries())
            .filter(([userId]) => userId !== state.currentUser?.id)
            .map(([userId, userName]) => userName);
    };

    if (!state.activeChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-whatsapp-chat">
                <div className="text-center">
                    <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Send className="w-16 h-16 text-gray-500" />
                    </div>
                    <h2 className="text-xl text-gray-400 mb-2">Welcome to Live Chat</h2>
                    <p className="text-gray-500">Select a chat to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-whatsapp-chat">
            {/* Chat Header */}
            <div className="bg-whatsapp-sidebar p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-semibold">
                            {state.activeChat.otherUser.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{state.activeChat.otherUser.name}</h3>
                        <p className="text-sm text-gray-400">
                            {getTypingUsers().length > 0
                                ? `${getTypingUsers().join(', ')} ${getTypingUsers().length === 1 ? 'is' : 'are'} typing...`
                                : getOnlineStatus()
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <Video className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {state.messages.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    state.messages.map((message, index) => {
                        const isOwn = message.senderId === state.currentUser?.id;
                        const showTime = index === 0 ||
                            new Date(message.createdAt).getTime() - new Date(state.messages[index - 1].createdAt).getTime() > 300000; // 5 minutes

                        return (
                            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn
                                    ? 'bg-whatsapp-message text-white'
                                    : 'bg-whatsapp-received text-white'
                                    }`}>
                                    {message.messageType === 'text' ? (
                                        <p className="text-sm">{message.content}</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {renderFilePreview(message)}
                                            <p className="text-xs">{message.content}</p>
                                        </div>
                                    )}

                                    {/* <p className="text-sm">{message.content}</p> */}

                                    <p className={`text-xs mt-1 ${isOwn ? 'text-green-200' : 'text-gray-400'
                                        }`}>
                                        {formatMessageTime(message.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {/* <div className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-whatsapp-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </form>
            </div> */}

            <div className="p-4 border-t border-gray-700">
                {selectedFile && (
                    <div className="mb-3 p-3 bg-whatsapp-input rounded-lg flex items-center justify-between">
                        <span className="text-white text-sm">{selectedFile.name}</span>
                        <button onClick={() => setSelectedFile(null)} className="text-red-400">✕</button>
                    </div>
                )}

                <form onSubmit={selectedFile ? (e) => { e.preventDefault(); handleSendFile(); } : handleSendMessage}
                    className="flex items-center space-x-3">

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,audio/*,.pdf,.doc,.docx"
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder={selectedFile ? "Add caption..." : "Type a message..."}
                        className="flex-1 px-4 py-2 bg-whatsapp-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700"
                    />

                    <button
                        type="submit"
                        disabled={(!messageInput.trim() && !selectedFile) || isUploading}
                        className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
                    >
                        {isUploading ? '...' : <Send className="w-5 h-5 text-white" />}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default ChatWindow;