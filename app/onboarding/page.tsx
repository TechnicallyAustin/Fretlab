"use client";

/** App Template Contract v1 §5 — route binding. */
import { useStoredKey } from "@/lib/fretlab/useStoredKey";
import { useStoredTuning } from "@/lib/fretlab/useStoredTuning";
import { useOnboarding } from "@/lib/fretlab/useOnboarding";
import { useFretLabNav } from "@/app/_screens/useFretLabNav";
import { Onboarding } from "@/app/_screens/Onboarding";

export default function Page() {
  const { go } = useFretLabNav();
  const [, setSelectedKey] = useStoredKey();
  const [, , , setLeftHanded] = useStoredTuning();
  const [, finish] = useOnboarding();
  return <Onboarding go={go} setSelectedKey={setSelectedKey} setLeftHanded={setLeftHanded} finish={finish} />;
}
