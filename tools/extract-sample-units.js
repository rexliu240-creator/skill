#!/usr/bin/env node
/**
 * 从样本文稿按启发式规则抽取第一批内容单元草稿。
 * 这是"结构验证"工具：产出候选段落草稿，必须由 Agent/人工确认字段、关系与去重后才算完成。
 * 用法：
 *   node extract-sample-units.js                      # 自动从待处理清单选样本
 *   node extract-sample-units.js --files "a.md,b.md"  # 指定样本
 *   node extract-sample-units.js --max 8              # 每篇最多抽取单元数（默认 6）
 * 选项 --apply 实际写入；缺省为预览（只打印候选，不写文件）。
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
const maxPerDoc = parseInt(arg('max') || '6', 10);

// 选样本
let samples;
const filesArg = arg('files');
if (filesArg) {
  samples = filesArg.split(',').map(s => s.trim()).filter(Boolean);
} else {
  const pendingFile = path.join(root, lib.STATUS_DIR, '待处理清单.md');
  if (!fs.existsSync(pendingFile)) {
    console.error('缺少待处理清单，请先运行 rebuild-processing-ledger.js。');
    process.exit(1);
  }
  const rows = fs.readFileSync(pendingFile, 'utf8').split('\n').filter(l => l.startsWith('| ')).slice(2);
  samples = rows.map(l => l.split('|')[2] && l.split('|')[2].trim()).filter(Boolean);
}
if (!samples.length) {
  console.log('待处理清单为空，没有可抽取的样本。');
  process.exit(0);
}
const chosen = samples.slice(0, 5);

// 启发式：按段落信号打分并归入单元类型
const SIGNALS = [
  { type: 'QST', re: /(如何|为什么|什么.*?值得|怎样|怎么办|？|\?)/, w: 3 },
  { type: 'OPI', re: /(我认为|我觉得|关键是|本质上|其实|真正的|最大的误区|核心在于)/, w: 4 },
  { type: 'CON', re: /(是指|所谓|定义|指的是|XX就是|本质是)/, w: 3 },
  { type: 'CAS', re: /(比如|例如|案例|举个例子|曾经|去年|去年我|数据(显示|表明))/, w: 3 },
  { type: 'SOL', re: /(第一步|第二步|方法|步骤|首先|其次|最后|建议|怎么做)/, w: 3 },
];

function extractCandidates(text, relPath) {
  const paras = text.split(/\n\s*\n/).map(p => p.trim().replace(/^#+\s*/, ''))
    .filter(p => p.length >= 60 && p.length <= 1200);
  const scored = [];
  for (const p of paras) {
    const types = [];
    for (const s of SIGNALS) if (s.re.test(p)) types.push({ type: s.type, w: s.w });
    if (!types.length) continue;
    types.sort((a, b) => b.w - a.w);
    scored.push({ type: types[0].type, para: p, relPath, score: types[0].w + Math.min(p.length / 300, 2) });
  }
  // 每类只留分数最高的一条
  const best = {};
  for (const c of scored.sort((a, b) => b.score - a.score)) {
    if (!best[c.type] && Object.keys(best).length < maxPerDoc) best[c.type] = c;
  }
  return Object.values(best);
}

function firstTitle(p) {
  const t = p.split(/[。！？.!?\n]/)[0].trim();
  return t.length > 22 ? t.slice(0, 22) : t;
}

const created = [];
for (const rel of chosen) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) { console.log('⚠️ 跳过不存在的样本：' + rel); continue; }
  const text = fs.readFileSync(abs, 'utf8');
  const cands = extractCandidates(text, rel);
  console.log(`\n📄 样本：${rel} → 候选 ${cands.length} 个`);
  for (const c of cands) {
    console.log(`   [${c.type}] ${firstTitle(c.para)}`);
    if (!apply) continue;
    const title = firstTitle(c.para);
    const dir = path.join(root, '02-内容单元库');
    fs.mkdirSync(dir, { recursive: true });
    let seq = 0;
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(new RegExp('^' + c.type + '(\\d{3})_'));
      if (m) seq = Math.max(seq, parseInt(m[1], 10));
    }
    const id = c.type + String(seq + 1).padStart(3, '0');
    const safe = title.replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
    const unit = { id, type: c.type, title, source_documents: [rel], created: new Date().toISOString().slice(0, 10) };
    const out = lib.unitFrontmatter(unit) + '\n\n# ' + title + '\n\n> 类型：' + c.type + '｜ID：' + id + '｜状态：草稿（待确认字段与关系）\n\n## 摘要\n\n（待补充）\n\n## 原文片段\n\n' + c.para + '\n\n## 引用\n\n- 来源：' + rel + '\n';
    fs.writeFileSync(path.join(dir, `${id}_${safe}.md`), out, 'utf8');
    created.push(id);
  }
}

if (apply) {
  console.log(`\n✅ 已写入 ${created.length} 个单元草稿。请逐一确认：字段是否补齐、是否与其他单元重复、需要哪些关系。`);
  console.log('随后运行 rebuild-processing-ledger.js 刷新台账。');
} else {
  console.log('\n（预览模式，未写文件。确认候选合理后加 --apply 重新运行。）');
}
