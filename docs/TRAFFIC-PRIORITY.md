# MiniTool HQ — 流量优先调研（专家模式）

**目标：** 流量 = 广告收入。按「新站可排名 × 搜索量 × 广告适配」排序，不按「看起来专业」排序。  
**日期：** 2026-07-26  
**边界：** 起名/塔牌归 HotPickLab，不在此列。

---

## 1. 核心结论（先看这个）

| 排名 | 方向 | 对新站真实流量潜力 | 广告逻辑 | 建议 |
|------|------|-------------------|----------|------|
| **1** | **HEIC → JPG** | **最高** | 量极大、意图纯、工具页可直接吃搜索 | **下一批优先做** |
| **2** | **格式转换**（PNG↔JPG、WebP…） | **很高** | 与 HEIC 同型「转换器站」可百万级月访 | **与 HEIC 同套 UI 一起做** |
| **3** | **已上线卖家工具 SEO 深挖** | **中高（可最快见效）** | 不用新产品；靠长尾页/FAQ/集群 | **立刻并行做内容** |
| **4** | **批量压缩** | **中（长期）** | 品类巨大但头词被 TinyPNG 等锁死 | **延后；做差异化长尾再上** |
| **5** | **EXIF 清除** | **中低** | 隐私好讲、量小于 HEIC | 可并入卖家图流程，不必独立抢首发 |

**一句话：** 要广告流量，先做 **HEIC + 格式转换**；同时把 **Marketplace Image Prep / 箱规** 的长尾 SEO 做透；通用压缩别当第一增长引擎。

---

## 2. 证据：竞品量级（估算，非精确）

| 站点/品类 | 量级信号 | 含义 |
|-----------|----------|------|
| TinyPNG | ~**5M**/月访（Semrush 量级） | 压缩头词被巨头吃光 |
| heictojpg.com | ~**1.5–1.8M**/月访量级 | **单功能转换器**就能养大站 |
| png2jpg.com | ~**1.8M**/月访量级 | 格式转换同样是流量矿 |
| heic.online 头词 | `heic to jpg` ~**22k**/月，站内占比可 >30% | 一个词就能撑起工具站 |
| `image compressor` | ~**50k**/月量级，但 TinyPNG 等占位 | 新站短期难进首页 |

卖家向关键词（amazon image size / etsy photo size / fba box）单个体量通常 **远小于** HEIC/压缩头词，但：

- SERP 里多是博客/帮助文，**工具页可插队**  
- 用户更偏美国卖家 → **广告 RPM 往往高于** 全球转换器站的印度流量  

所以：  
- **绝对 PV：** HEIC / 转换 / 压缩  
- **可排名速度 + 美元广告质量：** 卖家长尾 + HEIC（本地处理、美区）  

---

## 3. 分项深挖

### 3.1 HEIC → JPG（优先 #1）

**为什么排第一**

1. 明确刚需：iPhone 默认 HEIC，上传 Amazon/Etsy/邮件常失败 → 搜 `heic to jpg`  
2. 已有站证明模式：单页转换器可做到百万级月访  
3. 与 MiniTool 楔子一致：**浏览器本地转，不上传**（竞品大量要上传）  
4. 可和卖家线串联：「转完 HEIC → 再进 Marketplace Image Prep」  

**流量打法**

| 层 | 做法 |
|----|------|
| 工具页 | Primary: `heic to jpg` / `heic to jpg converter` |
| 长尾页 | `heic to jpg for amazon`, `iphone heic to jpg batch`, `heic vs jpg` |
| 信息页 | `what are heic files`（相对好排，再内链到工具） |

**风险：** 头词竞争不低；靠 **批量 + 本地 + 卖家场景文案** 差异化，不靠「又一个上传转换」。

---

### 3.2 格式转换 PNG/JPG/WebP（优先 #2，与 HEIC 同产品）

**为什么紧跟 HEIC**

- `png to jpg` 类站点同样可到百万月访量级  
- 工程上与 HEIC/压缩共享 canvas / WASM 管线 → **一次产品、多 URL、多词**  
- 广告同样是高展示工具页  

**建议形态：** 一个「Image Convert Lab」入口 + 多 SEO 着陆：

- `/tools/heic-to-jpg`  
- `/tools/png-to-jpg`  
- `/tools/jpg-to-png`  
- `/tools/webp-converter`（可二期）  

---

### 3.3 已上线工具：SEO 深挖（优先 #3，零开发最快）

已有：Marketplace Image Prep、FBA Box Size Checker。  
瓶颈通常不是「没工具」，而是 **索引词太少、内容集群不够**。

**应补的长尾集群（示例，非穷尽）**

| 工具 | 集群主题（每主题一页或强 FAQ + 内链） |
|------|--------------------------------------|
| Image Prep | amazon product image size / requirements 2026；etsy listing photo size；tiktok shop image size；white background amazon main image；2000x2000 amazon |
| Box checker | amazon fba box size limits；dimensional weight calculator amazon；fba carton dimensions max |

**打法：** 指南页（意图=了解）→ CTA 进工具（意图=做事）。  
这是新站 **2–8 周** 内最可能出展示的路径。

---

### 3.4 批量压缩（降级为 #4）

**品类真相：** 流量池最大之一（TinyPNG 级）。  
**新站真相：** `image compressor` / 品牌词被占；短期靠头词获客不现实。

**若做，只做可排差异：**

- `compress image without uploading`  
- `batch compress images browser`  
- `compress to 100kb` / `compress for amazon listing`  
- 与 Image Prep 联动：「压完再按平台导出」  

**结论：** 值得进路线图，但 **不要排在 HEIC 前面** 当「唯一冲流量产品」。

---

### 3.5 EXIF 清除（#5）

有搜索、隐私故事好、适合「本地处理」品牌，但体量通常 **小于 HEIC/转换**。  
可做：Marketplace Prep 里的一步，或独立小页吃 `remove exif` 长尾——不抢首发工程带宽。

---

## 4. 广告视角（流量如何变钱）

| 流量类型 | 典型地理 | RPM 倾向 | 含义 |
|----------|----------|----------|------|
| 全球转换器（HEIC/PNG） | 印度 + 美欧混杂 | 中低～中 | **靠量** |
| 卖家工具 | 美/英卖家偏多 | **更高** | 量少但更值钱 |
| 压缩头词赢家 | 全球 | 中 | 难进，进了很肥 |

组合最优：

1. **HEIC/转换拉量**  
2. **卖家工具提 RPM + 复访**  
3. 压缩作矩阵补强  

AdSense：先保证工具页可索引、可停留；审批前用 SEO 铺词，审批后同一批页直接变现。

---

## 5. 修订后的建造优先级（相对旧 Roadmap）

旧队列强调：压缩 → HEIC → 格式。  
**按流量专家排序应改为：**

| 顺序 | 动作 | 类型 |
|------|------|------|
| **A** | Search Console + 卖家工具长尾/指南页集群 | 内容/SEO（本周就可） |
| **B** | **HEIC → JPG** 工具页（批量、本地） | 新产品 |
| **C** | **PNG↔JPG / WebP**（与 B 同壳） | 新产品 |
| **D** | 批量压缩（目标大小 + 不上传 + 卖家场景） | 新产品 |
| **E** | EXIF 独立页或并入 Prep | 小增量 |

---

## 6. 明确不要优先的

- 硬刚 TinyPNG 品牌词 / 泛 `image compressor` 首页位  
- 先做 UTM、字数统计等「目录站填充」（量碎片、品牌散）  
- 去背景 AI 大模型（贵、同质、广告政策更敏感）  
- 把 HotPickLab 起名流量算进本站  

---

## 7. 90 天务实目标（广告导向）

| 阶段 | 目标 |
|------|------|
| 0–30 天 | GSC 提交；Image Prep / Box 各扩 ≥5 条长尾或指南；修索引 |
| 30–60 天 | 上线 HEIC→JPG；拿首批展示/点击 |
| 60–90 天 | 补 PNG↔JPG；内链卖家工具；申请/优化广告位 |

成功指标：GSC **impressions 上升** → clicks → 广告页 RPM；不追求一上来打赢 TinyPNG。

---

## 8. 相关文档

- [TRAFFIC-PLAYBOOK.md](./TRAFFIC-PLAYBOOK.md) — **执行手册**（GSC / Bing / IndexNow / 目录 / 广告阶段）  
- [TOOL-ROADMAP.md](./TOOL-ROADMAP.md) — 应用本调研后应改队列顺序  
- [BRAND-BOUNDARY.md](./BRAND-BOUNDARY.md)  
- [COMPETITOR-CHECKLIST.md](./COMPETITOR-CHECKLIST.md) — 开 HEIC 前走一遍竞品表  
