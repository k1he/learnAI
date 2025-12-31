/**
 * API Client service for chat generation.
 */

import type {
  ChatGenerateRequest,
  ChatGenerateResponse,
} from "@/types/conversation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Generate or modify visualization via chat API.
 */
export async function chatGenerate(
  request: ChatGenerateRequest
): Promise<ChatGenerateResponse> {
  const url = `${API_BASE_URL}/api/v1/chat/generate`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 422) {
        throw new ApiError(
          "代码验证失败：生成的代码包含不允许的库",
          response.status,
          errorData
        );
      }
      
      if (response.status === 400) {
        throw new ApiError(
          "请求无效，请检查输入",
          response.status,
          errorData
        );
      }

      throw new ApiError(
        errorData.detail || `请求失败 (${response.status})`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError("网络连接失败，请检查后端服务是否运行");
    }

    throw new ApiError(
      error instanceof Error ? error.message : "未知错误"
    );
  }
}
