import type { RouteNode } from '../data.ts';

// ─────────────────────────────────────────────────────────────────────────────
// 个人资料：只改这个文件就能换成自己的内容。
// 图形（首页主视觉、个人图版）都是实时绘制的，不需要照片。
// 作品预览图默认用 game/ 下的占位图，正式发布前换成自己的截图。
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
 name: { lines: ['G', 'CH'], cn: 'GCH', latin: 'GCH' },
 role: '设计与前端', roleEn: 'DESIGN / FRONT-END',
 location: '上海 · SHANGHAI', since: 2019,
 tagline: '在印刷、网格与代码之间，<br>做可以被翻动的界面。',
 taglineEn: 'BETWEEN PRINT, GRID AND CODE',
 quote: '好的界面，像一张刚刚套准的印张。',
 bio: '做设计与前端之间那条缝里的活：把抽象的结构落成能跑、能看、能讲清楚的东西。喜欢从印刷品、图纸和老海报里找秩序，再把它改写成可以被拖动、被点亮、被拆开的网页。日常使用 TypeScript、Three.js 与 Figma。',
 facts: [
  { label: '经验', en: 'EXPERIENCE', value: '6 年' },
  { label: '方向', en: 'FOCUS', value: '平面 · 交互 · 前端' },
  { label: '工具', en: 'TOOLS', value: 'TS · Three.js · Figma' }
 ],
 years: 6,
 // 个人图版外圈那行旋转文字：网名 + 方向，循环三圈。
 orbit: 'CANLIU · RESIDUAL V MAP1E · DESIGN / FRONT-END · 平面 · 交互 · 前端 · ',
 // 个人图版：图形 先锋(旗)/近卫(剑)/重装(盾)/狙击(准星)，stars 1–6。
 plateRole: '狙击', plateStars: 5, accent: '#2B4BD8',
 resume: '#',
 contact: {
  email: 'hello@gch.studio',
  links: [
   { label: 'GitHub', url: 'https://github.com/' },
   { label: '即刻', url: 'https://web.okjike.com/' },
   { label: '邮件', url: 'mailto:hello@gch.studio' }
  ]
 }
};

const work = (id: string, code: string, kind: RouteNode['kind'], x: number, y: number, title: string, en: string, meta: string, description: string, preview: string, tags: string[], label?: string): RouteNode =>
 ({ id, code, kind, x, y, title, en, meta, description, preview: `game/${preview}.webp`, tags, link: '#', label });

// 作品集：主项目在轴上，实验在上方分支，写作在下方。
export const works: RouteNode[] = [
 work('wk-01', 'WK-01', 'operation', 66, 60, '开印 · 个人网站', 'THE PRINT RUN', '2026 · 设计 / 开发', '以印刷套准为开场语言的个人站：纸张、钴蓝印版、网点与版心线，全部矢量实时绘制。', 'stage-01', ['Three.js', 'Canvas', '动效'], 'PROJECT'),
 work('wk-02', 'WK-02', 'operation', 116, 60, '城市噪声地图', 'CITY OF NOISE', '2025 · 数据可视化', '用一年的环境噪声数据生成可缩放的城市剖面，按小时回放城市的呼吸。', 'stage-03', ['D3', '数据', 'WebGL'], 'PROJECT'),
 work('nt-01', 'NOTE-01', 'tutorial', 141, 82, '写给设计师的 Canvas 笔记', 'NOTES ON CANVAS', '2025 · 文章', '一组关于离屏画布、逐帧动画与性能的写作，附可交互示例。', 'stage-tr01', ['写作', '教程'], 'NOTE'),
 work('wk-03', 'WK-03', 'operation', 166, 60, '展览导览系统', 'EXHIBITION GUIDE', '2024 · 交互设计', '为一次影像展设计的移动端导览：展品识别、路线推荐与离线缓存。', 'stage-05', ['移动端', '展览'], 'PROJECT'),
 work('wk-04', 'WK-04', 'operation', 216, 60, '品牌动态规范', 'MOTION GUIDELINES', '2024 · 动效设计', '为一个消费品牌建立动效语言：节奏、缓动曲线、转场与组件动效库。', 'stage-06', ['品牌', '规范'], 'PROJECT'),
 work('lab-01', 'LAB-01', 'story', 248, 38, '手势画布', 'GESTURE CANVAS', '实验 · 2025', '用摄像头追踪手势，在画布上留下会消散的线条。', 'stage-ex02', ['实验', '手势'], 'LAB'),
 work('lab-02', 'LAB-02', 'story', 290, 24, '字母的形变', 'LETTER MORPH', '实验 · 2024', '衬线字母之间的插值与翻转，一个字体动效小工具。', 'stage-ex04', ['字体', '实验'], 'LAB'),
 work('lab-03', 'LAB-03', 'story', 332, 38, '声音的形状', 'SHAPE OF SOUND', '实验 · 2023', '把音频频谱映射成可拖动的三维地形。', 'stage-ex06', ['音频', 'Three.js'], 'LAB'),
 work('wk-05', 'WK-05', 'operation', 364, 60, '在线课程平台', 'LEARNING PLATFORM', '2023 · 产品设计', '从信息架构到界面组件的完整改版，课程完课率提升 18%（示例数据）。', 'stage-08', ['产品', '设计系统'], 'PROJECT'),
 work('wk-06', 'WK-06', 'operation', 414, 60, '独立游戏 UI', 'INDIE GAME UI', '2022 · 界面设计', '为一款叙事解谜游戏设计主菜单、存档与道具界面。', 'stage-10', ['游戏', 'UI'], 'PROJECT'),
 work('next', 'NEXT', 'special', 470, 60, '下一个项目', 'YOUR PROJECT HERE', '期待合作', '这里留给下一段合作。点「功能」，在最后一页找到联系方式。', 'stage-s01', ['合作'], 'NEXT')
];
export const WORKS_WIDTH = 540;
export const workLinks: [string, string][] = [['wk-02', 'nt-01'], ['nt-01', 'wk-03'], ['wk-04', 'lab-01'], ['lab-01', 'lab-02'], ['lab-02', 'lab-03'], ['lab-03', 'wk-05']];

// 留言墙：每一只羽兽带一条留言；name 是留言内容，en 是署名与时间。
export const skills = [
 { name: '第一版比现在好看多了，你要不要看看', en: '匿名 · 2026.10.12', level: 5 },
 { name: '这个开场我能看十遍', en: '阿茶 · 2026.10.08', level: 5 },
 { name: '想要一个能拖的地图，这个就很好', en: 'Lin · 2026.09.28', level: 4 },
 { name: '求一套配色，钴蓝那个', en: '夜航 · 2026.09.20', level: 4 },
 { name: '做设计的还写前端，厉害', en: '小满 · 2026.09.11', level: 5 },
 { name: '页面很安静，但东西都在动', en: 'K. · 2026.08.30', level: 4 },
 { name: '什么时候出第二版', en: '路过 · 2026.08.19', level: 3 },
 { name: '在你的站里学到了留白', en: 'Yin · 2026.08.02', level: 4 }
];


// 隐藏页：集齐 canliu 六个字母后打开。
export const secret = {
 word: 'canliu',
 note: '六个字母散在站里 · 集齐就打开这一页。',
 links: [
  { label: 'Steam', value: 'steamcommunity.com/id/canliu', url: 'https://steamcommunity.com/' },
  { label: 'GitHub', value: 'github.com/canliu', url: 'https://github.com/' },
  { label: '哔哩哔哩', value: 'space.bilibili.com', url: 'https://space.bilibili.com/' },
  { label: '写信', value: 'hello@gch.studio', url: 'mailto:hello@gch.studio' }
 ]
};
