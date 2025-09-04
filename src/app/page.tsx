'use client';
import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import { ChatProvider } from './context/ChatContext';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';

const ChatApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <ChatProvider>
      {!isLoggedIn ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex h-screen bg-whatsapp-bg">
          <ChatSidebar />
          <ChatWindow />
        </div>
      )}
    </ChatProvider>
  );
};

export default ChatApp;