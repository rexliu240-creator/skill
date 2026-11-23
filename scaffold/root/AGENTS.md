# AGENTS.md — 内容素材工程协作规则

本文件面向所有参与该工程的 Agent 与人。进入本工程即视为接受以下纪律。

## 目录职责

| 目录 | 职责 | 谁可以写 |
|---|---|---|
| 00-规则与索引 | 字段/关系/去重规范，关系索引、去重候选 | 规则变更走版本流程 |
| 01-原始素材区 | 原始素材完整副本 | 只许新增副本，禁止改写 |
| 02-内容单元库 | QST/CON/OPI/CAS/SOL 单元 | 抽取流程产出 |
| 03-处理状态 | 来源规则、注册表、台账、总览 | 脚本维护为主 |
| 04-模板 | 单元/地图/装配模板 | 少改 |
| 05-主题地图 | 主题聚合导航 | 样本/批量模式产出 |
| 06-选题装配 | 从单元装配的选题骨架 | 装配工具产出 |
| 07-脚本与工具 | Node.js 工具脚本 | 随工程初始化交付 |

## 处理纪律

1. 原始素材只读。任何情况下不改写 `01-原始素材区/` 内的文件
2. 模式逐档升级：审计 → 样本 → 批量 → 全量；闸门没全过不升档
3. 对象是内容单元，不是文件；不按文件夹整理内容
4. 字段、关系、去重口径以 `00-规则与索引/` 的规则文件为准；要改规则先改规则文件再动数据
5. 每批处理结束运行 summarize-system.js 并复盘
6. 不交出：原文件改写、单篇润色、标题优化、少量零散素材轻量整理

## 常用命令

```bash
node 07-脚本与工具/generate-source-registry.js
node 07-脚本与工具/rebuild-processing-ledger.js
node 07-脚本与工具/extract-sample-units.js --apply
node 07-脚本与工具/generate-unit-draft.js --type OPI --title "标题" --source "路径"
node 07-脚本与工具/assemble-topic-from-units.js --title "选题" --question QST001 --opinion OPI001 --apply
node 07-脚本与工具/generate-link-map.js
node 07-脚本与工具/generate-duplicate-candidates.js
node 07-脚本与工具/fill-obsidian-links.js --apply
node 07-脚本与工具/summarize-system.js
```

运行脚本需要 Node.js 18+。先 `node -v` 确认；版本过低就先升级，不手工冒充脚本结果。
