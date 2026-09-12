"use client";

/**
 * App Template Contract v1 §5 — L3 element.
 *
 * Explains the board's two axes: what a note's *shape* means (its job in the
 * key) and, when a board shows more than one layer, what each layer is.
 *
 * Shapes are drawn rather than described, so the legend and the board cannot
 * drift apart.
 */
import type { KeyName } from "@/lib/fretlab/types";
import { LEGEND_ROLES, ROLE_STYLE, roleColor, type NoteGroup } from "@/lib/fretlab/noteRoles";

export function FretboardLegend({
  rootKey,
  groups,
}: {
  rootKey: KeyName;
  groups?: NoteGroup[];
}) {
  return (
    <div className="fret-legend">
      <ul className="fret-legend-roles">
        {LEGEND_ROLES.map((role) => {
          const style = ROLE_STYLE[role];
          const color = roleColor(role, rootKey);
          return (
            <li key={role}>
              <svg viewBox="0 0 22 22" aria-hidden="true">
                <rect x="0" y="0" width="22" height="22" rx="6" fill="#20222d" />
                {style.shape === "square" ? (
                  <rect
                    x="5"
                    y="5"
                    width="12"
                    height="12"
                    rx="4"
                    fill={color}
                    stroke="#fffdf8"
                    strokeWidth="1.6"
                  />
                ) : (
                  <>
                    <circle
                      cx="11"
                      cy="11"
                      r="6"
                      fill={style.filled ? color : "#1b1d27"}
                      stroke={style.filled ? "rgba(255,255,255,.55)" : color}
                      strokeWidth={style.filled ? 1 : 1.8}
                    />
                    {style.shape === "donut" && (
                      <circle cx="11" cy="11" r="2.7" fill="none" stroke="rgba(20,20,25,.6)" strokeWidth="1.6" />
                    )}
                  </>
                )}
              </svg>
              <span>{style.legend}</span>
            </li>
          );
        })}
      </ul>

      {groups && groups.length > 1 && (
        <ul className="fret-legend-groups">
          {groups.map((group) => (
            <li key={group.id} data-emphasis={group.emphasis ?? "primary"}>
              <i aria-hidden="true" />
              <span>{group.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
