// 'use client';
// import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
// import { User, Chat, Message, SocketMessage } from '../../types/index';
// import socketService from '../services/socket';
// import { chatApi } from '../services/api';

// interface ChatState {
//     currentUser: User | null;
//     chats: Chat[];
//     activeChat: Chat | null;
//     messages: Message[];
//     onlineUsers: Set<number>;
//     typingUsers: Map<number, string>;
//     loading: boolean;
//     error: string | null;
// }

// interface ChatAction {
//     type: string;
//     payload?: any;
// }

// const initialState: ChatState = {
//     currentUser: null,
//     chats: [],
//     activeChat: null,
//     messages: [],
//     onlineUsers: new Set(),
//     typingUsers: new Map(),
//     loading: false,
//     error: null,
// };

// const ChatContext = createContext<{
//     state: ChatState;
//     dispatch: React.Dispatch<ChatAction>; // Add this line
//     setCurrentUser: (user: User) => void;
//     loadChats: () => void;
//     setActiveChat: (chat: Chat) => void;
//     sendMessage: (content: string, receiverPhoneNumber: string) => void;
// }>({
//     state: initialState,
//     dispatch: () => { }, // Add this line
//     setCurrentUser: () => { },
//     loadChats: () => { },
//     setActiveChat: () => { },
//     sendMessage: () => { },
// });

// function chatReducer(state: ChatState, action: ChatAction): ChatState {
//     switch (action.type) {
//         case 'SET_LOADING':
//             return { ...state, loading: action.payload };

//         case 'SET_ERROR':
//             return { ...state, error: action.payload };

//         case 'SET_CURRENT_USER':
//             return { ...state, currentUser: action.payload };

//         case 'SET_CHATS':
//             return { ...state, chats: action.payload };

//         case 'SET_ACTIVE_CHAT':
//             return { ...state, activeChat: action.payload, messages: [] };

//         case 'SET_MESSAGES':
//             return { ...state, messages: action.payload };

//         case 'ADD_MESSAGE':
//             // Prevent exact duplicates only
//             const exists = state.messages.find(m => m.id === action.payload.id);
//             if (!exists) {
//                 return {
//                     ...state,
//                     messages: [...state.messages, action.payload]
//                 };
//             }
//             return state;

//         case 'USER_ONLINE':
//             const newOnlineUsers = new Set(state.onlineUsers);
//             newOnlineUsers.add(action.payload);
//             return { ...state, onlineUsers: newOnlineUsers };

//         case 'USER_OFFLINE':
//             const updatedOnlineUsers = new Set(state.onlineUsers);
//             updatedOnlineUsers.delete(action.payload);
//             return { ...state, onlineUsers: updatedOnlineUsers };

//         case 'SET_TYPING':
//             const newTypingUsers = new Map(state.typingUsers);
//             if (action.payload.isTyping) {
//                 newTypingUsers.set(action.payload.userId, action.payload.userName);
//             } else {
//                 newTypingUsers.delete(action.payload.userId);
//             }
//             return { ...state, typingUsers: newTypingUsers };

//         case 'UPDATE_CHAT':
//             const updatedChats = state.chats.filter(chat =>
//                 chat.chatId !== action.payload.chatId &&
//                 chat.otherUser.phoneNumber !== action.payload.otherUser.phoneNumber
//             );
//             return {
//                 ...state,
//                 chats: [action.payload, ...updatedChats]
//             };
//         default:
//             return state;
//     }
// }

// export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//     const [state, dispatch] = useReducer(chatReducer, initialState);

//     useEffect(() => {
//         // Connect to socket
//         socketService.connect();

//         //      if (state.activeChat && message.chatId === state.activeChat.chatId) {
//         //     dispatch({ type: 'ADD_MESSAGE', payload: message });
//         //   }

//         // const handleMessageReceived = (message: SocketMessage) => {
//         //   // Add message to current chat if it matches active chat
//         //   if (state.activeChat && message.chatId === state.activeChat.chatId) {
//         //     dispatch({ type: 'ADD_MESSAGE', payload: message });
//         //   }
//         //   // Always update chat list regardless of active chat
//         //   // The chatUpdated event will handle this
//         // };
//         // const getReceiverFromMessage = (message: SocketMessage): string => {
//         //     // This would need to be passed from the socket event
//         //     // For now, we'll handle it in the socket service
//         //     return '';
//         // };
//         // Setup socket event listeners
//         const handleMessageReceived = (message: SocketMessage) => {
//             // Check if message belongs to currently active chat
//             if (state.activeChat && state.currentUser) {
//                 const belongsToActiveChat = (
//                     // Message from other user to current user
//                     (message.sender.phoneNumber === state.activeChat.otherUser.phoneNumber &&
//                         message.sender.id !== state.currentUser.id) ||
//                     // Message from current user (echo back)
//                     (message.sender.id === state.currentUser.id)
//                 );

//                 if (belongsToActiveChat) {
//                     // Add to active chat messages immediately
//                     dispatch({ type: 'ADD_MESSAGE', payload: message });

//                     // Update chat ID if it's a new chat
//                     if (state.activeChat.chatId === 0 && message.chatId > 0) {
//                         dispatch({
//                             type: 'SET_ACTIVE_CHAT',
//                             payload: { ...state.activeChat, chatId: message.chatId }
//                         });
//                     }
//                 }
//             }
//         };
//         const handleUserOnline = (data: { userId: number }) => {
//             dispatch({ type: 'USER_ONLINE', payload: data.userId });
//         };

//         const handleUserOffline = (data: { userId: number }) => {
//             dispatch({ type: 'USER_OFFLINE', payload: data.userId });
//         };

//         const handleChatHistory = (messages: Message[]) => {
//             dispatch({ type: 'SET_MESSAGES', payload: messages });
//         };

//         const handleUserTyping = (data: { userId: number; userName: string; isTyping: boolean }) => {
//             dispatch({ type: 'SET_TYPING', payload: data });
//         };

//         const handleChatUpdated = (updatedChat: Chat) => {
//             dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
//         };

//         socketService.on('chatUpdated', handleChatUpdated);
//         socketService.on('messageReceived', handleMessageReceived);
//         socketService.on('userOnline', handleUserOnline);
//         socketService.on('userOffline', handleUserOffline);
//         socketService.on('chatHistory', handleChatHistory);
//         socketService.on('userTyping', handleUserTyping);

//         return () => {
//             socketService.off('messageReceived', handleMessageReceived);
//             socketService.off('userOnline', handleUserOnline);
//             socketService.off('userOffline', handleUserOffline);
//             socketService.off('chatHistory', handleChatHistory);
//             socketService.off('userTyping', handleUserTyping);
//             socketService.off('chatUpdated', handleChatUpdated);

//             socketService.disconnect();
//         };
//     }, []);

//     const setCurrentUser = (user: User) => {
//         dispatch({ type: 'SET_CURRENT_USER', payload: user });
//         socketService.setUserOnline(user.phoneNumber);
//     };

//     const loadChats = async () => {
//         if (!state.currentUser) return;

//         try {
//             dispatch({ type: 'SET_LOADING', payload: true });
//             const response = await chatApi.getUserChats(state.currentUser.phoneNumber);
//             dispatch({ type: 'SET_CHATS', payload: response.data });
//         } catch (error) {
//             dispatch({ type: 'SET_ERROR', payload: 'Failed to load chats' });
//         } finally {
//             dispatch({ type: 'SET_LOADING', payload: false });
//         }
//     };

//     //   const setActiveChat = (chat: Chat) => {
//     //     dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });
//     //     if (state.currentUser) {
//     //       socketService.joinChat(chat.chatId, state.currentUser.phoneNumber);
//     //     }
//     //   };
//     const setActiveChat = async (chat: Chat) => {
//         dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });

//         if (state.currentUser) {
//             // Always join the chat room first
//             const chatId = chat.chatId || 0;
//             socketService.joinChat(chatId, state.currentUser.phoneNumber);

//             if (chat.chatId && chat.chatId > 0) {
//                 try {
//                     const response = await chatApi.getChatHistory(chat.chatId);
//                     dispatch({ type: 'SET_MESSAGES', payload: (response.data as Message[]).reverse() });
//                 } catch (error) {
//                     console.error('Failed to load chat history:', error);
//                     dispatch({ type: 'SET_MESSAGES', payload: [] });
//                 }
//             } else {
//                 dispatch({ type: 'SET_MESSAGES', payload: [] });
//             }
//         }
//     };

//     const sendMessage = (content: string, receiverPhoneNumber: string) => {
//         if (!state.currentUser) return;

//         // Don't add message here, let socket response handle it
//         socketService.sendMessage({
//             content,
//             senderPhoneNumber: state.currentUser.phoneNumber,
//             receiverPhoneNumber,
//             messageType: 'text'
//         });
//     };
//     return (
//         <ChatContext.Provider value={{
//             state,
//             dispatch, // Add this line
//             setCurrentUser,
//             loadChats,
//             setActiveChat,
//             sendMessage
//         }}>
//             {children}
//         </ChatContext.Provider>
//     );
// };

// export const useChat = () => {
//     const context = useContext(ChatContext);
//     if (!context) {
//         throw new Error('useChat must be used within ChatProvider');
//     }
//     return context;
// };






'use client';
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { User, Chat, Message, SocketMessage } from '../../types/index';
import socketService from '../services/socket';
import { chatApi } from '../services/api'; // (still imported if you need it elsewhere)

interface ChatState {
  currentUser: User | null;
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  onlineUsers: Set<number>;
  typingUsers: Map<number, string>;
  loading: boolean;
  error: string | null;
}

interface ChatAction {
  type: string;
  payload?: any;
}

const initialState: ChatState = {
  currentUser: null,
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: new Set(),
  typingUsers: new Map(),
  loading: false,
  error: null,
};

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  setCurrentUser: (user: User) => void;
  loadChats: () => void;
  setActiveChat: (chat: Chat) => void;
  sendMessage: (content: string, receiverPhoneNumber: string) => void;
}>({
  state: initialState,
  dispatch: () => {},
  setCurrentUser: () => {},
  loadChats: () => {},
  setActiveChat: () => {},
  sendMessage: () => {},
});

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload, messages: [] };
    case 'SET_MESSAGES':
      // Ensure ascending by createdAt (optional but safer)
      return {
        ...state,
        messages: [...action.payload].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      };
    case 'ADD_MESSAGE': {
      const m = action.payload as Message;
      if (m?.id != null && state.messages.some(x => x.id === m.id)) return state;
      return { ...state, messages: [...state.messages, m] };
    }
    case 'USER_ONLINE': {
      const s = new Set(state.onlineUsers);
      s.add(action.payload);
      return { ...state, onlineUsers: s };
    }
    case 'USER_OFFLINE': {
      const s = new Set(state.onlineUsers);
      s.delete(action.payload);
      return { ...state, onlineUsers: s };
    }
    case 'SET_TYPING': {
      const map = new Map(state.typingUsers);
      const { userId, userName, isTyping } = action.payload as { userId: number; userName: string; isTyping: boolean };
      if (isTyping) map.set(userId, userName);
      else map.delete(userId);
      return { ...state, typingUsers: map };
    }
    case 'UPDATE_CHAT': {
      const updated = state.chats.filter(
        c => c.chatId !== action.payload.chatId && c.otherUser.phoneNumber !== action.payload.otherUser.phoneNumber
      );
      return { ...state, chats: [action.payload, ...updated] };
    }
    default:
      return state;
  }
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // always-fresh state for socket handlers
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    socketService.connect();

    const handleMessageReceived = (message: SocketMessage) => {
      const { currentUser, activeChat } = stateRef.current;
      if (!currentUser || !activeChat) return;

      const byChatId =
        !!activeChat.chatId && !!message.chatId && message.chatId === activeChat.chatId;

      const byParticipants =
        message.sender?.id === currentUser.id ||
        message.sender?.phoneNumber === activeChat.otherUser.phoneNumber;

      if (byChatId || byParticipants) {
        dispatch({ type: 'ADD_MESSAGE', payload: message });

        // if it's a brand-new chat, lock chatId
        if (activeChat.chatId === 0 && message.chatId && message.chatId > 0) {
          dispatch({
            type: 'SET_ACTIVE_CHAT',
            payload: { ...activeChat, chatId: message.chatId },
          });
        }
      }
    };

    const handleChatHistory = (messages: Message[]) => {
      // server already reversed; we sort ascending in reducer to be safe
      dispatch({ type: 'SET_MESSAGES', payload: messages });
    };

    const handleChatUpdated = (chat: Chat) => {
      dispatch({ type: 'UPDATE_CHAT', payload: chat });
    };

    const handleUserOnline = (data: { userId: number }) => {
      dispatch({ type: 'USER_ONLINE', payload: data.userId });
    };

    const handleUserOffline = (data: { userId: number }) => {
      dispatch({ type: 'USER_OFFLINE', payload: data.userId });
    };

    const handleUserTyping = (data: { userId: number; userName: string; isTyping: boolean }) => {
      dispatch({ type: 'SET_TYPING', payload: data });
    };

    // 🔒 Register ONCE (no duplicates)
    socketService.on('messageReceived', handleMessageReceived);
    socketService.on('chatHistory', handleChatHistory);
    socketService.on('chatUpdated', handleChatUpdated);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);
    socketService.on('userTyping', handleUserTyping);

    return () => {
      socketService.off('messageReceived', handleMessageReceived);
      socketService.off('chatHistory', handleChatHistory);
      socketService.off('chatUpdated', handleChatUpdated);
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
      socketService.off('userTyping', handleUserTyping);
      socketService.disconnect();
    };
  }, []);

  const setCurrentUser = (user: User) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
    socketService.setUserOnline(user.phoneNumber);
  };

  const loadChats = async () => {
    if (!stateRef.current.currentUser) return;
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatApi.getUserChats(stateRef.current.currentUser.phoneNumber);
      dispatch({ type: 'SET_CHATS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load chats' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ❗ HISTORY SOURCE = SOCKET ONLY
  const setActiveChat = async (chat: Chat) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });

    const user = stateRef.current.currentUser;
    if (!user) return;

    if (chat.chatId && chat.chatId > 0) {
      socketService.joinChat(chat.chatId, user.phoneNumber);
      // DO NOT fetch HTTP history; socket 'chatHistory' will set messages
    } else {
      // new chat; empty until first message
      dispatch({ type: 'SET_MESSAGES', payload: [] });
    }
  };

  const sendMessage = (content: string, receiverPhoneNumber: string) => {
    const user = stateRef.current.currentUser;
    if (!user) return;

    socketService.sendMessage({
      content,
      senderPhoneNumber: user.phoneNumber,
      receiverPhoneNumber,
      messageType: 'text',
    });
  };

  return (
    <ChatContext.Provider value={{ state, dispatch, setCurrentUser, loadChats, setActiveChat, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
