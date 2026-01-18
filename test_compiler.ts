import { transform } from "sucrase";

const code = `
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function App() {
  return <motion.div>Hello</motion.div>;
}
`;

function preprocessCode(code: string): string {
  let result = code;

  result = result.replace(
    /import\s+\{([\s\S]*?)\}\s+from\s+['"]recharts['"];?/g,
    (match, p1) => `const { ${p1.replace(/\n/g, ' ')} } = window.Recharts;`
  );
  result = result.replace(
    /import\s+\{([\s\S]*?)\}\s+from\s+['"]framer-motion['"];?/g,
    (match, p1) => `const { ${p1.replace(/\n/g, ' ')} } = window.FramerMotion;`
  );

  result = result.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '');
  result = result.replace(/^import\s+['"][^'"]+['"];?/gm, '');
  result = result.replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?/gm, '');

  result = result.replace(/^(const|let|var)\s+.*?=\s*require\s*\(['"][^'"]+['"]\);?/gm, '');

  return result;
}

const processed = preprocessCode(code);
console.log('--- PROCESSED ---');
console.log(processed);

try {
  const result = transform(processed, {
    transforms: ["jsx", "typescript"],
    jsxRuntime: "classic",
    production: true,
  });
  console.log('--- COMPILED ---');
  console.log(result.code);
} catch (e) {
  console.error(e);
}
