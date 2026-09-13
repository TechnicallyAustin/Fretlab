import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { useRef } from "react";

const cx = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(" ");

/* ── Button ─────────────────────────────────────────────────
   Every filled, outlined and quiet action in the app. */
export type ButtonVariant = "primary" | "outline" | "quiet" | "onDark";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  leading?: ReactNode;
  /** Trailing glyph. The shipped screens use an arrow on navigational actions. */
  trailing?: ReactNode;
}

export function Button({
  variant = "outline",
  size = "md",
  block,
  loading,
  leading,
  trailing,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        "fl-btn",
        `fl-btn--${variant}`,
        size !== "md" && `fl-btn--${size}`,
        block && "fl-btn--block",
        className,
      )}
      {...rest}
      aria-busy={loading || undefined}
      disabled={loading || rest.disabled}
    >
      {leading && <span className="fl-btn__icon" aria-hidden="true">{leading}</span>}
      {children}
      {loading ? <span className="fl-btn__spinner" aria-hidden="true" /> : trailing && <span aria-hidden="true">{trailing}</span>}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: these buttons carry no visible text. */
  label: string;
  round?: boolean;
}

export function IconButton({ label, round, children, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx("fl-iconbtn", round && "fl-iconbtn--round", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The small audition control on chord, scale and drill cards. */
export function HearButton({
  children = "Hear",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="fl-hear" {...rest}>
      <span className="fl-hear__glyph" aria-hidden="true">
        ▶
      </span>
      {children}
    </button>
  );
}

export function ArrowLink({
  href,
  onDark,
  children,
  ...rest
}: { href?: string; onDark?: boolean; children: ReactNode } & HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      className={cx("fl-arrowlink", onDark && "fl-arrowlink--onDark")}
      {...rest}
    >
      {children}
      <span aria-hidden="true">→</span>
    </a>
  );
}

/* ── Pills and segmented controls ───────────────────────────
   Three related selectors:
     PillGroup      loose chips  (All / Major / Minor / Pentatonic)
     SegmentedControl  equal-width bar (All / Beginner / Intermediate)
     TempoLadder    lives in practice/, same idea with numbers */
export interface Option<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface PillGroupProps<T extends string = string> {
  options: Array<Option<T> | T>;
  value: T;
  onChange?: (value: T) => void;
  /** Circular pills, used for the chord root row. */
  circle?: boolean;
  tinted?: boolean;
  label?: string;
}

export function PillGroup<T extends string = string>({
  options,
  value,
  onChange,
  circle,
  tinted,
  label,
}: PillGroupProps<T>) {
  const items = options.map((o) => (typeof o === "string" ? { value: o as T, label: o } : o));
  const rootRef = useRef<HTMLDivElement>(null);
  const move = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!delta && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + delta + items.length) % items.length;
    rootRef.current?.querySelectorAll<HTMLButtonElement>(".fl-pill")[next]?.focus();
  };
  return (
    <div ref={rootRef} className="fl-pillgroup" role="group" aria-label={label}>
      {items.map((o, index) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange?.(o.value)}
          onKeyDown={(event) => move(event, index)}
          className={cx(
            "fl-pill",
            circle && "fl-pill--circle",
            tinted && o.value !== value && "fl-pill--tinted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface SegmentedControlProps<T extends string = string> extends PillGroupProps<T> {
  compact?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  compact,
  label,
}: SegmentedControlProps<T>) {
  const items = options.map((o) => (typeof o === "string" ? { value: o as T, label: o } : o));
  return (
    <div className={cx("fl-seg", compact && "fl-seg--compact")} role="group" aria-label={label}>
      {items.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange?.(o.value)}
          className="fl-seg__item"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Tags, badges, status ───────────────────────────────── */
export type Level = "beginner" | "intermediate" | "advanced";
export type TagTone = "accent" | "neutral" | "onDark" | Level;

export function Tag({
  tone = "accent",
  children,
  onRemove,
  removeLabel = "Remove label",
}: {
  tone?: TagTone;
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span className={cx("fl-tag", onRemove && "fl-tag--removable", tone !== "accent" && `fl-tag--${tone}`)}>
      {children}
      {onRemove && <button type="button" className="fl-tag__remove" aria-label={removeLabel} onClick={onRemove}>×</button>}
    </span>
  );
}

/** Beginner / Intermediate / Advanced, coloured by level. */
export function LevelBadge({ level }: { level: Level }) {
  const label = level[0].toUpperCase() + level.slice(1);
  return <Tag tone={level}>{label}</Tag>;
}

export function StatusPill({ children, idle }: { children: ReactNode; idle?: boolean }) {
  return (
    <span className={cx("fl-status", idle && "fl-status--idle")}>
      <span className="fl-status__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

/** The square letter mark for a key or a chord root. Tinted by --fl-key-h. */
export function KeyBadge({
  keyName,
  hue,
  size = "md",
}: {
  keyName: string;
  hue?: number;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cx("fl-keybadge", size === "lg" && "fl-keybadge--lg")}
      style={hue !== undefined ? ({ "--fl-key-h": hue } as CSSProperties) : undefined}
    >
      {keyName}
    </span>
  );
}

/** Three-dot progress meter on drill cards. */
export function ProgressDots({ total = 3, filled = 0 }: { total?: number; filled?: number }) {
  return (
    <span className="fl-dots" role="img" aria-label={`${filled} of ${total} passes logged`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx("fl-dots__dot", i < filled && "fl-dots__dot--on")} />
      ))}
    </span>
  );
}

/** −/+ numeric stepper. Used for BPM on the drill screen. */
export function Stepper({
  value,
  unit,
  step = 1,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  label: string;
}) {
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  return (
    <div className="fl-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="fl-stepper__btn"
        aria-label={`Decrease ${label}`}
        disabled={min !== undefined && value <= min}
        onClick={() => onChange?.(clamp(value - step))}
      >
        −
      </button>
      <span className="fl-stepper__value" aria-live="polite" aria-atomic="true">
        <span className="fl-stepper__num">{value}</span>
        {unit && <span className="fl-stepper__unit">{unit}</span>}
      </span>
      <button
        type="button"
        className="fl-stepper__btn"
        aria-label={`Increase ${label}`}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange?.(clamp(value + step))}
      >
        +
      </button>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cx("fl-switchfield", disabled && "fl-switchfield--disabled")}>
      <span><span className="fl-field__label">{label}</span>{description && <span className="fl-field__hint">{description}</span>}</span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} />
      <span className="fl-switch" aria-hidden="true"><span className="fl-switch__thumb" /></span>
    </label>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; error?: ReactNode }) {
  const help = error ?? hint;
  return (
    <label className={cx("fl-field", error && "fl-field--error", className)}>
      <span className="fl-field__label">{label}</span>
      <input className="fl-field__control" aria-invalid={Boolean(error)} {...rest} />
      {help && <span className="fl-field__hint">{help}</span>}
    </label>
  );
}

export function SelectField({
  label,
  hint,
  children,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; hint?: ReactNode }) {
  return (
    <label className={cx("fl-field", className)}>
      <span className="fl-field__label">{label}</span>
      <span className="fl-selectwrap"><select className="fl-field__control fl-field__select" {...rest}>{children}</select></span>
      {hint && <span className="fl-field__hint">{hint}</span>}
    </label>
  );
}

export function RangeControl({
  label,
  value,
  unit,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value"> & { label: ReactNode; value: number; unit?: string }) {
  return (
    <label className="fl-rangefield">
      <span className="fl-rangefield__head"><span className="fl-field__label">{label}</span><output>{value}{unit}</output></span>
      <input type="range" value={value} {...rest} />
    </label>
  );
}

/* ── Surfaces and section furniture ─────────────────────── */
export type CardTone = "default" | "sunk" | "accent" | "key";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  flush?: boolean;
  interactive?: boolean;
}

export function Card({ tone = "default", flush, interactive, className, onKeyDown, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cx(
        "fl-card",
        tone !== "default" && `fl-card--${tone}`,
        flush && "fl-card--flush",
        interactive && "fl-card--interactive",
        className,
      )}
      role={interactive && rest.onClick ? "button" : rest.role}
      tabIndex={interactive && rest.onClick ? 0 : rest.tabIndex}
      onKeyDown={(event) => {
        if (interactive && rest.onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          event.currentTarget.click();
        }
        onKeyDown?.(event);
      }}
    />
  );
}

export function Eyebrow({
  children,
  onDark,
  accent,
}: {
  children: ReactNode;
  onDark?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cx("fl-eyebrow", onDark && "fl-eyebrow--onDark", accent && "fl-eyebrow--accent")}
    >
      {children}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="fl-sectionhead">
      <h2 className="fl-sectionhead__title">{title}</h2>
      {action}
    </div>
  );
}

/** Back circle + page title, the standard opening of every inner screen. */
export function PageTitle({ title, onBack }: { title: ReactNode; onBack?: () => void }) {
  return (
    <div className="fl-pagetitle">
      {onBack && (
        <button type="button" className="fl-pagetitle__back" aria-label="Go back" onClick={onBack}>
          ←
        </button>
      )}
      <h1 className="fl-pagetitle__h">{title}</h1>
    </div>
  );
}

/** The quiet top-right screen stamp: "21 DRILLS", "KEY OF C", "NO STREAK YET". */
export function CornerStamp({ children }: { children: ReactNode }) {
  return <div className="fl-corner">{children}</div>;
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="fl-empty">
      <p className="fl-empty__title">{title}</p>
      <p className="fl-empty__body">{body}</p>
      {action}
    </div>
  );
}

export function Stat({
  value,
  label,
  onDark,
}: {
  value: ReactNode;
  label: ReactNode;
  onDark?: boolean;
}) {
  return (
    <div className={cx("fl-stat", onDark && "fl-stat--onDark")}>
      <div className="fl-stat__value">{value}</div>
      <div className="fl-stat__label">{label}</div>
    </div>
  );
}

export { cx };
