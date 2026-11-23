#!/usr/bin/env node
/**
 * 初始化内容素材工程骨架。
 * 用法：node init-content-system.js [目标目录]
 * 目标目录缺省为当前目录下的「内容素材工程」。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const lib = require('./lib.js');

const skillDir = path.resolve(__dirname, '..');
const target = path.resolve(process.argv[2] || path.join(process.cwd(), '内容素材工程'));

if (fs.existsSync(path.join(target, lib.STATUS_DIR))) {
  console.error('目录已是工程：' + target);
  process.exit(1);
}

const dirs = [
  '00-规则与索引', '01-原始素材区/完整副本', '02-内容单元库',
  lib.STATUS_DIR, '04-模板', '05-主题地图', '06-选题装配', '07-脚本与工具',
];
for (const d of dirs) fs.mkdirSync(path.join(target, d), { recursive: true });

// 复制模板 / 规则 / 根文件 / 工具脚本
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name), d = path.join(dest, name);
    if (fs.statSync(s).isDirectory()) { fs.mkdirSync(d, { recursive: true }); copyDir(s, d); }
    else fs.copyFileSync(s, d);
  }
}
copyDir(path.join(skillDir, 'templates'), path.join(target, '04-模板'));
copyDir(path.join(skillDir, 'scaffold', 'rules'), path.join(target, '00-规则与索引'));
copyDir(path.join(skillDir, 'scaffold', 'root'), target);
copyDir(path.join(skillDir, 'tools'), path.join(target, '07-脚本与工具'));

// 默认来源规则（初始化后按用户实际目录改写 dirs）
const defaultRules = {
  description: '来源分类规则：按 dirs 前缀匹配 01-原始素材区 下的相对目录；按用户实际结构改写。',
  rules: [
    { category: '本人内容', sourceType: '本人内容', code: 'A', dirs: ['完整副本/本人内容'] },
    { category: '外部研究素材', sourceType: '外部素材', code: 'B', dirs: ['完整副本/外部素材'] },
    { category: '多平台内容', sourceType: '平台内容', code: 'C', dirs: ['完整副本/平台内容'] },
    { category: '多作者内容', sourceType: '他人内容', code: 'D', dirs: ['完整副本/他人内容'] },
    { category: '未分类', sourceType: '未知来源', code: 'Z', dirs: [] },
  ],
};
fs.writeFileSync(
  path.join(target, lib.STATUS_DIR, '来源规则.json'),
  JSON.stringify(defaultRules, null, 2) + '\n', 'utf8');

// 按来源规则预创建素材子目录
for (const r of defaultRules.rules) {
  for (const d of r.dirs || []) {
    fs.mkdirSync(path.join(target, '01-原始素材区', d), { recursive: true });
  }
}

// 空状态文件
for (const f of ['原始素材索引.md', '待处理清单.md', '已处理清单.md']) {
  fs.writeFileSync(path.join(target, lib.STATUS_DIR, f), `# ${f.replace('.md', '')}\n\n(尚未生成，运行 rebuild-processing-ledger.js)\n`, 'utf8');
}
fs.writeFileSync(path.join(target, lib.STATUS_DIR, '处理状态总览.md'), '# 处理状态总览\n\n(尚未生成，运行 summarize-system.js)\n', 'utf8');

console.log('✅ 工程已初始化：' + target);
console.log('下一步：把纳入范围的素材复制到 01-原始素材区/完整副本/，再运行 generate-source-registry.js 和 rebuild-processing-ledger.js。');
