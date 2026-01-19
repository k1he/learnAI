"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Conversation, Message, Visualization } from "@/types/conversation";
import {
  getConversations,
  saveConversation,
  getConversationById,
  deleteConversation as deleteConversationFromStorage,
  clearAllConversations,
  getCurrentConversationId,
  setCurrentConversationId,
  generateConversationId,
  generateMessageId,
} from "@/lib/storage";
import { chatGenerate } from "@/services/api";

interface UseConversationReturn {
  conversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  startNewChat: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  clearAllHistory: () => void;
  clearError: () => void;
  stopGeneration: () => void;
  restoreVisual: (code: string) => void;
}

/**
 * Hook for managing conversation state.
 * Handles message sending, API calls, and LocalStorage persistence.
 */
export function useConversation(): UseConversationReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from LocalStorage on mount
  useEffect(() => {
    const loadedConversations = getConversations();
    setConversations(loadedConversations);

    // Try to restore current conversation
    const currentId = getCurrentConversationId();
    if (currentId) {
      const current = getConversationById(currentId);
      if (current) {
        setConversation(current);
        return;
      }
    }

    // If no current conversation, start a new one
    startNewChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Start a new conversation.
   */
  const startNewChat = useCallback(() => {
    const newConversation: Conversation = {
      id: generateConversationId(),
      title: "新对话",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      currentVisual: null,
    };

    setConversation(newConversation);
    setCurrentConversationId(newConversation.id);
    setError(null);
  }, []);

  /**
   * Load an existing conversation by ID.
   */
  const loadConversation = useCallback((id: string) => {
    const loaded = getConversationById(id);
    if (loaded) {
      setConversation(loaded);
      setCurrentConversationId(id);
      setError(null);
    }
  }, []);

  /**
   * Delete a conversation by ID.
   */
  const deleteConversation = useCallback((id: string) => {
    deleteConversationFromStorage(id);
    setConversations(getConversations());

    // If deleting current conversation, start a new one
    if (conversation?.id === id) {
      startNewChat();
    }
  }, [conversation?.id, startNewChat]);

  /**
   * Clear all conversation history.
   */
  const clearAllHistory = useCallback(() => {
    clearAllConversations();
    setConversations([]);
    startNewChat();
  }, [startNewChat]);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stop current generation.
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);

      // Update visual status to indicate stoppage
      setConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentVisual: prev.currentVisual ? {
            ...prev.currentVisual,
            status: "error",
            error: "用户停止了生成"
          } : null
        };
      });
    }
  }, []);

  /**
   * Send a message and get AI response.
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || isLoading) return;

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    // Create user message
    const userMessage: Message = {
      id: generateMessageId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    // Update conversation with user message and loading state
    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
      currentVisual: conversation.currentVisual
        ? { ...conversation.currentVisual, status: "loading" }
        : { code: "", version: 0, status: "loading" },
      updatedAt: Date.now(),
    };

    // Generate title from first message
    if (conversation.messages.length === 0) {
      updatedConversation.title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    setConversation(updatedConversation);

    try {
      // Prepare API request
      const apiMessages = updatedConversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const currentCode = conversation.currentVisual?.code || null;

      // Call API with signal
      const response = await chatGenerate({
        messages: apiMessages,
        current_code: currentCode,
      }, controller.signal); // Pass signal here

      // Create assistant message
      const assistantMessage: Message = {
        id: generateMessageId(),
        role: "assistant",
        content: response.message.content,
        timestamp: Date.now(),
        codeSnippet: response.message.code || undefined,
      };

      // Update visualization
      const newVisual: Visualization = {
        code: response.message.code || "",
        explanation: response.message.content,
        version: (conversation.currentVisual?.version || 0) + 1,
        status: response.message.code ? "success" : "error",
        error: response.message.code ? undefined : "未生成有效代码",
      };

      // Final conversation state
      const finalConversation: Conversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        currentVisual: newVisual,
        updatedAt: Date.now(),
      };

      setConversation(finalConversation);
      saveConversation(finalConversation);
      setConversations(getConversations());

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted');
        return; // Handled by stopGeneration logic
      }

      const errorMessage = err instanceof Error ? err.message : "请求失败，请重试";
      setError(errorMessage);

      // Update conversation with error state
      const errorConversation: Conversation = {
        ...updatedConversation,
        currentVisual: {
          code: conversation.currentVisual?.code || "",
          version: conversation.currentVisual?.version || 0,
          status: "error",
          error: errorMessage,
        },
        updatedAt: Date.now(),
      };

      setConversation(errorConversation);
      saveConversation(errorConversation);

    } finally {
      // Only clear loading if not aborted (aborted logic handles state separately)
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [conversation, isLoading]);

  /**
   * Clear current error.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Restore a specific code version to the visualizer.
   */
  const restoreVisual = useCallback((code: string) => {
    setConversation((prev) => {
      if (!prev) return null;

      const newVisual: Visualization = {
        code,
        explanation: "已恢复历史版本",
        version: (prev.currentVisual?.version || 0) + 1,
        status: "success",
      };

      const updated = {
        ...prev,
        currentVisual: newVisual,
        updatedAt: Date.now(),
      };

      saveConversation(updated);
      return updated;
    });
  }, []);

  return {
    conversation,
    conversations,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    loadConversation,
    deleteConversation,
    clearAllHistory,
    clearError,
    stopGeneration,
    restoreVisual,
  };
}
