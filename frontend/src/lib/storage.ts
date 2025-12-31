/**
 * LocalStorage utility for Conversation persistence.
 * Handles saving, loading, and managing conversation history.
 */

import type { Conversation } from "@/types/conversation";

const STORAGE_KEY = "concept-canvas-conversations";
const CURRENT_CONVERSATION_KEY = "concept-canvas-current-conversation";

/**
 * Get all saved conversations from LocalStorage.
 */
export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return [];
  }
}

/**
 * Save a conversation to LocalStorage.
 * Updates existing conversation if ID matches, otherwise adds new.
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === "undefined") return;
  
  try {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    const updatedConversation = {
      ...conversation,
      updatedAt: Date.now(),
    };
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = updatedConversation;
    } else {
      conversations.unshift(updatedConversation);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Failed to save conversation:", error);
  }
}

/**
 * Get a single conversation by ID.
 */
export function getConversationById(id: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(c => c.id === id) ?? null;
}

/**
 * Delete a conversation by ID.
 */
export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete conversation:", error);
  }
}

/**
 * Clear all conversation history.
 */
export function clearAllConversations(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
  } catch (error) {
    console.error("Failed to clear conversations:", error);
  }
}

/**
 * Get the current active conversation ID.
 */
export function getCurrentConversationId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(CURRENT_CONVERSATION_KEY);
  } catch (error) {
    console.error("Failed to get current conversation ID:", error);
    return null;
  }
}

/**
 * Set the current active conversation ID.
 */
export function setCurrentConversationId(id: string | null): void {
  if (typeof window === "undefined") return;
  
  try {
    if (id) {
      localStorage.setItem(CURRENT_CONVERSATION_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
  } catch (error) {
    console.error("Failed to set current conversation ID:", error);
  }
}

/**
 * Generate a unique conversation ID.
 */
export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a unique message ID.
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
