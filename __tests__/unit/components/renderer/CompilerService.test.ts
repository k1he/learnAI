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

  describe('Library Detection', () => {
    it('should detect unsupported library imports', () => {
      const code = `
        import { ResponsiveContainer, LineChart } from 'recharts'

        function Chart() {
          return (
            <ResponsiveContainer>
              <LineChart data={[]} />
            </ResponsiveContainer>
          )
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.error).toContain('不支持的第三方库')
      expect(result.error).toContain('recharts')
      expect(result.unsupportedLibraries).toContain('recharts')
    })

    it('should detect recharts components without imports', () => {
      const code = `
        function Chart() {
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={[]}>
              </LineChart>
            </ResponsiveContainer>
          )
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.error).toContain('recharts')
      expect(result.unsupportedLibraries).toContain('recharts')
    })

    it('should detect multiple unsupported libraries', () => {
      const code = `
        import axios from 'axios'
        import _ from 'lodash'

        function App() {
          const data = _.map([1,2,3], n => n * 2)
          return <div>{data}</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.unsupportedLibraries).toContain('axios')
      expect(result.unsupportedLibraries).toContain('lodash')
    })

    it('should allow React imports', () => {
      const code = `
        import React, { useState } from 'react'
        import ReactDOM from 'react-dom'

        function App() {
          const [count, setCount] = useState(0)
          return <div>{count}</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
      expect(result.unsupportedLibraries).toBeUndefined()
    })

    it('should ignore relative imports', () => {
      const code = `
        import Component from './Component'
        import utils from '../utils'

        function App() {
          return <div>Test</div>
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(true)
    })

    it('should detect scoped packages', () => {
      const code = `
        import { Chart } from '@myorg/charts'

        function App() {
          return <Chart />
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.unsupportedLibraries).toContain('@myorg/charts')
    })

    it('should provide helpful error message with suggestions', () => {
      const code = `
        import { BarChart } from 'recharts'

        function Chart() {
          return <BarChart />
        }
      `
      const result = compileCode(code)
      expect(result.success).toBe(false)
      expect(result.error).toContain('建议')
      expect(result.error).toContain('SVG')
      expect(result.error).toContain('Canvas')
    })
  })
})
