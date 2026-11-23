# 快速上手：最短启动链路

## 前置

- Node.js 18+（先 `node -v` 确认）
- 一批本地文稿（文本文件 ≥50 个，或正文 ≥8 万字）

## 五步到可用态

1. **审计**：统计素材规模、确认纳入/排除边界、来源类别是否 ≥2 类。不达标就停，给降级路径
2. **初始化工程**：
   ```bash
   node <skill目录>/tools/init-content-system.js <输出目录>
   ```
   然后按用户实际目录改写 `03-处理状态/来源规则.json` 的 dirs
3. **复制素材副本 + 登记**：把纳入素材复制到 `01-原始素材区/完整副本/`，运行：
   ```bash
   node <工程>/07-脚本与工具/generate-source-registry.js
   node <工程>/07-脚本与工具/rebuild-processing-ledger.js
   ```
4. **抽首批样本**：选 3~5 篇代表性文稿，运行：
   ```bash
   node <工程>/07-脚本与工具/extract-sample-units.js --apply
   ```
   逐个确认草稿：补摘要/主题/关键词，判重，建关系
5. **装配与校验**：
   ```bash
   node <工程>/07-脚本与工具/generate-link-map.js
   node <工程>/07-脚本与工具/generate-duplicate-candidates.js
   node <工程>/07-脚本与工具/assemble-topic-from-units.js --title "示例" --question QST001 --opinion OPI001 --apply
   node <工程>/07-脚本与工具/fill-obsidian-links.js --apply
   node <工程>/07-脚本与工具/summarize-system.js
   ```

跑到这里，系统即可用：骨架、规则、状态、单元、地图、装配、索引全部就位。
