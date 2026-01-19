/**
 * API Client service for chat generation.
 */

import type {
  ChatGenerateRequest,
  ChatGenerateResponse,
} from "@/types/conversation";

const API_BASE_URL = "";

class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Generate or modify visualization via chat API.
 */
export async function chatGenerate(
  request: ChatGenerateRequest,
  signal?: AbortSignal
): Promise<ChatGenerateResponse> {
  const url = `/api/chat/generate`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
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
