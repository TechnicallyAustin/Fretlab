"use client";

import { useEffect, useMemo, useState } from "react";

type KeyName = "C" | "G" | "D" | "A" | "E" | "B" | "F#" | "Db" | "Ab" | "Eb" | "Bb" | "F";
type View = "today" | "drills" | "train" | "keys" | "progress" | "routines" | "runner" | "summary" | "grouped" | "drill-detail" | "key-detail" | "scale-detail" | "routine-detail" | "guided";
type Note = { s: number; f: number };

const FIFTHS: KeyName[] = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
const LETTERS = "CDEFGAB";
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const OPEN_PC: Record<number, number> = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
const STRING_NAMES: Record<number, string> = { 1: "e", 2: "B", 3: "G", 4: "D", 5: "A", 6: "E" };

function keyHue(key: KeyName) { return (289 + FIFTHS.indexOf(key) * 30) % 360; }
function palette(key: KeyName) {
  const h = keyHue(key);
  return { key, h, bright: `oklch(0.58 0.155 ${h})`, ink: `oklch(0.44 0.145 ${h})`, fill: `oklch(0.935 0.032 ${h})`, fill2: `oklch(0.885 0.055 ${h})`, edge: `oklch(0.79 0.07 ${h})`, glow: `oklch(0.9 0.05 ${h})`, dim: `oklch(0.965 0.016 ${h})` };
}
function keyPc(key: KeyName) {
  const li = LETTERS.indexOf(key[0]);
  const accidental = key.slice(1).split("").reduce((sum, mark) => sum + (mark === "#" ? 1 : -1), 0);
  return (LETTER_PC[li] + accidental + 12) % 12;
}
function majorScale(key: KeyName) {
  const li = LETTERS.indexOf(key[0]);
  const root = keyPc(key);
  return [0, 2, 4, 5, 7, 9, 11].map((interval, degree) => {
    const letterIndex = (li + degree) % 7;
    let delta = (root + interval - LETTER_PC[letterIndex] + 12) % 12;
    if (delta > 6) delta -= 12;
    return LETTERS[letterIndex] + (delta > 0 ? "#".repeat(delta) : "b".repeat(-delta));
  });
}
function targetNotes(key: KeyName, low = 1, high = 7) {
  const root = keyPc(key);
  const notes: Note[] = [];
  for (let s = 6; s >= 1; s -= 1) for (let f = low; f <= high; f += 1) if ((OPEN_PC[s] + f) % 12 === root) notes.push({ s, f });
  return notes;
}
function scaleShape(key: KeyName, low: number, high: number) {
  const pcs = [0, 2, 4, 5, 7, 9, 11].map((n) => (keyPc(key) + n) % 12);
  const notes: Note[] = [];
  for (let s = 6; s >= 1; s -= 1) for (let f = low; f <= high; f += 1) if (pcs.includes((OPEN_PC[s] + f) % 12)) notes.push({ s, f });
  return notes;
}
function cssVars(key: KeyName) {
  const p = palette(key);
  return { "--key-bright": p.bright, "--key-ink": p.ink, "--key-fill": p.fill, "--key-fill-2": p.fill2, "--key-edge": p.edge, "--key-glow": p.glow, "--key-dim": p.dim } as React.CSSProperties;
}
function polar(cx: number, cy: number, r: number, degrees: number) {
  const angle = (degrees - 90) * Math.PI / 180;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}
function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p1 = polar(cx, cy, r1, a0), p2 = polar(cx, cy, r1, a1), p3 = polar(cx, cy, r0, a1), p4 = polar(cx, cy, r0, a0);
  return `M${p1[0]} ${p1[1]}A${r1} ${r1} 0 0 1 ${p2[0]} ${p2[1]}L${p3[0]} ${p3[1]}A${r0} ${r0} 0 0 0 ${p4[0]} ${p4[1]}Z`;
}

const DRILLS = [
  { key: "G" as KeyName, name: "Position one, up and back", minutes: 4, progress: 72, bpm: 84, difficulty: 1, low: 1, high: 5, notes: [[6,3],[6,5],[5,2],[5,3],[5,5],[4,2],[4,4]] },
  { key: "G" as KeyName, name: "Thirds through the shape", minutes: 5, progress: 41, bpm: 76, difficulty: 2, low: 1, high: 5, notes: [[6,3],[5,2],[6,5],[5,3],[5,5],[4,2]] },
  { key: "D" as KeyName, name: "Locate every D", minutes: 3, progress: 88, bpm: 0, difficulty: 1, low: 1, high: 7, notes: [[6,10],[5,5],[4,12],[3,7]] },
  { key: "A" as KeyName, name: "Pentatonic box one", minutes: 6, progress: 23, bpm: 92, difficulty: 2, low: 5, high: 8, notes: [[6,5],[6,8],[5,5],[5,7],[4,5],[4,7],[3,5],[3,7]] },
  { key: "C" as KeyName, name: "Open chord changes", minutes: 4, progress: 95, bpm: 68, difficulty: 1, low: 0, high: 3, notes: [[5,3],[4,2],[2,1],[4,0],[3,0]] },
];
const ROUTINES = [
  { name: "Ten minute warm-up", cadence: "Every morning", last: "Yesterday", completed: 3, drills: [{ name:"Open string check",key:"G" as KeyName,mins:4,phase:"warm" },{ name:"Locate every D",key:"D" as KeyName,mins:3,phase:"core" },{ name:"Open chord changes",key:"C" as KeyName,mins:3,phase:"cool" }] },
  { name: "One key, deep", cadence: "Three times a week", last: "2 days ago", completed: 2, drills: [{ name:"Position one, up and back",key:"G" as KeyName,mins:4,phase:"warm" },{ name:"Thirds through the shape",key:"G" as KeyName,mins:5,phase:"core" },{ name:"Chord tones only",key:"G" as KeyName,mins:4,phase:"core" },{ name:"Locate every G",key:"G" as KeyName,mins:3,phase:"cool" },{ name:"Free play over a drone",key:"G" as KeyName,mins:2,phase:"cool" }] },
  { name: "Neck knowledge", cadence: "Weekends", last: "Last Sunday", completed: 1, drills: [{ name:"Pentatonic box one",key:"A" as KeyName,mins:4,phase:"warm" },{ name:"Sixths on the top two",key:"E" as KeyName,mins:3,phase:"core" },{ name:"Open chord changes",key:"C" as KeyName,mins:4,phase:"core" },{ name:"Free play over a drone",key:"F" as KeyName,mins:3,phase:"cool" }] },
];

function Ring({ value, size = 42, label }: { value: number; size?: number; label?: string }) {
  return <div className="ring" style={{ "--ring-value": `${value * 3.6}deg`, width: size, height: size } as React.CSSProperties} aria-label={label ?? `${value}% complete`}><span>{value}%</span></div>;
}

function Fretboard({ notes, low, high, mini = false, interactive = false, found = new Set<string>(), onCell, labelMode = "note", rootKey = "G" }: { notes: Note[]; low: number; high: number; mini?: boolean; interactive?: boolean; found?: Set<string>; onCell?: (s: number, f: number) => void; labelMode?: "note" | "degree"; rootKey?: KeyName }) {
  const noteMap = new Map(notes.map((note) => [`${note.s}:${note.f}`, note]));
  const unit = mini ? 14 : 44;
  const gap = mini ? 9 : 28;
  const showLabels = !mini;
  const showStringNames = !mini;
  const openWidth = Math.round(unit * .6);
  const padLeft = showStringNames ? Math.round(gap * .7) : 0;
  const frets = Array.from({ length: high - low + 1 }, (_, index) => low + index);
  let cursor = padLeft;
  const columns = frets.map((fret) => {
    const width = fret === 0 ? openWidth : unit;
    const column = { fret, x: cursor, width, center: cursor + width / 2 };
    cursor += width;
    return column;
  });
  const width = cursor;
  const top = 4;
  const boardX = low === 0 ? padLeft + openWidth : padLeft;
  const boardHeight = 6 * gap;
  const labelHeight = showLabels ? Math.round(gap * .62) : 0;
  const intervals = ["1", "♭2", "2", "♭3", "3", "4", "♭5", "5", "♭6", "6", "♭7", "7"];
  const noteNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const yFor = (string: number) => top + (string - .5) * gap;
  const dotRadius = Math.round(gap * .4);
  const accent = palette(rootKey).bright;

  return <div className={`fretboard ${mini ? "mini" : ""}`} aria-label={`Guitar fretboard, frets ${low} to ${high}`}>
    <svg viewBox={`0 0 ${width} ${top + boardHeight + labelHeight + 4}`} role="img">
      <rect x={boardX} y={top - gap * .06} width={width - boardX} height={boardHeight + gap * .12} rx="4" fill="#232532"/>
      {columns.map((column) => column.fret === 0 ? null : <line key={`fret-${column.fret}`} x1={column.x} y1={top} x2={column.x} y2={top + boardHeight} stroke={column.fret === 1 && low <= 1 ? "#595d6c" : "#3f424d"} strokeWidth={column.fret === 1 && low <= 1 ? 2.5 : 1}/>) }
      <line x1={width} y1={top} x2={width} y2={top + boardHeight} stroke="#3f424d" strokeWidth="1"/>
      {columns.filter((column) => column.fret === 12).flatMap((column) => [2,5].map((string) => <path key={`inlay-${string}`} d={`M ${column.center} ${yFor(string)-2} l 2 2 -2 2 -2 -2 z`} fill="#3f424d"/>))}
      {[1,2,3,4,5,6].map((string) => <line key={`string-${string}`} x1={boardX} y1={yFor(string)} x2={width} y2={yFor(string)} stroke="#595d6c" strokeWidth=".8" opacity=".75"/>) }
      {showStringNames && [1,2,3,4,5,6].map((string) => <text key={`name-${string}`} x={padLeft * .45} y={yFor(string)+gap*.15} textAnchor="middle" fill="#9397ab" fontSize={Math.max(9,gap*.36)} fontWeight="500">{STRING_NAMES[string]}</text>)}
      {[6,5,4,3,2,1].flatMap((string) => columns.map((column) => {
        const id = `${string}:${column.fret}`;
        const hasNote = noteMap.has(id);
        const isFound = !interactive || found.has(id);
        const pc = (OPEN_PC[string] + column.fret) % 12;
        const degree = (pc - keyPc(rootKey) + 12) % 12;
        const label = labelMode === "degree" ? intervals[degree] : noteNames[pc];
        const isRoot = degree === 0;
        return <g key={id} onClick={interactive ? () => onCell?.(string,column.fret) : undefined} className={interactive ? "fret-hit" : undefined} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} aria-label={interactive ? `${STRING_NAMES[string]} string, fret ${column.fret}${hasNote ? `, ${label}` : ""}` : undefined} onKeyDown={interactive ? (event) => { if (event.key === "Enter" || event.key === " ") onCell?.(string,column.fret); } : undefined}>
          {interactive && <rect x={column.x} y={yFor(string)-gap/2} width={column.width} height={gap} fill="transparent"/>}
          {hasNote && (isRoot ? <rect x={column.center-dotRadius} y={yFor(string)-dotRadius} width={dotRadius*2} height={dotRadius*2} rx={dotRadius*.42} fill={isFound ? "#e7e5fe" : "#232532"} stroke={isFound ? "none" : palette(rootKey).edge} strokeDasharray={isFound ? undefined : "3 3"}/> : <circle cx={column.center} cy={yFor(string)} r={dotRadius} fill={isFound ? accent : "#232532"} stroke={isFound ? "none" : palette(rootKey).edge} strokeDasharray={isFound ? undefined : "3 3"}/>) }
          {hasNote && !mini && <text x={column.center} y={yFor(string)+Math.max(10,dotRadius)*.34} textAnchor="middle" fill={isFound ? (isRoot ? "#161826" : "#fbf8f2") : palette(rootKey).edge} fontSize={label.length > 1 ? Math.max(8,dotRadius*.82) : Math.max(10,dotRadius)} fontWeight="600">{label}</text>}
        </g>;
      }))}
      {showLabels && columns.map((column) => <text key={`label-${column.fret}`} x={column.center} y={top+boardHeight+labelHeight*.85} textAnchor="middle" fill="#9397ab" fontSize={Math.max(10,Math.round(gap*.42))} fontWeight="500">{column.fret === 0 ? "open" : column.fret}</text>)}
    </svg>
  </div>;
}

function SegmentTabs({ labels, active, onChange }: { labels: string[]; active: string; onChange: (label: string) => void }) {
  return <div className="segment-tabs" role="tablist">{labels.map((label) => <button role="tab" aria-selected={label === active} className={label === active ? "active" : ""} onClick={() => onChange(label)} key={label}>{label}</button>)}</div>;
}

function StatusBar({ end }: { end: string }) { return <div className="status-bar"><span>9:41</span><span>{end}</span></div>; }

function AppHeader({ title, meta, onBack, action }: { title: string; meta?: string; onBack?: () => void; action?: React.ReactNode }) {
  return <><StatusBar end={meta ?? title}/><div className="screen-heading">{onBack && <button className="back" onClick={onBack} aria-label="Go back">←</button>}<h1>{title}</h1>{action}</div></>;
}

function BottomNav({ active, go }: { active: View; go: (view: View) => void }) {
  const items: { label: string; view: View }[] = [{ label:"Today",view:"today" },{ label:"Drills",view:"drills" },{ label:"Train",view:"train" },{ label:"Keys",view:"keys" },{ label:"You",view:"progress" }];
  return <nav className="tab-bar" aria-label="Primary navigation"><div className="desktop-brand" aria-label="FretLab"><span>F</span><div><strong>FretLab</strong><small>Practice one key.<br/>Know the whole neck.</small></div></div><div className="nav-items">{items.map((item) => <button key={item.label} onClick={() => go(item.view)} className={item.view === active ? "active" : ""}>{item.label}</button>)}</div><p className="desktop-nav-note">One connected practice system for the entire fretboard.</p></nav>;
}

function Today({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const week = [["M",14],["T",22],["W",8],["T",18],["F",6],["S",0],["S",0]] as const;
  return <div className="screen-content today-screen"><StatusBar end="31 day streak"/><div className="today-greeting"><p>Thursday</p><h1>Good evening</h1></div>
    <article className="session-hero"><div className="key-watermark">{sessionKey}</div><p className="kicker">Today&apos;s session</p><h2>The key of {sessionKey}</h2><p>Four drills that all live in one key, so the shapes start rhyming.</p><div className="session-stats"><div><strong>18</strong><span>minutes</span></div><div><strong>4</strong><span>drills</span></div><div><strong>84</strong><span>bpm</span></div></div><button className="primary-action" onClick={() => go("runner")}>Start session <span>→</span></button></article>
    <section className="section"><div className="section-head"><h2>This week</h2><span>68 min</span></div><div className="week-chart">{week.map(([day,mins],i) => <div className="day" key={`${day}${i}`}><div className={`bar-track ${i === 4 ? "today" : ""}`} title={`${mins} minutes`}><span style={{ height: mins ? `${Math.max(18,Math.round(mins/22*100))}%` : 0 }}/></div><span>{day}</span></div>)}</div></section>
    <section className="section"><div className="section-head"><h2>Pick up again</h2></div><div className="resume-grid"><button style={cssVars("D")} onClick={() => go("drill-detail")}><span className="key-chip">D</span><Ring value={62}/><strong>Locate: string six</strong><small>3 min left</small></button><button style={cssVars("A")} onClick={() => go("drill-detail")}><span className="key-chip">A</span><Ring value={23}/><strong>Pentatonic box one</strong><small>6 min left</small></button></div></section>
  </div>;
}

function Drills({ go }: { go: (view: View) => void }) {
  const [filter,setFilter] = useState("All");
  const visible = DRILLS.filter((drill) => filter === "All" || drill.key === filter);
  return <div className="screen-content"><AppHeader title="Drills" meta={`${visible.length} drills`} action={<button className="text-action" onClick={() => go("grouped")}>Group</button>}/><div className="chip-scroll">{["All","C","G","D","A","E"].map((key) => <button key={key} onClick={() => setFilter(key)} className={filter === key ? "active" : ""} style={key === "All" ? undefined : cssVars(key as KeyName)}><span/>{key}</button>)}</div><div className="drill-list">{visible.map((drill) => <button className="drill-card" key={drill.name} onClick={() => go("drill-detail")} style={cssVars(drill.key)}><Fretboard notes={drill.notes.map(([s,f]) => ({s,f}))} low={drill.low} high={drill.high} mini rootKey={drill.key}/><div className="drill-copy"><strong>{drill.name}</strong><div><span className="key-chip">{drill.key}</span><small>{drill.minutes} min</small><small>·</small><small>{drill.bpm ? `${drill.bpm} bpm` : "free"}</small><i>{[1,2,3].map((n) => <b className={n <= drill.difficulty ? "on" : ""} key={n}/>)}</i></div></div><Ring value={drill.progress} size={44}/></button>)}</div></div>;
}

function Train({ selectedKey, setSelectedKey }: { selectedKey: KeyName; setSelectedKey: (key: KeyName) => void }) {
  const notes = useMemo(() => targetNotes(selectedKey),[selectedKey]);
  const [found,setFound] = useState<Set<string>>(() => new Set(notes.slice(0,-1).map((note) => `${note.s}:${note.f}`)));
  const [misses,setMisses] = useState(0);
  useEffect(() => setFound(new Set(notes.slice(0,-1).map((note) => `${note.s}:${note.f}`))),[notes]);
  const hit = (s:number,f:number) => { const id = `${s}:${f}`; if (notes.some((note) => note.s === s && note.f === f)) setFound((current) => new Set(current).add(id)); else setMisses((n) => n + 1); };
  const skip = () => { setSelectedKey(FIFTHS[(FIFTHS.indexOf(selectedKey)+1)%FIFTHS.length]); setMisses(0); };
  const accuracy = Math.round((found.size / Math.max(1,found.size+misses))*100);
  return <div className="screen-content train-screen"><StatusBar end="Locate"/><div className="train-hero"><p className="kicker">Find every</p><strong>{selectedKey}</strong><span>Frets one to seven. Tap them all.</span></div><Fretboard notes={notes} low={1} high={7} interactive found={found} onCell={hit} rootKey={selectedKey}/><div className="stat-grid"><article><strong>{found.size}/{notes.length}</strong><span>found</span></article><article><strong>0:24</strong><span>elapsed</span></article><article><strong>{accuracy || 0}%</strong><span>accuracy</span></article></div>{found.size === notes.length ? <button className="primary-action" onClick={skip}>Next note <span>→</span></button> : <button className="secondary-action" onClick={skip}>Skip this note</button>}</div>;
}

function CircleOfFifths({ selectedKey, onSelect }: { selectedKey: KeyName; onSelect: (key: KeyName) => void }) {
  const selected = FIFTHS.indexOf(selectedKey);
  return <div className="key-wheel"><svg viewBox="0 0 316 316" role="img" aria-label="Interactive circle of fifths">{FIFTHS.map((key,index) => { const distance = (index-selected+12)%12; const near = distance === 0 || distance === 1 || distance === 11; const h = keyHue(key); return <g key={key} role="button" tabIndex={0} aria-label={`Select ${key} major`} onClick={() => onSelect(key)} onKeyDown={(event) => { if(event.key === "Enter" || event.key === " ") onSelect(key); }}><path d={wedge(158,158,106,150,index*30-14.4,index*30+14.4)} fill={distance === 0 ? `oklch(.62 .16 ${h})` : near ? `oklch(.885 .06 ${h})` : `oklch(.955 .014 ${h})`}/><path d={wedge(158,158,64,102,index*30-14.4,index*30+14.4)} fill={near ? `oklch(.935 .032 ${h})` : `oklch(.975 .008 ${h})`}/></g>; })}<circle cx="158" cy="158" r="58" fill="var(--key-fill-2)" stroke="var(--key-edge)"/></svg>{FIFTHS.map((key,index) => { const outer = polar(158,158,128,index*30); const inner = polar(158,158,84,index*30); return <div key={key}><button onClick={() => onSelect(key)} className={`wheel-label ${selectedKey === key ? "selected" : ""}`} style={{ left:`${outer[0]/316*100}%`,top:`${outer[1]/316*100}%` }}>{key}</button><span className="minor-label" style={{ left:`${inner[0]/316*100}%`,top:`${inner[1]/316*100}%` }}>{majorScale(key)[5]}m</span></div>; })}<div className="wheel-core"><strong>{selectedKey}</strong><span>major</span></div></div>;
}

function Keys({ selectedKey, setSelectedKey, go }: { selectedKey: KeyName; setSelectedKey: (key: KeyName) => void; go: (view: View) => void }) {
  const scale = majorScale(selectedKey); const qualities = ["","m","m","","","m","dim"]; const romans = ["I","ii","iii","IV","V","vi","vii°"];
  return <div className="screen-content keys-screen"><StatusBar end="Keys"/><CircleOfFifths selectedKey={selectedKey} onSelect={setSelectedKey}/><section className="section chord-section"><div className="section-head"><h2>Its seven chords</h2><button onClick={() => go("key-detail")}>Open key →</button></div><div className="chord-chips">{scale.map((note,index) => <span key={note}><i style={{ background:palette(FIFTHS[(FIFTHS.indexOf(selectedKey)+[0,2,4,-1,1,3,5][index]+12)%12]).bright }}/><small>{romans[index]}</small>{note}{qualities[index]}</span>)}</div><p>Keys next to each other on the wheel share six of seven notes. That overlap is why moving one step around the circle sounds close, not abrupt.</p></section></div>;
}

function Progress({ go }: { go: (view: View) => void }) {
  const values = [61,68,64,74,71,79,76,82,78,85,83,87,84,87]; const points = values.map((v,i) => `${i/(values.length-1)*100},${100-(v-55)/40*82}`).join(" ");
  const heat = Array.from({length:72},(_,i) => Math.min(1,Math.max(.06,.55+.42*Math.sin((Math.floor(i/12)+1)*1.7+(i%12+1)*.9)*Math.cos((i%12+1)*.42+(Math.floor(i/12)+1)*.6))));
  return <div className="screen-content"><AppHeader title="Progress" meta="This month" action={<button className="text-action" onClick={() => go("routines")}>Routines</button>}/><article className="dial-card"><Ring value={87} size={142}/><div><p className="kicker">Neck knowledge</p><h2>87% accurate</h2><p>Your cleanest week yet. You are finding notes before the shape has time to disappear.</p><div className="mini-stats"><span><strong>31</strong> day streak</span><span><strong>1,284</strong> reps</span></div></div></article><section className="chart-card"><div className="section-head"><h2>Daily accuracy</h2><span>Last 14 days</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Daily accuracy rising from 61 to 87 percent"><defs><linearGradient id="spark" x1="0" x2="1"><stop stopColor="oklch(.58 .14 262)"/><stop offset="1" stopColor="oklch(.55 .15 148)"/></linearGradient><linearGradient id="area" x1="0" x2="0" y2="1"><stop stopColor="oklch(.82 .07 289)" stopOpacity=".55"/><stop offset="1" stopColor="transparent"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#area)"/><polyline points={points} fill="none" stroke="url(#spark)" strokeWidth="2.2" vectorEffect="non-scaling-stroke"/></svg></section><section className="heat-card"><div className="section-head"><h2>Where you know the neck</h2><span>12 frets</span></div><div className="heat-map">{heat.map((v,i) => <span key={i} title={`${Math.round(v*100)}% known`} style={{ background:`oklch(${(.955-.28*v).toFixed(3)} ${(.014+.145*v).toFixed(3)} ${252+150*v})` }}/>)}</div><div className="heat-labels">{Array.from({length:12},(_,i) => <span key={i}>{i+1}</span>)}</div><div className="legend"><span>Still learning</span><i/><span>Solid</span></div></section></div>;
}

function Routines({ go }: { go: (view: View) => void }) {
  return <div className="screen-content"><AppHeader title="Routines" meta="Routines"/><p className="routines-intro">Each band is a drill, sized by minutes and coloured by its key.</p><div className="routine-list">{ROUTINES.map((routine) => { const total = routine.drills.reduce((sum,d) => sum+d.mins,0); const keys = [...new Set(routine.drills.map((d) => d.key))]; return <article className="routine-card" key={routine.name} style={cssVars(routine.drills[0].key)}><div className="routine-title"><div><h2>{routine.name}</h2><p>{total} min · {routine.drills.length} drills</p></div><div className="routine-keys">{keys.map((key) => <span key={key} style={cssVars(key)}>{key}</span>)}</div></div><div className="routine-bands">{routine.drills.map((d,i) => <span key={`${d.name}${i}`} style={{...cssVars(d.key),flex:d.mins}}><b>{d.key}</b><small>{d.mins}m</small></span>)}</div><div className="routine-foot"><span>{[1,2,3].map((n) => <i className={n <= routine.completed ? "on" : ""} key={n}/>)} {routine.last}</span><button onClick={() => go("routine-detail")}>Start</button></div></article>; })}</div></div>;
}

function Runner({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const [bpm,setBpm] = useState(84); const [paused,setPaused] = useState(false);
  const notes = scaleShape(sessionKey,1,5);
  return <div className="screen-content flow-screen"><StatusBar end="1 of 4"/><div className="step-bar">{[0,1,2,3].map((n) => <i className={n === 0 ? "done" : n === 1 ? "current" : ""} key={n}/>)}</div><div className="runner-hero"><p className="kicker">Key of {sessionKey}</p><h1>Position one, up and back</h1><p>One note per click. Let the top note turn you around without becoming a pause.</p></div><Fretboard notes={notes} low={1} high={5} labelMode="degree" rootKey={sessionKey}/><div className={`metronome ${paused ? "paused" : ""}`}>{[0,1,2,3].map((n) => <i style={{ animationDelay:`${n*(60/bpm)}s`, animationDuration:`${60/bpm}s` }} key={n}/>)}</div><div className="elapsed"><strong>02:18</strong><span>of 4:00</span></div><div className="transport"><button onClick={() => setBpm((n) => Math.max(40,n-4))}>−4<small>bpm</small></button><button className="pause" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}<small>{bpm} bpm</small></button><button onClick={() => setBpm((n) => Math.min(180,n+4))}>+4<small>bpm</small></button></div><button className="finish-link" onClick={() => go("summary")}>Finish session</button></div>;
}

function Summary({ go }: { go: (view: View) => void }) {
  return <div className="screen-content summary-screen"><StatusBar end="Complete"/><article><p className="kicker">Session complete</p><Ring value={92} size={168}/><h1>Strong work</h1><p>You kept the pulse through the shape and found every G on the neck. The turnaround is the one place to slow down tomorrow.</p><div className="accuracy-list">{[["Position one",96],["Thirds",88],["Locate G",92],["Changes",84]].map(([name,value]) => <div key={name}><span>{name}</span><strong>{value}%</strong><i><b style={{ width:`${value}%` }}/></i></div>)}</div></article><div className="action-row"><button className="secondary-action">Share</button><button className="primary-action" onClick={() => go("today")}>Back to today</button></div></div>;
}

function GroupedDrills({ go }: { go: (view: View) => void }) {
  const [tab,setTab] = useState("By key"); const groups = [{ title:"Key of G",key:"G" as KeyName,items:DRILLS.filter((d) => d.key === "G") },{ title:"Neck knowledge",key:"D" as KeyName,items:DRILLS.filter((d) => d.key !== "G").slice(0,2) }];
  return <div className="screen-content"><AppHeader title="Drills" meta="24 drills"/><SegmentTabs labels={["All","By key","By skill"]} active={tab} onChange={setTab}/><div className="group-list">{groups.map((group) => <section key={group.title} style={cssVars(group.key)}><div className="group-title"><h2><i/>{tab === "By skill" ? (group.key === "G" ? "Scale fluency" : "Neck knowledge") : group.title}</h2><span>{group.items.length} drills</span></div>{group.items.map((drill) => <button key={drill.name} onClick={() => go("drill-detail")}><Fretboard notes={drill.notes.map(([s,f]) => ({s,f}))} low={drill.low} high={drill.high} mini rootKey={drill.key}/><div><strong>{drill.name}</strong><i><b style={{width:`${drill.progress}%`}}/></i></div><small>{drill.minutes} min</small></button>)}</section>)}</div></div>;
}

function DrillDetail({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const [tab,setTab] = useState("Practice"); const [tempo,setTempo] = useState(84); const drill = DRILLS[0];
  return <div className="screen-content detail-screen"><StatusBar end="Drills"/><div className="detail-back"><button onClick={() => go("drills")}>Back</button><span className="key-chip">Key of {sessionKey}</span></div><div className="detail-title"><h1>Position one, up and back</h1><p>Six notes, two strings, no shifting. The one drill that makes every other shape in this key easier.</p></div><SegmentTabs labels={["Practice","Theory","History"]} active={tab} onChange={setTab}/>{tab === "Practice" && <><Fretboard notes={drill.notes.map(([s,f]) => ({s,f}))} low={1} high={5} labelMode="note" rootKey={sessionKey}/><section className="tempo-section"><div className="section-head"><h2>Tempo ladder</h2><span>{tempo} bpm</span></div><div>{[60,72,84,96,108].map((bpm) => <button className={tempo === bpm ? "active" : ""} onClick={() => setTempo(bpm)} key={bpm}>{bpm}</button>)}</div></section><ol className="instruction-list">{[["Set the click",`One note per beat at ${tempo} bpm, down-strokes only.`],["Up and back, twice","No stopping at the turn. The top note is not a rest."],["Add the turnaround","Land on G on beat one of every bar."]].map(([title,body],i) => <li key={title}><span>{i+1}</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol></>}{tab === "Theory" && <article className="tab-copy"><h2>Why this shape works</h2><p>Every dot belongs to the {sessionKey} major scale. The square tonic gives your ear and hand a home base while the other six notes create motion.</p></article>}{tab === "History" && <article className="tab-copy"><h2>Recent sessions</h2><p>Three clean runs this week. Your best accuracy was 96% at 80 bpm.</p></article>}<div className="sticky-action"><button className="primary-action" onClick={() => go("runner")}>Start drill</button></div></div>;
}

function KeyDetail({ go, selectedKey }: { go: (view: View) => void; selectedKey: KeyName }) {
  const [tab,setTab] = useState("Scales"); const scale = majorScale(selectedKey); const roles = ["home","passing","bright","pull","anchor","soft","leaning"];
  return <div className="screen-content key-detail-screen"><StatusBar end="Keys"/><div className="key-detail-hero"><span className="key-badge">{selectedKey}</span><div><h1>{selectedKey} major</h1><p>{selectedKey === "G" ? "One sharp" : `${scale.filter((n) => n.includes("#") || n.includes("b")).length} accidentals`} · relative minor {scale[5]}</p></div></div><SegmentTabs labels={["Scales","Chords","Theory"]} active={tab} onChange={setTab}/>{tab === "Scales" && <><section className="section"><div className="section-head"><h2>The seven notes, and what each one does</h2></div><div className="degree-strip">{scale.map((note,i) => <div className={i === 0 || i === 4 ? "strong" : ""} key={note}><strong>{note}</strong><small>{roles[i]}</small></div>)}</div></section><section className="section shape-section"><div className="section-head"><h2>Five shapes, one scale</h2><button onClick={() => go("scale-detail")}>Open shape →</button></div><div className="shape-row">{[[0,3],[2,5],[4,7],[6,9],[8,12]].map(([low,high],i) => <button className={i === 1 ? "active" : ""} onClick={() => go("scale-detail")} key={i}><Fretboard notes={scaleShape(selectedKey,low,high)} low={low} high={high} mini rootKey={selectedKey}/><span>{["I","II","III","IV","V"][i]}</span></button>)}</div><p>Those five shapes are the same seven notes seen from five places on the neck. Learn where they overlap and the neck stops being twelve separate frets.</p></section></>}{tab === "Chords" && <article className="tab-copy"><h2>Chords in {selectedKey}</h2><p>{scale.map((note,i) => `${note}${["","m","m","","","m","dim"][i]}`).join(" · ")}</p></article>}{tab === "Theory" && <article className="tab-copy"><h2>What makes it major</h2><p>The distance pattern is whole, whole, half, whole, whole, whole, half. Keep those distances and the major sound survives in every key.</p></article>}</div>;
}

function ScaleDetail({ go, selectedKey }: { go: (view: View) => void; selectedKey: KeyName }) {
  const [tab,setTab] = useState("Shapes"); const [position,setPosition] = useState(2); const windows = [[0,3],[2,5],[4,7],[6,9],[8,12]]; const [low,high] = windows[position-1];
  return <div className="screen-content detail-screen"><AppHeader title={`Position ${["I","II","III","IV","V"][position-1]}`} meta={`${selectedKey} major`} onBack={() => go("key-detail")}/><p className="detail-lede">A connected piece of the same {selectedKey} major scale. Use the root notes to orient the shape.</p><SegmentTabs labels={["Shapes","Sound","Theory"]} active={tab} onChange={setTab}/>{tab === "Shapes" && <><div className="position-picker">{[1,2,3,4,5].map((n) => <button className={position === n ? "active" : ""} onClick={() => setPosition(n)} key={n}>{["I","II","III","IV","V"][n-1]}</button>)}</div><Fretboard notes={scaleShape(selectedKey,low,high)} low={low} high={high} labelMode="degree" rootKey={selectedKey}/><section className="steps-section"><div className="section-head"><h2>How the steps fall</h2></div><div className="step-pattern">{["W","W","H","W","W","W","H"].map((step,i) => <span className={step === "H" ? "half" : ""} style={{flex:step === "W" ? 2 : 1}} key={i}>{step}</span>)}</div><p>Wide, wide, narrow, wide, wide, wide, narrow. Those two narrow steps are what make it sound major. Move one and you are in a different scale entirely.</p></section></>}{tab === "Sound" && <article className="tab-copy"><h2>Hear the center</h2><p>Resolve phrases to {selectedKey}. The other notes create different kinds of distance, but the tonic makes the line feel finished.</p></article>}{tab === "Theory" && <article className="tab-copy"><h2>Seven degrees</h2><p>Scale degrees let one fingering idea travel across all twelve keys without changing its musical function.</p></article>}</div>;
}

function RoutineDetail({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const [tab,setTab] = useState("Drills"); const routine = ROUTINES[1]; const total = routine.drills.reduce((sum,d) => sum+d.mins,0);
  return <div className="screen-content detail-screen"><AppHeader title={routine.name} meta="Routine" onBack={() => go("routines")}/><p className="detail-lede">{total} minutes · {routine.drills.length} drills · key of {sessionKey}</p><SegmentTabs labels={["Drills","Guided","Settings"]} active={tab} onChange={setTab}/>{tab === "Drills" && <ol className="routine-drills">{routine.drills.map((drill,i) => <li className={i === 1 ? "current" : ""} key={drill.name}><span>{i+1}</span><Fretboard notes={scaleShape(drill.key,1,4).slice(0,5)} low={1} high={4} mini rootKey={drill.key}/><div><strong>{drill.name}</strong><small>{drill.phase} · {drill.mins} min</small></div><em>{i === 0 ? "done" : i === 1 ? "now" : "next"}</em></li>)}</ol>}{tab === "Guided" && <article className="tab-copy"><h2>Stay in the flow</h2><p>Guided mode keeps time, moves you between drills, and shows what is coming next so your hands never cool down.</p></article>}{tab === "Settings" && <article className="tab-copy"><h2>Routine settings</h2><p>Repeat three times a week. Metronome count-in is on and transitions last ten seconds.</p></article>}<div className="action-row sticky-action"><button className="secondary-action">Edit</button><button className="primary-action" onClick={() => go("guided")}>Start guided</button></div></div>;
}

function Guided({ go }: { go: (view: View) => void }) {
  const [paused,setPaused] = useState(false); const [step,setStep] = useState(1); const routine = ROUTINES[1]; const current = routine.drills[step];
  return <div className="screen-content flow-screen guided-screen"><StatusBar end={`${step+1} of 5`}/><div className="step-bar five">{routine.drills.map((_,i) => <i className={i < step ? "done" : i === step ? "current" : ""} key={i}/>)}</div><div className="guided-hero"><p className="kicker">Now playing</p><h1>{current.name}</h1><Ring value={46} size={158}/><strong>02:18</strong><span>remaining</span></div><div className={`metronome ${paused ? "paused" : ""}`}>{[0,1,2,3].map((n) => <i style={{animationDelay:`${n*.71}s`}} key={n}/>)}</div><section className="up-next"><div className="section-head"><h2>Up next</h2></div>{routine.drills.slice(step+1).map((drill) => <div key={drill.name} style={cssVars(drill.key)}><i/><strong>{drill.name}</strong><span>{drill.mins} min</span></div>)}</section><div className="transport guided-actions"><button onClick={() => setStep(Math.min(routine.drills.length-1,step+1))}>Skip<small>next drill</small></button><button className="pause" onClick={() => setPaused(!paused)}>{paused ? "Resume" : "Pause"}<small>84 bpm</small></button></div><button className="finish-link" onClick={() => go("routine-detail")}>End routine</button></div>;
}

export default function FretLabPage() {
  const [view,setView] = useState<View>("today");
  const [selectedKey,setSelectedKey] = useState<KeyName>("G");
  const sessionKey: KeyName = "G";
  useEffect(() => { const stored = window.localStorage.getItem("fretlab-key") as KeyName | null; if (stored && FIFTHS.includes(stored)) setSelectedKey(stored); },[]);
  useEffect(() => { window.localStorage.setItem("fretlab-key",selectedKey); },[selectedKey]);
  const go = (next: View) => { setView(next); window.scrollTo({top:0,behavior:"smooth"}); };
  const primaryView: View = ["today","drills","train","keys","progress"].includes(view) ? view : (view.includes("drill") || view === "grouped" ? "drills" : view.includes("key") || view.includes("scale") ? "keys" : view.includes("routine") || view === "guided" ? "progress" : "today");
  const vars = cssVars(view === "train" || view.includes("key") || view.includes("scale") ? selectedKey : sessionKey);
  return <main className="site-shell" style={vars}>
    <div className="design-caption" aria-hidden="true"><span>FretLab</span><strong>Guitar practice</strong><small>One key-colour system across every practice surface.</small></div>
    <div className={`app-frame view-${view}`}>
      {view === "today" && <Today go={go} sessionKey={sessionKey}/>} {view === "drills" && <Drills go={go}/>} {view === "train" && <Train selectedKey={selectedKey} setSelectedKey={setSelectedKey}/>} {view === "keys" && <Keys selectedKey={selectedKey} setSelectedKey={setSelectedKey} go={go}/>} {view === "progress" && <Progress go={go}/>} {view === "routines" && <Routines go={go}/>} {view === "runner" && <Runner go={go} sessionKey={sessionKey}/>} {view === "summary" && <Summary go={go}/>} {view === "grouped" && <GroupedDrills go={go}/>} {view === "drill-detail" && <DrillDetail go={go} sessionKey={sessionKey}/>} {view === "key-detail" && <KeyDetail go={go} selectedKey={selectedKey}/>} {view === "scale-detail" && <ScaleDetail go={go} selectedKey={selectedKey}/>} {view === "routine-detail" && <RoutineDetail go={go} sessionKey={sessionKey}/>} {view === "guided" && <Guided go={go}/>} 
      <BottomNav active={primaryView} go={go}/>
    </div>
  </main>;
}
