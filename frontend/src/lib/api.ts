const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('API Health Check Error:', error);
    throw error;
  }
}

export async function generateCode(prompt: string, model: string = 'deepseek-chat') {
  const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model }),
  });
  
  if (!response.ok) {
    throw new Error('Generation failed');
  }
  
  return await response.json();
}
