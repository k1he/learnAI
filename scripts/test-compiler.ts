/**
 * 编译器测试脚本
 * 运行: npx ts-node --esm scripts/test-compiler.ts
 */

import { compileCode } from '../src/components/renderer/CompilerService.js';

const testCases = [
  {
    name: '简单组件（无 import）',
    code: `export default function App() {
  const [count, setCount] = React.useState(0);
  return (
    <div style={{ padding: 20 }}>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}`,
  },
  {
    name: '带 import 的组件',
    code: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}`,
  },
  {
    name: 'SVG 可视化组件',
    code: `export default function SineWave() {
  const [frequency, setFrequency] = React.useState(1);
  const points = React.useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * 400;
      const y = 100 + Math.sin((i / 100) * Math.PI * 4 * frequency) * 80;
      pts.push(\`\${i === 0 ? 'M' : 'L'} \${x} \${y}\`);
    }
    return pts.join(' ');
  }, [frequency]);

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui' }}>
      <h2>Sine Wave</h2>
      <label>
        Frequency: {frequency.toFixed(1)}
        <input type="range" min="0.5" max="3" step="0.1" value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} />
      </label>
      <svg width="100%" height="200" viewBox="0 0 400 200" style={{ background: '#f5f5f5', borderRadius: 8, marginTop: 16 }}>
        <path d={points} fill="none" stroke="#8884d8" strokeWidth="2" />
      </svg>
    </div>
  );
}`,
  },
  {
    name: '命名组件（非 App）',
    code: `export default function OceanVisualization() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Ocean</h1>
      <svg width="200" height="100">
        <rect x="0" y="0" width="200" height="100" fill="#0077be" />
      </svg>
    </div>
  );
}`,
  },
  {
    name: '不支持的库：recharts（应该失败）',
    code: `import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Chart() {
  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}`,
    shouldFail: true,
  },
  {
    name: '不支持的库：recharts（无 import，应该失败）',
    code: `export default function Chart() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={[]}>
        <Line dataKey="value" />
      </LineChart>
    </ResponsiveContainer>
  );
}`,
    shouldFail: true,
  },
];

console.log('=== 编译器测试 ===\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`测试: ${testCase.name}`);
  console.log('-'.repeat(50));

  const result = compileCode(testCase.code);

  if (testCase.shouldFail) {
    // 期望失败的测试用例
    if (!result.success) {
      console.log('✓ 正确拒绝了不支持的代码');
      console.log(`  错误信息: ${result.error}`);
      if (result.unsupportedLibraries) {
        console.log(`  检测到的库: ${result.unsupportedLibraries.join(', ')}`);
      }
      passed++;
    } else {
      console.log('✗ 错误：应该失败但成功了');
      failed++;
    }
  } else {
    // 期望成功的测试用例
    if (result.success) {
      console.log('✓ 编译成功');

      // 检查生成的代码是否包含关键部分
      const checks = [
        { name: 'IIFE 包装', check: result.code?.includes('(function()') },
        { name: 'React 引用', check: result.code?.includes('const React = window.React') },
        { name: 'ReactDOM 引用', check: result.code?.includes('const ReactDOM = window.ReactDOM') },
        { name: '组件渲染', check: result.code?.includes('ReactDOM.createRoot') },
        { name: '无 import 语句', check: !result.code?.includes('import ') },
      ];

      for (const c of checks) {
        if (c.check) {
          console.log(`  ✓ ${c.name}`);
        } else {
          console.log(`  ✗ ${c.name}`);
          failed++;
        }
      }

      passed++;
    } else {
      console.log(`✗ 编译失败: ${result.error}`);
      failed++;
    }
  }

  console.log('\n');
}

console.log('='.repeat(50));
console.log(`结果: ${passed} 通过, ${failed} 失败`);

if (failed > 0) {
  process.exit(1);
}
