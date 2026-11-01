# GCH · 个人网站

作品集 / 个人介绍 / 留言 / 功能 四个栏目，图形全部代码实时绘制，**不含 BGM**。

## 跑起来

```bash
cd site
npm run dev        # 开发，http://127.0.0.1:5173/personal.html
npm run build      # 产出 dist/
```

已构建的版本在 `site/dist/`，任意静态服务器指向该目录即可。

## 改内容只有一个文件

`src/site/profile.ts`

| 字段 | 控制什么 |
|---|---|
| `name` | 页面上的姓名（`lines` 是两行大字，`cn` 是中文名，`latin` 是拉丁字母） |
| `role` / `roleEn` | 职业与英文职业 |
| `tagline` / `quote` / `bio` | 首页标语、个人页引言与简介 |
| `facts` | 个人页三个要点（经验 / 方向 / 工具） |
| `plateRole` / `plateStars` / `accent` | 个人图版的图形（先锋/近卫/重装/狙击）、星级、强调色 |
| `contact` | 邮箱与社交链接 |
| `works` | 作品集的节点：编号、坐标、标题、英文名、年份、描述、预览图、标签、`link`（查看项目）、`repo`（开源仓库，有就多出一个按钮）、`goto`（不跳外链，改成把地图滑到某个节点，例如 `'next'`） |

## 素材

- 图形（圆环、图版、羽兽、手、圣堂）全部是代码实时绘制的矢量，不依赖图片。
- `stage-*` 里有一批是自己的项目素材：`myweb` / `comfy` / `graphrag` / `match` / `blackjack` / `spotlight` / `iwatch` / `web01` / `PPO`。做法都一样——从 `个人网站/项目/` 的原图转成 1600×840 的 webp：截图直接缩放进框，比例不对的补白边（留 34px，取图边缘色当底色），ComfyPortal 只有字标就排成品牌卡，21 点那张是 SVG 封面用无头浏览器渲染后横裁 40px，`web01` 是直接无头截的 `canliuweb.cc.cd`。
- 长标题想控制断行，可以在 `works` 的标题里写 `\n`（面板 `h3` 设了 `white-space:pre-line`）；不要写 `<br>`，标题还会进 `alt` 和 `aria-label`。
- 其余 `public/assets/game/` 下仍是参考项目的占位素材（地图长卷、碎片、界面框）。**这些是游戏截图，正式发布前必须换掉**，否则既不对题也有版权问题。
- 参考项目里的 BGM 已在个人站入口中不存在，无需额外删除。

## 还没做的

1. 作品预览图仍是占位（`public/assets/game/*.webp`）。
3. 「功能」页的学习笔记目前是本地数据，没有搜索后端；题量再多可以按章节拆文件、懒加载。

## 功能页：React 实验台 + 个人学习笔记

这一页真的装了 React 19（`@vitejs/plugin-react` 5.x，配合 Vite 7），但不影响首屏：只是一个挂在 `#lab-root` 上的岛，进页时才 `import('../lab/mount.tsx')`。

| 文件 | 管什么 |
|---|---|
| `src/lab/Lab.tsx` | 页面布局 + 终端组件（useState / useRef / useEffect，带快捷命令 chips），卡片壳统一标 `REACT` 角标和 hook 标签 |
| `src/lab/knowledge.ts` | 笔记数据，6 章 44 题（全栈 / AI Agent / 计算机基础 / React / 算法 / 工程实践）。往 `CHAPTERS` 里加 `{tag, q, a}`，题数和分类标签会自动更新 |
| `src/lab/lab.css` | 只服务这一页；配色全部复用全局 `--cobalt / --ink / --mono / --cn-serif` |
| `src/lab/mount.tsx` | `createRoot` 挂载入口 |

加一个新的实验组件：在 `Lab.tsx` 写一个函数组件，用 `<Card code="REACT · 03" title="..." hooks={['useState']}>` 包住，再放进 `.lab-left` 就行。卡头的 `REACT` 角标和 hook 标签就是「标注」，不用另外写说明。

版式上左列是实验台、右列是手风琴笔记：右列 `overflow:auto` 自己滚，点标题用 `grid-template-rows: 0fr → 1fr` 展开（不用算高度，内容再长也能撑开）。窄屏（<1150px）收起左列只留笔记；矮屏（<780px）压缩页头与面板间距。

## 首页圆盘 = 实时时钟

蓝盘保持原来的尺寸（r=236），时钟是**叠在它上面的一层透明钟面**——刻度、数字、指针都只画线，盘面本身不动，半调网点照样透出来。

- 刻度贴在盘沿内侧（r=228，整点 4.2px、其余 1.3px），12 个衬线数字 44px 绕一圈（r=170），秒弧在数字与刻度之间（r=197，周长 1238）。
- 指针：时针 142 长、分针 202 长、秒针 222 长（白色细线 + 首尾红点），分针尖正好够到刻度圈。
- 盘沿外还有 12 根墨色索引短线（r=238→262，3/6/9/12 加粗），把表的轮廓推到蓝盘之外一点；再往外就是纸面和拼贴了。
- 中心两行：`CANLIU · RESIDUAL V MAP1E` 与时间读数（纯白 `13:17:54 · 10.29`；这行加了 `stroke:none`，否则会被外层描边压成灰字）。
- 盘外那圈旋转文字（`GCH DESIGN · MADE IN 2026 · CANLIU · RESIDUAL V MAP1E · DESIGN / FRONT-END`）由 `main.ts` 的 `fitOrbit()` 运行时量长度：只铺到圆周的 70%（252°），末尾留 108° 开口，余量用字距均分。改文案不用调参数；想把环合上，把 `fitOrbit` 里的 `.7` 改成 `1`。
- 三个 2D 动态：指针按 `Date` 每 200ms 转一次；秒弧 `stroke-dashoffset` 逐秒生长；当前小时的数字变暖红并沿半径外推 4px。

实现上必须注意的三点：

1. **钟面图层的 `--d` 必须和蓝盘一致（0.6）**。`--d` 决定视差位移，差一点鼠标一动钟表就和圆盘错位。叠放次序由 sheets 数组顺序决定，`--d` 只管深度。
2. **数字方位要用 `((n%12)/12)*TAU - PI/2`**。用 `k/12` 会让 12 落到 11 点的位置，整块表盘偏 30°，很隐蔽但一眼假。
3. **秒针要显式给 `stroke`**。默认只给 fill 的话，1px 级的形状会被抗锯齿吃掉，渲染出来是一条黑线；显式 `stroke:${T.paper};stroke-width:2.2` 才是白针。

鼠标移到「看作品集」这类按钮上时的 `home-scan` 扫描效果仍在；原来的「图纸模式」开关（顶栏网格按钮 / B 键）已经移除。

## 作品集背景的年份

地图背景那层巨大的淡色年份，由 `route.ts` 的 `yearBands()` 画，位置可以手钉也可以自动算：

- **手钉**（现在用的）：`main.ts` 里给 RouteMap 传 `years: [{label:'2024',at:116},{label:'2025',at:290},{label:'2026',at:414,now:true}]`。`at` 是这一章在轴上的起点（单位与节点坐标同一套，1u = 视口高度/100），数字就画在起点右侧 2.4u，段界画一条 `.ry-edge` 虚线。
- **自动**：不传 `years` 时读主轴线节点（`kind` 不是 story / tutorial、`y>=50`）的 `meta` 里的四位年份，同年相邻的并成一段。圣堂/行迹那套地图走的就是这条路。
- `.ry-num` 是 18u 衬线、钴蓝 13% 透明度、基线压在轴线上；`now:true` 的那段后面挂一个小号 `今`。
- 坑：透明不能用父级 `opacity`，否则 `<i>` 的 `今` 会被一起乘到看不见；要用带 alpha 的 `rgba()` 颜色，子元素才能单独加重。

## 作品集详情面板

右侧那块是 `.route-panel`（`graphic.css`）：`width:min(35%,500px)`、`top:1.8%`、`bottom:4.5%`，跟着视口缩放。里面的 `.rp-image` 固定 `aspect-ratio:16/8.4`（预览图就是按这个比例导出的），标题 30px、正文 12.5px/1.95，标签是 `.rp-tags span` 的钴蓝细框小块；底部 `.rp-step` 用 `margin-top:auto` 压在面板底边。

- 面板底色是不透明的 `#f7f8f6`：早先用 94% 透明度，面板一放大，后面的节点和年份字就透上来糊成一片。
- 面板高度是写死的，`overflow:auto` 兜底。文案再长就靠滚动，不会把底部翻页条挤出去。
- 标题里可以写 `\n` 控制换行；如果第一行以冒号结尾（例如「下一个项目：」），会自动降级成小字引题，正文那行才用大字号。
- 描述支持 `<strong>`（`graphic.css` 里给 `.rp-desc strong` 重新打开了 `font-synthesis:weight`，否则 `:root` 的 `font-synthesis:none` 会让中文加粗失效）。

## 首屏文案

大字是模板那套三行错落的 wordmark（原来是 The / Masses' / Travels），现在三行是 `Welcome` / `欢迎来到` / `我的频道`：

- 第一行套 `.home-wordmark span:first-child`（.62em、斜体、略缩进）；后两行加 `.cn`：换成中文衬线、字号 .72em、行高 1.04、字距 .02em——中文在大字号下按拉丁的字距和 .78 行高会糊在一起。缩进分别是 4% / 16%。
- 下面依次是 `— GCH ✦`、一句 tagline、两个按钮；tagline 在 `profile.ts` 的 `tagline` 字段。

## 留言页：数据来自后端

留言不再写死在 `profile.ts`。进页面时 `loadGuestbook()` 拉 `GET /api/messages`，只拿 `status='approved'` 的记录，
每条按 `x/y/rot/scale` 落成蝴蝶，右侧清单同步生成；没有数据时整块图版照画，只在中间留一行「还没有留言」。
接口 404 或断网就显示「留言读取失败」，不会拿假数据顶上。

右上角是**可折叠**的留言清单（默认收起，点标题展开）；右下角是对应的**写留言**折叠面板，
两者共用同一条右边界和 236px 宽。提交走 `POST /api/messages`，成功即进待审，文案提示“审核通过后化作一只蝴蝶”。

接口按 IP 限流：同一个 IP 一小时最多 3 条（`server/src/routes/public.ts` 里的 `rateLimit`），
超了返回 429，前端会把提示语换成“稍后再来”。蜜罐字段 `website` 只对机器人可见，填了会被静默丢弃。

本地开发要同时起后端：`npm run dev`（前端 5173，`/api` 反代到 127.0.0.1:8787）。

## 留言页的蝴蝶

留言页里每一只都是蝴蝶（原来是「羽兽」）。路径 `BFLY` 在 `src/graphics.ts`，由 `bfly-solid.png` 的剪影描出来（单条闭合路径，中心在 (50,30)，高 50），所以它是矢量的，缩放不掉像素。

- 悬停变白、点击放飞、RECALL 召回——都是模板原有的 `.bp-bird` 交互，只换了形状。
- 想在别处复用同一只：直接引 `BFLY`。注意它只替换了留言页，首页图版和拼贴里的鸟仍然是 `BIRD`。

## 动画里的散字

所有过程动画里飘过的字母都从同一套字母库取：`C A N L I U G C H`。

- `src/fx.ts` 的 `LATIN` 常量（文字闪动 `scramble`）
- `markFrame()` 里那三个随机字母（转场贴片）
- `morphGlyph()` 定时变形（`.glyph`，会跳过可采集的 `.key`）
- `src/covenant.ts` 的 `WORDS`（功能页散落的大字，现在是 `RESIDUAL`）

## 集字彩蛋（已实现）

六个字母 **c / a / n / l / i / u** 散在站里，带虚线圈和 "+" 的那几个就是可点的：

| 字母 | 页面 | 位置（1440×900 实测坐标） |
|---|---|---|
| c | 首页 | 左上，x45 y129，竖排页眉下方 |
| a | 首页 | 左下，x78 y694，页脚上方 |
| n | 个人介绍 | 左下，x35 y589，竖排英文边注的下方 |
| l | 个人介绍 | 上方偏中，x325 y117，版心横线右侧的空白 |
| i | 留言 | 左上，x42 y81，标题上方 |
| u | 功能 | 右上，x1273 y121，顶栏图标下方 |

坐标写在 `src/site/main.ts` 的 `GLYPHS` 里（`x`/`y` 是相对舞台的百分比），改完记得重扫一遍：`l` 原来放在个人介绍右上角，正好压在人员图版的 "GCH" 上，读成 "lGCH"，已经挪走。

点一下，字母会飞向顶栏右侧那排 `c a n l i u` 里的对应槽位，槽位由灰变钴蓝、弹一下，页面上那个字母随即消失。**进度不落存储**：刷新页面就清空，六个字母要重新找一遍（和模板原本的行为一致）。集齐六个弹出隐藏页：`canliu` 大字 + Steam / GitHub / B 站 / 邮件四个链接。

集齐之后，顶栏那排字母会变成可点的入口（后面多出一个小字「查看」），关掉隐藏页还能再点开——不用重集一遍。

悬停翻转不位移：`.glyph` 的视差必须写在 `translate` 属性上，不能写在 `transform` 里。写在 `transform` 里时，`rotate: y 180deg` 会把那段位移一起镜像，字母看起来"翻一下就跑了"。

改字母或链接：`src/site/profile.ts` 里的 `secret`（`word` 决定字母，`links` 决定列表）。换字母时同步 `main.ts` 里的 `GLYPHS`——每一项的 `key` 是它在 `secret.word` 里的下标，`ch` 是显示的字。两者不一致会出现"点了没反应"。

个人图版外圈那行旋转文字来自 `profile.orbit`（`plates.ts` 里不再拼死 LATERANO / RHODES ISLAND 那套）。

## 个人介绍页：资料窗口

这一页原来右侧是一整张同心圆图版（`personnelPlate`），和首页那张重复，已经撤掉；改成四扇大一点的「网页窗口」，把资料摊开。

- 结构在 `src/site/main.ts` 的 `opWindows`：`ow(x, y, w, h, i, 编码, 右上角小注, 内容)`，`x/y/w/h` 是相对右侧容器的百分比，`i` 只用来排入场动画的先后。
- 四扇：`PROFILE` 身份卡（头像／驻地／当前状态／别名／邮箱 + 条码）、`DATA` 撕纸施工牌（两半撕开又贴回去的纸，`规划` / `施工中…`，两条胶带；原来的 2×2 数字格保留在 `owStats` 里没删，想换回来改一句 body 即可）、`STACK` 技术标签（主要／开发／协作三组，取自作品集的 tag）、`游玩游戏` 游戏相册（四张斜着的白框照片，默认盖一层蒙版，鼠标移进这扇窗才揭开）。
- 数据都在 `main.ts` 的三个数组里：`owStats`（数字 / 中文标签 / 英文标签，目前未使用）、`owTags`（分组与条目）、`owShots`（图片名/标题/位置/宽度/角度）。`owStats` 里作品数和标签数是实时从 `works` 统计的，加一个项目会自己变；「01 软著」是写死的。
- 相册的蒙版 `.ow-veil` 平时盖住照片（毛玻璃 + 斜线纹，面上不放字），`.op-win:hover` 时淡出；`@media(hover:none)` 下直接不显示，触屏不会有东西挡着。
- 相册图在 `public/assets/game/g-cs2 / g-mc / g-terraria / g-dmc5 .webp`。前三张 640×360（居中裁 16:9）；鬼泣五那张是 4:3（600×450，只裁两侧，保住底部的字幕）。换照片按同样尺寸加文件、改 `owShots` 即可。
- 相册右下角那枚「游戏图标」贴纸是 `public/assets/game/g-icons.webp`：`.ow-sticker` 宽 17%，定位 `right:-10px;bottom:0` 再用 `translate:0 50%` 往下推半个身位，所以正好骑在卡片下边框上（露一半在面板外）；上面盖一条 `.ow-sticker i` 半透明「胶带」（`backdrop-filter:blur(1.6px)` 让下面的图标透出来发虚，再叠 1px 虚线边和投影），悬停时整枚转回 1°。
- 每扇窗 = 白底 + 1px 钴蓝边 + 一行标签条（蓝方块 + 编码 + 右注）+ 一层向右下偏移 7px 的套印副本 `.ow-echo`。**不做旋转**：转过 1° 以上，中文小字会发虚，这是「字看着糊」的真正原因。悬停只上提 3px。
- 高度是写死的 `--h`（45% / 44%），`.ow-card` 用 flex 撑满，`DATA` 的条与 `LOG` 的行用 `space-between` 均分，所以放大后不会出现「上半截内容、下半截空白」。
- 字号全部 `clamp()` 跟视口走（正文 `clamp(13px,.86vw,16.5px)`、标签 `clamp(7.5px,.54vw,9.5px)`）。窗口宽度是百分比，字不跟着放大就会显得框大字小。
- 左栏大标题是中文「个人介绍」（`nameLines(5,'个人介绍')`，样式在 `#op-name.op-name-cn`），下面原来那行 `GCH ★★★★★` 已经删掉。
- `PROFILE` 面板顶部是头像 + 名字：`public/assets/me-cat.webp`（400×400，原图整张缩放、不裁切，`object-fit:contain`）+ `GCH / 残留v枫楪`。换头像只换这个文件即可，方图最稳。
- 引言与自述是数据，改 `src/site/profile.ts` 的 `quote` / `bio`，这一页和别处都不会串。
- 只留极少装饰：左上角黑色小标 `PERSONNEL / 01`（贴在 `PROFILE` 上方，像文件夹标签）、两枚套准十字 `.od-cross`、右边一条竖排小字 `.od-side`。页级 `.crosshair-two` 在这一页关掉了，否则会落在窗口里像个 ＋ 按钮。
- 背景那层连线（`#node-field`，z-index 3）原本盖在窗口上，横穿卡片；`.mode-operators #node-field{z-index:0}` 压回窗口后面。
- ≤760px 直接隐藏这组窗（左栏的名字、自述和按钮仍在），和 `.op-footnote` 的处理一致。

## 本轮删掉的东西

- 首页被圈出的三个堆叠插图：`.hs.spire`（顶部光柱）、`.hs.ruler`（左侧刻度条）、`.hs.column`（右侧文字栏）。
- 页脚右下角的"示例素材 © HYPERGRYPH · 发布前请替换"。
- 页眉左上角的印章图标（`.brand` 里的 `seal`），只留 GCH 字标。
- 首页右下角 `.home-caption`（"上海 · SHANGHAI / 设计与前端 / DESIGN · FRONT-END"）。
- 全站左侧竖排 `.edge-label`（"GCH / SHANGHAI / PORTFOLIO"）。
- 个人介绍页 `.op-stack` 里的 `text-column.webp`——左边缘那列竖排碎片其实是张图，不是文字。
- 作品集 `.route-counter`（左下"已看作品 11 / 26"的黑色块），`countTo` 改成了空值判断。
- 留言页图版右下角的技术读数（ORBITAL DRIFT / LEADING EDGE / FLOCK DENSITY）。

- 作品集：门户按钮、背景地图碎片、区域大字、序列层、迷你窗口——只留横向轴线与节点（规则在 `site.css` 末尾的 `.site .route-*` 那一段，想恢复哪层把对应类名删掉即可）。


## 地图上的节点形状

节点标记不再是统一六边形，按类型分：

- **项目**（`operation` / `story`）：手剪五角星，`route.ts` 里 `star()` 现算 10 个点，外圈再叠一颗错位的 `.hex-echo` 做套印重影。
- **笔记**（`tutorial`）：实心钴蓝书本 + 白描边，卡片左移量为 0（`.kind-tutorial .rn-label`），否则会被卡片盖掉一半。
- **下一格**（`special`）：墨色圆环 + 中心钴蓝点，和星星的实心块面拉开层级。

改形状只需动 `nodeMarkup` 里的 `hex` 分支；`.hex` 这个类名保留着，尺寸/动画/阴影都挂在它上面。
