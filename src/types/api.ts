/**
 * TypeScript interfaces for API communication
 */

export interface GenerationRequest {
  prompt: string;
  model?: string;
}

export interface GeneratedContent {
  explanation: string;
  code: string;
}

export interface GenerationResponse {
  status: 'success' | 'error';
  data?: GeneratedContent;
  error?: string;
}

export interface ErrorResponse {
  detail: string;
}
