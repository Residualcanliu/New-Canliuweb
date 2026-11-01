import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { profile as P, works } from '../site/profile.ts';
import { CHAPTERS, NOTE_TOTAL } from './knowledge.ts';

/* ── 卡片外壳：编号 + 标题 + 用到的 hook 标签 ── */
function Card({ code, title, en, hooks, children, grow }: {
  code: string; title: string; en: string; hooks: string[];
  children: ReactNode; grow?: boolean;
}) {
  return (
    <section className={`lab-card${grow ? ' grow' : ''}`}>
      <header className="lab-card-head">
        <span className="lab-code">{code}</span>
        <h3>{title}<em>{en}</em></h3>
        <span className="lab-react">REACT</span>
      </header>
      <div className="lab-card-body">{children}</div>
      <footer className="lab-card-foot">
        <span className="lab-hooks">{hooks.map(h => <i key={h}>{h}</i>)}</span>
        <span className="lab-src">src/lab/</span>
      </footer>
    </section>
  );
}

/* ── 终端：useState / useRef / useEffect ── */
type Line = { k: 'sys' | 'menu' | 'in' | 'out'; t: string };



const ASCII = [
  ' ███   ██   █  █  █     ████  █  █',
  '█     █  █  ██ █  █      ██   █  █',
  '█     ████  █ ██  █      ██   █  █',
  '█     █  █  █  █  █      ██   █  █',
  ' ███  █  █  █  █  ████  ████   ██ '
];

function AsciiMark({ rows }: { rows: string[] }) {
  return <pre className="tm-banner" role="img" aria-label="CANLIU">{rows.join(String.fromCharCode(10))}</pre>;
}

function Terminal() {
  const [lines, setLines] = useState<Line[]>([
    { k: 'menu', t: 'help      列出全部命令' },
    { k: 'menu', t: 'works     项目清单' },
    { k: 'menu', t: 'contact   邮箱与链接' },
    { k: 'menu', t: 'about     关于我' },
    { k: 'menu', t: 'date      当前时间' },
    { k: 'menu', t: 'clear     清屏' },
    { k: 'sys', t: `GCH LAB · 2026 · 已载入 ${works.length} 个项目 / ${NOTE_TOTAL} 条笔记` }
  ]);
  const [val, setVal] = useState('');
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const [head, ...rest] = cmd.split(/\s+/);
    const arg = rest.join(' ');
    let out = '';
    switch (head.toLowerCase()) {
      case 'help':
        out = 'help · about · works · contact · whoami · date · sudo · clear';
        break;
      case 'about':
        out = P.bio;
        break;
      case 'works':
        out = works.map((w, i) => `${String(i + 1).padStart(2, '0')}  ${w.code.padEnd(8)} ${w.title.replace(/\n/g, ' ')}`).join('\n');
        break;
      case 'contact':
        out = `${P.contact.email}\n${P.contact.links.map(l => `${l.label}  ${l.url}`).join('\n')}`;
        break;
      case 'whoami':
        out = `${P.name.cn} / ${P.name.latin} — ${P.role}`;
        break;
      case 'date':
        out = new Date().toLocaleString('zh-CN');
        break;
      case 'sudo':
        out = '权限不足。不过可以先去看看作品集。';
        break;
      case 'clear':
        setLines([]);
        setVal('');
        return;
      default:
        out = arg ? `未知命令：${head} ${arg}` : `未知命令：${head} · 试试 help`;
    }
    setLines(v => [...v, { k: 'in', t: cmd }, { k: 'out', t: out }]);
    setVal('');
  };

  return (
    <div className="tm" onClick={() => document.getElementById('lab-cmd')?.focus()}>
      <div className="tm-head">
        <AsciiMark rows={ASCII} />
      </div>
      <div className="tm-log" ref={log}>
        {lines.map((l, i) => (
          <p key={i} className={`tm-line ${l.k}`}>
            <span className="tm-mark">{l.k === 'in' ? '›' : l.k === 'sys' ? '·' : ' '}</span>
            <span>{l.t}</span>
          </p>
        ))}
      </div>
      <div className="tm-quick">
        {['help', 'works', 'contact', 'clear'].map(c => (
          <button key={c} type="button" onClick={() => run(c)}>{c}</button>
        ))}
      </div>
      <form className="tm-prompt" onSubmit={e => { e.preventDefault(); run(val); }}>
        <span>›</span>
        <input
          id="lab-cmd"
          value={val}
          onChange={e => setVal(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-label="终端命令输入"
          placeholder="help"
        />
        <i className="tm-caret" aria-hidden="true" />
      </form>
    </div>
  );
}

/* ── 右侧：个人学习笔记（手风琴 + 分类 + 搜索） ── */
function Notes() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string[]>(['ag-1']);

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return CHAPTERS
      .filter(c => cat === 'all' || c.id === cat)
      .flatMap(c => c.notes.map(n => ({ ...n, chapter: c.label })))
      .filter(n => !kw || `${n.q} ${n.a} ${n.tag} ${n.chapter}`.toLowerCase().includes(kw));
  }, [cat, q]);

  const toggle = (id: string) => setOpen(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);

  return (
    <section className="notes">
      <header className="notes-head">
        <div>
          <span className="notes-kicker">NOTES / 学习记录</span>
          <h3>个人学习笔记<em>{NOTE_TOTAL} 题 · 持续补</em></h3>
        </div>
        <label className="notes-search">
          <span>/</span>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜：索引 / ReAct / 闭包"
            aria-label="搜索笔记"
            spellCheck={false}
          />
        </label>
      </header>

      <nav className="notes-tabs" aria-label="笔记分类">
        <button type="button" className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>
          全部<i>{NOTE_TOTAL}</i>
        </button>
        {CHAPTERS.map(c => (
          <button key={c.id} type="button" className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
            {c.label}<i>{c.notes.length}</i>
          </button>
        ))}
      </nav>

      <div className="notes-list">
        {list.length === 0 && <p className="notes-empty">没有匹配的题。换个关键词，或点「全部」。</p>}
        {list.map((n, i) => {
          const isOpen = open.includes(n.id);
          return (
            <article key={n.id} className={`note${isOpen ? ' open' : ''}`}>
              <button type="button" className="note-head" onClick={() => toggle(n.id)} aria-expanded={isOpen}>
                <span className="note-idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="note-q">{n.q}</span>
                <span className="note-tag">{n.tag}</span>
                <i className="note-plus" aria-hidden="true" />
              </button>
              <div className="note-body">
                <div><p>{n.a}</p></div>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="notes-foot">
        <span>{cat === 'all' ? 'ALL CHAPTERS' : CHAPTERS.find(c => c.id === cat)?.en}</span>
        <span>点标题展开 · 可同时开多条</span>
      </footer>
    </section>
  );
}

export default function Lab() {
  return (
    <div className="lab">
      <div className="lab-left">
        <div className="lab-col-head"><span>LAB / 01</span><b>组件实验台</b><i>1 COMPONENT</i></div>
        <Card
          code="REACT · 01"
          title="终端"
          en="TERMINAL"
          hooks={['useState', 'useRef', 'useEffect']}
          grow
        >
          <Terminal />
        </Card>
      </div>
      <Notes />
    </div>
  );
}
