import '../style.css';
import '../graphic.css';
import './site.css';
import { assetUrl, resolveMarkupAssets } from '../assets.ts';
import { icon, ring } from '../ui.ts';
import { birdPlate, flock, rng, type BirdSpec } from '../graphics.ts';
import { Reticle, NodeField, scramble, burst, ripple, morphGlyph, countTo, type Burst } from '../fx.ts';
import { homePlate } from '../plates.ts';
import { RouteMap } from '../route.ts';
import { wrap } from '../util.ts';
import { readStored, saveStored } from '../storage.ts';
import type { RouteNode } from '../data.ts';
import { profile as P, works, WORKS_WIDTH, workLinks, secret } from './profile.ts';

// A personal site on the festival template: the same screens, motion and interactions, fed by profile.ts.
type Page='home'|'about'|'works'|'skills'|'contact';
const PAGES:[Page,string,string][]=[['home','首页','HOME'],['works','作品集','WORKS'],['about','个人介绍','ABOUT'],['skills','留言','GUESTBOOK'],['contact','功能','TOOLS']];
// Pages borrow the template's screen styles.
const SKIN:Record<Page,string>={home:'mode-home',about:'mode-operators',works:'mode-records',skills:'mode-atlas',contact:'mode-atlas mode-contact'};
const BURST:Record<Page,Burst>={home:'wipe',about:'mosaic',works:'scan',skills:'scan',contact:'wipe'};
const GLYPHS:Record<Page,{ch:string;x:number;y:number;size:number;depth:number;key?:number;flip?:string}[]>={
 home:[{ch:'c',key:0,x:3.2,y:16,size:96,depth:.6},{ch:'a',key:1,x:5.5,y:86,size:80,depth:.9}],
 about:[{ch:'n',key:2,x:2.5,y:73,size:104,depth:.7},{ch:'l',key:3,x:23,y:13,size:74,depth:1.1}],
 works:[],
 skills:[{ch:'i',key:4,x:3,y:10,size:88,depth:.6}],
 contact:[{ch:'u',key:5,x:90,y:15,size:90,depth:.7}]
};
/* ── 集字彩蛋：canliu，六个字母散在五页，集齐开隐藏页 ── */
const LETTERS=[...secret.word];
const got=new Set<number>();   // 不落存储：每次刷新都重新找
const motion=readStored<boolean>('site-motion',!matchMedia('(prefers-reduced-motion: reduce)').matches)!==false;
let page:Page='home',scanTimer=0,enterTimer=0,active:HTMLElement|null=null,pendingParallax:{x:number;y:number}|null=null,released=new Set<number>();
const accentStyle=`--accent:${P.accent}`;
const app=document.querySelector<HTMLDivElement>('#app')!;
const nameLines=(seed:number,text?:string)=>{const r=rng(seed);let j=0;return (text?[text]:P.name.lines).map((line,i)=>`<span class="name-line line-${i}">${[...line].map(c=>`<span class="ch" style="--dx:${((r()-.5)*260).toFixed(0)}px;--dy:${((r()-.5)*140).toFixed(0)}px;--r:${((r()-.5)*40).toFixed(0)}deg;--sc:${(.6+r()*1.4).toFixed(2)};--j:${j++}">${c}</span>`).join('')}</span>`).join('');};
/* 留言墙：留言全部来自 /api/messages（后台审核通过后才会出现），前端不再写死任何一条。 */
type GuestNote={body:string;en:string;level:number;x:number;y:number;rot:number;scale:number};
let guestNotes:GuestNote[]=[];
let skillBirds=flock(6,0);
let guestState:'idle'|'loading'|'ready'|'error'='idle';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const shortDate=(ts:number)=>{if(!ts)return '';const d=new Date(ts);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;};

/* ── 个人介绍右侧：一组「网页窗口」卡片 ────────────────────────────────────
   首页已经有一张大圆盘，这一页不再重复；资料改成一叠错落的小窗：
   轮廓 / 技能条 / 工具 / 年表 / 自述 / 联系。位置用百分比，改坐标即可挪。 */
const ow=(x:number,y:number,w:number,h:number,i:number,code:string,meta:string,body:string)=>{const cjk=/[\u4e00-\u9fff]/.test(code);return `<article class="op-win" style="--x:${x};--y:${y};--w:${w};--h:${h};--i:${i}"><i class="ow-echo" aria-hidden="true"></i><div class="ow-card"><header><span class="ow-dot"></span><b${cjk?' class="ow-cn"':''}>${code}</b><em>${meta}</em></header><div class="ow-body">${body}</div></div></article>`;};
/* 数据格先撤下（02 现在是撕纸状态）；要回滚就把上面 ow() 里的 body 换回 ow-stats */
const owStats:[string,string,string][]=[
 [String(works.filter(w=>w.kind!=='special').length).padStart(2,'0'),'作品','PROJECTS'],
 ['01','软著','COPYRIGHT'],
 [String(new Set(works.flatMap(w=>w.tags??[])).size),'技术标签','TAGS'],
 ['02','竞赛奖项','AWARDS']
];
const owTags:{k:string;v:string[]}[]=[{k:'主要',v:['Python','Agent','Vibe Coding','大模型','机器学习','RAG']},{k:'开发',v:['ComfyUI','PyTorch','Next.js','FastAPI','Three.js','OpenCV','Ollama']},{k:'协作',v:['Claude','DeepSeek','Git','Vite','Figma']}];
const owShots:{img:string;name:string;x:number;y:number;w:number;r:number}[]=[{img:'g-cs2',name:'CS2',x:5,y:3,w:45,r:-5},{img:'g-mc',name:'MINECRAFT',x:50,y:8,w:44,r:4},{img:'g-terraria',name:'TERRARIA',x:7,y:49,w:45,r:3},{img:'g-dmc5',name:'DMC 5',x:54,y:49,w:37,r:-4}];
// 02：整扇窗被撕成两半再贴回去——两半各放一份完整卡片，用 clip-path 只露一边
const tornXs=[50,48.1,51.9,48.4,51.6,48.1,51.9,48.4,51.6,48.1,51.9,48.4,51.6,48.1,51.9,48.4,51.6,48.1,51.9,48.4,50];
const tornEdge=tornXs.map((x,i)=>`${x}% ${(i*5).toFixed(0)}%`).join(', ');
const tornL=`polygon(0 0, ${tornEdge}, 0 100%)`;
const tornR=`polygon(100% 0, ${tornEdge}, 100% 100%)`;
const tornCard=(code:string,meta:string,body:string)=>`<div class="ow-card"><header><span class="ow-dot"></span><b>${code}</b><em>${meta}</em></header><div class="ow-body">${body}</div></div>`;
const tornBody=`<span class="ow-torn-text l">规划</span><span class="ow-torn-text r">施工中…</span>`;
const tornWin=`<article class="op-win op-win-torn" style="--x:53;--y:0;--w:45;--h:45;--i:1"><div class="ow-tornwrap"><div class="ow-half l" style="clip-path:${tornL}">${tornCard('DATA · 02','WIP',tornBody)}</div><div class="ow-half r" style="clip-path:${tornR}">${tornCard('DATA · 02','WIP',tornBody)}</div><i class="ow-tape t1"></i><i class="ow-tape t2"></i></div></article>`;

const opWindows=[
 ow(0,0,50,45,0,'PROFILE · 01','ID 2026',`<div class="ow-id"><img src="/assets/me-cat.webp" alt="GCH 的头像" width="400" height="400"><div class="ow-id-t"><b>GCH / 残留v枫楪</b><span>${P.roleEn}</span></div></div><i class="ow-rule"></i><dl class="ow-rows"><div><dt>驻地</dt><dd>${P.location}</dd></div><div><dt>当前状态</dt><dd>大四 / 寻找实习、工作中</dd></div><div><dt>ALIAS</dt><dd>RESIDUAL V MAP1E</dd></div><div><dt>MAIL</dt><dd class="ow-lower"><button type="button" class="ow-copy" data-action="copy-mail" title="点击复制邮箱" aria-label="复制邮箱 ${P.contact.email}">${P.contact.email.replace('@','@<wbr>')}<i aria-hidden="true"></i></button></dd></div></dl><i class="ow-barcode" aria-hidden="true"></i>`),
 tornWin,
 ow(2,50,44,44,2,'STACK · 03','TOOLS',`<div class="ow-tags">${owTags.map(g=>`<div class="ow-taggroup"><b>${g.k}</b><div class="ow-chips">${g.v.map(t=>`<span>${t}</span>`).join('')}</div></div>`).join('')}</div><p class="ow-note">目前常用 Claude + DeepSeek 组合。</p>`),
 ow(49,50,49,44,3,'游玩游戏 · 04','PLAY',`<div class="ow-album">${owShots.map(s=>`<figure class="ow-photo" style="--px:${s.x};--py:${s.y};--pw:${s.w};--pr:${s.r}"><img src="/assets/game/${s.img}.webp" alt="${s.name}" loading="lazy"><b>${s.name}</b></figure>`).join('')}</div><span class="ow-veil" aria-hidden="true"></span><span class="ow-sticker"><img src="/assets/game/g-icons.webp" alt="常玩的游戏" loading="lazy"><i aria-hidden="true"></i></span>`)
].join('');


app.innerHTML=resolveMarkupAssets(`
<main id="stage" class="mode-home site" style="${accentStyle}" aria-label="${P.name.cn} 的个人网站">
 <div class="site-backdrop"><img src="/assets/game/map-pano-sky.webp" alt=""></div><div class="world-veil"></div><div id="haze" aria-hidden="true"><i></i><i></i><i></i></div><canvas id="node-field" aria-hidden="true"></canvas><div id="glyphs"></div><div class="paper-grain"></div>
 <div class="crosshair crosshair-one">+</div><div class="crosshair crosshair-two">+</div><div class="edge-ruler" aria-hidden="true">${'<i></i>'.repeat(9)}</div>
 <header class="topbar"><button class="brand" data-action="home" aria-label="返回首页"><span>MADE BY GCH<small>${P.roleEn}</small></span></button><div class="top-context"><span class="live-dot"></span><span id="mode-caption">${P.name.cn} · 个人网站</span></div><div class="word-progress" id="word-progress" aria-label="已收集的字母" title="在各页找蓝色字母，集齐 canliu">${[...secret.word].map((c,i)=>`<span data-letter="${i}">${c}</span>`).join('')}</div><div class="top-tools"><button data-action="contact" aria-label="联系我" title="联系">${icon('info')}</button><button data-action="fullscreen" aria-label="全屏" title="全屏 F">${icon('full')}</button></div></header>

 <section id="home" class="screen home-screen" aria-label="首页">
  <div class="home-geometry">${ring}<span>${P.name.cn}</span></div>
  <div class="home-stack back" aria-hidden="true"><img class="hs rays" src="/assets/game/rays-white.webp" alt=""></div>
  <div class="home-plate plate-host">${homePlate(undefined,String(new Date().getDate()),`GCH DESIGN · MADE IN 2026 · CANLIU · RESIDUAL V MAP1E · DESIGN / FRONT-END · `)}<i class="plate-scanline"></i></div>
  <div class="home-stack front" aria-hidden="true"><img class="hs blade" src="/assets/game/blade-a.webp" alt=""><img class="hs star s1" src="/assets/game/star-blue.webp" alt=""><img class="hs star s2" src="/assets/game/star-blue.webp" alt=""><img class="hs star s3" src="/assets/game/star-blue.webp" alt=""></div>
  <span class="home-stamp" aria-hidden="true">${P.name.lines[0][0]}</span>
  <div class="home-copy"><span class="eyebrow" data-scramble>${P.roleEn}</span><div class="home-wordmark" aria-label="Welcome 欢迎来到我的频道"><span>Welcome</span><span class="cn">欢迎来到</span><span class="cn">我的频道</span></div><div class="title-cn"><span class="hairline"></span><h1>${P.name.cn}</h1><span class="tiny-symbol">✦</span></div><p class="home-quote">${P.tagline}</p><div class="home-actions"><button class="primary" data-action="works" data-scan><span>看作品集</span><small>${works.length} PROJECTS · ${P.since}—</small>${icon('arrow')}</button><button class="text-button" data-action="contact" data-scan>联系 <span>↗</span></button></div></div>
  <nav class="home-dial" aria-label="快速入口">${[['works','作品集','WORKS','route'],['about','个人介绍','ABOUT','info'],['skills','留言','GUESTBOOK','bird']].map(([a,cn,en,ic],i)=>`<button data-action="${a}" data-scan style="--i:${i}"><span class="dial-icon">${icon(ic)}<i></i></span><b>${cn}<small>${en}</small></b></button>`).join('')}</nav>
  <div class="home-side">MOTION. &nbsp; INTERFACE. &nbsp; CODE.</div>
 </section>

 <section id="operators" class="screen hidden" aria-label="个人介绍">
  <div class="operator-grid"></div>
  <div class="op-deco" aria-hidden="true"><span class="od-tag">PERSONNEL / 01</span><i class="od-cross a"></i><i class="od-cross b"></i><span class="od-side">PERSONNEL FILE — 01 / GCH</span></div>
  <div class="op-windows">${opWindows}</div>
  <div class="operator-copy"><div class="operator-kicker"><span>PROFILE</span><i></i><small>${P.location}</small></div><h2 id="op-name" class="op-name-cn">${nameLines(5,'个人介绍')}</h2><p id="op-quote">“${P.quote}”</p><p class="site-bio">${P.bio}</p><div class="op-tools"><button data-action="works" class="line-button solid">看作品集 ${icon('arrow')}</button><button data-action="contact" class="line-button">联系</button>${P.resume!=='#'?`<a class="line-button" href="${P.resume}" target="_blank" rel="noreferrer">简历 ↗</a>`:''}</div></div>
 </section>

 <section id="records" class="screen hidden" aria-label="作品集"></section>

 <section id="atlas" class="screen hidden" aria-label="留言"><div class="atlas-stage" data-plate="0" data-cursor="留言"><div class="atlas-plate p0" id="skill-plate"></div><i class="atlas-scan"></i></div>
  <div class="atlas-head"><span class="eyebrow" data-scramble id="guest-count">GUESTBOOK</span><h2>留言</h2></div>
  <div class="atlas-readout"><small>NOTE</small><b id="skill-name">--</b><div id="skill-spec">正在读取留言<br>请稍候</div></div>
  <div class="atlas-tools"><div class="tools-0" style="display:flex"><button class="line-button" data-action="recall">召回 RECALL</button><span class="atlas-count">已放飞 <b id="skill-count">00</b> / <b id="skill-total">00</b></span></div></div>
  <div class="skill-list" id="skill-list"></div>
 </section>

 <section id="contact" class="screen hidden" aria-label="功能"><div class="lab-root" id="lab-root"></div>
  <div class="atlas-head"><span class="eyebrow" data-scramble>LAB / NOTES</span><h2>功能</h2></div>
 </section>

 <footer class="bottom-bar"><span class="edition">PORTFOLIO <i>${String(new Date().getFullYear()).slice(2)}</i></span><nav aria-label="主导航">${PAGES.map(([m,cn,en],i)=>`<button data-action="${m}" data-nav="${m}" data-cursor="${en}"><small>0${i}</small><span data-scramble>${cn}</span></button>`).join('')}</nav></footer>
 <div id="transition-fx" aria-hidden="true"></div><div id="bloom" aria-hidden="true"></div><div id="ripples" aria-hidden="true"></div><div id="toast" role="status" aria-live="polite"></div>
</main>`);

const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const stage=$('#stage');
/* ── 首页圆盘：实时时钟（时针/分针连续走，秒针整秒跳） ── */
const clockH=document.querySelector<SVGGElement>('.hp-hand-h');
const clockM=document.querySelector<SVGGElement>('.hp-hand-m');
const clockS=document.querySelector<SVGGElement>('.hp-hand-s');
const clockTxt=document.querySelector<SVGTextElement>('.hp-time');
const clockNums=[...document.querySelectorAll<SVGTextElement>('.hp-num')];
const clockRing=document.querySelector<SVGCircleElement>('.hp-sec');
function tickClock(){
 const d=new Date();
 const sec=d.getSeconds(), min=d.getMinutes()+sec/60, hr=(d.getHours()%12)+min/60;
 const set=(el:SVGGElement|null,a:number)=>{if(el)el.setAttribute('transform',`rotate(${a.toFixed(3)} 520 470)`);};
 set(clockH,hr*30);set(clockM,min*6);set(clockS,sec*6);
 if(clockRing)clockRing.style.strokeDashoffset=String((1-(sec+d.getMilliseconds()/1000)/60)*1238);
 const hi=d.getHours()%12||12;clockNums.forEach(n=>n.classList.toggle('on',+(n.dataset.hr??0)===hi));
 if(clockTxt)clockTxt.textContent=`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(sec).padStart(2,'0')}  ·  ${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}
if(clockH){tickClock();setInterval(tickClock,200);}

/* ── 表盘外圈的旋转文字：按长度重复铺在 70% 圆周上，末尾留 108° 开口，环不闭合 ── */
function fitOrbit(){
 const tp=document.querySelector<SVGTextPathElement>('.hp-orbit textPath');
 if(!tp)return;
 const text=tp.parentElement as SVGTextElement|null;
 if(!text)return;
 const legend=tp.dataset.legend||(tp.dataset.legend=tp.textContent||'');
 if(!legend)return;
 const span=2*Math.PI*400*.7; // 70% 排字，30% 留空
 text.style.letterSpacing='0px';tp.textContent=legend;
 const base=tp.getComputedTextLength?tp.getComputedTextLength():0;
 if(!(base>0))return;
 const n=Math.max(1,Math.floor(span/base));
 tp.textContent=legend.repeat(n);
 const count=legend.length*n;
 const ls=Math.max(0,(span-base*n)/Math.max(1,count-1));
 text.style.letterSpacing=ls.toFixed(2)+'px';
 tp.removeAttribute('textLength');
 tp.removeAttribute('lengthAdjust');
}
fitOrbit();
if(document.fonts?.ready)document.fonts.ready.then(fitOrbit);

const reticle=new Reticle(stage),field=new NodeField($<HTMLCanvasElement>('#node-field'));
const visited=new Set<string>(readStored<string[]>('site-visited',[])??[]);

// 标题里写 \n 表示换行；若第一行以冒号结尾，就当成小字引题（如「下一个项目：」）。
function titleMarkup(t:string){
 const [head,...rest]=t.split('\n');
 if(rest.length&&/[:：]$/.test(head))return `<span class="rp-lead">${head}</span>${rest.join(' ')}`;
 return t;
}
// Works: the festival route map with project nodes and a project panel.
function workPanel(n:RouteNode,i:number){
 return `<div class="rp-head"><span class="rp-kind">${n.label??'PROJECT'}</span><span class="rp-code" data-scramble>${n.code}</span><span class="rp-time">${n.meta??''}</span></div>
  <figure class="rp-image stage"><img src="${assetUrl(n.preview??'game/stage-01.webp')}" alt="${n.title} 的预览（占位图）" draggable="false"><b></b><b></b><b></b><b></b><figcaption>PREVIEW · ${String(i+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}</figcaption></figure>
  <h3>${titleMarkup(n.title)}</h3><p class="rp-en">${n.en}</p><p class="rp-desc">${n.description}</p><div class="rp-tags">${(n.tags??[]).map(t=>`<span>${t}</span>`).join('')}</div>
  <div class="rp-actions">${n.kind==='special'?'<button class="line-button solid" data-action="contact">联系我 →</button>':`${n.goto?`<button class="line-button solid" data-action="route-goto" data-id="${n.goto}">查看项目 →</button>`:`<a class="line-button solid" href="${n.link??'#'}" target="_blank" rel="noreferrer">查看项目 ↗</a>`}${n.repo?`<a class="line-button" href="${n.repo}" target="_blank" rel="noreferrer">开源仓库 ↗</a>`:''}`}</div>
  <div class="rp-step"><button data-action="work-prev" aria-label="上一个作品">←</button><span>${n.code}</span><button data-action="work-next" aria-label="下一个作品">→</button></div>`;
}
const route=new RouteMap($('#records'),visited,()=>new Set(),id=>{saveStored('site-visited',[...visited]);if(page==='works')history.replaceState(null,'',`#/works/${id}`);},{nodes:works,width:WORKS_WIDTH,links:workLinks,years:[{label:'2024',at:116},{label:'2025',at:166},{label:'2026',at:310,now:true}],head:{eyebrow:'SELECTED WORKS',title:'作品集',sub:'WORKS / 2024—2026'},counter:'已看作品',panel:workPanel,
 portals:''});
route.seq.reduced=!motion;

// Contact: 功能页是一个 React 实验台 + 八股手册，进页时再挂载（见 mountLab）。
let labMounted=false;
function mountLab(){
 if(labMounted)return;
 const el=$('#lab-root');if(!el)return;
 labMounted=true;
 import('../lab/mount.tsx').then(m=>m.mountLab(el)).catch(()=>{labMounted=false;toast('组件加载失败 · 刷新再试');});
}

function toast(m:string){$('#toast').textContent=m;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('#toast').classList.remove('visible'),2400);}let toastTimer=0;
function renderGlyphs(){
 $('#glyphs').innerHTML=GLYPHS[page].map((g,i)=>{
  if(g.key!==undefined&&got.has(g.key))return '';
  return `<span class="glyph${g.key!==undefined?' key':''}${g.flip?` flip-${g.flip}`:''}" style="--x:${g.x}%;--y:${g.y}%;--s:${g.size}px;--d:${g.depth};--i:${i};--dof:0px"${g.key!==undefined?` data-action="glyph" data-key="${g.key}" role="button" tabindex="0" aria-label="收集字母 ${g.ch}" data-cursor="收集 ${g.ch}"`:''}>${g.ch}</span>`;
 }).join('');
 updateWord();
}
function updateWord(){
 document.querySelectorAll<HTMLElement>('[data-letter]').forEach(s=>s.classList.toggle('got',got.has(+s.dataset.letter!)));
 const wp=document.getElementById('word-progress');
 if(wp){const done=got.size===LETTERS.length;wp.classList.toggle('complete',done);
  if(done){wp.setAttribute('data-action','secret');wp.setAttribute('title','点击查看隐藏页');}
  else{wp.removeAttribute('data-action');wp.setAttribute('title','在各页找蓝色字母，集齐 canliu');}}
}
function finishCollect(k:number){
 const slot=$(`[data-letter="${k}"]`);
 slot?.classList.add('pop');setTimeout(()=>slot?.classList.remove('pop'),700);
 if(got.size===LETTERS.length){toast(`${secret.word} · 六个字母已集齐`);openSecret();}
 else toast(`拾得字母「${LETTERS[k]}」 · ${got.size} / ${LETTERS.length}`);
}
function collect(el:HTMLElement){
 const k=+el.dataset.key!;
 if(!Number.isInteger(k)||got.has(k))return;
 got.add(k);
 const from=el.getBoundingClientRect();
 const slot=$(`[data-letter="${k}"]`);
 const to=slot?slot.getBoundingClientRect():null;
 const ghost=el.cloneNode(true) as HTMLElement;
 ghost.className='glyph-ghost';ghost.removeAttribute('data-action');
 Object.assign(ghost.style,{left:`${from.left}px`,top:`${from.top}px`,fontSize:getComputedStyle(el).fontSize});
 stage.append(ghost);el.remove();
 if(!to||to.width<1||!motion){ghost.remove();updateWord();finishCollect(k);return;}
 let done=false;
 const finish=()=>{if(done)return;done=true;ghost.remove();updateWord();finishCollect(k);};
 const anim=ghost.animate(
  [{transform:'translate(0,0) scale(1)',opacity:1},
   {transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${Math.max(.08,to.height/from.height)})`,opacity:.9}],
  {duration:760,easing:'cubic-bezier(.7,0,.2,1)'});
 anim.onfinish=finish;setTimeout(finish,900);
}
function screenOf(p:Page){return $(p==='home'?'#home':p==='about'?'#operators':p==='works'?'#records':p==='skills'?'#atlas':'#contact');}
function setPage(next:Page,animate=true){
 const anim=animate&&motion;const outgoing=anim?active:null;
 if(anim)burst($('#transition-fx'),BURST[next],P.accent);
 page=next;stage.className=`${SKIN[next]} site${motion?'':' reduced-motion'}${reticle.enabled?' has-reticle':''}`;
 document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
 const incoming=screenOf(next);incoming.classList.remove('hidden');active=incoming;
 document.querySelectorAll<HTMLElement>('[data-nav]').forEach(b=>{b.classList.toggle('selected',b.dataset.nav===next);b.setAttribute('aria-current',b.dataset.nav===next?'page':'false');});
 $('#mode-caption').textContent=`${P.name.cn} · ${PAGES.find(p=>p[0]===next)![1]}`;
 field.active=next==='home'||next==='about';if(next==='home')field.set(7,[.46,.14,.96,.86],18,{x:.66,y:.44,r:.21});if(next==='about')field.set(19,[.5,.1,.96,.9],16,{x:.72,y:.46,r:.24});
 if(next==='contact')requestAnimationFrame(mountLab);
 if(next==='works')route.enter();
 if(next==='about'){const n=$('#op-name');n.classList.remove('assemble');void n.offsetWidth;if(motion)n.classList.add('assemble');}
 if(next==='skills'){$('.atlas-stage').classList.remove('scanning');void $('.atlas-stage').offsetWidth;$('.atlas-stage').classList.add('scanning');void loadGuestbook();}
 renderGlyphs();
 if(anim){incoming.classList.remove('entering');void incoming.offsetWidth;incoming.classList.add('entering');clearTimeout(enterTimer);enterTimer=window.setTimeout(()=>incoming.classList.remove('entering'),1100);
  if(outgoing&&outgoing!==incoming){outgoing.classList.remove('hidden');outgoing.classList.add('leaving');outgoing.inert=true;setTimeout(()=>{outgoing.classList.remove('leaving');outgoing.inert=false;if(outgoing!==active)outgoing.classList.add('hidden');},460);}}
 if(motion)document.querySelectorAll<HTMLElement>(`#${incoming.id} [data-scramble]`).forEach((el,i)=>setTimeout(()=>scramble(el,640),i*90));
 const h=next==='home'?'':next==='works'?`#/works/${works[route.selected].id}`:`#/${next}`;if(location.hash!==h)history.replaceState(null,'',h||location.pathname);
}
function homeScan(on:boolean){clearTimeout(scanTimer);if(page!=='home')return;if(on)stage.classList.add('home-scan');else scanTimer=window.setTimeout(()=>stage.classList.remove('home-scan'),260);}
function skillOf(n:number){return guestNotes.length?guestNotes[(n-1)%guestNotes.length]:undefined;}
function showSkill(n:number){
 const s=skillOf(n);
 if(!s)return;
 const el=$('#skill-name');
 if(el.dataset.text!==s.body){el.dataset.text=s.body;scramble(el,320,s.body);}
 $('#skill-spec').innerHTML=`${esc(s.en)}<br><span style="opacity:.55">留言 No.${String(n).padStart(2,'0')}</span>`;
 const idx=(n-1)%guestNotes.length;
 document.querySelectorAll<HTMLElement>('[data-skill]').forEach(b=>b.classList.toggle('active',Number(b.dataset.skill)===idx));
}

/* 留言墙渲染：条数、蝴蝶数量、右侧清单、空/错状态都从这里出。 */
function renderGuestbook(){
 const n=guestNotes.length;
 const total=n;            // 一条留言 = 一只蝴蝶
 /* 用后台分配的百分比坐标落位（x/y 是图版 0–100 的相对位置），前端不再自己乱飞 */
 const specs:BirdSpec[]=guestNotes.map((g,i)=>({n:i+1,x:g.x/100*1600,y:g.y/100*700,s:g.scale,r:g.rot,flip:false}));
 skillBirds=specs;
 $('#skill-plate').innerHTML=birdPlate(true,'skill',total,specs)+(n?''
  :`<div class="skill-empty"><b>${guestState==='error'?'留言读取失败':'还没有留言'}</b><span>${guestState==='error'?'刷新页面再试一次':'后台审核通过后，蝴蝶会飞进来'}</span></div>`);
 const head=$('#guest-count');
 head.textContent=guestState==='error'?'GUESTBOOK / OFFLINE':`GUESTBOOK / ${n} NOTES`;
 head.dataset.text=head.textContent;
 $('#skill-total').textContent=String(total).padStart(2,'0');
 countTo($('#skill-count'),0);
 released.clear();
 const name=$('#skill-name');
 name.textContent='--';name.dataset.text='--';
 $('#skill-spec').innerHTML=guestState==='loading'?'正在读取留言<br>请稍候'
  :guestState==='error'?'读取失败<br>刷新页面再试'
  :n?'将指针移到蝴蝶上<br>读一条留言'
  :'留言板还空着<br>去后台放几条进来';
 $('#skill-list').innerHTML=n
  ? guestNotes.map((s,i)=>`<button data-skill="${i}"><small>${String(i+1).padStart(2,'0')}</small>${esc(s.en)}<i style="--l:${s.level/5}"></i></button>`).join('')
  : '';
}

/* 只认接口数据；接口 404 或断网时保持空板，不拿假数据糊上去。 */
async function loadGuestbook(force=false){
 if(guestState==='ready'&&!force)return;
 guestState='loading';
 try{
  const res=await fetch('/api/messages',{headers:{accept:'application/json'},cache:'no-store'});
  if(!res.ok)throw new Error(String(res.status));
  const data=await res.json() as {messages?:{name:string;content:string;approved_at?:number;x?:number|null;y?:number|null;rot?:number|null;scale?:number|null}[]};
  guestNotes=(data.messages??[]).map((m,i)=>({
   body:m.content,
   en:`${m.name} · ${shortDate(m.approved_at??0)}`.trim(),
   level:5,
   x:m.x??(12+(i*29)%76), y:m.y??(22+(i*23)%58),
   rot:m.rot??0, scale:m.scale??1.1
  }));
  guestState='ready';
 }catch{
  guestState='error';
 }
 renderGuestbook();
}
renderGuestbook();

const actions:Record<string,(el:HTMLElement)=>void>={
 home:()=>setPage('home'),about:()=>setPage('about'),glyph:el=>collect(el),secret:()=>openSecret(),works:()=>setPage('works'),skills:()=>setPage('skills'),contact:()=>setPage('contact'),
 fullscreen:()=>{void (document.fullscreenElement?document.exitFullscreen():stage.requestFullscreen()).catch(()=>toast('可使用 F11 进入全屏'));},
 'work-prev':()=>route.step(-1),'work-next':()=>route.step(1),'route-goto':el=>{const i=works.findIndex(w=>w.id===el.dataset.id);if(i>=0)route.select(i);},'route-seq':el=>route.seekStage(+el.dataset.seq!),'route-pins-clear':()=>route.clearPins(),
 recall:()=>{document.querySelectorAll('.p0 .flown').forEach(g=>{g.classList.remove('flown');g.classList.add('returning');});released.clear();countTo($('#skill-count'),0);},
 'copy-mail':()=>{const task=navigator.clipboard?.writeText(P.contact.email);if(task)void task.then(()=>toast('邮箱已复制'),()=>toast(P.contact.email));else toast(P.contact.email);}
};
document.addEventListener('click',e=>{
 const t=e.target as HTMLElement;const b=t.closest<HTMLElement>('button,[data-action]');
 const bird=t.closest<SVGElement>('[data-bird]');if(bird&&!released.has(+bird.dataset.bird!)){const n=+bird.dataset.bird!;released.add(n);bird.classList.remove('returning');bird.classList.add('flown');countTo($('#skill-count'),released.size);showSkill(n);return;}
 if(!b){if(motion&&!t.closest('.route-view,.atlas-stage,.covenant,a'))ripple($('#ripples'),e.clientX,e.clientY);return;}
 const a=b.dataset.action;if(a&&actions[a]){actions[a](b);return;}
 if(b.dataset.route!==undefined)route.select(+b.dataset.route);
 if(b.dataset.skill!==undefined){const i=+b.dataset.skill;showSkill(i+1);const g=document.querySelector(`.p0 [data-bird="${i+1}"]`);g?.classList.add('hot');setTimeout(()=>g?.classList.remove('hot'),900);}
});
stage.addEventListener('pointerover',e=>{const t=e.target as Element;if(t.closest('[data-scan]'))homeScan(true);const bird=t.closest<SVGElement>('[data-bird]');document.querySelectorAll('.p0 .hot').forEach(x=>x.classList.remove('hot'));if(bird){bird.classList.add('hot');showSkill(+bird.dataset.bird!);}const nav=t.closest('[data-nav]');const s=nav?.querySelector<HTMLElement>('[data-scramble]');if(s&&motion&&!nav!.contains(e.relatedTarget as Node))scramble(s,360);});
stage.addEventListener('pointerout',e=>{const t=(e.target as Element).closest('[data-scan]');if(t&&!t.contains(e.relatedTarget as Node))homeScan(false);});
stage.addEventListener('pointermove',e=>{
 field.point(e.clientX,e.clientY);if(!motion)return;pendingParallax={x:e.clientX/innerWidth-.5,y:e.clientY/innerHeight-.5};
});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.ctrlKey||e.metaKey)return;
 const i=PAGES.findIndex(p=>p[0]===page);
 if(e.key==='Escape'&&page!=='home')setPage('home');
 if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const d=e.key==='ArrowRight'?1:-1;if(page==='works'){e.preventDefault();route.step(d);}else{e.preventDefault();setPage(PAGES[wrap(i+d,PAGES.length)][0]);}}
});
setInterval(()=>{if(motion&&!document.hidden)morphGlyph($('#glyphs'));},2300);

// Deep links: #/about, #/works/wk-03, #/skills, #/contact.
function openHash(){const [m='',arg='']=location.hash.replace(/^#\/?/,'').split('/').map(decodeURIComponent);if(m==='works'){const i=works.findIndex(w=>w.id===arg);if(i>=0)route.selected=i;}if(PAGES.some(p=>p[0]===m)){setPage(m as Page,false);return true;}return false;}
addEventListener('hashchange',()=>{openHash();});
if(!openHash())setPage('home',false);
let last=performance.now();
function frame(now:number){const dt=Math.min((now-last)/1000,.1);last=now;if(!document.hidden){
 if(pendingParallax){stage.style.setProperty('--mx',pendingParallax.x.toFixed(3));stage.style.setProperty('--my',pendingParallax.y.toFixed(3));pendingParallax=null;}
 reticle.frame(dt);field.frame(motion?dt:0);if(page==='works')route.frame(dt);
}requestAnimationFrame(frame);}
requestAnimationFrame(frame);

/* ── 隐藏页：集齐六个字母后打开 ── */
let secretEl:HTMLElement|null=null;
function openSecret(){
 if(!secretEl){
  secretEl=document.createElement('div');
  secretEl.className='secret';
  secretEl.innerHTML='<div class="secret-card"><button class="secret-close" type="button">关闭</button>'
   +'<div class="sc-eyebrow">HIDDEN PAGE / '+LETTERS.length+' LETTERS</div>'
   +'<div class="sc-word">'+secret.word+'</div>'
   +'<p class="sc-note">'+secret.note+'</p>'
   +secret.links.map(l=>'<a href="'+l.url+'" target="_blank" rel="noreferrer">'+l.label+'<small>'+l.value+'</small></a>').join('')
   +'</div>';
  document.body.appendChild(secretEl);
  secretEl.addEventListener('click',e=>{
   const el=e.target as HTMLElement;
   if(el===secretEl||el.closest('.secret-close'))secretEl!.classList.remove('on');
  });
 }
 secretEl.classList.add('on');
}

