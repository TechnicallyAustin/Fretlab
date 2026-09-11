"use client";

import { useEffect, useMemo, useState } from "react";

type KeyName = "C" | "G" | "D" | "A" | "E" | "B" | "F#" | "Db" | "Ab" | "Eb" | "Bb" | "F";
type View = "today" | "drills" | "train" | "keys" | "chords" | "chord-detail" | "scales" | "scale-library-detail" | "songs" | "song-detail" | "progress" | "routines" | "runner" | "summary" | "grouped" | "drill-detail" | "key-detail" | "scale-detail" | "routine-detail" | "guided";
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
function intervalShape(key: KeyName, intervals: number[], low: number, high: number) {
  const pcs = intervals.map((n) => (keyPc(key) + n) % 12); const notes: Note[] = [];
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

const CHORDS = [
  { id:"g-major",root:"G" as KeyName,symbol:"G",name:"G major",quality:"Major",formula:"1 · 3 · 5",notes:"G · B · D",fingering:[{s:6,f:3},{s:5,f:2},{s:4,f:0},{s:3,f:0},{s:2,f:0},{s:1,f:3}],tip:"Let the open strings ring; keep the third finger relaxed." },
  { id:"c-major",root:"C" as KeyName,symbol:"C",name:"C major",quality:"Major",formula:"1 · 3 · 5",notes:"C · E · G",fingering:[{s:5,f:3},{s:4,f:2},{s:3,f:0},{s:2,f:1},{s:1,f:0}],tip:"Curve the first finger so the open high E stays clear." },
  { id:"d-major",root:"D" as KeyName,symbol:"D",name:"D major",quality:"Major",formula:"1 · 3 · 5",notes:"D · F# · A",fingering:[{s:4,f:0},{s:3,f:2},{s:2,f:3},{s:1,f:2}],tip:"Start from the open D string and avoid the low E." },
  { id:"a-major",root:"A" as KeyName,symbol:"A",name:"A major",quality:"Major",formula:"1 · 3 · 5",notes:"A · C# · E",fingering:[{s:5,f:0},{s:4,f:2},{s:3,f:2},{s:2,f:2},{s:1,f:0}],tip:"Keep the three second-fret notes compact and let both A notes ring." },
  { id:"e-major",root:"E" as KeyName,symbol:"E",name:"E major",quality:"Major",formula:"1 · 3 · 5",notes:"E · G# · B",fingering:[{s:6,f:0},{s:5,f:2},{s:4,f:2},{s:3,f:1},{s:2,f:0},{s:1,f:0}],tip:"Place the G# first; it is the note that makes the chord major." },
  { id:"f-major",root:"F" as KeyName,symbol:"F",name:"F major",quality:"Major",formula:"1 · 3 · 5",notes:"F · A · C",fingering:[{s:6,f:1},{s:5,f:3},{s:4,f:3},{s:3,f:2},{s:2,f:1},{s:1,f:1}],tip:"Use arm weight instead of squeezing the full first-fret barre." },
  { id:"e-minor",root:"E" as KeyName,symbol:"Em",name:"E minor",quality:"Minor",formula:"1 · b3 · 5",notes:"E · G · B",fingering:[{s:6,f:0},{s:5,f:2},{s:4,f:2},{s:3,f:0},{s:2,f:0},{s:1,f:0}],tip:"Use two adjacent fingers and listen for all six strings." },
  { id:"a-minor",root:"A" as KeyName,symbol:"Am",name:"A minor",quality:"Minor",formula:"1 · b3 · 5",notes:"A · C · E",fingering:[{s:5,f:0},{s:4,f:2},{s:3,f:2},{s:2,f:1},{s:1,f:0}],tip:"Think of C major with fingers two and three shifted inward." },
  { id:"b-minor",root:"B" as KeyName,symbol:"Bm",name:"B minor",quality:"Minor",formula:"1 · b3 · 5",notes:"B · D · F#",fingering:[{s:5,f:2},{s:4,f:4},{s:3,f:4},{s:2,f:3},{s:1,f:2}],tip:"Build the barre first, then place the compact minor shape." },
  { id:"d-seven",root:"D" as KeyName,symbol:"D7",name:"D dominant seven",quality:"Seventh",formula:"1 · 3 · 5 · b7",notes:"D · F# · A · C",fingering:[{s:4,f:0},{s:3,f:2},{s:2,f:1},{s:1,f:2}],tip:"The C on string two creates the pull back toward G." },
  { id:"c-major-seven",root:"C" as KeyName,symbol:"Cmaj7",name:"C major seven",quality:"Seventh",formula:"1 · 3 · 5 · 7",notes:"C · E · G · B",fingering:[{s:5,f:3},{s:4,f:2},{s:3,f:0},{s:2,f:0},{s:1,f:0}],tip:"Lift the first finger from C major to reveal the open B." },
];
const SCALES = [
  { id:"major",name:"Major",mood:"clear · resolved",formula:"W W H W W W H",intervals:[0,2,4,5,7,9,11] },
  { id:"natural-minor",name:"Natural minor",mood:"dark · grounded",formula:"W H W W H W W",intervals:[0,2,3,5,7,8,10] },
  { id:"major-pentatonic",name:"Major pentatonic",mood:"open · melodic",formula:"1 2 3 5 6",intervals:[0,2,4,7,9] },
  { id:"minor-pentatonic",name:"Minor pentatonic",mood:"direct · bluesy",formula:"1 b3 4 5 b7",intervals:[0,3,5,7,10] },
  { id:"dorian",name:"Dorian",mood:"minor · lifted",formula:"1 2 b3 4 5 6 b7",intervals:[0,2,3,5,7,9,10] },
  { id:"mixolydian",name:"Mixolydian",mood:"major · restless",formula:"1 2 3 4 5 6 b7",intervals:[0,2,4,5,7,9,10] },
];
const SONGS = [
  { id:"stand-by-me",title:"Stand by Me",artist:"Ben E. King",key:"A" as KeyName,level:"Beginner",capo:"2nd fret",tempo:118,progression:["G","Em","C","D"],focus:"Four-chord pocket",image:"/guitar-stage.jpg" },
  { id:"dreams",title:"Dreams",artist:"Fleetwood Mac",key:"F" as KeyName,level:"Beginner",capo:"None",tempo:120,progression:["F","G"],focus:"Time and consistency",image:"/guitar-strings.jpg" },
  { id:"house-rising-sun",title:"House of the Rising Sun",artist:"Traditional",key:"A" as KeyName,level:"Intermediate",capo:"None",tempo:78,progression:["Am","C","D","F","E"],focus:"Arpeggio control",image:"/guitar-neck.jpg" },
  { id:"three-little-birds",title:"Three Little Birds",artist:"Bob Marley",key:"A" as KeyName,level:"Beginner",capo:"None",tempo:76,progression:["A","D","E"],focus:"Off-beat rhythm",image:"/guitar-stage.jpg" },
  { id:"knockin",title:"Knockin’ on Heaven’s Door",artist:"Bob Dylan",key:"G" as KeyName,level:"Beginner",capo:"None",tempo:70,progression:["G","D","Am","C"],focus:"Smooth changes",image:"/guitar-strings.jpg" },
  { id:"sweet-home",title:"Sweet Home Alabama",artist:"Lynyrd Skynyrd",key:"D" as KeyName,level:"Intermediate",capo:"None",tempo:98,progression:["D","C","G"],focus:"Riff articulation",image:"/guitar-neck.jpg" },
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
  return <nav className="tab-bar" aria-label="Primary navigation"><div className="desktop-brand" aria-label="FretLab"><span>F</span><div><strong>FretLab</strong><small>Practice one key.<br/>Know the whole neck.</small></div></div><div className="nav-items">{items.map((item,index) => <button key={item.label} onClick={() => go(item.view)} className={item.view === active ? "active" : ""}><i/>{item.label}<small>0{index+1}</small></button>)}</div><div className="desktop-library-nav"><span>Library</span><button onClick={() => go("chords")}>Chords <small>11</small></button><button onClick={() => go("scales")}>Scales <small>6</small></button><button onClick={() => go("songs")}>Songs <small>6</small></button></div><div className="desktop-side-progress"><div><span>Weekly goal</span><strong>68 / 90 min</strong></div><i><b/></i><small>Three sessions this week</small></div><p className="desktop-nav-note">One connected practice system for the entire fretboard.</p></nav>;
}

function DesktopTopbar({ view, selectedKey, go }: { view: View; selectedKey: KeyName; go: (view: View) => void }) {
  const labels: Record<View,string> = { today:"Today",drills:"Drill library",train:"Recall trainer",keys:"Key explorer",chords:"Chord library","chord-detail":"Chord study",scales:"Scale library","scale-library-detail":"Scale study",songs:"Song library","song-detail":"Song practice",progress:"Your progress",routines:"Routines",runner:"Session runner",summary:"Session summary",grouped:"Grouped drills","drill-detail":"Drill detail","key-detail":"Key detail","scale-detail":"Scale position","routine-detail":"Routine detail",guided:"Guided routine" };
  return <header className="desktop-topbar"><div><span>Workspace</span><strong>{labels[view]}</strong></div><div className="desktop-topbar-center"><i/><span>Practice system ready</span><b>31 day streak</b></div><div className="desktop-topbar-actions"><button onClick={() => go("keys")}><span className="topbar-key">{selectedKey}</span>Current key</button><button className="topbar-primary" onClick={() => go("train")}>Quick train <span>→</span></button></div></header>;
}

function DesktopPracticeStudio({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const [mode,setMode] = useState<"Notes" | "Degrees" | "Roots">("Degrees");
  const [bpm,setBpm] = useState(84);
  const [running,setRunning] = useState(false);
  const [meter,setMeter] = useState<3 | 4>(4);
  const [beat,setBeat] = useState(0);
  useEffect(() => { if (!running) { setBeat(0); return; } const timer = window.setInterval(() => setBeat((value) => (value+1)%meter),60000/bpm); return () => window.clearInterval(timer); },[running,bpm,meter]);
  const notes = mode === "Roots" ? targetNotes(sessionKey,0,12) : scaleShape(sessionKey,0,12);
  return <section className="desktop-studio" aria-label="Practice studio"><div className="studio-board"><div className="studio-heading"><div><p className="kicker">Practice studio</p><h2>See one key across the neck</h2></div><div className="studio-modes" role="group" aria-label="Fretboard labels">{(["Notes","Degrees","Roots"] as const).map((item) => <button className={mode === item ? "active" : ""} onClick={() => setMode(item)} key={item}>{item}</button>)}</div></div><Fretboard notes={notes} low={0} high={12} labelMode={mode === "Degrees" ? "degree" : "note"} rootKey={sessionKey}/><div className="studio-legend"><span><i className="root-dot"/>Root</span><span><i/>Scale tone</span><span>Tap Train to test recall without labels.</span></div></div><aside className="tempo-widget"><div className="tempo-widget-head"><div><span>Visual metronome</span><strong>{meter}/4 meter</strong></div><div>{([3,4] as const).map((value) => <button className={meter === value ? "active" : ""} onClick={() => { setMeter(value); setBeat(0); }} key={value}>{value}</button>)}</div></div><div className="tempo-orbit"><div className="beat-orbit">{Array.from({length:meter},(_,index) => <i className={running && beat === index ? "active" : ""} key={index}/>)}</div><strong aria-live="polite">{bpm}</strong><span>bpm</span></div><div className="beat-steps" aria-label={`Beat ${beat+1} of ${meter}`}>{Array.from({length:meter},(_,index) => <i className={running && beat === index ? "active" : ""} key={index}/>)}</div><input className="tempo-slider" type="range" min="40" max="180" step="1" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} aria-label="Tempo"/><div className="tempo-controls"><button onClick={() => setBpm((value) => Math.max(40,value-4))} aria-label="Decrease tempo">−4</button><button className="tempo-play" onClick={() => setRunning(!running)}>{running ? "Pause" : "Start"}</button><button onClick={() => setBpm((value) => Math.min(180,value+4))} aria-label="Increase tempo">+4</button></div><button className="studio-train" onClick={() => go("train")}>Start recall drill <span>→</span></button></aside></section>;
}

function Today({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const week = [["M",14],["T",22],["W",8],["T",18],["F",6],["S",0],["S",0]] as const;
  return <div className="screen-content today-screen"><StatusBar end="31 day streak"/><div className="today-greeting"><p>Thursday</p><h1>Good evening</h1></div>
    <article className="session-hero"><div className="key-watermark">{sessionKey}</div><p className="kicker">Today&apos;s session</p><h2>The key of {sessionKey}</h2><p>Four drills that all live in one key, so the shapes start rhyming.</p><div className="session-stats"><div><strong>18</strong><span>minutes</span></div><div><strong>4</strong><span>drills</span></div><div><strong>84</strong><span>bpm</span></div></div><button className="primary-action" onClick={() => go("runner")}>Start session <span>→</span></button></article>
    <section className="section"><div className="section-head"><h2>This week</h2><span>68 min</span></div><div className="week-chart">{week.map(([day,mins],i) => <div className="day" key={`${day}${i}`}><div className={`bar-track ${i === 4 ? "today" : ""}`} title={`${mins} minutes`}><span style={{ height: mins ? `${Math.max(18,Math.round(mins/22*100))}%` : 0 }}/></div><span>{day}</span></div>)}</div></section>
    <section className="section"><div className="section-head"><h2>Pick up again</h2></div><div className="resume-grid"><button style={cssVars("D")} onClick={() => go("drill-detail")}><span className="key-chip">D</span><Ring value={62}/><strong>Locate: string six</strong><small>3 min left</small></button><button style={cssVars("A")} onClick={() => go("drill-detail")}><span className="key-chip">A</span><Ring value={23}/><strong>Pentatonic box one</strong><small>6 min left</small></button></div></section><DesktopPracticeStudio go={go} sessionKey={sessionKey}/>
  </div>;
}

function Drills({ go }: { go: (view: View) => void }) {
  const [filter,setFilter] = useState("All");
  const [query,setQuery] = useState("");
  const visible = DRILLS.filter((drill) => (filter === "All" || drill.key === filter) && drill.name.toLowerCase().includes(query.toLowerCase()));
  return <div className="screen-content"><AppHeader title="Drills" meta={`${visible.length} drills`} action={<button className="text-action" onClick={() => go("grouped")}>Group</button>}/><div className="chip-scroll">{["All","C","G","D","A","E"].map((key) => <button key={key} onClick={() => setFilter(key)} className={filter === key ? "active" : ""} style={key === "All" ? undefined : cssVars(key as KeyName)}><span/>{key}</button>)}</div><div className="desktop-drill-tools"><label><span>Search the library</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a scale, shape, or skill…"/></label><div><strong>{visible.length}</strong><span>matching drills</span></div></div><div className="drill-list">{visible.map((drill) => <button className="drill-card" key={drill.name} onClick={() => go("drill-detail")} style={cssVars(drill.key)}><Fretboard notes={drill.notes.map(([s,f]) => ({s,f}))} low={drill.low} high={drill.high} mini rootKey={drill.key}/><div className="drill-copy"><strong>{drill.name}</strong><div><span className="key-chip">{drill.key}</span><small>{drill.minutes} min</small><small>·</small><small>{drill.bpm ? `${drill.bpm} bpm` : "free"}</small><i>{[1,2,3].map((n) => <b className={n <= drill.difficulty ? "on" : ""} key={n}/>)}</i></div></div><Ring value={drill.progress} size={44}/></button>)}</div></div>;
}

function Train({ selectedKey, setSelectedKey }: { selectedKey: KeyName; setSelectedKey: (key: KeyName) => void }) {
  const notes = useMemo(() => targetNotes(selectedKey),[selectedKey]);
  const [found,setFound] = useState<Set<string>>(() => new Set(notes.slice(0,-1).map((note) => `${note.s}:${note.f}`)));
  const [misses,setMisses] = useState(0);
  useEffect(() => setFound(new Set(notes.slice(0,-1).map((note) => `${note.s}:${note.f}`))),[notes]);
  const hit = (s:number,f:number) => { const id = `${s}:${f}`; if (notes.some((note) => note.s === s && note.f === f)) setFound((current) => new Set(current).add(id)); else setMisses((n) => n + 1); };
  const skip = () => { setSelectedKey(FIFTHS[(FIFTHS.indexOf(selectedKey)+1)%FIFTHS.length]); setMisses(0); };
  const accuracy = Math.round((found.size / Math.max(1,found.size+misses))*100);
  return <div className="screen-content train-screen"><StatusBar end="Locate"/><div className="train-hero"><p className="kicker">Find every</p><strong>{selectedKey}</strong><span>Frets one to seven. Tap them all.</span></div><Fretboard notes={notes} low={1} high={7} interactive found={found} onCell={hit} rootKey={selectedKey}/><div className="stat-grid"><article><strong>{found.size}/{notes.length}</strong><span>found</span></article><article><strong>0:24</strong><span>elapsed</span></article><article><strong>{accuracy || 0}%</strong><span>accuracy</span></article></div>{found.size === notes.length ? <button className="primary-action" onClick={skip}>Next note <span>→</span></button> : <button className="secondary-action" onClick={skip}>Skip this note</button>}<aside className="desktop-train-guide"><div><p className="kicker">Live target map</p><strong>{notes.length-found.size}</strong><span>locations remain</span></div><div className="target-lanes">{[6,5,4,3,2,1].map((string) => { const total = notes.filter((note) => note.s === string).length; const complete = notes.filter((note) => note.s === string && found.has(`${note.s}:${note.f}`)).length; return <div key={string}><span>{STRING_NAMES[string]}</span><i><b style={{width:`${total ? complete/total*100 : 100}%`}}/></i><small>{complete}/{total}</small></div>; })}</div><p>Scan one string at a time, then repeat without looking at the fret numbers.</p></aside></div>;
}

function CircleOfFifths({ selectedKey, onSelect }: { selectedKey: KeyName; onSelect: (key: KeyName) => void }) {
  const selected = FIFTHS.indexOf(selectedKey);
  return <div className="key-wheel"><svg viewBox="0 0 316 316" role="img" aria-label="Interactive circle of fifths">{FIFTHS.map((key,index) => { const distance = (index-selected+12)%12; const near = distance === 0 || distance === 1 || distance === 11; const h = keyHue(key); return <g key={key} role="button" tabIndex={0} aria-label={`Select ${key} major`} onClick={() => onSelect(key)} onKeyDown={(event) => { if(event.key === "Enter" || event.key === " ") onSelect(key); }}><path d={wedge(158,158,106,150,index*30-14.4,index*30+14.4)} fill={distance === 0 ? `oklch(.62 .16 ${h})` : near ? `oklch(.885 .06 ${h})` : `oklch(.955 .014 ${h})`}/><path d={wedge(158,158,64,102,index*30-14.4,index*30+14.4)} fill={near ? `oklch(.935 .032 ${h})` : `oklch(.975 .008 ${h})`}/></g>; })}<circle cx="158" cy="158" r="58" fill="var(--key-fill-2)" stroke="var(--key-edge)"/></svg>{FIFTHS.map((key,index) => { const outer = polar(158,158,128,index*30); const inner = polar(158,158,84,index*30); return <div key={key}><button onClick={() => onSelect(key)} className={`wheel-label ${selectedKey === key ? "selected" : ""}`} style={{ left:`${outer[0]/316*100}%`,top:`${outer[1]/316*100}%` }}>{key}</button><span className="minor-label" style={{ left:`${inner[0]/316*100}%`,top:`${inner[1]/316*100}%` }}>{majorScale(key)[5]}m</span></div>; })}<div className="wheel-core"><strong>{selectedKey}</strong><span>major</span></div></div>;
}

function LibraryLaunchpad({ go }: { go: (view: View) => void }) {
  const cards: {view:View;label:string;copy:string;image:string;count:string}[] = [{view:"chords",label:"Chord library",copy:"Shapes, voicings and chord-tone maps.",image:"/guitar-strings.jpg",count:"11 chords"},{view:"scales",label:"Scale library",copy:"Six sounds mapped across the neck.",image:"/guitar-neck.jpg",count:"6 families"},{view:"songs",label:"Songs",copy:"Put chords and rhythm into real music.",image:"/guitar-stage.jpg",count:"6 songs"}];
  return <section className="library-launchpad"><div className="section-head"><h2>Explore the full library</h2><span>Choose a way into the neck</span></div><div>{cards.map((card) => <button onClick={() => go(card.view)} key={card.label} style={{backgroundImage:`linear-gradient(110deg,rgba(35,36,47,.86),rgba(35,36,47,.2)),url(${card.image})`}}><span>{card.count}</span><strong>{card.label}</strong><small>{card.copy}</small><b>Open →</b></button>)}</div></section>;
}

function ChordLibrary({ go, onOpen }: { go:(view:View)=>void; onOpen:(id:string)=>void }) {
  const [quality,setQuality] = useState("All"); const [root,setRoot] = useState("All");
  const visible = CHORDS.filter((chord) => (quality === "All" || chord.quality === quality) && (root === "All" || chord.root === root));
  return <div className="screen-content library-screen chord-library-screen"><AppHeader title="Chord library" meta={`${visible.length} shapes`} onBack={() => go("keys")}/><section className="library-photo-hero chord-photo"><div><p className="kicker">Shape meets harmony</p><h2>Every chord is a small map of the key.</h2><p>Choose a shape to see its exact notes, intervals, fingering, movable positions and practice path.</p></div><span>11 essential shapes</span></section><div className="library-controls"><SegmentTabs labels={["All","Major","Minor","Seventh"]} active={quality} onChange={setQuality}/><div className="chip-scroll">{["All","G","C","D","A","E","F","B"].map((key) => <button className={root === key ? "active" : ""} onClick={() => setRoot(key)} key={key}>{key}</button>)}</div></div><div className="chord-library-grid">{visible.map((chord) => <button className="chord-library-card" onClick={() => onOpen(chord.id)} key={chord.id} style={cssVars(chord.root)}><div><span className="chord-symbol">{chord.symbol}</span><span><strong>{chord.name}</strong><small>{chord.notes}</small></span><b>→</b></div><Fretboard notes={chord.fingering} low={0} high={4} mini rootKey={chord.root}/><footer><span>{chord.quality}</span><span>{chord.formula}</span></footer></button>)}</div></div>;
}

function ChordDetail({ go, chordId }: { go:(view:View)=>void; chordId:string }) {
  const chord = CHORDS.find((item) => item.id === chordId) ?? CHORDS[0]; const [tab,setTab] = useState("Shape"); const [voicing,setVoicing] = useState("Open");
  const intervals = chord.quality === "Minor" ? [0,3,7] : chord.quality === "Seventh" ? (chord.symbol.includes("maj") ? [0,4,7,11] : [0,4,7,10]) : [0,4,7];
  const range = voicing === "Open" ? [0,4] : voicing === "Barre" ? [2,7] : [5,10]; const displayNotes = voicing === "Open" ? chord.fingering : intervalShape(chord.root,intervals,range[0],range[1]);
  return <div className="screen-content detail-screen chord-detail-screen" style={cssVars(chord.root)}><AppHeader title={chord.name} meta="Chord library" onBack={() => go("chords")}/><section className="chord-detail-hero"><div><span className="chord-big-symbol">{chord.symbol}</span><div><p className="kicker">{chord.quality} chord</p><h2>{chord.notes}</h2><p>{chord.tip}</p></div></div><div className="chord-hero-photo" aria-label="Close-up guitar strings"/></section><SegmentTabs labels={["Shape","Notes","Practice"]} active={tab} onChange={setTab}/>{tab === "Shape" && <><div className="voicing-picker">{["Open","Barre","Triad"].map((item) => <button className={voicing === item ? "active" : ""} onClick={() => setVoicing(item)} key={item}><strong>{item}</strong><span>{item === "Open" ? "Foundational" : item === "Barre" ? "Movable" : "Strings 1–3"}</span></button>)}</div><div className="fretboard-stage"><div className="section-head"><h2>{voicing} voicing</h2><span>Root notes are square</span></div><Fretboard notes={displayNotes} low={range[0]} high={range[1]} labelMode="note" rootKey={chord.root}/></div><section className="chord-facts"><article><span>Formula</span><strong>{chord.formula}</strong><p>The interval recipe stays the same wherever this chord moves.</p></article><article><span>Chord tones</span><strong>{chord.notes}</strong><p>Find these notes inside nearby scale shapes to build solos around the chord.</p></article><article><span>Best next move</span><strong>{chord.root === "G" ? "C or D" : "Return to G"}</strong><p>Practice one-bar changes without breaking the pulse.</p></article></section></>}{tab === "Notes" && <section className="chord-note-theory"><header><h2>See the chord inside the scale</h2><p>{chord.name} uses {chord.formula.replaceAll(" · ",", ")}. The root gives the chord its name, the third defines major or minor, and the fifth stabilizes the sound.</p></header><div className="theory-visual-grid"><div className="theory-fretboard"><div className="section-head"><h2>Across the guitar</h2><span>Every available voicing</span></div><Fretboard notes={intervalShape(chord.root,intervals,0,12)} low={0} high={12} labelMode="degree" rootKey={chord.root}/><p>The same three or four chord tones repeat across strings. A voicing simply chooses one reachable set.</p></div><PianoMap rootKey={chord.root} intervals={intervals}/></div></section>}{tab === "Practice" && <article className="chord-practice"><div><p className="kicker">Four-minute chord lab</p><h2>Make every note speak</h2><ol><li>Play each string separately and fix muted notes.</li><li>Strum four quarter notes at 72 bpm.</li><li>Change away and return without looking.</li></ol></div><button className="primary-action" onClick={() => go("runner")}>Start practice →</button></article>}</div>;
}

function ScaleLibrary({ go, selectedKey, onOpen }: { go:(view:View)=>void; selectedKey:KeyName; onOpen:(id:string)=>void }) {
  const [family,setFamily] = useState("All"); const visible = SCALES.filter((scale) => family === "All" || (family === "Pentatonic" ? scale.id.includes("pentatonic") : family === "Modes" ? ["dorian","mixolydian"].includes(scale.id) : scale.name.includes(family)));
  return <div className="screen-content library-screen scale-library-screen"><AppHeader title="Scale library" meta={`Key of ${selectedKey}`} onBack={() => go("keys")}/><section className="library-photo-hero scale-photo"><div><p className="kicker">One neck, many sounds</p><h2>Compare scale families without losing your place.</h2><p>Every pattern is generated from the selected key and opens into connected fretboard positions.</p></div><span>{selectedKey} is active</span></section><SegmentTabs labels={["All","Major","Minor","Pentatonic","Modes"]} active={family} onChange={setFamily}/><div className="scale-library-grid">{visible.map((scale,index) => <button className="scale-library-card" onClick={() => onOpen(scale.id)} key={scale.id} style={cssVars(FIFTHS[(FIFTHS.indexOf(selectedKey)+index)%12])}><div><span>0{index+1}</span><strong>{selectedKey} {scale.name}</strong><small>{scale.mood}</small></div><Fretboard notes={intervalShape(selectedKey,scale.intervals,1,7)} low={1} high={7} mini rootKey={selectedKey}/><footer><span>{scale.intervals.length} notes</span><b>{scale.formula}</b></footer></button>)}</div></div>;
}

function ScaleLibraryDetail({ go, selectedKey, scaleId }: { go:(view:View)=>void; selectedKey:KeyName; scaleId:string }) {
  const scale = SCALES.find((item) => item.id === scaleId) ?? SCALES[0]; const [tab,setTab] = useState("Fretboard"); const [position,setPosition] = useState(1); const windows = [[0,4],[2,6],[4,8],[6,10],[8,12]]; const [low,high] = windows[position-1];
  return <div className="screen-content detail-screen scale-library-detail" style={cssVars(selectedKey)}><AppHeader title={`${selectedKey} ${scale.name}`} meta="Scale library" onBack={() => go("scales")}/><section className="scale-detail-banner"><div><p className="kicker">{scale.mood}</p><h2>{scale.formula}</h2><p>{scale.intervals.length} notes · five connected positions · root notes shown as squares</p></div><Ring value={72} size={110} label="72 percent learned"/></section><SegmentTabs labels={["Fretboard","Formula","Practice"]} active={tab} onChange={setTab}/>{tab === "Fretboard" && <><div className="position-picker">{[1,2,3,4,5].map((item) => <button className={position === item ? "active" : ""} onClick={() => setPosition(item)} key={item}>Position {item}</button>)}</div><div className="fretboard-stage"><div className="section-head"><h2>Position {position}</h2><span>Frets {low}–{high}</span></div><Fretboard notes={intervalShape(selectedKey,scale.intervals,low,high)} low={low} high={high} labelMode="degree" rootKey={selectedKey}/></div><section className="position-overlap"><div><span>Previous overlap</span><strong>{Math.max(0,low-2)}–{low}</strong></div><i/><div><span>Current window</span><strong>{low}–{high}</strong></div><i/><div><span>Next overlap</span><strong>{high}–{Math.min(12,high+2)}</strong></div></section></>}{tab === "Formula" && <article className="tab-copy"><h2>How {scale.name} is built</h2><p>{scale.formula}. These intervals are measured from {selectedKey}; preserve them and the same sound moves to any root.</p><div className="formula-steps">{scale.intervals.map((interval,index) => <span key={interval}><strong>{index+1}</strong><small>{interval} semitones</small></span>)}</div></article>}{tab === "Practice" && <article className="chord-practice"><div><p className="kicker">Seven-minute scale lab</p><h2>Connect two positions</h2><ol><li>Ascend position {position} at 72 bpm.</li><li>Cross into the next position on string three.</li><li>Improvise and resolve every phrase to {selectedKey}.</li></ol></div><button className="primary-action" onClick={() => go("runner")}>Start practice →</button></article>}</div>;
}

function SongLibrary({ go, onOpen }: { go:(view:View)=>void; onOpen:(id:string)=>void }) {
  const [level,setLevel] = useState("All"); const [query,setQuery] = useState(""); const visible = SONGS.filter((song) => (level === "All" || song.level === level) && `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="screen-content library-screen song-library-screen"><AppHeader title="Songs" meta={`${visible.length} arrangements`} onBack={() => go("keys")}/><section className="songs-hero"><div><p className="kicker">Play music sooner</p><h2>Turn the shapes you know into complete songs.</h2><p>Each arrangement connects chord changes, rhythm, tempo and the key map.</p></div><div className="song-search"><label htmlFor="song-search">Find a song</label><input id="song-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or artist…"/></div></section><SegmentTabs labels={["All","Beginner","Intermediate"]} active={level} onChange={setLevel}/><div className="song-library-grid">{visible.map((song) => <button className="song-card" onClick={() => onOpen(song.id)} key={song.id} style={{...cssVars(song.key),backgroundImage:`linear-gradient(180deg,rgba(25,25,30,.04),rgba(25,25,30,.88)),url(${song.image})`}}><span className="key-chip">Key {song.key}</span><div><small>{song.level} · {song.tempo} bpm</small><strong>{song.title}</strong><p>{song.artist}</p><footer>{song.progression.map((chord) => <span key={chord}>{chord}</span>)}</footer></div></button>)}</div></div>;
}

function SongDetail({ go, songId, onChord }: { go:(view:View)=>void; songId:string; onChord:(id:string)=>void }) {
  const song = SONGS.find((item) => item.id === songId) ?? SONGS[0]; const [section,setSection] = useState("Verse"); const [playing,setPlaying] = useState(false);
  const openChord = (symbol:string) => { const chord = CHORDS.find((item) => item.symbol === symbol); if (chord) onChord(chord.id); };
  return <div className="screen-content detail-screen song-detail-screen" style={cssVars(song.key)}><AppHeader title={song.title} meta={song.artist} onBack={() => go("songs")}/><section className="song-detail-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(20,21,28,.94),rgba(20,21,28,.28)),url(${song.image})`}}><div><span>{song.level} arrangement</span><h2>{song.title}</h2><p>{song.artist}</p><div><b>{song.tempo} bpm</b><b>Key {song.key}</b><b>{song.capo}</b></div></div><button onClick={() => setPlaying(!playing)}>{playing ? "Pause count-in" : "Start count-in"}<span>{playing ? "Ⅱ" : "▶"}</span></button></section><div className="song-workspace"><section><SegmentTabs labels={["Verse","Chorus","Bridge"]} active={section} onChange={setSection}/><div className="song-timeline">{song.progression.concat(song.progression).map((chord,index) => <button onClick={() => openChord(chord)} key={`${chord}${index}`}><span>{index+1}</span><strong>{chord}</strong><small>{index%2 ? "2 beats" : "4 beats"}</small></button>)}</div><p className="song-instruction">{section === "Verse" ? `Keep the ${song.focus.toLowerCase()} steady and let every chord land on beat one.` : section === "Chorus" ? "Open the strum slightly and let the top strings carry the lift." : "Reduce the pattern to down-strokes, then rebuild the groove."}</p></section><aside><div className="section-head"><h2>Chord set</h2><span>Click to study</span></div>{song.progression.map((symbol) => { const chord=CHORDS.find((item)=>item.symbol===symbol); return <button onClick={() => chord && onChord(chord.id)} key={symbol}><span className="relation-key">{symbol}</span><span><strong>{chord?.name ?? symbol}</strong><small>{chord?.notes ?? "Song chord"}</small></span><b>→</b></button>; })}<div className="song-practice-goal"><span>Practice goal</span><strong>3 clean loops</strong><i><b style={{width:"34%"}}/></i></div></aside></div></div>;
}

function Keys({ selectedKey, setSelectedKey, go }: { selectedKey: KeyName; setSelectedKey: (key: KeyName) => void; go: (view: View) => void }) {
  const scale = majorScale(selectedKey); const qualities = ["","m","m","","","m","dim"]; const romans = ["I","ii","iii","IV","V","vi","vii°"];
  const index = FIFTHS.indexOf(selectedKey); const neighbours = [FIFTHS[(index+11)%12],FIFTHS[(index+1)%12]];
  return <div className="screen-content keys-screen"><StatusBar end="Keys"/><CircleOfFifths selectedKey={selectedKey} onSelect={setSelectedKey}/><section className="section chord-section"><div className="section-head"><h2>Its seven chords</h2><button onClick={() => go("key-detail")}>Open key →</button></div><div className="chord-chips">{scale.map((note,index) => <span key={note}><i style={{ background:palette(FIFTHS[(FIFTHS.indexOf(selectedKey)+[0,2,4,-1,1,3,5][index]+12)%12]).bright }}/><small>{romans[index]}</small>{note}{qualities[index]}</span>)}</div><p>Keys next to each other on the wheel share six of seven notes. That overlap is why moving one step around the circle sounds close, not abrupt.</p></section><aside className="desktop-key-relations"><div className="section-head"><h2>Closest harmonic neighbours</h2><span>6 shared notes</span></div><div>{neighbours.map((key) => <button key={key} onClick={() => setSelectedKey(key)} style={cssVars(key)}><span className="relation-key">{key}</span><span><strong>{key} major</strong><small>{majorScale(key).join(" · ")}</small></span><b>→</b></button>)}</div><p>Move clockwise for more forward pull; move counter-clockwise for a softer return.</p></aside><LibraryLaunchpad go={go}/></div>;
}

function Progress({ go }: { go: (view: View) => void }) {
  const [range,setRange] = useState<"7 days" | "14 days" | "30 days">("14 days");
  const data = { "7 days":[74,71,79,76,82,84,87], "14 days":[61,68,64,74,71,79,76,82,78,85,83,87,84,87], "30 days":[55,58,57,61,60,64,63,66,68,65,70,69,72,74,71,76,75,79,78,81,80,83,82,85,84,86,85,87,86,87] };
  const values = data[range]; const points = values.map((v,i) => `${i/(values.length-1)*100},${100-(v-55)/40*82}`).join(" ");
  const heat = Array.from({length:72},(_,i) => Math.min(1,Math.max(.06,.55+.42*Math.sin((Math.floor(i/12)+1)*1.7+(i%12+1)*.9)*Math.cos((i%12+1)*.42+(Math.floor(i/12)+1)*.6))));
  return <div className="screen-content"><AppHeader title="Progress" meta="This month" action={<button className="text-action" onClick={() => go("routines")}>Routines</button>}/><div className="desktop-progress-range"><span>Performance window</span><div>{(["7 days","14 days","30 days"] as const).map((item) => <button className={range === item ? "active" : ""} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div><article className="dial-card"><Ring value={87} size={142}/><div><p className="kicker">Neck knowledge</p><h2>87% accurate</h2><p>Your cleanest week yet. You are finding notes before the shape has time to disappear.</p><div className="mini-stats"><span><strong>31</strong> day streak</span><span><strong>1,284</strong> reps</span></div></div></article><section className="chart-card"><div className="section-head"><h2>Daily accuracy</h2><span>Last {range}</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`Daily accuracy rising to ${values.at(-1)} percent over ${range}`}><defs><linearGradient id="spark" x1="0" x2="1"><stop stopColor="oklch(.58 .14 262)"/><stop offset="1" stopColor="oklch(.55 .15 148)"/></linearGradient><linearGradient id="area" x1="0" x2="0" y2="1"><stop stopColor="oklch(.82 .07 289)" stopOpacity=".55"/><stop offset="1" stopColor="transparent"/></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#area)"/><polyline points={points} fill="none" stroke="url(#spark)" strokeWidth="2.2" vectorEffect="non-scaling-stroke"/></svg></section><section className="heat-card"><div className="section-head"><h2>Where you know the neck</h2><span>12 frets</span></div><div className="heat-map">{heat.map((v,i) => <span key={i} title={`${Math.round(v*100)}% known`} style={{ background:`oklch(${(.955-.28*v).toFixed(3)} ${(.014+.145*v).toFixed(3)} ${252+150*v})` }}/>)}</div><div className="heat-labels">{Array.from({length:12},(_,i) => <span key={i}>{i+1}</span>)}</div><div className="legend"><span>Still learning</span><i/><span>Solid</span></div></section><section className="desktop-progress-insights"><article><span>Fastest gain</span><strong>String 4</strong><small>+18% this month</small><i><b style={{width:"82%"}}/></i></article><article><span>Needs another pass</span><strong>Frets 8–10</strong><small>64% recall</small><i><b style={{width:"64%"}}/></i></article><article><span>Next milestone</span><strong>90% accuracy</strong><small>3 points away</small><i><b style={{width:"87%"}}/></i></article></section></div>;
}

function Routines({ go }: { go: (view: View) => void }) {
  return <div className="screen-content"><AppHeader title="Routines" meta="Routines"/><p className="routines-intro">Each band is a drill, sized by minutes and coloured by its key.</p><section className="desktop-routine-summary"><div><span>This week</span><strong>3</strong><small>sessions</small></div><div><span>Practice time</span><strong>68</strong><small>minutes</small></div><div><span>Next routine</span><strong>18</strong><small>minutes · key of G</small></div><button onClick={() => go("routine-detail")}>Open today&apos;s plan <span>→</span></button></section><div className="routine-list">{ROUTINES.map((routine) => { const total = routine.drills.reduce((sum,d) => sum+d.mins,0); const keys = [...new Set(routine.drills.map((d) => d.key))]; return <article className="routine-card" key={routine.name} style={cssVars(routine.drills[0].key)}><div className="routine-title"><div><h2>{routine.name}</h2><p>{total} min · {routine.drills.length} drills</p></div><div className="routine-keys">{keys.map((key) => <span key={key} style={cssVars(key)}>{key}</span>)}</div></div><div className="routine-bands">{routine.drills.map((d,i) => <span key={`${d.name}${i}`} style={{...cssVars(d.key),flex:d.mins}}><b>{d.key}</b><small>{d.mins}m</small></span>)}</div><div className="routine-foot"><span>{[1,2,3].map((n) => <i className={n <= routine.completed ? "on" : ""} key={n}/>)} {routine.last}</span><button onClick={() => go("routine-detail")}>Start</button></div></article>; })}</div></div>;
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

function PianoMap({ rootKey, intervals = [0,2,4,5,7,9,11] }: { rootKey:KeyName; intervals?:number[] }) {
  const root = keyPc(rootKey); const active = new Set(intervals.map((interval) => (root+interval)%12)); const whites = [{name:"C",pc:0},{name:"D",pc:2},{name:"E",pc:4},{name:"F",pc:5},{name:"G",pc:7},{name:"A",pc:9},{name:"B",pc:11}]; const blacks = [{name:"C#",pc:1,left:14.3},{name:"D#",pc:3,left:28.6},{name:"F#",pc:6,left:57.1},{name:"G#",pc:8,left:71.4},{name:"A#",pc:10,left:85.7}];
  return <div className="piano-card"><div className="section-head"><h2>Same notes on a piano</h2><span>One linear octave</span></div><div className="piano-map" aria-label={`${rootKey} notes on a piano keyboard`}><div className="white-keys">{whites.map((key) => <div className={`${active.has(key.pc) ? "active" : ""} ${key.pc === root ? "root" : ""}`} key={key.name}><span>{key.name}</span></div>)}</div>{blacks.map((key) => <div className={`black-key ${active.has(key.pc) ? "active" : ""} ${key.pc === root ? "root" : ""}`} style={{left:`${key.left}%`}} key={key.name}><span>{key.name}</span></div>)}</div><p>A piano shows pitch once from left to right. Guitar repeats those same pitches across six offset strings, which creates multiple routes to the same note.</p></div>;
}

function TheoryLesson({ rootKey }: { rootKey:KeyName }) {
  const scale = majorScale(rootKey); const degrees = ["1","2","3","4","5","6","7"]; const roles = ["home","motion","major colour","tension","anchor","warmth","leading tone"];
  return <section className="theory-lesson"><header><p className="kicker">Theory you can see and play</p><h2>Why {rootKey} major works</h2><p>The scale is not a shape; it is a distance recipe. The guitar gives that recipe several overlapping physical paths.</p></header><div className="theory-visual-grid"><div className="theory-fretboard"><div className="section-head"><h2>Across the guitar</h2><span>Frets 0–7</span></div><Fretboard notes={scaleShape(rootKey,0,7)} low={0} high={7} labelMode="degree" rootKey={rootKey}/><p>Square roots mark every place the key feels finished. Follow the same degree across strings to see why a box is only one slice of the neck.</p></div><PianoMap rootKey={rootKey}/></div><div className="degree-story">{scale.map((note,index) => <div className={index === 0 || index === 4 || index === 6 ? "focus" : ""} key={note}><span>{degrees[index]}</span><strong>{note}</strong><small>{roles[index]}</small></div>)}</div><section className="interval-explainer"><div><span>Whole</span><strong>2 frets</strong><p>On one string, a whole step skips one fret—like moving two piano keys.</p></div><i>→</i><div><span>Half</span><strong>1 fret</strong><p>A half step is the next fret—like two neighboring piano keys, white or black.</p></div><i>→</i><div><span>Octave</span><strong>12 frets</strong><p>The note name repeats, higher in pitch. On guitar it also appears on nearby strings.</p></div></section><div className="guitar-piano-compare"><article><span>On piano</span><h3>Pitch moves in one direction</h3><p>Each key is one semitone higher than the last, so interval distance is visually obvious.</p></article><article><span>On guitar</span><h3>Pitch moves across and along</h3><p>Moving up a fret raises one semitone; changing strings relocates the same notes into new shapes.</p></article><article><span>What to practise</span><h3>Name the degree before the fret</h3><p>Say “root, third, fifth” as you play. Function transfers between keys more reliably than memorized dot patterns.</p></article></div></section>;
}

function DrillHistory({ rootKey }: { rootKey:KeyName }) {
  const sessions = [{day:"Today",bpm:84,accuracy:94,time:"4:02"},{day:"Tue",bpm:80,accuracy:96,time:"4:18"},{day:"Sun",bpm:76,accuracy:89,time:"4:31"},{day:"Thu",bpm:72,accuracy:86,time:"4:47"}];
  return <section className="drill-history"><header><p className="kicker">Practice history</p><h2>This shape is becoming automatic</h2><p>Tempo is up 12 bpm while accuracy has stayed above 86%.</p></header><div className="history-summary"><article><span>Best clean tempo</span><strong>84 <small>bpm</small></strong><b>+12 this month</b></article><article><span>Average accuracy</span><strong>91<small>%</small></strong><b>4-session average</b></article><article><span>Total repetitions</span><strong>148</strong><b>Across 9 sessions</b></article></div><div className="history-grid"><section><div className="section-head"><h2>Tempo and accuracy</h2><span>Last four sessions</span></div><div className="history-bars">{sessions.map((session) => <div key={session.day}><span>{session.day}</span><i><b style={{width:`${session.accuracy}%`}}/></i><strong>{session.accuracy}%</strong><small>{session.bpm} bpm</small></div>)}</div></section><aside><div className="section-head"><h2>Coach note</h2><span>Key of {rootKey}</span></div><strong>The turnaround is the only unstable moment.</strong><p>Your ascending pass averages 97%. The direction change drops to 84%, so isolate the highest two notes before another full run.</p><div><span>Next target</span><b>88 bpm at 92%+</b></div></aside></div><div className="session-log"><div className="section-head"><h2>Session log</h2><span>Most recent first</span></div>{sessions.map((session,index) => <div key={session.day}><span className="history-check">{index < 2 ? "✓" : "·"}</span><strong>{session.day}</strong><span>{session.time}</span><span>{session.bpm} bpm</span><span>{session.accuracy}% accurate</span></div>)}</div></section>;
}

function DrillDetail({ go, sessionKey }: { go: (view: View) => void; sessionKey: KeyName }) {
  const [tab,setTab] = useState("Practice"); const [tempo,setTempo] = useState(84); const drill = DRILLS[0];
  return <div className={`screen-content detail-screen drill-detail-screen tab-${tab.toLowerCase()}`}><StatusBar end="Drills"/><div className="detail-back"><button onClick={() => go("drills")}>Back</button><span className="key-chip">Key of {sessionKey}</span></div><div className="detail-title"><h1>Position one, up and back</h1><p>Six notes, two strings, no shifting. The one drill that makes every other shape in this key easier.</p></div><SegmentTabs labels={["Practice","Theory","History"]} active={tab} onChange={setTab}/>{tab === "Practice" && <><Fretboard notes={drill.notes.map(([s,f]) => ({s,f}))} low={1} high={5} labelMode="note" rootKey={sessionKey}/><section className="tempo-section"><div className="section-head"><h2>Tempo ladder</h2><span>{tempo} bpm</span></div><div>{[60,72,84,96,108].map((bpm) => <button className={tempo === bpm ? "active" : ""} onClick={() => setTempo(bpm)} key={bpm}>{bpm}</button>)}</div></section><ol className="instruction-list">{[["Set the click",`One note per beat at ${tempo} bpm, down-strokes only.`],["Up and back, twice","No stopping at the turn. The top note is not a rest."],["Add the turnaround","Land on G on beat one of every bar."]].map(([title,body],i) => <li key={title}><span>{i+1}</span><div><strong>{title}</strong><p>{body}</p></div></li>)}</ol></>}{tab === "Theory" && <TheoryLesson rootKey={sessionKey}/>} {tab === "History" && <DrillHistory rootKey={sessionKey}/>}<div className="sticky-action"><button className="primary-action" onClick={() => go("runner")}>Start drill</button></div></div>;
}

function KeyDetail({ go, selectedKey }: { go: (view: View) => void; selectedKey: KeyName }) {
  const [tab,setTab] = useState("Scales"); const scale = majorScale(selectedKey); const roles = ["home","passing","bright","pull","anchor","soft","leaning"];
  return <div className="screen-content key-detail-screen"><StatusBar end="Keys"/><div className="key-detail-hero"><span className="key-badge">{selectedKey}</span><div><h1>{selectedKey} major</h1><p>{selectedKey === "G" ? "One sharp" : `${scale.filter((n) => n.includes("#") || n.includes("b")).length} accidentals`} · relative minor {scale[5]}</p></div></div><SegmentTabs labels={["Scales","Chords","Theory"]} active={tab} onChange={setTab}/>{tab === "Scales" && <><section className="section"><div className="section-head"><h2>The seven notes, and what each one does</h2></div><div className="degree-strip">{scale.map((note,i) => <div className={i === 0 || i === 4 ? "strong" : ""} key={note}><strong>{note}</strong><small>{roles[i]}</small></div>)}</div></section><section className="section shape-section"><div className="section-head"><h2>Five shapes, one scale</h2><button onClick={() => go("scale-detail")}>Open shape →</button></div><div className="shape-row">{[[0,3],[2,5],[4,7],[6,9],[8,12]].map(([low,high],i) => <button className={i === 1 ? "active" : ""} onClick={() => go("scale-detail")} key={i}><Fretboard notes={scaleShape(selectedKey,low,high)} low={low} high={high} mini rootKey={selectedKey}/><span>{["I","II","III","IV","V"][i]}</span></button>)}</div><p>Those five shapes are the same seven notes seen from five places on the neck. Learn where they overlap and the neck stops being twelve separate frets.</p></section></>}{tab === "Chords" && <section className="harmony-lesson"><header><h2>Seven chords come from seven scale degrees</h2><p>Stack every other note of the scale. The available thirds determine whether each chord is major, minor or diminished.</p></header><div>{scale.map((note,i) => <article key={note}><span>{["I","ii","iii","IV","V","vi","vii°"][i]}</span><strong>{note}{["","m","m","","","m","dim"][i]}</strong><small>{["home","departure","colour","open","tension","relative minor","leading"][i]}</small></article>)}</div><PianoMap rootKey={selectedKey}/></section>}{tab === "Theory" && <TheoryLesson rootKey={selectedKey}/>}</div>;
}

function ScaleDetail({ go, selectedKey }: { go: (view: View) => void; selectedKey: KeyName }) {
  const [tab,setTab] = useState("Shapes"); const [position,setPosition] = useState(2); const windows = [[0,3],[2,5],[4,7],[6,9],[8,12]]; const [low,high] = windows[position-1];
  return <div className="screen-content detail-screen"><AppHeader title={`Position ${["I","II","III","IV","V"][position-1]}`} meta={`${selectedKey} major`} onBack={() => go("key-detail")}/><p className="detail-lede">A connected piece of the same {selectedKey} major scale. Use the root notes to orient the shape.</p><SegmentTabs labels={["Shapes","Sound","Theory"]} active={tab} onChange={setTab}/>{tab === "Shapes" && <><div className="position-picker">{[1,2,3,4,5].map((n) => <button className={position === n ? "active" : ""} onClick={() => setPosition(n)} key={n}>{["I","II","III","IV","V"][n-1]}</button>)}</div><Fretboard notes={scaleShape(selectedKey,low,high)} low={low} high={high} labelMode="degree" rootKey={selectedKey}/><section className="steps-section"><div className="section-head"><h2>How the steps fall</h2></div><div className="step-pattern">{["W","W","H","W","W","W","H"].map((step,i) => <span className={step === "H" ? "half" : ""} style={{flex:step === "W" ? 2 : 1}} key={i}>{step}</span>)}</div><p>Wide, wide, narrow, wide, wide, wide, narrow. Those two narrow steps are what make it sound major. Move one and you are in a different scale entirely.</p></section></>}{tab === "Sound" && <article className="sound-lesson"><div><p className="kicker">Train the ear</p><h2>Hear distance from the root</h2><p>Resolve phrases to {selectedKey}. The second wants to move, the fourth leans downward, the fifth feels stable, and the seventh strongly pulls home.</p></div><div className="degree-tension">{["1 home","2 open","3 bright","4 pull","5 anchor","6 warm","7 leading"].map((item,index) => <span className={index === 0 || index === 4 ? "strong" : ""} key={item}>{item}</span>)}</div></article>}{tab === "Theory" && <TheoryLesson rootKey={selectedKey}/>}</div>;
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
  const [selectedChord,setSelectedChord] = useState("g-major");
  const [selectedScale,setSelectedScale] = useState("major");
  const [selectedSong,setSelectedSong] = useState("stand-by-me");
  const sessionKey: KeyName = "G";
  useEffect(() => { const stored = window.localStorage.getItem("fretlab-key") as KeyName | null; if (stored && FIFTHS.includes(stored)) setSelectedKey(stored); },[]);
  useEffect(() => { window.localStorage.setItem("fretlab-key",selectedKey); },[selectedKey]);
  const go = (next: View) => { setView(next); window.scrollTo({top:0,behavior:"smooth"}); };
  const primaryView: View = ["today","drills","train","keys","progress"].includes(view) ? view : (view.includes("drill") || view === "grouped" ? "drills" : view.includes("key") || view.includes("scale") || view.includes("chord") || view.includes("song") ? "keys" : view.includes("routine") || view === "guided" ? "progress" : "today");
  const vars = cssVars(view === "train" || view.includes("key") || view.includes("scale") ? selectedKey : sessionKey);
  return <main className="site-shell" style={vars}>
    <div className="design-caption" aria-hidden="true"><span>FretLab</span><strong>Guitar practice</strong><small>One key-colour system across every practice surface.</small></div>
    <div className={`app-frame view-${view}`}>
      <DesktopTopbar view={view} selectedKey={selectedKey} go={go}/>
      {view === "today" && <Today go={go} sessionKey={sessionKey}/>} {view === "drills" && <Drills go={go}/>} {view === "train" && <Train selectedKey={selectedKey} setSelectedKey={setSelectedKey}/>} {view === "keys" && <Keys selectedKey={selectedKey} setSelectedKey={setSelectedKey} go={go}/>} {view === "chords" && <ChordLibrary go={go} onOpen={(id) => { setSelectedChord(id); go("chord-detail"); }}/>} {view === "chord-detail" && <ChordDetail go={go} chordId={selectedChord}/>} {view === "scales" && <ScaleLibrary go={go} selectedKey={selectedKey} onOpen={(id) => { setSelectedScale(id); go("scale-library-detail"); }}/>} {view === "scale-library-detail" && <ScaleLibraryDetail go={go} selectedKey={selectedKey} scaleId={selectedScale}/>} {view === "songs" && <SongLibrary go={go} onOpen={(id) => { setSelectedSong(id); go("song-detail"); }}/>} {view === "song-detail" && <SongDetail go={go} songId={selectedSong} onChord={(id) => { setSelectedChord(id); go("chord-detail"); }}/>} {view === "progress" && <Progress go={go}/>} {view === "routines" && <Routines go={go}/>} {view === "runner" && <Runner go={go} sessionKey={sessionKey}/>} {view === "summary" && <Summary go={go}/>} {view === "grouped" && <GroupedDrills go={go}/>} {view === "drill-detail" && <DrillDetail go={go} sessionKey={sessionKey}/>} {view === "key-detail" && <KeyDetail go={go} selectedKey={selectedKey}/>} {view === "scale-detail" && <ScaleDetail go={go} selectedKey={selectedKey}/>} {view === "routine-detail" && <RoutineDetail go={go} sessionKey={sessionKey}/>} {view === "guided" && <Guided go={go}/>}
      <BottomNav active={primaryView} go={go}/>
    </div>
  </main>;
}
