"use client";

/**
 * App Template Contract v1 §5 — route binding.
 *
 * Thin by design: it resolves URL state and hands the L1 screen the props it
 * already took, so screens stay independent of the router.
 */
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { Train } from "@/app/_screens/Train";
import { useStoredTuning } from "@/lib/fretlab/useStoredTuning";

export default function Page() {
  const [selectedKey, setSelectedKey] = useStoredKey();
  const [tuning, setTuning, leftHanded, setLeftHanded] = useStoredTuning();
  return <Train selectedKey={selectedKey} setSelectedKey={setSelectedKey} tuning={tuning} setTuning={setTuning} leftHanded={leftHanded} setLeftHanded={setLeftHanded} />;
}
