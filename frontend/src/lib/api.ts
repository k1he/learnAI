import { GenerationRequest, GenerationResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new ApiError('服务器响应异常', response.status);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error('API Health Check Error:', error);
    throw new ApiError('无法连接到服务器，请检查网络', undefined, true);
  }
}

export async function generateVisualization(
  request: GenerationRequest
): Promise<GenerationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: '未知错误' }));
      
      if (response.status === 400) {
        throw new ApiError(errorData.detail || '输入无效，请检查后重试', 400);
      }
      if (response.status === 500) {
        throw new ApiError(errorData.detail || '服务器错误，请稍后重试', 500);
      }
      throw new ApiError(errorData.detail || '请求失败', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    // Network errors (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('网络连接失败，请检查网络后重试', undefined, true);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : '发生未知错误',
      undefined,
      false
    );
  }
}
