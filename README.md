# content-asset-system

把本地大量文稿、推文、文章、课程稿等素材整理成可持续生长的内容素材工程：内容单元库 + 主题地图 + 选题装配稿 + 关系与去重索引。

## 安装

把本仓库的 `content-asset-system/` 目录复制到 WorkBuddy 的 `~/.workbuddy/skills/` 下即可；或在对话中说「安装 content-asset-system」。

## 快速开始

见 `docs/quickstart.md`（最短启动链路：审计 → 初始化 → 复制副本 → 抽样本 → 装配校验）。

## 结构

- `SKILL.md` — 主文件：四模式工作流（审计 / 样本 / 批量 / 全量）与升档闸门
- `tools/` — 11 个 Node.js 工具（初始化、来源登记、单元抽取、装配、去重、索引、总览）
- `templates/` — 7 份模板（五类内容单元 + 主题地图 + 选题装配）
- `scaffold/` — 工程脚手架（根文件 + 6 份规则文件）
- `docs/` — 快速上手与验收标准

## 依赖

Node.js 18+（工具脚本），其余无依赖。
