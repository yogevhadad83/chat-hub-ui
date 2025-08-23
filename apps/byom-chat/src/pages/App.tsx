import { useEffect, useRef, useState } from 'react';
import { BYOMProvider } from '@chat-hub/byom';
import { io, Socket } from 'socket.io-client';
import { Header } from '../components/Header';
import { JoinBar } from '../components/JoinBar';
import { ChatWindow } from '../components/ChatWindow';
import { Composer } from '../components/Composer';
import {
  addMessage,
  getMessages,
  setMessages,
  useMessages,
  type StoredMessage,
} from '../store/chatStore';
import type { Message } from '../types';

function InnerApp() {
  const [userId, setUserId] = useState(() => {
    return (
      localStorage.getItem('userId') ||
      `user-${Math.random().toString(16).slice(2, 6)}`
    );
  });
  const [convId, setConvId] = useState(() => {
    return localStorage.getItem('conversationId') || 'demo';
  });
  const [joined, setJoined] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    localStorage.setItem('userId', userId);
  }, [userId]);
  useEffect(() => {
    localStorage.setItem('conversationId', convId);
  }, [convId]);

  const messages = useMessages(convId);

  const handleJoin = () => {
    const s = io();
    socketRef.current?.disconnect();
    socketRef.current = s;
    s.emit('join', { conversationId: convId, userId });
    s.on('history', (msgs: StoredMessage[]) => {
      setMessages(convId, msgs);
    });
    s.on('message', (msg: StoredMessage) => {
      addMessage(convId, msg);
    });
    s.on('assistant', (msg: StoredMessage) => {
      addMessage(convId, msg);
    });
    setJoined(true);
  };

  const handleSend = (text: string) => {
    const ts = Date.now();
    const msg: StoredMessage = { author: userId, role: 'user', text, ts };
    addMessage(convId, msg);
    socketRef.current?.emit('message', {
      conversationId: convId,
      author: userId,
      text,
      ts,
    });
  };

  const handleAssistantMessage = (m: { text: string; meta?: { modelId?: string } }) => {
    // Add as ephemeral first; only broadcast when user clicks "Show in chat".
    const ts = Date.now();
    const msg: StoredMessage = {
      author: 'assistant',
      role: 'assistant',
      text: m.text,
      ts,
      meta: m.meta,
      ephemeral: true,
    };
    addMessage(convId, msg);
  };

  const publishAssistant = (m: Message & { meta?: { modelId?: string } }) => {
    // Replace the ephemeral entry with a non-ephemeral version and broadcast
    const published: StoredMessage = { ...m, ephemeral: false } as StoredMessage;
    addMessage(convId, published);
    socketRef.current?.emit('assistant', {
      conversationId: convId,
      author: 'assistant',
      text: m.text,
      ts: m.ts,
      meta: m.meta,
    });
  };

  const getSnapshot = (): Message[] =>
    getMessages(convId)
      .slice(-50)
      .map(({ author, role, text, ts }) => ({ author, role, text, ts }));

  return (
    <div className="flex flex-col h-screen">
      <Header conversationId={convId} connected={joined} />
      {!joined && (
        <JoinBar
          userId={userId}
          convId={convId}
          setUserId={setUserId}
          setConvId={setConvId}
          onJoin={handleJoin}
        />
      )}
      {joined && (
        <>
          <ChatWindow messages={messages} onPublishAssistant={publishAssistant} />
          <Composer
            userId={userId}
            conversationId={convId}
            onSend={handleSend}
            getSnapshot={getSnapshot}
            onAssistantMessage={handleAssistantMessage}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  // Use local proxy to avoid CORS in dev/preview. Can be overridden by VITE_SAAS_BASE_URL.
  const baseUrl = import.meta.env.VITE_SAAS_BASE_URL || '/api';
  return (
    <BYOMProvider baseUrl={baseUrl}>
      <InnerApp />
    </BYOMProvider>
  );
}
