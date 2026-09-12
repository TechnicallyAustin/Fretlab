"use client";

/** App Template Contract v1 §5 — L1 screen for the first-run choice flow. */
import { useState } from "react";
import type { KeyName, View } from "@/lib/fretlab/types";
import { FIFTHS } from "@/lib/fretlab/theory";

export function Onboarding({ go, setSelectedKey, setLeftHanded, finish }: { go: (view: View) => void; setSelectedKey: (key: KeyName) => void; setLeftHanded: (leftHanded: boolean) => void; finish: () => void }) {
  const [experience, setExperience] = useState("Some chords");
  const [focus, setFocus] = useState("Chord changes");
  const [handedness, setHandedness] = useState("Right-handed");
  const [key, setKey] = useState<KeyName>("G");
  const start = () => { setSelectedKey(key); setLeftHanded(handedness === "Left-handed"); finish(); go(focus === "Chord changes" ? "chords" : "train"); };
  return <div className="screen-content onboarding-screen"><header><p className="kicker">Your first practice path</p><h1>Let&apos;s set up your guitar time.</h1><p>Three quick choices help FretLab start at the right level. You can change them later.</p></header><section className="onboarding-step"><h2>What can you already play?</h2><div>{["Just starting", "Some chords", "Songs and chords"].map((item) => <button className={experience === item ? "active" : ""} onClick={() => setExperience(item)} key={item}>{item}</button>)}</div></section><section className="onboarding-step"><h2>What do you want to work on?</h2><div>{["Chord changes", "Know the neck", "Scale shapes"].map((item) => <button className={focus === item ? "active" : ""} onClick={() => setFocus(item)} key={item}>{item}</button>)}</div></section><section className="onboarding-step"><h2>Which key should we use first?</h2><div className="key-choice-grid">{FIFTHS.slice(0, 6).map((item) => <button className={key === item ? "active" : ""} onClick={() => setKey(item)} key={item}>{item}</button>)}</div></section><section className="onboarding-step"><h2>Which way do you hold the guitar?</h2><div><button className={handedness === "Right-handed" ? "active" : ""} onClick={() => setHandedness("Right-handed")}>Right-handed</button><button className={handedness === "Left-handed" ? "active" : ""} onClick={() => setHandedness("Left-handed")}>Left-handed</button></div></section><button className="primary-action onboarding-start" onClick={start}>Start my {focus.toLowerCase()} path <span>→</span></button></div>;
}
