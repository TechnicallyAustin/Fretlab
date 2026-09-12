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
import type { KeyName, Note } from "@/lib/fretlab/types";
import type { FingeredNote } from "@/lib/fretlab/fingering";
import {
  OPEN_PC,
  STRING_NAMES,
  degreeLabels,
  spellPitchClass,
} from "@/lib/fretlab/theory";
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
import { useId, useRef, useState } from "react";


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
}) {
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
  const unit = mini ? 30 : 54;
  const gap = mini ? 17 : 32;
  const openWidth = Math.round(unit * 0.62);
  const nameGutter = Math.round(gap * 0.95);

  const frets = Array.from({ length: high - low + 1 }, (_, index) => low + index);
  let cursor = nameGutter;
  const columns = frets.map((fret) => {
    const width = fret === 0 ? openWidth : unit;
    const column = { fret, x: cursor, width, center: cursor + width / 2 };
    cursor += width;
    return column;
  });

  const width = cursor;
  const markerRow = showsMarkers && low <= 1 ? Math.round(gap * (mini ? 0.6 : 0.68)) : 0;
  const top = (mini ? 14 : 20) + markerRow;
  const boardX = low === 0 ? nameGutter + openWidth : nameGutter;
  const boardHeight = 6 * gap;
  const numberRow = Math.round(gap * 0.82);
  const height = top + boardHeight + numberRow + (mini ? 6 : 10);

  const yFor = (string: number) => top + (string - 0.5) * gap;
  const dotRadius = Math.round(gap * 0.37);
  const showsNut = low <= 1;
  const strings = [6, 5, 4, 3, 2, 1];
  const firstCell = `${strings[0]}:${frets[0]}`;
  const [activeCell, setActiveCell] = useState(firstCell);

  const fretNumberSize = Math.max(mini ? 11 : 13, Math.round(gap * 0.44));
  const stringNameSize = Math.max(mini ? 11 : 13, Math.round(gap * 0.42));
  const labelSize = Math.max(mini ? 10 : 12, Math.round(dotRadius * 0.95));

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
          y: top + (Number(stringText) - 0.5) * gap,
        };
      });
  })();

  const windowLabel =
    low === 0 ? "open position" : `position ${low}`;

  return (
    <figure className={`fretboard-figure ${mini ? "mini" : ""}`}>
      {(caption || !mini) && (
        <figcaption className="fretboard-caption">
          {caption && <strong>{caption}</strong>}
          <span className="fret-window">
            {low === 0 ? "Open position" : `Position ${low}`}
            <small>
              {low === 0 ? "nut to fret " + high : `frets ${low}\u2013${high}`}
            </small>
          </span>
        </figcaption>
      )}
      <div
        className={`fretboard ${mini ? "mini" : ""}`}
        // A 13-fret board squeezed into a phone width leaves each fret ~25px,
        // too narrow for a legible label. Below the board's comfortable width
        // it scrolls sideways instead of shrinking.
        style={{
          ["--board-min" as string]: `${Math.round(columns.length * (mini ? 30 : 40))}px`,
          // A four-fret box must not stretch across a wide card: that pulls the
          // frets apart until the shape stops looking like the shape.
          ["--board-natural" as string]: `${Math.round(width * (mini ? 1.5 : 1.25))}px`,
        }}
        role={interactive ? "grid" : "img"}
        aria-label={
        `Guitar fretboard, ${windowLabel}, frets ${low} to ${high}. ` +
        (muted?.length
          ? `Do not play the ${muted.map((s2) => STRING_NAMES[s2]).join(" and ")} string${muted.length > 1 ? "s" : ""}. `
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
              <stop offset="0" stopColor="#303340" />
              <stop offset=".45" stopColor="#20222d" />
              <stop offset="1" stopColor="#171923" />
            </linearGradient>
          </defs>

          <rect
            x={boardX}
            y={top - gap * 0.15}
            width={width - boardX}
            height={boardHeight + gap * 0.3 + numberRow}
            rx="6"
            fill={`url(#${gradientId})`}
            stroke="#3c3f4b"
            strokeWidth=".8"
          />
          {/* Separates the fret-number row from the playing surface. */}
          <line
            x1={boardX}
            y1={top + boardHeight + gap * 0.15}
            x2={width}
            y2={top + boardHeight + gap * 0.15}
            stroke="#3c3f4b"
            strokeWidth=".8"
          />

          {/* Fret wires. The nut is drawn heavy only when the window includes it. */}
          {columns.map((column) =>
            column.fret === 0 ? null : (
              <line
                key={`fret-${column.fret}`}
                x1={column.x}
                y1={top - gap * 0.12}
                x2={column.x}
                y2={top + boardHeight + gap * 0.12}
                stroke={column.fret === 1 && showsNut ? "#e8e3d8" : "#777b86"}
                strokeWidth={column.fret === 1 && showsNut ? 4 : 1.25}
              />
            ),
          )}
          <line
            x1={width}
            y1={top - gap * 0.12}
            x2={width}
            y2={top + boardHeight + gap * 0.12}
            stroke="#777b86"
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
                fill="#c9c4b9"
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
                fill="#c9c4b9"
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
                  x={boardX - markerRow * 0.55}
                  y={yFor(string) + stringNameSize * 0.35}
                  textAnchor="middle"
                  fill={isMuted ? "#c98b84" : "#cfd3df"}
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
                x2={width}
                y2={yFor(string) + 0.8}
                stroke="#090a0f"
                strokeWidth={0.7 + string * 0.14}
                opacity=".72"
              />
              <line
                x1={boardX}
                y1={yFor(string)}
                x2={width}
                y2={yFor(string)}
                stroke={string > 3 ? "#b7afa0" : "#d9d3c8"}
                strokeWidth={0.55 + string * 0.13}
                opacity=".9"
              />
            </g>
          ))}

          {/* String names, now on every board including mini. */}
          {[1, 2, 3, 4, 5, 6].map((string) => (
            <text
              key={`name-${string}`}
              x={nameGutter * 0.5}
              y={yFor(string) + stringNameSize * 0.35}
              textAnchor="middle"
              fill="#b9bdcc"
              fontSize={stringNameSize}
              fontWeight="600"
            >
              {STRING_NAMES[string]}
            </text>
          ))}

          {/* The route through the shape, drawn under the notes so the numbers
            stay legible on top of it. */}
        {labelMode === "order" && orderedPath.length > 1 && (
          <polyline
            points={orderedPath.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#f3f0ea"
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

              const pc = (OPEN_PC[string] + column.fret) % 12;
              const degree = degreeAt(string, column.fret, rootKey);
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
                    ? `${STRING_NAMES[string]} string, fret ${column.fret}${
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
                    fill="#232532"
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
                    fill={solid ? fill : "#1b1d27"}
                    stroke={solid ? "#fffdf8" : fill}
                    strokeWidth={solid ? 1.8 : 1.6}
                  />
                )}

                {hasNote && isFound && style.shape === "circle" && (
                  <circle
                    cx={column.center}
                    cy={yFor(string)}
                    r={dotRadius}
                    fill={solid ? fill : "#1b1d27"}
                    stroke={solid ? "rgba(255,255,255,.55)" : fill}
                    strokeWidth={solid ? 1 : 1.6}
                  />
                )}

                {hasNote && isFound && style.shape === "donut" && (
                  <>
                    <circle
                      cx={column.center}
                      cy={yFor(string)}
                      r={dotRadius}
                      fill={solid ? fill : "#1b1d27"}
                      stroke={solid ? "rgba(255,255,255,.55)" : fill}
                      strokeWidth={solid ? 1 : 1.6}
                    />
                    <circle
                      cx={column.center}
                      cy={yFor(string)}
                      r={dotRadius * 0.46}
                      fill="none"
                      stroke={solid ? "rgba(20,20,25,.55)" : fill}
                      strokeWidth="1.6"
                    />
                  </>
                )}

                {hasNote && (
                  <text
                    x={column.center}
                    y={yFor(string) + labelSize * 0.35}
                    textAnchor="middle"
                    fill={isFound && solid ? "#14151c" : "#f3f0ea"}
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
                ? "#f2efe6"
                : "#aeb3c4"
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
