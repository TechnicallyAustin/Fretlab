"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 * Single purpose. Props in, events out. Pure presentation. May not import the
 * API client, the auth store, the router, or anything from L1 or L2.
 *
 * Reading the board:
 *   - every note is the key's hue; its *function* is carried by shape
 *   - the fret window is always labelled, so a board starting at fret 7 says so
 *   - when `groups` are given, each layer is visually separate and named
 */
import type { KeyName, Note, Tuning } from "@/lib/fretlab/types";
import type { FingeredNote } from "@/lib/fretlab/fingering";
import { degreeLabels, openPc, spellPitchClass } from "@/lib/fretlab/theory";
import { palette } from "@/lib/fretlab/palette";
import {
  ROLE_STYLE,
  degreeAt,
  roleColor,
  roleForDegree,
  type NoteGroup,
  type NoteRole,
} from "@/lib/fretlab/noteRoles";
import { FretboardLegend } from "./FretboardLegend";
import { useGuitarSetup } from "@/lib/fretlab/GuitarSetup";
import {
  boardGeometry,
  fretsThatFit,
  scrollTargetFor,
  windowFor,
} from "@/lib/fretlab/boardGeometry";
import { useEffect, useId, useRef, useState } from "react";


/** Frets that carry an inlay dot on a real guitar neck. */
const SINGLE_INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
const DOUBLE_INLAYS = new Set([12, 24]);

export function Fretboard({
  notes,
  groups,
  low,
  high,
  mini = false,
  interactive = false,
  found = new Set<string>(),
  onCell,
  labelMode = "note",
  rootKey = "G",
  caption,
  legend = false,
  muted,
  scale,
  hideTargets = false,
  tuning,
  leftHanded,
}: {
  notes?: (Note | FingeredNote)[];
  /** Named layers, for showing a chord inside a scale without them merging. */
  groups?: NoteGroup[];
  low: number;
  high: number;
  mini?: boolean;
  interactive?: boolean;
  found?: Set<string>;
  onCell?: (s: number, f: number) => void;
  labelMode?: "note" | "degree" | "finger" | "order";
  rootKey?: KeyName;
  /** A short line above the board saying what it is showing. */
  caption?: string;
  /** Draw the shape key underneath. On by default for boards that teach. */
  legend?: boolean;
  /** Strings that must not sound. Drawn as x above the nut. */
  muted?: readonly number[];
  /** The scale on show, so degree labels use its own spelling (Lydian's ♯4). */
  scale?: { formula: string; intervals: readonly number[] };
  /**
   * Draw nothing where an unfound target is. A drill that marks every answer
   * and asks you to tap them tests nothing; recall starts from a blank neck.
   */
  hideTargets?: boolean;
  tuning?: Tuning;
  leftHanded?: boolean;
}) {
  const setup = useGuitarSetup();
  const activeTuning: Tuning = tuning ?? setup.tuning;
  const isLeftHanded = leftHanded ?? setup.leftHanded;
  const gradientId = `board-${useId().replaceAll(":", "")}`;
  const cellRefs = useRef<Record<string, SVGGElement | null>>({});
  const degreeName = degreeLabels(scale);

  // Layers collapse into one lookup: the first group that claims a cell owns it.
  const layers: NoteGroup[] =
    groups && groups.length
      ? groups
      : [{ id: "notes", label: "", notes: notes ?? [], emphasis: "primary" }];

  const cellGroup = new Map<
    string,
    { group: NoteGroup; index: number; finger?: number; order?: number }
  >();
  layers.forEach((group, index) => {
    for (const note of group.notes) {
      const id = `${note.s}:${note.f}`;
      if (!cellGroup.has(id)) {
        cellGroup.set(id, {
          group,
          index,
          finger: (note as FingeredNote).finger,
          order: (note as { order?: number }).order,
        });
      }
    }
  });

  // Mini boards used to hide fret numbers and string names entirely, which is
  // why a window starting at fret 7 read as nonsense. They are smaller now, not
  // absent.
  // Chord boards carry a marker row above the nut. It only means anything when
  // the nut is in frame: further up the neck there is no open string to mark.
  const showsMarkers = (muted?.length ?? 0) > 0 || Boolean(notes?.some((n) => n.f === 0));

  // How wide the board's column actually is. Null until measured, and the
  // server never measures, so the first paint is the whole board and a narrow
  // client then windows it.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [columnWidth, setColumnWidth] = useState<number | null>(null);
  useEffect(() => {
    const host = scrollRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    // setState in the observer's callback, not in the effect body — the lint
    // forbids the second and this is the pattern it points at instead.
    const observer = new ResizeObserver(([entry]) => {
      setColumnWidth(entry.contentRect.width);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Thirteen frets at legible size need 860 units and a phone column has 354,
  // so on a narrow screen the board shows one slice of neck rather than a
  // squinting view of all of it. Four frets is a hand span and a CAGED
  // position, which is the unit the neck is actually learned in.
  const noteFrets = (notes ?? []).map((note) => note.f)
    .concat((groups ?? []).flatMap((group) => group.notes.map((note) => note.f)));
  const fits = columnWidth === null
    ? high - low + 1
    : fretsThatFit(columnWidth, { mini });
  const [shift, setShift] = useState(0);
  const windowed = windowFor(low, high, noteFrets, fits);
  const canShift = windowed.high - windowed.low < high - low;
  const viewLow = canShift
    ? Math.max(low, Math.min(windowed.low + shift, high - (windowed.high - windowed.low)))
    : windowed.low;
  const viewHigh = viewLow + (windowed.high - windowed.low);

  // The sizing arithmetic lives in lib/ so a test can reach it: every type size
  // below is clamped to 13, but those are viewBox units, and the board used to
  // be allowed to scale down until a "13px" label drew at 8 screen pixels.
  const geo = boardGeometry({ low: viewLow, high: viewHigh, mini, showsMarkers });
  const { unit, gap, openWidth, nameGutter } = geo;

  const fretsAscending = Array.from({ length: viewHigh - viewLow + 1 }, (_, index) => viewLow + index);
  let cursor = nameGutter;
  const naturalColumns = fretsAscending.map((fret) => {
    const width = fret === 0 ? openWidth : unit;
    const column = { fret, x: cursor, width, center: cursor + width / 2 };
    cursor += width;
    return column;
  });

  const width = geo.width;
  const columns = isLeftHanded
    ? [...naturalColumns].reverse().map((column) => ({
        ...column,
        x: width - column.x - column.width,
        center: width - column.center,
      }))
    : naturalColumns;
  const frets = columns.map((column) => column.fret);
  const { markerRow, top } = geo;
  const includesOpen = viewLow === 0;
  const playingWidth = width - nameGutter - (includesOpen ? openWidth : 0);
  const boardX = isLeftHanded ? 0 : nameGutter + (includesOpen ? openWidth : 0);
  const boardEnd = boardX + playingWidth;
  const { boardHeight, numberRow, height } = geo;

  const yFor = (string: number) =>
    isLeftHanded
      ? top + (6 - string + 0.5) * gap
      : top + (string - 0.5) * gap;
  const { dotRadius } = geo;
  const showsNut = viewLow <= 1;
  const strings = isLeftHanded ? [6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6];
  const firstCell = `${strings[0]}:${frets[0]}`;
  const [activeCell, setActiveCell] = useState(firstCell);

  const { fretNumberSize, stringNameSize, labelSize } = geo;
  const stringName = (string: number) => spellPitchClass(openPc(activeTuning, string), rootKey);

  // Points for the play-order path, in board coordinates.
  const orderedPath = (() => {
    if (labelMode !== "order") return [] as { x: number; y: number }[];
    const byColumn = new Map(columns.map((column) => [column.fret, column.center]));
    return [...cellGroup.entries()]
      .filter(([, entry]) => entry.order !== undefined)
      .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
      .map(([id]) => {
        const [stringText, fretText] = id.split(":");
        return {
          x: byColumn.get(Number(fretText)) ?? 0,
          y: yFor(Number(stringText)),
        };
      });
  })();

  // Labels describe what is *on screen*, not what was asked for. A windowed
  // board showing frets 7-11 must not caption itself "full neck".
  const windowLabel =
    viewLow === 0 && viewHigh >= 12
      ? "full neck"
      : viewLow === 0
        ? "open position"
        : `frets ${viewLow} to ${viewHigh}`;
  const positionLabel =
    viewLow === 0 && viewHigh >= 12
      ? "Full neck"
      : viewLow === 0
        ? "Open position"
        : `Starts at fret ${viewLow}`;

  // A board too wide for its column opens at the nut, which for a drill at
  // frets 7-10 is an empty stretch with the shape off the right-hand edge. It
  // opens on the notes instead. Runs after layout, because it needs the real
  // column width, and does nothing when the board fits.
  // Dependencies are primitives on purpose. `geo` is a fresh object every
  // render, so depending on it would re-run this after any state change — and
  // this writes scrollLeft, so it would snap the board back while the reader
  // was dragging it.
  const fretKey = layers
    .flatMap((layer) => layer.notes)
    .map((note) => note.f)
    .join(",");
  const { width: boardWidth, unit: fretUnit, nameGutter: gutter } = geo;
  useEffect(() => {
    const host = scrollRef.current;
    if (!host || !fretKey) return;
    host.scrollLeft = scrollTargetFor(
      fretKey.split(",").map(Number),
      { width: boardWidth, unit: fretUnit, nameGutter: gutter },
      host.clientWidth,
    );
  }, [fretKey, boardWidth, fretUnit, gutter]);

  return (
    <figure className={`fretboard-figure ${mini ? "mini" : ""}`}>
      {(caption || !mini) && (
        <figcaption className="fretboard-caption">
          {caption && <strong>{caption}</strong>}
          <span className="fret-window">
            {positionLabel}
            <small>
              {low === high ? `fret ${low}` : `frets ${low}\u2013${high}`}
            </small>
          </span>
        </figcaption>
      )}
      {canShift && !mini && (
        <div className="neck-pager" role="group" aria-label="Move along the neck">
          <button
            onClick={() => setShift((n) => n - (viewHigh - viewLow))}
            disabled={viewLow <= low}
            aria-label="Towards the nut"
          >
            ←
          </button>
          {/* Named, not numbered. The neck has regions and moving between them
              is the thing being taught; a bare pager would only move it. */}
          <span>
            {viewLow === 0 ? "Open position" : `Frets ${viewLow}\u2013${viewHigh}`}
            <small>of {low}\u2013{high}</small>
          </span>
          <button
            onClick={() => setShift((n) => n + (viewHigh - viewLow))}
            disabled={viewHigh >= high}
            aria-label="Towards the body"
          >
            →
          </button>
        </div>
      )}
      <div
        ref={scrollRef}
        className={`fretboard ${mini ? "mini" : ""}`}
        // A 13-fret board squeezed into a phone width leaves each fret ~25px,
        // too narrow for a legible label. Below the board's comfortable width
        // it scrolls sideways instead of shrinking.
        style={{
          // The board's own width, so it is never scaled *down*. Below this the
          // type shrinks with it: a 13-unit label rendered at 0.73 is 8 pixels,
          // which is what "too small to see" was.
          ["--board-min" as string]: `${width}px`,
          // Scaling up is bounded by height, not width. The viewBox is fixed and
          // preserveAspectRatio is xMidYMid meet, so a wider board scales frets,
          // dots and labels together — nothing is pulled apart, it just gets
          // tall. This is the constraint that actually exists.
          ["--board-aspect" as string]: `${geo.aspect.toFixed(3)}`,
        }}
        role={interactive ? "grid" : "img"}
        aria-label={
          `Guitar fretboard, ${windowLabel}. ` +
          (muted?.length
            ? `Do not play the ${muted.map((s2) => stringName(s2)).join(" and ")} string${muted.length > 1 ? "s" : ""}. `
            : "") +
          layers
            .filter((layer) => layer.label)
            .map((layer) => `${layer.label}: ${layer.notes.length} notes`)
            .join(". ")
        }
      >
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--board-top)" />
              <stop offset=".45" stopColor="var(--board-middle)" />
              <stop offset="1" stopColor="var(--board-bottom)" />
            </linearGradient>
          </defs>

          <rect
            x={boardX}
            y={top - gap * 0.15}
            width={playingWidth}
            height={boardHeight + gap * 0.3 + numberRow}
            rx="6"
            fill={`url(#${gradientId})`}
            stroke="var(--board-border)"
            strokeWidth=".8"
          />
          {/* Separates the fret-number row from the playing surface. */}
          <line
            x1={boardX}
            y1={top + boardHeight + gap * 0.15}
            x2={boardEnd}
            y2={top + boardHeight + gap * 0.15}
            stroke="var(--board-border)"
            strokeWidth=".8"
          />

          {/* Fret wires. The nut is drawn heavy only when the window includes it. */}
          {columns.map((column) =>
            column.fret === 0 ? null : (
              <line
                key={`fret-${column.fret}`}
                x1={isLeftHanded ? column.x + column.width : column.x}
                y1={top - gap * 0.12}
                x2={isLeftHanded ? column.x + column.width : column.x}
                y2={top + boardHeight + gap * 0.12}
                stroke={column.fret === 1 && showsNut ? "var(--board-nut)" : "var(--board-fret)"}
                strokeWidth={column.fret === 1 && showsNut ? 4 : 1.25}
              />
            ),
          )}
          <line
            x1={isLeftHanded ? boardX : boardEnd}
            y1={top - gap * 0.12}
            x2={isLeftHanded ? boardX : boardEnd}
            y2={top + boardHeight + gap * 0.12}
            stroke="var(--board-fret)"
            strokeWidth="1.25"
          />

          {/* Inlays, at their real positions rather than always 3/5/7/9. */}
          {columns
            .filter((column) => SINGLE_INLAYS.has(column.fret))
            .map((column) => (
              <circle
                key={`inlay-${column.fret}`}
                cx={column.center}
                cy={top + boardHeight / 2}
                r={mini ? 3 : 4.6}
                fill="var(--board-inlay)"
                opacity=".42"
              />
            ))}
          {columns
            .filter((column) => DOUBLE_INLAYS.has(column.fret))
            .flatMap((column) =>
              [2, 5].map((string) => (
                <circle
                key={`inlay-${column.fret}-${string}`}
                cx={column.center}
                cy={yFor(string)}
                r={mini ? 2.8 : 4.2}
                fill="var(--board-inlay)"
                opacity=".42"
                />
              )),
            )}

          {/* Muted and open strings, the way a printed chord box marks them.
            Without this an untouched string reads as "don't care" rather than
            "do not play", which is the difference between C major and a muddy
            inversion. */}
          {markerRow > 0 &&
            [1, 2, 3, 4, 5, 6].map((string) => {
              const isMuted = muted?.includes(string);
              const isOpen = !isMuted && layers.some((layer) =>
                layer.notes.some((note) => note.s === string && note.f === 0),
              );
              if (!isMuted && !isOpen) return null;
              return (
                <text
                  key={`mark-${string}`}
                  x={isLeftHanded ? boardEnd + markerRow * 0.55 : boardX - markerRow * 0.55}
                  y={yFor(string) + stringNameSize * 0.35}
                  textAnchor="middle"
                  fill={isMuted ? "var(--board-muted-mark)" : "var(--board-open-mark)"}
                  fontSize={stringNameSize}
                  fontWeight="700"
                >
                  {isMuted ? "\u00d7" : "\u25cb"}
                </text>
              );
            })}

          {/* Strings: thicker and duller as they get lower. */}
          {[1, 2, 3, 4, 5, 6].map((string) => (
            <g key={`string-${string}`}>
              <line
                x1={boardX}
                y1={yFor(string) + 0.8}
                x2={boardEnd}
                y2={yFor(string) + 0.8}
                stroke="var(--board-string-shadow)"
                strokeWidth={0.7 + string * 0.14}
                opacity=".72"
              />
              <line
                x1={boardX}
                y1={yFor(string)}
                x2={boardEnd}
                y2={yFor(string)}
                stroke={string > 3 ? "var(--board-wound-string)" : "var(--board-plain-string)"}
                strokeWidth={0.55 + string * 0.13}
                opacity=".9"
              />
            </g>
          ))}

          {/* String names, now on every board including mini. */}
          {[1, 2, 3, 4, 5, 6].map((string) => (
            <text
              key={`name-${string}`}
              x={isLeftHanded ? width - nameGutter * 0.5 : nameGutter * 0.5}
              y={yFor(string) + stringNameSize * 0.35}
              textAnchor="middle"
              fill="var(--board-label-text)"
              fontSize={stringNameSize}
              fontWeight="600"
            >
              {stringName(string)}
            </text>
          ))}

          {/* The route through the shape, drawn under the notes so the numbers
            stay legible on top of it. */}
        {labelMode === "order" && orderedPath.length > 1 && (
          <polyline
            points={orderedPath.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="var(--board-path)"
            strokeWidth={mini ? 1.6 : 2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".38"
            strokeDasharray={mini ? "4 4" : "6 5"}
          />
        )}

        {strings.map((string, rowIndex) => (
          <g key={`row-${string}`} role={interactive ? "row" : undefined}>
            {columns.map((column, columnIndex) => {
              const id = `${string}:${column.fret}`;
              const entry = cellGroup.get(id);
              const hasNote = Boolean(entry);
              const isFound = !interactive || found.has(id);

              const pc = (openPc(activeTuning, string) + column.fret) % 12;
              const degree = degreeAt(string, column.fret, rootKey, activeTuning);
              const role: NoteRole = roleForDegree(degree);
              const style = ROLE_STYLE[role];
              const label =
              labelMode === "order"
                ? entry?.order !== undefined
                  ? String(entry.order)
                  : ""
                : labelMode === "finger"
                ? entry?.finger === 0
                  ? "O"
                  : entry?.finger !== undefined
                    ? String(entry.finger)
                    : ""
                : labelMode === "degree"
                  ? degreeName[degree]
                  : spellPitchClass(pc, rootKey);

              // A secondary layer reads as context behind the primary one.
              const secondary = entry?.group.emphasis === "secondary";
              const fill = roleColor(role, rootKey, secondary);
              const solid = style.filled && !secondary;

              return (
                <g
                key={id}
                ref={interactive ? (element) => { cellRefs.current[id] = element; } : undefined}
                onFocus={interactive ? () => setActiveCell(id) : undefined}
                onClick={interactive ? () => onCell?.(string, column.fret) : undefined}
                className={interactive ? "fret-hit" : undefined}
                role={interactive ? "gridcell" : undefined}
                tabIndex={interactive && activeCell === id ? 0 : interactive ? -1 : undefined}
                aria-rowindex={interactive ? rowIndex + 1 : undefined}
                aria-colindex={interactive ? columnIndex + 1 : undefined}
                aria-label={
                  interactive
                    ? `${stringName(string)} string, fret ${column.fret}${
                        hasNote && (isFound || !hideTargets)
                          ? `, ${label}, ${style.legend}`
                          : ""
                      }`
                    : undefined
                }
                onKeyDown={
                  interactive
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onCell?.(string, column.fret);
                          return;
                        }
                        const rowDelta = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
                        const columnDelta = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
                        if (!rowDelta && !columnDelta) return;
                        event.preventDefault();
                        const nextRow = Math.max(0, Math.min(strings.length - 1, rowIndex + rowDelta));
                        const nextColumn = Math.max(0, Math.min(columns.length - 1, columnIndex + columnDelta));
                        const nextId = `${strings[nextRow]}:${columns[nextColumn].fret}`;
                        setActiveCell(nextId);
                        cellRefs.current[nextId]?.focus();
                      }
                    : undefined
                }
                >
                {interactive && (
                  <rect
                    x={column.x}
                    y={yFor(string) - gap / 2}
                    width={column.width}
                    height={gap}
                    fill="transparent"
                  />
                )}

                {hasNote && !isFound && !hideTargets && (
                  <circle
                    cx={column.center}
                    cy={yFor(string)}
                    r={dotRadius}
                    fill="var(--board-empty-note)"
                    stroke={palette(rootKey).edge}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                {hasNote && isFound && style.shape === "square" && (
                  <rect
                    x={column.center - dotRadius}
                    y={yFor(string) - dotRadius}
                    width={dotRadius * 2}
                    height={dotRadius * 2}
                    rx={dotRadius * 0.34}
                    fill={solid ? fill : "var(--board-note-backdrop)"}
                    stroke={solid ? "var(--board-note-outline)" : fill}
                    strokeWidth={solid ? 1.8 : 1.6}
                  />
                )}

                {hasNote && isFound && style.shape === "circle" && (
                  <circle
                    cx={column.center}
                    cy={yFor(string)}
                    r={dotRadius}
                    fill={solid ? fill : "var(--board-note-backdrop)"}
                    stroke={solid ? "var(--board-note-soft-outline)" : fill}
                    strokeWidth={solid ? 1 : 1.6}
                  />
                )}

                {hasNote && isFound && style.shape === "donut" && (
                  <>
                    <circle
                      cx={column.center}
                      cy={yFor(string)}
                      r={dotRadius}
                      fill={solid ? fill : "var(--board-note-backdrop)"}
                      stroke={solid ? "var(--board-note-soft-outline)" : fill}
                      strokeWidth={solid ? 1 : 1.6}
                    />
                    <circle
                      cx={column.center}
                      cy={yFor(string)}
                      r={dotRadius * 0.46}
                      fill="none"
                      stroke={solid ? "var(--board-note-inner)" : fill}
                      strokeWidth="1.6"
                    />
                  </>
                )}

                {hasNote && (
                  <text
                    x={column.center}
                    y={yFor(string) + labelSize * 0.35}
                    textAnchor="middle"
                    fill={isFound && solid ? "var(--board-note-ink-dark)" : "var(--board-note-ink-light)"}
                    fontSize={labelSize}
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    {isFound ? label : ""}
                  </text>
                )}
                </g>
              );
            })}
          </g>
        ))}

          {/* Fret numbers on every board, so the window is never a mystery. */}
          {columns.map((column) => (
            <text
              key={`number-${column.fret}`}
              x={column.center}
              y={top + boardHeight + numberRow * 0.86}
              textAnchor="middle"
              fill={
              SINGLE_INLAYS.has(column.fret) || DOUBLE_INLAYS.has(column.fret)
                ? "var(--board-number-emphasis)"
                : "var(--board-number)"
            }
              fontSize={fretNumberSize}
              fontWeight={SINGLE_INLAYS.has(column.fret) || DOUBLE_INLAYS.has(column.fret) ? "700" : "500"}
            >
              {column.fret === 0 ? "0" : column.fret}
            </text>
          ))}
        </svg>
      </div>
      {legend && <FretboardLegend rootKey={rootKey} groups={groups} />}
    </figure>
  );
}
