'use client';
import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Chat, User } from '../../types/index';
import { formatDistanceToNow } from 'date-fns';
import { Search, MessageCircle, Users } from 'lucide-react';
import { userApi } from '../services/api';

const ChatSidebar: React.FC = () => {
    const { state, loadChats, setActiveChat } = useChat();
    const [searchQuery, setSearchQuery] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [showAllUsers, setShowAllUsers] = useState(false);

    useEffect(() => {
        if (state.currentUser) {
            loadChats();
            loadAllUsers();
        }
    }, [state.currentUser]);

    const loadAllUsers = async () => {
        try {
            const response: any = await userApi.getAllUsers();
            setAllUsers(response.data.filter((user: User) =>
                user.phoneNumber !== state.currentUser?.phoneNumber
            ));
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };


    const filteredChats = state.chats.filter(chat =>
        chat.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.otherUser?.phoneNumber.includes(searchQuery)
    );

    const filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phoneNumber.includes(searchQuery)
    );

    const createNewChat = (user: User) => {
        const newChat: Chat = {
            chatId: 0, // Will be created when first message is sent
            chatType: 'private',
            otherUser: {
                id: user.id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                isOnline: state.onlineUsers.has(user.id),
                lastSeen: user.lastSeen
            },
            lastMessage: null,
            lastMessageTime: null
        };

        setActiveChat(newChat);
        setShowAllUsers(false);
    };

    const formatLastSeen = (lastSeen: Date | null) => {
        if (!lastSeen) return 'Never';
        return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    };

    return (
        <div className="w-80 bg-whatsapp-sidebar flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">Chats</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowAllUsers(!showAllUsers)}
                            className={`p-2 rounded-lg transition-colors ${showAllUsers ? 'bg-green-600' : 'bg-gray-600 hover:bg-gray-700'
                                }`}
                        >
                            <Users className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {state.currentUser && (
                    <div className="mb-4 p-3 bg-whatsapp-input rounded-lg">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                <span className="text-white font-semibold">
                                    {state.currentUser.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-white font-semibold">{state.currentUser.name}</p>
                                <p className="text-sm text-gray-400">{state.currentUser.phoneNumber}</p>
                            </div>
                            <div className="ml-auto">
                                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search contacts..."
                        className="w-full pl-10 pr-4 py-2 bg-whatsapp-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700"
                    />
                </div>
            </div>

            {/* Chat/User List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {showAllUsers ? (
                    // All Users List
                    <div className="p-2">
                        <h3 className="text-sm text-gray-400 mb-3 px-2">All Users</h3>
                        {filteredUsers.map(user => (
                            <div
                                key={user.id}
                                onClick={() => createNewChat(user)}
                                className="flex items-center p-3 hover:bg-whatsapp-input cursor-pointer rounded-lg mb-1"
                            >
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white font-semibold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{user.name}</h3>
                                    <p className="text-sm text-gray-400">{user.phoneNumber}</p>
                                    <p className="text-xs text-gray-500">
                                        {state.onlineUsers.has(user.id) ?
                                            <span className="text-green-400">Online</span> :
                                            `Last seen ${formatLastSeen(user.lastSeen)}`
                                        }
                                    </p>
                                </div>
                                {state.onlineUsers.has(user.id) && (
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Existing Chats List
                    <div className="p-2">
                        {filteredChats.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No chats yet</p>
                                <p className="text-sm text-gray-500">Click on Users to start a conversation</p>
                            </div>
                        ) : (
                            filteredChats.map(chat => (
                                <div
                                    key={chat.chatId || chat.otherUser.phoneNumber}
                                    onClick={() => setActiveChat(chat)}
                                    className={`flex items-center p-3 hover:bg-whatsapp-input cursor-pointer rounded-lg mb-1 ${state.activeChat?.otherUser.phoneNumber === chat.otherUser.phoneNumber
                                            ? 'bg-whatsapp-input'
                                            : ''
                                        }`}
                                >
                                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-semibold">
                                            {chat.otherUser.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-white truncate">
                                                {chat.otherUser.name}
                                            </h3>
                                            {chat.lastMessage && (
                                                <span className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(chat.lastMessage.createdAt))}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-400 truncate">
                                                {chat.lastMessage?.content || 'No messages yet'}
                                            </p>
                                            {state.onlineUsers.has(chat.otherUser.id) && (
                                                <div className="w-2 h-2 bg-green-400 rounded-full ml-2"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;