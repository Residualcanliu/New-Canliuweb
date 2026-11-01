# GCH · 个人网站

个人作品集网站，由首页、作品集、个人介绍、留言、功能五个页面组成。

页面中的图形元素均以 SVG 与 Canvas 实时绘制，位图仅用于项目截图与相册照片。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 构建 | Vite 7 + TypeScript |
| 前端 | 原生 DOM 与 Hash 路由；功能页为 React 19 独立挂载 |
| 后端 | Fastify + better-sqlite3 |
| 样式 | 全局样式、图形样式、页面覆盖三层 |

样式文件分工：

| 文件 | 内容 |
| --- | --- |
| `src/style.css` | 全局变量、舞台布局、顶栏与底栏 |
| `src/graphic.css` | 图版、地图、蝴蝶等图形样式 |
| `src/site/site.css` | 站点的覆盖样式 |

## 页面

### 首页

左侧为标题与入口按钮，右侧为钴蓝圆盘。圆盘叠加钟面层，包含刻度、数字、三根指针与秒弧，随系统时间更新；外围环绕站点信息文字。

### 作品集

横向轴线布局。项目按年份排布为节点，节点形状按类型区分：项目、笔记、后续项目。选中节点后右侧展开详情面板，包含预览图、描述、标签与跳转链接。

### 个人介绍

左侧为姓名与自述，右侧为四组信息窗口：身份卡（头像、驻地、状态、别名、邮箱）、状态卡、技术标签、游戏相册。相册默认覆盖蒙版，悬停后显示照片。

### 留言

每条已审核留言对应一只蝴蝶，位置由后端分配的坐标决定。右上为可折叠的留言清单，右下为提交面板。提交后进入待审状态，审核通过后显示于图版。

### 功能

左侧为命令行组件，支持 `help`、`works`、`contact`、`about`、`credits`、`date`、`clear` 指令。

右侧为学习笔记，按章节分组，支持分类筛选、关键词检索与条目展开。

## 目录结构

```
site/
├─ personal.html            入口页面
├─ src/
│  ├─ site/
│  │  ├─ main.ts            路由、页面模板、交互
│  │  ├─ profile.ts         站点文案与作品数据
│  │  └─ site.css           站点覆盖样式
│  ├─ lab/                  功能页
│  │  ├─ Lab.tsx            命令行组件与页面布局
│  │  ├─ knowledge.ts       笔记数据
│  │  ├─ lab.css            功能页样式
│  │  └─ mount.tsx          挂载入口
│  ├─ graphics.ts           蝴蝶、羽兽、图版等 SVG 生成器
│  ├─ route.ts              作品集地图、节点与详情面板
│  ├─ plates.ts             首页圆盘
│  ├─ fx.ts                 转场、扫描、文字动效
│  ├─ style.css             全局样式
│  └─ graphic.css           图形样式
├─ public/assets/           项目截图、头像、相册照片
├─ scripts/
│  ├─ build-offline.mjs     生成单文件 HTML
│  └─ serve.mjs             本地静态预览
├─ server/                  后端服务
│  ├─ src/
│  │  ├─ server.ts          启动入口
│  │  ├─ app.ts             服务装配、安全响应头、错误处理
│  │  ├─ db.ts              建表与初始化数据
│  │  ├─ auth.ts            密码哈希与会话
│  │  ├─ routes/public.ts   公开接口
│  │  ├─ routes/admin.ts    后台接口
│  │  └─ views/             后台页面（EJS）
│  ├─ seed/notes.json       初始笔记数据
│  └─ test/                 接口测试
└─ docs/                    设计稿与原型
```

## 本地运行

前端：

```bash
npm install
npm run dev            # http://127.0.0.1:5173/personal.html
```

后端：

```bash
cd server
npm install
npm run dev            # http://127.0.0.1:8787
```

前端在 `vite.config.ts` 中将 `/api` 代理至 8787，前后端需分别启动。

构建：

```bash
npm run build          # 输出 dist/
```

## 内容更改处

| 修改目标 | 文件 |
| --- | --- |
| 姓名、职业、标语、简介、邮箱、社交链接 | `src/site/profile.ts` 的 `profile` |
| 作品条目（编号、坐标、标题、描述、标签、外链） | `src/site/profile.ts` 的 `works` |
| 笔记内容 | 后台「笔记」页 |
| 页脚文字、顶栏标识 | `src/site/main.ts` 的模板部分 |
| 蝴蝶路径 | `src/graphics.ts` 的 `BFLY` |

作品标题支持 `\n` 换行，面板标题使用 `white-space: pre-line`。标题同时用于 `alt` 与 `aria-label`，不使用 HTML 标签。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/messages` | 审核通过的留言，含蝴蝶坐标 |
| GET | `/api/notes` | 章节与笔记 |
| POST | `/api/messages` | 提交留言，初始状态为 `pending` |

后台位于 `/admin`，提供留言审核与录入、笔记章节管理、密码修改。

校验与限制：

- 同一 IP 每小时最多提交 3 条，超出返回 429；
- 提交表单包含隐藏的 `website` 字段，填写后请求被静默丢弃；
- 后台登录限制为 5 次 / 15 分钟，密码以 argon2id 存储；
- 写操作校验 CSRF，会话 Cookie 为 HttpOnly + SameSite=Lax；
- 可通过 `ADMIN_IPS` 限制后台访问来源。

## 部署

前端构建产物为静态文件，由静态服务器托管。后端为独立的 Node 服务，默认监听 `127.0.0.1:8787`，与前端通过同域反向代理连接。

数据库为单文件 SQLite，路径由 `DB_PATH` 指定，备份时复制该文件即可。环境变量见 `server/.env.example`。

## 彩蛋

站内分布六个蓝色字母 `c a n l i u`，分别位于首页、个人介绍、留言、功能页。点击后收入顶栏，收集完整可打开隐藏页面。进度不写入存储，刷新后重置。

## 致谢

- 繁星#3377 — 美术指导
- Funkierry — 美术指导
- DeepSeek-V4.1 — 技术指导
- Claude — 框架支持
- GPT-6 Sol — 美术支持
- WorkBuddy — 经费支持

模板参考：[Funkierry/the-masses-travels](https://github.com/Funkierry/the-masses-travels)

## License

[MIT](LICENSE)
