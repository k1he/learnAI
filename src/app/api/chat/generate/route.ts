import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import {
  classifyQuery,
  generateFixedCode,
  getRandomFriendlyError,
  getSystemPrompt,
  sanitizeCode,
  validateCode,
} from '@/lib/llm';
import { BabelCompiler } from '@/lib/babel-compiler';

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

interface ReworkAttemptLog {
  attemptNumber: number;
  timestamp: string;
  code: string;
  error?: string;
  status: 'success' | 'failed';
}

async function logReworkSession(params: {
  sessionId: string;
  userQuery: string;
  attempts: ReworkAttemptLog[];
  finalResult: 'success' | 'failed';
}) {
  try {
    const logDir = path.join(process.cwd(), 'logs', 'rework');
    await fs.mkdir(logDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(logDir, `${timestamp}-${params.sessionId}.json`);

    await fs.writeFile(logFile, JSON.stringify(params, null, 2));
  } catch (error) {
    console.error('[Rework Log] Failed to write rework log:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, current_code } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const style = await classifyQuery(client, lastUserMessage);
    const systemPrompt = getSystemPrompt(style);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
    ];

    if (current_code) {
      apiMessages.push({
        role: 'system',
        content: `
You are in **EDIT MODE**.
The user wants to modify an existing visualization.
Below is the current code they are looking at:

\`\`\`jsx
${current_code}
\`\`\`

**INSTRUCTIONS**:
1.  **Keep it consistent**: Maintain the existing visual style, state structure, and component breakdown unless explicitly asked to change them.
2.  **Incremental changes**: Only modify the parts relevant to the user's request (e.g., adding animation, changing color, fixing a bug).
3.  **Return FULL code**: Even if you only change one line, you MUST return the COMPLETE, runnable code in your response (no diffs, no partial snippets).
`.trim(),
      });
    }

    messages.forEach((msg: any) => {
      apiMessages.push({ role: msg.role, content: msg.content });
    });

    const MAX_RETRIES = 2;
    let attempt = 0;
    let lastError = '';
    let code = '';
    let explanation = '';
    let usage: any = undefined;
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reworkAttempts: ReworkAttemptLog[] = [];

    const recordAttempt = (status: 'success' | 'failed', error?: string) => {
      reworkAttempts.push({
        attemptNumber: attempt + 1,
        timestamp: new Date().toISOString(),
        code,
        error,
        status,
      });
    };

    while (attempt <= MAX_RETRIES) {
      if (attempt === 0) {
        const response = await client.chat.completions.create({
          model: process.env.DEFAULT_MODEL || 'gpt-4o',
          messages: apiMessages as any,
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 8192,
        });

        const content = response.choices[0].message.content;

        // Debug Logging
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const logDir = path.join(process.cwd(), 'logs', 'llm');
          const logFile = path.join(logDir, `${timestamp}.json`);

          const logData = {
            timestamp: new Date().toISOString(),
            model: process.env.DEFAULT_MODEL,
            request_style: style,
            system_prompt: systemPrompt,
            messages: apiMessages,
            response: content,
            usage: response.usage,
          };

          await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
        } catch (logError) {
          console.error('Failed to write log file:', logError);
        }

        if (!content) {
          throw new Error('Empty response from LLM');
        }

        const parsed = JSON.parse(content);
        console.log('--- GENERATED THOUGHT ---');
        console.log(parsed.thought);
        console.log('--- GENERATED CODE ---');
        console.log(parsed.code);
        console.log('----------------------');
        code = sanitizeCode(parsed.code || '');
        explanation = typeof parsed.explanation === 'string' ? parsed.explanation : '';
        usage = response.usage;
      } else {
        code = await generateFixedCode(client, code, lastError);
      }

      const validation = validateCode(code);
      if (!validation.isValid) {
        lastError = validation.error || 'Code validation failed';
        recordAttempt('failed', lastError);
        if (attempt < MAX_RETRIES) {
          attempt += 1;
          continue;
        }
        break;
      }

      const compileResult = new BabelCompiler().compile(code);
      if (compileResult.success) {
        recordAttempt('success');
        void logReworkSession({
          sessionId,
          userQuery: lastUserMessage,
          attempts: reworkAttempts,
          finalResult: 'success',
        });
        return NextResponse.json({
          message: {
            role: 'assistant',
            content: explanation,
            code,
          },
          usage,
          style,
        });
      }

      lastError = compileResult.error || 'Compilation failed';
      recordAttempt('failed', lastError);
      if (attempt < MAX_RETRIES) {
        attempt += 1;
        continue;
      }
      break;
    }

    const friendlyError = getRandomFriendlyError();
    void logReworkSession({
      sessionId,
      userQuery: lastUserMessage,
      attempts: reworkAttempts,
      finalResult: 'failed',
    });
    return NextResponse.json(
      { error: friendlyError, technicalError: lastError },
      { status: 422 }
    );
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
