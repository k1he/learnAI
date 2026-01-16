import { describe, it, expect } from 'vitest'
import { compileCode } from '@/components/renderer/CompilerService'

describe('CompilerService', () => {
  describe('compileCode', () => {
    it('should compile valid JSX code', () => {
      const code = `
        function App() {
          return <div>Hello World</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('React.createElement')
      expect(result.error).toBeUndefined()
    })

    it('should compile export default function', () => {
      const code = `
        export default function MyComponent() {
          return <div>Test</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('MyComponent')
    })

    it('should compile TSX with type annotations', () => {
      const code = `
        interface Props {
          name: string
        }
        function App({ name }: Props) {
          return <div>Hello {name}</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).not.toContain('interface')
      expect(result.code).not.toContain(': Props')
    })

    it('should remove import statements', () => {
      const code = `import React from 'react'
import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}`
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).not.toContain('import')
    })

    it('should return error for invalid JSX', () => {
      const code = `
        function App() {
          return <div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.code).toBeUndefined()
    })

    it('should handle arrow function components', () => {
      const code = `
        const App = () => {
          return <div>Arrow Component</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('App')
    })

    it('should handle useState hook', () => {
      const code = `
        function Counter() {
          const [count, setCount] = useState(0)
          return (
            <button onClick={() => setCount(count + 1)}>
              Count: {count}
            </button>
          )
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('useState')
    })

    it('should wrap code in executable IIFE', () => {
      const code = `
        function App() {
          return <div>Test</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.code).toContain('(function()')
      expect(result.code).toContain('window.React')
      expect(result.code).toContain('ReactDOM.createRoot')
    })
  })
})
