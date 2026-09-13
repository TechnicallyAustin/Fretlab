"use client";

/**
 * App Template Contract v1 §5 — L3 elements. Pure presentation.
 */
/**
 * The kit's hero and session cards.
 *
 * Reconstructed from the kit's own prebuilt gallery bundle: `cards/index.tsx`
 * re-exported `./Hero`, and the archive that was delivered did not contain
 * that file. The compiled components were in `gallery.html`, so these are
 * restored from there rather than reinvented — same markup, same class names,
 * so the stylesheet that shipped with the kit still dresses them.
 */
import type { ReactNode } from "react";
import { Eyebrow, Stat, cx } from "./primitives";

export function Hero({
  eyebrow,
  title,
  sub,
  meta,
  image,
  tone = "dark",
  aside,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  meta?: ReactNode;
  image?: string;
  tone?: "dark" | "light";
  aside?: ReactNode;
}) {
  const dark = tone === "dark";
  return (
    <section className={cx("fl-hero", !dark && "fl-hero--light")}>
      {dark && image && <img className="fl-hero__img" src={image} alt="" />}
      {dark && <div className="fl-hero__scrim" aria-hidden="true" />}
      <div className="fl-hero__body">
        <div className="fl-hero__copy">
          {eyebrow && <Eyebrow onDark={dark}>{eyebrow}</Eyebrow>}
          <h2 className="fl-hero__title">{title}</h2>
          {sub && <p className="fl-hero__sub">{sub}</p>}
          {meta && <div className="fl-hero__meta">{meta}</div>}
        </div>
        {aside}
      </div>
    </section>
  );
}

export function HeroSearch({
  label = "Find a song",
  placeholder = "Title or artist",
  value,
  onChange,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="fl-herosearch">
      <label className="fl-herosearch__label" htmlFor="fl-hero-search">
        {label}
      </label>
      <input
        id="fl-hero-search"
        className="fl-herosearch__input"
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

export function SessionCard({
  eyebrow = "Today's session",
  title,
  sub,
  stats,
  image,
  primary,
  secondary,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  stats?: { value: ReactNode; label: ReactNode }[];
  image?: string;
  primary?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <section className="fl-session">
      {image && <img className="fl-session__img" src={image} alt="" />}
      <div className="fl-session__scrim" aria-hidden="true" />
      <div className="fl-session__body">
        <Eyebrow onDark>{eyebrow}</Eyebrow>
        <h2 className="fl-session__title">{title}</h2>
        {sub && <p className="fl-session__sub">{sub}</p>}
        {stats && (
          <div className="fl-session__stats">
            {stats.map((stat, index) => (
              <Stat key={index} value={stat.value} label={stat.label} onDark />
            ))}
          </div>
        )}
        <div className="fl-session__actions">
          {primary}
          {secondary}
        </div>
      </div>
    </section>
  );
}

export function GuidedRoutineCard({
  eyebrow = "Guided routine",
  title,
  path,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  path?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="fl-guided">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="fl-guided__title">{title}</div>
      {path && <p className="fl-guided__path">{path}</p>}
      {action}
    </div>
  );
}
