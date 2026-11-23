#!/usr/bin/env node
/**
 * 共享工具模块：工程根目录定位 + 来源规则加载与分类。
 * 被 07-脚本与工具/ 下的其他脚本 require。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const STATUS_DIR = '03-处理状态';

/** 从指定目录（默认 process.cwd()）逐级向上查找包含 03-处理状态 的工程根目录。 */
function findProjectRoot(startDir) {
  let dir = startDir || process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, STATUS_DIR))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** 解析工程根：支持 --root <path> 参数，否则自动向上查找。 */
function resolveRoot(argv) {
  const idx = argv.indexOf('--root');
  if (idx !== -1 && argv[idx + 1]) return path.resolve(argv[idx + 1]);
  const found = findProjectRoot();
  if (!found) {
    console.error('未找到工程根目录（缺少 03-处理状态）。请先运行 init-content-system.js，或用 --root 指定工程根。');
    process.exit(1);
  }
  return found;
}

/** 加载 03-处理状态/来源规则.json。 */
function loadRules(root) {
  const file = path.join(root, STATUS_DIR, '来源规则.json');
  if (!fs.existsSync(file)) {
    console.error('缺少 ' + file + '，请先运行 init-content-system.js。');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * 按来源规则判断某个文件属于哪类来源。
 * 命中第一条 dirs 前缀匹配的规则；都不命中则返回 unknown 规则（或 null）。
 */
function classifyFile(root, relPath, rules) {
  const norm = relPath.replace(/\\/g, '/');
  for (const rule of rules.rules || []) {
    for (const d of rule.dirs || []) {
      const prefix = ('01-原始素材区/' + d).replace(/\/+$/, '') + '/';
      if (norm.startsWith(prefix) || norm === ('01-原始素材区/' + d)) {
        return rule;
      }
    }
  }
  return (rules.rules || []).find(r => r.sourceType === '未知来源') || null;
}

/** 递归列出某目录下所有指定扩展名的文件（返回相对 root 的路径）。 */
function listFiles(root, relDir, exts) {
  const abs = path.join(root, relDir);
  const out = [];
  if (!fs.existsSync(abs)) return out;
  (function walk(d) {
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      const rel = path.relative(root, full).replace(/\\/g, '/');
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (!exts || exts.includes(path.extname(name).toLowerCase())) out.push(rel);
    }
  })(abs);
  return out.sort();
}

/** 解析 Markdown 文件的 YAML frontmatter（简易版，返回对象 + 正文）。 */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: text };
  const data = {};
  let currentKey = null;
  let nestedPending = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*-\s+/.test(line) && currentKey) {
      const v = line.replace(/^\s*-\s+/, '').trim();
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      const nested = v.match(/^(\w+)\s*:\s*(.*)$/); // 形如 "- type: 回应"（嵌套对象首键）
      if (nested) {
        data[currentKey].push({ [nested[1]]: stripQuotes(nested[2]) });
        nestedPending = data[currentKey][data[currentKey].length - 1];
      } else {
        data[currentKey].push(stripQuotes(v));
        nestedPending = null;
      }
    } else if (/^\s+\w[\w-]*\s*:/.test(line) && nestedPending) {
      // 嵌套对象的后续键，如 "    target: QST001"
      const kv = line.trim().match(/^(\w+)\s*:\s*(.*)$/);
      if (kv) nestedPending[kv[1]] = stripQuotes(kv[2].trim());
    } else {
      const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (kv) {
        currentKey = kv[1];
        const v = kv[2].trim();
        if (v === '') data[currentKey] = [];
        else if (v.startsWith('[') && v.endsWith(']')) {
          data[currentKey] = v.slice(1, -1).split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
        } else data[currentKey] = stripQuotes(v);
      }
    }
  }
  return { data, body: text.slice(m[0].length) };
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  return s;
}

/** 生成内容单元 frontmatter 的 YAML 文本。 */
function unitFrontmatter(u) {
  const arr = (k, def) => Array.isArray(u[k]) && u[k].length ? u[k] : (def || []);
  const lines = [
    '---',
    'id: ' + u.id,
    'type: ' + u.type,
    'title: "' + String(u.title || '').replace(/"/g, "'") + '"',
    'canonical: ' + (u.canonical === false ? 'false' : 'true'),
    'version: ' + (u.version || 1),
    'created: ' + (u.created || new Date().toISOString().slice(0, 10)),
  ];
  lines.push('source_documents:');
  const docs = arr('source_documents');
  if (docs.length) docs.forEach(d => lines.push('  - "' + d + '"'));
  else lines.push('  - ""');
  lines.push('themes:');
  arr('themes').forEach(t => lines.push('  - "' + t + '"'));
  lines.push('keywords:');
  arr('keywords').forEach(t => lines.push('  - "' + t + '"'));
  lines.push('relationships:');
  (u.relationships || []).forEach(r => {
    lines.push('  - type: ' + r.type);
    lines.push('    target: ' + r.target);
  });
  lines.push('---');
  return lines.join('\n');
}

/** 读取 02-内容单元库 的全部单元（含解析后的 frontmatter）。 */
function loadUnits(root) {
  const dir = path.join(root, '02-内容单元库');
  const units = [];
  if (!fs.existsSync(dir)) return units;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    const { data, body } = parseFrontmatter(text);
    units.push({ file: name, data, body });
  }
  return units;
}

/** 中文/英文混合分词：连续汉字按 2-gram，英文按单词，用于相似度计算。 */
function tokenize(text) {
  const tokens = new Set();
  const s = String(text || '');
  for (const word of s.toLowerCase().match(/[a-z0-9]+/g) || []) tokens.add(word);
  const han = s.replace(/[^\u4e00-\u9fa5]/g, '');
  for (let i = 0; i < han.length - 1; i++) tokens.add(han.slice(i, i + 2));
  return [...tokens];
}

/** Jaccard 相似度。 */
function similarity(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

module.exports = {
  STATUS_DIR, findProjectRoot, resolveRoot, loadRules, classifyFile,
  listFiles, parseFrontmatter, unitFrontmatter, loadUnits, tokenize, similarity,
};
