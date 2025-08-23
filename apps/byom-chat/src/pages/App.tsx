import { useState } from 'react';
import { BYOMProvider, useBYOM } from '@byom/sdk';
import { Header } from '../components/Header';
import { JoinBar } from '../components/JoinBar';
import { ProviderForm } from '../components/ProviderForm';
import { ChatWindow } from '../components/ChatWindow';
import { Composer } from '../components/Composer';
import {
  getMessages,
  addUserMessage,
  addAssistantMessage,
  joinConversation,
  revealMessage,
} from '../store/chatStore';
import type { Message } from '../types';

function InnerApp() {
  const [userId, setUserId] = useState('');
  const [convId, setConvId] = useState('');
  const [joined, setJoined] = useState(false);
  const [modelId, setModelId] = useState<string | undefined>();
  const [, setTick] = useState(0);
  const { invoke } = useBYOM();
  const messages = getMessages(convId);

  const handleJoin = (u: string, c: string) => {
    if (!joinConversation(c, u)) {
      window.alert('Conversation already has two participants');
      return;
    }
    setUserId(u);
    setConvId(c);
    setJoined(true);
  };

  const handleSend = (text: string) => {
    if (!joined) return;
    addUserMessage(convId, userId, text);
    setTick((t) => t + 1);
  };

  const handleInvoke = async (text: string) => {
    if (!joined) return;
    addUserMessage(convId, userId, text, true);
    setTick((t) => t + 1);
    const snapshot: Message[] = getMessages(convId)
      .slice(-50)
      .map(({ author, role, text: t, ts }) => ({ author, role, text: t, ts }));
    try {
      const res = await invoke({
        userId,
        conversationId: convId,
        prompt: text,
        conversation: snapshot,
      });
      addAssistantMessage(convId, 'assistant', res.reply, res.meta?.modelId, true);
      setModelId(res.meta?.modelId);
      setTick((t) => t + 1);
    } catch (e: any) {
      addAssistantMessage(convId, 'assistant', String(e), undefined, true);
      setTick((t) => t + 1);
    }
  };

  const handleReveal = (ts: number) => {
    revealMessage(convId, ts);
    setTick((t) => t + 1);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header modelId={modelId} />
      {!joined && <JoinBar onJoin={handleJoin} />}
      {joined && (
        <>
          <ProviderForm userId={userId} />
          <ChatWindow
            messages={messages}
            currentUserId={userId}
            onReveal={handleReveal}
          />
          <Composer
            onSend={handleSend}
            onInvoke={handleInvoke}
            modelRegistered={Boolean(modelId)}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  const baseUrl = import.meta.env.VITE_BYOM_API_URL || 'http://localhost:3000';
  return (
    <BYOMProvider baseUrl={baseUrl}>
      <InnerApp />
    </BYOMProvider>
  );
}
