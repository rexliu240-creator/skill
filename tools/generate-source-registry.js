#!/usr/bin/env node
/**
 * 批量生成来源注册候选：扫描 01-原始素材区/完整副本，按来源规则分类编号。
 * 用法：node generate-source-registry.js [--root <工程根>]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const root = lib.resolveRoot(process.argv);
const rules = lib.loadRules(root);
const files = lib.listFiles(root, '01-原始素材区', ['.md', '.txt', '.markdown']);

const registry = [];
const counters = {};
for (const rel of files) {
  const rule = lib.classifyFile(root, rel, rules) || { sourceType: '未知来源', code: 'Z', category: '未分类' };
  counters[rule.code || 'Z'] = (counters[rule.code || 'Z'] || 0) + 1;
  registry.push({
    id: (rule.code || 'Z') + String(counters[rule.code || 'Z']).padStart(3, '0'),
    path: rel,
    sourceType: rule.sourceType,
    category: rule.category,
    sizeBytes: fs.statSync(path.join(root, rel)).size,
  });
}

fs.writeFileSync(path.join(root, lib.STATUS_DIR, '来源注册表.json'), JSON.stringify(registry, null, 2), 'utf8');

const md = ['# 来源注册表\n',
  `生成时间：${new Date().toISOString().slice(0, 19).replace('T', ' ')}  条目数：${registry.length}\n`,
  '| 编号 | 来源类型 | 分类 | 路径 | 大小 |', '|---|---|---|---|---|'];
for (const r of registry) {
  md.push(`| ${r.id} | ${r.sourceType} | ${r.category} | ${r.path} | ${r.sizeBytes} B |`);
}
fs.writeFileSync(path.join(root, lib.STATUS_DIR, '来源注册表.md'), md.join('\n') + '\n', 'utf8');

console.log(`✅ 来源注册表已生成：${registry.length} 个文件。`);
const byType = {};
for (const r of registry) byType[r.sourceType] = (byType[r.sourceType] || 0) + 1;
for (const [t, n] of Object.entries(byType)) console.log(`  - ${t}: ${n}`);
if (!Object.keys(byType).some(t => t === '本人内容')) {
  console.log('⚠️ 未识别到「本人内容」，请检查 来源规则.json 的 dirs 是否指向本人内容所在目录。');
}
