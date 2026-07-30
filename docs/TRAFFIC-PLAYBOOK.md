# MiniTool HQ — Traffic Playbook（先进手段全开 · 分阶段）

**Locked:** 2026-07-26  
**Goal:** 可索引流量 → 广告变现。只做合规、可复用手段。  
**定位:** 跨境卖家 / 创作者垂直工具站（见 [POSITIONING.md](./POSITIONING.md)）。  
**产品上限:** Phase 1 = 8–12 工具；成熟 16–20；不过 20（见 [TOOL-ROADMAP.md](./TOOL-ROADMAP.md)）。

> 客户页不写「我们靠广告赚钱」。本文件仅内部执行。

---

## 总原则

1. **Google 为主，Bing 为辅** — Google 不支持 IndexNow；两边都要做。  
2. **产品 SEO > 目录堆砌** — 每工具完整 SEO 门禁 + 内链；先读 `.cursor/skills/minitool-seo-expert/SKILL.md`。  
3. **量（HEIC/转换）+ 质（卖家长尾 RPM）** — 见 [TRAFFIC-PRIORITY.md](./TRAFFIC-PRIORITY.md)。  
4. **每上线一次 = 部署 + sitemap 刷新 + IndexNow ping +（可选）GSC 请求关键页。**

---

## 手段总表（全部启用 · 按阶段）

| 手段 | 作用 | 阶段 | 状态 |
|------|------|------|------|
| **GSC sitemap** | Google 发现/再抓取 | 0 起 | 已提交；有新页再「检查 sitemap」 |
| **GSC URL 检查 / 请求索引** | 加速关键页 | 0 起 | 配额有限；新工具/指南必做 |
| **Bing Webmaster sitemap** | Bing 发现 | 0 起 | 保持提交成功 |
| **Bing 网址提交** | 批量通知 Bing | 0 起 | 新 URL 集可再交 |
| **IndexNow** | 即时通知 Bing/Yandex 等 | 0 起 | **已接入**（见下） |
| **技术 SEO** | 可爬、规范 URL、OG、面包屑、无 redirect 进 sitemap | 0–1 | SEO Expert Pass 已做一轮 |
| **工具页 on-page SEO** | 排长尾 | 每个工具 | 门禁强制 |
| **Guides 集群** | 卖家长尾 → 工具 | 持续 | 在 **本站 `/guides/`**；禁止另开泛博客站 |
| **内链闭环** | 传递权重与转化 | 持续 | 工具↔指南双向 |
| **下一批产品** | HEIC 后：格式转换 → 压缩… | 1 | 明天起按 Roadmap |
| **工具目录站提交** | 外链 + 发现 | 1（有稳定流量后） | 未做 |
| **AdSense / 展示广告** | 变现 | 1–2（有稳定展示） | 未申请 |
| **性能 / CWV** | 排名与体验 | 2 | 大包拆分待做 |
| **Chrome Web Store** | 扩展分发 | 2+ | 工具验证后再说 |
| **外链 / 社区**（Reddit、Quora、卖家论坛） | 发现与品牌 | 1–2 谨慎 | 不硬广；有用帖+工具链 |
| **IndexNow 自动化挂 CI** | 每次 Git 部署自动 ping | 1 | 脚本已有；Git 连 Pages 后挂钩 |

**明确不做：** 买垃圾外链、刷点击、门页站群、假 Pro 墙骗转化、拆同一 job 刷多个工具页。

---

## 阶段 0（现在 · 本周）— 发现与索引管道

| # | 动作 | Owner | 完成标准 |
|---|------|--------|----------|
| 0.1 | GSC：sitemap-index 保持「成功」 | 你 | 发现页数随时间上升 |
| 0.2 | GSC：正式 9 URL 请求索引（失败则隔天重试） | 你 | 关键页「已编入索引」 |
| 0.3 | Bing：sitemap + 网址列表 | 你 | 已提交 |
| 0.4 | **IndexNow key + 部署后 ping** | Agent | `npm run indexnow` 成功 |
| 0.5 | 部署清单写入 DEPLOY.md | Agent | 文档可跟 |

**正式 URL 清单（GSC / Bing / IndexNow 共用）：**

```
https://selltoolhq.com/
https://selltoolhq.com/tools/marketplace-image-prep
https://selltoolhq.com/tools/heic-to-jpg
https://selltoolhq.com/tools/png-to-jpg
https://selltoolhq.com/tools/fba-box-size-checker
https://selltoolhq.com/guides/amazon-product-image-size
https://selltoolhq.com/guides/etsy-listing-photo-size
https://selltoolhq.com/guides/tiktok-shop-image-size
https://selltoolhq.com/guides/amazon-fba-box-size-limits
https://selltoolhq.com/guides/amazon-dimensional-weight
https://selltoolhq.com/guides/heic-to-jpg-for-amazon
https://selltoolhq.com/guides/heic-to-jpg-for-etsy
https://selltoolhq.com/guides/heic-to-jpg-for-tiktok-shop
https://selltoolhq.com/guides/png-to-jpg-for-amazon
```
新工具上线后：**追加 URL → 部署 → `npm run indexnow` → GSC 请求该页。**

---

## 阶段 1（0–60 天）— 产品 + SEO 放大

| # | 动作 | 说明 |
|---|------|------|
| 1.1 | **格式转换**（下一批） | 流量优先级最高新产品 |
| 1.2 | 批量压缩 | 隐私/batch 长尾，不硬刚 TinyPNG |
| 1.3 | Listing 字符计数、英寸/厘米 | 轻工具 + 卖家互链 |
| 1.4 | Guides：每个新工具至少 1 篇配套长尾 | SEO 专家 Skill |
| 1.5 | 工具目录（Toolify / AlternativeTo 等） | 有基础展示后再交，避免空站 |
| 1.6 | 申请 AdSense（或同类） | GSC 有稳定展示/点击后再申 |

---

## 阶段 2（60–180 天）— 变现与补强

| # | 动作 |
|---|------|
| 2.1 | 广告位布局（不影响工具主 CTA） |
| 2.2 | CWV：拆大 JS、缓存 `_astro` |
| 2.3 | Phase 1 凑满 8–10；视数据再扩到 16–20 |
| 2.4 | 可选：Chrome 扩展、谨慎社区种草 |

---

## IndexNow（本站做法）

静态站 **不接** Wix/Shopify 插件。本站实现：

1. Key 文件：`public/{INDEXNOW_KEY}.txt`（内容 = key）  
2. 部署后运行：`npm run indexnow`（ping `api.indexnow.org`）  
3. Key 与 host 写在 `super-shell/scripts/indexnow-config.json`（可提交；key 本身不是密钥机密，但是验证文件）

每次 `wrangler pages deploy` 成功后执行 IndexNow。

---

## Agent 执行约定

- 用户说「提流量 / 索引 / IndexNow / SEO」→ 读本 playbook + SEO expert skill。  
- 上新工具/指南 → 更新 URL 清单 + IndexNow + 提醒 GSC。  
- 不把未验证的「黑科技」写进 playbook。

## 相关

- [TRAFFIC-PRIORITY.md](./TRAFFIC-PRIORITY.md) — 做什么产品拉量  
- [TOOL-ROADMAP.md](./TOOL-ROADMAP.md) — 做什么工具  
- [DEPLOY.md](./DEPLOY.md) — 怎么发布 + IndexNow  
- `.cursor/skills/minitool-seo-expert/SKILL.md`
