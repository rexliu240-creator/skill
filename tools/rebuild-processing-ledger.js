#!/usr/bin/env node
/**
 * 重建原始素材索引与处理台账：标记每个素材是否已被内容单元引用。
 * 用法：node rebuild-processing-ledger.js [--root <工程根>]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const root = lib.resolveRoot(process.argv);
const units = lib.loadUnits(root);

// 收集所有单元引用过的 source_documents
const usedDocs = new Set();
for (const u of units) {
  for (const d of u.data.source_documents || []) if (d) usedDocs.add(d.replace(/\\/g, '/'));
}

const all = lib.listFiles(root, '01-原始素材区', ['.md', '.txt', '.markdown']);
const pending = [], done = [];
for (const rel of all) {
  // 完整副本本身不重复登记：跳过 01-原始素材区 之外的路径（listFiles 已限定）
  (usedDocs.has(rel) ? done : pending).push(rel);
}

function table(title, items) {
  const md = [`# ${title}\n`, `生成时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}  条目：${items.length}\n`,
    '| # | 路径 |', '|---|---|'];
  items.forEach((p, i) => md.push(`| ${i + 1} | ${p} |`));
  return md.join('\n') + '\n';
}

fs.writeFileSync(path.join(root, lib.STATUS_DIR, '原始素材索引.md'), table('原始素材索引', all), 'utf8');
fs.writeFileSync(path.join(root, lib.STATUS_DIR, '待处理清单.md'), table('待处理清单', pending), 'utf8');
fs.writeFileSync(path.join(root, lib.STATUS_DIR, '已处理清单.md'), table('已处理清单', done), 'utf8');

console.log(`✅ 台账已重建：素材 ${all.length}，已处理 ${done.length}，待处理 ${pending.length}。`);
if (usedDocs.size) console.log(`（被引用的来源文档 ${usedDocs.size} 个）`);
