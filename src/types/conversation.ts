/**
 * TypeScript interfaces for Conversation, Message, and Visualization.
 * Used for client-side state management and API communication.
 */

/**
 * A single message in the conversation.
 */
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  /** For 'assistant' messages, this may contain the generated code */
  codeSnippet?: string;
  /** For 'user' messages, this might be the code state before the request */
  contextCodeVersion?: number;
}

/**
 * The renderable visualization state.
 */
export interface Visualization {
  code: string;
  explanation?: string;
  version: number;
  status: "loading" | "success" | "error";
  error?: string;
}

/**
 * Represents a single session of interaction.
 * Persisted in LocalStorage.
 */
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  currentVisual: Visualization | null;
}

/**
 * API request message format.
 */
export interface ChatMessageRequest {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * API request body for chat generation.
 */
export interface ChatGenerateRequest {
  messages: ChatMessageRequest[];
  model?: string;
  current_code?: string | null;
}

/**
 * API response message format.
 */
export interface ChatResponseMessage {
  role: "assistant";
  content: string;
  code?: string | null;
}

/**
 * Token usage information from API.
 */
export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * API response body for chat generation.
 */
export interface ChatGenerateResponse {
  message: ChatResponseMessage;
  usage: UsageInfo;
}
