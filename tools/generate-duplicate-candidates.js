#!/usr/bin/env node
/**
 * 生成去重候选与去重审计：按标题/摘要相似度配对，输出候选索引与冲突总览。
 * 用法：node generate-duplicate-candidates.js [--threshold 0.55] [--root <工程根>]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const args = process.argv.slice(2);
const root = lib.resolveRoot(args);
const threshold = parseFloat((args.find(a => a.startsWith('--threshold')) || '').split('=')[1] || '0.55');

const units = lib.loadUnits(root);
const tokens = new Map();
for (const u of units) {
  tokens.set(u.data.id, lib.tokenize(u.data.title + ' ' + (u.data.summary || '') + ' ' + u.body.slice(0, 800)));
}

const pairs = [];
for (let i = 0; i < units.length; i++) {
  for (let j = i + 1; j < units.length; j++) {
    const a = units[i], b = units[j];
    const sim = lib.similarity(tokens.get(a.data.id), tokens.get(b.data.id));
    if (sim >= threshold) {
      pairs.push({
        a: a.data.id, b: b.data.id,
        titleA: a.data.title, titleB: b.data.title,
        sim: Number(sim.toFixed(3)),
        suggested: sim >= 0.8 ? '同义重复（倾向合并）' : sim >= 0.7 ? '近似重复（倾向人工判断）' : '重复讲述（倾向保留两条）',
      });
    }
  }
}
pairs.sort((x, y) => y.sim - x.sim);

fs.writeFileSync(path.join(root, '00-规则与索引', '去重候选.json'), JSON.stringify(pairs, null, 2), 'utf8');

let md = `# 去重候选与冲突总览\n\n生成时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}｜阈值 ${threshold}｜候选 ${pairs.length}\n\n`;
md += '| A | B | 相似度 | 建议 |\n|---|---|---|---|\n';
for (const p of pairs) md += `| ${p.a} ${p.titleA} | ${p.b} ${p.titleB} | ${p.sim} | ${p.suggested} |\n`;
md += '\n判定口径：完全重复=原文一致→合并；同义重复=同一论点换表述→合并；近似重复=相近但角度不同→人工判断；重复讲述=同一话题不同场景→保留两条。\n';
fs.writeFileSync(path.join(root, '00-规则与索引', '去重候选总览.md'), md, 'utf8');

console.log(`✅ 去重候选已生成：${pairs.length} 对（阈值 ${threshold}）。`);
if (pairs.length > units.length) console.log('⚠️ 候选数量异常偏多，去重口径可能需要收紧（提高阈值或补充 keywords 区分）。');
