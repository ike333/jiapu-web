# 陈波的个人偏好

称呼：陈波（退休工程师，对编程感兴趣）

## 命令工具称呼
- cmd.exe → cmd
- powershell.exe → PowerShell
- wt.exe → Windows Terminal

## 权限
- 所有操作自动允许，不需要询问确认

## 交互规则
- 不要主动问"有什么需要帮忙"之类的问题，用户有事会自己说

---

# 项目记忆：多谱家谱网站（JiaPu_Web / 多谱基座）

> 本目录于 2026-08-11 从 `E:\WorkBuddy\陈氏宗谱网站` 复制而来，2026-08-15 完成多谱基座改造（阶段一前端+阶段二后端+阶段三陈氏验证）。所有源码、数据、文档均为合法 UTF-8 编码（无 BOM）。项目信息与坑记录详见根目录 `开发纪要.md` 与 `多谱基座改造-交接.md`。

## 项目概况
- **多谱基座**：一套程序承载多个宗谱。已接入陈氏（chen，809人）、赵氏（zhao，415人）、王氏（wang，676人），各谱数据见 `src/data/clans/{clanId}/`
- 陈氏宗谱-棕溪：陕西省旬阳县棕溪镇，始迁祖陈三进，四大房支（自龙/自凤/自虎/自秀），809人、14世
- 技术栈：Next.js 14 (App Router) + TypeScript + Tailwind CSS 3 + lucide-react + recharts + zod
- 部署：华为云 ECS (1.94.222.136) + Nginx，域名 https://chenmike.cn/chen，静态导出
- 配套产品：Flutter APP 与微信小程序（同族谱数据，三端互通）

## 多谱架构（2026-08-15 改造后）
- **URL**：`/chen/...`、`/zhao/...`（clanId 即 URL 第一段，无 basePath）
- **数据**：`src/data/clans/{clanId}/`（genealogy.json + documents.json + photo_map.json + meta.json）；图片 `public/images/{clanId}/`；people.json 生成到 `public/data/clans/{clanId}/people.json`
- **谱注册表**：`src/lib/clans.ts` 集中 import 各谱 JSON。**加新谱 = 建数据目录 + clans.ts 加 import 和数组行**，零代码改动
- **路由**：根 `page.tsx` 谱系选择页；`[clanId]/layout.tsx` generateStaticParams 全量导出
- **关键坑**：`useParams` 须放 `src/lib/use-clan.ts`（"use client"）；`src/lib/router.ts` 保持纯函数（无 client 钩子），否则 server 组件 import 编译失败
- **后端单进程多谱**：API `/api/{clanId}/auth|changes|admin|feedback|zmf|photos`；DB 的 users(UNIQUE(phone,clan))/changes/feedbacks/photos 带 clan 字段；token 带 clan 声明，跨谱访问 401
- **照片 C 方案（全托管后端）**：照片存 `backend/uploads/{clanId}/`（系统命名 `{姓名}.jpg`/`{姓名}O.jpg`，重名后缀由系统按 person 规范名自动加）；photos 表记录归属；`GET /api/{clanId}/photos` 公开返回全谱 map，`POST` 上传（登录用户仅传自己，admin 任意，入口上限≤10MB，**超 1MB 的照片由后端 `image_utils.compress_image` 用 Pillow 自动压缩到 ~900KB（转 JPEG），用户无需手动压缩**），`DELETE`（admin）；**换照片自动留底**：上传时若该 person+slot 已有旧图，按 photos 表当前 filename 移入 `backend/uploads/{clanId}/prev/` 文件 + 写入 `photos_history` 表，`GET /api/{clanId}/photos/history?person_name=&slot=` 公开查询历史（**注意按当前 filename 抓旧图，不是新算的文件名，后缀 .jpg/.jpeg 可能不同**）；前端 person 页 client fetch 渲染 + 两槽位上传 UI；旧照片用 `scripts/seed_photos.py` 迁移（幂等）；**生产 Nginx 需加 `location /uploads/ { proxy_pass http://127.0.0.1:8000; }` + `client_max_body_size 10m;`（否则 >1MB 照片报 413）**

## 关键配置
- `next.config.js`：`output: 'export'`（纯静态导出）、**无 basePath**（多谱基座，clanId 即 URL 第一段）、`images.unoptimized: true`
- 开发 `next dev` 即可访问 `/chen`、`/zhao`；生产 Nginx root 挂整站 out（`chenmike.cn` → out 根，`/chen/...` 由目录提供）
- `.npmrc`：npmmirror 镜像（registry=https://registry.npmmirror.com）
- `postcss.config.js`/`tailwind.config.js` 必须用 `.js`（CommonJS），不能用 `.ts`（ESM），否则 Next.js 无法读取
- `globals.css` 不能用 `@import url()`（PostCSS 会白屏），Google Fonts 用 `layout.tsx` 的 `<link>` 加载
- 自定义 Tailwind 色：`primary`（#1565C0 蓝）、`accent-gold`（#C9A84C）

## 目录结构
| 路径 | 说明 |
|---|---|
| `src/app/` | 根 `page.tsx` 谱系选择页；`[clanId]/` 下全部 12 页（首页/家谱树/人物/搜索/统计/文献/关于/帮助/登录/提交/我的记录/管理后台/反馈） |
| `src/app/[clanId]/layout.tsx` | 谱布局 + generateStaticParams 全量导出 |
| `src/components/` | Navbar.tsx（pathname 推导 clanId，链接带前缀）、Footer.tsx（client 按谱显示）、TreeView.tsx、ZmfButton.tsx（useClanId）、person/PhotoLightbox.tsx |
| `src/lib/` | clans.ts（谱注册表）、data.ts（多谱数据访问层）、types.ts、validation.ts、api.ts（多谱 API 客户端）、router.ts（纯函数）、use-clan.ts（useClanId，必须 "use client"） |
| `src/data/clans/chen/` | 陈氏数据：genealogy.json + documents.json + photo_map.json + meta.json |
| `backend/` | FastAPI 后端（main.py + routers/{auth,changes,admin,feedback,zmf}.py + auth.py + db.py + identity.py），SQLite 数据库 data/genealogy.db；数据 `backend/data/clans/{clanId}/genealogy.json` |
| `public/images/chen/` | 陈氏 53 张人物照片 + logo.png + miniprogram-code.png |
| `public/data/clans/chen/people.json` | 生成脚本产物（展平人物数据，客户端用） |
| `prisma/schema.prisma` | 预留 SQLite Schema（Person/Document/Photo/EditLog），当前未启用 |
| `scripts/generate_people_data.py` | 按 clan 生成 people.json 到 `public/data/clans/{clanId}/people.json` |
| `scripts/export_changes_shixi.py` | 把审核通过的 changes 转成 世系表.txt 风格（--apply 才写母本，自动备份 .bak） |

## 认证与变更记录模块（2026-08-11 新增，2026-08-15 多谱化）
- 架构：静态站（Next.js 导出）+ 独立 FastAPI 后端（Python 3.12，SQLite）
- 后端启动：`cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000`
- 前端开发环境需 `.env.local` 设 `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000`（生产走 Nginx 反代 `/api` → 8000，同源免 CORS）
- 数据库：`users`（role: user/admin，**UNIQUE(phone,clan)**）、`sms_codes`（验证码）、`changes`（**带 clan**）、`feedbacks`（**带 clan**）
- 管理员入口为**密码登录**：`POST /api/{clanId}/auth/admin-login` 校验环境变量 `ADMIN_PASSWORD`（默认 admin123456，生产必改），token 的 sub 为 "admin"（虚拟用户，不在 users 表），`auth.py` 的 `resolve_user()` 统一解析
- **多谱 token**：JWT 带 `clan` 声明；`auth.token_clan()` 取谱；跨谱访问（如 chen token 访问 zhao API）→ 401。前端 token 按谱隔离存 localStorage（key=`${clanId}_genealogy_token`）
- 短信验证码目前为模拟（send_sms_code 直接返回 dev_code，前端自动填入），接入真实短信服务商后改 auth.py 中 `SMS_ENABLED=1` 分支
- **注册身份校验制**：注册须填「姓名+父亲姓名+母亲姓名」，与 `backend/data/clans/{clanId}/genealogy.json`（`src/data/clans/{clanId}/genealogy.json` 的副本）比对，通过 `backend/identity.py` 校验（`verify_person(clanId, ...)`）。规则：①姓名须精确存在于族谱，找不到再去字母后缀回退；②父亲须匹配族谱父子关系（支持去后缀回退）；③母亲姓须命中父亲节点 detail 中某配偶之"姓"（"宋氏"→宋、"王莉"→王），父亲无配偶记录时跳过。**重要**：族谱用 A/B/C 后缀区分同名兄弟（陈安治 vs 陈安治C），不能简单去后缀归一，否则同名词索引父子错配。族谱数据更新后必须重新复制到 backend/data/clans/{clanId}/
- API 列表（带谱前缀）：`/api/{clanId}/auth/{send-code,register,login,code-login,admin-login,me}`、`/api/{clanId}/changes/{birth,marriage,death,mine}`、`/api/{clanId}/admin/{pending,review/{id},stats,export/{pending,generate,mark}}`、`/api/{clanId}/feedback/{,mine,list,reply/{id}}`、`/api/{clanId}/zmf/ticket`、`/api/{clanId}/photos`（GET/POST/DELETE）
- FastAPI 中 authorization 参数必须声明为 `Header(None)`，否则被当作 query 参数导致 401
- 审核通过后仅状态变化，未自动写入 genealogy.json；可用 `scripts/export_changes_shixi.py` 把审核通过的变动转成世系表.txt 风格（--apply 才写入母本，注意母本只读需先取消），或管理后台「整理变动」页生成
- **整理人员变动（2026-09-05 新增）**：管理后台「整理变动」页签一键把已审核变动渲染为世系表风格文本。后端 `GET /api/{clanId}/admin/export/pending`（未整理清单）、`POST /api/{clanId}/admin/export/generate`（渲染文本，不落库）、`POST /api/{clanId}/admin/export/mark`（标记 `exported_at` 防重复）。changes 表新增 `exported_at` 列（db.py `_migrate` 自动添加，已部署）。生成逻辑在 `backend/shixi_export.py`（`changes_to_text`），`scripts/export_changes_shixi.py` 的 gen_birth/gen_marriage/gen_death/fmt_birth_line 已改为 import 自该模块（防漂移）。生产流程：管理后台生成预览 → 核对后并入母本 → 点「标记已处理」
- 世系表.txt 为 GBK 编码、人名省略"陈"姓前缀（崇斌）、按"第N代：X"标题分区块；people.json ← genealogy.json ← 世系表.txt
- **各家素材库**：`material/{clanId}/` 收纳各家原始素材（陈氏：`material/chen/` 世系表.txt 母本+整理稿；赵氏：`material/zhao/` 赵氏谱-整理稿.md、赵氏整理01.md、赵氏谱-整理草稿.md、赵氏谱-新整理.md、赵氏宗谱.md、赵氏重名查证清单.md、zhao_pdf_pages/）。build_zhao_genealogy.py 与 export_changes_shixi.py 的读写路径均指向 material/ 下

## 数据层要点（src/lib/data.ts）
- 当前数据源为 JSON（`@/data/clans/*.json`），已用 zod 在 dev 模式校验
- 页面不直接读 JSON，统一走 data.ts 的 API（未来切 Prisma 只改这一个文件）
- 树展平生成 `p_0, p_1, ...` 递增 id；branch 按 meta.branchGen 分房支（陈氏=2，赵氏=3）；stripPrefix（陈氏="陈"）参数化
- 配偶名从 detail 文本 `/妻([^，。,\r\n]+?)(?:，|。|$|[\r\n])/` 提取
- 人物照片路径：`makeImagePath(clanId, rawPath)` → `/images/{clanId}/xxx`（见 router.ts）

## 部署流程（详见开发纪要.md 第九章）
1. `npm run build`（含静态导出，产物在 `out/`）
2. 打包 out.zip → 华为云 CloudShell 上传 → 解压到 `/var/www/chen-zongpu/`（先 `rm -rf *`）
3. 验证：`curl -sI http://chenmike.cn/_next/static/css/xxx.css` 应为 200
4. 曾踩坑：漏传 `_next/` 目录导致样式全丢；SSH 偶被拒用 CloudShell 替代
5. 认证/变更记录模块上线时：服务器需安装 Python3 + FastAPI，`systemd`/`nohup` 启动 uvicorn，Nginx 加 `location /api/ { proxy_pass http://127.0.0.1:8000; }`；照片模块另加 `location /uploads/ { proxy_pass http://127.0.0.1:8000; }` 并上传 `backend/uploads/` 或跑 `seed_photos.py`

## 反爬方案 A（2026-09-05 实施，生产已生效）
- **http 级**（`/etc/nginx/conf.d/anti-crawl.conf`）：`limit_req_zone ... zone=general:50m rate=10r/s`（全局 10req/s + burst50）；`zone=datadl:50m rate=2r/s`（大数据 JSON）；map `$bad_bot` 黑名单（python-requests/scrapy/wget/Go-http-client/Java 等→403），map `$bot_allow` 搜索引擎白名单（Googlebot/Bingbot/Baiduspider/YandexBot/Sogou/360Spider/Bytespider 等，仅供核对使用，server 未实际引用 `$bot_allow`）
- **server 级**（`/etc/nginx/sites-available/chen-zongpu`）：
  - `if ($bad_bot = 1) { return 403; }` 拦截垃圾爬虫 UA
  - `location ~* \.(jpg|jpeg|png|gif|webp|svg)$`：防盗链 `valid_referers none blocked server_names;`（**只写 `server_names` 关键字即可，切勿再展开成 `*.chenmike.cn chenmike.cn`，会报 conflicting parameter**）+ `try_files $uri =404`
  - `location ~ ^/data/clans/[a-z]+/people\.json$`：`limit_req zone=datadl burst=10 nodelay;` 防整包数据一键下载
  - **坑**：`/uploads/`（照片反代）必须用 `location ^~ /uploads/ { valid_referers ...; proxy_pass ...; }`，**不能用普通 `location /uploads/`**——否则会被上面的图片正则 location 抢占，照片返回 404（`^~` 前缀匹配优先于正则）
- 验证方法：`curl -A "python-requests/2.31" https://chenmike.cn/chen` → 403；`curl -A "Googlebot" https://chenmike.cn/chen` → 200；`curl -e "https://evil.com" https://chenmike.cn/images/chen/logo.png` → 403；正常浏览器 UA → 200
- 配置备份在服务器 `/root/chen-zongpu.conf.bak_final_20260905`、`/root/anti-crawl.conf.bak_20260905`

## 常用命令
```powershell
npm install          # 装依赖（npmmirror 镜像）
npm run dev          # 开发 → http://localhost:3000/chen
npm run build        # 生产构建 → out/
npx serve out/       # 本地预览静态产物
cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000   # 启动后端 API
python scripts/generate_people_data.py   # 重新生成 people.json
python scripts/seed_photos.py            # 旧 photo_map 照片 → backend/uploads/ + photos 表（幂等）
python scripts/export_changes_shixi.py   # 审核通过的变更 → 世系表.txt 风格条目（--apply 才写母本）
```

## 文档索引（根目录）
- `开发纪要.md`（428行，最新最全：架构/坑/部署/后续计划）、`开发纪要 - 0.md`（旧版）
- `网站开发对话纪要.md`（166行）、`网站开发对话记录.md`、`网站开发对话原文.md`（历史对话，参考用）
- `网站连接备案/`：chenmike.cn 备案截图、域名证书

## 后续计划（来自开发纪要）
- P0：D3.js 吊线图/世系图可视化；数据管理后台（在线增删改族人）
- P1：数据库迁移（JSON → Prisma+SQLite）；CSV/PDF 导出；照片墙+时间轴
- P2：用户系统；留言板/修谱协作；全文检索
- P3：修谱日志/版本对比；广告接入

## 多多进宝（拼多多 CPS 导购）接入 —— 已落地
- 凭证：开放平台 client_id/secret + PID（陈氏宗谱-棕溪 PID `44682161_317478838`），存 `backend/.env`（`PDD_CLIENT_ID`/`PDD_CLIENT_SECRET`/`PDD_PID`），已被根 `.gitignore` 忽略，切勿提交。
- 后端 `backend/routers/ddk.py`：`GET /api/ddk/goods?keyword=&page=&page_size=`，先 `pdd.ddk.goods.search` 拉商品，再批量 `pdd.ddk.goods.promotion.url.generate`（带 PID）转链，返回 `{items,total,configured}`；`main.py` 已 `include_router(ddk.router)`；`requirements.txt` 加 `python-dotenv`。
- 前端 `[clanId]/mall/page.tsx`（client 组件，运行时 fetch，兼容 `output:'export'`）+ `Navbar.tsx` 加「好物」入口（`ShoppingBag` 图标）；`src/lib/api.ts` 加 `fetchDdkGoods`。
- 签名：标准 MD5（secret+排序拼接+secret，大写）；`timestamp` 用 **Unix 秒字符串** `str(int(datetime.datetime.now().timestamp()))`（实测 `yyyy-MM-dd HH:mm:ss` 字符串会被拼多多拒，报 10001 公共参数错误:timestamp）；`urlencode` 用 `quote_via=quote`（空格→%20，避免 `+` 被误解析）。
- 详细排错全过程、`/api/ddk/authorize`（自助生成 PID 备案链接）用法、华为云生产部署清单见 `docs/多多进宝接入记录.md`。
- 坑：① 运行环境系统时间若被改到未来（如沙箱设 2026）会报 `10001 公共参数错误:timestamp`，需同步 Windows 时间（`w32tm /resync`）；② 开放平台 `client_id` 必须在多多进宝后台绑定为「多多客」（duoId）才能调 ddk 接口，否则报 `50001/20001 非多多客`，需去 jinbao.pinduoduo.com 绑定 client_id 到多多客账号；③ 调用 ddk 接口一般还需传推广位 `p_id`（本项目 PID 已写 `.env`）；④ 推广位 PID 必须「授权备案」一次才能用于 ddk 搜索/转链，否则报 `50001/60001 未传入已经授权备案过的相关参数(pid/custom_parameters)`。备案方式：调用 `pdd.ddk.rp.prom.url.generate`（`p_id_list=[PID]`）生成授权链接，用拼多多 APP/浏览器打开并登录多多客账号授权即完成（一次性，不用 custom_parameters）；换 PID 须重新备案。搜索接口字段名 `pid`、转链接口字段名 `p_id`，转链返回无 `goods_sign` 须按 `goods_sign_list` 顺序 zip 对应。
