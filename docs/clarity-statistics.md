# Microsoft Clarity 访问统计使用说明

## 1. 功能概述
- **工具**：Microsoft Clarity（免费）
- **作用**：统计网站访问热力图、会话录制、流量来源等
- **集成位置**：`src/app/layout.tsx`（自动注入所有页面）
- **特点**：免费、无流量限制、隐私友好（不强制Cookie弹窗）

## 2. 注册步骤

### 步骤一：注册账号
1. 访问 <https://clarity.microsoft.com>
2. 使用 Microsoft 账号登录
3. 如果没有账号，点击“注册”创建

### 步骤二：创建项目
1. 登录后，点击 **"Add project"**（添加项目）
2. **Project name**：任意填写，如 `chen-genealogy-site`
3. **Website URL**：您的网站域名，如 `https://chenmike.cn`
4. **Category**：可选，保持默认或选择 "Blog/Personal"
5. 点击 **"Create"** 创建项目

### 步骤三：获取 Clarity ID
1. 创建项目后，进入项目概览页面
2. 在页面上方可以看到 **Clarity ID**（类似 `abc123-def456`）
3. **复制这个 ID**，后面会用到

## 3. 配置网站代码

### 编辑文件
打开 `src/app/layout.tsx`，找到 Clarity 脚本部分：

```tsx
<!-- Microsoft Clarity - 访问统计（免费、隐私友好、无Cookie弹窗） -->
<script async src="https://www.clarity.ms/tag/js" data-clarity-id="your-clarity-id"></script>
```

### 替换 ID
将 `your-clarity-id` 替换为您复制的真实 ID：

```tsx
<!-- Microsoft Clarity - 访问统计（免费、隐私友好、无Cookie弹窗） -->
<script async src="https://www.clarity.ms/tag/js" data-clarity-id="abc123-def456"></script>
```

### 部署
1. 保存修改
2. 运行 `npm run build` 生成静态文件
3. 部署 `out/` 目录到生产环境（华为云等）

## 4. 查看统计数据

### 登入 Clarity
1. 返回 <https://clarity.microsoft.com> 登录
2. 点击您创建的项目 (`chen-genealogy-site`)

### 可查看的报表
| 报表类型 | 包含内容 |
|----------|----------|
| **概览** | 今日/昨日访问人数、页面浏览量、新旧访客比例 |
| **热力图** | 访客点击最多的区域、滚动深度 |
| **会话录制** | 真实访客的浏览器录制视频（可看到他们操作的全过程） |
| **流量来源** | 访客来自搜索引擎、直接访问、社交媒体等 |
| **设备/浏览器** | 使用的设备类型、浏览器版本、操作系统 |

### 数据延迟
- 启用后 **1-5 分钟**开始有数据
- 完整报表需要 **24 小时**左右填充完整

## 5. 常见问题

### Q1：数据为什么显示为 0？
- 检查 `data-clarity-id` 是否正确替换
- 确认网站已部署（非本地 `localhost` 环境）
- 等待 10-15 分钟后刷新 Clarity 页面

### Q2：隐私合规问题？
- Clarity 默认**不**收集 IP 地址（取决于地区设置）
- 网站无需弹出 Cookie 同意框
- 符合 GDPR 基本要求

### Q3：只统计某个谱系？
- Clarity 会统计**所有**访客（无论陈氏/赵氏/王氏）
- 如果需要每个谱独立计数，需要在脚本中传递自定义参数（高级功能）

## 6. 成本与限制

| 项目 | 说明 |
|------|------|
| **价格** | 完全免费，无限流量 |
| **数据保留** | 通常保留 1 年（确认 Microsoft 官方政策） |
| **采样** | 大流量网站可能有采样（本项目流量较小，基本无采样） |
| **并发** | 支持同时千人在线，无性能影响 |

## 7. 备用方案

如果以后需要**更多功能**或**完全自托管**：

- **Umami**：自托管轻量分析（需要在华为云 ECS 上部署 Docker）
- **Matomo**：功能最强大的开源统计（自托管，数据完全归你所有）
- **百度统计**：国内方案（需要备案，报表符合中文习惯）

---
*文档生成时间：2026-09-03*
*项目：JiaPu_Web - 多谱家谱网站*