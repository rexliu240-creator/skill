#!/usr/bin/env node
/**
 * 从现有内容单元装配新的选题稿。
 * 用法：
 *   node assemble-topic-from-units.js --title "选题标题" \
 *     --question QST001 [--concept CON001] --opinion OPI001 [--case CAS001] [--solution SOL001]
 * 选项 --apply 实际写入；缺省为预览。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const args = process.argv.slice(2);
const root = lib.resolveRoot(args);
const apply = args.includes('--apply');
function arg(name) {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}
const title = arg('title');
if (!title) { console.error('必须提供 --title'); process.exit(1); }

const units = lib.loadUnits(root);
const byId = {};
for (const u of units) byId[u.data.id] = u;

const slots = [
  ['question', '问题', true], ['concept', '概念', false], ['opinion', '观点', true],
  ['case', '案例', false], ['solution', '方案', false],
];
const picked = [];
for (const [slot, label, required] of slots) {
  const id = arg(slot);
  if (!id) { if (required) console.log(`⚠️ 缺少${label}单元（--${slot}）`); continue; }
  const u = byId[id];
  if (!u) { console.error(`❌ 找不到单元 ${id}`); process.exit(1); }
  picked.push({ slot, label, u });
}
if (!picked.length) { console.error('至少需要一个单元。'); process.exit(1); }

let md = `# 选题装配：${title}\n\n> 生成时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}｜由内容单元自动装配，发布前需人工定稿\n\n`;
for (const p of picked) {
  md += `## ${p.label}：${p.u.data.title}\n\n[[${p.u.file.replace(/\.md$/, '')}]]\n\n`;
  md += (p.u.body || '').trim().slice(0, 1200) + '\n\n';
}
md += '---\n\n## 补充说明\n\n- 来源单元：' + picked.map(p => p.u.data.id).join('、') + '\n- 装配稿只解决"骨架"，成稿语气与衔接需人工完成。\n';

if (apply) {
  const dir = path.join(root, '06-选题装配');
  fs.mkdirSync(dir, { recursive: true });
  const safe = title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${safe}.md`);
  fs.writeFileSync(file, md, 'utf8');
  console.log('✅ 选题装配稿已生成：' + path.basename(file));
} else {
  console.log('—— 预览 ——\n\n' + md);
  console.log('（预览模式，未写文件。确认后加 --apply 重新运行。）');
}
