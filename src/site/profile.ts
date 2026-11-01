import type { RouteNode } from '../data.ts';

// ─────────────────────────────────────────────────────────────────────────────
// 个人资料：只改这个文件就能换成自己的内容。
// 图形（首页主视觉、个人图版）都是实时绘制的，不需要照片。
// 作品预览图默认用 game/ 下的占位图，正式发布前换成自己的截图。
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
 name: { lines: ['G', 'CH'], cn: 'GCH', latin: 'GCH' },
 role: '设计与前端', roleEn: 'DESIGN / FRONT-END',
 location: '广东 · GUANGDONG', since: 2026,
 tagline: '亦或是你熟悉的另一个名字<br>Residual v Map1e（canliu）',
 taglineEn: 'BETWEEN PRINT, GRID AND CODE',
 quote: '裹着心的光的人 初衷不换',
 bio: '一个喜欢猫、也有想法的人，欢迎来到我的新个人网站空间，这里记录了我目前所有和正在做的项目和想法。如果你对网站中的项目、想法、甚至网站的设计感兴趣，欢迎一起交流分享。',
 facts: [
  { label: '经验', en: 'EXPERIENCE', value: '6 年' },
  { label: '方向', en: 'FOCUS', value: '平面 · 交互 · 前端' },
  { label: '工具', en: 'TOOLS', value: 'TS · Three.js · Figma' }
 ],
 years: 6,

 orbit: 'CANLIU · RESIDUAL V MAP1E · DESIGN / FRONT-END · 平面 · 交互 · 前端 · ',

 plateRole: '狙击', plateStars: 5, accent: '#2B4BD8',
 resume: '#',
 contact: {
  email: 'gaochaohongmail@foxmail.com',
  links: [
   { label: 'GitHub', url: 'https://github.com/' },
   { label: '即刻', url: 'https://web.okjike.com/' },
   { label: '邮件', url: 'mailto:gaochaohongmail@foxmail.com' }
  ]
 }
};

const work = (id: string, code: string, kind: RouteNode['kind'], x: number, y: number, title: string, en: string, meta: string, description: string, preview: string, tags: string[], label?: string, link?: string, repo?: string, goto?: string): RouteNode =>
 ({ id, code, kind, x, y, title, en, meta, description, preview: `game/${preview}.webp`, tags, link: link ?? '#', repo, goto, label });

// 作品集：主项目在轴上，实验在上方分支，写作在下方。
export const works: RouteNode[] = [
 work('wk-01', 'WK-01', 'operation', 116, 60, '基于 MediaPipe 与多阶段增强的户外手势识别预处理模块', 'OUTDOOR GESTURE PREPROCESSING', '2024 · 计算机视觉', '基于 MediaPipe 与多阶段增强的户外手势识别预处理模块：针对户外复杂场景中常见的<strong>光照不均、背景遮挡、设备震动</strong>等干扰，设计并实现了一套<strong>多阶段强化预处理</strong>策略。作为手势识别系统的核心前置组件，有效提升后续特征提取与分类模型在非受控环境下的鲁棒性。本项目用于毕业设计部分，详细请见<strong>最新项目</strong>。', 'stage-gesture', ['计算机视觉', 'MediaPipe', 'OpenCV', '图像预处理', '鲁棒性优化', '边缘计算'], 'PROJECT', undefined, undefined, 'next'),
 work('nt-01', 'NOTE-01', 'tutorial', 389, 82, '探照灯式工作流 Agent', 'SPOTLIGHT WORKFLOW SKILLS', '2026 · 工作流 / Agent', '一套把「思考 → 执行 → 复盘」编码成可复用技能文件的个人工作流系统：规范模型如何拆解内容、如何复盘，未提及的模块保持粗粒度，避免过度设计。', 'stage-spotlight', ['Agent', '工作流', 'Prompt Engineering', '效率工具'], 'SKILL', 'https://github.com/Residualcanliu/Spotlight-Workflow-skills'),
 work('demo-01', 'DEMO-01', 'operation', 166, 60, '基于PPO的植物大战僵尸\n强化学习AI', 'PvZ Bot Training Demo', '2025 · 机器学习', '一个处于<strong>概念验证阶段（未完成）</strong>的强化学习项目。核心思路是直接读取游戏内存获取结构化状态，通过PPO进行强化学习，将精力聚焦在RL算法本身。', 'stage-PPO', ['强化学习', 'PPO', 'Python', '游戏AI'], 'PROJECT', 'https://github.com/Residualcanliu/PVZ_bot_training_demo'),
 work('wk-02', 'WK-02', 'operation', 216, 60, 'Iwatch-Health 健康管理系统', 'SVM WEARABLE HEALTH MONITOR', '2025 · 机器学习 / 软著', '针对智能穿戴设备设计的、基于<strong>支持向量机（SVM）</strong>的运动—睡眠质量监测与分析模型软件：用特征工程把原始传感数据整理成可判别特征，再交给 SVM 分类。获 <strong>2025 年（第 18 届）中国大学生计算机设计大赛二等奖</strong>，已登记软件著作权（登记号 <strong>2026SR0391421</strong>）。', 'stage-iwatch', ['SVM', '可穿戴设备', '机器学习', '健康监测', '特征工程'], 'PROJECT', 'https://register.ccopyright.com.cn/querySoftCopyright.html'),
 work('web-01', 'WEB-01', 'story', 248, 38, '（旧）个人展示网站', 'CANLIU WEB · NEXT.JS', '2025 · 全栈 / 个人站', '基于 Next.js 构建的个人网站：博客、学习笔记、AstrBot 插件等模块，首页是一颗 <strong>WebGL 实时渲染的黑洞</strong>（光线追踪），代码已开源。', 'stage-web01', ['Next.js', 'React', '个人网站', 'WebGL', 'AstrBot'], 'WEB', 'https://canliuweb.cc.cd', 'https://github.com/Residualcanliu/canliu-Personal-website-next'),
 work('match-03', 'MATCH-03', 'story', 332, 38, '企业融资风险中控', 'FINANCIAL RISK CONTROL', '2026 · 竞赛 / 智能体', '基于智谱 AI 的企业融资风险中控服务软件：集成自然语言对话、合规性检测、情感评估与行为预测，Python + PyQt 桌面端，分析结果可导出 PDF 报告。获 <strong>2026 年（第 19 届）中国大学生计算机设计大赛二等奖</strong>。', 'stage-match', ['智能体', '大模型', 'PyQt', '合规风控'], 'MATCH', 'https://github.com/Residualcanliu/Personal-demo2'),
 work('wk-03', 'WK-03', 'operation', 310, 60, 'AI 21 点竞技场', 'OLLAMA BLACKJACK ARENA', '2026 · 本地 LLM / 游戏 AI', '自主设计本地大模型在 21 点游戏中互相对战的模型竞技场：轮流坐庄、盲注对赌、交替要牌，所有下注与要牌决策均由 <strong>Ollama 模型实时生成</strong>，浏览器端可实时观看牌桌与 AI 的思考过程。', 'stage-blackjack', ['Ollama', '本地 LLM', '游戏 AI', '可视化', 'Python'], 'PROJECT', 'https://github.com/Residualcanliu/LocalOllama_Blackjack_Arena/'),
 work('comp-01', 'COMP-01', 'operation', 340, 78, '倒置 LLM 图谱查询', 'INVERTED LLM · GRAPHRAG', '2026 · 企业项目', '面向工业作业知识场景化建模与即时调度的<strong>「倒置 LLM」</strong>架构：大模型只把自然语言翻译成 Cypher，取数与计算交给 <strong>Neo4j</strong>，从推理者降级为翻译器，显著提升查询准确率与灵活性。', 'stage-graphrag', ['企业项目', 'RAG', 'Cypher', 'Neo4j'], 'COMPANY', 'https://github.com/Residualcanliu/inverted-llm-graphrag'),
 work('wk-04', 'WK-04', 'operation', 364, 60, 'ComfyPortal', 'COMFY AI PLATFORM', '2026 · 全栈 / AI', '基于 ComfyUI + Next.js + FastAPI + PostgreSQL + Redis 构建的自用 AI 图像生成平台：<strong>云端控制面与本地计算面分离</strong>，用 Tailscale 组网把本地 GPU 与云端 VPS 连成一张私有网络。', 'stage-comfy', ['ComfyUI', 'Next.js', 'FastAPI', 'Tailscale'], 'PROJECT', 'https://comfyportal.cc.cd', 'https://github.com/Residualcanliu/comfy-portal'),
 work('wk-05', 'WK-05', 'operation', 414, 60, '新个人网站', 'THE PRINT RUN', '2026 · 设计 / 开发', '参考明日方舟风格的印刷语言：以<strong>套准</strong>开场，纸张、钴蓝印版、网点与版心线全部矢量实时绘制。', 'stage-myweb', ['Three.js', 'Canvas', '动效'], 'PROJECT', 'personal.html'),
 work('next', 'NEXT', 'special', 470, 60, '下一个项目：\n双路径CNN与轻量ViT融合的轻量化手势识别模型', 'CVIT · LIGHTWEIGHT GESTURE MODEL', '2026 · 轻量化模型', 'CVIT（CNN-Vision Transformer）是一个面向嵌入式设备的轻量化手势识别模型：针对算力受限、存储紧张等硬件约束，以及户外光照不均、遮挡等干扰，提出<strong>双路径深度可分离 CNN + 轻量化视觉 Transformer</strong> 的融合架构。当前实测在 <strong>0.17M 参数</strong>、<strong>0.044 GFLOPs</strong>、<strong>0.65 MB</strong> 的极致轻量条件下，4 类手势准确率 <strong>92.07%</strong>（5 折）、10 类 <strong>88.22%</strong>（5 折）。目前在推进侧端部署测试。', 'stage-cvit', ['Python', 'PyTorch', '轻量化模型', 'CNN + ViT', '端侧部署'], '毕业设计')
];
export const WORKS_WIDTH = 540;
export const workLinks: [string, string][] = [['wk-02', 'web-01'], ['web-01', 'match-03'], ['match-03', 'wk-04'], ['wk-04', 'nt-01'], ['nt-01', 'wk-05']];

// 留言墙的数据不再写在这里：全部由后端 /api/messages 提供（后台审核通过才出现）。


// 隐藏页：集齐 canliu 六个字母后打开。
export const secret = {
 word: 'canliu',
 note: '六个字母散在站里 · 集齐就打开这一页。',
 links: [
  { label: 'Steam', value: 'steamcommunity.com/profiles/76561198867504448/', url: 'https://steamcommunity.com/profiles/76561198867504448/' },
  { label: 'GitHub', value: 'github.com/Residualcanliu', url: 'https://github.com/Residualcanliu' },
  { label: '哔哩哔哩', value: 'space.bilibili.com/280596044', url: 'https://space.bilibili.com/280596044' },
  { label: '写信', value: 'gaochaohongmail@foxmail.com', url: 'mailto:gaochaohongmail@foxmail.com' }
 ]
};
