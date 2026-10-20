# 小六壬 · Cyber Taoist

浏览器里的小六壬掌诀占卜：输入三个数字（或选一个时间自动换算农历数字），起卦得到
**大安 / 留连 / 速喜 / 赤口 / 小吉 / 空亡**。

- 技术栈：Vue 3 + Vite 8
- 无 UI 组件库，样式全部手写（产物约 71 KB，gzip 约 28 KB，相比旧版 469 KB 减少 85%）
- 农历换算使用浏览器内置的 `Intl` 中国历法，不额外引依赖

## 本地开发

```bash
npm ci
npm run dev       # 本地开发
npm run lint      # ESLint 检查
npm run test      # Vitest 单元测试
npm run build     # 构建，产物在 dist/
npm run preview   # 预览构建结果
```

## 目录结构

```
src/
├── core/
│   ├── liuRen.js        # 起卦算法、掌诀坐标、格子数据
│   ├── lunar.js         # 阳历 → 农历数字、时辰换算
│   └── *.test.js        # Vitest 用例
├── components/
│   └── XiaoLiuRen.vue   # 页面组件（表单、掌诀图、动画）
├── App.vue
├── main.js
└── style.css
```

算法说明：按「月上起日，日上起时」连续顺推——第一个数字从「大安」起数，落宫即下一个数字的起点；
数字从 1 起（1 停在原地），7 及以上按 6 循环；输入范围 1 ~ 1000。

## 部署（GitHub Actions）

- 工作流：[.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- 触发：推送到 `master`，或在 Actions 页面手动 `Run workflow`
- 流程：`npm ci` → `npm run lint` → `npm test` → `npm run build` → 上传 `dist` → 发布到 GitHub Pages

仓库设置（Settings → Pages → Build and deployment）的 **Source 为 “GitHub Actions”**，
首次运行工作流时 `actions/configure-pages` 会自动完成这一步（需要 `pages: write` 权限）。
