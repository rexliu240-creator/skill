#!/usr/bin/env node
/**
 * 输出当前系统总览：单元分布、素材处理进度、索引健康度，并更新 03-处理状态/处理状态总览.md。
 * 用法：node summarize-system.js [--root <工程根>]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const root = lib.resolveRoot(process.argv);
const units = lib.loadUnits(root);
const raw = lib.listFiles(root, '01-原始素材区', ['.md', '.txt', '.markdown']);

const byType = { QST: 0, CON: 0, OPI: 0, CAS: 0, SOL: 0 };
for (const u of units) if (byType[u.data.type] !== undefined) byType[u.data.type]++;

const used = new Set();
for (const u of units) for (const d of u.data.source_documents || []) if (d) used.add(d.replace(/\\/g, '/'));
const pendingCount = raw.filter(r => !used.has(r)).length;

function countMd(dir) {
  const d = path.join(root, dir);
  return fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md')).length : 0;
}
const maps = countMd('05-主题地图'), assemblies = countMd('06-选题装配');

const missingRel = [];
const ids = new Set(units.map(u => u.data.id));
for (const u of units) for (const r of u.data.relationships || []) if (r && r.target && !ids.has(r.target)) missingRel.push(r.target);

const missingFields = units.filter(u => !u.data.id || !u.data.type || !u.data.title ||
  !(u.data.source_documents || []).filter(Boolean).length || !(u.data.themes || []).length).map(u => u.file);

const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
let md = `# 处理状态总览\n\n更新时间：${ts}\n\n## 规模\n\n- 原始素材：${raw.length} 个文件（已引用 ${used.size}，待处理 ${pendingCount}）\n- 内容单元：${units.length}（QST ${byType.QST} / CON ${byType.CON} / OPI ${byType.OPI} / CAS ${byType.CAS} / SOL ${byType.SOL}）\n- 主题地图：${maps} 张｜选题装配稿：${assemblies} 份\n\n## 健康度\n\n- 关系目标缺失：${missingRel.length} ${missingRel.length ? '（' + [...new Set(missingRel)].join('、') + '）' : ''}\n- 字段不完整单元：${missingFields.length} ${missingFields.length ? '（' + missingFields.slice(0, 5).join('、') + (missingFields.length > 5 ? ' 等' : '') + '）' : ''}\n\n## 下一步\n\n${pendingCount > 0 ? `- 继续处理待处理素材（${pendingCount} 个）\n` : ''}${missingRel.length ? '- 先清零关系目标缺失\n' : ''}${missingFields.length ? '- 补齐单元字段\n' : ''}${maps === 0 ? '- 建立第一张主题地图\n' : ''}${assemblies < 2 ? '- 选题装配稿不足 2 份\n' : ''}- 交付判定详见 docs/acceptance.md\n`;
fs.writeFileSync(path.join(root, lib.STATUS_DIR, '处理状态总览.md'), md, 'utf8');
console.log(md);
