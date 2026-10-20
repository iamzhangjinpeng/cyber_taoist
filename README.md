# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## 部署（GitHub Actions）

部署方式已从「部署分支（`pages` 分支）」切换为 GitHub Actions 构建并发布：

- 工作流：[.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- 触发方式：推送到 `master`，或在 Actions 页面手动 `Run workflow`
- 流程：`npm ci` → `npm run build` → 上传 `dist` → 发布到 GitHub Pages

仓库设置（Settings → Pages → Build and deployment）的 **Source 需选择 “GitHub Actions”**。
第一次运行工作流时，`actions/configure-pages` 会自动完成这一步（需要 `pages: write` 权限）。

本地开发：

```bash
npm ci
npm run dev      # 开发
npm run build    # 构建，产物在 dist/
```

