"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { STANDARD_TUNING } from "./theory";
import { useStoredTuning } from "./useStoredTuning";

type GuitarSetupValue = {
  tuning: ReturnType<typeof useStoredTuning>[0];
  setTuning: ReturnType<typeof useStoredTuning>[1];
  leftHanded: boolean;
  setLeftHanded: ReturnType<typeof useStoredTuning>[3];
};

const GuitarSetupContext = createContext<GuitarSetupValue | null>(null);

/** One persisted guitar setup shared by every diagram, drill, and tuner. */
export function GuitarSetupProvider({ children }: { children: ReactNode }) {
  const [tuning, setTuning, leftHanded, setLeftHanded] = useStoredTuning();
  return (
    <GuitarSetupContext.Provider
      value={{ tuning, setTuning, leftHanded, setLeftHanded }}
    >
      {children}
    </GuitarSetupContext.Provider>
  );
}

/**
 * The fallback keeps isolated component renders and server tests deterministic.
 * App routes always sit under GuitarSetupProvider.
 */
export function useGuitarSetup(): GuitarSetupValue {
  return (
    useContext(GuitarSetupContext) ?? {
      tuning: STANDARD_TUNING,
      setTuning: () => undefined,
      leftHanded: false,
      setLeftHanded: () => undefined,
    }
  );
}
