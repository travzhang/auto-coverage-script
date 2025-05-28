import fs from 'fs';
const configPath = './vitest.config.ts';

let content = fs.readFileSync(configPath, 'utf-8');

// 使用正则精确替换 reporter 部分为 ['json']
const updated = content.replace(
    /reporter:\s*\[[^\]]*\]/,
    "reporter: ['json']"
);

fs.writeFileSync(configPath, updated);
console.log('✅ 已将 vitest.config.ts 中 reporter 替换为 ["json"]');
