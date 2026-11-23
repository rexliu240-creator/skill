#!/usr/bin/env node
/**
 * 把正文中的 [[ID]] 形式引用补全为 [[ID_标题]]（Obsidian 可点击链接）。
 * 用法：node fill-obsidian-links.js [--root <工程根>] [--apply]
 * 缺省为预览；--apply 实际改写 02-内容单元库 与 06-选题装配 中的文件。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const args = process.argv.slice(2);
const root = lib.resolveRoot(args);
const apply = args.includes('--apply');

const units = lib.loadUnits(root);
const map = {}; // id -> filename (without .md)
for (const u of units) if (u.data.id) map[u.data.id] = u.file.replace(/\.md$/, '');

let changed = 0, links = 0;
const targets = [];
for (const u of units) targets.push(path.join(root, '02-内容单元库', u.file));
const asmDir = path.join(root, '06-选题装配');
if (fs.existsSync(asmDir)) {
  for (const f of fs.readdirSync(asmDir)) if (f.endsWith('.md')) targets.push(path.join(asmDir, f));
}

for (const file of targets) {
  let text = fs.readFileSync(file, 'utf8');
  let fileChanged = false;
  for (const [id, name] of Object.entries(map)) {
    const re = new RegExp('\\[\\[' + id + '(?![_\\w])\\]\\]', 'g');
    if (re.test(text)) {
      text = text.replace(re, '[[' + name + ']]');
      fileChanged = true; links++;
    }
  }
  if (fileChanged) {
    changed++;
    if (apply) fs.writeFileSync(file, text, 'utf8');
    else console.log('（预览）将更新：' + path.basename(file));
  }
}

console.log(apply
  ? `✅ 已补全 ${links} 处链接，涉及 ${changed} 个文件。`
  : `预览完成：可补全 ${links} 处链接，涉及 ${changed} 个文件。加 --apply 执行。`);
