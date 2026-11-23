#!/usr/bin/env node
/**
 * 生成关系索引与关系总览；校验关系目标是否存在。
 * 用法：node generate-link-map.js [--root <工程根>]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const root = lib.resolveRoot(process.argv);
const units = lib.loadUnits(root);
const ids = new Set(units.map(u => u.data.id).filter(Boolean));

const edges = [], missing = [];
for (const u of units) {
  for (const r of u.data.relationships || []) {
    if (!r || !r.target) continue;
    const ok = ids.has(r.target);
    edges.push({ from: u.data.id, type: r.type, to: r.target, ok });
    if (!ok) missing.push({ from: u.data.id, type: r.type, to: r.target });
  }
}

fs.writeFileSync(path.join(root, '00-规则与索引', '关系索引.json'), JSON.stringify(edges, null, 2), 'utf8');

const byType = {};
for (const e of edges) (byType[e.type] = byType[e.type] || []).push(e);
let md = `# 关系总览\n\n生成时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}｜单元 ${units.length}｜关系 ${edges.length}\n`;
for (const [t, list] of Object.entries(byType)) {
  md += `\n## ${t}（${list.length}）\n\n| 来源 | → | 目标 | 校验 |\n|---|---|---|---|\n`;
  for (const e of list) md += `| ${e.from} | → | ${e.to} | ${e.ok ? '✅' : '❌ 缺失'} |\n`;
}
if (missing.length) {
  md += `\n## ⚠️ 目标缺失（${missing.length}）\n\n`;
  for (const m of missing) md += `- ${m.from} --${m.type}--> ${m.to}\n`;
}
fs.writeFileSync(path.join(root, '00-规则与索引', '关系总览.md'), md + '\n', 'utf8');

console.log(`✅ 关系索引与总览已生成：关系 ${edges.length}，目标缺失 ${missing.length}。`);
if (missing.length) console.log('❌ 存在目标缺失，升档前必须清零（修正 target 或补建被引用单元）。');
