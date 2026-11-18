import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_PATTERNS_ALL = [
  'firebase/auth',
  'GoogleAuthProvider',
  'signInWith',
  'signInAnonymously',
  '@google/generative-ai',
  '@google/genai',
  'openai',
  '@anthropic-ai/sdk',
  'VITE_GROQ',
];

const FORBIDDEN_IN_SRC_ONLY = ['GROQ_API_KEY'];

const scanDirs = ['src', 'api'];
const violations = [];

function scanFile(filePath, isSrc) {
  const content = fs.readFileSync(filePath, 'utf-8');

  for (const pattern of FORBIDDEN_PATTERNS_ALL) {
    if (content.includes(pattern)) {
      violations.push({
        filePath,
        pattern,
        reason: 'Forbidden dependency or auth pattern detected',
      });
    }
  }

  if (isSrc) {
    for (const pattern of FORBIDDEN_IN_SRC_ONLY) {
      if (content.includes(pattern)) {
        violations.push({
          filePath,
          pattern,
          reason: 'Server secret referenced directly in client code (src/)',
        });
      }
    }
  }
}

function walk(dir, isSrc) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, isSrc);
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
      scanFile(fullPath, isSrc);
    }
  }
}

console.log('Running BreatheFresh constraints check...');
for (const dir of scanDirs) {
  walk(dir, dir === 'src');
}

if (violations.length > 0) {
  console.error('\n❌ CONSTRAINT VIOLATIONS DETECTED:');
  for (const v of violations) {
    console.error(`- ${v.filePath}: Found "${v.pattern}" (${v.reason})`);
  }
  process.exit(1);
} else {
  console.log('✅ Constraints check passed! No forbidden auth, providers, or exposed keys found.');
  process.exit(0);
}
