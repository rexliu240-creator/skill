#!/usr/bin/env node
/**
 * 生成内容单元草稿文件。
 * 用法：
 *   node generate-unit-draft.js --type OPI --title "标题" --source "01-.../x.md"
 *     [--themes a,b] [--keywords a,b] [--summary "摘要"] --body-file 正文.txt (可选)
 *     [--rel "解释:CON001,回应:QST001"]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

const root = lib.resolveRoot(args);
const type = (arg('type') || '').toUpperCase();
const title = arg('title');
if (!['QST', 'CON', 'OPI', 'CAS', 'SOL'].includes(type) || !title) {
  console.error('用法：node generate-unit-draft.js --type QST|CON|OPI|CAS|SOL --title "标题" [--source 路径] [--themes a,b] [--keywords a,b] [--summary 摘要] [--rel "类型:ID,..."] [--body-file 文件]');
  process.exit(1);
}

// 自动编号：TYPE + 三位序号
const dir = path.join(root, '02-内容单元库');
fs.mkdirSync(dir, { recursive: true });
let seq = 0;
for (const f of fs.readdirSync(dir)) {
  const m = f.match(new RegExp('^' + type + '(\\d{3})_'));
  if (m) seq = Math.max(seq, parseInt(m[1], 10));
}
const id = type + String(seq + 1).padStart(3, '0');

const safeTitle = title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
const file = path.join(dir, `${id}_${safeTitle}.md`);

const unit = {
  id, type, title,
  source_documents: (arg('source') ? arg('source').split(',') : []),
  themes: (arg('themes') || '').split(',').map(s => s.trim()).filter(Boolean),
  keywords: (arg('keywords') || '').split(',').map(s => s.trim()).filter(Boolean),
  relationships: (arg('rel') || '').split(',').map(s => s.trim()).filter(Boolean)
    .map(s => { const [t, target] = s.split(':'); return t && target ? { type: t, target } : null; })
    .filter(Boolean),
  created: new Date().toISOString().slice(0, 10),
};

const summary = arg('summary') || '（待补充摘要：用两三句话概括这个单元的核心内容）';
let bodyContent = '';
const bodyFile = arg('body-file');
if (bodyFile && fs.existsSync(bodyFile)) bodyContent = fs.readFileSync(bodyFile, 'utf8').trim();

const text = lib.unitFrontmatter(unit) + '\n\n# ' + title + '\n\n> 类型：' + type + '｜ID：' + id + '\n\n## 摘要\n\n' + summary + '\n\n## 正文\n\n' + (bodyContent || '（待补充正文）') + '\n\n## 引用\n\n' + (unit.source_documents.length ? unit.source_documents.map(d => '- 来源：' + d).join('\n') : '- （待补充来源）') + '\n';

fs.writeFileSync(file, text, 'utf8');
console.log('✅ 已创建单元草稿：' + path.basename(file) + '（ID: ' + id + '）');
console.log('提醒：补齐 themes / keywords / relationships，并在正文中用 [[文件名]] 引用相关单元。');
