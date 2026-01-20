import { describe, it, expect } from 'vitest';
import { buildFixPrompt } from '@/lib/llm';

describe('LLM fix prompt', () => {
  it('should include original code and errors', () => {
    const originalCode = 'export default function App() { return <div>{intent}</div>; }';
    const errors = "Line 1, Col 47: 'intent' is not defined";
    const prompt = buildFixPrompt(originalCode, errors);
    expect(prompt).toContain(originalCode);
    expect(prompt).toContain(errors);
  });
});
