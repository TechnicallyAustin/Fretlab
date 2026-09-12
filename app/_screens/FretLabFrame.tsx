"use client";

/**
 * App Template Contract v1 §5 — L1.
 *
 * The FretLab frame: the phone shell, the global key, and the navigation that
 * wraps every route. It owns the URL-derived view and hands screens the `go`
 * callback they take as a prop.
 */
import { useState, type ReactNode } from "react";
import { cssVars } from "@/lib/fretlab/palette";
import { primaryViewFor } from "@/lib/fretlab/routes";
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { BottomNav } from "@/components/fretlab/BottomNav";
import { DesktopTopbar } from "@/components/fretlab/DesktopTopbar";
import { KeySelectorModal } from "@/app/_sections/KeySelectorModal";
import { useFretLabNav } from "./useFretLabNav";
import { useStoredTheme } from "@/lib/fretlab/useStoredTheme";

export function FretLabFrame({ children }: { children: ReactNode }) {
  const { view, go } = useFretLabNav();
  const [selectedKey, setSelectedKey] = useStoredKey();
  const [keyPickerOpen, setKeyPickerOpen] = useState(false);
  const [standMode, setStandMode] = useState(false);
  const [themeMode, setThemeMode] = useStoredTheme();

  return (
    <main className={`site-shell theme-${themeMode}`} style={cssVars(selectedKey)}>
      <div className="design-caption" aria-hidden="true">
        <span>FretLab</span>
        <strong>Guitar practice</strong>
        <small>One key-colour system across every practice surface.</small>
      </div>
      <div className={`app-frame view-${view}${standMode ? " stand-mode" : ""}`}>
        <button
          className="stand-mode-toggle"
          type="button"
          aria-pressed={standMode}
          onClick={() => setStandMode((enabled) => !enabled)}
        >
          {standMode ? "Stand mode on" : "Stand mode"}
        </button>
        <DesktopTopbar
          view={view}
          selectedKey={selectedKey}
          go={go}
          openKeyPicker={() => setKeyPickerOpen(true)}
        />
        <button className="mobile-key-context" onClick={() => setKeyPickerOpen(true)}>
          <span>Global key</span>
          <strong>{selectedKey}</strong>
          <b>⌄</b>
        </button>
        {children}
        <BottomNav active={primaryViewFor(view)} go={go} themeMode={themeMode} onToggleTheme={() => setThemeMode(themeMode === "dark" ? "light" : "dark")} />
        {keyPickerOpen && (
          <KeySelectorModal
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            onClose={() => setKeyPickerOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
