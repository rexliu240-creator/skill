#!/usr/bin/env node
/**
 * 读取并显示工程内 03-处理状态/来源规则.json，供其他脚本与人工核对。
 * 用法：node source-rules.js [--root <工程根>]
 */
'use strict';

const path = require('path');
const lib = require('./lib.js');

const root = lib.resolveRoot(process.argv);
const rules = lib.loadRules(root);

console.log('来源规则文件：' + path.join(root, lib.STATUS_DIR, '来源规则.json'));
console.log('规则条数：' + (rules.rules || []).length + '\n');
for (const r of rules.rules || []) {
  console.log(`- [${r.code || '无编号'}] ${r.category} / ${r.sourceType}`);
  console.log(`  目录：${(r.dirs || []).map(d => '01-原始素材区/' + d).join(', ') || '(无)'}`);
}
console.log('\n提示：按用户实际目录结构改写 dirs 字段；「本人内容」必须指向用户本人内容所在目录。');
