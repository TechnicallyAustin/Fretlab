import type { ReactNode } from "react";
import { cx } from "../primitives";

/* ── AppShell ───────────────────────────────────────────────
   Sidebar column + main column. The lavender bloom in the top
   right of every screen is drawn here, once, not per screen. */
export function AppShell({
  sidebar,
  topBar,
  children,
}: {
  sidebar: ReactNode;
  topBar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fl-root fl-shell">
      <aside className="fl-shell__sidebar fl-sidebar">{sidebar}</aside>
      <main className="fl-shell__main">
        <div className="fl-shell__bloom" aria-hidden="true" />
        {topBar}
        <div className="fl-shell__inner">{children}</div>
      </main>
    </div>
  );
}

export function BrandMark({
  mark = "F",
  name = "FretLab",
  tagline,
}: {
  mark?: string;
  name?: string;
  tagline?: ReactNode;
}) {
  return (
    <div className="fl-brand">
      <span className="fl-brand__mark" aria-hidden="true">
        {mark}
      </span>
      <div>
        <div className="fl-brand__name">{name}</div>
        {tagline && <div className="fl-brand__tagline">{tagline}</div>}
      </div>
    </div>
  );
}

export interface NavItemProps {
  label: string;
  /** Section number. Only pass it where the sections really are a sequence. */
  index?: string;
  current?: boolean;
  onSelect?: () => void;
}

export function NavItem({ label, index, current, onSelect }: NavItemProps) {
  return (
    <button
      type="button"
      className="fl-navitem"
      aria-current={current ? "page" : undefined}
      onClick={onSelect}
    >
      <span className="fl-navitem__dot" aria-hidden="true" />
      <span className="fl-navitem__label">{label}</span>
      {index && <span className="fl-navitem__index">{index}</span>}
    </button>
  );
}

export function Nav({ items, current, onSelect }: {
  items: NavItemProps[];
  current?: string;
  onSelect?: (label: string) => void;
}) {
  return (
    <nav className="fl-nav">
      {items.map((item) => (
        <NavItem
          key={item.label}
          {...item}
          current={item.current ?? item.label === current}
          onSelect={() => onSelect?.(item.label)}
        />
      ))}
    </nav>
  );
}

export function ExploreList({
  heading = "Explore",
  items,
  onSelect,
}: {
  heading?: string;
  items: Array<{ label: string; count: number }>;
  onSelect?: (label: string) => void;
}) {
  return (
    <div className="fl-explore">
      <div className="fl-explore__head">{heading}</div>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="fl-exploreitem"
          onClick={() => onSelect?.(item.label)}
        >
          <span>{item.label}</span>
          <span className="fl-exploreitem__count">{item.count}</span>
        </button>
      ))}
    </div>
  );
}

export function SidebarNote({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fl-sidebar__spacer" />
      <p className="fl-sidebar__note">{children}</p>
    </>
  );
}

/* ── TopBar ─────────────────────────────────────────────────
   Breadcrumb on the left, the live status of the current view
   in the middle, global controls on the right. */
export function TopBar({
  product = "FretLab",
  page,
  status,
  actions,
}: {
  product?: string;
  page: string;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="fl-topbar">
      <div className="fl-topbar__crumb">
        {product}
        <div className="fl-topbar__page">{page}</div>
      </div>
      <div className="fl-topbar__centre">{status}</div>
      <div className="fl-topbar__actions">{actions}</div>
    </header>
  );
}

/** Global key selector. Owns --fl-key-h for everything downstream. */
export function KeyPicker({
  keyName,
  description,
  hue,
  onOpen,
}: {
  keyName: string;
  description: string;
  hue?: number;
  onOpen?: () => void;
}) {
  return (
    <button
      type="button"
      className={cx("fl-keypicker")}
      onClick={onOpen}
      style={hue !== undefined ? ({ "--fl-key-h": hue } as React.CSSProperties) : undefined}
    >
      <span className="fl-keybadge">{keyName}</span>
      <span>
        <span className="fl-keypicker__label">Global key</span>
        <span className="fl-keypicker__value" style={{ display: "block" }}>
          {description}
        </span>
      </span>
      <span aria-hidden="true">⌄</span>
    </button>
  );
}
