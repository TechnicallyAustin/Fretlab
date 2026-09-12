"use client";

/**
 * App Template Contract v1 §5 — route binding.
 *
 * Thin by design: it resolves URL state and hands the L1 screen the props it
 * already took, so screens stay independent of the router.
 */
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { Today } from "@/app/_screens/Today";
import { Onboarding } from "@/app/_screens/Onboarding";
import { useOnboarding } from "@/lib/fretlab/useOnboarding";
import { useStoredTuning } from "@/lib/fretlab/useStoredTuning";

export default function Page() {
  const nav = useFretLabNav();
  const [selectedKey, setSelectedKey] = useStoredKey();
  const [complete, finish] = useOnboarding();
  const [, , , setLeftHanded] = useStoredTuning();
  if (!complete) return <Onboarding go={nav.go} setSelectedKey={setSelectedKey} setLeftHanded={setLeftHanded} finish={finish} />;
  return <Today go={nav.go} sessionKey={selectedKey} />;
}
