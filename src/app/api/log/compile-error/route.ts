import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, error, processedCode } = body;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logDir = path.join(process.cwd(), 'logs', 'compile-errors');
    
    // 确保目录存在
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, `${timestamp}.json`);

    const logData = {
      timestamp: new Date().toISOString(),
      error,
      originalCode: code,
      processedCode,
    };

    await fs.writeFile(logFile, JSON.stringify(logData, null, 2));
    
    console.error('=== COMPILE ERROR ===');
    console.error('Error:', error);
    console.error('Code preview (first 500 chars):', code?.substring(0, 500));
    console.error('=====================');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to log compile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
