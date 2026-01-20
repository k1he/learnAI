import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { timestamp, type, message, stack, source, line, column } = body;

    // 创建日志目录
    const logDir = path.join(process.cwd(), 'logs', 'runtime-errors');
    await fs.mkdir(logDir, { recursive: true });

    // 写入日志文件
    const logFile = path.join(logDir, `${timestamp.replace(/[:.]/g, '-')}.json`);
    const logData = {
      timestamp,
      type,
      message,
      stack,
      source,
      line,
      column,
    };

    await fs.writeFile(logFile, JSON.stringify(logData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log runtime error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
