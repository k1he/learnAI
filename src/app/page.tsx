"use client";

import { useState } from "react";
import { SplitLayout } from "@/components/conversational/SplitLayout";
import { InputPane } from "@/components/conversational/InputPane";
import { VisualizerPane } from "@/components/conversational/VisualizerPane";
import { ChatInterface } from "@/components/conversational/ChatInterface";
import { Header } from "@/components/conversational/Header";
import { HistorySidebar } from "@/components/conversational/HistorySidebar";
import { useConversation } from "@/hooks/use-conversation";

export default function Home() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    conversation,
    conversations,
    isLoading,
    sendMessage,
    startNewChat,
    loadConversation,
    deleteConversation,
    clearAllHistory,
    stopGeneration,
    restoreVisual,
  } = useConversation();

  const leftContent = (
    <InputPane className="h-full">
      <Header
        onNewChat={startNewChat}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />
      <ChatInterface
        messages={conversation?.messages ?? []}
        isLoading={isLoading}
        onSendMessage={sendMessage}
        onStop={stopGeneration}
        onRestoreVisual={restoreVisual}
      />
    </InputPane>
  );

  const rightContent = (
    <VisualizerPane
      visualization={conversation?.currentVisual ?? null}
      className="h-full"
    />
  );

  return (
    <>
      <main className="h-screen w-screen overflow-hidden">
        <SplitLayout
          leftPanel={leftContent}
          rightPanel={rightContent}
        />
      </main>

      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={conversations}
        currentConversationId={conversation?.id ?? null}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onClearAll={clearAllHistory}
      />
    </>
  );
}
