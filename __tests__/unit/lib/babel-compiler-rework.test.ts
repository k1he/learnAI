import { describe, it, expect } from 'vitest';
import { BabelCompiler } from '@/lib/babel-compiler';

describe('BabelCompiler rework checks', () => {
  it('should detect undefined variables with line/col', () => {
    const code = `export default function App() {
  return <div>{intent}</div>;
}`;
    const result = new BabelCompiler().compile(code);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Line\s+\d+,\s+Col\s+\d+:\s+'intent' is not defined/);
    expect(result.undefinedVariables?.length).toBeGreaterThan(0);
  });

  it('should allow known globals', () => {
    const code = `export default function App() {
  return <div>{window.location.href}</div>;
}`;
    const result = new BabelCompiler().compile(code);
    expect(result.success).toBe(true);
  });

  it('should format parse errors with line/col', () => {
    const code = `export default function App() {
  return <div>
}`;
    const result = new BabelCompiler().compile(code);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Line\s+\d+,\s+Col\s+\d+:/);
  });
});
